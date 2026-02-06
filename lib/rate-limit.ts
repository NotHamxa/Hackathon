import { dbConnect } from "@/lib/db/connection";
import { RateLimit } from "@/lib/db/models";
import { dailyRateLimitHash } from "@/lib/crypto";
import { MAX_POSTS_PER_DAY } from "@/lib/constants";

/**
 * Check and increment the daily post limit for a token.
 * Returns true if the user is allowed to post; false if rate-limited.
 */
export async function checkAndIncrementPostLimit(token: string): Promise<boolean> {
  await dbConnect();
  const hash = await dailyRateLimitHash(token);

  const doc = await RateLimit.findOneAndUpdate(
    { dailyHash: hash },
    { $inc: { postCount: 1 }, $setOnInsert: { dailyHash: hash } },
    { upsert: true, new: true }
  );

  if (doc.postCount > MAX_POSTS_PER_DAY) {
    // Rollback the increment
    await RateLimit.updateOne({ dailyHash: hash }, { $inc: { postCount: -1 } });
    return false;
  }

  return true;
}
