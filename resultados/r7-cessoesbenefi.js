// Cessoes Beneficiario Principal

function gerarSecaoCessoesBeneficiario(resultados, dados) {
    if (!resultados.cessoesBeneficiarioCalculadas || resultados.cessoesBeneficiarioCalculadas.length === 0) return '';

    const contexto = extrairContextoBeneficiario(resultados, dados);
    const valoresBeneficiario = calcularValoresBeneficiario(resultados, dados, contexto);
    const valoresCessionarios = calcularValoresCessionarios(resultados, dados, contexto);
    
    const linhasCessionarios = gerarLinhasCessionariosBeneficiario(valoresCessionarios, contexto);
    const totais = calcularTotaisBeneficiario(valoresBeneficiario, valoresCessionarios, contexto);
    const alertBox = gerarAlertBoxBeneficiario(resultados, dados, contexto, valoresBeneficiario, totais);

    return `
        <div class="cessoes-beneficiario">
            <div class="table-container">
                <h3>🔄 Cessões do Beneficiário Principal</h3>
                <div style="margin-bottom: 20px;">
                    ${gerarCabecalhoBeneficiario(dados, resultados, contexto)}
                    ${gerarTabelaCessoesBeneficiario(dados, resultados, contexto, valoresBeneficiario, linhasCessionarios, totais)}
                    ${gerarNotasExplicativas(contexto, dados, resultados)}
                </div>
                ${alertBox}
            </div>
        </div>
    `;
}

// ========== FUNÇÕES AUXILIARES CESSOES BEN==========

function extrairContextoBeneficiario(resultados, dados) {
    const dividaTotalAtualizada = resultados.valortotatt || 0;
    const valorPago = resultados.valorBase || 0;
    
    const percentualTotalAdv = (dados.advogados || []).reduce((sum, adv) => sum + (adv.percentual || 0), 0);
    const percentualTotalSind = (dados.sindicatos || []).reduce((sum, sind) => sum + (sind.percentual || 0), 0);
    const percentualDeducoes = percentualTotalAdv + percentualTotalSind;
    
    const dividaSemHonorarios = dividaTotalAtualizada * (1 - percentualDeducoes);
    const temHerdeiros = resultados.temHerdeiros && Array.isArray(resultados.herdeiros) && resultados.herdeiros.length > 0;
    const percentualPagoSobreDivida = dividaTotalAtualizada > 0 ? Math.min(1, valorPago / dividaTotalAtualizada) : 0;

    const totalCedido = resultados.cessoesBeneficiarioCalculadas.reduce((total, cessao) =>
        total + (cessao.percentual || 0), 0
    );

    const listaCessionarios = resultados.cessoesBeneficiarioCalculadas
        .map(cessao => `${cessao.cessionario} (${((cessao.percentual || 0) * 100).toFixed(2)}%)`)
        .join(', ');

    return {
        dividaTotalAtualizada,
        valorPago,
        percentualTotalAdv,
        percentualTotalSind,
        percentualDeducoes,
        dividaSemHonorarios,
        isParcial: dados.tipoCalculo === 'parcial',
        isPreferenciasParcial: !!resultados.isPreferenciasParcial,
        temHerdeiros,
        percentualPagoSobreDivida,
        totalCedido,
        listaCessionarios
    };
}

function calcularValoresBeneficiario(resultados, dados, contexto) {
    const { dividaTotalAtualizada, percentualDeducoes, temHerdeiros, isParcial, percentualPagoSobreDivida } = contexto;
    
    const valorBrutoBeneficiario = dividaTotalAtualizada * (resultados.percentualBeneficiarioFinal || 0);
    const deducoesBeneficiario = valorBrutoBeneficiario * percentualDeducoes;
    const parteBeneficiario = valorBrutoBeneficiario - deducoesBeneficiario;

    let beneficiarioRecebe = 0;
    let beneficiarioAguarda = 0;

    if (temHerdeiros && dados.tipoCalculo === 'preferencia') {
        beneficiarioRecebe = 0;
        beneficiarioAguarda = parteBeneficiario;
    } else if (temHerdeiros) {
        beneficiarioRecebe = 0;
        beneficiarioAguarda = parteBeneficiario;
    } else if (isParcial) {
        beneficiarioRecebe = parteBeneficiario * percentualPagoSobreDivida;
        beneficiarioAguarda = Math.max(0, parteBeneficiario - beneficiarioRecebe);
    } else {
        beneficiarioRecebe = (resultados.valorBeneficiarioAposCessoes != null) 
            ? resultados.valorBeneficiarioAposCessoes 
            : parteBeneficiario;
        beneficiarioAguarda = Math.max(0, parteBeneficiario - beneficiarioRecebe);
    }

    return {
        valorBrutoBeneficiario,
        deducoesBeneficiario,
        parteBeneficiario,
        beneficiarioRecebe,
        beneficiarioAguarda
    };
}

