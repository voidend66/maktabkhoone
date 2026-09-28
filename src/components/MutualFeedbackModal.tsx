import React, { useState } from 'react';
import { LendingRequest } from '../types';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  X,
  Star,
  CheckCircle2,
  ShieldCheck,
  Heart,
  Sparkles,
  Lock,
  EyeOff,
  AlertTriangle,
  Upload,
  Loader2,
  Trash2,
  FileCheck,
  BookOpen,
  Smile,
  ThumbsUp,
  Award
} from 'lucide-react';

interface MutualFeedbackModalProps {
  request: LendingRequest | null;
  onClose: () => void;
  onSubmitFeedback: (
    requestId: string,
    feedback: {
      punctuality: number;
      condition: number;
      behavior: number;
      reliability: number;
      comment: string;
      isConfidentialToAdmin?: boolean;
      isDamaged?: boolean;
      damageDescription?: string;
      damagePhotoUrl?: string;
    }
  ) => void;
}

const READING_TASTE_TAGS = [
  { id: 'funny', label: '😂 طنز و خیلی خنده‌دار' },
  { id: 'exciting', label: '🚀 پرهیجان و ماجراجویی' },
  { id: 'educational', label: '💡 آموزنده و علمی' },
  { id: 'mystery', label: '🕵️‍♂️ معمایی و کارآگاهی' },
  { id: 'emotional', label: '💖 عاطفی و ماندگار' },
  { id: 'fantasy', label: '🧙‍♂️ جادویی و تخیلی' },
  { id: 'fast_paced', label: '⚡️ روان و سریع‌خوان' },
  { id: 'artistic', label: '🎨 نقاشی و گرافیک زیبا' }
];

