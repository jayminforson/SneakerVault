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

// No maxAge: this is a browser session cookie, so closing the browser ends
// the admin session. The token itself still expires after SESSION_TTL_SECONDS.
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
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

// ─── Lockout ─────────────────────────────────────────────────────────────────
// Three wrong passwords inside the window block that client for a full day.
// Counting is keyed on client IP (there is one shared password, so the IP is
// the only identity the server has) and persisted in Postgres, so a cold start
// or redeploy never quietly resets somebody's lockout.

export const MAX_FAILED_ATTEMPTS = 3;
export const ATTEMPT_WINDOW_MS = 24 * 60 * 60 * 1000;
export const LOCKOUT_MS = 24 * 60 * 60 * 1000;

export function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

export function isLockedOut(lockedUntil: Date | string | null | undefined): boolean {
  if (!lockedUntil) return false;
  const until = new Date(lockedUntil).getTime();
  return Number.isFinite(until) && until > Date.now();
}

// No timestamp here: the login page renders the exact expiry itself in the
// visitor's own timezone from the lockedUntil value in the response body.
export function lockoutMessage(): string {
  return "Too many wrong passwords. Admin access is blocked for 24 hours.";
}

export function attemptsRemainingMessage(remaining: number): string {
  return `Wrong password. ${remaining} attempt${remaining === 1 ? "" : "s"} left before access is blocked for 24 hours.`;
}
