// BUSCA DE PROCESSO VIA API
function converterDataParaInput(dataStr) {
    if (!dataStr) return '';
    dataStr = dataStr.trim();
    if (dataStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dataStr;
    const partes = dataStr.split('/');
    if (partes.length === 3) {
        return `${partes[2]}-${partes[1].padStart(2,'0')}-${partes[0].padStart(2,'0')}`;
    }
    return '';
}

function converterNumero(valorStr) {
    if (!valorStr) return '';
    valorStr = valorStr.trim();
    if (valorStr === '' || valorStr === 'R$ -' || valorStr === 'R$-') return '';
    return valorStr.replace(/\./g, '').replace(',', '.');
}

async function buscarDadosProcesso() {
    const numeroProcesso = document.getElementById('numprocesso').value.trim();
    
    if (!numeroProcesso) {
        alert('⚠️ Digite o número do processo!');
        return false;
    }

    const statusDiv = document.getElementById('statusCarregamento');
    if (statusDiv) {
        statusDiv.innerHTML = '🔄 Buscando processo...';
        statusDiv.style.color = '#666';
    }

    try {
        const response = await fetch(`/buscar-processo/?numero=${encodeURIComponent(numeroProcesso)}`);
        
        if (response.status === 404) {
            alert('❌ Processo não encontrado na base de dados!\n\nProcurado: ' + numeroProcesso);
            if (statusDiv) {
                statusDiv.innerHTML = '❌ Processo não encontrado';
                statusDiv.style.color = '#dc3545';
            }
            return false;
        }

        if (!response.ok) {
            throw new Error('Erro na requisição');
        }

        const dados = await response.json();

        if (dados.exequente) document.getElementById('beneficiario').value = dados.exequente;
        if (dados.executado) document.getElementById('credor').value = dados.executado;
        
        if (dados.natureza) {
            const selectNatureza = document.getElementById('natureza');
            const naturezaValue = dados.natureza.toLowerCase();
            if (naturezaValue === 'comum' || naturezaValue === 'alimentar') {
                selectNatureza.value = naturezaValue;
                selectNatureza.dispatchEvent(new Event('change'));
            }
        }

        if (dados.orcamento) document.getElementById('anoOrcamento').value = dados.orcamento;

        if (dados.dataCalculo) {
            const dataConvertida = converterDataParaInput(dados.dataCalculo);
            if (dataConvertida) {
                const campoDataBase = document.getElementById('dataBase');
                campoDataBase.value = dataConvertida;
                campoDataBase.dispatchEvent(new Event('change'));
            }
        }

        if (dados.principal) {
            const valorConvertido = converterNumero(dados.principal);
            if (valorConvertido) document.getElementById('valorPrincipal').value = valorConvertido;
        }

        if (dados.juros) {
            const valorConvertido = converterNumero(dados.juros);
            if (valorConvertido) document.getElementById('valorJuros').value = valorConvertido;
        }

        if (dados.rra) {
            const rraConvertido = converterNumero(dados.rra);
            document.getElementById('rra').value = rraConvertido || '0';
        }

        if (statusDiv) {
            statusDiv.innerHTML = '✅ Dados carregados com sucesso!';
            statusDiv.style.color = '#28a745';
        }

        return true;

    } catch (erro) {
        console.error('❌ Erro ao buscar processo:', erro);
        alert('❌ Erro ao buscar processo. Tente novamente.');
        if (statusDiv) {
            statusDiv.innerHTML = '❌ Erro ao buscar processo';
            statusDiv.style.color = '#dc3545';
        }
        return false;
    }
}

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