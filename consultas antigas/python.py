import pandas as pd
import os
from datetime import datetime, timedelta
import requests

print("-="*40)
anoorc = int(input("Digite o Ano do seu Orçamento: "))

#Periodo de Graça
if anoorc <= 2022:
    inicio_graca = datetime(anoorc - 1, 7, 1)  # julho do ano anterior
else:
    inicio_graca = datetime(anoorc - 1, 4, 1)  # abril do ano anterior
fim_graca = datetime(anoorc, 12, 31)

beneficiario = str(input("Beneficiário: ")).strip().capitalize()
mesbase = str(input("Digite o Mês (ex: janeiro): ")).strip().lower()
anobase = int(input("Digite o Ano (ex: 2025): "))
valorprin = float(input("Digite o valor do principal: "))
valorjuros = float(input("Digite o valor do juros: "))
natureza = str(input("Natureza da ação: [Alimentar/Comum]")).strip().lower()[0]
rratotal = int(input("RRA: "))

while natureza not in "ac":
    natureza = str(input("Natureza da ação: [Alimentar/Comum] ")).strip().lower()[0]
print("-="*40)

meses = {
    "janeiro": 1, "fevereiro": 2, "março": 3, "abril": 4,
    "maio": 5, "junho": 6, "julho": 7, "agosto": 8,
    "setembro": 9, "outubro": 10, "novembro": 11, "dezembro": 12
}

while mesbase not in meses:
    print("Mês digitado errado, tente novamente...")
    mesbase = str(input("Digite o Mês: ")).strip().lower()

data_base = datetime(anobase, meses[mesbase], 1)

#Indices CNJ
caminho_gilberto = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'dados', 'CNJJE1221NP.csv'))
if (anobase < 2021) or (anobase == 2021 and meses[mesbase] <= 11):
    df = pd.read_csv(caminho_gilberto, sep=';', header=None, names=['Mes', 'Ano', 'Indice'])
    df['Mes'] = df['Mes'].str.strip().str.lower()
    df['Ano'] = df['Ano'].astype(int)
    df['Indice'] = df['Indice'].str.replace(',', '.').astype(float)
    resultado = df[(df['Mes'] == mesbase) & (df['Ano'] == anobase)]
    if not resultado.empty:
        indice = resultado['Indice'].values[0]
    else:
        indice = 1
else:
    indice = 1
print(f"\n➡️ Índice para {mesbase.capitalize()}/{anobase}: {indice}")

#Juros de Mora
caminho_jurosmora = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'dados', 'JUROSNOVEMBRO2021.csv'))
if (anobase < 2021) or (anobase == 2021 and meses[mesbase] <= 11):
    df = pd.read_csv(caminho_jurosmora, sep=';', header=None, names=['Mes', 'Ano', 'Juros_Alimentar', 'Juros_Comum'])
    df['Mes'] = df['Mes'].str.strip().str.lower()
    df['Ano'] = df['Ano'].astype(int)
    df['Juros_Alimentar'] = df['Juros_Alimentar'].str.replace('%', '').str.replace(',', '.').astype(float)
    df['Juros_Comum'] = df['Juros_Comum'].str.replace('%', '').str.replace(',', '.').astype(float)
    df['Data'] = df.apply(lambda row: datetime(row['Ano'], meses[row['Mes']], 1), axis=1)
    df_filtrado = df[df['Data'] >= data_base]
    df_util = df_filtrado[~df_filtrado['Data'].between(inicio_graca, fim_graca)]
    if natureza == 'a':
        juros_coluna = df_util['Juros_Alimentar']
    else:
        juros_coluna = df_util['Juros_Comum']
    jurosmora = juros_coluna.sum()
    jurosmora = 1+ (jurosmora/100)
else:
    jurosmora = 1
print(f"➡️ Juros somados a partir de {mesbase.capitalize()}/{anobase}, exceto período de graça: {jurosmora:.6f}")

# Descobre a data final como o último dia do mês anterior ao mês atual
hoje = datetime.today()
primeiro_dia_mes_atual = datetime(hoje.year, hoje.month, 1)
ultimo_dia_mes_anterior = primeiro_dia_mes_atual - timedelta(days=1)
data_final = ultimo_dia_mes_anterior.strftime('%d/%m/%Y')

