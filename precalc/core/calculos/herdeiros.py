from core.calculos.detalhamento import calcular_global
from core.calculos.honorarios import calcular_honorarios
from core.calculos.sindicatos import calcular_sindicatos
from core.calculos.tributacao import calcular_previdencia_isolada, calcular_ir_isolado, arredondar_rra
from core.calculos.cessoes_herdeiros import calcular_cessoes_herdeiro


def calcular_totais_para_herdeiros(dados, valortotatt, percentualprinc, percentualjur, totais_por_tipo=None):
    dados_ordem = {**dados, 'tipoCalculo': 'ordem'}
    return calcular_global(dados_ordem, valortotatt, percentualprinc, percentualjur, totais_por_tipo)


def calcular_composicao_inicial_herdeiro(dados, valor_base, valor_total, percentual_herdeiro, ctx):
    if ctx['temTributacaoIR'] and dados.get('tributacaoIR'):
        perc_princ = dados['tributacaoIR']['percentuais']['principalTributado']
        perc_juros = dados['tributacaoIR']['percentuais']['jurosTributado']
        principal = valor_base * (perc_princ / 100)
        juros = valor_base * (perc_juros / 100)
    else:
        principal = valor_base * ctx['percentualprinc']
        juros = valor_base * ctx['percentualjur']

    if ctx['isParcial']:
        proporcao = valor_base / valor_total
        rra = arredondar_rra(ctx['rraTotal'] * percentual_herdeiro * proporcao) if ctx['rraTotal'] else 0
    else:
        rra = arredondar_rra(ctx['rraTotal'] * percentual_herdeiro) if ctx['rraTotal'] else 0

    return {'principal': principal, 'juros': juros, 'rra': rra}


def recalcular_principal_juros_rra_herdeiro(dados, valor_base, valor_total, percentual_herdeiro, is_pref_parcial, ctx):
    if is_pref_parcial:
        if ctx['temTributacaoIR'] and dados.get('tributacaoIR'):
            perc_princ = dados['tributacaoIR']['percentuais']['principalTributado']
            principal = valor_base * (perc_princ / 100)
        else:
            principal = valor_base * ctx['percentualprinc']
        proporcao = valor_base / valor_total
        rra = arredondar_rra(ctx['rraTotal'] * percentual_herdeiro * proporcao) if ctx['rraTotal'] else 0
        juros = None

    else:  # isParcial
        proporcao = valor_base / valor_total
        if ctx['temTributacaoIR'] and dados.get('tributacaoIR'):
            principal = dados['tributacaoIR']['principalTributado'] * percentual_herdeiro * proporcao
            juros = dados['tributacaoIR']['jurosTributado'] * percentual_herdeiro * proporcao
        else:
            principal = valor_base * ctx['percentualprinc']
            juros = valor_base * ctx['percentualjur']
        rra = arredondar_rra(ctx['rraTotal'] * percentual_herdeiro * proporcao) if ctx['rraTotal'] else 0

    return {'principal': principal, 'juros': juros, 'rra': rra}


