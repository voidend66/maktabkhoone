import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Crop,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Check,
  X,
  Maximize2,
  BookOpen,
  Square,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onConfirmCrop: (croppedFile: File, croppedDataUrl: string) => void;
  aspectRatio?: '3:4' | '1:1' | '4:3' | 'free';
  title?: string;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onConfirmCrop,
  aspectRatio: initialAspect = '3:4',
  title = 'تنظیم کادر و برش عکس جلد کتاب 📸'
}) => {
  const [aspect, setAspect] = useState<'3:4' | '1:1' | '4:3' | 'free'>(initialAspect);
  const [rotation, setRotation] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Crop box in container percentages (0 to 100)
  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 10,
    y: 10,
    width: 80,
    height: 80
  });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{
    isDragging: boolean;
    isResizing: boolean;
    handle: string | null;
    startX: number;
    startY: number;
    startCrop: { x: number; y: number; width: number; height: number };
  }>({
    isDragging: false,
    isResizing: false,
    handle: null,
    startX: 0,
    startY: 0,
    startCrop: { x: 10, y: 10, width: 80, height: 80 }
  });

  // Calculate default crop box when aspect ratio changes or image loads
  const resetCropBox = useCallback((aspectType: '3:4' | '1:1' | '4:3' | 'free') => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const containerW = rect.width || 400;
    const containerH = rect.height || 400;

    let targetRatio = 3 / 4; // width / height
    if (aspectType === '1:1') targetRatio = 1;
    else if (aspectType === '4:3') targetRatio = 4 / 3;
    else if (aspectType === 'free') {
      setCropBox({ x: 10, y: 10, width: 80, height: 80 });
      return;
    }

    // Convert ratio into container percentage
    const containerRatio = containerW / containerH;
    let boxW = 80;
    let boxH = 80;

    if (targetRatio < containerRatio) {
      // Taller box (like 3:4)
      boxH = 85;
      const pixelH = (boxH / 100) * containerH;
      const pixelW = pixelH * targetRatio;
      boxW = Math.min(90, (pixelW / containerW) * 100);
    } else {
      // Wider box
      boxW = 85;
      const pixelW = (boxW / 100) * containerW;
      const pixelH = pixelW / targetRatio;
      boxH = Math.min(90, (pixelH / containerH) * 100);
    }

    const boxX = (100 - boxW) / 2;
    const boxY = (100 - boxH) / 2;

    setCropBox({
      x: Math.max(2, Math.min(90, boxX)),
      y: Math.max(2, Math.min(90, boxY)),
      width: Math.max(10, Math.min(96, boxW)),
      height: Math.max(10, Math.min(96, boxH))
    });
  }, []);

  useEffect(() => {
    if (isOpen && imageSrc) {
      setRotation(0);
      setZoom(1);
      setTimeout(() => resetCropBox(aspect), 100);
    }
  }, [isOpen, imageSrc, aspect, resetCropBox]);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Dragging crop box
  const handlePointerDownBox = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      isDragging: true,
      isResizing: false,
      handle: null,
      startX: e.clientX,
      startY: e.clientY,
      startCrop: { ...cropBox }
    };
  };

  // Resizing crop box from handles
  const handlePointerDownHandle = (e: React.PointerEvent, handle: string) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      isDragging: false,
      isResizing: true,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startCrop: { ...cropBox }
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.isDragging && !dragRef.current.isResizing) return;
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - dragRef.current.startX) / rect.width) * 100;
    const deltaY = ((e.clientY - dragRef.current.startY) / rect.height) * 100;
    const { startCrop, handle } = dragRef.current;

    if (dragRef.current.isDragging) {
      let newX = startCrop.x + deltaX;
      let newY = startCrop.y + deltaY;

      // Bound within 0-100
      newX = Math.max(0, Math.min(100 - startCrop.width, newX));
      newY = Math.max(0, Math.min(100 - startCrop.height, newY));

      setCropBox((prev) => ({ ...prev, x: newX, y: newY }));
    } else if (dragRef.current.isResizing && handle) {
      let newX = startCrop.x;
      let newY = startCrop.y;
      let newW = startCrop.width;
      let newH = startCrop.height;

      if (handle.includes('e')) {
        newW = Math.max(15, Math.min(100 - startCrop.x, startCrop.width + deltaX));
      }
      if (handle.includes('s')) {
        newH = Math.max(15, Math.min(100 - startCrop.y, startCrop.height + deltaY));
      }
      if (handle.includes('w')) {
        const potentialW = startCrop.width - deltaX;
        if (potentialW >= 15 && startCrop.x + deltaX >= 0) {
          newX = startCrop.x + deltaX;
          newW = potentialW;
        }
      }
      if (handle.includes('n')) {
        const potentialH = startCrop.height - deltaY;
        if (potentialH >= 15 && startCrop.y + deltaY >= 0) {
          newY = startCrop.y + deltaY;
          newH = potentialH;
        }
      }

      // Enforce aspect ratio if locked
      if (aspect !== 'free') {
        const targetRatio = aspect === '3:4' ? 3 / 4 : aspect === '1:1' ? 1 : 4 / 3;
        const containerRatio = rect.width / rect.height;
        // pixel width / pixel height = targetRatio => (newW * rect.width) / (newH * rect.height) = targetRatio
        if (handle.includes('e') || handle.includes('w')) {
          const pixelW = (newW / 100) * rect.width;
          const pixelH = pixelW / targetRatio;
          newH = Math.min(100 - newY, (pixelH / rect.height) * 100);
        } else {
          const pixelH = (newH / 100) * rect.height;
          const pixelW = pixelH * targetRatio;
          newW = Math.min(100 - newX, (pixelW / rect.width) * 100);
        }
      }

      setCropBox({
        x: Math.max(0, newX),
        y: Math.max(0, newY),
        width: Math.min(100 - newX, newW),
        height: Math.min(100 - newY, newH)
      });
    }
  };

  const handlePointerUp = () => {
    dragRef.current.isDragging = false;
    dragRef.current.isResizing = false;
    dragRef.current.handle = null;
  };

  // Perform crisp Canvas Crop and export as high-res File
  const handleConfirm = async () => {
    if (!imageSrc || !imageRef.current || !containerRef.current) return;
    setIsProcessing(true);

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageSrc;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // 1. Create offscreen canvas for transformed source image (rotated + zoom)
      const isRotated90 = rotation === 90 || rotation === 270;
      const naturalW = img.naturalWidth || img.width;
      const naturalH = img.naturalHeight || img.height;

      const srcCanvas = document.createElement('canvas');
      srcCanvas.width = isRotated90 ? naturalH : naturalW;
      srcCanvas.height = isRotated90 ? naturalW : naturalH;
      const sCtx = srcCanvas.getContext('2d');
      if (!sCtx) throw new Error('Canvas context failure');

      sCtx.save();
      sCtx.translate(srcCanvas.width / 2, srcCanvas.height / 2);
      sCtx.rotate((rotation * Math.PI) / 180);
      sCtx.drawImage(img, -naturalW / 2, -naturalH / 2, naturalW, naturalH);
      sCtx.restore();

      // 2. Map container percentage crop coordinates into srcCanvas pixels
      const containerRect = containerRef.current.getBoundingClientRect();
      const imgDisplayRect = imageRef.current.getBoundingClientRect();

      // Position of displayed image inside container
      const imgLeftOffset = imgDisplayRect.left - containerRect.left;
      const imgTopOffset = imgDisplayRect.top - containerRect.top;
      const imgDisplayW = imgDisplayRect.width;
      const imgDisplayH = imgDisplayRect.height;

      // Crop box in container pixels
      const cropPixelX = (cropBox.x / 100) * containerRect.width;
      const cropPixelY = (cropBox.y / 100) * containerRect.height;
      const cropPixelW = (cropBox.width / 100) * containerRect.width;
      const cropPixelH = (cropBox.height / 100) * containerRect.height;

      // Relative to displayed image
      const relX = Math.max(0, cropPixelX - imgLeftOffset);
      const relY = Math.max(0, cropPixelY - imgTopOffset);
      const relW = Math.min(cropPixelW, imgDisplayW - relX);
      const relH = Math.min(cropPixelH, imgDisplayH - relY);

      // Convert to srcCanvas natural pixels
      const scaleX = srcCanvas.width / (imgDisplayW / zoom);
      const scaleY = srcCanvas.height / (imgDisplayH / zoom);

      // Account for zoom centered expansion
      const zoomOffsetSrcX = (srcCanvas.width * (1 - 1 / zoom)) / 2;
      const zoomOffsetSrcY = (srcCanvas.height * (1 - 1 / zoom)) / 2;

      const finalSrcX = Math.max(0, (relX / imgDisplayW) * (srcCanvas.width / zoom) + zoomOffsetSrcX);
      const finalSrcY = Math.max(0, (relY / imgDisplayH) * (srcCanvas.height / zoom) + zoomOffsetSrcY);
      const finalSrcW = Math.min(srcCanvas.width - finalSrcX, (relW / imgDisplayW) * (srcCanvas.width / zoom));
      const finalSrcH = Math.min(srcCanvas.height - finalSrcY, (relH / imgDisplayH) * (srcCanvas.height / zoom));

      // 3. Destination canvas
      const destCanvas = document.createElement('canvas');
      const outputW = Math.max(300, Math.round(finalSrcW));
      const outputH = Math.max(300, Math.round(finalSrcH));
      destCanvas.width = outputW;
      destCanvas.height = outputH;

      const dCtx = destCanvas.getContext('2d');
      if (!dCtx) throw new Error('Dest context failure');

      dCtx.imageSmoothingEnabled = true;
      dCtx.imageSmoothingQuality = 'high';
      dCtx.drawImage(
        srcCanvas,
        finalSrcX,
        finalSrcY,
        finalSrcW,
        finalSrcH,
        0,
        0,
        outputW,
        outputH
      );

      const croppedDataUrl = destCanvas.toDataURL('image/jpeg', 0.94);

      // Convert to File
      const arr = croppedDataUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const croppedFile = new File([u8arr], `cropped_book_cover_${Date.now()}.jpg`, { type: mime });

      onConfirmCrop(croppedFile, croppedDataUrl);
      onClose();
    } catch (err) {
      console.error('Error during image crop:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-800 flex flex-col text-white my-auto">
        {/* Header */}
        <div className="p-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
              <Crop className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">{title}</h3>
              <p className="text-[11px] text-slate-400">
                کادر را روی جلد کتاب تنظیم کنید و گوشه‌ها را بکشید تا عکس دقیقاً اندازه شود.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Aspect Ratio Presets Bar */}
        <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-xs">
          <span className="text-slate-400 font-bold text-[11px] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>نسبت کادر:</span>
          </span>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setAspect('3:4');
                resetCropBox('3:4');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition ${
                aspect === '3:4'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>۳:۴ (استاندارد جلد کتاب)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAspect('1:1');
                resetCropBox('1:1');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition ${
                aspect === '1:1'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Square className="w-3.5 h-3.5" />
              <span>۱:۱ (مربع)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAspect('4:3');
                resetCropBox('4:3');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition ${
                aspect === '4:3'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span>۴:۳ (افقی)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAspect('free');
                resetCropBox('free');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition ${
                aspect === 'free'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>آزاد</span>
            </button>
          </div>
        </div>

        {/* Cropper Viewport */}
        <div
          ref={containerRef}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative w-full aspect-[4/3] sm:aspect-[16/11] bg-slate-950 flex items-center justify-center overflow-hidden select-none touch-none cursor-crosshair"
        >
          {/* Base Image */}
          <div
            className="w-full h-full flex items-center justify-center transition-transform duration-200"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`
            }}
          >
            <img
              ref={imageRef}
              src={imageSrc}
              alt="کاور برای برش"
              draggable={false}
              className="max-w-full max-h-full object-contain pointer-events-none"
            />
          </div>

          {/* Dark Overlay outside crop area */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Top */}
            <div
              className="absolute top-0 inset-x-0 bg-black/65 backdrop-blur-[0.5px]"
              style={{ height: `${cropBox.y}%` }}
            />
            {/* Bottom */}
            <div
              className="absolute bottom-0 inset-x-0 bg-black/65 backdrop-blur-[0.5px]"
              style={{ height: `${100 - (cropBox.y + cropBox.height)}%` }}
            />
            {/* Left */}
            <div
              className="absolute bg-black/65 backdrop-blur-[0.5px]"
              style={{
                top: `${cropBox.y}%`,
                height: `${cropBox.height}%`,
                left: 0,
                width: `${cropBox.x}%`
              }}
            />
            {/* Right */}
            <div
              className="absolute bg-black/65 backdrop-blur-[0.5px]"
              style={{
                top: `${cropBox.y}%`,
                height: `${cropBox.height}%`,
                right: 0,
                width: `${100 - (cropBox.x + cropBox.width)}%`
              }}
            />
          </div>

          {/* Active Interactive Crop Box */}
          <div
            onPointerDown={handlePointerDownBox}
            style={{
              left: `${cropBox.x}%`,
              top: `${cropBox.y}%`,
              width: `${cropBox.width}%`,
              height: `${cropBox.height}%`
            }}
            className="absolute border-2 border-emerald-400 shadow-[0_0_0_1px_rgba(0,0,0,0.5)] cursor-move select-none"
          >
            {/* Grid 3x3 lines */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
              <div className="border-r border-b border-emerald-300/60" />
              <div className="border-r border-b border-emerald-300/60" />
              <div className="border-b border-emerald-300/60" />
              <div className="border-r border-b border-emerald-300/60" />
              <div className="border-r border-b border-emerald-300/60" />
              <div className="border-b border-emerald-300/60" />
              <div className="border-r border-emerald-300/60" />
              <div className="border-r border-emerald-300/60" />
              <div />
            </div>

            {/* Corner Handles */}
            <div
              onPointerDown={(e) => handlePointerDownHandle(e, 'nw')}
              className="absolute -top-2 -left-2 w-5 h-5 bg-emerald-400 border-2 border-slate-900 rounded-sm cursor-nwse-resize shadow-md"
            />
            <div
              onPointerDown={(e) => handlePointerDownHandle(e, 'ne')}
              className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-400 border-2 border-slate-900 rounded-sm cursor-nesw-resize shadow-md"
            />
            <div
              onPointerDown={(e) => handlePointerDownHandle(e, 'sw')}
              className="absolute -bottom-2 -left-2 w-5 h-5 bg-emerald-400 border-2 border-slate-900 rounded-sm cursor-nesw-resize shadow-md"
            />
            <div
              onPointerDown={(e) => handlePointerDownHandle(e, 'se')}
              className="absolute -bottom-2 -right-2 w-5 h-5 bg-emerald-400 border-2 border-slate-900 rounded-sm cursor-nwse-resize shadow-md"
            />

            {/* Center Label */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-80">
              <span className="bg-slate-950/70 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs border border-emerald-500/30">
                {aspect === '3:4' ? 'جلد استاندارد ۳:۴' : aspect === '1:1' ? 'کادر ۱:۱' : 'کادر انتخاب شده'}
              </span>
            </div>
          </div>
        </div>

        {/* Editing Tools (Rotate & Zoom) */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRotate}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 border border-slate-700 transition active:scale-95"
            >
              <RotateCw className="w-4 h-4 text-emerald-400" />
              <span>چرخش ۹۰°</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setRotation(0);
                resetCropBox(aspect);
              }}
              className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition"
              title="تنظیم مجدد کادر"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>ریست کادر</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <ZoomOut className="w-4 h-4 text-slate-400" />
            <input
              type="range"
              min="1"
              max="2.5"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-24 sm:w-32 accent-emerald-500 cursor-pointer"
            />
            <ZoomIn className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px] font-mono text-slate-300 min-w-[32px] text-left">
              {zoom.toFixed(1)}x
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
          >
            انصراف
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-lg shadow-emerald-900/30 flex items-center gap-2 transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isProcessing ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Check className="w-4 h-4 text-white" />
            )}
            <span>{isProcessing ? 'در حال اعمال برش...' : 'برش و ثبت نهایی جلد کتاب ✨'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
