import { Request, Response, NextFunction } from 'express';
import { ApiResponse, CarouselImage, CarouselCategory } from '@cts/shared';
import * as carouselService from '../services/carousel.service';
import logger from '../utils/logger';

export const getActiveImages = async (
  req: Request,
  res: Response<ApiResponse<{ images: CarouselImage[] }>>,
  next: NextFunction
): Promise<void> => {
  try {
    const category = (req.query.category as CarouselCategory) || 'hero';
    const images = await carouselService.getActiveImages(category);
    res.json({ success: true, data: { images } });
  } catch (error) {
    next(error);
  }
};

export const getAllImages = async (
  req: Request,
  res: Response<ApiResponse<{ images: CarouselImage[] }>>,
  next: NextFunction
): Promise<void> => {
  try {
    const category = (req.query.category as CarouselCategory) || 'hero';
    const images = await carouselService.getAllImages(category);
    res.json({ success: true, data: { images } });
  } catch (error) {
    next(error);
  }
};

export const addImage = async (
  req: Request<{}, {}, { url: string; alt?: string; category?: CarouselCategory }>,
  res: Response<ApiResponse<{ image: CarouselImage }>>,
  next: NextFunction
): Promise<void> => {
  try {
    const { url, alt, category } = req.body;
    const image = await carouselService.addImage({ url, alt, category });
    res.status(201).json({ success: true, data: { image } });
  } catch (error) {
    next(error);
  }
};

export const updateImage = async (
  req: Request<{ id: string }>,
  res: Response<ApiResponse<{ image: CarouselImage }>>,
  next: NextFunction
): Promise<void> => {
  try {
    const image = await carouselService.updateImage(req.params.id, req.body);
    res.json({ success: true, data: { image } });
  } catch (error) {
    next(error);
  }
};

export const deleteImage = async (
  req: Request<{ id: string }>,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    await carouselService.deleteImage(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const reorderImages = async (
  req: Request<{}, {}, { orderedIds: string[] }>,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const { orderedIds } = req.body;
    await carouselService.reorderImages(orderedIds);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
