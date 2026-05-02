export type DebaterInfo = {
  debater_id: string
  name: string
  persona: string | null
  ollama_model: string | null
  connected: boolean
}

export type ActivityEntry = {
  phase: string
  tick: number
  detail: Record<string, unknown>
  at: number
}

export type TranscriptLine = {
  id: string
  text: string
}

export type LiveStream = {
  debaterId: string
  text: string
}
