import React, { useState, useMemo, useRef } from 'react';
import { MedalTier } from '../types';
import {
  PRESET_3D_IMAGES,
  STANDARD_GENRES,
  CustomMedalData,
  CustomMedalRuleConfig,
  CustomMedalPerksConfig,
  formatPerksSummary,
  getTierBadgeStyle
} from '../data/medalsData';
import {
  Sparkles,
  X,
  Plus,
  Sliders,
  CheckCircle2,
  Award,
  BookOpen,
  Gift,
  Star,
  MessageSquare,
  Trophy,
  Zap,
  Lock,
  Compass,
  Clock,
  Upload,
  Image as ImageIcon,
  Link,
  ShieldCheck,
  Pin,
  TrendingUp,
  FileCheck,
  Percent,
  Check
} from 'lucide-react';

interface CreateCustomMedalModalProps {
  onClose: () => void;
  onSuccess: (newMedal: CustomMedalData) => void;
  availableClasses?: string[];
}

export const CreateCustomMedalModal: React.FC<CreateCustomMedalModalProps> = ({
  onClose,
  onSuccess,
  availableClasses = []
}) => {
  // 1. Basic Metadata
  const [title, setTitle] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [icon, setIcon] = useState('🌟');
  const [tier, setTier] = useState<MedalTier>('gold');
  const [level, setLevel] = useState<number>(3);
  const [description, setDescription] = useState('');
  const [occasion, setOccasion] = useState('');

  // 2. Image Selection & Upload
  const [imageMode, setImageMode] = useState<'presets' | 'upload' | 'url'>('presets');
  const [selectedPresetUrl, setSelectedPresetUrl] = useState(PRESET_3D_IMAGES[0].url);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active image url for preview
  const activeImageUrl = useMemo(() => {
    if (imageMode === 'presets') return selectedPresetUrl;
    if (customImageUrl.trim()) return customImageUrl.trim();
    return selectedPresetUrl;
  }, [imageMode, selectedPresetUrl, customImageUrl]);

  // Handle file upload to /api/upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('لطفاً یک فایل تصویری (JPG, PNG, WEBP) انتخاب کنید.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('حجم تصویر نباید بیشتر از ۵ مگابایت باشد.');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error('خطا در آپلود فایل');

      const data = await res.json();
      if (data.fileUrl) {
        setCustomImageUrl(data.fileUrl);
        setImageMode('upload');
      } else {
        throw new Error('آدرس تصویر دریافت نشد.');
      }
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || 'خطا در بارگذاری تصویر روی سرور.');
    } finally {
      setIsUploading(false);
    }
  };

  // 3. Advanced Perks Config
  const [freeLoanCredits, setFreeLoanCredits] = useState<number>(0);
  const [leagueMultiplier, setLeagueMultiplier] = useState<number>(1);
  const [bonusLeaguePoints, setBonusLeaguePoints] = useState<number>(0);
  const [honoraryTitle, setHonoraryTitle] = useState<string>('');
  const [verifiedShield, setVerifiedShield] = useState<boolean>(false);
  const [pinnedReviews, setPinnedReviews] = useState<boolean>(false);
  const [canSuggestPurchases, setCanSuggestPurchases] = useState<boolean>(false);
  const [certificateEligible, setCertificateEligible] = useState<boolean>(false);
  const [customPerkText, setCustomPerkText] = useState<string>('');

  // 4. Advanced Logic & Rules Config
  const [awardType, setAwardType] = useState<'auto' | 'manual_only'>('auto');
  const [matchMode, setMatchMode] = useState<'all' | 'any'>('all');
  const [targetClass, setTargetClass] = useState<string>('all');

  // Reading rules
  const [enableMinRead, setEnableMinRead] = useState<boolean>(true);
  const [minBooksRead, setMinBooksRead] = useState<number>(5);

  const [enableTargetGenre, setEnableTargetGenre] = useState<boolean>(false);
  const [targetGenre, setTargetGenre] = useState<string>(STANDARD_GENRES[0]);
  const [minBooksInGenre, setMinBooksInGenre] = useState<number>(3);

  const [enableMinGenres, setEnableMinGenres] = useState<boolean>(false);
  const [minDistinctGenres, setMinDistinctGenres] = useState<number>(3);

  // Lending rules
  const [enableReturnedLoans, setEnableReturnedLoans] = useState<boolean>(false);
  const [minReturnedLoans, setMinReturnedLoans] = useState<number>(3);

  const [requireZeroDelays, setRequireZeroDelays] = useState<boolean>(false);
  const [requireFastReturn, setRequireFastReturn] = useState<boolean>(false);

  const [enableMinRating, setEnableMinRating] = useState<boolean>(false);
  const [minRating, setMinRating] = useState<number>(4.8);

  // Contribution rules
  const [enableMinContributed, setEnableMinContributed] = useState<boolean>(false);
  const [minBooksContributed, setMinBooksContributed] = useState<number>(2);

  // Review rules
  const [enableMinReviews, setEnableMinReviews] = useState<boolean>(false);
  const [minReviews, setMinReviews] = useState<number>(3);

  const [enableMinReviewWords, setEnableMinReviewWords] = useState<boolean>(false);
  const [minReviewWords, setMinReviewWords] = useState<number>(30);

  // League rules
  const [enableMaxRank, setEnableMaxRank] = useState<boolean>(false);
  const [maxLeagueRank, setMaxLeagueRank] = useState<number>(1);

  const [enableMinPoints, setEnableMinPoints] = useState<boolean>(false);
  const [minLeaguePoints, setMinLeaguePoints] = useState<number>(250);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formatted Perks Summary
  const autoPropertyDesc = useMemo(() => {
    const perksObj: CustomMedalPerksConfig = {
      freeLoanCredits: freeLoanCredits > 0 ? freeLoanCredits : undefined,
      leagueMultiplier: leagueMultiplier > 1 ? leagueMultiplier : undefined,
      bonusLeaguePoints: bonusLeaguePoints > 0 ? bonusLeaguePoints : undefined,
      honoraryTitle: honoraryTitle.trim() || undefined,
      verifiedShield: verifiedShield || undefined,
      pinnedReviews: pinnedReviews || undefined,
      canSuggestPurchases: canSuggestPurchases || undefined,
      certificateEligible: certificateEligible || undefined,
      customPerkText: customPerkText.trim() || undefined
    };

    return formatPerksSummary(perksObj);
  }, [
    freeLoanCredits,
    leagueMultiplier,
    bonusLeaguePoints,
    honoraryTitle,
    verifiedShield,
    pinnedReviews,
    canSuggestPurchases,
    certificateEligible,
    customPerkText
  ]);

  // Auto generated criteria description
  const autoCriteriaDesc = useMemo(() => {
    if (awardType === 'manual_only') {
      return 'اعطای اختصاصی با صلاحدید و یادداشت تقدیر مدیر مدرسه.';
    }
    const parts: string[] = [];
    if (targetClass !== 'all') {
      parts.push(`مختص دانش‌آموزان ${targetClass}`);
    }
    if (enableMinRead && minBooksRead > 0) {
      parts.push(`مطالعه حداقل ${minBooksRead} جلد کتاب`);
    }
    if (enableTargetGenre && minBooksInGenre > 0) {
      parts.push(`مطالعه حداقل ${minBooksInGenre} کتاب در ژانر «${targetGenre}»`);
    }
    if (enableMinGenres && minDistinctGenres > 0) {
      parts.push(`مطالعه کتاب در حداقل ${minDistinctGenres} دسته‌بندی موضوعی متفاوت`);
    }
    if (enableReturnedLoans && minReturnedLoans > 0) {
      parts.push(`حداقل ${minReturnedLoans} عودت موفق کتاب`);
    }
    if (requireZeroDelays) {
      parts.push('خوش‌قولی ۱۰۰٪ و عودت بدون حتی یک روز تاخیر');
    }
    if (requireFastReturn) {
      parts.push('عودت سریع در کمتر از ۷۲ ساعت');
    }
    if (enableMinRating && minRating > 0) {
      parts.push(`کسب میانگین رضایت بالای ${minRating} ستاره`);
    }
    if (enableMinContributed && minBooksContributed > 0) {
      parts.push(`اهدای حداقل ${minBooksContributed} جلد کتاب به کتابخانه مدرسه`);
    }
    if (enableMinReviews && minReviews > 0) {
      parts.push(`ثبت حداقل ${minReviews} نقد و تحلیل`);
    }
    if (enableMinReviewWords && minReviewWords > 0) {
      parts.push(`نگارش نقد تحلیلی جامع بالای ${minReviewWords} کلمه`);
    }
    if (enableMaxRank && maxLeagueRank > 0) {
      parts.push(
        maxLeagueRank === 1 ? 'کسب رتبه ۱ در لیگ ماهانه' : `قرارگیری در رتبه ${maxLeagueRank} برتر لیگ`
      );
    }
    if (enableMinPoints && minLeaguePoints > 0) {
      parts.push(`کسب حداقل ${minLeaguePoints} امتیاز در لیگ کتابخوانی`);
    }

    if (parts.length === 0) return 'بدون شرط عددی خاص (استحقاق عمومی).';

    const joiner = matchMode === 'any' ? ' «یا» ' : '، ';
    return parts.join(joiner) + '.';
  }, [
    awardType,
    matchMode,
    targetClass,
    enableMinRead,
    minBooksRead,
    enableTargetGenre,
    targetGenre,
    minBooksInGenre,
    enableMinGenres,
    minDistinctGenres,
    enableReturnedLoans,
    minReturnedLoans,
    requireZeroDelays,
    requireFastReturn,
    enableMinRating,
    minRating,
    enableMinContributed,
    minBooksContributed,
    enableMinReviews,
    minReviews,
    enableMinReviewWords,
    minReviewWords,
    enableMaxRank,
    maxLeagueRank,
    enableMinPoints,
    minLeaguePoints
  ]);

  const tierStyle = getTierBadgeStyle(tier);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('لطفاً عنوان نشان را وارد کنید.');
      return;
    }

    setIsSubmitting(true);

    const perks: CustomMedalPerksConfig = {
      freeLoanCredits: freeLoanCredits > 0 ? freeLoanCredits : undefined,
      leagueMultiplier: leagueMultiplier > 1 ? leagueMultiplier : undefined,
      bonusLeaguePoints: bonusLeaguePoints > 0 ? bonusLeaguePoints : undefined,
      honoraryTitle: honoraryTitle.trim() || undefined,
      verifiedShield: verifiedShield || undefined,
      pinnedReviews: pinnedReviews || undefined,
      canSuggestPurchases: canSuggestPurchases || undefined,
      certificateEligible: certificateEligible || undefined,
      customPerkText: customPerkText.trim() || undefined
    };

    const rules: CustomMedalRuleConfig = {
      awardType,
      matchMode: awardType === 'auto' ? matchMode : undefined,
      targetClass: targetClass !== 'all' ? targetClass : undefined,

      minBooksRead: enableMinRead && minBooksRead > 0 ? minBooksRead : undefined,
      targetGenre: enableTargetGenre ? targetGenre : undefined,
      minBooksInGenre: enableTargetGenre && minBooksInGenre > 0 ? minBooksInGenre : undefined,
      minDistinctGenres: enableMinGenres && minDistinctGenres > 0 ? minDistinctGenres : undefined,

      minReturnedLoans: enableReturnedLoans && minReturnedLoans > 0 ? minReturnedLoans : undefined,
      requireZeroDelays: requireZeroDelays || undefined,
      requireFastReturn: requireFastReturn || undefined,
      minRating: enableMinRating && minRating > 0 ? minRating : undefined,

      minBooksContributed:
        enableMinContributed && minBooksContributed > 0 ? minBooksContributed : undefined,

      minReviews: enableMinReviews && minReviews > 0 ? minReviews : undefined,
      minReviewWords: enableMinReviewWords && minReviewWords > 0 ? minReviewWords : undefined,

      maxLeagueRank: enableMaxRank && maxLeagueRank > 0 ? maxLeagueRank : undefined,
      minLeaguePoints: enableMinPoints && minLeaguePoints > 0 ? minLeaguePoints : undefined
    };

    const newMedal: CustomMedalData = {
      id: `custom_medal_${Date.now()}`,
      title: title.trim(),
      titleEn: titleEn.trim() || undefined,
      icon: icon.trim() || '🌟',
      imageUrl: activeImageUrl,
      tier,
      tierTitle: `${tierStyle.label} • سطح ${level}`,
      level,
      description: description.trim() || `نشان افتخار ${title}`,
      occasion: occasion.trim() || 'تجلیل و قدردانی از فعالیت‌های فرهنگی دانش‌آموز در کتابخانه.',
      property: autoPropertyDesc,
      criteriaDesc: autoCriteriaDesc,
      isCustom: true,
      createdAt: new Date().toISOString(),
      rules,
      perks
    };

    try {
      const res = await fetch('/api/medals/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMedal)
      });

      if (res.ok) {
        onSuccess(newMedal);
        onClose();
      } else {
        const err = await res.json();
        alert(err.message || 'خطا در ثبت نشان جدید.');
      }
    } catch (err) {
      console.error(err);
      alert('خطای ارتباط با سرور.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
              <Plus className="w-5 h-5 stroke-[3]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black">
                ایجاد نشان افتخار جدید (شخصی‌سازی پیشرفته و جامع)
              </h2>
              <p className="text-xs text-slate-300">
                آپلود عکس اختصاصی، تنظیم پاداش‌های چندگانه و موتور لاجیک و شروط استحقاق هوشمند
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs text-slate-800">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Form Fields */}
            <div className="lg:col-span-2 space-y-6">
              {/* SECTION 1: IDENTITY */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-4">
                <div className="flex items-center gap-2 text-indigo-950 font-black text-xs pb-2 border-b border-slate-200">
                  <Award className="w-4 h-4 text-indigo-600" />
                  <span>۱. هویت و مشخصات پایه نشان:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-6">
                    <label className="block font-bold text-slate-700 mb-1">
                      عنوان نشان <span className="text-rose-500">*</span>:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: شاهین تیزبین مطالعه"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block font-bold text-slate-700 mb-1">
                      عنوان انگلیسی (اختیاری):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sharp-eyed Falcon"
                      value={titleEn}
                      onChange={(e) => setTitleEn(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">آیکون:</label>
                    <input
                      type="text"
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-center text-base focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>
                </div>

                {/* Tier and Level */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">رده افتخار (Tier):</label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        { id: 'bronze', label: 'برنزی', bg: 'bg-amber-800' },
                        { id: 'silver', label: 'نقره‌ای', bg: 'bg-slate-500' },
                        { id: 'gold', label: 'طلایی', bg: 'bg-amber-500' },
                        { id: 'diamond', label: 'الماسی', bg: 'bg-cyan-500' },
                        { id: 'mythic', label: 'اسطوره‌ای', bg: 'bg-purple-600' }
                      ].map((t) => (
                        <button
                          type="button"
                          key={t.id}
                          onClick={() => {
                            setTier(t.id as MedalTier);
                            setLevel(
                              t.id === 'bronze'
                                ? 1
                                : t.id === 'silver'
                                ? 2
                                : t.id === 'gold'
                                ? 3
                                : t.id === 'diamond'
                                ? 4
                                : 5
                            );
                          }}
                          className={`px-2.5 py-1.5 rounded-xl font-bold transition-all text-[11px] ${
                            tier === t.id
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      درجه و سطح عددی (Level ۱ تا ۵):
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <button
                          type="button"
                          key={lvl}
                          onClick={() => setLevel(lvl)}
                          className={`w-8 h-8 rounded-xl font-mono font-bold text-xs transition-all ${
                            level === lvl
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Occasion and Description */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">مناسبت و داستان نماد:</label>
                    <input
                      type="text"
                      placeholder="مثال: تجلیل از خواندن کتاب‌های علمی و روحیه پژوهشگری"
                      value={occasion}
                      onChange={(e) => setOccasion(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">شرح کوتاه افتخار:</label>
                    <input
                      type="text"
                      placeholder="توضیح کوتاه قابل نمایش در کارت کارنامه..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: IMAGE SELECTION & UPLOAD */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2 text-indigo-950 font-black text-xs">
                    <ImageIcon className="w-4 h-4 text-indigo-600" />
                    <span>۲. نماد و آرت‌ورک مدال (آپلود عکس دستی یا انتخاب از نمادهای آماده):</span>
                  </div>

                  {/* Mode tabs */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setImageMode('upload')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all ${
                        imageMode === 'upload'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Upload className="w-3 h-3" />
                      <span>آپلود از دستگاه</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageMode('url')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all ${
                        imageMode === 'url'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Link className="w-3 h-3" />
                      <span>آدرس اینترنتی</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageMode('presets')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all ${
                        imageMode === 'presets'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>نمادهای ۳بعدی آماده</span>
                    </button>
                  </div>
                </div>

                {/* Upload Mode */}
                {imageMode === 'upload' && (
                  <div className="space-y-3">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-white p-6 rounded-2xl text-center cursor-pointer transition-all space-y-2 group"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div className="font-bold text-slate-800 text-xs">
                        {isUploading ? 'در حال بارگذاری فایل...' : 'برای انتخاب و آپلود فایل عکس از گوشی یا رایانه کلیک کنید'}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        فرمت‌های مجاز: JPG, PNG, WEBP (حداکثر ۵ مگابایت)
                      </p>
                    </div>

                    {uploadError && (
                      <p className="text-rose-600 text-xs font-bold">{uploadError}</p>
                    )}

                    {customImageUrl && (
                      <div className="flex items-center gap-3 p-3 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-[11px] truncate flex-1">
                          تصویر با موفقیت بارگذاری شد: {customImageUrl}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* URL Mode */}
                {imageMode === 'url' && (
                  <div className="space-y-2">
                    <label className="block font-bold text-slate-700">
                      آدرس مستقیم تصویر (URL):
                    </label>
                    <input
                      type="url"
                      placeholder="https://example.com/badge-icon.png"
                      value={customImageUrl}
                      onChange={(e) => setCustomImageUrl(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-indigo-500/30"
                    />
                    <p className="text-[10px] text-slate-400">
                      می‌توانید لینک مستقیم هر تصویر دلخواهی در وب را در این کادر قرار دهید.
                    </p>
                  </div>
                )}

                {/* Presets Mode */}
                {imageMode === 'presets' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-2">
                      یکی از ۱۰ نماد سه‌بعدی پیش‌فرض را انتخاب کنید:
                    </label>
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                      {PRESET_3D_IMAGES.map((preset) => (
                        <button
                          type="button"
                          key={preset.id}
                          onClick={() => setSelectedPresetUrl(preset.url)}
                          title={preset.name}
                          className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all p-0.5 ${
                            selectedPresetUrl === preset.url
                              ? 'border-indigo-600 ring-2 ring-indigo-400 scale-105 shadow-md'
                              : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 3: ADVANCED PERKS & REWARDS */}
              <div className="bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 p-4 rounded-2xl border border-amber-200/80 space-y-4">
                <div className="flex items-center gap-2 text-amber-950 font-black text-xs pb-2 border-b border-amber-200">
                  <Gift className="w-4 h-4 text-amber-600" />
                  <span>۳. پاداش‌ها و مزایای ویژه در سامانه (دست شما کاملاً باز است):</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                  {/* Free Loans Credits */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>سهمیه امانت رایگان (بدون هزینه):</span>
                      </div>
                      <select
                        value={freeLoanCredits}
                        onChange={(e) => setFreeLoanCredits(Number(e.target.value))}
                        className="p-1 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                      >
                        <option value="0">بدون سهمیه رایگان</option>
                        <option value="1">۱ نوبت رایگان</option>
                        <option value="2">۲ نوبت رایگان</option>
                        <option value="3">۳ نوبت رایگان</option>
                        <option value="5">۵ نوبت رایگان</option>
                      </select>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      امکان امانت گرفتن کتاب بدون کسر کارمزد یا هزینه توسط دانش‌آموز.
                    </p>
                  </div>

                  {/* League Multiplier */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-indigo-600" />
                        <span>ضریب امتیازات در لیگ:</span>
                      </div>
                      <select
                        value={leagueMultiplier}
                        onChange={(e) => setLeagueMultiplier(Number(e.target.value))}
                        className="p-1 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                      >
                        <option value="1">بدون ضریب (معمولی ۱.۰)</option>
                        <option value="1.1">ضریب ۱.۱۰ برابری (+۱۰٪)</option>
                        <option value="1.25">ضریب ۱.۲۵ برابری (+۲۵٪)</option>
                        <option value="1.5">ضریب ۱.۵۰ برابری (+۵۰٪)</option>
                      </select>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      ضرب شدن تمام امتیازهای دریافتی کاربر از امانت و مطالعه در این ضریب.
                    </p>
                  </div>

                  {/* Bonus League Points */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <Trophy className="w-4 h-4 text-amber-500" />
                        <span>پاداش امتیاز فوری در لیگ (XP):</span>
                      </div>
                      <select
                        value={bonusLeaguePoints}
                        onChange={(e) => setBonusLeaguePoints(Number(e.target.value))}
                        className="p-1 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                      >
                        <option value="0">بدون امتیاز فوری</option>
                        <option value="50">+۵۰ امتیاز</option>
                        <option value="100">+۱۰۰ امتیاز</option>
                        <option value="250">+۲۵۰ امتیاز</option>
                        <option value="500">+۵۰۰ امتیاز</option>
                      </select>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      افزوده شدن مستقیم امتیاز تشویقی به جدول لیگ کتابخوانی.
                    </p>
                  </div>

                  {/* Honorary Title */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                      <Award className="w-4 h-4 text-purple-600" />
                      <span>عنوان و لقب افتخاری در کنار نام:</span>
                    </div>
                    <input
                      type="text"
                      placeholder="مثال: کتاب‌یار امین، پژوهشگر برتر"
                      value={honoraryTitle}
                      onChange={(e) => setHonoraryTitle(e.target.value)}
                      className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                    />
                  </div>

                  {/* Verified Shield */}
                  <label className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={verifiedShield}
                        onChange={(e) => setVerifiedShield(e.target.checked)}
                        className="rounded text-indigo-600"
                      />
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold">نشان سپر سبز کاربر کاملاً معتمد</span>
                    </div>
                  </label>

                  {/* Pinned Reviews */}
                  <label className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={pinnedReviews}
                        onChange={(e) => setPinnedReviews(e.target.checked)}
                        className="rounded text-indigo-600"
                      />
                      <Pin className="w-4 h-4 text-amber-500" />
                      <span className="font-bold">سنجاق دیدگاه‌ها در صدر نظرات کتاب‌ها</span>
                    </div>
                  </label>

                  {/* Suggest Purchases */}
                  <label className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={canSuggestPurchases}
                        onChange={(e) => setCanSuggestPurchases(e.target.checked)}
                        className="rounded text-indigo-600"
                      />
                      <Gift className="w-4 h-4 text-indigo-600" />
                      <span className="font-bold">حق پیشنهاد خرید کتاب با بودجه مدرسه</span>
                    </div>
                  </label>

                  {/* Certificate Plaque */}
                  <label className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={certificateEligible}
                        onChange={(e) => setCertificateEligible(e.target.checked)}
                        className="rounded text-indigo-600"
                      />
                      <FileCheck className="w-4 h-4 text-rose-500" />
                      <span className="font-bold">اهدای لوح تقدیر فیزیکی رسمی در صبحگاه</span>
                    </div>
                  </label>
                </div>

                {/* Custom Perk Extra Text */}
                <div className="pt-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    متن دلخواه تکمیلی برای خاصیت و مزایای نشان (اختیاری):
                  </label>
                  <input
                    type="text"
                    placeholder="می‌توانید هر پاداش متنی دیگری را در اینجا بنویسید..."
                    value={customPerkText}
                    onChange={(e) => setCustomPerkText(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                {/* Perk Result Preview */}
                <div className="p-3 bg-amber-100/60 rounded-xl text-amber-950 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed">
                    <strong>خلاصه پاداش تولیدشده:</strong> {autoPropertyDesc}
                  </div>
                </div>
              </div>

              {/* SECTION 4: ADVANCED LOGIC & CRITERIA ENGINE */}
              <div className="bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 p-4 rounded-2xl border border-indigo-200/80 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-indigo-100 flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-indigo-950 font-black text-xs">
                    <Sliders className="w-4 h-4 text-indigo-600" />
                    <span>۴. موتور شروط پیشرفته و استحقاق خودکار:</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Award Mode Toggle */}
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-indigo-200">
                      <button
                        type="button"
                        onClick={() => setAwardType('auto')}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all ${
                          awardType === 'auto'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        ⚡ ارزیابی خودکار
                      </button>
                      <button
                        type="button"
                        onClick={() => setAwardType('manual_only')}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all ${
                          awardType === 'manual_only'
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        🔒 فقط دستی با نظر مدیر
                      </button>
                    </div>

                    {/* Condition Operator Toggle */}
                    {awardType === 'auto' && (
                      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setMatchMode('all')}
                          className={`px-2 py-1 rounded-lg font-bold text-[10px] transition-all ${
                            matchMode === 'all'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                          title="تمام شروط انتخابی باید برقرار باشند"
                        >
                          همه شروط (AND)
                        </button>
                        <button
                          type="button"
                          onClick={() => setMatchMode('any')}
                          className={`px-2 py-1 rounded-lg font-bold text-[10px] transition-all ${
                            matchMode === 'any'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                          title="احراز حتی یکی از شروط انتخابی کافی است"
                        >
                          حداقل یکی (OR)
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {awardType === 'auto' && (
                  <div className="space-y-4">
                    {/* Class Filter */}
                    <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-700">محدودیت پایه / کلاس:</span>
                      <select
                        value={targetClass}
                        onChange={(e) => setTargetClass(e.target.value)}
                        className="p-1 bg-slate-50 border border-slate-200 rounded-lg font-bold text-xs"
                      >
                        <option value="all">همه پایه‌ها و کلاس‌های مدرسه</option>
                        {availableClasses.map((cls) => (
                          <option key={cls} value={cls}>
                            کلاس {cls}
                          </option>
                        ))}
                      </select>
                      <span className="text-[10px] text-slate-400">
                        (اختیاری: فقط دانش‌آموزان این کلاس واجد شرایط خواهند بود)
                      </span>
                    </div>

                    {/* Conditions Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                      {/* 1. Books Read */}
                      <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={enableMinRead}
                            onChange={(e) => setEnableMinRead(e.target.checked)}
                            className="rounded text-indigo-600"
                          />
                          <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                          <span className="font-bold">حداقل کتاب مطالعه‌شده:</span>
                        </div>
                        {enableMinRead && (
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={minBooksRead}
                            onChange={(e) => setMinBooksRead(Number(e.target.value))}
                            className="w-14 p-1 bg-slate-50 border border-slate-200 rounded-lg text-center font-mono font-bold"
                          />
                        )}
                      </label>

                      {/* 2. Specific Genre Criteria */}
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer font-bold">
                          <input
                            type="checkbox"
                            checked={enableTargetGenre}
                            onChange={(e) => setEnableTargetGenre(e.target.checked)}
                            className="rounded text-indigo-600"
                          />
                          <Compass className="w-3.5 h-3.5 text-teal-600" />
                          <span>مطالعه در ژانر خاص:</span>
                        </label>
                        {enableTargetGenre && (
                          <div className="flex items-center gap-2 pt-1">
                            <select
                              value={targetGenre}
                              onChange={(e) => setTargetGenre(e.target.value)}
                              className="flex-1 p-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                            >
                              {STANDARD_GENRES.map((g) => (
                                <option key={g} value={g}>
                                  {g}
                                </option>
                              ))}
                            </select>
                            <span className="text-slate-500 font-bold">حداقل:</span>
                            <input
                              type="number"
                              min="1"
                              max="50"
                              value={minBooksInGenre}
                              onChange={(e) => setMinBooksInGenre(Number(e.target.value))}
                              className="w-12 p-1 bg-slate-50 border border-slate-200 rounded-lg text-center font-mono font-bold"
                            />
                            <span className="text-slate-500">جلد</span>
                          </div>
                        )}
                      </div>

                      {/* 3. Distinct Genres */}
                      <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={enableMinGenres}
                            onChange={(e) => setEnableMinGenres(e.target.checked)}
                            className="rounded text-indigo-600"
                          />
                          <Compass className="w-3.5 h-3.5 text-teal-600" />
                          <span className="font-bold">تنوع ژانرها (چندبعدی):</span>
                        </div>
                        {enableMinGenres && (
                          <input
                            type="number"
                            min="2"
                            max="10"
                            value={minDistinctGenres}
                            onChange={(e) => setMinDistinctGenres(Number(e.target.value))}
                            className="w-14 p-1 bg-slate-50 border border-slate-200 rounded-lg text-center font-mono font-bold"
                          />
                        )}
                      </label>

                      {/* 4. Books Contributed */}
                      <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={enableMinContributed}
                            onChange={(e) => setEnableMinContributed(e.target.checked)}
                            className="rounded text-indigo-600"
                          />
                          <Gift className="w-3.5 h-3.5 text-amber-500" />
                          <span className="font-bold">حداقل کتاب اهدایی به مدرسه:</span>
                        </div>
                        {enableMinContributed && (
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={minBooksContributed}
                            onChange={(e) => setMinBooksContributed(Number(e.target.value))}
                            className="w-14 p-1 bg-slate-50 border border-slate-200 rounded-lg text-center font-mono font-bold"
                          />
                        )}
                      </label>

                      {/* 5. Returned Loans */}
                      <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={enableReturnedLoans}
                            onChange={(e) => setEnableReturnedLoans(e.target.checked)}
                            className="rounded text-indigo-600"
                          />
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="font-bold">حداقل امانت عودت‌داده‌شده:</span>
                        </div>
                        {enableReturnedLoans && (
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={minReturnedLoans}
                            onChange={(e) => setMinReturnedLoans(Number(e.target.value))}
                            className="w-14 p-1 bg-slate-50 border border-slate-200 rounded-lg text-center font-mono font-bold"
                          />
                        )}
                      </label>

                      {/* 6. Rating */}
                      <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={enableMinRating}
                            onChange={(e) => setEnableMinRating(e.target.checked)}
                            className="rounded text-indigo-600"
                          />
                          <Star className="w-3.5 h-3.5 text-amber-500" />
                          <span className="font-bold">حداقل امتیاز رضایت و رفتار:</span>
                        </div>
                        {enableMinRating && (
                          <input
                            type="number"
                            step="0.1"
                            min="3.0"
                            max="5.0"
                            value={minRating}
                            onChange={(e) => setMinRating(Number(e.target.value))}
                            className="w-14 p-1 bg-slate-50 border border-slate-200 rounded-lg text-center font-mono font-bold"
                          />
                        )}
                      </label>

                      {/* 7. Zero Delays */}
                      <label className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={requireZeroDelays}
                          onChange={(e) => setRequireZeroDelays(e.target.checked)}
                          className="rounded text-indigo-600"
                        />
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-bold">خوش‌قولی ۱۰۰٪ (بدون حتی ۱ روز تاخیر)</span>
                      </label>

                      {/* 8. Fast Return */}
                      <label className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={requireFastReturn}
                          onChange={(e) => setRequireFastReturn(e.target.checked)}
                          className="rounded text-indigo-600"
                        />
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        <span className="font-bold">عودت فوق‌سریع (در کمتر از ۷۲ ساعت)</span>
                      </label>

                      {/* 9. Reviews Count */}
                      <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={enableMinReviews}
                            onChange={(e) => setEnableMinReviews(e.target.checked)}
                            className="rounded text-indigo-600"
                          />
                          <MessageSquare className="w-3.5 h-3.5 text-cyan-600" />
                          <span className="font-bold">حداقل نقد و بررسی ثبت‌شده:</span>
                        </div>
                        {enableMinReviews && (
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={minReviews}
                            onChange={(e) => setMinReviews(Number(e.target.value))}
                            className="w-14 p-1 bg-slate-50 border border-slate-200 rounded-lg text-center font-mono font-bold"
                          />
                        )}
                      </label>

                      {/* 10. Long Review Analysis */}
                      <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={enableMinReviewWords}
                            onChange={(e) => setEnableMinReviewWords(e.target.checked)}
                            className="rounded text-indigo-600"
                          />
                          <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                          <span className="font-bold">نقد تحلیلی عمیق (حداقل کلمات):</span>
                        </div>
                        {enableMinReviewWords && (
                          <input
                            type="number"
                            min="15"
                            max="200"
                            value={minReviewWords}
                            onChange={(e) => setMinReviewWords(Number(e.target.value))}
                            className="w-14 p-1 bg-slate-50 border border-slate-200 rounded-lg text-center font-mono font-bold"
                          />
                        )}
                      </label>

                      {/* 11. Max League Rank */}
                      <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={enableMaxRank}
                            onChange={(e) => setEnableMaxRank(e.target.checked)}
                            className="rounded text-indigo-600"
                          />
                          <Trophy className="w-3.5 h-3.5 text-amber-500" />
                          <span className="font-bold">رتبه در لیگ کتابخوانی:</span>
                        </div>
                        {enableMaxRank && (
                          <select
                            value={maxLeagueRank}
                            onChange={(e) => setMaxLeagueRank(Number(e.target.value))}
                            className="p-1 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] font-bold"
                          >
                            <option value="1">فقط رتبه ۱ (قهرمان مطلق ماه)</option>
                            <option value="3">۳ نفر برتر (سکوی ۱ تا ۳)</option>
                            <option value="5">۵ نفر برتر</option>
                            <option value="10">۱۰ نفر برتر</option>
                          </select>
                        )}
                      </label>

                      {/* 12. Min League Points */}
                      <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={enableMinPoints}
                            onChange={(e) => setEnableMinPoints(e.target.checked)}
                            className="rounded text-indigo-600"
                          />
                          <Award className="w-3.5 h-3.5 text-indigo-600" />
                          <span className="font-bold">حداقل امتیاز در لیگ:</span>
                        </div>
                        {enableMinPoints && (
                          <input
                            type="number"
                            step="50"
                            min="50"
                            max="2000"
                            value={minLeaguePoints}
                            onChange={(e) => setMinLeaguePoints(Number(e.target.value))}
                            className="w-16 p-1 bg-slate-50 border border-slate-200 rounded-lg text-center font-mono font-bold"
                          />
                        )}
                      </label>
                    </div>

                    {/* Criteria Result Text */}
                    <div className="pt-2 border-t border-indigo-100 flex items-start gap-1.5 text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-[11px] leading-relaxed">
                        <strong>متن روان شروط خودکار:</strong> {autoCriteriaDesc}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Col: Live Interactive 3D Preview Card */}
            <div className="space-y-4">
              <div className="text-center font-bold text-slate-700 pb-1 border-b border-slate-100 flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>پیش‌نمایش زنده در کارنامه دانش‌آموز:</span>
              </div>

              {/* 3D Preview Card */}
              <div
                className={`rounded-3xl p-5 border text-center shadow-2xl relative overflow-hidden bg-white transition-all ${
                  tier === 'mythic'
                    ? 'border-purple-300 shadow-purple-500/25 ring-2 ring-purple-100'
                    : tier === 'diamond'
                    ? 'border-cyan-300 shadow-cyan-500/25 ring-2 ring-cyan-100'
                    : tier === 'gold'
                    ? 'border-amber-300 shadow-amber-500/25 ring-2 ring-amber-100'
                    : tier === 'silver'
                    ? 'border-sky-300 shadow-sky-500/25 ring-2 ring-sky-100'
                    : 'border-emerald-300 shadow-emerald-500/25 ring-2 ring-emerald-100'
                }`}
              >
                {/* Header info */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase shadow-xs ${tierStyle.pillClass}`}
                  >
                    {tierStyle.label} • سطح {level}
                  </span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    ✨ طراحی مدیر
                  </span>
                </div>

                {/* 3D Visual Artwork */}
                <div className="w-32 h-32 mx-auto rounded-3xl overflow-hidden shadow-xl ring-4 ring-amber-400/30 my-3 relative group">
                  <img
                    src={activeImageUrl}
                    alt={title || 'پیش‌نمایش'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 bg-slate-950/70 text-white w-6 h-6 rounded-lg flex items-center justify-center text-xs">
                    {icon}
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-black text-slate-900 text-base mt-2">
                  {title || 'عنوان نشان جدید'}
                </h3>
                {titleEn && (
                  <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                    ({titleEn})
                  </span>
                )}

                {/* Property Box */}
                <div className="mt-3 p-3 rounded-2xl bg-amber-50/70 border border-amber-100 text-right space-y-1">
                  <span className="text-[10px] font-black text-amber-900 flex items-center gap-1">
                    <Gift className="w-3 h-3 text-amber-600" />
                    <span>پاداش‌ها و مزایا:</span>
                  </span>
                  <p className="text-[10px] text-slate-700 leading-relaxed font-medium">
                    {autoPropertyDesc}
                  </p>
                </div>

                {/* Criteria Box */}
                <div className="mt-2 text-right p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] font-black text-slate-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>شرط کسب:</span>
                  </span>
                  <p className="text-[10px] text-slate-600 leading-relaxed">
                    {autoCriteriaDesc}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <div className="text-[11px] text-slate-500 hidden sm:block">
              مدال بلافاصله پس از ایجاد به فهرست کل مدرسه اضافه شده و در ارزیابی خودکار اعمال می‌شود.
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-indigo-600 to-purple-600 hover:from-amber-600 hover:to-purple-700 text-white font-black shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>{isSubmitting ? 'در حال ایجاد نشان...' : 'ثبت و فعال‌سازی نشان در سامانه ✨'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
