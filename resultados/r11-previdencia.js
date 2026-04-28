function gerarDetalhePrevidenciaFixa(resultados, dados, temCessoes) {
    const isAcordo = dados.tipoCalculo === 'acordo';
    const percentualDesagio = dados.percentualAcordo || 0;
    
    let valorSemDesagio = resultados.valorPrevidencia;
    let valorDesagio = 0;
    let valorComDesagio = resultados.valorPrevidencia;
    
    if (isAcordo && resultados.valorDesagioPrevidencia) {
        valorComDesagio = resultados.valorPrevidencia; // valor final (já com deságio)
        valorDesagio = resultados.valorDesagioPrevidencia; // valor do desconto
        valorSemDesagio = resultados.valorPrevidencia + resultados.valorDesagioPrevidencia; // valor original
    }

    const aliquotaFixa = dados.valoresPrincipais?.find(item => item.tributacao?.aliquotaFixa)?.tributacao.aliquotaFixa || 0;

    const distribuicaoCessoes = temCessoes ? `
        <tr style="border-top: 1px solid #dee2e6;">
            <th colspan="2" style="background-color: #f8f9fa; font-weight: bold;">📊 Distribuição:</th>
        </tr>
        ${resultados.valorPrevidenciaBeneficiario > 0 ? `
        <tr>
            <th>${dados.beneficiario}:</th>
            <td>R$ ${formatarMoeda(resultados.valorPrevidenciaBeneficiario)}</td>
        </tr>` : ''}
        ${resultados.cessoesBeneficiarioFinais ? resultados.cessoesBeneficiarioFinais.map((cessao) => 
            cessao.previdenciaCessao > 0 ? `
        <tr>
            <th>${cessao.cessionario}:</th>
            <td>R$ ${formatarMoeda(cessao.previdenciaCessao)}</td>
        </tr>` : ''
        ).join('') : ''}
    ` : '';
    
    return `
        <table class="ir-table">
            <tr>
                <th colspan="2" class="section-header">📄 Previdência - Alíquota Fixa</th>
            </tr>
            <tr>
                <th>Valor Principal excluído juros:</th>
                <td>R$ ${formatarMoeda(resultados.principal)}</td>
            </tr>
            <tr>
                <th>Alíquota Fixa:</th>
                <td>${(aliquotaFixa * 100).toFixed(2)}%</td>
            </tr>
            <tr ${!isAcordo ? 'class="total-row"' : ''}>
                <th>Valor Previdência ${isAcordo ? 'sem Deságio' : ''}:</th>
                <td>${!isAcordo ? '<strong>' : ''}R$ ${formatarMoeda(valorSemDesagio)}${!isAcordo ? '</strong>' : ''}</td>
            </tr>
            ${isAcordo && valorDesagio > 0 ? `
            <tr style="color: #dc3545;">
                <th>(-) Deságio ${(percentualDesagio * 100).toFixed(2)}%:</th>
                <td>R$ ${formatarMoeda(valorDesagio)}</td>
            </tr>
            <tr class="total-row">
                <th>Valor Previdência com Deságio:</th>
                <td><strong>R$ ${formatarMoeda(valorComDesagio)}</strong></td>
            </tr>` : ''}
            ${distribuicaoCessoes}
        </table>
    `;
}

