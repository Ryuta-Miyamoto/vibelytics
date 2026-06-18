import json
import re
import requests
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from .predictor import build_taste_profile

SPOTIFY_API_BASE = 'https://api.spotify.com/v1'
OLLAMA_URL = 'http://localhost:11434/api/chat'
OLLAMA_MODEL = 'llama3'


def _get_token(request) -> str | None:
    auth = request.headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        return auth[7:]
    return None


def _infer_genres_with_llm(artist_names: list[str]) -> dict[str, list[str]]:
    """Use Ollama to infer music genres for artists that Spotify has no genre data for."""
    prompt = (
        'For each artist below, list their primary music genres (1-3 genres per artist).\n'
        'Return ONLY a JSON object like: {"ArtistName": ["genre1", "genre2"]}\n'
        'Use lowercase English genre names only. Do not include any other text.\n\n'
        f'Artists: {", ".join(artist_names)}'
    )
    try:
        resp = requests.post(
            OLLAMA_URL,
            json={
                'model': OLLAMA_MODEL,
                'messages': [{'role': 'user', 'content': prompt}],
                'stream': False,
            },
            timeout=45,
        )
        if resp.status_code == 200:
            content = resp.json()['message']['content']
            # Extract JSON block from LLM response
            match = re.search(r'\{.*\}', content, re.DOTALL)
            if match:
                data = json.loads(match.group())
                return {k: v for k, v in data.items() if isinstance(v, list)}
    except Exception:
        pass
    return {}


@api_view(['GET'])
@permission_classes([AllowAny])
def taste_profile(request):
    token = _get_token(request)
    if not token:
        return JsonResponse({'error': 'Not authenticated'}, status=401)

    response = requests.get(
        f'{SPOTIFY_API_BASE}/me/top/artists',
        headers={'Authorization': f'Bearer {token}'},
        params={'limit': 20, 'time_range': 'medium_term'},
    )

    if response.status_code == 401:
        return JsonResponse({'error': 'Token expired'}, status=401)
    if response.status_code != 200:
        return JsonResponse({'error': 'Failed to fetch Spotify data'}, status=502)

    items = response.json().get('items', [])
    total = len(items)
    artists = [
        {
            'name': item.get('name', ''),
            'genres': item.get('genres', []),
            'rank_score': round((total - idx) / total * 100) if total else 50,
        }
        for idx, item in enumerate(items)
    ]

    # If Spotify returned no genre data, fall back to Ollama inference
    genre_source = 'spotify'
    if not any(a['genres'] for a in artists) and artists:
        artist_names = [a['name'] for a in artists]
        inferred = _infer_genres_with_llm(artist_names)
        if inferred:
            genre_source = 'ai-inferred'
            for artist in artists:
                genres = inferred.get(artist['name'], [])
                if isinstance(genres, list):
                    artist['genres'] = [str(g).lower() for g in genres]

    profile = build_taste_profile(artists)
    profile['genre_source'] = genre_source
    return JsonResponse(profile)
