from core.calculos.tributacao import (
    calcular_previdencia_isolada, calcular_ir_isolado, arredondar_rra
)
from core.calculos.honorarios import calcular_honorarios
from core.calculos.honorarios_suc import calcular_honorarios_sucumbenciais
from core.calculos.sindicatos import calcular_sindicatos
from core.calculos.cessoes_beneficiario import calcular_cessoes_beneficiario_principal


def calcular_valor_base(dados, valortotatt, totais_por_tipo):
    valor_base = valortotatt

    if dados.get('tipoCalculo') == 'preferencia' and dados.get('natureza') == 'alimentar':
        valor_base = min(valortotatt, dados.get('tetoPreferencia', 0))

    elif dados.get('tipoCalculo') == 'parcial':
        if dados.get('honorarioSucumbencial', {}).get('advogados'):
            dados_temp = {**dados, 'tipoCalculo': 'ordem', 'saldoParcial': None}
            res_suc = calcular_honorarios_sucumbenciais(dados_temp, valortotatt, totais_por_tipo)
            valor_suc = res_suc['valorHonorarioTotal']
            total_geral = valortotatt + valor_suc

            if dados.get('saldoParcial', 0) >= total_geral:
                valor_base = valortotatt
            else:
                proporcao = valortotatt / total_geral
                valor_base = dados['saldoParcial'] * proporcao
        else:
            valor_base = min(valortotatt, dados.get('saldoParcial', valortotatt))

    return valor_base


def calcular_rra_ponderado(dados, valor_base, valortotatt):
    if not dados.get('valoresPrincipais'):
        return 0
    rra_total = sum(item.get('tributacao', {}).get('rra', 0) for item in dados['valoresPrincipais'])
    if rra_total == 0:
        return 0
    return arredondar_rra((valor_base * rra_total) / valortotatt)


def calcular_bases_com_cessoes(dados, valor_base, valortotatt, cessoes_beneficiario):
    valor_base_para_honorarios = valor_base
    valor_beneficiario_efetivo = valor_base

    if cessoes_beneficiario:
        percentual_final = 1.0 - sum(c['percentual'] for c in cessoes_beneficiario)
        direito_total = valortotatt * percentual_final
        is_pref_parcial = dados.get('tipoCalculo') == 'preferencia' and valor_base < valortotatt

        valor_beneficiario_efetivo = min(direito_total, valor_base) if is_pref_parcial else direito_total
        valor_base_para_honorarios = valor_beneficiario_efetivo if is_pref_parcial else valor_base

    return {
        'valorBaseParaHonorarios': valor_base_para_honorarios,
        'valorBeneficiarioQueRecebeEfetivamente': valor_beneficiario_efetivo
    }


