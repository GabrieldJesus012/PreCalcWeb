// Configurações e dados simulados
const meses = {
    "janeiro": 1, "fevereiro": 2, "março": 3, "abril": 4,
    "maio": 5, "junho": 6, "julho": 7, "agosto": 8,
    "setembro": 9, "outubro": 10, "novembro": 11, "dezembro": 12
};

// Função para inicializar os event listeners
function initializeEventListeners() {
    document.getElementById('tipoCalculo').addEventListener('change', function() {
        const tipo = this.value;
        const natureza = document.getElementById('natureza').value;
        
        document.getElementById('tetoPreferencia').style.display = 
            (tipo === 'preferencia' && natureza === 'alimentar') ? 'block' : 'none';
        document.getElementById('percentualAcordo').style.display = 
            tipo === 'acordo' ? 'block' : 'none';
    });

    document.getElementById('natureza').addEventListener('change', function() {
        const natureza = this.value;
        const tipo = document.getElementById('tipoCalculo').value;
        
        document.getElementById('tetoPreferencia').style.display = 
            (tipo === 'preferencia' && natureza === 'alimentar') ? 'block' : 'none';
    });

    document.getElementById('incidenciaPrevidencia').addEventListener('change', function() {
        const incidencia = this.value;
        const tipoDiv = document.getElementById('tipoPrevidenciaDiv');
        const aliquotaDiv = document.getElementById('aliquotaFixaDiv');
        
        if (incidencia === 'sim') {
            tipoDiv.style.display = 'block';
            // Verifica se já está como fixa para mostrar a alíquota
            const tipoPrevidencia = document.getElementById('tipoPrevidencia').value;
            aliquotaDiv.style.display = tipoPrevidencia === 'fixa' ? 'block' : 'none';
        } else {
            tipoDiv.style.display = 'none';
            aliquotaDiv.style.display = 'none';
        }
    });

    document.getElementById('tipoPrevidencia').addEventListener('change', function() {
        const tipo = this.value;
        const incidencia = document.getElementById('incidenciaPrevidencia').value;
        // Só mostra se a incidência também está como 'sim'
        document.getElementById('aliquotaFixaDiv').style.display = 
            (tipo === 'fixa' && incidencia === 'sim') ? 'block' : 'none';
    });

    document.getElementById('quantAdvogados').addEventListener('change', function() {
        const quant = parseInt(this.value);
        const container = document.getElementById('advogadosContainer');
        container.innerHTML = '';
        
        for (let i = 0; i < quant; i++) {
            const advDiv = document.createElement('div');
            advDiv.innerHTML = `
                <h4>Advogado ${i + 1}:</h4>
                <div class="input-group">
                    <label>Nome:</label>
                    <input type="text" id="advNome${i}" placeholder="Nome do advogado">
                </div>
                <div class="input-group">
                    <label>Tipo:</label>
                    <select id="advTipo${i}">
                        <option value="PF">Pessoa Física</option>
                        <option value="PJ">Pessoa Jurídica</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>Percentual (ex: 0.1 para 10%):</label>
                    <input type="number" id="advPercentual${i}" step="0.01" min="0" max="1" placeholder="0.00">
                </div>
                <hr style="margin: 15px 0; border: 1px solid #e9ecef;">
            `;
            container.appendChild(advDiv);
        }
    });
}

// Função para inicializar campos na carga da página
function initializeFields() {
    // Trigger dos eventos para configurar estado inicial
    document.getElementById('tipoCalculo').dispatchEvent(new Event('change'));
    document.getElementById('natureza').dispatchEvent(new Event('change'));
    document.getElementById('incidenciaPrevidencia').dispatchEvent(new Event('change'));
    document.getElementById('tipoPrevidencia').dispatchEvent(new Event('change'));
}

// Função principal de cálculo
function calcular() {
    // Coletar dados do formulário
    const dados = coletarDados();
    
    // Simular cálculos (versão simplificada dos cálculos do Python)
    const resultados = calcularValores(dados);
    
    // Exibir resultados
    exibirResultados(resultados, dados);
}

