function gerarCalculos(dados, resultados, inicioGraca, fimGraca) {
    const inicioGracaFormatado = formatarData(inicioGraca);
    const fimGracaFormatado = formatarData(fimGraca);
    
    const temSelicInformado = dados.valoresPrincipais?.some(item => 
        (item.tipoSelic === 'valor' && item.valorSelic > 0) || 
        (item.tipoSelic === 'percentual' && item.percentualSelic > 0)
    );

    const temJurosMora = dados.valoresPrincipais?.some(item => 
        item.indices.jurosMora && (resultados.itensCalculados?.find(calc => calc.id === item.id)?.jurosMoraCalculado || 0) > 0
    );
    
    let memoriaisCalculos = '';
    
    if (dados.valoresPrincipais && dados.valoresPrincipais.length > 0) {
        const isSingleItem = dados.valoresPrincipais.length === 1;
        
        dados.valoresPrincipais.forEach((item, index) => {
            const itemCalculado = resultados.itensCalculados?.find(calc => calc.id === item.id) || {};
            memoriaisCalculos += gerarMemorialItem(item, itemCalculado, index, isSingleItem, inicioGracaFormatado, fimGracaFormatado);
        });
    }

    const notaSelicInformado = temSelicInformado 
        ? gerarNotaSelicInformado(dados, resultados)
        : '';
    
    return `
        ${memoriaisCalculos}
        ${(notaSelicInformado || temJurosMora) ? `
        <div class="success-box" style="margin-top: 15px; padding: 10px; border-radius: 4px;">
            ${notaSelicInformado}${temJurosMora ? '*Juros calculados de forma simples (até Novembro/2021), conforme art. 1º da Lei nº 12.703/2012; art. 1º, "F", da Lei nº 9.494/1997; art. 100, § 12º da CF/88, Art.22 da Resolução 303 do CNJ, SV nº 17 do STF e a partir de 01.08.2025 juros de 2% ao ano (quando aplicável).' : ''}
        </div>` : ''}
    `;
}

// ========== FUNÇÕES AUXILIARES DE GERAR CALCULOS==========

function gerarMemorialItem(item, itemCalculado, index, isSingleItem, inicioGracaFormatado, fimGracaFormatado) {
    const indices = obterIndicesItem(itemCalculado);
    const valoresCalculados = calcularValoresPassoAPasso(item, itemCalculado, indices);
    const periodoGraca = `Graça Constitucional: ${inicioGracaFormatado} a ${fimGracaFormatado}`;
    const titulo = isSingleItem ? 
        `🔢 MEMORIAL DE CÁLCULOS — ${periodoGraca}` : 
        `🔢 MEMORIAL DE CÁLCULOS - ${item.descricao || `Item ${index + 1}`} — ${periodoGraca} `;
    
    const detalhesItem = isSingleItem ? '' : `
        <div style="background: #f0f0f0; padding: 10px; margin-bottom: 15px; border-radius: 5px;">
            <strong>Base:</strong> ${item.mesBase}/${item.anoBase} | 
            <strong>Índices aplicados:</strong> ${Object.entries(item.indices || {})
                .filter(([key, value]) => value)
                .map(([key]) => key.toUpperCase())
                .join(', ')}
        </div>
    `;
    
    // ⬇️ USAR valoresCalculados.valorSelicFinal
    const valorSelicFinal = valoresCalculados.valorSelicFinal || 0;
    const totalItem = (valoresCalculados.principalFinal || 0) + 
                    (valoresCalculados.jurosFinal || 0) + 
                    valorSelicFinal;
    
    const totalDoItem = isSingleItem ? '' : `
        <div class="highlight" style="margin-top: 10px; padding: 10px; background: #e8f4fd; border-radius: 5px;">
            <strong>TOTAL DESTE ITEM:</strong> 
            R$ ${formatarMoeda(valoresCalculados.principalFinal)} + 
            R$ ${formatarMoeda(valoresCalculados.jurosFinal)}${valorSelicFinal > 0 ? ` + R$ ${formatarMoeda(valorSelicFinal)} (SELIC)` : ''} = 
            <strong>R$ ${formatarMoeda(totalItem)}</strong>
        </div>
    `;

    const temAlgumJuros = (item.valorJuros && parseFloat(item.valorJuros) !== 0) || 
                        (item.indices.jurosMora && valoresCalculados.valorJurosMora !== 0);

    return `
        <div class="table-container" style="margin-top: 20px;">
            <h3>${titulo}</h3>
            ${detalhesItem}
            
            ${gerarTabelaPrincipal(item, indices, valoresCalculados, inicioGracaFormatado, fimGracaFormatado, itemCalculado)}
            
            ${temAlgumJuros ? gerarTabelaJuros(item, indices, valoresCalculados, inicioGracaFormatado, fimGracaFormatado, itemCalculado) : ''}
            
            ${valorSelicFinal > 0 ? gerarTabelaSelic(itemCalculado, valoresCalculados) : ''}
            
            ${totalDoItem}
        </div>
    `;
}


