function gerarSecaoCessoesAdvogados(resultados, dados) {
    if (!resultados.honorarios || resultados.honorarios.length === 0) return '';

    const temHerdeiros = resultados.temHerdeiros && resultados.herdeiros.length > 0;

    if (temHerdeiros) {
        return gerarCessoesAdvogadosComHerdeiros(resultados, dados);
    } else {
        return gerarCessoesAdvogadosSemHerdeiros(resultados, dados);
    }
}

// ========== FUNÇÕES AUXILIARES DE CESSOES ADVOGADOS ==========

function gerarCessoesAdvogadosComHerdeiros(resultados, dados) {
    const isPreferencia = dados.tipoCalculo === 'preferencia';
    const isParcial = dados.tipoCalculo === 'parcial';

    if (!isPreferencia) {
        // ORDEM OU PARCIAL
        return gerarCessoesAdvogadosOrdem(resultados, dados, isParcial);
    } else {
        // PREFERÊNCIA
        return gerarCessoesAdvogadosPreferencia(resultados, dados);
    }
}

function gerarCessoesAdvogadosOrdem(resultados, dados, isParcial) {
    const advogadosComCessao = resultados.honorarios.filter(adv => 
        adv.cessoesAdv && adv.cessoesAdv.length > 0
    );
    
    if (advogadosComCessao.length === 0) return '';
    
    const secoesCessoes = advogadosComCessao.map(adv => {
        // Calcular valores conforme tipo
        const { valorHonorario, valorAdvogado } = isParcial
            ? { 
                valorHonorario: resultados.valorBase * adv.percentual,
                valorAdvogado: resultados.valorBase * adv.percentualAdvogado 
            }
            : { 
                valorHonorario: adv.valorBruto,
                valorAdvogado: adv.valorBrutoAdvogado 
            };
        const proporcaoContratual = resultados.totaisPorTipo?.contratual 
        ? resultados.totaisPorTipo.contratual / resultados.totaisPorTipo.total 
        : 1;
        const valorBasePrecatorio = isParcial 
            ? resultados.valorBase 
            : resultados.valortotatt;
        const valorBaseContratual = valorBasePrecatorio * proporcaoContratual;

        // Linhas dos cessionários
        const linhasCessionarios = (adv.cessionarios || []).map(cessionario => {
            const valorCessionario = valorBaseContratual * cessionario.percentual;
            
            return `
                <tr>
                    <td>${cessionario.nome} (cessionário)</td>
                    <td>${(cessionario.percentual * 100).toFixed(2)}%</td>
                    <td>R$ ${formatarMoeda(valorCessionario)}</td>
                </tr>
            `;
        }).join('');

        const valorTotalSobrePrecatorio = valorBaseContratual * adv.percentual;

        const pluralCessionarios = adv.cessoesAdv.length > 1 ? 's' : '';
        const textoTipo = isParcial ? ' (Parcial)' : '';

        return `
            <div style="margin-bottom: 20px;">
                <h4>🔄 Cessão de Honorários: ${adv.nome}</h4>
                <p><strong>Valor do Honorário${textoTipo}:</strong> R$ ${formatarMoeda(valorHonorario)}</p>
                <p><strong>Cedido:</strong> ${(adv.percentualCessionarioAdv * 100).toFixed(2)}% para ${adv.cessoesAdv.length} cessionário${pluralCessionarios}</p>
                
                <table>
                    <tr><th>Recebedor</th><th>Percentual</th><th>Valor Bruto</th></tr>
                    <tr style="background-color: #f8f9fa;">
                        <td><strong>${adv.nome} (fica com)</strong></td>
                        <td>${(adv.percentualAdvogado * 100).toFixed(2)}%</td>
                        <td>R$ ${formatarMoeda(valorAdvogado)}</td>
                    </tr>
                    ${linhasCessionarios}
                    <tr class="highlight" style="background-color: #e9ecef; font-weight: bold; border-top: 2px solid #dee2e6;">
                        <td>TOTAL</td>
                        <td>${(adv.percentual * 100).toFixed(2)}%</td>
                        <td>R$ ${formatarMoeda(valorTotalSobrePrecatorio)}</td>
                    </tr>
                </table>
            </div>
        `;
    }).join('');
    
    const titulo = isParcial 
        ? '🔄 Cessões de Honorários - Pagamento Parcial' 
        : '🔄 Cessões de Honorários';
    
    return `
        <div class="table-container">
            <h3>${titulo}</h3>
            ${secoesCessoes}
        </div>
    `;
}

