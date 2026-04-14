// Pagamento devido

function arredondarParaDuasCasas(valor) {
    return Math.round(valor * 100) / 100;
}

function gerarSecoesPagamentos(resultados, dados) {
    const resultadosParaUsar = resultados.saldosFinais 
        ? ajustarResultadosComPagamentos(resultados, dados) 
        : resultados;
    
    if (dados.tipoCalculo === 'acordo') {
        return gerarTabelaPagamentosAcordo(resultadosParaUsar, dados);
    }

    const temHerdeiros = resultadosParaUsar.temHerdeiros && resultadosParaUsar.herdeiros.length > 0;

    return temHerdeiros
        ? gerarPagamentosComHerdeiros(resultadosParaUsar, dados)
        : gerarPagamentosSemHerdeiros(resultadosParaUsar, dados);
}

function gerarTabelaPagamentosAcordo(resultados, dados) {
    if (dados.tipoCalculo !== 'acordo') return '';
    
    const adesoes = obterAdesaoAcordo();
    const percentualDesagio = dados.percentualAcordo || 0;
    const pagamentosAcordo = [];
    
    // 1. BENEFICIÁRIO PRINCIPAL
    if (adesoes.beneficiario && resultados.valorBeneficiarioFinal > 0) {
        pagamentosAcordo.push(
            criarPagamentoAcordo(
                `${dados.beneficiario} (Beneficiário)`,
                resultados.valorBeneficiarioAposCessoes,
                percentualDesagio,
                resultados.valorPrevidenciaBeneficiario,
                resultados.valorIRBeneficiario,
                resultados.rraComDesagio || resultados.rrapagamento
            )
        );
    }
    
    // 2. HERDEIROS QUE ADERIRAM
    if (resultados.temHerdeiros && adesoes.herdeiros.length > 0) {
        resultados.herdeiros.forEach((herdeiro, index) => {
            if (adesoes.herdeiros.includes(index) && herdeiro.valorLiquido > 0) {
                const valores = extrairValoresHerdeiro(herdeiro);
                
                pagamentosAcordo.push(
                    criarPagamentoAcordo(
                        `${herdeiro.nome} (Herdeiro)`,
                        valores.valorDevido,
                        percentualDesagio,
                        valores.previdencia,
                        valores.ir,
                        herdeiro.rraComDesagio || herdeiro.rrapagamento
                    )
                );
            }
        });
    }

    // 3. ADVOGADOS CONTRATUAIS QUE ADERIRAM
    if (adesoes.advogados.length > 0 && resultados.honorarios) {
        resultados.honorarios.forEach((advogado, index) => {
            if (adesoes.advogados.includes(index) && advogado.valorBrutoAdvogado > 0) {
                pagamentosAcordo.push(
                    criarPagamentoAcordo(
                        `${advogado.nome} (Adv. ${advogado.tipo})`,
                        advogado.valorBrutoAdvogado,
                        percentualDesagio,
                        0,
                        advogado.irAdvogado || 0,
                        '-'
                    )
                );
            }
        });
    }

    // 4. ADVOGADOS SUCUMBENCIAIS QUE ADERIRAM
    if (adesoes.advogadosSucumbenciais?.length > 0 && 
        resultados.honorariosSucumbenciais?.temHonorariosSucumbenciais) {
        
        resultados.honorariosSucumbenciais.honorarios.forEach((advogado, index) => {
            if (adesoes.advogadosSucumbenciais.includes(index) && advogado.valorBrutoAdvogado > 0) {
                pagamentosAcordo.push(
                    criarPagamentoAcordo(
                        `${advogado.nome} (Adv. Sucumb. ${advogado.tipo})`,
                        advogado.valorBrutoAdvogado,
                        percentualDesagio,
                        0,
                        advogado.irAdvogado || 0,
                        '-'
                    )
                );
            }
        });
    }
    
    // 5. SINDICATOS QUE ADERIRAM
    if (adesoes.sindicatos.length > 0 && resultados.sindicatos) {
        resultados.sindicatos.forEach((sindicato, index) => {
            if (adesoes.sindicatos.includes(index) && sindicato.valorBrutoSindicato > 0) {
                pagamentosAcordo.push(
                    criarPagamentoAcordo(
                        `${sindicato.nome} (Sindicato)`,
                        sindicato.valorBrutoSindicato,
                        percentualDesagio,
                        0,
                        sindicato.irSindicato || 0,
                        '-'
                    )
                );
            }
        });
    }
    
    // 6. CESSIONÁRIOS
    coletarCessionariosAcordo(adesoes, dados, resultados, percentualDesagio, pagamentosAcordo);

    if (pagamentosAcordo.length === 0) return '';

    return montarTabelasAcordo(pagamentosAcordo, percentualDesagio);
}

function gerarPagamentosComHerdeiros(resultados, dados) {
    const isPreferencia = dados.tipoCalculo === 'preferencia';
    const herdeirosParaPagar = isPreferencia 
        ? resultados.herdeiros.filter(h => h.temPreferencia || h.isPreferenciaParcial)
        : resultados.herdeiros;

    const herdeirosComPagamentos = herdeirosParaPagar.filter(h => 
        h.valorLiquido > 0 || (h.cessoesHerdeiro?.length > 0)
    );

    if (herdeirosComPagamentos.length === 0) return '';

    // Cessionários do beneficiário
    const secaoCessionariosBeneficiario = gerarSecaoCessionariosBeneficiario(resultados, dados);

    // Seções por herdeiro
    const secoesHerdeiros = herdeirosComPagamentos.map(herdeiro => 
        gerarTabelaHerdeiro(herdeiro, dados, isPreferencia, herdeirosComPagamentos.length)
    ).join('');

    // Honorários sucumbenciais
    const tabelaHonorariosSucumbenciais = gerarTabelaHonorariosSucumbenciais(resultados, dados);

    // Resumo geral
    const temHonorariosSucumbenciais = resultados.honorariosSucumbenciais?.honorarios?.some(adv => adv.temPreferencia) || false;
    const mostrarResumoGeral = herdeirosComPagamentos.length > 1 || temHonorariosSucumbenciais;

    let secaoResumoGeral = '';
    if (mostrarResumoGeral) {
        const todosPagamentos = coletarTodosPagamentos(resultados, dados);
        const totais = calcularTotaisUnificado(todosPagamentos);
        
        secaoResumoGeral = montarResumoGeral(totais);
    }

    return secaoCessionariosBeneficiario + secoesHerdeiros + tabelaHonorariosSucumbenciais + secaoResumoGeral;
}

