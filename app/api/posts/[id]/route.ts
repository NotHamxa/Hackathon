import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/connection";
import { Post, Flag } from "@/lib/db/models";

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

    const flagCount = await Flag.countDocuments({ postId: id });

    return NextResponse.json({
      post: { ...post.toObject(), flagCount },
    });
  } catch (error) {
    console.error("Get post error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
