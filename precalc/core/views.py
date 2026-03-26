from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from datetime import date
import json
from core.calculos.base import calcular_valores


def index(request):
    return render(request, 'core/index.html')


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

        return JsonResponse(resultado)

    except Exception as e:
        return JsonResponse({'erro': str(e)}, status=500)