// Photo preparation in the browser. Re-encoding through a canvas drops ALL
// metadata (EXIF, GPS, camera serial) — a grower's photo must never reveal
// where the grow is. Orientation is applied first so photos aren't sideways.

export const MAX_EDGE = 2048;
export const MAX_INPUT_BYTES = 25 * 1024 * 1024;
export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function targetSize(width: number, height: number, maxEdge: number = MAX_EDGE) {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return { w: Math.max(1, Math.round(width * scale)), h: Math.max(1, Math.round(height * scale)) };
}

export type PreparedImage = { blob: Blob; w: number; h: number };

export async function prepareImage(file: File, maxEdge: number = MAX_EDGE): Promise<PreparedImage> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new Error("Use a JPG, PNG or WebP photo.");
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error("That photo is over 25 MB. Pick a smaller one.");
  }
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("We couldn't read that photo. Try a JPG or PNG.");
  }
  const { w, h } = targetSize(bitmap.width, bitmap.height, maxEdge);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser couldn't process that photo.");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.86));
  if (!blob || blob.type !== "image/webp") {
    throw new Error("Your browser couldn't convert that photo. Try another browser.");
  }
  return { blob, w, h };
}
