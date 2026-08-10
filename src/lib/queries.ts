import { supabase } from './supabase'
import type { Meeting, Race, Runner, Odds } from '../types'
import { SPORT_TABLES, type Sport } from './sport'
import { reuniteSessions } from './sessions'

function shiftIso(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export async function fetchMeetings(sport: Sport, date?: string): Promise<Meeting[]> {
  if (date) return (await fetchDay(sport, date)).meetings
  const t = SPORT_TABLES[sport]
  const { data, error } = await supabase
    .from(t.meetings)
    .select('*')
    .order('track')
    .order('date', { ascending: false })
  if (error) throw error
  return data as Meeting[]
}

// Everything running on a given day, with meetings the feed tore across its
// 19:00 UTC date boundary put back together (see ./sessions). Pulls the
// neighbouring days too, because a torn meeting's other half lives there.
export async function fetchDay(
  sport: Sport,
  date: string,
): Promise<{ meetings: Meeting[]; races: Race[] }> {
  const t = SPORT_TABLES[sport]
  const { data, error } = await supabase
    .from(t.meetings)
    .select('*')
    .in('date', [shiftIso(date, -1), date, shiftIso(date, 1)])
    .order('track')
  if (error) throw error

  const windowMeetings = (data || []) as Meeting[]
  const windowRaces = await fetchRacesForMeetings(sport, windowMeetings.map((m) => m.id))
  const reunited = reuniteSessions(windowMeetings, windowRaces)

  const meetings = reunited.meetings.filter((m) => m.date === date)
  const ids = new Set(meetings.map((m) => m.id))
  return { meetings, races: reunited.races.filter((r) => ids.has(r.meeting_id)) }
}

function racesOf(meeting: Meeting, races: Race[]): Race[] {
  return races
    .filter((r) => r.meeting_id === meeting.id)
    .sort((a, b) => a.race_number - b.race_number)
}

// The card a race sits on, including any of it the feed filed under the next
// day. Falls back to the raw row for meetings the day view no longer carries.
export async function fetchSessionRaces(sport: Sport, meeting: Meeting): Promise<Race[]> {
  const { races } = await fetchDay(sport, meeting.date)
  const mine = racesOf(meeting, races)
  return mine.length ? mine : fetchRacesForMeeting(sport, meeting.id)
}

// The meeting a race actually belongs to, for /races/:id links that only carry
// the row the feed filed the race under. If the race was the tail of a meeting
// that started the day before, that's the meeting we want.
export async function fetchRaceContext(
  sport: Sport,
  race: Race,
): Promise<{ meeting: Meeting | null; races: Race[] }> {
  const row = await fetchMeeting(sport, race.meeting_id)
  if (!row) return { meeting: null, races: [] }
  for (const date of [row.date, shiftIso(row.date, -1)]) {
    const { meetings, races } = await fetchDay(sport, date)
    const moved = races.find((r) => r.id === race.id)
    const meeting = moved && meetings.find((m) => m.id === moved.meeting_id)
    if (meeting) return { meeting, races: racesOf(meeting, races) }
  }
  return { meeting: row, races: await fetchRacesForMeeting(sport, row.id) }
}

export async function fetchMeeting(sport: Sport, id: string): Promise<Meeting | null> {
  const t = SPORT_TABLES[sport]
  const { data, error } = await supabase.from(t.meetings).select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data as Meeting | null
}

// Batched: a three-day window is enough meeting ids to blow the URL length that
// PostgREST accepts for `in`, which comes back as a bare 400.
const ID_BATCH = 50

export async function fetchRacesForMeetings(sport: Sport, meetingIds: string[]): Promise<Race[]> {
  if (meetingIds.length === 0) return []
  const t = SPORT_TABLES[sport]
  const batches: string[][] = []
  for (let i = 0; i < meetingIds.length; i += ID_BATCH) {
    batches.push(meetingIds.slice(i, i + ID_BATCH))
  }
  const results = await Promise.all(
    batches.map(async (ids) => {
      const { data, error } = await supabase
        .from(t.races)
        .select('*')
        .in('meeting_id', ids)
        .order('race_number')
      if (error) throw error
      return data as Race[]
    }),
  )
  return results.flat()
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
  const settled = await Promise.allSettled(
    sports.map((s) =>
      searchRunners(s, q, limit).then((hits) => hits.map((h) => ({ ...h, sport: s })))
    )
  )
  const lists: RunnerSearchHitWithSport[][] = []
  const errors: unknown[] = []
  settled.forEach((r, i) => {
    if (r.status === 'fulfilled') lists.push(r.value)
    else {
      console.error(`searchRunners failed for ${sports[i]}:`, r.reason)
      errors.push(r.reason)
    }
  })
  // If every sport failed, surface the first error so the UI can show it
  // instead of silently rendering "No runners match…".
  if (lists.length === 0 && errors.length > 0) {
    throw errors[0] instanceof Error ? errors[0] : new Error(String(errors[0]))
  }
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
