import type { DebaterInfo } from '../types'
import { displayInitials } from '../lib/displayInitials'
import { portraitAssetUrl } from '../lib/personaPortraitSlug'

type Props = {
  debater: DebaterInfo
  speaking: boolean
  /** Disables portrait activation (e.g. offline debater or disconnected chair). */
  disabled?: boolean
  /** When set, portrait is a button — click assigns floor / referee action. */
  onActivate?: () => void
  /** Visual variant for the referee tile. */
  variant?: 'debater' | 'referee'
}

export function DebatePortrait({
  debater,
  speaking,
  disabled = false,
  onActivate,
  variant = 'debater',
}: Props) {
  const src = portraitAssetUrl(debater.persona)
  const initials = displayInitials(debater.name)
  const label = debater.connected ? debater.name : `${debater.name} (offline)`

  const classes = [
    'sic-debate-portrait',
    variant === 'referee' ? 'sic-debate-portrait--referee' : '',
    speaking ? 'sic-debate-portrait--speaking' : '',
    debater.connected ? '' : 'sic-debate-portrait--offline',
    onActivate ? 'sic-debate-portrait--clickable' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const frame = (
    <>
      <div className="sic-debate-portrait-frame">
        <div className="sic-debate-portrait-placeholder" aria-hidden="true">
          <span className="sic-debate-portrait-initials">{initials}</span>
        </div>
        <img
          className="sic-debate-portrait-img"
          src={src}
          alt=""
          decoding="async"
          loading="lazy"
          onLoad={(e) => e.currentTarget.classList.add('sic-debate-portrait-img--loaded')}
          onError={(e) => e.currentTarget.remove()}
        />
      </div>
      <span className="sic-debate-portrait-caption">{debater.name}</span>
    </>
  )

  if (onActivate) {
    return (
      <button
        type="button"
        className={`sic-debate-portrait-btn ${classes}`}
        disabled={disabled}
        aria-label={
          variant === 'referee'
            ? disabled
              ? 'Confucius (connect chair to activate)'
              : 'Confucius — referee pronouncement'
            : disabled
              ? `${label} (unavailable)`
              : speaking
                ? `${label}, speaking — click to keep floor`
                : `${label} — click to give floor`
        }
        aria-pressed={variant === 'debater' ? speaking : undefined}
        onClick={onActivate}
      >
        {frame}
      </button>
    )
  }

  return (
    <figure className={classes} aria-label={speaking ? `${label}, speaking` : label}>
      {frame}
    </figure>
  )
}
