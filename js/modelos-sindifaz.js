//Modelo Sindifaz - um processo padrão com varias cessoes
function configurarSindiFaz() {
    if (!confirm("Configurar dados padrão do SindiFaz?")) return;
    try {
    const dados = {
        advogados: [
            ["FURTADO COELHO ADVOGADOS ASSOCIADOS", "PJ", 0.16],
            ["FRANCINETTI DA ROCHA RIBEIRO DE LIRA", "PF", 0.06],
            ["ADAUTO FORTES ADVOGADOS ASSOCIADOS", "PJ", 0.02666667],
            ["JUAREZ CHAVES DE AZEVEDO JUNIOR - SOCIEDADE INDIVIDUAL DE ADVOCACIA", "PJ", 0.013333333]
        ],
        advogadosSucumbenciais: [
                ["FURTADO COELHO ADVOGADOS ASSOCIADOS", "PJ", 0.02, true]
        ],
        cessoes: [
            ["cessaoAdv", "FURTADO COELHO ADVOGADOS ASSOCIADOS", "LAGUZ I FIDC NP", 0.02],
            ["cessaoAdv", "FURTADO COELHO ADVOGADOS ASSOCIADOS", "DOMUS OCTANTE I FIDC LTDA", 0.02],
            ["cessaoAdv", "ADAUTO FORTES ADVOGADOS ASSOCIADOS", "LAGUZ I FIDC NP", 0.0063],
            ["cessaoAdv", "FRANCINETTI DA ROCHA RIBEIRO DE LIRA", "LAGUZ I FIDC NP", 0.01],
            ["cessaoAdv", "FRANCINETTI DA ROCHA RIBEIRO DE LIRA", "REAG LEGAL CLAIMS FIDC NP", 0.01],
            ["cessaoAdv", "FRANCINETTI DA ROCHA RIBEIRO DE LIRA", "FLAVIA CEOLIN LOPES PIANA", 0.00444],
            ["cessaoAdv", "FRANCINETTI DA ROCHA RIBEIRO DE LIRA", "FJ CONSULTORIA LTDA", 0.001653],
            ["cessaoAdv", "FRANCINETTI DA ROCHA RIBEIRO DE LIRA", "ISA MARIA LEME OPPENHEIMER BORGES", 0.003907],
            ["cessaoAdv", "JUAREZ CHAVES DE AZEVEDO JUNIOR - SOCIEDADE INDIVIDUAL DE ADVOCACIA", "ALT LEGAL CLAIMS FIDC", 0.0035],
            ["cessaoSindicato", "Sindifaz", "TABARE FIDC NP", 0.005],
            ["cessaoSindicato", "Sindifaz", "ZEFIROS I FIDC NP", 0.005]
        ]
    };
    
    preencherSindiFaz(dados);
    alert("✅ SindiFaz configurado!");
        
    } catch (error) {
        alert("❌ Erro ao configurar.");
    }
}

function preencherSindiFaz(dados) {
    const definir = (id, valor) => {
        const el = document.getElementById(id);
        if (el) {
            el.value = valor;
            el.dispatchEvent(new Event('change'));
        }
    };
    
    // 1. Advogados
    definir('quantAdvogados', dados.advogados.length);
    setTimeout(() => {
        dados.advogados.forEach(([nome, tipo, perc], i) => {
            definir(`advNome${i}`, nome);
            definir(`advTipo${i}`, tipo);
            definir(`advPercentual${i}`, perc);
        });
    }, 100);
    
    // 2. Sindicato
    definir('quantSindicatos', 1);
    setTimeout(() => {
        definir('sindNome0', 'Sindifaz');
        definir('sindPercentual0', 0.01);
        definir('sindTrib0', 'nao');
    }, 200);
    
    // 3. Cessões
    definir('quantCessoes', dados.cessoes.length);
    setTimeout(() => {
        dados.cessoes.forEach(([tipo, cedente, cessionario, perc], i) => {
            definir(`cessaoTipo${i}`, tipo);
            setTimeout(() => {
                definir(`cedenteNome${i}`, cedente);
                definir(`cessionarioNome${i}`, cessionario);
                definir(`cessaoPercentual${i}`, perc);
            }, 50);
        });
    }, 300);

    // 4. Advogados Sucumbenciais
    if (dados.advogadosSucumbenciais?.length) {
        definir('quantAdvogadosSucumbenciais', dados.advogadosSucumbenciais.length);
        setTimeout(() => {
            dados.advogadosSucumbenciais.forEach(([nome, tipo, perc, incidenciaIR], i) => {
                definir(`advSucNome${i}`, nome);
                definir(`advSucTipo${i}`, tipo);
                definir(`advSucTipoHonorario${i}`, 'percentual');
                definir(`advSucPercentual${i}`, perc);
                definir(`advSucIncidenciaIR${i}`, incidenciaIR ? 'sim' : 'nao');
            });
        }, 350);
    }
    
    // 5. Configurações padrão
    setTimeout(() => {
        definir('natureza', 'alimentar');
        definir('incidenciaIR', 'sim');
        definir('incidenciaPrevidencia', 'sim');

        setTimeout(() => {
            definir('tipoPrevidencia', 'fixa');
            definir('aliquotaFixa', 0.08); 
        }, 100);
    }, 400);
}