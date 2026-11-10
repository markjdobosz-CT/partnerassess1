// The eight weighted criteria of the Partnership Propensity Index.
// Weights add up to 100. Leadership Champion carries the most weight.
export const DIMENSIONS = [
  { id: 'mission', weight: 15 },
  { id: 'fit', weight: 12 },
  { id: 'community', weight: 10 },
  { id: 'capacity', weight: 12 },
  { id: 'engagement', weight: 10 },
  { id: 'champion', weight: 20 },
  { id: 'reputation', weight: 11 },
  { id: 'impact', weight: 10 },
]

export const ENTITY_TYPES = ['Corporate', 'Foundation', 'Business']

// Each rating from 1 to 5 maps to 0..100 for its criterion, then is weighted.
export function computeScore(scores) {
  let total = 0
  for (const d of DIMENSIONS) {
    const s = Number(scores?.[d.id])
    if (!s) return null
    total += d.weight * ((s - 1) / 4)
  }
  return Math.round(total * 10) / 10
}

export function tierFor(score) {
  if (score === null || score === undefined) return null
  if (score >= 80) return 'sr'
  if (score >= 62) return 'r'
  if (score >= 40) return 'n'
  if (score >= 22) return 'nr'
  return 'snr'
}

export const TIER_COLORS = {
  sr: '#0f8a4f',
  r: '#4a9d3a',
  n: '#c28a00',
  nr: '#d4622a',
  snr: '#c0392b',
}