function obterIndicesItem(itemCalculado) {
    return {
        cnj: itemCalculado.indices?.cnj || 1,
        selic: itemCalculado.indices?.selic || 1,
        ipcae: itemCalculado.indices?.ipcae || 1,
        ipca: itemCalculado.indices?.ipca || 1,
        jurosMora: itemCalculado.indices?.jurosMora || 0
    };
}

function calcularValoresPassoAPasso(item, itemCalculado, indices) {
    const detalhePEC = itemCalculado.detalhamentoPEC || {};
    const usaLogicaPEC = detalhePEC.usouLogicaPEC && detalhePEC.selicMaior;
    
    // PRINCIPAL - PASSO A PASSO

    const principalCNJ = item.valorPrincipal * indices.cnj;
    const principalIPCAE = principalCNJ * indices.ipcae;
    
    let principalSelic, principalIPCA, principalFinal;
    
    if (usaLogicaPEC) {
        // LÓGICA PEC: IPCA aplicado depois, SELIC fica separada
        principalSelic = principalIPCAE * indices.selic;  // Usado apenas para cálculo da SELIC separada
        principalIPCA = principalIPCAE * (detalhePEC.indiceIpcaPuro || 1);
        principalFinal = principalIPCA;
    } else {
        // LÓGICA ANTIGA: SELIC aplicada diretamente
        principalSelic = principalIPCAE * indices.selic;
        principalIPCA = principalSelic;  // Não tem IPCA separado
        principalFinal = principalSelic;
    }
    
    // JUROS - PASSO A PASSO
    
    const jurosOriginaisCNJ = item.valorJuros * indices.cnj;
    const valorJurosMora = itemCalculado.jurosMoraCalculado || 0;
    const totalJuros = jurosOriginaisCNJ + valorJurosMora;
    const totalJurosIPCAE = totalJuros * indices.ipcae;
    
    let totalJurosSelic, totalJurosIPCA, juros2AA, jurosFinal;
    
    if (usaLogicaPEC) {
        // LÓGICA PEC: IPCA + Juros 2% a.a.
        totalJurosSelic = totalJurosIPCAE * indices.selic;  // Usado para cálculo da SELIC separada
        totalJurosIPCA = totalJurosIPCAE * (detalhePEC.indiceIpcaPuro || 1);
        juros2AA = detalhePEC.valorJuros2AA || 0;
        jurosFinal = totalJurosIPCA + juros2AA;
    } else {
        // LÓGICA ANTIGA: SELIC aplicada diretamente
        totalJurosSelic = totalJurosIPCAE * indices.selic;
        totalJurosIPCA = totalJurosSelic;  // Não tem IPCA separado
        juros2AA = 0;
        jurosFinal = totalJurosSelic;
    }
    
    // SELIC SEPARADA (apenas na lógica PEC)
    
    let valorSelicBase, valorSelicIPCA, valorSelicFinal;
    
    if (usaLogicaPEC) {
        // Base da SELIC = (Principal + Juros) após IPCA-E, antes de IPCA
        const baseAntesSelic = principalIPCAE + totalJurosIPCAE;
        
        // SELIC aplicada sobre a base
        valorSelicBase = baseAntesSelic * (indices.selic - 1);
        
        // IPCA aplicado sobre a SELIC
        valorSelicIPCA = valorSelicBase * (detalhePEC.indiceIpcaPuro || 1);
        valorSelicFinal = valorSelicIPCA;
    } else {
        valorSelicBase = 0;
        valorSelicIPCA = 0;
        valorSelicFinal = 0;
    }
    
    return {
        // Principal
        principalCNJ,
        principalIPCAE,
        principalSelic,      // Intermediário (lógica antiga) ou base para SELIC (PEC)
        principalIPCA,       // Apenas na PEC
        principalFinal,
        
        // Juros
        jurosOriginaisCNJ,
        valorJurosMora,
        totalJuros,
        totalJurosIPCAE,
        totalJurosSelic,     // Intermediário (lógica antiga) ou base para SELIC (PEC)
        totalJurosIPCA,      // Apenas na PEC
        juros2AA,            // Apenas na PEC
        jurosFinal,
        
        // SELIC Separada (apenas PEC)
        valorSelicBase,      // SELIC antes do IPCA
        valorSelicIPCA,      // SELIC com IPCA aplicado
        valorSelicFinal,     // Valor final da SELIC separada
        
        // Flags
        usaLogicaPEC
    };
}

