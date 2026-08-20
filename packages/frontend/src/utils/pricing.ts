import type { PricingEntry } from '@cts/shared';
import { getPricing } from '../services/pricing.service';

/**
 * Pricing table based on km ranges.
 * Each entry: [maxKm, normalPrice (1-4 people), vanPrice (5+ people)]
 */
const DEFAULT_PRICING_TABLE: [number, number, number][] = [
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

let cachedPricing: [number, number, number][] | null = null;

/**
 * Load pricing from the API and cache it.
 * Falls back silently to the default table on error.
 */
export async function loadPricing(): Promise<void> {
  try {
    const entries = await getPricing();
    cachedPricing = entries.map((e) => [e.maxKm, e.normalPrice, e.vanPrice] as [number, number, number]);
  } catch {
    // silently fall back to default pricing
  }
}

/**
 * Update the cached pricing from PricingEntry[] (e.g. after admin save).
 */
export function setPricingCache(entries: PricingEntry[]): void {
  cachedPricing = entries.map((e) => [e.maxKm, e.normalPrice, e.vanPrice] as [number, number, number]);
}

/**
 * Calculate price based on distance and number of people.
 * - 1-4 people → normal rate
 * - 5+ people → van rate
 * Returns null if distance exceeds the table range.
 */
export function calculatePrice(distanceKm: number, people: number): number | null {
  if (distanceKm <= 0) return null;

  const table = cachedPricing ?? DEFAULT_PRICING_TABLE;
  const entry = table.find(([maxKm]) => distanceKm <= maxKm)
    ?? table[table.length - 1];

  return people >= 5 ? entry[2] : entry[1];
}

/** Card payments carry a 5% surcharge. */
export const CARD_SURCHARGE_PERCENT = 5;

/**
 * Apply the card surcharge (+5%), rounded UP to the nearest euro.
 * Scales to integers before dividing so floating-point drift can't push an
 * exact result over a euro boundary (e.g. 20 * 1.05 === 21.000000000000004,
 * which would otherwise ceil to 22).
 */
export function applyCardSurcharge(base: number, paymentMethod: 'cash' | 'card'): number {
  if (paymentMethod !== 'card') return base;
  return Math.ceil(Math.round(base * (100 + CARD_SURCHARGE_PERCENT)) / 100);
}
