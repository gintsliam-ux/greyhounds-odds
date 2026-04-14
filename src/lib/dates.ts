export function isoDate(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function todayIso(): string {
  return isoDate(new Date())
}

export function offsetIso(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return isoDate(d)
}

export function yesterdayIso(): string {
  return offsetIso(-1)
}

export function tomorrowIso(): string {
  return offsetIso(1)
}

export function labelForDate(iso: string): 'Yesterday' | 'Today' | 'Tomorrow' | null {
  if (iso === todayIso()) return 'Today'
  if (iso === yesterdayIso()) return 'Yesterday'
  if (iso === tomorrowIso()) return 'Tomorrow'
  return null
}
