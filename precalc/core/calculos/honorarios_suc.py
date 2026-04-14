from core.calculos.tributacao import calcular_ir, calcular_desconto_adicional_2026


def calcular_honorarios_sucumbenciais(dados, valor_total_divida, totais_por_tipo=None):
    resultado_vazio = {
        'honorarios': [], 'valorHonorarioTotal': 0,
        'valorBaseSucumbencial': 0, 'temHonorariosSucumbenciais': False
    }

    if not dados.get('honorarioSucumbencial', {}).get('advogados'):
        return resultado_vazio

    valor_base_sucumbencial = (totais_por_tipo or {}).get('sucumbencial', 0)
    if valor_base_sucumbencial <= 0:
        return resultado_vazio

    percentual_total_suc = sum(
        adv['percentual'] for adv in dados['honorarioSucumbencial']['advogados']
        if adv.get('tipoHonorario') == 'percentual'
    )

    # Ajuste para cálculo parcial
    if dados.get('tipoCalculo') == 'parcial':
        valor_total_suc = valor_base_sucumbencial * percentual_total_suc

        if dados.get('somenteHonorarioSucumbencial'):
            if dados.get('saldoParcial', 0) < valor_total_suc:
                fator = dados['saldoParcial'] / valor_total_suc
                valor_base_sucumbencial *= fator
        else:
            filtrados = [
                v for v in (dados.get('valoresPrincipais') or [])
                if v.get('tipoUsoHonorario') in ('sucumbencial', 'ambos')
            ]
            valor_orig_suc = sum(v['valorPrincipal'] + v['valorJuros'] for v in filtrados)
            valor_orig_total = sum(v['valorPrincipal'] + v['valorJuros'] for v in (dados.get('valoresPrincipais') or []))

            proporcao = valor_orig_suc / valor_orig_total if valor_orig_total > 0 else 0
            valor_prec_com_suc = valor_total_divida * proporcao
            total_geral = valor_prec_com_suc + valor_total_suc

            if dados.get('saldoParcial', 0) < total_geral:
                proporcao_suc = valor_total_suc / total_geral
                valor_parcial_suc = dados['saldoParcial'] * proporcao_suc
                fator = valor_parcial_suc / valor_total_suc
                valor_base_sucumbencial *= fator

    is_acordo = dados.get('tipoCalculo') == 'acordo'
    is_preferencia = dados.get('tipoCalculo') == 'preferencia'
    teto_preferencia = dados.get('tetoPreferencia') or 0
    percentual_desagio = dados.get('percentualAcordo') or 0

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

    for adv in dados['honorarioSucumbencial']['advogados']:
        valor_bruto_total = (
            valor_base_sucumbencial * adv['percentual']
            if adv.get('tipoHonorario') == 'percentual'
            else valor_base_sucumbencial
        )

        cessao_adv = [
            c for c in (dados.get('cessoes') or [])
            if c.get('tipo') == 'cessaoAdvSuc' and c.get('cedente') == adv['nome']
        ]

        percentual_cessionario = sum(c['percentual'] for c in cessao_adv)
        percentual_advogado = max(0, adv['percentual'] - percentual_cessionario)/adv['percentual']

        valor_adv_apos_cessoes = valor_bruto_total * percentual_advogado
        valor_cess_total = valor_bruto_total * percentual_cessionario

        honorario_completo = valor_adv_apos_cessoes + valor_cess_total

        if is_preferencia and adv.get('preferencia'):
            if teto_preferencia >= honorario_completo:
                valor_final_adv = valor_adv_apos_cessoes
                valor_final_cess = valor_cess_total
            else:
                valor_final_adv = min(valor_adv_apos_cessoes, teto_preferencia)
                valor_final_cess = 0
        else:
            valor_final_adv = valor_adv_apos_cessoes
            valor_final_cess = valor_cess_total

        valor_final_honorario = valor_final_adv + valor_final_cess

        valor_adv_apos_desagio = valor_final_adv * (1 - percentual_desagio) if is_acordo else valor_final_adv
        valor_cess_apos_desagio = valor_final_cess * (1 - percentual_desagio) if is_acordo else valor_final_cess

        ir_advogado = calcular_ir_pessoa(valor_adv_apos_desagio, adv)
        ir_cessionario_adv = calcular_ir_pessoa(valor_cess_apos_desagio, adv)

        valor_liquido_adv = valor_adv_apos_desagio - ir_advogado
        valor_liquido_cess = valor_cess_apos_desagio - ir_cessionario_adv

        cessionarios = []
        for cessao in cessao_adv:
            valor_bruto_cessao = valor_base_sucumbencial * cessao['percentual']
            valor_apos_desagio = valor_bruto_cessao * (1 - percentual_desagio) if is_acordo else valor_bruto_cessao

            if not adv.get('incidenciaIR'):
                ir_cessao = 0
            elif adv.get('tipo') != 'PF':
                ir_cessao = valor_apos_desagio * 0.015
            else:
                ir_sem_desconto = calcular_ir(valor_apos_desagio)
                desconto = calcular_desconto_adicional_2026(valor_apos_desagio, ir_sem_desconto)
                ir_cessao = max(0, ir_sem_desconto - desconto)

            cessionarios.append({
                'nome': cessao['cessionario'],
                'percentual': cessao['percentual'],
                'valorBruto': valor_bruto_cessao,
                'valorAposDesagio': valor_apos_desagio,
                'ir': ir_cessao,
                'valorLiquido': valor_apos_desagio - ir_cessao
            })

        valor_honorario_total += valor_final_honorario

        honorarios.append({
            **adv,
            'valorBruto': valor_final_honorario,
            'ir': ir_advogado + ir_cessionario_adv,
            'valorLiquido': valor_liquido_adv + valor_liquido_cess,
            'percentualAdvogado': percentual_advogado,
            'valorBrutoAdvogado': valor_final_adv,
            'valorAdvogadoAposDesagio': valor_adv_apos_desagio,
            'irAdvogado': ir_advogado,
            'valorLiquidoAdvogado': valor_liquido_adv,
            'percentualCessionarioAdv': percentual_cessionario,
            'valorBrutoCessionario': valor_final_cess,
            'valorCessionarioAposDesagio': valor_cess_apos_desagio,
            'irCessionarioAdv': ir_cessionario_adv,
            'valorLiquidoCessionario': valor_liquido_cess,
            'cessionarios': cessionarios,
            'cessoesAdv': cessao_adv,
            'temPreferencia': is_preferencia and adv.get('preferencia', False),
            'foiLimitadoPorPreferencia': is_preferencia and adv.get('preferencia', False) and teto_preferencia < honorario_completo,
            'temCessoes': len(cessao_adv) > 0
        })

    return {
        'honorarios': honorarios,
        'valorHonorarioTotal': valor_honorario_total,
        'valorBaseSucumbencial': valor_base_sucumbencial,
        'temHonorariosSucumbenciais': True
    }
