from datetime import date, timedelta
from core.calculos.indices import (
    calcular_periodo_graca, calcular_juros_2_porcento_aa
)
from core.calculos.base import calcular_indices_e_valores, calcular_item_principal
from core.calculos.tributacao import (
    calcular_ir, calcular_desconto_adicional_2026, arredondar_rra,
    calcular_previdencia_isolada, calcular_ir_isolado
)
import requests


MESES_NOMES = ['', 'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
               'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']


def calcular_ipca_pagamento(data_pagamento, data_atualizacao):
    try:
        ultimo_dia_mes_anterior = data_atualizacao.replace(day=1) - timedelta(days=1)
        data_final_str = ultimo_dia_mes_anterior.strftime('%d/%m/%Y')
        primeiro_dia_pag = data_pagamento.replace(day=1)
        data_inicial_str = primeiro_dia_pag.strftime('%d/%m/%Y')

        url = f'https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados?formato=json&dataInicial={data_inicial_str}&dataFinal={data_final_str}'
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        dados = response.json()

        if not dados:
            return {'indiceipca': 1.0, 'quantidadeMeses': 0, 'temDados': False}

        indice = 1.0
        for item in dados:
            indice *= 1 + (float(item['valor'].replace(',', '.')) / 100)

        ano_ini, mes_ini = data_pagamento.year, data_pagamento.month
        ano_fim, mes_fim = data_atualizacao.year, data_atualizacao.month
        meses = max(0, (ano_fim * 12 + mes_fim) - (ano_ini * 12 + mes_ini))

        return {'indiceipca': indice, 'quantidadeMeses': meses, 'temDados': True}

    except Exception:
        return {'indiceipca': 1.0, 'quantidadeMeses': 0, 'temDados': False}


def calcular_meses_fora_graca(data_pagamento, fim_graca, total_meses, data_atualizacao):
    if fim_graca < data_pagamento:
        return total_meses
    if fim_graca >= data_atualizacao:
        return 0
    meses = (data_atualizacao.year * 12 + data_atualizacao.month) - \
            (fim_graca.year * 12 + fim_graca.month) - 1
    return max(0, meses)


def calcular_indices_pos_pec(data_pagamento_str, ano_orcamento, data_atualizacao):
    _, fim_graca = calcular_periodo_graca(ano_orcamento)
    ano, mes, dia = data_pagamento_str.split('-')
    data_pag = date(int(ano), int(mes), int(dia))

    dados_ipca = calcular_ipca_pagamento(data_pag, data_atualizacao)
    meses_fora = calcular_meses_fora_graca(data_pag, fim_graca, dados_ipca['quantidadeMeses'], data_atualizacao)
    juros_2aa_decimal = calcular_juros_2_porcento_aa(meses_fora)

    return {
        'ipca': dados_ipca['indiceipca'],
        'juros2aa': 1 + juros_2aa_decimal,
        'meses': dados_ipca['quantidadeMeses'],
        'mesesForaGraca': meses_fora
    }


def calcular_componentes_pagamento_total(dados, pagamento, data_atualizacao):
    try:
        valor_principal = 0
        valor_juros = 0
        valor_selic_separada = 0
        percentual_selic = 0

        for item in dados.get('valoresPrincipais', []):
            try:
                calc = calcular_item_principal(item, dados, data_atualizacao)
                valor_principal += calc['valorAtualizado']['principal']
                valor_juros += calc['valorAtualizado']['juros']
                selic_item = calc.get('valorSelicSeparado', 0)
                if selic_item > 0:
                    valor_selic_separada += selic_item
                if item['indices'].get('selic') and calc['indices'].get('selic'):
                    percentual_selic = calc['indices']['selic'] - 1
            except Exception:
                continue

        if valor_principal == 0 and valor_juros == 0:
            return None

        tem_selic_separada = valor_selic_separada > 0

        if tem_selic_separada:
            total = valor_principal + valor_juros + valor_selic_separada
            prop_p = valor_principal / total
            prop_j = valor_juros / total
            prop_s = valor_selic_separada / total
            return {
                'valorPrincipal': pagamento['valorTotal'] * prop_p,
                'valorJuros': pagamento['valorTotal'] * prop_j,
                'tipoSelic': 'valor',
                'valorSelic': pagamento['valorTotal'] * prop_s,
                'percentualSelic': 0,
                'selicReferencia': 'mesAnterior'
            }
        else:
            indice_selic = 1 + percentual_selic
            principal_base = valor_principal / indice_selic
            juros_base = valor_juros / indice_selic
            selic_total = (valor_principal - principal_base) + (valor_juros - juros_base)
            total = principal_base + juros_base + selic_total
            prop_p = principal_base / total
            prop_j = juros_base / total
            prop_s = selic_total / total
            return {
                'valorPrincipal': pagamento['valorTotal'] * prop_p,
                'valorJuros': pagamento['valorTotal'] * prop_j,
                'tipoSelic': 'valor',
                'valorSelic': pagamento['valorTotal'] * prop_s,
                'percentualSelic': 0,
                'selicReferencia': 'mesAnterior'
            }
    except Exception:
        return None


