import { useCallback, useEffect, useState } from 'react'
import { useChair } from '../context/ChairContext'
import { APPROVED_VENUE_NAMES } from '../constants/venues'

type Props = {
  open: boolean
  onClose: () => void
}

export function ControlKnobs({ open, onClose }: Props) {
  const { send, chairKey, connected } = useChair()

  const [topic, setTopic] = useState('')
  const [entEnabled, setEntEnabled] = useState(true)
  const [entCadence, setEntCadence] = useState(200)
  const [toneSeriousness, setToneSeriousness] = useState('')
  const [toneMonty, setToneMonty] = useState('')
  const [venue, setVenue] = useState<string>(APPROVED_VENUE_NAMES[2])
  const [eventKind, setEventKind] = useState('soft')
  const [eventLabel, setEventLabel] = useState('')
  const [spiral, setSpiral] = useState(0.15)

  const [personas, setPersonas] = useState<string[]>([])
  const [spawnPersona, setSpawnPersona] = useState('')
  const [spawnName, setSpawnName] = useState('')
  const [spawnModel, setSpawnModel] = useState('llama3')
  const [spawnOllamaBase, setSpawnOllamaBase] = useState('http://127.0.0.1:11434')
  const [spawnStatus, setSpawnStatus] = useState('')

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/state')
      const st = await res.json()
      setTopic(st.topic || '')
      setEntEnabled(!!st.ent_mode)
      setEntCadence(st.ent_cadence_ms || 200)
      setToneSeriousness(st.tone_override?.seriousness ?? '')
      setToneMonty(st.tone_override?.monty_factor ?? '')
      setVenue(st.venue || APPROVED_VENUE_NAMES[2])
      setSpiral(typeof st.spiral === 'number' ? st.spiral : 0.15)
    } catch {
      /* ignore */
    }
    try {
      const pr = await fetch('/api/personas')
      const data = await pr.json()
      setPersonas(data.personas || [])
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    if (open) void refresh()
  }, [open, refresh])

  const spawn = useCallback(async () => {
    if (!spawnPersona) {
      setSpawnStatus('Choose a persona.')
      return
    }
    if (!spawnName.trim()) {
      setSpawnStatus('Enter a display name.')
      return
    }
    if (!chairKey) {
      setSpawnStatus('Chair key missing.')
      return
    }
    setSpawnStatus('Spawning…')
    try {
      const res = await fetch('/api/spawn_debater', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chair_key: chairKey,
          name: spawnName.trim(),
          persona: spawnPersona,
          ollama_model: spawnModel.trim() || 'llama3',
          ollama_base: spawnOllamaBase.trim() || 'http://127.0.0.1:11434',
        }),
      })
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; pid?: number; arena_ws?: string }
      if (!res.ok || !j.ok) {
        setSpawnStatus(j.error || res.statusText || 'Spawn failed.')
        return
      }
      setSpawnStatus(`Started PID ${j.pid} (${j.arena_ws}).`)
    } catch (e) {
      setSpawnStatus(String(e))
    }
  }, [chairKey, spawnModel, spawnName, spawnOllamaBase, spawnPersona])

  if (!open) return null

  return (
    <>
      <button type="button" className="sic-drawer-scrim" aria-label="Close panel" onClick={onClose} />
      <aside className="sic-drawer fade-in" role="dialog" aria-label="Control Knobs">
        <div className="sic-drawer-head">
          <h2 className="sic-h2">Control Knobs</h2>
          <button type="button" className="sic-icon-btn" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="sic-drawer-body">
          <p className="sic-muted">
            Advanced settings stay here so the arena stays readable. Requires an active Chair connection for WebSocket actions.
          </p>

          <section className="sic-knob-section">
            <h3 className="sic-h3">Topic</h3>
            <div className="sic-row">
              <input className="sic-input" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic" />
              <button type="button" className="sic-btn" disabled={!connected} onClick={() => send('chair_set_topic', { topic })}>
                Set
              </button>
            </div>
          </section>

          <section className="sic-knob-section">
            <h3 className="sic-h3">Ent mode</h3>
            <label className="sic-check">
              <input type="checkbox" checked={entEnabled} onChange={(e) => setEntEnabled(e.target.checked)} /> enabled
            </label>
            <div className="sic-row">
              <input
                className="sic-input sic-input-narrow"
                type="number"
                min={0}
                value={entCadence}
                onChange={(e) => setEntCadence(Number(e.target.value))}
              />
              <span className="sic-muted">ms per message</span>
              <button
                type="button"
                className="sic-btn"
                disabled={!connected}
                onClick={() => send('chair_set_ent', { enabled: entEnabled, cadence_ms: entCadence })}
              >
                Apply
              </button>
            </div>
          </section>

          <section className="sic-knob-section">
            <h3 className="sic-h3">Tone override</h3>
            <p className="sic-muted">Leave blank for persona defaults.</p>
            <div className="sic-row">
              <span className="sic-muted">seriousness</span>
              <input
                className="sic-input sic-input-narrow"
                type="number"
                min={0}
                max={1}
                step={0.05}
                placeholder="(default)"
                value={toneSeriousness}
                onChange={(e) => setToneSeriousness(e.target.value)}
              />
            </div>
            <div className="sic-row">
              <span className="sic-muted">monty</span>
              <input
                className="sic-input sic-input-narrow"
                type="number"
                min={0}
                max={1}
                step={0.05}
                placeholder="(default)"
                value={toneMonty}
                onChange={(e) => setToneMonty(e.target.value)}
              />
            </div>
            <div className="sic-row">
              <button
                type="button"
                className="sic-btn"
                disabled={!connected}
                onClick={() =>
                  send('chair_set_tone', {
                    seriousness: toneSeriousness === '' ? null : Number(toneSeriousness),
                    monty_factor: toneMonty === '' ? null : Number(toneMonty),
                  })
                }
              >
                Apply
              </button>
              <button
                type="button"
                className="sic-btn"
                disabled={!connected}
                onClick={() => {
                  setToneSeriousness('')
                  setToneMonty('')
                  send('chair_set_tone', { seriousness: null, monty_factor: null })
                }}
              >
                Clear
              </button>
            </div>
          </section>

          <section className="sic-knob-section">
            <h3 className="sic-h3">Venue / events / spiral</h3>
            <div className="sic-row">
              <select className="sic-input" value={venue} onChange={(e) => setVenue(e.target.value)}>
                {APPROVED_VENUE_NAMES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              <button type="button" className="sic-btn" disabled={!connected} onClick={() => send('chair_set_venue', { venue })}>
                Set venue
              </button>
            </div>
            <div className="sic-row">
              <select className="sic-input sic-input-narrow" value={eventKind} onChange={(e) => setEventKind(e.target.value)}>
                <option value="soft">soft</option>
                <option value="hard">hard</option>
                <option value="catastrophic">catastrophic</option>
                <option value="meta">meta</option>
              </select>
              <input
                className="sic-input"
                value={eventLabel}
                onChange={(e) => setEventLabel(e.target.value)}
                placeholder="e.g. Godzilla Attack"
              />
              <button
                type="button"
                className="sic-btn sic-btn-danger"
                disabled={!connected}
                onClick={() => send('chair_trigger_event', { kind: eventKind, label: eventLabel })}
              >
                Trigger
              </button>
            </div>
            <div className="sic-row">
              <span className="sic-muted">spiral</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={spiral}
                onChange={(e) => setSpiral(Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <span className="sic-muted">{spiral.toFixed(2)}</span>
              <button type="button" className="sic-btn" disabled={!connected} onClick={() => send('chair_set_spiral', { spiral })}>
                Apply
              </button>
            </div>
          </section>

          <section className="sic-knob-section">
            <h3 className="sic-h3">Spawn debater (server)</h3>
            <p className="sic-muted">
              Runs <code className="sic-code">python -m node.node</code> on the arena host. Ollama must be reachable there.
            </p>
            <select className="sic-input" value={spawnPersona} onChange={(e) => setSpawnPersona(e.target.value)}>
              <option value="">— pick persona —</option>
              {personas.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <input
              className="sic-input"
              value={spawnName}
              onChange={(e) => setSpawnName(e.target.value)}
              placeholder="Display name"
            />
            <div className="sic-row">
              <input className="sic-input" value={spawnModel} onChange={(e) => setSpawnModel(e.target.value)} placeholder="model" />
              <input
                className="sic-input"
                value={spawnOllamaBase}
                onChange={(e) => setSpawnOllamaBase(e.target.value)}
                placeholder="Ollama base URL"
              />
            </div>
            <button type="button" className="sic-btn sic-btn-primary" onClick={() => void spawn()}>
              Spawn
            </button>
            {spawnStatus ? <p className="sic-hint">{spawnStatus}</p> : null}
          </section>
        </div>
      </aside>
    </>
  )
}
