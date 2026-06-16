import requests
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

OLLAMA_URL = 'http://localhost:11434/api/chat'
OLLAMA_MODEL = 'llama3'

SYSTEM_PROMPT = """You are a music analyst assistant for Vibelytics, a Spotify analytics app.
You help users understand their music taste based on their Spotify listening data.
Be conversational, insightful, and enthusiastic about music.
When the user's top tracks and artists are provided, use that data to give personalized analysis.
Keep responses concise (2-4 sentences) and engaging.
Always respond in the same language the user writes in."""


@api_view(['POST'])
@permission_classes([AllowAny])
def chat(request):
    user_message = request.data.get('message', '').strip()
    history = request.data.get('history', [])
    context = request.data.get('context', '')

    if not user_message:
        return JsonResponse({'error': 'Message is required'}, status=400)

    system_content = SYSTEM_PROMPT
    if context:
        system_content += f"\n\nUser's Spotify data:\n{context}"

    messages = [{'role': 'system', 'content': system_content}]
    for msg in history:
        if msg.get('role') in ('user', 'assistant') and msg.get('content'):
            messages.append({'role': msg['role'], 'content': msg['content']})
    messages.append({'role': 'user', 'content': user_message})

    try:
        response = requests.post(
            OLLAMA_URL,
            json={'model': OLLAMA_MODEL, 'messages': messages, 'stream': False},
            timeout=60,
        )
    except requests.exceptions.ConnectionError:
        return JsonResponse(
            {'error': 'Ollamaが起動していません。`ollama serve` を実行してください。'},
            status=503,
        )
    except requests.exceptions.Timeout:
        return JsonResponse({'error': 'リクエストがタイムアウトしました。'}, status=504)

    if response.status_code != 200:
        return JsonResponse({'error': f'Ollama error: {response.status_code}'}, status=500)

    assistant_message = response.json()['message']['content']
    return JsonResponse({'message': assistant_message})