def calcular_pagamentos(dados, data_atualizacao):
    if not dados.get('pagamentos'):
        return []

    calculados = []
    data_pec = date(2025, 8, 1)

    for i, pagamento in enumerate(dados['pagamentos']):
        try:
            if pagamento.get('tipoInformacao') == 'total':
                componentes = calcular_componentes_pagamento_total(dados, pagamento, data_atualizacao)
                if not componentes:
                    continue
                pagamento.update(componentes)

            ano, mes, dia = pagamento['dataBase'].split('-')
            data_pag = date(int(ano), int(mes), int(dia))
            is_pos_pec = data_pag >= data_pec

            if is_pos_pec and (pagamento.get('valorSelic') or 0) > 0:
                indices = calcular_indices_pos_pec(pagamento['dataBase'], dados['anoOrcamento'], data_atualizacao)

                principal_at = pagamento['valorPrincipal'] * indices['ipca'] 
                juros_orig_at = pagamento['valorJuros'] * indices['ipca'] * indices['juros2aa']
                novos_juros = principal_at * (indices['juros2aa'] - 1)
                juros_at = juros_orig_at + novos_juros
                selic_at = pagamento['valorSelic'] * indices['ipca']
                total_at = principal_at + juros_at + selic_at

                calculados.append({
                    'beneficiario': pagamento['beneficiario'],
                    'dataBase': pagamento['dataBase'],
                    'valorOriginal': {
                        'principal': pagamento['valorPrincipal'],
                        'juros': pagamento['valorJuros'],
                        'selic': pagamento['valorSelic'],
                        'total': pagamento['valorPrincipal'] + pagamento['valorJuros'] + pagamento['valorSelic']
                    },
                    'valorAtualizado': {
                        'principal': principal_at, 'juros': juros_at,
                        'selic': selic_at, 'total': total_at
                    },
                    'principalTributacao': principal_at,
                    'jurosTributacao': juros_at,
                    'valorSelicSeparado': selic_at,
                    'indices': {
                        'ipca': indices['ipca'],
                        'juros2AA': indices['juros2aa'] - 1,
                        'mesesForaGraca': indices['mesesForaGraca']
                    }
                })

            else:
                base_data = {
                    'mesBase': MESES_NOMES[int(mes)],
                    'anoBase': int(ano)
                }
                config = {
                    'aplicarCNJ': True, 'aplicarSelic': True,
                    'aplicarIpcaE': True, 'aplicarJurosMora': True,
                    'aplicarIpca': True, 'tipoSelic': 'valor',
                    'valorSelic': pagamento.get('valorSelic') or 0,
                    'percentualSelic': 0, 'selicReferencia': 'mesAnterior'
                }
                calculo = calcular_indices_e_valores(base_data, dados, pagamento['valorPrincipal'], pagamento['valorJuros'], config, data_atualizacao)
                total_at = calculo['valorPrincipalAtualizado'] + calculo['valorJurosAtualizado'] + (calculo.get('valorSelicSeparado') or 0)

                calculados.append({
                    'beneficiario': pagamento['beneficiario'],
                    'dataBase': pagamento['dataBase'],
                    'valorOriginal': {
                        'principal': pagamento['valorPrincipal'],
                        'juros': pagamento['valorJuros'],
                        'selic': pagamento.get('valorSelic') or 0,
                        'total': pagamento['valorPrincipal'] + pagamento['valorJuros'] + (pagamento.get('valorSelic') or 0)
                    },
                    'valorAtualizado': {
                        'principal': calculo['valorPrincipalAtualizado'],
                        'juros': calculo['valorJurosAtualizado'],
                        'selic': calculo.get('valorSelicSeparado') or 0,
                        'total': total_at
                    },
                    'principalTributacao': calculo['principalTributacao'],
                    'jurosTributacao': calculo['jurosTributacao'],
                    'valorSelicSeparado': calculo.get('valorSelicSeparado') or 0,
                    'indices': calculo['indices'],
                    'jurosMoraCalculado': calculo['jurosMoraCalculado']
                })

        except Exception as e:
            print(f'Erro no pagamento {i+1}: {e}')

    return calculados