function gerarCessoesAdvogadosPreferencia(resultados, dados) {
    const isPreferenciaParcial = resultados.valorBase < resultados.valortotatt;
    
    const herdeirosFiltrados = resultados.herdeiros.filter(h => 
        h.temPreferencia || h.isPreferenciaParcial
    );
    
    // Agrupar herdeiros por valor base
    const baseGroups = new Map();
    herdeirosFiltrados.forEach(h => {
        const baseKey = h.valorTotal.toFixed(2);
        if (!baseGroups.has(baseKey)) {
            baseGroups.set(baseKey, []);
        }
        baseGroups.get(baseKey).push(h);
    });
    
    const secoesPorBase = [];
    
    baseGroups.forEach((herdeiros, base) => {
        const valorBase = parseFloat(base);
        const herdeirosNomes = herdeiros.map(h => h.nome).join(', ');
        const grupoEPreferenciaParcial = herdeiros.some(h => h.isPreferenciaParcial);
        
        const advogadosComCessao = resultados.honorarios.filter(adv => 
            adv.cessoesAdv && adv.cessoesAdv.length > 0
        );
        
        if (advogadosComCessao.length === 0) return;
        
        const proporcaoContratual = resultados.totaisPorTipo?.contratual 
            ? resultados.totaisPorTipo.contratual / resultados.totaisPorTipo.total 
            : 1;
        const valorBaseContratual = valorBase * proporcaoContratual;
        
        const secoesCessoes = advogadosComCessao.map(adv => {
            const valorHonorarioAdvogado = valorBaseContratual * adv.percentual;
            const valorAdvogadoAposCessao = valorBaseContratual * adv.percentualAdvogado;
            
            const linhasCessionarios = grupoEPreferenciaParcial
                ? gerarLinhasCessionariosAguardando(adv.cessionarios, valorBaseContratual)
                : gerarLinhasCessionariosRecebendo(adv.cessionarios, valorBaseContratual);
            
            const pluralCessionarios = adv.cessoesAdv.length > 1 ? 's' : '';
            
            return `
                <div style="margin-bottom: 20px;">
                    <h4>🔄 Cessão de Honorários: ${adv.nome}</h4>
                    <p><strong>Valor do Honorário (Preferência):</strong> R$ ${formatarMoeda(valorHonorarioAdvogado)}</p>
                    <p><strong>Cedido:</strong> ${(adv.percentualCessionarioAdv * 100).toFixed(2)}% para ${adv.cessoesAdv.length} cessionário${pluralCessionarios}</p>
                    
                    <table>
                        <tr><th>Recebedor</th><th>Percentual</th><th>Valor Bruto</th></tr>
                        <tr style="background-color: #f8f9fa;">
                            <td><strong>${adv.nome} (recebe)</strong></td>
                            <td>${(adv.percentualAdvogado * 100).toFixed(2)}%</td>
                            <td>R$ ${formatarMoeda(valorAdvogadoAposCessao)}</td>
                        </tr>
                        ${linhasCessionarios}
                        <tr class="highlight" style="background-color: #e9ecef; font-weight: bold; border-top: 2px solid #dee2e6;">
                            <td>TOTAL</td>
                            <td>${(adv.percentual * 100).toFixed(2)}%</td>
                            <td>R$ ${formatarMoeda(valorHonorarioAdvogado)}</td>
                        </tr>
                    </table>
                </div>
            `;
        }).join('');
        
        const statusPreferencia = grupoEPreferenciaParcial ? ' (Preferência Parcial)' : ' (Preferência Total)';
        
        secoesPorBase.push(`
            <div style="margin-bottom: 30px;">
                <h4>Herdeiros: ${herdeirosNomes}${statusPreferencia}</h4>
                <p><strong>Valor Base:</strong> R$ ${formatarMoeda(valorBase)}</p>
                ${secoesCessoes}
            </div>
        `);
    });
    
    if (secoesPorBase.length === 0) return '';
    
    const titulo = isPreferenciaParcial 
        ? '🔄 Cessões de Honorários - Preferência (Parcial/Total)'
        : '🔄 Cessões de Honorários - Preferência Total';
    
    const explicacao = `• <strong>Preferência por grupo:</strong> Cada grupo tem tratamento específico<br>
        • <strong>Parcial:</strong> Só advogados recebem, cessionários aguardam<br>
        • <strong>Total:</strong> Advogados e cessionários recebem integralmente<br>
        • <strong>Valores calculados</strong> conforme situação de cada grupo`;
    
    return `
        <div class="table-container">
            <h3>${titulo}</h3>
            ${secoesPorBase.join('')}
            <div style="margin-top: 10px; padding: 12px; background-color: #f8f9fa; border-left: 4px solid #007bff; font-size: 0.9em;">
                <strong>💡 Explicação da Preferência:</strong><br>
                ${explicacao}
            </div>
        </div>
    `;
}

