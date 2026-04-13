//DEDUCOES LEGAIS

function gerarSecaoDeducoes(resultados, dados) {
    const temPrevidencia = dados.incidenciaPrevidencia || 
        (dados.valoresPrincipais && dados.valoresPrincipais.some(item => item.tributacao?.previdencia === true));
    
    const temIR = (dados.incidenciaIR || 
        (dados.valoresPrincipais && dados.valoresPrincipais.some(item => item.tributacao?.ir === true))) 
        && (dados.tipoBeneficiario === 'pj' || resultados.rrapagamento !== 0);

    if (!temPrevidencia && !temIR) return '';

    if (dados.tipoCalculo === 'acordo') {
        if (!validarAdesaoParaAcordo(dados, resultados)) return '';
    }

    const resultadosParaUsar = resultados.saldosFinais 
        ? ajustarResultadosComPagamentos(resultados, dados) 
        : resultados;

    const config = {
        temPrevidencia,
        temIR,
        tipoPrevidencia: dados.valoresPrincipais?.find(item => item.tributacao?.tipoPrevidencia)?.tributacao.tipoPrevidencia || null,
        temHerdeiros: resultadosParaUsar.temHerdeiros && resultadosParaUsar.herdeiros.length > 0  // ← MUDOU
    };

    if (dados.natureza === 'comum') {
        return gerarDeducoesSimples(resultadosParaUsar, dados, config.temPrevidencia, config.temIR);
    }
    
    if (!config.temHerdeiros) {
        return gerarDeducoesSimples(resultadosParaUsar, dados, config.temPrevidencia, config.temIR);
    }
    
    return dados.tipoCalculo === 'preferencia'
        ? gerarDeducoesPreferencia(resultadosParaUsar, dados, config)
        : gerarDeducoesOrdem(resultadosParaUsar, dados, config);
}

function validarAdesaoParaAcordo(dados, resultados) {
    let adesoes;
    if (typeof obterAdesaoAcordo === 'function') {
        adesoes = obterAdesaoAcordo();
    } else {
        adesoes = dados.adesaoAcordo || {};
    }
    
    const beneficiarioOuHerdeirosAderiram = adesoes.beneficiario || (adesoes.herdeiros || []).length > 0;
    
    const cessionarioRelevante = (adesoes.cessionarios || []).some(cessaoIndex => {
        const cessao = dados.cessoes?.[cessaoIndex];
        return cessao?.tipo === 'cessaobenPrincipal' || cessao?.tipo === 'cessaoherdeiro';
    });
    
    return beneficiarioOuHerdeirosAderiram || cessionarioRelevante;
}

function gerarDeducoesOrdem(resultados, dados, config) {
    const { temPrevidencia, temIR, tipoPrevidencia } = config;
    
    let herdeirosFiltrados = resultados.herdeiros;
    if (dados.tipoCalculo === 'acordo') {
        const adesoes = obterAdesaoAcordo();
        herdeirosFiltrados = resultados.herdeiros.filter((h, index) => 
            adesoes.herdeiros.includes(index)
        );
    }
    
    const secoes = [];
    
    const secaoBeneficiario = gerarSecaoBeneficiarioPrincipal(resultados, dados, temPrevidencia, temIR, tipoPrevidencia);
    if (secaoBeneficiario) {
        secoes.push(secaoBeneficiario);
    }
    
    const secoesHerdeiros = gerarSecoesHerdeiros(herdeirosFiltrados, dados, temPrevidencia, temIR, tipoPrevidencia, false);
    secoes.push(...secoesHerdeiros);
    
    if (secoes.length === 0) return '';
    
    return montarResultadoFinal(secoes, 'ordem');
}

