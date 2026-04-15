// Pagamentos

function gerarSecaoPagamentosOcorridos(resultados, dados) {
    if (!resultados.pagamentos || resultados.pagamentos.length === 0) {
        return '';
    }

    const pagamentosPorBeneficiario = agruparPagamentosPorBeneficiario(resultados.pagamentos);
    const cessionarios = obterTodosCessionarios(resultados);
    const htmlLinhas = gerarLinhasPagamentos(pagamentosPorBeneficiario, cessionarios, dados);

    return `
        <div class="deducoes-acessorias">
            <div class="table-container">
                <h3>💳 Pagamentos Ocorridos</h3>
                <table>
                    <tr>
                        <th>Beneficiário</th>
                        <th>Data do Pagamento</th>
                        <th>Valor Original Pago</th>
                        <th>Índices Aplicados</th>
                        <th>Valor Atualizado</th>
                    </tr>
                    ${htmlLinhas}
                </table>
            </div>
        </div>
    `;
}

// ========== FUNÇÕES AUXILIARES DE PAGAMENTOS==========

function agruparPagamentosPorBeneficiario(pagamentos) {
    const grupos = {};
    pagamentos.forEach(pag => {
        if (!grupos[pag.beneficiario]) {
            grupos[pag.beneficiario] = [];
        }
        grupos[pag.beneficiario].push(pag);
    });
    return grupos;
}

function obterTodosCessionarios(resultados) {
    const cessionarios = new Set();
    
    // Cessionários do Beneficiário
    resultados.cessoesBeneficiarioFinais?.forEach(c => cessionarios.add(c.cessionario));
    
    // Cessionários de Herdeiros
    resultados.herdeiros?.forEach(h => {
        h.cessoesHerdeiroFinais?.forEach(c => cessionarios.add(c.cessionario));
    });
    
    // Cessionários de Advogados
    resultados.honorarios?.forEach(adv => {
        adv.cessionarios?.forEach(c => cessionarios.add(c.nome));
    });
    
    // Cessionários de Advogados Sucumbenciais
    resultados.honorariosSucumbenciais?.honorarios?.forEach(adv => {
        adv.cessionarios?.forEach(c => cessionarios.add(c.nome));
    });
    
    // Cessionários de Sindicatos
    resultados.sindicatos?.forEach(sind => {
        sind.cessionarios?.forEach(c => cessionarios.add(c.nome));
    });
    
    return cessionarios;
}

function gerarLinhasPagamentos(pagamentosPorBeneficiario, cessionarios, dados) {
    let htmlLinhas = '';
    
    Object.keys(pagamentosPorBeneficiario).forEach(beneficiario => {
        // Não mostrar cessionários sem pagamento direto
        if (cessionarios.has(beneficiario) && pagamentosPorBeneficiario[beneficiario].length === 0) {
            return;
        }
        
        pagamentosPorBeneficiario[beneficiario].forEach(pag => {
            const dataFormatada = new Date(pag.dataBase + 'T00:00:00').toLocaleDateString('pt-BR');
            const pagamentoOriginal = dados.pagamentos.find(p => 
                p.beneficiario === pag.beneficiario && p.dataBase === pag.dataBase
            );
            
            const { valorTotal, detalhamentoGrid } = calcularValorOriginalComDetalhes(pag, pagamentoOriginal);
            const indicesTexto = formatarIndices(pag.indices);
            
            htmlLinhas += `
                <tr>
                    <td>${beneficiario}</td>
                    <td>${dataFormatada}</td>
                    <td>
                        <strong style="font-size: 1.05em;">R$ ${formatarMoeda(valorTotal)}</strong>
                        ${detalhamentoGrid}
                    </td>
                    <td>${indicesTexto}</td>
                    <td><strong>R$ ${formatarMoeda(pag.valorAtualizado.total)}</strong></td>
                </tr>
            `;
        });
    });
    
    return htmlLinhas;
}

