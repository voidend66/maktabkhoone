/**
 * CamScanner Core Image Processing Engine
 * High-precision 4-corner perspective warp (Homography) and document scanner enhancement filters
 * (Magic Color, Clear Document, High Contrast B&W) built on HTML5 Canvas.
 */

export interface Point {
  x: number; // 0 to 100 percentage
  y: number; // 0 to 100 percentage
}

export type CamScannerFilterType = 'magic_color' | 'clear_document' | 'high_contrast_bw' | 'original';

/**
 * Solve 8-parameter linear system for 3x3 Homography Matrix mapping:
 * from destination rectangle to source quad (Inverse mapping for backward warping)
 */
function getInverseHomographyMatrix(
  srcQuad: [number, number][], // [TL, TR, BR, BL] in pixel coords
  dstRect: [number, number][]  // [TL, TR, BR, BL] in pixel coords
): number[] {
  // We want H mapping (xd, yd) -> (xs, ys)
  // [xs, ys, 1]^T ~ H * [xd, yd, 1]^T
  const a: number[][] = [];
  const b: number[] = [];

  for (let i = 0; i < 4; i++) {
    const [xd, yd] = dstRect[i];
    const [xs, ys] = srcQuad[i];

    // xs = (h00*xd + h01*yd + h02) / (h20*xd + h21*yd + 1)
    // ys = (h10*xd + h11*yd + h12) / (h20*xd + h21*yd + 1)
    a.push([xd, yd, 1, 0, 0, 0, -xd * xs, -yd * xs]);
    b.push(xs);

    a.push([0, 0, 0, xd, yd, 1, -xd * ys, -yd * ys]);
    b.push(ys);
  }

  // Gaussian elimination with partial pivoting to solve A * h = B
  const n = 8;
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(a[k][i]) > Math.abs(a[maxRow][i])) {
        maxRow = k;
      }
    }
    // Swap rows
    [a[i], a[maxRow]] = [a[maxRow], a[i]];
    [b[i], b[maxRow]] = [b[maxRow], b[i]];

    // Eliminate below
    for (let k = i + 1; k < n; k++) {
      const c = -a[k][i] / a[i][i];
      for (let j = i; j < n; j++) {
        if (i === j) {
          a[k][j] = 0;
        } else {
          a[k][j] += c * a[i][j];
        }
      }
      b[k] += c * b[i];
    }
  }

  // Back substitution
  const h = new Array(8).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = b[i];
    for (let j = i + 1; j < n; j++) {
      sum -= a[i][j] * h[j];
    }
    h[i] = sum / a[i][i];
  }

  // Return full 3x3 matrix [h00, h01, h02, h10, h11, h12, h20, h21, 1]
  return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1.0];
}

/**
 * Warp quadrilateral perspective to flat upright rectangle with bilinear interpolation
 */
