// Deducoes acessorias - Honorarios e Sindicatos

function gerarSecaoDeducoesAcessorias(resultados, dados) {
    const temHerdeiros = resultados.temHerdeiros && resultados.herdeiros.length > 0;
    const temSindicatos = resultados.sindicatos && resultados.sindicatos.length > 0;
    
    const { temHonorarios, honorariosParaMostrar } = obterHonorariosParaExibir(resultados, temHerdeiros);
    
    if (!temSindicatos && !temHonorarios) return '';

    const secaoSindicatos = temSindicatos 
        ? gerarSecaoSindicatos(resultados, dados) 
        : '';
    
    const secaoHonorarios = (temHonorarios && honorariosParaMostrar.length > 0)
        ? gerarSecaoHonorarios(resultados, dados, honorariosParaMostrar, temHerdeiros)
        : '';

    const conteudo = (secaoSindicatos && secaoHonorarios)
        ? `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start;">
               <div>${secaoSindicatos}</div>
               <div>${secaoHonorarios}</div>
           </div>`
        : `${secaoSindicatos}${secaoHonorarios}`;

    return `
        <div class="deducoes-acessorias">
            <div class="table-container">
                <h3>📄➖ Deduções Acessórias</h3>
                ${conteudo}
            </div>
        </div>
    `;
}

// ========== FUNÇÕES AUXILIARES DAS DEDUCOES==========

function obterHonorariosParaExibir(resultados, temHerdeiros) {
    let honorariosParaMostrar = [];
    let temHonorarios = false;

    if (temHerdeiros) {
        // Extrair honorários únicos de todos os herdeiros
        const honorariosMap = new Map();
        
        resultados.herdeiros.forEach(h => {
            if (h.honorarios && h.honorarios.length > 0) {
                h.honorarios.forEach(a => {
                    if (!honorariosMap.has(a.nome)) {
                        honorariosMap.set(a.nome, {
                            nome: a.nome,
                            tipo: a.tipo,
                            percentual: a.percentual
                        });
                    }
                });
            }
        });
        
        honorariosParaMostrar = Array.from(honorariosMap.values());
        temHonorarios = honorariosParaMostrar.length > 0;
    } else {
        temHonorarios = resultados.honorarios && resultados.honorarios.length > 0;
        honorariosParaMostrar = resultados.honorarios || [];
    }

    return { temHonorarios, honorariosParaMostrar };
}

function gerarSecaoSindicatos(resultados, dados) {
    const isParcial = dados.tipoCalculo === 'parcial';
    const baseCalculoSindicato = isParcial ? resultados.valorBase : resultados.valortotatt;
    
    const linhasSindicatos = resultados.sindicatos.map(s => `
        <tr>
            <td>${s.nome}</td>
            <td class="right">R$ ${formatarMoeda(baseCalculoSindicato)}</td>
            <td class="right">${(s.percentual * 100).toFixed(2)}%</td>
            <td class="right bold">R$ ${formatarMoeda(s.valorBruto)}</td>
        </tr>
    `).join('');
    
    const totalSindicatos = resultados.sindicatos.reduce((sum, s) => sum + s.valorBruto, 0);
    
    return `
        <div class="res-subsecao">🏛️ Sindicatos</div>
        <table>
            <thead>
                <tr>
                    <th>Nome</th>
                    <th class="right">Base</th>
                    <th class="right">%</th>
                    <th class="right">Valor</th>
                </tr>
            </thead>
            <tbody>${linhasSindicatos}</tbody>
            <tfoot>
                <tr class="linha-gold">
                    <td colspan="3" class="bold">Total Sindicatos</td>
                    <td class="right bold">R$ ${formatarMoeda(totalSindicatos)}</td>
                </tr>
            </tfoot>
        </table>
    `;
}

