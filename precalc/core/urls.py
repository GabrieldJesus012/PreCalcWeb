from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('calcular/', views.calcular, name='calcular'),
]