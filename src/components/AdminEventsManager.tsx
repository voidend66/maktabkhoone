import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SystemEvent, UserEventProgress, User, EventStatus } from '../types';
import {
  getCurrentJalaliDate,
  PERSIAN_MONTHS,
  formatPersianBirthday,
  getDaysUntilBirthday,
  formatDaysUntilBirthday,
  getPersianSeason
} from '../utils/jalaliDate';
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
  RotateCcw,
  Cake,
  PartyPopper,
  Save,
  Search,
  Filter,
  GraduationCap,
  CalendarDays,
  LayoutGrid,
  Table as TableIcon,
  AlertTriangle,
  Heart,
  Smile,
  X,
  UserCheck,
  HelpCircle
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
    schoolClasses,
    systemConfig,
    updateSystemConfig,
    updateUserBirthday
  } = useApp();

  const [isCreating, setIsCreating] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [eventProgressList, setEventProgressList] = useState<Record<string, UserEventProgress[]>>({});
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);

  // Birthday Reward Settings State
  const [birthdayRewardEnabled, setBirthdayRewardEnabled] = useState<boolean>(
    systemConfig?.birthdayRewardEnabled !== false
  );
  const [birthdayRewardFreeLoans, setBirthdayRewardFreeLoans] = useState<number>(
    systemConfig?.birthdayRewardFreeLoans ?? 1
  );
  const [birthdayCustomMessage, setBirthdayCustomMessage] = useState<string>(
    systemConfig?.birthdayCustomMessage ||
      'زادروزت فرخنده باد! مکتب‌خانه تولد شما را تبریک می‌گوید و این هدیه تقدیم شماست 🎂🎁'
  );
  const [birthdaySendBaleMessage, setBirthdaySendBaleMessage] = useState<boolean>(
    systemConfig?.birthdaySendBaleMessage !== false
  );
  const [isSavingBirthdayConfig, setIsSavingBirthdayConfig] = useState(false);
  const [birthdaySaveFeedback, setBirthdaySaveFeedback] = useState<string | null>(null);

  // Birthday Directory & Management State for Admin
  const [birthdaySearchQuery, setBirthdaySearchQuery] = useState('');
  const [birthdayMonthFilter, setBirthdayMonthFilter] = useState<number | 'all' | 'unregistered'>('all');
  const [birthdayClassFilter, setBirthdayClassFilter] = useState<string>('all');
  const [birthdaySortBy, setBirthdaySortBy] = useState<'calendar' | 'days_left' | 'name' | 'class'>('calendar');
  const [birthdayViewMode, setBirthdayViewMode] = useState<'months' | 'table' | 'unregistered'>('months');
  const [isBirthdayDirectoryExpanded, setIsBirthdayDirectoryExpanded] = useState(true);

  // Student Birthday Edit Modal for Admin
  const [editingBirthdayUser, setEditingBirthdayUser] = useState<User | null>(null);
  const [editBirthMonth, setEditBirthMonth] = useState<number>(1);
  const [editBirthDay, setEditBirthDay] = useState<number>(1);
  const [isSavingStudentBirthday, setIsSavingStudentBirthday] = useState(false);
  const [studentBirthdaySaveMsg, setStudentBirthdaySaveMsg] = useState<{ success: boolean; text: string } | null>(null);

  useEffect(() => {
    if (systemConfig) {
      setBirthdayRewardEnabled(systemConfig.birthdayRewardEnabled !== false);
      setBirthdayRewardFreeLoans(systemConfig.birthdayRewardFreeLoans ?? 1);
      setBirthdayCustomMessage(
        systemConfig.birthdayCustomMessage ||
          'زادروزت فرخنده باد! مکتب‌خانه تولد شما را تبریک می‌گوید و این هدیه تقدیم شماست 🎂🎁'
      );
      setBirthdaySendBaleMessage(systemConfig.birthdaySendBaleMessage !== false);
    }
  }, [systemConfig]);

  const handleSaveBirthdayConfig = async () => {
    setIsSavingBirthdayConfig(true);
    setBirthdaySaveFeedback(null);
    try {
      const res = await updateSystemConfig({
        birthdayRewardEnabled,
        birthdayRewardFreeLoans,
        birthdayCustomMessage,
        birthdaySendBaleMessage
      });
      if (res.success) {
        setBirthdaySaveFeedback('تنظیمات رویداد هدیه تولد با موفقیت ذخیره شد ✓');
        setTimeout(() => setBirthdaySaveFeedback(null), 4000);
      } else {
        setBirthdaySaveFeedback(res.message || 'خطا در ذخیره تنظیمات');
      }
    } catch (e: any) {
      setBirthdaySaveFeedback(e.message || 'خطا در ارتباط با سرور');
    } finally {
      setIsSavingBirthdayConfig(false);
    }
  };

  const { month: currentJalaliMonth, day: currentJalaliDay } = getCurrentJalaliDate();

  // All Student Users
  const studentUsers = useMemo(() => {
    return users.filter((u) => u.role !== 'admin');
  }, [users]);

  // Registered Birthdays
  const registeredStudents = useMemo(() => {
    return studentUsers.filter((u) => u.birthMonth && u.birthDay);
  }, [studentUsers]);

  // Unregistered Birthdays
  const unregisteredStudents = useMemo(() => {
    return studentUsers.filter((u) => !u.birthMonth || !u.birthDay);
  }, [studentUsers]);

  // Birthday completion percent
  const completionPercent = useMemo(() => {
    return studentUsers.length > 0
      ? Math.round((registeredStudents.length / studentUsers.length) * 100)
      : 0;
  }, [studentUsers, registeredStudents]);

  // Group by Month (1..12)
  const studentsByMonth = useMemo(() => {
    const map: Record<number, User[]> = {};
    for (let m = 1; m <= 12; m++) {
      map[m] = studentUsers
        .filter((u) => u.birthMonth === m && u.birthDay)
        .sort((a, b) => (a.birthDay || 0) - (b.birthDay || 0));
    }
    return map;
  }, [studentUsers]);

  // Find busiest month
  const busiestMonthInfo = useMemo(() => {
    let maxMonth = 1;
    let maxCount = 0;
    for (let m = 1; m <= 12; m++) {
      const count = studentsByMonth[m]?.length || 0;
      if (count > maxCount) {
        maxCount = count;
        maxMonth = m;
      }
    }
    return { month: maxMonth, count: maxCount, name: PERSIAN_MONTHS[maxMonth - 1] };
  }, [studentsByMonth]);

  // Filter students who have birthday today and this month
  const todayBirthdays = useMemo(() => {
    return studentUsers.filter(
      (u) => u.birthMonth === currentJalaliMonth && u.birthDay === currentJalaliDay
    );
  }, [studentUsers, currentJalaliMonth, currentJalaliDay]);

  const thisMonthBirthdays = useMemo(() => {
    return studentUsers.filter(
      (u) => u.birthMonth === currentJalaliMonth && u.birthDay !== currentJalaliDay
    );
  }, [studentUsers, currentJalaliMonth, currentJalaliDay]);

  // Filtered and Sorted Students list for directory
  const filteredStudents = useMemo(() => {
    return studentUsers.filter((u) => {
      // Search Query
      if (birthdaySearchQuery.trim()) {
        const q = birthdaySearchQuery.toLowerCase().trim();
        const matchName = u.name.toLowerCase().includes(q);
        const matchPhone = (u.phone || '').includes(q);
        const matchClass = (u.className || '').toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchClass) return false;
      }

      // Class Filter
      if (birthdayClassFilter !== 'all' && u.className !== birthdayClassFilter) {
        return false;
      }

      // Month Filter
      if (birthdayMonthFilter === 'unregistered') {
        return !u.birthMonth || !u.birthDay;
      }
      if (birthdayMonthFilter !== 'all') {
        return u.birthMonth === birthdayMonthFilter && u.birthDay;
      }

      return true;
    }).sort((a, b) => {
      if (birthdaySortBy === 'calendar') {
        const aHas = a.birthMonth && a.birthDay;
        const bHas = b.birthMonth && b.birthDay;
        if (!aHas && !bHas) return 0;
        if (!aHas) return 1;
        if (!bHas) return -1;
        if (a.birthMonth !== b.birthMonth) return (a.birthMonth || 0) - (b.birthMonth || 0);
        return (a.birthDay || 0) - (b.birthDay || 0);
      }
      if (birthdaySortBy === 'days_left') {
        const aDays = getDaysUntilBirthday(a.birthMonth, a.birthDay) ?? 9999;
        const bDays = getDaysUntilBirthday(b.birthMonth, b.birthDay) ?? 9999;
        return aDays - bDays;
      }
      if (birthdaySortBy === 'name') {
        return a.name.localeCompare(b.name, 'fa');
      }
      if (birthdaySortBy === 'class') {
        return (a.className || '').localeCompare(b.className || '', 'fa');
      }
      return 0;
    });
  }, [studentUsers, birthdaySearchQuery, birthdayClassFilter, birthdayMonthFilter, birthdaySortBy]);

  const openEditBirthdayModal = (user: User) => {
    setEditingBirthdayUser(user);
    setEditBirthMonth(user.birthMonth || currentJalaliMonth);
    setEditBirthDay(user.birthDay || currentJalaliDay);
    setStudentBirthdaySaveMsg(null);
  };

  const handleSaveStudentBirthday = async () => {
    if (!editingBirthdayUser) return;
    setIsSavingStudentBirthday(true);
    setStudentBirthdaySaveMsg(null);
    try {
      const res = await updateUserBirthday(editBirthMonth, editBirthDay, editingBirthdayUser.id, true);
      if (res.success) {
        setStudentBirthdaySaveMsg({
          success: true,
          text: `تاریخ تولد «${editingBirthdayUser.name}» با موفقیت به ${editBirthDay} ${PERSIAN_MONTHS[editBirthMonth - 1]} ثبت شد ✓`
        });
        setTimeout(() => {
          setEditingBirthdayUser(null);
          setStudentBirthdaySaveMsg(null);
        }, 1400);
      } else {
        setStudentBirthdaySaveMsg({
          success: false,
          text: res.message || 'خطا در ثبت تاریخ تولد'
        });
      }
    } catch (e: any) {
      setStudentBirthdaySaveMsg({
        success: false,
        text: e.message || 'خطا در برقراری ارتباط'
      });
    } finally {
      setIsSavingStudentBirthday(false);
    }
  };

  // Form State
  const [title, setTitle] = useState('');
  const [tag, setTag] = useState('');
  const [description, setDescription] = useState('');
  const [targetCount, setTargetCount] = useState<number>(8);
  const [freeLoanCount, setFreeLoanCount] = useState<number>(2);
  const [rewardDescription, setRewardDescription] = useState('۲ سهمیه امانت کتاب کاملاً رایگان بدون کارمزد');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [durationDays, setDurationDays] = useState<number>(14);
  const [status, setStatus] = useState<EventStatus>('active');
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

      {/* Birthday Reward Event Permanent Config Card */}
      <div className="bg-gradient-to-br from-amber-50 via-orange-50/50 to-rose-50/50 border-2 border-amber-300 rounded-3xl p-6 shadow-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amber-200/80">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-400 text-slate-950 flex items-center justify-center shadow-md shrink-0">
              <Cake className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 text-base sm:text-lg">
                  رویداد دائمی هدیه روز تولد دانش‌آموزان 🎂🎁
                </h3>
                <span className="text-[10px] bg-amber-200 text-amber-950 font-black px-2.5 py-0.5 rounded-full">
                  خودکار & سالانه
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                تعیین تعداد سهمیه امانت رایگان اهدایی به هر دانش‌آموز در سالروز تولدش، پیام تبریک و اطلاع‌رسانی در بله
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border-2 border-amber-300 cursor-pointer shadow-xs shrink-0 self-start sm:self-auto">
            <input
              type="checkbox"
              checked={birthdayRewardEnabled}
              onChange={(e) => setBirthdayRewardEnabled(e.target.checked)}
              className="w-4 h-4 text-amber-600 rounded-md focus:ring-amber-500 cursor-pointer"
            />
            <span className="text-xs font-black text-slate-900">
              {birthdayRewardEnabled ? '✅ رویداد تولد فعال است' : '❌ رویداد تولد غیرفعال'}
            </span>
          </label>
        </div>

        {/* Config Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              تعداد سهمیه امانت رایگان هدیه تولد:
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="10"
                value={birthdayRewardFreeLoans}
                onChange={(e) => setBirthdayRewardFreeLoans(Math.max(1, Number(e.target.value)))}
                className="w-full bg-white border border-amber-300 focus:border-amber-500 text-slate-900 font-black text-sm rounded-xl p-3 outline-hidden"
              />
              <span className="absolute left-3 top-3 text-xs text-slate-400 font-bold">عدد</span>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              متن اختصاصی پیام تبریک تولد:
            </label>
            <input
              type="text"
              value={birthdayCustomMessage}
              onChange={(e) => setBirthdayCustomMessage(e.target.value)}
              placeholder="زادروزت فرخنده باد! مکتب‌خانه تولد شما را تبریک می‌گوید..."
              className="w-full bg-white border border-amber-300 focus:border-amber-500 text-slate-900 font-medium text-xs rounded-xl p-3 outline-hidden"
            />
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
            <input
              type="checkbox"
              checked={birthdaySendBaleMessage}
              onChange={(e) => setBirthdaySendBaleMessage(e.target.checked)}
              className="w-4 h-4 text-sky-600 rounded-md focus:ring-sky-500 cursor-pointer"
            />
            <span className="flex items-center gap-1">
              <Send className="w-3.5 h-3.5 text-sky-600" />
              ارسال خودکار پیام تبریک و اطلاع‌رسانی هدیه به حساب بله دانش‌آموز در روز تولدش
            </span>
          </label>

          <button
            type="button"
            disabled={isSavingBirthdayConfig}
            onClick={handleSaveBirthdayConfig}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSavingBirthdayConfig ? 'در حال ذخیره...' : 'ذخیره تنظیمات رویداد تولد'}</span>
          </button>
        </div>

        {birthdaySaveFeedback && (
          <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-950 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{birthdaySaveFeedback}</span>
          </div>
        )}

        {/* Birthday Students Status (Today & This Month Quick Highlights) */}
        <div className="pt-3 border-t border-amber-200/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Today Birthdays */}
          <div className="bg-white/80 p-3.5 rounded-2xl border border-amber-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                <PartyPopper className="w-4 h-4 text-rose-500" />
                <span>متولدین امروز ({currentJalaliDay} {PERSIAN_MONTHS[currentJalaliMonth - 1]}):</span>
              </span>
              <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">
                {todayBirthdays.length} نفر
              </span>
            </div>

            {todayBirthdays.length === 0 ? (
              <p className="text-[11px] text-slate-400">امروز تولد هیچ دانش‌آموزی ثبت نشده است.</p>
            ) : (
              <div className="space-y-1.5">
                {todayBirthdays.map((u) => (
                  <div key={u.id} className="flex items-center justify-between text-xs bg-amber-50 p-2 rounded-xl border border-amber-200">
                    <div className="flex items-center gap-2">
                      <img src={u.avatar} alt={u.name} className="w-6 h-6 rounded-full object-cover" />
                      <span className="font-bold text-slate-900">{u.name} ({u.className})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        🎂 تولد مبارک!
                      </span>
                      <button
                        type="button"
                        onClick={() => openEditBirthdayModal(u)}
                        className="p-1 hover:bg-white rounded-lg text-slate-500 hover:text-indigo-600 transition"
                        title="ویرایش تاریخ تولد"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* This Month Birthdays */}
          <div className="bg-white/80 p-3.5 rounded-2xl border border-amber-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-600" />
                <span>سایر متولدین ماه {PERSIAN_MONTHS[currentJalaliMonth - 1]}:</span>
              </span>
              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                {thisMonthBirthdays.length} نفر
              </span>
            </div>

            {thisMonthBirthdays.length === 0 ? (
              <p className="text-[11px] text-slate-400">دانش‌آموز دیگری در این ماه ثبت نشده است.</p>
            ) : (
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {thisMonthBirthdays.map((u) => (
                  <div key={u.id} className="flex items-center justify-between text-xs bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-800">{u.name} ({u.className})</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-500">
                        {formatPersianBirthday(u.birthMonth, u.birthDay)}
                      </span>
                      <button
                        type="button"
                        onClick={() => openEditBirthdayModal(u)}
                        className="p-1 hover:bg-white rounded-lg text-slate-500 hover:text-indigo-600 transition"
                        title="ویرایش تاریخ تولد"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* COMPREHENSIVE ALL-STUDENTS BIRTHDAY DIRECTORY (ویژه مدیر) */}
        {/* ------------------------------------------------------------- */}
        <div className="pt-5 border-t-2 border-amber-300/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/90 p-4 rounded-2xl border border-amber-300/80 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center shadow-xs shrink-0">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <span>دفتر جامع و تقویم تولد همه بچه‌ها 🎂📅</span>
                  <span className="text-[10px] bg-indigo-100 text-indigo-900 font-bold px-2 py-0.5 rounded-full">
                    {registeredStudents.length} از {studentUsers.length} نفر ثبت‌شده
                  </span>
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  مشاهده تاریخ تولد کامل دانش‌آموزان به تفکیک ۱۲ ماه سال، روزشمار تا سالروز تولد و امکان ویرایش برای مدیر
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsBirthdayDirectoryExpanded(!isBirthdayDirectoryExpanded)}
              className="px-3.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-950 font-black text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <span>{isBirthdayDirectoryExpanded ? 'بستن تقویم' : 'نمایش تقویم کامل'}</span>
              {isBirthdayDirectoryExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {isBirthdayDirectoryExpanded && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Statistical KPI Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3.5 rounded-2xl border border-amber-200 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-bold">کل دانش‌آموزان</span>
                    <Users className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="text-lg font-black text-slate-900">{studentUsers.length} <span className="text-xs font-normal text-slate-500">نفر</span></div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-emerald-200 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-xs text-emerald-700">
                    <span className="font-bold">تولد‌های ثبت‌شده</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-lg font-black text-emerald-950">{registeredStudents.length} <span className="text-xs font-bold text-emerald-600">({completionPercent}٪)</span></div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${completionPercent}%` }} />
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-rose-200 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-xs text-rose-700">
                    <span className="font-bold">هنوز ثبت‌نشده</span>
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="text-lg font-black text-rose-950">{unregisteredStudents.length} <span className="text-xs font-normal text-rose-600">نفر</span></div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: `${100 - completionPercent}%` }} />
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-purple-200 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-xs text-purple-700">
                    <span className="font-bold">شلوغ‌ترین ماه تولد</span>
                    <Sparkles className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="text-sm font-black text-purple-950 truncate">
                    {busiestMonthInfo.name} <span className="text-xs font-bold text-purple-700">({busiestMonthInfo.count} متولد)</span>
                  </div>
                  <div className="text-[10px] text-purple-600 font-semibold">بیشترین جشن‌های ماهانه</div>
                </div>
              </div>

              {/* 12 Months Fast Selector Tabs */}
              <div className="bg-white/90 p-3 rounded-2xl border border-amber-200/80 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs font-black text-slate-800 pb-1 border-b border-slate-100">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    <span>فیلتر سریع بر اساس ماه تولد:</span>
                  </span>
                  <span className="text-[11px] font-normal text-slate-500">
                    ماه جاری: <strong className="text-amber-700">{PERSIAN_MONTHS[currentJalaliMonth - 1]}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
                  <button
                    type="button"
                    onClick={() => setBirthdayMonthFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition flex items-center gap-1 cursor-pointer ${
                      birthdayMonthFilter === 'all'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>همه متولدین</span>
                    <span className="text-[10px] bg-black/20 px-1.5 py-0.2 rounded-md">{registeredStudents.length}</span>
                  </button>

                  {PERSIAN_MONTHS.map((monthName, idx) => {
                    const mNum = idx + 1;
                    const count = studentsByMonth[mNum]?.length || 0;
                    const isCurrent = mNum === currentJalaliMonth;
                    const isSelected = birthdayMonthFilter === mNum;
                    const season = getPersianSeason(mNum);

                    return (
                      <button
                        key={mNum}
                        type="button"
                        onClick={() => setBirthdayMonthFilter(mNum)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1 cursor-pointer border ${
                          isSelected
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 border-amber-600 font-black shadow-xs'
                            : isCurrent
                            ? 'bg-amber-50 text-amber-900 border-amber-300 font-black'
                            : count > 0
                            ? 'bg-white text-slate-800 border-slate-200 hover:border-amber-300'
                            : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'
                        }`}
                      >
                        <span>{season.icon}</span>
                        <span>{monthName}</span>
                        <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${
                          isSelected ? 'bg-black/20 text-slate-950' : isCurrent ? 'bg-amber-200 text-amber-950' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {count}
                        </span>
                        {isCurrent && <span className="text-[9px] text-rose-600 font-black">★</span>}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setBirthdayMonthFilter('unregistered')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition flex items-center gap-1 cursor-pointer border ${
                      birthdayMonthFilter === 'unregistered'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                        : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>ثبت‌نشده‌ها</span>
                    <span className="text-[10px] bg-rose-200 text-rose-900 px-1.5 py-0.2 rounded-md font-black">{unregisteredStudents.length}</span>
                  </button>
                </div>
              </div>

              {/* Toolbar: Search, Class Filter, Sorting & View Modes */}
              <div className="bg-white/90 p-3 rounded-2xl border border-amber-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
                {/* Search Box */}
                <div className="relative w-full md:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  <input
                    type="text"
                    value={birthdaySearchQuery}
                    onChange={(e) => setBirthdaySearchQuery(e.target.value)}
                    placeholder="جستجوی نام یا کلاس دانش‌آموز..."
                    className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 text-slate-900 text-xs rounded-xl pr-9 pl-3 py-2 outline-hidden"
                  />
                  {birthdaySearchQuery && (
                    <button
                      type="button"
                      onClick={() => setBirthdaySearchQuery('')}
                      className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
                  {/* Class Filter */}
                  <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                    <select
                      value={birthdayClassFilter}
                      onChange={(e) => setBirthdayClassFilter(e.target.value)}
                      className="bg-transparent text-xs font-bold text-slate-800 outline-hidden cursor-pointer"
                    >
                      <option value="all">همه کلاس‌ها</option>
                      {schoolClasses.map((cls) => (
                        <option key={cls.id || cls.name} value={cls.name}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sort Selector */}
                  <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200">
                    <Filter className="w-3.5 h-3.5 text-slate-500" />
                    <select
                      value={birthdaySortBy}
                      onChange={(e) => setBirthdaySortBy(e.target.value as any)}
                      className="bg-transparent text-xs font-bold text-slate-800 outline-hidden cursor-pointer"
                    >
                      <option value="calendar">مرتب‌سازی: گاه‌شمار سال (فروردین تا اسفند)</option>
                      <option value="days_left">مرتب‌سازی: نزدیک‌ترین تولد به امروز</option>
                      <option value="name">مرتب‌سازی: الفبای نام دانش‌آموز</option>
                      <option value="class">مرتب‌سازی: بر اساس کلاس</option>
                    </select>
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setBirthdayViewMode('months')}
                      className={`p-1.5 rounded-lg transition cursor-pointer ${
                        birthdayViewMode === 'months' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="نمای تقویم ماه‌به‌ماه"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setBirthdayViewMode('table')}
                      className={`p-1.5 rounded-lg transition cursor-pointer ${
                        birthdayViewMode === 'table' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="نمای جدول تفصیلی کل دانش‌آموزان"
                    >
                      <TableIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* ----------------------------------------------------------------- */}
              {/* VIEW 1: MONTHLY GROUPED CARDS (نمای ماه‌به‌ماه و فصلی) */}
              {/* ----------------------------------------------------------------- */}
              {birthdayViewMode === 'months' && birthdayMonthFilter !== 'unregistered' && (
                <div className="space-y-4">
                  {PERSIAN_MONTHS.map((monthName, idx) => {
                    const mNum = idx + 1;
                    // If user filtered for a specific month, only show that month
                    if (birthdayMonthFilter !== 'all' && birthdayMonthFilter !== mNum) return null;

                    const monthStudents = filteredStudents.filter((u) => u.birthMonth === mNum);
                    if (birthdayMonthFilter === 'all' && monthStudents.length === 0 && birthdaySearchQuery) return null;

                    const isCurrent = mNum === currentJalaliMonth;
                    const season = getPersianSeason(mNum);

                    return (
                      <div
                        key={mNum}
                        className={`bg-white rounded-3xl border transition-all p-4 space-y-3 shadow-2xs ${
                          isCurrent
                            ? 'border-amber-400 ring-2 ring-amber-300/60 bg-gradient-to-br from-amber-50/50 via-white to-orange-50/30'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {/* Month Header */}
                        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 flex-wrap gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl">{season.icon}</span>
                            <h5 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                              <span>ماه {monthName}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${season.color}`}>
                                فصل {season.name}
                              </span>
                              {isCurrent && (
                                <span className="text-[10px] bg-rose-500 text-white font-black px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  <span>ماه جاری</span>
                                </span>
                              )}
                            </h5>
                          </div>

                          <span className="text-xs font-black text-slate-600 bg-slate-100 px-2.5 py-1 rounded-xl">
                            {monthStudents.length} دانش‌آموز متولد {monthName}
                          </span>
                        </div>

                        {/* Students in this month */}
                        {monthStudents.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            در ماه {monthName} هیچ تولدی ثبت نشده است.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {monthStudents.map((u) => {
                              const daysLeft = getDaysUntilBirthday(u.birthMonth, u.birthDay);
                              const isToday = daysLeft === 0;
                              const isThisWeek = daysLeft !== null && daysLeft > 0 && daysLeft <= 7;
                              const isClaimed = u.lastBirthdayRewardYear === getCurrentJalaliDate().year;

                              return (
                                <div
                                  key={u.id}
                                  className={`p-3 rounded-2xl border transition-all flex flex-col justify-between space-y-2.5 group ${
                                    isToday
                                      ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-200 shadow-xs'
                                      : isThisWeek
                                      ? 'bg-amber-50 border-amber-300 shadow-2xs'
                                      : 'bg-slate-50/70 border-slate-200/80 hover:bg-white hover:border-indigo-200 hover:shadow-xs'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <img
                                        src={u.avatar}
                                        alt={u.name}
                                        className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                                      />
                                      <div className="min-w-0">
                                        <h6 className="font-black text-xs text-slate-900 truncate" title={u.name}>
                                          {u.name}
                                        </h6>
                                        <span className="text-[10px] text-slate-500 font-bold block truncate">
                                          کلاس: {u.className || 'عمومی'}
                                        </span>
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => openEditBirthdayModal(u)}
                                      className="p-1.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-500 hover:text-indigo-600 rounded-xl transition cursor-pointer shrink-0"
                                      title="ویرایش تاریخ تولد دانش‌آموز"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  {/* Birthday Date & Days countdown */}
                                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                                    <span className="font-black text-slate-900 flex items-center gap-1">
                                      <Cake className="w-3.5 h-3.5 text-amber-500" />
                                      <span>{u.birthDay} {monthName}</span>
                                    </span>

                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                      isToday
                                        ? 'bg-rose-600 text-white animate-bounce'
                                        : isThisWeek
                                        ? 'bg-amber-200 text-amber-950 font-bold'
                                        : 'bg-slate-200/80 text-slate-700'
                                    }`}>
                                      {formatDaysUntilBirthday(u.birthMonth, u.birthDay)}
                                    </span>
                                  </div>

                                  {/* Reward Claim Status */}
                                  <div className="text-[10px] flex items-center justify-between text-slate-500 bg-white/80 p-1.5 rounded-xl border border-slate-100">
                                    <span className="font-bold">هدیه امانت سال {getCurrentJalaliDate().year}:</span>
                                    {isClaimed ? (
                                      <span className="text-emerald-700 font-black flex items-center gap-0.5">
                                        <Check className="w-3 h-3 text-emerald-600" />
                                        <span>دریافت شد 🎁</span>
                                      </span>
                                    ) : (
                                      <span className="text-amber-800 font-semibold">
                                        {isToday ? 'آماده تحویل 🎈' : 'در نوبت سالروز'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ----------------------------------------------------------------- */}
              {/* VIEW 2: COMPREHENSIVE TABLE VIEW (نمای جدول تفصیلی تمام بچه‌ها) */}
              {/* ----------------------------------------------------------------- */}
              {birthdayViewMode === 'table' && birthdayMonthFilter !== 'unregistered' && (
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs text-slate-700">
                      <thead className="bg-slate-50 text-slate-900 font-black border-b border-slate-200 text-[11px]">
                        <tr>
                          <th className="p-3 w-12 text-center">ردیف</th>
                          <th className="p-3">دانش‌آموز</th>
                          <th className="p-3">کلاس</th>
                          <th className="p-3">تاریخ تولد</th>
                          <th className="p-3">فصل</th>
                          <th className="p-3">فاصله تا سالروز تولد</th>
                          <th className="p-3">هدیه امانت سال جاری</th>
                          <th className="p-3 text-center">عملیات مدیر</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredStudents.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-6 text-center text-slate-400 text-xs">
                              هیچ دانش‌آموزی با این فیلترها یافت نشد.
                            </td>
                          </tr>
                        ) : (
                          filteredStudents.map((u, idx) => {
                            const hasBirthday = u.birthMonth && u.birthDay;
                            const daysLeft = getDaysUntilBirthday(u.birthMonth, u.birthDay);
                            const isToday = daysLeft === 0;
                            const isThisWeek = daysLeft !== null && daysLeft > 0 && daysLeft <= 7;
                            const season = getPersianSeason(u.birthMonth);
                            const isClaimed = u.lastBirthdayRewardYear === getCurrentJalaliDate().year;

                            return (
                              <tr
                                key={u.id}
                                className={`hover:bg-slate-50/80 transition ${
                                  isToday ? 'bg-rose-50/60 font-bold' : isThisWeek ? 'bg-amber-50/40' : ''
                                }`}
                              >
                                <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                                <td className="p-3">
                                  <div className="flex items-center gap-2.5">
                                    <img
                                      src={u.avatar}
                                      alt={u.name}
                                      className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                                    />
                                    <div>
                                      <span className="font-black text-slate-900 block">{u.name}</span>
                                      <span className="text-[10px] text-slate-400 font-mono">{u.phone || u.id}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3 font-bold text-slate-700">{u.className || '—'}</td>
                                <td className="p-3">
                                  {hasBirthday ? (
                                    <span className="font-black text-slate-900 flex items-center gap-1">
                                      <Cake className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                      <span>{formatPersianBirthday(u.birthMonth, u.birthDay)}</span>
                                    </span>
                                  ) : (
                                    <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-md">
                                      ثبت نشده
                                    </span>
                                  )}
                                </td>
                                <td className="p-3">
                                  {hasBirthday ? (
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${season.color}`}>
                                      {season.icon} {season.name}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </td>
                                <td className="p-3">
                                  {hasBirthday ? (
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                      isToday
                                        ? 'bg-rose-600 text-white animate-pulse'
                                        : isThisWeek
                                        ? 'bg-amber-200 text-amber-950'
                                        : 'bg-slate-100 text-slate-700'
                                    }`}>
                                      {formatDaysUntilBirthday(u.birthMonth, u.birthDay)}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-[10px]">منتظر ثبت</span>
                                  )}
                                </td>
                                <td className="p-3">
                                  {isClaimed ? (
                                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-md flex items-center gap-1 w-fit">
                                      <Check className="w-3 h-3 text-emerald-600" />
                                      <span>دریافت شد 🎁</span>
                                    </span>
                                  ) : hasBirthday ? (
                                    <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                                      {isToday ? 'امروز آماده دریافت' : 'در نوبت سالانه'}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-[10px]">—</span>
                                  )}
                                </td>
                                <td className="p-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => openEditBirthdayModal(u)}
                                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition text-[11px] flex items-center gap-1 mx-auto cursor-pointer"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                    <span>{hasBirthday ? 'ویرایش' : 'ثبت تولد'}</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------------------- */}
              {/* VIEW 3: UNREGISTERED STUDENTS FOLLOW-UP LIST (دانش‌آموزان ثبت‌نشده) */}
              {/* ----------------------------------------------------------------- */}
              {birthdayMonthFilter === 'unregistered' && (
                <div className="bg-white rounded-3xl border border-rose-200 p-5 space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between pb-3 border-b border-rose-100">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-rose-500" />
                      <h5 className="font-black text-slate-900 text-sm">
                        دانش‌آموزانی که هنوز تاریخ تولدشان را در مکتب‌خانه ثبت نکرده‌اند ({unregisteredStudents.length} نفر)
                      </h5>
                    </div>
                    <span className="text-xs text-slate-500">
                      مدیر می‌تواند مستقیماً تاریخ تولد این دانش‌آموزان را تنظیم کند.
                    </span>
                  </div>

                  {unregisteredStudents.length === 0 ? (
                    <div className="p-8 text-center bg-emerald-50 text-emerald-900 rounded-2xl border border-emerald-200 space-y-1">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                      <p className="font-black text-sm">عالی است! تاریخ تولد تمام دانش‌آموزان با موفقیت ثبت شده است.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {unregisteredStudents.map((u) => (
                        <div
                          key={u.id}
                          className="p-3 bg-slate-50 hover:bg-white rounded-2xl border border-slate-200 hover:border-amber-300 transition flex items-center justify-between gap-3 shadow-2xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={u.avatar}
                              alt={u.name}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                            <div className="min-w-0">
                              <span className="font-black text-xs text-slate-900 block truncate">{u.name}</span>
                              <span className="text-[10px] text-slate-500 font-bold block truncate">
                                کلاس: {u.className || 'نامشخص'}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => openEditBirthdayModal(u)}
                            className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs rounded-xl shadow-2xs transition flex items-center gap-1 shrink-0 cursor-pointer"
                          >
                            <Cake className="w-3.5 h-3.5" />
                            <span>ثبت تاریخ</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ADMIN EDIT / SET STUDENT BIRTHDAY MODAL */}
      {/* ------------------------------------------------------------- */}
      {editingBirthdayUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-amber-300 space-y-4 relative">
            <button
              type="button"
              onClick={() => setEditingBirthdayUser(null)}
              className="absolute left-4 top-4 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0">
                <Cake className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-base">
                  ثبت یا ویرایش تاریخ تولد دانش‌آموز
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  تغییر تاریخ تولد توسط مدیریت سامانه مکتب‌خانه
                </p>
              </div>
            </div>

            {/* Target Student Info Card */}
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-center gap-3">
              <img
                src={editingBirthdayUser.avatar}
                alt={editingBirthdayUser.name}
                className="w-10 h-10 rounded-full object-cover border border-amber-300"
              />
              <div className="min-w-0 flex-1">
                <span className="font-black text-xs text-slate-900 block">{editingBirthdayUser.name}</span>
                <span className="text-[11px] text-slate-600">کلاس: {editingBirthdayUser.className || 'عمومی'}</span>
              </div>
              {editingBirthdayUser.birthMonth && editingBirthdayUser.birthDay ? (
                <span className="text-[10px] bg-white text-slate-700 font-bold px-2 py-1 rounded-lg border border-amber-200">
                  قبلی: {formatPersianBirthday(editingBirthdayUser.birthMonth, editingBirthdayUser.birthDay)}
                </span>
              ) : (
                <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-1 rounded-lg">
                  هنوز ثبت نشده
                </span>
              )}
            </div>

            {/* Selection Form */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ماه تولد شمسی:
                </label>
                <select
                  value={editBirthMonth}
                  onChange={(e) => {
                    const newM = Number(e.target.value);
                    setEditBirthMonth(newM);
                    const maxDays = newM <= 6 ? 31 : newM <= 11 ? 30 : 29;
                    if (editBirthDay > maxDays) setEditBirthDay(maxDays);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-amber-500 text-slate-900 font-bold text-xs rounded-xl p-3 outline-hidden"
                >
                  {PERSIAN_MONTHS.map((mName, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} - {mName} ({getPersianSeason(i + 1).icon} {getPersianSeason(i + 1).name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  روز ماه تولد:
                </label>
                <select
                  value={editBirthDay}
                  onChange={(e) => setEditBirthDay(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-amber-500 text-slate-900 font-bold text-xs rounded-xl p-3 outline-hidden"
                >
                  {Array.from(
                    { length: editBirthMonth <= 6 ? 31 : editBirthMonth <= 11 ? 30 : 29 },
                    (_, i) => i + 1
                  ).map((d) => (
                    <option key={d} value={d}>
                      {d} {PERSIAN_MONTHS[editBirthMonth - 1]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <span>تاریخ تولد انتخابی جدید:</span>
              <strong className="text-indigo-900 font-black text-sm">
                🎂 {editBirthDay} {PERSIAN_MONTHS[editBirthMonth - 1]} ({getPersianSeason(editBirthMonth).name})
              </strong>
            </div>

            {studentBirthdaySaveMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  studentBirthdaySaveMsg.success
                    ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                    : 'bg-rose-100 text-rose-950 border border-rose-300'
                }`}
              >
                {studentBirthdaySaveMsg.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{studentBirthdaySaveMsg.text}</span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={isSavingStudentBirthday}
                onClick={handleSaveStudentBirthday}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingStudentBirthday ? 'در حال ثبت...' : 'ذخیره تاریخ تولد دانش‌آموز'}</span>
              </button>

              <button
                type="button"
                onClick={() => setEditingBirthdayUser(null)}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

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
