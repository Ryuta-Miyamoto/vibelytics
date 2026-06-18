import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { fetchTopTracks, fetchTopArtists } from '../api/spotify'
import { sendChatMessage } from '../api/chat'
import { fetchTasteProfile } from '../api/ml'
import type { TopTrack, TopArtist, ChatMessage, TasteProfile } from '../types'

const COLORS = ['#1DB954', '#1ed760', '#169c42', '#0f6b2d', '#0a4a1f', '#17a349', '#22c55e', '#16a34a', '#15803d', '#166534']

function buildGenreData(artists: TopArtist[]) {
  const counts: Record<string, number> = {}
  for (const artist of artists) {
    for (const genre of artist.genres) {
      counts[genre] = (counts[genre] ?? 0) + 1
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }))
}

function DashboardPage() {
  const [tracks, setTracks] = useState<TopTrack[]>([])
  const [artists, setArtists] = useState<TopArtist[]>([])
  const [genreData, setGenreData] = useState<{ name: string; value: number }[]>([])
  const [tasteProfile, setTasteProfile] = useState<TasteProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)

  useEffect(() => {
    // Extract token from URL after OAuth redirect (e.g. /dashboard?token=xxx)
    const params = new URLSearchParams(window.location.search)
    const urlToken = params.get('token')
    if (urlToken) {
      localStorage.setItem('spotify_token', urlToken)
      window.history.replaceState({}, '', '/dashboard')
    }

    const token = urlToken ?? localStorage.getItem('spotify_token')
    if (!token) {
      setError('ログインが必要です。')
      setLoading(false)
      return
    }

    Promise.all([fetchTopTracks(10), fetchTopArtists(10)])
      .then(([topTracks, topArtists]) => {
        setTracks(topTracks)
        setArtists(topArtists)
        setGenreData(buildGenreData(topArtists))
      })
      .catch(err => {
        setError(`データの取得に失敗しました: ${err?.response?.data?.error ?? err.message}`)
      })
      .finally(() => {
        setLoading(false)
        // Fetch taste profile after main data loads (TF inference takes a few seconds)
        setProfileLoading(true)
        fetchTasteProfile()
          .then(setTasteProfile)
          .catch(() => { /* silently skip if ML endpoint fails */ })
          .finally(() => setProfileLoading(false))
      })
  }, [])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isThinking) return

    const userMsg: ChatMessage = { role: 'user', content: text }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setIsThinking(true)

    try {
      const reply = await sendChatMessage(text, messages, tracks, artists)
      setMessages([...updatedMessages, { role: 'assistant', content: reply }])
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? 'エラーが発生しました。Ollamaが起動しているか確認してください。'
      setMessages([...updatedMessages, { role: 'assistant', content: errorMsg }])
    } finally {
      setIsThinking(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      <h1 style={{ margin: 0 }}>Your Music Dashboard</h1>

      {error && (
        <p style={{ color: '#e53e3e', background: '#fff5f5', padding: '0.75rem 1rem', borderRadius: '0.5rem' }}>{error}</p>
      )}

      {loading ? (
        <p style={{ color: '#888' }}>Loading your Spotify data...</p>
      ) : !error && (
        <>
          {/* Top Tracks Bar Chart */}
          <section>
            <h2 style={{ marginBottom: '1rem' }}>Top 10 Tracks</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tracks} margin={{ left: 0, right: 16, top: 4, bottom: 60 }}>
                <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 11 }} interval={0} />
                <YAxis domain={[0, 100]} tickCount={6} label={{ value: 'Score', angle: -90, position: 'insideLeft', offset: 10 }} />
                <Tooltip
                  formatter={(_v, _name, props) => {
                    const track = props.payload as TopTrack
                    const label = track.popularity > 0
                      ? `Popularity ${track.popularity}`
                      : `Rank #${track.rank}`
                    return [label, '']
                  }}
                  labelFormatter={(_label, payload) => (payload[0]?.payload as TopTrack)?.artist ?? ''}
                />
                <Bar
                  dataKey={(t: TopTrack) => t.popularity > 0 ? t.popularity : t.rank_score}
                  fill="#1DB954"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </section>

          {/* Genre Pie Chart or Artist Popularity fallback */}
          <section>
            {genreData.length > 0 ? (
              <>
                <h2 style={{ marginBottom: '1rem' }}>Genre Distribution</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={genreData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name }) => name}>
                      {genreData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </>
            ) : (
              <>
                <h2 style={{ marginBottom: '1rem' }}>Top 10 Artists</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[...artists].reverse()} layout="vertical" margin={{ left: 80, right: 16, top: 4, bottom: 4 }}>
                    <XAxis type="number" domain={[0, 100]} tickCount={6} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                    <Tooltip formatter={(_v, _name, props) => {
                      const a = props.payload as TopArtist
                      return [a.popularity > 0 ? `Popularity ${a.popularity}` : `Rank #${a.rank}`, '']
                    }} />
                    <Bar
                      dataKey={(a: TopArtist) => a.popularity > 0 ? a.popularity : a.rank_score}
                      fill="#1DB954"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </>
            )}
          </section>
        </>
      )}

      {/* Music DNA — TensorFlow ML taste profile */}
      <section>
        <h2 style={{ marginBottom: '1rem' }}>Your Music DNA</h2>
        {profileLoading ? (
          <p style={{ color: '#888', fontSize: '0.9rem' }}>Analyzing your taste with TensorFlow...</p>
        ) : tasteProfile && tasteProfile.genres.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <span style={{
                background: '#1DB954',
                color: '#fff',
                padding: '0.4rem 1.2rem',
                borderRadius: '2rem',
                fontWeight: 700,
                fontSize: '1.1rem',
              }}>
                {tasteProfile.vibe_type}
              </span>
              {tasteProfile.top_genre && (
                <span style={{ color: '#555', fontSize: '0.9rem' }}>
                  Top genre: <strong>{tasteProfile.top_genre}</strong>
                </span>
              )}
              <span style={{ color: '#aaa', fontSize: '0.75rem', marginLeft: 'auto' }}>
                {tasteProfile.genre_source === 'ai-inferred' ? 'Genres inferred by AI · ' : ''}
                Powered by {tasteProfile.model === 'tensorflow' ? 'TensorFlow' : 'ML Analysis'}
              </span>
            </div>
            <ResponsiveContainer width="100%" height={Math.max(200, tasteProfile.genres.length * 30)}>
              <BarChart
                data={[...tasteProfile.genres].reverse()}
                layout="vertical"
                margin={{ left: 120, right: 40, top: 4, bottom: 4 }}
              >
                <XAxis type="number" domain={[0, 100]} tickCount={6} unit="%" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="genre" tick={{ fontSize: 12 }} width={120} />
                <Tooltip formatter={(v: number) => [`${v}%`, 'Affinity']} />
                <Bar dataKey="affinity" fill="#1DB954" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : !profileLoading && (
          <p style={{ color: '#aaa', fontSize: '0.9rem' }}>
            Genre data not available from Spotify for your top artists.
          </p>
        )}
      </section>

      {/* Chat UI */}
      <section>
        <h2 style={{ marginBottom: '1rem' }}>Chat with AI</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ border: '1px solid #ccc', borderRadius: '0.5rem', padding: '1rem', minHeight: '200px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {messages.length === 0 && !isThinking && (
              <p style={{ color: '#888', margin: 0 }}>Ask anything about your music taste...</p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  background: msg.role === 'user' ? '#1DB954' : '#f0f0f0',
                  color: msg.role === 'user' ? '#fff' : '#000',
                  padding: '0.5rem 1rem',
                  borderRadius: '1rem',
                  maxWidth: '70%',
                }}
              >
                {msg.content}
              </div>
            ))}
          {isThinking && (
              <div style={{ alignSelf: 'flex-start', color: '#888', fontStyle: 'italic', fontSize: '0.9rem' }}>
                Thinking...
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your music taste..."
              disabled={isThinking}
              style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ccc', fontSize: '1rem', opacity: isThinking ? 0.6 : 1 }}
            />
            <button
              onClick={handleSend}
              disabled={isThinking}
              style={{ padding: '0.75rem 1.5rem', backgroundColor: '#1DB954', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: isThinking ? 'not-allowed' : 'pointer', fontSize: '1rem', opacity: isThinking ? 0.6 : 1 }}
            >
              {isThinking ? '...' : 'Send'}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default DashboardPage
