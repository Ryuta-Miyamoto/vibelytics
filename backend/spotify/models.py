from django.db import models
from django.contrib.auth.models import User


class SpotifyToken(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='spotify_token')
    access_token = models.TextField()
    refresh_token = models.TextField(blank=True)
    expires_at = models.DateTimeField()

    def __str__(self):
        return f"SpotifyToken({self.user.username})"
