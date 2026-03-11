// ====================================
// CESSOES BEN. PRINCIPAL
// ====================================

function calcularCessoesBeneficiarioPrincipal(dados, valorBase, valortotatt, valorHonorarioTotal, valorSindicatoParaDescontar, valorPrevidencia, valorIR) {
    const valorBeneficiarioBruto = valorBase - valorHonorarioTotal - valorSindicatoParaDescontar;
    const cessoesBeneficiario = dados.cessoes?.filter(c => c.tipo === 'cessaobenPrincipal') || [];
    
    if (cessoesBeneficiario.length === 0) {
        return {
            valorBeneficiarioBruto,
            valorCessoesBeneficiario: 0,
            cessoesBeneficiarioCalculadas: [],
            percentualBeneficiarioFinal: 1.0,
            valorBeneficiarioAposCessoes: valorBeneficiarioBruto,
            valorPrevidenciaBeneficiario: valorPrevidencia,
            valorIRBeneficiario: valorIR,
            valorBeneficiarioFinal: valorBeneficiarioBruto - valorPrevidencia - valorIR,
            cessoesBeneficiarioFinais: []
        };
    }

    const totalPercentualCessoes = cessoesBeneficiario.reduce((sum, c) => sum + c.percentual, 0);
    percentualBeneficiarioFinal = 1.0 - totalPercentualCessoes;
    
    const percentualAdvogados = dados.advogados.length > 0 ? 
        dados.advogados.reduce((sum, adv) => sum + adv.percentual, 0) : 0;
    const valortotattSemAdvogados = valortotatt - (valortotatt * percentualAdvogados);

    const isPreferenciasParcial = dados.tipoCalculo === 'preferencia' && valorBase < valortotatt;
    const deveReceberAgora = !isPreferenciasParcial;

    const valorPrevidenciaBase = deveReceberAgora ? valorPrevidencia : 0;
    const valorIRBase = deveReceberAgora ? valorIR : 0;

    let valorCessoesBeneficiario = 0;
    const cessoesBeneficiarioCalculadas = [];
    const cessoesBeneficiarioFinais = [];

    for (const cessao of cessoesBeneficiario) {
        // Valor bruto da cessão
        const valorBrutoCessao = deveReceberAgora ? (valorBeneficiarioBruto * cessao.percentual) : 0;
        valorCessoesBeneficiario += valorBrutoCessao;
        
        const cessaoCalculada = {
            tipo: cessao.tipo,
            cedente: cessao.cedente,
            cessionario: cessao.cessionario,
            percentual: cessao.percentual,
            valorBruto: valorBrutoCessao,
            ...(isPreferenciasParcial && {
                valorSaldoDevedor: valortotattSemAdvogados * cessao.percentual,
                observacao: 'Aguarda pagamento - sem direito à preferência'
            })
        };
        
        const previdenciaCessao = valorPrevidenciaBase * cessao.percentual;
        const irCessao = valorIRBase * cessao.percentual;
        
        const cessaoFinal = {
            ...cessaoCalculada,
            previdenciaCessao,
            irCessao,
            valorLiquido: valorBrutoCessao - previdenciaCessao - irCessao
        };
        
        cessoesBeneficiarioCalculadas.push(cessaoCalculada);
        cessoesBeneficiarioFinais.push(cessaoFinal);
    }

    let valorBeneficiarioAposCessoes, valorPrevidenciaBeneficiario, valorIRBeneficiario;

    if (isPreferenciasParcial) {
        // PREFERÊNCIA PARCIAL: beneficiário limitado pelo teto
        const parteBeneficiarioNaDividaTotal = valortotattSemAdvogados * percentualBeneficiarioFinal;
        valorBeneficiarioAposCessoes = Math.min(parteBeneficiarioNaDividaTotal, valorBeneficiarioBruto);
        valorPrevidenciaBeneficiario = valorPrevidencia;
        valorIRBeneficiario = valorIR;
    } else {
        valorBeneficiarioAposCessoes = valorBeneficiarioBruto * percentualBeneficiarioFinal;
        valorPrevidenciaBeneficiario = valorPrevidencia * percentualBeneficiarioFinal;
        valorIRBeneficiario = valorIR * percentualBeneficiarioFinal;
    }

    const valorBeneficiarioFinal = valorBeneficiarioAposCessoes - valorPrevidenciaBeneficiario - valorIRBeneficiario;

    return {
        valorBeneficiarioBruto,
        valorCessoesBeneficiario,
        cessoesBeneficiarioCalculadas,
        percentualBeneficiarioFinal,
        valorBeneficiarioAposCessoes,
        valorPrevidenciaBeneficiario,
        valorIRBeneficiario,
        valorBeneficiarioFinal,
        cessoesBeneficiarioFinais
    };
}