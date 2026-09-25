import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Sparkles,
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
  Layers,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  Image as ImageIcon
} from 'lucide-react';
import {
  Point,
  CamScannerFilterType,
  warpPerspectiveCanvas,
  applyCamScannerFilter,
  rotateCanvas
} from '../utils/camScannerEngine';
import { CAMSCANNER_DEMO_SAMPLES, DemoSample } from '../utils/camScannerDemoSamples';

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
  // Active step: 'crop' (4-corner perspective) | 'filter' (CamScanner magic filters) | 'review' (Before / After)
  const [step, setStep] = useState<'crop' | 'filter' | 'review'>('crop');

  // Active image source (supports switching to demo samples)
  const [activeImageSrc, setActiveImageSrc] = useState<string>(initialImageUrl);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [activeDemoSample, setActiveDemoSample] = useState<DemoSample | null>(null);

  // 4 corners in percentage [0..100]
  const [corners, setCorners] = useState<[Point, Point, Point, Point]>([
    { x: 15, y: 15 }, // TL
    { x: 85, y: 15 }, // TR
    { x: 85, y: 85 }, // BR
    { x: 15, y: 85 }  // BL
  ]);

  // Dragging state
  const [draggedCornerIdx, setDraggedCornerIdx] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Filter state
  const [selectedFilter, setSelectedFilter] = useState<CamScannerFilterType>('magic_color');
  const [rotationAngle, setRotationAngle] = useState<number>(0); // 0, 90, 180, 270

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

  // Refs
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const loupeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize demo or original image
  useEffect(() => {
    setActiveImageSrc(initialImageUrl);
  }, [initialImageUrl]);

  // Load image and set default corners
  const handleImageLoaded = () => {
    if (activeDemoSample) {
      setCorners([...activeDemoSample.defaultCorners]);
    } else {
      // Default inset for real photos
      setCorners([
        { x: 14, y: 12 },
        { x: 86, y: 12 },
        { x: 84, y: 88 },
        { x: 16, y: 88 }
      ]);
    }
  };

  // Switch to a demo sample
  const handleSelectDemoSample = (sample: DemoSample) => {
    setIsDemoMode(true);
    setActiveDemoSample(sample);
    const dataUrl = sample.getImageDataUrl();
    setActiveImageSrc(dataUrl);
    setCorners([...sample.defaultCorners]);
    setStep('crop');
  };

  // Switch back to actual book photo
  const handleSelectActualBook = () => {
    setIsDemoMode(false);
    setActiveDemoSample(null);
    setActiveImageSrc(initialImageUrl);
    setCorners([
      { x: 14, y: 12 },
      { x: 86, y: 12 },
      { x: 84, y: 88 },
      { x: 16, y: 88 }
    ]);
    setStep('crop');
  };

  // Reset corners to full frame
  const handleResetFullFrame = () => {
    setCorners([
      { x: 4, y: 4 },
      { x: 96, y: 4 },
      { x: 96, y: 96 },
      { x: 4, y: 96 }
    ]);
  };

  // Smart edge detect (reset to default book quad)
  const handleAutoDetect = () => {
    if (activeDemoSample) {
      setCorners([...activeDemoSample.defaultCorners]);
    } else {
      setCorners([
        { x: 16, y: 14 },
        { x: 84, y: 16 },
        { x: 82, y: 86 },
        { x: 18, y: 84 }
      ]);
    }
  };

  // Handle Corner Dragging (Mouse & Touch)
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

    // Draw zoomed area from image
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

    // Draw precision crosshairs
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    // Horizontal
    ctx.moveTo(0, loupeH / 2);
    ctx.lineTo(loupeW, loupeH / 2);
    // Vertical
    ctx.moveTo(loupeW / 2, 0);
    ctx.lineTo(loupeW / 2, loupeH);
    ctx.stroke();

    // Center target circle
    ctx.beginPath();
    ctx.arc(loupeW / 2, loupeH / 2, 6, 0, Math.PI * 2);
    ctx.stroke();
  }, [corners, draggedCornerIdx]);

  // Process Perspective Warp -> Go to Filter Step
  const handleProceedToFilters = async () => {
    if (!imageRef.current) return;
    setIsProcessing(true);

    // Use requestAnimationFrame to let UI render loading spinner
    requestAnimationFrame(() => {
      try {
        const img = imageRef.current!;
        const warped = warpPerspectiveCanvas(
          img,
          img.naturalWidth,
          img.naturalHeight,
          corners,
          750,
          1000 // Standard 3:4 book aspect ratio
        );
        setWarpedCanvas(warped);

        // Apply initial filter (Magic Color)
        const filtered = applyCamScannerFilter(warped, selectedFilter);
        setFinalFilteredDataUrl(filtered.toDataURL('image/jpeg', 0.94));
        setStep('filter');
      } catch (err) {
        console.error('Perspective warp error:', err);
        alert('خطا در تصحیح پرسپکتیو تصویر');
      } finally {
        setIsProcessing(false);
      }
    });
  };

  // Apply Filter to Warped Canvas
  const handleSelectFilter = (filterType: CamScannerFilterType) => {
    setSelectedFilter(filterType);
    if (!warpedCanvas) return;

    // Create a clone canvas so we don't destructively overwrite the base warped canvas
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

  // Handle Save
  const handleFinalSave = async () => {
    if (!finalFilteredDataUrl) return;
    setIsSaving(true);
    setSaveSuccessMsg(null);
    try {
      // The originalBackup is the original unedited image
      const originalBackup = originalCoverImage || initialImageUrl;
      await onSave(finalFilteredDataUrl, originalBackup);
      setSaveSuccessMsg('✓ جلد کتاب با موفقیت اسکن، اصلاح و ذخیره شد!');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'خطا در ذخیره تصویر');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Revert to Original
  const handleRevert = async () => {
    if (!onRevertToOriginal) return;
    if (confirm('آیا مطمئن هستید که می‌خواهید جلد این کتاب را به عکس اولیه و بدون اصلاح دانش‌آموز برگردانید؟')) {
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

  // Polygon SVG points string: "x1,y1 x2,y2 x3,y3 x4,y4"
  const polygonPoints = corners.map((p) => `${p.x},${p.y}`).join(' ');

  // Corner labels
  const cornerLabels = ['بالا راست', 'بالا چپ', 'پایین چپ', 'پایین راست'];

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl text-white flex flex-col my-auto max-h-[96vh] overflow-hidden">
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-emerald-500 to-teal-400 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <Crop className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                  <span>اسکنر هوشمند جلد کتاب</span>
                  <span className="text-[11px] font-black bg-gradient-to-r from-amber-500 to-emerald-500 text-white px-2 py-0.5 rounded-full">
                    کم‌اسکنر / CamScanner
                  </span>
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs sm:max-w-md">
                برش پرسپکتیو ۴ نقطه‌ای و حذف فرش، کفپوش و حواشی نامناسب • کتاب: «{bookTitle}»
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {originalCoverImage && onRevertToOriginal && (
              <button
                onClick={handleRevert}
                title="بازگشت به عکس خام اولیه دانش‌آموز"
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

        {/* Step Indicator & Demo Switcher Bar */}
        <div className="bg-slate-950/70 border-b border-slate-800/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          {/* Stepper Tabs */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setStep('crop')}
              className={`px-3 py-1.5 rounded-xl font-black text-xs transition flex items-center gap-1.5 ${
                step === 'crop'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Crop className="w-3.5 h-3.5" />
              <span>۱. تنظیم ۴ گوشه کتاب</span>
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
              <Sliders className="w-3.5 h-3.5" />
              <span>۲. فیلترهای اسکنر</span>
            </button>

            <span className="text-slate-600">➔</span>

            <button
              onClick={() => {
                if (finalFilteredDataUrl) setStep('review');
              }}
              disabled={!finalFilteredDataUrl}
              className={`px-3 py-1.5 rounded-xl font-black text-xs transition flex items-center gap-1.5 ${
                step === 'review'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : !finalFilteredDataUrl
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>۳. مقایسه قبل و بعد</span>
            </button>
          </div>

          {/* Demo Samples Switcher (Explicitly requested by user) */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1 shrink-0">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>تست نمونه‌های دمو:</span>
            </span>

            <button
              onClick={handleSelectActualBook}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap cursor-pointer ${
                !isDemoMode
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              📖 کتاب واقعی سیستم
            </button>

            {CAMSCANNER_DEMO_SAMPLES.map((sample) => (
              <button
                key={sample.id}
                onClick={() => handleSelectDemoSample(sample)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap cursor-pointer ${
                  activeDemoSample?.id === sample.id
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title={sample.description}
              >
                {sample.id === 'sample_carpet' && '🛋️ کتاب روی فرش'}
                {sample.id === 'sample_floor' && '🪵 کتاب روی پارکت'}
                {sample.id === 'sample_desk' && '📝 کتاب روی میز'}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto min-h-[380px] flex flex-col items-center justify-center">
          {/* STEP 1: 4-Corner Interactive Perspective Crop */}
          {step === 'crop' && (
            <div className="w-full flex flex-col items-center space-y-4">
              {/* Guidance text */}
              <div className="w-full max-w-xl text-center text-xs text-slate-300 bg-slate-800/60 p-2.5 rounded-2xl border border-slate-700/60 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-amber-300 font-bold">
                  <HelpCircle className="w-4 h-4 shrink-0" />
                  <span>راهنما:</span>
                </span>
                <span className="text-[11px] sm:text-xs">
                  ۴ دایره گوشه را بکشید و دقیقاً روی ۴ راس جلد کتاب قرار دهید تا فرش و زمینه برش داده شوند.
                </span>
                <button
                  onClick={handleAutoDetect}
                  className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-black rounded-lg border border-amber-500/40 transition shrink-0 cursor-pointer"
                >
                  تشخیص هوشمند
                </button>
              </div>

              {/* Interactive Image Container with Corner Pins & Polygon Overlay */}
              <div
                ref={containerRef}
                className="relative select-none touch-none rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700 max-w-lg w-full bg-slate-950 flex items-center justify-center"
                style={{ maxHeight: '55vh' }}
              >
                <img
                  ref={imageRef}
                  src={activeImageSrc}
                  alt="Original"
                  onLoad={handleImageLoaded}
                  className="w-full h-auto max-h-[55vh] object-contain block pointer-events-none"
                  crossOrigin="anonymous"
                />

                {/* SVG Mask and Perspective Polygon */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <mask id="carpetMask">
                      {/* White reveals everything */}
                      <rect width="100" height="100" fill="white" />
                      {/* Black cuts out the book quad */}
                      <polygon points={polygonPoints} fill="black" />
                    </mask>
                  </defs>

                  {/* Darkened overlay outside the book polygon (hiding the carpet/floor) */}
                  <rect
                    width="100"
                    height="100"
                    fill="rgba(0, 0, 0, 0.72)"
                    mask="url(#carpetMask)"
                  />

                  {/* Glowing connecting border lines */}
                  <polygon
                    points={polygonPoints}
                    fill="rgba(16, 185, 129, 0.12)"
                    stroke="#10b981"
                    strokeWidth="1.2"
                    strokeDasharray="2 1"
                    strokeLinejoin="round"
                  />

                  {/* Cross grid lines inside book quad for alignment */}
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
                    className={`absolute z-30 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center cursor-move touch-none group`}
                  >
                    {/* Pulsing ring on active */}
                    <div
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 transition-all flex items-center justify-center shadow-lg ${
                        draggedCornerIdx === idx
                          ? 'bg-amber-400 border-white scale-125 ring-4 ring-amber-400/50'
                          : 'bg-emerald-500 border-white hover:scale-110 hover:bg-emerald-400 ring-2 ring-black/40'
                      }`}
                    >
                      <div className="w-1.5 h-1.5 bg-slate-950 rounded-full" />
                    </div>

                    {/* Corner index badge */}
                    <span className="absolute -bottom-4 text-[9px] font-black bg-slate-950/90 text-slate-300 px-1.5 py-0.5 rounded-md border border-slate-700 whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                      {cornerLabels[idx]}
                    </span>
                  </div>
                ))}

                {/* Floating Precision Magnifier Loupe */}
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

              {/* Crop Toolbar */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
                <button
                  type="button"
                  onClick={handleAutoDetect}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>تنظیم خودکار لبه‌ها</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetFullFrame}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>انتخاب کل تصویر</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Scanner Filters & Adjustments */}
          {step === 'filter' && (
            <div className="w-full max-w-xl flex flex-col items-center space-y-5">
              {/* Preview of unskewed flat rectangular book cover */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-emerald-500/70 max-h-[50vh] bg-slate-950 flex items-center justify-center">
                {finalFilteredDataUrl ? (
                  <img
                    src={finalFilteredDataUrl}
                    alt="Scanned Preview"
                    className="max-h-[50vh] w-auto object-contain block shadow-inner"
                  />
                ) : (
                  <div className="p-12 text-center text-slate-400 text-xs">در حال پردازش اسکن...</div>
                )}

                <div className="absolute top-2 right-2 px-2.5 py-1 bg-black/75 backdrop-blur-xs text-[10px] font-black rounded-lg border border-white/20 text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>پرسپکتیو صاف شد (بدون فرش/زمینه)</span>
                </div>
              </div>

              {/* Filter Selection Cards */}
              <div className="w-full space-y-2">
                <div className="text-xs font-black text-slate-300 text-right flex items-center justify-between">
                  <span>فیلتر بهینه‌سازی کم‌اسکنر را انتخاب کنید:</span>
                  <button
                    onClick={handleRotate}
                    className="px-2.5 py-1 text-[11px] font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1 transition cursor-pointer"
                  >
                    <RotateCw className="w-3 h-3 text-cyan-400" />
                    <span>چرخش ۹۰ درجه</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* Magic Color */}
                  <button
                    type="button"
                    onClick={() => handleSelectFilter('magic_color')}
                    className={`p-3 rounded-2xl border text-right transition flex flex-col gap-1 cursor-pointer ${
                      selectedFilter === 'magic_color'
                        ? 'bg-gradient-to-br from-amber-500/20 to-emerald-500/20 border-amber-400 text-white shadow-md ring-2 ring-amber-400/30'
                        : 'bg-slate-850 hover:bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">🪄 رنگ جادویی</span>
                      {selectedFilter === 'magic_color' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                    <span className="text-[10px] text-slate-400 leading-tight">
                      رنگ‌های زنده + پس‌زمینه شفاف (محبوب‌ترین)
                    </span>
                  </button>

                  {/* Clear Document */}
                  <button
                    type="button"
                    onClick={() => handleSelectFilter('clear_document')}
                    className={`p-3 rounded-2xl border text-right transition flex flex-col gap-1 cursor-pointer ${
                      selectedFilter === 'clear_document'
                        ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-400 text-white shadow-md ring-2 ring-emerald-400/30'
                        : 'bg-slate-850 hover:bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">📄 سند روشن</span>
                      {selectedFilter === 'clear_document' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <span className="text-[10px] text-slate-400 leading-tight">
                      سفیدسازی کامل سایه دست و کاغذ
                    </span>
                  </button>

                  {/* High-Contrast B&W */}
                  <button
                    type="button"
                    onClick={() => handleSelectFilter('high_contrast_bw')}
                    className={`p-3 rounded-2xl border text-right transition flex flex-col gap-1 cursor-pointer ${
                      selectedFilter === 'high_contrast_bw'
                        ? 'bg-gradient-to-br from-slate-700 to-slate-800 border-slate-300 text-white shadow-md ring-2 ring-white/30'
                        : 'bg-slate-850 hover:bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">⚫ سیاه و سفید</span>
                      {selectedFilter === 'high_contrast_bw' && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span className="text-[10px] text-slate-400 leading-tight">
                      کنتراست بالا برای کتب متنی
                    </span>
                  </button>

                  {/* Original Enhanced */}
                  <button
                    type="button"
                    onClick={() => handleSelectFilter('original')}
                    className={`p-3 rounded-2xl border text-right transition flex flex-col gap-1 cursor-pointer ${
                      selectedFilter === 'original'
                        ? 'bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border-cyan-400 text-white shadow-md ring-2 ring-cyan-400/30'
                        : 'bg-slate-850 hover:bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">🖼️ رنگ طبیعی</span>
                      {selectedFilter === 'original' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </div>
                    <span className="text-[10px] text-slate-400 leading-tight">
                      بدون تغییر رنگ (فقط برش زاویه)
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Review & Before/After Comparison Split Slider */}
          {step === 'review' && (
            <div className="w-full max-w-xl flex flex-col items-center space-y-4">
              <div className="text-center space-y-1">
                <h4 className="text-sm font-black text-amber-300 flex items-center justify-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  <span>مقایسه تعاملی قبل و بعد (Before / After)</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  اسلایدر وسط تصویر را به چپ و راست بکشید تا تفاوت عکس اولیه با نتیجه اسکن را مشاهده کنید.
                </p>
              </div>

              {/* Split Comparison Slider Container */}
              <div
                className="relative select-none rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700 max-h-[50vh] w-full max-w-md bg-slate-950 flex items-center justify-center cursor-ew-resize"
                onPointerDown={() => setIsDraggingSlider(true)}
                onPointerUp={() => setIsDraggingSlider(false)}
                onPointerMove={(e) => {
                  if (isDraggingSlider) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pos = ((e.clientX - rect.left) / rect.width) * 100;
                    setSliderPos(Math.max(0, Math.min(100, pos)));
                  }
                }}
              >
                {/* AFTER Image (Full width background) */}
                <img
                  src={finalFilteredDataUrl}
                  alt="After CamScanner"
                  className="w-full h-auto max-h-[50vh] object-contain block"
                />

                {/* BEFORE Image (Clipped overlay) */}
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={{ width: `${sliderPos}%` }}
                >
                  <img
                    src={activeImageSrc}
                    alt="Before (Carpet/Floor)"
                    className="w-full h-full object-cover block"
                    style={{
                      width: `${containerRef.current?.clientWidth || 400}px`,
                      maxWidth: 'none'
                    }}
                  />
                  {/* Before label */}
                  <span className="absolute top-3 left-3 bg-black/80 text-rose-300 border border-rose-500/50 text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm">
                    قبل (عکس اولیه با فرش)
                  </span>
                </div>

                {/* After label */}
                <span className="absolute top-3 right-3 bg-black/80 text-emerald-300 border border-emerald-500/50 text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm pointer-events-none">
                  بعد (اسکن شده ✨)
                </span>

                {/* Divider Line & Handle */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl pointer-events-none"
                  style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-slate-900 shadow-xl flex items-center justify-center font-bold text-xs border-2 border-emerald-500">
                    ↔
                  </div>
                </div>
              </div>

              {/* Safety notice */}
              <div className="p-3 bg-emerald-950/50 border border-emerald-800/80 rounded-2xl text-[11px] text-emerald-200 flex items-center gap-2 max-w-md w-full">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>
                  <strong>سیستم ایمنی:</strong> عکس اولیه دانش‌آموز در سرور به عنوان نسخه پشتیبان ذخیره می‌شود و هر زمان مایل باشید با دکمه بازگشت قابل بازیابی است.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          {/* Left: Secondary navigation */}
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
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>بازگشت به تنظیم گوشه‌ها</span>
              </button>
            )}

            {step === 'review' && (
              <button
                type="button"
                onClick={() => setStep('filter')}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>تغییر فیلتر اسکن</span>
              </button>
            )}
          </div>

          {/* Center Feedback */}
          {saveSuccessMsg && (
            <div className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* Right: Primary Next/Save Action */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {step === 'crop' && (
              <button
                type="button"
                onClick={handleProceedToFilters}
                disabled={isProcessing}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-600 hover:to-emerald-600 active:scale-95 disabled:opacity-50 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>در حال تصحیح پرسپکتیو...</span>
                  </>
                ) : (
                  <>
                    <span>مرحله بعد: اعمال اسکن و فیلترها</span>
                    <ArrowLeft className="w-4 h-4" />
                  </>
                )}
              </button>
            )}

            {step === 'filter' && (
              <button
                type="button"
                onClick={() => setStep('review')}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-95 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>مرحله بعد: پیش‌نمایش و مقایسه</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            {step === 'review' && (
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
                    <span>تایید نهایی و جایگزینی جلد کتاب</span>
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