function gerarTabelaPrincipal(item, indices, valores, inicioGracaFormatado, fimGracaFormatado, itemCalculado) {
    const detalhePEC = itemCalculado.detalhamentoPEC || {};
    const fimIpcaELabel = (indices.ipca && indices.ipca > 1) ? 'Jul/2025' : fimGracaFormatado;
    
    const dataAtualizacaoInput = document.getElementById("dataatualizacao").value;
    const [anoAtual, mesAtual] = dataAtualizacaoInput.split('-');
    const dataHojeLabel = `${String(mesAtual).padStart(2,'0')}/${anoAtual}`;
    
    const dataBaseLabel = `${item.mesBase.charAt(0).toUpperCase() + item.mesBase.slice(1)}/${item.anoBase}`;
    
    let etapa = 2;
    
    return `
        <h4>💰 Atualização do Principal - Passo a Passo</h4>
        <table>
            <tr><th>Etapa</th><th>Período</th><th>Cálculo</th><th>Valor</th></tr>
            <tr>
                <td>1. Valor Original</td>
                <td>${dataBaseLabel}</td>
                <td>Principal Homologado</td>
                <td>R$ ${formatarMoeda(item.valorPrincipal)}</td>
            </tr>
            ${item.indices.cnj && indices.cnj !== 1 ? `
            <tr>
                <td>${etapa++}. Correção CNJ</td>
                <td>${dataBaseLabel} até Nov/2021</td>
                <td>R$ ${formatarMoeda(item.valorPrincipal)} × ${indices.cnj.toFixed(6)}</td>
                <td>R$ ${formatarMoeda(valores.principalCNJ)}</td>
            </tr>` : ''}
            ${item.indices.ipcae && indices.ipcae !== 1 ? `
            <tr>
                <td>${etapa++}. Aplicação IPCA-E</td>
                <td>${inicioGracaFormatado} até ${fimIpcaELabel}</td>
                <td>R$ ${formatarMoeda(valores.principalCNJ)} × ${indices.ipcae.toFixed(6)}</td>
                <td>R$ ${formatarMoeda(valores.principalIPCAE)}</td>
            </tr>` : ''}
            ${valores.usaLogicaPEC ? `
            <tr>
                <td>${etapa++}. Aplicação IPCA</td>
                <td>Ago/2025 até ${dataHojeLabel}</td>
                <td>R$ ${formatarMoeda(valores.principalIPCAE)} × ${indices.ipca.toFixed(6)}</td>
                <td><strong>R$ ${formatarMoeda(valores.principalIPCA)}</strong></td>
            </tr>
            <tr style="background: #fff3cd;">
                <td colspan="4" style="text-align: center; font-size: 0.9em;">
                    ⚠️ <strong>SELIC aplicada separadamente</strong> — Ver seção específica abaixo
                </td>
            </tr>` : item.indices.selic ? `
            <tr>
                <td>${etapa++}. Aplicação SELIC</td>
                <td>Excluído a graça</td>
                <td>R$ ${formatarMoeda(valores.principalIPCAE)} × ${indices.selic.toFixed(6)}</td>
                <td><strong>R$ ${formatarMoeda(valores.principalFinal)}</strong></td>
            </tr>` : `
            <tr>
                <td>${etapa++}. Valor Final</td>
                <td>—</td>
                <td>Valor Final do Principal</td>
                <td><strong>R$ ${formatarMoeda(valores.principalFinal)}</strong></td>
            </tr>`}
        </table>
    `;
}

