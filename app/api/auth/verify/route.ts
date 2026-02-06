import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/connection";
import { User, VerificationCode } from "@/lib/db/models";
import { sha256, generateToken } from "@/lib/crypto";
import { VERIFICATION_MAX_ATTEMPTS } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
    }

    const normalized = email.trim().toLowerCase();
    const emailHash = await sha256(normalized);

    await dbConnect();

    const verification = await VerificationCode.findOne({ emailHash });
    if (!verification) {
      return NextResponse.json(
        { error: "No verification code found. Please request a new one." },
        { status: 404 }
      );
    }

    // Check expiry
    if (verification.expiresAt < new Date()) {
      await verification.deleteOne();
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new one." },
        { status: 410 }
      );
    }

    // Check attempts
    if (verification.attempts >= VERIFICATION_MAX_ATTEMPTS) {
      await verification.deleteOne();
      return NextResponse.json(
        { error: "Too many attempts. Please request a new code." },
        { status: 429 }
      );
    }

    // Increment attempts
    verification.attempts += 1;
    await verification.save();

    // Check code
    if (verification.code !== code.trim()) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Code is valid — create user
    const token = generateToken();
    const tokenHash = await sha256(token);

    await User.create({ tokenHash, emailHash });

    // Delete verification code
    await verification.deleteOne();

    // Return the token ONCE — never stored in plaintext
    return NextResponse.json({
      token,
      message: "Registration successful. Save this token — it cannot be recovered.",
    });
  } catch (error) {
    console.error("Verify error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
