// ====================================
// SINDICATOS
// ====================================

function calcularSindicatos(dados, valorBase, valortotatt) {
    const isAcordo = dados.tipoCalculo === 'acordo';
    const percentualDesagio = dados.percentualAcordo || 0;
    const isPreferencia = dados.tipoCalculo === 'preferencia';
    const isParcial = dados.tipoCalculo === 'parcial';

    const calcularIRSindicato = (valor, tributacao, aliquotaPersonalizada = 0) => {
        if (tributacao === 'nao') return 0;
        if (tributacao === 'lei') return valor * 0.03;
        if (tributacao === 'fixa') return valor * aliquotaPersonalizada;
        return 0;
    };

    let valorSindicatoTotal = 0;
    
    const sindicatos = dados.sindicatos.map(sind => {
        const percentualTotalSindicato = sind.percentual;
        
        const valorBaseCalculo = isParcial ? valorBase : valortotatt;
        const valorBrutoTotal = valorBaseCalculo * percentualTotalSindicato;
        
        const cessaoSind = dados.cessoes?.filter(cessao => 
            cessao.tipo === 'cessaoSindicato' && cessao.cedente === sind.nome
        ) || [];
        
        let percentualCessionarioSind = cessaoSind.reduce((total, cessao) => total + cessao.percentual, 0);
        const percentualSindicato = Math.max(0, percentualTotalSindicato - percentualCessionarioSind);

        const valorBrutoSindicato = valorBrutoTotal * percentualSindicato; 
        const valorBrutoCessionario = valorBrutoTotal * percentualCessionarioSind; 

        let valorParaIRSindicato = isAcordo ? valorBrutoSindicato * (1 - percentualDesagio) : valorBrutoSindicato;
        let valorParaIRCessionario = isAcordo ? valorBrutoCessionario * (1 - percentualDesagio) : valorBrutoCessionario;
        
        let irSindicato = calcularIRSindicato(valorParaIRSindicato, sind.tributacao, sind.aliquotaTributacao);
        let irCessionarioSind = calcularIRSindicato(valorParaIRCessionario, sind.tributacao, sind.aliquotaTributacao);
        
        const valorLiquidoSindicato = valorBrutoSindicato - irSindicato;
        const valorLiquidoCessionario = valorBrutoCessionario - irCessionarioSind;

        const cessionarios = cessaoSind.map(cessao => {
            const valorBrutoCessao = valorBrutoTotal * cessao.percentual; 
            let valorParaIRCessao = isAcordo ? valorBrutoCessao * (1 - percentualDesagio) : valorBrutoCessao;
            
            let irCessao = calcularIRSindicato(valorParaIRCessao, sind.tributacao, sind.aliquotaTributacao);
            
            return {
                nome: cessao.cessionario,
                percentual: cessao.percentual,
                valorBruto: valorBrutoCessao,
                ir: irCessao,
                valorLiquido: valorBrutoCessao - irCessao
            };
        });

        //if (!isPreferencia) {
            
        //
        valorSindicatoTotal += valorBrutoTotal;

        return {
            ...sind,
            valorBruto: valorBrutoTotal,
            ir: irSindicato + irCessionarioSind,
            valorLiquido: valorLiquidoSindicato + valorLiquidoCessionario,
            
            // Dados do sindicato
            percentualSindicato,
            valorBrutoSindicato,
            irSindicato,
            valorLiquidoSindicato,
            
            // Dados totais dos cessionários
            percentualCessionarioSind,
            valorBrutoCessionario,
            irCessionarioSind,
            valorLiquidoCessionario,
            cessionarios,
            cessoesSind: cessaoSind,
            
            // Flag de controle
            podeReceber: !isPreferencia
        };
    });

    return { 
        sindicatos, 
        valorSindicatoTotal
    };
}