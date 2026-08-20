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

/** Harness runners have a driver, thoroughbreds a jockey, greyhounds neither. */
export function pilotPrefix(sport: Sport): 'J' | 'D' | null {
  return sport === 'harness' ? 'D' : sport === 'greyhounds' ? null : 'J'
}

/**
 * The people on a runner, prefixed for the code: "J: S Kok", "D: M Goetz",
 * "T: L Thong". Greyhounds list only a trainer.
 */
export function runnerPeople(
  sport: Sport,
  r: { jockey?: string | null; driver?: string | null; trainer?: string | null },
): string[] {
  const out: string[] = []
  const prefix = pilotPrefix(sport)
  const pilot = r.jockey ?? r.driver ?? null
  if (prefix && pilot) out.push(`${prefix}: ${pilot}`)
  if (r.trainer) out.push(`T: ${r.trainer}`)
  return out
}
