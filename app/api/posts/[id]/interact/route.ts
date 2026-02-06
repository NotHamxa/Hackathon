import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/connection";
import { Interaction, Post } from "@/lib/db/models";
import { authenticateRequest, isOnCooldown } from "@/lib/auth";
import { interactionHash } from "@/lib/crypto";
import { recalculateTrustScore } from "@/lib/trust-score";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await authenticateRequest(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isOnCooldown(auth.user)) {
      return NextResponse.json(
        { error: "You are on cooldown", cooldownUntil: auth.user.cooldownUntil },
        { status: 403 }
      );
    }

    const { rating } = await req.json();

    if (!rating || typeof rating !== "number" || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json({ error: "Rating must be an integer from 1 to 5" }, { status: 400 });
    }

    await dbConnect();

    const post = await Post.findById(id);
    if (!post || post.status === "deleted") {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.status !== "open") {
      return NextResponse.json({ error: "Post has already been evaluated" }, { status: 400 });
    }

    // Generate deduplication hash
    const token = req.headers.get("authorization")!.slice(7);
    const hash = await interactionHash(token, id);

    // Check for duplicate
    const existing = await Interaction.findOne({ interactionHash: hash });
    if (existing) {
      return NextResponse.json({ error: "You have already rated this post" }, { status: 409 });
    }

    // Create interaction
    await Interaction.create({
      interactionHash: hash,
      postId: id,
      userTokenHash: auth.tokenHash,
      rating,
      credibilitySnapshot: auth.user.credibility,
    });

    // Update interaction count
    post.interactionCount += 1;
    await post.save();

    // Recalculate trust score
    const newScore = await recalculateTrustScore(id);

    return NextResponse.json({
      message: "Rating recorded",
      trustScore: newScore,
      interactionCount: post.interactionCount,
    }, { status: 201 });
  } catch (error) {
    console.error("Interact error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