urlselic = f'https://api.bcb.gov.br/dados/serie/bcdata.sgs.4390/dados?formato=json&dataInicial=01/12/2021&dataFinal={data_final}'
urlipca = f'https://api.bcb.gov.br/dados/serie/bcdata.sgs.10764/dados?formato=json&dataInicial=01/12/2021&dataFinal={data_final}'

#Selic
try:
    responseselic = requests.get(urlselic)
    responseselic.raise_for_status()
    dadosselic = responseselic.json()
except Exception as e:
    print(f"Erro ao obter dados da SELIC: {e}")
    dadosselic = []

#IPCA
try:
    responseipca = requests.get(urlipca)
    responseipca.raise_for_status()
    dadosipca = responseipca.json()
except Exception as e:
    print(f"Erro ao obter dados do IPCA: {e}")
    dadosipca = []

# Função para converter string de data da API em datetime
def str_para_data(data_str):
    return datetime.strptime(data_str, '%d/%m/%Y')

# Aplica SELIC antes do início da graça
if data_base < inicio_graca:
    selic_antes_graca = [
        float(item['valor'].replace(',', '.')) 
        for item in dadosselic 
        if data_base <= str_para_data(item['data']) < inicio_graca
    ]
else:
    selic_antes_graca = []

# Aplica SELIC após o fim da graça 
selic_apos_graca = [
    float(item['valor'].replace(',', '.')) 
    for item in dadosselic 
    if str_para_data(item['data']) > fim_graca 
]

# Soma da SELIC
soma_selic = sum(selic_antes_graca) + sum(selic_apos_graca)
indiceselic = 1+(soma_selic/100)

# Aplica IPCA durante a graça
inicio_ipca = max(inicio_graca, data_base)
ipca_graca = [
    float(item['valor'].replace(',', '.')) 
    for item in dadosipca 
    if inicio_graca <= str_para_data(item['data']) <= fim_graca 
]

# Fator acumulado IPCA
indiceipca = 1.0
for valor in ipca_graca:
    indiceipca *= 1 + (valor / 100)

print(f"➡️ Selic acumulada aplicável: {soma_selic:.2f}%")
print(f"➡️ Fator IPCA-e durante período de graça: {indiceipca:.6f}")

#relatorios
print(f"\n📅 Data base utilizada: {data_base.strftime('%d/%m/%Y')}")

print(f"⏳ Início da graça: {inicio_graca.strftime('%d/%m/%Y')}")
print(f"⏳ Fim da graça: {fim_graca.strftime('%d/%m/%Y')}")

print("\n📊 Relatório SELIC antes do início da graça:")
if data_base < inicio_graca:
    print("\n✅ SELIC antes do início da graça está sendo aplicada.")
    print("📊 Relatório SELIC antes do início da graça:")
    for item in dadosselic:
        data = str_para_data(item['data'])
        if data_base <= data < inicio_graca:
            valor = float(item['valor'].replace(',', '.'))
            print(f"Data: {item['data']} - Valor: {valor}%")
else:
    print("\n❌ SELIC antes do início da graça NÃO está sendo aplicada, pois a data base é posterior ao início da graça.")

print("\n📊 Relatório SELIC após o fim da graça:")
for item in dadosselic:
    data = str_para_data(item['data'])
    if data > fim_graca:
        valor = float(item['valor'].replace(',', '.'))
        print(f"Data: {item['data']} - Valor: {valor}%")

print("\n📊 Relatório IPCA durante o período de graça a partir da data base:")
inicio_ipca = max(inicio_graca, data_base)
for item in dadosipca:
    data = str_para_data(item['data'])
    if inicio_ipca <= data <= fim_graca:
        valor = float(item['valor'].replace(',', '.'))
        print(f"Data: {item['data']} - Valor: {valor:.4f}%")
#Final Relatorio

#Calculos
indiceprinc= (indice*indiceselic*indiceipca)
indicejur= (indiceselic*indiceipca)

valorjurosmora = (valorprin*indice*(jurosmora-1))
juros= (valorjurosmora+(valorjuros*indice))

