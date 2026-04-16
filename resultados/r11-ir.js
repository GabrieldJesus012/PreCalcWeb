function gerarDetalheIR(resultados, dados, temPrevidencia, temCessoes) {
    const isAcordo = dados.tipoCalculo === 'acordo';
    const percentualDesagio = dados.percentualAcordo || 0;

    let percentualTotalAdv = 0;
    let percentualTotalSind = 0;
    
    if (dados.tipoCalculo === 'preferencia') {
        percentualTotalAdv = dados.advogados.reduce((sum, adv) => sum + adv.percentual, 0);
        percentualTotalSind = 0;
    } else {
        percentualTotalAdv = dados.advogados.reduce((sum, adv) => sum + adv.percentual, 0);
        percentualTotalSind = dados.sindicatos.reduce((sum, sind) => sum + sind.percentual, 0);
    }

    let baseComDesagio = '';
    if (isAcordo && resultados.percentualDesagioIR > 0) {
        baseComDesagio = `
        <tr>
            <th>Rendimento Tributável após deságio ${(percentualDesagio * 100).toFixed(2)}%:</th>
            <td>R$ ${formatarMoeda(resultados.principalComDesagio)}</td>
        </tr>`;
    }

    const temIRParaDistribuir = temCessoes && (
        (resultados.valorIRBeneficiario > 0) ||
        (resultados.cessoesBeneficiarioFinais?.some(c => c.irCessao > 0))
    );

    const temDesconto2026 = resultados.descontoAdicional2026 && resultados.descontoAdicional2026 > 0;

    let secaoDesconto2026 = '';
    if (temDesconto2026) {
        const baseRRA = resultados.baseIRRRA;
        const descontoUnitario = resultados.descontoAdicional2026;  // ✅ JÁ É UNITÁRIO
        const irUnitarioSemDesconto = resultados.valorIRSemDesconto;  // ✅ JÁ É UNITÁRIO
        
        let explicacao = '';
        if (baseRRA <= 5000) {
            explicacao = 'Isenção para rendimentos até R$ 5.000,00';
        } else if (baseRRA <= 7350) {
            explicacao = 'Desconto progressivo (R$ 5.000,01 a R$ 7.350,00)';
        }
        
        secaoDesconto2026 = `
        <tr>
            <th>IR Mensal (Tabela Progressiva):</th>
            <td>R$ ${formatarMoeda(irUnitarioSemDesconto)}</td>
        </tr>
        <tr style="background-color: #e8f5e9; color: #2e7d32;">
            <th>(-) Desconto Adicional 2026:</th>
            <td><strong>R$ ${formatarMoeda(descontoUnitario)}</strong></td>
        </tr>
        <tr>
            <th>IR Mensal com Desconto:</th>
            <td>R$ ${formatarMoeda(resultados.valorIRUnitario)}</td>
        </tr>
        <tr style="background-color: #f1f8e9;">
            <td colspan="2" style="padding: 8px 12px; border-left: 3px solid #66bb6a; font-size: 0.9em;">
                💡 <strong>Novo benefício 2026:</strong> ${explicacao}
            </td>
        </tr>`;
    }
    
    const distribuicaoCessoes = temIRParaDistribuir ? `
        <tr style="border-top: 1px solid #dee2e6;">
            <th colspan="2" style="background-color: #f8f9fa; font-weight: bold;">📊 Distribuição:</th>
        </tr>
        ${resultados.valorIRBeneficiario > 0 ? `
        <tr>
            <th>${dados.beneficiario}:</th>
            <td>R$ ${formatarMoeda(resultados.valorIRBeneficiario)}</td>
        </tr>
        ` : ''}
        ${resultados.cessoesBeneficiarioFinais ? resultados.cessoesBeneficiarioFinais.map((cessao) => 
            cessao.irCessao > 0 ? `
            <tr>
                <th>${cessao.cessionario}:</th>
                <td>R$ ${formatarMoeda(cessao.irCessao)}</td>
            </tr>
            ` : ''
        ).join('') : ''}
    ` : '';
    
    return `
        <table class="ir-table">
            <tr>
                <th colspan="2" class="section-header">📄 Imposto de Renda - LEI Nª 15.270, DE 11 DE NOVEMBRO DE 2025</th>
            </tr>
            <tr>
                <th>Valor Principal Excluído Juros:</th>
                <td>R$ ${formatarMoeda(resultados.principal)}</td>
            </tr>
            ${percentualTotalAdv > 0 ? `
            <tr>
                <th>(-) HONORÁRIOS CONTRATUAIS (${(percentualTotalAdv * 100).toFixed(2)}%):</th>
                <td>R$ ${formatarMoeda(resultados.baseIRHonora)}</td>
            </tr>` : ''}
            ${percentualTotalSind > 0 ? `
            <tr>
                <th>(-) SINDICATOS (${(percentualTotalSind * 100).toFixed(2)}%):</th>
                <td>R$ ${formatarMoeda(resultados.baseIRSindi)}</td>
            </tr>` : ''}
            <tr>
                <th>Rendimento Tributável:</th>
                <td>R$ ${formatarMoeda(resultados.baseIRSindi)}</td>
            </tr>
            ${isAcordo && resultados.percentualDesagioIR > 0 ? `
            <tr>
                <th>(-) Deságio ${(percentualDesagio * 100).toFixed(2)}%:</th>
                <td>R$ ${formatarMoeda(resultados.baseIRSindi * percentualDesagio)}</td>
            </tr>
            <tr>
                <th>Rendimento Tributável após deságio:</th>
                <td>R$ ${formatarMoeda(resultados.principalComDesagio)}</td>
            </tr>` : ''}
            <tr>
                <th>RRA:</th>
                <td>${arredondarRRA(resultados.rraComDesagio || resultados.rrapagamento)}</td>
            </tr>
            <tr>
                <th>Rendimento Tributável Mensal:</th>
                <td>R$ ${formatarMoeda(resultados.rendimentoMensal)}</td>
            </tr>
            <tr>
                <th>(-) Desconto Simplificado:</th>
                <td>R$ ${formatarMoeda(resultados.descontoSimplificado)}</td>
            </tr>
            ${resultados.baseIRRRA < 0 ? `
            <tr class="total-row">
                <th><strong>Base de Cálculo Mensal:</strong></th>
                <td><strong>R$ 0,00</strong></td>
            </tr>` : `
            <tr>
                <th><strong>Base de Cálculo Mensal:</strong></th>
                <td><strong>R$ ${formatarMoeda(resultados.baseIRRRA)}</strong></td>
            </tr>
            <tr>
                <th>Alíquota:</th>
                <td>${(resultados.aliquotaIR * 100).toFixed(2)}%</td>
            </tr>
            <tr>
                <th>IR Mensal:</th>
                <td>R$ ${formatarMoeda(resultados.valorIRSemDesconto)}</td>
            </tr>
            ${resultados.descontoAdicional2026 > 0 ? `
            <tr style="background-color: #e8f5e9; color: #2e7d32;">
                <th>Redutor 2026:</th>
                <td>R$ ${formatarMoeda(resultados.descontoAdicional2026)}</td>
            </tr>` : `
            <tr>
                <th>Redutor 2026:</th>
                <td>R$ 0,00</td>
            </tr>`}
            <tr class="total-row">
                <th>TOTAL A SER RECOLHIDO (${arredondarRRA(resultados.rraComDesagio || resultados.rrapagamento)} meses):</th>
                <td><strong>R$ ${formatarMoeda(resultados.valorIR)}</strong></td>
            </tr>`}
            ${distribuicaoCessoes}
        </table>
    `;
}

