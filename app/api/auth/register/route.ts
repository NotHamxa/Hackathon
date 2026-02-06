import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/connection";
import { User, VerificationCode } from "@/lib/db/models";
import { sha256, generateVerificationCode } from "@/lib/crypto";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalized = email.trim().toLowerCase();

    if (!normalized.endsWith("nust.edu.pk") && !normalized.endsWith("seecs.edu.pk")) {
      return NextResponse.json(
        { error: "Only .edu email addresses are allowed" },
        { status: 400 }
      );
    }

    await dbConnect();

    const emailHash = await sha256(normalized);

    // Check if already registered
    const existingUser = await User.findOne({ emailHash });
    if (existingUser) {
      return NextResponse.json(
        { error: "This email has already been registered" },
        { status: 409 }
      );
    }

    // Delete any existing verification codes for this email
    await VerificationCode.deleteMany({ emailHash });

    // Generate and store verification code
    const code = generateVerificationCode();
    await VerificationCode.create({ emailHash, code });

    // Send the email
    await sendVerificationEmail(normalized, code);

    return NextResponse.json({ message: "Verification code sent" });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
