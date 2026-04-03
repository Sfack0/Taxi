import mongoose, { Schema, Document } from 'mongoose';
import { CarouselImage as ICarouselImage } from '@cts/shared';

export interface CarouselImageDocument extends Omit<ICarouselImage, '_id' | 'createdAt' | 'updatedAt'>, Document {}

const carouselImageSchema = new Schema<CarouselImageDocument>(
  {
    category: {
      type: String,
      enum: ['hero', 'van'],
      default: 'hero',
    },
    url: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true,
    },
    alt: {
      type: String,
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
carouselImageSchema.index({ category: 1, order: 1 });

export const CarouselImage = mongoose.model<CarouselImageDocument>('CarouselImage', carouselImageSchema);
