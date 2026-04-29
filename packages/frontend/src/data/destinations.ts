export type Region = 'heraklion' | 'rethymno' | 'chania' | 'lasithi';
export type Category = 'beach' | 'historical' | 'archaeological' | 'museum' | 'monastery' | 'cave';

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
  { id: 'fodele', region: 'heraklion', category: 'beach', lat: 35.4022, lng: 24.9554, locationKey: 'fodele', image: '/images/fodele-beach.jpg' },
  { id: 'agiaPelagia', region: 'heraklion', category: 'beach', lat: 35.4068, lng: 25.0185, locationKey: 'agiaPelagia', image: '/images/agia-pelagia.jpg' },
  { id: 'paliokastro', region: 'heraklion', category: 'beach', lat: 35.3662, lng: 25.0389, image: '/images/paliokastro-beach.jpg' },
  { id: 'sisi', region: 'heraklion', category: 'beach', lat: 35.3070, lng: 25.5220, image: '/images/Sisi-Sissi-Village-Lasithi-Crete-Copyright-Allincrete.com-7-of-20.jpg' },
  { id: 'matala', region: 'heraklion', category: 'beach', lat: 34.9950, lng: 24.7500, locationKey: 'matala', image: '/images/matala-beach.png' },
  { id: 'lentas', region: 'heraklion', category: 'beach', lat: 34.9290, lng: 24.9240, image: '/images/lentas-beach.jpg' },
  { id: 'threeChurches', region: 'heraklion', category: 'beach', lat: 34.9542, lng: 25.1361, image: '/images/three-churches-beach.jpg' },
  { id: 'tsoutsouros', region: 'heraklion', category: 'beach', lat: 34.9865, lng: 25.2882, image: '/images/tsoutsouros-beach.jpg' },

  // Heraklion — Historical
  { id: 'knossosPalace', region: 'heraklion', category: 'historical', lat: 35.2980, lng: 25.1630, locationKey: 'knossos', image: '/images/knossos-pptx.png' },
  { id: 'koulesForetress', region: 'heraklion', category: 'historical', lat: 35.3446, lng: 25.1369, image: '/images/koules-pptx2.png' },
  { id: 'archaeologicalMuseum', region: 'heraklion', category: 'historical', lat: 35.3395, lng: 25.1375, image: '/images/archaeological-museum.jpg' },
  { id: 'agiosTitos', region: 'heraklion', category: 'historical', lat: 35.3401, lng: 25.1347, image: '/images/agios-titos-pptx.jpg' },

  // Heraklion — Archaeological
  { id: 'phaistos', region: 'heraklion', category: 'archaeological', lat: 35.0517, lng: 24.8141, image: '/images/phaistos-palace.jpg' },
  { id: 'maliaPalace', region: 'heraklion', category: 'archaeological', lat: 35.2932, lng: 25.4929, image: '/images/malia-palace.jpg' },

  // Heraklion — Museums
  { id: 'kotsanasMuseum', region: 'heraklion', category: 'museum', lat: 35.3415, lng: 25.1357, image: '/images/kotsanas-museum.jpg' },
  { id: 'historicalMuseumHeraklion', region: 'heraklion', category: 'museum', lat: 35.3419, lng: 25.1308, image: '/images/historical-museum-heraklion.jpg' },

  // Rethymno — Archaeological
  { id: 'eleftherna', region: 'rethymno', category: 'archaeological', lat: 35.3239, lng: 24.6772, image: '/images/eleftherna.jpg' },

  // Rethymno — Monasteries
  { id: 'arkadiMonastery', region: 'rethymno', category: 'monastery', lat: 35.3060, lng: 24.6243, image: '/images/arkadi-monastery.jpg' },

  // Chania — Archaeological
  { id: 'aptera', region: 'chania', category: 'archaeological', lat: 35.4629, lng: 24.1420, image: '/images/aptera.jpg' },

  // Lasithi — Archaeological
  { id: 'zakrosPalace', region: 'lasithi', category: 'archaeological', lat: 35.0981, lng: 26.2611 },

  // Lasithi — Historical
  { id: 'spinalonga', region: 'lasithi', category: 'historical', lat: 35.2975, lng: 25.7381, image: '/images/spinalonga.jpg' },

  // Heraklion — Caves
  { id: 'skotinosCave', region: 'heraklion', category: 'cave', lat: 35.3050, lng: 25.2972, image: '/images/skotinos-cave.jpg' },

  // Rethymno — Caves
  { id: 'sfendoniCave', region: 'rethymno', category: 'cave', lat: 35.2986, lng: 24.8393, image: '/images/sfendoni-cave.jpg' },
  { id: 'melidoniCave', region: 'rethymno', category: 'cave', lat: 35.3844, lng: 24.7292, image: '/images/melidoni-cave.jpg' },

  // Chania — Caves
  { id: 'agiaSophiaCave', region: 'chania', category: 'cave', lat: 35.4110, lng: 23.6818, image: '/images/agia-sophia-cave.jpg' },

  // Lasithi — Caves
  { id: 'diktaionAndron', region: 'lasithi', category: 'cave', lat: 35.1629, lng: 25.4451, image: '/images/diktaion-andron.jpg' },
  { id: 'milatosCave', region: 'lasithi', category: 'cave', lat: 35.3083, lng: 25.5781, image: '/images/milatos-cave.jpg' },

  // Rethymno — Beaches
  { id: 'bali', region: 'rethymno', category: 'beach', lat: 35.4130, lng: 24.7830, locationKey: 'bali', image: '/images/Bali-Rethymno-Crete-Greece-allincrete.com-52.jpg' },
  { id: 'georgioupoli', region: 'rethymno', category: 'beach', lat: 35.3620, lng: 24.2624, locationKey: 'georgioupoli', image: '/images/Georgioupoli_3.jpg' },
  { id: 'preveli', region: 'rethymno', category: 'beach', lat: 35.1540, lng: 24.4740, image: '/images/preveli-beach.jpg' },
  { id: 'plakias', region: 'rethymno', category: 'beach', lat: 35.1915, lng: 24.3955, locationKey: 'plakias', image: '/images/plakias-beach.jpg' },

  // Chania — Beaches
  { id: 'elafonisi', region: 'chania', category: 'beach', lat: 35.2720, lng: 23.5410, locationKey: 'elafonisi', image: '/images/elafonisi-13.jpg' },
  { id: 'balos', region: 'chania', category: 'beach', lat: 35.5780, lng: 23.5880, locationKey: 'balos', image: '/images/balos-lagoon.jpg' },
  { id: 'falasarna', region: 'chania', category: 'beach', lat: 35.5016, lng: 23.5796, image: '/images/falasarna-beach.jpg' },
  { id: 'stavros', region: 'chania', category: 'beach', lat: 35.5881, lng: 24.0913, image: '/images/stavros-beach.jpg' },

  // Lasithi — Beaches
  { id: 'elounda', region: 'lasithi', category: 'beach', lat: 35.2619, lng: 25.7209, locationKey: 'elounda', image: '/images/elounda-beach.jpg' },
  { id: 'voulisma', region: 'lasithi', category: 'beach', lat: 35.1257, lng: 25.7425, image: '/images/Voulisma-Beach-bestcretedestinations.gr_.webp' },
  { id: 'vai', region: 'lasithi', category: 'beach', lat: 35.2560, lng: 26.2650, locationKey: 'vai', image: '/images/vai-palm-beach.jpg' },
  { id: 'makrigialos', region: 'lasithi', category: 'beach', lat: 35.0394, lng: 25.9761, image: '/images/makrigialos-beach.jpg' },
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
