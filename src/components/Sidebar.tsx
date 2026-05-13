import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { Clock, Calendar, ChevronDown, ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { SPORTS, SPORT_LABELS, sportFromPath, type Sport } from '../lib/sport'
import SportIcon from './SportIcon'

interface SidebarProps {
  drawerOpen: boolean
  onCloseDrawer: () => void
  collapsed: boolean
  onToggleCollapsed: () => void
}

export default function Sidebar({ drawerOpen, onCloseDrawer, collapsed, onToggleCollapsed }: SidebarProps) {
  const { sport: sportParam } = useParams<{ sport: string }>()
  const activeSport = sportFromPath(sportParam)
  const navigate = useNavigate()
  const [runnerSearch, setRunnerSearch] = useState('')
  const [openSports, setOpenSports] = useState<Record<Sport, boolean>>({
    thoroughbreds: true,
    harness: true,
    greyhounds: true,
  })

  const submitRunnerSearch = (onClick?: () => void) => {
    const q = runnerSearch.trim()
    if (q.length < 2) return
    navigate(`/search?q=${encodeURIComponent(q)}`)
    onClick?.()
  }

  useEffect(() => {
    setOpenSports((s) => ({ ...s, [activeSport]: true }))
  }, [activeSport])

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [drawerOpen])

  const subLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg pl-10 pr-3 py-2 text-sm transition-colors ${
      isActive ? 'bg-emerald-500/15 text-emerald-300 font-medium' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
    }`

  const collapsedLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center justify-center px-2 py-2.5 rounded-lg transition-colors ${
      isActive ? 'bg-emerald-500/15 text-emerald-300' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
    }`

  const renderNav = (compact: boolean, onClick?: () => void) => {
    if (compact) {
      return (
        <nav className="flex-1 p-2 space-y-3">
          {SPORTS.map((s) => (
            <div key={s} className="space-y-1">
              <NavLink
                to={`/${s}/today`}
                className={collapsedLinkClass}
                title={SPORT_LABELS[s].plural}
                onClick={onClick}
              >
                <SportIcon sport={s} className="w-5 h-5" />
              </NavLink>
            </div>
          ))}
        </nav>
      )
    }
    return (
      <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
        {SPORTS.map((s) => {
          const open = openSports[s]
          return (
            <div key={s}>
              <button
                onClick={() => setOpenSports((v) => ({ ...v, [s]: !v[s] }))}
                className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 transition-colors"
              >
                <span className="flex items-center gap-3">
                  <SportIcon sport={s} className="w-4 h-4" /> {SPORT_LABELS[s].plural}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${open ? '' : '-rotate-90'}`} />
              </button>
              {open && (
                <div className="mt-1 space-y-1">
                  <NavLink to={`/${s}/yesterday`} className={subLinkClass} onClick={onClick}>
                    <Calendar className="w-3.5 h-3.5" /> Yesterday
                  </NavLink>
                  <NavLink to={`/${s}/today`} end className={subLinkClass} onClick={onClick}>
                    <Clock className="w-3.5 h-3.5" /> Today
                  </NavLink>
                  <NavLink to={`/${s}/tomorrow`} className={subLinkClass} onClick={onClick}>
                    <Calendar className="w-3.5 h-3.5" /> Tomorrow
                  </NavLink>
                </div>
              )}
            </div>
          )
        })}

        <div className="pt-3 mt-2 border-t border-gray-800">
          <div className="relative px-1">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={runnerSearch}
              onChange={(e) => setRunnerSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitRunnerSearch(onClick)
              }}
              placeholder="Search Runners.."
              className="w-full pl-8 pr-2 py-1.5 rounded-md bg-gray-800 border border-gray-700 focus:border-emerald-500/50 focus:outline-none text-xs text-gray-200 placeholder:text-gray-500"
            />
          </div>
        </div>
      </nav>
    )
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex sticky top-[46px] h-[calc(100vh-46px)] shrink-0 flex-col bg-gray-900 border-r border-gray-800 transition-[width] duration-200 ${
          collapsed ? 'w-[72px]' : 'w-56'
        }`}
      >
        {renderNav(collapsed)}
      </aside>

      {/* Floating collapse/expand toggle — lives outside sidebar so it overlaps main content */}
      <button
        onClick={onToggleCollapsed}
        className="hidden lg:flex fixed top-[70px] z-50 w-7 h-7 rounded-full bg-gray-900 border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white hover:border-gray-600 items-center justify-center shadow-lg transition-all duration-200"
        style={{ left: collapsed ? 'calc(72px - 14px)' : 'calc(224px - 14px)' }}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/60" onClick={onCloseDrawer} />
          <div className="relative w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <SportIcon sport={activeSport} className="w-5 h-5" />
                <span className="font-semibold text-white">{SPORT_LABELS[activeSport].plural}</span>
              </div>
              <button onClick={onCloseDrawer} className="text-gray-300 hover:text-white" aria-label="Close menu">
                <X className="w-5 h-5" />
              </button>
            </div>
            {renderNav(false, onCloseDrawer)}
          </div>
        </div>
      )}
    </>
  )
}
