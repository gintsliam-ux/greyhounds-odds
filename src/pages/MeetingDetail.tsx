import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { fetchMeeting, fetchRacesForMeeting } from '../lib/queries'
import type { Meeting, Race } from '../types'
import RaceBadge from '../components/RaceBadge'
import { Skeleton } from '../components/Skeleton'
import { sportFromPath } from '../lib/sport'
import { pathForDate } from '../lib/dates'

export default function MeetingDetail() {
  const { meetingId, sport: sportParam } = useParams<{ meetingId: string; sport: string }>()
  const sport = sportFromPath(sportParam)
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [races, setRaces] = useState<Race[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    async (silent: boolean) => {
      if (!meetingId) return
      if (silent) setRefreshing(true)
      else setLoading(true)
      try {
        const [m, r] = await Promise.all([
          fetchMeeting(sport, meetingId),
          fetchRacesForMeeting(sport, meetingId),
        ])
        setMeeting(m)
        setRaces(r)
        setError(null)
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [sport, meetingId]
  )

  useEffect(() => {
    load(false)
  }, [load])

  if (error) return <p className="text-sm text-red-400">{error}</p>

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-4 w-32 mb-3" />
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24" />
          ))}
        </div>
      </div>
    )
  }

  if (!meeting) return <p className="text-sm text-gray-400">Meeting not found.</p>

  return (
    <div className="space-y-6">
      <div>
        <Link to={`/${sport}/${pathForDate(meeting.date)}`} className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-200 mb-2">
          <ArrowLeft className="w-4 h-4" /> All meetings
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-white">{meeting.track}</h1>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="p-1.5 rounded border border-gray-800 text-gray-400 hover:bg-gray-800 hover:text-white disabled:opacity-50 transition-colors"
            aria-label="Refresh"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <p className="text-sm text-gray-400">
          {meeting.location} · {meeting.date}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {races.map((r) => (
          <Link
            key={r.id}
            to={`/${sport}/races/${r.id}`}
            title={r.distance ? `${r.distance}m` : undefined}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 transition-colors"
          >
            <span className="text-sm font-medium text-white">R{r.race_number}</span>
            <RaceBadge race={r} sport={sport} />
          </Link>
        ))}
        {races.length === 0 && <p className="text-sm text-gray-400">No races.</p>}
      </div>
    </div>
  )
}
