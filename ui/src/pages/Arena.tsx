import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
    transcriptLines,
    liveStreams,
    activityStripText,
    pinnedFloorText,
    debateTopic,
    floorDebaterId,
    speakerName,
  } = useChair()

  const [knobsOpen, setKnobsOpen] = useState(false)
  const [targetId, setTargetId] = useState('')
  const [redirectText, setRedirectText] = useState('')
  const [gavelFlash, setGavelFlash] = useState(false)
  const transcriptEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcriptLines])

  const doGavel = useCallback(() => {
    send('chair_gavel', {})
    setGavelFlash(false)
    requestAnimationFrame(() => setGavelFlash(true))
    setTimeout(() => setGavelFlash(false), 600)
  }, [send])

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
    if (!targetId || !redirectText.trim()) return
    send('chair_redirect', { debater_id: targetId, redirect: redirectText, reason: 'chair' })
    setRedirectText('')
  }, [redirectText, send, targetId])

  const archiveDebate = useCallback(() => {
    if (!connected) return
    if (!window.confirm('Archive this debate and clear the transcript?')) return
    send('chair_archive_debate', {})
  }, [connected, send])

  return (
    <div className={`sic-arena${gavelFlash ? ' sic-arena--gavel-flash' : ''}`}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="sic-arena-header">

        {/* Row 1: nav + status + gavel + session controls */}
        <div className="sic-arena-bar">
          <div className="sic-arena-bar-left">
            <Link className="sic-link-quiet" to="/" title="Back to title">←</Link>
            <span className="sic-eyebrow">SIC</span>
            <span className={`sic-pill ${connected ? 'sic-pill-on' : 'sic-pill-off'}`}>
              {connected ? 'live' : 'offline'}
            </span>
          </div>

          <div className="sic-arena-bar-center">
            <button
              type="button"
              className="sic-gavel-btn"
              disabled={!connected}
              onClick={doGavel}
              title="Bang the gavel — silence the floor"
            >
              ⚖ ORDER!
            </button>
            <button
              type="button"
              className="sic-var-inline-btn"
              disabled={!connected}
              title="Summon VAR — Tim reviews when rhetoric runs hot"
              onClick={() => send('chair_summon_tim', {})}
            >
              VAR
            </button>
          </div>

          <div className="sic-arena-bar-right">
            <button type="button" className="sic-btn sic-btn-ghost" onClick={() => setKnobsOpen(true)}>
              Knobs
            </button>
            <button type="button" className="sic-btn sic-btn-ghost" disabled={!connected} onClick={archiveDebate}>
              Archive
            </button>
            {!connected
              ? <button type="button" className="sic-btn sic-btn-primary" onClick={connect}>Connect</button>
              : <button type="button" className="sic-btn sic-btn-ghost" onClick={disconnect}>Disconnect</button>
            }
          </div>
        </div>

        {/* Row 2: topic ticker */}
        <TopicTicker text={debateTopic} />

        {/* Row 3: portrait strip */}
        <DebatePortraitStrip
          debaters={portraitRow}
          floorDebaterId={floorDebaterId}
          connected={connected}
          send={send}
        />

        {/* Banners (errors / loading) */}
        {sessionLoading && <p className="sic-banner sic-banner-muted">Loading session…</p>}
        {!sessionLoading && sessionError && <p className="sic-banner sic-banner-warn">{sessionError}</p>}
        {!sessionLoading && !chairKey.trim() && (
          <p className="sic-banner sic-banner-warn">No chair key — is the arena running?</p>
        )}
      </header>

      {/* ── Transcript ──────────────────────────────────────────────────── */}
      <main className="sic-arena-main">
        {showEmptyChamber && <EmptyChamber onOpenKnobs={() => setKnobsOpen(true)} />}
        <div className="sic-transcript">
          {transcriptLines.map((line) => (
            <div key={line.id} className="sic-transcript-line">{line.text}</div>
          ))}
          <div ref={transcriptEndRef} />
        </div>
      </main>

      {/* ── Control bar ─────────────────────────────────────────────────── */}
      <footer className="sic-arena-footer">
        <div className="sic-footer-floor">
          {pinnedFloorText}
        </div>
        <div className="sic-footer-controls">
          <div className="sic-footer-playback">
            <button type="button" className="sic-btn sic-btn-primary" disabled={!connected} onClick={() => send('chair_start')}>Start</button>
            <button type="button" className="sic-btn" disabled={!connected} onClick={() => send('chair_next')}>Next</button>
            <button type="button" className="sic-btn" disabled={!connected} onClick={() => send('chair_pause')}>Pause</button>
            <button type="button" className="sic-btn" disabled={!connected} onClick={() => send('chair_resume')}>Resume</button>
          </div>
          <div className="sic-footer-target">
            <select
              className="sic-input sic-footer-select"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              disabled={!connected || !onlineDebaters.length}
            >
              <option value="">— target —</option>
              {onlineDebaters.map((d) => (
                <option key={d.debater_id} value={d.debater_id}>{d.name}</option>
              ))}
            </select>
            <button type="button" className="sic-btn sic-btn-danger" disabled={!connected || !targetId}
              onClick={() => send('chair_interrupt', { debater_id: targetId, mode: 'hard_stop', reason: 'chair' })}>
              Interrupt
            </button>
            <button type="button" className="sic-btn sic-btn-danger" disabled={!connected || !targetId}
              onClick={() => send('chair_kick', { debater_id: targetId })}>
              Kick
            </button>
          </div>
          <div className="sic-footer-redirect">
            <input
              className="sic-input sic-footer-redirect-input"
              placeholder="Redirect…"
              value={redirectText}
              onChange={(e) => setRedirectText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doRedirect()}
              disabled={!connected || !targetId}
            />
            <button type="button" className="sic-btn" disabled={!connected || !targetId || !redirectText.trim()} onClick={doRedirect}>
              →
            </button>
          </div>
        </div>
        <div className="sic-footer-activity">{activityStripText}</div>
      </footer>

      <LiveStreamPopout liveStreams={liveStreams} speakerName={speakerName} />

      <button
        type="button"
        className={`sic-knobs-tab ${knobsOpen ? 'sic-knobs-tab-open' : ''}`}
        aria-expanded={knobsOpen}
        onClick={() => setKnobsOpen((v) => !v)}
      >
        Knobs
      </button>

      <ControlKnobs open={knobsOpen} onClose={() => setKnobsOpen(false)} />
    </div>
  )
}