def calcular_herdeiros(dados, valortotatt, valorprincatt, valorjurosatt, detalhamento, totais_por_tipo=None):
    if not dados.get('herdeiros'):
        return []

    percentualprinc = valorprincatt / valortotatt
    percentualjur = valorjurosatt / valortotatt
    det_total = calcular_totais_para_herdeiros(dados, valortotatt, percentualprinc, percentualjur, totais_por_tipo)

    ctx = {
        'percentualprinc': percentualprinc,
        'percentualjur': percentualjur,
        'percentualBeneficiarioFinal': det_total['percentualBeneficiarioFinal'],
        'valorDisponivelParaHerdeiros': valortotatt * det_total['percentualBeneficiarioFinal'],
        'isPreferencia': dados.get('tipoCalculo') == 'preferencia',
        'isParcial': dados.get('tipoCalculo') == 'parcial',
        'temTributacaoIR': any(item.get('tributacao', {}).get('ir') for item in (dados.get('valoresPrincipais') or [])),
        'rraTotal': sum(item.get('tributacao', {}).get('rra', 0) for item in (dados.get('valoresPrincipais') or []))
    }

    resultado = []
    for index, herdeiro in enumerate(dados['herdeiros']):
        percentual_herdeiro = herdeiro['percentual']
        valor_total_herdeiro = valortotatt * percentual_herdeiro
        valor_herdeiro_pos_cessao_ben = ctx['valorDisponivelParaHerdeiros'] * percentual_herdeiro

        cessoes_herdeiro = [
            c for c in (dados.get('cessoes') or [])
            if c.get('tipo') == 'cessaoHerdeiro' and c.get('cedente') == herdeiro['nome']
        ]

        percentual_cedido = sum(c['percentual'] for c in cessoes_herdeiro)
        valor_apos_cessoes = valor_herdeiro_pos_cessao_ben * (1.0 - percentual_cedido)

        if dados.get('tipoCalculo') == 'preferencia' and dados.get('natureza') == 'alimentar' and herdeiro.get('temPreferencia'):
            valor_base_herdeiro = min(valor_apos_cessoes, dados.get('tetoPreferencia', 0))
        elif ctx['isParcial']:
            valor_base_herdeiro = valor_apos_cessoes * (dados.get('saldoParcial', 0) / valortotatt)
        else:
            valor_base_herdeiro = valor_apos_cessoes

        is_pref_parcial = dados.get('tipoCalculo') == 'preferencia' and valor_base_herdeiro < valor_total_herdeiro

        comp = calcular_composicao_inicial_herdeiro(dados, valor_base_herdeiro, valor_total_herdeiro, percentual_herdeiro, ctx)
        principal, juros, rra = comp['principal'], comp['juros'], comp['rra']

        res_hon = calcular_honorarios(dados, valor_base_herdeiro, valor_total_herdeiro, totais_por_tipo)
        res_sind = calcular_sindicatos(dados, valor_base_herdeiro, valor_total_herdeiro)
        honorarios = res_hon['honorarios']
        valor_honorario_total = res_hon['valorHonorarioTotal']
        sindicatos = res_sind['sindicatos']
        valor_sindicato_total = res_sind['valorSindicatoTotal']
        valor_sindicato_descontar = 0 if (ctx['isPreferencia'] and is_pref_parcial) else valor_sindicato_total
        valor_bruto = valor_base_herdeiro - valor_honorario_total - valor_sindicato_descontar

        principal_final, juros_final, rra_final = principal, juros, rra
        if is_pref_parcial or ctx['isParcial']:
            recalc = recalcular_principal_juros_rra_herdeiro(dados, valor_base_herdeiro, valor_total_herdeiro, percentual_herdeiro, is_pref_parcial, ctx)
            principal_final = recalc['principal']
            if recalc['juros'] is not None:
                juros_final = recalc['juros']
            rra_final = recalc['rra']

        previdencia = calcular_previdencia_isolada(dados, principal_final, rra_final)
        ir = calcular_ir_isolado(dados, valor_total_herdeiro, valor_base_herdeiro, principal_final, previdencia['valorPrevidencia'], rra_final)

        cessoes = calcular_cessoes_herdeiro(
            dados, herdeiro, valor_base_herdeiro, valor_total_herdeiro,
            valor_honorario_total, valor_sindicato_descontar,
            previdencia['valorPrevidencia'], ir['valorIR']
        )

        valor_recebe_por_preferencia = cessoes['valorHerdeiroLiquido']
        valor_saldo_devedor = 0
        if is_pref_parcial:
            valor_recebe_por_preferencia = valor_base_herdeiro - (cessoes['valorPrevidenciaHerdeiroFinal'] + cessoes['valorIRHerdeiroFinal'] + valor_honorario_total)
            valor_saldo_devedor = valor_herdeiro_pos_cessao_ben - valor_base_herdeiro

        resultado.append({
            **herdeiro,
            'indice': index,
            'valorTotalOriginal': valor_total_herdeiro,
            'principalOriginal': valorprincatt * percentual_herdeiro,
            'jurosOriginal': valorjurosatt * percentual_herdeiro,
            'rrapagamentoOriginal': arredondar_rra(ctx['rraTotal'] * percentual_herdeiro) if ctx['rraTotal'] else 0,
            'valorTotal': valor_base_herdeiro,
            'principal': principal_final,
            'jurosBase': juros_final,
            'rrapagamento': rra_final,
            'rraComDesagio': ir['rraComDesagio'],
            'honorarios': honorarios,
            'valorHonorarioTotal': valor_honorario_total,
            'sindicatos': sindicatos,
            'valorSindicatoTotal': valor_sindicato_total,
            'valorPrevidencia': previdencia['valorPrevidencia'],
            'aliquotaEfetiva': previdencia['aliquotaEfetiva'],
            'valorDesagioPrevidencia': previdencia['valorDesagioPrevidencia'],
            'percentualDesagioPrevidencia': previdencia['percentualDesagioPrevidencia'],
            'valorIR': ir['valorIR'],
            'aliquotaIR': ir['aliquotaIR'],
            'baseIRHonora': ir['baseIRHonora'],
            'baseIRSindi': ir['baseIRSindi'],
            'baseIRPrev': ir['baseIRPrev'],
            'baseIRRRA': ir['baseIRRRA'],
            'valorIRUnitario': ir['valorIRUnitario'],
            'principalComDesagio': ir['principalComDesagio'],
            'percentualDesagioIR': ir['percentualDesagioIR'],
            'descontoAdicional2026': ir['descontoAdicional2026'],
            'valorIRSemDesconto': ir['valorIRSemDesconto'],
            'valorPrevidenciaFinal': cessoes['valorPrevidenciaHerdeiroFinal'],
            'valorIRFinal': cessoes['valorIRHerdeiroFinal'],
            'percentualBeneficiarioFinal': det_total['percentualBeneficiarioFinal'],
            'valorAposCessoesBeneficiario': valor_herdeiro_pos_cessao_ben,
            'cessoesHerdeiro': cessoes['cessoesHerdeiroFinais'],
            'valorCessoesHerdeiro': cessoes['valorCessoesHerdeiro'],
            'percentualHerdeiroFinal': cessoes['percentualHerdeiroFinal'],
            'valorBruto': valor_bruto,
            'valorFinalAposCessoes': cessoes['valorHerdeiroAposCessoes'],
            'valorLiquido': cessoes['valorHerdeiroLiquido'],
            'isPreferenciaParcial': is_pref_parcial,
            'valorRecebePorPreferencia': valor_recebe_por_preferencia,
            'valorSaldoDevedor': valor_saldo_devedor,
            'temCessoes': len(cessoes_herdeiro) > 0,
            'temCessoesBeneficiario': det_total['percentualBeneficiarioFinal'] < 1.0
        })

    return resultado