function gerarSecaoHonorarios(resultados, dados, honorariosParaMostrar, temHerdeiros) {
    const baseGroups = agruparPorBaseCalculo(resultados, dados, temHerdeiros);
    const secoes = [];
    
    baseGroups.forEach((herdeiros, base) => {
        const valorBase = (base === 'PRINCIPAL') ? herdeiros[0].valorTotal : parseFloat(base);
        const herdeirosNomes = herdeiros.map(h => h.nome).join(', ');
        
        const subtitulo = dados.tipoCalculo === 'preferencia' && valorBase < resultados.valortotatt
            ? '👩‍💼 Honorários Contratuais — Preferência'
            : '👩‍💼 Honorários Contratuais';

        const linhasAdvogados = honorariosParaMostrar.map(a => `
            <tr>
                <td>${a.nome}</td>
                <td class="muted">${a.tipo}</td>
                <td class="right">${(a.percentual * 100).toFixed(2)}%</td>
                <td class="right bold">R$ ${formatarMoeda(valorBase * a.percentual)}</td>
            </tr>
        `).join('');

        const totalPercentual = honorariosParaMostrar.reduce((sum, h) => sum + h.percentual, 0);
        const totalValor = valorBase * totalPercentual;

        secoes.push(`
            <div class="res-subsecao">${subtitulo}</div>
            <div style="font-size:11px; color:#6c757d; margin: 4px 0 8px; padding: 0 2px;">
                Base: <strong>R$ ${formatarMoeda(valorBase)}</strong>
                ${herdeirosNomes !== 'Beneficiário Principal' ? ` — ${herdeirosNomes}` : ''}
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Advogado</th>
                        <th>Tipo</th>
                        <th class="right">%</th>
                        <th class="right">Valor</th>
                    </tr>
                </thead>
                <tbody>${linhasAdvogados}</tbody>
                <tfoot>
                    <tr class="linha-gold">
                        <td colspan="2" class="bold">Total Honorários</td>
                        <td class="right bold">${(totalPercentual * 100).toFixed(2)}%</td>
                        <td class="right bold">R$ ${formatarMoeda(totalValor)}</td>
                    </tr>
                </tfoot>
            </table>
        `);
    });

    return secoes.join('');
}

function agruparPorBaseCalculo(resultados, dados, temHerdeiros) {
    const baseGroups = new Map();

    if (temHerdeiros) {
        // Filtrar herdeiros por preferência se necessário
        const herdeirosFiltrados = dados.tipoCalculo === 'preferencia'
            ? resultados.herdeiros.filter(h => h.temPreferencia || h.isPreferenciaParcial)
            : resultados.herdeiros;

        // Agrupar por base de cálculo
        herdeirosFiltrados.forEach(h => {
            let valorBaseContratualHerdeiro = h.valorTotal;
            
            // Ajustar pela proporção contratual se necessário
            if (resultados.totaisPorTipo?.contratual > 0) {
                const proporcaoContratual = resultados.totaisPorTipo.contratual / resultados.totaisPorTipo.total;
                valorBaseContratualHerdeiro = h.valorTotal * proporcaoContratual;
            }
            
            const baseKey = valorBaseContratualHerdeiro.toFixed(2);
            if (!baseGroups.has(baseKey)) {
                baseGroups.set(baseKey, []);
            }
            baseGroups.get(baseKey).push({
                ...h,
                valorTotal: valorBaseContratualHerdeiro
            });
        });
    } else {
        // Sem herdeiros - beneficiário principal
        let valorBaseContratual = resultados.valorBase;

        if (resultados.totaisPorTipo?.contratual > 0) {
            const proporcaoContratual = resultados.totaisPorTipo.contratual / resultados.totaisPorTipo.total;
            valorBaseContratual = resultados.valorBase * proporcaoContratual;
        }

        baseGroups.set('PRINCIPAL', [{
            nome: 'Beneficiário Principal',
            valorTotal: valorBaseContratual
        }]);
    }

    return baseGroups;
}