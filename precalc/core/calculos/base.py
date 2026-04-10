from datetime import date

from core.calculos.indices import (
    obter_indice_cnj, calcular_soma_juros_mora, calcular_periodo_graca,
    criar_data_base, calcular_ipca_e, calcular_selic, calcular_ipca,
    calcular_juros_2_porcento_aa, calcular_selic_pos_agosto_2025
)


def calcular_indices_e_valores(base_data, dados, valor_principal, valor_juros, config_indices=None, data_atualizacao=None):
    if config_indices is None:
        config_indices = {}

    inicio_graca, fim_graca = calcular_periodo_graca(dados['anoOrcamento'])
    mes_base = base_data['mesBase']
    ano_base = base_data['anoBase']
    data_base = criar_data_base(mes_base, ano_base)

    indices = {'cnj': 1, 'selic': 1, 'ipcae': 1, 'ipca': 1, 'jurosMora': 0}

    # 1. CNJ
    if config_indices.get('aplicarCNJ'):
        indices['cnj'] = obter_indice_cnj(mes_base, ano_base)

    # 2. Juros de mora
    if config_indices.get('aplicarJurosMora'):
        indices['jurosMora'] = calcular_soma_juros_mora(mes_base, ano_base, dados['natureza'], inicio_graca, fim_graca) / 100

    # 3. IPCA-E
    if config_indices.get('aplicarIpcaE'):
        try:
            indices['ipcae'] = calcular_ipca_e(data_base, inicio_graca, fim_graca, data_atualizacao)
        except Exception as e:
            print(f"Erro IPCA-E (usando 1.0): {e}")

    # 4. SELIC
    if config_indices.get('aplicarSelic'):
        tem_selic_informado = (
            (config_indices.get('tipoSelic') == 'valor' and (config_indices.get('valorSelic') or 0) > 0) or
            (config_indices.get('tipoSelic') == 'percentual' and (config_indices.get('percentualSelic') or 0) > 0)
        )

        from dateutil.relativedelta import relativedelta
        data_inicio_selic = data_base
        if tem_selic_informado and config_indices.get('selicReferencia') != 'mesAnterior':
            data_inicio_selic = data_base + relativedelta(months=1)

        try:
            dados_selic = calcular_selic(data_inicio_selic, inicio_graca, fim_graca, data_atualizacao)
            indices['selic'] = dados_selic['indiceselic']

            if tem_selic_informado:
                percentual_adicional = 0
                if config_indices.get('tipoSelic') == 'valor' and (config_indices.get('valorSelic') or 0) > 0:
                    total_base = valor_principal + valor_juros
                    if total_base > 0:
                        percentual_adicional = config_indices['valorSelic'] / total_base
                elif config_indices.get('tipoSelic') == 'percentual':
                    percentual_adicional = config_indices.get('percentualSelic') or 0

                if percentual_adicional > 0:
                    indices['selic'] = 1 + (indices['selic'] - 1) + percentual_adicional
        except Exception as e:
            print(f"Erro SELIC (usando 1.0): {e}")

    # Valores base
    principal_cnj = valor_principal * indices['cnj']
    juros_cnj = valor_juros * indices['cnj']
    valor_juros_mora = principal_cnj * indices['jurosMora']
    juros_total = juros_cnj + valor_juros_mora
    total_antes_selic = principal_cnj + juros_total
    valor_selic_separado = total_antes_selic * (indices['selic'] - 1)

    # Verificar PEC
    comparacao = calcular_selic_pos_agosto_2025(data_atualizacao)
    usar_logica_pec = comparacao['quantidadeMeses'] > 0

    # SITUAÇÃO 1: PEC com SELIC > IPCA+2%
    if usar_logica_pec and comparacao['selicMaior']:
        dados_ipca = calcular_ipca(data_base, inicio_graca, fim_graca, data_atualizacao)
        indice_ipca = dados_ipca['indiceipca']
        percentual_juros_2aa = calcular_juros_2_porcento_aa(dados_ipca['quantidadeMesesForaGraca'])

        principal_com_ipca = principal_cnj * indices['ipcae'] * indice_ipca
        juros_com_ipca = juros_total * indice_ipca * indices['ipcae']
        selic_com_ipca = valor_selic_separado * indice_ipca * indices['ipcae']
        valor_juros_2aa = principal_com_ipca * percentual_juros_2aa

        juros_final = juros_com_ipca + valor_juros_2aa
        total_final = principal_com_ipca + juros_final + selic_com_ipca

        principal_trib = valor_principal * indices['cnj'] * indices['ipcae'] * indice_ipca * indices['selic']
        juros_orig_selic = valor_juros * indices['cnj'] * indices['ipcae'] * indice_ipca * indices['selic']
        juros_mora_selic = valor_juros_mora * indices['ipcae'] * indice_ipca * indices['selic']
        juros_trib = juros_orig_selic + juros_mora_selic + valor_juros_2aa

        indices['ipca'] = indice_ipca

        return {
            'valorPrincipalAtualizado': principal_com_ipca,
            'valorJurosAtualizado': juros_final,
            'valorSelicSeparado': selic_com_ipca,
            'principalTributacao': principal_trib,
            'jurosTributacao': juros_trib,
            'indices': {**indices, 'indicePrincipal': indices['cnj'] * indice_ipca, 'indiceJuros': indices['cnj'] * indice_ipca, 'juros2AA': percentual_juros_2aa},
            'jurosMoraCalculado': valor_juros_mora,
            'detalhamentoPEC': {
                'usouLogicaPEC': True, 'selicMaior': True,
                'indiceSelic': comparacao['indiceSelic'],
                'indiceIpcaMais2': comparacao['indiceIpcaMais2'],
                'indiceIpcaPuro': indice_ipca,
                'percentualJuros2AA': percentual_juros_2aa,
                'valorJuros2AA': valor_juros_2aa,
                'quantidadeMeses': comparacao['quantidadeMeses']
            }
        }

    # SITUAÇÕES 2 e 3
    total_com_selic = total_antes_selic * indices['selic']
    total_com_ipcae = total_com_selic * indices['ipcae']
    indice_final = comparacao['indiceSelecionado'] if usar_logica_pec else 1
    total_final = total_com_ipcae * indice_final

    proporcao_principal = principal_cnj / total_antes_selic
    proporcao_juros = juros_total / total_antes_selic

    principal_final = total_final * proporcao_principal
    juros_final = total_final * proporcao_juros
    indice_principal = indices['cnj'] * indices['selic'] * indices['ipcae'] * indice_final

    if usar_logica_pec:
        indices['ipca'] = comparacao['indiceSelecionado']

    return {
        'valorPrincipalAtualizado': principal_final,
        'valorJurosAtualizado': juros_final,
        'valorSelicSeparado': 0,
        'principalTributacao': principal_final,
        'jurosTributacao': juros_final,
        'indices': {**indices, 'indicePrincipal': indice_principal, 'indiceJuros': indice_principal},
        'jurosMoraCalculado': valor_juros_mora,
        'detalhamentoPEC': {'usouLogicaPEC': True, 'selicMaior': False, 'indiceSelic': comparacao['indiceSelic'], 'indiceIpcaMais2': comparacao['indiceIpcaMais2'], 'quantidadeMeses': comparacao['quantidadeMeses']} if usar_logica_pec else {'usouLogicaPEC': False}
    }


