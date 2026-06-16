const SPOTIFY_LOGIN_URL = 'http://127.0.0.1:8000/auth/spotify/login'

function LoginPage() {
  // Clear any existing token when landing on the login page
  localStorage.removeItem('spotify_token')

  const handleLogin = () => {
    window.location.href = SPOTIFY_LOGIN_URL
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1rem' }}>
      <h1>Vibelytics</h1>
      <p>Analyze your Spotify music taste with AI</p>
      <button
        onClick={handleLogin}
        style={{ padding: '0.75rem 2rem', fontSize: '1rem', cursor: 'pointer', backgroundColor: '#1DB954', color: '#fff', border: 'none', borderRadius: '2rem' }}
      >
        Login with Spotify
      </button>
    </div>
  )
}

export default LoginPage
