import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, CheckCircle, Settings, AlertCircle, Download, Trash2 } from 'lucide-react';

type Dimension = 'width' | 'height';
type OutputFormat = 'image/png' | 'image/jpeg' | 'image/webp';

interface ProcessedFile {
  id: string;
  name: string;
  originalSize: number;
  status: 'processing' | 'done' | 'error';
  error?: string;
  downloadUrl?: string;
  downloadName?: string;
}

export default function App() {
  const [targetSize, setTargetSize] = useState<number>(2000);
  const [targetDimension, setTargetDimension] = useState<Dimension>('height');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('image/png');
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadFile = (file: ProcessedFile) => {
    if (!file.downloadUrl || !file.downloadName) return;
    const a = document.createElement('a');
    a.href = file.downloadUrl;
    a.download = file.downloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const deleteFile = (id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.downloadUrl) {
        URL.revokeObjectURL(file.downloadUrl);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const processImage = async (file: File, id: string) => {
    try {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = objectUrl;
      });

      let newWidth, newHeight;
      if (targetDimension === 'height') {
        newHeight = targetSize;
        newWidth = Math.round(img.width * (targetSize / img.height));
      } else {
        newWidth = targetSize;
        newHeight = Math.round(img.height * (targetSize / img.width));
      }

      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      // Nearest neighbor scaling
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Could not create blob');
        }
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        
        // Determine extension
        let ext = '.png';
        if (outputFormat === 'image/jpeg') ext = '.jpg';
        if (outputFormat === 'image/webp') ext = '.webp';
        
        // Remove original extension and add new one
        const originalName = file.name.replace(/\.[^/.]+$/, "");
        const downloadName = `${originalName}_upscaled${ext}`;
        a.download = downloadName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(objectUrl);

        setFiles(prev => prev.map(f => f.id === id ? {
          ...f,
          status: 'done',
          downloadUrl,
          downloadName
        } : f));
      }, outputFormat, 1.0);

    } catch (error) {
      console.error('Error processing image:', error);
      setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'error', error: String(error) } : f));
    }
  };

  const handleFiles = (newFiles: FileList | File[]) => {
    const validFiles = Array.from(newFiles).filter(file => file.type.startsWith('image/'));
    
    const newProcessedFiles: ProcessedFile[] = validFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      name: file.name,
      originalSize: file.size,
      status: 'processing'
    }));

    setFiles(prev => [...newProcessedFiles, ...prev]);

    validFiles.forEach((file, index) => {
      processImage(file, newProcessedFiles[index].id);
    });
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900/30 selection:text-indigo-900 dark:selection:text-indigo-100">
      <div className="max-w-4xl mx-auto px-6 py-12">
        
        <header className="mb-12 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-600 text-white rounded-2xl mb-4 shadow-sm">
            <ImageIcon size={32} />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-3">PixelPerfect</h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto">
            Upscale your pixel art perfectly with nearest neighbor interpolation. 
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Settings Panel */}
          <div className="md:col-span-1 space-y-6 bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 h-fit">
            <div className="flex items-center gap-2 mb-4 text-zinc-800 dark:text-zinc-200 font-semibold">
              <Settings size={20} className="text-zinc-400 dark:text-zinc-500" />
              <h2>Settings</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Target Dimension</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTargetDimension('width')}
                    className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${targetDimension === 'width' ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                  >
                    Width
                  </button>
                  <button
                    onClick={() => setTargetDimension('height')}
                    className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${targetDimension === 'height' ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                  >
                    Height
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Target Size (px)</label>
                <input
                  type="number"
                  value={targetSize}
                  onChange={(e) => setTargetSize(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                  min="1"
                  step="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Output Format</label>
                <select
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                >
                  <option value="image/png">PNG (Lossless)</option>
                  <option value="image/jpeg">JPEG</option>
                  <option value="image/webp">WebP</option>
                </select>
              </div>
            </div>
          </div>

          {/* Main Area */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Dropzone */}
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative overflow-hidden flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 ${
                isDragging 
                  ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10' 
                  : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={onFileInputChange}
              />
              <div className={`p-4 rounded-full mb-4 transition-colors ${isDragging ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'}`}>
                <UploadCloud size={32} />
              </div>
              <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-1">Upload Images</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center max-w-xs">
                Drag and drop your images here, or click to browse. They will be processed and downloaded automatically.
              </p>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50">
                  <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Recent Files</h3>
                </div>
                <ul className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-[400px] overflow-y-auto">
                  {files.map(file => (
                    <li key={file.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg shrink-0">
                          <ImageIcon size={16} className="text-zinc-500 dark:text-zinc-400" />
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{file.name}</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">{(file.originalSize / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <div className="shrink-0 ml-4 flex items-center gap-4">
                        {file.status === 'processing' && (
                          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-sm font-medium">
                            <div className="w-4 h-4 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                            Processing
                          </div>
                        )}
                        {file.status === 'done' && (
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                              <CheckCircle size={16} />
                              Done
                            </div>
                            <div className="flex items-center gap-1 border-l border-zinc-200 dark:border-zinc-700 pl-3">
                              <button
                                onClick={() => downloadFile(file)}
                                className="p-1.5 text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
                                title="Download again"
                              >
                                <Download size={16} />
                              </button>
                              <button
                                onClick={() => deleteFile(file.id)}
                                className="p-1.5 text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Remove from list"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        )}
                        {file.status === 'error' && (
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 text-sm font-medium" title={file.error}>
                              <AlertCircle size={16} />
                              Error
                            </div>
                            <div className="flex items-center border-l border-zinc-200 dark:border-zinc-700 pl-3">
                              <button
                                onClick={() => deleteFile(file.id)}
                                className="p-1.5 text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Remove from list"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
