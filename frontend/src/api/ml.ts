import client from './client'
import type { TasteProfile } from '../types'

export async function fetchTasteProfile(): Promise<TasteProfile> {
  const { data } = await client.get<TasteProfile>('/api/ml/taste-profile')
  return data
}
