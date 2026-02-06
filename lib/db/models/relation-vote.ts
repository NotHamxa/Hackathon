import mongoose, { Schema, type Document } from "mongoose";

export type VoteDirection = "up" | "down";

export interface IRelationVote extends Document {
  voteHash: string;
  relationId: mongoose.Types.ObjectId;
  vote: VoteDirection;
  createdAt: Date;
}

const RelationVoteSchema = new Schema<IRelationVote>(
  {
    voteHash: { type: String, required: true, unique: true },
    relationId: { type: Schema.Types.ObjectId, ref: "Relation", required: true, index: true },
    vote: { type: String, enum: ["up", "down"], required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const RelationVote =
  mongoose.models.RelationVote as mongoose.Model<IRelationVote> ||
  mongoose.model<IRelationVote>("RelationVote", RelationVoteSchema);