function gerarTabelaHerdeiro(herdeiro, dados, isPreferencia, totalHerdeiros) {
    const pagamentosHerdeiro = [];

    // 1. O próprio herdeiro
    if (herdeiro.valorLiquido > 0) {
        const valores = extrairValoresHerdeiro(herdeiro);
        pagamentosHerdeiro.push({
            credor: `${herdeiro.nome} (Herdeiro)`,
            valorDevido: valores.valorDevido,
            previdencia: valores.previdencia,
            ir: valores.ir,
            valorLiquido: herdeiro.valorLiquido
        });
    }

    // 2. Cessionários do herdeiro (só em ordem cronológica)
    if (!isPreferencia && herdeiro.cessoesHerdeiro?.length > 0) {
        herdeiro.cessoesHerdeiro
            .filter(cessao => cessao.valorLiquido > 0)
            .forEach(cessao => {
                pagamentosHerdeiro.push({
                    credor: `${cessao.cessionario} (Cessionário de ${herdeiro.nome})`,
                    valorDevido: cessao.valorBruto,
                    previdencia: cessao.previdenciaCessao,
                    ir: cessao.irCessao,
                    valorLiquido: cessao.valorLiquido
                });
            });
    }

    // 3. Advogados e seus cessionários
    if (herdeiro.honorarios?.length > 0) {
        adicionarPagamentosAdvogados(
            herdeiro.honorarios, 
            pagamentosHerdeiro, 
            isPreferencia, 
            herdeiro
        );
    }

    // 4. Sindicatos e seus cessionários (não paga em preferência)
    const sindicatoNaoRecebe = isPreferencia && herdeiro.isPreferenciaParcial;
    if (!sindicatoNaoRecebe && herdeiro.sindicatos?.length > 0) {
        adicionarPagamentosSindicatos(herdeiro.sindicatos, pagamentosHerdeiro);
    }

    return montarTabelaHerdeiro(herdeiro, pagamentosHerdeiro, isPreferencia, totalHerdeiros);
}

function gerarPagamentosSemHerdeiros(resultados, dados) {
    const todosPagamentos = coletarTodosPagamentosSemHerdeiros(resultados, dados);

    if (todosPagamentos.length === 0) return '';

    const totais = calcularTotaisUnificado(todosPagamentos);
    
    return montarTabelaPagamentosSemHerdeiros(todosPagamentos, totais);
}

function coletarTodosPagamentos(resultados, dados) {
    const pagamentos = [];
    const isPreferencia = dados.tipoCalculo === 'preferencia';

    // Cessionários do beneficiário
    adicionarCessionariosBeneficiario(resultados, dados, pagamentos);

    // Herdeiros
    const herdeirosParaPagar = isPreferencia 
        ? resultados.herdeiros.filter(h => h.temPreferencia || h.isPreferenciaParcial)
        : resultados.herdeiros;

    herdeirosParaPagar
        .filter(h => h.valorLiquido > 0)
        .forEach(herdeiro => {
            const valores = extrairValoresHerdeiro(herdeiro);
            
            pagamentos.push({
                credor: `${herdeiro.nome} (Herdeiro)`,
                valorDevido: valores.valorDevido,
                previdencia: valores.previdencia,
                ir: valores.ir,
                valorLiquido: herdeiro.valorLiquido
            });

            // Cessionários dos herdeiros (só ordem)
            if (!isPreferencia && herdeiro.cessoesHerdeiro?.length > 0) {
                adicionarCessoesHerdeiro(herdeiro, pagamentos);
            }

            // Advogados e seus cessionários
            if (herdeiro.honorarios) {
                adicionarPagamentosAdvogados(herdeiro.honorarios, pagamentos, isPreferencia, herdeiro);
            }

            // Sindicatos e seus cessionários
            if (!isPreferencia && herdeiro.sindicatos) {
                adicionarPagamentosSindicatos(herdeiro.sindicatos, pagamentos);
            }
        });

    // Honorários sucumbenciais
    if (resultados.honorariosSucumbenciais?.temHonorariosSucumbenciais) {
        resultados.honorariosSucumbenciais.honorarios.forEach(adv => {
            if (adv.valorBrutoAdvogado > 0) {
                pagamentos.push({
                    credor: `${adv.nome} (Adv. Sucumbencial ${adv.tipo})`,
                    valorDevido: adv.valorBrutoAdvogado,
                    previdencia: 0,
                    ir: adv.irAdvogado || 0,
                    valorLiquido: adv.valorLiquidoAdvogado || 0
                });
            }
        });
    }

    return pagamentos;
}

function coletarTodosPagamentosSemHerdeiros(resultados, dados) {
    const pagamentos = [];

    // Beneficiário
    if (resultados.valorBeneficiarioFinal > 0) {
        pagamentos.push({
            credor: `${dados.beneficiario} (Beneficiário)`,
            valorDevido: resultados.valorBeneficiarioAposCessoes,
            previdencia: resultados.valorPrevidenciaBeneficiario,
            ir: resultados.valorIRBeneficiario,
            valorLiquido: resultados.valorBeneficiarioFinal
        });
    }

    // Cessionários do Beneficiário
    adicionarCessionariosBeneficiario(resultados, dados, pagamentos);

    // Sindicatos
    adicionarSindicatosBeneficiario(resultados, pagamentos);

    // Advogados
    adicionarAdvogadosBeneficiario(resultados, pagamentos);

    // Cessionários de Advogados
    const isPreferenciaParcial = dados.tipoCalculo === 'preferencia' && resultados.valorBase < resultados.valortotatt;
    if (!isPreferenciaParcial) {
        adicionarCessionariosAdvogadosBeneficiario(resultados, dados, pagamentos);
    }

    // Honorários Sucumbenciais
    adicionarHonorariosSucumbenciaisSemHerdeiros(resultados, dados, pagamentos);

    return pagamentos;
}

