import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchMeetings, fetchRacesForMeetings } from '../lib/queries'
import type { Meeting, Race } from '../types'
import DateTabs from '../components/DateTabs'
import RaceBadge from '../components/RaceBadge'
import { labelForDate } from '../lib/dates'

const AU_NZ = new Set(['VIC', 'NSW', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT', 'NZL'])
const UK_IRL = new Set(['GBR', 'IRL', 'IRE', 'ENG', 'SCO', 'WLS', 'NIR'])

function regionFor(loc: string | null): 'aunz' | 'ukirl' | 'other' {
  if (!loc) return 'other'
  if (AU_NZ.has(loc)) return 'aunz'
  if (UK_IRL.has(loc)) return 'ukirl'
  return 'other'
}

export default function MeetingsList({ date }: { date: string }) {
  const params = useParams<{ date?: string }>()
  const effectiveDate = params.date || date
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [races, setRaces] = useState<Race[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setMeetings([])
    setRaces([])
    ;(async () => {
      try {
        const ms = await fetchMeetings(effectiveDate)
        if (cancelled) return
        setMeetings(ms)
        if (ms.length) {
          const rs = await fetchRacesForMeetings(ms.map((m) => m.id))
          if (cancelled) return
          setRaces(rs)
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [effectiveDate])

  const racesByMeeting = useMemo(() => {
    const map: Record<string, Race[]> = {}
    for (const r of races) (map[r.meeting_id] ||= []).push(r)
    return map
  }, [races])

  const groups = useMemo(() => {
    const buckets: Record<'aunz' | 'ukirl' | 'other', Meeting[]> = { aunz: [], ukirl: [], other: [] }
    for (const m of meetings) buckets[regionFor(m.location)].push(m)
    return buckets
  }, [meetings])

  const groupMax = (ms: Meeting[]) => {
    let max = 0
    for (const m of ms) {
      for (const r of racesByMeeting[m.id] || []) {
        if (r.race_number > max) max = r.race_number
      }
    }
    return max
  }

  const heading = labelForDate(effectiveDate) || effectiveDate

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white mb-1">Greyhound Meetings</h1>
      <p className="text-sm text-gray-400 mb-5">{heading}</p>

      <DateTabs selected={effectiveDate} />

      {loading ? (
        <div className="space-y-6">
          {['AUS / NZ', 'UK / IRL'].map((label) => (
            <div key={label}>
              <div className="h-3 w-20 mb-2 bg-gray-800 rounded animate-pulse" />
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="border-b border-gray-800 h-10 animate-pulse" />
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 last:border-0"
                  >
                    <div className="h-4 w-28 bg-gray-800 rounded animate-pulse" />
                    <div className="flex-1 flex items-center justify-end gap-2">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <div key={j} className="h-6 w-14 bg-gray-800 rounded animate-pulse" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : meetings.length === 0 ? (
        <p className="text-sm text-gray-400">No meetings for this date.</p>
      ) : (
        <div className="space-y-6">
          {([
            { key: 'aunz', label: 'AUS / NZ', list: groups.aunz },
            { key: 'ukirl', label: 'UK / IRL', list: groups.ukirl },
            { key: 'other', label: 'Other', list: groups.other },
          ] as const).map((g) => {
            if (g.list.length === 0) return null
            const max = groupMax(g.list)
            return (
              <div key={g.key}>
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  {g.label}
                </h2>
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto scrollbar-none">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3 sticky left-0 bg-gray-900 z-10">
                          Meeting
                        </th>
                        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
                          <th key={n} className="text-center text-[11px] font-medium text-gray-400 uppercase tracking-wider px-2 py-3 min-w-[4.5rem]">
                            R{n}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {g.list.map((m) => {
                        const mr = racesByMeeting[m.id] || []
                        const byNum: Record<number, Race> = {}
                        for (const r of mr) byNum[r.race_number] = r
                        return (
                          <tr key={m.id} className="hover:bg-gray-800/50 transition-colors">
                            <td className="px-4 py-3 sticky left-0 bg-gray-900 z-10 whitespace-nowrap">
                              <Link to={`/meetings/${m.id}`} className="font-medium text-white hover:text-emerald-300 transition-colors">
                                {m.track}
                              </Link>
                              {m.location && <span className="ml-2 text-xs text-gray-500">{m.location}</span>}
                            </td>
                            {Array.from({ length: max }, (_, i) => i + 1).map((n) => {
                              const r = byNum[n]
                              return (
                                <td key={n} className="px-2 py-3 text-center">
                                  {r ? <RaceBadge race={r} /> : <span className="text-gray-700">—</span>}
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
