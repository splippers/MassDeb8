import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AtriumContainer,
  AtriumProgress,
  ConfirmationSummary,
  CupboardGrid,
  LanSessionJoinPlaceholder,
  VenueSelection,
} from '../components/AtriumScaffold'
import { atriumCategories, atriumVenues } from '../lib/atriumPlaceholders'
import { scanForLanSessionDescriptor } from '../lib/lanSessionPlaceholder'

const ATRIUM_STAGES = ['Venue Selection', 'Debater/Senator Selection', 'Confirmation'] as const

export function Atrium() {
  const navigate = useNavigate()
  const [stage, setStage] = useState<1 | 2 | 3>(1)
  const [selectedVenueId, setSelectedVenueId] = useState(atriumVenues[0]?.id ?? '')
  const [selectedPortraitIds, setSelectedPortraitIds] = useState<string[]>([])

  const lanSession = useMemo(() => scanForLanSessionDescriptor(), [])
  const selectedVenue = atriumVenues.find((venue) => venue.id === selectedVenueId)
  const selectedPortraits = atriumCategories.flatMap((category) => category.portraits).filter((portrait) => {
    return selectedPortraitIds.includes(portrait.id)
  })

  const togglePortrait = (portraitId: string) => {
    setSelectedPortraitIds((current) => {
      if (current.includes(portraitId)) return current.filter((id) => id !== portraitId)
      return [...current, portraitId]
    })
  }

  return (
    <AtriumContainer
      stageNumber={stage}
      title={`Atrium ${stage} - ${ATRIUM_STAGES[stage - 1]}`}
    >
      <AtriumProgress currentStage={stage} />

      {stage === 1 ? (
        <section aria-labelledby="atrium-venue-heading">
          <h3 id="atrium-venue-heading" className="sic-h3">
            Select debate location
          </h3>
          <p className="sic-muted">Placeholder panels only. TODO: future venue art for mahogany and rich leather.</p>
          <LanSessionJoinPlaceholder descriptor={lanSession} />
          <VenueSelection venues={atriumVenues} selectedVenueId={selectedVenueId} onSelectVenue={setSelectedVenueId} />
        </section>
      ) : null}

      {stage === 2 ? (
        <section aria-labelledby="atrium-roster-heading">
          <h3 id="atrium-roster-heading" className="sic-h3">
            Select debaters/senators
          </h3>
          <p className="sic-muted">
            Category cupboards are structural placeholders. TODO: cupboard opening states and portrait assets.
          </p>
          <CupboardGrid
            categories={atriumCategories}
            selectedPortraitIds={selectedPortraitIds}
            onTogglePortrait={togglePortrait}
          />
        </section>
      ) : null}

      {stage === 3 ? (
        <section aria-labelledby="atrium-confirm-heading">
          <h3 id="atrium-confirm-heading" className="sic-h3">
            Confirm debate setup
          </h3>
          <ConfirmationSummary venue={selectedVenue} roster={selectedPortraits} />
          <button type="button" id="atrium-enter-arena" className="sic-btn sic-btn-primary" onClick={() => navigate('/arena')}>
            Enter Arena
          </button>
        </section>
      ) : null}

      <nav className="sic-atrium-nav" aria-label="Atrium navigation">
        <button
          type="button"
          className="sic-btn"
          disabled={stage === 1}
          onClick={() => setStage((value) => (value === 3 ? 2 : 1))}
        >
          Back
        </button>
        {stage < 3 ? (
          <button
            type="button"
            className="sic-btn sic-btn-primary"
            onClick={() => setStage((value) => (value === 1 ? 2 : 3))}
          >
            Continue
          </button>
        ) : null}
        <Link className="sic-btn" to="/">
          Exit atrium
        </Link>
      </nav>
    </AtriumContainer>
  )
}
