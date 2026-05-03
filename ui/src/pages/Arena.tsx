import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ControlKnobs } from '../components/ControlKnobs'
import { DebatePortraitStrip } from '../components/DebatePortraitStrip'
import { EmptyChamber } from '../components/EmptyChamber'
import { LiveStreamPopout } from '../components/LiveStreamPopout'
import { TopicTicker } from '../components/TopicTicker'
import { useChair } from '../context/ChairContext'
export function Arena() {
  const {
    chairKey,
    sessionLoading,
    sessionError,
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
    debateTopic,
    floorDebaterId,
  } = useChair()

  const [knobsOpen, setKnobsOpen] = useState(false)
  const [targetId, setTargetId] = useState('')
  const [redirectText, setRedirectText] = useState('')

  useEffect(() => {
    if (sessionLoading) return
    if (!chairKey.trim()) return
    connect()
    return () => disconnect()
  }, [chairKey, connect, disconnect, sessionLoading])

  useEffect(() => {
    const online = debaters.filter((d) => d.connected)
    if (!online.find((d) => d.debater_id === targetId)) {
      setTargetId(online[0]?.debater_id || '')
    }
  }, [debaters, targetId])

  const onlineDebaters = debaters.filter((d) => d.connected)
  const showEmptyChamber = connected && onlineDebaters.length === 0

  const portraitRow = useMemo(() => {
    return [...debaters].sort((a, b) => {
      const na = a.name.toLowerCase()
      const nb = b.name.toLowerCase()
      if (na !== nb) return na.localeCompare(nb)
      return a.debater_id.localeCompare(b.debater_id)
    })
  }, [debaters])

  const doRedirect = useCallback(() => {
    if (!targetId) return
    send('chair_redirect', { debater_id: targetId, redirect: redirectText, reason: 'chair' })
  }, [redirectText, send, targetId])

  const archiveDebate = useCallback(() => {
    if (!connected) return
    if (!window.confirm('Archive this debate on the server and clear the live transcript?')) return
    send('chair_archive_debate', {})
  }, [connected, send])

  return (
    <div className="sic-arena">
      <header className="sic-arena-header">
        <TopicTicker text={debateTopic} />
        <div className="sic-var-strip">
          <button
            type="button"
            className="sic-var-btn"
            disabled={!connected}
            title="Summon TIM / full VAR review when the debate overheats"
            onClick={() => send('chair_summon_tim', {})}
          >
            VAR — Summon Tim
          </button>
          <span className="sic-var-strip-hint">Pitch-side review when rhetoric runs hot.</span>
        </div>
        <div className="sic-arena-header-inner">
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
            <button
              type="button"
              className="sic-btn"
              title="Copy the live transcript into a server archive and clear the scroll"
              disabled={!connected}
              onClick={archiveDebate}
            >
              Archive &amp; clear
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

        <DebatePortraitStrip
          debaters={portraitRow}
          floorDebaterId={floorDebaterId}
          connected={connected}
          send={send}
        />

        {sessionLoading ? <p className="sic-banner sic-banner-muted">Loading chair session…</p> : null}
        {!sessionLoading && sessionError ? <p className="sic-banner sic-banner-warn">{sessionError}</p> : null}
        {!sessionLoading && !chairKey.trim() ? (
          <p className="sic-banner sic-banner-warn">
            No chair key yet. Open the lobby or ensure the arena is running so /api/state can provide one.
          </p>
        ) : null}
        </div>
      </header>

      <div className="sic-arena-grid">
        <aside className="sic-panel sic-rail sic-rail-roster">
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
          {showEmptyChamber ? <EmptyChamber onOpenKnobs={() => setKnobsOpen(true)} /> : null}
          <div className="sic-transcript">
            {transcriptLines.map((line) => (
              <div key={line.id} className="sic-transcript-line">
                {line.text}
              </div>
            ))}
          </div>
        </main>

        <aside className="sic-panel sic-rail sic-rail-actions">
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
            <option value="">— select debater —</option>
            {onlineDebaters.map((d) => (
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

      <LiveStreamPopout liveStreams={liveStreams} speakerName={speakerName} />

      <button
        type="button"
        className={`sic-knobs-tab ${knobsOpen ? 'sic-knobs-tab-open' : ''}`}
        aria-expanded={knobsOpen}
        aria-controls="sic-control-knobs-panel"
        title={knobsOpen ? 'Close Control Knobs' : 'Open Control Knobs'}
        onClick={() => setKnobsOpen((v) => !v)}
      >
        Knobs
      </button>

      <ControlKnobs open={knobsOpen} onClose={() => setKnobsOpen(false)} />
    </div>
  )
}