function calcularValorOriginalComDetalhes(pag, pagamentoOriginal) {
    let valorTotal = pag.valorOriginal.principal + pag.valorOriginal.juros;
    
    let detalhamentoGrid = `
        <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px 12px; margin-top: 6px; font-size: 0.85em; color: #666;">
            <span>Principal:</span>
            <span style="text-align: right;">R$ ${formatarMoeda(pag.valorOriginal.principal)}</span>
            <span>Juros:</span>
            <span style="text-align: right;">R$ ${formatarMoeda(pag.valorOriginal.juros)}</span>
    `;
    
    if (pagamentoOriginal) {
        if (pagamentoOriginal.tipoSelic === 'valor' && pagamentoOriginal.valorSelic > 0) {
            const valorSelic = pagamentoOriginal.valorSelic;
            valorTotal += valorSelic;
            detalhamentoGrid += `
                <span>SELIC:</span>
                <span style="text-align: right;">R$ ${formatarMoeda(valorSelic)}</span>
            `;
        } else if (pagamentoOriginal.tipoSelic === 'percentual' && pagamentoOriginal.percentualSelic > 0) {
            const percentualSelic = pagamentoOriginal.percentualSelic;
            const valorSelic = (pag.valorOriginal.principal + pag.valorOriginal.juros) * percentualSelic;
            valorTotal += valorSelic;
            detalhamentoGrid += `
                <span>SELIC (${(percentualSelic * 100).toFixed(2)}%):</span>
                <span style="text-align: right;">R$ ${formatarMoeda(valorSelic)}</span>
            `;
        }
    }
    
    detalhamentoGrid += `</div>`;
    
    return { valorTotal, detalhamentoGrid };
}

function formatarIndices(indices) {
    const detalhes = [];
    
    if (indices.cnj && indices.cnj !== 1) {
        detalhes.push(`CNJ: ${indices.cnj.toFixed(6)}`);
    }
    
    if (indices.selic && indices.selic !== 1) {
        const percentualSelic = ((indices.selic - 1) * 100).toFixed(2);
        detalhes.push(`SELIC: ${percentualSelic}%`);
    }
    
    if (indices.ipcae && indices.ipcae !== 1) {
        detalhes.push(`IPCA - E: ${indices.ipcae.toFixed(6)}`);
    }
    
    if (indices.jurosMora && indices.jurosMora > 0) {
        const percentualMora = (indices.jurosMora * 100).toFixed(4);
        detalhes.push(`J.Mora: ${percentualMora}%`);
    }

    if (indices.ipca && indices.ipca !== 1) {
        detalhes.push(`IPCA: ${indices.ipca.toFixed(6)}`);
    }

    if (indices.juros2AA && indices.juros2AA > 0) {
        const percentualJuros = (indices.juros2AA * 100).toFixed(4);
        detalhes.push(`Juros 2%a.a.: ${percentualJuros}%`);
    }
    
    return detalhes.length > 0 ? detalhes.join(' | ') : 'Sem correção';
}

// SALDO REMANCESCENTE

function gerarDemonstrativoSaldoRemanescente(resultados) {
    if (!resultados.saldosFinais) return '';
    
    const saldos = resultados.saldosFinais;
    
    const linhas = [
        gerarLinhaBeneficiario(saldos.beneficiarioPrincipal),
        gerarLinhasHerdeiros(saldos.herdeiros),
        gerarLinhasSimples(saldos.advogados, 'Advogado'),
        gerarLinhasSimples(saldos.advogadosSucumbenciais, 'Adv. Sucumbencial'),
        gerarLinhasSimples(saldos.sindicatos, 'Sindicato'),
        gerarLinhasCessionarios(saldos.cessionarios)
    ].filter(Boolean).join('');
    
    const totaisComPagamento = calcularTotaisComPagamento(saldos);

    return `
        <div class="pagamentos-finais">
            <div class="table-container">
                <h3>📊 Demonstrativo do Saldo Remanescente</h3>
                <table>
                    <tr>
                        <th>Beneficiário</th>
                        <th>Valor Antes do Pagamento (Bruto)</th>
                        <th>(-) Valor Pago</th>
                        <th>Saldo Remanescente (Bruto)</th>
                    </tr>
                    ${linhas}
                    ${gerarLinhaTotal(totaisComPagamento)}
                </table>
                
                <div class="success-box" style="margin-top: 5px;margin-bottom: 5px; padding: 10px; border-radius: 4px;background-color:#fff3cd; color:#856404;">
                    <strong>⚠️ Observação:</strong> Os valores de IR e Previdência serão calculados sobre o saldo remanescente.
                </div>
            </div>
        </div>
    `;
}

