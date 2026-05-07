export interface Factory {
  id: 'ftml' | 'ugl' | 'uhm'
  name: string
  fullName: string
  manpower: number
  description: string
  capacity: string[]
  certifications: string[]
  /** Lat/lng — approximate, refine with confirmed addresses */
  position: { lat: number; lng: number }
}

export const URMI_HQ = {
  name: 'Urmi Group HQ',
  description: 'Sam Tower, Gulshan-1, Dhaka',
  position: { lat: 23.7806, lng: 90.4172 },
}

export const FACTORIES: Factory[] = [
  {
    id: 'ftml',
    name: 'FTML',
    fullName: 'Fakhruddin Textile Mills Limited',
    manpower: 6218,
    description: 'Vertically integrated textile + garments unit. Knitting, dyeing, finishing, and stitching.',
    capacity: [
      '80,000 garments / day',
      '30 ton dyeing',
      '28 ton knitting',
      '5,000 seamless / day',
    ],
    certifications: ['OEKO-TEX', 'ISO 14001', 'Child Care', 'Medical'],
    position: { lat: 23.9999, lng: 90.4203 }, // Gazipur area
  },
  {
    id: 'ugl',
    name: 'UGL',
    fullName: 'Urmi Garments Limited',
    manpower: 1710,
    description: 'Specialised garments manufacturing — acid wash, stone wash, special finishes.',
    capacity: ['26,920 pieces / day', 'Acid + Stone wash', 'Custom finishes'],
    certifications: ['OEKO-TEX', 'BSCI', 'Child Care', 'Medical'],
    position: { lat: 23.6238, lng: 90.4990 }, // Narayanganj area
  },
  {
    id: 'uhm',
    name: 'UHM',
    fullName: 'UHM Limited (Toray Joint Venture)',
    manpower: 2070,
    description:
      "Bangladesh's first complete green factory — LEED-certified joint venture with Toray, Japan.",
    capacity: ['60,000 pieces / day', 'LEED Green Factory', '2030 decarbonization target'],
    certifications: ['LEED', 'OEKO-TEX', 'GOTS', 'Toray JV'],
    position: { lat: 23.8759, lng: 90.3795 }, // Mirpur / Gazipur Toray JV site
  },
]
