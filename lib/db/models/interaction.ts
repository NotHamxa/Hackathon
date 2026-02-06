import mongoose, { Schema, type Document } from "mongoose";

export interface IInteraction extends Document {
  interactionHash: string;
  postId: mongoose.Types.ObjectId;
  userTokenHash: string;
  rating: number;
  credibilitySnapshot: number;
  createdAt: Date;
}

const InteractionSchema = new Schema<IInteraction>(
  {
    interactionHash: { type: String, required: true, unique: true },
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true, index: true },
    userTokenHash: { type: String, required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    credibilitySnapshot: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Interaction =
  mongoose.models.Interaction as mongoose.Model<IInteraction> ||
  mongoose.model<IInteraction>("Interaction", InteractionSchema);
