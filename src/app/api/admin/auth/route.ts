import { NextRequest, NextResponse } from "next/server";
import {
  ATTEMPT_WINDOW_MS, LOCKOUT_MS, MAX_FAILED_ATTEMPTS, SESSION_COOKIE,
  attemptsRemainingMessage, clientKey, createSessionToken, hasAdminPassword,
  isAuthenticated, isLockedOut, lockoutMessage, sessionCookieOptions,
  verifyAdminPassword,
} from "@/lib/auth";
import { clearLoginAttempts, getLoginAttempt, recordFailedLogin } from "@/lib/db";

// POST — sign in. Sets an httpOnly session cookie; no token is returned to
// JavaScript, so XSS cannot exfiltrate the admin session.
//
// Three wrong passwords from one client inside 24 hours lock that client out
// of admin login for a day. The lock is checked before the password is, so a
// blocked client cannot burn through it with more guesses.
export async function POST(request: NextRequest) {
  const key = clientKey(request);

  const attempt = await getLoginAttempt(key);
  const locked = attempt && isLockedOut(attempt.lockedUntil) ? attempt : null;
  if (locked) {
    return NextResponse.json(
      { error: lockoutMessage(), lockedUntil: locked.lockedUntil },
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

  const ok = typeof password === "string" && verifyAdminPassword(password);
  if (!ok) {
    // Failures older than the window do not count, so a lockout always means
    // three real guesses inside a day rather than three spread across a year.
    const recent = attempt && attempt.lastFailedAt &&
      Date.now() - new Date(attempt.lastFailedAt).getTime() <= ATTEMPT_WINDOW_MS
      ? attempt
      : null;
    const count = (recent?.failedCount ?? 0) + 1;
    const lockedUntil = count >= MAX_FAILED_ATTEMPTS
      ? new Date(Date.now() + LOCKOUT_MS).toISOString()
      : null;

    await recordFailedLogin(key, count, lockedUntil);

    if (lockedUntil) {
      return NextResponse.json(
        { error: lockoutMessage(), lockedUntil },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: attemptsRemainingMessage(MAX_FAILED_ATTEMPTS - count), lockedUntil: null },
      { status: 401 }
    );
  }

  await clearLoginAttempts(key);

  const token = createSessionToken();
  if (!token) {
    return NextResponse.json({ error: "Could not create session" }, { status: 500 });
  }

  const response = NextResponse.json({ success: true, lockedUntil: null });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}

// GET — session probe used by the admin pages to decide whether to redirect,
// and to show the countdown when this client is locked out.
export async function GET(request: NextRequest) {
  const attempt = await getLoginAttempt(clientKey(request));
  const lockedUntil = attempt && isLockedOut(attempt.lockedUntil)
    ? attempt.lockedUntil
    : null;
  return NextResponse.json({ authenticated: isAuthenticated(request), lockedUntil });
}

// DELETE — sign out.
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
