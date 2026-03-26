// ====================================
// Honorarios Sucumbencial
// ====================================

function calcularHonorariosSucumbenciais(dados, valorTotalDivida, totaisPorTipo = null) {
    const resultadoVazio = { 
        honorarios: [], 
        valorHonorarioTotal: 0,
        valorBaseSucumbencial: 0,
        temHonorariosSucumbenciais: false
    };
    
    if (!dados.honorarioSucumbencial?.advogados?.length) return resultadoVazio;
    
    let valorBaseSucumbencial = totaisPorTipo?.sucumbencial || 0;
    if (valorBaseSucumbencial <= 0) return resultadoVazio;
    
    const percentualTotalSucumbencial = dados.honorarioSucumbencial.advogados.reduce((sum, adv) => {
        return adv.tipoHonorario === 'percentual' ? sum + adv.percentual : sum;
    }, 0);
    
    // Ajustar base se for cálculo parcial
    if (dados.tipoCalculo === 'parcial') {
        const valorTotalSucumbencial = valorBaseSucumbencial * percentualTotalSucumbencial;
        
        if (dados.somenteHonorarioSucumbencial) {
            if (dados.saldoParcial < valorTotalSucumbencial) {
                const fatorAjuste = dados.saldoParcial / valorTotalSucumbencial;
                valorBaseSucumbencial = valorBaseSucumbencial * fatorAjuste;
            }
        } else {
            const valoresFiltrados = dados.valoresPrincipais?.filter(item => 
                item.tipoUsoHonorario === 'sucumbencial' || item.tipoUsoHonorario === 'ambos'
            ) || [];
            
            const valorOriginalSucumbencial = valoresFiltrados.reduce((sum, v) => 
                sum + v.valorPrincipal + v.valorJuros, 0
            );
            
            const valorOriginalTotal = dados.valoresPrincipais.reduce((sum, v) => 
                sum + v.valorPrincipal + v.valorJuros, 0
            );
            
            const proporcaoVerbaSucumbencial = valorOriginalSucumbencial / valorOriginalTotal;
            const valorPrecatorioComSucumbencial = valorTotalDivida * proporcaoVerbaSucumbencial;
            
            const totalGeral = valorPrecatorioComSucumbencial + valorTotalSucumbencial;
            if (dados.saldoParcial >= totalGeral) {
                valorBaseSucumbencial = valorBaseSucumbencial;
            } else {
                const proporcaoSucumbencial = valorTotalSucumbencial / totalGeral;
                const valorParcialSucumbencial = dados.saldoParcial * proporcaoSucumbencial;
                
                const fatorAjuste = valorParcialSucumbencial / valorTotalSucumbencial;
                valorBaseSucumbencial = valorBaseSucumbencial * fatorAjuste;
            }
        }
    }
    
    const isAcordo = dados.tipoCalculo === 'acordo';
    const isPreferencia = dados.tipoCalculo === 'preferencia';
    const tetoPreferencia = dados.tetoPreferencia || 0;
    const percentualDesagio = dados.percentualAcordo || 0;
    
    let valorHonorarioTotal = 0;
    
    const honorarios = dados.honorarioSucumbencial.advogados.map(adv => {
        const valorBrutoTotal = adv.tipoHonorario === 'percentual'
            ? valorBaseSucumbencial * adv.percentual
            : valorBaseSucumbencial;
        
        const cessaoAdv = dados.cessoes?.filter(c => 
            c.tipo === 'cessaoAdvSuc' && c.cedente === adv.nome
        ) || [];
        
        const percentualCessionarioAdv = cessaoAdv.reduce((sum, c) => sum + c.percentual, 0);
        const percentualAdvogado = Math.max(0, 1 - percentualCessionarioAdv);
        
        const valorAdvogadoAposCessoes = valorBrutoTotal * percentualAdvogado;
        const valorCessionariosTotal = valorBrutoTotal * percentualCessionarioAdv;
        
        let valorFinalAdvogado, valorFinalCessionarios;
        
        if (isPreferencia && adv.preferencia) {
            const honorarioCompletoNecessario = valorAdvogadoAposCessoes + valorCessionariosTotal;
            
            if (tetoPreferencia >= honorarioCompletoNecessario) {
                valorFinalAdvogado = valorAdvogadoAposCessoes;
                valorFinalCessionarios = valorCessionariosTotal;
            } else {
                valorFinalAdvogado = Math.min(valorAdvogadoAposCessoes, tetoPreferencia);
                valorFinalCessionarios = 0;
            }
        } else {
            valorFinalAdvogado = valorAdvogadoAposCessoes;
            valorFinalCessionarios = valorCessionariosTotal;
        }
        
        const valorFinalHonorario = valorFinalAdvogado + valorFinalCessionarios;
        
        const valorAdvogadoAposDesagio = isAcordo
            ? valorFinalAdvogado * (1 - percentualDesagio)
            : valorFinalAdvogado;
        
        const valorCessionariosAposDesagio = isAcordo
            ? valorFinalCessionarios * (1 - percentualDesagio)
            : valorFinalCessionarios;
        
        const calcularIRPessoa = (valor) => {
            if (!adv.incidenciaIR || valor <= 0) return 0;
            if (adv.tipo !== 'PF') return valor * 0.015;
            const irSemDesconto = calcularIR(valor);
            const desconto = calcularDescontoAdicional2026(valor, irSemDesconto);
            return Math.max(0, irSemDesconto - desconto);
        };
        
        const irAdvogado = calcularIRPessoa(valorAdvogadoAposDesagio);
        const irCessionarioAdv = calcularIRPessoa(valorCessionariosAposDesagio);
        
        const valorLiquidoAdvogado = valorAdvogadoAposDesagio - irAdvogado;
        const valorLiquidoCessionario = valorCessionariosAposDesagio - irCessionarioAdv;
        
        const cessionarios = cessaoAdv.map(cessao => {
            const valorBrutoCessao = valorFinalHonorario * cessao.percentual;
            const valorAposDesagio = isAcordo
                ? valorBrutoCessao * (1 - percentualDesagio)
                : valorBrutoCessao;
            
            const irCessao = (() => {
                if (!adv.incidenciaIR) return 0;
                if (adv.tipo !== 'PF') return valorAposDesagio * 0.015;
                const irSemDesconto = calcularIR(valorAposDesagio);
                const desconto = calcularDescontoAdicional2026(valorAposDesagio, irSemDesconto);
                return Math.max(0, irSemDesconto - desconto);
            })();
            
            return {
                nome: cessao.cessionario,
                percentual: cessao.percentual,
                valorBruto: valorBrutoCessao,
                valorAposDesagio,
                ir: irCessao,
                valorLiquido: valorAposDesagio - irCessao
            };
        });
        
        valorHonorarioTotal += valorFinalHonorario;
        
        const honorarioCompletoNecessario = valorAdvogadoAposCessoes + valorCessionariosTotal;
        
        return {
            ...adv,
            valorBruto: valorFinalHonorario,
            ir: irAdvogado + irCessionarioAdv,
            valorLiquido: valorLiquidoAdvogado + valorLiquidoCessionario,
            percentualAdvogado,
            valorBrutoAdvogado: valorFinalAdvogado,
            valorAdvogadoAposDesagio,
            irAdvogado,
            valorLiquidoAdvogado,
            percentualCessionarioAdv,
            valorBrutoCessionario: valorFinalCessionarios,
            valorCessionarioAposDesagio: valorCessionariosAposDesagio,
            irCessionarioAdv,
            valorLiquidoCessionario,
            cessionarios,
            cessoesAdv: cessaoAdv,
            temPreferencia: isPreferencia && adv.preferencia,
            foiLimitadoPorPreferencia: isPreferencia && adv.preferencia && (tetoPreferencia < honorarioCompletoNecessario),
            temCessoes: cessaoAdv.length > 0
        };
    });
    
    return { 
        honorarios, 
        valorHonorarioTotal,
        valorBaseSucumbencial,
        temHonorariosSucumbenciais: true
    };
}