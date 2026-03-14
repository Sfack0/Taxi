import mongoose, { Schema, Document } from 'mongoose';

export interface OtpDocument extends Document {
  email: string;
  otpHash: string;
  attempts: number;
  createdAt: Date;
}

const otpSchema = new Schema<OtpDocument>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 300, // Auto-delete after 5 minutes
    },
  },
);

otpSchema.index({ email: 1, createdAt: -1 });

export const Otp = mongoose.model<OtpDocument>('Otp', otpSchema);
