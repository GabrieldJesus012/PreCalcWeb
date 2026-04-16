function gerarSecaoCessoesHerdeiros(resultados, dados) {
    const temHerdeiros = resultados.temHerdeiros && resultados.herdeiros.length > 0;
    if (!temHerdeiros) return '';
    
    const herdeirosComCessoes = resultados.herdeiros.filter(h => 
        h.cessoesHerdeiro && h.cessoesHerdeiro.length > 0
    );
    
    if (herdeirosComCessoes.length === 0) return '';
    
    const isPreferencia = dados.tipoCalculo === 'preferencia';
    const percentualTotalAdv = dados.advogados.reduce((sum, adv) => sum + adv.percentual, 0);
    const percentualTotalSind = dados.sindicatos.reduce((sum, sind) => sum + sind.percentual, 0);
    const percentualDeducoes = percentualTotalAdv + percentualTotalSind;

    // Calcular temAguarda global antes do loop
    const temAguarda = herdeirosComCessoes.some(h => isPreferencia && h.isPreferenciaParcial);

    let todasLinhas = '';

    herdeirosComCessoes.forEach(herdeiro => {
        const valorOriginal = herdeiro.valorTotalOriginal;
        const totalCedido = herdeiro.cessoesHerdeiro.reduce((sum, c) => sum + c.percentual, 0);
        const isPreferenciaParcial = isPreferencia && herdeiro.isPreferenciaParcial;

        const valorBrutoHerdeiro = valorOriginal * (1 - totalCedido);
        const deducoesHerdeiro = valorBrutoHerdeiro * percentualDeducoes;
        const valorLiquidoHerdeiro = valorBrutoHerdeiro - deducoesHerdeiro;

        const herdeiroRecebeAgora = isPreferenciaParcial
            ? Math.min(valorLiquidoHerdeiro, herdeiro.valorTotal - (herdeiro.valorTotal * percentualDeducoes))
            : valorLiquidoHerdeiro;
        const herdeiroAguarda = isPreferenciaParcial
            ? Math.max(0, valorLiquidoHerdeiro - herdeiroRecebeAgora)
            : 0;

        const calcularCessionario = (cessao) => {
            const valorBruto = valorOriginal * cessao.percentual;
            const deducoes = valorBruto * percentualDeducoes;
            const valorLiquido = valorBruto - deducoes;
            const recebe = isPreferenciaParcial ? 0 : valorLiquido;
            const aguarda = isPreferenciaParcial ? valorLiquido : 0;
            return { valorBruto, deducoes, valorLiquido, recebe, aguarda };
        };

        const totalDeducoes = valorOriginal * percentualDeducoes;
        const totalLiquido = valorOriginal - totalDeducoes;
        const totalRecebe = herdeiroRecebeAgora + herdeiro.cessoesHerdeiro.reduce((sum, c) => 
            sum + calcularCessionario(c).recebe, 0);
        const totalAguarda = herdeiroAguarda + herdeiro.cessoesHerdeiro.reduce((sum, c) => 
            sum + calcularCessionario(c).aguarda, 0);

        const listaCessionarios = herdeiro.cessoesHerdeiro
            .map(c => `${c.cessionario} (${(c.percentual * 100).toFixed(2)}%)`)
            .join(', ');

        // Linha de título do herdeiro
        todasLinhas += `
            <tr style="background:var(--sr-blue-light) !important;">
                <td colspan="${temAguarda ? 7 : 6}" style="font-weight:600; color:var(--sr-blue-dark); padding:8px 14px; font-size:13px;">
                    ${herdeiro.nome} &nbsp;·&nbsp;
                    <span style="font-weight:400;">Total cedido: ${(totalCedido * 100).toFixed(2)}% para: ${listaCessionarios}</span>
                </td>
            </tr>
        `;

        // Linha do herdeiro
        const percentualFica = (1 - totalCedido) * 100;
        if (percentualFica === 0) {
            todasLinhas += `
                <tr style="background:#F8F9FA !important;">
                    <td style="color:var(--sr-gray); font-style:italic;">
                        ${herdeiro.nome} (cedeu integralmente — valor original: R$ ${formatarMoeda(valorOriginal)})
                    </td>
                    <td style="color:var(--sr-gray);">—</td>
                    <td style="color:var(--sr-gray);">—</td>
                    <td style="color:var(--sr-gray);">—</td>
                    <td style="color:var(--sr-gray);">—</td>
                    <td>R$ ${formatarMoeda(herdeiroRecebeAgora)}</td>
                    ${temAguarda ? `<td style="color:var(--sr-gray);">—</td>` : ''}
                </tr>
            `;
        } else {
            todasLinhas += `
                <tr>
                    <td>${herdeiro.nome}</td>
                    <td>${percentualFica.toFixed(2)}%</td>
                    <td>R$ ${formatarMoeda(valorBrutoHerdeiro)}</td>
                    <td>R$ ${formatarMoeda(deducoesHerdeiro)} (${(percentualDeducoes * 100).toFixed(2)}%)</td>
                    <td>R$ ${formatarMoeda(valorLiquidoHerdeiro)}</td>
                    <td>R$ ${formatarMoeda(herdeiroRecebeAgora)}</td>
                    ${temAguarda ? `<td>R$ ${formatarMoeda(herdeiroAguarda)}</td>` : ''}
                </tr>
            `;
        }

        // Linhas dos cessionários
        herdeiro.cessoesHerdeiro.forEach(cessao => {
            const { valorBruto, deducoes, valorLiquido, recebe, aguarda } = calcularCessionario(cessao);
            todasLinhas += `
                <tr style="background:#FEF5E7 !important;">
                    <td style="padding-left:28px; color:var(--sr-orange-dark);">
                        ↳ ${cessao.cessionario}
                        <small style="color:var(--sr-gray);">(Cessionário de ${herdeiro.nome})${isPreferenciaParcial ? ' — <em>aguarda</em>' : ''}</small>
                    </td>
                    <td style="color:var(--sr-orange-dark);">${(cessao.percentual * 100).toFixed(2)}%</td>
                    <td style="color:var(--sr-orange-dark);">R$ ${formatarMoeda(valorBruto)}</td>
                    <td style="color:var(--sr-orange-dark);">R$ ${formatarMoeda(deducoes)} (${(percentualDeducoes * 100).toFixed(2)}%)</td>
                    <td style="color:var(--sr-orange-dark);">R$ ${formatarMoeda(valorLiquido)}</td>
                    <td style="color:var(--sr-orange-dark);">R$ ${formatarMoeda(recebe)}</td>
                    ${temAguarda ? `<td style="color:var(--sr-orange-dark);">R$ ${formatarMoeda(aguarda)}</td>` : ''}
                </tr>
            `;
        });

        // Subtotal do herdeiro
        todasLinhas += `
            <tr class="highlight">
                <td><strong>Subtotal — ${herdeiro.nome}</strong></td>
                <td><strong>100.00%</strong></td>
                <td><strong>R$ ${formatarMoeda(valorOriginal)}</strong></td>
                <td><strong>R$ ${formatarMoeda(totalDeducoes)} (${(percentualDeducoes * 100).toFixed(2)}%)</strong></td>
                <td><strong>R$ ${formatarMoeda(totalLiquido)}</strong></td>
                <td><strong>R$ ${formatarMoeda(totalRecebe)}</strong></td>
                ${temAguarda ? `<td><strong>R$ ${formatarMoeda(totalAguarda)}</strong></td>` : ''}
            </tr>
        `;
    });

    return `
        <div class="cessoes-herdeiros">
            <div class="table-container">
                <h3>🔄 Cessões dos Herdeiros</h3>
                <table>
                    <tr>
                        <th>Beneficiário / Cessionário</th>
                        <th>%</th>
                        <th>Valor Bruto</th>
                        <th>Deduções Acessórias</th>
                        <th>Valor Líquido*</th>
                        <th>Recebe Agora</th>
                        ${temAguarda ? '<th>Aguarda Ordem</th>' : ''}
                    </tr>
                    ${todasLinhas}
                </table>
                <div class="success-box" style="margin-top:10px; padding:10px; border-radius:4px; font-size:0.85em;">
                    <strong>📝 Deduções:</strong> Honorários (${(percentualTotalAdv * 100).toFixed(2)}%) + 
                    Sindicatos (${(percentualTotalSind * 100).toFixed(2)}%) = ${(percentualDeducoes * 100).toFixed(2)}%
                    &nbsp;·&nbsp; * Sem considerar Previdência e IR
                </div>
            </div>
        </div>
    `;
}