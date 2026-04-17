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
    const borderPixels: { r: number; g: number; b: number; a: number }[] = [];
    const imageData = sourceCtx.getImageData(0, 0, sourceWidth, sourceHeight);
    const data = imageData.data;

    const getPixel = (x: number, y: number) => {
      const i = (y * sourceWidth + x) * 4;
      return { r: data[i], g: data[i+1], b: data[i+2], a: data[i+3] };
    };

    // Sample border pixels
    for (let x = 0; x < sourceWidth; x++) {
      borderPixels.push(getPixel(x, 0));
      if (sourceHeight > 1) borderPixels.push(getPixel(x, sourceHeight - 1));
    }
    for (let y = 1; y < sourceHeight - 1; y++) {
      borderPixels.push(getPixel(0, y));
      if (sourceWidth > 1) borderPixels.push(getPixel(sourceWidth - 1, y));
    }

    // Count non-transparent border colors
    const counts: Record<string, { color: { r: number; g: number; b: number; a: number }; count: number }> = {};
    let opaqueBorderPixels = 0;

    for (const p of borderPixels) {
      if (p.a < 128) continue; // Skip already transparent/semi-transparent pixels
      const key = `${p.r},${p.g},${p.b},${p.a}`;
      if (!counts[key]) counts[key] = { color: p, count: 0 };
      counts[key].count++;
      opaqueBorderPixels++;
    }

    if (opaqueBorderPixels > 0) {
      let dominantKey = '';
      let maxCount = 0;
      for (const key in counts) {
        if (counts[key].count > maxCount) {
          maxCount = counts[key].count;
          dominantKey = key;
        }
      }

      // If more than 50% of the opaque border is one color, we consider it the background
      if (maxCount > opaqueBorderPixels * 0.5) {
        const bg = counts[dominantKey].color;
        // Apply transparency to all matching pixels
        for (let i = 0; i < data.length; i += 4) {
          if (data[i] === bg.r && data[i+1] === bg.g && data[i+2] === bg.b && data[i+3] === bg.a) {
            data[i+3] = 0;
          }
        }
        sourceCtx.putImageData(imageData, 0, 0);
      }
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
