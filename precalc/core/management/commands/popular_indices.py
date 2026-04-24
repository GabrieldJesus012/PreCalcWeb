import requests
from datetime import date
from dateutil.relativedelta import relativedelta
from django.core.management.base import BaseCommand
from core.models import IndiceMonetario
from core.calculos.indices import INDICES_CNJ, PERIODOS_JUROS, MESES


class Command(BaseCommand):
    help = 'Popula índices monetários no banco de dados'

    def handle(self, *args, **kwargs):
        self.popular_cnj()
        self.popular_juros_mora()
        self.popular_api('ipca_e', 10764, 11, 2021)
        self.popular_api('selic', 4390, 11, 2021)
        self.popular_api('ipca', 433, 8, 2025)
        self.stdout.write(self.style.SUCCESS('✅ Todos os índices importados!'))

    def popular_cnj(self):
        self.stdout.write('Importando CNJ...')
        count = 0
        meses_nomes = {v: k for k, v in MESES.items()}
        for chave, valor in INDICES_CNJ.items():
            # chave = "janeiro-2021"
            partes = chave.rsplit('-', 1)
            nome_mes = partes[0]
            ano = int(partes[1])
            mes = MESES.get(nome_mes, 0)
            if mes == 0:
                continue
            IndiceMonetario.objects.update_or_create(
                tipo='cnj', ano=ano, mes=mes,
                defaults={'valor': valor}
            )
            count += 1
        self.stdout.write(f'  CNJ: {count} registros')

    def popular_juros_mora(self):
        self.stdout.write('Importando Juros de Mora...')
        count = 0
        for periodo in PERIODOS_JUROS:
            mes_ini, ano_ini, mes_fim, ano_fim, juro_alim, juro_comum = periodo
            atual = date(ano_ini, mes_ini, 1)
            fim = date(ano_fim, mes_fim, 1)
            while atual <= fim:
                IndiceMonetario.objects.update_or_create(
                    tipo='juros_mora_alimentar', ano=atual.year, mes=atual.month,
                    defaults={'valor': juro_alim / 100}
                )
                IndiceMonetario.objects.update_or_create(
                    tipo='juros_mora_comum', ano=atual.year, mes=atual.month,
                    defaults={'valor': juro_comum / 100}
                )
                atual += relativedelta(months=1)
                count += 1
        self.stdout.write(f'  Juros de Mora: {count} registros')

    def popular_api(self, tipo, serie, mes_ini, ano_ini):
        self.stdout.write(f'Importando {tipo} da API BCB...')
        data_ini = date(ano_ini, mes_ini, 1).strftime('%d/%m/%Y')
        hoje = date.today()
        data_fim = date(hoje.year, hoje.month, 1) - relativedelta(days=1)
        data_fim_str = data_fim.strftime('%d/%m/%Y')

        url = f'https://api.bcb.gov.br/dados/serie/bcdata.sgs.{serie}/dados?formato=json&dataInicial={data_ini}&dataFinal={data_fim_str}'
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            dados = response.json()
            count = 0
            for item in dados:
                dia, mes, ano = item['data'].split('/')
                valor = float(item['valor'].replace(',', '.')) / 100
                IndiceMonetario.objects.update_or_create(
                    tipo=tipo, ano=int(ano), mes=int(mes),
                    defaults={'valor': valor}
                )
                count += 1
            self.stdout.write(f'  {tipo}: {count} registros')
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'  Erro em {tipo}: {e}'))