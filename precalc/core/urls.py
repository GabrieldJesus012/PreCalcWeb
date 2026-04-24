from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('calcular/', views.calcular, name='calcular'),
    path('salvar-credores/', views.salvar_credores, name='salvar_credores'),
    path('historico/', views.historico, name='historico'),
    path('resultado/<int:pk>/', views.resultado, name='resultado'),
    path('carregar/<int:pk>/', views.carregar, name='carregar'),
    path('feedback/', views.feedback, name='feedback'),
    path('buscar-processo/', views.buscar_processo, name='buscar_processo'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
]