function calcularTotalDevido(pagamentos) {
    return pagamentos.reduce((total, p) => total + arredondarParaDuasCasas(p.valorDevido), 0);
}

function calcularTotalPrevidencia(pagamentos) {
    return pagamentos.reduce((total, p) => total + arredondarParaDuasCasas(p.previdencia), 0);
}

function calcularTotalIR(pagamentos) {
    return pagamentos.reduce((total, p) => total + arredondarParaDuasCasas(p.ir), 0);
}

function calcularTotalLiquido(pagamentos) {
    return pagamentos.reduce((total, p) => {
        const valorDevidoArredondado = arredondarParaDuasCasas(p.valorDevido);
        const previdenciaArredondada = arredondarParaDuasCasas(p.previdencia);
        const irArredondado = arredondarParaDuasCasas(p.ir);
        const valorLiquidoCalculado = arredondarParaDuasCasas(valorDevidoArredondado - previdenciaArredondada - irArredondado);
        return total + valorLiquidoCalculado;
    }, 0);
}

// ============================================================================
// FUNÇÕES AUXILIARES DE PAGAMENTO
// ============================================================================

function criarPagamentoAcordo(credor, valorDevido, percentualDesagio, previdencia, ir, rra) {
    const valorDevidoArr = arredondarParaDuasCasas(valorDevido);
    const valorDesagio = arredondarParaDuasCasas(valorDevidoArr * percentualDesagio);
    const valorAposDesagio = arredondarParaDuasCasas(valorDevidoArr - valorDesagio);
    const previdenciaArr = arredondarParaDuasCasas(previdencia);
    const irArr = arredondarParaDuasCasas(ir);
    
    return {
        credor,
        valorDevido: valorDevidoArr,
        valorDesagio,
        valorAposDesagio,
        previdencia: previdenciaArr,
        ir: irArr,
        valorLiquido: arredondarParaDuasCasas(valorAposDesagio - previdenciaArr - irArr),
        rra
    };
}

function extrairValoresHerdeiro(herdeiro) {
    const temCessoes = herdeiro.cessoesHerdeiro?.length > 0;
    
    return {
        valorDevido: temCessoes ? herdeiro.valorFinalAposCessoes : herdeiro.valorBruto,
        previdencia: temCessoes ? herdeiro.valorPrevidenciaFinal : herdeiro.valorPrevidencia,
        ir: temCessoes ? herdeiro.valorIRFinal : herdeiro.valorIR
    };
}

function verificarRecebimentoSucumbencial(adv, isPreferencia) {
    const deveReceberAdvogado = !isPreferencia || adv.temPreferencia;
    
    let deveReceberCessionarios = true;
    if (isPreferencia) {
        if (!adv.temPreferencia || adv.foiLimitadoPorPreferencia) {
            deveReceberCessionarios = false;
        }
    }
    
    return { deveReceberAdvogado, deveReceberCessionarios };
}

function coletarCessionariosAcordo(adesoes, dados, resultados, percentualDesagio, pagamentosAcordo) {
    if (!adesoes.cessionarios?.length) return;

    adesoes.cessionarios.forEach(cessaoIndex => {
        const cessao = dados.cessoes[cessaoIndex];
        if (!cessao) return;

        // Cessionários do beneficiário
        if (cessao.tipo === 'cessaobenPrincipal') {
            adicionarCessionarioBeneficiarioAcordo(cessao, dados, resultados, percentualDesagio, pagamentosAcordo);
        }

        // Cessionários de herdeiros
        if (cessao.tipo === 'cessaoherdeiro') {
            adicionarCessionarioHerdeiroAcordo(cessao, resultados, percentualDesagio, pagamentosAcordo);
        }

        // Cessionários de advogados
        if (cessao.tipo === 'cessaoAdv') {
            adicionarCessionarioAdvogadoAcordo(cessao, resultados, percentualDesagio, pagamentosAcordo);
        }

        // Cessionários de advogados sucumbenciais
        if (cessao.tipo === 'cessaoAdvSuc') {
            adicionarCessionarioAdvSucAcordo(cessao, resultados, percentualDesagio, pagamentosAcordo);
        }

        // Cessionários de sindicatos
        if (cessao.tipo === 'cessaoSindicato') {
            adicionarCessionarioSindicatoAcordo(cessao, resultados, percentualDesagio, pagamentosAcordo);
        }
    });
}

function adicionarCessionarioBeneficiarioAcordo(cessao, dados, resultados, percentualDesagio, pagamentosAcordo) {
    if (!resultados.cessoesBeneficiarioFinais) return;
    
    const cessionarioData = resultados.cessoesBeneficiarioFinais.find(c => c.cessionario === cessao.cessionario);
    if (cessionarioData?.valorLiquido > 0) {
        pagamentosAcordo.push(
            criarPagamentoAcordo(
                `${cessao.cessionario} (Cess. de ${dados.beneficiario})`,
                cessionarioData.valorBruto,
                percentualDesagio,
                cessionarioData.previdenciaCessao,
                cessionarioData.irCessao,
                resultados.rraComDesagio || resultados.rrapagamento
            )
        );
    }
}

function adicionarCessionarioHerdeiroAcordo(cessao, resultados, percentualDesagio, pagamentosAcordo) {
    if (!resultados.temHerdeiros) return;
    
    const herdeiro = resultados.herdeiros.find(h => h.nome === cessao.cedente);
    if (herdeiro?.cessoesHerdeiro) {
        const cessionarioData = herdeiro.cessoesHerdeiro.find(c => c.cessionario === cessao.cessionario);
        if (cessionarioData?.valorLiquido > 0) {
            pagamentosAcordo.push(
                criarPagamentoAcordo(
                    `${cessao.cessionario} (Cess. de ${herdeiro.nome})`,
                    cessionarioData.valorBruto,
                    percentualDesagio,
                    cessionarioData.previdenciaCessao,
                    cessionarioData.irCessao,
                    herdeiro.rraComDesagio || herdeiro.rrapagamento
                )
            );
        }
    }
}

