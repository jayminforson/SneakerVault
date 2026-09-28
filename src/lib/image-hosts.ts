// Single source of truth for where product images may be hosted.
//
// Consumed twice so the two can never drift:
//   - next.config.ts  → next/image's remote allowlist
//   - lib/images.ts   → /api/sneakers rejects anything the allowlist would
//                       later refuse to render, which would crash the
//                       storefront on a <Next Image> hostname error
export const IMAGE_HOSTS: string[] = [
  "images.unsplash.com",
  "*.public.blob.vercel-storage.com",
];
