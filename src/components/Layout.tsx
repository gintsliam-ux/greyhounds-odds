import { Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'
import NextToJumpBar from './NextToJumpBar'

export default function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar-collapsed') === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('sidebar-collapsed', collapsed ? '1' : '0')
    } catch {}
  }, [collapsed])

  return (
    <div className="min-h-screen text-gray-100 flex flex-col">
      <div className="sticky top-0 z-30 flex items-center bg-gray-950/95 backdrop-blur border-b border-gray-800">
        <button
          onClick={() => setDrawerOpen(true)}
          className="lg:hidden px-3 py-2 text-gray-300 hover:text-white shrink-0"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <NextToJumpBar />
        </div>
      </div>
      <div className="flex flex-1 min-h-0">
        <Sidebar
          drawerOpen={drawerOpen}
          onCloseDrawer={() => setDrawerOpen(false)}
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((v) => !v)}
        />
        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-5">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