function gerarDetalhePrevidenciaINSS(resultados, dados, temCessoes) {
    const TETO_INSS = 8475.55;
    const tipoPrevidencia = dados.valoresPrincipais?.find(
        item => item.tributacao?.tipoPrevidencia
    )?.tributacao.tipoPrevidencia || 'inss';
    const isApos = tipoPrevidencia === 'inssapos';

    const isAcordo = dados.tipoCalculo === 'acordo';
    const percentualDesagio = dados.percentualAcordo || 0;
    const base = resultados.rrapagamento === 0 ? resultados.principal : resultados.principal / resultados.rrapagamento;
    const excedente = isApos ? Math.max(0, base - TETO_INSS) : null;
    
    let valorSemDesagio = resultados.valorPrevidencia;
    let valorDesagio = 0;
    let valorComDesagio = resultados.valorPrevidencia;
    
    if (isAcordo && resultados.valorDesagioPrevidencia) {
        valorComDesagio = resultados.valorPrevidencia; // valor final (já com deságio)
        valorDesagio = resultados.valorDesagioPrevidencia; // valor do desconto
        valorSemDesagio = resultados.valorPrevidencia + resultados.valorDesagioPrevidencia; // valor original
    }
    
    const distribuicaoCessoes = temCessoes ? `
        <tr style="border-top: 1px solid #dee2e6;">
            <th colspan="2" style="background-color: #f8f9fa; font-weight: bold;">📊 Distribuição:</th>
        </tr>
        ${resultados.valorPrevidenciaBeneficiario > 0 ? `
        <tr>
            <th>${dados.beneficiario}:</th>
            <td>R$ ${formatarMoeda(resultados.valorPrevidenciaBeneficiario)}</td>
        </tr>` : ''}
        ${resultados.cessoesBeneficiarioFinais ? resultados.cessoesBeneficiarioFinais.map((cessao) => 
            cessao.previdenciaCessao > 0 ? `
        <tr>
            <th>${cessao.cessionario}:</th>
            <td>R$ ${formatarMoeda(cessao.previdenciaCessao)}</td>
        </tr>` : ''
        ).join('') : ''}
    ` : '';
    
    return `
        <table class="ir-table">
            <tr>
                <th colspan="2" class="section-header">📄 Previdência - INSS</th>
            </tr>
            <tr>
                <th>Principal:</th>
                <td>R$ ${formatarMoeda(resultados.principal)}</td>
            </tr>
            ${resultados.rrapagamento !== 0 ? `
            <tr>
                <th>RRA Pagamento:</th>
                <td>${arredondarRRA(resultados.rrapagamento)}</td>
            </tr>
            <tr>
                <th>Base INSS por RRA:</th>
                <td>R$ ${formatarMoeda(base)}</td>
            </tr>` : ''}
            ${isApos ? `
            <tr>
                <th>(-) Teto INSS:</th>
                <td>(-) R$ ${formatarMoeda(TETO_INSS)}</td>
            </tr>
            <tr>
                <th>Base excedente:</th>
                <td>R$ ${formatarMoeda(excedente)}</td>
            </tr>` : ''}
            ${excedente !== null && excedente <= 0 ? `
            <tr class="total-row">
                <th>Previdência:</th>
                <td><strong>R$ 0,00 (abaixo do teto)</strong></td>
            </tr>` : `
            <tr>
                <th>Alíquota Efetiva INSS:</th>
                <td>${(resultados.aliquotaEfetiva * 100).toFixed(2)}%</td>
            </tr>
            <tr>
                <th>Valor INSS por RRA:</th>
                <td>R$ ${formatarMoeda(valorSemDesagio / (resultados.rrapagamento || 1))} ${!isApos && base > 8475.55 ? '(TETO)' : ''}</td>
            </tr>
            <tr ${!isAcordo ? 'class="total-row"' : ''}>
                <th>Valor Previdência ${isAcordo ? 'sem Deságio' : ''}:</th>
                <td>${!isAcordo ? '<strong>' : ''}R$ ${formatarMoeda(valorSemDesagio)}${!isAcordo ? '</strong>' : ''}</td>
            </tr>
            ${isAcordo && valorDesagio > 0 ? `
            <tr style="color: #dc3545;">
                <th>(-) Deságio ${(percentualDesagio * 100).toFixed(2)}%:</th>
                <td>R$ ${formatarMoeda(valorDesagio)}</td>
            </tr>
            <tr class="total-row">
                <th>Valor Previdência com Deságio:</th>
                <td><strong>R$ ${formatarMoeda(valorComDesagio)}</strong></td>
            </tr>` : ''}`}
            ${distribuicaoCessoes}
        </table>
    `;
}