function gerarDeducoesPreferencia(resultados, dados, config) {
    const { temPrevidencia, temIR, tipoPrevidencia } = config;
    
    let herdeirosFiltrados;
    if (dados.tipoCalculo === 'acordo') {
        const adesoes = obterAdesaoAcordo();
        const herdeirosPorAdesao = resultados.herdeiros.filter((h, index) => 
            adesoes.herdeiros.includes(index)
        );
        herdeirosFiltrados = herdeirosPorAdesao.filter(h => h.temPreferencia || h.isPreferenciaParcial);
    } else {
        herdeirosFiltrados = resultados.herdeiros.filter(h => h.temPreferencia || h.isPreferenciaParcial);
    }
    
    if (herdeirosFiltrados.length === 0) return '';
    
    const secoesPorBase = gerarSecoesHerdeiros(herdeirosFiltrados, dados, temPrevidencia, temIR, tipoPrevidencia, true);
    
    if (secoesPorBase.length === 0) return '';
    
    const isPreferenciaParcial = resultados.valorBase < resultados.valortotatt;
    const tipoTitulo = isPreferenciaParcial ? 'preferencia_parcial' : 'preferencia_total';
    
    return montarResultadoFinal(secoesPorBase, tipoTitulo);
}

function gerarSecaoBeneficiarioPrincipal(resultados, dados, temPrevidencia, temIR, tipoPrevidencia) {
    const temCessoesBeneficiario = resultados.cessoesBeneficiarioCalculadas && resultados.cessoesBeneficiarioCalculadas.length > 0;
    if (!temCessoesBeneficiario) return null;
    
    let secaoPrevidencia = '';
    if (temPrevidencia) {
        secaoPrevidencia = tipoPrevidencia === 'fixa'
            ? gerarDetalhePrevidenciaFixa(resultados, dados, temCessoesBeneficiario)
            : gerarDetalhePrevidenciaINSS(resultados, dados, temCessoesBeneficiario);
    }
    
    let secaoIR = '';
    if (temIR) {
        secaoIR = gerarDetalheIR(resultados, dados, temPrevidencia, temCessoesBeneficiario);
    }
    
    if (!secaoPrevidencia && !secaoIR) return null;
    
    return `
        <div style="margin-bottom: 30px; border: 1px solid #dee2e6; padding: 15px; border-radius: 5px;">
            <p style="color: #155724; font-style: italic; margin-bottom: 15px;">
                <strong>Deduções do Beneficiário Principal:</strong> ${dados.beneficiario}
                <span style="color: #856404;"> - R$ ${formatarMoeda(resultados.valorBase)}</span>
            </p>
            ${secaoPrevidencia}
            ${secaoIR}
        </div>
    `;
}

function gerarSecoesHerdeiros(herdeirosFiltrados, dados, temPrevidencia, temIR, tipoPrevidencia, isPreferencia) {
    if (herdeirosFiltrados.length === 0) return [];
    
    const baseGroups = agruparHerdeirosPorBase(herdeirosFiltrados);
    const secoes = [];
    
    baseGroups.forEach((herdeiros, base) => {
        const valorBase = parseFloat(base);
        const herdeirosNomes = herdeiros.map(h => h.nome).join(', ');
        const primeiroHerdeiro = herdeiros[0];
        const temAlgumParcial = herdeiros.some(h => h.isPreferenciaParcial);
        
        let secaoPrevidencia = '';
        if (temPrevidencia) {
            if (isPreferencia) {
                // Preferência: usa funções SemCessao
                secaoPrevidencia = tipoPrevidencia === 'fixa'
                    ? gerarDetalhePrevidenciaFixaHerdeirosSemCessao(herdeiros, dados, valorBase)
                    : gerarDetalhePrevidenciaINSSHerdeirosSemCessao(herdeiros, dados, valorBase);
            } else {
                // Ordem: usa funções normais
                secaoPrevidencia = tipoPrevidencia === 'fixa'
                    ? gerarDetalhePrevidenciaFixaHerdeiros(herdeiros, dados, valorBase)
                    : gerarDetalhePrevidenciaINSSHerdeiros(herdeiros, dados, valorBase);
            }
        }
        
        let secaoIR = '';
        if (temIR && primeiroHerdeiro.rrapagamento !== 0) {
            secaoIR = isPreferencia
                ? gerarDetalheIRHerdeirosSemCessao(herdeiros, dados, valorBase, temPrevidencia, temAlgumParcial)
                : gerarDetalheIRHerdeiros(herdeiros, dados, valorBase, temPrevidencia, false);
        }
        
        if (secaoPrevidencia || secaoIR) {
            const extraInfo = isPreferencia 
                ? (temAlgumParcial ? ' <em>(Preferência Parcial)</em>' : ' <em>(Preferência Total)</em>')
                : '';
            
            secoes.push(`
                <div style="margin-bottom: 30px; border: 1px solid #dee2e6; padding: 15px; border-radius: 5px;">
                    <p style="color: #155724; font-style: italic; margin-bottom: 15px;">
                        <strong>Deduções de:</strong> ${herdeirosNomes}
                        <span style="color: #856404;"> - R$ ${formatarMoeda(valorBase)}</span>
                        ${extraInfo}
                    </p>
                    ${secaoPrevidencia}
                    ${secaoIR}
                </div>
            `);
        }
    });
    
    return secoes;
}

