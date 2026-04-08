from django.db import models


class Calculo(models.Model):
    # Identificação
    numero_processo = models.CharField(max_length=100, blank=True)
    beneficiario = models.CharField(max_length=200, blank=True)
    credor = models.CharField(max_length=200, blank=True)
    natureza = models.CharField(max_length=20, blank=True)
    ano_orcamento = models.IntegerField(null=True, blank=True)
    tipo_calculo = models.CharField(max_length=20, blank=True)
    data_atualizacao = models.DateField(null=True, blank=True)
    data_calculo = models.DateTimeField(auto_now_add=True)
    data_base = models.DateField(null=True, blank=True)
    

    # Valores históricos
    hist_principal = models.DecimalField(max_digits=15, decimal_places=2, null=True)
    hist_juros = models.DecimalField(max_digits=15, decimal_places=2, null=True)
    hist_selic = models.DecimalField(max_digits=15, decimal_places=2, null=True)
    hist_total = models.DecimalField(max_digits=15, decimal_places=2, null=True)
    rra = models.DecimalField(max_digits=8, decimal_places=1, null=True)
    
    indice_total = models.DecimalField(max_digits=10, decimal_places=6, null=True, blank=True)

    # Valores atualizados
    valor_principal = models.DecimalField(max_digits=15, decimal_places=2, null=True)
    valor_juros = models.DecimalField(max_digits=15, decimal_places=2, null=True)
    valor_selic = models.DecimalField(max_digits=15, decimal_places=2, null=True)
    valor_total = models.DecimalField(max_digits=15, decimal_places=2, null=True)

    # Flags
    tem_herdeiros = models.BooleanField(default=False)
    tem_honorario_sucumbencial = models.BooleanField(default=False)
    tem_pagamentos = models.BooleanField(default=False)

    # Dados completos
    dados_entrada = models.JSONField()
    resultado_completo = models.JSONField()

    class Meta:
        ordering = ['-data_calculo']
        verbose_name = 'Cálculo'
        verbose_name_plural = 'Cálculos'

    def __str__(self):
        return f"{self.numero_processo} - {self.beneficiario} ({self.data_calculo.strftime('%d/%m/%Y')})"


class CalculoCredor(models.Model):
    TIPOS = [
        ('beneficiario', 'Beneficiário'),
        ('herdeiro', 'Herdeiro'),
        ('advogado', 'Advogado Contratual'),
        ('advogado_suc', 'Advogado Sucumbencial'),
        ('sindicato', 'Sindicato'),
        ('cessionario_ben', 'Cessionário do Beneficiário'),
        ('cessionario_adv', 'Cessionário de Advogado'),
        ('cessionario_adv_suc', 'Cessionário de Adv. Sucumbencial'),
        ('cessionario_sind', 'Cessionário de Sindicato'),
        ('cessionario_herd', 'Cessionário de Herdeiro'),
    ]

    calculo = models.ForeignKey(Calculo, on_delete=models.CASCADE, related_name='credores')
    nome = models.CharField(max_length=200)
    tipo = models.CharField(max_length=30, choices=TIPOS)
    cedente = models.CharField(max_length=200, blank=True)  # para cessionários

    valor_bruto = models.DecimalField(max_digits=15, decimal_places=2, null=True)
    valor_previdencia = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    valor_ir = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    valor_liquido = models.DecimalField(max_digits=15, decimal_places=2, null=True)

    class Meta:
        ordering = ['tipo', 'nome']
        verbose_name = 'Credor'
        verbose_name_plural = 'Credores'

    def __str__(self):
        return f"{self.nome} ({self.get_tipo_display()})"