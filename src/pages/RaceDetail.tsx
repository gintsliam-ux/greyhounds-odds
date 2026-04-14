import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { fetchRace, fetchRunnersForRace, fetchOddsForRunners, fetchMeeting, fetchRacesForMeeting, fetchMeetings } from '../lib/queries'
import { supabase } from '../lib/supabase'
import type { Race, Runner, Odds, OddsCheckpoint, Meeting } from '../types'
import { CHECKPOINTS } from '../types'
import { Skeleton } from '../components/Skeleton'
import Countdown from '../components/Countdown'

type Market = 'win' | 'place'

export default function RaceDetail() {
  const { raceId } = useParams<{ raceId: string }>()
  const navigate = useNavigate()
  const [race, setRace] = useState<Race | null>(null)
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [meetingRaces, setMeetingRaces] = useState<Race[]>([])
  const [sameDayMeetings, setSameDayMeetings] = useState<Meeting[]>([])
  const [switchingVenue, setSwitchingVenue] = useState(false)
  const [runners, setRunners] = useState<Runner[]>([])
  const [odds, setOdds] = useState<Odds[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [market, setMarket] = useState<Market>('win')

  useEffect(() => {
    if (!raceId) return
    let cancelled = false

    const load = async (silent: boolean) => {
      if (!silent) setLoading(true)
      try {
        const r = await fetchRace(raceId)
        if (cancelled) return
        if (!r) {
          setRace(null)
          return
        }
        setRace(r)
        const [m, rs, mr] = await Promise.all([
          fetchMeeting(r.meeting_id),
          fetchRunnersForRace(r.id),
          fetchRacesForMeeting(r.meeting_id),
        ])
        if (cancelled) return
        setMeeting(m)
        setRunners(rs)
        setMeetingRaces(mr)
        if (m) {
          fetchMeetings(m.date)
            .then((ms) => {
              if (!cancelled) setSameDayMeetings(ms)
            })
            .catch(() => {})
        }
        const o = await fetchOddsForRunners(rs.map((x) => x.id))
        if (cancelled) return
        setOdds(o)
      } catch (e) {
        if (!cancelled && !silent) setError((e as Error).message)
      } finally {
        if (!cancelled && !silent) setLoading(false)
      }
    }

    load(false)
    const poll = setInterval(() => load(true), 30000)

    return () => {
      cancelled = true
      clearInterval(poll)
    }
  }, [raceId])

  // Realtime: flip status/results the moment the race row updates in Supabase
  useEffect(() => {
    if (!raceId) return
    const channel = supabase
      .channel(`race-${raceId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'greyhound_races', filter: `id=eq.${raceId}` },
        (payload) => {
          setRace((prev) => ({ ...(prev as Race), ...(payload.new as Race) }))
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [raceId])

  const currentIdx = useMemo(
    () => meetingRaces.findIndex((r) => r.id === raceId),
    [meetingRaces, raceId]
  )
  const prevRace = currentIdx > 0 ? meetingRaces[currentIdx - 1] : null
  const nextRace = currentIdx >= 0 && currentIdx < meetingRaces.length - 1 ? meetingRaces[currentIdx + 1] : null

  const handleVenueChange = async (newMeetingId: string) => {
    if (!newMeetingId || newMeetingId === meeting?.id) return
    setSwitchingVenue(true)
    try {
      const rs = await fetchRacesForMeeting(newMeetingId)
      const first = rs[0]
      if (first) navigate(`/races/${first.id}`)
      else navigate(`/meetings/${newMeetingId}`)
    } finally {
      setSwitchingVenue(false)
    }
  }

  const bookmakers = useMemo(() => {
    const ORDER = ['Sportsbet', 'Tab', 'Ladbrokes', 'Betfair']
    const set = new Set<string>([...ORDER, ...odds.map((o) => o.bookmaker)])
    const rank = (b: string) => {
      const i = ORDER.findIndex((x) => x.toLowerCase() === b.toLowerCase())
      return i === -1 ? ORDER.length : i
    }
    return Array.from(set).sort((a, b) => {
      const ra = rank(a)
      const rb = rank(b)
      if (ra !== rb) return ra - rb
      return a.localeCompare(b)
    })
  }, [odds])

  const oddsByRunnerBook = useMemo(() => {
    const map: Record<string, Record<string, Odds>> = {}
    for (const o of odds) {
      ;(map[o.runner_id] ||= {})[o.bookmaker] = o
    }
    return map
  }, [odds])

  const activeRunners = useMemo(() => runners.filter((r) => !r.scratched_at), [runners])
  const scratchedRunners = useMemo(() => runners.filter((r) => r.scratched_at), [runners])

  const getOdd = (o: Odds | undefined, cp: OddsCheckpoint): number | null => {
    if (!o) return null
    const key = `${market}_${cp}` as keyof Odds
    return (o[key] as number | null) ?? null
  }

  const fmt = (n: number | null) => (n == null ? '—' : n.toFixed(2))

  const drift = (o: Odds | undefined): number | null => {
    if (!o) return null
    const open = getOdd(o, 'open')
    const current = getOdd(o, 'current')
    if (open == null || current == null) return null
    return current - open
  }

  if (error) return <p className="text-sm text-red-400">{error}</p>
  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <Skeleton className="h-4 w-40 mb-3" />
          <Skeleton className="h-7 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-8 w-48" />
        <div className="space-y-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-800">
                <Skeleton className="h-5 w-48" />
              </div>
              <div className="p-4 space-y-2">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-5" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  if (!race) return <p className="text-sm text-gray-400">Race not found.</p>

  const resultBoxes = (race.results || [])
    .slice(0, 4)
    .map((pos) => (Array.isArray(pos) ? pos[0] : pos))
    .filter((box): box is number => box != null)

  return (
    <div className="space-y-4">
      <div>
        <Link
          to={meeting ? `/meetings/${meeting.id}` : '/'}
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-200 mb-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to {meeting?.track || 'meeting'}
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => prevRace && navigate(`/races/${prevRace.id}`)}
            disabled={!prevRace}
            className="p-1.5 rounded border border-gray-800 text-gray-400 hover:bg-gray-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous race"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {sameDayMeetings.length > 1 ? (
            <div className="relative inline-block">
              <select
                value={meeting?.id || ''}
                onChange={(e) => handleVenueChange(e.target.value)}
                disabled={switchingVenue}
                className="appearance-none bg-transparent text-lg font-medium text-white pr-6 cursor-pointer hover:text-emerald-300 focus:outline-none disabled:opacity-50 [&>option]:bg-gray-900 [&>option]:text-white [&>option]:text-sm [&>option]:font-normal"
                title="Switch venue"
              >
                {sameDayMeetings.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.track}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          ) : (
            <h1 className="text-lg font-medium text-white">{meeting?.track}</h1>
          )}
          {resultBoxes.length > 0 ? (
            <div className="inline-flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">
                Resulted
              </span>
              <div className="flex items-center gap-1">
                {resultBoxes.map((box, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-600/90 text-white text-xs font-mono font-semibold"
                    title={`${i + 1}${['st', 'nd', 'rd', 'th'][i] || 'th'}`}
                  >
                    {box}
                  </span>
                ))}
              </div>
            </div>
          ) : race.status === 'Closed' ? (
            <span className="inline-flex items-center px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider bg-gray-700 text-gray-200">
              Closed
            </span>
          ) : race.start_time ? (
            <Countdown startTime={race.start_time} className="text-base" />
          ) : null}
          <button
            onClick={() => nextRace && navigate(`/races/${nextRace.id}`)}
            disabled={!nextRace}
            className="p-1.5 rounded border border-gray-800 text-gray-400 hover:bg-gray-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Next race"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-gray-400 mt-1">
          {race.distance ? `${race.distance}m` : ''}
          {race.start_time && ` · ${new Date(race.start_time).toLocaleString()}`} · {race.status}
        </p>
      </div>

      {meetingRaces.length > 1 && (
        <div className="flex gap-1 overflow-x-auto scrollbar-none -mx-1 px-1">
          {meetingRaces.map((r) => {
            const active = r.id === raceId
            return (
              <button
                key={r.id}
                onClick={() => navigate(`/races/${r.id}`)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors shrink-0 ${
                  active
                    ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-inset ring-emerald-500/40'
                    : 'bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-gray-200 border border-gray-800'
                }`}
              >
                R{r.race_number}
              </button>
            )
          })}
        </div>
      )}

      <div className="flex gap-1 border-b border-gray-800">
        {(['win', 'place'] as Market[]).map((m) => (
          <button
            key={m}
            onClick={() => setMarket(m)}
            className={`px-4 py-2 text-sm font-medium border-b-2 capitalize transition-colors -mb-px ${
              market === m ? 'border-emerald-500 text-emerald-300' : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="space-y-5">
        {activeRunners.length === 0 && (
          <p className="text-sm text-gray-400">No active runners.</p>
        )}
        {activeRunners.map((runner) => {
          const books = oddsByRunnerBook[runner.id] || {}
          return (
            <div key={runner.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-gray-800 text-gray-200 flex items-center justify-center text-xs font-semibold">
                    {runner.box_number}
                  </span>
                  <span className="font-medium text-white">{runner.name}</span>
                </div>
              </div>
              <div className="overflow-x-auto scrollbar-none">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider text-gray-500">
                      <th className="text-left font-medium px-4 py-2">Bookmaker</th>
                      {CHECKPOINTS.map((cp) => (
                        <th key={cp} className="text-right font-medium px-3 py-2">{cp}</th>
                      ))}
                      <th className="text-right font-medium px-4 py-2">Δ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {bookmakers.map((bk) => {
                      const o = books[bk]
                      const d = drift(o)
                      return (
                        <tr key={bk}>
                          <td className="px-4 py-2 text-gray-300">{bk}</td>
                          {CHECKPOINTS.map((cp) => (
                            <td key={cp} className="px-3 py-2 text-right font-mono tabular-nums text-gray-200">
                              {fmt(getOdd(o, cp))}
                            </td>
                          ))}
                          <td className={`px-4 py-2 text-right font-mono tabular-nums ${
                            d == null ? 'text-gray-500' : d > 0 ? 'text-emerald-400' : d < 0 ? 'text-red-400' : 'text-gray-400'
                          }`}>
                            {d == null ? '—' : `${d > 0 ? '+' : ''}${d.toFixed(2)}`}
                          </td>
                        </tr>
                      )
                    })}
                    {bookmakers.length === 0 && (
                      <tr>
                        <td colSpan={CHECKPOINTS.length + 2} className="px-4 py-4 text-center text-gray-500">
                          No odds recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
      </div>

      {scratchedRunners.length > 0 && (
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
            Scratched ({scratchedRunners.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {scratchedRunners.map((r) => (
              <div
                key={r.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-sm"
              >
                <span className="w-6 h-6 rounded-full bg-gray-800 text-gray-400 flex items-center justify-center text-xs font-semibold">
                  {r.box_number}
                </span>
                <span className="text-gray-400 line-through">{r.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
