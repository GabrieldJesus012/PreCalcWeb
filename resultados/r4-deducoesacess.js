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

    return `
        <div class="deducoes-acessorias">
            <div class="table-container">
                <h3>📄➖ Deduções Acessórias</h3>
                <div class="explicacao-juridica">
                    <div class="titulo">Entenda as Deduções Acessórias</div>
                    <p><strong>Contribuições Sindicais:</strong> Percentual devido aos sindicatos quando aplicável.</p>
                    <p><strong>Honorários Advocatícios:</strong> Percentual devido aos advogados conforme contrato.</p>
                </div>
                ${secaoSindicatos}
                ${secaoHonorarios}
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
            <td>R$ ${formatarMoeda(baseCalculoSindicato)}</td>
            <td>${(s.percentual * 100).toFixed(2)}%</td>
            <td>R$ ${formatarMoeda(s.valorBruto)}</td>
        </tr>
    `).join('');
    
    const totalSindicatos = resultados.sindicatos.reduce((sum, s) => sum + s.valorBruto, 0);
    
    return `
        <h3>🏛️ Sindicatos</h3>
        <table>
            <tr><th>Nome Sindicato</th><th>Base de Cálculo</th><th>Percentual</th><th>Valor Bruto</th></tr>
            ${linhasSindicatos}
            <tr class="highlight" style="background-color: #e9ecef; font-weight: bold; border-top: 2px solid #dee2e6;">
                <td colspan="3"><strong>TOTAL SINDICATOS</strong></td>
                <td><strong>R$ ${formatarMoeda(totalSindicatos)}</strong></td>
            </tr>
        </table>
    `;
}

function gerarSecaoHonorarios(resultados, dados, honorariosParaMostrar, temHerdeiros) {
    const baseGroups = agruparPorBaseCalculo(resultados, dados, temHerdeiros);
    
    const secoes = [];
    
    baseGroups.forEach((herdeiros, base) => {
        const valorBase = (base === 'PRINCIPAL') ? herdeiros[0].valorTotal : parseFloat(base);
        const herdeirosNomes = herdeiros.map(h => h.nome).join(', ');
        
        const titulo = dados.tipoCalculo === 'preferencia' && valorBase < resultados.valortotatt
            ? '👩‍💼 Advogados (H.Contratuais) - Honorários da Preferência'
            : '👩‍💼 Advogados (H.Contratuais)';

        const linhasAdvogados = honorariosParaMostrar.map(a => `
            <tr>
                <td>${a.nome}</td>
                <td>${a.tipo}</td>
                <td>R$ ${formatarMoeda(valorBase)}</td>
                <td>${(a.percentual * 100).toFixed(2)}%</td>
                <td>R$ ${formatarMoeda(valorBase * a.percentual)}</td>
            </tr>
        `).join('');

        const totalPercentual = honorariosParaMostrar.reduce((sum, h) => sum + h.percentual, 0);
        const totalValor = valorBase * totalPercentual;

        secoes.push(`
            <h3>${titulo}</h3>
            <p style="color: #155724; font-style: italic;">
                Valores calculados sobre: R$ ${formatarMoeda(valorBase)}
                <span style="color: #856404;"> - ${herdeirosNomes}</span>
            </p>
            <table>
                <tr><th>Nome Advogado</th><th>PF/PJ</th><th>Base de Cálculo</th><th>Percentual</th><th>Valor Bruto</th></tr>
                ${linhasAdvogados}
                <tr class="highlight" style="background-color: #e9ecef; font-weight: bold; border-top: 2px solid #dee2e6;">
                    <td colspan="3"><strong>TOTAL HONORÁRIOS</strong></td>
                    <td><strong>${(totalPercentual * 100).toFixed(2)}%</strong></td>
                    <td><strong>R$ ${formatarMoeda(totalValor)}</strong></td>
                </tr>
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