# VeriCampus

**Anonymous, Decentralized Campus Rumor Verification**

*No admins. No identities. Just math and collective judgment.*

---

## What Is VeriCampus?

VeriCampus is a platform where university students can anonymously share and verify campus rumors and news. There is no central authority deciding what is true — instead, the student community collectively determines the credibility of every post through a novel trust scoring system backed by user credibility tracking.

The system is designed to solve a fundamental problem: how do you determine truth in an anonymous environment where anyone can say anything, without giving any single person or algorithm the final word?

---

## The Problem

University campuses are full of informal information — event changes, policy rumors, safety alerts, social news — that spreads through word of mouth, group chats, and social media. But this information is:

- **Unverified** — no way to know if a rumor is true without asking around
- **Non-anonymous** — students may hesitate to share or challenge information publicly
- **Easily manipulated** — a popular false claim can drown out corrections
- **Ephemeral** — important information gets lost in chat scrollback

Existing platforms either require identity (killing anonymity), rely on moderators (creating a central authority), or treat all content equally (letting misinformation thrive).

---

## Our Solution

VeriCampus introduces three interlocking mechanisms that together create a self-regulating truth ecosystem:

### 1. Anonymous Identity Without Stored Identity

Students verify their enrollment through a .edu email exactly once. The system generates a random identity token, sends it to the student, and then permanently deletes the connection between the email and the token. The server stores only cryptographic hashes — it is mathematically impossible to trace any action back to a real person.

Every action (posting, voting) uses this token. The system verifies legitimacy through hash comparison without ever knowing who the user is.

### 2. Credibility-Weighted Trust Scoring

Every user carries a credibility score that starts at 10 and evolves over time based on the accuracy of their judgments. When users interact with a post, they rate its truthfulness on a scale of 1 to 5. Each rating is weighted by the rater's credibility — a user who has a long track record of accurate judgment carries significantly more influence than a new or frequently wrong user.

This means a small group of experienced, accurate users can outweigh a larger mob of unreliable ones. Truth is not determined by popularity but by the weighted consensus of those who have demonstrated good judgment.

### 3. Timed Evaluation with Settlement

Posts are not judged instantly. Each post remains open for a minimum of 2 weeks and requires at least 50 unique interactions before evaluation. This dual-gate prevents both snap judgments on viral content and premature verdicts on under-seen posts.

When a post is evaluated, every participant's credibility score is updated based on how their rating aligned with the final verdict. Accurate, confident judgments are rewarded. Confident but wrong judgments are penalized. This creates a long-term incentive to be honest and thoughtful rather than reactive.

### 4. Post Relations — Community-Curated Evidence Links

Posts do not exist in isolation. Any user can link an existing post as a relation to another post — claiming it supports or provides context for the claim. But linking alone doesn't grant credibility. Other users can then **upvote or downvote** each linked relation, expressing whether they agree the link is relevant and supportive.

A relation that the community upvotes contributes positively to the post's trust score. A relation that gets downvoted is considered irrelevant or misleading and contributes nothing. This means the crowd curates not just whether a post is true, but whether the evidence linked to it actually matters.

This creates a critical problem: **what happens when a linked post is later deleted?** If a relation was boosting a post's score and the linked post disappears, the score is now inflated by a ghost — a reference that no longer exists. VeriCampus solves this with a **tombstone protocol**. When a post is deleted, all relations pointing to it are severed, and every post that benefited from that link has its trust score immediately recalculated. No ghost data persists.

---

## How It Works

### User Registration

1. Student enters their university .edu email
2. A verification code is sent to the email
3. Upon verification, a random 256-bit identity token is generated
4. The server stores `SHA-256(token)` and `SHA-256(email)` separately
5. The mapping between them is permanently deleted
6. The token is sent to the student once — this is their only key to the system

### Posting a Rumor

1. Student submits a title, content, and optional media
2. The server verifies their token and checks they are not on cooldown
3. A unique post ID is generated
4. The post enters the feed with status "open" and a trust score of 0
5. The poster's current credibility is recorded with the post

### Linking Relations to a Post

Any user can link an existing post as a relation to another post — claiming it provides supporting evidence or context. This is separate from creating or interacting with a post.

1. User submits a relation: the source post ID and the target post ID
2. The system generates a relation ID from `SHA-256(token + source_post_id + target_post_id)` — one link per user per pair
3. If the relation doesn't already exist between these two posts, it is created with an initial vote score of 0
4. If the relation already exists (another user linked the same pair), the user's action counts as an upvote
5. Other users can then **upvote** (this link is relevant) or **downvote** (this link is irrelevant/misleading) the relation
6. Each user gets one vote per relation, deduplicated via `SHA-256(token + relation_id)`
7. The relation's net vote score (upvotes − downvotes) determines how much it contributes to the post's trust score

### Interacting with a Post

1. Student selects a credibility rating from 1 (completely false) to 5 (completely true)
2. The system generates a unique interaction ID from `SHA-256(token + post_id)`
3. This ensures exactly one interaction per user per post — duplicates are rejected
4. The user's current credibility score is snapshotted with their interaction
5. The post's trust score is recalculated as a credibility-weighted average

### Trust Score Formula

