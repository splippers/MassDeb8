import type { DebaterInfo } from '../types'
import { DebatePortrait } from './DebatePortrait'

const CONFUCIUS_DEBATER: DebaterInfo = {
  debater_id: '__referee_confucius',
  name: 'Confucius',
  persona: 'confucius',
  ollama_model: null,
  connected: true,
}

type Props = {
  debaters: DebaterInfo[]
  floorDebaterId: string | null
  connected: boolean
  send: (type: string, payload?: Record<string, unknown>) => void
}

/** Centered horizontal row: debaters + referee (below the Floor strip). */
export function DebatePortraitStrip({ debaters, floorDebaterId, connected, send }: Props) {
  return (
    <div className="sic-portrait-strip" role="presentation" aria-label="Speakers and referee">
      {debaters.length === 0 ? (
        <p className="sic-portrait-strip-empty sic-muted">No debaters yet.</p>
      ) : null}
      {debaters.map((d) => (
        <DebatePortrait
          key={d.debater_id}
          debater={d}
          speaking={floorDebaterId === d.debater_id}
          disabled={!connected || !d.connected}
          variant="debater"
          onActivate={() => send('chair_call_debater', { debater_id: d.debater_id })}
        />
      ))}
      <DebatePortrait
        debater={CONFUCIUS_DEBATER}
        speaking={false}
        disabled={!connected}
        variant="referee"
        onActivate={() => send('chair_confucius_pronounce', {})}
      />
    </div>
  )
}
