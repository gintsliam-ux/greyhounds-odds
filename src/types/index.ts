export interface Meeting {
  id: string
  betwatch_meeting_id: string | null
  track: string
  location: string | null
  date: string
  created_at: string
}

export interface Race {
  id: string
  meeting_id: string
  betwatch_race_id: string | null
  race_number: number
  status: string
  start_time: string
  distance: number | null
  results: number[][] | null
  created_at: string
}

export interface Runner {
  id: string
  race_id: string
  betwatch_runner_id: string | null
  box_number: number
  name: string
  scratched_at: string | null
  created_at: string
}

export type OddsCheckpoint = 'open' | '30m' | '15m' | '10m' | '5m' | '3m' | '1m' | '30s' | 'current'

export interface Odds {
  id: string
  runner_id: string
  bookmaker: string
  win_open: number | null
  win_30m: number | null
  win_15m: number | null
  win_10m: number | null
  win_5m: number | null
  win_3m: number | null
  win_1m: number | null
  win_30s: number | null
  win_current: number | null
  place_open: number | null
  place_30m: number | null
  place_15m: number | null
  place_10m: number | null
  place_5m: number | null
  place_3m: number | null
  place_1m: number | null
  place_30s: number | null
  place_current: number | null
  last_updated: string
  created_at: string
}

export const CHECKPOINTS: OddsCheckpoint[] = ['open', '30m', '15m', '10m', '5m', '3m', '1m', '30s', 'current']