function gerarDetalheIRPJ(resultados, dados, temCessoes) {
    const isAcordo = dados.tipoCalculo === 'acordo';
    const percentualDesagio = dados.percentualAcordo || 0;
    
    let percentualTotalAdv = dados.advogados.reduce((sum, adv) => sum + adv.percentual, 0);
    let percentualTotalSind = dados.sindicatos.reduce((sum, sind) => sum + sind.percentual, 0);
    
    const baseSemHonorarios = resultados.valortotatt - (resultados.valortotatt * percentualTotalAdv);
    const baseSemSindicatos = baseSemHonorarios - (resultados.valortotatt * percentualTotalSind);
    
    let baseComDesagio = '';
    if (isAcordo && percentualDesagio > 0) {
        const baseAposDesagio = baseSemSindicatos * (1 - percentualDesagio);
        
        baseComDesagio = `
        <tr>
            <th>Base IR com Deságio ${(percentualDesagio * 100).toFixed(2)}%:</th>
            <td>R$ ${formatarMoeda(baseAposDesagio)}</td>
        </tr>`;
    }
    
    const distribuicaoCessoes = temCessoes ? `
        <tr style="border-top: 1px solid #dee2e6;">
            <th colspan="2" style="background-color: #f8f9fa; font-weight: bold;">📊 Distribuição:</th>
        </tr>
        ${resultados.valorIRBeneficiario > 0 ? `
        <tr>
            <th>${dados.beneficiario}:</th>
            <td>R$ ${formatarMoeda(resultados.valorIRBeneficiario)}</td>
        </tr>
        ` : ''}
        ${resultados.cessoesBeneficiarioFinais ? resultados.cessoesBeneficiarioFinais.map((cessao) => 
            cessao.irCessao > 0 ? `
            <tr>
                <th>${cessao.cessionario}:</th>
                <td>R$ ${formatarMoeda(cessao.irCessao)}</td>
            </tr>
            ` : ''
        ).join('') : ''}
    ` : '';
    
    return `
        <table class="ir-table">
            <tr>
                <th colspan="2" class="section-header">📄 Imposto de Renda PJ - Art. 27, da Lei nº 10.833/03</th>
            </tr>
            <tr>
                <th>Valor Total:</th>
                <td>R$ ${formatarMoeda(resultados.valortotatt)}</td>
            </tr>
            <tr>
                <th>(-) H.Contratuais(${(percentualTotalAdv * 100).toFixed(2)}%):</th>
                <td>R$ ${formatarMoeda(baseSemHonorarios)}</td>
            </tr>
            ${percentualTotalSind > 0 ? `
            <tr>
                <th>(-) Sindicatos (${(percentualTotalSind * 100).toFixed(2)}%):</th>
                <td>R$ ${formatarMoeda(baseSemSindicatos)}</td>
            </tr>` : ''}
            ${baseComDesagio}
            <tr>
                <th>Alíquota IR:</th>
                <td>3,0%</td>
            </tr>
            <tr class="total-row">
                <th>Valor IR Devido Total:</th>
                <td><strong>R$ ${formatarMoeda(resultados.valorIR)}</strong></td>
            </tr>
            ${distribuicaoCessoes}
        </table>
    `;
}

