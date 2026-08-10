import type { Meeting, Race } from '../types'

// The feed dates a meeting by the UTC date of each race's start time, bumped a
// day for anything from 19:00 UTC on. That boundary lands inside UK/IRL evening
// cards (8pm BST) and US afternoon cards (3pm EDT), so the back half of a
// meeting gets filed under tomorrow and one meeting shows up on two days.
//
// Put them back together: walk a track's races in time order, cut a new session
// wherever the gap is far larger than any real gap between races, and hand the
// whole session to the meeting its first race already sits in. Meetings the
// feed dated consistently stay exactly where they are — only a torn one moves.

// Races within a card are minutes apart; the same track's next meeting is 16h+
// away. Nothing real sits near this threshold.
const SESSION_GAP_MS = 6 * 60 * 60 * 1000

const trackKey = (m: Meeting) => `${m.track}|${m.location ?? ''}`

export function reuniteSessions(
  meetings: Meeting[],
  races: Race[],
): { meetings: Meeting[]; races: Race[] } {
  const byId = new Map(meetings.map((m) => [m.id, m]))

  const byTrack = new Map<string, Race[]>()
  for (const r of races) {
    const m = byId.get(r.meeting_id)
    if (!m) continue
    const key = trackKey(m)
    const list = byTrack.get(key)
    if (list) list.push(r)
    else byTrack.set(key, [r])
  }

  const regrouped: Race[] = []
  const hosting = new Set<string>()
  for (const list of byTrack.values()) {
    list.sort((a, b) => a.start_time.localeCompare(b.start_time))
    let homeId = list[0].meeting_id
    let prev = new Date(list[0].start_time).getTime()
    for (const r of list) {
      const at = new Date(r.start_time).getTime()
      if (at - prev > SESSION_GAP_MS) homeId = r.meeting_id
      prev = at
      hosting.add(homeId)
      // Carry the feed's own dating through. Bets are keyed on it, so moving a
      // race to the day it belongs must not change where we look for them.
      const feed_date = byId.get(r.meeting_id)?.date
      regrouped.push(r.meeting_id === homeId ? { ...r, feed_date } : { ...r, meeting_id: homeId, feed_date })
    }
  }

  // A row left holding nothing was only ever the tail of another day's card, so
  // it stops being a meeting in its own right. Rows we fetched no races for at
  // all are a different story — leave those be.
  const hadRaces = new Set(races.map((r) => r.meeting_id))
  return {
    meetings: meetings.filter((m) => !hadRaces.has(m.id) || hosting.has(m.id)),
    races: regrouped,
  }
}
