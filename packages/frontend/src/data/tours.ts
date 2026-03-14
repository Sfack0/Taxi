export type TourCategory = 'beach' | 'culture' | 'adventure' | 'nature';

export interface TourStop {
  locationKey: string; // i18n key for location name
  durationMinutes: number;
}

export interface Tour {
  id: string;
  slug: string;
  image: string;
  durationHours: number;
  estimatedKm: number;
  maxPeople: number;
  category: TourCategory;
  popular?: boolean;
  stops: TourStop[];
  startingPrice: number; // EUR per group
}

export const TOURS: Tour[] = [
  {
    id: 'knossos-heraklion',
    slug: 'knossos-heraklion-city',
    image: '/images/knossos-palace-at-crete-greece.webp',
    durationHours: 5,
    estimatedKm: 30,
    maxPeople: 8,
    category: 'culture',
    popular: true,
    startingPrice: 120,
    stops: [
      { locationKey: 'knossosPalace', durationMinutes: 120 },
      { locationKey: 'archaeologicalMuseum', durationMinutes: 90 },
      { locationKey: 'heraklionOldTown', durationMinutes: 60 },
    ],
  },
  {
    id: 'elafonisi-falasarna',
    slug: 'elafonisi-falasarna-beaches',
    image: '/images/elafonisi-beach.jpg',
    durationHours: 10,
    estimatedKm: 280,
    maxPeople: 8,
    category: 'beach',
    popular: true,
    startingPrice: 250,
    stops: [
      { locationKey: 'elafonisi', durationMinutes: 180 },
      { locationKey: 'falasarna', durationMinutes: 120 },
    ],
  },
  {
    id: 'balos-gramvousa',
    slug: 'balos-lagoon-gramvousa',
    image: '/images/balos-lagoon.jpg',
    durationHours: 10,
    estimatedKm: 260,
    maxPeople: 8,
    category: 'beach',
    popular: true,
    startingPrice: 240,
    stops: [
      { locationKey: 'kissamos', durationMinutes: 30 },
      { locationKey: 'balos', durationMinutes: 240 },
      { locationKey: 'gramvousa', durationMinutes: 90 },
    ],
  },
  {
    id: 'spinalonga-elounda',
    slug: 'spinalonga-elounda-agios-nikolaos',
    image: '/images/elounda-beach.jpg',
    durationHours: 7,
    estimatedKm: 140,
    maxPeople: 8,
    category: 'culture',
    popular: true,
    startingPrice: 180,
    stops: [
      { locationKey: 'elounda', durationMinutes: 60 },
      { locationKey: 'spinalonga', durationMinutes: 120 },
      { locationKey: 'agiosNikolaos', durationMinutes: 90 },
    ],
  },
  {
    id: 'rethymno-arkadi',
    slug: 'rethymno-arkadi-monastery',
    image: '/images/rethymno_intro.jpg',
    durationHours: 6,
    estimatedKm: 80,
    maxPeople: 8,
    category: 'culture',
    startingPrice: 150,
    stops: [
      { locationKey: 'arkadiMonastery', durationMinutes: 90 },
      { locationKey: 'rethymnoOldTown', durationMinutes: 120 },
      { locationKey: 'rethymnoHarbor', durationMinutes: 60 },
    ],
  },
  {
    id: 'south-coast',
    slug: 'south-coast-matala-preveli',
    image: '/images/preveli-beach.jpg',
    durationHours: 9,
    estimatedKm: 200,
    maxPeople: 8,
    category: 'nature',
    startingPrice: 220,
    stops: [
      { locationKey: 'matala', durationMinutes: 120 },
      { locationKey: 'preveli', durationMinutes: 120 },
      { locationKey: 'plakias', durationMinutes: 90 },
    ],
  },
  {
    id: 'chania-old-town',
    slug: 'chania-old-town-venetian-harbor',
    image: '/images/chania-old-port-5.jpg',
    durationHours: 6,
    estimatedKm: 150,
    maxPeople: 8,
    category: 'culture',
    startingPrice: 160,
    stops: [
      { locationKey: 'chaniaOldTown', durationMinutes: 120 },
      { locationKey: 'chaniaHarbor', durationMinutes: 60 },
      { locationKey: 'chaniaMarket', durationMinutes: 60 },
    ],
  },
  {
    id: 'lasithi-plateau',
    slug: 'lasithi-plateau-zeus-cave',
    image: '/images/istockphoto-1197950653-612x612.jpg',
    durationHours: 7,
    estimatedKm: 120,
    maxPeople: 8,
    category: 'adventure',
    startingPrice: 170,
    stops: [
      { locationKey: 'lasithiPlateau', durationMinutes: 60 },
      { locationKey: 'zeusCave', durationMinutes: 90 },
      { locationKey: 'psychro', durationMinutes: 60 },
    ],
  },
];

export const TOUR_CATEGORIES: TourCategory[] = ['beach', 'culture', 'adventure', 'nature'];

export function getTourBySlug(slug: string): Tour | undefined {
  return TOURS.find((t) => t.slug === slug);
}

export function getPopularTours(): Tour[] {
  return TOURS.filter((t) => t.popular);
}

export function getToursByCategory(category?: TourCategory): Tour[] {
  if (!category) return TOURS;
  return TOURS.filter((t) => t.category === category);
}

// Destinations available for DIY tour builder
export const DIY_STOPS = [
  { id: 'knossos', image: '/images/knossos-pptx.png', lat: 35.2980, lng: 25.1630 },
  { id: 'elafonisi', image: '/images/elafonisi-13.jpg', lat: 35.2720, lng: 23.5410 },
  { id: 'balos', image: '/images/balos-lagoon.jpg', lat: 35.5780, lng: 23.5880 },
  { id: 'preveli', image: '/images/preveli-beach.jpg', lat: 35.1540, lng: 24.4740 },
  { id: 'matala', image: '/images/matala-beach.png', lat: 34.9950, lng: 24.7500 },
  { id: 'elounda', image: '/images/elounda-beach.jpg', lat: 35.2550, lng: 25.7270 },
  { id: 'spinalonga', image: '/images/elounda-beach.png', lat: 35.2970, lng: 25.7450 },
  { id: 'rethymno', image: '/images/rethymno_intro.jpg', lat: 35.3693, lng: 24.4731 },
  { id: 'chania', image: '/images/chania-old-port-5.jpg', lat: 35.5180, lng: 24.0179 },
  { id: 'falasarna', image: '/images/falasarna-beach.jpg', lat: 35.4950, lng: 23.5640 },
  { id: 'agiosNikolaos', image: '/images/Voulisma-Beach-bestcretedestinations.gr_.webp', lat: 35.1906, lng: 25.7153 },
  { id: 'bali', image: '/images/Bali-Rethymno-Crete-Greece-allincrete.com-52.jpg', lat: 35.4130, lng: 24.7830 },
  { id: 'plakias', image: '/images/plakias-beach.jpg', lat: 35.1810, lng: 24.3940 },
  { id: 'vai', image: '/images/vai-palm-beach.jpg', lat: 35.2560, lng: 26.2650 },
  { id: 'heraklion', image: '/images/heraklio1.jpg', lat: 35.3387, lng: 25.1442 },
  { id: 'georgioupoli', image: '/images/Georgioupoli_3.jpg', lat: 35.4630, lng: 24.2580 },
];
