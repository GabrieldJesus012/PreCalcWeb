from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from datetime import date
import json
from core.calculos.base import calcular_valores
from core.models import Calculo, CalculoCredor
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect

@login_required
def index(request):
    return render(request, 'core/index.html')

@login_required
def historico(request):
    # Usuário padrão não acessa
    try:
        if request.user.perfil.perfil == 'usuario_padrao':
            return redirect('index')
    except:
        pass
    
    calculos = Calculo.objects.select_related('usuario').all()

    processo = request.GET.get('processo', '')
    beneficiario = request.GET.get('beneficiario', '')
    credor = request.GET.get('credor', '')
    natureza = request.GET.get('natureza', '')
    tipo_calculo = request.GET.get('tipo_calculo', '')
    valor_min = request.GET.get('valor_min', '')
    valor_max = request.GET.get('valor_max', '')
    data_ini = request.GET.get('data_ini', '')
    data_fim = request.GET.get('data_fim', '')
    usuario_filtro = request.GET.get('usuario', '')

    if processo:
        calculos = calculos.filter(numero_processo__icontains=processo)
    if beneficiario:
        calculos = calculos.filter(beneficiario__icontains=beneficiario)
    if credor:
        calculos = calculos.filter(credor__icontains=credor)
    if natureza:
        calculos = calculos.filter(natureza=natureza)
    if tipo_calculo:
        calculos = calculos.filter(tipo_calculo=tipo_calculo)
    if valor_min:
        try:
            calculos = calculos.filter(valor_total__gte=float(valor_min))
        except ValueError:
            pass
    if valor_max:
        try:
            calculos = calculos.filter(valor_total__lte=float(valor_max))
        except ValueError:
            pass
    if data_ini:
        calculos = calculos.filter(data_calculo__date__gte=data_ini)
    if data_fim:
        calculos = calculos.filter(data_calculo__date__lte=data_fim)
    if usuario_filtro:
        calculos = calculos.filter(usuario__username__icontains=usuario_filtro)
    
    # Lista de usuários para o filtro
    from django.contrib.auth.models import User
    usuarios = User.objects.filter(calculos__isnull=False).distinct()

    return render(request, 'core/historico.html', {
        'calculos': calculos[:100],
        'total': calculos.count(),
        'filtros': request.GET,
        'usuarios': usuarios,
    })

def formatar_moeda(valor):
    if not valor:
        return 'R$ 0,00'
    try:
        num = float(valor)
        return f'R$ {num:,.2f}'.replace(',', 'X').replace('.', ',').replace('X', '.')
    except:
        return 'R$ 0,00'

def formatar_data_graca(data_str):
    if not data_str:
        return ''
    try:
        from datetime import datetime
        d = datetime.strptime(data_str, '%Y-%m-%d')
        meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
        return f"{meses[d.month-1]}/{d.year}"
    except:
        return data_str

@login_required
def resultado(request, pk):
    calculo = get_object_or_404(Calculo, pk=pk)
    dados = calculo.dados_entrada
    resultados = calculo.resultado_completo
    
    hist_principal = float(calculo.hist_principal or 0)
    hist_juros = float(calculo.hist_juros or 0)
    hist_total = float(calculo.hist_total or 0)
    
    indice_principal = round(float(calculo.valor_principal) / hist_principal, 6) if hist_principal else 1
    indice_juros = round(float(calculo.valor_juros) / hist_juros, 6) if hist_juros else 1
    indice_total = round(float(calculo.valor_total) / hist_total, 6) if hist_total else 1

    return render(request, 'core/resultado.html', {
        'calculo': calculo,
        'dados': dados,
        'resultados': resultados,
        'data_atual': calculo.data_atualizacao.strftime('%d/%m/%Y'),
        'indice_principal': indice_principal,
        'indice_juros': indice_juros,
        'indice_total': indice_total,
        'inicio_graca': formatar_data_graca(resultados.get('inicioGraca', '')),
        'fim_graca': formatar_data_graca(resultados.get('fimGraca', '')),
        'dados_json': json.dumps(dados),
        'resultados_json': json.dumps(resultados)
    })

