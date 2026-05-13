import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import Layout from './components/Layout'
import MeetingsList from './pages/MeetingsList'
import MeetingDetail from './pages/MeetingDetail'
import RaceDetail from './pages/RaceDetail'
import SearchRunners from './pages/SearchRunners'
import { todayIso, yesterdayIso, tomorrowIso } from './lib/dates'
import { isSport } from './lib/sport'

function SportGuard({ children }: { children: React.ReactNode }) {
  const { sport } = useParams<{ sport: string }>()
  if (!isSport(sport)) return <Navigate to="/thoroughbreds/today" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/thoroughbreds/today" replace />} />
          <Route
            path=":sport"
            element={
              <SportGuard>
                <Navigate to="today" replace />
              </SportGuard>
            }
          />
          <Route
            path=":sport/yesterday"
            element={
              <SportGuard>
                <MeetingsList date={yesterdayIso()} />
              </SportGuard>
            }
          />
          <Route
            path=":sport/today"
            element={
              <SportGuard>
                <MeetingsList date={todayIso()} />
              </SportGuard>
            }
          />
          <Route
            path=":sport/tomorrow"
            element={
              <SportGuard>
                <MeetingsList date={tomorrowIso()} />
              </SportGuard>
            }
          />
          <Route
            path=":sport/date/:date"
            element={
              <SportGuard>
                <MeetingsList date={todayIso()} />
              </SportGuard>
            }
          />
          <Route
            path=":sport/meetings/:meetingId"
            element={
              <SportGuard>
                <MeetingDetail />
              </SportGuard>
            }
          />
          <Route
            path=":sport/races/:raceId"
            element={
              <SportGuard>
                <RaceDetail />
              </SportGuard>
            }
          />
          <Route path="search" element={<SearchRunners />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
