import type { ReactNode } from 'react'
import type { AtriumCategory, AtriumPortrait, AtriumVenue } from '../lib/atriumPlaceholders'
import type { LanSessionDescriptor } from '../lib/lanSessionPlaceholder'

type PlaceholderImageProps = {
  id: string
  label: string
}

export function PlaceholderImage({ id, label }: PlaceholderImageProps) {
  return (
    <div id={id} className="sic-placeholder-image" aria-label={label}>
      {label}
    </div>
  )
}

type AtriumContainerProps = {
  stageNumber: 1 | 2 | 3
  title: string
  children: ReactNode
}

export function AtriumContainer({ stageNumber, title, children }: AtriumContainerProps) {
  return (
    <main className="sic-atrium">
      <section className="sic-panel sic-atrium-panel" aria-labelledby={`atrium-stage-${stageNumber}-title`}>
        <p className="sic-eyebrow">Atrium {stageNumber} of III</p>
        <h1 id={`atrium-stage-${stageNumber}-title`} className="sic-h2">
          {title}
        </h1>
        {children}
      </section>
    </main>
  )
}

type AtriumProgressProps = {
  currentStage: 1 | 2 | 3
}

export function AtriumProgress({ currentStage }: AtriumProgressProps) {
  return (
    <ol className="sic-atrium-progress" aria-label="Atrium progress">
      {[1, 2, 3].map((stage) => (
        <li
          key={stage}
          id={`atrium-progress-${stage}`}
          className={stage === currentStage ? 'sic-atrium-progress-current' : undefined}
          aria-current={stage === currentStage ? 'step' : undefined}
        >
          Atrium {stage}
        </li>
      ))}
    </ol>
  )
}

type VenueSelectionProps = {
  venues: AtriumVenue[]
  selectedVenueId: string
  onSelectVenue: (venueId: string) => void
}

export function VenueSelection({ venues, selectedVenueId, onSelectVenue }: VenueSelectionProps) {
  return (
    <div className="sic-atrium-grid" id="atrium-venue-selection-grid">
      {venues.map((venue) => (
        <button
          key={venue.id}
          id={venue.id}
          type="button"
          className="sic-placeholder-card"
          aria-pressed={venue.id === selectedVenueId}
          onClick={() => onSelectVenue(venue.id)}
        >
          <PlaceholderImage id={`${venue.id}-placeholder`} label="Venue placeholder" />
          <span>{venue.label}</span>
        </button>
      ))}
    </div>
  )
}

type CupboardGridProps = {
  categories: AtriumCategory[]
  selectedPortraitIds: string[]
  onTogglePortrait: (portraitId: string) => void
}

export function CupboardGrid({ categories, selectedPortraitIds, onTogglePortrait }: CupboardGridProps) {
  return (
    <div className="sic-cupboard-grid" id="atrium-category-cupboard-grid">
      {categories.map((category) => (
        <section key={category.id} id={category.id} className="sic-cupboard">
          <h2 className="sic-h3">{category.label}</h2>
          <PortraitScrollArea
            categoryId={category.id}
            portraits={category.portraits}
            selectedPortraitIds={selectedPortraitIds}
            onTogglePortrait={onTogglePortrait}
          />
        </section>
      ))}
    </div>
  )
}

type PortraitScrollAreaProps = {
  categoryId: string
  portraits: AtriumPortrait[]
  selectedPortraitIds: string[]
  onTogglePortrait: (portraitId: string) => void
}

export function PortraitScrollArea({
  categoryId,
  portraits,
  selectedPortraitIds,
  onTogglePortrait,
}: PortraitScrollAreaProps) {
  return (
    <div className="sic-portrait-scroll-area" id={`${categoryId}-portrait-scroll-area`}>
      {portraits.map((portrait) => {
        const selected = selectedPortraitIds.includes(portrait.id)
        return (
          <button
            key={portrait.id}
            id={portrait.id}
            type="button"
            className="sic-placeholder-card"
            aria-pressed={selected}
            onClick={() => onTogglePortrait(portrait.id)}
          >
            <PlaceholderImage id={`${portrait.id}-placeholder`} label="Portrait" />
            <span>{portrait.label}</span>
          </button>
        )
      })}
    </div>
  )
}

type ConfirmationSummaryProps = {
  venue: AtriumVenue | undefined
  roster: AtriumPortrait[]
}

export function ConfirmationSummary({ venue, roster }: ConfirmationSummaryProps) {
  return (
    <div className="sic-confirmation-grid" id="atrium-confirmation-summary">
      <section id="atrium-confirmation-venue" className="sic-confirmation-item">
        <h2 className="sic-h3">Chosen venue</h2>
        <p className="sic-muted">{venue?.label ?? 'No venue selected.'}</p>
      </section>
      <section id="atrium-confirmation-roster" className="sic-confirmation-item">
        <h2 className="sic-h3">Chosen roster</h2>
        {roster.length ? (
          <ul className="sic-atrium-roster">
            {roster.map((portrait) => (
              <li key={portrait.id} id={`${portrait.id}-confirmation`}>
                {portrait.label}
              </li>
            ))}
          </ul>
        ) : (
          <p className="sic-muted">No debaters selected.</p>
        )}
      </section>
    </div>
  )
}

type LanSessionJoinPlaceholderProps = {
  descriptor: LanSessionDescriptor | null
}

export function LanSessionJoinPlaceholder({ descriptor }: LanSessionJoinPlaceholderProps) {
  if (!descriptor) return null

  return (
    <section id="atrium-lan-session-placeholder" className="sic-panel sic-atrium-lan">
      <h2 className="sic-h3">LAN session</h2>
      <p className="sic-muted">
        Join Existing Debate Session: {descriptor.label} on port {descriptor.port}
      </p>
      <button type="button" id="atrium-join-existing-session" className="sic-btn">
        Join Existing Debate Session
      </button>
    </section>
  )
}
