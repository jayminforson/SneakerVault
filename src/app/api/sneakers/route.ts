import { NextRequest, NextResponse } from "next/server";
import {
  getSneakers, getSneakerById, getSneakerPage, getSneakerBrands,
  addSneaker, updateSneaker, deleteSneaker,
} from "@/lib/db";
import type { SneakerSort } from "@/lib/queries";

const SORTS: SneakerSort[] = ["popular", "price-low", "price-high", "newest"];
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
  const images = body.images;
  if (Array.isArray(images)) {
    for (const image of images) {
      if (!isAllowedImageUrl(image)) {
        return `Gallery image URLs must come from: ${ALLOWED_IMAGE_HOST_LIST}`;
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

  // ?brands=1 → the brand list (with counts) for the shop filter.
  if (searchParams.has("brands")) {
    return NextResponse.json(await getSneakerBrands());
  }

  // ?page=N → one page of the shop grid. Without it the endpoint keeps
  // returning the whole list, which the admin dashboard still relies on.
  if (searchParams.has("page")) {
    const page = Math.max(1, Math.trunc(Number(searchParams.get("page"))) || 1);
    const pageSize = Math.min(48, Math.max(1, Math.trunc(Number(searchParams.get("pageSize"))) || 24));
    const sortParam = searchParams.get("sort") as SneakerSort | null;
    const sort: SneakerSort = sortParam && SORTS.includes(sortParam) ? sortParam : "popular";
    const brand = searchParams.get("brand")?.trim() || undefined;
    const search = searchParams.get("q")?.trim().slice(0, 100) || undefined;
    return NextResponse.json(await getSneakerPage({ page, pageSize, brand, search, sort }));
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
    images: Array.isArray(body.images) ? body.images : [],
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
