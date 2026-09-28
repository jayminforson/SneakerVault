import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE, clientKey, createSessionToken, hasAdminPassword,
  isAuthenticated, isRateLimited, sessionCookieOptions, verifyAdminPassword,
} from "@/lib/auth";

// POST — sign in. Sets an httpOnly session cookie; no token is returned to
// JavaScript, so XSS cannot exfiltrate the admin session.
export async function POST(request: NextRequest) {
  const key = clientKey(request);
  if (isRateLimited(key)) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in 15 minutes." },
      { status: 429 }
    );
  }

  if (!hasAdminPassword()) {
    console.error("ADMIN_PASSWORD is not set — admin login is disabled.");
    return NextResponse.json({ error: "Admin login is not configured" }, { status: 503 });
  }

  let password: unknown;
  try {
    ({ password } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (typeof password !== "string" || !verifyAdminPassword(password)) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const token = createSessionToken();
  if (!token) {
    return NextResponse.json({ error: "Could not create session" }, { status: 500 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}

// GET — session probe used by the admin pages to decide whether to redirect.
export async function GET(request: NextRequest) {
  return NextResponse.json({ authenticated: isAuthenticated(request) });
}

// DELETE — sign out.
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