function gerarTabelaJuros(item, indices, valores, inicioGracaFormatado, fimGracaFormatado, itemCalculado) {
    let etapa = 2;
    
    const detalhePEC = itemCalculado.detalhamentoPEC || {};
    const quantidadeMeses = detalhePEC.quantidadeMesesForaGraca || detalhePEC.quantidadeMeses || 0;
    const fimIpcaELabel = (indices.ipca && indices.ipca > 1) ? 'Jul/2025' : fimGracaFormatado;
    const temJuros2AA = detalhePEC.percentualJuros2AA > 0;
    
    const dataAtualizacaoInput = document.getElementById("dataatualizacao").value;
    const [anoAtual, mesAtual] = dataAtualizacaoInput.split('-');
    const dataHojeLabel = `${String(mesAtual).padStart(2,'0')}/${anoAtual}`;
    
    const dataBaseLabel = `${item.mesBase.charAt(0).toUpperCase() + item.mesBase.slice(1)}/${item.anoBase}`;
    
    // Período dos juros de mora — verificar se a graça intercepta o período CNJ
    const anoBase = item.anoBase;
    const mesBaseIdx = ['janeiro','fevereiro','março','abril','maio','junho',
                        'julho','agosto','setembro','outubro','novembro','dezembro']
                        .indexOf(item.mesBase.toLowerCase());
    const dataBase = new Date(anoBase, mesBaseIdx, 1);
    const dataFimCNJ = new Date(2021, 10, 30); // Nov/2021
    
    // Período de graça como datas
    const [diaIG, mesIG, anoIG] = inicioGracaFormatado.split('/');
    const [diaFG, mesFG, anoFG] = fimGracaFormatado.split('/');
    const dataInicioGraca = new Date(parseInt(anoIG), parseInt(mesIG) - 1, 1);
    const dataFimGraca = new Date(parseInt(anoFG), parseInt(mesFG) - 1, 1);
    
    // Graça intercepta período CNJ se início da graça está entre dataBase e Nov/2021
    const gracaInterceptaCNJ = dataInicioGraca > dataBase && dataInicioGraca <= dataFimCNJ;
    
    const periodoJurosMora = gracaInterceptaCNJ
        ? `${dataBaseLabel} até Nov/2021 (excluindo graça: ${inicioGracaFormatado} até ${fimGracaFormatado})`
        : `${dataBaseLabel} até Nov/2021`;
    
    return `
        <h4>⚖️ Atualização dos Juros - Passo a Passo</h4>
        <table>
            <tr><th>Etapa</th><th>Período</th><th>Cálculo</th><th>Valor</th></tr>
            <tr>
                <td>1. Juros Originais</td>
                <td>${dataBaseLabel}</td>
                <td>Juros Homologado</td>
                <td>R$ ${formatarMoeda(item.valorJuros)}</td>
            </tr>
            ${item.indices.cnj && indices.cnj !== 1 ? `
            <tr>
                <td>${etapa++}. Correção CNJ</td>
                <td>${dataBaseLabel} até Nov/2021</td>
                <td>R$ ${formatarMoeda(item.valorJuros)} × ${indices.cnj.toFixed(6)}</td>
                <td>R$ ${formatarMoeda(valores.jurosOriginaisCNJ)}</td>
            </tr>` : ''}
            ${item.indices.jurosMora && valores.valorJurosMora > 0 ? `
            <tr>
                <td>${etapa++}. Juros de Mora - Poupança</td>
                <td>${periodoJurosMora}</td>
                <td>Principal CNJ × ${(indices.jurosMora * 100).toFixed(4)}%*</td>
                <td>R$ ${formatarMoeda(valores.valorJurosMora)}</td>
            </tr>
            <tr>
                <td>${etapa++}. Total Juros (CNJ + Mora)</td>
                <td>—</td>
                <td>R$ ${formatarMoeda(valores.jurosOriginaisCNJ)} + R$ ${formatarMoeda(valores.valorJurosMora)}</td>
                <td>R$ ${formatarMoeda(valores.totalJuros)}</td>
            </tr>` : ''}
            ${item.indices.ipcae && indices.ipcae !== 1 ? `
            <tr>
                <td>${etapa++}. Aplicação IPCA-E</td>
                <td>${inicioGracaFormatado} até ${fimIpcaELabel}</td>
                <td>R$ ${formatarMoeda(valores.totalJuros)} × ${indices.ipcae.toFixed(6)}</td>
                <td>R$ ${formatarMoeda(valores.totalJurosIPCAE)}</td>
            </tr>` : ''}
            ${valores.usaLogicaPEC ? `
            <tr>
                <td>${etapa++}. Aplicação IPCA</td>
                <td>Ago/2025 até ${dataHojeLabel}</td>
                <td>R$ ${formatarMoeda(valores.totalJurosIPCAE)} × ${indices.ipca.toFixed(6)}</td>
                <td>R$ ${formatarMoeda(valores.totalJurosIPCA)}</td>
            </tr>
            ${temJuros2AA ? `
            <tr>
                <td>${etapa++}. Juros (2% a.a.)</td>
                <td>${quantidadeMeses} meses</td>
                <td>Principal × ${(detalhePEC.percentualJuros2AA * 100).toFixed(6)}%</td>
                <td>R$ ${formatarMoeda(valores.juros2AA)}</td>
            </tr>` : ''}
            <tr>
                <td>${etapa++}. Total Juros</td>
                <td>—</td>
                <td>${temJuros2AA 
                    ? `R$ ${formatarMoeda(valores.totalJurosIPCA)} + R$ ${formatarMoeda(valores.juros2AA)}`
                    : `R$ ${formatarMoeda(valores.totalJurosIPCA)}`
                }</td>
                <td><strong>R$ ${formatarMoeda(valores.jurosFinal)}</strong></td>
            </tr>
            <tr style="background: #fff3cd;">
                <td colspan="4" style="text-align: center; font-size: 0.9em;">
                    ⚠️ <strong>SELIC aplicada separadamente</strong> — Ver seção específica abaixo
                </td>
            </tr>` : item.indices.selic ? `
            <tr>
                <td>${etapa++}. Aplicação SELIC</td>
                <td>Excluído a graça</td>
                <td>R$ ${formatarMoeda(valores.totalJurosIPCAE)} × ${indices.selic.toFixed(6)}</td>
                <td><strong>R$ ${formatarMoeda(valores.jurosFinal)}</strong></td>
            </tr>` : `
            <tr>
                <td>Final</td>
                <td>—</td>
                <td>Valor Final dos Juros</td>
                <td><strong>R$ ${formatarMoeda(valores.jurosFinal)}</strong></td>
            </tr>`}
        </table>
    `;
}

