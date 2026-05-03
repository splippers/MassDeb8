import { useEffect, useMemo, useState } from 'react'
import { formatDebateTimestamp } from '../lib/debateTime'
import type { LiveStream } from '../types'

type Props = {
  liveStreams: Record<string, LiveStream>
  speakerName: (debaterId: string) => string
}

export function LiveStreamPopout({ liveStreams, speakerName }: Props) {
  const [open, setOpen] = useState(false)

  const turnIds = useMemo(() => Object.keys(liveStreams), [liveStreams])
  const sortedTurnIds = useMemo(() => {
    return [...turnIds].sort((a, b) => {
      const sa = liveStreams[a]?.startedMs ?? 0
      const sb = liveStreams[b]?.startedMs ?? 0
      return sb - sa
    })
  }, [turnIds, liveStreams])

  const totalChars = useMemo(
    () => turnIds.reduce((acc, id) => acc + (liveStreams[id]?.text?.length ?? 0), 0),
    [turnIds, liveStreams]
  )

  const hasLive = turnIds.length > 0

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!hasLive) return null

  return (
    <>
      <div className="sic-live-popout">
        {!open ? (
          <button
            type="button"
            className="sic-live-popout-trigger"
            onClick={() => setOpen(true)}
            aria-expanded={false}
            aria-controls="sic-live-popout-panel"
          >
            <span className="sic-live-popout-trigger-dot" aria-hidden />
            Live stream
            <span className="sic-live-popout-trigger-meta">{totalChars.toLocaleString()} chars</span>
            <span className="sic-live-popout-trigger-hint">Expand</span>
          </button>
        ) : (
          <>
            <button type="button" className="sic-live-popout-scrim" aria-label="Close live panel" onClick={() => setOpen(false)} />
            <div
              id="sic-live-popout-panel"
              className="sic-live-popout-panel"
              role="dialog"
              aria-label="Live generation"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sic-live-popout-head">
                <span className="sic-live-popout-title">Live generation</span>
                <button type="button" className="sic-live-popout-close" onClick={() => setOpen(false)}>
                  Close
                </button>
              </div>
              <div className="sic-live-popout-body">
                {sortedTurnIds.map((turnId) => {
                  const L = liveStreams[turnId]
                  if (!L) return null
                  return (
                    <div key={turnId} className="sic-live-block">
                      <div className="sic-live-title">
                        {L.startedMs != null ? (
                          <span className="sic-live-ts">{formatDebateTimestamp(L.startedMs)} · </span>
                        ) : null}
                        {speakerName(L.debaterId)} <span className="sic-muted">(live)</span>
                      </div>
                      <pre className="sic-live-pre">{L.text}</pre>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
