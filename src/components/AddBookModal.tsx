import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BookCondition } from '../types';
import { CATEGORIES } from '../data/mockData';
import { X, BookPlus, Image as ImageIcon, CheckCircle2, Upload, Loader2 } from 'lucide-react';
import { api } from '../services/api';

interface AddBookModalProps {
  onClose: () => void;
}

const PRESET_COVERS = [
  { label: 'داستان و رمان', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600' },
  { label: 'فلسفه و تفکر', url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600' },
  { label: 'علمی و کیهان', url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=600' },
  { label: 'کلاسیک و شعر', url: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=600' },
  { label: 'تاریخ و معاصر', url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=600' },
  { label: 'روانشناسی و موفقیت', url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=600' }
];

export const AddBookModal: React.FC<AddBookModalProps> = ({ onClose }) => {
  const { addBook } = useApp();

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState(CATEGORIES[1]); // Default
  const [condition, setCondition] = useState<BookCondition>('عالی (نو)');
  const [coverImage, setCoverImage] = useState(PRESET_COVERS[0].url);
  const [customCoverUrl, setCustomCoverUrl] = useState('');
  const [uploadedCover, setUploadedCover] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('حجم فایل عکس باید کمتر از ۱۰ مگابایت باشد.');
        return;
      }

      setIsUploading(true);
      setError('');

      try {
        const uploadRes = await api.uploadImage(file);
        if (uploadRes.success && uploadRes.fileUrl) {
          setUploadedCover(uploadRes.fileUrl);
        } else {
          setError(uploadRes.message || 'خطا در آپلود عکس روی سرور');
        }
      } catch (err: any) {
        setError(err.message || 'خطا در برقراری ارتباط با سرور آپلود');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;

    const finalCover = uploadedCover || customCoverUrl.trim() || coverImage;

    addBook({
      title: title.trim(),
      author: author.trim(),
      category,
      condition,
      coverImage: finalCover,
      description: description.trim()
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-100 my-8">
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
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800"
              >
                {CATEGORIES.filter((c) => c !== 'همه تصنیف‌ها').map((c) => (
                  <option key={c} value={c}>
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
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800"
              >
                <option value="عالی (نو)">عالی (نو و بدون خط‌خوردگی)</option>
                <option value="خوب">خوب (کاملا تمیز و سالم)</option>
                <option value="متوسط">متوسط (استفاده شده)</option>
              </select>
            </div>
          </div>

          {/* Image Upload Box */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <label className="text-xs font-bold text-slate-800 block">
              📸 آپلود مستقیم عکس کتاب یا انتخاب کاور نمونه:
            </label>

            {/* File upload input */}
            <div className="flex items-center gap-3 flex-wrap">
              <label className="cursor-pointer px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition">
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span>{isUploading ? 'در حال آپلود روی سرور...' : 'انتخاب و آپلود عکس جلد'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>

              {uploadedCover ? (
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs font-bold">
                  <img src={uploadedCover} alt="uploaded cover" className="w-8 h-8 rounded-lg object-cover" />
                  <span>تصویر با موفقیت در سرور ذخیره شد</span>
                </div>
              ) : (
                <span className="text-xs text-slate-500">{isUploading ? 'لطفاً شکیبا باشید...' : 'فایلی انتخاب نشده است'}</span>
              )}
            </div>

            {/* Preset Covers fallback */}
            <div className="pt-2 border-t border-slate-200">
              <span className="text-[11px] font-bold text-slate-600 block mb-2">
                یا انتخاب یکی از کاورهای آماده:
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {PRESET_COVERS.map((preset, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setCoverImage(preset.url);
                      setUploadedCover('');
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
            </div>
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
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
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
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-100 flex items-center gap-1.5 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>ثبت کتاب در کتابخانه</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
