export interface Pillar {
  id: string
  image: string
  alt: string
  stat: string
  caption: string
  /** When true, render the stat in Bengali script using the Hind Siliguri font */
  statIsBengali?: boolean
}

export const PILLARS: Pillar[] = [
  {
    id: 'years',
    image: '/img/waves/years.jpg',
    alt: 'Decades of craft',
    stat: '৪০+',
    caption: 'Years of craft',
    statIsBengali: true,
  },
  {
    id: 'hands',
    image: '/img/waves/hands.jpg',
    alt: 'Sixteen thousand eight hundred hands',
    stat: '16,800',
    caption: 'Hands shaping every thread',
  },
  {
    id: 'green',
    image: '/img/waves/full-green.jpg',
    alt: "Bangladesh's first Full Green factory group",
    stat: 'Full Green',
    caption: "Bangladesh's first green factory group",
  },
  {
    id: 'brands',
    // PLACEHOLDER — replace with editorial photo of global shipping / brand wall
    image:
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1400&auto=format&fit=crop',
    alt: 'Global brands',
    stat: '30+',
    caption: 'Global brands trust us daily',
  },
]
