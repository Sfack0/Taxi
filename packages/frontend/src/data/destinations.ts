export type Region = 'heraklion' | 'rethymno' | 'chania' | 'lasithi';
export type Category = 'beach' | 'historical';

export interface Destination {
  id: string;
  region: Region;
  category: Category;
  lat: number;
  lng: number;
  locationKey?: string;
  image?: string;
}

const REGION_IMAGES: Record<Region, string> = {
  heraklion: '/images/heraklio1.jpg',
  rethymno: '/images/rethymno_intro.jpg',
  chania: '/images/chania-old-port-5.jpg',
  lasithi: '/images/istockphoto-1197950653-612x612.jpg',
};

export const DESTINATIONS: Destination[] = [
  // Heraklion — Beaches
  { id: 'fodele', region: 'heraklion', category: 'beach', lat: 35.4080, lng: 24.9530, locationKey: 'fodele', image: '/images/fodele-beach.jpg' },
  { id: 'agiaPelagia', region: 'heraklion', category: 'beach', lat: 35.4070, lng: 25.0150, locationKey: 'agiaPelagia', image: '/images/agia-pelagia.jpg' },
  { id: 'paliokastro', region: 'heraklion', category: 'beach', lat: 35.3980, lng: 24.9890, image: '/images/paliokastro-beach.jpg' },
  { id: 'sisi', region: 'heraklion', category: 'beach', lat: 35.3070, lng: 25.5220, image: '/images/Sisi-Sissi-Village-Lasithi-Crete-Copyright-Allincrete.com-7-of-20.jpg' },
  { id: 'matala', region: 'heraklion', category: 'beach', lat: 34.9950, lng: 24.7500, locationKey: 'matala', image: '/images/matala-beach.png' },
  { id: 'lentas', region: 'heraklion', category: 'beach', lat: 34.9290, lng: 24.9240, image: '/images/lentas-beach.jpg' },
  { id: 'threeChurches', region: 'heraklion', category: 'beach', lat: 34.9560, lng: 25.0520, image: '/images/three-churches-beach.jpg' },
  { id: 'tsoutsouros', region: 'heraklion', category: 'beach', lat: 34.9680, lng: 25.1160, image: '/images/tsoutsouros-beach.jpg' },

  // Heraklion — Historical
  { id: 'knossosPalace', region: 'heraklion', category: 'historical', lat: 35.2980, lng: 25.1630, locationKey: 'knossos', image: '/images/knossos-pptx.png' },
  { id: 'koulesForetress', region: 'heraklion', category: 'historical', lat: 35.3450, lng: 25.1350, image: '/images/koules-pptx2.png' },
  { id: 'archaeologicalMuseum', region: 'heraklion', category: 'historical', lat: 35.3395, lng: 25.1375, image: '/images/archaeological-museum.jpg' },
  { id: 'agiosTitos', region: 'heraklion', category: 'historical', lat: 35.3390, lng: 25.1330, image: '/images/agios-titos-pptx.jpg' },

  // Rethymno — Beaches
  { id: 'bali', region: 'rethymno', category: 'beach', lat: 35.4130, lng: 24.7830, locationKey: 'bali', image: '/images/Bali-Rethymno-Crete-Greece-allincrete.com-52.jpg' },
  { id: 'georgioupoli', region: 'rethymno', category: 'beach', lat: 35.4630, lng: 24.2580, locationKey: 'georgioupoli', image: '/images/Georgioupoli_3.jpg' },
  { id: 'preveli', region: 'rethymno', category: 'beach', lat: 35.1540, lng: 24.4740, image: '/images/preveli-beach.jpg' },
  { id: 'plakias', region: 'rethymno', category: 'beach', lat: 35.1810, lng: 24.3940, locationKey: 'plakias', image: '/images/plakias-beach.jpg' },

  // Chania — Beaches
  { id: 'elafonisi', region: 'chania', category: 'beach', lat: 35.2720, lng: 23.5410, locationKey: 'elafonisi', image: '/images/elafonisi-13.jpg' },
  { id: 'balos', region: 'chania', category: 'beach', lat: 35.5780, lng: 23.5880, locationKey: 'balos', image: '/images/balos-lagoon.jpg' },
  { id: 'falasarna', region: 'chania', category: 'beach', lat: 35.4950, lng: 23.5640, image: '/images/falasarna-beach.jpg' },
  { id: 'stavros', region: 'chania', category: 'beach', lat: 35.5700, lng: 24.1130, image: '/images/stavros-beach.jpg' },

  // Lasithi — Beaches
  { id: 'elounda', region: 'lasithi', category: 'beach', lat: 35.2550, lng: 25.7270, locationKey: 'elounda', image: '/images/elounda-beach.jpg' },
  { id: 'voulisma', region: 'lasithi', category: 'beach', lat: 35.1580, lng: 25.7480, image: '/images/Voulisma-Beach-bestcretedestinations.gr_.webp' },
  { id: 'vai', region: 'lasithi', category: 'beach', lat: 35.2560, lng: 26.2650, locationKey: 'vai', image: '/images/vai-palm-beach.jpg' },
  { id: 'makrigialos', region: 'lasithi', category: 'beach', lat: 35.0380, lng: 25.9830, image: '/images/makrigialos-beach.jpg' },
];

export const POPULAR_DESTINATION_IDS = [
  'elafonisi',
  'balos',
  'knossosPalace',
  'elounda',
  'matala',
  'preveli',
];

export function getDestinationImage(dest: Destination): string {
  return dest.image || REGION_IMAGES[dest.region];
}

export function getDestinationsByRegion(region?: Region): Destination[] {
  if (!region) return DESTINATIONS;
  return DESTINATIONS.filter((d) => d.region === region);
}

export function getPopularDestinations(): Destination[] {
  return POPULAR_DESTINATION_IDS
    .map((id) => DESTINATIONS.find((d) => d.id === id))
    .filter((d): d is Destination => d !== undefined);
}
