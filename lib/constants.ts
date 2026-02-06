
// ── Credibility ──────────────────────────────────────────────
export const INITIAL_CREDIBILITY = 10;
export const COOLDOWN_RESET_CREDIBILITY = 5;
export const COOLDOWN_DAYS = 7;

// ── Evaluation gates ─────────────────────────────────────────
export const EVAL_MIN_AGE_MS = 14 * 24 * 60 * 60 * 1000; // 2 weeks
export const EVAL_MIN_INTERACTIONS = 50;
export const EVAL_FORCE_AGE_MS = 21 * 24 * 60 * 60 * 1000; // 3 weeks

// ── Trust score thresholds ───────────────────────────────────
export const SCORE_VERIFIED = 4.0;
export const SCORE_FALSE = 2.0;

// ── Settlement tables ────────────────────────────────────────
// Rating → credibility delta when the post is Verified
export const SETTLEMENT_VERIFIED: Record<number, number> = {
  5: +3.0,
  4: +2.0,
  3: 0.0,
  2: -2.0,
  1: -4.0,
};

// Rating → credibility delta when the post is False
export const SETTLEMENT_FALSE: Record<number, number> = {
  1: +3.0,
  2: +2.0,
  3: 0.0,
  4: -2.0,
  5: -4.0,
};

// Rating → credibility delta when the post is Disputed
export const SETTLEMENT_DISPUTED: Record<number, number> = {
  3: +1.0,
  2: 0.0,
  4: 0.0,
  1: -1.0,
  5: -1.0,
};

// Poster credibility adjustments
export const POSTER_VERIFIED = +4.0;
export const POSTER_FALSE = -5.0;
export const POSTER_DISPUTED = 0.0;

// ── Relation bonus ───────────────────────────────────────────
export const RELATION_BASE_SCORES: Record<string, number> = {
  verified: 0.3,
  open: 0.1,
  disputed: 0.05,
  false: -0.1,
};
export const RELATION_MAX_NET_VOTES = 10;
export const RELATION_BONUS_CAP = 1.0;

// ── Rate limits ──────────────────────────────────────────────
export const MAX_POSTS_PER_DAY = 5;

// ── Verification codes ───────────────────────────────────────
export const VERIFICATION_CODE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
export const VERIFICATION_MAX_ATTEMPTS = 5;

// ── Pagination ───────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
