// ====================================
// CALCULAR PAGAMENTOS 
// ====================================

async function calcularPagamentos(dados) {
    if (!dados.pagamentos || dados.pagamentos.length === 0) return [];
    
    const pagamentosCalculados = [];
    const dataPEC = new Date('2025-08-01');
    
    for (let i = 0; i < dados.pagamentos.length; i++) {
        const pagamento = dados.pagamentos[i];
        
        try {
            if (pagamento.tipoInformacao === 'total') {
                const componentes = await calcularComponentesPagamentoTotal(dados, pagamento);
                if (!componentes) {
                    console.error(`❌ Erro ao calcular componentes do pagamento ${i + 1}`);
                    continue;
                }
                Object.assign(pagamento, componentes);
            }
            
            const dataPagamento = new Date(pagamento.dataBase);
            const isPagamentoPosPEC = dataPagamento >= dataPEC;
            
            console.log(`\n🔄 ========================================`);
            console.log(`   ATUALIZANDO PAGAMENTO ${i + 1}`);
            console.log('========================================');
            console.log(`📅 Data do pagamento: ${pagamento.dataBase}`);
            console.log(`📊 Valores NA DATA DO PAGAMENTO:`);
            console.log(`   Principal: R$ ${pagamento.valorPrincipal.toFixed(2)}`);
            console.log(`   Juros: R$ ${pagamento.valorJuros.toFixed(2)}`);
            console.log(`   SELIC: R$ ${(pagamento.valorSelic || 0).toFixed(2)}`);
            console.log(`   Total: R$ ${(pagamento.valorPrincipal + pagamento.valorJuros + (pagamento.valorSelic || 0)).toFixed(2)}`);
            console.log('');
            
            const [ano, mes] = pagamento.dataBase.split('-');
            const mesesNomes = ['', 'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 
                            'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
            const baseData = {
                mesBase: mesesNomes[parseInt(mes)],
                anoBase: parseInt(ano)
            };
            
            if (isPagamentoPosPEC && pagamento.valorSelic > 0) {
                console.log(`🟢 PAGAMENTO PÓS-PEC - Aplicando índices do período`);
                
                const indicesPosPEC = await calcularIndicesPosPEC(
                    pagamento.dataBase,
                    dados.anoOrcamento
                );
                
                console.log(`   IPCA (${pagamento.dataBase} → hoje): ${indicesPosPEC.ipca.toFixed(6)}`);
                console.log(`   Juros 2% a.a. (${indicesPosPEC.mesesForaGraca} meses fora da graça): ${((indicesPosPEC.juros2aa - 1) * 100).toFixed(4)}%`);
                console.log('');
                
                const principalAtualizado = pagamento.valorPrincipal * indicesPosPEC.ipca;
                const novosJuros2aa = principalAtualizado * (indicesPosPEC.juros2aa - 1);
                const jurosOriginaisAtualizado = pagamento.valorJuros * indicesPosPEC.ipca;
                const jurosAtualizado = jurosOriginaisAtualizado + novosJuros2aa;
                const selicAtualizada = pagamento.valorSelic * indicesPosPEC.ipca;
                
                const totalAtualizado = principalAtualizado + jurosAtualizado + selicAtualizada;
                
                console.log(`✅ VALORES ATUALIZADOS (hoje):`);
                console.log(`   Principal: R$ ${principalAtualizado.toFixed(2)}`);
                console.log(`   Juros originais: R$ ${jurosOriginaisAtualizado.toFixed(2)}`);
                console.log(`   Novos juros 2%: R$ ${novosJuros2aa.toFixed(2)}`);
                console.log(`   Juros total: R$ ${jurosAtualizado.toFixed(2)}`);
                console.log(`   SELIC: R$ ${selicAtualizada.toFixed(2)}`);
                console.log(`   TOTAL: R$ ${totalAtualizado.toFixed(2)}`);
                console.log('========================================\n');

                pagamentosCalculados.push({
                    beneficiario: pagamento.beneficiario,
                    dataBase: pagamento.dataBase,
                    valorOriginal: {
                        principal: pagamento.valorPrincipal,
                        juros: pagamento.valorJuros,
                        selic: pagamento.valorSelic,
                        total: pagamento.valorPrincipal + pagamento.valorJuros + pagamento.valorSelic
                    },
                    valorAtualizado: {
                        principal: principalAtualizado,
                        juros: jurosAtualizado,
                        selic: selicAtualizada,
                        total: totalAtualizado
                    },
                    principalTributacao: principalAtualizado,
                    jurosTributacao: jurosAtualizado,
                    valorSelicSeparado: selicAtualizada,
                    indices: {
                        ipca: indicesPosPEC.ipca,
                        juros2AA: indicesPosPEC.juros2aa - 1,
                        mesesForaGraca: indicesPosPEC.mesesForaGraca
                    }
                });
                
            } else {
                console.log(`🔵 PAGAMENTO PRÉ-PEC - Aplicando todos os índices`);
                
                const configIndices = {
                    aplicarCNJ: true,
                    aplicarSelic: true,
                    aplicarIpcaE: true,
                    aplicarJurosMora: true,
                    aplicarIpca: true,
                    tipoSelic: 'valor',
                    valorSelic: pagamento.valorSelic || 0,
                    percentualSelic: 0,
                    selicReferencia: 'mesAnterior'
                };
                
                const calculo = await calcularIndicesEValores(
                    baseData,
                    dados,
                    pagamento.valorPrincipal,
                    pagamento.valorJuros,
                    configIndices
                );
                
                const totalAtualizado = calculo.valorPrincipalAtualizado + 
                                    calculo.valorJurosAtualizado + 
                                    (calculo.valorSelicSeparado || 0);
                
                console.log(`✅ VALORES ATUALIZADOS (hoje):`);
                console.log(`   Principal: R$ ${calculo.valorPrincipalAtualizado.toFixed(2)}`);
                console.log(`   Juros: R$ ${calculo.valorJurosAtualizado.toFixed(2)}`);
                console.log(`   SELIC: R$ ${(calculo.valorSelicSeparado || 0).toFixed(2)}`);
                console.log(`   TOTAL: R$ ${totalAtualizado.toFixed(2)}`);
                console.log('========================================\n');

                pagamentosCalculados.push({
                    beneficiario: pagamento.beneficiario,
                    dataBase: pagamento.dataBase,
                    valorOriginal: {
                        principal: pagamento.valorPrincipal,
                        juros: pagamento.valorJuros,
                        selic: pagamento.valorSelic || 0,
                        total: pagamento.valorPrincipal + pagamento.valorJuros + (pagamento.valorSelic || 0)
                    },
                    valorAtualizado: {
                        principal: calculo.valorPrincipalAtualizado,
                        juros: calculo.valorJurosAtualizado,
                        selic: calculo.valorSelicSeparado || 0,
                        total: totalAtualizado
                    },
                    principalTributacao: calculo.principalTributacao,
                    jurosTributacao: calculo.jurosTributacao,
                    valorSelicSeparado: calculo.valorSelicSeparado || 0,
                    indices: calculo.indices,
                    jurosMoraCalculado: calculo.jurosMoraCalculado,
                    selicReferencia: pagamento.selicReferencia,
                    tipoSelic: pagamento.tipoSelic
                });
            }
            
        } catch (error) {
            console.error(`❌ Erro ao calcular pagamento ${i + 1}:`, error);
        }
    }
    
    return pagamentosCalculados;
}

async function calcularIpcaPagamento(dataPagamento) {
    try {
        // Data final = último dia do mês anterior ao mês atual
        const dataAtualizacaoInput = document.getElementById("dataatualizacao").value;
        const [ano, mes, dia] = dataAtualizacaoInput.split('-');
        const dataReferencia = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));

        const primeiroDiaMesAtual = new Date(dataReferencia.getFullYear(), dataReferencia.getMonth(), 1);
        const ultimoDiaMesAnterior = new Date(primeiroDiaMesAtual - 1);
        const dataFinalFormatada = ultimoDiaMesAnterior.toLocaleDateString('pt-BR');
        
        // ✅ Data inicial = primeiro dia do mês do pagamento
        const dataPag = new Date(dataPagamento);
        const primeiroDiaMesPagamento = new Date(dataPag.getFullYear(), dataPag.getMonth(), 1);
        const dataInicialFormatada = primeiroDiaMesPagamento.toLocaleDateString('pt-BR');
        
        console.log(`📅 Buscando IPCA:`);
        console.log(`   De: ${dataInicialFormatada}`);
        console.log(`   Até: ${dataFinalFormatada}`);
        
        // ✅ Série 433 = IPCA
        const urlipca = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados?formato=json&dataInicial=${dataInicialFormatada}&dataFinal=${dataFinalFormatada}`;
        
        const response = await fetch(urlipca);
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        const dadosipca = await response.json();
        
        if (!dadosipca || dadosipca.length === 0) {
            console.log(`⚠️ Nenhum dado IPCA encontrado`);
            return { indiceipca: 1.0, quantidadeMeses: 0, temDados: false };
        }
        
        // Calcular índice acumulado
        let indiceipca = 1.0;
        dadosipca.forEach(item => {
            const valor = parseFloat(item.valor.replace(',', '.'));
            indiceipca *= 1 + (valor / 100);
        });
        
        // ✅ Calcular meses REAIS entre data pagamento e data atualização
        const anoIni = dataPag.getFullYear();
        const mesIni = dataPag.getMonth(); // 0-indexed
        
        const anoFim = dataReferencia.getFullYear();
        const mesFim = dataReferencia.getMonth();
        
        const mesesTotal = (anoFim * 12 + mesFim) - (anoIni * 12 + mesIni);
        const quantidadeMeses = Math.max(0, mesesTotal);
        
        console.log(`   Dados IPCA encontrados: ${dadosipca.length}`);
        console.log(`   Meses calculados: ${quantidadeMeses}`);
        console.log(`   Índice IPCA: ${indiceipca.toFixed(6)}`);
        
        return {
            indiceipca,
            quantidadeMeses,
            temDados: dadosipca.length > 0
        };
        
    } catch (error) {
        console.error(`❌ Erro ao obter IPCA: ${error}`);
        return { indiceipca: 1.0, quantidadeMeses: 0, temDados: false };
    }
}

// ✅ Função auxiliar para calcular índices pós-PEC
async function calcularIndicesPosPEC(dataPagamento, anoOrcamento) {
    console.log(`📅 calcularIndicesPosPEC:`);
    console.log(`   Data pagamento: ${dataPagamento}`);
    
    // ✅ Usar nova função que calcula IPCA da data do pagamento até hoje
    const { fimGraca } = calcularPeriodoGraca(anoOrcamento);
    const dataPag = new Date(dataPagamento);

    const dadosIpca = await calcularIpcaPagamento(dataPagamento);
    
    const mesesForaGraca = calcularMesesForaGraca(dataPag, fimGraca, dadosIpca.quantidadeMeses);
    const juros2aaDecimal = calcularJuros2PorcentoAA(mesesForaGraca);
    
    console.log(`   Meses totais: ${dadosIpca.quantidadeMeses}`);
    console.log(`   Meses fora da graça: ${mesesForaGraca}`);
    console.log(`   IPCA: ${dadosIpca.indiceipca.toFixed(6)}`);
    console.log(`   Juros 2% (${mesesForaGraca} meses): ${(juros2aaDecimal * 100).toFixed(4)}%`);
    
    return {
        ipca: dadosIpca.indiceipca,
        juros2aa: 1 + juros2aaDecimal,
        meses: dadosIpca.quantidadeMeses,
        mesesForaGraca
    };
}

function calcularMesesForaGraca(dataPagamento, fimGraca, totalMeses) {
    const dataAtualizacaoInput = document.getElementById("dataatualizacao").value;
    const [ano, mes, dia] = dataAtualizacaoInput.split('-');
    const dataAtualizacao = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
    
    // Se fimGraca já passou antes do pagamento, todos os meses são fora da graça
    if (fimGraca < dataPagamento) return totalMeses;
    
    // Se fimGraca é após a data de atualização, nenhum mês é fora da graça
    if (fimGraca >= dataAtualizacao) return 0;
    
    // fimGraca está entre dataPagamento e dataAtualizacao
    const mesesForaGraca = (dataAtualizacao.getFullYear() * 12 + dataAtualizacao.getMonth()) -
                           (fimGraca.getFullYear() * 12 + fimGraca.getMonth()) - 1;
    return Math.max(0, mesesForaGraca);
}

async function calcularComponentesPagamentoTotal(dados, pagamento) {
    const campoData = document.getElementById("dataatualizacao");
    if (!campoData) {
        console.error("❌ Campo 'dataatualizacao' não encontrado!");
        return null;
    }
    
    const dataOriginal = campoData.value;
    
    try {
        console.log('\n🔍 ========================================');
        console.log(`   DECOMPOSIÇÃO DO PAGAMENTO TOTAL`);
        console.log('========================================');
        console.log(`📅 Data do pagamento: ${pagamento.dataBase}`);
        console.log(`💰 Valor total pago: R$ ${pagamento.valorTotal.toFixed(2)}`);
        console.log('');
        
        campoData.value = pagamento.dataBase;
        
        let valorPrincipalAtualizado = 0;
        let valorJurosAtualizado = 0;
        let valorSelicSeparadaAtualizado = 0;
        let percentualSelicAcumulado = 0;
        
        console.log(`⏳ Calculando valores até ${pagamento.dataBase}...`);
        
        for (const item of dados.valoresPrincipais) {
            try {
                const itemCalculado = await calcularItemPrincipal(item, dados);
                valorPrincipalAtualizado += itemCalculado.valorAtualizado.principal;
                valorJurosAtualizado += itemCalculado.valorAtualizado.juros;

                const valorSelicItem = itemCalculado.valorSelicSeparado || 0;
                if (valorSelicItem > 0) {
                    valorSelicSeparadaAtualizado += valorSelicItem;
                }

                if (item.indices.selic && itemCalculado.indices.selic) {
                    percentualSelicAcumulado = itemCalculado.indices.selic - 1;
                }
            } catch (error) {
                console.error(`⚠️ Erro ao calcular item ${item.id}:`, error.message);
            }
        }
        
        if (valorPrincipalAtualizado === 0 && valorJurosAtualizado === 0) {
            console.error("❌ Nenhum item foi calculado com sucesso!");
            return null;
        }
        
        console.log('');
        console.log('📊 TOTAIS NA DATA DO PAGAMENTO:');
        console.log(`   Principal: R$ ${valorPrincipalAtualizado.toFixed(2)}`);
        console.log(`   Juros: R$ ${valorJurosAtualizado.toFixed(2)}`);
        console.log(`   SELIC separada: R$ ${valorSelicSeparadaAtualizado.toFixed(2)}`);
        
        const temSelicSeparada = valorSelicSeparadaAtualizado > 0;
        
        if (temSelicSeparada) {
            // ==========================================
            // SELIC JÁ SEPARADA (pós-PEC)
            // ==========================================
            console.log('');
            console.log('✅ SELIC JÁ SEPARADA (pós-PEC)');
            
            const totalAtualizado = valorPrincipalAtualizado + valorJurosAtualizado + valorSelicSeparadaAtualizado;
            
            const proporcaoPrincipal = valorPrincipalAtualizado / totalAtualizado;
            const proporcaoJuros = valorJurosAtualizado / totalAtualizado;
            const proporcaoSelic = valorSelicSeparadaAtualizado / totalAtualizado;
            
            const principalPago = pagamento.valorTotal * proporcaoPrincipal;
            const jurosPago = pagamento.valorTotal * proporcaoJuros;
            const selicPaga = pagamento.valorTotal * proporcaoSelic;
            
            console.log('');
            console.log(`🎯 DECOMPOSIÇÃO (proporções: ${(proporcaoPrincipal*100).toFixed(2)}% / ${(proporcaoJuros*100).toFixed(2)}% / ${(proporcaoSelic*100).toFixed(2)}%):`);
            console.log(`   Principal: R$ ${principalPago.toFixed(2)}`);
            console.log(`   Juros: R$ ${jurosPago.toFixed(2)}`);
            console.log(`   SELIC: R$ ${selicPaga.toFixed(2)}`);
            console.log('========================================\n');
            
            return {
                valorPrincipal: principalPago,
                valorJuros: jurosPago,
                tipoSelic: 'valor',   
                valorSelic: selicPaga,
                percentualSelic: 0,
                selicReferencia: 'mesAnterior'
            };
        } else {
            // ==========================================
            // SELIC INCORPORADA (pré-PEC)
            // ==========================================
            console.log('');
            console.log('✅ SELIC INCORPORADA (pré-PEC)');
            
            const totalComSelic = valorPrincipalAtualizado + valorJurosAtualizado;
            const indiceSelic = 1 + percentualSelicAcumulado;
            
            console.log(`   Índice SELIC acumulado: ${indiceSelic.toFixed(6)}`);
            console.log('');
            
            // ✅ Separar SELIC primeiro
            const principalBase = valorPrincipalAtualizado / indiceSelic;
            const selicDoPrincipal = valorPrincipalAtualizado - principalBase;
            
            const jurosBase = valorJurosAtualizado / indiceSelic;
            const selicDosJuros = valorJurosAtualizado - jurosBase;
            
            const selicTotal = selicDoPrincipal + selicDosJuros;
            const totalSeparado = principalBase + jurosBase + selicTotal;
            
            console.log(`🧮 SEPARANDO SELIC:`);
            console.log(`   Principal base: R$ ${principalBase.toFixed(2)}`);
            console.log(`   Juros base: R$ ${jurosBase.toFixed(2)}`);
            console.log(`   SELIC total: R$ ${selicTotal.toFixed(2)}`);
            console.log('');
            
            // ✅ Calcular proporções corretas
            const proporcaoPrincipal = principalBase / totalSeparado;
            const proporcaoJuros = jurosBase / totalSeparado;
            const proporcaoSelic = selicTotal / totalSeparado;
            
            const principalPago = pagamento.valorTotal * proporcaoPrincipal;
            const jurosPago = pagamento.valorTotal * proporcaoJuros;
            const selicPaga = pagamento.valorTotal * proporcaoSelic;
            
            console.log(`🎯 DECOMPOSIÇÃO (proporções: ${(proporcaoPrincipal*100).toFixed(2)}% / ${(proporcaoJuros*100).toFixed(2)}% / ${(proporcaoSelic*100).toFixed(2)}%):`);
            console.log(`   Principal: R$ ${principalPago.toFixed(2)}`);
            console.log(`   Juros: R$ ${jurosPago.toFixed(2)}`);
            console.log(`   SELIC: R$ ${selicPaga.toFixed(2)}`);
            console.log('========================================\n');
            
            return {
                valorPrincipal: principalPago,
                valorJuros: jurosPago,
                tipoSelic: 'valor',                    
                valorSelic: selicPaga,                 
                percentualSelic: 0,
                percentualSelicOriginal: percentualSelicAcumulado, 
                selicReferencia: 'mesAnterior'
            };
        }
        
    } catch (error) {
        console.error("❌ Erro em calcularComponentesPagamentoTotal:", error);
        return null;
    } finally {
        campoData.value = dataOriginal;
    }
}

// ====================================
// PAGAMENTOS - Ajustes 
// ====================================

function calcularSaldoFinalComPagamentos(resultados, pagamentosCalculados, dados) {
    if (!pagamentosCalculados?.length) return null;
    
    // 1. Mapear pagamentos por beneficiário
    const pagamentosPorBeneficiario = {};
    pagamentosCalculados.forEach(pag => {
        if (!pagamentosPorBeneficiario[pag.beneficiario]) {
            pagamentosPorBeneficiario[pag.beneficiario] = { totalPago: 0 };
        }
        pagamentosPorBeneficiario[pag.beneficiario].totalPago += pag.valorAtualizado.total;
    });
    // 2. Estrutura de saldos finais
    const saldosFinais = {
        beneficiarioPrincipal: null,
        advogados: [],
        advogadosSucumbenciais: [],
        sindicatos: [],
        herdeiros: [],
        cessionarios: [],
        totalGeralBruto: 0,
        totalGeralOriginal: 0
    };
    
    // 3. Identificar cessões de 100%
    const cessoes100 = identificarCessoes100(resultados);
    
    // 4. Calcular saldos de cada grupo
    calcularSaldosBeneficiarioOuHerdeiros(resultados, dados, pagamentosPorBeneficiario, saldosFinais);
    calcularSaldosAdvogados(resultados.honorarios, pagamentosPorBeneficiario, cessoes100.advogados, saldosFinais, 'advogados');
    calcularSaldosAdvogados(resultados.honorariosSucumbenciais?.honorarios, pagamentosPorBeneficiario, cessoes100.advogadosSucumbenciais, saldosFinais, 'advogadosSucumbenciais');
    calcularSaldosSindicatos(resultados, pagamentosPorBeneficiario, cessoes100.sindicatos, saldosFinais);
    calcularSaldosCessionarios(resultados, pagamentosPorBeneficiario, cessoes100, saldosFinais,dados);
    
    // 5. Calcular totais e tributos finais
    calcularTotaisETributos(resultados, dados, saldosFinais);
    
    return saldosFinais;
}

// ====================================
// FUNÇÕES AUXILIARES
// ====================================

function identificarCessoes100(resultados) {
    const cessoes100 = {
        advogados: {},
        advogadosSucumbenciais: {},
        sindicatos: {},
        beneficiarioPrincipal: false
    };
    
    // Advogados
    resultados.honorarios?.forEach(adv => {
        if (adv.cessionarios?.length > 0) {
            const percentualCedido = adv.cessionarios.reduce((sum, c) => sum + c.percentual, 0);
            if (percentualCedido >= 1.0) {
                cessoes100.advogados[adv.nome] = adv.cessionarios;
            }
        }
    });
    
    // Advogados Sucumbenciais
    resultados.honorariosSucumbenciais?.honorarios?.forEach(advSuc => {
        if (advSuc.cessionarios?.length > 0) {
            const percentualCedido = advSuc.cessionarios.reduce((sum, c) => sum + c.percentual, 0);
            if (percentualCedido >= 1.0) {
                cessoes100.advogadosSucumbenciais[advSuc.nome] = advSuc.cessionarios;
            }
        }
    });
    
    // Sindicatos
    resultados.sindicatos?.forEach(sind => {
        if (sind.cessionarios?.length > 0) {
            const percentualCedido = sind.cessionarios.reduce((sum, c) => sum + c.percentual, 0);
            if (percentualCedido >= 1.0) {
                cessoes100.sindicatos[sind.nome] = sind.cessionarios;
            }
        }
    });
    
    // Beneficiário Principal
    if (resultados.cessoesBeneficiarioFinais?.length > 0) {
        const percentualCedido = resultados.cessoesBeneficiarioFinais.reduce((sum, c) => sum + c.percentual, 0);
        cessoes100.beneficiarioPrincipal = percentualCedido >= 1.0;
    }
    
    return cessoes100;
}

function calcularSaldosBeneficiarioOuHerdeiros(resultados, dados, pagamentosPorBeneficiario, saldosFinais) {
    const nomeBeneficiario = dados.beneficiario;
    const pagamentoBeneficiario = pagamentosPorBeneficiario[nomeBeneficiario]?.totalPago || 0;
    
    if (resultados.temHerdeiros && resultados.herdeiros?.length > 0) {
        // COM HERDEIROS
        resultados.herdeiros.forEach(herdeiro => {
            const percentualCedido = herdeiro.cessoesHerdeiro?.reduce((sum, c) => sum + c.percentual, 0) || 0;
            const cedeu100 = percentualCedido >= 1.0;
            if (cedeu100) {
                return;
            }
            const pagamentoDireto = pagamentosPorBeneficiario[herdeiro.nome]?.totalPago || 0;
            const pagamentoDoBeneficiario = pagamentoBeneficiario * herdeiro.percentual;
            const totalPagamento = pagamentoDireto + pagamentoDoBeneficiario;
            
            const valorBruto = herdeiro.valorBruto || 0;
            const saldo = valorBruto - totalPagamento;
            
            saldosFinais.herdeiros.push({
                nome: herdeiro.nome,
                valorBruto,
                pagamento: totalPagamento,
                pagamentoDireto,
                pagamentoDoBeneficiario,
                saldo
            });
            
            saldosFinais.totalGeralBruto += saldo;
            saldosFinais.totalGeralOriginal += valorBruto;
        });
    } else {
        // SEM HERDEIROS
        if (resultados.valorBeneficiarioAposCessoes > 0) {
            const valorBruto = resultados.valorBeneficiarioAposCessoes;
            const saldo = valorBruto - pagamentoBeneficiario;
            
            saldosFinais.beneficiarioPrincipal = {
                nome: nomeBeneficiario,
                valorBruto,
                pagamento: pagamentoBeneficiario,
                saldo
            };
            
            saldosFinais.totalGeralBruto += saldo;
            saldosFinais.totalGeralOriginal += valorBruto;
        }
    }
}

function calcularSaldosAdvogados(advogados, pagamentosPorBeneficiario, cessoes100, saldosFinais, chave) {
    if (!advogados?.length) return;
    
    advogados.forEach(adv => {
        // Se cessão é 100%, não mostrar advogado
        if (cessoes100[adv.nome]) return;
        
        const pagamentoDireto = pagamentosPorBeneficiario[adv.nome]?.totalPago || 0;
        const valorBruto = adv.valorBrutoAdvogado || adv.valorBruto || 0;
        const saldo = valorBruto - pagamentoDireto;
        
        saldosFinais[chave].push({
            nome: adv.nome,
            tipo: adv.tipo,
            valorBruto,
            pagamento: pagamentoDireto,
            saldo
        });
        
        saldosFinais.totalGeralBruto += saldo;
        saldosFinais.totalGeralOriginal += valorBruto;
    });
}

function calcularSaldosSindicatos(resultados, pagamentosPorBeneficiario, cessoes100, saldosFinais) {
    if (!resultados.sindicatos?.length) return;
    
    resultados.sindicatos.forEach(sind => {
        // Se cessão é 100%, não mostrar sindicato
        if (cessoes100[sind.nome]) return;
        
        const pagamentoDireto = pagamentosPorBeneficiario[sind.nome]?.totalPago || 0;
        const valorBruto = sind.valorBrutoSindicato || 0;
        const saldo = valorBruto - pagamentoDireto;
        
        saldosFinais.sindicatos.push({
            nome: sind.nome,
            valorBruto,
            pagamento: pagamentoDireto,
            saldo
        });
        
        saldosFinais.totalGeralBruto += saldo;
        saldosFinais.totalGeralOriginal += valorBruto;
    });
}

function calcularSaldosCessionarios(resultados, pagamentosPorBeneficiario, cessoes100, saldosFinais,dados) {  
    const nomeBeneficiario = resultados.beneficiario || dados?.beneficiario || '';
    const pagamentoBeneficiario = pagamentosPorBeneficiario[nomeBeneficiario]?.totalPago || 0;
    
    // Cessionários do Beneficiário Principal
    if (resultados.cessoesBeneficiarioFinais?.length > 0) {
        resultados.cessoesBeneficiarioFinais.forEach(cess => {
            const pagamentoDireto = pagamentosPorBeneficiario[cess.cessionario]?.totalPago || 0;
            let pagamentoTotal = pagamentoDireto;
            
            if (cessoes100.beneficiarioPrincipal) {
                const pagamentoDoCedente = pagamentoBeneficiario * cess.percentual;  
                pagamentoTotal += pagamentoDoCedente;
            } 
            const valorBruto = cess.valorBruto || 0;
            const saldo = valorBruto - pagamentoTotal;
            
            saldosFinais.cessionarios.push({
                nome: cess.cessionario,
                tipo: 'Cessionário do Beneficiário',
                valorBruto,
                pagamento: pagamentoTotal,
                pagamentoDireto,
                saldo
            });
            
            saldosFinais.totalGeralBruto += saldo;
            saldosFinais.totalGeralOriginal += valorBruto;
        });
    }

    if (resultados.herdeiros?.length > 0) {                
        resultados.herdeiros.forEach(herdeiro => {
            if (herdeiro.cessoesHerdeiro?.length > 0) {  
                const pagamentoHerdeiro = pagamentosPorBeneficiario[herdeiro.nome]?.totalPago || 0;
                
                const percentualCedidoHerdeiro = herdeiro.cessoesHerdeiro.reduce((sum, c) => sum + c.percentual, 0); 
                const cedeu100 = percentualCedidoHerdeiro >= 1.0;
                
                const valorBrutoHerdeiro = herdeiro.valorBruto || 0;
                
                herdeiro.cessoesHerdeiro.forEach(cess => { 
                    const pagamentoDireto = pagamentosPorBeneficiario[cess.cessionario]?.totalPago || 0;
                    let pagamentoTotal = pagamentoDireto;
                    
                    let valorBruto = cess.valorBruto || 0;
                    
                    if (cedeu100) {
                        valorBruto = valorBrutoHerdeiro * cess.percentual;
                        const pagamentoDoHerdeiro = pagamentoHerdeiro * cess.percentual;
                        pagamentoTotal += pagamentoDoHerdeiro;
                    }

                    const saldo = valorBruto - pagamentoTotal;
                    
                    saldosFinais.cessionarios.push({
                        nome: cess.cessionario,
                        cedente: herdeiro.nome,
                        tipo: 'Cessionário de Herdeiro',
                        valorBruto,
                        pagamento: pagamentoTotal,
                        pagamentoDireto,  
                        saldo
                    });
                    
                    saldosFinais.totalGeralBruto += saldo;
                    saldosFinais.totalGeralOriginal += valorBruto;
                });
            } 
        });
    }
    
    // Cessionários de Advogados, Advogados Sucumbenciais e Sindicatos
    processarCessionariosDeCedentes(resultados.honorarios, pagamentosPorBeneficiario, cessoes100.advogados, saldosFinais, 'Cessionário de Advogado');
    processarCessionariosDeCedentes(resultados.honorariosSucumbenciais?.honorarios, pagamentosPorBeneficiario, cessoes100.advogadosSucumbenciais, saldosFinais, 'Cessionário de Adv. Sucumbencial');
    processarCessionariosDeCedentes(resultados.sindicatos, pagamentosPorBeneficiario, cessoes100.sindicatos, saldosFinais, 'Cessionário de Sindicato');
}

function processarCessionariosDeCedentes(cedentes, pagamentosPorBeneficiario, cessoes100, saldosFinais, tipoCessionario) {
    if (!cedentes?.length) return;
    
    cedentes.forEach(cedente => {
        if (!cedente.cessionarios?.length) return;
        
        const pagamentoCedente = pagamentosPorBeneficiario[cedente.nome]?.totalPago || 0;
        const cedeu100 = cessoes100[cedente.nome];
        
        cedente.cessionarios.forEach(cess => {
            const pagamentoDireto = pagamentosPorBeneficiario[cess.nome]?.totalPago || 0;
            let pagamentoTotal = pagamentoDireto;
            
            if (cedeu100) {
                pagamentoTotal += pagamentoCedente * cess.percentual;
            }
            
            const valorBruto = cess.valorBruto || 0;
            const saldo = valorBruto - pagamentoTotal;
            
            saldosFinais.cessionarios.push({
                nome: cess.nome,
                cedente: cedente.nome,
                tipo: tipoCessionario,
                valorBruto,
                pagamento: pagamentoTotal,
                pagamentoDireto,
                saldo
            });
            
            saldosFinais.totalGeralBruto += saldo;
            saldosFinais.totalGeralOriginal += valorBruto;
        });
    });
}

function calcularTotaisETributos(resultados, dados, saldosFinais) {
    let totalSemHonSuc = saldosFinais.totalGeralBruto;
    
    if (saldosFinais.advogadosSucumbenciais?.length > 0) {
        totalSemHonSuc -= saldosFinais.advogadosSucumbenciais.reduce((sum, adv) => sum + adv.saldo, 0);
    }
    
    if (saldosFinais.cessionarios?.length > 0) {
        totalSemHonSuc -= saldosFinais.cessionarios
            .filter(c => c.tipo === 'Cessionário de Adv. Sucumbencial')
            .reduce((sum, c) => sum + c.saldo, 0);
    }
    
    saldosFinais.totalSemHonorariosSucumbenciais = totalSemHonSuc;
    
    let totalOriginalSemHonSuc = saldosFinais.totalGeralOriginal;
    
    if (saldosFinais.advogadosSucumbenciais?.length > 0) {
        totalOriginalSemHonSuc -= saldosFinais.advogadosSucumbenciais.reduce((sum, adv) => sum + adv.valorBruto, 0);
    }
    
    if (saldosFinais.cessionarios?.length > 0) {
        totalOriginalSemHonSuc -= saldosFinais.cessionarios
            .filter(c => c.tipo === 'Cessionário de Adv. Sucumbencial')
            .reduce((sum, c) => sum + c.valorBruto, 0);
    }
    
    const principalOriginal = resultados.principal || (resultados.valortotatt * (resultados.percentualprinc || 0.5));
    const jurosOriginal = (resultados.valortotatt || 0) - principalOriginal;
    
    const valorPago = totalOriginalSemHonSuc - totalSemHonSuc;
    
    if (valorPago > 0 && totalOriginalSemHonSuc > 0) {
        const percentualPago = valorPago / totalOriginalSemHonSuc;
        const principalPago = principalOriginal * percentualPago;
        const jurosPago = jurosOriginal * percentualPago;
        
        saldosFinais.principalTotal = principalOriginal - principalPago;
        saldosFinais.jurosTotal = jurosOriginal - jurosPago;
    } else {
        saldosFinais.principalTotal = totalSemHonSuc * (resultados.percentualprinc || 0.5);
        saldosFinais.jurosTotal = totalSemHonSuc * (resultados.percentualjur || 0.5);
    }
    
    const rraOriginal = resultados.rrapagamento || resultados.rraTotal || 0;
    const proporcao = totalOriginalSemHonSuc > 0 ? (totalSemHonSuc / totalOriginalSemHonSuc) : 0;
    saldosFinais.rraOriginal = rraOriginal;
    saldosFinais.rraAjustado = rraOriginal > 0 ? Math.max(1, arredondarRRA(proporcao * rraOriginal)) : 0;
    
    // Previdência
    const resultadoPrev = calcularPrevidenciaIsolada(dados, saldosFinais.principalTotal, saldosFinais.rraAjustado);
    Object.assign(saldosFinais, {
        previdenciaTotal: resultadoPrev.valorPrevidencia,
        aliquotaEfetiva: resultadoPrev.aliquotaEfetiva,
        valorDesagioPrevidencia: resultadoPrev.valorDesagioPrevidencia,
        percentualDesagioPrevidencia: resultadoPrev.percentualDesagioPrevidencia
    });
    
    // IR
    const resultadoIR = calcularIRIsolado(dados, totalSemHonSuc, totalSemHonSuc, saldosFinais.principalTotal, saldosFinais.previdenciaTotal, saldosFinais.rraAjustado);
    Object.assign(saldosFinais, {
        irTotal: resultadoIR.valorIR,
        aliquotaIR: resultadoIR.aliquotaIR,
        baseIRHonora: resultadoIR.baseIRHonora,
        baseIRSindi: resultadoIR.baseIRSindi,
        baseIRPrev: resultadoIR.baseIRPrev,
        baseIRRRA: resultadoIR.baseIRRRA,
        valorIRUnitario: resultadoIR.valorIRUnitario,
        principalComDesagio: resultadoIR.principalComDesagio,
        percentualDesagioIR: resultadoIR.percentualDesagioIR,
        rraComDesagio: resultadoIR.rraComDesagio,
        descontoAdicional2026: resultadoIR.descontoAdicional2026,
        valorIRSemDesconto: resultadoIR.valorIRSemDesconto,
        descontoSimplificado: resultadoIR.descontoSimplificado,
        rendimentoMensal: resultadoIR.rendimentoMensal
    });
    
    saldosFinais.totalLiquido = totalSemHonSuc - saldosFinais.previdenciaTotal - saldosFinais.irTotal;
}

// ====================================
// AJUSTAR EXIBICAO COM PAGAMENTOS
// ====================================

function ajustarResultadosComPagamentos(resultados, dados) {
    if (!resultados.saldosFinais) return resultados;
    
    const saldos = resultados.saldosFinais;
    const resultadosAjustados = JSON.parse(JSON.stringify(resultados));
    
    if (saldos.totalGeralBruto <= 0) return resultadosAjustados;
    
    const totalParaCalculo = saldos.totalSemHonorariosSucumbenciais || saldos.totalGeralBruto;
    
    // Ajustar valores globais
    Object.assign(resultadosAjustados, {
        principal: saldos.principalTotal,
        valorBase: totalParaCalculo,
        valortotatt: totalParaCalculo,
        rrapagamento: saldos.rraAjustado || saldos.rraOriginal,
        valorPrevidencia: saldos.previdenciaTotal,
        aliquotaEfetiva: saldos.aliquotaEfetiva,
        valorDesagioPrevidencia: saldos.valorDesagioPrevidencia,
        percentualDesagioPrevidencia: saldos.percentualDesagioPrevidencia,
        valorIR: saldos.irTotal,
        aliquotaIR: saldos.aliquotaIR,
        baseIRHonora: saldos.baseIRHonora,
        baseIRSindi: saldos.baseIRSindi,
        baseIRPrev: saldos.baseIRPrev,
        baseIRRRA: saldos.baseIRRRA,
        valorIRUnitario: saldos.valorIRUnitario,
        principalComDesagio: saldos.principalComDesagio,
        percentualDesagioIR: saldos.percentualDesagioIR,
        rraComDesagio: saldos.rraComDesagio,
        descontoAdicional2026: saldos.descontoAdicional2026,
        valorIRSemDesconto: saldos.valorIRSemDesconto
    });
    
    // Ajustar Beneficiário Principal
    if (saldos.beneficiarioPrincipal?.saldo > 0) {
        resultadosAjustados.valorBeneficiarioAposCessoes = saldos.beneficiarioPrincipal.saldo;
        resultadosAjustados.valorPrevidenciaBeneficiario = saldos.previdenciaTotal;
        resultadosAjustados.valorIRBeneficiario = saldos.irTotal;
        resultadosAjustados.valorBeneficiarioFinal = saldos.beneficiarioPrincipal.saldo - 
            resultadosAjustados.valorPrevidenciaBeneficiario - resultadosAjustados.valorIRBeneficiario;
    }
    
    // Ajustar Advogados, Advogados Sucumbenciais, Sindicatos
    ajustarGrupoComIR(resultadosAjustados, 'honorarios', saldos.advogados, calcularIRAdvogado);
    ajustarGrupoComIR(resultadosAjustados.honorariosSucumbenciais, 'honorarios', saldos.advogadosSucumbenciais, calcularIRAdvogado);
    ajustarGrupoComIR(resultadosAjustados, 'sindicatos', saldos.sindicatos, calcularIRSindicato);
    
    // Ajustar Herdeiros
    ajustarHerdeiros(resultadosAjustados, saldos, dados, resultados);
    
    // Ajustar Cessionários
    ajustarCessionarios(resultadosAjustados, saldos, dados, resultados);
    
    return resultadosAjustados;
}

function calcularIRAdvogado(item, saldo) {
    if (!item.incidenciaIR || saldo <= 0) return 0;
    if (item.tipo !== 'PF') return saldo * 0.015;
    const irSemDesconto = calcularIR(saldo);
    const desconto = calcularDescontoAdicional2026(saldo, irSemDesconto);
    return Math.max(0, irSemDesconto - desconto);
}

function calcularIRSindicato(item, saldo) {
    if (!item.incidenciaIR) return 0; 

    if (item.tipoTributacao === 'pj') return saldo * 0.015;
    if (item.aliquotaFixaIR) return saldo * item.aliquotaFixaIR;

    return saldo * 0.015;
}

function ajustarGrupoComIR(container, chave, saldos, calcularIRFn) {
    if (!saldos?.length || !container?.[chave]) return;
    
    container[chave] = container[chave].map(item => {
        const saldo = saldos.find(s => s.nome === item.nome);
        if (!saldo || saldo.saldo <= 0) return item;
        
        const novoIR = calcularIRFn(item, saldo.saldo);
        
        return {
            ...item,
            valorBrutoAdvogado: saldo.saldo,
            valorBrutoSindicato: saldo.saldo,
            irAdvogado: novoIR,
            irSindicato: novoIR,
            valorLiquidoAdvogado: saldo.saldo - novoIR,
            valorLiquidoSindicato: saldo.saldo - novoIR
        };
    });
}

function ajustarHerdeiros(resultadosAjustados, saldos, dados, resultados) {
    if (!saldos.herdeiros?.length || !resultadosAjustados.herdeiros) return;
    
    const temIR = dados.valoresPrincipais?.some(item => item.tributacao?.ir);
    
    resultadosAjustados.herdeiros = resultadosAjustados.herdeiros.map((herd, index) => {
        const saldo = saldos.herdeiros[index];
        if (!saldo || saldo.saldo <= 0) return herd;
        
        const proporcao = saldo.saldo / saldo.valorBruto;
        const herdAjustado = {
            ...herd,
            principal: herd.principal * proporcao,
            valorTotal: saldo.saldo,
            valorBruto: saldo.saldo,
            valorLiquido: herd.valorLiquido ? herd.valorLiquido * proporcao : saldo.saldo
        };
        
        // Recalcular Previdência
        if (dados.valoresPrincipais?.some(item => item.tributacao?.previdencia)) {
            const resultadoPrev = calcularPrevidenciaIsolada(dados, herdAjustado.principal, herd.rrapagamento);
            Object.assign(herdAjustado, {
                valorPrevidencia: resultadoPrev.valorPrevidencia,
                aliquotaEfetiva: resultadoPrev.aliquotaEfetiva,
                valorDesagioPrevidencia: resultadoPrev.valorDesagioPrevidencia,
                percentualDesagioPrevidencia: resultadoPrev.percentualDesagioPrevidencia
            });
        }
        
        // Recalcular IR
        if (temIR && herd.rrapagamento !== 0) {
            const resultadoIR = calcularIRIsolado(dados, herdAjustado.valorTotal, herdAjustado.valorTotal, 
                herdAjustado.principal, herdAjustado.valorPrevidencia, herd.rrapagamento);
            Object.assign(herdAjustado, {
                valorIR: resultadoIR.valorIR,
                aliquotaIR: resultadoIR.aliquotaIR,
                baseIRHonora: resultadoIR.baseIRHonora,
                baseIRSindi: resultadoIR.baseIRSindi,
                baseIRPrev: resultadoIR.baseIRPrev,
                baseIRRRA: resultadoIR.baseIRRRA,
                valorIRUnitario: resultadoIR.valorIRUnitario,
                descontoAdicional2026: resultadoIR.descontoAdicional2026,  
                valorIRSemDesconto: resultadoIR.valorIRSemDesconto,
                descontoSimplificado: resultadoIR.descontoSimplificado,
                rendimentoMensal: resultadoIR.rendimentoMensal
            });
        }
        
        return herdAjustado;
    });
}

function ajustarCessionarios(resultadosAjustados, saldos, dados, resultados) {
    if (!saldos.cessionarios?.length) return;
    
    const temIR = dados.valoresPrincipais?.some(item => item.tributacao?.ir);
    
    // Cessionários do Beneficiário
    if (resultadosAjustados.cessoesBeneficiarioFinais) {
        resultadosAjustados.cessoesBeneficiarioFinais = ajustarCessionariosBeneficiario(
            resultadosAjustados.cessoesBeneficiarioFinais, 
            saldos.cessionarios, 
            dados, 
            resultados,
            temIR,
            saldos
        );
    }
    
    // Cessionários de outros grupos
    ajustarCessionariosDeGrupo(resultadosAjustados, 'honorarios', saldos.cessionarios, 'Advogado', calcularIRAdvogado, dados);
    ajustarCessionariosDeGrupo(resultadosAjustados.honorariosSucumbenciais, 'honorarios', saldos.cessionarios, 'Adv. Sucumbencial', calcularIRAdvogado, dados);
    ajustarCessionariosDeGrupo(resultadosAjustados, 'sindicatos', saldos.cessionarios, 'Sindicato', calcularIRSindicato, dados);
    ajustarCessionariosHerdeiros(resultadosAjustados, saldos.cessionarios, dados, temIR);
}

function ajustarCessionariosBeneficiario(cessionarios, saldosCessionarios, dados, resultados, temIR, saldos) {
    return cessionarios.map(cess => {
        const saldoCess = saldosCessionarios.find(c => 
            c.nome === cess.cessionario && c.tipo === 'Cessionário do Beneficiário'
        );
        
        if (!saldoCess || saldoCess.saldo <= 0) return cess;
        
        const percentualCessao = cess.percentual || 0;
        const cedeu100 = percentualCessao >= 1.0;
        
        let previdenciaCess, novoIR;
        
        if (cedeu100) {
            previdenciaCess = saldos.previdenciaTotal || resultados.valorPrevidencia || 0;  // ⬅️ USAR 'saldos'
    
            // IR também direto
            if (temIR) {
                novoIR = saldos.irTotal || resultados.valorIR || 0;
            } else {
                novoIR = 0;
            }
        } else {
            const valorBrutoBeneficiario = resultados.valorBeneficiarioBruto || resultados.valortotatt || 0;
            const principalBeneficiario = resultados.principal || 0;
            
            const proporcaoPrincipal = valorBrutoBeneficiario > 0 
                ? principalBeneficiario / valorBrutoBeneficiario 
                : 0.5;
            
            const principalCess = saldoCess.saldo * proporcaoPrincipal;
            const rraCess = saldos.rraAjustado || resultados.rrapagamento || 0;
            
            const resultadoPrev = calcularPrevidenciaIsolada(dados, principalCess, rraCess);
            previdenciaCess = resultadoPrev.valorPrevidencia;
            
            if (temIR && rraCess !== 0) {
                const resultadoIR = calcularIRIsolado(dados, saldoCess.saldo, saldoCess.saldo, 
                    principalCess, previdenciaCess, rraCess);
                novoIR = resultadoIR.valorIR;
            } else {
                novoIR = 0;
            }
        }
        
        return {
            ...cess,
            valorBruto: saldoCess.saldo,
            previdenciaCessao: previdenciaCess,
            irCessao: novoIR,
            valorLiquido: saldoCess.saldo - previdenciaCess - novoIR
        };
    });
}

function ajustarCessionariosDeGrupo(container, chave, saldosCessionarios, tipoGrupo, calcularIRFn, dados) {
    if (!container?.[chave]) return;

    const isAcordo = dados?.tipoCalculo === 'acordo';
    const percentualDesagio = dados?.percentualAcordo || 0;

    container[chave] = container[chave].map(item => {
        if (!item.cessionarios?.length) return item;

        return {
            ...item,
            cessionarios: item.cessionarios.map(cess => {
                const saldoCess = saldosCessionarios.find(c =>
                    c.nome === cess.nome && c.cedente === item.nome && c.tipo.includes(tipoGrupo)
                );

                if (!saldoCess || saldoCess.saldo <= 0) return cess;

                const valorParaIR = isAcordo
                    ? saldoCess.saldo * (1 - percentualDesagio)
                    : saldoCess.saldo;

                const novoIR = calcularIRFn(item, valorParaIR);

                return {
                    ...cess,
                    valorBruto: saldoCess.saldo,
                    ir: novoIR,
                    valorLiquido: saldoCess.saldo - novoIR
                };
            })
        };
    });
}

function ajustarCessionariosHerdeiros(resultadosAjustados, saldosCessionarios, dados, temIR) {
    if (!resultadosAjustados.herdeiros) return;
    
    resultadosAjustados.herdeiros = resultadosAjustados.herdeiros.map(herd => {
        if (!herd.cessoesHerdeiro?.length) return herd;
        
        return {
            ...herd,
            cessoesHerdeiro: herd.cessoesHerdeiro.map(cess => {
                const saldoCess = saldosCessionarios.find(c => 
                    c.nome === cess.cessionario && c.cedente === herd.nome && c.tipo === 'Cessionário de Herdeiro'
                );
                
                if (!saldoCess || saldoCess.saldo <= 0) return cess;
                
                const proporcaoPrincipal = herd.principal / herd.valorBruto;  
                const principalCess = saldoCess.saldo * proporcaoPrincipal;
                const rraCess = herd.rrapagamento || 0;
                
                const resultadoPrev = calcularPrevidenciaIsolada(dados, principalCess, rraCess);
                let novoIR = 0;
                
                if (temIR && rraCess !== 0) {
                    const resultadoIR = calcularIRIsolado(dados, saldoCess.saldo, saldoCess.saldo, 
                        principalCess, resultadoPrev.valorPrevidencia, rraCess);
                    novoIR = resultadoIR.valorIR;
                }
                
                return {
                    ...cess,
                    valorBruto: saldoCess.saldo,
                    previdenciaCessao: resultadoPrev.valorPrevidencia,
                    irCessao: novoIR,
                    valorLiquido: saldoCess.saldo - resultadoPrev.valorPrevidencia - novoIR
                };
            })
        };
    });
}