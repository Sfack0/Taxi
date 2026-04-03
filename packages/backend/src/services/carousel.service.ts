import { CarouselImage as ICarouselImage, CarouselCategory } from '@cts/shared';
import { CarouselImage } from '../models/CarouselImage.model';
import { AppError } from '../middleware/error.middleware';

export const getActiveImages = async (category: CarouselCategory = 'hero'): Promise<ICarouselImage[]> => {
  const images = await CarouselImage.find({ category, isActive: true }).sort({ order: 1 });
  return images as unknown as ICarouselImage[];
};

export const getAllImages = async (category: CarouselCategory = 'hero'): Promise<ICarouselImage[]> => {
  const images = await CarouselImage.find({ category }).sort({ order: 1 });
  return images as unknown as ICarouselImage[];
};

export const addImage = async (data: { url: string; alt?: string; category?: CarouselCategory }): Promise<ICarouselImage> => {
  const cat = data.category || 'hero';
  const maxOrderImage = await CarouselImage.findOne({ category: cat }).sort({ order: -1 });
  const nextOrder = maxOrderImage ? maxOrderImage.order + 1 : 0;

  const image = await CarouselImage.create({
    category: cat,
    url: data.url,
    alt: data.alt,
    order: nextOrder,
  });

  return image as unknown as ICarouselImage;
};

export const updateImage = async (
  id: string,
  data: Partial<{ url: string; alt: string; isActive: boolean; order: number }>
): Promise<ICarouselImage> => {
  const image = await CarouselImage.findByIdAndUpdate(id, data, { new: true });

  if (!image) {
    throw new AppError('Carousel image not found', 404, 'NOT_FOUND');
  }

  return image as unknown as ICarouselImage;
};

export const deleteImage = async (id: string): Promise<void> => {
  const image = await CarouselImage.findByIdAndDelete(id);

  if (!image) {
    throw new AppError('Carousel image not found', 404, 'NOT_FOUND');
  }
};

export const reorderImages = async (orderedIds: string[]): Promise<void> => {
  const operations = orderedIds.map((id, index) => ({
    updateOne: {
      filter: { _id: id },
      update: { $set: { order: index } },
    },
  }));

  await CarouselImage.bulkWrite(operations);
};
