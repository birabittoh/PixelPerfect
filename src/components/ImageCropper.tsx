import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Check, Maximize2, Move, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Square, ZoomIn, Plus, Minus, MoveHorizontal, MoveVertical } from 'lucide-react';
import { CropArea } from '../types';
import { identifyBackgroundColor, applyTransparency } from '../utils/imageProcessor';

interface ImageCropperProps {
  imageUrl: string;
  onCrop: (crop: CropArea) => void;
  onCancel: () => void;
  removeBg?: boolean;
}

type DragMode = 'move' | 'resize-tl' | 'resize-br' | null;

export const ImageCropper: React.FC<ImageCropperProps> = ({ imageUrl, onCrop, onCancel, removeBg }) => {
  const [imgDims, setImgDims] = useState({ width: 0, height: 0 });
  const [crop, setCrop] = useState<CropArea>({ x: 0, y: 0, width: 0, height: 0 });
  const repeatTimeoutRef = useRef<number | null>(null);
  const repeatIntervalRef = useRef<number | null>(null);
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialCrop, setInitialCrop] = useState<CropArea | null>(null);

  const imgRef = useRef<HTMLImageElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const magnifierCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImgDims({ width: img.width, height: img.height });
      setCrop({ x: 0, y: 0, width: img.width, height: img.height });
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Update magnifier and overlay canvas
  useEffect(() => {
    if (!magnifierCanvasRef.current || !imgRef.current || imgDims.width === 0) return;
    const canvas = magnifierCanvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const overlayCanvas = overlayCanvasRef.current;
    const overlayCtx = overlayCanvas?.getContext('2d', { willReadFrequently: true });

    const img = new Image();
    img.onload = () => {
      // 1. Process for magnifier
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const scale = Math.min(canvas.width / crop.width, canvas.height / crop.height);
      const drawWidth = crop.width * scale;
      const drawHeight = crop.height * scale;
      const offsetX = (canvas.width - drawWidth) / 2;
      const offsetY = (canvas.height - drawHeight) / 2;

      // Create a temporary canvas for the crop to apply transparency
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = crop.width;
      tempCanvas.height = crop.height;
      const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });

      if (tempCtx) {
        tempCtx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
        if (removeBg) {
          const bgColor = identifyBackgroundColor(tempCtx, crop.width, crop.height);
          if (bgColor) {
            applyTransparency(tempCtx, crop.width, crop.height, bgColor);
          }
        }
        ctx.drawImage(tempCanvas, 0, 0, crop.width, crop.height, offsetX, offsetY, drawWidth, drawHeight);
      }

      // 2. Process for overlay if it exists
      if (overlayCanvas && overlayCtx) {
        overlayCanvas.width = crop.width;
        overlayCanvas.height = crop.height;
        overlayCtx.clearRect(0, 0, crop.width, crop.height);
        overlayCtx.drawImage(tempCanvas, 0, 0);
      }

      if (scale > 8) {
        const step = scale;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 0.5;
        for (let x = offsetX; x <= offsetX + drawWidth + 0.1; x += step) {
          ctx.beginPath();
          ctx.moveTo(x, offsetY);
          ctx.lineTo(x, offsetY + drawHeight);
          ctx.stroke();
        }
        for (let y = offsetY; y <= offsetY + drawHeight + 0.1; y += step) {
          ctx.beginPath();
          ctx.moveTo(offsetX, y);
          ctx.lineTo(offsetX + drawWidth, y);
          ctx.stroke();
        }
      }
    };
    img.src = imageUrl;
  }, [crop, imgDims, imageUrl, removeBg]);

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
      newCrop.width = Math.max(1, Math.min(Math.round(initialCrop.width + dx), imgDims.width - initialCrop.x));
      newCrop.height = Math.max(1, Math.min(Math.round(initialCrop.height + dy), imgDims.height - initialCrop.y));
    } else if (dragMode === 'resize-tl') {
      const dx_adj = Math.max(-initialCrop.x, Math.min(Math.round(dx), initialCrop.width - 1));
      const dy_adj = Math.max(-initialCrop.y, Math.min(Math.round(dy), initialCrop.height - 1));
      newCrop.x = initialCrop.x + dx_adj;
      newCrop.y = initialCrop.y + dy_adj;
      newCrop.width = initialCrop.width - dx_adj;
      newCrop.height = initialCrop.height - dy_adj;
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

  const adjust = useCallback((dx: number, dy: number, dw: number, dh: number) => {
    setCrop(prev => {
      const newWidth = Math.max(1, Math.min(imgDims.width - prev.x, prev.width + dw));
      const newHeight = Math.max(1, Math.min(imgDims.height - prev.y, prev.height + dh));
      return {
        x: Math.max(0, Math.min(imgDims.width - newWidth, prev.x + dx)),
        y: Math.max(0, Math.min(imgDims.height - newHeight, prev.y + dy)),
        width: newWidth,
        height: newHeight
      };
    });
  }, [imgDims]);

  const stopRepeating = useCallback(() => {
    if (repeatTimeoutRef.current) window.clearTimeout(repeatTimeoutRef.current);
    if (repeatIntervalRef.current) window.clearInterval(repeatIntervalRef.current);
    repeatTimeoutRef.current = null;
    repeatIntervalRef.current = null;
  }, []);

  const startRepeating = useCallback((dx: number, dy: number, dw: number, dh: number) => {
    stopRepeating();
    adjust(dx, dy, dw, dh);

    repeatTimeoutRef.current = window.setTimeout(() => {
      repeatIntervalRef.current = window.setInterval(() => {
        adjust(dx, dy, dw, dh);
      }, 50);
    }, 400);
  }, [adjust, stopRepeating]);

  useEffect(() => {
    return () => stopRepeating();
  }, [stopRepeating]);

  const makeSquare = () => {
    const size = Math.min(crop.width, crop.height);
    setCrop(prev => ({
      ...prev,
      width: size,
      height: size
    }));
  };

  const fullImage = () => {
    setCrop({ x: 0, y: 0, width: imgDims.width, height: imgDims.height });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-zinc-950/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[98vh]">
        <div className="flex-1 flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-zinc-100 dark:divide-zinc-800 min-h-0">
          {/* Main Selection Area */}
          <div className="flex-1 p-4 sm:p-6 flex items-center justify-center bg-zinc-50 dark:bg-zinc-950/30 overflow-hidden">
            <div className="relative inline-block touch-none select-none shadow-2xl rounded-lg overflow-hidden">
              <img
                ref={imgRef}
                src={imageUrl}
                alt="Crop target"
                className="max-w-full max-h-[40vh] lg:max-h-[60vh] block pointer-events-none"
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
                  <canvas
                    ref={overlayCanvasRef}
                    className="absolute w-full h-full"
                    style={{ imageRendering: 'pixelated' }}
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
          <div className="w-full lg:w-80 bg-white dark:bg-zinc-900 p-3 sm:p-6 flex flex-col gap-3 overflow-hidden shrink-0">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                <div className="flex items-center gap-1.5">
                  <ZoomIn size={14} className="text-indigo-500" />
                  Preview
                </div>
                <div className="font-mono text-[10px] text-zinc-400">
                  {crop.width}x{crop.height} px
                </div>
              </div>
              <div className="relative aspect-square bg-zinc-100 dark:bg-zinc-950 rounded-xl sm:rounded-2xl overflow-hidden border-2 border-zinc-200 dark:border-zinc-800 shadow-inner flex items-center justify-center group">
                <canvas
                  ref={magnifierCanvasRef}
                  width={256}
                  height={256}
                  className="w-full h-full object-contain"
                  style={{ imageRendering: 'pixelated' }}
                />

                {/* Overlay Controls */}
                <div className="absolute inset-0 grid grid-cols-5 grid-rows-5 gap-1 p-1.5 pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity">
                  {/* Row 1: Resize Horiz-, Resize Vert-, Move Up, Resize Vert+, Resize Horiz+ */}
                  <div className="col-start-1 row-start-1">
                    <ControlButton onStart={() => startRepeating(0, 0, -1, 0)} onStop={stopRepeating} icon={<div className="flex flex-col items-center"><MoveHorizontal size={10}/><Minus size={10}/></div>} small />
                  </div>
                  <div className="col-start-2 row-start-1">
                    <ControlButton onStart={() => startRepeating(0, 0, 0, -1)} onStop={stopRepeating} icon={<div className="flex flex-col items-center"><MoveVertical size={10}/><Minus size={10}/></div>} small />
                  </div>
                  <div className="col-start-3 row-start-1">
                    <ControlButton onStart={() => startRepeating(0, -1, 0, 0)} onStop={stopRepeating} icon={<ChevronUp size={16} />} small />
                  </div>
                  <div className="col-start-4 row-start-1">
                    <ControlButton onStart={() => startRepeating(0, 0, 0, 1)} onStop={stopRepeating} icon={<div className="flex flex-col items-center"><MoveVertical size={10}/><Plus size={10}/></div>} small />
                  </div>
                  <div className="col-start-5 row-start-1">
                    <ControlButton onStart={() => startRepeating(0, 0, 1, 0)} onStop={stopRepeating} icon={<div className="flex flex-col items-center"><MoveHorizontal size={10}/><Plus size={10}/></div>} small />
                  </div>

                  {/* Row 3: Move Left, Resize Both-, Square/Full, Resize Both+, Move Right */}
                  <div className="col-start-1 row-start-3">
                    <ControlButton onStart={() => startRepeating(-1, 0, 0, 0)} onStop={stopRepeating} icon={<ChevronLeft size={16} />} small />
                  </div>
                  <div className="col-start-2 row-start-3">
                    <ControlButton onStart={() => startRepeating(0, 0, -1, -1)} onStop={stopRepeating} icon={<div className="flex flex-col items-center"><Square size={10}/><Minus size={10}/></div>} small />
                  </div>
                  <div className="col-start-3 row-start-3 flex flex-col gap-1">
                     <button onClick={makeSquare} title="Square" className="w-full h-1/2 flex items-center justify-center bg-white/60 dark:bg-zinc-800/60 border border-zinc-200/30 dark:border-zinc-700/30 text-zinc-600 dark:text-zinc-400 rounded-sm sm:rounded-md hover:bg-white dark:hover:bg-zinc-700 hover:text-indigo-600 transition-all active:scale-95 pointer-events-auto shadow-sm">
                        <Square size={10} />
                     </button>
                     <button onClick={fullImage} title="Full Image" className="w-full h-1/2 flex items-center justify-center bg-white/60 dark:bg-zinc-800/60 border border-zinc-200/30 dark:border-zinc-700/30 text-zinc-600 dark:text-zinc-400 rounded-sm sm:rounded-md hover:bg-white dark:hover:bg-zinc-700 hover:text-indigo-600 transition-all active:scale-95 pointer-events-auto shadow-sm">
                        <Maximize2 size={10} />
                     </button>
                  </div>
                  <div className="col-start-4 row-start-3">
                    <ControlButton onStart={() => startRepeating(0, 0, 1, 1)} onStop={stopRepeating} icon={<div className="flex flex-col items-center"><Square size={10}/><Plus size={10}/></div>} small />
                  </div>
                  <div className="col-start-5 row-start-3">
                    <ControlButton onStart={() => startRepeating(1, 0, 0, 0)} onStop={stopRepeating} icon={<ChevronRight size={16} />} small />
                  </div>

                  {/* Row 5: Move Down */}
                  <div className="col-start-3 row-start-5">
                    <ControlButton onStart={() => startRepeating(0, 1, 0, 0)} onStop={stopRepeating} icon={<ChevronDown size={16} />} small />
                  </div>
                </div>
              </div>
              <div className="flex justify-between text-[10px] font-mono text-zinc-400 uppercase tracking-wider px-1">
                <span>X: {crop.x} Y: {crop.y}</span>
                <span>{imgDims.width}x{imgDims.height} px</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
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
            Export
          </button>
        </div>
      </div>
    </div>
  );
};

const ControlButton = ({ onStart, onStop, icon, small }: { onStart: () => void; onStop: () => void; icon: React.ReactNode, small?: boolean }) => (
  <button
    onMouseDown={(e) => { e.preventDefault(); onStart(); }}
    onMouseUp={(e) => { e.preventDefault(); onStop(); }}
    onMouseLeave={(e) => { e.preventDefault(); onStop(); }}
    onTouchStart={(e) => { e.preventDefault(); onStart(); }}
    onTouchEnd={(e) => { e.preventDefault(); onStop(); }}
    className={`${small ? 'w-full h-full' : 'w-10 h-10'} flex items-center justify-center bg-white/60 dark:bg-zinc-800/60 border border-zinc-200/30 dark:border-zinc-700/30 text-zinc-600 dark:text-zinc-400 rounded-sm sm:rounded-lg hover:bg-white dark:hover:bg-zinc-700 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm transition-all active:scale-90 touch-none select-none pointer-events-auto`}
  >
    {icon}
  </button>
);
