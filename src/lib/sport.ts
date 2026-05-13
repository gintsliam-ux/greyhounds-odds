export type Sport = 'thoroughbreds' | 'harness' | 'greyhounds'

export const SPORTS: Sport[] = ['thoroughbreds', 'greyhounds', 'harness']

export const SPORT_TABLES: Record<Sport, { meetings: string; races: string; runners: string; odds: string }> = {
  thoroughbreds: {
    meetings: 'racing_meetings',
    races: 'racing_races',
    runners: 'racing_runners',
    odds: 'racing_odds',
  },
  harness: {
    meetings: 'harness_meetings',
    races: 'harness_races',
    runners: 'harness_runners',
    odds: 'harness_odds',
  },
  greyhounds: {
    meetings: 'greyhound_meetings',
    races: 'greyhound_races',
    runners: 'greyhound_runners',
    odds: 'greyhound_odds',
  },
}

export const SPORT_LABELS: Record<Sport, { singular: string; plural: string }> = {
  thoroughbreds: { singular: 'Thoroughbred', plural: 'Thoroughbreds' },
  harness: { singular: 'Harness', plural: 'Harness' },
  greyhounds: { singular: 'Greyhound', plural: 'Greyhounds' },
}

export function isSport(s: string | undefined | null): s is Sport {
  return s === 'thoroughbreds' || s === 'harness' || s === 'greyhounds'
}

export function sportFromPath(s: string | undefined | null): Sport {
  return isSport(s) ? s : 'thoroughbreds'
}
