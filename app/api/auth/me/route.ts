import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, isOnCooldown } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    credibility: auth.user.credibility,
    isOnCooldown: isOnCooldown(auth.user),
    cooldownUntil: auth.user.cooldownUntil,
    createdAt: auth.user.createdAt,
  });
}
