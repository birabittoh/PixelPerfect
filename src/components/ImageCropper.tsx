import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X, Check, Maximize2, Move, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Square, ZoomIn } from 'lucide-react';
import { CropArea } from '../types';

interface ImageCropperProps {
  imageUrl: string;
  onCrop: (crop: CropArea) => void;
  onCancel: () => void;
}

type DragMode = 'move' | 'resize-tl' | 'resize-br' | null;

export const ImageCropper: React.FC<ImageCropperProps> = ({ imageUrl, onCrop, onCancel }) => {
  const [imgDims, setImgDims] = useState({ width: 0, height: 0 });
  const [crop, setCrop] = useState<CropArea>({ x: 0, y: 0, width: 0, height: 0 });
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialCrop, setInitialCrop] = useState<CropArea | null>(null);

  const imgRef = useRef<HTMLImageElement>(null);
  const magnifierCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImgDims({ width: img.width, height: img.height });
      setCrop({ x: 0, y: 0, width: img.width, height: img.height });
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Update magnifier
  useEffect(() => {
    if (!magnifierCanvasRef.current || !imgRef.current || imgDims.width === 0) return;
    const canvas = magnifierCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw zoomed in area (magnifier)
      // Center the magnifier on the current crop or selection point
      // We want to see the edges of our selection clearly
      ctx.drawImage(
        img,
        crop.x, crop.y, crop.width, crop.height,
        0, 0, canvas.width, canvas.height
      );

      // Draw a subtle pixel grid if zoomed in enough
      if (canvas.width / crop.width > 8) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 0.5;
        const step = canvas.width / crop.width;
        for (let x = 0; x <= canvas.width; x += step) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        for (let y = 0; y <= canvas.height; y += step) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
      }
    };
    img.src = imageUrl;
  }, [crop, imgDims, imageUrl]);

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
      newCrop.x = Math.max(0, Math.min(imgDims.width - initialCrop.width, Math.round(initialCrop.x + dx)));
      newCrop.y = Math.max(0, Math.min(imgDims.height - initialCrop.height, Math.round(initialCrop.y + dy)));
    } else if (dragMode === 'resize-br') {
      const size = Math.max(1, Math.min(Math.round(initialCrop.width + dx), Math.round(initialCrop.width + dy), imgDims.width - initialCrop.x, imgDims.height - initialCrop.y));
      newCrop.width = size;
      newCrop.height = size;
    } else if (dragMode === 'resize-tl') {
      const available = Math.min(initialCrop.x, initialCrop.y);
      const delta = Math.min(dx, dy);
      const sizeChange = Math.max(-available, Math.min(Math.round(delta), initialCrop.width - 1));
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

  const nudge = (dx: number, dy: number, ds: number = 0) => {
    setCrop(prev => {
      const newWidth = Math.max(1, Math.min(imgDims.width - prev.x, prev.width + ds));
      const newHeight = Math.max(1, Math.min(imgDims.height - prev.y, prev.height + ds));
      return {
        x: Math.max(0, Math.min(imgDims.width - newWidth, prev.x + dx)),
        y: Math.max(0, Math.min(imgDims.height - newHeight, prev.y + dy)),
        width: newWidth,
        height: newHeight
      };
    });
  };

  const resetCrop = () => {
    const size = Math.min(16, imgDims.width, imgDims.height);
    setCrop({
      x: Math.round((imgDims.width - size) / 2),
      y: Math.round((imgDims.height - size) / 2),
      width: size,
      height: size
    });
  };

  const fullImage = () => {
    setCrop({ x: 0, y: 0, width: imgDims.width, height: imgDims.height });
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/50">
        <div>
          <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
            <Square size={20} className="text-indigo-600" />
            Precise Crop
          </h2>
          <p className="text-xs text-zinc-500">Select exactly the pixels you want to upscale.</p>
        </div>
        <button
          onClick={onCancel}
          className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-zinc-100 dark:divide-zinc-800">
        {/* Main Selection Area */}
        <div className="flex-1 p-6 flex items-center justify-center bg-zinc-50 dark:bg-zinc-950/30 min-h-[300px] max-h-[500px] overflow-auto">
          <div className="relative inline-block touch-none select-none shadow-2xl rounded-lg overflow-hidden">
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Crop target"
              className="max-w-full max-h-[40vh] block pointer-events-none"
              style={{ imageRendering: 'pixelated' }}
            />
            <div className="absolute inset-0 bg-black/60 pointer-events-none"></div>

            <div
              className="absolute border-2 border-indigo-500 cursor-move"
              style={{
                left: `${(crop.x / imgDims.width) * 100}%`,
                top: `${(crop.y / imgDims.height) * 100}%`,
                width: `${(crop.width / imgDims.width) * 100}%`,
                height: `${(crop.height / imgDims.height) * 100}%`
              }}
              onMouseDown={(e) => handleStart(e, 'move')}
              onTouchStart={(e) => handleStart(e, 'move')}
            >
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
                className="absolute -top-3 -left-3 w-6 h-6 flex items-center justify-center cursor-nwse-resize"
                onMouseDown={(e) => handleStart(e, 'resize-tl')}
                onTouchStart={(e) => handleStart(e, 'resize-tl')}
              >
                <div className="w-3 h-3 bg-white border-2 border-indigo-500 rounded-sm"></div>
              </div>
              <div
                className="absolute -bottom-3 -right-3 w-6 h-6 flex items-center justify-center cursor-nwse-resize"
                onMouseDown={(e) => handleStart(e, 'resize-br')}
                onTouchStart={(e) => handleStart(e, 'resize-br')}
              >
                <div className="w-3 h-3 bg-white border-2 border-indigo-500 rounded-sm"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Precision Panel */}
        <div className="w-full lg:w-80 bg-white dark:bg-zinc-900 p-6 flex flex-col gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              <ZoomIn size={16} className="text-indigo-500" />
              Precision Preview
            </div>
            <div className="aspect-square bg-zinc-100 dark:bg-zinc-950 rounded-2xl overflow-hidden border-2 border-zinc-200 dark:border-zinc-800 shadow-inner flex items-center justify-center">
              <canvas
                ref={magnifierCanvasRef}
                width={256}
                height={256}
                className="w-full h-full object-contain"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
              <span>X: {crop.x} Y: {crop.y}</span>
              <span>{crop.width}x{crop.height} px</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Nudge Selection</div>
            <div className="grid grid-cols-3 gap-2 w-fit mx-auto">
              <div />
              <NudgeButton onClick={() => nudge(0, -1)} icon={<ChevronUp size={20} />} />
              <div />
              <NudgeButton onClick={() => nudge(-1, 0)} icon={<ChevronLeft size={20} />} />
              <NudgeButton onClick={() => nudge(0, 1)} icon={<ChevronDown size={20} />} />
              <NudgeButton onClick={() => nudge(1, 0)} icon={<ChevronRight size={20} />} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={resetCrop}
                className="px-3 py-2 text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
              >
                <Square size={14} />
                Small Square
              </button>
              <button
                onClick={fullImage}
                className="px-3 py-2 text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
              >
                <Maximize2 size={14} />
                Full Image
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
        <button
          onClick={onCancel}
          className="px-6 py-2.5 text-sm font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => onCrop(crop)}
          className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-2xl shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2 active:scale-95"
        >
          <Check size={18} />
          Confirm & Export
        </button>
      </div>
    </div>
  );
};

const NudgeButton = ({ onClick, icon }: { onClick: () => void; icon: React.ReactNode }) => (
  <button
    onClick={onClick}
    className="w-10 h-10 flex items-center justify-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-xl hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm transition-all active:scale-90"
  >
    {icon}
  </button>
);
