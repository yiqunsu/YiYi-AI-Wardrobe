/**
 * Browser-side image compression using the native Canvas API (zero dependencies).
 *
 * Strategy:
 *   1. Decode the File into an <img> element.
 *   2. Draw to an off-screen <canvas> scaled to ≤ MAX_WIDTH_PX wide.
 *   3. Export as JPEG, iteratively lowering quality until the blob is ≤ TARGET_BYTES.
 *
 * Why 800 KB target?
 *   Vercel's 4.5 MB body limit divided by the max batch size of 10 files ≈ 450 KB.
 *   We target 800 KB so that even a 5-file batch (5 × 800 KB = 4 MB) stays under
 *   the Vercel limit while keeping visually acceptable image quality.
 *   In practice, a 1200-px-wide JPEG at quality 0.80 is typically 150–400 KB.
 *
 * Safe fallback: if anything goes wrong (unsupported format, Canvas error, etc.)
 * the original File is returned unchanged so uploads are never silently blocked.
 */

const MAX_WIDTH_PX = 1200;
const TARGET_BYTES = 800 * 1024; // 800 KB per file → 10 files ≈ 8 MB worst case
const QUALITY_START = 0.82;
const QUALITY_STEP = 0.08;
const QUALITY_MIN = 0.45;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("canvas.toBlob returned null")),
      "image/jpeg",
      quality
    );
  });
}

/**
 * Compresses a browser File to a JPEG ≤ TARGET_BYTES.
 * Returns the compressed File, or the original File if compression is not
 * beneficial or encounters any error.
 */
export async function compressImageFile(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);

    let w = img.naturalWidth;
    let h = img.naturalHeight;

    if (w > MAX_WIDTH_PX) {
      h = Math.round((h * MAX_WIDTH_PX) / w);
      w = MAX_WIDTH_PX;
    }

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, w, h);

    let quality = QUALITY_START;
    let blob: Blob = await canvasToBlob(canvas, quality);

    while (blob.size > TARGET_BYTES && quality > QUALITY_MIN) {
      quality = Math.max(quality - QUALITY_STEP, QUALITY_MIN);
      blob = await canvasToBlob(canvas, quality);
    }

    // Compression produced a larger file (e.g. already-optimised PNG) — keep original
    if (blob.size >= file.size) return file;

    const outName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
    return new File([blob], outName, { type: "image/jpeg" });
  } catch {
    return file; // safe fallback — never block the upload
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
