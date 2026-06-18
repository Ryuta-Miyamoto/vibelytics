from django.urls import path
from . import views

urlpatterns = [
    path('taste-profile', views.taste_profile, name='taste-profile'),
]
