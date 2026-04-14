import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

function diffParts(targetIso: string) {
  const diff = new Date(targetIso).getTime() - Date.now()
  const past = diff < 0
  const abs = Math.abs(diff)
  const totalSec = Math.floor(abs / 1000)
  const hours = Math.floor(totalSec / 3600)
  const mins = Math.floor((totalSec % 3600) / 60)
  const secs = totalSec % 60
  return { past, hours, mins, secs, diff }
}

export default function Countdown({ startTime, className = '' }: { startTime: string; className?: string }) {
  const [, tick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const { past, hours, mins, secs, diff } = diffParts(startTime)

  let label: string
  if (hours > 0) {
    label = `${hours}h ${String(mins).padStart(2, '0')}m`
  } else {
    label = `${mins}:${String(secs).padStart(2, '0')}`
  }

  const soon = !past && diff <= 5 * 60 * 1000
  const color = past
    ? 'text-red-400'
    : soon
    ? 'text-emerald-400'
    : diff <= 15 * 60 * 1000
    ? 'text-orange-400'
    : 'text-gray-300'

  return (
    <span className={`inline-flex items-center gap-1.5 font-mono tabular-nums ${color} ${className}`}>
      <Clock className="w-4 h-4" />
      {past ? `-${label}` : label}
    </span>
  )
}
