import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { put } from "@vercel/blob";
import { requireAdmin } from "@/lib/auth";
import { validateImage } from "@/lib/images";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Image uploads are not configured (BLOB_READ_WRITE_TOKEN is missing)" },
      { status: 503 }
    );
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });

  const file = formData.get("file");
  const image = await validateImage(file instanceof File ? file : null);
  if (!image.ok) {
    return NextResponse.json({ error: image.error }, { status: 415 });
  }

  // Name is generated, never derived from user input; the extension comes from
  // the validated MIME type. `allowOverwrite: false` makes collisions a hard
  // error rather than silently replacing someone else's image.
  const pathname = `uploads/${Date.now()}-${randomBytes(4).toString("hex")}.${image.ext}`;
  const bytes = Buffer.from(await (file as File).arrayBuffer());

  try {
    const blob = await put(pathname, bytes, {
      access: "public",
      contentType: image.type,
      allowOverwrite: false,
    });
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Blob upload failed:", error);
    return NextResponse.json({ error: "Could not store the image" }, { status: 500 });
  }
}