function adicionarCessionarioAdvogadoAcordo(cessao, resultados, percentualDesagio, pagamentosAcordo) {
    // Tentar nos advogados do beneficiário
    if (resultados.honorarios) {
        const advogado = resultados.honorarios.find(adv => adv.nome === cessao.cedente);
        if (advogado?.cessionarios) {
            const cessionarioData = advogado.cessionarios.find(c => c.nome === cessao.cessionario);
            if (cessionarioData?.valorLiquido > 0) {
                pagamentosAcordo.push(
                    criarPagamentoAcordo(
                        `${cessao.cessionario} (Cess. de ${cessao.cedente})`,
                        cessionarioData.valorBruto,
                        percentualDesagio,
                        0,
                        cessionarioData.ir,
                        '-'
                    )
                );
                return;
            }
        }
    }

    // Tentar nos advogados dos herdeiros
    if (resultados.temHerdeiros) {
        for (const herdeiro of resultados.herdeiros) {
            if (herdeiro.honorarios) {
                const advogado = herdeiro.honorarios.find(adv => adv.nome === cessao.cedente);
                if (advogado?.cessionarios) {
                    const cessionarioData = advogado.cessionarios.find(c => c.nome === cessao.cessionario);
                    if (cessionarioData?.valorLiquido > 0) {
                        pagamentosAcordo.push(
                            criarPagamentoAcordo(
                                `${cessao.cessionario} (Cess. de ${cessao.cedente})`,
                                cessionarioData.valorBruto,
                                percentualDesagio,
                                0,
                                cessionarioData.ir,
                                '-'
                            )
                        );
                        return;
                    }
                }
            }
        }
    }
}

function adicionarCessionarioAdvSucAcordo(cessao, resultados, percentualDesagio, pagamentosAcordo) {
    if (!resultados.honorariosSucumbenciais?.honorarios) return;
    
    const advogado = resultados.honorariosSucumbenciais.honorarios.find(adv => adv.nome === cessao.cedente);
    if (advogado?.cessionarios) {
        const cessionarioData = advogado.cessionarios.find(c => c.nome === cessao.cessionario);
        if (cessionarioData?.valorLiquido > 0) {
            pagamentosAcordo.push(
                criarPagamentoAcordo(
                    `${cessao.cessionario} (Cess. Adv. Sucumb. ${cessao.cedente})`,
                    cessionarioData.valorBruto,
                    percentualDesagio,
                    0,
                    cessionarioData.ir,
                    '-'
                )
            );
        }
    }
}

function adicionarCessionarioSindicatoAcordo(cessao, resultados, percentualDesagio, pagamentosAcordo) {
    // Tentar nos sindicatos do beneficiário
    if (resultados.sindicatos) {
        const sindicato = resultados.sindicatos.find(sind => sind.nome === cessao.cedente);
        if (sindicato?.cessionarios) {
            const cessionarioData = sindicato.cessionarios.find(c => c.nome === cessao.cessionario);
            if (cessionarioData?.valorLiquido > 0) {
                pagamentosAcordo.push(
                    criarPagamentoAcordo(
                        `${cessao.cessionario} (Cess. de ${cessao.cedente})`,
                        cessionarioData.valorBruto,
                        percentualDesagio,
                        0,
                        cessionarioData.ir,
                        '-'
                    )
                );
                return;
            }
        }
    }

    // Tentar nos sindicatos dos herdeiros
    if (resultados.temHerdeiros) {
        for (const herdeiro of resultados.herdeiros) {
            if (herdeiro.sindicatos) {
                const sindicato = herdeiro.sindicatos.find(sind => sind.nome === cessao.cedente);
                if (sindicato?.cessionarios) {
                    const cessionarioData = sindicato.cessionarios.find(c => c.nome === cessao.cessionario);
                    if (cessionarioData?.valorLiquido > 0) {
                        pagamentosAcordo.push(
                            criarPagamentoAcordo(
                                `${cessao.cessionario} (Cess. de ${cessao.cedente})`,
                                cessionarioData.valorBruto,
                                percentualDesagio,
                                0,
                                cessionarioData.ir,
                                '-'
                            )
                        );
                        return;
                    }
                }
            }
        }
    }
}

function adicionarPagamentosAdvogados(advogados, pagamentos, isPreferencia, entidadePai) {
    advogados.forEach(adv => {
        const devePagar = !isPreferencia || entidadePai.temPreferencia || entidadePai.isPreferenciaParcial;
        
        if (devePagar && adv.valorBrutoAdvogado > 0) {
            pagamentos.push({
                credor: `${adv.nome} (Advogado ${adv.tipo})`,
                valorDevido: adv.valorBrutoAdvogado,
                previdencia: 0,
                ir: adv.irAdvogado || 0,
                valorLiquido: adv.valorLiquidoAdvogado
            });

            // Cessionários do advogado
            const cessionariosRecebem = !isPreferencia || 
                (entidadePai.temPreferencia && !entidadePai.isPreferenciaParcial);
            
            if (cessionariosRecebem && adv.cessionarios?.length > 0) {
                adv.cessionarios.forEach(cessionario => {
                    pagamentos.push({
                        credor: `${cessionario.nome} (Cessionário de ${adv.nome})`,
                        valorDevido: cessionario.valorBruto,
                        previdencia: 0,
                        ir: cessionario.ir || 0,
                        valorLiquido: cessionario.valorLiquido
                    });
                });
            }
        }
    });
}

