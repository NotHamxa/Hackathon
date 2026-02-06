import { dbConnect } from "@/lib/db/connection";
import { Interaction, Post, Relation } from "@/lib/db/models";
import { RELATION_BASE_SCORES, RELATION_MAX_NET_VOTES, RELATION_BONUS_CAP } from "@/lib/constants";

/**
 * Calculate the trust score for a post.
 * WeightedAgreeableness + RelationBonus
 */
export async function calculateTrustScore(postId: string): Promise<number> {
  await dbConnect();

  // 1. Weighted agreeableness from interactions
  const interactions = await Interaction.find({ postId });

  let weightedSum = 0;
  let totalWeight = 0;

  for (const interaction of interactions) {
    const weight = Math.log2(1 + interaction.credibilitySnapshot);
    if (weight <= 0) continue; // skip users with zero/negative credibility snapshot
    weightedSum += interaction.rating * weight;
    totalWeight += weight;
  }

  const weightedAgreeableness = totalWeight > 0 ? weightedSum / totalWeight : 0;

  // 2. Relation bonus
  const relations = await Relation.find({ sourcePostId: postId, severed: false });

  let relationBonus = 0;

  for (const rel of relations) {
    const netVotes = rel.upvotes - rel.downvotes;
    if (netVotes <= 0) continue;

    const linkedPost = await Post.findById(rel.targetPostId);
    if (!linkedPost || linkedPost.status === "deleted") continue;

    const base = RELATION_BASE_SCORES[linkedPost.status] ?? 0;
    const score = base * Math.min(netVotes, RELATION_MAX_NET_VOTES) / RELATION_MAX_NET_VOTES;
    relationBonus += score;
  }

  relationBonus = Math.min(relationBonus, RELATION_BONUS_CAP);

  return weightedAgreeableness + relationBonus;
}

/** Calculate and persist the trust score for a post */
export async function recalculateTrustScore(postId: string): Promise<number> {
  const score = await calculateTrustScore(postId);
  await Post.findByIdAndUpdate(postId, { trustScore: score });
  return score;
}
