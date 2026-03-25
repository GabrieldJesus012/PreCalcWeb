function preencherModelos(dados) {
    const definir = (id, valor) => {
        const el = document.getElementById(id);
        if (el) {
            el.value = valor;
            el.dispatchEvent(new Event('change'));
        }
    };
    
    // 1. Advogados
    if (dados.advogados?.length) {
        definir('quantAdvogados', dados.advogados.length);
        setTimeout(() => {
            dados.advogados.forEach(([nome, tipo, perc], i) => {
                definir(`advNome${i}`, nome);
                definir(`advTipo${i}`, tipo);
                definir(`advPercentual${i}`, perc);
                definir(`advIncidenciaIR${i}`, 'sim');
            });
        }, 100);
    }
    
    // 2. Sindicato — só preenche se existir no modelo
    if (dados.sindicatos?.length) {
        definir('quantSindicatos', dados.sindicatos.length);
        setTimeout(() => {
            dados.sindicatos.forEach(([nome, perc, trib], i) => {
                definir(`sindNome${i}`, nome);
                definir(`sindPercentual${i}`, perc);
                definir(`sindTrib${i}`, trib);
            });
        }, 200);
    }
    
    // 3. Cessões
    if (dados.cessoes?.length) {
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
    }

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
        definir('natureza', dados.natureza || 'alimentar');
        definir('incidenciaIR', dados.incidenciaIR || 'sim');
        definir('incidenciaPrevidencia', dados.incidenciaPrevidencia || 'sim');

        setTimeout(() => {
            definir('tipoPrevidencia', dados.tipoPrevidencia || 'fixa');
            if (dados.aliquotaFixa) definir('aliquotaFixa', dados.aliquotaFixa);
        }, 100);
    }, 450);
}