function gerarDetalheIRHerdeirosSemCessao(herdeiros, dados, valorBase, temPrevidencia, temAlgumParcial) {
    const primeiroHerdeiro = herdeiros[0];
    const isAcordo = dados.tipoCalculo === 'acordo';
    const percentualDesagio = dados.percentualAcordo || 0;
    
    let percentualTotalAdv = 0;
    let percentualTotalSind = 0;

    if (dados.tipoCalculo === 'preferencia') {
        percentualTotalAdv = dados.advogados.reduce((sum, adv) => sum + adv.percentual, 0);
        percentualTotalSind = 0;
    } else {
        percentualTotalAdv = dados.advogados.reduce((sum, adv) => sum + adv.percentual, 0);
        percentualTotalSind = dados.sindicatos.reduce((sum, sind) => sum + sind.percentual, 0);
    }

    const distribuicaoHerdeiros = herdeiros.map(herdeiro => `
        <tr>
            <th>${herdeiro.nome}:</th>
            <td>R$ ${formatarMoeda(herdeiro.valorIR)}</td>
        </tr>
    `).join('');
    
    return `
        <table class="ir-table" style="margin-bottom: 15px;">
            <tr>
                <th colspan="2" class="section-header">📄 Imposto de Renda - LEI Nª 15.270, DE 11 DE NOVEMBRO DE 2025</th>
            </tr>
            <tr>
                <th>Principal (base):</th>
                <td>R$ ${formatarMoeda(primeiroHerdeiro.principal)}</td>
            </tr>
            ${percentualTotalAdv > 0 ? `
            <tr>
                <th>(-) HONORÁRIOS CONTRATUAIS (${(percentualTotalAdv * 100).toFixed(2)}%):</th>
                <td>R$ ${formatarMoeda(primeiroHerdeiro.baseIRHonora)}</td>
            </tr>` : ''}
            ${percentualTotalSind > 0 ? `
            <tr>
                <th>(-) SINDICATOS (${(percentualTotalSind * 100).toFixed(2)}%):</th>
                <td>R$ ${formatarMoeda(primeiroHerdeiro.baseIRSindi)}</td>
            </tr>` : ''}
            <tr>
                <th>Rendimento Tributável:</th>
                <td>R$ ${formatarMoeda(primeiroHerdeiro.baseIRSindi)}</td>
            </tr>
            ${isAcordo && percentualDesagio > 0 ? `
            <tr>
                <th>(-) Deságio ${(percentualDesagio * 100).toFixed(2)}%:</th>
                <td>R$ ${formatarMoeda(primeiroHerdeiro.baseIRSindi * percentualDesagio)}</td>
            </tr>
            <tr>
                <th>Rendimento Tributável após deságio:</th>
                <td>R$ ${formatarMoeda(primeiroHerdeiro.principalComDesagio)}</td>
            </tr>` : ''}
            <tr>
                <th>RRA:</th>
                <td>${arredondarRRA(primeiroHerdeiro.rraComDesagio || primeiroHerdeiro.rrapagamento)}</td>
            </tr>
            <tr>
                <th>Rendimento Tributável Mensal:</th>
                <td>R$ ${formatarMoeda(primeiroHerdeiro.rendimentoMensal)}</td>
            </tr>
            <tr>
                <th>(-) Desconto Simplificado:</th>
                <td>R$ ${formatarMoeda(primeiroHerdeiro.descontoSimplificado)}</td>
            </tr>
            ${primeiroHerdeiro.baseIRRRA < 0 ? `
            <tr class="total-row">
                <th><strong>Base de Cálculo Mensal:</strong></th>
                <td><strong>R$ 0,00</strong></td>
            </tr>` : `
            <tr>
                <th><strong>Base de Cálculo Mensal:</strong></th>
                <td><strong>R$ ${formatarMoeda(primeiroHerdeiro.baseIRRRA)}</strong></td>
            </tr>
            <tr>
                <th>Alíquota:</th>
                <td>${(primeiroHerdeiro.aliquotaIR * 100).toFixed(2)}%</td>
            </tr>
            <tr>
                <th>IR Mensal:</th>
                <td>R$ ${formatarMoeda(primeiroHerdeiro.valorIRSemDesconto)}</td>
            </tr>
            ${primeiroHerdeiro.descontoAdicional2026 > 0 ? `
            <tr style="background-color: #e8f5e9; color: #2e7d32;">
                <th>Redutor 2026:</th>
                <td>R$ ${formatarMoeda(primeiroHerdeiro.descontoAdicional2026)}</td>
            </tr>` : `
            <tr>
                <th>Redutor 2026:</th>
                <td>R$ 0,00</td>
            </tr>`}
            <tr class="total-row">
                <th>TOTAL A SER RECOLHIDO (${arredondarRRA(primeiroHerdeiro.rraComDesagio || primeiroHerdeiro.rrapagamento)} meses):</th>
                <td><strong>R$ ${formatarMoeda(primeiroHerdeiro.valorIR)}</strong></td>
            </tr>`}
        </table>
    `;
}

