import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ControlKnobs } from '../components/ControlKnobs'
import { useChair } from '../context/ChairContext'

export function Arena() {
  const {
    chairKey,
    connected,
    connect,
    disconnect,
    send,
    debaters,
    speakerName,
    transcriptLines,
    liveStreams,
    activityStripText,
    pinnedFloorText,
  } = useChair()

  const [knobsOpen, setKnobsOpen] = useState(false)
  const [targetId, setTargetId] = useState('')
  const [redirectText, setRedirectText] = useState('')

  useEffect(() => {
    if (!chairKey.trim()) return
    connect()
    return () => disconnect()
  }, [chairKey, connect, disconnect])

  useEffect(() => {
    const online = debaters.filter((d) => d.connected)
    if (!online.find((d) => d.debater_id === targetId)) {
      setTargetId(online[0]?.debater_id || '')
    }
  }, [debaters, targetId])

  const liveTurnIds = Object.keys(liveStreams)

  const doRedirect = useCallback(() => {
    if (!targetId) return
    send('chair_redirect', { debater_id: targetId, redirect: redirectText, reason: 'chair' })
  }, [redirectText, send, targetId])

  return (
    <div className="sic-arena">
      <header className="sic-arena-header">
        <div className="sic-arena-header-row">
          <div className="sic-brand-group">
            <Link className="sic-link-quiet" to="/">
              ←
            </Link>
            <span className="sic-eyebrow">Chair</span>
            <span className={`sic-pill ${connected ? 'sic-pill-on' : 'sic-pill-off'}`}>
              {connected ? 'connected' : 'disconnected'}
            </span>
          </div>
          <div className="sic-row">
            <button type="button" className="sic-btn sic-btn-ghost" onClick={() => setKnobsOpen(true)}>
              Control Knobs
            </button>
            {!connected ? (
              <button type="button" className="sic-btn sic-btn-primary" onClick={connect}>
                Connect
              </button>
            ) : (
              <button type="button" className="sic-btn" onClick={disconnect}>
                Disconnect
              </button>
            )}
          </div>
        </div>
        <div className="sic-floor">
          <span className="sic-muted">Floor</span>
          <span className="sic-floor-body">{pinnedFloorText}</span>
        </div>
      </header>

      <div className="sic-arena-grid">
        <aside className="sic-panel sic-rail">
          <h2 className="sic-h2">Roster</h2>
          {!debaters.length ? (
            <p className="sic-muted">(none yet)</p>
          ) : (
            <ul className="sic-roster">
              {debaters.map((d) => (
                <li key={d.debater_id} className="sic-roster-row">
                  <div>
                    <strong>{d.name}</strong>{' '}
                    <span className="sic-muted">({d.persona || '?'})</span>
                  </div>
                  <div className="sic-muted">
                    {d.connected ? 'online' : 'offline'} · {d.ollama_model || ''}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <main className="sic-panel sic-stage">
          <div className="sic-activity">{activityStripText}</div>
          <div className="sic-transcript">
            {transcriptLines.map((line) => (
              <div key={line.id} className="sic-transcript-line">
                {line.text}
              </div>
            ))}
            {liveTurnIds.map((turnId) => {
              const L = liveStreams[turnId]
              if (!L) return null
              return (
                <div key={turnId} className="sic-live-block">
                  <div className="sic-live-title">
                    {speakerName(L.debaterId)} <span className="sic-muted">(live)</span>
                  </div>
                  <pre className="sic-live-pre">{L.text}</pre>
                </div>
              )
            })}
          </div>
        </main>

        <aside className="sic-panel sic-rail">
          <h2 className="sic-h2">Arena rail</h2>
          <p className="sic-muted">Minimal controls. Everything else lives in Control Knobs.</p>
          <div className="sic-row sic-stack">
            <button type="button" className="sic-btn sic-btn-primary" disabled={!connected} onClick={() => send('chair_start')}>
              Start
            </button>
            <button type="button" className="sic-btn" disabled={!connected} onClick={() => send('chair_next')}>
              Next
            </button>
            <button type="button" className="sic-btn" disabled={!connected} onClick={() => send('chair_pause')}>
              Pause
            </button>
            <button type="button" className="sic-btn" disabled={!connected} onClick={() => send('chair_resume')}>
              Resume
            </button>
          </div>
          <label className="sic-label">Target</label>
          <select className="sic-input" value={targetId} onChange={(e) => setTargetId(e.target.value)}>
            {debaters
              .filter((d) => d.connected)
              .map((d) => (
                <option key={d.debater_id} value={d.debater_id}>
                  {d.name}
                </option>
              ))}
          </select>
          <div className="sic-row sic-stack">
            <button
              type="button"
              className="sic-btn sic-btn-danger"
              disabled={!connected || !targetId}
              onClick={() => send('chair_interrupt', { debater_id: targetId, mode: 'hard_stop', reason: 'chair' })}
            >
              Interrupt
            </button>
            <button
              type="button"
              className="sic-btn sic-btn-danger"
              disabled={!connected || !targetId}
              onClick={() => send('chair_kick', { debater_id: targetId })}
            >
              Kick
            </button>
          </div>
          <textarea
            className="sic-textarea"
            rows={3}
            placeholder="Redirect instruction…"
            value={redirectText}
            onChange={(e) => setRedirectText(e.target.value)}
          />
          <button type="button" className="sic-btn" disabled={!connected || !targetId} onClick={doRedirect}>
            Redirect
          </button>
        </aside>
      </div>

      <ControlKnobs open={knobsOpen} onClose={() => setKnobsOpen(false)} />
    </div>
  )
}
