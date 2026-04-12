# ====================================
# IR
# ====================================

def calcular_ir(valor_bruto):
    if valor_bruto <= 2428.80: return 0
    elif valor_bruto <= 2826.65: return (valor_bruto * 0.075) - 182.16
    elif valor_bruto <= 3751.05: return (valor_bruto * 0.15) - 394.16
    elif valor_bruto <= 4664.68: return (valor_bruto * 0.225) - 675.49
    else: return (valor_bruto * 0.275) - 908.73


def obter_aliquota_ir(valor_bruto):
    if valor_bruto <= 2428.80: return 0
    elif valor_bruto <= 2826.65: return 0.075
    elif valor_bruto <= 3751.05: return 0.15
    elif valor_bruto <= 4664.68: return 0.225
    else: return 0.275


def calcular_desconto_adicional_2026(base_ir_rra, valor_ir_calculado):
    if base_ir_rra <= 5000.00:
        return min(valor_ir_calculado, 312.89)
    if base_ir_rra <= 7350.00:
        return max(0, 978.62 - (0.133145 * base_ir_rra))
    return 0


def arredondar_rra(valor):
    if not isinstance(valor, (int, float)) or valor != valor:  # NaN check
        return 0
    valor_str = f"{valor:.3f}"
    parte_inteira, parte_decimal = valor_str.split('.')
    parte_decimal = parte_decimal.ljust(3, '0')

    p1 = int(parte_decimal[0])
    p2 = int(parte_decimal[1])
    p3 = int(parte_decimal[2])

    if p2 < 5:
        nova = p1
    elif p2 > 5:
        nova = p1 + 1
    else:
        nova = p1 if p3 <= 4 else p1 + 1

    if nova >= 10:
        return float(f"{int(parte_inteira) + 1}.{nova - 10}")
    return float(f"{parte_inteira}.{nova}")


def calcular_ir_isolado(dados, valortotatt, valor_base, principal_base, valor_previdencia, rra_pagamento_recalculado):
    resultado_vazio = {
        'valorIR': 0, 'aliquotaIR': 0, 'baseIRHonora': 0,
        'baseIRSindi': 0, 'baseIRPrev': 0, 'principalComDesagio': 0,
        'percentualDesagioIR': 0, 'rraComDesagio': 0, 'baseIRRRA': 0,
        'valorIRUnitario': 0, 'descontoAdicional2026': 0, 'valorIRSemDesconto': 0,
        'descontoSimplificado': 0, 'rendimentoMensal': 0
    }

    tem_ir = any(
        item.get('tributacao', {}).get('ir') is True
        for item in (dados.get('valoresPrincipais') or [])
    )

    if not tem_ir or (dados.get('tipoBeneficiario') != 'pj' and rra_pagamento_recalculado == 0):
        return resultado_vazio

    percentual_total_adv = sum(adv['percentual'] for adv in dados.get('advogados', []))
    percentual_total_sind = 0 if dados.get('tipoCalculo') == 'preferencia' else \
        sum(s['percentual'] for s in dados.get('sindicatos', []))

    # PESSOA JURÍDICA
    if dados.get('natureza') == 'comum' and dados.get('tipoBeneficiario') == 'pj':
        base_ir_pj = valortotatt * (1 - percentual_total_adv - percentual_total_sind)
        valor_ir = base_ir_pj * 0.03
        percentual_desagio = dados.get('percentualAcordo') or 0
        if dados.get('tipoCalculo') == 'acordo':
            valor_ir *= (1 - percentual_desagio)
        return {
            **resultado_vazio,
            'valorIR': valor_ir, 'aliquotaIR': 0.03,
            'valorIRUnitario': valor_ir, 'percentualDesagioIR': percentual_desagio,
            'baseIRHonora': 1, 'baseIRSindi': 1, 'baseIRPrev': 1, 'baseIRRRA': 1
        }

    # PESSOA FÍSICA
    base_ir_honora = principal_base - (principal_base * percentual_total_adv)
    base_ir_sindi = base_ir_honora - (principal_base * percentual_total_sind)
    percentual_desagio_ir = dados.get('percentualAcordo') or 0
    principal_com_desagio = base_ir_sindi * (1 - percentual_desagio_ir) \
        if dados.get('tipoCalculo') == 'acordo' else base_ir_sindi

    rra_com_desagio = max(1, rra_pagamento_recalculado) if rra_pagamento_recalculado > 0 else 0
    
    rendimento_mensal = principal_com_desagio / rra_com_desagio
    
    previdencia_mensal = valor_previdencia / rra_com_desagio
    desconto_simplificado = max(607.20, previdencia_mensal)

    base_ir_rra = rendimento_mensal - desconto_simplificado

    valor_ir_sem_desconto = calcular_ir(base_ir_rra)
    
    desconto_adicional_2026 = calcular_desconto_adicional_2026(rendimento_mensal, valor_ir_sem_desconto)
    valor_ir_unitario = max(0, valor_ir_sem_desconto - desconto_adicional_2026)
    valor_ir = valor_ir_unitario * rra_com_desagio
    aliquota_ir = obter_aliquota_ir(base_ir_rra)

    return {
        'valorIR': valor_ir, 'aliquotaIR': aliquota_ir,
        'baseIRHonora': base_ir_honora, 'baseIRSindi': base_ir_sindi,
        'baseIRPrev': base_ir_rra * rra_com_desagio, 'principalComDesagio': principal_com_desagio,
        'percentualDesagioIR': percentual_desagio_ir, 'rraComDesagio': rra_com_desagio,
        'baseIRRRA': base_ir_rra, 'valorIRUnitario': valor_ir_unitario,
        'descontoAdicional2026': desconto_adicional_2026, 'valorIRSemDesconto': valor_ir_sem_desconto,
        'descontoSimplificado': desconto_simplificado, 'rendimentoMensal': rendimento_mensal
    }


