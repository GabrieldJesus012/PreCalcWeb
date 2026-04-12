function gerarCabecalhoProcesso(dados, resultados, dataAtual) {
    const secaoRRA = (resultados.rraTotal && resultados.rraTotal !== 0)
        ? `<tr><td>Rendimentos Recebidos Acumuladamente Total (RRA):</td><td>${resultados.rraTotal} meses</td></tr>`
        : '';

    const tipos = {
        ordem: "Ordem Cronológica",
        preferencia: "Preferencial",
        acordo: "Acordo",
        parcial: "Parcial"
    };
    const tipoCalculo = tipos[dados.tipoCalculo] || "Não definido";

    const natureza = dados.natureza === 'alimentar' ? '⚖️ Alimentar' : '⚖️ Comum';

    let secaoDataBase = '<tr><td>Data-base do cálculo homologado na execução</td><td>Não informado</td></tr>';
    
    if (dados.valoresPrincipais && dados.valoresPrincipais.length > 0) {
        const datasUnicas = [...new Set(
            dados.valoresPrincipais
                .filter(item => item.mesBase && item.anoBase)
                .map(item => `${item.mesBase}/${item.anoBase}`)
        )];
        
        if (datasUnicas.length > 0) {
            const label = datasUnicas.length === 1 
                ? 'Data-base do cálculo homologado na execução'
                : 'Datas-base dos cálculos homologados';
            secaoDataBase = `<tr><td>${label}</td><td>${datasUnicas.join(', ')}</td></tr>`;
        }
    }
    
    return `
        <div class="table-container">
            <h3>📋 Identificação do Processo</h3>
            <table>
                <tr><th>Descrição</th><th>Informação</th></tr>
                <tr><td>Número do Processo</td><td>${dados.numProcesso || 'Não informado'}</td></tr>
                <tr><td>Ano do orçamento do Precatório</td><td>${dados.anoOrcamento || 'Não informado'}</td></tr>
                <tr><td>Natureza do Processo</td><td>${natureza}</td></tr>
                ${secaoRRA}
                ${secaoDataBase}
                <tr><td>Beneficiário Principal</td><td>${dados.beneficiario || 'Não informado'}</td></tr>
                <tr><td>Devedor</td><td>${dados.credor || 'Não informado'}</td></tr>
                <tr><td>Data do Cálculo</td><td>${dataAtual}</td></tr>
                <tr><td>Tipo de Cálculo</td><td>${tipoCalculo}</td></tr>
            </table>
        </div>
    `;
}

