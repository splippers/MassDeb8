/** Two-letter initials for avatar placeholders. */
export function displayInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    const a = parts[0]!.charAt(0)
    const b = parts[parts.length - 1]!.charAt(0)
    return (a + b).toUpperCase()
  }
  const one = parts[0] || name
  return one.slice(0, 2).toUpperCase() || '?'
}
