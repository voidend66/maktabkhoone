import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { SystemEvent, UserEventProgress } from '../types';
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Send,
  CheckCircle2,
  Clock,
  Flame,
  Gift,
  Calendar,
  Users,
  Award,
  BookOpen,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Check,
  RotateCcw
} from 'lucide-react';

export const AdminEventsManager: React.FC = () => {
  const {
    events,
    activeEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    publishEventToBale,
    users,
    systemConfig
  } = useApp();

  const [isCreating, setIsCreating] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [eventProgressList, setEventProgressList] = useState<Record<string, UserEventProgress[]>>({});
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [tag, setTag] = useState('');
  const [description, setDescription] = useState('');
  const [targetCount, setTargetCount] = useState<number>(8);
  const [freeLoanCount, setFreeLoanCount] = useState<number>(2);
  const [rewardDescription, setRewardDescription] = useState('۲ سهمیه امانت کتاب کاملاً رایگان بدون کارمزد');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [durationDays, setDurationDays] = useState<number>(14);
  const [status, setStatus] = useState<'draft' | 'active' | 'archived'>('active');
  const [publishToBaleOnCreate, setPublishToBaleOnCreate] = useState(true);

  // Action status feedbacks
  const [actionFeedback, setActionFeedback] = useState<{ id: string; success: boolean; message: string } | null>(null);
  const [isPublishingBaleId, setIsPublishingBaleId] = useState<string | null>(null);

  const resetForm = () => {
    setTitle('');
    setTag('');
    setDescription('');
    setTargetCount(8);
    setFreeLoanCount(2);
    setRewardDescription('۲ سهمیه امانت کتاب کاملاً رایگان بدون کارمزد');
    setStartDate(new Date().toISOString().split('T')[0]);
    setDurationDays(14);
    setStatus('active');
    setPublishToBaleOnCreate(true);
    setIsCreating(false);
    setEditingEventId(null);
  };

  // Preset Template loader
  const applyPresetTemplate = (preset: 'foundation' | 'mehr' | 'book_week' | 'summer') => {
    const today = new Date();
    if (preset === 'foundation') {
      setTitle('🎉 ایونت سالگرد تاسیس مکتب‌خانه');
      setTag('جشنواره تاسیس');
      setDescription('به مناسبت سالگرد تاسیس مکتب‌خانه، هر دانش‌آموزی که ۸ کتاب به کتابخانه اهدا یا اضافه کند، ۲ کتاب بدون پرداخت هیچ هزینه‌ای امانت می‌گیرد!');
      setTargetCount(8);
      setFreeLoanCount(2);
      setRewardDescription('دریافت ۲ امانت کتاب کاملاً رایگان + ثبت نشان ویژه در لیگ کتابخوانی');
      setDurationDays(10);
    } else if (preset === 'mehr') {
      setTitle('🎒 ایونت آغاز مهر و سال تحصیلی جدید');
      setTag('جشن اول مهر');
      setDescription('با شروع ماه مهر و بوی ماه مدرسه، با افزودن ۵ جلد کتاب جذاب به طاقچه کتابخانه، ۱ کتاب بدون هزینه کارمزد امانت بگیرید و آغاز سال را جشن بگیرید!');
      setTargetCount(5);
      setFreeLoanCount(1);
      setRewardDescription('۱ امانت کتاب کاملاً رایگان');
      setDurationDays(20);
    } else if (preset === 'book_week') {
      setTitle('📚 ایونت هفته ملی کتاب و کتابخوانی');
      setTag('هفته کتاب');
      setDescription('در هفته کتابخوانی با به اشتراک گذاشتن ۶ کتاب از کتابخانه‌های شخصی خود با همکلاسی‌ها، ۲ سهمیه امانت رایگان هدیه بگیرید.');
      setTargetCount(6);
      setFreeLoanCount(2);
      setRewardDescription('۲ سهمیه امانت بدون هزینه');
      setDurationDays(7);
    } else if (preset === 'summer') {
      setTitle('☀️ ایونت تابستانه و چالش مطالعه');
      setTag('چالش تابستان');
      setDescription('چالش ویژه تابستان مکتب‌خانه! ۱۰ کتاب به اشتراک بگذارید و ۳ کتاب بدون کارمزد امانت ببرید.');
      setTargetCount(10);
      setFreeLoanCount(3);
      setRewardDescription('۳ امانت رایگان بدون هزینه');
      setDurationDays(30);
    }
  };

  const handleEditClick = (event: SystemEvent) => {
    setEditingEventId(event.id);
    setIsCreating(true);
    setTitle(event.title);
    setTag(event.tag || '');
    setDescription(event.description);
    setTargetCount(event.targetCount);
    setFreeLoanCount(event.freeLoanCount || 2);
    setRewardDescription(event.rewardDescription || '');
    setStatus(event.status);
    if (event.startTimestamp && event.endTimestamp) {
      const days = Math.round((event.endTimestamp - event.startTimestamp) / (1000 * 60 * 60 * 24));
      setDurationDays(days > 0 ? days : 14);
      setStartDate(new Date(event.startTimestamp).toISOString().split('T')[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('لطفاً عنوان ایونت را وارد نمایید.');
      return;
    }

    const startTs = new Date(startDate).getTime() || Date.now();
    const endTs = startTs + durationDays * 24 * 60 * 60 * 1000;

    const eventData: Partial<SystemEvent> = {
      title: title.trim(),
      tag: tag.trim() || undefined,
      description: description.trim(),
      targetType: 'add_books',
      targetCount: Number(targetCount) || 8,
      rewardType: 'free_loan',
      freeLoanCount: Number(freeLoanCount) || 2,
      rewardDescription: rewardDescription.trim() || undefined,
      startDateFa: new Date(startTs).toLocaleDateString('fa-IR'),
      endDateFa: new Date(endTs).toLocaleDateString('fa-IR'),
      startTimestamp: startTs,
      endTimestamp: endTs,
      status: status
    };

    if (editingEventId) {
      const res = await updateEvent(editingEventId, eventData);
      if (res.success) {
        setActionFeedback({ id: editingEventId, success: true, message: 'ایونت با موفقیت ویرایش شد.' });
        resetForm();
      } else {
        alert(res.message || 'خطا در ویرایش ایونت');
      }
    } else {
      const res = await createEvent(eventData);
      if (res.success && res.event) {
        if (publishToBaleOnCreate) {
          try {
            await publishEventToBale(res.event.id);
          } catch (err) {
            console.error('Bale publish err:', err);
          }
        }
        setActionFeedback({ id: res.event.id, success: true, message: 'ایونت جدید با موفقیت ایجاد و فعال شد 🎉' });
        resetForm();
      } else {
        alert(res.message || 'خطا در ایجاد ایونت');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('آیا از حذف این ایونت اطمینان دارید؟')) return;
    const res = await deleteEvent(id);
    if (res.success) {
      setActionFeedback({ id, success: true, message: 'ایونت با موفقیت حذف شد.' });
    }
  };

  const handlePublishBale = async (id: string) => {
    setIsPublishingBaleId(id);
    try {
      const res = await publishEventToBale(id);
      setActionFeedback({
        id,
        success: res.success,
        message: res.message
      });
    } catch (e: any) {
      setActionFeedback({
        id,
        success: false,
        message: e.message || 'خطا در ارتباط با بله'
      });
    } finally {
      setIsPublishingBaleId(null);
    }
  };

  return (
    <div className="space-y-6" id="admin-events-manager">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 text-white p-6 rounded-3xl shadow-xl border-2 border-amber-400/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-400/30 text-amber-300 text-xs px-3 py-1 rounded-full font-bold">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>سیستم رویدادها، چالش‌ها و جوایز مکتب‌خانه 🏆</span>
          </div>
          <h2 className="text-2xl font-black font-['Lalezar',cursive] text-amber-300">
            مدیریت ایونت‌ها و چالش‌های کتابخوانی
          </h2>
          <p className="text-xs text-slate-300">
            تعریف رویدادهای فصلی و مناسبتی (نظیر تاسیس مکتب‌خانه، اول مهر)، تعیین اهداف (مثلاً ۸ کتاب) و پاداش امانت رایگان بدون هزینه
          </p>
        </div>

        <button
          onClick={() => {
            if (isCreating) {
              resetForm();
            } else {
              setIsCreating(true);
            }
          }}
          className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-lg transition flex items-center gap-2 hover:scale-105 cursor-pointer shrink-0"
        >
          {isCreating ? (
            <>
              <RotateCcw className="w-4 h-4" />
              <span>انصراف و بستن فرم</span>
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              <span>تعریف ایونت جدید</span>
            </>
          )}
        </button>
      </div>

      {/* Action Toast Feedback */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200 ${
            actionFeedback.success
              ? 'bg-emerald-900 text-emerald-100 border border-emerald-500'
              : 'bg-rose-900 text-rose-100 border border-rose-500'
          }`}
        >
          {actionFeedback.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{actionFeedback.message}</span>
        </div>
      )}

      {/* Creation / Edit Form Box */}
      {isCreating && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-amber-200 shadow-xl space-y-6 animate-in slide-in-from-top-4 duration-300">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Gift className="w-5 h-5 text-amber-500" />
              <span>{editingEventId ? 'ویرایش ایونت موجود' : 'فرم ثبت و انتشار ایونت جدید'}</span>
            </h3>

            {/* Presets Row */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-slate-500 font-bold ml-1">قالب‌های آماده:</span>
              <button
                type="button"
                onClick={() => applyPresetTemplate('foundation')}
                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-[11px] font-bold transition cursor-pointer"
              >
                🎉 تاسیس مکتب‌خانه
              </button>
              <button
                type="button"
                onClick={() => applyPresetTemplate('mehr')}
                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg text-[11px] font-bold transition cursor-pointer"
              >
                🎒 اول مهر ماه
              </button>
              <button
                type="button"
                onClick={() => applyPresetTemplate('book_week')}
                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-lg text-[11px] font-bold transition cursor-pointer"
              >
                📚 هفته کتاب
              </button>
              <button
                type="button"
                onClick={() => applyPresetTemplate('summer')}
                className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-lg text-[11px] font-bold transition cursor-pointer"
              >
                ☀️ چالش تابستان
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              {/* Event Title */}
              <div className="sm:col-span-8 space-y-1">
                <label className="text-xs font-black text-slate-700 block">
                  عنوان رویداد / ایونت: *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: 🎉 ایونت سالگرد تاسیس مکتب‌خانه"
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Tag / Badge */}
              <div className="sm:col-span-4 space-y-1">
                <label className="text-xs font-black text-slate-700 block">
                  برچسب / بج مناسبتی:
                </label>
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="مثال: جشنواره تاسیس، پاییزه"
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-700 block">
                توضیحات و شرایط ایونت (برای نمایش به دانش‌آموزان): *
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="توضیح کامل در مورد قوانین رویداد، هدف، جوایز و نحوه شرکت..."
                className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
              />
            </div>

            {/* Target & Reward Rules */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-amber-50/60 p-4 rounded-2xl border border-amber-200">
              <div className="space-y-1">
                <label className="text-xs font-black text-amber-950 block">
                  تعداد کتاب لازم جهت اهدا/ثبت:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={50}
                    required
                    value={targetCount}
                    onChange={(e) => setTargetCount(Number(e.target.value))}
                    className="w-full text-xs p-2.5 bg-white border border-amber-300 rounded-xl font-bold text-center"
                  />
                  <span className="text-xs font-bold text-amber-900 shrink-0">جلد کتاب</span>
                </div>
                <p className="text-[10px] text-amber-800">تعداد کتابی که دانش‌آموز باید در بازه ایونت ثبت کند</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-amber-950 block">
                  تعداد امانت رایگان جایزه:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={freeLoanCount}
                    onChange={(e) => setFreeLoanCount(Number(e.target.value))}
                    className="w-full text-xs p-2.5 bg-white border border-amber-300 rounded-xl font-bold text-center"
                  />
                  <span className="text-xs font-bold text-amber-900 shrink-0">امانت بدون کارمزد</span>
                </div>
                <p className="text-[10px] text-amber-800">بدون نیاز به واریز کارمزد به حساب مدرسه</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-amber-950 block">
                  مدت زمان ایونت (روزشمار):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={120}
                    required
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="w-full text-xs p-2.5 bg-white border border-amber-300 rounded-xl font-bold text-center"
                  />
                  <span className="text-xs font-bold text-amber-900 shrink-0">روز</span>
                </div>
                <p className="text-[10px] text-amber-800">برای شمارش معکوس نوار بالای صفحه</p>
              </div>
            </div>

            {/* Reward Description & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-8 space-y-1">
                <label className="text-xs font-black text-slate-700 block">
                  شرح کامل پاداش و جایزه:
                </label>
                <input
                  type="text"
                  value={rewardDescription}
                  onChange={(e) => setRewardDescription(e.target.value)}
                  placeholder="مثال: ۲ سهمیه امانت کتاب بدون هزینه"
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="sm:col-span-4 space-y-1">
                <label className="text-xs font-black text-slate-700 block">
                  وضعیت انتشار:
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="active">فعال و در حال برگزاری (نمایش در صفحه اصلی)</option>
                  <option value="draft">پیش‌نویس (عدم نمایش عمومی)</option>
                  <option value="archived">بایگانی‌شده / پایان‌یافته</option>
                </select>
              </div>
            </div>

            {/* Bale Auto Publish Checkbox */}
            {!editingEventId && (
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="publishToBaleOnCreate"
                    checked={publishToBaleOnCreate}
                    onChange={(e) => setPublishToBaleOnCreate(e.target.checked)}
                    className="w-4 h-4 text-sky-600 rounded-md focus:ring-sky-500"
                  />
                  <label htmlFor="publishToBaleOnCreate" className="text-xs font-bold text-sky-950 cursor-pointer">
                    📢 انتشار فوری این ایونت در کانال پیام‌رسان بله مدرسه ({systemConfig?.baleChannelUsername || '@maktabkhune_books'})
                  </label>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{editingEventId ? 'ثبت تغییرات ایونت' : 'ایجاد و ذخیره ایونت'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Events List */}
      <div className="space-y-4">
        <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600" />
          <span>لیست رویدادهای تعریف‌شده در سامانه ({events.length})</span>
        </h3>

        {events.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
              <Gift className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800 text-sm">هیچ ایونتی تاکنون ثبت نشده است</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              با ایجاد ایونت‌های هیجان‌انگیز، دانش‌آموزان را به اهدای کتاب و مطالعه تشویق کنید و به ازای اهدای تعداد معینی کتاب، سهمیه امانت رایگان به آن‌ها اختصاص دهید.
            </p>
            <button
              onClick={() => {
                setIsCreating(true);
                applyPresetTemplate('foundation');
              }}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl transition cursor-pointer"
            >
              ایجاد اولین ایونت با قالب تاسیس مکتب‌خانه 🚀
            </button>
          </div>
        ) : (
          events.map((event) => {
            const isActive = event.status === 'active';
            const isDraft = event.status === 'draft';
            const isArchived = event.status === 'archived';

            return (
              <div
                key={event.id}
                id={`admin-event-row-${event.id}`}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4 hover:border-amber-300 transition"
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  {/* Event Summary */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base sm:text-lg font-black text-slate-900 font-['Lalezar',cursive]">
                        {event.title}
                      </h4>

                      <span
                        className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : isDraft
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-slate-100 text-slate-600 border border-slate-300'
                        }`}
                      >
                        {isActive ? 'فعال و جاری ✅' : isDraft ? 'پیش‌نویس ✏️' : 'بایگانی‌شده 📦'}
                      </span>

                      {event.tag && (
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold">
                          {event.tag}
                        </span>
                      )}

                      {event.isPublishedToBale && (
                        <span className="text-[10px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                          <Send className="w-3 h-3 text-sky-500" />
                          <span>منتشرشده در بله</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-3xl">
                      {event.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs font-bold text-slate-500 pt-1 flex-wrap">
                      <span className="text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                        🎯 شرط تکمیل: اهدای <strong>{event.targetCount}</strong> کتاب
                      </span>
                      <span className="text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        🎁 پاداش: <strong>{event.freeLoanCount || 2}</strong> امانت رایگان
                      </span>
                      <span className="text-slate-600">
                        📅 بازه: {event.startDateFa} الی {event.endDateFa}
                      </span>
                    </div>
                  </div>

                  {/* Actions Buttons */}
                  <div className="flex items-center gap-2 flex-wrap self-end lg:self-center shrink-0">
                    <button
                      onClick={() => handlePublishBale(event.id)}
                      disabled={isPublishingBaleId === event.id}
                      title="انتشار مجدد اعلان این ایونت در کانال بله"
                      className="px-3 py-2 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5 text-sky-600" />
                      <span>{isPublishingBaleId === event.id ? 'در حال ارسال...' : 'ارسال به بله'}</span>
                    </button>

                    <button
                      onClick={() => handleEditClick(event)}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs transition cursor-pointer"
                      title="ویرایش"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(event.id)}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs transition cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
