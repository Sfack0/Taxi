import api from './api';
import type { CarouselImage, CarouselCategory } from '@cts/shared';

export const getActiveImages = async (category: CarouselCategory = 'hero'): Promise<CarouselImage[]> => {
  const response = await api.get(`/carousel?category=${category}`);
  return response.data.data.images;
};

export const getAllImages = async (category: CarouselCategory = 'hero'): Promise<CarouselImage[]> => {
  const response = await api.get(`/carousel/admin/all?category=${category}`);
  return response.data.data.images;
};

export const addImage = async (url: string, category: CarouselCategory = 'hero', alt?: string): Promise<CarouselImage> => {
  const response = await api.post('/carousel/admin', { url, alt, category });
  return response.data.data.image;
};

export const updateImage = async (id: string, data: Partial<Pick<CarouselImage, 'url' | 'alt' | 'isActive'>>): Promise<CarouselImage> => {
  const response = await api.patch(`/carousel/admin/${id}`, data);
  return response.data.data.image;
};

export const deleteImage = async (id: string): Promise<void> => {
  await api.delete(`/carousel/admin/${id}`);
};

export const reorderImages = async (orderedIds: string[]): Promise<void> => {
  await api.put('/carousel/admin/reorder', { orderedIds });
};
