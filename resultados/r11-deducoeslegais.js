//DEDUCOES LEGAIS

function gerarSecaoDeducoes(resultados, dados) {
    const temPrevidencia = dados.incidenciaPrevidencia || 
        (dados.valoresPrincipais && dados.valoresPrincipais.some(item => item.tributacao?.previdencia === true));
    
    const temIR = (dados.incidenciaIR || 
        (dados.valoresPrincipais && dados.valoresPrincipais.some(item => item.tributacao?.ir === true))) 
        && (dados.tipoBeneficiario === 'pj' || resultados.rrapagamento !== 0);

    if (!temPrevidencia && !temIR) return '';

    if (dados.tipoCalculo === 'acordo') {
        if (!validarAdesaoParaAcordo(dados)) return '';
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

function validarAdesaoParaAcordo(dados) {
    const adesoes = obterAdesaoAcordo();
    const beneficiarioOuHerdeirosAderiram = adesoes.beneficiario || adesoes.herdeiros.length > 0;
    
    const cessionarioRelevante = adesoes.cessionarios.some(cessaoIndex => {
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
        <div style="margin-bottom: 16px; padding: 12px 16px; border-bottom: 1px solid var(--sr-gray-mid, #D5D8DC);">
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
                <div style="margin-bottom: 16px; padding: 12px 16px; border-bottom: 1px solid var(--sr-gray-mid, #D5D8DC);">
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
                <div class="success-box" style="margin: 10px 16px 10px; padding: 10px; border-radius: 4px; font-size: 0.85em;">
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
    if (temPrevidencia && !isPJ) { // PJ não tem previdência
        if (tipoPrevidencia === 'fixa') {
            secaoPrevidencia = gerarDetalhePrevidenciaFixa(resultados, dados, temCessoes);
        } else {
            secaoPrevidencia = gerarDetalhePrevidenciaINSS(resultados, dados, temCessoes);
        }
    }
    
    let secaoIR = '';
    if (temIR) {
        if (isPJ) {
            secaoIR = gerarDetalheIRPJ(resultados, dados, temCessoes);
        } else {
            secaoIR = gerarDetalheIR(resultados, dados, temPrevidencia, temCessoes);
        }
    }

    if (!secaoPrevidencia && !secaoIR) {
        return '';
    }
    
    const titulo = isPJ ? '🏦 Deduções Legais - Pessoa Jurídica' : '🏦 Deduções Legais';
    const conteudo = (secaoPrevidencia && secaoIR)
        ? `<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; padding:16px; align-items:start;">
            ${secaoPrevidencia}
            ${secaoIR}
        </div>`
        : `<div style="padding:16px;">${secaoPrevidencia}${secaoIR}</div>`;
    
    return `
        <div class="deducoes-legais">
            <div class="table-container">
                <h3>${titulo}</h3>
                ${conteudo}
            </div>
        </div>
    `;
}
