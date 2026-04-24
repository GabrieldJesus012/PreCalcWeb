# core/management/commands/importar_processos.py
import csv
from datetime import datetime
from django.core.management.base import BaseCommand
from core.models import Processo


class Command(BaseCommand):
    help = 'Importa processos do CSV para o banco de dados'

    def add_arguments(self, parser):
        parser.add_argument('arquivo', type=str, help='Caminho para o CSV')

    def handle(self, *args, **kwargs):
        arquivo = kwargs['arquivo']
        count = 0
        erros = 0

        with open(arquivo, encoding='utf-8-sig') as f:
            reader = csv.DictReader(f, delimiter=';')
            for row in reader:
                try:
                    numero = row.get('PRECATÓRIO Nº:', '').strip()
                    if not numero:
                        continue

                    # Data base
                    data_base_str = row.get('Data do Cálculo Homologado', '').strip()
                    data_base = None
                    if data_base_str:
                        try:
                            data_base = datetime.strptime(data_base_str, '%d/%m/%Y').date()
                        except:
                            pass

                    # Valores monetários
                    def parse_valor(v):
                        if not v:
                            return None
                        v = v.strip().replace('R$', '').replace('.', '').replace(',', '.').strip()
                        try:
                            return float(v)
                        except:
                            return None

                    # RRA
                    rra_str = row.get('RRA', '').strip()
                    rra = None
                    if rra_str:
                        try:
                            rra = int(rra_str)
                        except:
                            pass

                    Processo.objects.update_or_create(
                        numero=numero,
                        defaults={
                            'beneficiario': row.get('EXEQUENTE:', '').strip(),
                            'credor': row.get('EXECUTADO:', '').strip(),
                            'natureza': row.get('NATUREZA', '').strip().lower(),
                            'ano_orcamento': int(row.get('P. ORÇAMENTO', 0) or 0),
                            'data_base': data_base,
                            'valor_principal': parse_valor(row.get('Principal Atualizado')),
                            'valor_juros': parse_valor(row.get('Juros Atualizado')),
                            'dados_extras': {'rra': rra},
                        }
                    )
                    count += 1
                except Exception as e:
                    erros += 1
                    self.stdout.write(self.style.WARNING(f'Erro na linha: {e}'))

        self.stdout.write(self.style.SUCCESS(f'✅ {count} processos importados, {erros} erros'))