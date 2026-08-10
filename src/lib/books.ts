/** The four books surfaced as odds columns, in display order. */
export const BOOKS = ['Sportsbet', 'Ladbrokes', 'Tab', 'Betfair'] as const

export type Book = (typeof BOOKS)[number]