function gerarCessoesAdvogadosSemHerdeiros(resultados, dados) {
    const advogadosComCessao = resultados.honorarios.filter(adv => 
        adv.cessoesAdv && adv.cessoesAdv.length > 0
    );
    
    if (advogadosComCessao.length === 0) return '';
    
    const isPreferencia = dados.tipoCalculo === 'preferencia';
    const isParcial = dados.tipoCalculo === 'parcial';
    const isPreferenciaParcial = isPreferencia && resultados.valorBase < resultados.valortotatt;
    
    const proporcaoContratual = resultados.totaisPorTipo?.contratual 
        ? resultados.totaisPorTipo.contratual / resultados.totaisPorTipo.total 
        : 1;
    
    const secoesCessoes = advogadosComCessao.map(adv => {
        let valorBasePrecatorio, valorBaseContratual;
        if (isParcial) {
            valorBasePrecatorio = resultados.valorBase;
            valorBaseContratual = valorBasePrecatorio * proporcaoContratual;
        } else if (isPreferencia) {
            valorBasePrecatorio = resultados.valorBase;
            valorBaseContratual = valorBasePrecatorio * proporcaoContratual;
        } else {
            // Ordem: usa valortotatt (total do precatório)
            valorBasePrecatorio = resultados.valortotatt;
            valorBaseContratual = valorBasePrecatorio * proporcaoContratual;
        }
        
        let valorHonorario, valorAdvogado;
        
        if (isPreferenciaParcial) {
            // Preferência parcial: usa valores já calculados (adv.valorBruto)
            valorHonorario = adv.valorBruto;
            valorAdvogado = adv.valorBrutoAdvogado;
        } else {
            // Todos os outros casos: calcula sobre valorBaseContratual
            valorHonorario = valorBaseContratual * adv.percentual;
            valorAdvogado = valorBaseContratual * adv.percentualAdvogado;
        }
        
        let linhasCessionarios = '';
        if (isPreferenciaParcial) {
            linhasCessionarios = gerarLinhasCessionariosAguardando(adv.cessionarios, valorBaseContratual);
        } else if (isParcial) {
            linhasCessionarios = (adv.cessionarios || []).map(cessionario => {
                const valorCessionario = valorBaseContratual * cessionario.percentual;
                return `
                    <tr>
                        <td>${cessionario.nome} (cessionário)</td>
                        <td>${(cessionario.percentual * 100).toFixed(2)}%</td>
                        <td>R$ ${formatarMoeda(valorCessionario)}</td>
                    </tr>
                `;
            }).join('');
        } else {
            linhasCessionarios = gerarLinhasCessionariosRecebendo(adv.cessionarios, valorBaseContratual);
        }
        
        const pluralCessionarios = adv.cessoesAdv.length > 1 ? 's' : '';
        let textoTipo = '';
        if (isPreferenciaParcial) textoTipo = ' (Preferência)';
        else if (isParcial) textoTipo = ' (Parcial)';
        
        return `
            <div style="margin-bottom: 20px;">
                <h4>🔄 Cessão de Honorários: ${adv.nome}</h4>
                <p><strong>Valor do Honorário${textoTipo}:</strong> R$ ${formatarMoeda(valorHonorario)}</p>
                <p><strong>Cedido:</strong> ${(adv.percentualCessionarioAdv * 100).toFixed(2)}% para ${adv.cessoesAdv.length} cessionário${pluralCessionarios}</p>
                
                <table>
                    <tr><th>Recebedor</th><th>Percentual</th><th>Valor Bruto</th></tr>
                    <tr style="background-color: #f8f9fa;">
                        <td><strong>${adv.nome} (fica com)</strong></td>
                        <td>${(adv.percentualAdvogado * 100).toFixed(2)}%</td>
                        <td>R$ ${formatarMoeda(valorAdvogado)}</td>
                    </tr>
                    ${linhasCessionarios}
                    <tr class="highlight" style="background-color: #e9ecef; font-weight: bold; border-top: 2px solid #dee2e6;">
                        <td>TOTAL</td>
                        <td>${(adv.percentual * 100).toFixed(2)}%</td>
                        <td>R$ ${formatarMoeda(valorHonorario)}</td>
                    </tr>
                </table>
            </div>
        `;
    }).join('');
    
    let titulo = '🔄 Cessões de Honorários';
    if (isPreferenciaParcial) titulo += ' - Preferência (Parcial)';
    else if (isParcial) titulo += ' - Pagamento Parcial';
    
    return `
        <div class="table-container">
            <h3>${titulo}</h3>
            ${secoesCessoes}
        </div>
    `;
}

function gerarLinhasCessionariosAguardando(cessionarios, valorBaseContratual) {
    return (cessionarios || []).map(cessionario => {
        const valorCessionario = valorBaseContratual * cessionario.percentual;
        return `
            <tr>
                <td>${cessionario.nome} (cessionário) - <em>aguarda</em></td>
                <td>${(cessionario.percentual * 100).toFixed(2)}%</td>
                <td>R$ ${formatarMoeda(valorCessionario)}</td>
            </tr>
        `;
    }).join('');
}

function gerarLinhasCessionariosRecebendo(cessionarios, valorBaseContratual) {
    return (cessionarios || []).map(cessionario => {
        const valorCessionario = valorBaseContratual * cessionario.percentual;
        
        return `
            <tr>
                <td>${cessionario.nome} (cessionário)</td>
                <td>${(cessionario.percentual * 100).toFixed(2)}%</td>
                <td>R$ ${formatarMoeda(valorCessionario)}</td>
            </tr>
        `;
    }).join('');
}