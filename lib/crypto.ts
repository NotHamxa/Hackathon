import { webcrypto } from "node:crypto";

const subtle = webcrypto.subtle;

export async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await subtle.digest("SHA-256", data);
  return Buffer.from(hash).toString("hex");
}

/** Generate a 256-bit (32-byte) hex token */
export function generateToken(): string {
  const bytes = new Uint8Array(32);
  webcrypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("hex");
}

/** Generate a 6-digit numeric verification code */
export function generateVerificationCode(): string {
  const bytes = new Uint8Array(4);
  webcrypto.getRandomValues(bytes);
  const num = new DataView(bytes.buffer).getUint32(0) % 900000 + 100000;
  return num.toString();
}

/** SHA-256(token + postId) — one interaction per user per post */
export async function interactionHash(token: string, postId: string): Promise<string> {
  return sha256(token + postId);
}

/** SHA-256(token + relationId) — one vote per user per relation */
export async function relationVoteHash(token: string, relationId: string): Promise<string> {
  return sha256(token + relationId);
}

/** SHA-256(token + YYYY-MM-DD) — daily rate-limit bucket */
export async function dailyRateLimitHash(token: string): Promise<string> {
  const today = new Date().toISOString().slice(0, 10);
  return sha256(token + today);
}
