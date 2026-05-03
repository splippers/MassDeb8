import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'

const HANDLE_KEY = 'sic_user_handle'
const MAX_HANDLE_LEN = 64

function readStoredHandle(): string {
  return (sessionStorage.getItem(HANDLE_KEY) || '').trim()
}

export function TitleScreen() {
  const [savedHandle, setSavedHandle] = useState(readStoredHandle)
  const [draft, setDraft] = useState('')

  const onSubmitHandle = (e: FormEvent) => {
    e.preventDefault()
    const t = draft.trim()
    if (!t) return
    sessionStorage.setItem(HANDLE_KEY, t)
    setSavedHandle(t)
  }

  const onChangeHandle = () => {
    sessionStorage.removeItem(HANDLE_KEY)
    setSavedHandle('')
    setDraft('')
  }

  if (!savedHandle) {
    return (
      <div className="sic-title">
        <form className="sic-title-inner sic-handle-gate fade-in" onSubmit={onSubmitHandle} autoComplete="username">
          <p className="sic-eyebrow">massdeb8</p>
          <h1 className="sic-display">Symposium of Infinite Contention</h1>
          <p className="sic-muted sic-handle-lead">Before you enter, choose how you would like to be addressed.</p>
          <label className="sic-label sic-handle-label" htmlFor="user-handle">
            Your handle
          </label>
          <input
            id="user-handle"
            className="sic-input sic-handle-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, MAX_HANDLE_LEN))}
            placeholder="e.g. Jordan, Doc42, The Chair"
            maxLength={MAX_HANDLE_LEN}
            autoComplete="nickname"
            spellCheck={false}
            autoFocus
          />
          <button type="submit" className="sic-btn sic-btn-primary sic-handle-submit">
            Continue
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="sic-title">
      <div className="sic-title-inner fade-in">
        <p className="sic-eyebrow">massdeb8</p>
        <p className="sic-welcome-greeting">Welcome to the debate, {savedHandle}!</p>
        <h1 className="sic-display">Symposium of Infinite Contention</h1>
        <p className="sic-tagline">Thus begins the Great Debate.</p>
        <p className="sic-whisper">
          A hush falls over the Gothic hall. Somewhere, dust motes drift through a cathedral beam. The Chair waits.
        </p>
        <p className="sic-handle-foot">
          <button type="button" className="sic-link-btn" onClick={onChangeHandle}>
            Use a different handle
          </button>
        </p>
        <div className="sic-title-actions">
          <Link className="sic-btn sic-btn-primary" to="/lobby">
            Enter the hall
          </Link>
          <Link className="sic-btn sic-btn-primary" to="/arena">
            Enter the empty hall
          </Link>
          <Link className="sic-btn" to="/about-tmi">
            About TMI (VAR)
          </Link>
        </div>
      </div>
    </div>
  )
}