function gerarDetalhePrevidenciaFixaHerdeirosSemCessao(herdeiros, dados, valorBase) {
    const primeiroHerdeiro = herdeiros[0];
    const isAcordo = dados.tipoCalculo === 'acordo';
    const percentualDesagio = dados.percentualAcordo || 0;
    
    let valorSemDesagio = primeiroHerdeiro.valorPrevidencia;
    let valorComDesagio = primeiroHerdeiro.valorPrevidencia;
    
    if (isAcordo && primeiroHerdeiro.valorDesagioPrevidencia) {
        valorComDesagio = primeiroHerdeiro.valorPrevidencia; 
        valorSemDesagio = primeiroHerdeiro.valorPrevidencia + primeiroHerdeiro.valorDesagioPrevidencia; 
    }
    
    // Distribuição por herdeiros
    const distribuicaoHerdeiros = herdeiros.map(herdeiro => `
        <tr>
            <th>${herdeiro.nome}:</th>
            <td>R$ ${formatarMoeda(herdeiro.valorPrevidencia)}</td>
        </tr>
    `).join('');

    const aliquotaFixa = dados.valoresPrincipais?.find(item => item.tributacao?.aliquotaFixa)?.tributacao.aliquotaFixa || 0;
    
    return `
        <table class="ir-table" style="margin-bottom: 15px;">
            <tr>
                <th colspan="2" class="section-header">📄 Previdência - Alíquota Fixa</th>
            </tr>
            <tr>
                <th>Valor Principal excluído juros:</th>
                <td>R$ ${formatarMoeda(primeiroHerdeiro.principal)}</td>
            </tr>
            <tr>
                <th>Alíquota Fixa:</th>
                <td>${(aliquotaFixa * 100).toFixed(2)}%</td>
            </tr>
            <tr ${!isAcordo ? 'class="total-row"' : ''}>
                <th>Valor Previdência${isAcordo ? ' sem Deságio' : ''}:</th>
                <td>${!isAcordo ? '<strong>' : ''}R$ ${formatarMoeda(valorSemDesagio)}${!isAcordo ? '</strong>' : ''}</td>
            </tr>
            ${isAcordo && primeiroHerdeiro.valorDesagioPrevidencia > 0 ? `
            <tr class="total-row">
                <th>Valor Previdência com Deságio ${(percentualDesagio * 100).toFixed(2)}%:</th>
                <td><strong>R$ ${formatarMoeda(valorComDesagio)}</strong></td>
            </tr>` : ''}
        </table>
    `;
}

