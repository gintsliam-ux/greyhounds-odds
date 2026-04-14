import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import MeetingsList from './pages/MeetingsList'
import MeetingDetail from './pages/MeetingDetail'
import RaceDetail from './pages/RaceDetail'
import { todayIso, yesterdayIso, tomorrowIso } from './lib/dates'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/today" replace />} />
          <Route path="yesterday" element={<MeetingsList date={yesterdayIso()} />} />
          <Route path="today" element={<MeetingsList date={todayIso()} />} />
          <Route path="tomorrow" element={<MeetingsList date={tomorrowIso()} />} />
          <Route path="date/:date" element={<MeetingsList date={todayIso()} />} />
          <Route path="meetings/:meetingId" element={<MeetingDetail />} />
          <Route path="races/:raceId" element={<RaceDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
