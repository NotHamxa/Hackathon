import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/connection";
import { Relation, RelationVote } from "@/lib/db/models";
import { authenticateRequest, isOnCooldown } from "@/lib/auth";
import { relationVoteHash } from "@/lib/crypto";
import { recalculateTrustScore } from "@/lib/trust-score";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: relationId } = await params;
    const auth = await authenticateRequest(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isOnCooldown(auth.user)) {
      return NextResponse.json({ error: "You are on cooldown" }, { status: 403 });
    }

    const { vote } = await req.json();

    if (!vote || !["up", "down"].includes(vote)) {
      return NextResponse.json({ error: "Vote must be 'up' or 'down'" }, { status: 400 });
    }

    await dbConnect();

    const relation = await Relation.findById(relationId);
    if (!relation || relation.severed) {
      return NextResponse.json({ error: "Relation not found" }, { status: 404 });
    }

    // Deduplicate via hash
    const token = req.headers.get("authorization")!.slice(7);
    const hash = await relationVoteHash(token, relationId);

    const existingVote = await RelationVote.findOne({ voteHash: hash });
    if (existingVote) {
      return NextResponse.json({ error: "You have already voted on this relation" }, { status: 409 });
    }

    // Record vote
    await RelationVote.create({ voteHash: hash, relationId, vote });

    // Update relation counts
    if (vote === "up") {
      relation.upvotes += 1;
    } else {
      relation.downvotes += 1;
    }
    await relation.save();

    // Recalculate trust score of the source post
    await recalculateTrustScore(relation.sourcePostId.toString());

    return NextResponse.json({
      message: "Vote recorded",
      upvotes: relation.upvotes,
      downvotes: relation.downvotes,
    }, { status: 201 });
  } catch (error) {
    console.error("Relation vote error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