function gerarDetalhePrevidenciaINSSHerdeirosSemCessao(herdeiros, dados, valorBase) {
    const TETO_INSS = 8475.55;
    const tipoPrevidencia = dados.valoresPrincipais?.find(
        item => item.tributacao?.tipoPrevidencia
    )?.tributacao.tipoPrevidencia || 'inss';
    const isApos = tipoPrevidencia === 'inssapos';

    const primeiroHerdeiro = herdeiros[0];
    const isAcordo = dados.tipoCalculo === 'acordo';
    const percentualDesagio = dados.percentualAcordo || 0;
    
    const base = primeiroHerdeiro.rrapagamento === 0 ? primeiroHerdeiro.principal : primeiroHerdeiro.principal / primeiroHerdeiro.rrapagamento;
    
    const excedente = isApos ? Math.max(0, base - TETO_INSS) : null;

    let valorSemDesagio = primeiroHerdeiro.valorPrevidencia;
    let valorComDesagio = primeiroHerdeiro.valorPrevidencia;
    
    if (isAcordo && primeiroHerdeiro.valorDesagioPrevidencia) {
        valorComDesagio = primeiroHerdeiro.valorPrevidencia; // valor final (já com deságio)
        valorSemDesagio = primeiroHerdeiro.valorPrevidencia + primeiroHerdeiro.valorDesagioPrevidencia; // valor original
    }

    const distribuicaoHerdeiros = herdeiros.map(herdeiro => `
        <tr>
            <th>${herdeiro.nome}:</th>
            <td>R$ ${formatarMoeda(herdeiro.valorPrevidencia)}</td>
        </tr>
    `).join('');
    
    return `
        <table class="ir-table" style="margin-bottom: 15px;">
            <tr>
                <th colspan="2" class="section-header">📄 Previdência - INSS</th>
            </tr>
            <tr>
                <th>Valor Principal excluído juros:</th>
                <td>R$ ${formatarMoeda(primeiroHerdeiro.principal)}</td>
            </tr>
            ${primeiroHerdeiro.rrapagamento !== 0 ? `
            <tr>
                <th>RRA Pagamento:</th>
                <td>${arredondarRRA(primeiroHerdeiro.rrapagamento)}</td>
            </tr>
            <tr>
                <th>Base INSS por RRA:</th>
                <td>R$ ${formatarMoeda(base)}</td>
            </tr>` : ''}
            ${isApos ? `
            <tr>
                <th>(-) Teto INSS:</th>
                <td>(-) R$ ${formatarMoeda(TETO_INSS)}</td>
            </tr>
            <tr>
                <th>Base excedente:</th>
                <td>R$ ${formatarMoeda(excedente)}</td>
            </tr>` : ''}
            ${excedente !== null && excedente <= 0 ? `
            <tr class="total-row">
                <th>Previdência:</th>
                <td><strong>R$ 0,00 (abaixo do teto)</strong></td>
            </tr>` : `
            <tr>
                <th>Alíquota Efetiva INSS:</th>
                <td>${(primeiroHerdeiro.aliquotaEfetiva * 100).toFixed(2)}%</td>
            </tr>
            <tr>
                <th>Valor INSS por RRA:</th>
                <td>R$ ${formatarMoeda(valorSemDesagio / (primeiroHerdeiro.rrapagamento || 1))} ${!isApos && base > 8475.55 ? '(TETO)' : ''}</td>
            </tr>
            <tr ${!isAcordo ? 'class="total-row"' : ''}>
                <th>Valor Previdência${isAcordo ? ' sem Deságio' : ''}:</th>
                <td>${!isAcordo ? '<strong>' : ''}R$ ${formatarMoeda(valorSemDesagio)}${!isAcordo ? '</strong>' : ''}</td>
            </tr>
            ${isAcordo && primeiroHerdeiro.valorDesagioPrevidencia > 0 ? `
            <tr class="total-row">
                <th>Valor Previdência com Deságio ${(percentualDesagio * 100).toFixed(2)}%:</th>
                <td><strong>R$ ${formatarMoeda(valorComDesagio)}</strong></td>
            </tr>` : ''}`}
        </table>
    `;
}

