// ====================================
// EXIBICAO DE RESULTADOS (HTML)
// ====================================

function exibirResultados(resultados, dados) {
    const container = document.getElementById('resultadosContent');
    const dataAtual = obterDataAtual();
    const inicioGraca = resultados.inicioGraca ? new Date(resultados.inicioGraca) : null;
    const fimGraca = resultados.fimGraca ? new Date(resultados.fimGraca) : null;
    
    const contexto = {
        dataAtual,
        inicioGraca,
        fimGraca,
        temHerdeiros: resultados.temHerdeiros && resultados.herdeiros.length > 0,
        somenteHonorarioSucumbencial: dados.somenteHonorarioSucumbencial
    };
    
    const html = contexto.somenteHonorarioSucumbencial 
        ? gerarVisualizacaoSucumbencial(resultados, dados, contexto)
        : gerarVisualizacaoCompleta(resultados, dados, contexto);
    
    container.innerHTML = html;
    navegarParaResultados();
}

function gerarVisualizacaoSucumbencial(resultados, dados, contexto) {
    return `
        ${gerarCabecalhoProcesso(dados, resultados, contexto.dataAtual)}
        ${gerarDemonstrativoValores(dados, resultados, contexto.dataAtual)}
        ${gerarCalculos(dados, resultados, contexto.inicioGraca, contexto.fimGraca)}
        
        ${gerarSecaoHonorariosSucumbenciais(resultados, dados)}
        ${gerarSecaoCessoesHonorariosSucumbenciais(resultados, dados)}
        ${gerarSecaoPagamentosOcorridos(resultados, dados)}
        ${gerarDemonstrativoSaldoRemanescente(resultados)}
        ${gerarTabelaHonorariosSucumbenciais(resultados, dados)}
        ${gerarNotasTributacao()}
        
        ${gerarSecaoNotasExplicativas()}
        ${gerarBotaoImprimir()}
    `;
}

function gerarVisualizacaoCompleta(resultados, dados, contexto) {
    return `
        ${gerarCabecalhoProcesso(dados, resultados, contexto.dataAtual)}
        ${gerarDemonstrativoValores(dados, resultados, contexto.dataAtual)}
        ${gerarCalculos(dados, resultados, contexto.inicioGraca, contexto.fimGraca)}
        
        ${gerarSecaoHonorariosSucumbenciais(resultados, dados)}
        ${gerarSecaoCessoesHonorariosSucumbenciais(resultados, dados)}
        ${gerarSecaoDeducoesAcessorias(resultados, dados)}
        ${gerarSecaoCessoesSindicatos(resultados, dados)}
        ${gerarSecaoCessoesAdvogados(resultados, dados)}
        ${gerarSecaoCessoesBeneficiario(resultados, dados)}
        ${contexto.temHerdeiros ? gerarSecaoHerdeiros(resultados, dados) : ''}
        ${gerarSecaoCessoesHerdeiros(resultados, dados)} 
        ${gerarSecaoPagamentosOcorridos(resultados, dados)}
        ${gerarDemonstrativoSaldoRemanescente(resultados)}
        ${gerarSecaoDeducoes(resultados, dados)}
        ${gerarSecoesPagamentos(resultados, dados)}
        
        ${gerarSecaoNotasExplicativas()}
        ${gerarBotaoImprimir()}
    `;
}

function gerarNotasTributacao() {
    return `
        <div style="margin-top: 15px; padding: 10px; background-color: #f9f9f9; border-radius: 5px;">
            <h4>📋 Notas sobre Tributação do Imposto de Renda:</h4>
            <p style="margin: 5px 0;"><strong>Advogados Pessoa Física (PF):</strong> 🏦 LEI Nª 15.270, DE 11 DE NOVEMBRO DE 2025</p>
            <p style="margin: 5px 0;"><strong>Advogados Pessoa Jurídica (PJ):</strong> 🏦 DECRETO 9.580, ART 714</p>
        </div>
    `;
}

function navegarParaResultados() {
    showTab('tab7');
    setTimeout(() => {
        document.getElementById('tab7')?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }, 100);
}

function obterDataAtual() {
    const dataAtualizacaoInput = document.getElementById("dataatualizacao").value;
    const [ano, mes, dia] = dataAtualizacaoInput.split('-');
    return `${dia}/${mes}/${ano}`;
}

function formatarData(data) {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
                'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${meses[data.getMonth()]}/${data.getFullYear()}`;
}

