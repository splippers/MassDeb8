import { Link } from 'react-router-dom'

export function TitleScreen() {
  return (
    <div className="sic-title">
      <div className="sic-title-inner fade-in">
        <p className="sic-eyebrow">massdeb8</p>
        <h1 className="sic-display">Symposium of Infinite Contention</h1>
        <p className="sic-tagline">Thus begins the Great Debate.</p>
        <p className="sic-whisper">
          A hush falls over the Gothic hall. Somewhere, dust motes drift through a cathedral beam. The Chair waits.
        </p>
        <div className="sic-title-actions">
          <Link className="sic-btn sic-btn-primary" to="/lobby">
            Enter the hall
          </Link>
          <Link className="sic-btn" to="/about-tmi">
            About TMI (VAR)
          </Link>
        </div>
      </div>
    </div>
  )
}
