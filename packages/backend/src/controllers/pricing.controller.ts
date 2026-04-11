import { Request, Response, NextFunction } from 'express';
import { ApiResponse, PricingEntry } from '@cts/shared';
import * as pricingService from '../services/pricing.service';

export const getPricing = async (
  req: Request,
  res: Response<ApiResponse<{ entries: PricingEntry[] }>>,
  next: NextFunction
): Promise<void> => {
  try {
    const pricing = await pricingService.getPricing();
    res.json({ success: true, data: { entries: pricing.entries } });
  } catch (error) {
    next(error);
  }
};

export const updatePricing = async (
  req: Request<{}, {}, { entries: PricingEntry[] }>,
  res: Response<ApiResponse<{ entries: PricingEntry[] }>>,
  next: NextFunction
): Promise<void> => {
  try {
    const pricing = await pricingService.updatePricing(req.body.entries);
    res.json({ success: true, data: { entries: pricing.entries } });
  } catch (error) {
    next(error);
  }
};
