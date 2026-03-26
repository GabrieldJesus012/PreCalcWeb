//  CARREGAMENTO AUTOMÁTICO DE DADOS
let dadosProcessos = new Map(); 
let csvCarregado = false;

async function carregarCSVDoServidor() {
    try {
        const response = await fetch('/static/tabelas/dados.csv');
        
        if (!response.ok) {
            throw new Error('Erro ao carregar arquivo CSV');
        }
        
        const texto = await response.text();
        
        const linhas = texto.split('\n');
        
        const cabecalho = linhas[0].split(';').map(c => c.trim());
        
        dadosProcessos.clear();
        
        
        for (let i = 1; i < linhas.length; i++) {
            if (!linhas[i].trim()) continue; 
            
            const valores = linhas[i].split(';');
            
            if (valores.length < 9) continue;
            
            const processo = {
                numero: valores[0]?.trim() || '',
                orcamento: valores[1]?.trim() || '',
                exequente: valores[2]?.trim() || '',
                executado: valores[3]?.trim() || '',
                dataCalculo: valores[4]?.trim() || '',
                natureza: valores[5]?.trim() || '',
                rra: valores[6]?.trim() || '',
                principal: valores[7]?.trim() || '',
                juros: valores[8]?.trim() || ''
            };
            
            if (processo.numero) {
                dadosProcessos.set(processo.numero, processo);
            }
        }
        
        csvCarregado = true;
        
        const statusDiv = document.getElementById('statusCarregamento');
        if (statusDiv) {
            statusDiv.innerHTML = `✅ Base de dados carregada: ${dadosProcessos.size} processos disponíveis`;
            statusDiv.style.color = '#28a745';
        }
        
        localStorage.setItem('dadosProcessos', JSON.stringify([...dadosProcessos]));
        localStorage.setItem('dataCarregamento', new Date().toISOString());
        
        return true;
    } catch (erro) {
        console.error('❌ Erro ao carregar CSV:', erro);
        
        const cacheLocal = localStorage.getItem('dadosProcessos');
        if (cacheLocal) {
            dadosProcessos = new Map(JSON.parse(cacheLocal));
            console.log('📦 Dados carregados do cache local');
            csvCarregado = true;
            
            const statusDiv = document.getElementById('statusCarregamento');
            if (statusDiv) {
                statusDiv.innerHTML = `📦 Usando cache local: ${dadosProcessos.size} processos`;
                statusDiv.style.color = '#ffc107';
            }
            return true;
        }
        
        const statusDiv = document.getElementById('statusCarregamento');
        if (statusDiv) {
            statusDiv.innerHTML = '❌ Erro ao carregar base de dados';
            statusDiv.style.color = '#dc3545';
        }
        
        return false;
    }
}

function converterDataParaInput(dataStr) {
    if (!dataStr) return '';
    
    dataStr = dataStr.trim();
    
    if (dataStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dataStr;
    }
    
    const partes = dataStr.split('/');
    if (partes.length === 3) {
        const dia = partes[0].padStart(2, '0');
        const mes = partes[1].padStart(2, '0');
        const ano = partes[2];
        return `${ano}-${mes}-${dia}`;
    }
    
    return '';
}

function converterNumero(valorStr) {
    if (!valorStr) return '';
    
    valorStr = valorStr.trim();
    
    if (valorStr === '') return '';
    
    const numeroConvertido = valorStr
        .replace(/\./g, '')  // Remove pontos
        .replace(',', '.');   // Troca vírgula por ponto
    
    return numeroConvertido;
}

function buscarDadosProcesso() {
    const numeroProcesso = document.getElementById('numprocesso').value.trim();
    
    if (!numeroProcesso) {
        alert('⚠️ Digite o número do processo!');
        return false;
    }
    
    if (!csvCarregado || dadosProcessos.size === 0) {
        alert('⚠️ Base de dados ainda não foi carregada. Aguarde um momento e tente novamente.');
        return false;
    }
    
    const dados = dadosProcessos.get(numeroProcesso);
    
    if (!dados) {
        alert('❌ Processo não encontrado na base de dados!\n\nProcurado: ' + numeroProcesso);
        return false;
    }

    // Beneficiário (Exequente)
    if (dados.exequente) {
        document.getElementById('beneficiario').value = dados.exequente;
    }
    
    // Devedor (Executado)
    if (dados.executado) {
        document.getElementById('credor').value = dados.executado;
    }
    
    // Natureza 
    if (dados.natureza) {
        const naturezaValue = dados.natureza.toLowerCase();
        const selectNatureza = document.getElementById('natureza');
        
        if (naturezaValue === 'comum' || naturezaValue === 'alimentar') {
            selectNatureza.value = naturezaValue;
            selectNatureza.dispatchEvent(new Event('change'));
        }
    }
    
    // Ano do Orçamento
    if (dados.orcamento) {
        document.getElementById('anoOrcamento').value = dados.orcamento;
    }
    
    // Data Base 
    if (dados.dataCalculo) {
        const dataConvertida = converterDataParaInput(dados.dataCalculo);
        if (dataConvertida) {
            const campoDataBase = document.getElementById('dataBase');
            campoDataBase.value = dataConvertida;
            campoDataBase.dispatchEvent(new Event('change'));
        }
    }
    
    // Valor Principal
    if (dados.principal) {
        const valorConvertido = converterNumero(dados.principal);
        if (valorConvertido) {
            document.getElementById('valorPrincipal').value = valorConvertido;
        }
    }
    
    // Valor dos Juros
    if (dados.juros) {
        const valorConvertido = converterNumero(dados.juros);
        if (valorConvertido) {
            document.getElementById('valorJuros').value = valorConvertido;
        }
    }
    
    // RRA
    if (dados.rra) {
        const rraConvertido = converterNumero(dados.rra);
        if (rraConvertido) {
            document.getElementById('rra').value = rraConvertido;
        } else {
            // Se o campo RRA está vazio no CSV, mantém 0
            document.getElementById('rra').value = '0';
        }
    }
    
    alert('✅ Dados do processo carregados com sucesso!');
    return true;
}

window.addEventListener('DOMContentLoaded', async function() {
    console.log('🔄 Carregando base de dados de processos...');
    await carregarCSVDoServidor();
});

setInterval(async function() {
    console.log('🔄 Atualizando base de dados...');
    await carregarCSVDoServidor();
}, 1800000); // 30 minutos em milissegundos

document.addEventListener('DOMContentLoaded', function() {
    const campoProcesso = document.getElementById('numprocesso');
    if (campoProcesso) {
        campoProcesso.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                buscarDadosProcesso();
            }
        });
    }
});