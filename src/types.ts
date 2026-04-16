export type Dimension = 'width' | 'height';
export type OutputFormat = 'image/png' | 'image/jpeg' | 'image/webp';
export type Mode = 'preset' | 'fixed';

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ProcessedFile {
  id: string;
  file: File;
  name: string;
  originalSize: number;
  status: 'pending' | 'processing' | 'done' | 'error';
  error?: string;
  previewUrl?: string;
  downloadUrl?: string;
  downloadName?: string;
  cropArea?: CropArea;
}