function adicionarPagamentosSindicatos(sindicatos, pagamentos) {
    sindicatos.forEach(sind => {
        const temCessionarios = sind.cessionarios?.length > 0;

        if (!temCessionarios && sind.valorBrutoSindicato > 0) {
            pagamentos.push({
                credor: `${sind.nome} (Sindicato)`,
                valorDevido: sind.valorBrutoSindicato,
                previdencia: 0,
                ir: sind.irSindicato || 0,
                valorLiquido: sind.valorLiquidoSindicato
            });
        } else if (temCessionarios) {
            if (sind.valorBrutoSindicato > 0) {
                pagamentos.push({
                    credor: `${sind.nome} (Sindicato)`,
                    valorDevido: sind.valorBrutoSindicato,
                    previdencia: 0,
                    ir: sind.irSindicato || 0,
                    valorLiquido: sind.valorLiquidoSindicato
                });
            }

            sind.cessionarios.forEach(cessionario => {
                if (cessionario.valorBruto > 0) {
                    pagamentos.push({
                        credor: `${cessionario.nome} (Cessionário de ${sind.nome})`,
                        valorDevido: cessionario.valorBruto,
                        previdencia: 0,
                        ir: cessionario.ir || 0,
                        valorLiquido: cessionario.valorLiquido
                    });
                }
            });
        }
    });
}

function adicionarCessionariosBeneficiario(resultados, dados, pagamentos) {
    if (resultados.cessoesBeneficiarioFinais) {
        resultados.cessoesBeneficiarioFinais
            .filter(cessao => cessao.valorLiquido > 0)
            .forEach(cessao => {
                pagamentos.push({
                    credor: `${cessao.cessionario} (Cessionário de ${dados.beneficiario})`,
                    valorDevido: cessao.valorBruto,
                    previdencia: cessao.previdenciaCessao,
                    ir: cessao.irCessao,
                    valorLiquido: cessao.valorLiquido
                });
            });
    }
}

function adicionarCessoesHerdeiro(herdeiro, pagamentos) {
    herdeiro.cessoesHerdeiro
        .filter(cessao => cessao.valorLiquido > 0)
        .forEach(cessao => {
            pagamentos.push({
                credor: `${cessao.cessionario} (Cessionário de ${herdeiro.nome})`,
                valorDevido: cessao.valorBruto,
                previdencia: cessao.previdenciaCessao,
                ir: cessao.irCessao,
                valorLiquido: cessao.valorLiquido
            });
        });
}

function adicionarSindicatosBeneficiario(resultados, pagamentos) {
    if (resultados.sindicatos) {
        resultados.sindicatos
            .filter(sind => {
                const valorDevido = (sind.cessoesSind?.length > 0) 
                    ? sind.valorBrutoSindicato 
                    : sind.valorBruto;
                return sind.podeReceber && valorDevido > 0;
            })
            .forEach(sind => {
                const valorDevido = (sind.cessoesSind?.length > 0) 
                    ? sind.valorBrutoSindicato 
                    : sind.valorBruto;
                const ir = (sind.cessoesSind?.length > 0)
                    ? sind.irSindicato
                    : sind.irSindicato || 0;

                pagamentos.push({
                    credor: `${sind.nome} (Sindicato)`,
                    valorDevido: valorDevido,
                    previdencia: 0,
                    ir: ir,
                    valorLiquido: (sind.cessoesSind?.length > 0) 
                        ? sind.valorLiquidoSindicato 
                        : sind.valorLiquido
                });
            });

        // Cessionários de Sindicatos
        resultados.sindicatos.forEach(sind => {
            if (sind.cessionarios?.length > 0 && sind.podeReceber) {
                sind.cessionarios.forEach(cessionario => {
                    pagamentos.push({
                        credor: `${cessionario.nome} (Cessionário de ${sind.nome})`,
                        valorDevido: cessionario.valorBruto,
                        previdencia: 0,
                        ir: cessionario.ir,
                        valorLiquido: cessionario.valorLiquido
                    });
                });
            }
        });
    }
}

function adicionarAdvogadosBeneficiario(resultados, pagamentos) {
    const advogadosParaPagar = resultados.honorarios.filter(adv => 
        adv.percentualAdvogado > 0 && adv.valorBrutoAdvogado > 0
    );

    advogadosParaPagar.forEach(adv => {
        pagamentos.push({
            credor: `${adv.nome} (Advogado ${adv.tipo})`,
            valorDevido: adv.valorBrutoAdvogado,
            previdencia: 0,
            ir: adv.irAdvogado,
            valorLiquido: adv.valorLiquidoAdvogado
        });
    });
}

function adicionarCessionariosAdvogadosBeneficiario(resultados, dados, pagamentos) {
    const isParcial = dados.tipoCalculo === 'parcial';

    if (isParcial) {
        resultados.honorarios.forEach(adv => {
            if (adv.cessionarios?.length > 0) {
                adv.cessionarios.forEach(cessionario => {
                    const honorarioParcial = resultados.valorBase * adv.percentual;
                    const valorDevido = honorarioParcial * cessionario.percentual;
                    
                    let irCorreto = 0;
                    if (adv.tipo === 'PF') {
                        irCorreto = calcularIR(valorDevido); 
                    } else {
                        irCorreto = valorDevido * 0.015;
                    }
                    
                    pagamentos.push({
                        credor: `${cessionario.nome} (Cessionário de ${adv.nome})`,
                        valorDevido: valorDevido,
                        previdencia: 0,
                        ir: irCorreto,
                        valorLiquido: valorDevido - irCorreto
                    });
                });
            }
        });
    } else {
        resultados.honorarios.forEach(adv => {
            if (adv.cessionarios?.length > 0) {
                adv.cessionarios.forEach(cessionario => {
                    pagamentos.push({
                        credor: `${cessionario.nome} (Cessionário de ${adv.nome})`,
                        valorDevido: cessionario.valorBruto,
                        previdencia: 0,
                        ir: cessionario.ir,
                        valorLiquido: cessionario.valorLiquido
                    });
                });
            }
        });
    }
}

