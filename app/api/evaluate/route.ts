import { NextResponse } from "next/server";
import { evaluatePosts } from "@/lib/evaluation";

export async function POST() {
  try {
    const count = await evaluatePosts();
    return NextResponse.json({ message: `Evaluated ${count} post(s)`, count });
  } catch (error) {
    console.error("Evaluate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
