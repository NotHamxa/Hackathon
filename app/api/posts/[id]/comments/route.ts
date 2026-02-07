import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/connection";
import { Interaction } from "@/lib/db/models";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();

    const comments = await Interaction.find({
      postId: id,
      comment: { $exists: true, $ne: "" },
    })
      .select("rating comment createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Get comments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
