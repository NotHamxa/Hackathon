import mongoose, { Schema, type Document } from "mongoose";

export interface IRateLimit extends Document {
  dailyHash: string;
  postCount: number;
  createdAt: Date;
}

const RateLimitSchema = new Schema<IRateLimit>(
  {
    dailyHash: { type: String, required: true, unique: true },
    postCount: { type: Number, default: 0 },
    createdAt: {
      type: Date,
      default: Date.now,
      index: { expires: 172800 }, // auto-expire after 2 days (seconds)
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const RateLimit =
  mongoose.models.RateLimit as mongoose.Model<IRateLimit> ||
  mongoose.model<IRateLimit>("RateLimit", RateLimitSchema);
