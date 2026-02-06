import mongoose, { Schema, type Document } from "mongoose";

export interface IRelation extends Document {
  sourcePostId: mongoose.Types.ObjectId;
  targetPostId: mongoose.Types.ObjectId;
  creatorTokenHash: string;
  upvotes: number;
  downvotes: number;
  severed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RelationSchema = new Schema<IRelation>(
  {
    sourcePostId: { type: Schema.Types.ObjectId, ref: "Post", required: true, index: true },
    targetPostId: { type: Schema.Types.ObjectId, ref: "Post", required: true, index: true },
    creatorTokenHash: { type: String, required: true },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    severed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One unique relation per source–target pair
RelationSchema.index({ sourcePostId: 1, targetPostId: 1 }, { unique: true });

export const Relation =
  mongoose.models.Relation as mongoose.Model<IRelation> ||
  mongoose.model<IRelation>("Relation", RelationSchema);
