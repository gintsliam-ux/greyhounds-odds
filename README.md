# Greyhounds Odds

Live greyhound racing odds-fluctuation tracker. Vite + React + TypeScript + Tailwind + Supabase.

## Features

- Meetings grouped by region (AUS/NZ, UK/IRL)
- Race detail with odds across `open / 30m / 15m / 10m / 5m / 3m / 1m / 30s / current` checkpoints per bookmaker
- Live countdown, Next-to-Jump bar, venue dropdown to switch meetings
- Race tab strip + prev/next to flick between races
- Realtime race status/result updates via Supabase channels
- Collapsible sidebar, mobile drawer, skeleton loading states

## Setup

```bash
npm install
cp .env.example .env       # then fill in your Supabase URL + anon key
npm run dev
```

## Environment

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Schema

Reads from tables `greyhound_meetings`, `greyhound_races`, `greyhound_runners`, `greyhound_odds`.
Enable realtime on `greyhound_races` in the Supabase dashboard for instant status/result updates.
