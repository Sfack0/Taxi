import { PricingEntry } from '@cts/shared';
import { Pricing, PricingDocument } from '../models/Pricing.model';
import { AppError } from '../middleware/error.middleware';

const DEFAULT_ENTRIES: PricingEntry[] = [
  { maxKm: 3.4, normalPrice: 18, vanPrice: 25 },
  { maxKm: 7, normalPrice: 20, vanPrice: 28 },
  { maxKm: 10, normalPrice: 27, vanPrice: 35 },
  { maxKm: 15, normalPrice: 30, vanPrice: 40 },
  { maxKm: 20, normalPrice: 35, vanPrice: 45 },
  { maxKm: 25, normalPrice: 40, vanPrice: 55 },
  { maxKm: 30, normalPrice: 45, vanPrice: 58 },
  { maxKm: 35, normalPrice: 50, vanPrice: 65 },
  { maxKm: 40, normalPrice: 55, vanPrice: 72 },
  { maxKm: 45, normalPrice: 60, vanPrice: 78 },
  { maxKm: 50, normalPrice: 70, vanPrice: 91 },
  { maxKm: 55, normalPrice: 75, vanPrice: 98 },
  { maxKm: 60, normalPrice: 77, vanPrice: 100 },
  { maxKm: 65, normalPrice: 83, vanPrice: 110 },
  { maxKm: 70, normalPrice: 90, vanPrice: 120 },
  { maxKm: 75, normalPrice: 95, vanPrice: 124 },
  { maxKm: 80, normalPrice: 100, vanPrice: 130 },
  { maxKm: 85, normalPrice: 108, vanPrice: 140 },
  { maxKm: 90, normalPrice: 115, vanPrice: 150 },
  { maxKm: 95, normalPrice: 120, vanPrice: 156 },
  { maxKm: 100, normalPrice: 127, vanPrice: 165 },
  { maxKm: 105, normalPrice: 135, vanPrice: 175 },
  { maxKm: 110, normalPrice: 140, vanPrice: 182 },
  { maxKm: 115, normalPrice: 147, vanPrice: 190 },
  { maxKm: 120, normalPrice: 152, vanPrice: 198 },
  { maxKm: 125, normalPrice: 158, vanPrice: 205 },
  { maxKm: 130, normalPrice: 165, vanPrice: 215 },
  { maxKm: 135, normalPrice: 175, vanPrice: 228 },
  { maxKm: 140, normalPrice: 180, vanPrice: 234 },
  { maxKm: 145, normalPrice: 185, vanPrice: 240 },
  { maxKm: 150, normalPrice: 193, vanPrice: 250 },
  { maxKm: 155, normalPrice: 198, vanPrice: 257 },
  { maxKm: 160, normalPrice: 205, vanPrice: 267 },
  { maxKm: 165, normalPrice: 210, vanPrice: 273 },
  { maxKm: 170, normalPrice: 218, vanPrice: 283 },
  { maxKm: 175, normalPrice: 225, vanPrice: 292 },
  { maxKm: 180, normalPrice: 230, vanPrice: 299 },
  { maxKm: 185, normalPrice: 235, vanPrice: 305 },
  { maxKm: 190, normalPrice: 240, vanPrice: 312 },
  { maxKm: 195, normalPrice: 245, vanPrice: 319 },
  { maxKm: 200, normalPrice: 250, vanPrice: 325 },
  { maxKm: 205, normalPrice: 260, vanPrice: 338 },
  { maxKm: 210, normalPrice: 265, vanPrice: 345 },
  { maxKm: 215, normalPrice: 273, vanPrice: 355 },
  { maxKm: 220, normalPrice: 280, vanPrice: 364 },
  { maxKm: 225, normalPrice: 284, vanPrice: 370 },
  { maxKm: 230, normalPrice: 290, vanPrice: 377 },
  { maxKm: 235, normalPrice: 295, vanPrice: 384 },
  { maxKm: 240, normalPrice: 300, vanPrice: 390 },
  { maxKm: 245, normalPrice: 305, vanPrice: 396 },
];

export const getPricing = async (): Promise<PricingDocument> => {
  let pricing = await Pricing.findOne();

  if (!pricing) {
    pricing = await Pricing.create({ entries: DEFAULT_ENTRIES });
  }

  return pricing;
};

export const updatePricing = async (entries: PricingEntry[]): Promise<PricingDocument> => {
  // Validate all numbers are positive
  for (const entry of entries) {
    if (entry.maxKm <= 0 || entry.normalPrice <= 0 || entry.vanPrice <= 0) {
      throw new AppError('Όλες οι τιμές πρέπει να είναι θετικοί αριθμοί', 400, 'VALIDATION_ERROR');
    }
  }

  // Sort entries by maxKm
  const sortedEntries = [...entries].sort((a, b) => a.maxKm - b.maxKm);

  const pricing = await Pricing.findOneAndUpdate(
    {},
    { entries: sortedEntries },
    { new: true, upsert: true }
  );

  return pricing!;
};
