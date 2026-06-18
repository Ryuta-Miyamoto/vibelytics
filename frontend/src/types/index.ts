export type Track = {
  id: string
  name: string
  artist: string
  genre: string
}

export type TopTrack = {
  id: string
  name: string
  artist: string
  popularity: number
  rank: number
  rank_score: number
  album: string
}

export type TopArtist = {
  id: string
  name: string
  genres: string[]
  popularity: number
  rank: number
  rank_score: number
}

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type UserProfile = {
  id: string
  display_name: string
  email: string
}

export type GenreAffinity = {
  genre: string
  affinity: number
}

export type TasteProfile = {
  genres: GenreAffinity[]
  vibe_type: string
  top_genre: string | null
  model: 'tensorflow' | 'weighted-average' | 'none'
  genre_source: 'spotify' | 'ai-inferred'
}
