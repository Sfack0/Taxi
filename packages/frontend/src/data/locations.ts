export interface LocationData {
  greek: string;
  key: string;
  lat: number;
  lng: number;
}

export const CUSTOM_LOCATION_VALUE = '__custom__';

export const LOCATIONS_DATA: LocationData[] = [
  // Airports
  { greek: 'Αεροδρόμιο Ηρακλείου (HER)', key: 'heraklionAirport', lat: 35.3397, lng: 25.1803 },
  { greek: 'Αεροδρόμιο Χανίων (CHQ)', key: 'chaniaAirport', lat: 35.5317, lng: 24.1497 },
  // Ports
  { greek: 'Λιμάνι Ηρακλείου', key: 'heraklionPort', lat: 35.3450, lng: 25.1500 },
  { greek: 'Λιμάνι Χανίων (Σούδα)', key: 'chaniaPort', lat: 35.4886, lng: 24.0783 },
  { greek: 'Λιμάνι Ρεθύμνου', key: 'rethymnoPort', lat: 35.3720, lng: 24.4750 },
  // Major cities & tourist areas
  { greek: 'Κέντρο Ηρακλείου', key: 'heraklionCenter', lat: 35.3387, lng: 25.1442 },
  { greek: 'Ρέθυμνο', key: 'rethymno', lat: 35.3693, lng: 24.4731 },
  { greek: 'Παλιά Πόλη Χανίων', key: 'chaniaOldTown', lat: 35.5180, lng: 24.0179 },
  { greek: 'Χερσόνησος', key: 'hersonissos', lat: 35.3142, lng: 25.3883 },
  { greek: 'Μάλια', key: 'malia', lat: 35.2917, lng: 25.4628 },
  { greek: 'Άγιος Νικόλαος', key: 'agiosNikolaos', lat: 35.1906, lng: 25.7153 },
  { greek: 'Ελούντα', key: 'elounda', lat: 35.2489, lng: 25.7303 },
  // Additional tourist areas
  { greek: 'Σταλίδα', key: 'stalida', lat: 35.3050, lng: 25.4350 },
  { greek: 'Γούβες', key: 'gouves', lat: 35.3350, lng: 25.3050 },
  { greek: 'Αγία Πελαγία', key: 'agiaPelagia', lat: 35.4050, lng: 25.0150 },
  { greek: 'Μπαλί', key: 'bali', lat: 35.4100, lng: 24.7800 },
  { greek: 'Μάταλα', key: 'matala', lat: 34.9950, lng: 24.7500 },
  { greek: 'Πλατανιάς', key: 'platanias', lat: 35.5150, lng: 23.8700 },
  { greek: 'Κίσσαμος', key: 'kissamos', lat: 35.4950, lng: 23.6550 },
  { greek: 'Γεωργιούπολη', key: 'georgioupoli', lat: 35.3650, lng: 24.2600 },
];