def calcular_item_principal(item, dados, data_atualizacao):
    config_indices = {
        'aplicarCNJ': item['indices'].get('cnj', False),
        'aplicarSelic': item['indices'].get('selic', False),
        'aplicarIpcaE': item['indices'].get('ipcae', False),
        'aplicarJurosMora': item['indices'].get('jurosMora', False),
        'aplicarIpca': item['indices'].get('ipca', False),
        'tipoSelic': item.get('tipoSelic'),
        'valorSelic': item.get('valorSelic'),
        'percentualSelic': item.get('percentualSelic'),
        'selicReferencia': item.get('mesReferenciaSelic'),
    }

    base_data = {'mesBase': item['mesBase'], 'anoBase': item['anoBase']}
    calculo = calcular_indices_e_valores(base_data, dados, item['valorPrincipal'], item['valorJuros'], config_indices, data_atualizacao)

    return {
        'id': item.get('id'),
        'descricao': item.get('descricao'),
        'valorOriginal': {
            'principal': item['valorPrincipal'],
            'juros': item['valorJuros'],
            'total': item['valorPrincipal'] + item['valorJuros']
        },
        'valorAtualizado': {
            'principal': calculo['valorPrincipalAtualizado'],
            'juros': calculo['valorJurosAtualizado'],
            'selic': calculo.get('valorSelicSeparado', 0),
            'total': calculo['valorPrincipalAtualizado'] + calculo['valorJurosAtualizado'] + calculo.get('valorSelicSeparado', 0)
        },
        'valorSelicSeparado': calculo.get('valorSelicSeparado', 0),
        'principalTributacao': calculo['principalTributacao'],
        'jurosTributacao': calculo['jurosTributacao'],
        'indices': calculo['indices'],
        'tributacao': item['tributacao'],
        'jurosMoraCalculado': calculo['jurosMoraCalculado'],
        'detalhamentoPEC': calculo['detalhamentoPEC']
    }


