def calcular_cessoes_herdeiro(dados, herdeiro, valor_base_herdeiro, valor_total_herdeiro,
                               valor_honorario_total, valor_sindicato_para_descontar,
                               valor_previdencia_herdeiro, valor_ir_herdeiro):

    valor_herdeiro_bruto = valor_base_herdeiro - valor_honorario_total - valor_sindicato_para_descontar

    cessoes_herdeiro = [
        c for c in (dados.get('cessoes') or [])
        if c.get('tipo') == 'cessaoherdeiro' and c.get('cedente') == herdeiro['nome']
    ]

    if not cessoes_herdeiro:
        return {
            'valorHerdeiroBruto': valor_herdeiro_bruto,
            'valorCessoesHerdeiro': 0,
            'cessoesHerdeiroCalculadas': [],
            'percentualHerdeiroFinal': 1.0,
            'valorHerdeiroAposCessoes': valor_herdeiro_bruto,
            'valorPrevidenciaHerdeiroFinal': valor_previdencia_herdeiro,
            'valorIRHerdeiroFinal': valor_ir_herdeiro,
            'valorHerdeiroLiquido': valor_herdeiro_bruto - valor_previdencia_herdeiro - valor_ir_herdeiro,
            'cessoesHerdeiroFinais': []
        }

    total_percentual = sum(c['percentual'] for c in cessoes_herdeiro)
    percentual_herdeiro_final = 1.0 - total_percentual
    is_preferencia_parcial = dados.get('tipoCalculo') == 'preferencia' and valor_base_herdeiro < valor_total_herdeiro

    percentual_advogados = sum(adv['percentual'] for adv in dados.get('advogados', []))
    valor_total_sem_advogados = valor_total_herdeiro * (1 - percentual_advogados)

    cessoes_calculadas = []
    cessoes_finais = []

    if is_preferencia_parcial:
        parte_herdeiro = valor_total_sem_advogados * percentual_herdeiro_final
        max_herdeiro = min(parte_herdeiro, valor_herdeiro_bruto)

        for cessao in cessoes_herdeiro:
            parte_cessionario = valor_total_sem_advogados * cessao['percentual']
            calc = {
                'tipo': cessao['tipo'], 'cedente': cessao['cedente'],
                'cessionario': cessao['cessionario'], 'percentual': cessao['percentual'],
                'valorBruto': 0, 'valorSaldoDevedor': parte_cessionario,
                'observacao': 'Aguarda pagamento - sem direito à preferência'
            }
            final = {**calc, 'previdenciaCessao': 0, 'irCessao': 0, 'valorLiquido': 0}
            cessoes_calculadas.append(calc)
            cessoes_finais.append(final)

        return {
            'valorHerdeiroBruto': valor_herdeiro_bruto,
            'valorCessoesHerdeiro': 0,
            'cessoesHerdeiroCalculadas': cessoes_calculadas,
            'percentualHerdeiroFinal': percentual_herdeiro_final,
            'valorHerdeiroAposCessoes': max_herdeiro,
            'valorPrevidenciaHerdeiroFinal': valor_previdencia_herdeiro,
            'valorIRHerdeiroFinal': valor_ir_herdeiro,
            'valorHerdeiroLiquido': max_herdeiro - valor_previdencia_herdeiro - valor_ir_herdeiro,
            'cessoesHerdeiroFinais': cessoes_finais
        }

    # ORDEM CRONOLÓGICA OU PARCIAL
    valor_cessoes_herdeiro = 0
    for cessao in cessoes_herdeiro:
        valor_bruto_cessao = valor_herdeiro_bruto * cessao['percentual']
        valor_cessoes_herdeiro += valor_bruto_cessao

        calc = {
            'tipo': cessao['tipo'], 'cedente': cessao['cedente'],
            'cessionario': cessao['cessionario'], 'percentual': cessao['percentual'],
            'valorBruto': valor_bruto_cessao
        }
        previdencia_cessao = valor_previdencia_herdeiro * cessao['percentual']
        ir_cessao = valor_ir_herdeiro * cessao['percentual']
        final = {**calc, 'previdenciaCessao': previdencia_cessao, 'irCessao': ir_cessao,
                 'valorLiquido': valor_bruto_cessao - previdencia_cessao - ir_cessao}

        cessoes_calculadas.append(calc)
        cessoes_finais.append(final)

    return {
        'valorHerdeiroBruto': valor_herdeiro_bruto,
        'valorCessoesHerdeiro': valor_cessoes_herdeiro,
        'cessoesHerdeiroCalculadas': cessoes_calculadas,
        'percentualHerdeiroFinal': percentual_herdeiro_final,
        'valorHerdeiroAposCessoes': valor_herdeiro_bruto * percentual_herdeiro_final,
        'valorPrevidenciaHerdeiroFinal': valor_previdencia_herdeiro * percentual_herdeiro_final,
        'valorIRHerdeiroFinal': valor_ir_herdeiro * percentual_herdeiro_final,
        'valorHerdeiroLiquido': (valor_herdeiro_bruto * percentual_herdeiro_final)
                                - (valor_previdencia_herdeiro * percentual_herdeiro_final)
                                - (valor_ir_herdeiro * percentual_herdeiro_final),
        'cessoesHerdeiroFinais': cessoes_finais
    }