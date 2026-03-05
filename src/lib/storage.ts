import { supabase } from './supabase'

const BUCKET = 'game-assets'

/**
 * Returns the public CDN URL for a file in the game-assets bucket.
 * If `path` is null/empty, returns the fallback (or empty string).
 */
export function getImageUrl(path: string | null | undefined, fallback = ''): string {
  if (!path) return fallback

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

/**
 * Builds a storage path following the convention:
 *   {gameId}/{entityType}/{filename}
 *
 * Example: buildStoragePath('wuwa', 'characters', 'abc123.webp')
 *        → 'wuwa/characters/abc123.webp'
 */
export function buildStoragePath(gameId: string, entityType: string, filename: string): string {
  return `${gameId}/${entityType}/${filename}`
}
