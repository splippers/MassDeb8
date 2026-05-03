export type LanSessionDescriptor = {
  id: string
  label: string
  port: number
}

const KNOWN_ARENA_PORT = 8787

export function scanForLanSessionDescriptor(): LanSessionDescriptor | null {
  // TODO: Replace this placeholder with a real known-port LAN session descriptor scan.
  return null
}

export function knownLanSessionPort(): number {
  return KNOWN_ARENA_PORT
}
