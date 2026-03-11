// ====================================
// CESSOES HERDEIROS
// ====================================

function calcularCessoesHerdeiro(dados, herdeiro, valorBaseHerdeiro, valorTotalHerdeiro, valorHonorarioTotal, valorSindicatoParaDescontar, valorPrevidenciaHerdeiro, valorIRHerdeiro) {
    const valorHerdeiroBruto = valorBaseHerdeiro - valorHonorarioTotal - valorSindicatoParaDescontar;
    const cessoesHerdeiro = dados.cessoes?.filter(c => 
        c.tipo === 'cessaoherdeiro' && c.cedente === herdeiro.nome
    ) || [];
    
    if (cessoesHerdeiro.length === 0) {
        return {
            valorHerdeiroBruto,
            valorCessoesHerdeiro: 0,
            cessoesHerdeiroCalculadas: [],
            percentualHerdeiroFinal: 1.0,
            valorHerdeiroAposCessoes: valorHerdeiroBruto,
            valorPrevidenciaHerdeiroFinal: valorPrevidenciaHerdeiro,
            valorIRHerdeiroFinal: valorIRHerdeiro,
            valorHerdeiroLiquido: valorHerdeiroBruto - valorPrevidenciaHerdeiro - valorIRHerdeiro,
            cessoesHerdeiroFinais: []
        };
    }
    
    const totalPercentualCessoes = cessoesHerdeiro.reduce((sum, c) => sum + c.percentual, 0);
    const percentualHerdeiroFinal = 1.0 - totalPercentualCessoes;
    const isPreferenciaParcial = dados.tipoCalculo === 'preferencia' && valorBaseHerdeiro < valorTotalHerdeiro;
    
    const percentualAdvogados = dados.advogados.reduce((sum, adv) => sum + adv.percentual, 0);
    const valorTotalSemAdvogados = valorTotalHerdeiro * (1 - percentualAdvogados);
    
    let valorCessoesHerdeiro = 0;
    const cessoesHerdeiroCalculadas = [];
    const cessoesHerdeiroFinais = [];
    
    if (isPreferenciaParcial) {
        // PREFERÊNCIA PARCIAL: cessionários não recebem agora
        const parteHerdeiroNaDividaTotal = valorTotalSemAdvogados * percentualHerdeiroFinal;
        const maxQueHerdeiroPodeReceber = Math.min(parteHerdeiroNaDividaTotal, valorHerdeiroBruto);
        
        for (const cessao of cessoesHerdeiro) {
            const parteCessionarioNaDividaTotal = valorTotalSemAdvogados * cessao.percentual;
            
            const cessaoCalculada = {
                tipo: cessao.tipo,
                cedente: cessao.cedente,
                cessionario: cessao.cessionario,
                percentual: cessao.percentual,
                valorBruto: 0,
                valorSaldoDevedor: parteCessionarioNaDividaTotal,
                observacao: 'Aguarda pagamento - sem direito à preferência'
            };
            
            const cessaoFinal = {
                ...cessaoCalculada,
                previdenciaCessao: 0,
                irCessao: 0,
                valorLiquido: 0
            };
            
            cessoesHerdeiroCalculadas.push(cessaoCalculada);
            cessoesHerdeiroFinais.push(cessaoFinal);
        }
        
        return {
            valorHerdeiroBruto,
            valorCessoesHerdeiro: 0,
            cessoesHerdeiroCalculadas,
            percentualHerdeiroFinal,
            valorHerdeiroAposCessoes: maxQueHerdeiroPodeReceber,
            valorPrevidenciaHerdeiroFinal: valorPrevidenciaHerdeiro,
            valorIRHerdeiroFinal: valorIRHerdeiro,
            valorHerdeiroLiquido: maxQueHerdeiroPodeReceber - valorPrevidenciaHerdeiro - valorIRHerdeiro,
            cessoesHerdeiroFinais
        };
    }
    
    // ORDEM CRONOLÓGICA OU PARCIAL: distribuição proporcional
    for (const cessao of cessoesHerdeiro) {
        const valorBrutoCessao = valorHerdeiroBruto * cessao.percentual;
        valorCessoesHerdeiro += valorBrutoCessao;
        
        const cessaoCalculada = {
            tipo: cessao.tipo,
            cedente: cessao.cedente,
            cessionario: cessao.cessionario,
            percentual: cessao.percentual,
            valorBruto: valorBrutoCessao
        };
        
        const previdenciaCessao = valorPrevidenciaHerdeiro * cessao.percentual;
        const irCessao = valorIRHerdeiro * cessao.percentual;
        
        const cessaoFinal = {
            ...cessaoCalculada,
            previdenciaCessao,
            irCessao,
            valorLiquido: valorBrutoCessao - previdenciaCessao - irCessao
        };
        
        cessoesHerdeiroCalculadas.push(cessaoCalculada);
        cessoesHerdeiroFinais.push(cessaoFinal);
    }
    
    return {
        valorHerdeiroBruto,
        valorCessoesHerdeiro,
        cessoesHerdeiroCalculadas,
        percentualHerdeiroFinal,
        valorHerdeiroAposCessoes: valorHerdeiroBruto * percentualHerdeiroFinal,
        valorPrevidenciaHerdeiroFinal: valorPrevidenciaHerdeiro * percentualHerdeiroFinal,
        valorIRHerdeiroFinal: valorIRHerdeiro * percentualHerdeiroFinal,
        valorHerdeiroLiquido: (valorHerdeiroBruto * percentualHerdeiroFinal) - 
                            (valorPrevidenciaHerdeiro * percentualHerdeiroFinal) - 
                            (valorIRHerdeiro * percentualHerdeiroFinal),
        cessoesHerdeiroFinais
    };
}