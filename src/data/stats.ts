export interface Stat {
  id: string
  value: number
  prefix?: string
  suffix?: string
  caption: string
  /** Override numeric formatting — used for "2030" (no commas, no animation) */
  literal?: string
}

export const STATS: Stat[] = [
  {
    id: 'fabric',
    value: 44,
    suffix: '+',
    caption: 'Tons of fabric, woven daily',
  },
  {
    id: 'garments',
    value: 250000,
    suffix: '+',
    caption: 'Garments shipped daily',
  },
  {
    id: 'water',
    value: 4000,
    suffix: '+ m³',
    caption: 'Wastewater purified daily',
  },
  {
    id: 'decarb',
    value: 2030,
    literal: '2030',
    caption: 'Decarbonization goal',
  },
]
