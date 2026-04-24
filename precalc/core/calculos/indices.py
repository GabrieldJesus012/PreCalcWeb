import requests
from datetime import date, datetime, timedelta
from dateutil.relativedelta import relativedelta

# ====================================
# CONSTANTES
# ====================================

MESES = {
    "janeiro": 1, "fevereiro": 2, "março": 3, "abril": 4,
    "maio": 5, "junho": 6, "julho": 7, "agosto": 8,
    "setembro": 9, "outubro": 10, "novembro": 11, "dezembro": 12
}



# ====================================
# FUNÇÕES DE BUSCA NO BANCO
# ====================================

def buscar_indices_banco(tipo, data_inicio, data_fim):
    """Busca índices do banco entre duas datas. Retorna lista de (ano, mes, valor)."""
    from core.models import IndiceMonetario
    return list(
        IndiceMonetario.objects.filter(
            tipo=tipo,
            ano__gte=data_inicio.year,
            ano__lte=data_fim.year,
        ).filter(
            # Filtro mais preciso mes/ano
        ).order_by('ano', 'mes').values_list('ano', 'mes', 'valor')
    )

def buscar_indices_periodo(tipo, data_inicio, data_fim):
    """Busca índices do banco filtrando corretamente por período."""
    from core.models import IndiceMonetario
    resultados = IndiceMonetario.objects.filter(tipo=tipo).order_by('ano', 'mes')
    filtrados = []
    for idx in resultados:
        data_idx = date(idx.ano, idx.mes, 1)
        if data_inicio <= data_idx <= data_fim:
            filtrados.append((idx.ano, idx.mes, float(idx.valor)))
    return filtrados

def salvar_indice_banco(tipo, ano, mes, valor_percentual):
    """Salva um índice no banco. valor_percentual já dividido por 100."""
    from core.models import IndiceMonetario
    IndiceMonetario.objects.update_or_create(
        tipo=tipo, ano=ano, mes=mes,
        defaults={'valor': valor_percentual}
    )

# ====================================
# ÍNDICES CNJ
# ====================================

def obter_indice_cnj(mes_base: str, ano_base: int) -> float:
    from core.models import IndiceMonetario
    numero_mes = MESES.get(mes_base.lower(), 0)
    if ano_base > 2021 or (ano_base == 2021 and numero_mes > 12):
        return 1.0
    try:
        idx = IndiceMonetario.objects.get(tipo='cnj', ano=ano_base, mes=numero_mes)
        return float(idx.valor)
    except Exception:
        return 1.0

# ====================================
# JUROS DE MORA
# ====================================

def obter_taxa_juros(mes, ano, natureza):
    from core.models import IndiceMonetario
    tipo = 'juros_mora_alimentar' if natureza == 'alimentar' else 'juros_mora_comum'
    try:
        idx = IndiceMonetario.objects.get(tipo=tipo, ano=ano, mes=mes)
        return float(idx.valor) * 100  # retorna em percentual como antes
    except Exception:
        return 0

# ====================================
# PERÍODO DE GRAÇA
# ====================================

def calcular_periodo_graca(ano_orcamento):
    if ano_orcamento <= 2022:
        inicio_graca = date(ano_orcamento - 1, 7, 1)   # Julho
    elif 2023 <= ano_orcamento <= 2026:
        inicio_graca = date(ano_orcamento - 1, 4, 1)   # Abril
    else:
        inicio_graca = date(ano_orcamento - 1, 2, 1)   # Fevereiro
    fim_graca = date(ano_orcamento, 12, 31)
    return inicio_graca, fim_graca

def criar_data_base(mes_base, ano_base):
    numero_mes = MESES[mes_base.lower()]
    return date(ano_base, numero_mes, 1)

def esta_no_periodo_graca(data, inicio_graca, fim_graca):
    return inicio_graca <= data <= fim_graca

def gerar_meses_entre_datas(data_inicio, data_fim):
    meses = []
    atual = data_inicio
    while atual <= data_fim:
        meses.append({'mes': atual.month, 'ano': atual.year, 'data': atual})
        atual += relativedelta(months=1)
    return meses

def calcular_soma_juros_mora(mes_base, ano_base, natureza, inicio_graca=None, fim_graca=None):
    data_base = criar_data_base(mes_base, ano_base)
    data_limite = date(2021, 11, 1)
    if data_base > data_limite:
        return 0
    meses_calculo = gerar_meses_entre_datas(data_base, data_limite)
    soma_juros = 0
    for mes_info in meses_calculo:
        mes, ano, data = mes_info['mes'], mes_info['ano'], mes_info['data']
        esta_graca = inicio_graca and fim_graca and esta_no_periodo_graca(data, inicio_graca, fim_graca)
        if esta_graca:
            continue
        taxa = obter_taxa_juros(mes, ano, natureza)
        soma_juros += taxa
    return soma_juros