valorprincatt = valorprin*indiceprinc
valorjurosatt = ((juros*indicejur))
valortotatt= valorprincatt + valorjurosatt

percentualprinc = (valorprincatt/valortotatt)
percentualjur= (valorjurosatt/valortotatt)

print("-+"*40)
print(f'Valor principal atualizado: R$ {valorprincatt:.2f}')
print(f'Valor juros atualizado: R$ {valorjurosatt:.2f}')
print(f'Total: R$ {valortotatt:.2f}')
print("-="*40)

#tipo de calculos
tipo_calculo= str(input("Qual o tipo de cálculo? [ORDEM/PREFERÊNCIA/ACORDO] ")).strip().upper()[0]
while tipo_calculo not in ["O", "P", "A"]:
    tipo_calculo= str(input("Qual o tipo de cálculo? [ORDEM/PREFERÊNCIA/ACORDO] ")).strip().upper()[0]
    if tipo_calculo:
        tipo_calculo = tipo_calculo[0]
    else:
        print("Entrada inválida, tente novamente.")
if tipo_calculo=="O":
    valor_base = valortotatt
elif tipo_calculo=="P":
    if natureza=="a":
        tetopref = float(input("Qual o teto de preferência? R$ "))
        valor_base = min(valortotatt,tetopref)
    else:
        print("Preferência só se aplica para natureza alimentar.")
        valor_base=valortotatt
elif tipo_calculo == "A":
    percentual_acordo = float(input("Qual o % do deságio? (EX: 0.2 para 20%)"))
    valor_base= valortotatt*(1-percentual_acordo)
else:
    # Caso aconteça algo não esperado
    valor_base = valortotatt

print()
print(f"valor base calculado: {valor_base:.2f}")
principal = valor_base*percentualprinc
print(f"Principal: R$ {principal:.2f}")
juros = valor_base*percentualjur
print(f'Juros: R$ {juros:.2f}')
print()

#Deduções Legais
#RRA
if rratotal != 0:
    RRAPAGAMENTO = ((valor_base * rratotal) / valortotatt)
else:
    RRAPAGAMENTO = 0

#imposto de renda PF
def calcular_ir(valor_bruto):
    incidencia = ""
    while incidencia not in ["S", "N"]:
        incidencia = input("Há incidência de Imposto de Renda? (S/N): ").strip().upper()
    if incidencia == "N":
        return 0.0, 0.0  
    if valor_bruto <= 2428.80:
        aliquota = 0
        deducao = 0
    elif valor_bruto <= 2826.65:
        aliquota = 0.075
        deducao = 182.16
    elif valor_bruto <= 3751.05:
        aliquota = 0.15
        deducao = 394.16
    elif valor_bruto <= 4664.68:
        aliquota = 0.225
        deducao = 675.49
    else:
        aliquota = 0.275
        deducao = 908.73
    ir = (valor_bruto * aliquota) - deducao
    ir = max(ir, 0)
    return ir, aliquota

#previdencia
def calcular_previdencia(principal, rrapagamento):
    incidencia = ""
    while incidencia not in ["S", "N"]:
        incidencia = input("\nHá incidência de Previdência sobre o beneficiário? (S/N): ").strip().upper()
    if incidencia == "N":
        return 0.0, 0.0  
    tipo = ""
    while tipo not in ["F", "I"]:
        tipo = input("Tipo de previdência: FIXA ou INSS? ").strip().upper()[0]
    if rrapagamento==0:
        base = principal 
    else:
        base = principal / rrapagamento
    if tipo == "F":
        while True:
            try:
                aliquota_fixa = float(input("Informe a alíquota fixa (em decimal, ex: 0.14 para 14%): "))
                break
            except ValueError:
                print("Valor inválido. Tente novamente.")
        valor_previdencia = principal * aliquota_fixa
        aliquota_efetiva = aliquota_fixa
    elif tipo == "I":
        if base <= 1518.00:
            resultado = base * 0.075
        elif base <= 2793.88:
            resultado = 1518 * 0.075 + (base - 1518) * 0.09
        elif base <= 4190.83:
            resultado = 1518 * 0.075 + 1275.88 * 0.09 + (base - 2793.88) * 0.12
        elif base <= 8157.41:
            resultado = 1518 * 0.075 + 1275.88 * 0.09 + 1396.95 * 0.12 + (base - 4190.83) * 0.14
        else:
            resultado = 951.63  # Teto
        valor_previdencia = resultado * rrapagamento
        aliquota_efetiva = resultado / (principal / rrapagamento)
    else:
        raise ValueError("Tipo inválido. Use 'FIXA' ou 'INSS'.")
    return valor_previdencia, aliquota_efetiva

