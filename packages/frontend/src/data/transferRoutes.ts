export interface TransferRoute {
  slug: string;
  fromKey: string;
  toKey: string;
  estimatedMinutes: number;
  estimatedKm: number;
}

export const TRANSFER_ROUTES: TransferRoute[] = [
  // Heraklion Airport (12 routes)
  { slug: 'heraklion-airport-to-hersonissos', fromKey: 'heraklionAirport', toKey: 'hersonissos', estimatedMinutes: 30, estimatedKm: 26 },
  { slug: 'heraklion-airport-to-malia', fromKey: 'heraklionAirport', toKey: 'malia', estimatedMinutes: 40, estimatedKm: 34 },
  { slug: 'heraklion-airport-to-stalida', fromKey: 'heraklionAirport', toKey: 'stalida', estimatedMinutes: 35, estimatedKm: 30 },
  { slug: 'heraklion-airport-to-gouves', fromKey: 'heraklionAirport', toKey: 'gouves', estimatedMinutes: 25, estimatedKm: 20 },
  { slug: 'heraklion-airport-to-agios-nikolaos', fromKey: 'heraklionAirport', toKey: 'agiosNikolaos', estimatedMinutes: 70, estimatedKm: 65 },
  { slug: 'heraklion-airport-to-elounda', fromKey: 'heraklionAirport', toKey: 'elounda', estimatedMinutes: 80, estimatedKm: 72 },
  { slug: 'heraklion-airport-to-rethymno', fromKey: 'heraklionAirport', toKey: 'rethymno', estimatedMinutes: 75, estimatedKm: 78 },
  { slug: 'heraklion-airport-to-chania', fromKey: 'heraklionAirport', toKey: 'chaniaOldTown', estimatedMinutes: 150, estimatedKm: 140 },
  { slug: 'heraklion-airport-to-heraklion-center', fromKey: 'heraklionAirport', toKey: 'heraklionCenter', estimatedMinutes: 15, estimatedKm: 5 },
  { slug: 'heraklion-airport-to-agia-pelagia', fromKey: 'heraklionAirport', toKey: 'agiaPelagia', estimatedMinutes: 35, estimatedKm: 30 },
  { slug: 'heraklion-airport-to-matala', fromKey: 'heraklionAirport', toKey: 'matala', estimatedMinutes: 90, estimatedKm: 67 },
  { slug: 'heraklion-airport-to-bali', fromKey: 'heraklionAirport', toKey: 'bali', estimatedMinutes: 50, estimatedKm: 45 },

  // Heraklion Port (4 routes)
  { slug: 'heraklion-port-to-hersonissos', fromKey: 'heraklionPort', toKey: 'hersonissos', estimatedMinutes: 30, estimatedKm: 28 },
  { slug: 'heraklion-port-to-malia', fromKey: 'heraklionPort', toKey: 'malia', estimatedMinutes: 40, estimatedKm: 36 },
  { slug: 'heraklion-port-to-rethymno', fromKey: 'heraklionPort', toKey: 'rethymno', estimatedMinutes: 75, estimatedKm: 80 },
  { slug: 'heraklion-port-to-agios-nikolaos', fromKey: 'heraklionPort', toKey: 'agiosNikolaos', estimatedMinutes: 70, estimatedKm: 67 },

  // Chania Airport (6 routes)
  { slug: 'chania-airport-to-chania-old-town', fromKey: 'chaniaAirport', toKey: 'chaniaOldTown', estimatedMinutes: 25, estimatedKm: 15 },
  { slug: 'chania-airport-to-rethymno', fromKey: 'chaniaAirport', toKey: 'rethymno', estimatedMinutes: 70, estimatedKm: 60 },
  { slug: 'chania-airport-to-heraklion', fromKey: 'chaniaAirport', toKey: 'heraklionCenter', estimatedMinutes: 150, estimatedKm: 138 },
  { slug: 'chania-airport-to-platanias', fromKey: 'chaniaAirport', toKey: 'platanias', estimatedMinutes: 30, estimatedKm: 22 },
  { slug: 'chania-airport-to-georgioupoli', fromKey: 'chaniaAirport', toKey: 'georgioupoli', estimatedMinutes: 45, estimatedKm: 40 },
  { slug: 'chania-airport-to-kissamos', fromKey: 'chaniaAirport', toKey: 'kissamos', estimatedMinutes: 50, estimatedKm: 42 },

  // Chania Port / Souda (2 routes)
  { slug: 'chania-port-to-chania-old-town', fromKey: 'chaniaPort', toKey: 'chaniaOldTown', estimatedMinutes: 15, estimatedKm: 7 },
  { slug: 'chania-port-to-rethymno', fromKey: 'chaniaPort', toKey: 'rethymno', estimatedMinutes: 60, estimatedKm: 55 },

  // Inter-city (3 routes)
  { slug: 'heraklion-to-rethymno', fromKey: 'heraklionCenter', toKey: 'rethymno', estimatedMinutes: 75, estimatedKm: 78 },
  { slug: 'heraklion-to-chania', fromKey: 'heraklionCenter', toKey: 'chaniaOldTown', estimatedMinutes: 150, estimatedKm: 140 },
  { slug: 'rethymno-to-chania', fromKey: 'rethymno', toKey: 'chaniaOldTown', estimatedMinutes: 65, estimatedKm: 62 },
];

export const getRouteBySlug = (slug: string): TransferRoute | undefined =>
  TRANSFER_ROUTES.find((r) => r.slug === slug);
