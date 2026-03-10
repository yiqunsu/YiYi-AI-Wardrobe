/**
 * Image utility functions for preprocessing clothing photos.
 * Provides grid-based stitching of multiple clothing item images
 * into a single image, used before passing to the outfit image generator.
 */
import sharp from "sharp";

const CELL_SIZE = 512; // each item cell is CELL_SIZE × CELL_SIZE
const GAP = 8;
const BACKGROUND = { r: 245, g: 242, b: 236 }; // #F5F2EC warm beige

/**
 * Arranges multiple image buffers into a 2-column grid.
 * Each cell is CELL_SIZE × CELL_SIZE with a small gap between cells.
 * For a single image, resizes it to CELL_SIZE and returns directly.
 * This produces a compact, balanced reference image for Gemini —
 * much better than a very tall vertical strip when there are 2–3 items.
 */
export async function stitchImagesVertically(
  buffers: Buffer[]
): Promise<Buffer> {
  if (buffers.length === 0) {
    throw new Error(
      "stitchImagesVertically: at least one image buffer is required"
    );
  }

  if (buffers.length === 1) {
    return sharp(buffers[0])
      .resize(CELL_SIZE, CELL_SIZE, { fit: "contain", background: BACKGROUND })
      .jpeg({ quality: 90 })
      .toBuffer();
  }

  // Resize every item to a square cell
  const cells = await Promise.all(
    buffers.map((buf) =>
      sharp(buf)
        .resize(CELL_SIZE, CELL_SIZE, { fit: "contain", background: BACKGROUND })
        .jpeg({ quality: 90 })
        .toBuffer()
    )
  );

  const cols = 2;
  const rows = Math.ceil(cells.length / cols);
  const totalWidth = cols * CELL_SIZE + (cols - 1) * GAP;
  const totalHeight = rows * CELL_SIZE + (rows - 1) * GAP;

  const composites: sharp.OverlayOptions[] = cells.map((cell, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    // Center the last item if it's alone in its row
    const isLastAndAlone = cells.length % cols !== 0 && i === cells.length - 1;
    const left = isLastAndAlone
      ? Math.floor((totalWidth - CELL_SIZE) / 2)
      : col * (CELL_SIZE + GAP);
    const top = row * (CELL_SIZE + GAP);
    return { input: cell, top, left };
  });

  return sharp({
    create: {
      width: totalWidth,
      height: totalHeight,
      channels: 3,
      background: BACKGROUND,
    },
  })
    .composite(composites)
    .jpeg({ quality: 90 })
    .toBuffer();
}