export const MutualFeedbackModal: React.FC<MutualFeedbackModalProps> = ({
  request,
  onClose,
  onSubmitFeedback
}) => {
  const { currentUser, addBookReview } = useApp();

  const [punctualityScore, setPunctualityScore] = useState(5);
  const [conditionScore, setConditionScore] = useState(5);
  const [behaviorScore, setBehaviorScore] = useState(5);
  const [reliabilityScore, setReliabilityScore] = useState(5);
  const [comment, setComment] = useState('');
  const [isConfidentialToAdmin, setIsConfidentialToAdmin] = useState(false);

  // Borrower Book Taste & Reading Feedback State (AI Profiling)
  const [bookRating, setBookRating] = useState(5);
  const [bookReviewComment, setBookReviewComment] = useState('');
  const [selectedTasteTags, setSelectedTasteTags] = useState<string[]>([]);
  const [recommendToClassmates, setRecommendToClassmates] = useState<'yes' | 'maybe' | 'no'>('yes');
  const [includeBookExperience, setIncludeBookExperience] = useState(true);

  // Damage reporting state
  const [isDamaged, setIsDamaged] = useState(false);
  const [damageDescription, setDamageDescription] = useState('');
  const [damagePhotoUrl, setDamagePhotoUrl] = useState('');
  const [damagePhotoPreview, setDamagePhotoPreview] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState('');

  if (!request) return null;

  const isBorrower = currentUser?.id === request.borrowerId;
  const isOwner = currentUser?.id === request.ownerId;
  const targetUserName = isBorrower ? request.ownerName : request.borrowerName;
  const targetUserRoleTitle = isBorrower ? 'مالک کتاب (قرض‌دهنده)' : 'امانت‌گیرنده (قرض‌گیرنده)';

  const toggleTag = (label: string) => {
    if (selectedTasteTags.includes(label)) {
      setSelectedTasteTags(selectedTasteTags.filter((t) => t !== label));
    } else {
      setSelectedTasteTags([...selectedTasteTags, label]);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type) && !file.type.startsWith('image/')) {
      setUploadError('فقط فرمت‌های تصویری معتبر (JPG, PNG, WEBP) مجاز هستند.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('حجم فایل تصویر باید کمتر از ۱۰ مگابایت باشد.');
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setDamagePhotoPreview(localUrl);
    setIsUploadingPhoto(true);
    setUploadError('');

    try {
      const res = await api.uploadImage(file);
      if (res.success && res.fileUrl) {
        setDamagePhotoUrl(res.fileUrl);
      } else {
        setUploadError(res.message || 'خطا در بارگذاری تصویر آسیب');
        setDamagePhotoPreview('');
      }
    } catch (err: any) {
      setUploadError(err.message || 'خطا در ارتباط با سرور آپلود');
      setDamagePhotoPreview('');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalIsDamaged = isOwner && isDamaged;

    // 1. Submit loan & peer feedback
    onSubmitFeedback(request.id, {
      punctuality: punctualityScore,
      condition: conditionScore,
      behavior: behaviorScore,
      reliability: reliabilityScore,
      comment: comment.trim(),
      isConfidentialToAdmin,
      isDamaged: finalIsDamaged,
      damageDescription: finalIsDamaged ? damageDescription.trim() : undefined,
      damagePhotoUrl: finalIsDamaged ? damagePhotoUrl.trim() : undefined
    });

    // 2. If borrower and provided reading taste feedback, record book review for collaborative filtering and AI DNA
    if (isBorrower && includeBookExperience && request.bookId) {
      try {
        const tagText = selectedTasteTags.length > 0 ? `[ویژگی‌ها: ${selectedTasteTags.join('، ')}]` : '';
        const recText =
          recommendToClassmates === 'yes'
            ? '🌟 پیشنهاد ۱۰۰٪ به هم‌کلاسی‌ها'
            : recommendToClassmates === 'maybe'
            ? '👍 کتاب متوسط و خوب'
            : '😐 زیاد نپسندیدم';

        const finalReviewComment = [
          bookReviewComment.trim(),
          tagText,
          `[نظر کلی: ${recText}]`
        ]
          .filter(Boolean)
          .join(' - ');

        await addBookReview(request.bookId, bookRating, finalReviewComment || 'کتاب مطالعه و بازگردانده شد.');
      } catch (err) {
        console.error('Error adding book review from loan return:', err);
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-cyan-300" />
            <div>
              <h3 className="font-bold text-base">
                ثبت نظر و ارزیابی {targetUserRoleTitle} ({targetUserName})
              </h3>
              <p className="text-xs text-slate-300">کتاب: «{request.bookTitle}»</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Survey Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Instructions banner */}
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 leading-relaxed flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              {isOwner ? (
                <><strong>پس گرفتن کتاب و ارزیابی امانت‌گیرنده:</strong> نظر و امتیاز شما به خوش‌قولی و نگهداری کتاب توسط {targetUserName} ثبت می‌شود.</>
              ) : (
                <><strong>ارزیابی تجربه امانت از مالک کتاب:</strong> نظر و امتیاز شما به همکاری و کیفیت تحویل کتاب توسط {targetUserName} ثبت می‌شود.</>
              )}
            </span>
          </div>

          {/* Section 1: Post-Reading Taste Profiling for Borrower */}
          {isBorrower && (
            <div className="p-4 bg-gradient-to-br from-indigo-50/90 via-sky-50/80 to-purple-50/90 rounded-2xl border-2 border-indigo-200 space-y-3.5 shadow-xs animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-indigo-950">
                      📚 نظرسنجی و تجربه مطالعه کتاب «{request.bookTitle}»
                    </h4>
                    <p className="text-[10px] text-indigo-700 font-medium">
                      هوش مصنوعی مکتب‌خانه با این پاسخ‌ها، سلیقه و سبک مطالعه شما را دقیق‌تر می‌شناسد! 🧠
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeBookExperience}
                    onChange={(e) => setIncludeBookExperience(e.target.checked)}
                    className="rounded text-indigo-600 w-4 h-4"
                  />
                  <span>ثبت در DNA کتاب‌خوانی</span>
                </label>
              </div>

              {includeBookExperience && (
                <div className="space-y-3 pt-2 border-t border-indigo-200/80">
                  {/* Book Rating Stars */}
                  <div className="bg-white/80 p-3 rounded-xl border border-indigo-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        چقدر از خواندن این کتاب لذت بردی؟
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {bookRating === 5
                          ? 'عالی بود و عاشقش شدم! 😍'
                          : bookRating === 4
                          ? 'خیلی خوب و جذاب بود 👍'
                          : bookRating === 3
                          ? 'معمولی بود 😐'
                          : 'چندان خوشم نیامد 🙁'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setBookRating(star)}
                          className="p-1 hover:scale-125 transition cursor-pointer"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              star <= bookRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Emotion / Taste Tags */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      این کتاب چه ویژگی‌ها و حس‌هایی داشت؟ (انتخاب یک یا چند گزینه):
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {READING_TASTE_TAGS.map((tag) => {
                        const isSelected = selectedTasteTags.includes(tag.label);
                        return (
                          <button
                            type="button"
                            key={tag.id}
                            onClick={() => toggleTag(tag.label)}
                            className={`text-[11px] px-2.5 py-1 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600 text-white shadow-xs scale-102'
                                : 'bg-white text-slate-700 hover:bg-indigo-50 border border-slate-200'
                            }`}
                          >
                            <span>{tag.label}</span>
                            {isSelected && <CheckCircle2 className="w-3 h-3 text-amber-300" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recommendation to classmates */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      آیا خواندن این کتاب را به هم‌کلاسی‌هایت پیشنهاد می‌کنی؟
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setRecommendToClassmates('yes')}
                        className={`p-2 rounded-xl text-xs font-bold border transition text-center ${
                          recommendToClassmates === 'yes'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        🌟 حتماً صددرصد!
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecommendToClassmates('maybe')}
                        className={`p-2 rounded-xl text-xs font-bold border transition text-center ${
                          recommendToClassmates === 'maybe'
                            ? 'bg-amber-500 text-slate-950 font-black border-amber-500 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        👍 بد نبود، خوبه
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecommendToClassmates('no')}
                        className={`p-2 rounded-xl text-xs font-bold border transition text-center ${
                          recommendToClassmates === 'no'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        😐 نه زیاد
                      </button>
                    </div>
                  </div>

                  {/* Brief Book Review Input */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      نظرت یا جذاب‌ترین نکته‌ای که از این کتاب یاد گرفتی (اختیاری):
                    </label>
                    <textarea
                      rows={2}
                      value={bookReviewComment}
                      onChange={(e) => setBookReviewComment(e.target.value)}
                      placeholder="مثلاً: پایان غافلگیرکننده‌ای داشت، یا شخصیت اصلی خیلی باهوش بود..."
                      className="w-full text-xs p-2.5 bg-white border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 2: Peer Review (Borrower/Owner Evaluation) */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-600" />
              <span>امتیازدهی به رفتار و امانت‌داری {targetUserName}:</span>
            </h4>

            {/* Criteria 1: Punctuality */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  {isOwner ? '⏰ ۱. خوش‌قولی در پس دادن به موقع کتاب:' : '⏰ ۱. خوش‌قولی و تحویل به موقع کتاب:'}
                </label>
                <span className="text-xs font-extrabold text-indigo-700">
                  {punctualityScore} از ۵
                </span>
              </div>
              <div className="flex items-center justify-end gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setPunctualityScore(star)}
                    className="p-1 hover:scale-110 transition cursor-pointer"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= punctualityScore ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Criteria 2: Cleanliness & Condition */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  {isOwner ? '✨ ۲. حفظ سلامت، پاکیزگی و جلد کتاب:' : '✨ ۲. مطابقت سلامت و تمیزی کتاب با مشخصات:'}
                </label>
                <span className="text-xs font-extrabold text-indigo-700">
                  {conditionScore} از ۵
                </span>
              </div>
              <div className="flex items-center justify-end gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setConditionScore(star)}
                    className="p-1 hover:scale-110 transition cursor-pointer"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= conditionScore ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Criteria 3: Behavior & Courtesy */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  😊 ۳. رفتار، ادب و برخورد صمیمی:
                </label>
                <span className="text-xs font-extrabold text-indigo-700">
                  {behaviorScore} از ۵
                </span>
              </div>
              <div className="flex items-center justify-end gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setBehaviorScore(star)}
                    className="p-1 hover:scale-110 transition cursor-pointer"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= behaviorScore ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Criteria 4: Reliability & Trustworthiness */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  🤝 ۴. امانت‌داری و مسئولیت‌پذیری کلی:
                </label>
                <span className="text-xs font-extrabold text-indigo-700">
                  {reliabilityScore} از ۵
                </span>
              </div>
              <div className="flex items-center justify-end gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setReliabilityScore(star)}
                    className="p-1 hover:scale-110 transition cursor-pointer"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= reliabilityScore ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment & Confidential Toggle */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <label className="text-xs font-bold text-slate-800 block">
                متن نظر یا پیام شما درباره {targetUserName}:
              </label>
              <textarea
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  isOwner
                    ? 'نظر و تجربه خود را درباره امانت دادن کتاب به این دانش‌آموز بنویسید...'
                    : 'نظر و تجربه خود را درباره دریافت کتاب از این مالک بنویسید...'
                }
                className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
              />

              {/* Confidential Checkbox Feature */}
              <div className="pt-2 border-t border-slate-200/80">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isConfidentialToAdmin}
                    onChange={(e) => setIsConfidentialToAdmin(e.target.checked)}
                    className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      <span>ارسال نظر به صورت محرمانه (فقط برای مدیر سایت)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      اگر این گزینه فعال باشد، متن نظر شما به {targetUserName} نشان داده نخواهد شد و فقط مدیر مکتب‌خانه آن را می‌بیند.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Damage Reporting Option (Only for Lender/Owner) */}
          {isOwner && (
            <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200 space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isDamaged}
                  onChange={(e) => setIsDamaged(e.target.checked)}
                  className="rounded border-rose-300 text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-black text-rose-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  گزارش آسیب دیدن کتاب توسط امانت‌گیرنده (پارگی، خط‌خوردگی، آب‌خوردگی)
                </span>
              </label>

              {isDamaged && (
                <div className="space-y-3 pt-2 border-t border-rose-200 animate-in fade-in">
                  <p className="text-[11px] text-rose-800 leading-relaxed font-medium">
                    طبق قوانین مکتب‌خانه، گزارش آسیب به همراه تصویر مستند برای مدیر سایت ارسال شده و حساب کاربری امانت‌گیرنده تا زمان جبران خسارت به حالت تعلیق درمی‌آید.
                  </p>

                  <div>
                    <label className="block text-[11px] font-bold text-rose-950 mb-1">
                      علت و شرح آسیب وارده به کتاب <span className="text-rose-600">*</span>:
                    </label>
                    <textarea
                      rows={2}
                      value={damageDescription}
                      onChange={(e) => setDamageDescription(e.target.value)}
                      placeholder="مثلا: چند صفحه از فصل سوم کنده شده و جلد پشت لک شده است..."
                      className="w-full text-xs p-2.5 bg-white border border-rose-300 rounded-xl focus:ring-2 focus:ring-rose-500 font-medium"
                      required={isDamaged}
                    />
                  </div>

                  {/* Photo Upload for Damage */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-rose-950">
                      عکس از آسیب کتاب (برای ارسال به مدیر):
                    </label>

                    <div className="flex items-center gap-3 flex-wrap">
                      <label
                        className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-black shadow-2xs flex items-center gap-2 transition ${
                          isUploadingPhoto
                            ? 'bg-slate-200 text-slate-500 cursor-wait'
                            : 'bg-white hover:bg-rose-100 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {isUploadingPhoto ? (
                          <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                        ) : (
                          <Upload className="w-4 h-4 text-rose-600" />
                        )}
                        <span>
                          {isUploadingPhoto ? 'در حال ارسال عکس...' : 'بارگذاری عکس آسیب دیدگی'}
                        </span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/jpg"
                          onChange={handlePhotoUpload}
                          disabled={isUploadingPhoto}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[10px] text-slate-500">
                        (فرمت‌های مجاز: JPG, PNG - حداکثر ۱۰ مگابایت)
                      </span>
                    </div>

                    {(damagePhotoPreview || damagePhotoUrl) && (
                      <div className="flex items-center justify-between p-2.5 bg-white border border-rose-300 rounded-xl">
                        <div className="flex items-center gap-2.5">
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-rose-200 bg-slate-100 shrink-0">
                            <img
                              src={damagePhotoPreview || damagePhotoUrl}
                              alt="پیش‌نمایش آسیب"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-rose-900 block">
                              عکس آسیب با موفقیت پیوست شد ✓
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono dir-ltr">
                              {damagePhotoUrl || 'در حال آماده‌سازی...'}
                            </span>
                          </div>
                        </div>

                        {!isUploadingPhoto && (
                          <button
                            type="button"
                            onClick={() => {
                              setDamagePhotoUrl('');
                              setDamagePhotoPreview('');
                            }}
                            className="text-xs text-rose-600 hover:text-rose-800 font-bold px-2 py-1 hover:bg-rose-50 rounded-lg transition flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            حذف
                          </button>
                        )}
                      </div>
                    )}

                    {uploadError && (
                      <p className="text-[11px] text-rose-600 font-bold">{uploadError}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isDamaged && !damageDescription.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-700 hover:to-indigo-700 text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>ثبت ارزیابی و تکمیل بازگشت کتاب</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
