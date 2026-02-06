import mongoose, { Schema, type Document } from "mongoose";
import { VERIFICATION_CODE_EXPIRY_MS, VERIFICATION_MAX_ATTEMPTS } from "@/lib/constants";

export interface IVerificationCode extends Document {
  emailHash: string;
  code: string;
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
}

const VerificationCodeSchema = new Schema<IVerificationCode>(
  {
    emailHash: { type: String, required: true, index: true },
    code: { type: String, required: true },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + VERIFICATION_CODE_EXPIRY_MS),
      index: { expires: 0 }, // TTL index — auto-delete when expiresAt passes
    },
    attempts: { type: Number, default: 0, max: VERIFICATION_MAX_ATTEMPTS },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const VerificationCode =
  mongoose.models.VerificationCode as mongoose.Model<IVerificationCode> ||
  mongoose.model<IVerificationCode>("VerificationCode", VerificationCodeSchema);
