import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const SESSION_COOKIE = "sv_session";
export const SESSION_TTL_SECONDS = 8 * 60 * 60; // 8 hours

// Derived from ADMIN_PASSWORD so no extra secret has to be configured.
function getSecret(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return createHmac("sha256", password).update("sneakervault-admin-session/v1").digest("base64");
}

function sign(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

// There is deliberately no default password: if ADMIN_PASSWORD is unset the
// admin panel cannot be logged into at all.
export function hasAdminPassword(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

export function verifyAdminPassword(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const a = Buffer.from(candidate, "utf8");
  const b = Buffer.from(expected, "utf8");
  // Compare equal-length buffers regardless so a wrong-length guess does not
  // return noticeably faster than a wrong guess of the right length.
  if (a.length !== b.length) {
    timingSafeEqual(b, b);
    return false;
  }
  return timingSafeEqual(a, b);
}

export function createSessionToken(): string | null {
  const secret = getSecret();
  if (!secret) return null;
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  const payload = `${expiresAt}.${randomBytes(8).toString("hex")}`;
  return `${payload}.${sign(secret, payload)}`;
}

export function isValidSessionToken(token: string | null | undefined): boolean {
  if (!token) return false;
  const secret = getSecret();
  if (!secret) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [expiresAt, nonce, signature] = parts;
  if (!/^\d+$/.test(expiresAt) || !nonce) return false;
  if (Date.now() > Number(expiresAt)) return false;

  const expected = sign(secret, `${expiresAt}.${nonce}`);
  const a = Buffer.from(signature, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

export function isAuthenticated(request: NextRequest): boolean {
  return isValidSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
}

// Returns a 401 response when the caller is not signed in, or null when they
// are. Call from a mutating route handler: `const denied = requireAdmin(req);
// if (denied) return denied;`
export function requireAdmin(request: NextRequest): NextResponse | null {
  if (isAuthenticated(request)) return null;
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// ─── Rate limiting ───────────────────────────────────────────────────────────
// Per-instance and therefore best-effort on serverless, but it stops the
// obvious online brute force of the admin password.

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const buckets = new Map<string, { count: number; resetAt: number }>();

export function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

export function isRateLimited(key: string): boolean {
  const now = Date.now();
  if (buckets.size > 1000) pruneBuckets(now);
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > MAX_ATTEMPTS;
}

function pruneBuckets(now: number): void {
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
}