# ====================================
# SELIC
# ====================================

def calcular_selic(data_base, inicio_graca, fim_graca, data_atualizacao):
    try:
        data_inicio_busca = date(2021, 12, 1)
        data_limite_jul2025 = date(2025, 7, 31)
        primeiro_dia_mes_atual = data_atualizacao.replace(day=1)
        ultimo_dia_mes_anterior = primeiro_dia_mes_atual - timedelta(days=1)
        data_final_selic = min(ultimo_dia_mes_anterior, data_limite_jul2025)

        # Busca do banco
        indices_banco = buscar_indices_periodo('selic', data_inicio_busca, data_final_selic)
        meses_banco = {(a, m) for a, m, v in indices_banco}

        # Verifica meses faltando
        meses_necessarios = set()
        atual = data_inicio_busca
        while atual <= data_final_selic:
            meses_necessarios.add((atual.year, atual.month))
            atual += relativedelta(months=1)

        meses_faltando = meses_necessarios - meses_banco

        # Busca API para meses faltando
        if meses_faltando:
            data_ini_str = data_inicio_busca.strftime('%d/%m/%Y')
            data_fim_str = data_final_selic.strftime('%d/%m/%Y')
            url = f'https://api.bcb.gov.br/dados/serie/bcdata.sgs.4390/dados?formato=json&dataInicial={data_ini_str}&dataFinal={data_fim_str}'
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            dados_api = response.json()
            for item in dados_api:
                dia, mes, ano = item['data'].split('/')
                valor = float(item['valor'].replace(',', '.')) / 100
                salvar_indice_banco('selic', int(ano), int(mes), valor)
            # Rebusca do banco
            indices_banco = buscar_indices_periodo('selic', data_inicio_busca, data_final_selic)

        # Monta lista no formato esperado
        dados = [{'data': f"01/{m:02d}/{a}", 'valor': str(v * 100)} for a, m, v in indices_banco]
        return processar_dados_selic(dados, data_base, inicio_graca, fim_graca)

    except Exception as e:
        raise Exception(f'Erro ao obter SELIC: {e}')


def processar_dados_selic(dados, data_base, inicio_graca, fim_graca):
    def str_para_data(s):
        dia, mes, ano = s.split('/')
        return date(int(ano), int(mes), int(dia))

    selic_antes = []
    periodo_antes = ''
    if data_base < inicio_graca:
        antes = [i for i in dados if data_base <= str_para_data(i['data']) < inicio_graca]
        selic_antes = [float(i['valor'].replace(',', '.')) for i in antes]
        if antes:
            periodo_antes = f"{antes[0]['data']} a {antes[-1]['data']}"

    if data_base > fim_graca:
        apos = [i for i in dados if str_para_data(i['data']) >= data_base]
    else:
        apos = [i for i in dados if str_para_data(i['data']) > fim_graca]

    selic_apos = [float(i['valor'].replace(',', '.')) for i in apos]
    periodo_apos = f"{apos[0]['data']} a {apos[-1]['data']}" if apos else ''

    soma_antes = sum(selic_antes)
    soma_apos = sum(selic_apos)
    soma_total = soma_antes + soma_apos

    return {
        'indiceselic': 1 + (soma_total / 100),
        'indiceSelicAntes': 1 + (soma_antes / 100) if soma_antes > 0 else 1.0,
        'indiceSelicApos': 1 + (soma_apos / 100) if soma_apos > 0 else 1.0,
        'periodoAntesGraca': periodo_antes,
        'periodoAposGraca': periodo_apos,
        'temSelicAntes': len(selic_antes) > 0,
        'temSelicApos': len(selic_apos) > 0,
    }

# ====================================
# IPCA-E
# ====================================