def calcular_saldo_final_com_pagamentos(resultados, pagamentos_calculados, dados):
    if not pagamentos_calculados:
        return None

    pag_por_ben = {}
    for pag in pagamentos_calculados:
        ben = pag['beneficiario']
        if ben not in pag_por_ben:
            pag_por_ben[ben] = {'totalPago': 0}
        pag_por_ben[ben]['totalPago'] += pag['valorAtualizado']['total']

    saldos = {
        'beneficiarioPrincipal': None, 'advogados': [], 'advogadosSucumbenciais': [],
        'sindicatos': [], 'herdeiros': [], 'cessionarios': [],
        'totalGeralBruto': 0, 'totalGeralOriginal': 0
    }

    cessoes100 = identificar_cessoes100(resultados)
    calcular_saldos_beneficiario_ou_herdeiros(resultados, dados, pag_por_ben, saldos)
    calcular_saldos_advogados(resultados.get('honorarios'), pag_por_ben, cessoes100['advogados'], saldos, 'advogados')
    calcular_saldos_advogados(resultados.get('honorariosSucumbenciais', {}).get('honorarios'), pag_por_ben, cessoes100['advogadosSucumbenciais'], saldos, 'advogadosSucumbenciais')
    calcular_saldos_sindicatos(resultados, pag_por_ben, cessoes100['sindicatos'], saldos)
    calcular_saldos_cessionarios(resultados, pag_por_ben, cessoes100, saldos, dados)
    calcular_totais_e_tributos(resultados, dados, saldos)

    return saldos


def identificar_cessoes100(resultados):
    cessoes100 = {'advogados': {}, 'advogadosSucumbenciais': {}, 'sindicatos': {}, 'beneficiarioPrincipal': False}

    for adv in (resultados.get('honorarios') or []):
        if adv.get('cessionarios'):
            if sum(c['percentual'] for c in adv['cessionarios']) >= 1.0:
                cessoes100['advogados'][adv['nome']] = adv['cessionarios']

    for adv in (resultados.get('honorariosSucumbenciais', {}).get('honorarios') or []):
        if adv.get('cessionarios'):
            if sum(c['percentual'] for c in adv['cessionarios']) >= 1.0:
                cessoes100['advogadosSucumbenciais'][adv['nome']] = adv['cessionarios']

    for sind in (resultados.get('sindicatos') or []):
        if sind.get('cessionarios'):
            if sum(c['percentual'] for c in sind['cessionarios']) >= 1.0:
                cessoes100['sindicatos'][sind['nome']] = sind['cessionarios']

    cessoes_ben = resultados.get('cessoesBeneficiarioFinais') or []
    if cessoes_ben:
        cessoes100['beneficiarioPrincipal'] = sum(c['percentual'] for c in cessoes_ben) >= 1.0

    return cessoes100


