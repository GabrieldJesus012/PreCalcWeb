def calcular_sindicatos(dados, valor_base, valortotatt):
    is_acordo = dados.get('tipoCalculo') == 'acordo'
    percentual_desagio = dados.get('percentualAcordo') or 0
    is_preferencia = dados.get('tipoCalculo') == 'preferencia'
    is_parcial = dados.get('tipoCalculo') == 'parcial'

    def calcular_ir_sindicato(valor, tributacao, aliquota_personalizada=0):
        if tributacao == 'nao': return 0
        if tributacao == 'lei': return valor * 0.03
        if tributacao == 'fixa': return valor * aliquota_personalizada
        return 0

    valor_sindicato_total = 0
    sindicatos = []

    for sind in dados.get('sindicatos', []):
        percentual_total = sind['percentual']
        valor_base_calculo = valor_base if is_parcial else valortotatt
        valor_bruto_total = valor_base_calculo * percentual_total

        cessao_sind = [
            c for c in (dados.get('cessoes') or [])
            if c.get('tipo') == 'cessaoSindicato' and c.get('cedente') == sind['nome']
        ]

        percentual_cessionario = sum(c['percentual'] for c in cessao_sind)
        percentual_sindicato = max(0, percentual_total - percentual_cessionario)

        valor_bruto_sindicato = valor_base_calculo * percentual_sindicato
        valor_bruto_cessionario = valor_base_calculo * percentual_cessionario

        valor_para_ir_sind = valor_bruto_sindicato * (1 - percentual_desagio) if is_acordo else valor_bruto_sindicato
        valor_para_ir_cess = valor_bruto_cessionario * (1 - percentual_desagio) if is_acordo else valor_bruto_cessionario

        ir_sindicato = calcular_ir_sindicato(valor_para_ir_sind, sind.get('tributacao'), sind.get('aliquotaTributacao', 0))
        ir_cessionario = calcular_ir_sindicato(valor_para_ir_cess, sind.get('tributacao'), sind.get('aliquotaTributacao', 0))

        valor_liquido_sindicato = valor_bruto_sindicato - ir_sindicato
        valor_liquido_cessionario = valor_bruto_cessionario - ir_cessionario

        cessionarios = []
        for cessao in cessao_sind:
            valor_bruto_cessao = valor_base_calculo * cessao['percentual']
            valor_para_ir_cessao = valor_bruto_cessao * (1 - percentual_desagio) if is_acordo else valor_bruto_cessao
            ir_cessao = calcular_ir_sindicato(valor_para_ir_cessao, sind.get('tributacao'), sind.get('aliquotaTributacao', 0))
            cessionarios.append({
                'nome': cessao['cessionario'],
                'percentual': cessao['percentual'],
                'valorBruto': valor_bruto_cessao,
                'ir': ir_cessao,
                'valorLiquido': valor_bruto_cessao - ir_cessao
            })

        valor_sindicato_total += valor_bruto_total

        sindicatos.append({
            **sind,
            'valorBruto': valor_bruto_total,
            'ir': ir_sindicato + ir_cessionario,
            'valorLiquido': valor_liquido_sindicato + valor_liquido_cessionario,
            'percentualSindicato': percentual_sindicato,
            'valorBrutoSindicato': valor_bruto_sindicato,
            'irSindicato': ir_sindicato,
            'valorLiquidoSindicato': valor_liquido_sindicato,
            'percentualCessionarioSind': percentual_cessionario,
            'valorBrutoCessionario': valor_bruto_cessionario,
            'irCessionarioSind': ir_cessionario,
            'valorLiquidoCessionario': valor_liquido_cessionario,
            'cessionarios': cessionarios,
            'cessoesSind': cessao_sind,
            'podeReceber': not is_preferencia
        })

    return {'sindicatos': sindicatos, 'valorSindicatoTotal': valor_sindicato_total}


