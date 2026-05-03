type Props = {
  text: string
}

/** Horizontally scrolling debate topic (ticker tape). */
export function TopicTicker({ text }: Props) {
  const label = text.trim() || 'Topic — set in Control Knobs when connected'
  const segment = `${label}   ·   `
  return (
    <div className="sic-topic-ticker" aria-label={`Debate topic: ${label}`}>
      <div className="sic-topic-ticker-label">Topic</div>
      <div className="sic-topic-ticker-mask">
        <div className="sic-topic-ticker-track">
          <span className="sic-topic-ticker-item">{segment}</span>
          <span className="sic-topic-ticker-item" aria-hidden="true">
            {segment}
          </span>
        </div>
      </div>
    </div>
  )
}