def calcular_ipca_e(data_base, inicio_graca, fim_graca, data_atualizacao):
    try:
        data_inicio_busca = date(2021, 12, 1)
        ultimo_dia_mes_anterior = data_atualizacao.replace(day=1) - timedelta(days=1)

        # Busca do banco
        indices_banco = buscar_indices_periodo('ipca_e', data_inicio_busca, ultimo_dia_mes_anterior)
        meses_banco = {(a, m) for a, m, v in indices_banco}

        meses_necessarios = set()
        atual = data_inicio_busca
        while atual <= ultimo_dia_mes_anterior:
            meses_necessarios.add((atual.year, atual.month))
            atual += relativedelta(months=1)

        meses_faltando = meses_necessarios - meses_banco

        if meses_faltando:
            data_ini_str = data_inicio_busca.strftime('%d/%m/%Y')
            data_fim_str = ultimo_dia_mes_anterior.strftime('%d/%m/%Y')
            url = f'https://api.bcb.gov.br/dados/serie/bcdata.sgs.10764/dados?formato=json&dataInicial={data_ini_str}&dataFinal={data_fim_str}'
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            dados_api = response.json()
            for item in dados_api:
                dia, mes, ano = item['data'].split('/')
                valor = float(item['valor'].replace(',', '.')) / 100
                salvar_indice_banco('ipca_e', int(ano), int(mes), valor)
            indices_banco = buscar_indices_periodo('ipca_e', data_inicio_busca, ultimo_dia_mes_anterior)

        dados = [{'data': f"01/{m:02d}/{a}", 'valor': str(v * 100)} for a, m, v in indices_banco]
        return processar_dados_ipca_e(dados, data_base, inicio_graca, fim_graca)

    except Exception as e:
        raise Exception(f'Erro ao obter IPCA-E: {e}')


def processar_dados_ipca_e(dados, data_base, inicio_graca, fim_graca):
    def str_para_data(s):
        dia, mes, ano = s.split('/')
        return date(int(ano), int(mes), int(dia))

    data_corte = date(2025, 7, 31)
    fim_graca_efetivo = min(fim_graca, data_corte)

    ipca_e_graca = []
    if data_base <= fim_graca_efetivo:
        inicio_efetivo = max(data_base, inicio_graca)
        ipca_e_graca = [
            float(i['valor'].replace(',', '.')) for i in dados
            if inicio_efetivo <= str_para_data(i['data']) <= fim_graca_efetivo
        ]

    indice = 1.0
    for valor in ipca_e_graca:
        indice *= 1 + (valor / 100)

    return indice

# ====================================
# IPCA (série 433)
# ====================================

def calcular_ipca(data_base, inicio_graca, fim_graca, data_atualizacao):
    try:
        data_inicio_busca = date(2025, 8, 1)
        ultimo_dia_mes_anterior = data_atualizacao.replace(day=1) - timedelta(days=1)

        if ultimo_dia_mes_anterior < data_inicio_busca:
            return {'indiceipca': 1.0, 'periodo': '', 'temDados': False, 'quantidadeMeses': 0, 'quantidadeMesesForaGraca': 0}

        # Busca do banco
        indices_banco = buscar_indices_periodo('ipca', data_inicio_busca, ultimo_dia_mes_anterior)
        meses_banco = {(a, m) for a, m, v in indices_banco}

        meses_necessarios = set()
        atual = data_inicio_busca
        while atual <= ultimo_dia_mes_anterior:
            meses_necessarios.add((atual.year, atual.month))
            atual += relativedelta(months=1)

        meses_faltando = meses_necessarios - meses_banco

        if meses_faltando:
            data_ini_str = data_inicio_busca.strftime('%d/%m/%Y')
            data_fim_str = ultimo_dia_mes_anterior.strftime('%d/%m/%Y')
            url = f'https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados?formato=json&dataInicial={data_ini_str}&dataFinal={data_fim_str}'
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            dados_api = response.json()
            for item in dados_api:
                dia, mes, ano = item['data'].split('/')
                valor = float(item['valor'].replace(',', '.')) / 100
                salvar_indice_banco('ipca', int(ano), int(mes), valor)
            indices_banco = buscar_indices_periodo('ipca', data_inicio_busca, ultimo_dia_mes_anterior)

        dados = [{'data': f"01/{m:02d}/{a}", 'valor': str(v * 100)} for a, m, v in indices_banco]
        return processar_dados_ipca(dados, inicio_graca, fim_graca)

    except Exception as e:
        return {'indiceipca': 1.0, 'periodo': '', 'temDados': False, 'quantidadeMeses': 0, 'quantidadeMesesForaGraca': 0}


