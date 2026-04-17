import { Dimension, OutputFormat, Mode, CropArea } from '../types';

interface ProcessOptions {
  mode: Mode;
  scaleFactor: number;
  targetDimension: Dimension;
  targetSize: number;
  outputFormat: OutputFormat;
  cropArea?: CropArea;
  removeBg?: boolean;
}

export interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

export const identifyBackgroundColor = (ctx: CanvasRenderingContext2D, width: number, height: number): Color | null => {
  const borderPixels: Color[] = [];
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const getPixel = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] };
  };

  // Sample border pixels
  for (let x = 0; x < width; x++) {
    borderPixels.push(getPixel(x, 0));
    if (height > 1) borderPixels.push(getPixel(x, height - 1));
  }
  for (let y = 1; y < height - 1; y++) {
    borderPixels.push(getPixel(0, y));
    if (width > 1) borderPixels.push(getPixel(width - 1, y));
  }

  // Count non-transparent border colors with some similarity grouping
  const counts: { color: Color; count: number }[] = [];
  let opaqueBorderPixels = 0;
  const tolerance = 5; // Very small tolerance for grouping similar colors on border

  for (const p of borderPixels) {
    if (p.a < 128) continue; // Skip already transparent/semi-transparent pixels

    let found = false;
    for (const entry of counts) {
      if (colorDistance(p, entry.color) < tolerance) {
        entry.count++;
        found = true;
        break;
      }
    }

    if (!found) {
      counts.push({ color: p, count: 1 });
    }

    opaqueBorderPixels++;
  }

  if (opaqueBorderPixels > 0) {
    let dominantIndex = -1;
    let maxCount = 0;
    for (let i = 0; i < counts.length; i++) {
      if (counts[i].count > maxCount) {
        maxCount = counts[i].count;
        dominantIndex = i;
      }
    }

    // If more than 50% of the opaque border is one color (or similar colors), we consider it the background
    if (dominantIndex !== -1 && maxCount > opaqueBorderPixels * 0.5) {
      return counts[dominantIndex].color;
    }
  }

  return null;
};

const colorDistance = (c1: Color, c2: Color): number => {
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
    Math.pow(c1.g - c2.g, 2) +
    Math.pow(c1.b - c2.b, 2) +
    Math.pow(c1.a - c2.a, 2)
  );
};

export const applyTransparency = (ctx: CanvasRenderingContext2D, width: number, height: number, bgColor: Color) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const tolerance = 12; // Small tolerance for "random" background pixels

  for (let i = 0; i < data.length; i += 4) {
    const pixel: Color = { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] };
    if (colorDistance(pixel, bgColor) < tolerance) {
      data[i + 3] = 0;
    }
  }
  ctx.putImageData(imageData, 0, 0);
};

export const processImage = async (
  file: File,
  previewUrl: string,
  options: ProcessOptions
): Promise<{ downloadUrl: string; downloadName: string }> => {
  const { mode, scaleFactor, targetDimension, targetSize, outputFormat, cropArea, removeBg } = options;

  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = previewUrl;
  });

  const sourceWidth = cropArea ? cropArea.width : img.width;
  const sourceHeight = cropArea ? cropArea.height : img.height;
  const sourceX = cropArea ? cropArea.x : 0;
  const sourceY = cropArea ? cropArea.y : 0;

  let newWidth, newHeight;
  let finalScaleFactor = scaleFactor;

  if (mode === 'preset') {
    newWidth = Math.round(sourceWidth * scaleFactor);
    newHeight = Math.round(sourceHeight * scaleFactor);
  } else {
    if (targetDimension === 'height') {
      newHeight = targetSize;
      newWidth = Math.round(sourceWidth * (targetSize / sourceHeight));
      finalScaleFactor = targetSize / sourceHeight;
    } else {
      newWidth = targetSize;
      newHeight = Math.round(sourceHeight * (targetSize / sourceWidth));
      finalScaleFactor = targetSize / sourceWidth;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = newWidth;
  canvas.height = newHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // Source canvas for background removal and cropping
  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = sourceWidth;
  sourceCanvas.height = sourceHeight;
  const sourceCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
  if (!sourceCtx) throw new Error('Could not get source canvas context');

  sourceCtx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);

  if (removeBg) {
    const bgColor = identifyBackgroundColor(sourceCtx, sourceWidth, sourceHeight);
    if (bgColor) {
      applyTransparency(sourceCtx, sourceWidth, sourceHeight, bgColor);
    }
  }

  // Nearest neighbor scaling
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sourceCanvas, 0, 0, sourceWidth, sourceHeight, 0, 0, newWidth, newHeight);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Could not create blob'));
        return;
      }
      const downloadUrl = URL.createObjectURL(blob);

      // Determine extension
      let ext = '.png';
      if (outputFormat === 'image/jpeg') ext = '.jpg';
      if (outputFormat === 'image/webp') ext = '.webp';

      // Remove original extension and add new one
      const originalName = file.name.replace(/\.[^/.]+$/, "");

      // Use N.Nx format for the scale
      const scaleStr = Number.isInteger(finalScaleFactor)
        ? finalScaleFactor.toString()
        : finalScaleFactor.toFixed(2);

      const downloadName = `${originalName}_${scaleStr}x${ext}`;

      resolve({ downloadUrl, downloadName });
    }, outputFormat, 1.0);
  });
};
