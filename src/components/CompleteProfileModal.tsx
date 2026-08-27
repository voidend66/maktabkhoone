import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { NewBookInput, BookCondition } from '../types';
import {
  User,
  GraduationCap,
  BookPlus,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Sparkles,
  ShieldCheck,
  BookOpen,
  Image as ImageIcon
} from 'lucide-react';
import { MaktabKhanehLogo } from './MaktabKhanehBranding';

interface CompleteProfileModalProps {
  onClose: () => void;
  onComplete: () => void;
}

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&q=80&w=200',
  'https://api.dicebear.com/7.x/bottts/svg?seed=ReaderBoy',
  'https://api.dicebear.com/7.x/bottts/svg?seed=ReaderGirl'
];

export const CompleteProfileModal: React.FC<CompleteProfileModalProps> = ({
  onClose,
  onComplete
}) => {
  const { currentUser, updateProfile, schoolClasses, systemConfig, addBook } = useApp();

  const minRequiredBooks = systemConfig?.minBooksForRegistration ?? 0;
  const maxAllowedBooks = systemConfig?.maxBooksForRegistration ?? 5;

  const [name, setName] = useState(
    currentUser?.name && !currentUser.name.startsWith('کاربر بله') ? currentUser.name : ''
  );
  const [className, setClassName] = useState(
    currentUser?.className || (schoolClasses.length > 0 ? schoolClasses[0].name : 'کلاس ۱/۱')
  );
  const [avatar, setAvatar] = useState(currentUser?.avatar || AVATAR_OPTIONS[0]);

  // Initial Books array state
  const [initialBooks, setInitialBooks] = useState<NewBookInput[]>([]);

  // Current new book being added form state
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookCategory, setBookCategory] = useState('داستان و رمان کودک');
  const [bookCondition, setBookCondition] = useState<BookCondition>('عالی (نو)');
  const [bookCover, setBookCover] = useState('https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=300');
  const [bookDesc, setBookDesc] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddBook = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!bookTitle.trim() || !bookAuthor.trim()) {
      setErrorMessage('عنوان کتاب و نام نویسنده الزامی است.');
      return;
    }

    if (initialBooks.length >= maxAllowedBooks) {
      setErrorMessage(`حداکثر می‌توانید ${maxAllowedBooks} جلد کتاب در فرم اولیه ثبت کنید.`);
      return;
    }

    const newBook: NewBookInput = {
      title: bookTitle.trim(),
      author: bookAuthor.trim(),
      category: bookCategory,
      condition: bookCondition,
      coverImage: bookCover.trim() || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=300',
      description: bookDesc.trim() || 'کتابی ارزشمند برای مطالعه دوستان'
    };

    setInitialBooks((prev) => [...prev, newBook]);
    setBookTitle('');
    setBookAuthor('');
    setBookDesc('');
  };

  const handleRemoveBook = (index: number) => {
    setInitialBooks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('لطفاً نام و نام خانوادگی خود را وارد کنید.');
      return;
    }

    if (!className) {
      setErrorMessage('لطفاً کلاس تحصیلی خود را انتخاب کنید.');
      return;
    }

    if (minRequiredBooks > 0 && initialBooks.length < minRequiredBooks) {
      setErrorMessage(
        `طبق قوانین مکتب‌خانه، مدیر سیستم ورود حداقل ${minRequiredBooks} جلد کتاب را برای تکمیل عضویت الزامی کرده است. شما در حال حاضر ${initialBooks.length} جلد کتاب وارد کرده‌اید.`
      );
      return;
    }

    setIsLoading(true);

    try {
      // 1. Update Profile (Name, Class, Avatar)
      const res = await updateProfile({
        name: name.trim(),
        className,
        avatar
      });

      if (!res.success) {
        setErrorMessage(res.message || 'خطا در به‌روزرسانی پروفایل');
        setIsLoading(false);
        return;
      }

      // 2. Add Initial Books if any
      for (const b of initialBooks) {
        await addBook(b);
      }

      setIsLoading(false);
      onComplete();
    } catch (err: any) {
      console.error('Error completing profile:', err);
      setErrorMessage('خطا در ذخیره اطلاعات، لطفاً مجدداً تلاش کنید.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full p-6 sm:p-8 space-y-6 dir-rtl text-right my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <MaktabKhanehLogo size="sm" />
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                تکمیل اطلاعات عضویت در مکتب‌خانه 🎒
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                لطفاً نام، پایه تحصیلی و کتاب‌های امانتی خود را وارد نمایید.
              </p>
            </div>
          </div>
        </div>

        {/* Requirements Notice */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 p-4 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
          <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">شرایط عضویت تعیین‌شده توسط مدیر مکتب‌خانه:</span>
            <ul className="list-disc list-inside space-y-0.5 text-slate-700">
              <li>
                <strong>حداقل تعداد کتاب‌های امانتی برای عضویت: </strong>
                {minRequiredBooks > 0 ? (
                  <span className="text-amber-700 font-bold">{minRequiredBooks} جلد کتاب</span>
                ) : (
                  <span className="text-emerald-700 font-bold">بدون اجبار (اختیاری توسط مدیر)</span>
                )}
              </li>
              {systemConfig?.requireAdminApproval && (
                <li>
                  <strong>تایید عضویت: </strong>
                  پس از ثبت، حساب شما توسط مدیر مدرسه بررسی و تایید خواهد شد.
                </li>
              )}
            </ul>
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: User Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-600" />
              <span>۱. مشخصات فردی دانش‌آموز</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  نام و نام خانوادگی <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: علی محمدی"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  کلاس و پایه تحصیلی <span className="text-rose-500">*</span>
                </label>
                <select
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-cyan-500 outline-none"
                >
                  {schoolClasses.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} ({c.grade})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Avatar Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                انتخاب تصویر آواتار دانش‌آموز:
              </label>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {AVATAR_OPTIONS.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt="آواتار"
                    onClick={() => setAvatar(img)}
                    className={`w-12 h-12 rounded-xl object-cover cursor-pointer border-2 transition shrink-0 ${
                      avatar === img ? 'border-cyan-600 scale-105 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Initial Books Contribution */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <BookPlus className="w-4 h-4 text-amber-500" />
                <span>۲. ثبت کتاب برای اشتراک‌گذاری در مکتب‌خانه</span>
              </h3>
              <span className="text-xs font-bold text-slate-500">
                ثبت‌شده: {initialBooks.length} از {minRequiredBooks} جلد حداقل
              </span>
            </div>

            {/* List of Added Books */}
            {initialBooks.length > 0 && (
              <div className="space-y-2">
                {initialBooks.map((b, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-cyan-50/70 border border-cyan-200 p-3 rounded-2xl text-xs font-bold text-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <img src={b.coverImage} alt={b.title} className="w-10 h-12 object-cover rounded-lg shadow-xs" />
                      <div>
                        <div className="font-black text-slate-900">{b.title}</div>
                        <div className="text-[11px] text-slate-500">نویسنده: {b.author} • {b.category}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveBook(index)}
                      className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-xl transition"
                      title="حذف این کتاب"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Book Mini Form */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-cyan-600" />
                <span>مشخصات کتاب جدید را وارد کرده و دکمه «افزودن کتاب» را بزنید:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="عنوان کتاب (مثال: قصه‌های مجید)"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-cyan-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="نام نویسنده (مثال: هوشنگ مرادی کرمانی)"
                  value={bookAuthor}
                  onChange={(e) => setBookAuthor(e.target.value)}
                  className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={bookCategory}
                  onChange={(e) => setBookCategory(e.target.value)}
                  className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-cyan-500 outline-none"
                >
                  <option value="داستان و رمان کودک">داستان و رمان کودک</option>
                  <option value="کودک و نوجوان">کودک و نوجوان</option>
                  <option value="علمی و آموزشی">علمی و آموزشی</option>
                  <option value="مذهبی و قرآنی">مذهبی و قرآنی</option>
                  <option value="کمیک و داستان مصور">کمیک و داستان مصور</option>
                  <option value="شعر و ادبیات">شعر و ادبیات</option>
                </select>

                <select
                  value={bookCondition}
                  onChange={(e) => setBookCondition(e.target.value as BookCondition)}
                  className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-cyan-500 outline-none"
                >
                  <option value="عالی (نو)">وضعیت: عالی (نو)</option>
                  <option value="خوب">وضعیت: خوب</option>
                  <option value="متوسط">وضعیت: متوسط</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleAddBook}
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition flex items-center justify-center gap-1 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>ثبت و افزودن این کتاب به لیست</span>
              </button>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-black text-xs rounded-2xl shadow-lg shadow-cyan-600/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isLoading ? 'در حال ثبت اطلاعات...' : 'تکمیل عضویت و ورود به مکتب‌خانه'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