// ========== FUNÇÕES AUXILIARES DE SALDO REMANESC==========

function calcularTotaisComPagamento(saldos) {
    let totalValorBruto = 0;
    let totalPagamento = 0;
    let totalSaldo = 0;
    
    // Beneficiário Principal 
    if (saldos.beneficiarioPrincipal && saldos.beneficiarioPrincipal.saldo > 0 && saldos.beneficiarioPrincipal.pagamento > 0) {
        totalValorBruto += saldos.beneficiarioPrincipal.valorBruto || 0;
        totalPagamento += saldos.beneficiarioPrincipal.pagamento || 0;
        totalSaldo += saldos.beneficiarioPrincipal.saldo || 0;
    }
    
    // Herdeiros 
    if (saldos.herdeiros?.length > 0) {
        saldos.herdeiros
            .filter(herd => herd.pagamento > 0 && (herd.pagamentoDireto > 0 || herd.pagamentoDoBeneficiario > 0))
            .forEach(herd => {
                totalValorBruto += herd.valorBruto || 0;
                totalPagamento += herd.pagamento || 0;
                totalSaldo += herd.saldo || 0;
            });
    }
    
    // Advogados 
    if (saldos.advogados?.length > 0) {
        saldos.advogados
            .filter(adv => adv.pagamento > 0)
            .forEach(adv => {
                totalValorBruto += adv.valorBruto || 0;
                totalPagamento += adv.pagamento || 0;
                totalSaldo += adv.saldo || 0;
            });
    }
    
    // Advogados Sucumbenciais 
    if (saldos.advogadosSucumbenciais?.length > 0) {
        saldos.advogadosSucumbenciais
            .filter(adv => adv.pagamento > 0)
            .forEach(adv => {
                totalValorBruto += adv.valorBruto || 0;
                totalPagamento += adv.pagamento || 0;
                totalSaldo += adv.saldo || 0;
            });
    }
    
    // Sindicatos 
    if (saldos.sindicatos?.length > 0) {
        saldos.sindicatos
            .filter(sind => sind.pagamento > 0)
            .forEach(sind => {
                totalValorBruto += sind.valorBruto || 0;
                totalPagamento += sind.pagamento || 0;
                totalSaldo += sind.saldo || 0;
            });
    }
    
    // Cessionários 
    if (saldos.cessionarios?.length > 0) {
        saldos.cessionarios
            .filter(cess => {
                if (cess.pagamento <= 0) return false;
                if (cess.hasOwnProperty('pagamentoDireto')) {
                    const pagamentoDoCedente = cess.pagamento - cess.pagamentoDireto;
                    return cess.pagamentoDireto > 0 || pagamentoDoCedente > 0;
                }
                return true;
            })
            .forEach(cess => {
                totalValorBruto += cess.valorBruto || 0;
                totalPagamento += cess.pagamento || 0;
                totalSaldo += cess.saldo || 0;
            });
    }
    
    return {
        totalValorBruto,
        totalPagamento,
        totalSaldo
    };
}

function gerarLinhaBeneficiario(benef) {
    if (!benef || benef.pagamento <= 0 || benef.saldo <= 0) return '';
    
    return `
        <tr>
            <td>${benef.nome} (Beneficiário Principal)</td>
            <td>R$ ${formatarMoeda(benef.valorBruto)}</td>
            <td>R$ ${formatarMoeda(benef.pagamento)}</td>
            <td><strong>R$ ${formatarMoeda(benef.saldo)}</strong></td>
        </tr>
    `;
}

