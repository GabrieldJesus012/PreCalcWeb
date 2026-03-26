from core.calculos.tributacao import calcular_ir, calcular_desconto_adicional_2026


def calcular_honorarios(dados, valor_base, valortotatt, totais_por_tipo=None):
    if not totais_por_tipo or totais_por_tipo.get('contratual', 0) <= 0:
        return {'honorarios': [], 'valorHonorarioTotal': 0}

    is_acordo = dados.get('tipoCalculo') == 'acordo'
    percentual_desagio = dados.get('percentualAcordo') or 0

    proporcao_contratual = totais_por_tipo['contratual'] / totais_por_tipo['total']
    valor_base_contratual = valor_base * proporcao_contratual

    valor_honorario_total = 0
    honorarios = []

    def calcular_ir_pessoa(valor, adv):
        if not adv.get('incidenciaIR') or valor <= 0:
            return 0
        if adv.get('tipo') != 'PF':
            return valor * 0.015
        ir_sem_desconto = calcular_ir(valor)
        desconto = calcular_desconto_adicional_2026(valor, ir_sem_desconto)
        return max(0, ir_sem_desconto - desconto)

    for adv in dados.get('advogados', []):
        valor_bruto_total = valor_base_contratual * adv['percentual']
        valor_honorario_total += valor_bruto_total

        cessao_adv = [
            c for c in (dados.get('cessoes') or [])
            if c.get('tipo') == 'cessaoAdv' and c.get('cedente') == adv['nome']
        ]

        percentual_cessionario_adv = sum(c['percentual'] for c in cessao_adv)

        if percentual_cessionario_adv >= 1.0:
            valor_bruto_advogado = 0
            valor_bruto_cessionario = valor_bruto_total
            percentual_advogado = 0
        else:
            percentual_advogado = max(0, adv['percentual'] - percentual_cessionario_adv)
            valor_bruto_advogado = valor_base_contratual * percentual_advogado
            valor_bruto_cessionario = valor_base_contratual * percentual_cessionario_adv

        valor_para_ir_adv = valor_bruto_advogado * (1 - percentual_desagio) if is_acordo else valor_bruto_advogado
        valor_para_ir_cess = valor_bruto_cessionario * (1 - percentual_desagio) if is_acordo else valor_bruto_cessionario

        ir_advogado = calcular_ir_pessoa(valor_para_ir_adv, adv)
        ir_cessionario_adv = calcular_ir_pessoa(valor_para_ir_cess, adv)

        valor_liquido_advogado = valor_bruto_advogado - ir_advogado
        valor_liquido_cessionario = valor_bruto_cessionario - ir_cessionario_adv

        cessionarios = []
        for cessao in cessao_adv:
            valor_bruto_cessao = (
                valor_bruto_total * cessao['percentual']
                if percentual_cessionario_adv >= 1.0
                else valor_base_contratual * cessao['percentual']
            )
            valor_para_ir_cessao = valor_bruto_cessao * (1 - percentual_desagio) if is_acordo else valor_bruto_cessao

            if not adv.get('incidenciaIR'):
                ir_cessao = 0
            elif adv.get('tipo') != 'PF':
                ir_cessao = valor_para_ir_cessao * 0.015
            else:
                ir_sem_desconto = calcular_ir(valor_para_ir_cessao)
                desconto = calcular_desconto_adicional_2026(valor_para_ir_cessao, ir_sem_desconto)
                ir_cessao = max(0, ir_sem_desconto - desconto)

            cessionarios.append({
                'nome': cessao['cessionario'],
                'percentual': cessao['percentual'],
                'valorBruto': valor_bruto_cessao,
                'ir': ir_cessao,
                'valorLiquido': valor_bruto_cessao - ir_cessao
            })

        honorarios.append({
            **adv,
            'valorBruto': valor_bruto_total,
            'ir': ir_advogado + ir_cessionario_adv,
            'valorLiquido': valor_liquido_advogado + valor_liquido_cessionario,
            'percentualAdvogado': percentual_advogado,
            'valorBrutoAdvogado': valor_bruto_advogado,
            'irAdvogado': ir_advogado,
            'valorLiquidoAdvogado': valor_liquido_advogado,
            'percentualCessionarioAdv': percentual_cessionario_adv,
            'valorBrutoCessionario': valor_bruto_cessionario,
            'irCessionarioAdv': ir_cessionario_adv,
            'valorLiquidoCessionario': valor_liquido_cessionario,
            'cessionarios': cessionarios,
            'cessoesAdv': cessao_adv
        })

    return {'honorarios': honorarios, 'valorHonorarioTotal': valor_honorario_total}

