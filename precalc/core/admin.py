from django.contrib import admin
from core.models import Calculo, CalculoCredor


class CalculoCredorInline(admin.TabularInline):
    model = CalculoCredor
    extra = 0
    readonly_fields = ['nome', 'tipo', 'cedente', 'valor_bruto', 'valor_previdencia', 'valor_ir', 'valor_liquido']
    can_delete = False


@admin.register(Calculo)
class CalculoAdmin(admin.ModelAdmin):
    list_display = ['numero_processo', 'beneficiario', 'natureza', 'tipo_calculo', 'valor_total', 'data_calculo']
    list_filter = ['natureza', 'tipo_calculo', 'tem_herdeiros', 'tem_honorario_sucumbencial', 'data_calculo']
    search_fields = ['numero_processo', 'beneficiario', 'credor']
    readonly_fields = ['data_calculo', 'dados_entrada', 'resultado_completo']
    inlines = [CalculoCredorInline]


@admin.register(CalculoCredor)
class CalculoCredorAdmin(admin.ModelAdmin):
    list_display = ['nome', 'tipo', 'cedente', 'valor_bruto', 'valor_ir', 'valor_liquido', 'calculo']
    list_filter = ['tipo']
    search_fields = ['nome', 'cedente', 'calculo__numero_processo']