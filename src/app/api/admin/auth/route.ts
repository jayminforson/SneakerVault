import { NextRequest, NextResponse } from "next/server";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "sneakervault2026";

export async function POST(request: NextRequest) {
  const { password } = await request.json();
  if (password === ADMIN_PASSWORD) {
    return NextResponse.json({ success: true, token: "sv-admin-ok" });
  }
  return NextResponse.json({ error: "Wrong password" }, { status: 401 });
}
