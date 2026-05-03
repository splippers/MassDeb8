/** Normalized slug for matching files in /public/portraits/{slug}.png */
export function personaPortraitSlug(persona: string | null | undefined): string {
  const raw = (persona || 'debater').trim().toLowerCase()
  const slug = raw.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
  return slug || 'debater'
}

export function portraitAssetUrl(persona: string | null | undefined): string {
  return `/portraits/${personaPortraitSlug(persona)}.png`
}
