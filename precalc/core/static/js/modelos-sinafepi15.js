function configurarSinafepi() {
    if (!confirm("Configurar dados padrão do Sinafepi 1.5% lages?")) return;
    try {
        const dados = {
            advogados: [
                ["FURTADO COELHO ADVOGADOS ASSOCIADOS", "PJ", 0.075],
                ["JOSINO RIBEIRO NETO E ADVOGADOS ASSOCIADOS", "PJ", 0.025],
                ["LAGES E ARAÚJO SOCIEDADE DE ADVOGADOS", "PJ", 0.01125] 
            ],
            advogadosSucumbenciais: [
                ["FURTADO COELHO ADVOGADOS ASSOCIADOS", "PJ", 0.15, true]
            ],
            cessoes: [],
            aliquotaFixa: 0.08
        };

        preencherModelos(dados);
        alert("✅ Sinafepi configurado!");
    } catch (error) {
        alert("❌ Erro ao configurar.");
    }
}