function adicionarHonorariosSucumbenciaisSemHerdeiros(resultados, dados, pagamentos) {
    if (!resultados.honorariosSucumbenciais?.temHonorariosSucumbenciais || 
        !resultados.honorariosSucumbenciais?.honorarios?.length) {
        return;
    }

    const isPreferencia = dados.tipoCalculo === 'preferencia';

    resultados.honorariosSucumbenciais.honorarios.forEach(adv => {
        const { deveReceberAdvogado, deveReceberCessionarios } = verificarRecebimentoSucumbencial(adv, isPreferencia);
        
        if (deveReceberAdvogado && adv.valorBrutoAdvogado > 0) {
            pagamentos.push({
                credor: `${adv.nome} (Adv. Sucumbencial ${adv.tipo})`,
                valorDevido: adv.valorBrutoAdvogado,
                previdencia: 0,
                ir: adv.irAdvogado || 0,
                valorLiquido: adv.valorLiquidoAdvogado || 0
            });
        }

        if (deveReceberCessionarios && adv.cessionarios?.length > 0) {
            adv.cessionarios.forEach(cessionario => {
                if (cessionario.valorLiquido > 0) {
                    pagamentos.push({
                        credor: `${cessionario.nome} (Cessionário de ${adv.nome})`,
                        valorDevido: cessionario.valorBruto,
                        previdencia: 0,
                        ir: cessionario.ir || 0,
                        valorLiquido: cessionario.valorLiquido
                    });
                }
            });
        }
    });
}

function calcularTotaisUnificado(pagamentos) {
    return {
        totalDevido: calcularTotalDevido(pagamentos),
        totalPrevidencia: calcularTotalPrevidencia(pagamentos),
        totalIR: calcularTotalIR(pagamentos),
        totalLiquido: calcularTotalLiquido(pagamentos)
    };
}

function gerarSecaoCessionariosBeneficiario(resultados, dados) {
    if (!resultados.cessoesBeneficiarioFinais?.length) return '';

    const cessionariosBeneficiario = resultados.cessoesBeneficiarioFinais.filter(cessao => cessao.valorLiquido > 0);
    if (cessionariosBeneficiario.length === 0) return '';

    const linhasCessionarios = cessionariosBeneficiario.map(cessao => {
        const valorDevidoArredondado = arredondarParaDuasCasas(cessao.valorBruto);
        const previdenciaArredondada = arredondarParaDuasCasas(cessao.previdenciaCessao);
        const irArredondado = arredondarParaDuasCasas(cessao.irCessao);
        const valorLiquidoCalculado = arredondarParaDuasCasas(valorDevidoArredondado - previdenciaArredondada - irArredondado);

        return `
            <tr>
                <td>${cessao.cessionario} (Cessionário de ${dados.beneficiario})</td>
                <td>R$ ${formatarMoeda(valorDevidoArredondado)}</td>
                <td>R$ ${formatarMoeda(previdenciaArredondada)}</td>
                <td>R$ ${formatarMoeda(irArredondado)}</td>
                <td>R$ ${formatarMoeda(valorLiquidoCalculado)}</td>
            </tr>
        `;
    }).join('');

    const totalDevido = cessionariosBeneficiario.reduce((total, c) => total + arredondarParaDuasCasas(c.valorBruto), 0);
    const totalPrevidencia = cessionariosBeneficiario.reduce((total, c) => total + arredondarParaDuasCasas(c.previdenciaCessao), 0);
    const totalIR = cessionariosBeneficiario.reduce((total, c) => total + arredondarParaDuasCasas(c.irCessao), 0);
    const totalLiquido = cessionariosBeneficiario.reduce((total, c) => {
        const valorDevidoArr = arredondarParaDuasCasas(c.valorBruto);
        const previdenciaArr = arredondarParaDuasCasas(c.previdenciaCessao);
        const irArr = arredondarParaDuasCasas(c.irCessao);
        return total + arredondarParaDuasCasas(valorDevidoArr - previdenciaArr - irArr);
    }, 0);

    return `
        <div class="pagamentos-finais" style="margin-bottom: 20px;">
            <div class="table-container">
                <h3>📊 Cessionários do Beneficiário Principal</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Credor</th>
                            <th>Valor Devido</th>
                            <th>Previdência</th>
                            <th>Imposto de Renda</th>
                            <th>Valor Líquido</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${linhasCessionarios}
                    </tbody>
                    <tfoot>
                        <tr class="highlight">
                            <td><strong>TOTAL CESSIONÁRIOS</strong></td>
                            <td><strong>R$ ${formatarMoeda(totalDevido)}</strong></td>
                            <td><strong>R$ ${formatarMoeda(totalPrevidencia)}</strong></td>
                            <td><strong>R$ ${formatarMoeda(totalIR)}</strong></td>
                            <td><strong>R$ ${formatarMoeda(totalLiquido)}</strong></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    `;
}

