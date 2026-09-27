import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Book, AiRecommendationResult } from '../types';
import { getSafeImageUrl, DEFAULT_BOOK_COVER } from '../utils/coverPresets';
import {
  Sparkles,
  X,
  Bot,
  Compass,
  Smile,
  Zap,
  BookOpen,
  Search,
  CheckCircle2,
  Clock,
  Palette,
  RotateCcw,
  ExternalLink,
  ChevronLeft,
  Flame,
  HelpCircle,
  Cpu
} from 'lucide-react';

const FUN_FACTS = [
  'خواندن روزانه ۱۵ دقیقه کتاب، دایره لغاتت را تا ۱ میلیون کلمه در سال افزایش می‌دهد! 📖',
  'غرق شدن در یک کتاب داستانی، می‌تواند استرس روزانه را تا ۶۸٪ کاهش دهد. 🌿',
  'در مکتب‌خانه با امانت دادن هر کتاب، نامت در جدول افتخارات مدرسه ثبت می‌شود! 🎖️',
  'کتاب‌های معمایی و ماجراجویی، مهارت حل مسئله و هوش تحلیلی را تقویت می‌کنند. 🕵️‍♂️',
  'امانت گرفتن کتاب به جای خرید، هم باعث صرفه‌جویی مالی می‌شود و هم درختان را نجات می‌دهد! 🌳'
];

interface AiBookAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBook: (book: Book) => void;
  onRequestLoan: (bookId: string) => void;
}

