import mongoose, { Schema, Document } from 'mongoose';

export type EmailLogStatus = 'sent' | 'failed' | 'skipped';

export interface EmailLogDocument extends Document {
  to: string;
  subject: string;
  text: string;
  html: string;
  type: string;
  provider: 'brevo' | 'smtp' | 'none';
  status: EmailLogStatus;
  error?: string;
  ride?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const emailLogSchema = new Schema<EmailLogDocument>(
  {
    to: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
    },
    // Body as sent: plain-text and full HTML versions
    text: {
      type: String,
      default: '',
    },
    html: {
      type: String,
      default: '',
    },
    // booking_confirmation | admin_notification | otp | cancellation_customer | cancellation_admin | status_update | other
    type: {
      type: String,
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ['brevo', 'smtp', 'none'],
      required: true,
    },
    status: {
      type: String,
      enum: ['sent', 'failed', 'skipped'],
      required: true,
      index: true,
    },
    error: {
      type: String,
      default: undefined,
    },
    ride: {
      type: Schema.Types.ObjectId,
      ref: 'Ride',
      default: undefined,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

emailLogSchema.index({ createdAt: -1 });

export const EmailLog = mongoose.model<EmailLogDocument>('EmailLog', emailLogSchema);
