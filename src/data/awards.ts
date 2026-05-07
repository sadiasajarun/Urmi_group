export interface Award {
  id: string
  title: string
  year: string
  image: string
  alt: string
}

/**
 * PLACEHOLDERS — pulled from urmigroup.com/wp-content/uploads/2019/12/[1-13]-2-300x300.jpg pattern.
 * Replace `image` with real Urmi award imagery and `title`/`year` with confirmed details.
 */
export const AWARDS: Award[] = [
  {
    id: 'a1',
    title: 'National Export Trophy (Gold)',
    year: '2018',
    image: 'https://urmigroup.com/wp-content/uploads/2019/12/1-2-300x300.jpg',
    alt: 'National Export Trophy',
  },
  {
    id: 'a2',
    title: 'BGMEA Excellence Award',
    year: '2019',
    image: 'https://urmigroup.com/wp-content/uploads/2019/12/2-2-300x300.jpg',
    alt: 'BGMEA Excellence Award',
  },
  {
    id: 'a3',
    title: 'HSBC Export Excellence Award',
    year: '2017',
    image: 'https://urmigroup.com/wp-content/uploads/2019/12/3-2-300x300.jpg',
    alt: 'HSBC Export Excellence Award',
  },
  {
    id: 'a4',
    title: 'Best Green Factory Award',
    year: '2020',
    image: 'https://urmigroup.com/wp-content/uploads/2019/12/4-2-300x300.jpg',
    alt: 'Best Green Factory Award',
  },
  {
    id: 'a5',
    title: 'Sustainability Leadership',
    year: '2021',
    image: 'https://urmigroup.com/wp-content/uploads/2019/12/5-2-300x300.jpg',
    alt: 'Sustainability Leadership',
  },
  {
    id: 'a6',
    title: 'Innovation in Manufacturing',
    year: '2022',
    image: 'https://urmigroup.com/wp-content/uploads/2019/12/6-2-300x300.jpg',
    alt: 'Innovation in Manufacturing',
  },
  {
    id: 'a7',
    title: 'Worker Welfare Recognition',
    year: '2023',
    image: 'https://urmigroup.com/wp-content/uploads/2019/12/7-2-300x300.jpg',
    alt: 'Worker Welfare Recognition',
  },
  {
    id: 'a8',
    title: 'LEED Platinum Certification',
    year: '2024',
    image: 'https://urmigroup.com/wp-content/uploads/2019/12/8-2-300x300.jpg',
    alt: 'LEED Platinum Certification',
  },
]
