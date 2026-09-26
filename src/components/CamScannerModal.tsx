import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  RotateCw,
  Crop,
  Check,
  ArrowRight,
  ArrowLeft,
  Maximize2,
  RefreshCw,
  Undo2,
  Sliders,
  Eye,
  ShieldCheck,
  CheckCircle2,
  Upload,
  BookOpen
} from 'lucide-react';
import {
  Point,
  CamScannerFilterType,
  warpPerspectiveCanvas,
  applyCamScannerFilter,
  rotateCanvas,
  getDefaultCropCorners
} from '../utils/camScannerEngine';
import { useApp } from '../context/AppContext';
import { Book } from '../types';

interface CamScannerModalProps {
  initialImageUrl: string;
  bookTitle?: string;
  originalCoverImage?: string;
  onClose: () => void;
  onSave: (scannedImageDataUrl: string, originalBackupUrl: string) => Promise<void>;
  onRevertToOriginal?: () => Promise<void>;
}

export const CamScannerModal: React.FC<CamScannerModalProps> = ({
  initialImageUrl,
  bookTitle = 'کتاب',
  originalCoverImage,
  onClose,
  onSave,
  onRevertToOriginal
}) => {
  const { books } = useApp();

  // Active step: 'crop' | 'filter'
  const [step, setStep] = useState<'crop' | 'filter'>('crop');

  // Active image source
  const [activeImageSrc, setActiveImageSrc] = useState<string>(initialImageUrl);
  const [currentBookTitle, setCurrentBookTitle] = useState<string>(bookTitle);

  // 4 corners in percentage [0..100] - [TL, TR, BR, BL]
  const [corners, setCorners] = useState<[Point, Point, Point, Point]>([
    { x: 10, y: 10 }, // TL
    { x: 90, y: 10 }, // TR
    { x: 90, y: 90 }, // BR
    { x: 10, y: 90 }  // BL
  ]);

  // Dragging state
  const [draggedCornerIdx, setDraggedCornerIdx] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Filter state
  const [selectedFilter, setSelectedFilter] = useState<CamScannerFilterType>('original');
  const [rotationAngle, setRotationAngle] = useState<number>(0);

  // Result canvases
  const [warpedCanvas, setWarpedCanvas] = useState<HTMLCanvasElement | null>(null);
  const [finalFilteredDataUrl, setFinalFilteredDataUrl] = useState<string>('');

  // Comparison slider position (percentage 0 to 100)
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false);

  // Loading / saving
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Selector dropdown toggle
  const [showBookSelector, setShowBookSelector] = useState<boolean>(false);

  // Refs
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const loupeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Reset to presets
  const handleSetCorners = (marginPercent: number) => {
    setCorners(getDefaultCropCorners(marginPercent));
  };

  // Handle user uploading a custom photo
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('لطفاً یک فایل تصویری معتبر انتخاب کنید.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCurrentBookTitle(`عکس جدید: ${file.name}`);
        setActiveImageSrc(dataUrl);
        setStep('crop');
        setCorners(getDefaultCropCorners(8));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Handle selecting a book from the library
  const handleSelectBook = (book: Book) => {
    setCurrentBookTitle(book.title);
    setActiveImageSrc(book.coverImage);
    setShowBookSelector(false);
    setStep('crop');
    setCorners(getDefaultCropCorners(8));
  };

  // Handle Corner Dragging (Pointer & Touch)
  const handlePointerDown = (index: number, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedCornerIdx(index);
    updateCornerPosition(index, e.clientX, e.clientY);
  };

  const updateCornerPosition = useCallback(
    (cornerIdx: number, clientX: number, clientY: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const rawX = ((clientX - rect.left) / rect.width) * 100;
      const rawY = ((clientY - rect.top) / rect.height) * 100;

      const clampedX = Math.max(0, Math.min(100, parseFloat(rawX.toFixed(2))));
      const clampedY = Math.max(0, Math.min(100, parseFloat(rawY.toFixed(2))));

      setCorners((prev) => {
        const next: [Point, Point, Point, Point] = [prev[0], prev[1], prev[2], prev[3]];
        next[cornerIdx] = { x: clampedX, y: clampedY };
        return next;
      });

      setMousePos({ x: clientX - rect.left, y: clientY - rect.top });
    },
    []
  );

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (draggedCornerIdx !== null) {
        updateCornerPosition(draggedCornerIdx, e.clientX, e.clientY);
      }
    };

    const handlePointerUp = () => {
      setDraggedCornerIdx(null);
      setMousePos(null);
    };

    if (draggedCornerIdx !== null) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [draggedCornerIdx, updateCornerPosition]);

  // Update Magnifier Loupe Canvas
  useEffect(() => {
    if (draggedCornerIdx === null || !imageRef.current || !loupeCanvasRef.current) return;
    const img = imageRef.current;
    const loupeCanvas = loupeCanvasRef.current;
    const ctx = loupeCanvas.getContext('2d');
    if (!ctx) return;

    const corner = corners[draggedCornerIdx];
    const sourceX = (corner.x / 100) * img.naturalWidth;
    const sourceY = (corner.y / 100) * img.naturalHeight;

    const zoom = 2.4;
    const loupeW = loupeCanvas.width;
    const loupeH = loupeCanvas.height;
    const cropW = loupeW / zoom;
    const cropH = loupeH / zoom;

    ctx.clearRect(0, 0, loupeW, loupeH);

    ctx.drawImage(
      img,
      sourceX - cropW / 2,
      sourceY - cropH / 2,
      cropW,
      cropH,
      0,
      0,
      loupeW,
      loupeH
    );

    // Crosshairs
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, loupeH / 2);
    ctx.lineTo(loupeW, loupeH / 2);
    ctx.moveTo(loupeW / 2, 0);
    ctx.lineTo(loupeW / 2, loupeH);
    ctx.stroke();

    // Center target circle
    ctx.beginPath();
    ctx.arc(loupeW / 2, loupeH / 2, 6, 0, Math.PI * 2);
    ctx.stroke();
  }, [corners, draggedCornerIdx]);

  // Crop Warp -> Filter Step
  const handleProceedToCrop = async () => {
    if (!imageRef.current) return;
    setIsProcessing(true);

    requestAnimationFrame(() => {
      try {
        const img = imageRef.current!;
        const warped = warpPerspectiveCanvas(
          img,
          img.naturalWidth,
          img.naturalHeight,
          corners,
          750,
          1000
        );
        setWarpedCanvas(warped);

        const filtered = applyCamScannerFilter(warped, selectedFilter);
        setFinalFilteredDataUrl(filtered.toDataURL('image/jpeg', 0.94));
        setStep('filter');
      } catch (err) {
        console.error('Perspective warp error:', err);
        alert('خطا در برش تصویر');
      } finally {
        setIsProcessing(false);
      }
    });
  };

  // Filter Selection
  const handleSelectFilter = (filterType: CamScannerFilterType) => {
    setSelectedFilter(filterType);
    if (!warpedCanvas) return;

    const clone = document.createElement('canvas');
    clone.width = warpedCanvas.width;
    clone.height = warpedCanvas.height;
    const ctx = clone.getContext('2d')!;
    ctx.drawImage(warpedCanvas, 0, 0);

    const filtered = applyCamScannerFilter(clone, filterType);
    setFinalFilteredDataUrl(filtered.toDataURL('image/jpeg', 0.94));
  };

  // Rotate Output
  const handleRotate = () => {
    if (!warpedCanvas) return;
    const rotated = rotateCanvas(warpedCanvas);
    setWarpedCanvas(rotated);
    setRotationAngle((prev) => (prev + 90) % 360);

    const filtered = applyCamScannerFilter(rotated, selectedFilter);
    setFinalFilteredDataUrl(filtered.toDataURL('image/jpeg', 0.94));
  };

  // Final Save
  const handleFinalSave = async () => {
    if (!finalFilteredDataUrl) return;
    setIsSaving(true);
    setSaveSuccessMsg(null);
    try {
      const originalBackup = originalCoverImage || initialImageUrl;
      await onSave(finalFilteredDataUrl, originalBackup);
      setSaveSuccessMsg('✓ جلد کتاب با موفقیت برش و ذخیره شد!');
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      alert(err.message || 'خطا در ذخیره تصویر');
    } finally {
      setIsSaving(false);
    }
  };

  // Revert to Original
  const handleRevert = async () => {
    if (!onRevertToOriginal) return;
    if (confirm('آیا مطمئن هستید که می‌خواهید جلد این کتاب را به عکس اولیه بازگردانید؟')) {
      setIsSaving(true);
      try {
        await onRevertToOriginal();
        onClose();
      } catch (err: any) {
        alert(err.message || 'خطا در بازنشانی تصویر');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const polygonPoints = corners.map((p) => `${p.x},${p.y}`).join(' ');
  const cornerLabels = ['بالا راست', 'بالا چپ', 'پایین چپ', 'پایین راست'];

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl text-white flex flex-col my-auto max-h-[96vh] overflow-hidden">
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <Crop className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                  <span>برش و تنظیم کادر جلد کتاب</span>
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs sm:max-w-md">
                تنظیم دستی ۴ گوشه برای کادربندی دقیق و حذف حواشی اضافی • {currentBookTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {originalCoverImage && onRevertToOriginal && (
              <button
                onClick={handleRevert}
                title="بازگشت به عکس اولیه"
                disabled={isSaving}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-xl transition cursor-pointer"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>بازگشت به عکس اولیه</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action & Tab Bar */}
        <div className="bg-slate-950/90 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2.5 text-xs shrink-0">
          {/* Stepper Tabs */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setStep('crop')}
              className={`px-3 py-1.5 rounded-xl font-black text-xs transition flex items-center gap-1.5 ${
                step === 'crop'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Crop className="w-3.5 h-3.5" />
              <span>۱. تنظیم کادر و برش</span>
            </button>

            <span className="text-slate-600">➔</span>

            <button
              onClick={() => {
                if (warpedCanvas) setStep('filter');
              }}
              disabled={!warpedCanvas}
              className={`px-3 py-1.5 rounded-xl font-black text-xs transition flex items-center gap-1.5 ${
                step === 'filter'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : !warpedCanvas
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>۲. پیش‌نمایش و ذخیره</span>
            </button>
          </div>

          {/* Quick Book Selection or Upload */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl font-black text-[11px] bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              title="آپلود عکس جدید برای برش"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-300" />
              <span>آپلود تصویر جدید</span>
            </button>

            {books && books.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowBookSelector(!showBookSelector)}
                  className="px-3 py-1.5 rounded-xl font-black text-[11px] bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>انتخاب سایر کتاب‌ها</span>
                </button>

                {showBookSelector && (
                  <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 w-72 max-h-64 overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 divide-y divide-slate-800">
                    <div className="text-[11px] font-black text-slate-400 p-1.5">
                      انتخاب جلد کتاب:
                    </div>
                    {books.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => handleSelectBook(b)}
                        className="w-full text-right p-2 hover:bg-slate-800 rounded-xl transition flex items-center gap-2.5 cursor-pointer group"
                      >
                        <img
                          src={b.coverImage}
                          alt={b.title}
                          className="w-8 h-10 object-cover rounded shadow-xs shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-200 group-hover:text-amber-400 truncate text-xs">
                            {b.title}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {b.author}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-3 sm:p-5 overflow-y-auto min-h-[380px] flex flex-col items-center justify-center">
          {/* STEP 1: Manual 4-Corner Crop */}
          {step === 'crop' && (
            <div className="w-full flex flex-col items-center space-y-3">
              <div className="text-xs text-slate-300 font-bold text-center">
                ۴ گوشه دایره‌ای را بکشید تا کادر دقیق کتاب را مشخص کنید:
              </div>

              {/* Interactive Image Container with Corner Pins & Polygon Overlay */}
              <div
                ref={containerRef}
                className="relative select-none touch-none rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700 max-w-lg w-full bg-slate-950 flex items-center justify-center"
                style={{ maxHeight: '52vh' }}
              >
                <img
                  ref={imageRef}
                  src={activeImageSrc}
                  alt="Original"
                  className="w-full h-auto max-h-[52vh] object-contain block pointer-events-none"
                  crossOrigin="anonymous"
                />

                {/* SVG Mask and Perspective Polygon */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <mask id="cropMask">
                      <rect width="100" height="100" fill="white" />
                      <polygon points={polygonPoints} fill="black" />
                    </mask>
                  </defs>

                  {/* Darkened overlay outside the crop area */}
                  <rect
                    width="100"
                    height="100"
                    fill="rgba(0, 0, 0, 0.65)"
                    mask="url(#cropMask)"
                  />

                  {/* Glowing connecting border lines */}
                  <polygon
                    points={polygonPoints}
                    fill="rgba(16, 185, 129, 0.1)"
                    stroke="#10b981"
                    strokeWidth="1.2"
                    strokeDasharray="2 1"
                    strokeLinejoin="round"
                  />

                  {/* Grid lines inside crop quad for alignment */}
                  <line
                    x1={(corners[0].x + corners[3].x) / 2}
                    y1={(corners[0].y + corners[3].y) / 2}
                    x2={(corners[1].x + corners[2].x) / 2}
                    y2={(corners[1].y + corners[2].y) / 2}
                    stroke="rgba(255, 255, 255, 0.25)"
                    strokeWidth="0.6"
                  />
                  <line
                    x1={(corners[0].x + corners[1].x) / 2}
                    y1={(corners[0].y + corners[1].y) / 2}
                    x2={(corners[3].x + corners[2].x) / 2}
                    y2={(corners[3].y + corners[2].y) / 2}
                    stroke="rgba(255, 255, 255, 0.25)"
                    strokeWidth="0.6"
                  />
                </svg>

                {/* 4 Interactive Corner Pins */}
                {corners.map((corner, idx) => (
                  <div
                    key={idx}
                    onPointerDown={(e) => handlePointerDown(idx, e)}
                    style={{
                      left: `${corner.x}%`,
                      top: `${corner.y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                    className="absolute z-30 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center cursor-move touch-none group"
                  >
                    <div
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 transition-all flex items-center justify-center shadow-lg ${
                        draggedCornerIdx === idx
                          ? 'bg-amber-400 border-white scale-125 ring-4 ring-amber-400/50'
                          : 'bg-emerald-500 border-white hover:scale-110 hover:bg-emerald-400 ring-2 ring-black/40'
                      }`}
                    >
                      <div className="w-1.5 h-1.5 bg-slate-950 rounded-full" />
                    </div>

                    <span className="absolute -bottom-4 text-[9px] font-black bg-slate-950/90 text-slate-300 px-1.5 py-0.5 rounded-md border border-slate-700 whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                      {cornerLabels[idx]}
                    </span>
                  </div>
                ))}

                {/* Precision Magnifier Loupe */}
                {draggedCornerIdx !== null && mousePos && (
                  <div
                    style={{
                      left: `${Math.min(
                        Math.max(mousePos.x, 70),
                        (containerRef.current?.clientWidth || 300) - 70
                      )}px`,
                      top: `${Math.max(mousePos.y - 85, 20)}px`,
                      transform: 'translate(-50%, -50%)'
                    }}
                    className="absolute z-40 w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-3 border-amber-400 shadow-2xl pointer-events-none bg-black ring-4 ring-black/60 flex items-center justify-center animate-in zoom-in-75 duration-100"
                  >
                    <canvas
                      ref={loupeCanvasRef}
                      width={128}
                      height={128}
                      className="w-full h-full block"
                    />
                    <span className="absolute bottom-1.5 text-[9px] font-black bg-black/80 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/40">
                      ذره‌بین ۲.۴x
                    </span>
                  </div>
                )}
              </div>

              {/* Preset Crop Frame Buttons */}
              <div className="w-full max-w-xl flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
                <button
                  type="button"
                  onClick={() => handleSetCorners(2)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>کادر کامل (۱۰۰٪)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSetCorners(8)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Crop className="w-3.5 h-3.5 text-amber-400" />
                  <span>کادر استاندارد (حاشیه ۸٪)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSetCorners(15)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Crop className="w-3.5 h-3.5 text-emerald-400" />
                  <span>کادر متمرکز (حاشیه ۱۵٪)</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Preview & Filter */}
          {step === 'filter' && (
            <div className="w-full max-w-xl flex flex-col items-center space-y-4">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-emerald-500/70 max-h-[48vh] bg-slate-950 flex items-center justify-center">
                {finalFilteredDataUrl ? (
                  <img
                    src={finalFilteredDataUrl}
                    alt="Cropped Preview"
                    className="max-h-[48vh] w-auto object-contain block shadow-inner"
                  />
                ) : (
                  <div className="p-12 text-center text-slate-400 text-xs">در حال پردازش...</div>
                )}
              </div>

              {/* Adjustment bar: rotate & filter */}
              <div className="w-full space-y-2">
                <div className="text-xs font-black text-slate-300 text-right flex items-center justify-between">
                  <span>تنظیمات تصویر برش‌خورده:</span>
                  <button
                    onClick={handleRotate}
                    className="px-2.5 py-1 text-[11px] font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1 transition cursor-pointer"
                  >
                    <RotateCw className="w-3 h-3 text-cyan-400" />
                    <span>چرخش ۹۰ درجه</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* Original */}
                  <button
                    type="button"
                    onClick={() => handleSelectFilter('original')}
                    className={`p-2.5 rounded-xl border text-right transition flex flex-col gap-0.5 cursor-pointer ${
                      selectedFilter === 'original'
                        ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-md ring-2 ring-emerald-400/30'
                        : 'bg-slate-850 hover:bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">🎨 رنگ اصلی</span>
                      {selectedFilter === 'original' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <span className="text-[10px] text-slate-400">بدون تغییر رنگ</span>
                  </button>

                  {/* Magic Color */}
                  <button
                    type="button"
                    onClick={() => handleSelectFilter('magic_color')}
                    className={`p-2.5 rounded-xl border text-right transition flex flex-col gap-0.5 cursor-pointer ${
                      selectedFilter === 'magic_color'
                        ? 'bg-amber-500/20 border-amber-400 text-white shadow-md ring-2 ring-amber-400/30'
                        : 'bg-slate-850 hover:bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">🪄 بهبود رنگ</span>
                      {selectedFilter === 'magic_color' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                    <span className="text-[10px] text-slate-400">کنتراست و وضوح</span>
                  </button>

                  {/* Clear Document */}
                  <button
                    type="button"
                    onClick={() => handleSelectFilter('clear_document')}
                    className={`p-2.5 rounded-xl border text-right transition flex flex-col gap-0.5 cursor-pointer ${
                      selectedFilter === 'clear_document'
                        ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-md ring-2 ring-cyan-400/30'
                        : 'bg-slate-850 hover:bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">📄 شفاف‌سازی</span>
                      {selectedFilter === 'clear_document' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </div>
                    <span className="text-[10px] text-slate-400">روشن‌تر کردن کاغذ</span>
                  </button>

                  {/* B&W */}
                  <button
                    type="button"
                    onClick={() => handleSelectFilter('high_contrast_bw')}
                    className={`p-2.5 rounded-xl border text-right transition flex flex-col gap-0.5 cursor-pointer ${
                      selectedFilter === 'high_contrast_bw'
                        ? 'bg-slate-500/20 border-slate-300 text-white shadow-md ring-2 ring-slate-400/30'
                        : 'bg-slate-850 hover:bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">🖤 سیاه و سفید</span>
                      {selectedFilter === 'high_contrast_bw' && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span className="text-[10px] text-slate-400">چاپ سیاه‌سفید</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {step === 'crop' && (
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                انصراف
              </button>
            )}

            {step === 'filter' && (
              <button
                type="button"
                onClick={() => setStep('crop')}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>بازگشت به کادربندی</span>
              </button>
            )}
          </div>

          {saveSuccessMsg && (
            <div className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {step === 'crop' && (
              <button
                type="button"
                onClick={handleProceedToCrop}
                disabled={isProcessing}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-600 hover:to-emerald-600 active:scale-95 disabled:opacity-50 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>در حال برش...</span>
                  </>
                ) : (
                  <>
                    <span>مرحله بعد: پیش‌نمایش برش</span>
                    <ArrowLeft className="w-4 h-4" />
                  </>
                )}
              </button>
            )}

            {step === 'filter' && (
              <button
                type="button"
                onClick={handleFinalSave}
                disabled={isSaving}
                className="w-full sm:w-auto px-7 py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:to-teal-600 active:scale-95 disabled:opacity-50 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>در حال ذخیره جلد کتاب...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>ذخیره و جایگزینی جلد کتاب</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