export function warpPerspectiveCanvas(
  sourceImg: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  cornersPercent: [Point, Point, Point, Point], // TL, TR, BR, BL
  targetWidth = 750,
  targetHeight = 1000
): HTMLCanvasElement {
  // Convert percentage corners to image pixel coordinates
  const pTL: [number, number] = [(cornersPercent[0].x / 100) * sourceWidth, (cornersPercent[0].y / 100) * sourceHeight];
  const pTR: [number, number] = [(cornersPercent[1].x / 100) * sourceWidth, (cornersPercent[1].y / 100) * sourceHeight];
  const pBR: [number, number] = [(cornersPercent[2].x / 100) * sourceWidth, (cornersPercent[2].y / 100) * sourceHeight];
  const pBL: [number, number] = [(cornersPercent[3].x / 100) * sourceWidth, (cornersPercent[3].y / 100) * sourceHeight];

  // Destination rectangle points
  const dTL: [number, number] = [0, 0];
  const dTR: [number, number] = [targetWidth, 0];
  const dBR: [number, number] = [targetWidth, targetHeight];
  const dBL: [number, number] = [0, targetHeight];

  // Read source pixels
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = sourceWidth;
  srcCanvas.height = sourceHeight;
  const srcCtx = srcCanvas.getContext('2d', { willReadFrequently: true })!;
  srcCtx.drawImage(sourceImg, 0, 0, sourceWidth, sourceHeight);
  const srcImageData = srcCtx.getImageData(0, 0, sourceWidth, sourceHeight);
  const srcData = srcImageData.data;

  // Create destination canvas
  const dstCanvas = document.createElement('canvas');
  dstCanvas.width = targetWidth;
  dstCanvas.height = targetHeight;
  const dstCtx = dstCanvas.getContext('2d')!;
  const dstImageData = dstCtx.createImageData(targetWidth, targetHeight);
  const dstData = dstImageData.data;

  // Compute inverse homography matrix
  const H = getInverseHomographyMatrix([pTL, pTR, pBR, pBL], [dTL, dTR, dBR, dBL]);
  const [h0, h1, h2, h3, h4, h5, h6, h7, h8] = H;

  // Warp pixel by pixel using bilinear sampling
  let dstIdx = 0;
  for (let yd = 0; yd < targetHeight; yd++) {
    for (let xd = 0; xd < targetWidth; xd++) {
      const z = h6 * xd + h7 * yd + h8;
      const invZ = 1.0 / (z !== 0 ? z : 0.00001);
      const xs = (h0 * xd + h1 * yd + h2) * invZ;
      const ys = (h3 * xd + h4 * yd + h5) * invZ;

      if (xs >= 0 && xs < sourceWidth - 1 && ys >= 0 && ys < sourceHeight - 1) {
        const x0 = Math.floor(xs);
        const y0 = Math.floor(ys);
        const x1 = x0 + 1;
        const y1 = y0 + 1;

        const wx1 = xs - x0;
        const wx0 = 1.0 - wx1;
        const wy1 = ys - y0;
        const wy0 = 1.0 - wy1;

        const idx00 = (y0 * sourceWidth + x0) * 4;
        const idx10 = (y0 * sourceWidth + x1) * 4;
        const idx01 = (y1 * sourceWidth + x0) * 4;
        const idx11 = (y1 * sourceWidth + x1) * 4;

        for (let c = 0; c < 3; c++) {
          const val =
            wx0 * wy0 * srcData[idx00 + c] +
            wx1 * wy0 * srcData[idx10 + c] +
            wx0 * wy1 * srcData[idx01 + c] +
            wx1 * wy1 * srcData[idx11 + c];
          dstData[dstIdx + c] = Math.round(val);
        }
        dstData[dstIdx + 3] = 255;
      } else {
        // Out of bounds clamp
        const cx = Math.max(0, Math.min(sourceWidth - 1, Math.round(xs)));
        const cy = Math.max(0, Math.min(sourceHeight - 1, Math.round(ys)));
        const cIdx = (cy * sourceWidth + cx) * 4;
        dstData[dstIdx] = srcData[cIdx];
        dstData[dstIdx + 1] = srcData[cIdx + 1];
        dstData[dstIdx + 2] = srcData[cIdx + 2];
        dstData[dstIdx + 3] = 255;
      }

      dstIdx += 4;
    }
  }

  dstCtx.putImageData(dstImageData, 0, 0);
  return dstCanvas;
}

/**
 * Apply signature CamScanner enhancement filters:
 * - Magic Color: contrast + local highlight stretch + vibrant colors
 * - Clear Document: eliminates dark paper shades & shadow gradient
 * - High-Contrast B&W: crisp binarization for text
 * - Original: unaltered color
 */