function gerarTabelaSelic(itemCalculado, valores) {
    if (!valores.usaLogicaPEC || valores.valorSelicFinal === 0) {
        return ''; // Não mostra se não usa lógica PEC
    }
    
    const indices = itemCalculado.indices || {};
    const baseAntesSelic = valores.principalIPCAE + valores.totalJurosIPCAE;
    
    return `
        <h4>📊 SELIC - Passo a Passo</h4>
        <table>
            <tr><th>Etapa</th><th>Cálculo</th><th>Valor</th></tr>
            <tr>
                <td>1. Base para SELIC</td>
                <td>Principal + Juros em 31/07/2025 </td>
                <td>R$ ${formatarMoeda(baseAntesSelic)}</td>
            </tr>
            <tr>
                <td>2. Aplicação SELIC (até 31/07/2025)</td>
                <td>Base × ${((indices.selic - 1) * 100).toFixed(4)}%</td>
                <td>R$ ${formatarMoeda(valores.valorSelicBase)}</td>
            </tr>
            <tr>
                <td>3. Aplicação IPCA (pós agosto/2025)</td>
                <td>SELIC × ${indices.ipca?.toFixed(6) || '1.000000'}</td>
                <td><strong>R$ ${formatarMoeda(valores.valorSelicFinal)}</strong></td>
            </tr>
        </table>
    `;
}

