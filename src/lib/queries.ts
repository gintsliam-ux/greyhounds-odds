import { supabase } from './supabase'
import type { Meeting, Race, Runner, Odds } from '../types'
import { SPORT_TABLES, type Sport } from './sport'

export async function fetchMeetings(sport: Sport, date?: string): Promise<Meeting[]> {
  const t = SPORT_TABLES[sport]
  let q = supabase.from(t.meetings).select('*').order('track')
  if (date) q = q.eq('date', date)
  else q = q.order('date', { ascending: false })
  const { data, error } = await q
  if (error) throw error
  return data as Meeting[]
}

export async function fetchMeeting(sport: Sport, id: string): Promise<Meeting | null> {
  const t = SPORT_TABLES[sport]
  const { data, error } = await supabase.from(t.meetings).select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data as Meeting | null
}

export async function fetchRacesForMeetings(sport: Sport, meetingIds: string[]): Promise<Race[]> {
  if (meetingIds.length === 0) return []
  const t = SPORT_TABLES[sport]
  const { data, error } = await supabase
    .from(t.races)
    .select('*')
    .in('meeting_id', meetingIds)
    .order('race_number')
  if (error) throw error
  return data as Race[]
}

export async function fetchRacesForMeeting(sport: Sport, meetingId: string): Promise<Race[]> {
  const t = SPORT_TABLES[sport]
  const { data, error } = await supabase
    .from(t.races)
    .select('*')
    .eq('meeting_id', meetingId)
    .order('race_number')
  if (error) throw error
  return data as Race[]
}

export async function fetchRace(sport: Sport, id: string): Promise<Race | null> {
  const t = SPORT_TABLES[sport]
  const { data, error } = await supabase.from(t.races).select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data as Race | null
}

export async function fetchRunnersForRace(sport: Sport, raceId: string): Promise<Runner[]> {
  const t = SPORT_TABLES[sport]
  const orderCol = sport === 'greyhounds' ? 'box_number' : 'runner_number'
  const { data, error } = await supabase
    .from(t.runners)
    .select('*')
    .eq('race_id', raceId)
    .order(orderCol)
  if (error) throw error
  return data as Runner[]
}

export async function fetchOddsForRunners(sport: Sport, runnerIds: string[]): Promise<Odds[]> {
  if (runnerIds.length === 0) return []
  const t = SPORT_TABLES[sport]
  const { data, error } = await supabase
    .from(t.odds)
    .select('*')
    .in('runner_id', runnerIds)
  if (error) throw error
  return data as Odds[]
}

export interface NextRace extends Race {
  meeting: Meeting
  sport: Sport
}

export async function fetchNextToJumpForSport(sport: Sport, limit = 20): Promise<NextRace[]> {
  const t = SPORT_TABLES[sport]
  const nowIso = new Date().toISOString()
  const { data, error } = await supabase
    .from(t.races)
    .select(`*, meeting:${t.meetings}(*)`)
    .gte('start_time', nowIso)
    .not('status', 'in', '(Resulted,Closed,Abandoned)')
    .order('start_time', { ascending: true })
    .limit(limit)
  if (error) throw error
  return ((data as unknown as Omit<NextRace, 'sport'>[]) || []).map((r) => ({ ...r, sport }))
}

export interface RunnerSearchHit {
  id: string
  name: string
  driver: string | null
  jockey: string | null
  runner_number: number | null
  barrier_number: number | null
  box_number: number | null
  scratched_at: string | null
  race: Race & { meeting: Meeting }
}

export async function searchRunners(sport: Sport, query: string, limit = 30): Promise<RunnerSearchHit[]> {
  const q = query.trim()
  if (q.length < 2) return []
  const t = SPORT_TABLES[sport]
  const { data, error } = await supabase
    .from(t.runners)
    .select(`*, race:${t.races}(*, meeting:${t.meetings}(*))`)
    .ilike('name', `%${q}%`)
    .order('name')
    .limit(limit)
  if (error) throw error
  return (data as unknown as RunnerSearchHit[]) || []
}

export interface RunnerSearchHitWithSport extends RunnerSearchHit {
  sport: Sport
}

export async function searchRunnersAllSports(query: string, limit = 30): Promise<RunnerSearchHitWithSport[]> {
  const q = query.trim()
  if (q.length < 2) return []
  const sports: Sport[] = ['thoroughbreds', 'harness', 'greyhounds']
  const lists = await Promise.all(
    sports.map((s) =>
      searchRunners(s, q, limit)
        .then((hits) => hits.map((h) => ({ ...h, sport: s })))
        .catch(() => [] as RunnerSearchHitWithSport[])
    )
  )
  const now = Date.now()
  return lists
    .flat()
    .sort((a, b) => {
      const ta = new Date(a.race.start_time).getTime()
      const tb = new Date(b.race.start_time).getTime()
      const aFuture = ta >= now
      const bFuture = tb >= now
      if (aFuture !== bFuture) return aFuture ? -1 : 1
      return aFuture ? ta - tb : tb - ta
    })
    .slice(0, limit)
}

export async function fetchNextToJump(limit = 20): Promise<NextRace[]> {
  const results = await Promise.all([
    fetchNextToJumpForSport('thoroughbreds', limit),
    fetchNextToJumpForSport('harness', limit),
    fetchNextToJumpForSport('greyhounds', limit),
  ])
  return results.flat().sort((a, b) => a.start_time.localeCompare(b.start_time)).slice(0, limit)
}
