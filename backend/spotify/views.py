import urllib.parse
import requests
from django.conf import settings
from django.shortcuts import redirect
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize'
SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'
SPOTIFY_API_BASE = 'https://api.spotify.com/v1'

SCOPES = 'user-read-private user-read-email user-top-read user-read-recently-played'

FRONTEND_BASE = 'http://127.0.0.1:5173'


@api_view(['GET'])
@permission_classes([AllowAny])
def spotify_login(request):
    params = urllib.parse.urlencode({
        'client_id': settings.SPOTIFY_CLIENT_ID,
        'response_type': 'code',
        'redirect_uri': settings.SPOTIFY_REDIRECT_URI,
        'scope': SCOPES,
    })
    return redirect(f"{SPOTIFY_AUTH_URL}?{params}")


@api_view(['GET'])
@permission_classes([AllowAny])
def spotify_callback(request):
    code = request.GET.get('code')
    error = request.GET.get('error')

    if error or not code:
        return redirect(f'{FRONTEND_BASE}/login?error=access_denied')

    response = requests.post(SPOTIFY_TOKEN_URL, data={
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': settings.SPOTIFY_REDIRECT_URI,
        'client_id': settings.SPOTIFY_CLIENT_ID,
        'client_secret': settings.SPOTIFY_CLIENT_SECRET,
    })

    if response.status_code != 200:
        return redirect(f'{FRONTEND_BASE}/login?error=token_error')

    token_data = response.json()
    access_token = token_data['access_token']

    # Pass token to frontend via URL parameter; frontend stores it in localStorage
    return redirect(f'{FRONTEND_BASE}/dashboard?token={access_token}')


@api_view(['GET'])
@permission_classes([AllowAny])
def logout(request):
    return redirect(f'{FRONTEND_BASE}/login')


def _get_token(request) -> str | None:
    """Extract Spotify access token from Authorization header."""
    auth = request.headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        return auth[7:]
    return None


def _spotify_get(token: str, path: str, params: dict | None = None):
    response = requests.get(
        f'{SPOTIFY_API_BASE}{path}',
        headers={'Authorization': f'Bearer {token}'},
        params=params or {},
    )
    return response


@api_view(['GET'])
@permission_classes([AllowAny])
def me(request):
    token = _get_token(request)
    if not token:
        return JsonResponse({'error': 'Not authenticated'}, status=401)

    response = _spotify_get(token, '/me')

    if response.status_code == 401:
        return JsonResponse({'error': 'Token expired'}, status=401)

    return JsonResponse(response.json())


@api_view(['GET'])
@permission_classes([AllowAny])
def top_tracks(request):
    token = _get_token(request)
    if not token:
        return JsonResponse({'error': 'Not authenticated'}, status=401)

    response = _spotify_get(token, '/me/top/tracks', {
        'limit': request.GET.get('limit', 10),
        'time_range': request.GET.get('time_range', 'medium_term'),
    })

    if response.status_code == 401:
        return JsonResponse({'error': 'Token expired'}, status=401)

    items = response.json().get('items', [])
    total = len(items)
    tracks = [
        {
            'id': item.get('id', ''),
            'name': item.get('name', ''),
            'artist': item['artists'][0]['name'] if item.get('artists') else '',
            'popularity': item.get('popularity', 0),
            'rank': idx + 1,
            # Rank score: #1 → 100, #2 → 90 … used when popularity is unavailable
            'rank_score': round((total - idx) / total * 100),
            'album': item.get('album', {}).get('name', ''),
        }
        for idx, item in enumerate(items)
    ]
    return JsonResponse({'items': tracks})


@api_view(['GET'])
@permission_classes([AllowAny])
def top_artists(request):
    token = _get_token(request)
    if not token:
        return JsonResponse({'error': 'Not authenticated'}, status=401)

    response = _spotify_get(token, '/me/top/artists', {
        'limit': request.GET.get('limit', 10),
        'time_range': request.GET.get('time_range', 'medium_term'),
    })

    if response.status_code == 401:
        return JsonResponse({'error': 'Token expired'}, status=401)

    items = response.json().get('items', [])
    total = len(items)
    artists = [
        {
            'id': item.get('id', ''),
            'name': item.get('name', ''),
            'genres': item.get('genres', []),
            'popularity': item.get('popularity', 0),
            'rank': idx + 1,
            'rank_score': round((total - idx) / total * 100),
        }
        for idx, item in enumerate(items)
    ]
    return JsonResponse({'items': artists})
