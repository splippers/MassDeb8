import { Link } from 'react-router-dom'

export function AboutTmi() {
  return (
    <div className="sic-about">
      <div className="sic-panel fade-in">
        <h2 className="sic-h2">TMI — The VAR</h2>
        <p className="sic-muted">
          Pen name: <em>Thinking Man&apos;s Idiot</em>. Nickname: Tim. Meta-referee, keeper of the scrolls, occasional chaos
          catalyst.
        </p>
        <p className="sic-body">
          He may pause reality, rewind ten seconds, declare metaphysical offside, or interrupt Godzilla. He is powerful and not
          always helpful.
        </p>
        <p className="sic-whisper">Even geniuses are ridiculous.</p>
        <Link className="sic-btn sic-btn-primary" to="/">
          Return
        </Link>
      </div>
    </div>
  )
}
