import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, Check, X, SwitchCamera, AlertCircle, Image as ImageIcon, Crop } from 'lucide-react';
import { ImageCropperModal } from './ImageCropperModal';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  title?: string;
  facingMode?: 'environment' | 'user';
  enableCrop?: boolean;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  title = 'عکاسی با دوربین',
  facingMode: initialFacingMode = 'environment',
  enableCrop = true
}) => {
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>(initialFacingMode);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isStarting, setIsStarting] = useState(true);
  const [showCropper, setShowCropper] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    stopStream();
    setIsStarting(true);
    setErrorMessage('');
    setCapturedImage(null);
    setShowCropper(false);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('قابلیت دسترسی به دوربین در این مرورگر یا دستگاه پشتیبانی نمی‌شود.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 960 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsStarting(false);
    } catch (err: any) {
      console.warn('Camera stream failed, fallback available:', err);
      setIsStarting(false);
      setErrorMessage(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'دسترسی به دوربین مسدود شده است. لطفاً اجازه دسترسی به دوربین را در مرورگر فعال کنید.'
          : 'خطا در اتصال به دوربین دستگاه. می‌توانید از دکمه دوربین بومی سیستم استفاده کنید.'
      );
    }
  }, [facingMode, stopStream]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopStream();
      setCapturedImage(null);
      setErrorMessage('');
      setShowCropper(false);
    }

    return () => {
      stopStream();
    };
  }, [isOpen, startCamera, stopStream]);

  const handleTakeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw frame
    ctx.drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);
    stopStream();

    if (enableCrop) {
      setShowCropper(true);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setShowCropper(false);
    startCamera();
  };

  const handleConfirm = () => {
    if (!capturedImage) return;

    // Convert dataUrl to File object
    try {
      const arr = capturedImage.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const fileName = `camera_capture_${Date.now()}.jpg`;
      const file = new File([u8arr], fileName, { type: mime });

      onCapture(file);
      onClose();
    } catch (e) {
      console.error('Failed to convert captured photo to file:', e);
      setErrorMessage('خطا در پردازش تصویر ثبت شده');
    }
  };

  const handleCropConfirmed = (croppedFile: File, croppedDataUrl: string) => {
    setCapturedImage(croppedDataUrl);
    setShowCropper(false);
    onCapture(croppedFile);
    onClose();
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleNativeCameraFallback = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setCapturedImage(dataUrl);
        if (enableCrop) {
          setShowCropper(true);
        } else {
          onCapture(file);
          onClose();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
        <div className="bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-800 flex flex-col my-auto text-white">
          {/* Header */}
          <div className="p-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-sm text-slate-100">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Viewport Area */}
          <div className="relative aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
            {capturedImage ? (
              <img
                src={capturedImage}
                alt="عکس گرفته شده"
                className="w-full h-full object-contain bg-black"
              />
            ) : (
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />
            )}

            {/* Hidden Canvas for capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Loading Indicator */}
            {isStarting && !capturedImage && !errorMessage && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 gap-2">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                <span className="text-xs font-bold text-slate-200">در حال اتصال به دوربین...</span>
              </div>
            )}

            {/* Error / Fallback message inside Viewport */}
            {errorMessage && !capturedImage && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900/90 gap-3">
                <AlertCircle className="w-10 h-10 text-amber-400" />
                <p className="text-xs text-slate-300 max-w-xs leading-relaxed">{errorMessage}</p>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition"
                >
                  <Camera className="w-4 h-4" />
                  <span>باز کردن دوربین گوشی / سیستم</span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleNativeCameraFallback}
                  className="hidden"
                />
              </div>
            )}

            {/* Overlay Switch Camera Button on Video */}
            {!capturedImage && !errorMessage && (
              <button
                type="button"
                onClick={toggleCamera}
                title="تغییر دوربین جلو / پشت"
                className="absolute top-3 right-3 p-2.5 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white backdrop-blur-md border border-slate-700 transition"
              >
                <SwitchCamera className="w-5 h-5 text-emerald-300" />
              </button>
            )}
          </div>

          {/* Controls Footer */}
          <div className="p-4 bg-slate-900/95 border-t border-slate-800 flex items-center justify-between gap-3">
            {capturedImage ? (
              <>
                <button
                  type="button"
                  onClick={handleRetake}
                  className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <RefreshCw className="w-4 h-4 text-amber-400" />
                  <span>عکاسی مجدد</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowCropper(true)}
                  className="py-3 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition"
                >
                  <Crop className="w-4 h-4 text-indigo-200" />
                  <span>تنظیم کادر و برش ✂️</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirm}
                  className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-900/30 transition"
                >
                  <Check className="w-4 h-4 text-white" />
                  <span>تایید</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition"
                  title="یا انتخاب از گالری و فایل‌ها"
                >
                  <ImageIcon className="w-4 h-4 text-cyan-400" />
                  <span className="hidden sm:inline">انتخاب فایل</span>
                </button>

                <button
                  type="button"
                  onClick={handleTakeSnapshot}
                  disabled={isStarting || Boolean(errorMessage)}
                  className="flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition active:scale-95 cursor-pointer"
                >
                  <div className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-white" />
                  </div>
                  <span>ثبت عکس و برش جلد 📸</span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleNativeCameraFallback}
                  className="hidden"
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Image Cropper Modal */}
      {showCropper && capturedImage && (
        <ImageCropperModal
          isOpen={showCropper}
          imageSrc={capturedImage}
          onClose={() => setShowCropper(false)}
          onConfirmCrop={handleCropConfirmed}
          aspectRatio="3:4"
          title="تنظیم کادر و برش عکس جلد کتاب 📸"
        />
      )}
    </>
  );
};