function calcularValoresCessionarios(resultados, dados, contexto) {
    const { dividaTotalAtualizada, percentualDeducoes, isPreferenciasParcial, isParcial, percentualPagoSobreDivida } = contexto;

    return resultados.cessoesBeneficiarioCalculadas.map(cessao => {
        const valorBrutoCessionario = dividaTotalAtualizada * (cessao.percentual || 0);
        const deducoesCessionario = valorBrutoCessionario * percentualDeducoes;
        const parteCessionario = valorBrutoCessionario - deducoesCessionario;

        let cessionarioRecebe = 0;
        let cessionarioAguarda = 0;

        if (isPreferenciasParcial) {
            cessionarioRecebe = 0;
            cessionarioAguarda = parteCessionario;
        } else if (isParcial) {
            cessionarioRecebe = parteCessionario * percentualPagoSobreDivida;
            cessionarioAguarda = Math.max(0, parteCessionario - cessionarioRecebe);
        } else {
            cessionarioRecebe = (cessao.valorBruto != null) ? cessao.valorBruto : parteCessionario;
            cessionarioAguarda = 0;
        }

        return {
            cessao,
            valorBrutoCessionario,
            deducoesCessionario,
            parteCessionario,
            cessionarioRecebe,
            cessionarioAguarda
        };
    });
}

function gerarLinhasCessionariosBeneficiario(valoresCessionarios, contexto){
    return valoresCessionarios.map(({ cessao, valorBrutoCessionario, deducoesCessionario, parteCessionario, cessionarioRecebe, cessionarioAguarda }) => `
        <tr>
            <td>${cessao.cessionario}</td>
            <td>${((cessao.percentual || 0) * 100).toFixed(2)}%</td>
            <td>R$ ${formatarMoeda(valorBrutoCessionario)}</td>
            <td>${(contexto.percentualDeducoes * 100).toFixed(2)}%</td>
            <td>R$ ${formatarMoeda(deducoesCessionario)}</td>
            <td>R$ ${formatarMoeda(parteCessionario)}</td>
            <td>R$ ${formatarMoeda(cessionarioRecebe)}</td>
            <td>R$ ${formatarMoeda(cessionarioAguarda)}</td>
        </tr>
    `).join('');
}

function calcularTotaisBeneficiario(valoresBeneficiario, valoresCessionarios, contexto) {
    const somaRecebeCessionarios = valoresCessionarios.reduce((total, v) => total + v.cessionarioRecebe, 0);
    const somaAguardaCessionarios = valoresCessionarios.reduce((total, v) => total + v.cessionarioAguarda, 0);

    return {
        totalValorBruto: contexto.dividaTotalAtualizada,
        totalDeducoes: contexto.dividaTotalAtualizada * contexto.percentualDeducoes,
        totalLiquido: contexto.dividaSemHonorarios,
        totalRecebe: valoresBeneficiario.beneficiarioRecebe + somaRecebeCessionarios,
        totalAguarda: valoresBeneficiario.beneficiarioAguarda + somaAguardaCessionarios
    };
}

function gerarCabecalhoBeneficiario(dados, resultados, contexto) {
    const { dividaTotalAtualizada, totalCedido, listaCessionarios, temHerdeiros } = contexto;
    
    return `
        <h4>Cessão do Beneficiário: ${dados.beneficiario}</h4>
        <p><strong>Tipo de Cálculo:</strong> ${dados.tipoCalculo} ${dados.tipoCalculo === 'preferencia' ? '(preferencial)' : '(ordem comum)'}</p>
        <p><strong>Dívida Total:</strong> R$ ${formatarMoeda(dividaTotalAtualizada)}</p>
        <p><strong>Total Cedido:</strong> ${(totalCedido * 100).toFixed(2)}% para: ${listaCessionarios}</p>
        ${temHerdeiros ? `
        <div style="background-color: #e7f3ff; padding: 10px; border-radius: 5px; margin: 10px 0;">
            <p style="color: #004085; margin: 0;">
                <strong>ℹ️ Nota:</strong> O beneficiário faleceu, deixando ${resultados.herdeiros.length} herdeiro(s). 
                Os valores remanescentes do beneficiário serão distribuídos entre os herdeiros.
            </p>
        </div>
        ` : ''}
    `;
}

