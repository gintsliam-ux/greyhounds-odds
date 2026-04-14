import { NavLink } from 'react-router-dom'
import { Activity, Clock, Calendar, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface SidebarProps {
  drawerOpen: boolean
  onCloseDrawer: () => void
  collapsed: boolean
  onToggleCollapsed: () => void
}

export default function Sidebar({ drawerOpen, onCloseDrawer, collapsed, onToggleCollapsed }: SidebarProps) {
  const [greyhoundsOpen, setGreyhoundsOpen] = useState(true)

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
        <nav className="flex-1 p-2 space-y-1">
          <NavLink to="/today" end className={collapsedLinkClass} title="Today" onClick={onClick}>
            <Clock className="w-4 h-4" />
          </NavLink>
          <NavLink to="/yesterday" className={collapsedLinkClass} title="Yesterday" onClick={onClick}>
            <Calendar className="w-4 h-4" />
          </NavLink>
          <NavLink to="/tomorrow" className={collapsedLinkClass} title="Tomorrow" onClick={onClick}>
            <Calendar className="w-4 h-4" />
          </NavLink>
        </nav>
      )
    }
    return (
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div>
          <button
            onClick={() => setGreyhoundsOpen((v) => !v)}
            className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 transition-colors"
          >
            <span className="flex items-center gap-3">
              <Activity className="w-4 h-4" /> Greyhounds
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${greyhoundsOpen ? '' : '-rotate-90'}`} />
          </button>
          {greyhoundsOpen && (
            <div className="mt-1 space-y-1">
              <NavLink to="/yesterday" className={subLinkClass} onClick={onClick}>
                <Calendar className="w-3.5 h-3.5" /> Yesterday
              </NavLink>
              <NavLink to="/today" end className={subLinkClass} onClick={onClick}>
                <Clock className="w-3.5 h-3.5" /> Today
              </NavLink>
              <NavLink to="/tomorrow" className={subLinkClass} onClick={onClick}>
                <Calendar className="w-3.5 h-3.5" /> Tomorrow
              </NavLink>
            </div>
          )}
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
                <Activity className="w-5 h-5 text-emerald-400" />
                <span className="font-semibold text-white">Greyhounds</span>
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
