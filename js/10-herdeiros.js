// ====================================
// HERDEIROS
// ====================================

function calcularTotaisParaHerdeiros(dados, valortotatt, percentualprinc, percentualjur,totaisPorTipo = null) {
    const dadosOrdem = { ...dados, tipoCalculo: 'ordem' };
    return calcularGlobal(dadosOrdem, valortotatt, percentualprinc, percentualjur,totaisPorTipo);
}

function calcularHerdeiros(dados, valortotatt, valorprincatt, valorjurosatt, detalhamento, totaisPorTipo = null) {
    if (!dados.herdeiros?.length) return [];
    
    const percentualprinc = valorprincatt / valortotatt;
    const percentualjur = valorjurosatt / valortotatt;
    const detalhamentoTotal = calcularTotaisParaHerdeiros(dados, valortotatt, percentualprinc, percentualjur, totaisPorTipo);
    
    const contexto = {
        percentualprinc,
        percentualjur,
        percentualBeneficiarioFinal: detalhamentoTotal.percentualBeneficiarioFinal,
        valorDisponivelParaHerdeiros: valortotatt * detalhamentoTotal.percentualBeneficiarioFinal,
        isPreferencia: dados.tipoCalculo === 'preferencia',
        isParcial: dados.tipoCalculo === 'parcial',
        temTributacaoIR: dados.valoresPrincipais?.some(item => item.tributacao?.ir) || false,
        rraTotal: dados.valoresPrincipais?.reduce((sum, item) => sum + (item.tributacao?.rra || 0), 0) || 0
    };
    
    return dados.herdeiros.map((herdeiro, index) => {
        const percentualHerdeiro = herdeiro.percentual;
        const valorTotalHerdeiro = valortotatt * percentualHerdeiro;
        
        // Cessões do beneficiário principal
        const valorHerdeiroPoscessaoBeneficiario = contexto.valorDisponivelParaHerdeiros * percentualHerdeiro;
        
        // Cessões do próprio herdeiro
        const cessoesHerdeiro = dados.cessoes?.filter(c => 
            c.tipo === 'cessaoHerdeiro' && c.cedente === herdeiro.nome
        ) || [];
        
        const percentualCedido = cessoesHerdeiro.reduce((sum, c) => sum + c.percentual, 0);
        const valorAposCessoesHerdeiro = valorHerdeiroPoscessaoBeneficiario * (1.0 - percentualCedido);
        
        // Valor base conforme tipo de cálculo
        let valorBaseHerdeiro;
        if (dados.tipoCalculo === 'preferencia' && dados.natureza === 'alimentar' && herdeiro.temPreferencia) {
            valorBaseHerdeiro = Math.min(valorAposCessoesHerdeiro, dados.tetoPreferencia);
        } else if (contexto.isParcial) {
            valorBaseHerdeiro = valorAposCessoesHerdeiro * (dados.saldoParcial / valortotatt);
        } else {
            valorBaseHerdeiro = valorAposCessoesHerdeiro;
        }
        
        const isPreferenciaParcial = dados.tipoCalculo === 'preferencia' && valorBaseHerdeiro < valorTotalHerdeiro;
        
        // Composição inicial
        const { principal, juros, rra } = calcularComposicaoInicialHerdeiro(
            dados, valorBaseHerdeiro, valorTotalHerdeiro, percentualHerdeiro, contexto
        );
        
        // Honorários e Sindicatos
        const { honorarios, valorHonorarioTotal } = calcularHonorarios(dados, valorBaseHerdeiro, valorTotalHerdeiro, totaisPorTipo);
        const { sindicatos, valorSindicatoTotal } = calcularSindicatos(dados, valorBaseHerdeiro, valorTotalHerdeiro);
        const valorSindicatoParaDescontar = (contexto.isPreferencia && isPreferenciaParcial) ? 0 : valorSindicatoTotal;
        const valorBruto = valorBaseHerdeiro - valorHonorarioTotal - valorSindicatoParaDescontar;
    
        // Recálculo para preferência parcial e parcial
        let principalFinal = principal;
        let jurosFinal = juros;
        let rraFinal = rra;
        
        if (isPreferenciaParcial || contexto.isParcial) {
            const recalculo = recalcularPrincipalJurosRRAHerdeiro(
                dados, valorBaseHerdeiro, valorTotalHerdeiro, percentualHerdeiro, 
                isPreferenciaParcial, contexto
            );
            principalFinal = recalculo.principal;
            jurosFinal = recalculo.juros ?? jurosFinal;
            rraFinal = recalculo.rra;
        }
        
        // Tributos
        const previdencia = calcularPrevidenciaIsolada(dados, principalFinal, rraFinal);
        const ir = calcularIRIsolado(dados, valorTotalHerdeiro, valorBaseHerdeiro, principalFinal, previdencia.valorPrevidencia, rraFinal);
        
        // Cessões finais
        const cessoes = calcularCessoesHerdeiro(
            dados, herdeiro, valorBaseHerdeiro, valorTotalHerdeiro,
            valorHonorarioTotal, valorSindicatoParaDescontar,
            previdencia.valorPrevidencia, ir.valorIR
        );
        
        // Preferência parcial - saldo devedor
        let valorRecebePorPreferencia = cessoes.valorHerdeiroLiquido;
        let valorSaldoDevedor = 0;
        
        if (isPreferenciaParcial) {
            valorRecebePorPreferencia = valorBaseHerdeiro - 
                (cessoes.valorPrevidenciaHerdeiroFinal + cessoes.valorIRHerdeiroFinal + valorHonorarioTotal);
            valorSaldoDevedor = valorHerdeiroPoscessaoBeneficiario - valorBaseHerdeiro;
        }
        
        // Valores originais
        const valorOriginal = {
            valorTotal: valorTotalHerdeiro,
            principal: valorprincatt * percentualHerdeiro,
            juros: valorjurosatt * percentualHerdeiro,
            rra: contexto.rraTotal !== 0 ? arredondarRRA(contexto.rraTotal * percentualHerdeiro) : 0
        };
        
        return {
            ...herdeiro,
            indice: index,
            valorTotalOriginal: valorOriginal.valorTotal,
            principalOriginal: valorOriginal.principal,
            jurosOriginal: valorOriginal.juros,
            rrapagamentoOriginal: valorOriginal.rra,
            valorTotal: valorBaseHerdeiro,
            principal: principalFinal,
            jurosBase: jurosFinal,
            rrapagamento: rraFinal,
            rraComDesagio: ir.rraComDesagio,
            honorarios,
            valorHonorarioTotal,
            sindicatos,
            valorSindicatoTotal,
            valorPrevidencia: previdencia.valorPrevidencia,
            aliquotaEfetiva: previdencia.aliquotaEfetiva,
            valorDesagioPrevidencia: previdencia.valorDesagioPrevidencia,
            percentualDesagioPrevidencia: previdencia.percentualDesagioPrevidencia,
            valorIR: ir.valorIR,
            aliquotaIR: ir.aliquotaIR,
            baseIRHonora: ir.baseIRHonora,
            baseIRSindi: ir.baseIRSindi,
            baseIRPrev: ir.baseIRPrev,
            baseIRRRA: ir.baseIRRRA,
            valorIRUnitario: ir.valorIRUnitario,
            principalComDesagio: ir.principalComDesagio,
            percentualDesagioIR: ir.percentualDesagioIR,
            descontoAdicional2026: ir.descontoAdicional2026,
            descontoSimplificado: ir.descontoSimplificado,
            rendimentoMensal: ir.rendimentoMensal,
            valorIRSemDesconto: ir.valorIRSemDesconto, 
            valorPrevidenciaFinal: cessoes.valorPrevidenciaHerdeiroFinal,
            valorIRFinal: cessoes.valorIRHerdeiroFinal,
            percentualBeneficiarioFinal: detalhamentoTotal.percentualBeneficiarioFinal,
            valorAposCessoesBeneficiario: valorHerdeiroPoscessaoBeneficiario,
            cessoesHerdeiro: cessoes.cessoesHerdeiroFinais,
            valorCessoesHerdeiro: cessoes.valorCessoesHerdeiro,
            percentualHerdeiroFinal: cessoes.percentualHerdeiroFinal,
            valorBruto,
            valorFinalAposCessoes: cessoes.valorHerdeiroAposCessoes,
            valorLiquido: cessoes.valorHerdeiroLiquido,
            isPreferenciaParcial,
            valorRecebePorPreferencia,
            valorSaldoDevedor,
            temCessoes: cessoesHerdeiro.length > 0,
            temCessoesBeneficiario: detalhamentoTotal.percentualBeneficiarioFinal < 1.0
        };
    });
}

