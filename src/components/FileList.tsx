import React from 'react';
import { Image as ImageIcon, CheckCircle, Download, Trash2, AlertCircle, Scissors } from 'lucide-react';
import { ProcessedFile } from '../types';

interface FileListProps {
  files: ProcessedFile[];
  onDownload: (file: ProcessedFile) => void;
  onDelete: (id: string) => void;
  onCropRequest: (id: string) => void;
}

export const FileList: React.FC<FileListProps> = ({ files, onDownload, onDelete, onCropRequest }) => {
  if (files.length === 0) return null;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Recent Files</h3>
      </div>
      <ul className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-[400px] overflow-y-auto">
        {files.map(file => (
          <li key={file.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg shrink-0 overflow-hidden flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                {file.previewUrl ? (
                  <img
                    src={file.previewUrl}
                    alt={file.name}
                    className="w-full h-full object-cover"
                    style={{ imageRendering: 'pixelated' }}
                  />
                ) : (
                  <ImageIcon size={16} className="text-zinc-500 dark:text-zinc-400" />
                )}
              </div>
              <div className="truncate">
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{file.name}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{(file.originalSize / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <div className="shrink-0 ml-4 flex items-center gap-4">
              {file.status === 'pending' && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onCropRequest(file.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-sm font-semibold rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
                  >
                    <Scissors size={14} />
                    Crop & Export
                  </button>
                  <div className="flex items-center border-l border-zinc-200 dark:border-zinc-700 pl-3">
                    <button
                      onClick={() => onDelete(file.id)}
                      className="p-1.5 text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Remove from list"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )}
              {file.status === 'processing' && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-sm font-medium">
                    <div className="w-4 h-4 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                    Processing
                  </div>
                  <div className="flex items-center border-l border-zinc-200 dark:border-zinc-700 pl-3">
                    <button
                      onClick={() => onDelete(file.id)}
                      className="p-1.5 text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Remove from list"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
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
                      onClick={() => onDownload(file)}
                      className="p-1.5 text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
                      title="Download again"
                    >
                      <Download size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(file.id)}
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
                      onClick={() => onDelete(file.id)}
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
  );
};
