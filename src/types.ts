export type Dimension = 'width' | 'height';
export type OutputFormat = 'image/png' | 'image/jpeg' | 'image/webp';
export type Mode = 'preset' | 'advanced';

export interface ProcessedFile {
  id: string;
  name: string;
  originalSize: number;
  status: 'processing' | 'done' | 'error';
  error?: string;
  previewUrl?: string;
  downloadUrl?: string;
  downloadName?: string;
}
