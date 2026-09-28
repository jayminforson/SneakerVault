import { NextRequest, NextResponse } from "next/server";
import { getSneakers, getSneakerById, addSneaker, updateSneaker, deleteSneaker } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { isAllowedImageUrl, ALLOWED_IMAGE_HOST_LIST } from "@/lib/images";
import { v4 as uuidv4 } from "uuid";

// Product images are rendered with next/image, which throws for hosts outside
// its allowlist. Reject at the door so a bad URL can never reach the storefront.
function imageHostError(body: Record<string, unknown>): string | null {
  if (!isAllowedImageUrl(body.heroImage)) {
    return `Image URL must come from: ${ALLOWED_IMAGE_HOST_LIST}`;
  }
  const colors = body.colors;
  if (Array.isArray(colors)) {
    for (const color of colors) {
      if (color && !isAllowedImageUrl(color.image)) {
        return `Colour image URLs must come from: ${ALLOWED_IMAGE_HOST_LIST}`;
      }
    }
  }
  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (id) {
    const sneaker = await getSneakerById(id);
    if (!sneaker) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(sneaker);
  }
  return NextResponse.json(await getSneakers());
}

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const body = await request.json();
  if (!body.heroImage) {
    return NextResponse.json({ error: "An image URL is required" }, { status: 400 });
  }
  const hostError = imageHostError(body);
  if (hostError) return NextResponse.json({ error: hostError }, { status: 400 });
  const sneaker = {
    id: body.id || uuidv4(),
    name: body.name || "", brand: body.brand || "", description: body.description || "",
    price: Number(body.price) || 0,
    originalPrice: body.originalPrice ? Number(body.originalPrice) : undefined,
    rating: Number(body.rating) || 4.5, reviewCount: Number(body.reviewCount) || 0,
    heroImage: body.heroImage || "",
    colors: body.colors || [], sizes: body.sizes || [], tags: body.tags || [],
  };
  return NextResponse.json(await addSneaker(sneaker), { status: 201 });
}

export async function PUT(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const hostError = imageHostError(body);
  if (hostError) return NextResponse.json({ error: hostError }, { status: 400 });
  const updated = await updateSneaker(body.id, body);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  if (!(await deleteSneaker(id))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
