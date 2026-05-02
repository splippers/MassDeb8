import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { ActivityEntry, DebaterInfo, LiveStream, TranscriptLine } from '../types'

const STORAGE_KEY = 'sic_chair_key'

type ChairContextValue = {
  chairKey: string
  setChairKey: (k: string) => void
  connected: boolean
  connect: () => void
  disconnect: () => void
  send: (type: string, payload?: Record<string, unknown>) => void
  debaters: DebaterInfo[]
  speakerName: (debaterId: string) => string
  transcriptLines: TranscriptLine[]
  liveStreams: Record<string, LiveStream>
  activityByDebater: Map<string, ActivityEntry>
  activityStripText: string
  pinnedFloorText: string
  floorDebaterId: string | null
  floorTurnId: string | null
}

const ChairContext = createContext<ChairContextValue | null>(null)

export function ChairProvider({ children }: { children: ReactNode }) {
  const [chairKey, setChairKeyState] = useState(() => sessionStorage.getItem(STORAGE_KEY) || '')
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [debaters, setDebaters] = useState<DebaterInfo[]>([])
  const [transcriptLines, setTranscriptLines] = useState<TranscriptLine[]>([])
  const [liveStreams, setLiveStreams] = useState<Record<string, LiveStream>>({})
  const [activityByDebater, setActivityByDebater] = useState<Map<string, ActivityEntry>>(new Map())
  const [floorDebaterId, setFloorDebaterId] = useState<string | null>(null)
  const [floorTurnId, setFloorTurnId] = useState<string | null>(null)
  const floorTurnIdRef = useRef<string | null>(null)
  const floorDebaterIdRef = useRef<string | null>(null)

  const [uiTick, setUiTick] = useState(0)

  useEffect(() => {
    floorTurnIdRef.current = floorTurnId
  }, [floorTurnId])
  useEffect(() => {
    floorDebaterIdRef.current = floorDebaterId
  }, [floorDebaterId])

  const setChairKey = useCallback((k: string) => {
    setChairKeyState(k)
    sessionStorage.setItem(STORAGE_KEY, k)
  }, [])

  const speakerName = useCallback(
    (debaterId: string) => debaters.find((x) => x.debater_id === debaterId)?.name || debaterId,
    [debaters]
  )

  const appendTranscript = useCallback((text: string) => {
    setTranscriptLines((prev) => [...prev, { id: crypto.randomUUID(), text }])
  }, [])

  const clearTick = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current)
      tickRef.current = null
    }
  }, [])

  const disconnect = useCallback(() => {
    clearTick()
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setConnected(false)
  }, [clearTick])

  const send = useCallback((type: string, payload?: Record<string, unknown>) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({ type, payload: payload || {} }))
  }, [])

  const debatersRef = useRef(debaters)
  useEffect(() => {
    debatersRef.current = debaters
  }, [debaters])

  const connect = useCallback(() => {
    disconnect()
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      setFloorDebaterId(null)
      setFloorTurnId(null)
      floorTurnIdRef.current = null
      floorDebaterIdRef.current = null
      ws.send(
        JSON.stringify({
          type: 'hello',
          payload: { kind: 'chair', name: 'Confucius', chair_key: chairKey },
        })
      )
    }
    ws.onclose = () => {
      setConnected(false)
      wsRef.current = null
      clearTick()
    }
    ws.onerror = () => {
      setConnected(false)
      clearTick()
    }

    ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data)
      const nameFor = (id: string) =>
        debatersRef.current.find((x) => x.debater_id === id)?.name || id

      if (m.type === 'roster_update') {
        setDebaters(m.payload.debaters || [])
      } else if (m.type === 'debater_activity') {
        const { debater_id, phase, tick: tk, detail } = m.payload || {}
        if (debater_id) {
          setActivityByDebater((prev) => {
            const next = new Map(prev)
            next.set(debater_id, {
              phase: phase || '',
              tick: tk || 0,
              detail: detail || {},
              at: Date.now(),
            })
            return next
          })
        }
      } else if (m.type === 'transcript_append') {
        const e = m.payload.event
        const ts = new Date(e.ts_ms).toLocaleTimeString()
        if (e.kind === 'speech') {
          const who = nameFor(e.data.debater_id)
          appendTranscript(`[${ts}] ${who}:\n${e.data.text}\n`)
          if (e.data.turn_id && e.data.turn_id === floorTurnIdRef.current) {
            setFloorDebaterId(null)
            setFloorTurnId(null)
            floorTurnIdRef.current = null
            floorDebaterIdRef.current = null
          }
        } else if (e.kind === 'turn_start') {
          const who = nameFor(e.data.debater_id)
          appendTranscript(`[${ts}] ▶ ${who} begins (${e.data.round})`)
          setFloorTurnId(e.data.turn_id)
          setFloorDebaterId(e.data.debater_id)
          floorTurnIdRef.current = e.data.turn_id
          floorDebaterIdRef.current = e.data.debater_id
        } else if (e.kind === 'turn_forced_end') {
          const who = nameFor(e.data.debater_id)
          appendTranscript(`[${ts}] ■ ${who} stopped (${e.data.reason})`)
          if (e.data.turn_id === floorTurnIdRef.current || e.data.debater_id === floorDebaterIdRef.current) {
            setFloorDebaterId(null)
            setFloorTurnId(null)
            floorTurnIdRef.current = null
            floorDebaterIdRef.current = null
          }
        } else if (e.kind === 'participant_removed') {
          const id = e.data.debater_id as string
          if (id === floorDebaterIdRef.current) {
            setFloorDebaterId(null)
            setFloorTurnId(null)
            floorTurnIdRef.current = null
            floorDebaterIdRef.current = null
          }
          appendTranscript(`[${ts}] Removed debater ${id}`)
        } else {
          appendTranscript(`[${ts}] ${e.kind}: ${JSON.stringify(e.data)}`)
        }
      } else if (m.type === 'turn_stream') {
        const { turn_id, debater_id, delta } = m.payload
        setLiveStreams((prev) => {
          const cur = prev[turn_id]?.text || ''
          return { ...prev, [turn_id]: { debaterId: debater_id, text: cur + delta } }
        })
      } else if (m.type === 'announce') {
        appendTranscript(`[Confucius] ${m.payload.text}`)
      } else if (m.type === 'error') {
        appendTranscript(`[error] ${m.payload.message}`)
      }
    }
  }, [appendTranscript, chairKey, clearTick, disconnect])

  useEffect(() => {
    if (!connected) return
    tickRef.current = setInterval(() => setUiTick((t) => t + 1), 1000)
    return () => clearTick()
  }, [connected, clearTick])

  useEffect(() => () => disconnect(), [disconnect])

  const activityStripText = useMemo(() => {
    if (!activityByDebater.size) return 'No debater activity yet.'
    const lines: string[] = []
    for (const [id, a] of activityByDebater) {
      const who = speakerName(id)
      const phase = a.phase || '?'
      const tickN = typeof a.tick === 'number' ? a.tick : 0
      const chars = a.detail?.chars_out as number | undefined
      const elapsed = a.detail?.elapsed_s as number | undefined
      const extra =
        phase === 'generating'
          ? [typeof chars === 'number' ? `${chars} chars` : null, typeof elapsed === 'number' ? `${elapsed}s` : null]
              .filter(Boolean)
              .join(' · ')
          : ''
      const ago = Math.max(0, Math.round((Date.now() - a.at) / 100) / 10)
      lines.push(`${who}: ${phase} #${tickN}${extra ? ` · ${extra}` : ''} · ${ago}s ago`)
    }
    return lines.join('   |   ')
  }, [activityByDebater, speakerName, uiTick])

  const pinnedFloorText = useMemo(() => {
    if (!floorDebaterId) return 'Nobody speaking.'
    const who = speakerName(floorDebaterId)
    const act = activityByDebater.get(floorDebaterId)
    const streamed = floorTurnId ? liveStreams[floorTurnId]?.text.length ?? 0 : 0
    const parts = [`${who}`, 'LIVE', `${streamed} chars streamed`]
    if (act) {
      parts.push(`${act.phase} · #${act.tick}`)
      const d = act.detail || {}
      if (typeof d.chars_out === 'number') parts.push(`${d.chars_out} chars (node)`)
      if (typeof d.elapsed_s === 'number') parts.push(`${d.elapsed_s}s`)
      if (d.ollama_model) parts.push(String(d.ollama_model))
    }
    return parts.join(' · ')
  }, [activityByDebater, floorDebaterId, floorTurnId, liveStreams, speakerName, uiTick])

  const value: ChairContextValue = {
    chairKey,
    setChairKey,
    connected,
    connect,
    disconnect,
    send,
    debaters,
    speakerName,
    transcriptLines,
    liveStreams,
    activityByDebater,
    activityStripText,
    pinnedFloorText,
    floorDebaterId,
    floorTurnId,
  }

  return <ChairContext.Provider value={value}>{children}</ChairContext.Provider>
}

export function useChair(): ChairContextValue {
  const ctx = useContext(ChairContext)
  if (!ctx) throw new Error('useChair must be used within ChairProvider')
  return ctx
}
