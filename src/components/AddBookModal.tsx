import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BookCondition } from '../types';
import { CATEGORIES } from '../constants';
import { 
  X, 
  BookPlus, 
  Image as ImageIcon, 
  CheckCircle2, 
  Upload, 
  Loader2, 
  Trash2, 
  Sparkles, 
  Camera, 
  Crop,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Plus,
  Check,
  Library
} from 'lucide-react';
import { api } from '../services/api';
import { CameraCaptureModal } from './CameraCaptureModal';
import { ImageCropperModal } from './ImageCropperModal';

interface AddBookModalProps {
  onClose: () => void;
}

import { PRESET_BOOK_COVERS } from '../utils/coverPresets';

export const AddBookModal: React.FC<AddBookModalProps> = ({ onClose }) => {
  const { addBook } = useApp();

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState(CATEGORIES[1]); // Default
  const [condition, setCondition] = useState<BookCondition>('عالی (نو)');
  const [coverImage, setCoverImage] = useState(PRESET_BOOK_COVERS[0].url);
  const [customCoverUrl, setCustomCoverUrl] = useState('');
  const [uploadedCover, setUploadedCover] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showCropperModal, setShowCropperModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [showPresetsToggle, setShowPresetsToggle] = useState(false);
  const [submittedBook, setSubmittedBook] = useState<{
    id?: string;
    title: string;
    author: string;
    category: string;
    condition: string;
    coverImage: string;
    description: string;
    isRealPhoto: boolean;
  } | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type) && !file.type.startsWith('image/')) {
      setError('فقط فرمت‌های تصویری معتبر (JPG, JPEG, PNG, WEBP) مجاز هستند.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('حجم فایل عکس باید کمتر از ۱۰ مگابایت باشد.');
      return;
    }

    // Instant local preview
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setImageToCrop(localUrl);
    setIsUploading(true);
    setError('');

    try {
      const uploadRes = await api.uploadImage(file);
      if (uploadRes.success && uploadRes.fileUrl) {
        setUploadedCover(uploadRes.fileUrl);
        setCustomCoverUrl('');
      } else {
        setError(uploadRes.message || 'خطا در آپلود عکس روی سرور');
        setPreviewUrl('');
      }
    } catch (err: any) {
      setError(err.message || 'خطا در برقراری ارتباط با سرور آپلود');
      setPreviewUrl('');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCameraCapture = async (file: File) => {
    // Instant local preview
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setImageToCrop(localUrl);
    setIsUploading(true);
    setError('');

    try {
      const uploadRes = await api.uploadImage(file);
      if (uploadRes.success && uploadRes.fileUrl) {
        setUploadedCover(uploadRes.fileUrl);
        setCustomCoverUrl('');
      } else {
        setError(uploadRes.message || 'خطا در آپلود عکس روی سرور');
        setPreviewUrl('');
      }
    } catch (err: any) {
      setError(err.message || 'خطا در برقراری ارتباط با سرور آپلود');
      setPreviewUrl('');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCropConfirmed = async (croppedFile: File, croppedDataUrl: string) => {
    setPreviewUrl(croppedDataUrl);
    setImageToCrop(croppedDataUrl);
    setIsUploading(true);
    setError('');
    setShowCropperModal(false);

    try {
      const uploadRes = await api.uploadImage(croppedFile);
      if (uploadRes.success && uploadRes.fileUrl) {
        setUploadedCover(uploadRes.fileUrl);
        setCustomCoverUrl('');
      } else {
        setError(uploadRes.message || 'خطا در ذخیره تصویر برش‌خورده');
      }
    } catch (err: any) {
      setError(err.message || 'خطا در ارسال تصویر برش‌خورده');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveUploadedCover = () => {
    setUploadedCover('');
    setPreviewUrl('');
    setImageToCrop(null);
  };

  const resetForm = () => {
    setTitle('');
    setAuthor('');
    setCategory(CATEGORIES[1]);
    setCondition('عالی (نو)');
    setCoverImage(PRESET_BOOK_COVERS[0].url);
    setCustomCoverUrl('');
    setUploadedCover('');
    setPreviewUrl('');
    setDescription('');
    setError('');
    setImageToCrop(null);
    setShowPresetsToggle(false);
    setSubmittedBook(null);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const finalCover = uploadedCover || customCoverUrl.trim() || coverImage;
      const isRealPhoto = Boolean(uploadedCover || (customCoverUrl.trim() && !customCoverUrl.includes('/img/')));

      const created = await addBook({
        title: title.trim(),
        author: author.trim(),
        category,
        condition,
        coverImage: finalCover,
        description: description.trim()
      });

      setSubmittedBook({
        id: created?.id,
        title: title.trim(),
        author: author.trim(),
        category,
        condition,
        coverImage: finalCover,
        description: description.trim(),
        isRealPhoto
      });
    } catch (err: any) {
      setError(err.message || 'خطا در ثبت کتاب');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-100 my-8 animate-in zoom-in-95 duration-150">
        {submittedBook ? (
          /* ========================================================= */
          /* View 1: Success Screen after book registration           */
          /* ========================================================= */
          <div className="flex flex-col">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shadow-inner">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block">
                      ثبت موفق در کتابخانه مکتب‌خانه
                    </span>
                    <h3 className="font-black text-lg text-white">
                      کتاب با موفقیت ثبت شد! 🎉
                    </h3>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                  title="بستن پنجره"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Success Body */}
            <div className="p-6 space-y-5">
              {/* Highlight Card */}
              <div className="p-4 bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-slate-50 border border-emerald-200/80 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-right">
                {/* Book Cover */}
                <div className="relative w-28 h-36 rounded-xl overflow-hidden shadow-md border-2 border-white shrink-0 bg-slate-100">
                  <img
                    src={submittedBook.coverImage}
                    alt={submittedBook.title}
                    className="w-full h-full object-cover"
                  />
                  {submittedBook.isRealPhoto ? (
                    <span className="absolute bottom-1 inset-x-1 bg-emerald-950/85 text-[9px] text-emerald-200 font-bold py-0.5 rounded text-center backdrop-blur-xs">
                      📸 عکس واقعی جلد
                    </span>
                  ) : (
                    <span className="absolute bottom-1 inset-x-1 bg-slate-900/80 text-[9px] text-slate-200 font-bold py-0.5 rounded text-center backdrop-blur-xs">
                      🎨 کاور پیش‌فرض
                    </span>
                  )}
                </div>

                {/* Book Details */}
                <div className="flex-1 space-y-2">
                  <div>
                    <h4 className="font-black text-slate-900 text-base">
                      {submittedBook.title}
                    </h4>
                    <p className="text-xs text-slate-600 font-bold mt-0.5">
                      نویسنده / پدیدآور: <span className="text-slate-800">{submittedBook.author}</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <span className="px-2.5 py-1 bg-emerald-100/80 text-emerald-900 text-[11px] font-bold rounded-lg border border-emerald-200/60">
                      دسته‌بندی: {submittedBook.category}
                    </span>
                    <span className="px-2.5 py-1 bg-indigo-100/80 text-indigo-900 text-[11px] font-bold rounded-lg border border-indigo-200/60">
                      وضعیت: {submittedBook.condition}
                    </span>
                  </div>

                  {submittedBook.description && (
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mt-1">
                      {submittedBook.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Encouragement Notice */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4 fill-amber-400" />
                </div>
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-slate-800">
                    سپاس از مشارکت ارزشمند شما در مکتب‌خانه!
                  </p>
                  <p className="text-slate-500 leading-relaxed text-[11px]">
                    این کتاب هم‌اکنون در مخزن کتابخانه قرار گرفت و همکلاسی‌های شما می‌توانند برای مطالعه آن، درخواست امانت آنلاین ثبت نمایند.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 active:scale-95"
                >
                  <Plus className="w-4 h-4 text-slate-500" />
                  <span>ثبت یک کتاب دیگر ➕</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-200/50 flex items-center justify-center gap-2 transition active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>مشاهده کتابخانه و بستن ✓</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* View 2: Normal Form View for Adding a Book               */
          /* ========================================================= */
          <>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookPlus className="w-6 h-6 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-base">افزودن کتاب جدید به کتابخانه اصلی</h3>
                  <p className="text-xs text-indigo-200">اشتراک‌گذاری کتاب شخص برای همکلاسی‌های مدرسه</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                title="بستن"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl">
                  {error}
                </div>
              )}

              {/* Title & Author */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    نام/عنوان کامل کتاب *:
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثلا: قصه‌های مجید"
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    نام نویسنده / مترجم *:
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="مثلا: هوشنگ مرادی کرمانی"
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                    required
                  />
                </div>
              </div>

              {/* Category & Condition */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    دسته‌بندی موضوعی:
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs sm:text-sm p-3 bg-slate-50 border border-slate-200/90 rounded-2xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-bold text-slate-800 shadow-2xs hover:border-teal-400 transition cursor-pointer"
                  >
                    {CATEGORIES.filter((c) => c !== 'همه تصنیف‌ها').map((c) => (
                      <option key={c} value={c} className="py-2 text-slate-900 font-semibold">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    وضعیت سلامت فیزیکی کتاب:
                  </label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as BookCondition)}
                    className="w-full text-xs sm:text-sm p-3 bg-slate-50 border border-slate-200/90 rounded-2xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-bold text-slate-800 shadow-2xs hover:border-teal-400 transition cursor-pointer"
                  >
                    <option value="عالی (نو)" className="py-2 text-slate-900 font-semibold">✨ عالی (نو و بدون خط‌خوردگی)</option>
                    <option value="خوب" className="py-2 text-slate-900 font-semibold">👍 خوب (کاملاً تمیز و سالم)</option>
                    <option value="متوسط" className="py-2 text-slate-900 font-semibold">📖 متوسط (استفاده شده)</option>
                  </select>
                </div>
              </div>

              {/* Image Upload Box */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3.5">
                {/* Encouragement Banner */}
                <div className="p-3 bg-gradient-to-r from-amber-50 via-emerald-50/90 to-teal-50 border border-emerald-200/90 rounded-xl flex items-start gap-2.5 shadow-2xs">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5 text-right">
                    <div className="flex items-center gap-1.5 text-xs font-black text-emerald-950">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                      <span>پیشنهاد ویژه مکتب‌خانه: عکس واقعی جلد کتاب</span>
                    </div>
                    <p className="text-[11px] text-emerald-900/80 leading-relaxed font-medium">
                      کتاب‌هایی که با <strong>عکس واقعی جلد</strong> ثبت می‌شوند، <strong>۳ برابر سریع‌تر</strong> توسط دوستان به امانت گرفته می‌شوند.
                    </p>
                  </div>
                </div>

                {/* Primary Action Buttons for Photo */}
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Camera Button */}
                    <button
                      type="button"
                      onClick={() => setShowCameraModal(true)}
                      disabled={isUploading}
                      className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Camera className="w-4 h-4 text-emerald-200" />
                      <span>عکاسی مستقیم با دوربین 📸</span>
                    </button>

                    {/* File Upload Button */}
                    <label
                      className={`cursor-pointer py-3 px-4 rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition ${
                        isUploading
                          ? 'bg-slate-400 text-white cursor-wait'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
                      }`}
                    >
                      {isUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <Upload className="w-4 h-4 text-indigo-200" />
                      )}
                      <span>{isUploading ? 'در حال آپلود و پردازش تصویر...' : 'انتخاب عکس از گالری / فایل 📁'}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <p className="text-[10px] text-slate-500 text-center">
                    فرمت‌های مجاز: JPG, PNG, WEBP (حداکثر ۱۰ مگابایت)
                  </p>

                  {/* Instant Image Preview & Progress Card */}
                  {(previewUrl || uploadedCover) && (
                    <div className="p-3 bg-white rounded-2xl border-2 border-emerald-200 shadow-xs flex items-center justify-between gap-3 animate-in fade-in zoom-in-95">
                      <div className="flex items-center gap-3">
                        <div className="relative w-14 h-18 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                          <img
                            src={previewUrl || uploadedCover}
                            alt="پیش‌نمایش جلد کتاب"
                            className={`w-full h-full object-cover transition duration-300 ${
                              isUploading ? 'opacity-50 blur-[1px]' : 'opacity-100'
                            }`}
                          />
                          {isUploading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-indigo-900/40">
                              <Loader2 className="w-5 h-5 animate-spin text-white" />
                            </div>
                          )}
                        </div>

                        <div className="space-y-1 text-right">
                          {isUploading ? (
                            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>در حال ارسال و ذخیره تصویر بر روی سرور...</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>عکس واقعی کتاب با موفقیت ذخیره شد</span>
                            </div>
                          )}
                          <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold">
                            🎖️ جلد اختصاصی فعال شد
                          </span>
                        </div>
                      </div>

                      {!isUploading && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setImageToCrop(previewUrl || uploadedCover);
                              setShowCropperModal(true);
                            }}
                            title="تنظیم کادر و برش عکس جلد کتاب"
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 border border-indigo-200"
                          >
                            <Crop className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">برش ✂️</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleRemoveUploadedCover}
                            title="حذف این عکس و انتخاب مجدد"
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition border border-rose-200/50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Preset Covers Logic:
                    CRITICAL REQUIREMENT: If the user uploaded a photo, do NOT show the preset covers
                    so that clicking presets won't overwrite or erase their uploaded photo! */}
                {uploadedCover || previewUrl ? (
                  <div className="pt-2 border-t border-slate-200 text-center">
                    <div className="p-2.5 bg-emerald-50/90 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] font-bold flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>کاورهای آماده موقتاً مخفی شدند تا عکس واقعی شما حفظ شود.</span>
                    </div>
                  </div>
                ) : (
                  /* If NO uploaded photo yet, show an accordion trigger to discourage presets and favor camera */
                  <div className="pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setShowPresetsToggle(!showPresetsToggle)}
                      className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200/80 rounded-xl text-slate-600 text-xs font-bold flex items-center justify-between transition"
                    >
                      <span className="flex items-center gap-1.5 text-[11px]">
                        <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                        <span>دوربین ندارید؟ انتخاب از کاورهای نقاشی/آماده مکتب‌خانه</span>
                      </span>
                      {showPresetsToggle ? (
                        <ChevronUp className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      )}
                    </button>

                    {showPresetsToggle && (
                      <div className="mt-2.5 grid grid-cols-3 sm:grid-cols-6 gap-2 animate-in fade-in">
                        {PRESET_BOOK_COVERS.map((preset, i) => (
                          <div
                            key={i}
                            onClick={() => {
                              setCoverImage(preset.url);
                              setUploadedCover('');
                              setPreviewUrl('');
                              setCustomCoverUrl('');
                            }}
                            className={`relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer border-2 transition ${
                              coverImage === preset.url && !uploadedCover && !customCoverUrl
                                ? 'border-indigo-600 ring-2 ring-indigo-500 scale-105'
                                : 'border-transparent opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={preset.url}
                              alt={preset.label}
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-[9px] text-white text-center py-0.5 truncate">
                              {preset.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  خلاصه داستان یا دلیل پیشنهاد این کتاب به همکلاسی‌ها:
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="توضیحی درباره موضوع کتاب بنویسید که دیگران ترغیب بشن به خواندنش..."
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              {/* Form Actions */}
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className={`px-6 py-2.5 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition ${
                    isSubmitting || isUploading
                      ? 'bg-slate-400 cursor-wait'
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 active:scale-95'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>در حال ثبت در کتابخانه...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>ثبت کتاب در کتابخانه</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}

        <CameraCaptureModal
          isOpen={showCameraModal}
          onClose={() => setShowCameraModal(false)}
          onCapture={handleCameraCapture}
          title="عکاسی از جلد کتاب با دوربین"
          facingMode="environment"
        />

        <ImageCropperModal
          isOpen={showCropperModal}
          imageSrc={imageToCrop}
          onClose={() => setShowCropperModal(false)}
          onConfirmCrop={handleCropConfirmed}
          aspectRatio="3:4"
          title="تنظیم کادر و برش عکس جلد کتاب 📸"
        />
      </div>
    </div>
  );
};
