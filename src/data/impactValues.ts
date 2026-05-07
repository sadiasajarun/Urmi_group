export interface ImpactValue {
  id: string
  letter: string
  title: string
  description: string
  image: string
  alt: string
  /** True when image is a real Urmi-supplied asset (vs. placeholder) */
  realAsset: boolean
}

export const IMPACT_VALUES: ImpactValue[] = [
  {
    id: 'integrity',
    letter: 'I',
    title: 'Integrity',
    description: 'What we promise the buyer is what we deliver to the floor.',
    image: '/img/impact/integrity.png',
    alt: 'Integrity',
    realAsset: true,
  },
  {
    id: 'mutual-trust',
    letter: 'M',
    title: 'Mutual Trust',
    description: 'Buyers, suppliers, and sixteen thousand colleagues — on one page.',
    // PLACEHOLDER
    image:
      'https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=1200&auto=format&fit=crop',
    alt: 'Mutual trust — handshake',
    realAsset: false,
  },
  {
    id: 'passion',
    letter: 'P',
    title: 'Passion for Excellence',
    description: 'Continuous improvement is written into our DNA.',
    // PLACEHOLDER
    image:
      'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?q=80&w=1200&auto=format&fit=crop',
    alt: 'Passion for excellence',
    realAsset: false,
  },
  {
    id: 'agility',
    letter: 'A',
    title: 'Agility',
    description: 'When fashion shifts, we are already cutting.',
    // PLACEHOLDER
    image:
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop',
    alt: 'Agility',
    realAsset: false,
  },
  {
    id: 'customer',
    letter: 'C',
    title: 'Customer Focus',
    description: 'Your design philosophy. Our craft.',
    // PLACEHOLDER
    image:
      'https://images.unsplash.com/photo-1554224155-cfa08c2a758f?q=80&w=1200&auto=format&fit=crop',
    alt: 'Customer focus',
    realAsset: false,
  },
  {
    id: 'teamwork',
    letter: 'T',
    title: 'Teamwork',
    description: 'Because no wave moves alone.',
    // PLACEHOLDER
    image:
      'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1200&auto=format&fit=crop',
    alt: 'Teamwork',
    realAsset: false,
  },
]