function gerarNotaSelicInformado(dados, resultados) {
    const itensComSelic = dados.valoresPrincipais.filter(item => 
        (item.tipoSelic === 'valor' && item.valorSelic > 0) || 
        (item.tipoSelic === 'percentual' && item.percentualSelic > 0)
    );
    
    const notasItens = itensComSelic.map(item => {
        const itemCalculado = resultados.itensCalculados?.find(calc => calc.id === item.id) || {};
        const indiceSelic = itemCalculado.indices?.selic || 1;
        
        const percentualTotal = ((indiceSelic - 1) * 100).toFixed(2);
        
        // Calcular percentual informado
        let percentualInformado;
        if (item.tipoSelic === 'valor') {
            const totalBase = item.valorPrincipal + item.valorJuros;
            percentualInformado = totalBase > 0 ? ((item.valorSelic / totalBase) * 100).toFixed(4) : 0;
        } else {
            percentualInformado = (item.percentualSelic * 100).toFixed(2);
        }
        
        const percentualAutomatico = (parseFloat(percentualTotal) - parseFloat(percentualInformado)).toFixed(2);
        
        // Calcular período
        const dataBase = criarDataBase(item.mesBase, item.anoBase);
        const dataInicio = new Date(dataBase);
        if (item.mesReferenciaSelic !== 'mesAnterior') {
            dataInicio.setMonth(dataInicio.getMonth() + 1);
        }

        const dataAtualizacaoInput = document.getElementById('dataatualizacao').value;
        const dataFim = new Date(dataAtualizacaoInput);

        // SELIC vai só até Jul/2025
        const dataCorteSelicPEC = new Date(2025, 6, 31); // Jul/2025
        const dataFimSelic = dataFim > dataCorteSelicPEC ? dataCorteSelicPEC : dataFim;

        // Período de graça do orçamento
        const inicioGraca = resultados.inicioGraca ? new Date(resultados.inicioGraca) : null;
        const fimGraca = resultados.fimGraca ? new Date(resultados.fimGraca) : null;
        const inicioGracaLabel = `${String(inicioGraca.getMonth() + 1).padStart(2, '0')}/${inicioGraca.getFullYear()}`;
        const fimGracaLabel = `${String(fimGraca.getMonth() + 1).padStart(2, '0')}/${fimGraca.getFullYear()}`;

        const periodoInicio = `${String(dataInicio.getMonth() + 1).padStart(2, '0')}/${dataInicio.getFullYear()}`;
        const periodoFim = `${String(dataFimSelic.getMonth() + 1).padStart(2, '0')}/${dataFimSelic.getFullYear()}`;

        const periodoSelic = `${periodoInicio} a ${periodoFim} (excluindo graça: ${inicioGracaLabel} a ${fimGracaLabel})`;
        
        return `SELIC: ${percentualInformado}% Cálculo Homologado (${item.mesBase}/${item.anoBase}) + ${percentualAutomatico}% (${periodoSelic}) = ${percentualTotal}% total`;
    }).join('; ');
    
    return `*${notasItens}.<br>`;
}