def processar_dados_ipca(dados, inicio_graca, fim_graca):
    def str_para_data(s):
        dia, mes, ano = s.split('/')
        return date(int(ano), int(mes), int(dia))

    data_agosto_2025 = date(2025, 8, 1)

    if not dados:
        return {'indiceipca': 1.0, 'periodo': '', 'temDados': False, 'quantidadeMeses': 0, 'quantidadeMesesForaGraca': 0}

    filtrados = [i for i in dados if str_para_data(i['data']) >= data_agosto_2025]
    valores = [float(i['valor'].replace(',', '.')) for i in filtrados]

    indice = 1.0
    for v in valores:
        indice *= 1 + (v / 100)

    fora_graca = [
        i for i in filtrados
        if not (inicio_graca and fim_graca and inicio_graca <= str_para_data(i['data']) <= fim_graca)
    ]

    periodo = f"{filtrados[0]['data']} a {filtrados[-1]['data']}" if filtrados else ''

    return {
        'indiceipca': indice,
        'periodo': periodo,
        'temDados': len(valores) > 0,
        'quantidadeMeses': len(valores),
        'quantidadeMesesForaGraca': len(fora_graca),
    }

# ====================================
# Juros 2% a.a.
# ====================================

def calcular_juros_2_porcento_aa(quantidade_meses):
    if not quantidade_meses or quantidade_meses <= 0:
        return 0
    return (0.02 / 12) * quantidade_meses

# ====================================
# SELIC pós agosto/2025
# ====================================

def calcular_selic_pos_agosto_2025(data_atualizacao):
    try:
        data_agosto_2025 = date(2025, 8, 1)

        if data_atualizacao <= data_agosto_2025:
            return {
                'indiceSelecionado': 1.0, 'tipoIndice': 'nenhum',
                'indiceSelic': 1.0, 'indiceIpcaMais2': 1.0,
                'selicMaior': False, 'quantidadeMeses': 0, 'periodo': ''
            }

        ultimo_dia_mes_anterior = data_atualizacao.replace(day=1) - timedelta(days=1)
        data_inicio_busca = date(2025, 8, 1)

        # Busca SELIC do banco
        indices_banco = buscar_indices_periodo('selic', data_inicio_busca, ultimo_dia_mes_anterior)
        meses_banco = {(a, m) for a, m, v in indices_banco}

        meses_necessarios = set()
        atual = data_inicio_busca
        while atual <= ultimo_dia_mes_anterior:
            meses_necessarios.add((atual.year, atual.month))
            atual += relativedelta(months=1)

        meses_faltando = meses_necessarios - meses_banco

        if meses_faltando:
            data_ini_str = data_inicio_busca.strftime('%d/%m/%Y')
            data_fim_str = ultimo_dia_mes_anterior.strftime('%d/%m/%Y')
            url = f'https://api.bcb.gov.br/dados/serie/bcdata.sgs.4390/dados?formato=json&dataInicial={data_ini_str}&dataFinal={data_fim_str}'
            resp = requests.get(url, timeout=10)
            resp.raise_for_status()
            for item in resp.json():
                dia, mes, ano = item['data'].split('/')
                valor = float(item['valor'].replace(',', '.')) / 100
                salvar_indice_banco('selic', int(ano), int(mes), valor)
            indices_banco = buscar_indices_periodo('selic', data_inicio_busca, ultimo_dia_mes_anterior)

        indice_selic = 1.0
        for a, m, v in indices_banco:
            indice_selic *= 1 + v

        dados_ipca = calcular_ipca(data_agosto_2025, None, None, data_atualizacao)
        juros_2aa = calcular_juros_2_porcento_aa(dados_ipca['quantidadeMeses'])
        indice_ipca_mais2 = dados_ipca['indiceipca'] * (1 + juros_2aa)

        selic_maior = indice_selic > indice_ipca_mais2
        indice_selecionado = indice_ipca_mais2 if selic_maior else indice_selic
        tipo_indice = 'ipca' if selic_maior else 'selic'

        periodo = f"01/08/2025 a {ultimo_dia_mes_anterior.strftime('%d/%m/%Y')}" if indices_banco else ''

        return {
            'indiceSelecionado': indice_selecionado,
            'tipoIndice': tipo_indice,
            'indiceSelic': indice_selic,
            'indiceIpcaMais2': indice_ipca_mais2,
            'selicMaior': selic_maior,
            'quantidadeMeses': dados_ipca['quantidadeMeses'],
            'periodo': periodo,
            'percentualSelic': round((indice_selic - 1) * 100, 4),
            'percentualIpcaMais2': round((indice_ipca_mais2 - 1) * 100, 4),
            'percentualJuros2AA': round(juros_2aa * 100, 4),
        }

    except Exception as e:
        return {
            'indiceSelecionado': 1.0, 'tipoIndice': 'erro',
            'indiceSelic': 1.0, 'indiceIpcaMais2': 1.0,
            'selicMaior': False, 'quantidadeMeses': 0, 'periodo': ''
        }