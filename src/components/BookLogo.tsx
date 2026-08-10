import { useState } from 'react'

// Square app-icon marks, shared with the other brand surfaces in the workspace.
// Tab has no asset, so it falls through to the wordmark below — which is what
// its brand is anyway. Keyed lowercase: the odds feed's casing is not ours.
const LOGOS: Record<string, string> = {
  sportsbet: '/logos/brands/sportsbet.png',
  ladbrokes: '/logos/brands/ladbrokes.png',
  betfair: '/logos/brands/betfair.png',
}

// Brand colours for the wordmark fallback, so a missing asset still reads as
// the right book rather than as a grey blank.
const WORDMARK: Record<string, string> = {
  sportsbet: 'bg-[#0a4b8c] text-white',
  ladbrokes: 'bg-[#d1092a] text-white',
  tab: 'bg-[#00953b] text-white',
  betfair: 'bg-[#ffb80c] text-black',
}

const SHORT: Record<string, string> = {
  sportsbet: 'SB',
  ladbrokes: 'LAD',
  tab: 'TAB',
  betfair: 'BF',
}

/**
 * A book's logo, falling back to its wordmark when the asset is missing or
 * 404s. Accepts any bookmaker string — the racing-odds table renders whatever
 * books the feed returns, not just the four we have marks for.
 */
export default function BookLogo({ book, className = '' }: { book: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  const key = book.toLowerCase()
  const src = LOGOS[key]

  if (!src || failed) {
    return (
      <span
        title={book}
        className={`inline-flex items-center justify-center h-6 px-1.5 rounded text-[10px] font-bold tracking-tight ${
          WORDMARK[key] ?? 'bg-gray-700 text-gray-200'
        } ${className}`}
      >
        {SHORT[key] ?? book.slice(0, 3).toUpperCase()}
      </span>
    )
  }

  return (
    <img
      src={src}
      alt={book}
      title={book}
      onError={() => setFailed(true)}
      className={`h-6 w-6 rounded object-contain ${className}`}
    />
  )
}
