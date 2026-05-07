export interface Client {
  id: string
  name: string
  /** Optional logo URL — falls back to monogram if absent */
  logo?: string
}

/**
 * Client list from publicly visible Urmi Group materials.
 * REPLACE with the authoritative list when the user provides it.
 * Logos default to text monograms — drop in real logo PNGs to ASSETS.md
 * for each client and reference them here when available.
 */
export const CLIENTS: Client[] = [
  { id: 'h-and-m', name: 'H&M' },
  { id: 'puma', name: 'Puma' },
  { id: 'decathlon', name: 'Decathlon' },
  { id: 'm-and-s', name: 'Marks & Spencer' },
  { id: 'uniqlo', name: 'Uniqlo' },
  { id: 'gap', name: 'Gap' },
  { id: 'tesco', name: 'Tesco' },
  { id: 'next', name: 'Next' },
  { id: 'kohls', name: "Kohl's" },
  { id: 'pvh', name: 'PVH' },
  { id: 'lidl', name: 'Lidl' },
  { id: 'ck', name: 'Calvin Klein' },
]
