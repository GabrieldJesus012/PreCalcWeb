// Cessoes Beneficiario Principal

function gerarSecaoCessoesBeneficiario(resultados, dados) {
    if (!resultados.cessoesBeneficiarioCalculadas || resultados.cessoesBeneficiarioCalculadas.length === 0) return '';

    const contexto = extrairContextoBeneficiario(resultados, dados);
    const valoresBeneficiario = calcularValoresBeneficiario(resultados, dados, contexto);
    const valoresCessionarios = calcularValoresCessionarios(resultados, dados, contexto);

    const temAguarda = valoresCessionarios.some(v => v.cessionarioAguarda > 0) || 
                       valoresBeneficiario.beneficiarioAguarda > 0;
    
    const linhasCessionarios = gerarLinhasCessionariosBeneficiario(valoresCessionarios, contexto,temAguarda);
    const totais = calcularTotaisBeneficiario(valoresBeneficiario, valoresCessionarios, contexto);
    const alertBox = gerarAlertBoxBeneficiario(resultados, dados, contexto, valoresBeneficiario, totais);

    return `
        <div class="cessoes-beneficiario">
            <div class="table-container">
                <h3>🔄 Cessões do Beneficiário Principal</h3>
                <div style="margin-bottom: 20px;">
                    ${gerarCabecalhoBeneficiario(dados, resultados, contexto)}
                    ${gerarTabelaCessoesBeneficiario(dados, resultados, contexto, valoresBeneficiario, linhasCessionarios, totais,temAguarda)}
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

function gerarLinhasCessionariosBeneficiario(valoresCessionarios, contexto, temAguarda) {
    return valoresCessionarios.map(({ cessao, valorBrutoCessionario, deducoesCessionario, parteCessionario, cessionarioRecebe, cessionarioAguarda }) => `
        <tr style="background:#FEF5E7 !important;">
            <td style="padding-left:28px; color:var(--sr-orange-dark);">
                ↳ ${cessao.cessionario}
                <small style="color:var(--sr-gray);">(Cessionário)</small>
            </td>
            <td style="color:var(--sr-orange-dark);">${((cessao.percentual || 0) * 100).toFixed(2)}%</td>
            <td style="color:var(--sr-orange-dark);">R$ ${formatarMoeda(valorBrutoCessionario)}</td>
            <td style="color:var(--sr-orange-dark);">R$ ${formatarMoeda(deducoesCessionario)} (${(contexto.percentualDeducoes * 100).toFixed(2)}%)</td>
            <td style="color:var(--sr-orange-dark);">R$ ${formatarMoeda(parteCessionario)}</td>
            <td style="color:var(--sr-orange-dark);">R$ ${formatarMoeda(cessionarioRecebe)}</td>
            ${temAguarda ? `<td style="color:var(--sr-orange-dark);">R$ ${formatarMoeda(cessionarioAguarda)}</td>` : ''}
        </tr>
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
        <p><strong>Tipo de Cálculo:</strong> ${dados.tipoCalculo} ${dados.tipoCalculo === 'preferencia' ? '(preferencial)' : '(ordem)'}</p>
        <p><strong>Dívida Total:</strong> R$ ${formatarMoeda(dividaTotalAtualizada)}</p>
        <p><strong>Total Cedido:</strong> ${(totalCedido * 100).toFixed(2)}% para: ${listaCessionarios}</p>
        ${temHerdeiros ? `
        <div class="success-box" style="margin-bottom: 10px; padding: 8px 12px; background-color:#EBF4FB; color:#155A8A;">
            <strong>ℹ️</strong> Beneficiário falecido — valores distribuídos entre ${resultados.herdeiros.length} herdeiro(s).
        </div>` : ''}
    `;
}

function gerarTabelaCessoesBeneficiario(dados, resultados, contexto, valoresBeneficiario, linhasCessionarios, totais, temAguarda) {
    const { percentualDeducoes, temHerdeiros } = contexto;
    const { valorBrutoBeneficiario, deducoesBeneficiario, parteBeneficiario, beneficiarioRecebe, beneficiarioAguarda } = valoresBeneficiario;

    return `
        <table>
            <tr>
                <th>Beneficiário</th>
                <th>%</th>
                <th>Valor Bruto</th>
                <th>Deduções Acessórias</th>
                <th>Valor Líquido*</th>
                <th>Recebe Agora*</th>
                ${temAguarda ? '<th>Aguarda Ordem</th>' : ''}
            </tr>
            ${resultados.percentualBeneficiarioFinal > 0 ? `
            <tr>
                <td>${dados.beneficiario}${temHerdeiros ? ' †' : ''}</td>
                <td>${(resultados.percentualBeneficiarioFinal * 100).toFixed(2)}%</td>
                <td>R$ ${formatarMoeda(valorBrutoBeneficiario)}</td>
                <td>R$ ${formatarMoeda(deducoesBeneficiario)} (${(percentualDeducoes * 100).toFixed(2)}%)</td>
                <td>R$ ${formatarMoeda(parteBeneficiario)}</td>
                <td>R$ ${formatarMoeda(beneficiarioRecebe)}</td>
                ${temAguarda ? `<td>R$ ${formatarMoeda(beneficiarioAguarda)}</td>` : ''}
            </tr>
            ` : `
            <tr style="background-color: #f8f9fa;">
                <td style="color:var(--sr-gray); font-style:italic;">${dados.beneficiario} (cedeu tudo)</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
                ${temAguarda ? '<td>—</td>' : ''}
            </tr>
            `}
            ${linhasCessionarios}
            <tr class="highlight">
                <td>TOTAL</td>
                <td>100.00%</td>
                <td>R$ ${formatarMoeda(totais.totalValorBruto)}</td>
                <td><strong>R$ ${formatarMoeda(totais.totalDeducoes)} (${(percentualDeducoes * 100).toFixed(2)}%)</strong></td>
                <td>R$ ${formatarMoeda(totais.totalLiquido)}</td>
                <td>R$ ${formatarMoeda(totais.totalRecebe)}</td>
                ${temAguarda ? `<td><strong>R$ ${formatarMoeda(totais.totalAguarda)}</strong></td>` : ''}
            </tr>
        </table>
    `;
}

function gerarNotasExplicativas(contexto, dados, resultados) {
    const { percentualTotalAdv, percentualTotalSind, percentualDeducoes, isParcial, temHerdeiros } = contexto;

    return `
        <div class="success-box" style="margin-top: 10px; padding: 10px; border-radius: 4px; font-size: 0.85em;">
            <strong>📝 Deduções Acessórias:</strong> 
            Honorários (${(percentualTotalAdv * 100).toFixed(2)}%) + 
            Sindicatos (${(percentualTotalSind * 100).toFixed(2)}%) = 
            ${(percentualDeducoes * 100).toFixed(2)}%
            <br>
            
            <strong>* Valor Líquido/Recebe Agora:</strong> Valores após a dedução de honorários e sindicatos. 
            ${isParcial ? 'Valores calculados sobre o pagamento parcial.' : ''}
            ${temHerdeiros ? 'Para o beneficiário falecido, este valor será distribuído entre os herdeiros.' : ''}
        </div>
    `;
}

function gerarAlertBoxBeneficiario(resultados, dados, contexto, valoresBeneficiario, totais) {
    const { temHerdeiros, isParcial, isPreferenciasParcial } = contexto;
    const { beneficiarioRecebe } = valoresBeneficiario;

    if (isPreferenciasParcial) {
        return `
            <div class="success-box" style="margin-top: 10px; padding: 10px; border-radius: 4px; background-color: #fff3cd; color: #856404;">
                <strong>ℹ️ Preferência Parcial:</strong><br>
                • <strong>Teto da preferência:</strong> R$ ${formatarMoeda(resultados.valorBase)}<br>
                • <strong>Pagamento imediato:</strong> R$ ${formatarMoeda(temHerdeiros ? 0 : beneficiarioRecebe)} ${temHerdeiros ? '(beneficiário falecido - valor vai para herdeiros)' : '(só para o beneficiário)'}<br>
                • <strong>Saldo devedor total:</strong> R$ ${formatarMoeda(totais.totalAguarda)}
            </div>
        `;
    }

    if (isParcial) {
        return `
            <div class="success-box" style="margin-top: 10px; padding: 10px; border-radius: 4px; background-color: #fff3cd; color: #856404;">
                <strong>⚠️ Pagamento Parcial:</strong><br>
                • <strong>Dívida total:</strong> R$ ${formatarMoeda(contexto.dividaTotalAtualizada)}<br>
                • <strong>Valor do pagamento:</strong> R$ ${formatarMoeda(resultados.valorBase)}
            </div>
        `;
    }

    if (temHerdeiros) {
        return `
            <div class="success-box" style="margin-top: 10px; padding: 10px; border-radius: 4px; background-color: #fff3cd; color: #856404;">
                <strong>⚠️ Beneficiário Falecido:</strong><br>
                • Os valores do beneficiário serão distribuídos entre os ${resultados.herdeiros.length} herdeiro(s)<br>
                • ${dados.tipoCalculo === 'preferencia' ? 'Herdeiros com preferência receberão conforme o teto estabelecido' : 'Distribuição seguirá ordem cronológica'}
            </div>
        `;
    }

    return `
        <div class="success-box" style="margin-top: 10px; padding: 10px; border-radius: 4px;">
            <strong>✅ Pagamento Integral:</strong> Todos os beneficiários recebem integralmente.
        </div>
    `;
}
