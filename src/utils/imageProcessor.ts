import { Dimension, OutputFormat, Mode, CropArea } from '../types';

interface ProcessOptions {
  mode: Mode;
  scaleFactor: number;
  targetDimension: Dimension;
  targetSize: number;
  outputFormat: OutputFormat;
  cropArea?: CropArea;
}

export const processImage = async (
  file: File,
  previewUrl: string,
  options: ProcessOptions
): Promise<{ downloadUrl: string; downloadName: string }> => {
  const { mode, scaleFactor, targetDimension, targetSize, outputFormat, cropArea } = options;

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

  // Nearest neighbor scaling
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, newWidth, newHeight);

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
