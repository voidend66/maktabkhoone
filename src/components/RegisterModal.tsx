import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { NewBookInput, BookCondition } from '../types';
import { CATEGORIES } from '../data/mockData';
import { STUDENT_AVATARS } from '../utils/avatars';
import { MaktabKhanehLogo } from './MaktabKhanehBranding';
import { RulesModal } from './RulesModal';
import { api } from '../services/api';
import {
  X,
  UserPlus,
  BookPlus,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Clock,
  Phone,
  Lock,
  User,
  GraduationCap,
  ShieldCheck,
  Upload,
  Image as ImageIcon,
  FileText,
  Loader2
} from 'lucide-react';

import { PRESET_BOOK_COVERS, DEFAULT_BOOK_COVER } from '../utils/coverPresets';

interface RegisterModalProps {
  onClose: () => void;
  onOpenLogin: () => void;
  onOpenRules?: () => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({ onClose, onOpenLogin, onOpenRules }) => {
  const { registerUser, schoolClasses, users, systemConfig } = useApp();
  const minRequired = systemConfig?.minBooksForRegistration ?? 3;
  const maxAllowed = systemConfig?.maxBooksForRegistration ?? 5;

  // Step 1: Personal info & avatar, Step 2: Initial Books
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [className, setClassName] = useState(schoolClasses[0]?.name || '۱۰ تجربی ۱');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatar, setAvatar] = useState(STUDENT_AVATARS[0].url);
  const [agreedToRules, setAgreedToRules] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);

  // Initial Books List
  const [initialBooks, setInitialBooks] = useState<NewBookInput[]>([
    {
      title: 'قصه‌های همکلاسی دانا',
      author: 'مهدی آذر یزدی',
      category: 'داستان و قصه کودک',
      condition: 'عالی (نو)',
      coverImage: PRESET_BOOK_COVERS[0].url,
      description: 'کتاب قصه صمیمی و جذاب برای مطالعه اعضای مکتب خونه.'
    },
    {
      title: 'رازهای شگفت‌انگیز جهان',
      author: 'هارون یحیی',
      category: 'علمی و رازهای جهان',
      condition: 'خوب',
      coverImage: PRESET_BOOK_COVERS[2].url,
      description: 'تصاویری جذاب و دانستنی درباره سیارات و طبیعت.'
    },
    {
      title: 'ترانه‌ها و شعرهای خندان',
      author: 'مصطفی رحماندوست',
      category: 'شعر و ترانه کودکانه',
      condition: 'عالی (نو)',
      coverImage: PRESET_BOOK_COVERS[3].url,
      description: 'شعرهای خواندنی و شاد.'
    }
  ]);

  // Single Book Entry state inside Step 2
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookCategory, setBookCategory] = useState(CATEGORIES[1]);
  const [bookCondition, setBookCondition] = useState<BookCondition>('عالی (نو)');
  const [bookCoverImage, setBookCoverImage] = useState(DEFAULT_BOOK_COVER);
  const [bookCoverPreview, setBookCoverPreview] = useState('');
  const [bookDescription, setBookDescription] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle Photo Upload directly to SQLite / disk storage
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type) && !file.type.startsWith('image/')) {
      setErrorMessage('فقط فرمت‌های تصویری معتبر (JPG, JPEG, PNG, WEBP) مجاز هستند.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('حجم عکس باید کمتر از ۱۰ مگابایت باشد.');
      return;
    }

    // Instant local preview
    const localUrl = URL.createObjectURL(file);
    setBookCoverPreview(localUrl);
    setIsUploading(true);
    setErrorMessage('');

    try {
      const uploadRes = await api.uploadImage(file);
      if (uploadRes.success && uploadRes.fileUrl) {
        setBookCoverImage(uploadRes.fileUrl);
      } else {
        setErrorMessage(uploadRes.message || 'خطا در آپلود عکس روی سرور');
        setBookCoverPreview('');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'خطا در آپلود فایل');
      setBookCoverPreview('');
    } finally {
      setIsUploading(false);
    }
  };

  // Single Step Registration Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim() || !phone.trim() || !password.trim() || !confirmPassword.trim()) {
      setErrorMessage('لطفاً تمامی فیلدهای نام، شماره تلفن، رمز عبور و تکرار آن را پر کنید.');
      return;
    }

    if (phone.length < 10) {
      setErrorMessage('لطفاً شماره تلفن همراه معتبر (والدین/دانش‌آموز) وارد کنید.');
      return;
    }

    const cleanInputPhone = phone.replace(/\D/g, '');
    const alreadyExists = users.some((u) => {
      const uClean = u.phone.replace(/\D/g, '');
      return uClean === cleanInputPhone || u.phone === phone.trim() || (cleanInputPhone.length >= 10 && uClean.endsWith(cleanInputPhone.slice(-10)));
    });

    if (alreadyExists) {
      setErrorMessage('این شماره تلفن قبلاً در سامانه ثبت‌نام کرده است. لطفاً از بخش «ورود به حساب» وارد شوید.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('رمز عبور و تکرار آن با یکدیگر مطابقت ندارند!');
      return;
    }

    if (!agreedToRules) {
      setErrorMessage('برای عضویت در مکتب‌خانه، حتماً باید قوانین و مقررات را مطالعه کرده و تایید نمایید.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await registerUser({
        name: name.trim(),
        className,
        phone: phone.trim(),
        password: password.trim(),
        avatar,
        agreedToRules: true,
        initialBooks: []
      });

      if (res.success) {
        setSuccessMessage(res.message);
      } else {
        const msg = res.message || 'خطا در ثبت‌نام';
        setErrorMessage(msg);
        api.reportError('خطا در فرم ثبت‌نام اعضا', msg, 'error');
      }
    } catch (err: any) {
      const msg = err.message || 'خطا در ثبت‌نام';
      setErrorMessage(msg);
      api.reportError('استثنا در فرم ثبت‌نام اعضا', err.stack || msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border-2 border-cyan-400 my-8">
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-600 via-sky-700 to-indigo-950 text-white p-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs border border-white/20">
                <UserPlus className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h3 className="font-black text-lg text-white">ثبت‌نام عضو جدید در مکتب خونه 🎒</h3>
                <p className="text-xs text-cyan-100 font-bold">
                  مشخصات فردی، آواتار ۳ بعدی و تایید قوانین عضویت
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {successMessage ? (
              <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-black text-slate-900 text-lg">ثبت‌نام در مکتب خونه با موفقیت انجام شد! 🎉</h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                  {successMessage}
                </p>
                <div className="p-3 bg-white rounded-xl border border-emerald-200 text-xs text-amber-800 font-semibold flex items-center gap-2 justify-center">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>حساب کاربری پس از بررسی مدیریت فعال می‌گردد.</span>
                </div>
                <button
                  onClick={onClose}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition"
                >
                  متوجه شدم (بستن)
                </button>
              </div>
            ) : (
              /* REGISTRATION FORM */
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                {errorMessage && (
                  <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* 3D Avatar Selector */}
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-2">
                    انتخاب آواتار کارتونی و ۳ بعدی حساب کاربری 🎨:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {STUDENT_AVATARS.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setAvatar(item.url)}
                        title={item.description}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition ${
                          avatar === item.url
                            ? 'border-cyan-500 bg-cyan-50 ring-2 ring-cyan-500 scale-105 shadow-md'
                            : 'border-slate-200 bg-slate-50 opacity-80 hover:opacity-100 hover:border-cyan-300'
                        }`}
                      >
                        <img src={item.url} alt="آواتار کارتونی ۳ بعدی" className="w-14 h-14 rounded-full shadow-xs object-cover" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Name & Class */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-black text-slate-700 block mb-1">
                      نام و نام خانوادگی عضو *:
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-cyan-600 absolute right-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="مثلا: حسام رضایی"
                        className="w-full text-xs pr-9 pl-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 font-bold"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-700 block mb-1">
                      رده یا پایه تحصیلی *:
                    </label>
                    <div className="relative">
                      <GraduationCap className="w-4 h-4 text-cyan-600 absolute right-3 top-1/2 -translate-y-1/2" />
                      <select
                        value={className}
                        onChange={(e) => setClassName(e.target.value)}
                        className="w-full text-xs pr-9 pl-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 font-bold text-slate-800"
                      >
                        {schoolClasses.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">
                    شماره همراه معتبر (جهت تماس و بازیابی) *:
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-cyan-600 absolute right-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="09123456789"
                      className="w-full text-xs pr-9 pl-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 text-left font-bold text-slate-800"
                      dir="ltr"
                      required
                    />
                  </div>
                </div>

                {/* Passwords double entry */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-black text-slate-700 block mb-1">
                      رمز عبور حساب *:
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-cyan-600 absolute right-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-xs pr-9 pl-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 text-left font-semibold"
                        dir="ltr"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-700 block mb-1">
                      تکرار رمز عبور *:
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-cyan-600 absolute right-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-xs pr-9 pl-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 text-left font-semibold"
                        dir="ltr"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Mandatory Rules Agreement Box */}
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id="agree_rules"
                      checked={agreedToRules}
                      onChange={(e) => setAgreedToRules(e.target.checked)}
                      className="w-4.5 h-4.5 text-orange-600 rounded-xs border-amber-300 focus:ring-orange-500 mt-0.5 cursor-pointer"
                    />
                    <label htmlFor="agree_rules" className="text-xs text-amber-950 font-bold leading-relaxed cursor-pointer">
                      <strong>قوانین و مقررات مکتب خونه را مطالعه نموده و می‌پذیرم.</strong> (تایید محدودیت امانت ۱ کتاب، هزینه ۱۰ هزار تومانی، مهلت ۱۲ ساعته تایید و مسئولیت حفظ سلامت کتاب).
                    </label>
                  </div>
                  <div className="flex items-center gap-3 mr-6">
                    <button
                      type="button"
                      onClick={() => setShowRulesModal(true)}
                      className="text-[11px] text-orange-600 font-black hover:underline flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>مشاهده در پنجره سریع</span>
                    </button>
                    {onOpenRules && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenRules();
                        }}
                        className="text-[11px] text-cyan-700 font-black hover:underline flex items-center gap-1"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>صفحه کامل قوانین سایت</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={onOpenLogin}
                    className="text-xs text-cyan-700 font-bold hover:underline"
                  >
                    قبلاً ثبت‌نام کرده‌اید؟ ورود
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 text-white font-black text-xs rounded-xl shadow-md shadow-cyan-600/20 transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <span>{isSubmitting ? 'در حال ثبت‌نام...' : 'تکمیل ثبت‌نام دانش‌آموز'}</span>
                    <CheckCircle2 className="w-4 h-4 text-amber-300" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {showRulesModal && (
        <RulesModal isOpen={true} onClose={() => setShowRulesModal(false)} />
      )}
    </>
  );
};