function formatarMoeda(valor) {
    if (valor === null || valor === undefined || valor === '' || isNaN(valor)) {
        return '0,00';
    }
    
    const numeroValido = parseFloat(valor) || 0;
    return `${numeroValido.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
}

function gerarSecaoNotasExplicativas() {
    return `
        <div class="notas-explicativas">
            <h3>📝 Notas Explicativas do Cálculo</h3>
            <textarea id="notasExplicativas" class="textarea-notas" placeholder="Digite aqui as notas explicativas sobre os critérios utilizados no cálculo, fundamentação legal, decisões judiciais aplicadas, metodologia de atualização monetária, etc. Exemplo: 1- Destaque do crédito preferencial, conforme decisão de id... 2- Atualização do Cálculo do id..." maxlength="5000"></textarea>
        </div>
    `;
}

function obterNotasExplicativas() {
    const textarea = document.getElementById('notasExplicativas');
    return textarea ? textarea.value.trim() : '';
}

function prepararTextareaParaImpressao() {
    // Primeiro, remove qualquer elemento anterior
    const elementoAnterior = document.getElementById('notasParaImpressao');
    if (elementoAnterior) {
        elementoAnterior.remove();
    }
    
    const textarea = document.getElementById('notasExplicativas');
    if (textarea && textarea.value.trim()) {
        // Na impressão
        const notasDiv = document.createElement('div');
        notasDiv.id = 'notasParaImpressao';
        notasDiv.style.display = 'none';
        notasDiv.innerHTML = `
            <div class="notas-explicativas-impressao">
                <h3>📝 Notas Explicativas do Cálculo</h3>
                <div class="conteudo-notas">${textarea.value}</div>
            </div>
        `;
        
        // Inserir antes do botão de imprimir
        const botao = document.querySelector('.print-button-container');
        if (botao) {
            botao.parentNode.insertBefore(notasDiv, botao);
        }
    }
}

function limparNotasExplicativas() {
    const textarea = document.getElementById('notasExplicativas');
    if (textarea) {
        textarea.value = '';
    }
}

function gerarBotaoImprimir() {
    return `
        <div class="print-button-container" style="text-align: center; margin: 20px 0; display: block;">
            <button onclick="window.location.href='/pdf/${resultados._id}/'" style="...">
                🖨️ Gerar PDF
            </button>
            <button onclick="exportarExcel()" style="
                background-color: #1a7a4a;
                color: white;
                border: none;
                padding: 12px 24px;
                font-size: 16px;
                border-radius: 5px;
                cursor: pointer;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                margin-right: 10px;
            ">
                📊 Exportar Excel
            </button>
            <button onclick="window.location.href='/'" style="
                background-color: #1a2b4a;
                color: white;
                border: none;
                padding: 12px 24px;
                font-size: 16px;
                border-radius: 5px;
                cursor: pointer;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            ">
                ➕ Novo Cálculo
            </button>
            <button onclick="abrirFeedback()" title="Reportar problema ou sugestão" style="
                position: fixed;
                bottom: 24px;
                right: 24px;
                width: 48px;
                height: 48px;
                border-radius: 50%;
                background: var(--primary-navy, #1a2b4a);
                color: white;
                border: none;
                cursor: pointer;
                font-size: 20px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 1000;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: transform 0.2s;
            " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
            💬
            </button>
        </div>
    `;
}

function exportarExcel() {
    const tabelas = document.querySelectorAll('#resultadosContent table');
    
    if (tabelas.length === 0) {
        alert('Nenhuma tabela encontrada.');
        return;
    }

    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" 
                      xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head><meta charset="UTF-8">
        <style>
            table { border-collapse: collapse; }
            th { background: #1a2b4a; color: white; padding: 8px; border: 1px solid #ccc; font-weight: bold; }
            td { padding: 6px 10px; border: 1px solid #ccc; }
            h3 { margin-top: 20px; color: #1a2b4a; }
            h4 { color: #333; }
        </style></head><body>`;

    tabelas.forEach(tabela => {
        const container = tabela.closest('.table-container, .deducoes-legais, .pagamentos-finais');
        const titulo = container?.querySelector('h3, h4');
        if (titulo) html += `<h3>${titulo.textContent.trim()}</h3>`;
        html += tabela.outerHTML + '<br>';
    });

    html += '</body></html>';

    const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calculo_${(typeof dados !== 'undefined' ? dados.numProcesso : 'resultado') || 'resultado'}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

//auxiliar
function calcularIR(valorBruto) {
    if (valorBruto <= 2428.80) return 0;
    else if (valorBruto <= 2826.65) return (valorBruto * 0.075) - 182.16;
    else if (valorBruto <= 3751.05) return (valorBruto * 0.15) - 394.16;
    else if (valorBruto <= 4664.68) return (valorBruto * 0.225) - 675.49;
    else return (valorBruto * 0.275) - 908.73;
}

function calcularDescontoAdicional2026(baseIRRRA, valorIRCalculado) {
    if (baseIRRRA <= 5000.00) return Math.min(valorIRCalculado, 312.89);
    if (baseIRRRA <= 7350.00) return Math.max(0, 978.62 - (0.133145 * baseIRRRA));
    return 0;
}

function arredondarRRA(valor) {
    if (typeof valor !== 'number' || isNaN(valor)) return 0;
    const valorStr = valor.toFixed(3);
    const partes = valorStr.split('.');
    if (partes.length !== 2) return Math.round(valor * 10) / 10;
    const parteInteira = partes[0];
    const parteDecimal = partes[1].padEnd(3, '0');
    const primeiraDecimal = parseInt(parteDecimal[0]);
    const segundaDecimal = parseInt(parteDecimal[1]);
    const terceiraDecimal = parseInt(parteDecimal[2]);
    let novaParteDecimal = primeiraDecimal;
    if (segundaDecimal > 5) {
        novaParteDecimal = primeiraDecimal + 1;
    } else if (segundaDecimal === 5) {
        if (terceiraDecimal >= 5) novaParteDecimal = primeiraDecimal + 1;
    }
    return parseFloat(`${parteInteira}.${novaParteDecimal}`);
}