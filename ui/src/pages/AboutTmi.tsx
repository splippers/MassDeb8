import { Link } from 'react-router-dom'
import { getCourtOfPublicOpinionPlaceholder } from '../lib/varEscalationPlaceholder'

export function AboutTmi() {
  const courtPlaceholder = getCourtOfPublicOpinionPlaceholder()

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
        <section id="court-of-public-opinion-placeholder" className="sic-atrium-var-placeholder">
          <h3 className="sic-h3">{courtPlaceholder.label}</h3>
          <p className="sic-muted">
            Placeholder escalation hook above VAR: {courtPlaceholder.nickname}. TODO: wire final procedural behaviour later.
          </p>
        </section>
        <p className="sic-whisper">Even geniuses are ridiculous.</p>
        <Link className="sic-btn sic-btn-primary" to="/">
          Return
        </Link>
      </div>
    </div>
  )
}
