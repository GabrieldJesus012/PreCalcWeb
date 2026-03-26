// CESSOES SINDICATOS E ADVOGADOS

function gerarSecaoCessoesSindicatos(resultados, dados) {
    if (!resultados.sindicatos) return '';
    
    const isPreferencia = dados.tipoCalculo === 'preferencia';
    
    if (isPreferencia) return '';
    
    const sindicatosComCessao = resultados.sindicatos.filter(sind => 
        sind.cessoesSind && sind.cessoesSind.length > 0
    );
    
    if (sindicatosComCessao.length === 0) return '';

    const secoesSindicatos = sindicatosComCessao.map(sind => {
        const pluralCessionarios = sind.cessoesSind.length > 1 ? 's' : '';
        
        const linhasCessionarios = (sind.cessionarios || []).map(cessionario => `
            <tr>
                <td>${cessionario.nome} (cessionário)</td>
                <td>${(cessionario.percentual * 100).toFixed(2)}%</td>
                <td>R$ ${formatarMoeda(cessionario.valorBruto)}</td>
            </tr>
        `).join('');
        
        return `
            <div style="margin-bottom: 20px;">
                <h4>🔄 Cessão de Sindicato: ${sind.nome}</h4>
                <p><strong>Valor do Direito do Sindicato:</strong> R$ ${formatarMoeda(sind.valorBruto)}</p>
                <p><strong>Cedido:</strong> ${(sind.percentualCessionarioSind * 100).toFixed(2)}% para ${sind.cessoesSind.length} cessionário${pluralCessionarios}</p>
                
                <table>
                    <tr><th>Recebedor</th><th>Percentual</th><th>Valor Bruto</th></tr>
                    <tr style="background-color: #f8f9fa;">
                        <td><strong>${sind.nome} (fica com)</strong></td>
                        <td>${(sind.percentualSindicato * 100).toFixed(2)}%</td>
                        <td>R$ ${formatarMoeda(sind.valorBrutoSindicato)}</td>
                    </tr>
                    ${linhasCessionarios}
                    <tr class="highlight" style="background-color: #e9ecef; font-weight: bold; border-top: 2px solid #dee2e6;">
                        <td>TOTAL</td>
                        <td>100.00%</td>
                        <td>R$ ${formatarMoeda(sind.valorBruto)}</td>
                    </tr>
                </table>
            </div>
        `;
    }).join('');

    return `
        <div class="table-container">
            <h3>🔄 Cessões de Sindicatos</h3>
            ${secoesSindicatos}
        </div>
    `;
}

