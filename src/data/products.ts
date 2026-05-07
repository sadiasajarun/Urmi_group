export interface Product {
  id: string
  name: string
  tagline: string
  image: string
  alt: string
  /** Layout slot in the asymmetric grid: 'hero' (large) or 'medium' */
  size: 'hero' | 'medium'
}

/** PLACEHOLDERS — replace with real Urmi product editorial photos. */
export const PRODUCTS: Product[] = [
  {
    id: 'active',
    name: 'Active Wear',
    tagline: 'Performance, with a conscience.',
    image:
      'https://images.unsplash.com/photo-1517960413843-0aee8e2b3285?q=80&w=1400&auto=format&fit=crop',
    alt: 'Activewear',
    size: 'hero',
  },
  {
    id: 'evening',
    name: 'Evening Wear',
    tagline: 'Quiet luxury, ethically made.',
    image:
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1400&auto=format&fit=crop',
    alt: 'Evening wear',
    size: 'hero',
  },
  {
    id: 'night',
    name: 'Night Wear',
    tagline: 'Sleepwear that breathes.',
    image:
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1200&auto=format&fit=crop',
    alt: 'Sleepwear',
    size: 'medium',
  },
  {
    id: 'seamless',
    name: 'Seamless Innerwear',
    tagline: 'Knit in one continuous thread.',
    image:
      'https://images.unsplash.com/photo-1600189261867-8e154c7d8a26?q=80&w=1200&auto=format&fit=crop',
    alt: 'Seamless innerwear',
    size: 'medium',
  },
  {
    id: 'knitwear',
    name: 'Knitwear & Polos',
    tagline: 'Daily comfort, premium feel.',
    image:
      'https://images.unsplash.com/photo-1516257984-b1b4d707412e?q=80&w=1200&auto=format&fit=crop',
    alt: 'Knitwear and polos',
    size: 'medium',
  },
  {
    id: 'kids',
    name: 'Kidswear',
    tagline: 'Made gentle, for the gentle.',
    image:
      'https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?q=80&w=1200&auto=format&fit=crop',
    alt: 'Kidswear',
    size: 'medium',
  },
]