function montarTabelaHerdeiro(herdeiro, pagamentosHerdeiro, isPreferencia, totalHerdeiros) {
    const linhas = pagamentosHerdeiro.map(pagamento => {
        const valorDevidoArredondado = arredondarParaDuasCasas(pagamento.valorDevido);
        const previdenciaArredondada = arredondarParaDuasCasas(pagamento.previdencia);
        const irArredondado = arredondarParaDuasCasas(pagamento.ir);
        const valorLiquidoCalculado = arredondarParaDuasCasas(valorDevidoArredondado - previdenciaArredondada - irArredondado);

        return `
            <tr>
                <td>${pagamento.credor}</td>
                <td>R$ ${formatarMoeda(valorDevidoArredondado)}</td>
                <td>R$ ${formatarMoeda(previdenciaArredondada)}</td>
                <td>R$ ${formatarMoeda(irArredondado)}</td>
                <td>R$ ${formatarMoeda(valorLiquidoCalculado)}</td>
            </tr>
        `;
    }).join('');

    const totais = calcularTotaisUnificado(pagamentosHerdeiro);
    
    const statusHerdeiro = isPreferencia 
        ? (herdeiro.isPreferenciaParcial ? ' (Preferência Parcial)' : ' (Preferência Total)') 
        : ' (Ordem Cronológica)';

    const notaTributacao = totalHerdeiros === 1 ? `
        <div style="margin-top: 15px; padding: 10px; background-color: #f9f9f9; border-radius: 5px;">
            <h4>📋 Notas sobre Tributação do Imposto de Renda:</h4>
            <p style="margin: 5px 0;"><strong>Advogados Pessoa Física (PF):</strong> 🏦 LEI Nª 15.270, DE 11 DE NOVEMBRO DE 2025</p>
            <p style="margin: 5px 0;"><strong>Advogados Pessoa Jurídica (PJ):</strong> 🏦 DECRETO 9.580, art 714</p>
        </div>
    ` : '';

    return `
        <div class="pagamentos-finais" style="margin-bottom: 20px;">
            <div class="table-container">
                <h3>📊 Pagamentos - ${herdeiro.nome}${statusHerdeiro}</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Credor</th>
                            <th>Valor Devido</th>
                            <th>Previdência</th>
                            <th>Imposto de Renda</th>
                            <th>Valor Líquido</th>
                        </tr>
                    </thead>
                    <tbody>${linhas}</tbody>
                    <tfoot>
                        <tr class="highlight">
                            <td><strong>TOTAL</strong></td>
                            <td><strong>R$ ${formatarMoeda(totais.totalDevido)}</strong></td>
                            <td><strong>R$ ${formatarMoeda(totais.totalPrevidencia)}</strong></td>
                            <td><strong>R$ ${formatarMoeda(totais.totalIR)}</strong></td>
                            <td><strong>R$ ${formatarMoeda(totais.totalLiquido)}</strong></td>
                        </tr>
                    </tfoot>
                </table>
                ${notaTributacao}
            </div>
        </div>
    `;
}

function montarTabelaHonorariosSucumbenciais(pagamentos) {
    const linhas = pagamentos.map(pagamento => `
        <tr>
            <td>${pagamento.credor}</td>
            <td>R$ ${formatarMoeda(pagamento.valorDevido)}</td>
            <td>R$ ${formatarMoeda(pagamento.previdencia)}</td>
            <td>R$ ${formatarMoeda(pagamento.ir)}</td>
            <td>R$ ${formatarMoeda(pagamento.valorLiquido)}</td>
        </tr>
    `).join('');

    const totais = calcularTotaisUnificado(pagamentos);

    return `
        <div class="pagamentos-finais" style="margin-bottom: 20px;">
            <div class="table-container">
                <h3>💼 Pagamentos - Honorários Sucumbenciais</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Credor</th>
                            <th>Valor Devido</th>
                            <th>Previdência</th>
                            <th>Imposto de Renda</th>
                            <th>Valor Líquido</th>
                        </tr>
                    </thead>
                    <tbody>${linhas}</tbody>
                    <tfoot>
                        <tr class="highlight">
                            <td><strong>Total Honorários Sucumbenciais</strong></td>
                            <td><strong>R$ ${formatarMoeda(totais.totalDevido)}</strong></td>
                            <td><strong>R$ ${formatarMoeda(totais.totalPrevidencia)}</strong></td>
                            <td><strong>R$ ${formatarMoeda(totais.totalIR)}</strong></td>
                            <td><strong>R$ ${formatarMoeda(totais.totalLiquido)}</strong></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    `;
}

function montarResumoGeral(totais) {
    return `
        <div class="pagamentos-finais" style="margin-top: 30px;">
            <div class="table-container">
                <h3>🎯 RESUMO GERAL DE TODOS OS PAGAMENTOS</h3>
                <table style="background-color: #f8f9fa;">
                    <thead>
                        <tr style="background-color: #e9ecef;">
                            <th>Total Geral</th>
                            <th>Valor Devido</th>
                            <th>Previdência</th>
                            <th>Imposto de Renda</th>
                            <th>Valor Líquido</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="highlight" style="font-weight: bold; font-size: 1.1em;">
                            <td><strong>TOTAL FINAL</strong></td>
                            <td><strong>R$ ${formatarMoeda(totais.totalDevido)}</strong></td>
                            <td><strong>R$ ${formatarMoeda(totais.totalPrevidencia)}</strong></td>
                            <td><strong>R$ ${formatarMoeda(totais.totalIR)}</strong></td>
                            <td><strong>R$ ${formatarMoeda(totais.totalLiquido)}</strong></td>
                        </tr>
                    </tbody>
                </table>
                <div style="margin-top: 15px; padding: 10px; background-color: #f9f9f9; border-radius: 5px;">
                    <h4>📋 Notas sobre Tributação do Imposto de Renda:</h4>
                    <p style="margin: 5px 0;"><strong>Advogados Pessoa Física (PF):</strong> 🏦 LEI Nª 15.270, DE 11 DE NOVEMBRO DE 2025</p>
                    <p style="margin: 5px 0;"><strong>Advogados Pessoa Jurídica (PJ):</strong> 🏦 DECRETO 9.580, art 714</p>
                    <p style="margin: 5px 0;"><strong>Sindicatos:</strong> Tributação conforme Art. 27, da Lei nº 10.833/03 ou alíquota fixa quando aplicável</p>
                </div>
            </div>
        </div>
    `;
}

