export interface TransferRoute {
  slug: string;
  fromKey: string;
  toKey: string;
  estimatedMinutes: number;
  estimatedKm: number;
}

export const TRANSFER_ROUTES: TransferRoute[] = [
  // Heraklion Airport (12 routes) — distances from Google Directions API
  { slug: 'heraklion-airport-to-hersonissos', fromKey: 'heraklionAirport', toKey: 'hersonissos', estimatedMinutes: 24, estimatedKm: 25 },
  { slug: 'heraklion-airport-to-malia', fromKey: 'heraklionAirport', toKey: 'malia', estimatedMinutes: 30, estimatedKm: 32 },
  { slug: 'heraklion-airport-to-stalida', fromKey: 'heraklionAirport', toKey: 'stalida', estimatedMinutes: 27, estimatedKm: 29 },
  { slug: 'heraklion-airport-to-gouves', fromKey: 'heraklionAirport', toKey: 'gouves', estimatedMinutes: 17, estimatedKm: 16 },
  { slug: 'heraklion-airport-to-agios-nikolaos', fromKey: 'heraklionAirport', toKey: 'agiosNikolaos', estimatedMinutes: 54, estimatedKm: 60 },
  { slug: 'heraklion-airport-to-elounda', fromKey: 'heraklionAirport', toKey: 'elounda', estimatedMinutes: 61, estimatedKm: 66 },
  { slug: 'heraklion-airport-to-rethymno', fromKey: 'heraklionAirport', toKey: 'rethymno', estimatedMinutes: 77, estimatedKm: 87 },
  { slug: 'heraklion-airport-to-chania', fromKey: 'heraklionAirport', toKey: 'chaniaOldTown', estimatedMinutes: 127, estimatedKm: 143 },
  { slug: 'heraklion-airport-to-heraklion-center', fromKey: 'heraklionAirport', toKey: 'heraklionCenter', estimatedMinutes: 11, estimatedKm: 4 },
  { slug: 'heraklion-airport-to-agia-pelagia', fromKey: 'heraklionAirport', toKey: 'agiaPelagia', estimatedMinutes: 26, estimatedKm: 26 },
  { slug: 'heraklion-airport-to-matala', fromKey: 'heraklionAirport', toKey: 'matala', estimatedMinutes: 65, estimatedKm: 67 },
  { slug: 'heraklion-airport-to-bali', fromKey: 'heraklionAirport', toKey: 'bali', estimatedMinutes: 47, estimatedKm: 53 },

  // Heraklion Port (4 routes)
  { slug: 'heraklion-port-to-hersonissos', fromKey: 'heraklionPort', toKey: 'hersonissos', estimatedMinutes: 28, estimatedKm: 28 },
  { slug: 'heraklion-port-to-malia', fromKey: 'heraklionPort', toKey: 'malia', estimatedMinutes: 35, estimatedKm: 35 },
  { slug: 'heraklion-port-to-rethymno', fromKey: 'heraklionPort', toKey: 'rethymno', estimatedMinutes: 79, estimatedKm: 87 },
  { slug: 'heraklion-port-to-agios-nikolaos', fromKey: 'heraklionPort', toKey: 'agiosNikolaos', estimatedMinutes: 59, estimatedKm: 63 },

  // Chania Airport (6 routes)
  { slug: 'chania-airport-to-chania-old-town', fromKey: 'chaniaAirport', toKey: 'chaniaOldTown', estimatedMinutes: 27, estimatedKm: 18 },
  { slug: 'chania-airport-to-rethymno', fromKey: 'chaniaAirport', toKey: 'rethymno', estimatedMinutes: 73, estimatedKm: 70 },
  { slug: 'chania-airport-to-heraklion', fromKey: 'chaniaAirport', toKey: 'heraklionCenter', estimatedMinutes: 138, estimatedKm: 152 },
  { slug: 'chania-airport-to-platanias', fromKey: 'chaniaAirport', toKey: 'platanias', estimatedMinutes: 45, estimatedKm: 33 },
  { slug: 'chania-airport-to-georgioupoli', fromKey: 'chaniaAirport', toKey: 'georgioupoli', estimatedMinutes: 54, estimatedKm: 50 },
  { slug: 'chania-airport-to-kissamos', fromKey: 'chaniaAirport', toKey: 'kissamos', estimatedMinutes: 64, estimatedKm: 55 },

  // Chania Port / Souda (2 routes)
  { slug: 'chania-port-to-chania-old-town', fromKey: 'chaniaPort', toKey: 'chaniaOldTown', estimatedMinutes: 19, estimatedKm: 8 },
  { slug: 'chania-port-to-rethymno', fromKey: 'chaniaPort', toKey: 'rethymno', estimatedMinutes: 55, estimatedKm: 52 },

  // Inter-city (3 routes)
  { slug: 'heraklion-to-rethymno', fromKey: 'heraklionCenter', toKey: 'rethymno', estimatedMinutes: 78, estimatedKm: 86 },
  { slug: 'heraklion-to-chania', fromKey: 'heraklionCenter', toKey: 'chaniaOldTown', estimatedMinutes: 128, estimatedKm: 143 },
  { slug: 'rethymno-to-chania', fromKey: 'rethymno', toKey: 'chaniaOldTown', estimatedMinutes: 64, estimatedKm: 61 },
];

export const getRouteBySlug = (slug: string): TransferRoute | undefined =>
  TRANSFER_ROUTES.find((r) => r.slug === slug);
