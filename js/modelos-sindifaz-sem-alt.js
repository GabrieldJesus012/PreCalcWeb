//Modelo Sindifaz - um processo padrão com varias cessoes
function configurarSindiFazSemAlt() {
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
        sindicatos: [
                ["Sindifaz", 0.01, "nao"]
        ],
        cessoes: [
            ["cessaoAdv", "FURTADO COELHO ADVOGADOS ASSOCIADOS", "LAGUZ I FIDC NP", 0.02],
            ["cessaoAdv", "FURTADO COELHO ADVOGADOS ASSOCIADOS", "DOMUS OCTANTE I FIDC LTDA", 0.02],
            ["cessaoAdv", "ADAUTO FORTES ADVOGADOS ASSOCIADOS", "LAGUZ I FIDC NP", 0.0063],
            ["cessaoAdv", "FRANCINETTI DA ROCHA RIBEIRO DE LIRA", "LAGUZ I FIDC NP", 0.01],
            ["cessaoAdv", "FRANCINETTI DA ROCHA RIBEIRO DE LIRA", "PEDRA AZUL FIDC NP", 0.01],
            ["cessaoAdv", "FRANCINETTI DA ROCHA RIBEIRO DE LIRA", "FLAVIA CEOLIN LOPES PIANA", 0.00444],
            ["cessaoAdv", "FRANCINETTI DA ROCHA RIBEIRO DE LIRA", "TABARÉ FIDC - cessionaria da FJ", 0.001653],
            ["cessaoAdv", "FRANCINETTI DA ROCHA RIBEIRO DE LIRA", "ISA MARIA LEME OPPENHEIMER BORGES", 0.003907],
            ["cessaoSindicato", "Sindifaz", "TABARE FIDC NP", 0.005],
            ["cessaoSindicato", "Sindifaz", "ZEFIROS I FIDC NP", 0.005]
        ],
        aliquotaFixa: 0.08
    };
    
    preencherModelos(dados);
    alert("✅ SindiFaz configurado!");
        
    } catch (error) {
        alert("❌ Erro ao configurar.");
    }
}