export function applyCamScannerFilter(
  canvas: HTMLCanvasElement,
  filterType: CamScannerFilterType
): HTMLCanvasElement {
  if (filterType === 'original') {
    return canvas;
  }

  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  const totalPixels = canvas.width * canvas.height;

  if (filterType === 'magic_color') {
    // Magic Color: Contrast curve + color saturation + background whitening
    for (let i = 0; i < totalPixels * 4; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Luminance
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      // Stretch whites (if paper is yellowish/gray > 170, brighten it toward white)
      if (lum > 165) {
        const whiteBoost = (lum - 165) / 90; // 0 to 1
        r = Math.min(255, r + 45 * whiteBoost);
        g = Math.min(255, g + 45 * whiteBoost);
        b = Math.min(255, b + 45 * whiteBoost);
      } else if (lum < 70) {
        // Deepen dark text / ink
        r = Math.max(0, r * 0.85);
        g = Math.max(0, g * 0.85);
        b = Math.max(0, b * 0.85);
      }

      // S-curve contrast boost
      const enhance = (v: number) => {
        const n = v / 255;
        // Sigmoid-like curve
        const c = n < 0.5 ? 2 * n * n : 1 - 2 * (1 - n) * (1 - n);
        return Math.min(255, Math.max(0, Math.round(c * 255)));
      };

      r = enhance(r);
      g = enhance(g);
      b = enhance(b);

      // Mild saturation boost to keep book illustrations lively
      const avg = (r + g + b) / 3;
      const satMultiplier = 1.25;
      data[i] = Math.min(255, Math.max(0, Math.round(avg + (r - avg) * satMultiplier)));
      data[i + 1] = Math.min(255, Math.max(0, Math.round(avg + (g - avg) * satMultiplier)));
      data[i + 2] = Math.min(255, Math.max(0, Math.round(avg + (b - avg) * satMultiplier)));
    }
  } else if (filterType === 'clear_document') {
    // Clear Document: Levels correction (crush shadows, blow highlights to pure white)
    for (let i = 0; i < totalPixels * 4; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      // Whitening cutoff
      if (lum > 140) {
        const factor = Math.min(1.0, (lum - 140) / 80);
        data[i] = Math.min(255, Math.round(r + (255 - r) * factor));
        data[i + 1] = Math.min(255, Math.round(g + (255 - g) * factor));
        data[i + 2] = Math.min(255, Math.round(b + (255 - b) * factor));
      } else {
        // High text contrast
        data[i] = Math.max(0, Math.round(r * 0.8));
        data[i + 1] = Math.max(0, Math.round(g * 0.8));
        data[i + 2] = Math.max(0, Math.round(b * 0.8));
      }
    }
  } else if (filterType === 'high_contrast_bw') {
    // High-contrast clean black and white
    for (let i = 0; i < totalPixels * 4; i += 4) {
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const val = lum > 145 ? 255 : (lum < 95 ? 0 : Math.round((lum - 95) / 50 * 255));
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * Rotate canvas clockwise by 90 degrees
 */
export function rotateCanvas(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const rotated = document.createElement('canvas');
  rotated.width = canvas.height;
  rotated.height = canvas.width;
  const ctx = rotated.getContext('2d')!;

  ctx.translate(rotated.width / 2, rotated.height / 2);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);

  return rotated;
}

/**
 * Detect corners using Scanic document scanner library (WASM & Canny detection)
 */
export async function detectCornersWithScanic(
  imageElement: HTMLImageElement | HTMLCanvasElement
): Promise<{ success: boolean; corners?: [Point, Point, Point, Point]; message?: string }> {
  try {
    const { scanDocument } = await import('scanic');
    const result = await scanDocument(imageElement, {
      mode: 'detect',
      detector: 'classical',
      minDetectionConfidence: 0.12,
      lowThreshold: 25,
      highThreshold: 110,
      minArea: 800
    });

    if (result.success && result.corners) {
      const w = (imageElement as HTMLImageElement).naturalWidth || imageElement.width || 1;
      const h = (imageElement as HTMLImageElement).naturalHeight || imageElement.height || 1;

      const corners: [Point, Point, Point, Point] = [
        {
          x: Math.max(0, Math.min(100, parseFloat(((result.corners.topLeft.x / w) * 100).toFixed(2)))),
          y: Math.max(0, Math.min(100, parseFloat(((result.corners.topLeft.y / h) * 100).toFixed(2))))
        },
        {
          x: Math.max(0, Math.min(100, parseFloat(((result.corners.topRight.x / w) * 100).toFixed(2)))),
          y: Math.max(0, Math.min(100, parseFloat(((result.corners.topRight.y / h) * 100).toFixed(2))))
        },
        {
          x: Math.max(0, Math.min(100, parseFloat(((result.corners.bottomRight.x / w) * 100).toFixed(2)))),
          y: Math.max(0, Math.min(100, parseFloat(((result.corners.bottomRight.y / h) * 100).toFixed(2))))
        },
        {
          x: Math.max(0, Math.min(100, parseFloat(((result.corners.bottomLeft.x / w) * 100).toFixed(2)))),
          y: Math.max(0, Math.min(100, parseFloat(((result.corners.bottomLeft.y / h) * 100).toFixed(2))))
        }
      ];

      return { success: true, corners };
    }
    return { success: false, message: result.message || 'سند در تصویر شناسایی نشد.' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'خطا در کتابخانه Scanic' };
  }
}

/**
 * Detect corners using server-side Gemini AI Vision
 */
export async function detectCornersWithAI(
  imageSource: string
): Promise<{ success: boolean; corners?: [Point, Point, Point, Point]; message?: string }> {
  try {
    const res = await fetch('/api/scanner/detect-corners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageSource })
    });
    const data = await res.json();
    if (data.success && data.corners) {
      const c = data.corners;
      const corners: [Point, Point, Point, Point] = [
        { x: c.topLeft.x, y: c.topLeft.y },
        { x: c.topRight.x, y: c.topRight.y },
        { x: c.bottomRight.x, y: c.bottomRight.y },
        { x: c.bottomLeft.x, y: c.bottomLeft.y }
      ];
      return { success: true, corners };
    }
    return { success: false, message: data.message || 'هوش مصنوعی موفق به تشخیص گوشه‌ها نشد.' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'خطا در ارتباط با سرور هوش مصنوعی' };
  }
}

/**
 * Detect corners using client-side HTML5 Canvas background subtraction and edge bounding
 */
export function detectCornersWithCV(
  sourceImg: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number
): { success: boolean; corners: [Point, Point, Point, Point]; confidence: number } {
  try {
    const W = 320;
    const H = Math.round((sourceHeight / sourceWidth) * 320) || 420;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('No 2d context');

    ctx.drawImage(sourceImg, 0, 0, W, H);
    const imgData = ctx.getImageData(0, 0, W, H);
    const data = imgData.data;

    // Average border color (carpet, rug, or table background around edges)
    let bgR = 0, bgG = 0, bgB = 0, borderCount = 0;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (x < 12 || x >= W - 12 || y < 12 || y >= H - 12) {
          const idx = (y * W + x) * 4;
          bgR += data[idx];
          bgG += data[idx + 1];
          bgB += data[idx + 2];
          borderCount++;
        }
      }
    }
    bgR /= borderCount || 1;
    bgG /= borderCount || 1;
    bgB /= borderCount || 1;

    let minX = W, maxX = 0, minY = H, maxY = 0;
    let fgCount = 0;
    const candidatePoints: { x: number; y: number }[] = [];

    for (let y = 8; y < H - 8; y += 2) {
      let rowFirstX = -1;
      let rowLastX = -1;
      for (let x = 8; x < W - 8; x += 2) {
        const idx = (y * W + x) * 4;
        const diff = Math.sqrt(
          (data[idx] - bgR) ** 2 +
          (data[idx + 1] - bgG) ** 2 +
          (data[idx + 2] - bgB) ** 2
        );

        if (diff > 30) {
          fgCount++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;

          if (rowFirstX === -1) rowFirstX = x;
          rowLastX = x;
        }
      }

      if (rowFirstX !== -1) {
        candidatePoints.push({ x: rowFirstX, y }, { x: rowLastX, y });
      }
    }

    const fgRatio = (fgCount * 4) / (W * H);
    if (fgRatio < 0.08 || minX >= maxX || minY >= maxY) {
      return {
        success: false,
        corners: [
          { x: 12, y: 10 },
          { x: 88, y: 10 },
          { x: 88, y: 90 },
          { x: 12, y: 90 }
        ],
        confidence: 0.2
      };
    }

    // Extremes: TL, TR, BR, BL
    let tl = { x: minX, y: minY }, minSum = 999999;
    let br = { x: maxX, y: maxY }, maxSum = -999999;
    let tr = { x: maxX, y: minY }, maxDiff = -999999;
    let bl = { x: minX, y: maxY }, minDiff = 999999;

    for (const p of candidatePoints) {
      const sum = p.x + p.y;
      const diff = p.x - p.y;
      if (sum < minSum) { minSum = sum; tl = p; }
      if (sum > maxSum) { maxSum = sum; br = p; }
      if (diff > maxDiff) { maxDiff = diff; tr = p; }
      if (diff < minDiff) { minDiff = diff; bl = p; }
    }

    const corners: [Point, Point, Point, Point] = [
      { x: Math.max(0, Math.min(100, parseFloat(((tl.x / W) * 100).toFixed(1)))), y: Math.max(0, Math.min(100, parseFloat(((tl.y / H) * 100).toFixed(1)))) },
      { x: Math.max(0, Math.min(100, parseFloat(((tr.x / W) * 100).toFixed(1)))), y: Math.max(0, Math.min(100, parseFloat(((tr.y / H) * 100).toFixed(1)))) },
      { x: Math.max(0, Math.min(100, parseFloat(((br.x / W) * 100).toFixed(1)))), y: Math.max(0, Math.min(100, parseFloat(((br.y / H) * 100).toFixed(1)))) },
      { x: Math.max(0, Math.min(100, parseFloat(((bl.x / W) * 100).toFixed(1)))), y: Math.max(0, Math.min(100, parseFloat(((bl.y / H) * 100).toFixed(1)))) }
    ];

    return { success: true, corners, confidence: 0.78 };
  } catch {
    return {
      success: false,
      corners: [
        { x: 12, y: 10 },
        { x: 88, y: 10 },
        { x: 88, y: 90 },
        { x: 12, y: 90 }
      ],
      confidence: 0.1
    };
  }
}

