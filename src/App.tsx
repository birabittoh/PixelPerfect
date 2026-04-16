import { useState, useEffect } from 'react';
import { Dimension, OutputFormat, Mode, ProcessedFile } from './types';
import { Header } from './components/Header';
import { SettingsPanel } from './components/SettingsPanel';
import { Dropzone } from './components/Dropzone';
import { FileList } from './components/FileList';
import { processImage } from './utils/imageProcessor';

export default function App() {
  const [mode, setMode] = useState<Mode>(() => {
    return (localStorage.getItem('pp_mode') as Mode) || 'preset';
  });
  const [targetSize, setTargetSize] = useState<number>(() => {
    const saved = localStorage.getItem('pp_targetSize');
    return saved ? Number(saved) : 2000;
  });
  const [targetDimension, setTargetDimension] = useState<Dimension>(() => {
    return (localStorage.getItem('pp_targetDimension') as Dimension) || 'height';
  });
  const [outputFormat, setOutputFormat] = useState<OutputFormat>(() => {
    return (localStorage.getItem('pp_outputFormat') as OutputFormat) || 'image/png';
  });
  const [scaleFactor, setScaleFactor] = useState<number>(() => {
    const saved = localStorage.getItem('pp_scaleFactor');
    return saved ? Number(saved) : 4;
  });

  useEffect(() => {
    localStorage.setItem('pp_mode', mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('pp_targetSize', targetSize.toString());
  }, [targetSize]);

  useEffect(() => {
    localStorage.setItem('pp_targetDimension', targetDimension);
  }, [targetDimension]);

  useEffect(() => {
    localStorage.setItem('pp_outputFormat', outputFormat);
  }, [outputFormat]);

  useEffect(() => {
    localStorage.setItem('pp_scaleFactor', scaleFactor.toString());
  }, [scaleFactor]);

  const [files, setFiles] = useState<ProcessedFile[]>([]);

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
      if (file?.previewUrl) {
        URL.revokeObjectURL(file.previewUrl);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const handleProcessImage = async (file: File, id: string, previewUrl: string) => {
    try {
      const { downloadUrl, downloadName } = await processImage(file, previewUrl, {
        mode,
        scaleFactor,
        targetDimension,
        targetSize,
        outputFormat,
      });

      // Auto download
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setFiles(prev => prev.map(f => f.id === id ? {
        ...f,
        status: 'done',
        downloadUrl,
        downloadName
      } : f));
    } catch (error) {
      console.error('Error processing image:', error);
      setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'error', error: String(error) } : f));
    }
  };

  const handleFilesAdded = (validFiles: File[]) => {
    const newProcessedFiles: ProcessedFile[] = validFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      name: file.name,
      originalSize: file.size,
      status: 'processing',
      previewUrl: URL.createObjectURL(file)
    }));

    setFiles(prev => [...newProcessedFiles, ...prev]);

    validFiles.forEach((file, index) => {
      handleProcessImage(file, newProcessedFiles[index].id, newProcessedFiles[index].previewUrl!);
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900/30 selection:text-indigo-900 dark:selection:text-indigo-100">
      <div className="max-w-4xl mx-auto px-6 py-12">
        
        <Header />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <SettingsPanel
            mode={mode}
            setMode={setMode}
            scaleFactor={scaleFactor}
            setScaleFactor={setScaleFactor}
            targetDimension={targetDimension}
            setTargetDimension={setTargetDimension}
            targetSize={targetSize}
            setTargetSize={setTargetSize}
            outputFormat={outputFormat}
            setOutputFormat={setOutputFormat}
          />

          <div className="md:col-span-2 space-y-6">
            <Dropzone onFilesAdded={handleFilesAdded} />
            <FileList
              files={files}
              onDownload={downloadFile}
              onDelete={deleteFile}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
