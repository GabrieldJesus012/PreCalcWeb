// Herdeiros

function gerarSecaoHerdeiros(resultados, dados) {
    if (!resultados.temHerdeiros || resultados.herdeiros.length === 0) return '';
    
    // Contexto geral
    const proporcaoContratual = (resultados.totaisPorTipo?.contratual > 0)
        ? resultados.totaisPorTipo.contratual / resultados.totaisPorTipo.total
        : 1;
    
    const rraTotal = resultados.rraTotal || 0;
    const valortotatt = resultados.valortotatt || 0;
    
    // Gerar linhas dos herdeiros
    const linhasHerdeiros = resultados.herdeiros.map(h => {
        const valorBruto = h.valorAposCessoesBeneficiario || h.valorTotalOriginal;
        
        // Honorários sobre o valor real
        const valorBaseContratual = valorBruto * proporcaoContratual;
        const honorarioTotal = (dados.advogados || []).reduce((sum, adv) => 
            sum + (valorBaseContratual * adv.percentual), 0
        );
        
        // Sindicatos sobre o valor real
        const sindicatoTotal = (dados.sindicatos || []).reduce((sum, sind) => 
            sum + (valorBruto * sind.percentual), 0
        );
        
        const valorLiquido = valorBruto - honorarioTotal - sindicatoTotal;
        
        // RRA proporcional
        const rra = (rraTotal !== 0 && valortotatt > 0) 
            ? Math.round((valorBruto * rraTotal) / valortotatt) 
            : 0;
        
        return `
            <tr>
                <td>${h.nome}</td>
                <td>${(h.percentual * 100).toFixed(2)}%</td>
                <td>R$ ${formatarMoeda(valorBruto)}</td>
                <td>R$ ${formatarMoeda(honorarioTotal)}</td>
                <td>R$ ${formatarMoeda(sindicatoTotal)}</td>
                <td>R$ ${formatarMoeda(valorLiquido)}</td>
                <td>${rra || 0}</td>
            </tr>
        `;
    }).join('');
    
    // Calcular totais
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
    
    // Info sobre cessão do beneficiário
    const houveCessao = resultados.percentualBeneficiarioFinal && resultados.percentualBeneficiarioFinal < 1;
    const infoCessao = houveCessao ? `
        <div style="background-color: #fff3cd; padding: 10px; border-radius: 5px; margin-bottom: 15px;">
            <p style="color: #856404; margin: 0;">
                <strong>⚠️ Atenção - Cessão do Beneficiário Principal:</strong><br>
                O beneficiário cedeu ${((1 - resultados.percentualBeneficiarioFinal) * 100).toFixed(2)}% do precatório antes do falecimento.<br>
                <strong>Valor total do precatório:</strong> R$ ${formatarMoeda(valortotatt)}<br>
                <strong>Valor cedido pelo beneficiário:</strong> R$ ${formatarMoeda(valortotatt - totalRealHerdeiros)}<br>
                <strong>Valor disponível para herdeiros:</strong> R$ ${formatarMoeda(totalRealHerdeiros)}
            </p>
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
                        <th>Hon. Contratuais</th>
                        <th>Sindicatos</th>
                        <th>Valor Líquido*</th>
                        <th>RRA</th>
                    </tr>
                    ${linhasHerdeiros}
                    <tr class="highlight" style="background-color: #e9ecef; font-weight: bold; border-top: 2px solid #dee2e6;">
                        <td><strong>TOTAIS</strong></td>
                        <td><strong>100%</strong></td>
                        <td><strong>R$ ${formatarMoeda(totalRealHerdeiros)}</strong></td>
                        <td><strong>R$ ${formatarMoeda(totalHonorarios)}</strong></td>
                        <td><strong>R$ ${formatarMoeda(totalSindicatos)}</strong></td>
                        <td><strong>R$ ${formatarMoeda(totalLiquido)}</strong></td>
                        <td><strong>${totalRRA || '-'}</strong></td>
                    </tr>
                </table>
                <div class="success-box" style="margin-top: 15px; padding: 10px; border-radius: 4px;">
                    <p style="margin: 0;">* Valor líquido sem considerar Previdência e IR</p>
                </div>
            </div>
        </div>
    `;
}

