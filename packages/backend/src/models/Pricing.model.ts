import mongoose, { Schema, Document } from 'mongoose';
import { PricingEntry } from '@cts/shared';

export interface PricingDocument extends Document {
  entries: PricingEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const pricingEntrySchema = new Schema(
  {
    maxKm: {
      type: Number,
      required: [true, 'maxKm is required'],
    },
    normalPrice: {
      type: Number,
      required: [true, 'normalPrice is required'],
    },
    vanPrice: {
      type: Number,
      required: [true, 'vanPrice is required'],
    },
  },
  { _id: false }
);

const pricingSchema = new Schema<PricingDocument>(
  {
    entries: {
      type: [pricingEntrySchema],
      default: [],
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

export const Pricing = mongoose.model<PricingDocument>('Pricing', pricingSchema);