function gerarDemonstrativoValores(dados, resultados, dataAtual) {
    // Calcular valores originais totais - EXCLUINDO valores negativos
    const valorPrincipalOriginal = (dados.valoresPrincipais || [])
        .reduce((sum, item) => {
            const valor = parseFloat(item.valorPrincipal) || 0;
            return sum + (valor > 0 ? valor : 0);
        }, 0);
    
    const valorJurosOriginal = (dados.valoresPrincipais || [])
        .reduce((sum, item) => {
            const valor = parseFloat(item.valorJuros) || 0;
            return sum + (valor > 0 ? valor : 0);
        }, 0);
    
    const valorSelicOriginal = (dados.valoresPrincipais || [])
    .reduce((sum, item) => {
        const valor = parseFloat(item.valorSelic) || 0;
        return sum + (valor > 0 ? valor : 0);
    }, 0);

    const valorTotalOriginal = valorPrincipalOriginal + valorJurosOriginal + valorSelicOriginal;

    // ⬇️ CALCULAR ÍNDICES INDIVIDUAIS
    const indicePrincipal = valorPrincipalOriginal > 0 
        ? (resultados.valorprincatt / valorPrincipalOriginal).toFixed(6)
        : '1.000000';
    
    const indiceJuros = valorJurosOriginal > 0
        ? (resultados.valorjurosatt / valorJurosOriginal).toFixed(6)
        : '1.000000';
    
    const indiceTotal = valorTotalOriginal > 0
        ? (resultados.valortotatt / valorTotalOriginal).toFixed(6)
        : '1.000000';

    const datasUnicas = [...new Set(
        (dados.valoresPrincipais || [])
            .filter(item => item.mesBase && item.anoBase)
            .map(item => `${item.mesBase}/${item.anoBase}`)
    )];
    
    const textoDataBase = datasUnicas.length > 0 
        ? datasUnicas.join(', ') 
        : 'Não informado';

    // VERIFICAR SE TEM SELIC SEPARADA
    const valorSelicTotal = resultados.valorSelicatt || 0;
    const temSelic = valorSelicTotal > 0;

    const indiceSelicExibicao = valorSelicOriginal > 0
        ? (valorSelicTotal / valorSelicOriginal).toFixed(6)
        : '-';
    const valorSelicOriginalExibicao = valorSelicOriginal > 0
        ? `R$ ${formatarMoeda(valorSelicOriginal)}`
        : '-';

    return `
        <div class="table-container">
            <h3>💰 Demonstrativo de Atualização Monetária</h3>
            <table>
                <tr>
                    <th style="width:20%">Componente</th>
                    <th style="width:15%">Valor Histórico (${textoDataBase})</th>
                    <th style="width:15%">Índice de Correção*</th>
                    <th style="width:15%">Valor Atualizado (${dataAtual})</th>
                    <th style="width:15%">%</th>
                </tr>
                <tr>
                    <td>Principal</td>
                    <td>R$ ${formatarMoeda(valorPrincipalOriginal)}</td>
                    <td>${indicePrincipal}</td>
                    <td>R$ ${formatarMoeda(resultados.valorprincatt)}</td>
                    <td>${(resultados.percentualprinc * 100).toFixed(4)}%</td>
                </tr>
                <tr>
                    <td>Juros</td>
                    <td>R$ ${formatarMoeda(valorJurosOriginal)}</td>
                    <td>${indiceJuros}</td>
                    <td>R$ ${formatarMoeda(resultados.valorjurosatt)}</td>
                    <td>${(resultados.percentualjur * 100).toFixed(4)}%</td>
                </tr>
                ${temSelic ? `
                <tr>
                    <td>Selic</td>
                    <td>${valorSelicOriginalExibicao}</td>
                    <td>${indiceSelicExibicao}</td>
                    <td>R$ ${formatarMoeda(valorSelicTotal)}</td>
                    <td>${(resultados.percentualselic * 100).toFixed(4)}%</td>
                </tr>
                ` : ''}
                <tr class="highlight">
                    <td><strong>Total Atualizado</strong></td>
                    <td><strong>R$ ${formatarMoeda(valorTotalOriginal)}</strong></td>
                    <td><strong>${indiceTotal}</strong></td>
                    <td><strong>R$ ${formatarMoeda(resultados.valortotatt)}</strong></td>
                    <td><strong>100.00%</strong></td>
                </tr>
                ${gerarLinhaBase(resultados, dados)}
            </table>
            <div class="success-box" style="margin-top: 15px; padding: 10px; border-radius: 4px;">
                *Atualização Monetária conforme Resolução CNJ nº 303/2019, com índices de correção monetária, conforme caput do Art.21- A e Emendas Constitucionais nº 62, 113 e 136. - <strong>Período de Correção</strong>: Os valores foram atualizados desde a base <strong>${textoDataBase}</strong> até <strong>${dataAtual}</strong>.
            </div>
        </div>
    `;
}


function gerarLinhaBase(resultados, dados) {
    const temHerdeiros = resultados.temHerdeiros && resultados.herdeiros.length > 0;

    if (dados.somenteHonorarioSucumbencial && dados.tipoCalculo === 'parcial') {
        return `
            <tr class="highlight">
                <td><strong>Valor Disponível para Pagamento</strong></td>
                <td colspan="3"><strong>R$ ${formatarMoeda(dados.saldoParcial)}</strong></td>
                <td><strong>100.00%</strong></td>
            </tr>
        `;
    } else if (temHerdeiros && dados.tipoCalculo === 'preferencia') {
        const herdeirosPreferenciais = resultados.herdeiros.filter(h => h.temPreferencia);
        if (herdeirosPreferenciais.length > 0) {
            return `
                <tr class="highlight">
                    <td colspan="5"><strong>Base para Pagamento</strong></td>
                </tr>
                ${herdeirosPreferenciais.map(h => `
                    <tr class="highlight">
                        <td><strong>${h.nome}</strong></td>
                        <td colspan="2"><strong>R$ ${formatarMoeda(h.valorTotal)}</strong></td>
                        <td><strong>R$ ${formatarMoeda(h.valorTotal)}</strong></td>
                        <td><strong>${((h.valorTotal / resultados.valortotatt) * 100).toFixed(2)}%</strong></td>
                    </tr>
                `).join('')}
            `;
        }
    } else {
        return `
            <tr class="highlight">
                <td><strong>Base para Pagamento</strong></td>
                <td>-</td>
                <td>-</td>
                <td><strong>R$ ${formatarMoeda(resultados.valorBase)}</strong></td>
                <td><strong>${((resultados.valorBase / resultados.valortotatt) * 100).toFixed(2)}%</strong></td>
            </tr>
        `;
    }
    return '';
}

