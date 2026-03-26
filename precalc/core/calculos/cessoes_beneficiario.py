def calcular_cessoes_beneficiario_principal(dados, valor_base, valortotatt, valor_honorario_total,
                                             valor_sindicato_para_descontar, valor_previdencia, valor_ir):

    valor_beneficiario_bruto = valor_base - valor_honorario_total - valor_sindicato_para_descontar
    cessoes = [c for c in (dados.get('cessoes') or []) if c.get('tipo') == 'cessaobenPrincipal']

    if not cessoes:
        return {
            'valorBeneficiarioBruto': valor_beneficiario_bruto,
            'valorCessoesBeneficiario': 0,
            'cessoesBeneficiarioCalculadas': [],
            'percentualBeneficiarioFinal': 1.0,
            'valorBeneficiarioAposCessoes': valor_beneficiario_bruto,
            'valorPrevidenciaBeneficiario': valor_previdencia,
            'valorIRBeneficiario': valor_ir,
            'valorBeneficiarioFinal': valor_beneficiario_bruto - valor_previdencia - valor_ir,
            'cessoesBeneficiarioFinais': []
        }

    total_percentual = sum(c['percentual'] for c in cessoes)
    percentual_beneficiario_final = 1.0 - total_percentual

    percentual_advogados = sum(adv['percentual'] for adv in dados.get('advogados', []))
    valortotatt_sem_adv = valortotatt - (valortotatt * percentual_advogados)

    is_preferencia_parcial = dados.get('tipoCalculo') == 'preferencia' and valor_base < valortotatt
    deve_receber_agora = not is_preferencia_parcial

    valor_previdencia_base = valor_previdencia if deve_receber_agora else 0
    valor_ir_base = valor_ir if deve_receber_agora else 0

    valor_cessoes = 0
    cessoes_calculadas = []
    cessoes_finais = []

    for cessao in cessoes:
        valor_bruto_cessao = (valor_beneficiario_bruto * cessao['percentual']) if deve_receber_agora else 0
        valor_cessoes += valor_bruto_cessao

        calc = {
            'tipo': cessao['tipo'], 'cedente': cessao['cedente'],
            'cessionario': cessao['cessionario'], 'percentual': cessao['percentual'],
            'valorBruto': valor_bruto_cessao,
        }
        if is_preferencia_parcial:
            calc['valorSaldoDevedor'] = valortotatt_sem_adv * cessao['percentual']
            calc['observacao'] = 'Aguarda pagamento - sem direito à preferência'

        previdencia_cessao = valor_previdencia_base * cessao['percentual']
        ir_cessao = valor_ir_base * cessao['percentual']

        final = {**calc, 'previdenciaCessao': previdencia_cessao, 'irCessao': ir_cessao,
                 'valorLiquido': valor_bruto_cessao - previdencia_cessao - ir_cessao}

        cessoes_calculadas.append(calc)
        cessoes_finais.append(final)

    if is_preferencia_parcial:
        parte_beneficiario = valortotatt_sem_adv * percentual_beneficiario_final
        valor_apos_cessoes = min(parte_beneficiario, valor_beneficiario_bruto)
        valor_prev_ben = valor_previdencia
        valor_ir_ben = valor_ir
    else:
        valor_apos_cessoes = valor_beneficiario_bruto * percentual_beneficiario_final
        valor_prev_ben = valor_previdencia * percentual_beneficiario_final
        valor_ir_ben = valor_ir * percentual_beneficiario_final

    return {
        'valorBeneficiarioBruto': valor_beneficiario_bruto,
        'valorCessoesBeneficiario': valor_cessoes,
        'cessoesBeneficiarioCalculadas': cessoes_calculadas,
        'percentualBeneficiarioFinal': percentual_beneficiario_final,
        'valorBeneficiarioAposCessoes': valor_apos_cessoes,
        'valorPrevidenciaBeneficiario': valor_prev_ben,
        'valorIRBeneficiario': valor_ir_ben,
        'valorBeneficiarioFinal': valor_apos_cessoes - valor_prev_ben - valor_ir_ben,
        'cessoesBeneficiarioFinais': cessoes_finais
    }