# ====================================
# PREVIDÊNCIA
# ====================================

def calcular_inss(base):
    if base <= 1518.00: return base * 0.075
    elif base <= 2793.88: return 1518 * 0.075 + (base - 1518) * 0.09
    elif base <= 4190.83: return 1518 * 0.075 + 1275.88 * 0.09 + (base - 2793.88) * 0.12
    elif base <= 8157.41: return 1518 * 0.075 + 1275.88 * 0.09 + 1396.95 * 0.12 + (base - 4190.83) * 0.14
    else: return 951.63


def calcular_previdencia_isolada(dados, principal_base, rra_pagamento):
    resultado_vazio = {
        'valorPrevidencia': 0, 'aliquotaEfetiva': 0,
        'valorDesagioPrevidencia': 0, 'percentualDesagioPrevidencia': 0
    }

    if dados.get('tipoBeneficiario') == 'pj':
        return resultado_vazio

    deve_calcular = dados.get('incidenciaPrevidencia') or any(
        item.get('tributacao', {}).get('previdencia')
        for item in (dados.get('valoresPrincipais') or [])
    )

    if not deve_calcular:
        return resultado_vazio

    item_prev = next(
        (i for i in (dados.get('valoresPrincipais') or []) if i.get('tributacao', {}).get('previdencia')),
        None
    )
    tipo_previdencia = (item_prev or {}).get('tributacao', {}).get('tipoPrevidencia') \
        or dados.get('tipoPrevidencia') or 'inss'
    aliquota_fixa = (item_prev or {}).get('tributacao', {}).get('aliquotaFixa') \
        or dados.get('aliquotaFixa') or 0

    if tipo_previdencia == 'fixa':
        valor_previdencia = principal_base * aliquota_fixa
        aliquota_efetiva = aliquota_fixa
    else:
        base = principal_base if rra_pagamento == 0 else principal_base / rra_pagamento
        resultado_inss = calcular_inss(base)
        valor_previdencia = resultado_inss * (rra_pagamento or 1)
        aliquota_efetiva = resultado_inss / base if base > 0 else 0

    valor_desagio = 0
    percentual_desagio = 0
    if dados.get('tipoCalculo') == 'acordo':
        percentual_desagio = dados.get('percentualAcordo') or 0
        valor_desagio = valor_previdencia * percentual_desagio
        valor_previdencia -= valor_desagio

    return {
        'valorPrevidencia': valor_previdencia,
        'aliquotaEfetiva': aliquota_efetiva,
        'valorDesagioPrevidencia': valor_desagio,
        'percentualDesagioPrevidencia': percentual_desagio
    }