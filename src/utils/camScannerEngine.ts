/**
 * Book Cover Crop & Perspective Engine
 * High-precision 4-corner perspective crop and optional image enhancements built on HTML5 Canvas.
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
  const a: number[][] = [];
  const b: number[] = [];

  for (let i = 0; i < 4; i++) {
    const [xd, yd] = dstRect[i];
    const [xs, ys] = srcQuad[i];

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
    [a[i], a[maxRow]] = [a[maxRow], a[i]];
    [b[i], b[maxRow]] = [b[maxRow], b[i]];

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
        const clampedX = Math.max(0, Math.min(sourceWidth - 1, Math.round(xs)));
        const clampedY = Math.max(0, Math.min(sourceHeight - 1, Math.round(ys)));
        const cIdx = (clampedY * sourceWidth + clampedX) * 4;
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
 * Image enhancement filters for cropped covers
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
  const len = data.length;

  if (filterType === 'magic_color') {
    // Magic Color: Adaptive contrast stretch + gentle saturation boost
    for (let i = 0; i < len; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Stretch contrast slightly
      r = Math.min(255, Math.max(0, (r - 20) * 1.18));
      g = Math.min(255, Math.max(0, (g - 20) * 1.18));
      b = Math.min(255, Math.max(0, (b - 20) * 1.18));

      // Boost saturation
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = Math.min(255, Math.max(0, gray + (r - gray) * 1.25));
      g = Math.min(255, Math.max(0, gray + (g - gray) * 1.25));
      b = Math.min(255, Math.max(0, gray + (b - gray) * 1.25));

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
  } else if (filterType === 'clear_document') {
    // Clear Document: Brighten highlights, whiten paper background, sharpen darks
    for (let i = 0; i < len; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum > 140) {
        const factor = 1.0 + (lum - 140) / 115 * 0.35;
        r = Math.min(255, r * factor);
        g = Math.min(255, g * factor);
        b = Math.min(255, b * factor);
      } else {
        r = Math.max(0, r * 0.95);
        g = Math.max(0, g * 0.95);
        b = Math.max(0, b * 0.95);
      }

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
  } else if (filterType === 'high_contrast_bw') {
    // High-Contrast Black & White
    for (let i = 0; i < len; i += 4) {
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const bw = lum > 128 ? Math.min(255, lum * 1.2) : Math.max(0, lum * 0.8);
      data[i] = bw;
      data[i + 1] = bw;
      data[i + 2] = bw;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * Rotate canvas 90 degrees clockwise
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
 * Default clean crop corners with inward margin percentage
 */
export function getDefaultCropCorners(margin = 8): [Point, Point, Point, Point] {
  return [
    { x: margin, y: margin },
    { x: 100 - margin, y: margin },
    { x: 100 - margin, y: 100 - margin },
    { x: margin, y: 100 - margin }
  ];
}
