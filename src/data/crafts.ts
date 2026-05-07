export interface Craft {
  id: string
  index: string
  name: string
  description: string
  stat: string
  image: string
  alt: string
}

export const CRAFTS: Craft[] = [
  {
    id: 'garments',
    index: '01',
    name: 'Garments',
    description:
      'Ninety lines, eight thousand hands, precision cut and sewn for the world’s most exacting brands.',
    stat: '150,000 pieces / day',
    image: '/img/crafts/garments.png',
    alt: 'Garment manufacturing line',
  },
  {
    id: 'textile',
    index: '02',
    name: 'Textile',
    description:
      'Eighty-four knitting machines turning twenty-five tons of yarn into fabric every single day.',
    stat: '25,000 kg yarn / day',
    image: '/img/crafts/textile.png',
    alt: 'Textile knitting',
  },
  {
    id: 'printing',
    index: '03',
    name: 'Printing',
    description:
      'Four carousel machines, twenty-four glass tables, vibrant colour delivered with water-based and low-impact dye.',
    stat: '40,000 multi-colour pieces / day',
    image: '/img/crafts/printing.png',
    alt: 'Carousel printing',
  },
  {
    id: 'shipping',
    index: '04',
    name: 'Shipping',
    description:
      'On Bangladesh’s rivers since 1970. Optimised global logistics ensuring swift, responsible delivery.',
    stat: 'Operating since 1970',
    image: '/img/crafts/shipping.png',
    alt: 'Container shipping',
  },
  {
    id: 'embroidery',
    index: '05',
    name: 'Embroidery',
    description:
      'Three million stitches a day. Heritage techniques programmed for modern precision, hand-finished for soul.',
    stat: '3M stitches / day',
    image: '/img/crafts/embroidery.png',
    alt: 'Embroidery',
  },
  {
    id: 'washing',
    index: '06',
    name: 'Washing',
    description:
      'Acid, stone, pigment, special-effect — done with closed-loop water and zero discharge.',
    stat: 'Closed-loop water',
    image: '/img/crafts/washing.jpg',
    alt: 'Garment washing',
  },
]