def carregar(request, pk):
    calculo = get_object_or_404(Calculo, pk=pk)
    dados = calculo.dados_entrada.copy()
    dados['dataAtualizacao'] = calculo.data_atualizacao.strftime('%Y-%m-%d') if calculo.data_atualizacao else ''
    return JsonResponse(dados)

@login_required
@csrf_exempt
def calcular(request):
    if request.method != 'POST':
        return JsonResponse({'erro': 'Método não permitido'}, status=405)
    
    # Verificar perfil
    try:
        perfil = request.user.perfil
        if not perfil.pode_calcular():
            return JsonResponse({'erro': 'Limite de 5 cálculos mensais atingido. Faça upgrade para continuar.'}, status=403)
    except:
        pass  # Se não tem perfil, permite calcular

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
        
        # Data base
        data_base = None
        if item.get('mesBase') and item.get('anoBase'):
            meses_map = {
                'janeiro': 1, 'fevereiro': 2, 'março': 3, 'abril': 4,
                'maio': 5, 'junho': 6, 'julho': 7, 'agosto': 8,
                'setembro': 9, 'outubro': 10, 'novembro': 11, 'dezembro': 12
            }
            mes_num = meses_map.get(item.get('mesBase', '').lower(), 1)
            data_base = date(item.get('anoBase', 2000), mes_num, 1)

        # Salvar cabeçalho
        calculo = Calculo.objects.create(
            usuario=request.user, 
            numero_processo=dados.get('numProcesso', ''),
            beneficiario=dados.get('beneficiario', ''),
            credor=dados.get('credor', ''),
            natureza=dados.get('natureza', ''),
            ano_orcamento=dados.get('anoOrcamento'),
            tipo_calculo=dados.get('tipoCalculo', ''),
            data_atualizacao=data_atualizacao,
            data_base=data_base,
            indice_total=round(resultado.get('indiceTotal', 0), 6),
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
        
        # Registrar cálculo no perfil
        try:
            request.user.perfil.registrar_calculo()
        except:
            pass

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

@csrf_exempt
def feedback(request):
    if request.method != 'POST':
        return JsonResponse({'erro': 'Método não permitido'}, status=405)
    
    try:
        dados = json.loads(request.body)
        from core.models import Feedback
        
        calculo = None
        calculo_id = dados.get('calculo_id')
        if calculo_id:
            try:
                calculo = Calculo.objects.get(pk=calculo_id)
            except Calculo.DoesNotExist:
                pass

        Feedback.objects.create(
            tipo=dados.get('tipo', 'bug'),
            descricao=dados.get('descricao', ''),
            numero_processo=dados.get('numero_processo', ''),
            nome_usuario=dados.get('nome_usuario', ''),
            calculo=calculo
        )
        return JsonResponse({'ok': True})
    except Exception as e:
        return JsonResponse({'erro': str(e)}, status=500)

@login_required
def buscar_processo(request):
    # Verificar perfil
    try:
        if not request.user.perfil.pode_buscar_processo():
            return JsonResponse({'erro': 'Sem permissão para buscar processos.'}, status=403)
    except:
        pass
    
    numero = request.GET.get('numero', '').strip()
    if not numero:
        return JsonResponse({'erro': 'Número não informado'}, status=400)
    
    try:
        from core.models import Processo
        p = Processo.objects.get(numero=numero)
        return JsonResponse({
            'numero': p.numero,
            'exequente': p.beneficiario,
            'executado': p.credor,
            'natureza': p.natureza,
            'orcamento': str(p.ano_orcamento) if p.ano_orcamento else '',
            'dataCalculo': p.data_base.strftime('%d/%m/%Y') if p.data_base else '',
            'principal': str(p.valor_principal).replace('.', ',') if p.valor_principal else '',
            'juros': str(p.valor_juros).replace('.', ',') if p.valor_juros else '',
            'rra': str(p.dados_extras.get('rra', '')) if p.dados_extras else '',
        })
    except Processo.DoesNotExist:
        return JsonResponse({'erro': 'Processo não encontrado'}, status=404)
    
def login_view(request):
    if request.user.is_authenticated:
        return redirect('index')
    
    erro = None
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user:
            login(request, user)
            return redirect('index')
        else:
            erro = 'Usuário ou senha incorretos'
    
    return render(request, 'core/login.html', {'erro': erro})


def logout_view(request):
    logout(request)
    return redirect('login')

