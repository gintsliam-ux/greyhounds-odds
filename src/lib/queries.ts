import { supabase } from './supabase'
import type { Meeting, Race, Runner, Odds } from '../types'

export async function fetchMeetings(date?: string): Promise<Meeting[]> {
  let q = supabase.from('greyhound_meetings').select('*').order('track')
  if (date) q = q.eq('date', date)
  else q = q.order('date', { ascending: false })
  const { data, error } = await q
  if (error) throw error
  return data as Meeting[]
}

export async function fetchMeeting(id: string): Promise<Meeting | null> {
  const { data, error } = await supabase.from('greyhound_meetings').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data as Meeting | null
}

export async function fetchRacesForMeetings(meetingIds: string[]): Promise<Race[]> {
  if (meetingIds.length === 0) return []
  const { data, error } = await supabase
    .from('greyhound_races')
    .select('*')
    .in('meeting_id', meetingIds)
    .order('race_number')
  if (error) throw error
  return data as Race[]
}

export async function fetchRacesForMeeting(meetingId: string): Promise<Race[]> {
  const { data, error } = await supabase
    .from('greyhound_races')
    .select('*')
    .eq('meeting_id', meetingId)
    .order('race_number')
  if (error) throw error
  return data as Race[]
}

export async function fetchRace(id: string): Promise<Race | null> {
  const { data, error } = await supabase.from('greyhound_races').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data as Race | null
}

export async function fetchRunnersForRace(raceId: string): Promise<Runner[]> {
  const { data, error } = await supabase
    .from('greyhound_runners')
    .select('*')
    .eq('race_id', raceId)
    .order('box_number')
  if (error) throw error
  return data as Runner[]
}

export async function fetchOddsForRunners(runnerIds: string[]): Promise<Odds[]> {
  if (runnerIds.length === 0) return []
  const { data, error } = await supabase
    .from('greyhound_odds')
    .select('*')
    .in('runner_id', runnerIds)
  if (error) throw error
  return data as Odds[]
}

export interface NextRace extends Race {
  meeting: Meeting
}

export async function fetchNextToJump(limit = 20): Promise<NextRace[]> {
  const nowIso = new Date().toISOString()
  const { data, error } = await supabase
    .from('greyhound_races')
    .select('*, meeting:greyhound_meetings(*)')
    .gte('start_time', nowIso)
    .neq('status', 'Resulted')
    .order('start_time', { ascending: true })
    .limit(limit)
  if (error) throw error
  return (data as unknown as NextRace[]) || []
}