def calcular_saldos_beneficiario_ou_herdeiros(resultados, dados, pag_por_ben, saldos):
    nome_ben = dados.get('beneficiario', '')
    pag_ben = pag_por_ben.get(nome_ben, {}).get('totalPago', 0)

    if resultados.get('temHerdeiros') and resultados.get('herdeiros'):
        for herd in resultados['herdeiros']:
            perc_cedido = sum(c['percentual'] for c in (herd.get('cessoesHerdeiro') or []))
            if perc_cedido >= 1.0:
                continue
            pag_direto = pag_por_ben.get(herd['nome'], {}).get('totalPago', 0)
            pag_do_ben = pag_ben * herd['percentual']
            total_pag = pag_direto + pag_do_ben
            valor_bruto = herd.get('valorBruto', 0)
            saldo = valor_bruto - total_pag
            saldos['herdeiros'].append({'nome': herd['nome'], 'valorBruto': valor_bruto, 'pagamento': total_pag, 'saldo': saldo})
            saldos['totalGeralBruto'] += saldo
            saldos['totalGeralOriginal'] += valor_bruto
    else:
        if resultados.get('valorBeneficiarioAposCessoes', 0) > 0:
            valor_bruto = resultados['valorBeneficiarioAposCessoes']
            saldo = valor_bruto - pag_ben
            saldos['beneficiarioPrincipal'] = {'nome': nome_ben, 'valorBruto': valor_bruto, 'pagamento': pag_ben, 'saldo': saldo}
            saldos['totalGeralBruto'] += saldo
            saldos['totalGeralOriginal'] += valor_bruto


def calcular_saldos_advogados(advogados, pag_por_ben, cessoes100, saldos, chave):
    if not advogados:
        return
    for adv in advogados:
        if adv['nome'] in cessoes100:
            continue
        pag = pag_por_ben.get(adv['nome'], {}).get('totalPago', 0)
        valor_bruto = adv.get('valorBrutoAdvogado') or adv.get('valorBruto', 0)
        saldo = valor_bruto - pag
        saldos[chave].append({'nome': adv['nome'], 'tipo': adv.get('tipo'), 'valorBruto': valor_bruto, 'pagamento': pag, 'saldo': saldo})
        saldos['totalGeralBruto'] += saldo
        saldos['totalGeralOriginal'] += valor_bruto


def calcular_saldos_sindicatos(resultados, pag_por_ben, cessoes100, saldos):
    for sind in (resultados.get('sindicatos') or []):
        if sind['nome'] in cessoes100:
            continue
        pag = pag_por_ben.get(sind['nome'], {}).get('totalPago', 0)
        valor_bruto = sind.get('valorBrutoSindicato', 0)
        saldo = valor_bruto - pag
        saldos['sindicatos'].append({'nome': sind['nome'], 'valorBruto': valor_bruto, 'pagamento': pag, 'saldo': saldo})
        saldos['totalGeralBruto'] += saldo
        saldos['totalGeralOriginal'] += valor_bruto


def calcular_saldos_cessionarios(resultados, pag_por_ben, cessoes100, saldos, dados):
    nome_ben = resultados.get('beneficiario') or dados.get('beneficiario', '')
    pag_ben = pag_por_ben.get(nome_ben, {}).get('totalPago', 0)

    for cess in (resultados.get('cessoesBeneficiarioFinais') or []):
        pag_direto = pag_por_ben.get(cess['cessionario'], {}).get('totalPago', 0)
        pag_total = pag_direto
        if cessoes100['beneficiarioPrincipal']:
            pag_total += pag_ben * cess['percentual']
        valor_bruto = cess.get('valorBruto', 0)
        saldo = valor_bruto - pag_total
        saldos['cessionarios'].append({'nome': cess['cessionario'], 'tipo': 'Cessionário do Beneficiário', 'valorBruto': valor_bruto, 'pagamento': pag_total, 'saldo': saldo})
        saldos['totalGeralBruto'] += saldo
        saldos['totalGeralOriginal'] += valor_bruto

    for herd in (resultados.get('herdeiros') or []):
        if not herd.get('cessoesHerdeiro'):
            continue
        pag_herd = pag_por_ben.get(herd['nome'], {}).get('totalPago', 0)
        perc_cedido = sum(c['percentual'] for c in herd['cessoesHerdeiro'])
        cedeu100 = perc_cedido >= 1.0
        valor_bruto_herd = herd.get('valorBruto', 0)

        for cess in herd['cessoesHerdeiro']:
            pag_direto = pag_por_ben.get(cess['cessionario'], {}).get('totalPago', 0)
            pag_total = pag_direto
            valor_bruto = cess.get('valorBruto', 0)
            if cedeu100:
                valor_bruto = valor_bruto_herd * cess['percentual']
                pag_total += pag_herd * cess['percentual']
            saldo = valor_bruto - pag_total
            saldos['cessionarios'].append({'nome': cess['cessionario'], 'cedente': herd['nome'], 'tipo': 'Cessionário de Herdeiro', 'valorBruto': valor_bruto, 'pagamento': pag_total, 'saldo': saldo})
            saldos['totalGeralBruto'] += saldo
            saldos['totalGeralOriginal'] += valor_bruto


