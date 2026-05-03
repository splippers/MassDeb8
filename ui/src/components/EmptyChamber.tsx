import { useCallback, useMemo, useState } from 'react'

type Props = {
  onOpenKnobs: () => void
}

export function EmptyChamber({ onOpenKnobs }: Props) {
  const [copied, setCopied] = useState(false)

  const inviteLine = useMemo(() => {
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const host = window.location.host
    return `python -m node.node --arena ${proto}://${host}/ws --name "Arguer" --persona socrates --ollama-model llama3`
  }, [])

  const copyInvite = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(inviteLine)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }, [inviteLine])

  return (
    <section className="sic-empty-chamber" aria-label="Empty chamber">
      <h3 className="sic-h3">The chamber is empty</h3>
      <p className="sic-muted">
        You are connected as Chair. No argumentors are on the floor yet. Run a debater node on any machine that can reach this host,
        or spawn one from the server using Control Knobs.
      </p>
      <p className="sic-muted">
        From the project root (with Ollama reachable at <code className="sic-code">127.0.0.1:11434</code> unless you override{' '}
        <code className="sic-code">--ollama-base</code>):
      </p>
      <div className="sic-empty-chamber-cmd">
        <pre className="sic-empty-chamber-pre">{inviteLine}</pre>
        <button type="button" className="sic-btn sic-btn-primary" onClick={copyInvite}>
          {copied ? 'Copied' : 'Copy command'}
        </button>
      </div>
      <p className="sic-muted">
        Adjust <code className="sic-code">--persona</code> and model to match your setup. Then open{' '}
        <button type="button" className="sic-link-btn" onClick={onOpenKnobs}>
          Control Knobs
        </button>{' '}
        to spawn a debater on this machine if <code className="sic-code">spawn</code> is enabled.
      </p>
    </section>
  )
}
