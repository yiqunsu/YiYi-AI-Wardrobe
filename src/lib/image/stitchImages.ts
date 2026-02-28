import sharp from "sharp";

const TARGET_WIDTH = 512;
const BACKGROUND = { r: 245, g: 242, b: 236 }; // #F5F2EC warm beige

/**
 * 将多张衣服图 Buffer 垂直拼接为一张长图。
 * - 所有图片等比缩放至统一宽度（TARGET_WIDTH）
 * - 从上到下依次排列，间距为 0
 * - 只有 1 张图时直接返回原 Buffer（缩放后），跳过拼接
 */
export async function stitchImagesVertically(buffers: Buffer[]): Promise<Buffer> {
  if (buffers.length === 0) {
    throw new Error("stitchImagesVertically: at least one image buffer is required");
  }

  // 只有一张图时，直接 resize 后返回，不需要 composite
  if (buffers.length === 1) {
    return sharp(buffers[0])
      .resize(TARGET_WIDTH, null, { fit: "inside", withoutEnlargement: false })
      .jpeg({ quality: 90 })
      .toBuffer();
  }

  // 将所有图片 resize 到统一宽度，并获取各自的高度
  const resized = await Promise.all(
    buffers.map((buf) =>
      sharp(buf)
        .resize(TARGET_WIDTH, null, { fit: "inside", withoutEnlargement: false })
        .jpeg({ quality: 90 })
        .toBuffer({ resolveWithObject: true })
    )
  );

  const totalHeight = resized.reduce((sum, r) => sum + r.info.height, 0);

  // 构建 composite 输入：每张图按顺序叠放在对应的 Y 偏移处
  let currentY = 0;
  const composites: sharp.OverlayOptions[] = resized.map((r) => {
    const overlay: sharp.OverlayOptions = { input: r.data, top: currentY, left: 0 };
    currentY += r.info.height;
    return overlay;
  });

  return sharp({
    create: {
      width: TARGET_WIDTH,
      height: totalHeight,
      channels: 3,
      background: BACKGROUND,
    },
  })
    .composite(composites)
    .jpeg({ quality: 90 })
    .toBuffer();
}
