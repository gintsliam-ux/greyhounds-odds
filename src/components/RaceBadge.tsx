import { Link } from 'react-router-dom'
import type { Race } from '../types'
import type { Sport } from '../lib/sport'

// Past this far beyond the jump with nothing to show, a race is stale rather
// than late — around 1,200 sit in the data with no result and no closing status.
const STALE_AFTER_MIN = 30

function minsFromNow(iso: string): number {
  return Math.round((new Date(iso).getTime() - Date.now()) / 60000)
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatResults(results: number[][] | null): string | null {
  if (!results || results.length === 0) return null
  const top = results
    .slice(0, 3)
    .map((r) => (Array.isArray(r) ? r[0] : r))
    .filter((v): v is number => v != null)
  if (top.length === 0) return null
  return top.join('-')
}

export default function RaceBadge({ race, sport, className = '' }: { race: Race; sport: Sport; className?: string }) {
  const resulted = formatResults(race.results)
  const mins = minsFromNow(race.start_time)

  let label: string
  let style: string
  // Only the branch we actually take gets to annotate the tooltip.
  let note = ''

  // Interim placings are provisional and the race has already run, so it takes
  // priority over the clock — a race can sit here for days. Show the placings
  // once we have them, in amber rather than the emerald of a final result.
  if (race.status === 'Interim') {
    label = resulted ?? 'Interim'
    style = 'bg-amber-500/90 text-white'
    note = ' · Interim'
  } else if (resulted) {
    label = resulted
    style = 'bg-emerald-600/90 text-white'
  } else if (race.status === 'Abandoned') {
    label = 'ABND'
    style = 'bg-violet-600/90 text-white'
    note = ' · Abandoned'
  } else if (race.status === 'Closed') {
    label = 'Closed'
    style = 'bg-gray-700 text-gray-300'
  } else if (mins < -STALE_AFTER_MIN) {
    // The feed stopped updating this one — no result, no terminal status. A
    // live counter here just runs away, so show when it was due off instead.
    label = formatTime(race.start_time)
    style = 'bg-gray-800 text-gray-500'
    note = ' · No result'
  } else if (mins < 0) {
    label = `${mins}m`
    style = 'bg-red-600/90 text-white'
  } else if (mins <= 15) {
    label = `${mins}m`
    style = 'bg-orange-500/90 text-white'
  } else if (mins <= 60) {
    label = `${mins}m`
    style = 'bg-gray-700 text-gray-200'
  } else {
    label = formatTime(race.start_time)
    style = 'border border-gray-700 text-gray-400 bg-transparent'
  }


  return (
    <Link
      to={`/${sport}/races/${race.id}`}
      title={`Race ${race.race_number} · ${formatTime(race.start_time)}${note}`}
      className={`inline-flex items-center justify-center min-w-[2.5rem] px-1.5 py-0.5 rounded text-[11px] font-mono font-medium transition-opacity hover:opacity-80 ${style} ${className}`}
    >
      {label}
    </Link>
  )
}
