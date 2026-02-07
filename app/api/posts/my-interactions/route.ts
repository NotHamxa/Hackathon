import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/connection";
import { Interaction } from "@/lib/db/models";
import { authenticateRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const postIds = req.nextUrl.searchParams.get("postIds");
    if (!postIds) {
      return NextResponse.json({ interactions: {} });
    }

    const ids = postIds.split(",").filter(Boolean);
    if (ids.length === 0) {
      return NextResponse.json({ interactions: {} });
    }

    await dbConnect();

    const interactions = await Interaction.find({
      userTokenHash: auth.tokenHash,
      postId: { $in: ids },
    }).select("postId rating").lean();

    const map: Record<string, number> = {};
    for (const ix of interactions) {
      map[ix.postId.toString()] = ix.rating;
    }

    return NextResponse.json({ interactions: map });
  } catch (error) {
    console.error("My interactions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
