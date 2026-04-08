from django.contrib import admin
from django.db.models import Sum
from core.models import Calculo, CalculoCredor


class CalculoCredorInline(admin.TabularInline):
    model = CalculoCredor
    extra = 0
    readonly_fields = ['nome', 'tipo', 'cedente', 'valor_bruto', 'valor_previdencia', 'valor_ir', 'valor_liquido']
    can_delete = False


@admin.register(Calculo)
class CalculoAdmin(admin.ModelAdmin):
    list_display = ['numero_processo', 'beneficiario', 'natureza', 'tipo_calculo', 'valor_total_fmt', 'total_pago', 'data_calculo']
    list_filter = ['natureza', 'tipo_calculo', 'tem_herdeiros', 'tem_honorario_sucumbencial', 'data_calculo']
    search_fields = ['numero_processo', 'beneficiario', 'credor']
    readonly_fields = ['data_calculo', 'dados_entrada', 'resultado_completo']
    inlines = [CalculoCredorInline]

    
    def valor_total_fmt(self, obj):
        if obj.valor_total is None:
            return '-'
        return f'R$ {obj.valor_total:,.2f}'.replace(',', 'X').replace('.', ',').replace('X', '.')
    valor_total_fmt.short_description = 'Total Atualizado'

    def total_pago(self, obj):
        total = obj.credores.aggregate(Sum('valor_bruto'))['valor_bruto__sum'] or 0
        return f'R$ {total:,.2f}'.replace(',', 'X').replace('.', ',').replace('X', '.')
    total_pago.short_description = 'Total Pago (Bruto)'

@admin.register(CalculoCredor)
class CalculoCredorAdmin(admin.ModelAdmin):
    list_display = ['nome', 'tipo', 'cedente', 'valor_bruto', 'valor_ir', 'valor_liquido', 'calculo']
    list_filter = ['tipo']
    search_fields = ['nome', 'cedente', 'calculo__numero_processo']