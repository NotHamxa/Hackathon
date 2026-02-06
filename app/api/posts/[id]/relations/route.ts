import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/connection";
import { Post, Relation } from "@/lib/db/models";
import { authenticateRequest, isOnCooldown } from "@/lib/auth";
import { recalculateTrustScore } from "@/lib/trust-score";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();

    const relations = await Relation.find({ sourcePostId: id, severed: false })
      .populate("targetPostId", "title status trustScore");

    return NextResponse.json({ relations });
  } catch (error) {
    console.error("Get relations error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sourcePostId } = await params;
    const auth = await authenticateRequest(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isOnCooldown(auth.user)) {
      return NextResponse.json(
        { error: "You are on cooldown" },
        { status: 403 }
      );
    }

    const { targetPostId } = await req.json();

    if (!targetPostId) {
      return NextResponse.json({ error: "targetPostId is required" }, { status: 400 });
    }

    if (sourcePostId === targetPostId) {
      return NextResponse.json({ error: "A post cannot be linked to itself" }, { status: 400 });
    }

    await dbConnect();

    // Verify both posts exist and aren't deleted
    const [source, target] = await Promise.all([
      Post.findById(sourcePostId),
      Post.findById(targetPostId),
    ]);

    if (!source || source.status === "deleted") {
      return NextResponse.json({ error: "Source post not found" }, { status: 404 });
    }
    if (!target || target.status === "deleted") {
      return NextResponse.json({ error: "Target post not found" }, { status: 404 });
    }

    // Check if relation already exists
    const existing = await Relation.findOne({ sourcePostId, targetPostId });

    if (existing) {
      // Treat as upvote
      existing.upvotes += 1;
      await existing.save();
      await recalculateTrustScore(sourcePostId);
      return NextResponse.json({ message: "Relation upvoted", relation: existing });
    }

    // Create new relation
    const relation = await Relation.create({
      sourcePostId,
      targetPostId,
      creatorTokenHash: auth.tokenHash,
    });

    await recalculateTrustScore(sourcePostId);

    return NextResponse.json({ message: "Relation created", relation }, { status: 201 });
  } catch (error) {
    console.error("Create relation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
