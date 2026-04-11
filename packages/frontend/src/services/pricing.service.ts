import api from './api';
import type { PricingEntry } from '@cts/shared';

export const getPricing = async (): Promise<PricingEntry[]> => {
  const response = await api.get('/pricing');
  return response.data.data.entries;
};

export const updatePricing = async (entries: PricingEntry[]): Promise<PricingEntry[]> => {
  const response = await api.put('/pricing/admin', { entries });
  return response.data.data.entries;
};
