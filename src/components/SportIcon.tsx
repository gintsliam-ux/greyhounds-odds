import type { Sport } from '../lib/sport'

const EMOJI: Record<Sport, string> = {
  thoroughbreds: '🐎',
  harness: '🐴',
  greyhounds: '🐕',
}

const LABEL: Record<Sport, string> = {
  thoroughbreds: 'Horse',
  harness: 'Harness horse',
  greyhounds: 'Greyhound',
}

export default function SportIcon({ sport, className = 'w-4 h-4' }: { sport: Sport; className?: string }) {
  return (
    <span
      className={`${className} inline-flex items-center justify-center leading-none`}
      style={{ fontSize: '1em' }}
      role="img"
      aria-label={LABEL[sport]}
    >
      {EMOJI[sport]}
    </span>
  )
}
