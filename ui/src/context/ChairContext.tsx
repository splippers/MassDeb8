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
import { formatDebateTimestamp } from '../lib/debateTime'
import { isDuplicateTranscriptLine } from '../lib/transcriptDedupe'
import type { ActivityEntry, DebaterInfo, LiveStream, TranscriptLine } from '../types'

const STORAGE_KEY = 'sic_chair_key'

/** `crypto.randomUUID` is not available (or throws) on non-secure HTTP origins; LAN access would blank the UI. */
function newTranscriptLineId(): string {
  const c = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined
  if (c && typeof c.randomUUID === 'function') {
    try {
      return c.randomUUID()
    } catch {
      /* non-secure context */
    }
  }
  return `tl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`
}

type ChairContextValue = {
  chairKey: string
  setChairKey: (k: string) => void
  hallName: string
  sessionLoading: boolean
  sessionError: string | null
  refreshSession: () => Promise<void>
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
  debateTopic: string
}

const ChairContext = createContext<ChairContextValue | null>(null)

export function ChairProvider({ children }: { children: ReactNode }) {
  const [chairKey, setChairKeyState] = useState(() => sessionStorage.getItem(STORAGE_KEY) || '')
  const [hallName, setHallName] = useState('')
  const [debateTopic, setDebateTopic] = useState('')
  const [sessionLoading, setSessionLoading] = useState(true)
  const [sessionError, setSessionError] = useState<string | null>(null)
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

  const [activityNow, setActivityNow] = useState(() => Date.now())

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

  const refreshSession = useCallback(async () => {
    setSessionLoading(true)
    setSessionError(null)
    try {
      const res = await fetch('/api/state')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const st = (await res.json()) as { chair_key?: string; hall_name?: string; topic?: string }
      if (typeof st.chair_key === 'string' && st.chair_key.trim()) {
        setChairKey(st.chair_key.trim())
      }
      if (typeof st.hall_name === 'string' && st.hall_name.trim()) {
        setHallName(st.hall_name.trim())
      }
      if (typeof st.topic === 'string') {
        setDebateTopic(st.topic.trim())
      }
    } catch {
      setSessionError('Could not load session from the arena (is it running?)')
    } finally {
      setSessionLoading(false)
    }
  }, [setChairKey])

  useEffect(() => {
    void refreshSession()
  }, [refreshSession])

  const speakerName = useCallback(
    (debaterId: string) => debaters.find((x) => x.debater_id === debaterId)?.name || debaterId,
    [debaters]
  )

  const appendTranscript = useCallback((text: string) => {
    setTranscriptLines((prev) => {
      if (isDuplicateTranscriptLine(text, prev)) return prev
      return [{ id: newTranscriptLineId(), text }, ...prev]
    })
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
      let m: { type?: string; payload?: Record<string, unknown> }
      try {
        m = JSON.parse(ev.data as string) as typeof m
      } catch {
        appendTranscript(
          `[${formatDebateTimestamp(Date.now())}] [wire] Invalid JSON from arena (message ignored).\n`
        )
        return
      }

      const nameFor = (id: string) =>
        debatersRef.current.find((x) => x.debater_id === id)?.name || id
      const payload = (m.payload && typeof m.payload === 'object' ? m.payload : {}) as Record<string, unknown>

      try {
        if (m.type === 'welcome') {
          const top = payload.topic
          if (typeof top === 'string') setDebateTopic(top)
        } else if (m.type === 'roster_update') {
          const list = payload.debaters
          setDebaters(Array.isArray(list) ? (list as DebaterInfo[]) : [])
        } else if (m.type === 'transcript_cleared') {
          setTranscriptLines([])
          setLiveStreams({})
          setFloorDebaterId(null)
          setFloorTurnId(null)
          floorTurnIdRef.current = null
          floorDebaterIdRef.current = null
        } else if (m.type === 'debater_activity') {
          const debater_id = payload.debater_id as string | undefined
          const phase = payload.phase as string | undefined
          const tk = payload.tick as number | undefined
          const detail = payload.detail as Record<string, unknown> | undefined
          if (debater_id) {
            setActivityByDebater((prev) => {
              const next = new Map(prev)
              next.set(debater_id, {
                phase: phase || '',
                tick: typeof tk === 'number' ? tk : 0,
                detail: detail && typeof detail === 'object' ? detail : {},
                at: Date.now(),
              })
              return next
            })
          }
        } else if (m.type === 'transcript_append') {
          const e = payload.event as Record<string, unknown> | undefined
          if (!e || typeof e !== 'object') return
          const tsMs = typeof e.ts_ms === 'number' ? e.ts_ms : Date.now()
          const ts = formatDebateTimestamp(tsMs)
          const kind = typeof e.kind === 'string' ? e.kind : ''
          const rawData = e.data
          const d =
            rawData && typeof rawData === 'object' && !Array.isArray(rawData)
              ? (rawData as Record<string, unknown>)
              : {}

          if (kind === 'topic') {
            const topicStr = String(d.topic ?? '')
            setDebateTopic(topicStr)
            appendTranscript(`[${ts}] Topic: ${topicStr}\n`)
          } else if (kind === 'speech') {
            const who = nameFor(String(d.debater_id ?? ''))
            appendTranscript(`[${ts}] ${who}:\n${String(d.text ?? '')}\n`)
            const tid = String(d.turn_id ?? '')
            if (tid) {
              setLiveStreams((prev) => {
                if (!(tid in prev)) return prev
                const next = { ...prev }
                delete next[tid]
                return next
              })
            }
            if (d.turn_id && d.turn_id === floorTurnIdRef.current) {
              setFloorDebaterId(null)
              setFloorTurnId(null)
              floorTurnIdRef.current = null
              floorDebaterIdRef.current = null
            }
          } else if (kind === 'turn_start') {
            const who = nameFor(String(d.debater_id ?? ''))
            appendTranscript(`[${ts}] ▶ ${who} begins (${String(d.round ?? '')})`)
            const tid = String(d.turn_id ?? '')
            const bid = String(d.debater_id ?? '')
            setFloorTurnId(tid || null)
            setFloorDebaterId(bid || null)
            floorTurnIdRef.current = tid || null
            floorDebaterIdRef.current = bid || null
          } else if (kind === 'turn_forced_end') {
            const who = nameFor(String(d.debater_id ?? ''))
            appendTranscript(`[${ts}] ■ ${who} stopped (${String(d.reason ?? '')})`)
            const tid = String(d.turn_id ?? '')
            if (tid) {
              setLiveStreams((prev) => {
                if (!(tid in prev)) return prev
                const next = { ...prev }
                delete next[tid]
                return next
              })
            }
            if (d.turn_id === floorTurnIdRef.current || d.debater_id === floorDebaterIdRef.current) {
              setFloorDebaterId(null)
              setFloorTurnId(null)
              floorTurnIdRef.current = null
              floorDebaterIdRef.current = null
            }
          } else if (kind === 'participant_removed') {
            const id = String(d.debater_id ?? '')
            if (id === floorDebaterIdRef.current) {
              setFloorDebaterId(null)
              setFloorTurnId(null)
              floorTurnIdRef.current = null
              floorDebaterIdRef.current = null
            }
            appendTranscript(`[${ts}] Removed debater ${id}`)
          } else {
            const fallback =
              rawData === undefined || rawData === null
                ? e
                : Array.isArray(rawData)
                  ? rawData
                  : typeof rawData === 'object'
                    ? rawData
                    : d
            appendTranscript(`[${ts}] ${kind || '?'}: ${JSON.stringify(fallback)}\n`)
          }
        } else if (m.type === 'turn_stream') {
          const turn_id = typeof payload.turn_id === 'string' ? payload.turn_id : ''
          const debater_id = typeof payload.debater_id === 'string' ? payload.debater_id : ''
          const delta = typeof payload.delta === 'string' ? payload.delta : String(payload.delta ?? '')
          if (!turn_id) return
          setLiveStreams((prev) => {
            const cur = prev[turn_id]?.text || ''
            const nextText = cur + delta
            const startedMs = prev[turn_id]?.startedMs ?? Date.now()
            return {
              ...prev,
              [turn_id]: { debaterId: debater_id, text: nextText, startedMs },
            }
          })
        } else if (m.type === 'announce') {
          const stamp = formatDebateTimestamp(Date.now())
          appendTranscript(`[${stamp}] [Confucius] ${String(payload.text ?? '')}\n`)
        } else if (m.type === 'error') {
          const stamp = formatDebateTimestamp(Date.now())
          appendTranscript(`[${stamp}] [error] ${String(payload.message ?? 'unknown error')}\n`)
        }
      } catch (err) {
        appendTranscript(
          `[${formatDebateTimestamp(Date.now())}] [wire] Error handling message (${m.type}): ${String(err)}\n`
        )
      }
    }
  }, [appendTranscript, chairKey, clearTick, disconnect])

  useEffect(() => {
    if (!connected) return
    tickRef.current = setInterval(() => setActivityNow(Date.now()), 1000)
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
      const ago = Math.max(0, Math.round((activityNow - a.at) / 100) / 10)
      lines.push(`${who}: ${phase} #${tickN}${extra ? ` · ${extra}` : ''} · ${ago}s ago`)
    }
    return lines.join('   |   ')
  }, [activityByDebater, activityNow, speakerName])

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
  }, [activityByDebater, floorDebaterId, floorTurnId, liveStreams, speakerName])

  const value: ChairContextValue = {
    chairKey,
    setChairKey,
    hallName,
    sessionLoading,
    sessionError,
    refreshSession,
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
    debateTopic,
  }

  return <ChairContext.Provider value={value}>{children}</ChairContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useChair(): ChairContextValue {
  const ctx = useContext(ChairContext)
  if (!ctx) throw new Error('useChair must be used within ChairProvider')
  return ctx
}
