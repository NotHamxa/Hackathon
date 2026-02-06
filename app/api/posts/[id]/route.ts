import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/connection";
import { Post, Relation } from "@/lib/db/models";
import { authenticateRequest } from "@/lib/auth";
import { recalculateTrustScore } from "@/lib/trust-score";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();

    const post = await Post.findById(id).select("-posterTokenHash");
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Get post error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
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
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Only the original poster can delete
    if (post.posterTokenHash !== auth.tokenHash) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (post.status === "deleted") {
      return NextResponse.json({ error: "Post already deleted" }, { status: 400 });
    }

    // Tombstone protocol
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

    // Recalculate trust scores for all posts that had relations pointing TO this post
    const affectedRelations = await Relation.find({ targetPostId: id });
    const affectedPostIds = [...new Set(affectedRelations.map((r) => r.sourcePostId.toString()))];

    for (const postId of affectedPostIds) {
      await recalculateTrustScore(postId);
    }

    return NextResponse.json({ message: "Post deleted" });
  } catch (error) {
    console.error("Delete post error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
