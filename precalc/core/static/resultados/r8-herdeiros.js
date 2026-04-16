function gerarSecaoHerdeiros(resultados, dados) {
    if (!resultados.temHerdeiros || resultados.herdeiros.length === 0) return '';
    
    const proporcaoContratual = (resultados.totaisPorTipo?.contratual > 0)
        ? resultados.totaisPorTipo.contratual / resultados.totaisPorTipo.total
        : 1;
    
    const rraTotal = resultados.rraTotal || 0;
    const valortotatt = resultados.valortotatt || 0;

    // Calcular totais primeiro para saber o que mostrar
    const totalRealHerdeiros = resultados.herdeiros.reduce((sum, h) => 
        sum + (h.valorAposCessoesBeneficiario || h.valorTotalOriginal), 0
    );
    const valorBaseContratualTotal = totalRealHerdeiros * proporcaoContratual;
    const totalHonorarios = (dados.advogados || []).reduce((sum, adv) => 
        sum + (valorBaseContratualTotal * adv.percentual), 0
    );
    const totalSindicatos = (dados.sindicatos || []).reduce((sum, sind) => 
        sum + (totalRealHerdeiros * sind.percentual), 0
    );
    const totalLiquido = totalRealHerdeiros - totalHonorarios - totalSindicatos;
    const totalRRA = (rraTotal !== 0 && valortotatt > 0)
        ? Math.round((totalRealHerdeiros * rraTotal) / valortotatt)
        : 0;

    // Flags para colunas opcionais
    const temHonorarios = totalHonorarios > 0;
    const temSindicatos = totalSindicatos > 0;
    const temRRA = totalRRA > 0;

    const linhasHerdeiros = resultados.herdeiros.map(h => {
        const valorBruto = h.valorAposCessoesBeneficiario || h.valorTotalOriginal;
        const valorBaseContratual = valorBruto * proporcaoContratual;
        const honorarioTotal = (dados.advogados || []).reduce((sum, adv) => 
            sum + (valorBaseContratual * adv.percentual), 0
        );
        const sindicatoTotal = (dados.sindicatos || []).reduce((sum, sind) => 
            sum + (valorBruto * sind.percentual), 0
        );
        const valorLiquido = valorBruto - honorarioTotal - sindicatoTotal;
        const rra = (rraTotal !== 0 && valortotatt > 0) 
            ? Math.round((valorBruto * rraTotal) / valortotatt) 
            : 0;
        
        return `
            <tr>
                <td>${h.nome}</td>
                <td>${(h.percentual * 100).toFixed(2)}%</td>
                <td>R$ ${formatarMoeda(valorBruto)}</td>
                ${temHonorarios ? `<td>R$ ${formatarMoeda(honorarioTotal)}</td>` : ''}
                ${temSindicatos ? `<td>R$ ${formatarMoeda(sindicatoTotal)}</td>` : ''}
                <td>R$ ${formatarMoeda(valorLiquido)}</td>
                ${temRRA ? `<td>${rra || 0}</td>` : ''}
            </tr>
        `;
    }).join('');

    const houveCessao = resultados.percentualBeneficiarioFinal && resultados.percentualBeneficiarioFinal < 1;
    const infoCessao = houveCessao ? `
        <div class="success-box" style="margin-bottom: 12px; padding: 10px; border-radius: 4px; background-color:#fff3cd; color:#856404;">
            <strong>⚠️ Cessão do Beneficiário Principal:</strong><br>
            O beneficiário cedeu ${((1 - resultados.percentualBeneficiarioFinal) * 100).toFixed(2)}% do precatório antes do falecimento.<br>
            <strong>Valor cedido:</strong> R$ ${formatarMoeda(valortotatt - totalRealHerdeiros)} &nbsp;·&nbsp;
            <strong>Disponível para herdeiros:</strong> R$ ${formatarMoeda(totalRealHerdeiros)}
        </div>
    ` : '';
    
    return `
        <div class="cessoes-beneficiario">
            <div class="table-container">
                <h3>👨‍👩‍👧‍👦 Distribuição entre Herdeiros</h3>
                ${infoCessao}
                <table>
                    <tr>
                        <th>Nome Herdeiro</th>
                        <th>%</th>
                        <th>Valor Bruto</th>
                        ${temHonorarios ? '<th>Hon. Contratuais</th>' : ''}
                        ${temSindicatos ? '<th>Sindicatos</th>' : ''}
                        <th>Valor Líquido*</th>
                        ${temRRA ? '<th>RRA</th>' : ''}
                    </tr>
                    ${linhasHerdeiros}
                    <tr class="highlight-green">
                        <td><strong>TOTAIS</strong></td>
                        <td><strong>100%</strong></td>
                        <td><strong>R$ ${formatarMoeda(totalRealHerdeiros)}</strong></td>
                        ${temHonorarios ? `<td><strong>R$ ${formatarMoeda(totalHonorarios)}</strong></td>` : ''}
                        ${temSindicatos ? `<td><strong>R$ ${formatarMoeda(totalSindicatos)}</strong></td>` : ''}
                        <td><strong>R$ ${formatarMoeda(totalLiquido)}</strong></td>
                        ${temRRA ? `<td><strong>${totalRRA}</strong></td>` : ''}
                    </tr>
                </table>
                <div class="success-box" style="margin-top: 10px; padding: 10px; border-radius: 4px;">
                    * Valor líquido sem considerar Previdência e IR
                </div>
            </div>
        </div>
    `;
}