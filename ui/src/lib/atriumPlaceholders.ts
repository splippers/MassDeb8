export type AtriumVenue = {
  id: string
  label: string
  note: string
}

export type AtriumPortrait = {
  id: string
  label: string
  role: string
}

export type AtriumCategory = {
  id: string
  label: string
  portraits: AtriumPortrait[]
}

export const atriumVenues: AtriumVenue[] = [
  { id: 'venue-gothic-hall', label: 'Gothic Hall', note: 'Placeholder venue panel' },
  { id: 'venue-mahogany-chamber', label: 'Mahogany Chamber', note: 'Placeholder venue panel' },
  { id: 'venue-leather-atrium', label: 'Rich Leather Atrium', note: 'Placeholder venue panel' },
]

export const atriumCategories: AtriumCategory[] = [
  {
    id: 'category-philosophers',
    label: 'Philosophers',
    portraits: [
      { id: 'portrait-socrates', label: 'Socrates', role: 'Philosopher' },
      { id: 'portrait-aristotle', label: 'Aristotle', role: 'Philosopher' },
      { id: 'portrait-nietzsche', label: 'Nietzsche', role: 'Philosopher' },
    ],
  },
  {
    id: 'category-mixed-bag',
    label: 'Mixed Bag',
    portraits: [
      { id: 'portrait-beckenbauer', label: 'Beckenbauer', role: 'Mixed Bag' },
      { id: 'portrait-schlegel', label: 'Karl Schlegel', role: 'Mixed Bag' },
      { id: 'portrait-godzilla', label: 'Godzilla', role: 'Mixed Bag' },
    ],
  },
  {
    id: 'category-hideous-proclivities',
    label: 'Hideous Proclivities',
    portraits: [
      { id: 'portrait-bureaucrat', label: 'Bureaucrat', role: 'Placeholder' },
      { id: 'portrait-pedant', label: 'Pedant', role: 'Placeholder' },
      { id: 'portrait-heckler', label: 'Heckler', role: 'Placeholder' },
    ],
  },
  {
    id: 'category-context-aware',
    label: 'Context-aware category',
    portraits: [
      { id: 'portrait-context-one', label: 'Context Placeholder I', role: 'System-chosen placeholder' },
      { id: 'portrait-context-two', label: 'Context Placeholder II', role: 'System-chosen placeholder' },
      { id: 'portrait-context-three', label: 'Context Placeholder III', role: 'System-chosen placeholder' },
    ],
  },
]
