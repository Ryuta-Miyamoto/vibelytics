from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('auth/spotify/', include('spotify.urls')),
    path('auth/', include('spotify.auth_urls')),
    path('api/', include('spotify.api_urls')),
    path('api/', include('chat.urls')),
    path('api/ml/', include('ml.urls')),
]