// Função para coletar dados do formulário
function coletarDados() {
    const dados = {
        numprocesso: document.getElementById('numprocesso').value,
        anoOrcamento: parseInt(document.getElementById('anoOrcamento').value),
        beneficiario: document.getElementById('beneficiario').value,
        credor: document.getElementById('credor').value,
        mesBase: document.getElementById('mesBase').value,
        anoBase: parseInt(document.getElementById('anoBase').value),
        valorPrincipal: parseFloat(document.getElementById('valorPrincipal').value) || 0,
        valorJuros: parseFloat(document.getElementById('valorJuros').value) || 0,
        valorSelic: parseFloat(document.getElementById('valorSelic').value) || 0,
        rra: parseInt(document.getElementById('rra').value) || 0,
        natureza: document.getElementById('natureza').value,
        tipoCalculo: document.getElementById('tipoCalculo').value,
        incidenciaIR: document.getElementById('incidenciaIR').value === 'sim',
        incidenciaPrevidencia: document.getElementById('incidenciaPrevidencia').value === 'sim',
        tipoPrevidencia: document.getElementById('tipoPrevidencia').value,
        aliquotaFixa: parseFloat(document.getElementById('aliquotaFixa').value) || 0,
        quantAdvogados: parseInt(document.getElementById('quantAdvogados').value) || 0,
        advogados: []
    };

    // Dados específicos por tipo de cálculo
    if (dados.tipoCalculo === 'preferencia') {
        dados.tetoPreferencia = parseFloat(document.getElementById('tetoPreferenciaPrincipal').value) || 0;
    }
    if (dados.tipoCalculo === 'acordo') {
        dados.percentualAcordo = parseFloat(document.getElementById('percentualAcordoValor').value) || 0;
    }

    // Coletar dados dos advogados
    for (let i = 0; i < dados.quantAdvogados; i++) {
        dados.advogados.push({
            nome: document.getElementById(`advNome${i}`).value,
            tipo: document.getElementById(`advTipo${i}`).value,
            percentual: parseFloat(document.getElementById(`advPercentual${i}`).value) || 0
        });
    }

    return dados;
}

