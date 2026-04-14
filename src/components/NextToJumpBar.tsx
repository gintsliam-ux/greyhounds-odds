import { useEffect, useState } from 'react'
import { Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { fetchNextToJump, type NextRace } from '../lib/queries'
import RaceBadge from './RaceBadge'

export default function NextToJumpBar() {
  const [races, setRaces] = useState<NextRace[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = () => {
      fetchNextToJump(20)
        .then(setRaces)
        .catch(() => {})
        .finally(() => setLoading(false))
    }
    load()
    const i = setInterval(load, 30000)
    return () => clearInterval(i)
  }, [])

  return (
    <div>
      <div className="flex items-center gap-3 px-2 lg:px-4 py-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-400 shrink-0">
          <Zap className="w-3.5 h-3.5" />
          Next to Jump
        </div>
        <div className="flex-1 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2 min-w-min">
            {loading && races.length === 0 ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-9 w-40 shrink-0 rounded bg-gray-900 animate-pulse" />
              ))
            ) : races.length === 0 ? (
              <span className="text-xs text-gray-500">No upcoming races</span>
            ) : (
              races.map((r) => (
                <div key={r.id} className="shrink-0 inline-flex items-center gap-2">
                  <Link
                    to={`/races/${r.id}`}
                    className="text-xs font-medium text-gray-300 hover:text-white transition-colors whitespace-nowrap"
                  >
                    {r.meeting?.track} · R{r.race_number}
                  </Link>
                  <RaceBadge race={r} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
