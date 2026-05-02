import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useChair } from '../context/ChairContext'

export function Lobby() {
  const { chairKey, setChairKey } = useChair()
  const navigate = useNavigate()
  const [hint, setHint] = useState<string | null>(null)

  const fetchKey = useCallback(async () => {
    try {
      const res = await fetch('/api/state')
      const st = await res.json()
      if (st.chair_key) setChairKey(st.chair_key)
      setHint('Loaded chair key from the arena.')
    } catch {
      setHint('Could not reach /api/state (is the arena running?)')
    }
  }, [setChairKey])

  const enterArena = useCallback(() => {
    if (!chairKey.trim()) {
      setHint('Paste a chair key first (or fetch from /api/state).')
      return
    }
    navigate('/arena')
  }, [chairKey, navigate])

  return (
    <div className="sic-lobby">
      <div className="sic-panel fade-in">
        <h2 className="sic-h2">Lobby</h2>
        <p className="sic-muted">
          You are the Chair. Take a breath. When you enter the arena, the transcript becomes the stage.
        </p>
        <label className="sic-label">Chair key</label>
        <div className="sic-row">
          <input
            className="sic-input"
            value={chairKey}
            onChange={(e) => setChairKey(e.target.value)}
            placeholder="from GET /api/state"
            autoComplete="off"
            spellCheck={false}
          />
          <button type="button" className="sic-btn" onClick={fetchKey}>
            Fetch
          </button>
        </div>
        {hint ? <p className="sic-hint">{hint}</p> : null}
        <div className="sic-row sic-lobby-actions">
          <button type="button" className="sic-btn sic-btn-primary" onClick={enterArena}>
            Enter arena
          </button>
          <Link className="sic-btn" to="/">
            Back
          </Link>
        </div>
        <section className="sic-instructions">
          <h3 className="sic-h3">How to run</h3>
          <ol className="sic-ol">
            <li>Start Ollama where your nodes will call it.</li>
            <li>
              Start the arena: <code className="sic-code">uvicorn arena.app:app --host 0.0.0.0 --port 8787</code>
            </li>
            <li>
              Dev UI: in <code className="sic-code">ui/</code>, run <code className="sic-code">npm run dev</code> (proxies{' '}
              <code className="sic-code">/api</code> and <code className="sic-code">/ws</code>).
            </li>
            <li>Prod UI: <code className="sic-code">npm run build</code>, then open the arena URL (serves the SPA).</li>
            <li>Launch debater nodes (or use Spawn in Control Knobs when connected).</li>
          </ol>
        </section>
      </div>
    </div>
  )
}
