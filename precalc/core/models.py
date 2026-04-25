from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class Calculo(models.Model):
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='calculos')
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
    
class Feedback(models.Model):
    TIPOS = [
        ('bug', 'Bug / Erro'),
        ('melhoria', 'Sugestão de Melhoria'),
        ('duvida', 'Dúvida'),
    ]

    tipo = models.CharField(max_length=20, choices=TIPOS)
    descricao = models.TextField()
    nome_usuario = models.CharField(max_length=200, blank=True)
    numero_processo = models.CharField(max_length=100, blank=True)
    calculo = models.ForeignKey(Calculo, on_delete=models.SET_NULL, null=True, blank=True)
    data_envio = models.DateTimeField(auto_now_add=True)
    resolvido = models.BooleanField(default=False)

    class Meta:
        ordering = ['-data_envio']
        verbose_name = 'Feedback'
        verbose_name_plural = 'Feedbacks'

    def __str__(self):
        return f"{self.get_tipo_display()} - {self.data_envio.strftime('%d/%m/%Y')}"
    
    
class IndiceMonetario(models.Model):
    TIPOS = [
        ('ipca', 'IPCA'),
        ('ipca_e', 'IPCA-E'),
        ('selic', 'SELIC'),
        ('cnj', 'CNJ/JE'),
        ('juros_mora_alimentar', 'Juros de Mora Alimentar'),
        ('juros_mora_comum', 'Juros de Mora Comum'),
    ]

    tipo = models.CharField(max_length=25, choices=TIPOS)
    ano = models.IntegerField()
    mes = models.IntegerField()  # 1-12
    valor = models.DecimalField(max_digits=12, decimal_places=8)  # percentual mensal ex: 0.00412

    class Meta:
        unique_together = ('tipo', 'ano', 'mes')
        ordering = ['tipo', 'ano', 'mes']
        verbose_name = 'Índice Monetário'
        verbose_name_plural = 'Índices Monetários'

    def __str__(self):
        return f"{self.get_tipo_display()} {self.mes:02d}/{self.ano}: {self.valor}"


class Processo(models.Model):
    numero = models.CharField(max_length=100, unique=True)
    beneficiario = models.CharField(max_length=200, blank=True)
    credor = models.CharField(max_length=200, blank=True)
    natureza = models.CharField(max_length=20, blank=True)
    ano_orcamento = models.IntegerField(null=True, blank=True)
    data_base = models.DateField(null=True, blank=True)
    valor_principal = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    valor_juros = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    dados_extras = models.JSONField(default=dict, blank=True)  # outros campos do CSV
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['numero']
        verbose_name = 'Processo'
        verbose_name_plural = 'Processos'

    def __str__(self):
        return f"{self.numero} - {self.beneficiario}"
    
class PerfilUsuario(models.Model):
    PERFIS = [
        ('admin', 'Administrador'),
        ('contador_tjpi', 'Contador TJPI'),
        ('usuario_padrao', 'Usuário Padrão'),
    ]

    usuario = models.OneToOneField(User, on_delete=models.CASCADE, related_name='perfil')
    perfil = models.CharField(max_length=20, choices=PERFIS, default='usuario_padrao')
    calculos_mes = models.IntegerField(default=0)  # contador mensal
    mes_referencia = models.DateField(null=True, blank=True)  # mês do contador

    class Meta:
        verbose_name = 'Perfil de Usuário'
        verbose_name_plural = 'Perfis de Usuários'

    def __str__(self):
        return f"{self.usuario.username} — {self.get_perfil_display()}"

    def pode_calcular(self):
        if self.perfil in ('admin', 'contador_tjpi'):
            return True
        # Usuário padrão — verifica limite mensal
        from datetime import date
        hoje = date.today()
        mes_atual = date(hoje.year, hoje.month, 1)
        if self.mes_referencia != mes_atual:
            self.calculos_mes = 0
            self.mes_referencia = mes_atual
            self.save()
        return self.calculos_mes < 5

    def pode_buscar_processo(self):
        return self.perfil in ('admin', 'contador_tjpi')

    def registrar_calculo(self):
        from datetime import date
        hoje = date.today()
        mes_atual = date(hoje.year, hoje.month, 1)
        if self.mes_referencia != mes_atual:
            self.calculos_mes = 0
            self.mes_referencia = mes_atual
        self.calculos_mes += 1
        self.save()

@receiver(post_save, sender=User)
def criar_perfil_usuario(sender, instance, created, **kwargs):
    if created:
        PerfilUsuario.objects.create(usuario=instance)