// ====================================
// FUNÇÕES AUXILIARES HERDEIROS
// ====================================

function calcularComposicaoInicialHerdeiro(dados, valorBase, valorTotal, percentualHerdeiro, ctx) {
    let principal, juros;
    
    if (ctx.temTributacaoIR && dados.tributacaoIR) {
        principal = valorBase * (dados.tributacaoIR.percentuais.principalTributado / 100);
        juros = valorBase * (dados.tributacaoIR.percentuais.jurosTributado / 100);
    } else {
        principal = valorBase * ctx.percentualprinc;
        juros = valorBase * ctx.percentualjur;
    }
    
    // RRA: proporcional ao percentual do herdeiro
    let rra;
    if (ctx.isParcial) {
        const proporcao = valorBase / valorTotal;
        rra = ctx.rraTotal !== 0 ? arredondarRRA(ctx.rraTotal * percentualHerdeiro * proporcao) : 0;
    } else {
        rra = ctx.rraTotal !== 0 ? arredondarRRA(ctx.rraTotal * percentualHerdeiro) : 0;
    }
    
    return { principal, juros, rra };
}

function recalcularPrincipalJurosRRAHerdeiro(dados, valorBase, valorTotal, percentualHerdeiro, isPreferenciaParcial, ctx) {
    let principal, juros, rra;
    
    if (isPreferenciaParcial) {
        if (ctx.temTributacaoIR && dados.tributacaoIR) {
            principal = valorBase * (dados.tributacaoIR.percentuais.principalTributado / 100);
        } else {
            principal = valorBase * ctx.percentualprinc;
        }
        
        const proporcao = valorBase / valorTotal;
        rra = ctx.rraTotal !== 0 ? arredondarRRA(ctx.rraTotal * percentualHerdeiro * proporcao) : 0;
        juros = undefined;
        
    } else if (ctx.isParcial) {
        const proporcao = valorBase / valorTotal;
        
        if (ctx.temTributacaoIR && dados.tributacaoIR) {
            principal = dados.tributacaoIR.principalTributado * percentualHerdeiro * proporcao;
            juros = dados.tributacaoIR.jurosTributado * percentualHerdeiro * proporcao;
        } else {
            principal = valorBase * ctx.percentualprinc;
            juros = valorBase * ctx.percentualjur;
        }
        
        rra = ctx.rraTotal !== 0 ? arredondarRRA(ctx.rraTotal * percentualHerdeiro * proporcao) : 0;
    }
    
    return { principal, juros, rra };
}