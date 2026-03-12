// Cessoes herdeiros

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
    
    // Gera seção para cada herdeiro com cessões
    const secoesHerdeiros = herdeirosComCessoes.map(herdeiro => {
        const valorOriginal = herdeiro.valorTotalOriginal;
        const totalCedido = herdeiro.cessoesHerdeiro.reduce((sum, c) => sum + c.percentual, 0);
        
        // Valores do herdeiro após cessões
        const valorBrutoHerdeiro = valorOriginal * (1 - totalCedido);
        const deducoesHerdeiro = valorBrutoHerdeiro * percentualDeducoes;
        const valorLiquidoHerdeiro = valorBrutoHerdeiro - deducoesHerdeiro;
        
        const herdeiroRecebeAgora = isPreferencia && herdeiro.isPreferenciaParcial
            ? Math.min(valorLiquidoHerdeiro, herdeiro.valorTotal - (herdeiro.valorTotal * percentualDeducoes))
            : valorLiquidoHerdeiro;
        
        const herdeiroAguarda = isPreferencia && herdeiro.isPreferenciaParcial
            ? Math.max(0, valorLiquidoHerdeiro - herdeiroRecebeAgora)
            : 0;
        
        // Função auxiliar para calcular valores de cessionário
        const calcularCessionario = (cessao) => {
            const valorBruto = valorOriginal * cessao.percentual;
            const deducoes = valorBruto * percentualDeducoes;
            const valorLiquido = valorBruto - deducoes;
            const recebe = isPreferencia && herdeiro.isPreferenciaParcial ? 0 : valorLiquido;
            const aguarda = isPreferencia && herdeiro.isPreferenciaParcial ? valorLiquido : 0;
            
            return { valorBruto, deducoes, valorLiquido, recebe, aguarda };
        };
        
        // Linhas dos cessionários
        const linhasCessionarios = herdeiro.cessoesHerdeiro.map(cessao => {
            const { valorBruto, deducoes, valorLiquido, recebe, aguarda } = calcularCessionario(cessao);
            
            return `
                <tr>
                    <td>${cessao.cessionario}</td>
                    <td>${(cessao.percentual * 100).toFixed(2)}%</td>
                    <td>R$ ${formatarMoeda(valorBruto)}</td>
                    <td>${(percentualDeducoes * 100).toFixed(2)}%</td>
                    <td>R$ ${formatarMoeda(deducoes)}</td>
                    <td>R$ ${formatarMoeda(valorLiquido)}</td>
                    <td>R$ ${formatarMoeda(recebe)}</td>
                    <td>R$ ${formatarMoeda(aguarda)}</td>
                </tr>
            `;
        }).join('');
        
        // Totais (sobre valor original)
        const totalDeducoes = valorOriginal * percentualDeducoes;
        const totalLiquido = valorOriginal - totalDeducoes;
        
        const totalRecebe = herdeiroRecebeAgora + herdeiro.cessoesHerdeiro.reduce((sum, c) => 
            sum + calcularCessionario(c).recebe, 0
        );
        
        const totalAguarda = herdeiroAguarda + herdeiro.cessoesHerdeiro.reduce((sum, c) => 
            sum + calcularCessionario(c).aguarda, 0
        );
        
        const listaCessionarios = herdeiro.cessoesHerdeiro
            .map(c => `${c.cessionario} (${(c.percentual * 100).toFixed(2)}%)`)
            .join(', ');
        
        const alertBox = isPreferencia && herdeiro.isPreferenciaParcial ? `
            <div class="warning-box" style="margin-top: 10px; padding: 12px; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; color: #856404;">
                <strong>ℹ️ Preferência Parcial:</strong><br>
                • <strong>Cessões calculadas sobre valor original:</strong> R$ ${formatarMoeda(valorOriginal)}<br>
                • <strong>Teto da preferência limita pagamento do herdeiro</strong><br>
                • <strong>Cessionários aguardam</strong> ordem cronológica
            </div>
        ` : `
            <div class="success-box" style="margin-top: 10px; padding: 12px; background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px; color: #155724;">
                <strong>✅ Pagamento Integral:</strong> Herdeiro e cessionários recebem integralmente baseado no valor original.
            </div>
        `;
        
        return `
            <div style="margin-bottom: 30px;">
                <h4>Cessão do Herdeiro: ${herdeiro.nome}</h4>
                <p><strong>Valor Original do Herdeiro:</strong> R$ ${formatarMoeda(valorOriginal)}</p>
                <p><strong>Total Cedido:</strong> ${(totalCedido * 100).toFixed(2)}% para: ${listaCessionarios}</p>
                
                <table>
                    <tr>
                        <th rowspan="2">Beneficiário</th>
                        <th rowspan="2">%</th>
                        <th rowspan="2">Valor Bruto</th>
                        <th colspan="2" style="text-align: center; background-color: #f8f9fa;">Deduções Acessórias</th>
                        <th rowspan="2">Valor Líquido*</th>
                        <th rowspan="2">Recebe Agora</th>
                        <th rowspan="2">Aguarda Ordem</th>
                    </tr>
                    <tr>
                        <th style="background-color: #f8f9fa;">% Total</th>
                        <th style="background-color: #f8f9fa;">Valor</th>
                    </tr>
                    <tr>
                        <td>${herdeiro.nome}</td>
                        <td>${((1 - totalCedido) * 100).toFixed(2)}%</td>
                        <td>R$ ${formatarMoeda(valorBrutoHerdeiro)}</td>
                        <td>${(percentualDeducoes * 100).toFixed(2)}%</td>
                        <td>R$ ${formatarMoeda(deducoesHerdeiro)}</td>
                        <td>R$ ${formatarMoeda(valorLiquidoHerdeiro)}</td>
                        <td>R$ ${formatarMoeda(herdeiroRecebeAgora)}</td>
                        <td>R$ ${formatarMoeda(herdeiroAguarda)}</td>
                    </tr>
                    ${linhasCessionarios}
                    <tr class="highlight" style="background-color: #f8f9fa; font-weight: bold; border-top: 2px solid #dee2e6;">
                        <td>TOTAL</td>
                        <td>100.00%</td>
                        <td>R$ ${formatarMoeda(valorOriginal)}</td>
                        <td>${(percentualDeducoes * 100).toFixed(2)}%</td>
                        <td>R$ ${formatarMoeda(totalDeducoes)}</td>
                        <td>R$ ${formatarMoeda(totalLiquido)}</td>
                        <td>R$ ${formatarMoeda(totalRecebe)}</td>
                        <td>R$ ${formatarMoeda(totalAguarda)}</td>
                    </tr>
                </table>
                
                <div style="padding: 8px; margin: 10px 0; font-size: 0.85em; color: #666;">
                    <p style="margin: 0;">
                        <strong>📝 Deduções Acessórias:</strong> 
                        Honorários (${(percentualTotalAdv * 100).toFixed(2)}%) + 
                        Sindicatos (${(percentualTotalSind * 100).toFixed(2)}%) = 
                        ${(percentualDeducoes * 100).toFixed(2)}%
                    </p>
                    <p style="margin: 5px 0 0 0;">
                        <strong>* Valor Líquido:</strong> Valor após dedução apenas de honorários e sindicatos (IR e Previdência calculados separadamente).
                    </p>
                </div>
                
                ${alertBox}
            </div>
        `;
    }).join('');
    
    return `
        <div class="cessoes-herdeiros">
            <div class="table-container">
                <h3>🔄 Cessões dos Herdeiros</h3>
                <div style="margin-bottom: 20px;">
                    <p><strong>Tipo de Cálculo:</strong> ${dados.tipoCalculo} ${dados.tipoCalculo === 'preferencia' ? '(preferencial)' : '(ordem comum)'}</p>
                    <p><strong>Herdeiros com Cessões:</strong> ${herdeirosComCessoes.length} de ${resultados.herdeiros.length} herdeiros</p>
                    
                    ${secoesHerdeiros}
                </div>
            </div>
        </div>
    `;
}