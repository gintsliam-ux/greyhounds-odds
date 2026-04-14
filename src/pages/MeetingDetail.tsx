import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { fetchMeeting, fetchRacesForMeeting } from '../lib/queries'
import type { Meeting, Race } from '../types'
import RaceBadge from '../components/RaceBadge'
import { Skeleton } from '../components/Skeleton'

export default function MeetingDetail() {
  const { meetingId } = useParams<{ meetingId: string }>()
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [races, setRaces] = useState<Race[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!meetingId) return
    setLoading(true)
    Promise.all([fetchMeeting(meetingId), fetchRacesForMeeting(meetingId)])
      .then(([m, r]) => {
        setMeeting(m)
        setRaces(r)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [meetingId])

  if (error) return <p className="text-sm text-red-400">{error}</p>

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-4 w-32 mb-3" />
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    )
  }

  if (!meeting) return <p className="text-sm text-gray-400">Meeting not found.</p>

  return (
    <div className="space-y-6">
      <div>
        <Link to="/today" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-200 mb-2">
          <ArrowLeft className="w-4 h-4" /> All meetings
        </Link>
        <h1 className="text-2xl font-semibold text-white">{meeting.track}</h1>
        <p className="text-sm text-gray-400">
          {meeting.location} · {meeting.date}
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {races.map((r) => (
          <Link
            key={r.id}
            to={`/races/${r.id}`}
            className="bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 rounded-lg p-4 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">Race {r.race_number}</span>
              <RaceBadge race={r} />
            </div>
            <p className="text-xs text-gray-400">{r.distance ? `${r.distance}m` : ''}</p>
          </Link>
        ))}
        {races.length === 0 && <p className="text-sm text-gray-400">No races.</p>}
      </div>
    </div>
  )
}
