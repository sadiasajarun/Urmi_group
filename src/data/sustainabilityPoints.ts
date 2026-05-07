export interface SustainabilityPoint {
  id: string
  index: string
  title: string
  description: string
  badge?: string
  stat?: string
  icon: 'droplet' | 'leaf' | 'check' | 'plus'
}

export const SUSTAINABILITY_POINTS: SustainabilityPoint[] = [
  {
    id: 'etp',
    index: '01',
    title: 'Zero-Discharge ETP',
    description:
      'Anaerobic biological treatment processes 4,000 m³ of wastewater every day. The water that leaves our facility is cleaner than the river it came from.',
    stat: '4,000 m³ / day',
    icon: 'droplet',
  },
  {
    id: 'green',
    index: '02',
    title: 'Full Green Factory',
    description:
      'UHM is Bangladesh’s first complete green RMG factory. Joint venture with Toray, Japan. LEED-certified, third-party verified.',
    badge: 'LEED Platinum',
    icon: 'leaf',
  },
  {
    id: 'decarb',
    index: '03',
    title: 'Decarbonization 2030',
    description:
      'On schedule, on the ground. Halving emissions by 2030 — already past the halfway mark.',
    stat: '50% target',
    icon: 'check',
  },
  {
    id: 'circular',
    index: '04',
    title: 'Circular Water',
    description: 'Every drop we use, we return — purified. Closed-loop systems across all factories.',
    stat: '100% returned',
    icon: 'droplet',
  },
  {
    id: 'audit',
    index: '05',
    title: 'Certified, Audited, Accountable',
    description:
      'Verified by the bodies that hold the industry to its word — OEKO-TEX, GOTS, GRS, OCS, ISO 14001, and more.',
    icon: 'plus',
  },
]
