import { dbConnect } from "@/lib/db/connection";
import { Interaction, Post, User } from "@/lib/db/models";
import type { PostStatus } from "@/lib/db/models";
import {
  SETTLEMENT_VERIFIED,
  SETTLEMENT_FALSE,
  SETTLEMENT_DISPUTED,
  POSTER_VERIFIED,
  POSTER_FALSE,
  POSTER_DISPUTED,
  COOLDOWN_DAYS,
  COOLDOWN_RESET_CREDIBILITY,
} from "@/lib/constants";

function getSettlementTable(verdict: PostStatus) {
  switch (verdict) {
    case "verified":
      return SETTLEMENT_VERIFIED;
    case "false":
      return SETTLEMENT_FALSE;
    case "disputed":
      return SETTLEMENT_DISPUTED;
    default:
      return null;
  }
}

function getPosterDelta(verdict: PostStatus): number {
  switch (verdict) {
    case "verified":
      return POSTER_VERIFIED;
    case "false":
      return POSTER_FALSE;
    case "disputed":
      return POSTER_DISPUTED;
    default:
      return 0;
  }
}

/**
 * Apply credibility settlement to all interactors + poster after evaluation.
 */
export async function settleCredibility(
  postId: string,
  verdict: PostStatus
): Promise<void> {
  await dbConnect();

  const table = getSettlementTable(verdict);
  if (!table) return;

  const post = await Post.findById(postId);
  if (!post) return;

  // Settle interactors
  const interactions = await Interaction.find({ postId });

  for (const interaction of interactions) {
    const delta = table[interaction.rating] ?? 0;
    if (delta === 0) continue;

    const user = await User.findOne({ tokenHash: interaction.userTokenHash });
    if (!user) continue;

    user.credibility += delta;
    await applyCooldownIfNeeded(user);
    await user.save();
  }

  // Settle poster
  const posterDelta = getPosterDelta(verdict);
  if (posterDelta !== 0) {
    const poster = await User.findOne({ tokenHash: post.posterTokenHash });
    if (poster) {
      poster.credibility += posterDelta;
      await applyCooldownIfNeeded(poster);
      await poster.save();
    }
  }
}

async function applyCooldownIfNeeded(user: InstanceType<typeof User>): Promise<void> {
  if (user.credibility <= 0) {
    user.cooldownUntil = new Date(Date.now() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
  }
}

/**
 * Check if a user's cooldown has expired and reset their credibility.
 */
export async function checkAndResetCooldown(tokenHash: string): Promise<void> {
  await dbConnect();
  const user = await User.findOne({ tokenHash });
  if (!user || !user.cooldownUntil) return;

  if (user.cooldownUntil <= new Date()) {
    user.credibility = COOLDOWN_RESET_CREDIBILITY;
    user.cooldownUntil = null;
    await user.save();
  }
}