def totalizar_tributacao(itens_calculados):
    totais = {
        'valorPrincipalTotal': 0, 'valorJurosTotal': 0, 'valorSelicTotal': 0,
        'valorGeralTotal': 0, 'rraTotal': 0,
        'principalTributadoIR': 0, 'jurosTributadoIR': 0, 'isentoIR': 0,
        'principalTributadoPrevidencia': 0, 'jurosTributadoPrevidencia': 0, 'isentoPrevidencia': 0
    }

    for item in itens_calculados:
        totais['valorPrincipalTotal'] += item['valorAtualizado']['principal']
        totais['valorJurosTotal'] += item['valorAtualizado']['juros']
        valor_selic_item = item.get('valorSelicSeparado', 0)
        totais['valorSelicTotal'] += valor_selic_item
        totais['valorGeralTotal'] += item['valorAtualizado']['principal'] + item['valorAtualizado']['juros'] + valor_selic_item
        totais['rraTotal'] += item['tributacao'].get('rra', 0)

        if item['tributacao'].get('ir'):
            if 'principalTributacao' in item:
                totais['principalTributadoIR'] += item['principalTributacao']
                totais['jurosTributadoIR'] += item['jurosTributacao']
            else:
                totais['principalTributadoIR'] += item['valorAtualizado']['principal']
                totais['jurosTributadoIR'] += item['valorAtualizado']['juros']
        else:
            totais['isentoIR'] += item['valorAtualizado']['principal'] + item['valorAtualizado']['juros'] + valor_selic_item

        if item['tributacao'].get('previdencia'):
            totais['principalTributadoPrevidencia'] += item['valorAtualizado']['principal']
            totais['jurosTributadoPrevidencia'] += item['valorAtualizado']['juros']
        else:
            totais['isentoPrevidencia'] += item['valorAtualizado']['principal'] + item['valorAtualizado']['juros'] + valor_selic_item

    return totais


