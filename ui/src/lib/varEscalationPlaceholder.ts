export type VarEscalationTier = 'var' | 'court-of-public-opinion'

export type VarEscalationPlaceholder = {
  id: string
  label: string
  tier: VarEscalationTier
  nickname?: string
  status: 'placeholder-only'
}

export const varEscalationPlaceholders: VarEscalationPlaceholder[] = [
  {
    id: 'var-tmi',
    label: "TMI (Thinking Man's Idiot)",
    tier: 'var',
    nickname: 'Tim',
    status: 'placeholder-only',
  },
  {
    id: 'court-public-opinion',
    label: 'Court of Public Opinion',
    tier: 'court-of-public-opinion',
    nickname: 'Philosophical Supreme Court of Vibes',
    status: 'placeholder-only',
  },
]

export function getCourtOfPublicOpinionPlaceholder(): VarEscalationPlaceholder {
  return varEscalationPlaceholders[1]
}
