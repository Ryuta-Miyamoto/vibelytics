import axios from 'axios'

const client = axios.create({
  baseURL: 'http://127.0.0.1:8000',
})

// Attach Spotify access token from localStorage to every request
client.interceptors.request.use(config => {
  const token = localStorage.getItem('spotify_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default client
