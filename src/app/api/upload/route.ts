import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomBytes } from "crypto";
import { requireAdmin } from "@/lib/auth";
import { validateImage } from "@/lib/images";

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });

  const file = formData.get("file");
  const image = await validateImage(file instanceof File ? file : null);
  if (!image.ok) {
    return NextResponse.json({ error: image.error }, { status: 415 });
  }

  const filename = `${Date.now()}-${randomBytes(4).toString("hex")}.${image.ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });
  const bytes = Buffer.from(await (file as File).arrayBuffer());
  await fs.writeFile(path.join(uploadDir, filename), bytes, { flag: "wx" });

  return NextResponse.json({ url: `/uploads/${filename}` });
}
