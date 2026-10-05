import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

// Leaving the admin section ends the session. Any storefront page (or asset)
// outside /admin and /api drops the session cookie on the way past, so the
// next visit to /admin has to sign in again.
//
// /api is exempt because that is where the admin pages fetch from — without
// it, opening the dashboard would log itself out. Static paths are exempt for
// the same reason: the dashboard loads /logo-light.png from the site root.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const isApi = pathname.startsWith("/api/");
  const isStatic = pathname.startsWith("/_next/") || pathname.includes(".");
  if (isAdmin || isApi || isStatic) return NextResponse.next();

  const response = NextResponse.next();
  if (request.cookies.has(SESSION_COOKIE)) response.cookies.delete(SESSION_COOKIE);
  return response;
}

export const config = {
  matcher: ["/((?!_next/).*)"],
};