def calcular_totais_e_tributos(resultados, dados, saldos):
    total_sem_hon_suc = saldos['totalGeralBruto']
    if saldos.get('advogadosSucumbenciais'):
        total_sem_hon_suc -= sum(a['saldo'] for a in saldos['advogadosSucumbenciais'])
    if saldos.get('cessionarios'):
        total_sem_hon_suc -= sum(c['saldo'] for c in saldos['cessionarios'] if c['tipo'] == 'Cessionário de Adv. Sucumbencial')

    saldos['totalSemHonorariosSucumbenciais'] = total_sem_hon_suc

    principal_orig = resultados.get('principal') or (resultados.get('valortotatt', 0) * (resultados.get('percentualprinc') or 0.5))
    juros_orig = (resultados.get('valortotatt') or 0) - principal_orig
    total_orig_sem_hon_suc = saldos['totalGeralOriginal']
    if saldos.get('advogadosSucumbenciais'):
        total_orig_sem_hon_suc -= sum(a['valorBruto'] for a in saldos['advogadosSucumbenciais'])

    valor_pago = total_orig_sem_hon_suc - total_sem_hon_suc
    if valor_pago > 0 and total_orig_sem_hon_suc > 0:
        perc_pago = valor_pago / total_orig_sem_hon_suc
        saldos['principalTotal'] = principal_orig - (principal_orig * perc_pago)
        saldos['jurosTotal'] = juros_orig - (juros_orig * perc_pago)
    else:
        saldos['principalTotal'] = total_sem_hon_suc * (resultados.get('percentualprinc') or 0.5)
        saldos['jurosTotal'] = total_sem_hon_suc * (resultados.get('percentualjur') or 0.5)

    rra_orig = resultados.get('rrapagamento') or resultados.get('rraTotal') or 0
    proporcao = total_sem_hon_suc / total_orig_sem_hon_suc if total_orig_sem_hon_suc > 0 else 0
    saldos['rraOriginal'] = rra_orig
    saldos['rraAjustado'] = max(1, arredondar_rra(proporcao * rra_orig)) if rra_orig > 0 else 0

    res_prev = calcular_previdencia_isolada(dados, saldos['principalTotal'], saldos['rraAjustado'])
    saldos.update({
        'previdenciaTotal': res_prev['valorPrevidencia'],
        'aliquotaEfetiva': res_prev['aliquotaEfetiva'],
        'valorDesagioPrevidencia': res_prev['valorDesagioPrevidencia'],
        'percentualDesagioPrevidencia': res_prev['percentualDesagioPrevidencia']
    })

    res_ir = calcular_ir_isolado(dados, total_sem_hon_suc, total_sem_hon_suc, saldos['principalTotal'], saldos['previdenciaTotal'], saldos['rraAjustado'])
    saldos.update({
        'irTotal': res_ir['valorIR'], 'aliquotaIR': res_ir['aliquotaIR'],
        'baseIRHonora': res_ir['baseIRHonora'], 'baseIRSindi': res_ir['baseIRSindi'],
        'baseIRPrev': res_ir['baseIRPrev'], 'baseIRRRA': res_ir['baseIRRRA'],
        'valorIRUnitario': res_ir['valorIRUnitario'], 'principalComDesagio': res_ir['principalComDesagio'],
        'percentualDesagioIR': res_ir['percentualDesagioIR'], 'rraComDesagio': res_ir['rraComDesagio'],
        'descontoAdicional2026': res_ir['descontoAdicional2026'], 'valorIRSemDesconto': res_ir['valorIRSemDesconto']
    })

    saldos['totalLiquido'] = total_sem_hon_suc - saldos['previdenciaTotal'] - saldos['irTotal']