function agruparHerdeirosPorBase(herdeiros) {
    const baseGroups = new Map();
    herdeiros.forEach(h => {
        const baseKey = h.valorTotal.toFixed(2);
        if (!baseGroups.has(baseKey)) baseGroups.set(baseKey, []);
        baseGroups.get(baseKey).push(h);
    });
    return baseGroups;
}

function montarResultadoFinal(secoes, tipo) {
    const titulos = {
        'ordem': '🏦 Deduções Legais',
        'preferencia_total': '🏦 Deduções Legais - Preferência Total',
        'preferencia_parcial': '🏦 Deduções Legais - Preferência (Parcial/Total)'
    };
    
    const explicacoes = {
        'ordem': `
            • <strong>Beneficiário principal:</strong> Discrimina cessões quando aplicável<br>
            • <strong>Herdeiros agrupados:</strong> Por valor igual, com cessões individuais<br>
            • <strong>Cálculos específicos</strong> para cada situação
        `,
        'preferencia_total': `
            • <strong>Herdeiros agrupados</strong> por valor igual, com cálculos específicos<br>
            • <strong>Previdência e IR</strong> individuais por herdeiro<br>
            • <strong>Cessões não aplicáveis</strong> na preferência (cessionários aguardam ordem cronológica)
        `,
        'preferencia_parcial': `
            • <strong>Herdeiros agrupados</strong> por valor igual, com cálculos específicos<br>
            • <strong>Previdência e IR</strong> individuais por herdeiro<br>
            • <strong>Cessões não aplicáveis</strong> na preferência (cessionários aguardam ordem cronológica)
        `
    };
    
    return `
        <div class="deducoes-legais">
            <div class="table-container">
                <h3>${titulos[tipo]}</h3>
                ${secoes.join('')}
                <div style="margin-top: 10px; padding: 12px; background-color: #f8f9fa; border-left: 4px solid #007bff; font-size: 0.9em;">
                    <strong>💡 Explicação:</strong><br>
                    ${explicacoes[tipo]}
                </div>
            </div>
        </div>
    `;
}