// Função para calcular os valores
function calcularValores(dados) {
    // Simulação simplificada dos cálculos
    // Índices simulados (valores aproximados)
    const indice = 1.05; // CNJ - Calcular
    const indiceselic = 1.08; // SELIC - API
    const indiceipca = 1.06; // IPCA - API
    const jurosmora = 1.03; // Juros de Mora - CALCULAr

    // Cálculos básicos
    const indiceprinc = indice * indiceselic * indiceipca;
    const indicejur = indiceselic * indiceipca;

    const valorjurosmora = dados.valorPrincipal * indice * (jurosmora - 1);
    const juros = valorjurosmora + (dados.valorJuros * indice);

    const valorprincatt = dados.valorPrincipal * indiceprinc;
    const valorjurosatt = juros * indicejur;
    const valortotatt = valorprincatt + valorjurosatt;

    const percentualprinc = valorprincatt / valortotatt;
    const percentualjur = valorjurosatt / valortotatt;

    // Valor base conforme tipo de cálculo
    let valorBase = valortotatt;
    if (dados.tipoCalculo === 'preferencia' && dados.natureza === 'alimentar') {
        valorBase = Math.min(valortotatt, dados.tetoPreferencia);
    } else if (dados.tipoCalculo === 'acordo') {
        valorBase = valortotatt * (1 - dados.percentualAcordo);
    }

    const principal = valorBase * percentualprinc;
    const jurosBase = valorBase * percentualjur;

    // RRA
    const rrapagamento = dados.rra !== 0 ? (valorBase * dados.rra) / valortotatt : 0;

    // Honorários
    let valorHonorarioTotal = 0;
    const honorarios = dados.advogados.map(adv => {
        const valorBruto = valorBase * adv.percentual;
        let ir = 0;
        if (adv.tipo === 'PF') {
            ir = calcularIR(valorBruto);
        } else {
            ir = valorBruto * 0.015;
        }
        const valorLiquido = valorBruto - ir;
        valorHonorarioTotal += valorBruto;
        
        return {
            ...adv,
            valorBruto,
            ir,
            valorLiquido
        };
    });

    // Previdência
    let valorPrevidencia = 0;
    let aliquotaEfetiva = 0;
    if (dados.incidenciaPrevidencia) {
        if (dados.tipoPrevidencia === 'fixa') {
            valorPrevidencia = principal * dados.aliquotaFixa;
            aliquotaEfetiva = dados.aliquotaFixa;
        } else {
            // Cálculo INSS simplificado
            const base = rrapagamento === 0 ? principal : principal / rrapagamento;
            const resultadoINSS = calcularINSS(base);
            valorPrevidencia = resultadoINSS * (rrapagamento || 1);
            aliquotaEfetiva = resultadoINSS / base;
        }
    }

    // IR sobre o beneficiário
    let valorIR = 0;
    let aliquotaIR = 0;
    if (dados.incidenciaIR && rrapagamento !== 0) {
        const percentualTotalAdv = dados.advogados.reduce((sum, adv) => sum + adv.percentual, 0);
        const baseIR = (principal - (principal * percentualTotalAdv) - valorPrevidencia) / rrapagamento;
        const valorIRUnitario = calcularIR(baseIR);
        valorIR = valorIRUnitario * rrapagamento;
        aliquotaIR = valorIRUnitario / baseIR;
    }

    return {
        valorprincatt,
        valorjurosatt,
        valortotatt,
        valorBase,
        principal,
        jurosBase,
        rrapagamento,
        honorarios,
        valorHonorarioTotal,
        valorPrevidencia,
        aliquotaEfetiva,
        valorIR,
        aliquotaIR,
        // Índices para exibição
        indice,
        indiceselic,
        indiceipca,
        jurosmora
    };
}

// Função para calcular IR
function calcularIR(valorBruto) {
    if (valorBruto <= 2428.80) return 0;
    else if (valorBruto <= 2826.65) return (valorBruto * 0.075) - 182.16;
    else if (valorBruto <= 3751.05) return (valorBruto * 0.15) - 394.16;
    else if (valorBruto <= 4664.68) return (valorBruto * 0.225) - 675.49;
    else return (valorBruto * 0.275) - 908.73;
}

// Função para calcular INSS
function calcularINSS(base) {
    if (base <= 1518.00) return base * 0.075;
    else if (base <= 2793.88) return 1518 * 0.075 + (base - 1518) * 0.09;
    else if (base <= 4190.83) return 1518 * 0.075 + 1275.88 * 0.09 + (base - 2793.88) * 0.12;
    else if (base <= 8157.41) return 1518 * 0.075 + 1275.88 * 0.09 + 1396.95 * 0.12 + (base - 4190.83) * 0.14;
    else return 951.63; // Teto
}

