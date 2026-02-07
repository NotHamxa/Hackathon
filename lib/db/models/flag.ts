import mongoose, { Schema, type Document } from "mongoose";

export interface IFlag extends Document {
  flagHash: string;
  postId: mongoose.Types.ObjectId;
  userTokenHash: string;
  reason?: string;
  createdAt: Date;
}

const FlagSchema = new Schema<IFlag>(
  {
    flagHash: { type: String, required: true, unique: true },
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true, index: true },
    userTokenHash: { type: String, required: true, index: true },
    reason: { type: String, maxlength: 500, default: undefined },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Flag =
  mongoose.models.Flag as mongoose.Model<IFlag> ||
  mongoose.model<IFlag>("Flag", FlagSchema);