function gerarDeducoesSimples(resultados, dados, temPrevidencia, temIR) {
    const temCessoes = resultados.cessoesBeneficiarioCalculadas && resultados.cessoesBeneficiarioCalculadas.length > 0;
    const isPJ = dados.natureza === 'comum' && dados.tipoBeneficiario === 'pj';
    const tipoPrevidencia = dados.valoresPrincipais?.find(item => item.tributacao?.tipoPrevidencia)?.tributacao.tipoPrevidencia || null;
    
    let secaoPrevidencia = '';
    if (temPrevidencia && !isPJ) {
        secaoPrevidencia = tipoPrevidencia === 'fixa'
            ? gerarDetalhePrevidenciaFixa(resultados, dados, temCessoes)
            : gerarDetalhePrevidenciaINSS(resultados, dados, temCessoes);
    }
    
    let secaoIR = '';
    if (temIR) {
        secaoIR = isPJ
            ? gerarDetalheIRPJ(resultados, dados, temCessoes)
            : gerarDetalheIR(resultados, dados, temPrevidencia, temCessoes);
    }

    if (!secaoPrevidencia && !secaoIR) return '';
    
    const titulo = isPJ ? '🏦 Deduções Legais - Pessoa Jurídica' : '🏦 Deduções Legais';
    
    const conteudo = (secaoPrevidencia && secaoIR)
        ? `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start;">
               <div>${secaoPrevidencia}</div>
               <div>${secaoIR}</div>
           </div>`
        : `${secaoPrevidencia}${secaoIR}`;
    
    return `
        <div class="deducoes-legais">
            <div class="table-container">
                <h3>${titulo}</h3>
                ${conteudo}
            </div>
        </div>
    `;
}

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
                <th>Principal:</th>
                <td>R$ ${formatarMoeda(resultados.principal)}</td>
            </tr>
            <tr>
                <th>Alíquota Fixa:</th>
                <td>${(aliquotaFixa * 100).toFixed(2)}%</td>
            </tr>
            <tr ${!isAcordo ? 'class="linha-gold"' : ''}>
                <td class="bold">Valor Previdência${isAcordo ? ' sem Deságio' : ''}:</td>
                <td class="bold">R$ ${formatarMoeda(valorSemDesagio)}</td>
            </tr>
            ${isAcordo && valorDesagio > 0 ? `
            <tr style="color: #dc3545;">
                <th>(-) Deságio ${(percentualDesagio * 100).toFixed(2)}%:</th>
                <td>R$ ${formatarMoeda(valorDesagio)}</td>
            </tr>
            <tr class="linha-gold">
                <td class="bold">Valor Previdência com Deságio:</td>
                <td class="bold">R$ ${formatarMoeda(valorComDesagio)}</td>
            </tr>` : ''}
            ${distribuicaoCessoes}
        </table>
    `;
}

function gerarDetalhePrevidenciaINSS(resultados, dados, temCessoes) {
    const isAcordo = dados.tipoCalculo === 'acordo';
    const percentualDesagio = dados.percentualAcordo || 0;
    const base = resultados.rrapagamento === 0 ? resultados.principal : resultados.principal / resultados.rrapagamento;
    
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
            <tr>
                <th>Alíquota Efetiva INSS:</th>
                <td>${(resultados.aliquotaEfetiva * 100).toFixed(2)}%</td>
            </tr>
            <tr>
                <th>Valor INSS por RRA:</th>
                <td>R$ ${formatarMoeda(valorSemDesagio / (resultados.rrapagamento || 1))} ${base > 8157.41 ? '(TETO)' : ''}</td>
            </tr>
            <tr ${!isAcordo ? 'class="linha-gold"' : ''}>
                <td class="bold">Valor Previdência${isAcordo ? ' sem Deságio' : ''}:</td>
                <td class="bold">R$ ${formatarMoeda(valorSemDesagio)}</td>
            </tr>
            ${isAcordo && valorDesagio > 0 ? `
            <tr style="color: #dc3545;">
                <th>(-) Deságio ${(percentualDesagio * 100).toFixed(2)}%:</th>
                <td>R$ ${formatarMoeda(valorDesagio)}</td>
            </tr>
            <tr class="linha-gold">
                <td class="bold">Valor Previdência com Deságio:</td>
                <td class="bold">R$ ${formatarMoeda(valorComDesagio)}</td>
            </tr>` : ''}
            ${distribuicaoCessoes}
        </table>
    `;
}

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
            <tr class="linha-gold">
                <td class="bold">TOTAL A SER RECOLHIDO (${arredondarRRA(resultados.rraComDesagio || resultados.rrapagamento)} meses):</td>
                <td class="bold">R$ ${formatarMoeda(resultados.valorIR)}</td>
            </tr>
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
            <th>Rendimento Tributável após deságio ${(percentualDesagio * 100).toFixed(2)}%:</th>
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
                <th>(-) HONORÁRIOS CONTRATUAIS (${(percentualTotalAdv * 100).toFixed(2)}%):</th>
                <td>R$ ${formatarMoeda(baseSemHonorarios)}</td>
            </tr>
            ${percentualTotalSind > 0 ? `
            <tr>
                <th>(-) SINDICATOS (${(percentualTotalSind * 100).toFixed(2)}%):</th>
                <td>R$ ${formatarMoeda(baseSemSindicatos)}</td>
            </tr>` : ''}
            ${baseComDesagio}
            <tr>
                <th>Alíquota IR:</th>
                <td>3,0%</td>
            </tr>
            <tr class="linha-gold">
                <td class="bold">Valor IR Devido Total:</td>
                <td class="bold">R$ ${formatarMoeda(resultados.valorIR)}</td>
            </tr>
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
                <th>Principal (base):</th>
                <td>R$ ${formatarMoeda(primeiroHerdeiro.principal)}</td>
            </tr>
            <tr>
                <th>Alíquota Fixa:</th>
                <td>${(aliquotaFixa * 100).toFixed(2)}%</td>
            </tr>
            <tr ${!isAcordo ? 'class="linha-gold"' : ''}>
                <td class="bold">Valor Previdência ${isAcordo ? 'sem Deságio' : 'por Herdeiro'}:</td>
                <td class="bold">${!isAcordo ? '<strong>' : ''}R$ ${formatarMoeda(valorSemDesagio)}${!isAcordo ? '</strong>' : ''}</td>
            </tr>
            ${isAcordo && primeiroHerdeiro.valorDesagioPrevidencia > 0 ? `
            <tr class="linha-gold">
                <td class="bold">Valor Previdência com Deságio ${(percentualDesagio * 100).toFixed(2)}%:</td>
                <td class="bold">R$ ${formatarMoeda(valorComDesagio)}</td>
            </tr>` : ''}
            <tr style="border-top: 1px solid #dee2e6;">
                <th colspan="2" style="background-color: #f8f9fa; font-weight: bold;">📊 Distribuição:</th>
            </tr>
            ${distribuicaoHerdeiros}
        </table>
    `;
}

function gerarDetalhePrevidenciaINSSHerdeirosSemCessao(herdeiros, dados, valorBase) {
    const primeiroHerdeiro = herdeiros[0];
    const isAcordo = dados.tipoCalculo === 'acordo';
    const percentualDesagio = dados.percentualAcordo || 0;
    
    const base = primeiroHerdeiro.rrapagamento === 0 ? primeiroHerdeiro.principal : primeiroHerdeiro.principal / primeiroHerdeiro.rrapagamento;
    
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
                <th>Principal (base):</th>
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
            <tr>
                <th>Alíquota Efetiva INSS:</th>
                <td>${(primeiroHerdeiro.aliquotaEfetiva * 100).toFixed(2)}%</td>
            </tr>
            <tr>
                <th>Valor INSS por RRA:</th>
                <td>R$ ${formatarMoeda(valorSemDesagio / (primeiroHerdeiro.rrapagamento || 1))} ${base > 8157.41 ? '(TETO)' : ''}</td>
            </tr>
            <tr ${!isAcordo ? 'class="linha-gold"' : ''}>
                <td class="bold">Valor Previdência ${isAcordo ? 'sem Deságio' : 'por Herdeiro'}:</td>
                <td class="bold">${!isAcordo ? '<strong>' : ''}R$ ${formatarMoeda(valorSemDesagio)}${!isAcordo ? '</strong>' : ''}</td>
            </tr>
            ${isAcordo && primeiroHerdeiro.valorDesagioPrevidencia > 0 ? `
            <tr class="linha-gold">
                <td class="bold">Valor Previdência com Deságio ${(percentualDesagio * 100).toFixed(2)}%:</td>
                <td class="bold"><strong>R$ ${formatarMoeda(valorComDesagio)}</strong></td>
            </tr>` : ''}
            <tr style="border-top: 1px solid #dee2e6;">
                <th colspan="2" style="background-color: #f8f9fa; font-weight: bold;">📊 Distribuição:</th>
            </tr>
            ${distribuicaoHerdeiros}
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
            <tr class="linha-gold">
                <td class="bold">TOTAL A SER RECOLHIDO (${arredondarRRA(primeiroHerdeiro.rraComDesagio || primeiroHerdeiro.rrapagamento)} meses):</td>
                <td class="bold">R$ ${formatarMoeda(primeiroHerdeiro.valorIR)}</td>
            </tr>
            <tr style="border-top: 1px solid #dee2e6;">
                <th colspan="2" style="background-color: #f8f9fa; font-weight: bold;">📊 Distribuição:</th>
            </tr>
            ${distribuicaoHerdeiros}
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
                <th>Principal (base):</th>
                <td>R$ ${formatarMoeda(primeiroHerdeiro.principal)}</td>
            </tr>
            <tr>
                <th>Alíquota Fixa:</th>
                <td>${(aliquotaFixa * 100).toFixed(2)}%</td>
            </tr>
            <tr ${!isAcordo ? 'class="linha-gold"' : ''}>
                <td class="bold">Valor Previdência ${isAcordo ? 'sem Deságio' : 'por Herdeiro'}:</td>
                <td class="bold">${!isAcordo ? '<strong>' : ''}R$ ${formatarMoeda(valorSemDesagio)}${!isAcordo ? '</strong>' : ''}</td>
            </tr>
            ${isAcordo && primeiroHerdeiro.valorDesagioPrevidencia > 0 ? `
            <tr class="linha-gold">
                <td class="bold">Valor Previdência com Deságio ${(percentualDesagio * 100).toFixed(2)}%:</td>
                <td class="bold">R$ ${formatarMoeda(valorComDesagio)}</td>
            </tr>` : ''}
            <tr style="border-top: 1px solid #dee2e6;">
                <th colspan="2" style="background-color: #f8f9fa; font-weight: bold;">📊 Distribuição:</th>
            </tr>
            ${distribuicaoHerdeiros}
        </table>
    `;
}