// Função para exibir resultados
function exibirResultados(resultados, dados) {
    const container = document.getElementById('resultadosContent');
    
    const html = `
        <div class="table-container">
            <h3>📈 Resumo dos Cálculos</h3>
            <table>
                <tr>
                    <th>Descrição</th>
                    <th>Valor</th>
                </tr>
                <tr>
                    <td>Valor Principal Atualizado</td>
                    <td>R$ ${resultados.valorprincatt.toFixed(2)}</td>
                </tr>
                <tr>
                    <td>Valor Juros Atualizado</td>
                    <td>R$ ${resultados.valorjurosatt.toFixed(2)}</td>
                </tr>
                <tr class="highlight">
                    <td>Total Atualizado</td>
                    <td>R$ ${resultados.valortotatt.toFixed(2)}</td>
                </tr>
                <tr class="highlight">
                    <td>Valor Base para Cálculo</td>
                    <td>R$ ${resultados.valorBase.toFixed(2)}</td>
                </tr>
            </table>
        </div>

        <div class="table-container">
            <h3>📊 Índices Utilizados</h3>
            <table>
                <tr>
                    <th>Índice</th>
                    <th>Valor</th>
                    <th>Período/Observação</th>
                </tr>
                <tr>
                    <td>Índice CNJ</td>
                    <td>${resultados.indice.toFixed(6)}</td>
                    <td>${dados.mesBase}/${dados.anoBase}</td>
                </tr>
                <tr>
                    <td>SELIC Acumulada</td>
                    <td>${resultados.indiceselic.toFixed(6)}</td>
                    <td>Exceto período de graça</td>
                </tr>
                <tr>
                    <td>IPCA-e Acumulado</td>
                    <td>${resultados.indiceipca.toFixed(6)}</td>
                    <td>Durante período de graça</td>
                </tr>
                <tr>
                    <td>Juros de Mora</td>
                    <td>${resultados.jurosmora.toFixed(6)}</td>
                    <td>Natureza: ${dados.natureza}</td>
                </tr>
            </table>
        </div>

        <div class="table-container">
            <h3>💰 Pagamento Beneficiário - ${dados.beneficiario}</h3>
            <table>
                <tr>
                    <th>Descrição</th>
                    <th>Valor</th>
                </tr>
                <tr>
                    <td>Processo</td>
                    <td>${dados.numprocesso || 'Não informado'}</td>
                </tr>
                <tr>
                    <td>Credor/Devedor</td>
                    <td>${dados.credor || 'Não informado'}</td>
                </tr>
                <tr>
                    <td>Valor Devido</td>
                    <td>R$ ${(resultados.valorBase - resultados.valorHonorarioTotal).toFixed(2)}</td>
                </tr>
                <tr>
                    <td>Alíquota Efetiva Previdência</td>
                    <td>${(resultados.aliquotaEfetiva * 100).toFixed(2)}%</td>
                </tr>
                <tr>
                    <td>Previdência</td>
                    <td>R$ ${resultados.valorPrevidencia.toFixed(2)}</td>
                </tr>
                <tr>
                    <td>Alíquota IR</td>
                    <td>${(resultados.aliquotaIR * 100).toFixed(2)}%</td>
                </tr>
                <tr>
                    <td>Imposto de Renda</td>
                    <td>R$ ${resultados.valorIR.toFixed(2)}</td>
                </tr>
                <tr class="highlight">
                    <td>Valor Líquido</td>
                    <td>R$ ${(resultados.valorBase - resultados.valorHonorarioTotal - resultados.valorPrevidencia - resultados.valorIR).toFixed(2)}</td>
                </tr>
            </table>
        </div>

        ${resultados.honorarios.length > 0 ? `
        <div class="table-container">
            <h3>👩‍💼 Pagamento Advogados</h3>
            <table>
                <tr>
                    <th>Nome</th>
                    <th>Tipo</th>
                    <th>Valor Devido</th>
                    <th>IR</th>
                    <th>Valor Líquido</th>
                </tr>
                ${resultados.honorarios.map(h => `
                <tr>
                    <td>${h.nome}</td>
                    <td>${h.tipo}</td>
                    <td>R$ ${h.valorBruto.toFixed(2)}</td>
                    <td>R$ ${h.ir.toFixed(2)}</td>
                    <td>R$ ${h.valorLiquido.toFixed(2)}</td>
                </tr>
                `).join('')}
            </table>
        </div>
        ` : ''}
    `;

    container.innerHTML = html;
    document.getElementById('results').classList.remove('hidden');
    
    // Scroll para os resultados
    document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
}

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeFields();
});

// Inicialização alternativa para compatibilidade
window.addEventListener('load', function() {
    initializeFields();
});