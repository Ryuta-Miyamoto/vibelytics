# Vibelytics

Spotify music analyzer powered by LLM (Ollama/llama3) and TensorFlow.
Chat in natural language to analyze your music taste and listening habits.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Django 6 + Django REST Framework |
| Frontend | React 19 + Vite + TypeScript |
| Database | SQLite |
| LLM | Ollama (llama3) — `localhost:11434` |
| ML | TensorFlow (planned) |
| External API | Spotify Web API |

## Requirements

- Python 3.10+
- Node.js 18+
- [Ollama](https://ollama.com)
- [Spotify Developer App](https://developer.spotify.com/dashboard)

## Setup

### 1. Environment variables

```bash
cp .env.example .env
```

Fill in `.env`:

| Variable | Description |
|---|---|
| `DJANGO_SECRET_KEY` | Generate with `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` |
| `SPOTIFY_CLIENT_ID` | Client ID from Spotify Developer Dashboard |
| `SPOTIFY_CLIENT_SECRET` | Client Secret from Spotify Developer Dashboard |

Add the following Redirect URI in your Spotify app settings:
```
http://127.0.0.1:8000/auth/spotify/callback
```

> **Note:** `localhost` is no longer allowed as a Redirect URI as of April 2025. Use `127.0.0.1` instead.

### 2. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://127.0.0.1:5173` in your browser.

> **Note:** Use `127.0.0.1:5173`, not `localhost:5173` (required for session cookie handling).

### 4. Ollama (LLM)

```bash
# Download model (first time only)
ollama pull llama3

# Start server (keep running)
ollama serve
```

## Features

- **Spotify OAuth** — Sign in with your Spotify account
- **Top Tracks Chart** — Bar chart of your most-played tracks
- **Top Artists Chart** — Horizontal bar chart of your top artists
- **AI Chat** — llama3 analyzes your music taste and recommends artists based on your Spotify data

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/auth/spotify/login` | Redirect to Spotify OAuth |
| GET | `/auth/spotify/callback` | OAuth callback |
| GET | `/auth/logout` | Logout |
| GET | `/api/me` | Current Spotify user info |
| GET | `/api/top-tracks` | Top tracks list |
| GET | `/api/top-artists` | Top artists list |
| POST | `/api/chat` | AI chat (Ollama/llama3) |

## Project Structure

```
vibelytics/
├── backend/
│   ├── config/         # Django settings and URL routing
│   ├── accounts/       # User management (planned)
│   ├── spotify/        # Spotify OAuth and API integration
│   ├── chat/           # LLM chat (Ollama)
│   ├── ml/             # Machine learning (TensorFlow, planned)
│   └── manage.py
├── frontend/
│   └── src/
│       ├── api/        # Backend API clients
│       ├── pages/      # Page components
│       └── types/      # TypeScript type definitions
├── .env.example
└── README.md
```

---

# Vibelytics（日本語）

Ollama（llama3）とTensorFlowを活用したSpotify音楽分析アプリです。
自分の音楽の傾向をAIと自然言語でチャットしながら深掘りできます。

## 技術スタック

| レイヤー | 技術 |
|---|---|
| バックエンド | Django 6 + Django REST Framework |
| フロントエンド | React 19 + Vite + TypeScript |
| データベース | SQLite |
| LLM | Ollama (llama3) — `localhost:11434` |
| ML | TensorFlow（実装予定） |
| 外部API | Spotify Web API |

## 必要環境

- Python 3.10+
- Node.js 18+
- [Ollama](https://ollama.com)
- [Spotify Developer App](https://developer.spotify.com/dashboard)

## セットアップ

### 1. 環境変数

```bash
cp .env.example .env
```

`.env` を編集:

| 変数名 | 説明 |
|---|---|
| `DJANGO_SECRET_KEY` | `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` で生成 |
| `SPOTIFY_CLIENT_ID` | Spotify Developer Dashboard の Client ID |
| `SPOTIFY_CLIENT_SECRET` | Spotify Developer Dashboard の Client Secret |

Spotifyアプリの設定で以下のRedirect URIを追加してください:
```
http://127.0.0.1:8000/auth/spotify/callback
```

> **注意:** 2025年4月以降、SpotifyのRedirect URIに `localhost` は使用できません。必ず `127.0.0.1` を使用してください。

### 2. バックエンド

```bash
cd backend
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

### 3. フロントエンド

```bash
cd frontend
npm install
npm run dev
```

ブラウザで `http://127.0.0.1:5173` を開いてください。

> **注意:** セッションクッキーの仕様上、`localhost:5173` ではなく `127.0.0.1:5173` を使用してください。

### 4. Ollama（LLM）

```bash
# モデルのダウンロード（初回のみ）
ollama pull llama3

# サーバー起動（常時起動が必要）
ollama serve
```

## 機能

- **Spotify OAuth** — Spotifyアカウントでログイン
- **Top Tracksチャート** — よく聴いた曲をバーチャートで表示
- **Top Artistsチャート** — トップアーティストを横棒グラフで表示
- **AIチャット** — llama3がSpotifyデータをもとに音楽の傾向を分析・アーティストを推薦

## APIエンドポイント

| メソッド | パス | 説明 |
|---|---|---|
| GET | `/auth/spotify/login` | Spotify OAuthログイン |
| GET | `/auth/spotify/callback` | OAuthコールバック |
| GET | `/auth/logout` | ログアウト |
| GET | `/api/me` | ログイン中のSpotifyユーザー情報 |
| GET | `/api/top-tracks` | トップトラック一覧 |
| GET | `/api/top-artists` | トップアーティスト一覧 |
| POST | `/api/chat` | AIチャット（Ollama/llama3） |

## ディレクトリ構成

```
vibelytics/
├── backend/
│   ├── config/         # Django設定・URLルーティング
│   ├── accounts/       # ユーザー管理（実装予定）
│   ├── spotify/        # Spotify OAuth・API連携
│   ├── chat/           # LLMチャット（Ollama）
│   ├── ml/             # 機械学習（TensorFlow・実装予定）
│   └── manage.py
├── frontend/
│   └── src/
│       ├── api/        # バックエンドAPI呼び出し
│       ├── pages/      # ページコンポーネント
│       └── types/      # TypeScript型定義
├── .env.example
└── README.md
```
