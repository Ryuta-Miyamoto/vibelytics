import numpy as np

try:
    import tensorflow as tf
    _TF_AVAILABLE = True
except ImportError:
    _TF_AVAILABLE = False

_VIBE_MAP = {
    'electronic': 'Electronic Enthusiast',
    'edm': 'Electronic Enthusiast',
    'house': 'Club Explorer',
    'techno': 'Club Explorer',
    'ambient': 'Chill Seeker',
    'rock': 'Rock Devotee',
    'metal': 'Metal Head',
    'punk': 'Rebel Spirit',
    'alternative': 'Indie Soul',
    'indie': 'Indie Soul',
    'hip hop': 'Hip-Hop Head',
    'rap': 'Hip-Hop Head',
    'trap': 'Street Vibes',
    'r&b': 'R&B Lover',
    'soul': 'Soul Searcher',
    'pop': 'Pop Connoisseur',
    'dance pop': 'Pop Connoisseur',
    'jazz': 'Jazz Aficionado',
    'classical': 'Classical Mind',
    'folk': 'Folk Wanderer',
    'country': 'Country Heart',
    'latin': 'Latin Rhythm',
    'reggaeton': 'Latin Rhythm',
    'k-pop': 'K-Pop Fan',
    'j-pop': 'J-Pop Fan',
}


def _classify_vibe(top_genre: str | None) -> str:
    if not top_genre:
        return 'Eclectic Listener'
    lower = top_genre.lower()
    for keyword, label in _VIBE_MAP.items():
        if keyword in lower:
            return label
    return 'Eclectic Listener'


def _fallback_profile(genre_scores: dict[str, list[float]]) -> list[dict]:
    """Simple weighted average when TF is unavailable or data is too small."""
    raw = {g: float(np.mean(scores)) * 100 for g, scores in genre_scores.items()}
    results = sorted(
        [{'genre': g, 'affinity': round(v, 1)} for g, v in raw.items()],
        key=lambda x: x['affinity'],
        reverse=True,
    )
    return results


def build_taste_profile(artists: list[dict]) -> dict:
    """
    Predict genre affinity scores from top artist listening data.

    Architecture: multi-hot genre vector → Dense(relu) → Dense(sigmoid)
    Each artist provides a training sample: which genres they represent
    and how strongly the user listens to them (rank_score as supervision).
    We then query the model with each genre individually to get affinities.
    """
    genre_scores: dict[str, list[float]] = {}
    for artist in artists:
        score = artist.get('rank_score', 50) / 100.0
        for genre in artist.get('genres', []):
            genre_scores.setdefault(genre, []).append(score)

    if not genre_scores:
        return {'genres': [], 'vibe_type': 'Unknown', 'top_genre': None, 'model': 'none'}

    genres = sorted(genre_scores.keys())
    n = len(genres)
    genre_idx = {g: i for i, g in enumerate(genres)}

    X_list, y_list = [], []
    for artist in artists:
        artist_genres = artist.get('genres', [])
        if not artist_genres:
            continue
        vec = np.zeros(n, dtype=np.float32)
        for g in artist_genres:
            if g in genre_idx:
                vec[genre_idx[g]] = 1.0
        X_list.append(vec)
        y_list.append(artist.get('rank_score', 50) / 100.0)

    use_tf = _TF_AVAILABLE and len(X_list) >= 2

    if use_tf:
        X = np.array(X_list)
        y = np.array(y_list, dtype=np.float32)

        tf.keras.utils.set_random_seed(42)
        hidden = max(n, 8)
        model = tf.keras.Sequential([
            tf.keras.Input(shape=(n,)),
            tf.keras.layers.Dense(
                hidden,
                activation='relu',
                kernel_regularizer=tf.keras.regularizers.l2(0.01),
            ),
            tf.keras.layers.Dense(1, activation='sigmoid'),
        ])
        model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=0.02), loss='mse')
        model.fit(X, y, epochs=300, verbose=0, batch_size=len(X))

        # Query each genre individually to get its predicted affinity
        eye = np.eye(n, dtype=np.float32)
        preds = model.predict(eye, verbose=0).flatten()
        results = [
            {'genre': g, 'affinity': round(float(p) * 100, 1)}
            for g, p in zip(genres, preds)
        ]
        model_used = 'tensorflow'
    else:
        results = _fallback_profile(genre_scores)
        model_used = 'weighted-average'

    results.sort(key=lambda x: x['affinity'], reverse=True)
    top_genre = results[0]['genre'] if results else None

    return {
        'genres': results[:10],
        'vibe_type': _classify_vibe(top_genre),
        'top_genre': top_genre,
        'model': model_used,
    }
