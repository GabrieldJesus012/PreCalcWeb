// ====================================
// FUNÇÃO DE CÁLCULO 
// ====================================

async function calcularIndicesEValores(baseData, dados, valorPrincipal, valorJuros, configIndices = {}) {
    const { inicioGraca, fimGraca } = calcularPeriodoGraca(dados.anoOrcamento);
    const { mesBase, anoBase } = baseData;
    const dataBase = criarDataBase(mesBase, anoBase);
    
    const indices = {
        cnj: 1,
        selic: 1,
        ipcae: 1,
        ipca: 1,
        jurosMora: 0
    };

    try {
        // 1. CNJ
        if (configIndices.aplicarCNJ) {
            indices.cnj = obterIndiceCNJ(mesBase, anoBase);
        }

        // 2. Caderneta de Poupança Juros de Mora
        if (configIndices.aplicarJurosMora) {
            indices.jurosMora = calcularSomaJurosMora(mesBase, anoBase, dados.natureza, inicioGraca, fimGraca) / 100;
        }

        // 3. IPCA-E (período de graça)
        if (configIndices.aplicarIpcaE) {
            try {
                indices.ipcae = await calcularIpcaE(dataBase, inicioGraca, fimGraca);
            } catch (error) {
                console.error("⚠️ Erro ao calcular IPCA-E (usando 1.0):", error.message);
            }
        }
        
        // 4. SELIC
        if (configIndices.aplicarSelic) {
            const temSelicInformado = (configIndices.tipoSelic === 'valor' && configIndices.valorSelic > 0) || 
                                    (configIndices.tipoSelic === 'percentual' && configIndices.percentualSelic > 0);
            
            let dataInicioSelic = new Date(dataBase);
            if (temSelicInformado && configIndices.selicReferencia !== 'mesAnterior') {
                dataInicioSelic.setMonth(dataInicioSelic.getMonth() + 1);
            }
            
            try {
                const dadosSelicCompletos = await calcularSelic(dataInicioSelic, inicioGraca, fimGraca);
                indices.selic = dadosSelicCompletos.indiceselic;
                
                // Adicionar SELIC informado
                if (temSelicInformado) {
                    let percentualSelicAdicional = 0;
                    
                    if (configIndices.tipoSelic === 'valor' && configIndices.valorSelic > 0) {
                        const totalBase = valorPrincipal + valorJuros;
                        if (totalBase > 0) percentualSelicAdicional = configIndices.valorSelic / totalBase;
                    } else if (configIndices.tipoSelic === 'percentual') {
                        percentualSelicAdicional = configIndices.percentualSelic || 0;
                    }
                    
                    if (percentualSelicAdicional > 0) {
                        indices.selic = 1 + (indices.selic - 1) + percentualSelicAdicional;
                    }
                }
            } catch (error) {
                console.error("⚠️ Erro ao calcular SELIC (usando 1.0):", error.message);
            }
        }
    } catch (error) {
        console.error("❌ Erro geral em calcularIndicesEValores:", error);
    }
    
    // Calcular valores base
    const principalCNJ = valorPrincipal * indices.cnj;
    const jurosCNJ = valorJuros * indices.cnj;
    const valorJurosMora = principalCNJ * indices.jurosMora;
    const jurosTotal = jurosCNJ + valorJurosMora;
    const totalAntesSelic = principalCNJ + jurosTotal;
    const valorSelicSeparado = totalAntesSelic * (indices.selic - 1);
    
    // Verificar PEC
    const comparacaoSelicIpca = await calcularSelicPosAgosto2025();
    const usarLogicaPEC = comparacaoSelicIpca.quantidadeMeses > 0;
    
    // ====================================
    // SITUAÇÃO 1: PEC com SELIC > IPCA+2%
    // ====================================
    if (usarLogicaPEC && comparacaoSelicIpca.selicMaior) {
        const dadosIpca = await calcularIpca(dataBase, inicioGraca, fimGraca);
        const indiceIpca = dadosIpca.indiceipca;
        const percentualJuros2AA = calcularJuros2PorcentoAA(dadosIpca.quantidadeMeses);
        
        const principalComIpca = principalCNJ * indices.ipcae * indiceIpca;
        const jurosComIpca = jurosTotal * indiceIpca * indices.ipcae;
        const selicComIpca = valorSelicSeparado * indiceIpca * indices.ipcae;
        const valorJuros2AA = principalComIpca * percentualJuros2AA;
        
        const jurosFinal = jurosComIpca + valorJuros2AA;
        const totalFinal = principalComIpca + jurosFinal + selicComIpca;
        
        // Valores para tributação (com SELIC incorporada)
        const principalComSelicTributacao = valorPrincipal * indices.cnj * indices.ipcae * indiceIpca * indices.selic;
        const jurosOriginaisComSelic = valorJuros * indices.cnj * indices.ipcae * indiceIpca * indices.selic;
        const jurosMoraComSelic = valorJurosMora * indices.ipcae * indiceIpca * indices.selic;
        const jurosComSelicTributacao = jurosOriginaisComSelic + jurosMoraComSelic + valorJuros2AA;
        
        indices.ipca = indiceIpca;
        
        return {
            valorPrincipalAtualizado: principalComIpca,
            valorJurosAtualizado: jurosFinal,
            valorSelicSeparado: selicComIpca,
            principalTributacao: principalComSelicTributacao,
            jurosTributacao: jurosComSelicTributacao,
            indices: {
                ...indices,
                indicePrincipal: indices.cnj * indiceIpca,
                indiceJuros: indices.cnj * indiceIpca,
                juros2AA: percentualJuros2AA 
            },
            jurosMoraCalculado: valorJurosMora,
            detalhamentoPEC: {
                usouLogicaPEC: true,
                selicMaior: true,
                indiceSelic: comparacaoSelicIpca.indiceSelic,
                indiceIpcaMais2: comparacaoSelicIpca.indiceIpcaMais2,
                indiceIpcaPuro: indiceIpca,
                percentualJuros2AA,
                valorJuros2AA,
                quantidadeMeses: comparacaoSelicIpca.quantidadeMeses
            }
        };
    }
    
    // ====================================
    // SITUAÇÕES 2 e 3: Cálculo unificado
    // ====================================
    const totalComSelic = totalAntesSelic * indices.selic;
    const totalComIpcaE = totalComSelic * indices.ipcae;
    
    // Aplicar índice pós-agosto se houver PEC (Situação 2) ou manter como está (Situação 3)
    const indiceFinal = usarLogicaPEC ? comparacaoSelicIpca.indiceSelecionado : 1;
    const totalFinal = totalComIpcaE * indiceFinal;
    
    // Proporcionalizar principal e juros
    const proporcaoPrincipal = principalCNJ / totalAntesSelic;
    const proporcaoJuros = jurosTotal / totalAntesSelic;
    
    const principalFinal = totalFinal * proporcaoPrincipal;
    const jurosFinal = totalFinal * proporcaoJuros;
    
    const indicePrincipal = indices.cnj * indices.selic * indices.ipcae * indiceFinal;
    const indiceJuros = indicePrincipal;
    
    if (usarLogicaPEC) {
        indices.ipca = comparacaoSelicIpca.indiceSelecionado;
    }
    
    return {
        valorPrincipalAtualizado: principalFinal,
        valorJurosAtualizado: jurosFinal,
        valorSelicSeparado: 0,
        principalTributacao: principalFinal,
        jurosTributacao: jurosFinal,
        indices: {
            ...indices,
            indicePrincipal,
            indiceJuros
        },
        jurosMoraCalculado: valorJurosMora,
        detalhamentoPEC: usarLogicaPEC ? {
            usouLogicaPEC: true,
            selicMaior: false,
            indiceSelic: comparacaoSelicIpca.indiceSelic,
            indiceIpcaMais2: comparacaoSelicIpca.indiceIpcaMais2,
            quantidadeMeses: comparacaoSelicIpca.quantidadeMeses
        } : {
            usouLogicaPEC: false
        }
    };
}

