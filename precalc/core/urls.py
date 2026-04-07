from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('calcular/', views.calcular, name='calcular'),
    path('salvar-credores/', views.salvar_credores, name='salvar_credores'),
    path('historico/', views.historico, name='historico'),
    path('resultado/<int:pk>/', views.resultado, name='resultado'),
]