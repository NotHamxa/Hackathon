import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/connection";
import { Post } from "@/lib/db/models";
import { authenticateRequest, isOnCooldown } from "@/lib/auth";
import { checkAndIncrementPostLimit } from "@/lib/rate-limit";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Number(searchParams.get("limit")) || DEFAULT_PAGE_SIZE)
    );
    const status = searchParams.get("status");
    const sort = searchParams.get("sort") || "recent";

    const filter: Record<string, unknown> = { status: { $ne: "deleted" } };
    if (status && ["open", "verified", "false", "disputed"].includes(status)) {
      filter.status = status;
    }

    const sortOption: Record<string, 1 | -1> =
      sort === "trust" ? { trustScore: -1 } :
      sort === "interactions" ? { interactionCount: -1 } :
      { createdAt: -1 };

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .sort(sortOption)
        .skip((page - 1) * limit)
        .limit(limit)
        .select("-posterTokenHash"),
      Post.countDocuments(filter),
    ]);

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get posts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
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

    // Extract token from header for rate limiting
    const token = req.headers.get("authorization")!.slice(7);
    const allowed = await checkAndIncrementPostLimit(token);
    if (!allowed) {
      return NextResponse.json(
        { error: "Daily post limit reached (5 posts per day)" },
        { status: 429 }
      );
    }

    const { title, content, media } = await req.json();

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    await dbConnect();

    const post = await Post.create({
      title: title.trim().slice(0, 200),
      content: content.trim().slice(0, 5000),
      media: Array.isArray(media) ? media.slice(0, 10) : [],
      posterTokenHash: auth.tokenHash,
    });

    return NextResponse.json({ post: { _id: post._id, title: post.title, status: post.status, createdAt: post.createdAt } }, { status: 201 });
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