function montarTabelasAcordo(pagamentosAcordo, percentualDesagio) {
    const linhasCalculo = pagamentosAcordo.map(p => `
        <tr>
            <td>${p.credor}</td>
            <td>R$ ${formatarMoeda(p.valorDevido)}</td>
            <td>R$ ${formatarMoeda(p.valorDesagio)}</td>
            <td>R$ ${formatarMoeda(p.valorAposDesagio)}</td>
        </tr>
    `).join('');

    const linhasPagamento = pagamentosAcordo.map(p => `
        <tr>
            <td>${p.credor}</td>
            <td>R$ ${formatarMoeda(p.valorAposDesagio)}</td>
            <td>R$ ${formatarMoeda(p.previdencia)}</td>
            <td>R$ ${formatarMoeda(p.ir)}</td>
            <td>R$ ${formatarMoeda(p.valorLiquido)}</td>
            <td>${p.rra}</td>
        </tr>
    `).join('');

    const totais = {
        valorDevido: pagamentosAcordo.reduce((sum, p) => sum + p.valorDevido, 0),
        valorDesagio: pagamentosAcordo.reduce((sum, p) => sum + p.valorDesagio, 0),
        valorAposDesagio: pagamentosAcordo.reduce((sum, p) => sum + p.valorAposDesagio, 0),
        previdencia: pagamentosAcordo.reduce((sum, p) => sum + p.previdencia, 0),
        ir: pagamentosAcordo.reduce((sum, p) => sum + p.ir, 0),
        valorLiquido: pagamentosAcordo.reduce((sum, p) => sum + p.valorLiquido, 0)
    };

    return `
        <!-- 1ª TABELA: Cálculo do Deságio -->
        <div class="table-container">
            <h3>📊 Cálculo do Deságio ${(percentualDesagio * 100).toFixed(2)}%</h3>
            <table>
                <thead>
                    <tr>
                        <th>Credor</th>
                        <th>Valor Devido</th>
                        <th>Deságio ${(percentualDesagio * 100).toFixed(2)}%</th>
                        <th>Valor Após Deságio</th>
                    </tr>
                </thead>
                <tbody>${linhasCalculo}</tbody>
                <tfoot>
                    <tr class="highlight">
                        <td><strong>TOTAL</strong></td>
                        <td><strong>R$ ${formatarMoeda(totais.valorDevido)}</strong></td>
                        <td><strong>R$ ${formatarMoeda(totais.valorDesagio)}</strong></td>
                        <td><strong>R$ ${formatarMoeda(totais.valorAposDesagio)}</strong></td>
                    </tr>
                </tfoot>
            </table>
        </div>
        <div class="pagamentos-acordo">
            <!-- 2ª TABELA: Valores Finais para Pagamento -->
            <div class="table-container">
                <h3>💰 Pagamento do Acordo</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Credor</th>
                            <th>Valor Base</th>
                            <th>Previdência</th>
                            <th>IR</th>
                            <th>Valor Líquido</th>
                            <th>RRA</th>
                        </tr>
                    </thead>
                    <tbody>${linhasPagamento}</tbody>
                    <tfoot>
                        <tr class="highlight">
                            <td><strong>TOTAL</strong></td>
                            <td><strong>R$ ${formatarMoeda(totais.valorAposDesagio)}</strong></td>
                            <td><strong>R$ ${formatarMoeda(totais.previdencia)}</strong></td>
                            <td><strong>R$ ${formatarMoeda(totais.ir)}</strong></td>
                            <td><strong>R$ ${formatarMoeda(totais.valorLiquido)}</strong></td>
                            <td><strong>-</strong></td>
                        </tr>
                    </tfoot>
                </table>
                <div style="margin-top: 15px; padding: 10px; background-color: #fff3cd; border-radius: 5px; border-left: 4px solid #ffc107;">
                    <h4>⚖️ Informações do Acordo:</h4>
                    <p style="margin: 5px 0;"><strong>Deságio aplicado:</strong> ${(percentualDesagio * 100).toFixed(2)}% sobre o valor devido</p>
                    <p style="margin: 5px 0;"><strong>Tributos calculados:</strong> Sobre o valor após deságio</p>
                    <p style="margin: 5px 0;"><strong>Apenas credores que aderiram</strong> ao acordo aparecem nesta tabela</p>
                </div>
            </div>
        </div>
    `;
}

function montarTabelaPagamentosSemHerdeiros(todosPagamentos, totais) {
    const linhas = todosPagamentos.map(pagamento => {
        const valorDevidoArredondado = arredondarParaDuasCasas(pagamento.valorDevido);
        const previdenciaArredondada = arredondarParaDuasCasas(pagamento.previdencia);
        const irArredondado = arredondarParaDuasCasas(pagamento.ir);
        const valorLiquidoCalculado = arredondarParaDuasCasas(valorDevidoArredondado - previdenciaArredondada - irArredondado);
        
        return `
            <tr>
                <td>${pagamento.credor}</td>
                <td>R$ ${formatarMoeda(valorDevidoArredondado)}</td>
                <td>R$ ${formatarMoeda(previdenciaArredondada)}</td>
                <td>R$ ${formatarMoeda(irArredondado)}</td>
                <td>R$ ${formatarMoeda(valorLiquidoCalculado)}</td>
            </tr>
        `;
    }).join('');

    return `
        <div class="pagamentos-finais">
            <div class="table-container">
                <h3>💰 Resumo de Pagamentos</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Credor</th>
                            <th>Valor Devido</th>
                            <th>Previdência</th>
                            <th>Imposto de Renda</th>
                            <th>Valor Líquido</th>
                        </tr>
                    </thead>
                    <tbody>${linhas}</tbody>
                    <tfoot>
                        <tr class="highlight">
                            <td><strong>TOTAL</strong></td>
                            <td><strong>R$ ${formatarMoeda(totais.totalDevido)}</strong></td>
                            <td><strong>R$ ${formatarMoeda(totais.totalPrevidencia)}</strong></td>
                            <td><strong>R$ ${formatarMoeda(totais.totalIR)}</strong></td>
                            <td><strong>R$ ${formatarMoeda(totais.totalLiquido)}</strong></td>
                        </tr>
                    </tfoot>
                </table>
                <div style="margin-top: 15px; padding: 10px; background-color: #f9f9f9; border-radius: 5px;">
                    <h4>📋 Notas sobre Tributação do Imposto de Renda:</h4>
                    <p style="margin: 5px 0;"><strong>Advogados Pessoa Física (PF):</strong> 🏦 LEI Nª 15.270, DE 11 DE NOVEMBRO DE 2025</p>
                    <p style="margin: 5px 0;"><strong>Advogados Pessoa Jurídica (PJ):</strong> 🏦 DECRETO 9.580, art 714</p>
                    <p style="margin: 5px 0;"><strong>Sindicatos:</strong> Tributação conforme Art. 27, da Lei nº 10.833/03 ou alíquota fixa quando aplicável</p>
                </div>
            </div>
        </div>
    `;
}
