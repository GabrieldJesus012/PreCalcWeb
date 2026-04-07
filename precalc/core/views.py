from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from datetime import date
import json
from core.calculos.base import calcular_valores
from core.models import Calculo, CalculoCredor


def index(request):
    return render(request, 'core/index.html')


def historico(request):
    calculos = Calculo.objects.all()[:50]
    return render(request, 'core/historico.html', {'calculos': calculos})


def resultado(request, pk):
    calculo = get_object_or_404(Calculo, pk=pk)
    return render(request, 'core/resultado.html', {
        'calculo': calculo,
        'dados_json': json.dumps(calculo.dados_entrada),
        'resultados_json': json.dumps(calculo.resultado_completo)
    })


@csrf_exempt
def calcular(request):
    if request.method != 'POST':
        return JsonResponse({'erro': 'Método não permitido'}, status=405)

    try:
        dados = json.loads(request.body)
        data_atualizacao = date.today()
        resultado = calcular_valores(dados, data_atualizacao)

        if resultado is None:
            return JsonResponse({'erro': 'Dados inválidos'}, status=400)

        # Valores históricos
        item = dados['valoresPrincipais'][0] if dados.get('valoresPrincipais') else {}
        hist_principal = item.get('valorPrincipal', 0)
        hist_juros = item.get('valorJuros', 0)
        hist_selic = item.get('valorSelic', 0)

        # Salvar cabeçalho
        calculo = Calculo.objects.create(
            numero_processo=dados.get('numProcesso', ''),
            beneficiario=dados.get('beneficiario', ''),
            credor=dados.get('credor', ''),
            natureza=dados.get('natureza', ''),
            ano_orcamento=dados.get('anoOrcamento'),
            tipo_calculo=dados.get('tipoCalculo', ''),
            data_atualizacao=data_atualizacao,
            hist_principal=round(hist_principal, 2),
            hist_juros=round(hist_juros, 2),
            hist_selic=round(hist_selic, 2),
            hist_total=round(hist_principal + hist_juros + hist_selic, 2),
            rra=resultado.get('rraTotal', 0),
            valor_principal=round(resultado.get('valorprincatt', 0), 2),
            valor_juros=round(resultado.get('valorjurosatt', 0), 2),
            valor_selic=round(resultado.get('valorSelicatt', 0), 2),
            valor_total=round(resultado.get('valortotatt', 0), 2),
            tem_herdeiros=resultado.get('temHerdeiros', False),
            tem_honorario_sucumbencial=bool(resultado.get('honorariosSucumbenciais', {}).get('temHonorariosSucumbenciais')),
            tem_pagamentos=len(dados.get('pagamentos', [])) > 0,
            dados_entrada=dados,
            resultado_completo=resultado
        )

        resultado['_id'] = calculo.pk
        return JsonResponse(resultado)

    except Exception as e:
        return JsonResponse({'erro': str(e)}, status=500)


@csrf_exempt
def salvar_credores(request):
    if request.method != 'POST':
        return JsonResponse({'erro': 'Método não permitido'}, status=405)

    try:
        dados = json.loads(request.body)
        calculo_id = dados.get('calculo_id')
        credores_lista = dados.get('credores', [])

        calculo = Calculo.objects.get(pk=calculo_id)
        calculo.credores.all().delete()

        credores = []
        for p in credores_lista:
            nome = p.get('credor', '')
            valor_bruto = round(p.get('valorDevido', 0), 2)
            if valor_bruto <= 0:
                continue

            # Detectar tipo pelo nome
            if 'Beneficiário' in nome:
                tipo = 'beneficiario'
            elif '(Herdeiro)' in nome:
                tipo = 'herdeiro'
            elif 'Adv. Sucumb' in nome or 'Sucumbencial' in nome:
                tipo = 'advogado_suc'
            elif 'Advogado' in nome:
                tipo = 'advogado'
            elif 'Sindicato' in nome:
                tipo = 'sindicato'
            elif 'Cessionário' in nome:
                tipo = 'cessionario_ben'
            else:
                tipo = 'beneficiario'

            credores.append(CalculoCredor(
                calculo=calculo,
                nome=nome,
                tipo=tipo,
                valor_bruto=valor_bruto,
                valor_previdencia=round(p.get('previdencia', 0), 2),
                valor_ir=round(p.get('ir', 0), 2),
                valor_liquido=round(p.get('valorLiquido', 0), 2)
            ))

        CalculoCredor.objects.bulk_create(credores)
        return JsonResponse({'ok': True, 'total': len(credores)})

    except Exception as e:
        return JsonResponse({'erro': str(e)}, status=500)