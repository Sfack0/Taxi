/**
 * Pricing table based on km ranges.
 * Each entry: [maxKm, normalPrice (1-4 people), vanPrice (5+ people)]
 */
const PRICING_TABLE: [number, number, number][] = [
  [3.4, 18, 25],
  [7, 20, 28],
  [10, 27, 35],
  [15, 30, 40],
  [20, 35, 45],
  [25, 40, 55],
  [30, 45, 58],
  [35, 50, 65],
  [40, 55, 72],
  [45, 60, 78],
  [50, 70, 91],
  [55, 75, 98],
  [60, 77, 100],
  [65, 83, 110],
  [70, 90, 120],
  [75, 95, 124],
  [80, 100, 130],
  [85, 108, 140],
  [90, 115, 150],
  [95, 120, 156],
  [100, 127, 165],
  [105, 135, 175],
  [110, 140, 182],
  [115, 147, 190],
  [120, 152, 198],
  [125, 158, 205],
  [130, 165, 215],
  [135, 175, 228],
  [140, 180, 234],
  [145, 185, 240],
  [150, 193, 250],
  [155, 198, 257],
  [160, 205, 267],
  [165, 210, 273],
  [170, 218, 283],
  [175, 225, 292],
  [180, 230, 299],
  [185, 235, 305],
  [190, 240, 312],
  [195, 245, 319],
  [200, 250, 325],
  [205, 260, 338],
  [210, 265, 345],
  [215, 273, 355],
  [220, 280, 364],
  [225, 284, 370],
  [230, 290, 377],
  [235, 295, 384],
  [240, 300, 390],
  [245, 305, 396],
];

/**
 * Calculate price based on distance and number of people.
 * - 1-4 people → normal rate
 * - 5+ people → van rate
 * Returns null if distance exceeds the table range.
 */
export function calculatePrice(distanceKm: number, people: number): number | null {
  if (distanceKm <= 0) return null;

  const entry = PRICING_TABLE.find(([maxKm]) => distanceKm <= maxKm)
    ?? PRICING_TABLE[PRICING_TABLE.length - 1];

  return people >= 5 ? entry[2] : entry[1];
}