// ====================================
// CALCULAR ITEM PRINCIPAL 
// ====================================

async function calcularItemPrincipal(item, dados) {
    const configIndices = {
        aplicarCNJ: item.indices.cnj || false,
        aplicarSelic: item.indices.selic || false,
        aplicarIpcaE: item.indices.ipcae || false,
        aplicarJurosMora: item.indices.jurosMora || false,
        aplicarIpca: item.indices.ipca || false,
        tipoSelic: item.tipoSelic,
        valorSelic: item.valorSelic,
        percentualSelic: item.percentualSelic,
        selicReferencia: item.mesReferenciaSelic
    };
    
    const baseData = { mesBase: item.mesBase, anoBase: item.anoBase };
    
    const calculo = await calcularIndicesEValores(
        baseData, 
        dados, 
        item.valorPrincipal, 
        item.valorJuros, 
        configIndices
    );
    
    return {
        id: item.id,
        descricao: item.descricao,
        valorOriginal: {
            principal: item.valorPrincipal,
            juros: item.valorJuros,
            total: item.valorPrincipal + item.valorJuros
        },
        valorAtualizado: {
            principal: calculo.valorPrincipalAtualizado,
            juros: calculo.valorJurosAtualizado,
            selic: calculo.valorSelicSeparado || 0,  // ⬅️ NOVO
            total: calculo.valorPrincipalAtualizado + 
                calculo.valorJurosAtualizado + 
                (calculo.valorSelicSeparado || 0)
        },

        valorSelicSeparado: calculo.valorSelicSeparado || 0,
        principalTributacao: calculo.principalTributacao,
        jurosTributacao: calculo.jurosTributacao,

        indices: calculo.indices,
        tributacao: item.tributacao,
        jurosMoraCalculado: calculo.jurosMoraCalculado,

        detalhamentoPEC: calculo.detalhamentoPEC
    };
}

