export const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4 MB

// Extension is derived from the *validated* MIME type, never from the client's
// filename, so an attacker cannot choose the extension or path.
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export const ALLOWED_TYPE_LIST = Object.keys(ALLOWED_TYPES).join(", ");

export type ImageValidation =
  | { ok: true; ext: string; type: string }
  | { ok: false; error: string };

export async function validateImage(file: File | null): Promise<ImageValidation> {
  if (!file || typeof file === "string") {
    return { ok: false, error: "No file provided" };
  }
  if (file.size === 0) {
    return { ok: false, error: "File is empty" };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: `File is too large (max ${MAX_IMAGE_BYTES / 1024 / 1024} MB)` };
  }

  const type = file.type.toLowerCase();
  const ext = ALLOWED_TYPES[type];
  if (!ext) {
    return { ok: false, error: `Unsupported file type. Use ${ALLOWED_TYPE_LIST}` };
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!matchesSignature(bytes, type)) {
    return { ok: false, error: "File contents do not match its declared type" };
  }

  return { ok: true, ext, type };
}

// Cheap magic-byte check: a .exe renamed to image/png must not pass just
// because the browser reported a plausible MIME type.
function matchesSignature(bytes: Buffer, type: string): boolean {
  if (bytes.length < 12) return false;

  switch (type) {
    case "image/jpeg":
      return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case "image/png":
      return (
        bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
        bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
      );
    case "image/webp":
      return bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
    case "image/avif": {
      if (bytes.toString("ascii", 4, 8) !== "ftyp") return false;
      const brand = bytes.toString("ascii", 8, 12);
      return brand === "avif" || brand === "avis";
    }
    default:
      return false;
  }
}