function gerarDetalhePrevidenciaFixaHerdeiros(herdeiros, dados, valorBase) {
    const primeiroHerdeiro = herdeiros[0];
    const isAcordo = dados.tipoCalculo === 'acordo';
    const percentualDesagio = dados.percentualAcordo || 0;
    
    let valorSemDesagio = primeiroHerdeiro.valorPrevidencia;
    let valorComDesagio = primeiroHerdeiro.valorPrevidencia;
    
    if (isAcordo && primeiroHerdeiro.valorDesagioPrevidencia) {
        valorComDesagio = primeiroHerdeiro.valorPrevidencia; // valor final (já com deságio)
        valorSemDesagio = primeiroHerdeiro.valorPrevidencia + primeiroHerdeiro.valorDesagioPrevidencia; // valor original
    }

    const aliquotaFixa = dados.valoresPrincipais?.find(item => item.tributacao?.aliquotaFixa)?.tributacao.aliquotaFixa || 0;
    
    const distribuicaoHerdeiros = herdeiros.map(herdeiro => {
        const temCessoes = herdeiro.cessoesHerdeiro && herdeiro.cessoesHerdeiro.length > 0;
        
        if (!temCessoes) {
            return `
                <tr>
                    <th>${herdeiro.nome}:</th>
                    <td>R$ ${formatarMoeda(herdeiro.valorPrevidencia)}</td>
                </tr>
            `;
        } else {
            // Com cessões - distribui proporcionalmente
            const valorPrevidenciaTotal = herdeiro.valorPrevidencia;
            const cessoesTotais = herdeiro.cessoesHerdeiro.reduce((total, cessao) => total + cessao.percentual, 0);
            const percentualHerdeiro = 1.0 - cessoesTotais;
            
            const valorHerdeiro = valorPrevidenciaTotal * percentualHerdeiro;
            
            let linhas = `
                <tr>
                    <th>${herdeiro.nome}:</th>
                    <td>R$ ${formatarMoeda(valorHerdeiro)}</td>
                </tr>
            `;
            
            herdeiro.cessoesHerdeiro.forEach(cessao => {
                const valorCessionario = valorPrevidenciaTotal * cessao.percentual;
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
                <th colspan="2" class="section-header">📄 Previdência - Alíquota Fixa</th>
            </tr>
            <tr>
                <th>Valor Principal excluído juros:</th>
                <td>R$ ${formatarMoeda(primeiroHerdeiro.principal)}</td>
            </tr>
            <tr>
                <th>Alíquota Fixa:</th>
                <td>${(aliquotaFixa * 100).toFixed(2)}%</td>
            </tr>
            <tr ${!isAcordo ? 'class="total-row"' : ''}>
                <th>Valor Previdência${isAcordo ? ' sem Deságio' : ''}:</th>
                <td>${!isAcordo ? '<strong>' : ''}R$ ${formatarMoeda(valorSemDesagio)}${!isAcordo ? '</strong>' : ''}</td>
            </tr>
            ${isAcordo && primeiroHerdeiro.valorDesagioPrevidencia > 0 ? `
            <tr class="total-row">
                <th>Valor Previdência com Deságio ${(percentualDesagio * 100).toFixed(2)}%:</th>
                <td><strong>R$ ${formatarMoeda(valorComDesagio)}</strong></td>
            </tr>` : ''}
            ${primeiroHerdeiro.cessoesHerdeiro && primeiroHerdeiro.cessoesHerdeiro.length > 0 ? `
            <tr style="border-top: 1px solid #dee2e6;">
                <th colspan="2" style="background-color: #f8f9fa; font-weight: bold;">📊 Distribuição:</th>
            </tr>
            ${distribuicaoHerdeiros}` : ''}
        </table>
    `;
}

function gerarDetalhePrevidenciaINSSHerdeiros(herdeiros, dados, valorBase) {
    const TETO_INSS = 8475.55;
    const tipoPrevidencia = dados.valoresPrincipais?.find(
        item => item.tributacao?.tipoPrevidencia
    )?.tributacao.tipoPrevidencia || 'inss';
    const isApos = tipoPrevidencia === 'inssapos';

    const primeiroHerdeiro = herdeiros[0];
    const isAcordo = dados.tipoCalculo === 'acordo';
    const percentualDesagio = dados.percentualAcordo || 0;
    
    const base = primeiroHerdeiro.rrapagamento === 0 ? primeiroHerdeiro.principal : primeiroHerdeiro.principal / primeiroHerdeiro.rrapagamento;
    const excedente = isApos ? Math.max(0, base - TETO_INSS) : null;
    
    let valorSemDesagio = primeiroHerdeiro.valorPrevidencia;
    let valorComDesagio = primeiroHerdeiro.valorPrevidencia;
    
    if (isAcordo && primeiroHerdeiro.valorDesagioPrevidencia) {
        valorComDesagio = primeiroHerdeiro.valorPrevidencia; // valor final (já com deságio)
        valorSemDesagio = primeiroHerdeiro.valorPrevidencia + primeiroHerdeiro.valorDesagioPrevidencia; // valor original
    }
    
    const distribuicaoHerdeiros = herdeiros.map(herdeiro => {
        const temCessoes = herdeiro.cessoesHerdeiro && herdeiro.cessoesHerdeiro.length > 0;
        
        if (!temCessoes) {
            return `
                <tr>
                    <th>${herdeiro.nome}:</th>
                    <td>R$ ${formatarMoeda(herdeiro.valorPrevidencia)}</td>
                </tr>
            `;
        } else {
            const valorPrevidenciaTotal = herdeiro.valorPrevidencia;
            const cessoesTotais = herdeiro.cessoesHerdeiro.reduce((total, cessao) => total + cessao.percentual, 0);
            const percentualHerdeiro = 1.0 - cessoesTotais;
            
            const valorHerdeiro = valorPrevidenciaTotal * percentualHerdeiro;
            
            let linhas = `
                <tr>
                    <th>${herdeiro.nome}:</th>
                    <td>R$ ${formatarMoeda(valorHerdeiro)}</td>
                </tr>
            `;
            
            herdeiro.cessoesHerdeiro.forEach(cessao => {
                const valorCessionario = valorPrevidenciaTotal * cessao.percentual;
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
                <th colspan="2" class="section-header">📄 Previdência - INSS</th>
            </tr>
            <tr>
                <th>Valor Principal excluído juros:</th>
                <td>R$ ${formatarMoeda(primeiroHerdeiro.principal)}</td>
            </tr>
            ${primeiroHerdeiro.rrapagamento !== 0 ? `
            <tr>
                <th>RRA Pagamento:</th>
                <td>${arredondarRRA(primeiroHerdeiro.rraComDesagio || primeiroHerdeiro.rrapagamento)}</td>
            </tr>
            <tr>
                <th>Base INSS por RRA:</th>
                <td>R$ ${formatarMoeda(base)}</td>
            </tr>` : ''}
            ${isApos ? `
            <tr>
                <th>(-) Teto INSS:</th>
                <td>(-) R$ ${formatarMoeda(TETO_INSS)}</td>
            </tr>
            <tr>
                <th>Base excedente:</th>
                <td>R$ ${formatarMoeda(excedente)}</td>
            </tr>` : ''}
            ${excedente !== null && excedente <= 0 ? `
            <tr class="total-row">
                <th>Previdência:</th>
                <td><strong>R$ 0,00 (abaixo do teto)</strong></td>
            </tr>` : `
            <tr>
                <th>Alíquota Efetiva INSS:</th>
                <td>${(primeiroHerdeiro.aliquotaEfetiva * 100).toFixed(2)}%</td>
            </tr>
            <tr>
                <th>Valor INSS por RRA:</th>
                <td>R$ ${formatarMoeda(valorSemDesagio / (primeiroHerdeiro.rrapagamento || 1))} ${!isApos && base > 8475.55 ? '(TETO)' : ''}</td>
            </tr>
            <tr ${!isAcordo ? 'class="total-row"' : ''}>
                <th>Valor Previdência${isAcordo ? ' sem Deságio' : ''}:</th>
                <td>${!isAcordo ? '<strong>' : ''}R$ ${formatarMoeda(valorSemDesagio)}${!isAcordo ? '</strong>' : ''}</td>
            </tr>
            ${isAcordo && primeiroHerdeiro.valorDesagioPrevidencia > 0 ? `
            <tr class="total-row">
                <th>Valor Previdência com Deságio ${(percentualDesagio * 100).toFixed(2)}%:</th>
                <td><strong>R$ ${formatarMoeda(valorComDesagio)}</strong></td>
            </tr>` : ''}`}
            ${primeiroHerdeiro.cessoesHerdeiro?.length > 0 ? `
            <tr style="border-top: 1px solid #dee2e6;">
                <th colspan="2" style="background-color: #f8f9fa; font-weight: bold;">📊 Distribuição:</th>
            </tr>
            ${distribuicaoHerdeiros}` : ''}
        </table>
    `;
}