// ====================================
// TOTALIZAR ITENS TRIBUTAÇÃO
// ====================================

function totalizarTributacao(itensCalculados) {
    const totais = {
        valorPrincipalTotal: 0,
        valorJurosTotal: 0,
        valorSelicTotal: 0,  
        valorGeralTotal: 0,
        rraTotal: 0,
        principalTributadoIR: 0,
        jurosTributadoIR: 0,
        isentoIR: 0,
        principalTributadoPrevidencia: 0,
        jurosTributadoPrevidencia: 0,
        isentoPrevidencia: 0
    };
    
    for (const item of itensCalculados) {
        totais.valorPrincipalTotal += item.valorAtualizado.principal;
        totais.valorJurosTotal += item.valorAtualizado.juros;
        
        // ⬅️ SELIC separada
        const valorSelicItem = item.valorSelicSeparado || 0;
        totais.valorSelicTotal += valorSelicItem;
        
        // ⬅️ Total geral (com SELIC)
        totais.valorGeralTotal += item.valorAtualizado.principal + 
                                item.valorAtualizado.juros + 
                                valorSelicItem;
        
        totais.rraTotal += item.tributacao.rra || 0;
        
        // ========== TRIBUTAÇÃO IR ==========
        if (item.tributacao.ir) {
            // ⬅️ USA OS VALORES DE TRIBUTAÇÃO (com SELIC incorporada)
            if (item.principalTributacao !== undefined && item.jurosTributacao !== undefined) {
                totais.principalTributadoIR += item.principalTributacao;
                totais.jurosTributadoIR += item.jurosTributacao;
            } else {
                // Fallback para lógica antiga (caso não tenha os novos campos)
                totais.principalTributadoIR += item.valorAtualizado.principal;
                totais.jurosTributadoIR += item.valorAtualizado.juros;
            }
        } else {
            totais.isentoIR += item.valorAtualizado.principal + 
                            item.valorAtualizado.juros + 
                            valorSelicItem;
        }
        
        // ========== TRIBUTAÇÃO PREVIDÊNCIA ==========
        if (item.tributacao.previdencia) {
            totais.principalTributadoPrevidencia += item.valorAtualizado.principal;
            totais.jurosTributadoPrevidencia += item.valorAtualizado.juros;
        } else {
            totais.isentoPrevidencia += item.valorAtualizado.principal + 
                                        item.valorAtualizado.juros + 
                                        valorSelicItem;
        }
    }
    
    return totais;
}

 // ====================================
// CALCULAR VALORES 
// ====================================

