import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { searchRunnersAllSports, type RunnerSearchHitWithSport } from '../lib/queries'
import SportIcon from '../components/SportIcon'

export default function SearchRunners() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [results, setResults] = useState<RunnerSearchHitWithSport[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const q = query.trim()
    const current = searchParams.get('q') ?? ''
    if (q !== current) setSearchParams(q ? { q } : {}, { replace: true })
    if (q.length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    const handle = setTimeout(() => {
      searchRunnersAllSports(q)
        .then((hits) => {
          if (!cancelled) {
            setResults(hits)
            setError(null)
          }
        })
        .catch((e) => {
          if (!cancelled) setError((e as Error).message)
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(handle)
    }
  }, [query, searchParams, setSearchParams])

  const pilot = (r: RunnerSearchHitWithSport) => r.jockey ?? r.driver ?? null
  const number = (r: RunnerSearchHitWithSport) => r.runner_number ?? r.box_number ?? r.barrier_number ?? null
  const barrier = (r: RunnerSearchHitWithSport) => (r.sport === 'greyhounds' ? null : r.barrier_number ?? null)
  const formatTime = (iso: string | null | undefined) => {
    if (!iso) return null
    const d = new Date(iso)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white mb-1">Search Runners</h1>
      <p className="text-sm text-gray-400 mb-5">Across thoroughbreds, harness and greyhounds</p>

      <div className="relative mb-6 max-w-xl">
        <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Runner name…"
          autoFocus
          className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-gray-900 border border-gray-800 focus:border-emerald-500/50 focus:outline-none text-sm text-gray-100 placeholder:text-gray-500"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {loading && query.trim().length >= 2 && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-gray-900 border border-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {!loading && query.trim().length >= 2 && results.length === 0 && (
        <p className="text-sm text-gray-400">No runners match "{query}".</p>
      )}

      {!loading && query.trim().length < 2 && (
        <p className="text-sm text-gray-500">Type at least 2 characters.</p>
      )}

      {!loading && results.length > 0 && (
        <ul className="divide-y divide-gray-800 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {results.map((r) => {
            const num = number(r)
            const b = barrier(r)
            const p = pilot(r)
            return (
              <li key={`${r.sport}-${r.id}`}>
                <Link
                  to={`/${r.sport}/races/${r.race.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800/50 transition-colors"
                >
                  <SportIcon sport={r.sport} className="w-5 h-5 shrink-0" />
                  <span className="w-7 h-7 shrink-0 rounded-full bg-gray-800 text-gray-200 flex items-center justify-center text-xs font-semibold">
                    {num ?? '—'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium text-white truncate ${r.scratched_at ? 'line-through text-gray-500' : ''}`}>
                        {r.name}
                        {b != null && <span className="ml-1.5 text-gray-400 font-normal">({b})</span>}
                      </span>
                      {r.scratched_at && (
                        <span className="text-[10px] uppercase tracking-wider text-red-400 shrink-0">Scratched</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      {r.race.meeting?.track}
                      {r.race.meeting?.location && <span className="ml-1 text-gray-500">{r.race.meeting.location}</span>}
                      <span className="mx-1 text-gray-600">·</span>
                      R{r.race.race_number}
                      <span className="mx-1 text-gray-600">·</span>
                      {r.race.meeting?.date}
                      {formatTime(r.race.start_time) && (
                        <>
                          <span className="mx-1 text-gray-600">·</span>
                          <span className="font-mono">{formatTime(r.race.start_time)}</span>
                        </>
                      )}
                      {p && (
                        <>
                          <span className="mx-1 text-gray-600">·</span>
                          {p}
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