def calcular_global(dados, valortotatt, percentualprinc, percentualjur, totais_por_tipo=None):
    valor_base = calcular_valor_base(dados, valortotatt, totais_por_tipo)

    tem_ir = any(item.get('tributacao', {}).get('ir') for item in (dados.get('valoresPrincipais') or []))

    if tem_ir and dados.get('tributacaoIR'):
        perc_princ = dados['tributacaoIR'].get('percentuais', {}).get('principalTributado', 0)
        perc_juros = dados['tributacaoIR'].get('percentuais', {}).get('jurosTributado', 0)
        principal = valor_base * (perc_princ / 100)
        juros_base = valor_base * (perc_juros / 100)
    else:
        principal = valor_base * percentualprinc
        juros_base = valor_base * percentualjur

    rrapagamento = calcular_rra_ponderado(dados, valor_base, valortotatt)

    cessoes_ben = [c for c in (dados.get('cessoes') or []) if c.get('tipo') == 'cessaobenPrincipal']
    bases = calcular_bases_com_cessoes(dados, valor_base, valortotatt, cessoes_ben)
    valor_base_hon = bases['valorBaseParaHonorarios']
    valor_ben_efetivo = bases['valorBeneficiarioQueRecebeEfetivamente']

    res_hon = calcular_honorarios(dados, valor_base_hon, valortotatt, totais_por_tipo)
    honorarios = res_hon['honorarios']
    valor_honorario_total = res_hon['valorHonorarioTotal']

    res_sind = calcular_sindicatos(dados, valor_base_hon, valortotatt)
    sindicatos = res_sind['sindicatos']
    valor_sindicato_total = res_sind['valorSindicatoTotal']

    valor_sindicato_descontar = 0 if dados.get('tipoCalculo') == 'preferencia' else valor_sindicato_total

    is_pref_parcial = dados.get('tipoCalculo') == 'preferencia' and valor_base < valortotatt
    is_parcial = dados.get('tipoCalculo') == 'parcial'

    if is_pref_parcial:
        if tem_ir and dados.get('tributacaoIR'):
            perc_princ = dados['tributacaoIR'].get('percentuais', {}).get('principalTributado', 0)
            principal = valor_ben_efetivo * (perc_princ / 100)
        else:
            principal = valor_ben_efetivo * percentualprinc
        rrapagamento = calcular_rra_ponderado(dados, valor_ben_efetivo, valortotatt)

    elif is_parcial:
        proporcao = valor_base / valortotatt
        if tem_ir and dados.get('tributacaoIR'):
            principal = dados['tributacaoIR']['principalTributado'] * proporcao
            juros_base = dados['tributacaoIR']['jurosTributado'] * proporcao
        else:
            principal = valor_base * percentualprinc
            juros_base = valor_base * percentualjur
        rrapagamento = calcular_rra_ponderado(dados, valor_base, valortotatt)

    res_prev = calcular_previdencia_isolada(dados, principal, rrapagamento)
    valor_previdencia = res_prev['valorPrevidencia']
    aliquota_efetiva = res_prev['aliquotaEfetiva']
    valor_desagio_prev = res_prev['valorDesagioPrevidencia']
    percentual_desagio_prev = res_prev['percentualDesagioPrevidencia']

    res_ir = calcular_ir_isolado(dados, valortotatt, valor_base, principal, valor_previdencia, rrapagamento)

    res_cess = calcular_cessoes_beneficiario_principal(
        dados, valor_base, valortotatt,
        valor_honorario_total, valor_sindicato_descontar,
        valor_previdencia, res_ir['valorIR']
    )

    return {
        'valorBase': valor_base,
        'principal': principal,
        'jurosBase': juros_base,
        'rrapagamento': rrapagamento,
        'honorarios': honorarios,
        'valorHonorarioTotal': valor_honorario_total,
        'sindicatos': sindicatos,
        'valorSindicatoTotal': valor_sindicato_total,
        'valorPrevidencia': valor_previdencia,
        'aliquotaEfetiva': aliquota_efetiva,
        'valorDesagioPrevidencia': valor_desagio_prev,
        'percentualDesagioPrevidencia': percentual_desagio_prev,
        'valorIR': res_ir['valorIR'],
        'aliquotaIR': res_ir['aliquotaIR'],
        'baseIRHonora': res_ir['baseIRHonora'],
        'baseIRSindi': res_ir['baseIRSindi'],
        'baseIRPrev': res_ir['baseIRPrev'],
        'principalComDesagio': res_ir['principalComDesagio'],
        'percentualDesagioIR': res_ir['percentualDesagioIR'],
        'rraComDesagio': res_ir['rraComDesagio'],
        'baseIRRRA': res_ir['baseIRRRA'],
        'valorIRUnitario': res_ir['valorIRUnitario'],
        'descontoAdicional2026': res_ir['descontoAdicional2026'],
        'valorIRSemDesconto': res_ir['valorIRSemDesconto'],
        'descontoSimplificado': res_ir['descontoSimplificado'],
        'rendimentoMensal': res_ir['rendimentoMensal'],
        'valorBeneficiarioBruto': res_cess['valorBeneficiarioBruto'],
        'valorCessoesBeneficiario': res_cess['valorCessoesBeneficiario'],
        'percentualBeneficiarioFinal': res_cess['percentualBeneficiarioFinal'],
        'valorBeneficiarioAposCessoes': res_cess['valorBeneficiarioAposCessoes'],
        'valorPrevidenciaBeneficiario': res_cess['valorPrevidenciaBeneficiario'],
        'valorIRBeneficiario': res_cess['valorIRBeneficiario'],
        'valorBeneficiarioFinal': res_cess['valorBeneficiarioFinal'],
        'cessoesBeneficiarioCalculadas': res_cess['cessoesBeneficiarioCalculadas'],
        'cessoesBeneficiarioFinais': res_cess['cessoesBeneficiarioFinais'],
        'isPreferenciasParcial': is_pref_parcial
    }