```
For each interaction i:
  weight(i) = log₂(1 + credibility(i))

WeightedAgreeableness = Σ( agreeableness(i) × weight(i) ) / Σ( weight(i) )
```

The logarithmic weighting ensures that high-credibility users have meaningful influence without any single user being able to dominate.

**Relation Bonus:**

Each linked relation contributes to the trust score based on its community vote and the linked post's status:

```
For each relation r linked to this post:
  If linked post is "deleted" → skip (severed)
  
  net_votes(r) = upvotes - downvotes
  
  If net_votes(r) <= 0 → skip (community rejected this link)
  
  base = 0.0
  If linked post status is "verified"  → base = 0.3
  If linked post status is "open"      → base = 0.1
  If linked post status is "disputed"  → base = 0.05
  If linked post status is "false"     → base = -0.1
  
  relation_score(r) = base × min(net_votes(r), 10) / 10

RelationBonus = Σ( relation_score(r) ), capped at +1.0
```

This means a relation that links to a verified post and has strong community approval contributes up to +0.3. A relation linking to a post marked false actually hurts the score. And any relation the community downvotes is ignored entirely.

```
TrustScore = WeightedAgreeableness + RelationBonus
```

### Post Evaluation

A post becomes eligible for evaluation when both conditions are met:

- At least **2 weeks** have passed since creation
- At least **50 unique users** have interacted with it

If 3 weeks pass without reaching 50 interactions, the post is force-evaluated as "disputed" due to insufficient participation.

Upon evaluation, the post receives a final verdict:

| Trust Score | Verdict |
|:---:|---|
| ≥ 4.0 | **Verified** — community consensus is that this is true |
| ≤ 2.0 | **False** — community consensus is that this is false |
| 2.0 – 4.0 | **Disputed** — no clear consensus reached |

### Credibility Settlement

After evaluation, every user who interacted with the post has their credibility updated:

**If the post was Verified:**

| User's Rating | Credibility Change |
|:---:|:---:|
| 5 (completely true) | +3.0 |
| 4 (probably true) | +2.0 |
| 3 (uncertain) | +0.0 |
| 2 (probably false) | −2.0 |
| 1 (completely false) | −4.0 |

**If the post was False:**

| User's Rating | Credibility Change |
|:---:|:---:|
| 1 (completely false) | +3.0 |
| 2 (probably false) | +2.0 |
| 3 (uncertain) | +0.0 |
| 4 (probably true) | −2.0 |
| 5 (completely true) | −4.0 |

**If the post was Disputed:**

| User's Rating | Credibility Change |
|:---:|:---:|
| 3 (uncertain) | +1.0 |
| 2 or 4 | +0.0 |
| 1 or 5 | −1.0 |

The original poster also receives a credibility adjustment: +4.0 if verified, −5.0 if false, and no change if disputed.

### Cooldown System

If a user's credibility drops to 0 or below, they are placed on a 7-day cooldown during which they cannot post or interact. After the cooldown expires, their credibility resets to 5.0 (half of the starting value). Repeat offenders start weaker each time, naturally marginalizing persistent bad actors without permanent bans.

### Post Deletion & The Ghost Post Problem

When a post is deleted, a naive approach would simply remove the row from the database. But this creates a subtle and dangerous bug: any post that has a relation linking to the deleted post still carries a bonus from a post that no longer exists. The deleted post becomes a "ghost" — invisible but still inflating scores.

VeriCampus solves this with a **tombstone protocol**:

1. The original poster requests deletion (verified via `SHA-256(token) == poster_hash`)
2. The post's content is cleared and its status is set to "deleted"
3. All relations pointing to or from the deleted post are severed
4. Every post that had a relation linking to the deleted post has its trust score **immediately recalculated** — the relation bonus is removed
5. The deleted post's tombstone remains in the database to prevent re-insertion of identical content
6. The deleted post is excluded from future evaluation — all interactions on it are voided with no credibility reward or penalty
7. All upvotes/downvotes on the severed relations are discarded

This ensures the trust graph stays clean. Deletion doesn't just hide content — it actively corrects every score that was influenced by the now-removed post.

---

## Security & Anti-Gaming

| Threat | How VeriCampus Handles It |
|--------|--------------------------|
| **Fake accounts** | Only verified .edu emails can register. No email, no token. |
| **Double voting** | `SHA-256(token + post_id)` produces the same hash every time — duplicates are rejected at the database level. |
| **Identity tracing** | The email-to-token link is deleted at registration. The server only stores hashes. There is no way to reverse a hash to find the user. |
| **Spam** | Rate limiting via `SHA-256(token + date)` caps daily posts. Low-credibility users have minimal influence on scores. |
| **Coordinated manipulation** | Each attacker gets exactly one vote per post. Wrong votes drain credibility. After enough wrong calls, attackers hit cooldown and are locked out. |
| **Popular lies winning** | Trust scores are weighted by credibility, not raw vote count. A smaller group of high-credibility users outweighs a larger group of low-credibility ones. |
| **Bot accounts** | Bots that vote inaccurately lose credibility rapidly, entering repeated cooldown cycles that effectively remove them from the system. |
| **Ghost posts inflating scores** | Tombstone protocol severs all relations from deleted posts and immediately recalculates every affected trust score. No ghost data persists. |

---