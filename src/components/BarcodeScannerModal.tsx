import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Scan,
  Search,
  BookOpen,
  Check,
  RefreshCw,
  Camera,
  AlertCircle,
  Zap,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Edit3,
  CheckCircle2,
  XCircle,
  Sparkles
} from 'lucide-react';
import { BrowserMultiFormatOneDReader } from '@zxing/browser';

export interface ScannedBookData {
  isbn: string;
  title: string;
  author: string;
  publisher?: string;
  category?: string;
  description?: string;
  coverImage?: string;
  source?: string;
  url?: string;
}

interface BarcodeScannerModalProps {
  onClose: () => void;
  onBookFound: (book: ScannedBookData) => void;
  onFallbackToManual?: (isbn?: string) => void;
}

// Sound feedback for successful barcode detection
function playScanChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);

    if (navigator.vibrate) {
      navigator.vibrate([60, 40, 80]);
    }
  } catch (err) {
    // Audio autoplay policy or vibration not allowed
  }
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  onClose,
  onBookFound,
  onFallbackToManual
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  const [manualIsbn, setManualIsbn] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState<boolean>(false);
  const [lastScannedIsbn, setLastScannedIsbn] = useState<string | null>(null);
  const [foundBook, setFoundBook] = useState<ScannedBookData | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatOneDReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const scanLockRef = useRef<boolean>(false);

  // Stop camera stream, reader and background frame decode loop
  const stopCamera = useCallback(() => {
    if (controlsRef.current) {
      try {
        controlsRef.current.stop();
      } catch (e) {}
      controlsRef.current = null;
    }
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => track.stop());
      } catch (e) {}
      streamRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null;
      } catch (e) {}
    }
    readerRef.current = null;
    setTorchOn(false);
  }, []);

  // Perform backend lookup by ISBN
  const lookupIsbn = useCallback(async (isbnToSearch: string) => {
    if (!isbnToSearch || isLookingUp) return;
    setIsLookingUp(true);
    setLookupError(null);
    setFoundBook(null);

    try {
      const res = await fetch('/api/scanner/lookup-isbn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isbn: isbnToSearch.trim() })
      });

      const data = await res.json();
      if (data.success && data.book) {
        setFoundBook(data.book);
      } else {
        setLookupError(data.message || 'مشخصات کتابی با این شابک در پایگاه ایران‌کتاب پیدا نشد.');
      }
    } catch (err: any) {
      setLookupError('خطا در برقراری ارتباط با سرور.');
    } finally {
      setIsLookingUp(false);
    }
  }, [isLookingUp]);

  // Handle successful scan from camera or detector
  const handleBarcodeDetected = useCallback((rawText: string) => {
    if (scanLockRef.current) return;
    const clean = rawText.replace(/[^0-9X]/gi, '').trim();
    if (clean.length < 9) return; // Ignore short random barcodes

    scanLockRef.current = true;

    // Immediately stop continuous scanning loop so it doesn't run in background
    if (controlsRef.current) {
      try {
        controlsRef.current.stop();
      } catch (e) {}
      controlsRef.current = null;
    }

    playScanChime();
    setLastScannedIsbn(clean);
    lookupIsbn(clean);
  }, [lookupIsbn]);

  // Safe camera lifecycle
  useEffect(() => {
    let isMounted = true;

    // Only start camera stream when in camera tab and not showing a found book
    if (activeTab !== 'camera' || foundBook) {
      stopCamera();
      return;
    }

    scanLockRef.current = false;
    setCameraError(null);

    const startCameraAndScanner = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('دوربین در این مرورگر پشتیبانی نمی‌شود.');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        // Check that video element is mounted in DOM before assigning and decoding
        const videoEl = videoRef.current;
        if (!videoEl) {
          return;
        }

        videoEl.srcObject = stream;
        await videoEl.play().catch(() => {});

        if (!isMounted || !videoRef.current) return;

        // Initialize 1D-only barcode reader (EAN-13, EAN-8, Code 128, UPC)
        // This completely eliminates non-reader QR/Micro-QR exceptions & massive console warnings
        const codeReader = new BrowserMultiFormatOneDReader();
        readerRef.current = codeReader;

        try {
          const controls = await codeReader.decodeFromVideoElement(videoEl, (result) => {
            if (result && isMounted && !scanLockRef.current) {
              handleBarcodeDetected(result.getText());
            }
          });

          if (isMounted) {
            controlsRef.current = controls;
          } else {
            controls.stop();
          }
        } catch (zxingErr: any) {
          console.warn('[BarcodeScanner] decodeFromVideoElement caught error:', zxingErr);
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.warn('[BarcodeScanner] Camera init error:', err);
        setCameraError(
          'دسترسی به دوربین ممکن نیست یا مسدود شده است. لطفاً شماره شابک را دستی وارد نمایید.'
        );
        setActiveTab('manual');
      }
    };

    // Give React DOM a tick to guarantee video element ref is set
    const timer = setTimeout(() => {
      startCameraAndScanner();
    }, 50);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopCamera();
    };
  }, [activeTab, foundBook, handleBarcodeDetected, stopCamera]);

  // Toggle flashlight / torch if supported
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};
      if (capabilities.torch) {
        const next = !torchOn;
        await track.applyConstraints({
          advanced: [{ torch: next } as any]
        });
        setTorchOn(next);
      }
    } catch (e) {
      console.warn('Torch toggle failed:', e);
    }
  };

  // Reset scan state to scan again
  const handleResetScan = () => {
    stopCamera();
    scanLockRef.current = false;
    setFoundBook(null);
    setLookupError(null);
    setLastScannedIsbn(null);
    setActiveTab('camera');
  };

  // Safe Close
  const handleClose = () => {
    stopCamera();
    onClose();
  };

  // Switch / fallback directly to manual form
  const handleGoToManualAdd = () => {
    stopCamera();
    if (onFallbackToManual) {
      onFallbackToManual(lastScannedIsbn || manualIsbn || undefined);
    }
    onClose();
  };

  // Manual submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualIsbn.trim()) return;
    setLastScannedIsbn(manualIsbn.trim());
    lookupIsbn(manualIsbn.trim());
  };

  // Confirm and apply to book form
  const handleApplyFoundBook = () => {
    if (!foundBook) return;
    stopCamera();
    onBookFound(foundBook);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl text-white flex flex-col my-auto overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <Scan className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white">بارکدخوان هوشمند کتاب (شابک)</h3>
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                  ایران‌کتاب
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                استخراج خودکار مشخصات و عکس جلد با اسکن بارکد پشت جلد
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Switcher Tabs (Camera vs Manual) & Guide Toggle */}
        {!foundBook && (
          <div className="bg-slate-950/90 border-b border-slate-800 px-4 py-2 flex items-center justify-between gap-2 shrink-0 flex-wrap">
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('camera');
                  handleResetScan();
                }}
                className={`px-3 py-1.5 rounded-lg font-black transition flex items-center gap-1.5 ${
                  activeTab === 'camera'
                    ? 'bg-gradient-to-r from-amber-500 to-emerald-600 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>دوربین زنده</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('manual')}
                className={`px-3 py-1.5 rounded-lg font-black transition flex items-center gap-1.5 ${
                  activeTab === 'manual'
                    ? 'bg-gradient-to-r from-amber-500 to-emerald-600 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>تایپ دستی شابک</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowGuide(!showGuide)}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition flex items-center gap-1 cursor-pointer ${
                  showGuide
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-xs'
                    : 'bg-slate-850 text-amber-300 border-amber-400/30 hover:bg-slate-800'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>راهنمای بارکد</span>
                {showGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {activeTab === 'camera' && streamRef.current && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  className={`p-2 rounded-xl text-xs font-bold border transition flex items-center gap-1 cursor-pointer ${
                    torchOn
                      ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-xs'
                      : 'bg-slate-850 text-slate-300 border-slate-700 hover:bg-slate-800'
                  }`}
                  title="چراغ قوه"
                >
                  <Zap className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Collapsible Visual Educational Guide */}
        {showGuide && !foundBook && (
          <div className="p-3.5 bg-slate-950/95 border-b border-amber-500/30 text-right space-y-2.5 animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>آموزش اسکن بارکد کتاب و تفاوت با کد QR</span>
              </span>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="text-[10px] text-slate-400 hover:text-white"
              >
                بستن راهنما ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* Correct Barcode Card */}
              <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>بارکد صحیح کتاب (شابک / ISBN):</span>
                </div>
                <div className="bg-slate-900/90 p-2 rounded-lg text-center border border-emerald-500/20">
                  <div className="font-mono tracking-widest text-emerald-300 font-bold text-sm">
                    ▌▌█▌▌█▌▌█▌▌█
                  </div>
                  <div className="text-[10px] text-slate-300 font-mono mt-0.5">
                    978-600-XXXX-XX-X
                  </div>
                </div>
                <p className="text-[10px] text-slate-300 leading-relaxed">
                  • <strong>محل:</strong> معمولاً پایین پشت جلد کتاب یا صفحه شناسنامه ابتدای کتاب.
                  <br />
                  • <strong>شکل:</strong> خطوط میله‌ای عمودی سیاه و سفید با شماره ۱۳ رقمی.
                </p>
              </div>

              {/* Wrong QR Code Card */}
              <div className="p-2.5 bg-rose-950/30 border border-rose-500/30 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-rose-300">
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>کد QR (بارکد کتاب نیست):</span>
                </div>
                <div className="bg-slate-900/90 p-2 rounded-lg text-center border border-rose-500/20 flex items-center justify-center gap-2">
                  <div className="w-7 h-7 bg-slate-800 border-2 border-dashed border-rose-400/80 rounded flex items-center justify-center font-bold text-rose-400 text-xs">
                    ▣
                  </div>
                  <span className="text-[10px] text-rose-300">کدهای مربعی شطرنجی</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  • کدهای مربعی شطرنجی (QR) مربوط به سایت، نظرسنجی یا صوت ناشر هستند و بارکد کتاب محسوب نمی‌شوند.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Modal Main Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto min-h-[320px] flex flex-col items-center justify-center">
          {/* CAMERA VIEW */}
          <div
            className={`w-full flex flex-col items-center space-y-3 ${
              activeTab === 'camera' && !foundBook && !isLookingUp ? 'block' : 'hidden'
            }`}
          >
            <div className="relative w-full max-w-sm aspect-4/3 rounded-2xl overflow-hidden bg-black border-2 border-slate-700 shadow-2xl flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="w-full h-full object-cover"
              />

              {/* Barcode Guideline Target Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                <div className="relative w-64 h-32 sm:w-72 sm:h-36 border-2 border-amber-400/80 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] flex items-center justify-center overflow-hidden">
                  {/* Animated Laser Scan Line */}
                  <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_8px_#ef4444] animate-[bounce_2s_infinite]" />

                  {/* Corner reticles */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-amber-400" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-amber-400" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-amber-400" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-amber-400" />

                  <span className="text-[10px] font-black text-amber-200/80 bg-black/60 px-2 py-0.5 rounded-full select-none">
                    خطوط بارکد پشت کتاب را اینجا بگیرید
                  </span>
                </div>
              </div>
            </div>

            {cameraError && (
              <div className="w-full p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}

            <div className="w-full flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>فاصله مناسب دوربین: حدود ۱۵ تا ۲۰ سانتی‌متر</span>
              <button
                type="button"
                onClick={handleGoToManualAdd}
                className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
              >
                ورود دستی مشخصات ✏️
              </button>
            </div>
          </div>

          {/* STATE 1: Found Book Result Card */}
          {foundBook ? (
            <div className="w-full space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-300">
                <span className="flex items-center gap-1.5 font-bold">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>مشخصات کتاب پیدا شد!</span>
                  {foundBook.source && (
                    <span className="text-[10px] bg-emerald-950/90 text-emerald-300 border border-emerald-600/50 px-2 py-0.5 rounded-full mr-1 font-normal">
                      {foundBook.source}
                    </span>
                  )}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  ISBN: {foundBook.isbn}
                </span>
              </div>

              {/* Book Details Preview */}
              <div className="bg-slate-850 border border-slate-700/80 rounded-2xl p-4 flex gap-4 items-start shadow-md">
                {foundBook.coverImage ? (
                  <img
                    src={foundBook.coverImage}
                    alt={foundBook.title}
                    className="w-24 h-32 sm:w-28 sm:h-38 object-cover rounded-xl shadow-lg border border-slate-600 shrink-0 bg-slate-900"
                  />
                ) : (
                  <div className="w-24 h-32 sm:w-28 sm:h-38 rounded-xl bg-slate-800 border border-slate-700 flex flex-col items-center justify-center text-slate-500 p-2 text-center shrink-0">
                    <BookOpen className="w-8 h-8 mb-1 text-slate-600" />
                    <span className="text-[9px]">بدون عکس جلد رسمی</span>
                  </div>
                )}

                <div className="min-w-0 flex-1 space-y-1.5 text-right">
                  <h4 className="text-base sm:text-lg font-black text-amber-300 leading-snug line-clamp-2">
                    {foundBook.title}
                  </h4>

                  <div className="text-xs text-slate-300 font-bold">
                    نویسنده / مترجم: <span className="text-white">{foundBook.author || 'نامشخص'}</span>
                  </div>

                  {foundBook.publisher && (
                    <div className="text-xs text-slate-400">
                      ناشر: <span className="text-slate-200">{foundBook.publisher}</span>
                    </div>
                  )}

                  {foundBook.category && (
                    <div className="inline-block text-[11px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-700/50 px-2 py-0.5 rounded-lg mt-1">
                      {foundBook.category}
                    </div>
                  )}

                  {foundBook.description && (
                    <p className="text-[11px] text-slate-400 line-clamp-3 mt-1.5 leading-relaxed">
                      {foundBook.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleResetScan}
                  className="w-full sm:w-auto px-4 py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>اسکن بارکد دیگر</span>
                </button>

                <button
                  type="button"
                  onClick={handleApplyFoundBook}
                  className="w-full flex-1 px-5 py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>تأیید و درج خودکار در فرم کتاب</span>
                </button>
              </div>
            </div>
          ) : isLookingUp ? (
            /* STATE 2: Loading / Querying backend */
            <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-amber-500/20 border-t-amber-400 animate-spin" />
                <BookOpen className="w-6 h-6 text-amber-400 absolute inset-0 m-auto animate-pulse" />
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-black text-white">در حال استعلام شابک از ایران‌کتاب...</h4>
                <p className="text-xs text-slate-400">
                  دریافت مستقیم مشخصات و عکس جلد برای شابک: <span className="font-mono text-amber-300">{lastScannedIsbn}</span>
                </p>
              </div>
            </div>
          ) : lookupError ? (
            /* STATE 3: Book Not Found / Lookup Error with Clear Manual Fallback */
            <div className="w-full max-w-md p-4 bg-slate-850 border border-slate-700 rounded-2xl space-y-4 text-center animate-in fade-in duration-150">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-black text-white">کتاب در پایگاه آنلاین پیدا نشد</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {lookupError}
                </p>
                {lastScannedIsbn && (
                  <p className="text-[11px] text-amber-300/90 font-mono">
                    شابک اسکن شده: {lastScannedIsbn}
                  </p>
                )}
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-right space-y-1">
                <p className="text-[11px] text-slate-300">
                  💡 <strong>راهنما:</strong> برخی کتاب‌های قدیمی‌تر یا ناشران خاص ممکن است در پایگاه اینترنتی ثبت نشده باشند. جای نگرانی نیست؛ می‌توانید مشخصات را در فرم دستی وارد کنید.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleResetScan}
                  className="w-full sm:w-1/2 py-2.5 px-3 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>اسکن مجدد بارکد</span>
                </button>

                <button
                  type="button"
                  onClick={handleGoToManualAdd}
                  className="w-full sm:w-1/2 py-2.5 px-3 bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-600 hover:to-emerald-700 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>انتقال به ثبت دستی مشخصات</span>
                </button>
              </div>
            </div>
          ) : activeTab === 'manual' ? (
            /* STATE 4: Manual ISBN Input */
            <form onSubmit={handleManualSubmit} className="w-full max-w-sm space-y-4">
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-bold text-slate-300 block">
                  شماره شابک (ISBN) ۱۰ یا ۱۳ رقمی کتاب:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={manualIsbn}
                    onChange={(e) => setManualIsbn(e.target.value)}
                    placeholder="مثلاً: 9786001038136"
                    dir="ltr"
                    className="w-full p-3 bg-slate-850 border border-slate-700 rounded-xl text-center text-sm font-mono tracking-widest text-amber-300 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    autoFocus
                  />
                  <Search className="w-4 h-4 text-slate-500 absolute right-3 top-3.5 pointer-events-none" />
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  شماره شابک معمولاً در پشت جلد کتاب زیر خطوط بارکد یا در صفحه شناسنامه کتاب درج شده است.
                </p>
              </div>

              <button
                type="submit"
                disabled={!manualIsbn.trim() || isLookingUp}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-600 hover:to-emerald-700 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>جستجوی کتاب در ایران‌کتاب</span>
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleGoToManualAdd}
                  className="text-xs text-slate-400 hover:text-amber-300 transition underline cursor-pointer"
                >
                  صرف‌نظر و ورود دستی نام و نویسنده کتاب ✏️
                </button>
              </div>
            </form>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span className="text-[11px]">مکتب‌خانه • سامانه هوشمند ثبت کتاب</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGoToManualAdd}
              className="text-[11px] text-amber-400 hover:text-amber-300 font-bold px-2 py-1 transition cursor-pointer"
            >
              ثبت دستی بدون اسکن
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-xs transition cursor-pointer"
            >
              بستن
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
