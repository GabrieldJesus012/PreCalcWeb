import requests
from datetime import date
from dateutil.relativedelta import relativedelta
from django.core.management.base import BaseCommand
from core.models import IndiceMonetario


class Command(BaseCommand):
    help = 'Atualiza índices monetários com os meses mais recentes'

    SERIES = {
        'ipca': (433, 8, 2025),
        'ipca_e': (10764, 11, 2021),
        'selic': (4390, 11, 2021),
    }

    def handle(self, *args, **kwargs):
        hoje = date.today()
        ultimo_mes = date(hoje.year, hoje.month, 1) - relativedelta(days=1)

        for tipo, (serie, mes_ini, ano_ini) in self.SERIES.items():
            self.stdout.write(f'Atualizando {tipo}...')
            
            # Último mês que temos no banco
            ultimo_banco = IndiceMonetario.objects.filter(tipo=tipo).order_by('-ano', '-mes').first()
            
            if ultimo_banco:
                data_inicio = date(ultimo_banco.ano, ultimo_banco.mes, 1) + relativedelta(months=1)
            else:
                data_inicio = date(ano_ini, mes_ini, 1)

            if data_inicio > ultimo_mes:
                self.stdout.write(f'  {tipo}: já atualizado até {ultimo_banco.mes:02d}/{ultimo_banco.ano}')
                continue

            data_ini_str = data_inicio.strftime('%d/%m/%Y')
            data_fim_str = ultimo_mes.strftime('%d/%m/%Y')
            url = f'https://api.bcb.gov.br/dados/serie/bcdata.sgs.{serie}/dados?formato=json&dataInicial={data_ini_str}&dataFinal={data_fim_str}'

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
                self.stdout.write(self.style.SUCCESS(f'  {tipo}: {count} novos registros'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  Erro em {tipo}: {e}'))

        self.stdout.write(self.style.SUCCESS('✅ Índices atualizados!'))