export const AiBookAdvisorModal: React.FC<AiBookAdvisorModalProps> = ({
  isOpen,
  onClose,
  onSelectBook,
  onRequestLoan
}) => {
  const { getAiBookRecommendations, currentUser, systemConfig } = useApp();

  const [mood, setMood] = useState<string>('laugh');
  const [readingTime, setReadingTime] = useState<string>('medium');
  const [visualPreference, setVisualPreference] = useState<string>('any');
  const [customPrompt, setCustomPrompt] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<AiRecommendationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    let interval: any;
    if (isLoading) {
      setElapsedSeconds(0);
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  if (!isOpen) return null;

  const aiConfig = systemConfig?.aiConfig;
  const isAiEnabled = aiConfig?.enabled !== false;

  const MOOD_OPTIONS = [
    {
      id: 'laugh',
      title: 'خنده، شوخی و خوش‌گذرانی',
      desc: 'ماجراهای طنز، کارهای خنده‌دار بچه‌ها و اتفاقات عجیب مدرسه',
      icon: '😄',
      color: 'from-amber-500/15 to-yellow-500/10 border-amber-300 text-amber-900'
    },
    {
      id: 'adventure',
      title: 'ماجراجویی و کشف دنیاها',
      desc: 'سفرهای پرحادثه، نبردهای جادویی و فانتزی‌های غیرمنتظره',
      icon: '🚀',
      color: 'from-sky-500/15 to-indigo-500/10 border-sky-300 text-sky-900'
    },
    {
      id: 'mystery',
      title: 'معمایی و کارآگاهی',
      desc: 'حل سرنخ‌ها، معماهای پلیسی و رازهایی که تا صفحه آخر پنهانند',
      icon: '🕵️',
      color: 'from-purple-500/15 to-violet-500/10 border-purple-300 text-purple-900'
    },
    {
      id: 'thoughtful',
      title: 'انگیزشی و داستان واقعی',
      desc: 'داستان‌های عمیق، غلبه بر سختی‌ها، امید و رشد فردی',
      icon: '💡',
      color: 'from-emerald-500/15 to-teal-500/10 border-emerald-300 text-emerald-900'
    },
    {
      id: 'scientific',
      title: 'دانستنی‌ها و شگفتی‌های علم',
      desc: 'حقایق هیجان‌انگیز از فضا، حیوانات، طبیعت و تاریخ زمین',
      icon: '🔬',
      color: 'from-cyan-500/15 to-blue-500/10 border-cyan-300 text-cyan-900'
    },
    {
      id: 'thriller',
      title: 'دلهره‌آور و پرهیجان',
      desc: 'داستان‌های نفس‌گیر و هیجانی برای لحظات پر از آدرنالین',
      icon: '👻',
      color: 'from-rose-500/15 to-orange-500/10 border-rose-300 text-rose-900'
    }
  ];

  const TIME_OPTIONS = [
    {
      id: 'quick',
      title: '⚡️ سریع و زودخوان',
      desc: 'زیر ۱۲۰ صفحه (سریع تمام شود)'
    },
    {
      id: 'medium',
      title: '📖 متوسط و استاندارد',
      desc: '۱۲۰ تا ۲۵۰ صفحه (رمان چند روزه)'
    },
    {
      id: 'deep',
      title: '📚 مفصل و پرماجرا',
      desc: 'بیش از ۲۵۰ صفحه (غرق در داستان)'
    },
    {
      id: 'any',
      title: '🎲 هر حجمی بود خوبه',
      desc: 'مهم داستان جذابشه!'
    }
  ];

  const VISUAL_OPTIONS = [
    { id: 'illustrations', title: '🎨 پر از تصویرگری و نقاشی (مثل کمیک)' },
    { id: 'text', title: '✍️ متن داستانی کامل (ادبی و پیوسته)' },
    { id: 'any', title: '🎲 هر دو حالت عالیه' }
  ];

  const QUICK_IDEAS = [
    'کتابی شبیه تام گیتس یا دفترچه خاطرات یک بی‌عرضه',
    'یک ماجرای معمایی که آخرش غافلگیرکننده باشه',
    'کتاب کم‌حجم و خنده‌دار برای رفع خستگی درس',
    'داستان فانتزی پر از جادو و قهرمان‌ها'
  ];

  const handleAskAdvisor = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await getAiBookRecommendations({
        mood,
        readingTime,
        visualPreference,
        gradeLevel: currentUser?.className || undefined,
        customPrompt: customPrompt.trim() || undefined
      });

      if (res && res.success) {
        setResult(res);
      } else {
        setErrorMsg(res?.message || 'متأسفانه پیشنهادی یافت نشد. لطفاً سلیقه دیگری را امتحان کنید.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ارتباط با مشاور کتاب');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-100 my-6 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal Bar */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between gap-3 shrink-0 border-b border-indigo-800/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-slate-950 shadow-md shrink-0">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-1.5">
                  <span>کتابدار هوشمند مکتب‌خانه</span>
                  <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" />
                </h3>
                <span className="text-[10px] bg-sky-500/20 text-sky-300 border border-sky-400/30 px-2.5 py-0.5 rounded-full font-bold">
                  راهنمای هوشمند
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                نمی‌دانی چه کتابی بخوانی؟ با چند انتخاب، بهترین کتاب قفسه را پیدا کن!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition shrink-0 cursor-pointer"
            aria-label="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto grow space-y-6">
          {isLoading ? (
            /* Delightful Loading & Thinking Screen */
            <div className="py-8 px-3 sm:px-6 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-300">
              {/* Animated Floating Robot / Avatar with Glowing Ripple Rings */}
              <div className="relative my-3">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-500 blur-2xl opacity-40 animate-pulse scale-125" />
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-2xl relative z-10 animate-bounce duration-1000">
                  <Bot className="w-12 h-12 text-white" />
                  <Sparkles className="w-6 h-6 text-yellow-300 absolute -top-2 -right-2 animate-spin" />
                </div>
              </div>

              {/* Dynamic Phase Headline & Explanation */}
              <div className="space-y-2.5 max-w-lg">
                <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200/80 px-3.5 py-1 rounded-full text-indigo-700 text-xs font-black shadow-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping" />
                  <span>در حال تفکر و پردازش هوشمند ({elapsedSeconds} ثانیه)</span>
                </div>

                <h3 className="text-base sm:text-lg font-black text-slate-900 transition-all duration-500 min-h-[30px] flex items-center justify-center">
                  {elapsedSeconds < 8 && '📚 در حال بررسی قفسه‌های کتابخانه مدرسه...'}
                  {elapsedSeconds >= 8 && elapsedSeconds < 18 && '🔍 تطبیق خلاصه کتاب‌ها با حس‌وحال و سلیقه شما...'}
                  {elapsedSeconds >= 18 && elapsedSeconds < 30 && '💡 تحلیل عمیق و گزینش بهترین داستان‌های مناسب شما...'}
                  {elapsedSeconds >= 30 && elapsedSeconds < 45 && '✍️ در حال نوشتن راهنمای جذاب و دلایل اختصاصی هر کتاب...'}
                  {elapsedSeconds >= 45 && '✨ تقریباً آماده شد! تا چند لحظه دیگر کتاب‌هایت ظاهر می‌شوند...'}
                </h3>

                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
                  {elapsedSeconds < 8 && 'کتابدار هوشمند مکتب‌خانه کتاب‌های موجود در مدرسه را ورق می‌زند تا کتاب‌های متناسب با روحیه‌ات را پیدا کند.'}
                  {elapsedSeconds >= 8 && elapsedSeconds < 18 && 'تعداد صفحات، موضوعات و هشتگ‌های هر کتاب با سلیقه انتخابی شما تطبیق داده می‌شود.'}
                  {elapsedSeconds >= 18 && elapsedSeconds < 30 && 'مدل هوش مصنوعی در حال سنجش جذابیت داستان‌هاست تا مطمئن شود از خواندن آن‌ها لذت می‌برید.'}
                  {elapsedSeconds >= 30 && elapsedSeconds < 45 && 'نکات خواندنی و دلایل پیشنهاد برای تک‌تک کتاب‌ها با لحنی خودمانی آماده می‌شود.'}
                  {elapsedSeconds >= 45 && 'دستورهای نهایی صادر شد و نتایج به زودی روی صفحه به نمایش درمی‌آید.'}
                </p>
              </div>

              {/* Smooth Progress Bar & Time Counter */}
              <div className="w-full max-w-md space-y-2.5">
                <div className="flex items-center justify-between text-xs text-slate-500 font-bold px-1">
                  <span className="flex items-center gap-1.5 text-indigo-600 font-black">
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    <span>زمان سپری‌شده: {elapsedSeconds} ثانیه</span>
                  </span>
                  <span className="text-slate-400 font-mono">
                    {Math.min(95, Math.round(15 + (elapsedSeconds / 45) * 80))}%
                  </span>
                </div>

                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className="h-full bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-500 rounded-full transition-all duration-500 shadow-xs"
                    style={{
                      width: `${Math.min(95, Math.round(15 + (elapsedSeconds / 45) * 80))}%`
                    }}
                  />
                </div>

                <span className="text-[11px] text-slate-400 block font-medium">
                  ⏳ به دلیل تحلیل دقیق تمام کتاب‌ها، پیشنهاد هوشمند حدود ۳۰ تا ۴۰ ثانیه زمان می‌برد.
                </span>
              </div>

              {/* Dynamic Fun Fact / Tip Card */}
              <div className="w-full max-w-md p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-right flex items-start gap-2.5 shadow-xs animate-in fade-in">
                <span className="text-xl shrink-0 mt-0.5">💡</span>
                <div className="text-xs text-amber-950 leading-relaxed">
                  <strong className="block text-amber-900 font-black text-[11px] mb-0.5">آیا می‌دانستی؟</strong>
                  <p>{FUN_FACTS[Math.floor(elapsedSeconds / 8) % FUN_FACTS.length]}</p>
                </div>
              </div>
            </div>
          ) : !result ? (
            /* Question Flow Form */
            <div className="space-y-6">
              {/* Question 1: Mood */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-black">
                      ۱
                    </span>
                    <span>امروز حال و هوای چه کتابی رو داری؟</span>
                  </label>
                  <span className="text-[11px] text-slate-400">یکی را انتخاب کن</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {MOOD_OPTIONS.map((opt) => {
                    const isSelected = mood === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setMood(opt.id)}
                        className={`p-3 rounded-2xl border-2 text-right transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/70 shadow-sm ring-2 ring-indigo-500/20'
                            : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-2xl">{opt.icon}</span>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                          )}
                        </div>
                        <div className="mt-2">
                          <h4 className="text-xs font-black text-slate-900">{opt.title}</h4>
                          <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                            {opt.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Question 2: Reading Time / Length */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-black">
                      ۲
                    </span>
                    <span>چقدر وقت و حوصله مطالعه داری؟</span>
                  </label>
                  <span className="text-[11px] text-slate-400">تعداد صفحات تقریبی</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {TIME_OPTIONS.map((opt) => {
                    const isSelected = readingTime === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setReadingTime(opt.id)}
                        className={`p-3 rounded-2xl border-2 text-center transition cursor-pointer ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/70 shadow-sm font-bold text-indigo-950'
                            : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                        }`}
                      >
                        <div className="text-xs font-black">{opt.title}</div>
                        <div className="text-[10px] text-slate-500 mt-1">{opt.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Question 3: Visual Style */}
              <div className="space-y-2.5">
                <label className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-black">
                    ۳
                  </span>
                  <span>سبک کتاب چطور باشه؟</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {VISUAL_OPTIONS.map((opt) => {
                    const isSelected = visualPreference === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setVisualPreference(opt.id)}
                        className={`p-2.5 rounded-xl border text-xs text-center transition cursor-pointer font-bold ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-500'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {opt.title}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Question 4: Free-text prompt / specific wish */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-black">
                      ۴
                    </span>
                    <span>سفارش یا خواسته خاصی داری؟ (اختیاری):</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    نام کتاب‌های قبلی مورد علاقه‌ات یا کلمات دلخواهت
                  </span>
                </div>

                <div className="relative">
                  <textarea
                    rows={2}
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="مثال: من تام گیتس رو خیلی دوست داشتم یا یک رمان ماجراجویی مدرسه‌ای که شخصیت اصلی‌اش زرنگ باشه..."
                    className="w-full p-3 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 leading-relaxed"
                  />
                </div>

                {/* Quick Idea Badges */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 font-bold ml-1">پیشنهادهای آماده:</span>
                  {QUICK_IDEAS.map((idea, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCustomPrompt(idea)}
                      className="text-[10px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200 transition cursor-pointer"
                    >
                      {idea}
                    </button>
                  ))}
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 text-rose-800 rounded-2xl text-xs font-bold border border-rose-200">
                  ⚠️ {errorMsg}
                </div>
              )}
            </div>
          ) : (
            /* Results View */
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Advisor Greeting Bubble */}
              <div className="p-4 bg-gradient-to-r from-sky-50 via-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 text-slate-800 text-xs sm:text-sm leading-relaxed flex items-start gap-3 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-black text-indigo-950 text-xs sm:text-sm">
                      پیام کتابدار هوشمند:
                    </span>
                    <span className="text-[10px] bg-white/90 px-2.5 py-0.5 rounded-md border border-indigo-200 text-indigo-700 flex items-center gap-1 font-bold">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      {result.isAiGenerated
                        ? 'پیشنهاد هوشمند اختصاصی'
                        : 'تطابق هوشمند قفسه کتابخانه'}
                    </span>
                  </div>
                  <p className="text-slate-700 font-medium whitespace-pre-line text-xs sm:text-sm">
                    {result.greeting}
                  </p>
                </div>
              </div>

              {/* Recommended Books Grid */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-900 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>کتاب‌های پیشنهادی مخصوص تو:</span>
                  </span>
                  <span className="text-xs text-slate-500 font-normal">
                    ({result.recommendedBooks.length} کتاب منتخب)
                  </span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.recommendedBooks.map(({ book, reason }, idx) => (
                    <div
                      key={book.id || idx}
                      className="p-4 rounded-3xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
                    >
                      <div className="flex gap-3.5">
                        {/* Book Cover */}
                        <div
                          onClick={() => onSelectBook(book)}
                          className="w-20 sm:w-24 aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-xs shrink-0 cursor-pointer relative group-hover:scale-102 transition"
                        >
                          <img
                            src={getSafeImageUrl(book.coverImage, 'book')}
                            alt={book.title}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = DEFAULT_BOOK_COVER;
                            }}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Book Info */}
                        <div className="min-w-0 flex-1 space-y-1">
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md inline-block">
                            {book.category}
                          </span>

                          <h5
                            onClick={() => onSelectBook(book)}
                            className="text-xs sm:text-sm font-black text-slate-900 hover:text-indigo-600 transition truncate cursor-pointer"
                            title={book.title}
                          >
                            {book.title}
                          </h5>

                          <p className="text-[11px] text-slate-500 font-semibold truncate">
                            نویسنده: <span className="text-slate-700">{book.author}</span>
                          </p>

                          {book.pageCount && (
                            <p className="text-[10px] text-slate-400">
                              تعداد صفحات: <strong className="text-slate-600">{book.pageCount} صفحه</strong>
                            </p>
                          )}

                          <p className="text-[10px] text-slate-400">
                            مالک: <span className="text-slate-600 font-bold">{book.ownerName}</span> ({book.ownerClass})
                          </p>
                        </div>
                      </div>

                      {/* AI Reasoning Bubble */}
                      <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-[11px] text-amber-950 leading-relaxed">
                        <span className="font-extrabold text-amber-900 block mb-0.5 flex items-center gap-1">
                          <span>💡 چرا این کتاب برات عالیه؟</span>
                        </span>
                        <p>{reason}</p>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                        <button
                          onClick={() => {
                            onClose();
                            onRequestLoan(book.id);
                          }}
                          className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>درخواست امانت 📖</span>
                        </button>

                        <button
                          onClick={() => onSelectBook(book)}
                          className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                          title="مشاهده جزئیات بیشتر کتاب"
                        >
                          <span>جزئیات</span>
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 shrink-0 flex items-center justify-between gap-3 flex-wrap">
          {isLoading ? (
            <div className="flex items-center justify-between w-full flex-wrap gap-2">
              <div className="flex items-center gap-2 text-xs text-indigo-900 font-bold">
                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span>کتابدار هوشمند در حال تحلیل و آماده‌سازی پیشنهادهاست ({elapsedSeconds} ثانیه)...</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold transition cursor-pointer"
              >
                انصراف و بستن
              </button>
            </div>
          ) : !result ? (
            <>
              <div className="text-[11px] text-slate-500 hidden sm:flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-indigo-500" />
                <span>پاسخ توسط مدل زبانی محلی در شبکه داخلی پردازش می‌شود.</span>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition cursor-pointer"
                >
                  انصراف
                </button>

                <button
                  type="button"
                  onClick={handleAskAdvisor}
                  disabled={isLoading}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>کتابدار در حال بررسی قفسه‌هاست...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-yellow-300" />
                      <span>پیشنهاد بده، کتابدار هوشمند! 🪄</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>تغییر سلیقه و جستجوی دوباره</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition cursor-pointer"
              >
                متوجه شدم، بستن
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