function gerarTabelaCessoesBeneficiario(dados, resultados, contexto, valoresBeneficiario, linhasCessionarios, totais) {
    const { percentualDeducoes, temHerdeiros } = contexto;
    const { valorBrutoBeneficiario, deducoesBeneficiario, parteBeneficiario, beneficiarioRecebe, beneficiarioAguarda } = valoresBeneficiario;

    return `
        <table>
            <tr>
                <th rowspan="2">Beneficiário</th>
                <th rowspan="2">%</th>
                <th rowspan="2">Valor Bruto</th>
                <th colspan="2" style="text-align: center; background-color: #f8f9fa;">Deduções Acessórias</th>
                <th rowspan="2">Valor Líquido*</th>
                <th rowspan="2">Recebe Agora*</th>
                <th rowspan="2">Aguarda Ordem</th>
            </tr>
            <tr>
                <th style="background-color: #f8f9fa;">% Total</th>
                <th style="background-color: #f8f9fa;">Valor</th>
            </tr>
            ${resultados.percentualBeneficiarioFinal > 0 ? `
            <tr>
                <td>${dados.beneficiario}${temHerdeiros ? ' †' : ''}</td>
                <td>${(resultados.percentualBeneficiarioFinal * 100).toFixed(2)}%</td>
                <td>R$ ${formatarMoeda(valorBrutoBeneficiario)}</td>
                <td>${(percentualDeducoes * 100).toFixed(2)}%</td>
                <td>R$ ${formatarMoeda(deducoesBeneficiario)}</td>
                <td>R$ ${formatarMoeda(parteBeneficiario)}</td>
                <td>R$ ${formatarMoeda(beneficiarioRecebe)}</td>
                <td>R$ ${formatarMoeda(beneficiarioAguarda)}</td>
            </tr>
            ` : `
            <tr style="background-color: #f8f9fa;">
                <td><em>${dados.beneficiario} (cedeu tudo)</em></td>
                <td>0.00%</td>
                <td>R$ 0,00</td>
                <td>0.00%</td>
                <td>R$ 0,00</td>
                <td>R$ 0,00</td>
                <td>R$ 0,00</td>
                <td>R$ 0,00</td>
            </tr>
            `}
            ${linhasCessionarios}
            <tr class="highlight" style="background-color: #f8f9fa; font-weight: bold; border-top: 2px solid #dee2e6;">
                <td>TOTAL</td>
                <td>100.00%</td>
                <td>R$ ${formatarMoeda(totais.totalValorBruto)}</td>
                <td>${(percentualDeducoes * 100).toFixed(2)}%</td>
                <td>R$ ${formatarMoeda(totais.totalDeducoes)}</td>
                <td>R$ ${formatarMoeda(totais.totalLiquido)}</td>
                <td>R$ ${formatarMoeda(totais.totalRecebe)}</td>
                <td>R$ ${formatarMoeda(totais.totalAguarda)}</td>
            </tr>
        </table>
    `;
}

function gerarNotasExplicativas(contexto, dados, resultados) {
    const { percentualTotalAdv, percentualTotalSind, percentualDeducoes, isParcial, temHerdeiros } = contexto;

    return `
        <div style="padding: 8px; margin: 10px 0; font-size: 0.85em; color: #666;">
            <p style="margin: 0;">
                <strong>📝 Deduções Acessórias:</strong> 
                Honorários (${(percentualTotalAdv * 100).toFixed(2)}%) + 
                Sindicatos (${(percentualTotalSind * 100).toFixed(2)}%) = 
                ${(percentualDeducoes * 100).toFixed(2)}%
            </p>
            <p style="margin: 5px 0 0 0;">
                <strong>* Valor Líquido/Recebe Agora:</strong> Valores após a dedução de honorários e sindicatos. 
                ${isParcial ? 'Valores calculados sobre o pagamento parcial.' : ''}
                ${temHerdeiros ? 'Para o beneficiário falecido, este valor será distribuído entre os herdeiros.' : ''}
            </p>
        </div>
    `;
}

function gerarAlertBoxBeneficiario(resultados, dados, contexto, valoresBeneficiario, totais) {
    const { temHerdeiros, isParcial, isPreferenciasParcial } = contexto;
    const { beneficiarioRecebe } = valoresBeneficiario;

    if (isPreferenciasParcial) {
        return `
            <div class="warning-box" style="margin-top: 10px; padding: 12px; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; color: #856404;">
                <strong>ℹ️ Preferência Parcial:</strong><br>
                • <strong>Teto da preferência:</strong> R$ ${formatarMoeda(resultados.valorBase)}<br>
                • <strong>Pagamento imediato:</strong> R$ ${formatarMoeda(temHerdeiros ? 0 : beneficiarioRecebe)} ${temHerdeiros ? '(beneficiário falecido - valor vai para herdeiros)' : '(só para o beneficiário)'}<br>
                • <strong>Saldo devedor total:</strong> R$ ${formatarMoeda(totais.totalAguarda)}
            </div>
        `;
    }

    if (isParcial) {
        return `
            <div class="warning-box" style="margin-top: 10px; padding: 12px; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; color: #856404;">
                <strong>⚠️ Pagamento Parcial:</strong><br>
                • <strong>Dívida total:</strong> R$ ${formatarMoeda(contexto.dividaTotalAtualizada)}<br>
                • <strong>Valor do pagamento:</strong> R$ ${formatarMoeda(resultados.valorBase)}<br>
            </div>
        `;
    }

    if (temHerdeiros) {
        return `
            <div class="warning-box" style="margin-top: 10px; padding: 12px; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; color: #856404;">
                <strong>⚠️ Beneficiário Falecido:</strong><br>
                • Os valores do beneficiário serão distribuídos entre os ${resultados.herdeiros.length} herdeiro(s)<br>
                • ${dados.tipoCalculo === 'preferencia' ? 'Herdeiros com preferência receberão conforme o teto estabelecido' : 'Distribuição seguirá ordem cronológica'}
            </div>
        `;
    }

    return `
        <div class="success-box" style="margin-top: 10px; padding: 12px; background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px; color: #155724;">
            <strong>✅ Pagamento Integral:</strong> Todos os beneficiários recebem integralmente.
        </div>
    `;
}