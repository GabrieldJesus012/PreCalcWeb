// ====================================
// Honorarios Contratual
// ====================================

function calcularHonorarios(dados, valorBase, valortotatt, totaisPorTipo = null) {
    if (!totaisPorTipo || totaisPorTipo.contratual <= 0) {
        return { honorarios: [], valorHonorarioTotal: 0 };
    }
    
    const isAcordo = dados.tipoCalculo === 'acordo';
    const percentualDesagio = dados.percentualAcordo || 0;
    
    const proporcaoContratual = totaisPorTipo.contratual / totaisPorTipo.total;
    const valorBaseContratual = valorBase * proporcaoContratual;
    
    let valorHonorarioTotal = 0;
    
    const honorarios = dados.advogados.map(adv => {
        const valorBrutoTotal = valorBaseContratual * adv.percentual;
        valorHonorarioTotal += valorBrutoTotal;
        
        // Filtrar cessões deste advogado
        const cessaoAdv = dados.cessoes?.filter(c => 
            c.tipo === 'cessaoAdv' && c.cedente === adv.nome
        ) || [];
        
        const percentualCessionarioAdv = cessaoAdv.reduce((sum, c) => sum + c.percentual, 0);
        
        let valorBrutoAdvogado, valorBrutoCessionario, percentualAdvogado;
        
        if (percentualCessionarioAdv >= 1.0) {
            // Cessão de 100%: todo honorário vai para cessionário
            valorBrutoAdvogado = 0;
            valorBrutoCessionario = valorBrutoTotal;
            percentualAdvogado = 0;
        } else {
            // Cessão parcial: calcular sobre o precatório
            percentualAdvogado = Math.max(0, adv.percentual - percentualCessionarioAdv);
            valorBrutoAdvogado = valorBaseContratual * percentualAdvogado;
            valorBrutoCessionario = valorBaseContratual * percentualCessionarioAdv;
        }
        
        const valorParaIRAdvogado = isAcordo 
            ? valorBrutoAdvogado * (1 - percentualDesagio)
            : valorBrutoAdvogado;
        
        const valorParaIRCessionario = isAcordo
            ? valorBrutoCessionario * (1 - percentualDesagio)
            : valorBrutoCessionario;
        
        const calcularIRPessoa = (valor) => {
            if (!adv.incidenciaIR || valor <= 0) return 0;
            return adv.tipo === 'PF' ? calcularIR(valor) : valor * 0.015;
        };
        
        const irAdvogado = calcularIRPessoa(valorParaIRAdvogado);
        const irCessionarioAdv = calcularIRPessoa(valorParaIRCessionario);
        
        const valorLiquidoAdvogado = valorBrutoAdvogado - irAdvogado;
        const valorLiquidoCessionario = valorBrutoCessionario - irCessionarioAdv;
        
        const cessionarios = cessaoAdv.map(cessao => {
            const valorBrutoCessao = percentualCessionarioAdv >= 1.0
                ? valorBrutoTotal * cessao.percentual
                : valorBaseContratual * cessao.percentual;
            
            const valorParaIRCessao = isAcordo
                ? valorBrutoCessao * (1 - percentualDesagio)
                : valorBrutoCessao;
            
            const irCessao = adv.incidenciaIR
                ? (adv.tipo === 'PF' ? calcularIR(valorParaIRCessao) : valorParaIRCessao * 0.015)
                : 0;
            
            return {
                nome: cessao.cessionario,
                percentual: cessao.percentual,
                valorBruto: valorBrutoCessao,
                ir: irCessao,
                valorLiquido: valorBrutoCessao - irCessao
            };
        });
        
        return {
            ...adv,
            valorBruto: valorBrutoTotal,
            ir: irAdvogado + irCessionarioAdv,
            valorLiquido: valorLiquidoAdvogado + valorLiquidoCessionario,
            percentualAdvogado,
            valorBrutoAdvogado,
            irAdvogado,
            valorLiquidoAdvogado,
            percentualCessionarioAdv,
            valorBrutoCessionario,
            irCessionarioAdv,
            valorLiquidoCessionario,
            cessionarios,
            cessoesAdv: cessaoAdv
        };
    });
    
    return { honorarios, valorHonorarioTotal };
}