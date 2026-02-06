import mongoose, { Schema, type Document } from "mongoose";
import { INITIAL_CREDIBILITY } from "@/lib/constants";

export interface IUser extends Document {
  tokenHash: string;
  emailHash: string;
  credibility: number;
  cooldownUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    tokenHash: { type: String, required: true, unique: true, index: true },
    emailHash: { type: String, required: true, unique: true, index: true },
    credibility: { type: Number, default: INITIAL_CREDIBILITY },
    cooldownUntil: { type: Date, default: null },
  },
  { timestamps: true }
);

export const User = mongoose.models.User as mongoose.Model<IUser> || mongoose.model<IUser>("User", UserSchema);
