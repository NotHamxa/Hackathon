import { NextRequest } from "next/server";
import { sha256 } from "@/lib/crypto";
import { dbConnect } from "@/lib/db/connection";
import { User, type IUser } from "@/lib/db/models";
import { COOLDOWN_RESET_CREDIBILITY } from "@/lib/constants";

export interface AuthResult {
  user: IUser;
  tokenHash: string;
}

export async function authenticateRequest(
  req: NextRequest
): Promise<AuthResult | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  if (!token) return null;

  const tokenHash = await sha256(token);

  await dbConnect();
  const user = await User.findOne({ tokenHash });
  if (!user) return null;

  // Auto-reset cooldown if expired
  if (user.cooldownUntil && user.cooldownUntil <= new Date()) {
    user.credibility = COOLDOWN_RESET_CREDIBILITY;
    user.cooldownUntil = null;
    await user.save();
  }

  return { user, tokenHash };
}

export function isOnCooldown(user: IUser): boolean {
  return user.cooldownUntil !== null && user.cooldownUntil > new Date();
}
