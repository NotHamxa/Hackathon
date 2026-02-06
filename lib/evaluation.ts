import { dbConnect } from "@/lib/db/connection";
import { Post } from "@/lib/db/models";
import type { PostStatus } from "@/lib/db/models";
import {
  EVAL_MIN_AGE_MS,
  EVAL_MIN_INTERACTIONS,
  EVAL_FORCE_AGE_MS,
  SCORE_VERIFIED,
  SCORE_FALSE,
} from "@/lib/constants";
import { recalculateTrustScore } from "@/lib/trust-score";
import { settleCredibility } from "@/lib/credibility";

function determineVerdict(trustScore: number): PostStatus {
  if (trustScore >= SCORE_VERIFIED) return "verified";
  if (trustScore <= SCORE_FALSE) return "false";
  return "disputed";
}

/**
 * Evaluate all eligible open posts.
 * Returns the number of posts evaluated.
 */
export async function evaluatePosts(): Promise<number> {
  await dbConnect();

  const now = Date.now();
  const minAgeDate = new Date(now - EVAL_MIN_AGE_MS);
  const forceDate = new Date(now - EVAL_FORCE_AGE_MS);

  // Find posts eligible for evaluation
  const eligiblePosts = await Post.find({
    status: "open",
    $or: [
      // Normal evaluation: 2 weeks old + 50 interactions
      { createdAt: { $lte: minAgeDate }, interactionCount: { $gte: EVAL_MIN_INTERACTIONS } },
      // Force evaluation: 3 weeks old (becomes disputed)
      { createdAt: { $lte: forceDate } },
    ],
  });

  let evaluated = 0;

  for (const post of eligiblePosts) {
    const age = now - post.createdAt.getTime();
    const isForceEval = age >= EVAL_FORCE_AGE_MS && post.interactionCount < EVAL_MIN_INTERACTIONS;

    let verdict: PostStatus;

    if (isForceEval) {
      verdict = "disputed";
    } else {
      const score = await recalculateTrustScore(post._id.toString());
      verdict = determineVerdict(score);
    }

    post.status = verdict;
    post.evaluatedAt = new Date();
    await post.save();

    await settleCredibility(post._id.toString(), verdict);
    evaluated++;
  }

  return evaluated;
}
