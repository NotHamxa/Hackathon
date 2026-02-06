import mongoose, { Schema, type Document } from "mongoose";

export type PostStatus = "open" | "verified" | "false" | "disputed" | "deleted";

export interface IPost extends Document {
  title: string;
  content: string;
  media: string[];
  status: PostStatus;
  posterTokenHash: string;
  trustScore: number;
  interactionCount: number;
  evaluatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    title: { type: String, required: true, maxlength: 200 },
    content: { type: String, required: true, maxlength: 5000 },
    media: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["open", "verified", "false", "disputed", "deleted"],
      default: "open",
      index: true,
    },
    posterTokenHash: { type: String, required: true, index: true },
    trustScore: { type: Number, default: 0 },
    interactionCount: { type: Number, default: 0 },
    evaluatedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Post = mongoose.models.Post as mongoose.Model<IPost> || mongoose.model<IPost>("Post", PostSchema);