/**
 * Unified Smart Corner Detector:
 * Coordinates Scanic, AI Vision, and Computer Vision boundary fitting
 */
export async function smartDetectBookCorners(
  imageElement: HTMLImageElement,
  imageSrc?: string,
  preferredMethod: 'auto' | 'scanic' | 'ai' | 'cv' = 'auto'
): Promise<{
  success: boolean;
  corners: [Point, Point, Point, Point];
  method: 'scanic' | 'ai' | 'cv' | 'fallback';
  message: string;
}> {
  // If user explicitly chose AI
  if (preferredMethod === 'ai' && imageSrc) {
    const aiRes = await detectCornersWithAI(imageSrc);
    if (aiRes.success && aiRes.corners) {
      return {
        success: true,
        corners: aiRes.corners,
        method: 'ai',
        message: 'تشخیص کادر کتاب با هوش مصنوعی (AI Vision) انجام شد.'
      };
    }
  }

  // Scanic Document Scanner (WASM/Canny)
  if (preferredMethod === 'scanic' || preferredMethod === 'auto') {
    const scanicRes = await detectCornersWithScanic(imageElement);
    if (scanicRes.success && scanicRes.corners) {
      return {
        success: true,
        corners: scanicRes.corners,
        method: 'scanic',
        message: 'کادر کتاب با کتابخانه اسکنر (Scanic WASM) با موفقیت شناسایی شد.'
      };
    }
  }

  // In auto mode, if Scanic didn't find clear quad, try AI Vision
  if (preferredMethod === 'auto' && imageSrc) {
    const aiRes = await detectCornersWithAI(imageSrc);
    if (aiRes.success && aiRes.corners) {
      return {
        success: true,
        corners: aiRes.corners,
        method: 'ai',
        message: 'تشخیص کادر کتاب با هوش مصنوعی (AI Vision) انجام شد.'
      };
    }
  }

  // Client-side Computer Vision fallback
  const cvRes = detectCornersWithCV(
    imageElement,
    imageElement.naturalWidth || 800,
    imageElement.naturalHeight || 1000
  );
  if (cvRes.success) {
    return {
      success: true,
      corners: cvRes.corners,
      method: 'cv',
      message: 'کادر کتاب بر اساس تفکیک پس‌زمینه فرش/زمین شناسایی شد.'
    };
  }

  return {
    success: false,
    corners: cvRes.corners,
    method: 'fallback',
    message: 'کادر پیشنهادی تنظیم شد. می‌توانید ۴ گوشه را به دلخواه جابجا کنید.'
  };
}
