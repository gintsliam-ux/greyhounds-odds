import { CalendarDays } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { yesterdayIso, todayIso, tomorrowIso, labelForDate } from '../lib/dates'
import { sportFromPath } from '../lib/sport'

export default function DateTabs({ selected }: { selected: string }) {
  const navigate = useNavigate()
  const { sport: sportParam } = useParams<{ sport: string }>()
  const sport = sportFromPath(sportParam)
  const tabs: { label: string; to: string; iso: string }[] = [
    { label: 'Yesterday', to: `/${sport}/yesterday`, iso: yesterdayIso() },
    { label: 'Today', to: `/${sport}/today`, iso: todayIso() },
    { label: 'Tomorrow', to: `/${sport}/tomorrow`, iso: tomorrowIso() },
  ]

  const builtIn = labelForDate(selected)

  return (
    <div className="flex items-center gap-1 border-b border-gray-800 mb-4 overflow-x-auto scrollbar-none">
      {tabs.map((t) => {
        const active = builtIn === t.label
        return (
          <button
            key={t.label}
            onClick={() => navigate(t.to)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
              active ? 'border-emerald-500 text-emerald-300' : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            {t.label}
          </button>
        )
      })}
      <div className={`inline-flex items-center gap-2 ml-2 px-2 py-1.5 rounded text-sm ${
        !builtIn ? 'bg-emerald-500/15 text-emerald-300' : 'text-gray-400'
      }`}>
        <CalendarDays className="w-4 h-4" />
        <input
          type="date"
          value={selected}
          onChange={(e) => {
            if (e.target.value) navigate(`/${sport}/date/${e.target.value}`)
          }}
          className="bg-transparent text-sm outline-none [color-scheme:dark]"
        />
      </div>
    </div>
  )
}
