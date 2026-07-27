import mongoose, { Schema, Document } from "mongoose";

export interface IDeviceVariant extends Document {
  variant: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DeviceVariantSchema = new Schema<IDeviceVariant>(
  {
    variant: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Optional: index for faster lookups
DeviceVariantSchema.index({ variant: 1 });

export default mongoose.model<IDeviceVariant>(
  "DeviceVariant",
  DeviceVariantSchema,
  "DeviceVariant" // Uses your existing collection name exactly
);