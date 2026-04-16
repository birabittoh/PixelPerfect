import React, { useState, useRef, useEffect } from 'react';
import { X, Check, Maximize2, Move, Square } from 'lucide-react';
import { CropArea } from '../types';

interface ImageCropperProps {
  imageUrl: string;
  onCrop: (crop: CropArea) => void;
  onCancel: () => void;
}

type DragMode = 'move' | 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br' | null;

export const ImageCropper: React.FC<ImageCropperProps> = ({ imageUrl, onCrop, onCancel }) => {
  const [imgDims, setImgDims] = useState({ width: 0, height: 0 });
  const [crop, setCrop] = useState<CropArea>({ x: 0, y: 0, width: 0, height: 0 });
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialCrop, setInitialCrop] = useState<CropArea | null>(null);

  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImgDims({ width: img.width, height: img.height });
      // Default to full image as requested
      setCrop({
        x: 0,
        y: 0,
        width: img.width,
        height: img.height
      });
    };
    img.src = imageUrl;
  }, [imageUrl]);


  const getRelativeCoords = (e: MouseEvent | TouchEvent) => {
    if (!imgRef.current) return null;
    const rect = imgRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

    const scaleX = imgDims.width / rect.width;
    const scaleY = imgDims.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent, mode: DragMode) => {
    e.stopPropagation();
    const coords = getRelativeCoords(e.nativeEvent);
    if (!coords) return;
    setDragMode(mode);
    setDragStart(coords);
    setInitialCrop({ ...crop });
  };

  const handleMove = (e: MouseEvent | TouchEvent) => {
    if (!dragMode || !initialCrop) return;
    const coords = getRelativeCoords(e);
    if (!coords) return;

    const dx = coords.x - dragStart.x;
    const dy = coords.y - dragStart.y;

    let newCrop = { ...initialCrop };

    if (dragMode === 'move') {
      newCrop.x = Math.max(0, Math.min(imgDims.width - initialCrop.width, initialCrop.x + dx));
      newCrop.y = Math.max(0, Math.min(imgDims.height - initialCrop.height, initialCrop.y + dy));
    } else if (dragMode === 'resize-br') {
      const size = Math.max(16, Math.min(initialCrop.width + dx, initialCrop.width + dy, imgDims.width - initialCrop.x, imgDims.height - initialCrop.y));
      newCrop.width = size;
      newCrop.height = size;
    } else if (dragMode === 'resize-tl') {
      const available = Math.min(initialCrop.x, initialCrop.y);
      const delta = Math.min(dx, dy);
      const sizeChange = Math.max(-available, Math.min(delta, initialCrop.width - 16));
      newCrop.x = initialCrop.x + sizeChange;
      newCrop.y = initialCrop.y + sizeChange;
      newCrop.width = initialCrop.width - sizeChange;
      newCrop.height = initialCrop.height - sizeChange;
    }

    setCrop(newCrop);
  };

  const handleEnd = () => {
    setDragMode(null);
  };

  useEffect(() => {
    if (dragMode) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [dragMode]);

  const resetCrop = () => {
    const size = Math.min(imgDims.width, imgDims.height);
    setCrop({
      x: (imgDims.width - size) / 2,
      y: (imgDims.height - size) / 2,
      width: size,
      height: size
    });
  };

  const maxImage = () => {
     setCrop({ x: 0, y: 0, width: imgDims.width, height: imgDims.height });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh]">
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 leading-none">Crop Sprite</h2>
            <p className="text-xs text-zinc-500 mt-1">Drag to move, use corners to resize square</p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="relative flex-1 min-h-0 bg-zinc-100 dark:bg-zinc-950 p-8 flex items-center justify-center overflow-auto">
          <div className="relative inline-block max-w-full touch-none select-none shadow-2xl">
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Crop target"
              className="max-w-full max-h-[60vh] block pointer-events-none"
              style={{ imageRendering: 'pixelated' }}
            />
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-black/60 pointer-events-none"></div>

            {/* Selection Area */}
            <div
              className="absolute border-2 border-indigo-500 cursor-move shadow-[0_0_0_9999px_rgba(0,0,0,0)]"
              style={{
                left: `${(crop.x / imgDims.width) * 100}%`,
                top: `${(crop.y / imgDims.height) * 100}%`,
                width: `${(crop.width / imgDims.width) * 100}%`,
                height: `${(crop.height / imgDims.height) * 100}%`
              }}
              onMouseDown={(e) => handleStart(e, 'move')}
              onTouchStart={(e) => handleStart(e, 'move')}
            >
              {/* Highlighted image area */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <img
                  src={imageUrl}
                  alt="Crop preview"
                  className="absolute max-w-none"
                  style={{
                    left: `${(-crop.x / imgDims.width) * (imgRef.current?.clientWidth || 0)}px`,
                    top: `${(-crop.y / imgDims.height) * (imgRef.current?.clientHeight || 0)}px`,
                    width: `${imgRef.current?.clientWidth || 0}px`,
                    height: `${imgRef.current?.clientHeight || 0}px`,
                    imageRendering: 'pixelated'
                  }}
                />
              </div>

              {/* Resize Handles */}
              <div
                className="absolute -top-3 -left-3 w-6 h-6 flex items-center justify-center cursor-nwse-resize group"
                onMouseDown={(e) => handleStart(e, 'resize-tl')}
                onTouchStart={(e) => handleStart(e, 'resize-tl')}
              >
                <div className="w-3 h-3 bg-white border-2 border-indigo-500 rounded-sm group-hover:scale-125 transition-transform"></div>
              </div>
              <div
                className="absolute -bottom-3 -right-3 w-6 h-6 flex items-center justify-center cursor-nwse-resize group"
                onMouseDown={(e) => handleStart(e, 'resize-br')}
                onTouchStart={(e) => handleStart(e, 'resize-br')}
              >
                <div className="w-3 h-3 bg-white border-2 border-indigo-500 rounded-sm group-hover:scale-125 transition-transform"></div>
              </div>

              {/* Center Icon */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <Move className="text-white" size={32} />
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex gap-4">
            <button
              onClick={resetCrop}
              className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 transition-colors"
            >
              <Square size={16} />
              Reset Square
            </button>
            <button
              onClick={maxImage}
              className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 transition-colors"
            >
              <Maximize2 size={16} />
              Full Image
            </button>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={onCancel}
              className="flex-1 sm:flex-none px-6 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onCrop(crop)}
              className="flex-1 sm:flex-none px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Check size={18} />
              Export Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
