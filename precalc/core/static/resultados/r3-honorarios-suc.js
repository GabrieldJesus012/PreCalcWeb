//Honorarios sucumbencias

function gerarSecaoHonorariosSucumbenciais(resultados, dados) {
    if (!resultados.honorariosSucumbenciais?.temHonorariosSucumbenciais || 
        !resultados.honorariosSucumbenciais?.honorarios?.length) {
        return '';
    }

    if (dados.honorarioSucumbencial?.advogados?.some(adv => adv.tipoHonorario === 'valorPrincipal')) {
        return '';
    }

    const honorarios = resultados.honorariosSucumbenciais.honorarios;
    const valorBaseSucumbencial = resultados.honorariosSucumbenciais.valorBaseSucumbencial;

    let totalHonorariosBrutos = 0;
    
    const linhasAdvogados = honorarios.map(adv => {
        const percentualExibicao = adv.tipoHonorario === 'percentual' 
            ? `${(adv.percentual * 100).toFixed(2)}%`
            : '100,00%';
        
        const valorBruto = adv.tipoHonorario === 'percentual'
            ? valorBaseSucumbencial * adv.percentual
            : valorBaseSucumbencial;
        
        totalHonorariosBrutos += valorBruto;
        
        return `
            <tr>
                <td>${adv.nome}</td>
                <td>R$ ${formatarMoeda(valorBaseSucumbencial)}</td>
                <td>${percentualExibicao}</td>
                <td>R$ ${formatarMoeda(valorBruto)}</td>
            </tr>
        `;
    }).join('');

    return `
        <div class="table-container">
            <h3>💼 Honorários Sucumbenciais</h3>
            
            <table>
                <tr>
                    <th>Advogado</th>
                    <th>Base de Cálculo</th>
                    <th>Percentual</th>
                    <th>Valor Bruto</th>
                </tr>
                ${linhasAdvogados}
                <tr class="linha-gold">
                    <td colspan="3" class="bold"><strong>Total dos Honorários Sucumbenciais</td>
                    <td class="right bold">R$ ${formatarMoeda(totalHonorariosBrutos)}</td>
                </tr>
            </table>
        </div>
    `;
}

//Cessoes de sucumbencias

function gerarSecaoCessoesHonorariosSucumbenciais(resultados, dados) {
    if (!resultados.honorariosSucumbenciais?.temHonorariosSucumbenciais || 
        !resultados.honorariosSucumbenciais?.honorarios?.length) {
        return '';
    }

    const honorarios = resultados.honorariosSucumbenciais.honorarios;
    const valorBaseSucumbencial = resultados.honorariosSucumbenciais.valorBaseSucumbencial;
    
    const advogadosComCessoes = honorarios.filter(adv => adv.temCessoes && adv.cessionarios?.length > 0);
    
    if (advogadosComCessoes.length === 0) {
        return '';
    }

    const secoesCessoes = advogadosComCessoes.map(adv => {
        // Calcular valor bruto do honorário
        const valorHonorarioTotal = adv.tipoHonorario === 'percentual'
            ? valorBaseSucumbencial * adv.percentual
            : valorBaseSucumbencial;

        // Dados de cessão
        const totalCedido = adv.percentualCessionarioAdv || 0;
        const percentualAdvogado = adv.percentualAdvogado || (1 - totalCedido);
        const valorAdvogado = valorHonorarioTotal * percentualAdvogado;
        const listaCessionarios = adv.cessionarios?.map(c => c.nome).join(', ') || '';

        // Linha do advogado
        const linhaAdvogado = `
            <tr>
                <td>${adv.nome}</td>
                <td>${(percentualAdvogado * 100).toFixed(2)}%</td>
                <td>R$ ${formatarMoeda(valorAdvogado)}</td>
            </tr>
        `;

        // Linhas dos cessionários
        const linhasCessionarios = (adv.cessionarios || []).map(cessionario => {
            const valorCessionario = valorHonorarioTotal * cessionario.percentual;
            return `
                <tr>
                    <td>${cessionario.nome} (Cessionário)</td>
                    <td>${(cessionario.percentual * 100).toFixed(2)}%</td>
                    <td>R$ ${formatarMoeda(valorCessionario)}</td>
                </tr>
            `;
        }).join('');

        const textoHonorario = dados.tipoCalculo === 'parcial' 
            ? `Valor do Honorário (Parcial): R$ ${formatarMoeda(valorHonorarioTotal)}`
            : `Valor do Honorário: R$ ${formatarMoeda(valorHonorarioTotal)}`;

        return `
            <div style="margin-bottom: 30px;">
                <h4>Cessão do Advogado Sucumbencial: ${adv.nome}</h4>
                <p><strong>${textoHonorario}</strong></p>
                <p><strong>Cedido:</strong> ${(totalCedido * 100).toFixed(2)}% para: ${listaCessionarios}</p>
                
                <table>
                    <tr>
                        <th>Recebedor</th>
                        <th>Percentual</th>
                        <th>Valor do Direito</th>
                    </tr>
                    ${linhaAdvogado}
                    ${linhasCessionarios}
                    <tr class="highlight">
                        <td colspan="2"><strong>Total</strong></td>
                        <td><strong>R$ ${formatarMoeda(valorHonorarioTotal)}</strong></td>
                    </tr>
                </table>
            </div>
        `;
    }).join('');

    return `
        <div class="table-container">
            <h3>🔄 Cessões de Honorários Sucumbenciais</h3>
            ${secoesCessoes}
        </div>
    `;
}

function gerarTabelaHonorariosSucumbenciais(resultados, dados) {
    if (!resultados.honorariosSucumbenciais?.temHonorariosSucumbenciais || 
        !resultados.honorariosSucumbenciais?.honorarios?.length) {
        return '';
    }

    const isPreferencia = dados.tipoCalculo === 'preferencia';
    const pagamentos = [];

    resultados.honorariosSucumbenciais.honorarios.forEach(adv => {
        const { deveReceberAdvogado, deveReceberCessionarios } = verificarRecebimentoSucumbencial(adv, isPreferencia);
        
        // Advogado sucumbencial
        if (deveReceberAdvogado && adv.valorBrutoAdvogado > 0) {
            pagamentos.push({
                credor: `${adv.nome} (Adv. Sucumbencial ${adv.tipo})`,
                valorDevido: adv.valorBrutoAdvogado,
                previdencia: 0,
                ir: adv.irAdvogado || 0,
                valorLiquido: adv.valorLiquidoAdvogado || 0
            });
        }

        // Cessionários
        if (deveReceberCessionarios && adv.cessionarios?.length > 0) {
            adv.cessionarios.forEach(cessionario => {
                if (cessionario.valorLiquido > 0) {
                    pagamentos.push({
                        credor: `${cessionario.nome} (Cess. Adv. Sucumb. ${adv.nome})`,
                        valorDevido: cessionario.valorBruto,
                        previdencia: 0,
                        ir: cessionario.ir || 0,
                        valorLiquido: cessionario.valorLiquido
                    });
                }
            });
        }
    });

    if (pagamentos.length === 0) return '';

    return montarTabelaHonorariosSucumbenciais(pagamentos);
}

