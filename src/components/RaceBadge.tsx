import { Link } from 'react-router-dom'
import type { Race } from '../types'

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

export default function RaceBadge({ race, className = '' }: { race: Race; className?: string }) {
  const resulted = formatResults(race.results)
  const mins = minsFromNow(race.start_time)

  let label: string
  let style: string

  if (resulted) {
    label = resulted
    style = 'bg-emerald-600/90 text-white'
  } else if (race.status === 'Closed') {
    label = 'Closed'
    style = 'bg-gray-700 text-gray-300'
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
      to={`/races/${race.id}`}
      title={`Race ${race.race_number} · ${formatTime(race.start_time)}`}
      className={`inline-flex items-center justify-center min-w-[3.5rem] px-2.5 py-1 rounded text-xs font-mono font-medium transition-opacity hover:opacity-80 ${style} ${className}`}
    >
      {label}
    </Link>
  )
}
