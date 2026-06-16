import client from './client'
import type { TopTrack, TopArtist, UserProfile } from '../types'

export async function fetchMe(): Promise<UserProfile> {
  const { data } = await client.get<UserProfile>('/api/me')
  return data
}

export async function fetchTopTracks(limit = 10, timeRange = 'medium_term'): Promise<TopTrack[]> {
  const { data } = await client.get<{ items: TopTrack[] }>('/api/top-tracks', {
    params: { limit, time_range: timeRange },
  })
  return data.items
}

export async function fetchTopArtists(limit = 10, timeRange = 'medium_term'): Promise<TopArtist[]> {
  const { data } = await client.get<{ items: TopArtist[] }>('/api/top-artists', {
    params: { limit, time_range: timeRange },
  })
  return data.items
}