def calcular_valores(dados, data_atualizacao):
    from core.calculos.detalhamento import calcular_global
    from core.calculos.honorarios_suc import calcular_honorarios_sucumbenciais
    from core.calculos.herdeiros import calcular_herdeiros
    from core.calculos.pagamentos import calcular_pagamentos, calcular_saldo_final_com_pagamentos
    
    if not dados.get('valoresPrincipais'):
        return None

    # 1. Calcular todos os itens
    itens_calculados = []
    for item in dados['valoresPrincipais']:
        itens_calculados.append(calcular_item_principal(item, dados, data_atualizacao))

    # 2. Totalizar
    totais = totalizar_tributacao(itens_calculados)

    # 3. Totais por tipo de honorário
    tipos_map = {
        'contratual': ['contratual'],
        'sucumbencial': ['sucumbencial'],
        'ambos': ['contratual', 'sucumbencial'],
        'nenhum': ['nenhum']
    }
    totais_por_tipo = {'contratual': 0, 'sucumbencial': 0, 'nenhum': 0, 'total': totais['valorGeralTotal']}

    for i, item_orig in enumerate(dados['valoresPrincipais']):
        item_calc = itens_calculados[i]
        selic_item = item_calc.get('valorSelicSeparado', 0)
        valor_at = item_calc['valorAtualizado']['principal'] + item_calc['valorAtualizado']['juros'] + selic_item
        for tipo in (tipos_map.get(item_orig.get('tipoUsoHonorario')) or []):
            totais_por_tipo[tipo] += valor_at

    # 4. Percentuais
    percentualprinc = totais['valorPrincipalTotal'] / totais['valorGeralTotal']
    percentualjur = totais['valorJurosTotal'] / totais['valorGeralTotal']
    percentualselic = totais['valorSelicTotal'] / totais['valorGeralTotal']
    valor_original_total = sum(i['valorOriginal']['total'] for i in itens_calculados)
    indice_total = totais['valorGeralTotal'] / valor_original_total

    # 5. Percentuais IR
    perc_princ_ir = (totais['principalTributadoIR'] / totais['valorGeralTotal']) * 100
    perc_juros_ir = (totais['jurosTributadoIR'] / totais['valorGeralTotal']) * 100
    perc_isento_ir = (totais['isentoIR'] / totais['valorGeralTotal']) * 100

    # 6. Dados para detalhamento
    dados_det = {
        **dados,
        'valorPrincipal': totais['valorPrincipalTotal'],
        'valorJuros': totais['valorJurosTotal'],
        'valorSelic': totais['valorSelicTotal'],
        'rra': totais['rraTotal'],
        'incidenciaIR': any(i.get('tributacao', {}).get('ir') for i in (dados.get('valoresPrincipais') or [])),
        'incidenciaPrevidencia': any(i.get('tributacao', {}).get('previdencia') for i in (dados.get('valoresPrincipais') or [])),
        'tributacaoIR': {
            'principalTributado': totais['principalTributadoIR'],
            'jurosTributado': totais['jurosTributadoIR'],
            'isento': totais['isentoIR'],
            'percentuais': {
                'principalTributado': perc_princ_ir,
                'jurosTributado': perc_juros_ir,
                'isento': perc_isento_ir
            }
        },
        'tributacaoPrevidencia': {
            'principalTributado': totais['principalTributadoPrevidencia'],
            'jurosTributado': totais['jurosTributadoPrevidencia'],
            'isento': totais['isentoPrevidencia']
        },
        'totaisPorTipo': totais_por_tipo
    }

    # 7. Distribuição
    detalhamento = calcular_global(dados_det, totais['valorGeralTotal'], percentualprinc, percentualjur, totais_por_tipo)
    honorarios_suc = calcular_honorarios_sucumbenciais(dados_det, totais['valorGeralTotal'], totais_por_tipo)
    herdeiros = calcular_herdeiros(dados_det, totais['valorGeralTotal'], totais['valorPrincipalTotal'], totais['valorJurosTotal'], detalhamento, totais_por_tipo)

    # 8. Pagamentos
    pagamentos_calculados = calcular_pagamentos(dados, data_atualizacao)
    total_pagamentos = sum(p['valorAtualizado']['total'] for p in pagamentos_calculados)

    # 9. Resultado final
    resultado_final = {
        'valorprincatt': totais['valorPrincipalTotal'],
        'valorjurosatt': totais['valorJurosTotal'],
        'valorSelicatt': totais['valorSelicTotal'],
        'valortotatt': totais['valorGeralTotal'],
        'tributacaoIR': dados_det['tributacaoIR'],
        'tributacaoPrevidencia': dados_det['tributacaoPrevidencia'],
        'rraTotal': totais['rraTotal'],
        'itensCalculados': itens_calculados,
        **detalhamento,
        'herdeiros': herdeiros,
        'temHerdeiros': len(herdeiros) > 0,
        'honorariosSucumbenciais': honorarios_suc,
        'pagamentos': pagamentos_calculados,
        'totalPagamentos': total_pagamentos,
        'indiceTotal': indice_total,
        'percentualprinc': percentualprinc,
        'percentualjur': percentualjur,
        'percentualselic': percentualselic,
        'valorOriginalTotal': valor_original_total,
        'totaisPorTipo': totais_por_tipo
    }

    # 10. Saldos finais
    resultado_final['saldosFinais'] = calcular_saldo_final_com_pagamentos(resultado_final, pagamentos_calculados, dados)
    
    # Período de graça para o frontend
    inicio_graca, fim_graca = calcular_periodo_graca(dados['anoOrcamento'])
    resultado_final['inicioGraca'] = inicio_graca.strftime('%Y-%m-%d')
    resultado_final['fimGraca'] = fim_graca.strftime('%Y-%m-%d')

    return resultado_final