function gerarDetalheIRHerdeiros(herdeiros, dados, valorBase, temPrevidencia, temAlgumParcial) {
    const primeiroHerdeiro = herdeiros[0];
    const isAcordo = dados.tipoCalculo === 'acordo';
    const percentualDesagio = dados.percentualAcordo || 0;
    
    let percentualTotalAdv = 0;
    let percentualTotalSind = 0;

    if (dados.tipoCalculo === 'preferencia') {
        percentualTotalAdv = dados.advogados.reduce((sum, adv) => sum + adv.percentual, 0);
        percentualTotalSind = 0;
    } else {
        percentualTotalAdv = dados.advogados.reduce((sum, adv) => sum + adv.percentual, 0);
        percentualTotalSind = dados.sindicatos.reduce((sum, sind) => sum + sind.percentual, 0);
    }

    const distribuicaoHerdeiros = herdeiros.map(herdeiro => {
        const temCessoes = herdeiro.cessoesHerdeiro && herdeiro.cessoesHerdeiro.length > 0;
        
        if (!temCessoes) {
            return `
                <tr>
                    <th>${herdeiro.nome}:</th>
                    <td>R$ ${formatarMoeda(herdeiro.valorIR)}</td>
                </tr>
            `;
        } else {
            const valorIRTotal = herdeiro.valorIR;
            const cessoesTotais = herdeiro.cessoesHerdeiro.reduce((total, cessao) => total + cessao.percentual, 0);
            const percentualHerdeiro = 1.0 - cessoesTotais;
            const valorHerdeiro = valorIRTotal * percentualHerdeiro;
            
            let linhas = `
                <tr>
                    <th>${herdeiro.nome}:</th>
                    <td>R$ ${formatarMoeda(valorHerdeiro)}</td>
                </tr>
            `;
            
            herdeiro.cessoesHerdeiro.forEach(cessao => {
                const valorCessionario = valorIRTotal * cessao.percentual;
                linhas += `
                    <tr>
                        <th style="padding-left: 20px;">${cessao.cessionario} (Cessionário de ${herdeiro.nome} - ${(cessao.percentual * 100).toFixed(2)}%):</th>
                        <td>R$ ${formatarMoeda(valorCessionario)}</td>
                    </tr>
                `;
            });
            
            return linhas;
        }
    }).join('');
    
    return `
        <table class="ir-table" style="margin-bottom: 15px;">
            <tr>
                <th colspan="2" class="section-header">📄 Imposto de Renda - LEI Nª 15.270, DE 11 DE NOVEMBRO DE 2025</th>
            </tr>
            <tr>
                <th>Principal (base):</th>
                <td>R$ ${formatarMoeda(primeiroHerdeiro.principal)}</td>
            </tr>
            ${percentualTotalAdv > 0 ? `
            <tr>
                <th>(-) HONORÁRIOS CONTRATUAIS (${(percentualTotalAdv * 100).toFixed(2)}%):</th>
                <td>R$ ${formatarMoeda(primeiroHerdeiro.baseIRHonora)}</td>
            </tr>` : ''}
            ${percentualTotalSind > 0 ? `
            <tr>
                <th>(-) SINDICATOS (${(percentualTotalSind * 100).toFixed(2)}%):</th>
                <td>R$ ${formatarMoeda(primeiroHerdeiro.baseIRSindi)}</td>
            </tr>` : ''}
            <tr>
                <th>Rendimento Tributável:</th>
                <td>R$ ${formatarMoeda(primeiroHerdeiro.baseIRSindi)}</td>
            </tr>
            ${isAcordo && percentualDesagio > 0 ? `
            <tr>
                <th>(-) Deságio ${(percentualDesagio * 100).toFixed(2)}%:</th>
                <td>R$ ${formatarMoeda(primeiroHerdeiro.baseIRSindi * percentualDesagio)}</td>
            </tr>
            <tr>
                <th>Rendimento Tributável após deságio:</th>
                <td>R$ ${formatarMoeda(primeiroHerdeiro.principalComDesagio)}</td>
            </tr>` : ''}
            <tr>
                <th>RRA:</th>
                <td>${arredondarRRA(primeiroHerdeiro.rraComDesagio || primeiroHerdeiro.rrapagamento)}</td>
            </tr>
            <tr>
                <th>Rendimento Tributável Mensal:</th>
                <td>R$ ${formatarMoeda(primeiroHerdeiro.rendimentoMensal)}</td>
            </tr>
            <tr>
                <th>(-) Desconto Simplificado:</th>
                <td>R$ ${formatarMoeda(primeiroHerdeiro.descontoSimplificado)}</td>
            </tr>
            ${primeiroHerdeiro.baseIRRRA < 0 ? `
            <tr class="total-row">
                <th><strong>Base de Cálculo Mensal:</strong></th>
                <td><strong>R$ 0,00</strong></td>
            </tr>` : `
            <tr>
                <th><strong>Base de Cálculo Mensal:</strong></th>
                <td><strong>R$ ${formatarMoeda(primeiroHerdeiro.baseIRRRA)}</strong></td>
            </tr>
            <tr>
                <th>Alíquota:</th>
                <td>${(primeiroHerdeiro.aliquotaIR * 100).toFixed(2)}%</td>
            </tr>
            <tr>
                <th>IR Mensal:</th>
                <td>R$ ${formatarMoeda(primeiroHerdeiro.valorIRSemDesconto)}</td>
            </tr>
            ${primeiroHerdeiro.descontoAdicional2026 > 0 ? `
            <tr style="background-color: #e8f5e9; color: #2e7d32;">
                <th>Redutor 2026:</th>
                <td>R$ ${formatarMoeda(primeiroHerdeiro.descontoAdicional2026)}</td>
            </tr>` : `
            <tr>
                <th>Redutor 2026:</th>
                <td>R$ 0,00</td>
            </tr>`}
            <tr class="total-row">
                <th>TOTAL A SER RECOLHIDO (${arredondarRRA(primeiroHerdeiro.rraComDesagio || primeiroHerdeiro.rrapagamento)} meses):</th>
                <td><strong>R$ ${formatarMoeda(primeiroHerdeiro.valorIR)}</strong></td>
            </tr>`}
            ${primeiroHerdeiro.cessoesHerdeiro && primeiroHerdeiro.cessoesHerdeiro.length > 0 ? `
            <tr style="border-top: 1px solid #dee2e6;">
                <th colspan="2" style="background-color: #f8f9fa; font-weight: bold;">📊 Distribuição:</th>
            </tr>
            ${distribuicaoHerdeiros}` : ''}
        </table>
    `;
}
