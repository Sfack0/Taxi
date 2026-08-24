import mongoose, { Schema, Document } from 'mongoose';
import { Ride as IRide } from '@cts/shared';

export interface RideDocument extends Omit<IRide, '_id' | 'createdAt' | 'updatedAt'>, Document {}

const locationSchema = new Schema(
  {
    address: {
      type: String,
      required: true,
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
  },
  { _id: false }
);

const rideSchema = new Schema<RideDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: undefined, // Optional for guest bookings
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    customerPhone: {
      type: String,
      required: [true, 'Customer phone is required'],
      trim: true,
    },
    customerEmail: {
      type: String,
      required: [true, 'Customer email is required'],
      trim: true,
      lowercase: true,
    },
    customerLanguage: {
      type: String,
      enum: ['el', 'en', 'fr', 'de', 'it', 'es'],
      default: 'el',
    },
    driver: {
      type: Schema.Types.ObjectId,
      ref: 'Driver',
      default: undefined,
    },
    pickup: {
      type: locationSchema,
      required: [true, 'Pickup location is required'],
    },
    dropoff: {
      type: locationSchema,
      required: [true, 'Dropoff location is required'],
    },
    people: {
      type: Number,
      required: false,
      min: 1,
      default: 1,
    },
    distance: {
      type: Number,
      required: false,
      min: 0,
      default: 0,
    },
    estimatedDuration: {
      type: Number,
      required: false,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'driver_arrived', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    // requestedAt: αφαιρέθηκε
    acceptedAt: {
      type: Date,
      default: undefined,
    },
    startedAt: {
      type: Date,
      default: undefined,
    },
    completedAt: {
      type: Date,
      default: undefined,
    },
    cancelledAt: {
      type: Date,
      default: undefined,
    },
    scheduledFor: {
      type: Date,
      default: undefined,
    },
    isRoundtrip: {
      type: Boolean,
      default: false,
    },
    returnScheduledFor: {
      type: Date,
      default: undefined,
    },
    returnPeople: {
      type: Number,
      default: undefined,
      min: 1,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card'],
      default: 'cash',
    },
    childSeat: {
      type: Boolean,
      default: false,
    },
    babySeat: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      default: undefined,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    userRating: {
      type: Number,
      default: undefined,
      min: 1,
      max: 5,
    },
    driverRating: {
      type: Number,
      default: undefined,
      min: 1,
      max: 5,
    },
    userFeedback: {
      type: String,
      default: undefined,
      maxlength: [1000, 'Feedback cannot exceed 1000 characters'],
    },
    flightNumber: {
      type: String,
      default: undefined,
      trim: true,
    },
    flightTime: {
      type: String,
      default: undefined,
      trim: true,
    },
    luggageCount: {
      type: Number,
      default: undefined,
      min: 0,
    },
    smallLuggageCount: {
      type: Number,
      default: undefined,
      min: 0,
    },
    largeLuggageCount: {
      type: Number,
      default: undefined,
      min: 0,
    },
    returnFlightNumber: {
      type: String,
      default: undefined,
      trim: true,
    },
    returnFlightTime: {
      type: String,
      default: undefined,
      trim: true,
    },
    returnLuggageCount: {
      type: Number,
      default: undefined,
      min: 0,
    },
    returnSmallLuggageCount: {
      type: Number,
      default: undefined,
      min: 0,
    },
    returnLargeLuggageCount: {
      type: Number,
      default: undefined,
      min: 0,
    },
    price: {
      type: Number,
      min: 0,
      default: undefined,
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
rideSchema.index({ user: 1, createdAt: -1 });
rideSchema.index({ driver: 1, status: 1 });
rideSchema.index({ status: 1 });
rideSchema.index({ 'pickup.coordinates': '2dsphere' });
rideSchema.index({ 'dropoff.coordinates': '2dsphere' });

export const Ride = mongoose.model<RideDocument>('Ride', rideSchema);
