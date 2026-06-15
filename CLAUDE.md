# Vibelytics

## Project Overview
Spotify music analyzer powered by LLM (Ollama/llama3) and TensorFlow.
Users can chat in natural language to analyze their music taste and listening habits.

## Tech Stack
- Backend: Django 4.x + Django REST Framework
- Frontend: React 18.x (Vite)
- DB: SQLite
- LLM: Ollama (llama3) - localhost:11434
- ML: TensorFlow
- External API: Spotify Web API

## Directory Structure
vibelytics/
├── backend/
│   ├── config/
│   ├── accounts/
│   ├── spotify/
│   ├── chat/
│   ├── ml/
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── api/
│   └── package.json
├── .env.example
├── .gitignore
└── README.md

## Environment Variables
See .env.example for required variables.
Never hardcode API keys.

## Code Style
- Comments in English
- Python: follow PEP8
- React: functional components + hooks only

## Development Rules
- Never commit .env
- All API keys via environment variables
- Keep backend and frontend strictly separated