function gerarDetalhePrevidenciaINSSHerdeiros(herdeiros, dados, valorBase) {
    const primeiroHerdeiro = herdeiros[0];
    const isAcordo = dados.tipoCalculo === 'acordo';
    const percentualDesagio = dados.percentualAcordo || 0;
    
    const base = primeiroHerdeiro.rrapagamento === 0 ? primeiroHerdeiro.principal : primeiroHerdeiro.principal / primeiroHerdeiro.rrapagamento;
    
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
                <th>Principal (base):</th>
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
            <tr>
                <th>Alíquota Efetiva INSS:</th>
                <td>${(primeiroHerdeiro.aliquotaEfetiva * 100).toFixed(2)}%</td>
            </tr>
            <tr>
                <th>Valor INSS por RRA:</th>
                <td>R$ ${formatarMoeda(valorSemDesagio / (primeiroHerdeiro.rrapagamento || 1))} ${base > 8157.41 ? '(TETO)' : ''}</td>
            </tr>
            <tr ${!isAcordo ? 'class="linha-gold"' : ''}>
                <td class="bold">Valor Previdência ${isAcordo ? 'sem Deságio' : 'por Herdeiro'}:</td>
                <td class="bold">${!isAcordo ? '<strong>' : ''}R$ ${formatarMoeda(valorSemDesagio)}${!isAcordo ? '</strong>' : ''}</td>
            </tr>
            ${isAcordo && primeiroHerdeiro.valorDesagioPrevidencia > 0 ? `
            <tr class="linha-gold">
                <td class="bold">Valor Previdência com Deságio ${(percentualDesagio * 100).toFixed(2)}%:</td>
                <td class="bold">R$ ${formatarMoeda(valorComDesagio)}</td>
            </tr>` : ''}
            <tr style="border-top: 1px solid #dee2e6;">
                <th colspan="2" style="background-color: #f8f9fa; font-weight: bold;">📊 Distribuição:</th>
            </tr>
            ${distribuicaoHerdeiros}
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
            <tr class="linha-gold">
                <td class="bold">TOTAL A SER RECOLHIDO (${arredondarRRA(primeiroHerdeiro.rraComDesagio || primeiroHerdeiro.rrapagamento)} meses):</td>
                <td class="bold">R$ ${formatarMoeda(primeiroHerdeiro.valorIR)}/td>
            </tr>
            <tr style="border-top: 1px solid #dee2e6;">
                <th colspan="2" style="background-color: #f8f9fa; font-weight: bold;">📊 Distribuição:</th>
            </tr>
            ${distribuicaoHerdeiros}
        </table>
    `;
}