#Deduções Acessórias 
#H.Contratual:
honorarios = []
valor_honorario_total = 0.0
quant_advogados = int(input("Quantos advogados de honorários contratuais? "))
if quant_advogados>0:
    for i in range(quant_advogados):
        print(f"\nAdvogado {i+1}:")
        nome = input("Nome: ").strip().capitalize()
        tipo = ""
        while tipo not in ["PF", "PJ"]:
            tipo = input("Tipo de advogado: PF ou PJ? ").strip().upper()
        
        percentual = float(input("Percentual sobre o valor base (ex: 0.1 para 10%): "))
        valor_honorario = valor_base * percentual
        # Cálculo de IR
        if tipo == "PF":
            ir, aliquota_ir = calcular_ir(valor_honorario)
        else: 
            aliquota_ir = 0.015
            ir = valor_honorario * aliquota_ir
        valor_liquido = valor_honorario - ir
        valor_honorario_total += valor_honorario
        honorarios.append({
            "nome": nome,
            "tipo": tipo,
            "percentual": percentual,
            "valor_bruto": valor_honorario,
            "ir": ir,
            "aliquota_ir": aliquota_ir,
            "valor_liquido": valor_liquido
        })
    # Exibição dos resultados
    print("\n--- Honorários ---")
    for h in honorarios:
        print(f"\nAdvogado: {h['nome']}")
        print(f"Tipo: {h['tipo']}")
        print(f"Percentual: {h['percentual']*100:.2f}%")
        print(f"Valor Bruto: R$ {h['valor_bruto']:.2f}")
        print(f"IR: R$ {h['ir']:.2f}")
        print(f"Alíquota IR: {h['aliquota_ir']*100:.2f}%")
        print(f"Valor Líquido: R$ {h['valor_liquido']:.2f}")
else:
    print("\nNenhum advogado informado. Nenhum cálculo necessário.")
    valor_honorario_total = 0.00

valor_previdencia, aliquota_efetiva = calcular_previdencia(principal, RRAPAGAMENTO)
if RRAPAGAMENTO != 0:
    # Calcula a base do IR com base no percentual total dos honorários
    percentual_totaladv = sum(h["percentual"] for h in honorarios)
    base_ir = (principal - (principal*percentual_totaladv) - valor_previdencia) / RRAPAGAMENTO
    valor_ir_unitario, aliquota_ir = calcular_ir(base_ir)
    valor_ir = valor_ir_unitario * RRAPAGAMENTO
else:
    valor_ir_unitario = 0.0
    valor_ir = 0.0
    aliquota_ir = 0.0

print(f"\n---------------------PAGAMENTO BENEFICIÁRIO---------------------")
print(f'Valor Devido: R$ {(valor_base-valor_honorario_total):.2f}')
print(f'Alíquota Efetiva Previdência: {aliquota_efetiva*100:.2f}%')
print(f'Previdência: R$ {valor_previdencia:.2f}')
print(f'Alíquota IR: {aliquota_ir * 100:.2f}%')
print(f'Imposto de Renda: R$ {valor_ir:.2f}')
print(f'Valor Líquido: R$ {(valor_base - valor_honorario_total - valor_previdencia - valor_ir):.2f}')
print("\n---------------------PAGAMENTO ADVOGADOS---------------------")
for h in honorarios:
    print(f"\nPagamento - Advogado: {h['nome']}")
    print(f"Valor Devido: R$ {h['valor_bruto']:.2f}")
    print(f"Alíquota IR: {h['aliquota_ir'] * 100:.2f}%")
    print(f"Imposto de Renda: R$ {h['ir']:.2f}")
    print(f"Valor Líquido: R$ {h['valor_liquido']:.2f}")
