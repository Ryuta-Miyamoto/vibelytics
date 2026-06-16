import client from './client'
import type { ChatMessage, TopTrack, TopArtist } from '../types'

function buildContext(tracks: TopTrack[], artists: TopArtist[]): string {
  const trackList = tracks.map((t, i) => `${i + 1}. "${t.name}" by ${t.artist}`).join('\n')
  const artistList = artists.map((a, i) => `${i + 1}. ${a.name}`).join('\n')
  return `Top 10 Tracks:\n${trackList}\n\nTop 10 Artists:\n${artistList}`
}

export async function sendChatMessage(
  message: string,
  history: ChatMessage[],
  tracks: TopTrack[],
  artists: TopArtist[],
): Promise<string> {
  const { data } = await client.post<{ message: string }>('/api/chat', {
    message,
    history,
    context: buildContext(tracks, artists),
  })
  return data.message
}
