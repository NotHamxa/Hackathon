import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/connection";
import { Post, Flag, Relation } from "@/lib/db/models";
import { authenticateRequest } from "@/lib/auth";
import { flagHash } from "@/lib/crypto";
import { recalculateTrustScore } from "@/lib/trust-score";
import { FLAG_THRESHOLD_DELETE } from "@/lib/constants";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();

    const flagCount = await Flag.countDocuments({ postId: id });

    let userFlagged = false;
    const auth = await authenticateRequest(req);
    if (auth) {
      const token = req.headers.get("authorization")!.slice(7);
      const hash = await flagHash(token, id);
      const existing = await Flag.findOne({ flagHash: hash });
      userFlagged = !!existing;
    }

    return NextResponse.json({ flagCount, userFlagged });
  } catch (error) {
    console.error("Get flag error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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

    await dbConnect();

    const post = await Post.findById(id);
    if (!post || post.status === "deleted") {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const token = req.headers.get("authorization")!.slice(7);
    const hash = await flagHash(token, id);

    // Check for duplicate flag
    const existing = await Flag.findOne({ flagHash: hash });
    if (existing) {
      return NextResponse.json({ error: "You have already flagged this post" }, { status: 409 });
    }

    // Parse optional reason
    let reason: string | undefined;
    try {
      const body = await req.json();
      if (body.reason && typeof body.reason === "string" && body.reason.trim().length <= 500) {
        reason = body.reason.trim();
      }
    } catch {
      // No body or invalid JSON — that's fine, reason is optional
    }

    await Flag.create({
      flagHash: hash,
      postId: id,
      userTokenHash: auth.tokenHash,
      ...(reason ? { reason } : {}),
    });

    const flagCount = await Flag.countDocuments({ postId: id });

    // Check if we hit the threshold — trigger tombstone protocol
    if (flagCount >= FLAG_THRESHOLD_DELETE) {
      post.title = "[deleted]";
      post.content = "[deleted]";
      post.media = [];
      post.status = "deleted";
      await post.save();

      // Sever all relations from/to this post
      await Relation.updateMany(
        { $or: [{ sourcePostId: id }, { targetPostId: id }] },
        { severed: true }
      );

      // Recalculate trust scores for affected posts
      const affectedRelations = await Relation.find({ targetPostId: id });
      const affectedPostIds = [...new Set(affectedRelations.map((r) => r.sourcePostId.toString()))];
      for (const pid of affectedPostIds) {
        await recalculateTrustScore(pid);
      }

      return NextResponse.json({ flagCount, deleted: true });
    }

    return NextResponse.json({ flagCount, deleted: false }, { status: 201 });
  } catch (error) {
    console.error("Flag error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