function gerarLinhasHerdeiros(herdeiros) {
    if (!herdeiros || herdeiros.length === 0) return '';
    
    return herdeiros
        .filter(herd => {
            return herd.pagamento > 0 && (
                herd.pagamentoDireto > 0 || 
                herd.pagamentoDoBeneficiario > 0
            );
        })
        .map(herd => {
            const detalhesPagamento = (herd.pagamentoDoBeneficiario && herd.pagamentoDoBeneficiario > 0)
                ? `<br><small style="color: #666;">(Direto: R$ ${formatarMoeda(herd.pagamentoDireto || 0)} + Do Benef.: R$ ${formatarMoeda(herd.pagamentoDoBeneficiario)})</small>`
                : '';
            
            return `
                <tr>
                    <td>${herd.nome} (Herdeiro)</td>
                    <td>R$ ${formatarMoeda(herd.valorBruto)}</td>
                    <td>R$ ${formatarMoeda(herd.pagamento)}${detalhesPagamento}</td>
                    <td><strong>R$ ${formatarMoeda(herd.saldo)}</strong></td>
                </tr>
            `;
        }).join('');
}

function gerarLinhasSimples(lista, tipo) {
    if (!lista || lista.length === 0) return '';
    
    return lista
        .filter(item => item.pagamento > 0) 
        .map(item => {
            const rotulo = tipo === 'Advogado' || tipo === 'Adv. Sucumbencial'
                ? `${item.nome} (${tipo} ${item.tipo})`
                : `${item.nome} (${tipo})`;
            
            return `
                <tr>
                    <td>${rotulo}</td>
                    <td>R$ ${formatarMoeda(item.valorBruto)}</td>
                    <td>R$ ${formatarMoeda(item.pagamento)}</td>
                    <td><strong>R$ ${formatarMoeda(item.saldo)}</strong></td>
                </tr>
            `;
        }).join('');
}

function gerarLinhasCessionarios(cessionarios) {
    if (!cessionarios || cessionarios.length === 0) return '';
    
    return cessionarios
        .filter(cess => {
            if (cess.pagamento <= 0) return false;

            if (cess.hasOwnProperty('pagamentoDireto')) {
                const pagamentoDoCedente = cess.pagamento - cess.pagamentoDireto;
                return cess.pagamentoDireto > 0 || pagamentoDoCedente > 0;
            }
            
            return true;
        })
        .map(cess => {
            let detalhesPagamento = '';
            
            if (cess.hasOwnProperty('pagamentoDireto')) {
                const pagamentoDoCedente = cess.pagamento - cess.pagamentoDireto;
                if (pagamentoDoCedente > 0) {
                    detalhesPagamento = `<br><small style="color: #666;">(Direto: R$ ${formatarMoeda(cess.pagamentoDireto)} + Do Cedente: R$ ${formatarMoeda(pagamentoDoCedente)})</small>`;
                }
            }
            
            return `
                <tr>
                    <td>${cess.nome} (${cess.tipo})</td>
                    <td>R$ ${formatarMoeda(cess.valorBruto)}</td>
                    <td>R$ ${formatarMoeda(cess.pagamento)}${detalhesPagamento}</td>
                    <td><strong>R$ ${formatarMoeda(cess.saldo)}</strong></td>
                </tr>
            `;
        }).join('');
}

function gerarLinhaTotal(totais) {
    return `
        <tr class="highlight-green">
            <td><strong>TOTAL</strong></td>
            <td><strong>R$ ${formatarMoeda(totais.totalValorBruto)}</strong></td>
            <td><strong>R$ ${formatarMoeda(totais.totalPagamento)}</strong></td>
            <td><strong>R$ ${formatarMoeda(totais.totalSaldo)}</strong></td>
        </tr>
    `;
}