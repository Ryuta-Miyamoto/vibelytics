from django.urls import path
from . import views

urlpatterns = [
    path('me', views.me, name='me'),
    path('top-tracks', views.top_tracks, name='top_tracks'),
    path('top-artists', views.top_artists, name='top_artists'),
]