async function calcularValores(dados) {
    if (!dados.valoresPrincipais || dados.valoresPrincipais.length === 0) {
        console.error('❌ Erro: Nenhum valor principal encontrado!');
        return null;
    }
    
    // 1. Calcular todos os itens
    const itensCalculados = [];
    for (const item of dados.valoresPrincipais) {
        try {
            itensCalculados.push(await calcularItemPrincipal(item, dados));
        } catch (error) {
            console.error(`❌ Erro ao calcular item ${item.descricao}:`, error);
            throw error;
        }
    }
    
    // 2. Totalizar tributação
    const totais = totalizarTributacao(itensCalculados);

    // 3. Calcular totais por tipo de honorário
    const totaisPorTipo = {
        contratual: 0,
        sucumbencial: 0,
        nenhum: 0,
        total: totais.valorGeralTotal
    };

    const tiposMap = {
        'contratual': ['contratual'],
        'sucumbencial': ['sucumbencial'],
        'ambos': ['contratual', 'sucumbencial'],
        'nenhum': ['nenhum']
    };

    dados.valoresPrincipais.forEach((itemOriginal, index) => {
        const itemCalculado = itensCalculados[index];
        if (!itemCalculado) return;
        
        const valorSelicItem = itemCalculado.valorSelicSeparado || 0;
        const valorAtualizado = itemCalculado.valorAtualizado.principal + 
                                itemCalculado.valorAtualizado.juros + 
                                valorSelicItem;
        const tipos = tiposMap[itemOriginal.tipoUsoHonorario] || [];
        
        tipos.forEach(tipo => {
            totaisPorTipo[tipo] += valorAtualizado;
        });
    });
    
    // 4. Percentuais e índices gerais
    const percentualprinc = totais.valorPrincipalTotal / totais.valorGeralTotal;
    const percentualjur = totais.valorJurosTotal / totais.valorGeralTotal;
    const percentualselic = totais.valorSelicTotal / totais.valorGeralTotal; 

    const valorOriginalTotal = itensCalculados.reduce((sum, item) => 
        sum + item.valorOriginal.total, 0);
    const indiceTotal = totais.valorGeralTotal / valorOriginalTotal;
    
    // 5. Percentuais de tributação IR
    const percentualPrincipalTributadoIR = (totais.principalTributadoIR / totais.valorGeralTotal) * 100;
    const percentualJurosTributadoIR = (totais.jurosTributadoIR / totais.valorGeralTotal) * 100;
    const percentualIsentoIR = (totais.isentoIR / totais.valorGeralTotal) * 100;
    
    // 6. Dados para detalhamento
    const dadosParaDetalhamento = {
        ...dados,
        valorPrincipal: totais.valorPrincipalTotal,
        valorJuros: totais.valorJurosTotal,
        valorSelic: totais.valorSelicTotal, 
        rra: totais.rraTotal,
        incidenciaIR: dados.valoresPrincipais.some(item => item.tributacao?.ir === true),
        incidenciaPrevidencia: dados.valoresPrincipais.some(item => item.tributacao?.previdencia === true),
        tributacaoIR: {
            principalTributado: totais.principalTributadoIR,
            jurosTributado: totais.jurosTributadoIR,
            isento: totais.isentoIR,
            percentuais: {
                principalTributado: percentualPrincipalTributadoIR,
                jurosTributado: percentualJurosTributadoIR,
                isento: percentualIsentoIR
            }
        },
        tributacaoPrevidencia: {
            principalTributado: totais.principalTributadoPrevidencia,
            jurosTributado: totais.jurosTributadoPrevidencia,
            isento: totais.isentoPrevidencia
        },
        totaisPorTipo
    };
    
    // 7. Cálculos de distribuição
    const detalhamento = calcularGlobal(dadosParaDetalhamento, totais.valorGeralTotal, percentualprinc, percentualjur,totaisPorTipo);
    const honorariosSucumbenciais = calcularHonorariosSucumbenciais(dadosParaDetalhamento, totais.valorGeralTotal, totaisPorTipo);
    const herdeiros = calcularHerdeiros(dadosParaDetalhamento, totais.valorGeralTotal, totais.valorPrincipalTotal, totais.valorJurosTotal, detalhamento,totaisPorTipo);

    // 8. Pagamentos
    const pagamentosCalculados = await calcularPagamentos(dados);
    const totalPagamentos = pagamentosCalculados.reduce((total, pag) => 
        total + pag.valorAtualizado.total, 0
    );
    
    // 9. Resultado final
    const resultadoFinal = {
        valorprincatt: totais.valorPrincipalTotal,
        valorjurosatt: totais.valorJurosTotal,
        valorSelicatt: totais.valorSelicTotal,
        valortotatt: totais.valorGeralTotal,
        
        tributacaoIR: {
            principalTributado: totais.principalTributadoIR,
            jurosTributado: totais.jurosTributadoIR,
            isento: totais.isentoIR,
            percentuais: {
                principalTributado: percentualPrincipalTributadoIR,
                jurosTributado: percentualJurosTributadoIR,
                isento: percentualIsentoIR
            }
        },
        tributacaoPrevidencia: {
            principalTributado: totais.principalTributadoPrevidencia,
            jurosTributado: totais.jurosTributadoPrevidencia,
            isento: totais.isentoPrevidencia
        },
        rraTotal: totais.rraTotal,
        
        itensCalculados,
        ...detalhamento,
        
        herdeiros,
        temHerdeiros: herdeiros.length > 0,
        honorariosSucumbenciais,

        pagamentos: pagamentosCalculados,
        totalPagamentos: totalPagamentos,
        
        indiceTotal,
        percentualprinc,
        percentualjur,
        percentualselic,
        valorOriginalTotal,
        totaisPorTipo
    };
    
    // 10. Saldos finais
    resultadoFinal.saldosFinais = calcularSaldoFinalComPagamentos(resultadoFinal, pagamentosCalculados, dados);

    return resultadoFinal;
}