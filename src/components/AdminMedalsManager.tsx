import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SystemMedal, MedalTier, MedalConditionType, User } from '../types';
import { TIER_CONFIG } from '../data/defaultMedals';
import { api } from '../services/api';
import {
  Award,
  Medal as MedalIcon,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Users,
  Search,
  Filter,
  X,
  Gift,
  Zap,
  BookOpen,
  Star,
  Clock,
  Shield,
  Layers,
  Crown,
  Trophy,
  Loader2,
  Check,
  UserCheck,
  Camera
} from 'lucide-react';

const CONDITION_TYPES: Array<{ id: MedalConditionType; label: string; icon: string; defaultUnit: string }> = [
  { id: 'books_read', label: 'تعداد کتاب خوانده/امانت گرفته شده', icon: '📖', defaultUnit: 'جلد' },
  { id: 'books_contributed', label: 'تعداد کتاب ثبت/اهدا شده', icon: '📚', defaultUnit: 'جلد' },
  { id: 'successful_loans', label: 'تعداد امانت موفق با رضایت', icon: '🤝', defaultUnit: 'مرتبه' },
  { id: 'high_rating', label: 'میانگین امتیاز رضایت (ستاره)', icon: '⭐', defaultUnit: 'از ۵' },
  { id: 'reviews_written', label: 'تعداد نقد و نظرات ثبت‌شده', icon: '🖋️', defaultUnit: 'دیدگاه' },
  { id: 'multi_category', label: 'تنوع موضوعی کتاب‌های مطالعه‌شده', icon: '🧭', defaultUnit: 'دسته‌بندی' },
  { id: 'speed_return', label: 'تندخوانی و بازگرداندن سریع (زیر ۳ روز)', icon: '⚡', defaultUnit: 'مرتبه' },
  { id: 'league_top', label: 'حضور در رتبه‌های برتر لیگ', icon: '👑', defaultUnit: 'رتبه' },
  { id: 'custom_manual', label: 'شرط سفارشی / اعطای دستی توسط مدیر', icon: '🎯', defaultUnit: 'مورد' }
];

export const AdminMedalsManager: React.FC = () => {
  const {
    medals,
    createMedal,
    updateMedal,
    deleteMedal,
    evaluateMedalsForUsers,
    awardMedalToUser,
    revokeMedalFromUser,
    users,
    resolveClassName
  } = useApp();

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingMedal, setEditingMedal] = useState<SystemMedal | null>(null);
  const [selectedMedalForAward, setSelectedMedalForAward] = useState<SystemMedal | null>(null);
  const [selectedMedalForEarnedList, setSelectedMedalForEarnedList] = useState<SystemMedal | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{
    awardedCount: number;
    details: Array<{ userId: string; userName: string; medalTitle: string; freeLoansGranted: number }>;
  } | null>(null);

  // Manual Award Form State
  const [awardUserId, setAwardUserId] = useState('');
  const [awardUserSearch, setAwardUserSearch] = useState('');
  const [awardNote, setAwardNote] = useState('شایستگی و فعالیت ممتاز در کتابخانه');
  const [isSubmittingAward, setIsSubmittingAward] = useState(false);
  const [awardFeedback, setAwardFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Quick Photo Upload State for Cards
  const [uploadingMedalId, setUploadingMedalId] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Filtered Medals List
  const filteredMedals = useMemo(() => {
    return medals.filter((m) => {
      const matchesSearch =
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.occasion.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.specialPerk.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTier = selectedTier === 'all' || m.tier === selectedTier;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && m.isActive) ||
        (statusFilter === 'inactive' && !m.isActive);

      return matchesSearch && matchesTier && matchesStatus;
    });
  }, [medals, searchQuery, selectedTier, statusFilter]);

  // Handle Quick Image Upload directly from card
  const handleDirectImageUpload = async (medal: SystemMedal, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingMedalId(medal.id);
    try {
      const res = await api.uploadImage(file);
      if (res.success && res.fileUrl) {
        await updateMedal(medal.id, { imageUrl: res.fileUrl });
        setActionSuccessMsg(`تصویر مدال «${medal.title}» با موفقیت ذخیره شد.`);
        setTimeout(() => setActionSuccessMsg(null), 3500);
      } else {
        const reader = new FileReader();
        reader.onload = async () => {
          if (reader.result) {
            await updateMedal(medal.id, { imageUrl: reader.result.toString() });
            setActionSuccessMsg(`تصویر مدال «${medal.title}» ذخیره شد.`);
            setTimeout(() => setActionSuccessMsg(null), 3500);
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('Error uploading medal image:', err);
    } finally {
      setUploadingMedalId(null);
    }
  };

  // Run Auto Evaluation
  const handleRunEvaluation = async () => {
    setEvaluating(true);
    try {
      const res = await evaluateMedalsForUsers();
      setEvaluationResult({
        awardedCount: res.awardedCount,
        details: res.details || []
      });
    } catch (err) {
      console.error('Evaluation error:', err);
    } finally {
      setEvaluating(false);
    }
  };

  // Handle Manual Award Submission
  const handleAwardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedalForAward || !awardUserId) {
      setAwardFeedback({ success: false, message: 'لطفاً دانش‌آموز را انتخاب کنید.' });
      return;
    }

    setIsSubmittingAward(true);
    setAwardFeedback(null);
    try {
      const res = await awardMedalToUser(awardUserId, selectedMedalForAward.id, awardNote.trim());
      if (res.success) {
        setAwardFeedback({
          success: true,
          message: `✓ مدال «${selectedMedalForAward.title}» با موفقیت به دانش‌آموز اهدا شد.`
        });
        setTimeout(() => {
          setSelectedMedalForAward(null);
          setAwardUserId('');
          setAwardFeedback(null);
        }, 2200);
      } else {
        setAwardFeedback({ success: false, message: res.message || 'خطا در اعطای مدال' });
      }
    } catch (err: any) {
      setAwardFeedback({ success: false, message: err.message || 'خطای شبکه در اعطای مدال' });
    } finally {
      setIsSubmittingAward(false);
    }
  };

  // Handle Revoke Medal
  const handleRevokeMedal = async (student: User, medal: SystemMedal) => {
    if (!window.confirm(`آیا از پس گرفتن مدال «${medal.title}» از دانش‌آموز «${student.name}» اطمینان دارید؟`)) {
      return;
    }
    try {
      const res = await revokeMedalFromUser(student.id, medal.id);
      if (res.success) {
        setActionSuccessMsg(`مدال «${medal.title}» از «${student.name}» پس گرفته شد.`);
        setTimeout(() => setActionSuccessMsg(null), 3500);
      }
    } catch (err) {
      console.error('Error revoking medal:', err);
    }
  };

  // Handle Delete Medal
  const handleDeleteMedal = async (medal: SystemMedal) => {
    if (!window.confirm(`آیا از حذف مدال «${medal.title}» اطمینان دارید؟`)) {
      return;
    }
    await deleteMedal(medal.id);
    setActionSuccessMsg(`مدال «${medal.title}» با موفقیت حذف شد.`);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  const approvedStudents = useMemo(() => {
    return users.filter((u) => u.status === 'approved' && u.role === 'student');
  }, [users]);

  const filteredStudentsForAward = useMemo(() => {
    if (!awardUserSearch.trim()) return approvedStudents;
    const query = awardUserSearch.toLowerCase();
    return approvedStudents.filter(
      (u) =>
        u.name.toLowerCase().includes(query) ||
        u.phone.includes(query) ||
        (u.className && u.className.toLowerCase().includes(query))
    );
  }, [approvedStudents, awardUserSearch]);

  // Helper for Badge Styles exactly matching the screenshot
  const getTierBadgeStyle = (tier: string, level: number, medalId: string) => {
    if (medalId === 'medal_leader_maktab') {
      return 'bg-[#581c87] text-white';
    }
    if (tier === 'bronze') {
      return 'bg-[#9a3412] text-white';
    }
    if (tier === 'silver') {
      return 'bg-[#475569] text-white';
    }
    if (tier === 'gold') {
      return 'bg-[#d97706] text-white';
    }
    if (tier === 'diamond') {
      return 'bg-[#0284c7] text-white';
    }
    if (tier === 'legendary') {
      return 'bg-[#6b21a8] text-white';
    }
    return 'bg-slate-700 text-white';
  };

  const getTierLabel = (tier: string, level: number, medalId: string) => {
    if (medalId === 'medal_leader_maktab') {
      return 'اسطوره‌ای • سطح ۵ (ویژه مدیریت)';
    }
    if (tier === 'bronze') return 'برنزی • سطح ۱';
    if (tier === 'silver') return `نقره‌ای • سطح ${level}`;
    if (tier === 'gold') return `طلایی • سطح ${level}`;
    if (tier === 'diamond') return `الماسی • سطح ${level}`;
    if (tier === 'legendary') return `اسطوره‌ای • سطح ${level}`;
    return `سطح ${level}`;
  };

  return (
    <div className="space-y-6 animate-fadeIn" dir="rtl">
      {/* Toast Feedback */}
      {actionSuccessMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-700 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-500 font-bold text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Top Toolbar Actions & Filters */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="جستجو در نام، مناسبت یا خاصیت مدال..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 rounded-2xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleRunEvaluation}
            disabled={evaluating}
            className="flex-1 md:flex-none bg-slate-900 hover:bg-slate-950 text-amber-300 font-bold px-4 py-2.5 rounded-2xl text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {evaluating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                <span>در حال ارزیابی...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-amber-400" />
                <span>ارزیابی هوشمند و اعطای خودکار</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              setEditingMedal(null);
              setIsCreateModalOpen(true);
            }}
            className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white font-black px-5 py-2.5 rounded-2xl text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>تعریف مدال جدید</span>
          </button>
        </div>
      </div>

      {/* Medals Grid Cards Exactly Like the Screenshots */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMedals.map((medal) => {
          const isUploadingThis = uploadingMedalId === medal.id;
          const badgeStyle = getTierBadgeStyle(medal.tier, medal.level, medal.id);
          const badgeLabel = getTierLabel(medal.tier, medal.level, medal.id);
          const isCustomMedal = medal.id === 'medal_veteran_maktab' || medal.criteria?.type === 'custom_manual';

          return (
            <div
              key={medal.id}
              className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative"
            >
              {/* Card Top Section: Badges, Title, Occasion & Photo Slot */}
              <div className="flex items-start justify-between gap-3">
                {/* Text Side (Right in RTL) */}
                <div className="space-y-1.5 flex-1">
                  {/* Top Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10px] font-black px-3 py-0.5 rounded-full ${badgeStyle}`}>
                      {badgeLabel}
                    </span>
                    {isCustomMedal && (
                      <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        ✨ سفارشی
                      </span>
                    )}
                  </div>

                  {/* Medal Title */}
                  <h3 className="font-black text-slate-900 text-base leading-snug">
                    {medal.title}
                  </h3>

                  {/* Occasion / Short Description */}
                  <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                    {medal.occasion || medal.description}
                  </p>
                </div>

                {/* Left Side (RTL): Earner Badge and Photo Placeholder/Slot */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {/* Earners count bubble */}
                  <span className="bg-[#eef2ff] text-[#4f46e5] text-xs font-bold px-2.5 py-0.5 rounded-full border border-indigo-100/80">
                    {medal.earnedCount || 0} دارنده
                  </span>

                  {/* Photo Slot (Square rounded with upload slot on hover) */}
                  <div className="relative group">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200/90 border border-slate-200 shadow-inner flex items-center justify-center overflow-hidden">
                      {medal.imageUrl ? (
                        <img
                          src={medal.imageUrl}
                          alt={medal.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                          <span className="text-2xl drop-shadow-xs">{medal.icon || '🏅'}</span>
                        </div>
                      )}
                    </div>

                    {/* Quick Image Upload Button (Direct File Slot) */}
                    <label
                      className="absolute inset-0 bg-slate-950/75 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition cursor-pointer text-[10px] font-bold z-10"
                      title="آپلود تصویر برای این مدال"
                    >
                      {isUploadingThis ? (
                        <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
                      ) : (
                        <>
                          <Camera className="w-4 h-4 text-amber-300 mb-0.5" />
                          <span>تغییر عکس</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleDirectImageUpload(medal, e)}
                        disabled={isUploadingThis}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Card Middle: Special Perk & Automatic Criteria */}
              <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
                {/* خاصیت در سامانه */}
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1 text-amber-600 font-black text-xs">
                    <Sparkles className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
                    <span>خاصیت در سامانه:</span>
                  </div>
                  <p className="text-xs text-slate-800 font-bold leading-relaxed pr-1">
                    {medal.specialPerk}
                  </p>
                </div>

                {/* شرط خودکار */}
                <div className="space-y-0.5">
                  <span className="font-black text-slate-800 text-[11px]">
                    شرط خودکار:{' '}
                  </span>
                  <span className="text-[11px] text-slate-500 font-normal leading-relaxed">
                    {medal.criteria?.description}
                  </span>
                </div>
              </div>

              {/* Card Bottom: Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedMedalForAward(medal);
                    setAwardUserId('');
                    setAwardFeedback(null);
                  }}
                  className="bg-[#4f46e5] hover:bg-[#4338ca] text-white font-black py-2.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition flex-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>اعطا به دانش‌آموز</span>
                </button>

                <button
                  onClick={() => {
                    setEditingMedal(medal);
                    setIsCreateModalOpen(true);
                  }}
                  className="p-2.5 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-2xl border border-slate-200 transition cursor-pointer"
                  title="ویرایش و شخصی‌سازی پیشرفته مدال"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                {isCustomMedal && (
                  <button
                    onClick={() => handleDeleteMedal(medal)}
                    className="p-2.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-2xl border border-rose-100 transition cursor-pointer"
                    title="حذف مدال"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={() => setSelectedMedalForEarnedList(medal)}
                  className="bg-[#eef2ff] hover:bg-[#e0e7ff] text-[#4338ca] font-bold py-2.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-1.5 border border-indigo-100 transition cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>دارندگان ({medal.earnedCount || 0})</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT MEDAL FORM                                           */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <MedalFormModal
          medalToEdit={editingMedal}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingMedal(null);
          }}
          onSaved={(msg) => {
            setIsCreateModalOpen(false);
            setEditingMedal(null);
            setActionSuccessMsg(msg);
            setTimeout(() => setActionSuccessMsg(null), 3500);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL: MANUAL AWARD TO SPECIFIC STUDENT                                   */}
      {/* ========================================================================= */}
      {selectedMedalForAward && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center text-xl">
                  {selectedMedalForAward.icon || '🏅'}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    اعطای مدال «{selectedMedalForAward.title}»
                  </h3>
                  <span className="text-xs text-slate-500">
                    {getTierLabel(selectedMedalForAward.tier, selectedMedalForAward.level, selectedMedalForAward.id)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedMedalForAward(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {awardFeedback && (
              <div
                className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                  awardFeedback.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {awardFeedback.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{awardFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleAwardSubmit} className="space-y-4">
              {/* Search & Select Student */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 block">
                  انتخاب دانش‌آموز دریافت‌کننده:
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="جستجوی نام یا کلاس دانش‌آموز..."
                    value={awardUserSearch}
                    onChange={(e) => setAwardUserSearch(e.target.value)}
                    className="w-full pl-3 pr-9 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100">
                  {filteredStudentsForAward.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      هیچ دانش‌آموزی یافت نشد.
                    </div>
                  ) : (
                    filteredStudentsForAward.map((st) => {
                      const alreadyHas = Array.isArray(st.medals) && st.medals.some((m) => m.id === selectedMedalForAward.id);
                      const isSelected = awardUserId === st.id;

                      return (
                        <div
                          key={st.id}
                          onClick={() => !alreadyHas && setAwardUserId(st.id)}
                          className={`p-2.5 flex items-center justify-between transition cursor-pointer text-xs ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-300 font-bold'
                              : alreadyHas
                              ? 'opacity-50 bg-slate-50 cursor-not-allowed'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <img
                              src={st.avatar}
                              alt={st.name}
                              className="w-7 h-7 rounded-full object-cover"
                            />
                            <div>
                              <span className="font-bold text-slate-800 block">{st.name}</span>
                              <span className="text-[10px] text-slate-400">
                                کلاس {resolveClassName(st.className)} • {st.phone}
                              </span>
                            </div>
                          </div>

                          <div>
                            {alreadyHas ? (
                              <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md font-bold">
                                دارنده این مدال
                              </span>
                            ) : isSelected ? (
                              <span className="text-[10px] bg-indigo-600 text-white font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Check className="w-3 h-3" /> انتخاب شده
                              </span>
                            ) : (
                              <span className="text-[10px] text-indigo-600 font-bold">انتخاب</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Note / Grant Reason */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700 block">
                  یادداشت / علت اعطای مدال:
                </label>
                <input
                  type="text"
                  value={awardNote}
                  onChange={(e) => setAwardNote(e.target.value)}
                  placeholder="علت اعطای مدال به دانش‌آموز..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMedalForAward(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={!awardUserId || isSubmittingAward}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-5 py-2 rounded-xl text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingAward ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>در حال ثبت...</span>
                    </>
                  ) : (
                    <>
                      <Award className="w-4 h-4" />
                      <span>اعطای مدال</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VIEW STUDENTS WHO EARNED THIS MEDAL                                */}
      {/* ========================================================================= */}
      {selectedMedalForEarnedList && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center text-xl">
                  {selectedMedalForEarnedList.icon || '🏅'}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    دانش‌آموزان دارنده مدال «{selectedMedalForEarnedList.title}»
                  </h3>
                  <span className="text-xs text-slate-500">
                    مجموعاً {selectedMedalForEarnedList.earnedCount || 0} نفر این مدال را دریافت کرده‌اند
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedMedalForEarnedList(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-2xl">
              {users.filter(
                (u) =>
                  u.status === 'approved' &&
                  Array.isArray(u.medals) &&
                  u.medals.some((m) => m.id === selectedMedalForEarnedList.id)
              ).length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                  <Users className="w-8 h-8 mx-auto text-slate-300" />
                  <p>هنوز هیچ دانش‌آموزی این مدال را دریافت نکرده است.</p>
                </div>
              ) : (
                users
                  .filter(
                    (u) =>
                      u.status === 'approved' &&
                      Array.isArray(u.medals) &&
                      u.medals.some((m) => m.id === selectedMedalForEarnedList.id)
                  )
                  .map((st) => {
                    const userMedal = st.medals.find((m) => m.id === selectedMedalForEarnedList.id);

                    return (
                      <div
                        key={st.id}
                        className="p-3 flex items-center justify-between text-xs hover:bg-slate-50 transition"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={st.avatar}
                            alt={st.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <span className="font-bold text-slate-800 block">{st.name}</span>
                            <span className="text-[10px] text-slate-400">
                              کلاس {resolveClassName(st.className)} • تاریخ کسب: {userMedal?.earnedAt || 'ثبت اولیه'}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRevokeMedal(st, selectedMedalForEarnedList)}
                          className="text-[11px] text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg font-bold transition cursor-pointer"
                        >
                          پس گرفتن مدال
                        </button>
                      </div>
                    );
                  })
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedMedalForEarnedList(null)}
                className="bg-slate-900 text-white font-bold px-5 py-2 rounded-xl text-xs cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EVALUATION REPORT DIALOG                                           */}
      {/* ========================================================================= */}
      {evaluationResult && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-scaleUp">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center text-2xl">
                ✨
              </div>
              <h3 className="font-black text-slate-900 text-lg">
                گزارش ارزیابی خودکار مدال‌ها
              </h3>
              <p className="text-xs text-slate-600">
                بررسی کلیه شرایط و اعطای خودکار به واجدین شرایط
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
              <span className="text-xs text-slate-500 block">تعداد کل مدال‌های جدید اعطاشده:</span>
              <span className="text-2xl font-black text-emerald-600">
                {evaluationResult.awardedCount} مدال جدید 🎉
              </span>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setEvaluationResult(null)}
                className="bg-slate-900 text-white font-bold px-6 py-2.5 rounded-xl text-xs cursor-pointer"
              >
                متوجه شدم
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// SUB-COMPONENT: ADVANCED MEDAL BUILDER & LOGIC STUDIO MODAL (CREATE / EDIT)
// =============================================================================
interface MedalFormModalProps {
  medalToEdit: SystemMedal | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}

const PRESET_TEMPLATES = [
  {
    name: '📚 حامی و اهداکننده کتاب',
    title: 'حامی طاقچه',
    tier: 'gold' as MedalTier,
    level: 3,
    icon: '📚',
    occasion: 'اهدای منظم کتاب‌های نفیس و خواندنی به قفسه اشتراکی مدرسه.',
    specialPerk: 'اعطای ۳ سهمیه امانت رایگان + ثبت نام در فهرست حامیان افتخاری مدرسه.',
    type: 'books_contributed' as MedalConditionType,
    threshold: 5,
    conditionDesc: 'ثبت و اهدای حداقل ۵ جلد کتاب سالم به کتابخانه',
    freeLoans: 3,
    points: 150,
    multiplier: 1.0,
    systemBadge: 'trusted_shield' as const
  },
  {
    name: '🛡️ امانتدار و خوش‌قول',
    title: 'نگهبان اعتماد',
    tier: 'silver' as MedalTier,
    level: 2,
    icon: '🛡️',
    occasion: 'امانتداری نمونه، حفظ سلامت فیزیکی کتاب و بازگرداندن بدون تاخیر.',
    specialPerk: 'اعطای نشان سپر سبز «امانت‌دار معتمد» در سراسر سامانه و اولویت در تایید درخواست‌ها.',
    type: 'successful_loans' as MedalConditionType,
    threshold: 4,
    conditionDesc: 'حداقل ۴ امانت موفق بازگردانده شده با رضایت ۵ ستاره کامل',
    freeLoans: 2,
    points: 100,
    multiplier: 1.0,
    systemBadge: 'trusted_shield' as const
  },
  {
    name: '⚡ تندخوان و سریع',
    title: 'تندخوان تیزپا',
    tier: 'silver' as MedalTier,
    level: 2,
    icon: '⚡',
    occasion: 'سرعت عمل شگفت‌انگیز در مطالعه و بازگرداندن کتاب در کمتر از ۳ روز.',
    specialPerk: 'برچسب «کتاب‌خوان پرسرعت» در کارنامه و امکان تمدید رایگان بدون کارمزد.',
    type: 'speed_return' as MedalConditionType,
    threshold: 2,
    conditionDesc: 'مطالعه و عودت حداقل ۲ کتاب در کمتر از ۷۲ ساعت با تایید دوطرفه',
    freeLoans: 2,
    points: 120,
    multiplier: 1.0,
    systemBadge: 'fast_reader' as const
  },
  {
    name: '🖋️ منتقد و صاحب‌نظر',
    title: 'فانوس نقد',
    tier: 'gold' as MedalTier,
    level: 3,
    icon: '🖋️',
    occasion: 'نگارش نقدهای عمیق، خلاصه کتاب و تحلیل‌های راهگشا برای همکلاسی‌ها.',
    specialPerk: 'سنجاق شدن دیدگاه‌ها به عنوان «نقد برتر و نشان‌دار» در بالای کتاب‌ها.',
    type: 'reviews_written' as MedalConditionType,
    threshold: 3,
    conditionDesc: 'ثبت حداقل ۳ نقد یا تحلیل مفید برای کتاب‌های مطالعه‌شده',
    freeLoans: 2,
    points: 140,
    multiplier: 1.0,
    systemBadge: 'golden_star' as const
  },
  {
    name: '👑 قهرمان لیگ کتابخوانی',
    title: 'سردار دانایی',
    tier: 'diamond' as MedalTier,
    level: 5,
    icon: '👑',
    occasion: 'درخشش در صدر جدول لیگ و کسب بیشترین امتیازات ماهانه.',
    specialPerk: 'نمایش نشان متحرک تاج زرین در کنار نام کاربری + ضریب ۱.۵ برابری در لیگ.',
    type: 'league_top' as MedalConditionType,
    threshold: 1,
    conditionDesc: 'کسب رتبه ۱ در رده‌بندی لیگ کتابخوانی ماهانه مدرسه',
    freeLoans: 5,
    points: 500,
    multiplier: 1.5,
    systemBadge: 'crown' as const
  },
  {
    name: '✨ سفارشی دستی مدیر',
    title: 'نشان افتخاری مدیر',
    tier: 'legendary' as MedalTier,
    level: 5,
    icon: '🎖️',
    occasion: 'نشان ویژه تقدیر و تجلیل از دانش‌آموزان به پاس اخلاق و همراهی مستمر.',
    specialPerk: 'اعطای ۳ سهمیه امانت رایگان + ثبت نام در تالار افتخارات مکتب‌خانه.',
    type: 'custom_manual' as MedalConditionType,
    threshold: 1,
    conditionDesc: 'اعطای اختصاصی و دستی بر پایه صلاحدید و تشخیص مدیر مدرسه',
    freeLoans: 3,
    points: 300,
    multiplier: 1.25,
    systemBadge: 'hall_of_fame' as const
  }
];

const MedalFormModal: React.FC<MedalFormModalProps> = ({ medalToEdit, onClose, onSaved }) => {
  const { createMedal, updateMedal } = useApp();

  // Active Wizard Tab
  const [activeTab, setActiveTab] = useState<'identity' | 'perks' | 'logic' | 'rewards'>('identity');

  // Basic Identity
  const [title, setTitle] = useState(medalToEdit?.title || '');
  const [occasion, setOccasion] = useState(medalToEdit?.occasion || '');
  const [description, setDescription] = useState(medalToEdit?.description || '');
  const [tier, setTier] = useState<MedalTier>(medalToEdit?.tier || 'bronze');
  const [level, setLevel] = useState<number>(medalToEdit?.level || 1);
  const [customBadgeLabel, setCustomBadgeLabel] = useState(medalToEdit?.badgeLabel || '');
  const [isCustom, setIsCustom] = useState<boolean>(medalToEdit?.isCustom || false);

  // Visuals & Images
  const [icon, setIcon] = useState(medalToEdit?.icon || '🏅');
  const [imageUrl, setImageUrl] = useState(medalToEdit?.imageUrl || '');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Special Perks & Privileges
  const [specialPerk, setSpecialPerk] = useState(medalToEdit?.specialPerk || '');
  const [systemBadgeType, setSystemBadgeType] = useState<string>(
    medalToEdit?.reward?.systemBadgeType || 'custom'
  );
  const [unlockAiFeature, setUnlockAiFeature] = useState<boolean>(
    medalToEdit?.reward?.unlockAiFeature || false
  );
  const [priorityReservation, setPriorityReservation] = useState<boolean>(
    medalToEdit?.reward?.priorityReservation || false
  );
  const [allowFreeLoanWithoutFee, setAllowFreeLoanWithoutFee] = useState<boolean>(
    medalToEdit?.reward?.allowFreeLoanWithoutFee || false
  );

  // Advanced Conditions Engine
  const [conditionMode, setConditionMode] = useState<'single' | 'compound'>(
    medalToEdit?.criteria?.type === 'compound_rules' ? 'compound' : 'single'
  );
  const [compoundOperator, setCompoundOperator] = useState<'AND' | 'OR'>(
    medalToEdit?.criteria?.compoundOperator || 'AND'
  );
  const [mainConditionType, setMainConditionType] = useState<MedalConditionType>(
    medalToEdit?.criteria?.type !== 'compound_rules' ? medalToEdit?.criteria?.type || 'books_read' : 'books_read'
  );
  const [mainThreshold, setMainThreshold] = useState<number>(
    medalToEdit?.criteria?.threshold ?? 1
  );
  const [customConditionDesc, setCustomConditionDesc] = useState(
    medalToEdit?.criteria?.description || ''
  );
  const [minRating, setMinRating] = useState<number>(medalToEdit?.criteria?.minRating || 4.8);
  const [minRatingsCount, setMinRatingsCount] = useState<number>(
    medalToEdit?.criteria?.minRatingsCount || 3
  );

  // Multi-rules list for compound mode
  const [secondaryConditions, setSecondaryConditions] = useState<
    Array<{ id: string; type: MedalConditionType; threshold: number; description?: string }>
  >(
    medalToEdit?.criteria?.secondaryConditions || [
      { id: '1', type: 'books_read', threshold: 5, description: 'حداقل ۵ کتاب خوانده‌شده' },
      { id: '2', type: 'books_contributed', threshold: 2, description: 'حداقل ۲ کتاب اهدا شده' }
    ]
  );

  // Rewards Engine
  const [freeLoanQuota, setFreeLoanQuota] = useState<number>(medalToEdit?.reward?.freeLoanQuota ?? 1);
  const [leaguePoints, setLeaguePoints] = useState<number>(medalToEdit?.reward?.leaguePoints ?? 50);
  const [leagueMultiplier, setLeagueMultiplier] = useState<number>(
    medalToEdit?.reward?.leagueMultiplier || 1.0
  );
  const [rewardTitle, setRewardTitle] = useState(medalToEdit?.reward?.title || '');
  const [isActive, setIsActive] = useState<boolean>(medalToEdit?.isActive !== false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Apply Quick Template
  const handleApplyTemplate = (tmpl: typeof PRESET_TEMPLATES[0]) => {
    setTitle(tmpl.title);
    setOccasion(tmpl.occasion);
    setSpecialPerk(tmpl.specialPerk);
    setDescription(tmpl.occasion);
    setTier(tmpl.tier);
    setLevel(tmpl.level);
    setIcon(tmpl.icon);
    setMainConditionType(tmpl.type);
    setMainThreshold(tmpl.threshold);
    setCustomConditionDesc(tmpl.conditionDesc);
    setFreeLoanQuota(tmpl.freeLoans);
    setLeaguePoints(tmpl.points);
    setLeagueMultiplier(tmpl.multiplier);
    setSystemBadgeType(tmpl.systemBadge);
  };

  // Add Secondary Rule
  const handleAddSecondaryRule = () => {
    setSecondaryConditions((prev) => [
      ...prev,
      {
        id: `rule_${Date.now()}`,
        type: 'books_read',
        threshold: 3,
        description: 'شرط تکمیلی'
      }
    ]);
  };

  // Remove Secondary Rule
  const handleRemoveSecondaryRule = (id: string) => {
    setSecondaryConditions((prev) => prev.filter((r) => r.id !== id));
  };

  // Update Secondary Rule
  const handleUpdateSecondaryRule = (id: string, updates: Partial<{ type: MedalConditionType; threshold: number; description: string }>) => {
    setSecondaryConditions((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  // Handle Image Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setFormError(null);

    try {
      const res = await api.uploadImage(file);
      if (res.success && res.fileUrl) {
        setImageUrl(res.fileUrl);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result) {
            setImageUrl(reader.result.toString());
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setImageUrl(reader.result.toString());
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Generate Auto Condition Description
  const generatedConditionDesc = useMemo(() => {
    if (customConditionDesc.trim()) return customConditionDesc;
    if (conditionMode === 'compound') {
      const parts = secondaryConditions.map((c) => {
        const found = CONDITION_TYPES.find((ct) => ct.id === c.type);
        return `${found?.label || c.type} (حداقل ${c.threshold} ${found?.defaultUnit || ''})`;
      });
      return parts.join(compoundOperator === 'AND' ? ' و همزمان ' : ' یا ');
    } else {
      const found = CONDITION_TYPES.find((ct) => ct.id === mainConditionType);
      return `${found?.label || mainConditionType} (حداقل ${mainThreshold} ${found?.defaultUnit || ''})`;
    }
  }, [customConditionDesc, conditionMode, compoundOperator, secondaryConditions, mainConditionType, mainThreshold]);

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('لطفاً عنوان مدال را وارد فرمایید.');
      setActiveTab('identity');
      return;
    }
    if (!specialPerk.trim()) {
      setFormError('لطفاً خاصیت در سامانه را وارد فرمایید.');
      setActiveTab('perks');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const medalData: Partial<SystemMedal> = {
      title: title.trim(),
      occasion: occasion.trim() || title.trim(),
      specialPerk: specialPerk.trim(),
      description: description.trim() || occasion.trim(),
      tier,
      level: Number(level) || 1,
      icon: icon.trim() || '🏅',
      imageUrl: imageUrl.trim(),
      badgeLabel: customBadgeLabel.trim() || undefined,
      isCustom,
      criteria: {
        type: conditionMode === 'compound' ? 'compound_rules' : mainConditionType,
        threshold: conditionMode === 'compound' ? 1 : Number(mainThreshold) || 1,
        description: generatedConditionDesc,
        compoundOperator,
        secondaryConditions: conditionMode === 'compound' ? secondaryConditions : undefined,
        minRating: Number(minRating) || 4.8,
        minRatingsCount: Number(minRatingsCount) || 3
      },
      reward: {
        freeLoanQuota: Number(freeLoanQuota) || 0,
        leaguePoints: Number(leaguePoints) || 0,
        leagueMultiplier: Number(leagueMultiplier) || 1.0,
        systemBadgeType: systemBadgeType as any,
        unlockAiFeature,
        priorityReservation,
        allowFreeLoanWithoutFee,
        title: rewardTitle.trim() || specialPerk.trim()
      },
      isActive
    };

    try {
      if (medalToEdit) {
        const res = await updateMedal(medalToEdit.id, medalData);
        if (res.success) {
          onSaved(`مدال «${title}» با موفقیت به‌روزرسانی شد.`);
        } else {
          setFormError(res.message || 'خطا در ویرایش مدال');
        }
      } else {
        const res = await createMedal(medalData);
        if (res.success) {
          onSaved(`مدال اختصاصی «${title}» با موفقیت طراحی و ایجاد گردید.`);
        } else {
          setFormError(res.message || 'خطا در ایجاد مدال');
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'خطای غیرمنتظره در ذخیره‌سازی');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-6 animate-scaleUp" dir="rtl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white flex items-center justify-center text-2xl shadow-md">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base sm:text-lg">
                {medalToEdit ? `ویرایش و ارتقای مدال: «${medalToEdit.title}»` : 'استودیوی طراحی مدال و لاجیک اختصاصی'}
              </h3>
              <p className="text-xs text-slate-500">
                تعریف شروط چندگانه، تعیین خاصیت‌ها، پاداش‌های آنی و آپلود عکس اختصاصی
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Templates Bar (For New Medals) */}
        {!medalToEdit && (
          <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" /> قالب‌های پیشنهادی سریع:
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {PRESET_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyTemplate(tmpl)}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-50 border border-slate-200 text-xs font-bold text-slate-700 hover:text-amber-900 transition shrink-0 shadow-2xs cursor-pointer flex items-center gap-1"
                >
                  <span>{tmpl.icon}</span>
                  <span>{tmpl.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {formError && (
          <div className="p-3.5 bg-rose-50 text-rose-800 border border-rose-200 rounded-2xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Tabbed Navigation inside Builder */}
        <div className="flex items-center gap-1 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('identity')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'identity'
                ? 'bg-indigo-600 text-white shadow-xs font-black'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>۱. هویت و تصویر</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('perks')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'perks'
                ? 'bg-indigo-600 text-white shadow-xs font-black'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>۲. خاصیت در سامانه</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logic')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'logic'
                ? 'bg-indigo-600 text-white shadow-xs font-black'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>۳. شروط و لاجیک</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rewards')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'rewards'
                ? 'bg-indigo-600 text-white shadow-xs font-black'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>۴. جوایز و پاداش</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ========================================================================= */}
          {/* TAB 1: IDENTITY & VISUALS                                                */}
          {/* ========================================================================= */}
          {activeTab === 'identity' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-black text-slate-800 block">
                    عنوان مدال: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثلاً: جوانه آغاز، نگهبان امانت، چشمه سخاوت..."
                    required
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-black text-slate-800 block">
                    شرح مناسبت / رویداد:
                  </label>
                  <textarea
                    rows={2}
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    placeholder="توضیح کوتاه درباره مناسبت دریافت این مدال افتخار..."
                    className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 text-xs leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-800 block">رده مدال (Tier):</label>
                  <select
                    value={tier}
                    onChange={(e: any) => setTier(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold bg-slate-50 focus:outline-hidden cursor-pointer"
                  >
                    <option value="bronze">🥉 برنزی (سطح ۱)</option>
                    <option value="silver">🥈 نقره‌ای (سطح ۲)</option>
                    <option value="gold">🥇 طلایی (سطح ۳)</option>
                    <option value="diamond">💎 الماسی (سطح ۴)</option>
                    <option value="legendary">👑 اسطوره‌ای (سطح ۵)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-800 block">سطح (Level 1..5):</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={level}
                    onChange={(e) => setLevel(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-center"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-600 block">
                    برچسب دلخواه روی کارت (اختیاری):
                  </label>
                  <input
                    type="text"
                    value={customBadgeLabel}
                    onChange={(e) => setCustomBadgeLabel(e.target.value)}
                    placeholder="مثلاً: اسطوره‌ای • سطح ۵ (ویژه مدیریت) یا ✨ سفارشی"
                    className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              {/* Photo Slot & Image Upload */}
              <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200 space-y-3">
                <label className="text-xs font-black text-slate-800 block flex items-center justify-between">
                  <span>تصویر / عکس اختصاصی مدال:</span>
                  <span className="text-[11px] text-indigo-600 font-normal">امکان آپلود فایل یا لینک مستقیم</span>
                </label>

                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center overflow-hidden shrink-0">
                    {imageUrl ? (
                      <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl">{icon || '🏅'}</span>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition">
                        {isUploadingImage ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        <span>آپلود فایل عکس از دستگاه</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileUpload}
                          disabled={isUploadingImage}
                        />
                      </label>

                      {imageUrl && (
                        <button
                          type="button"
                          onClick={() => setImageUrl('')}
                          className="text-xs text-rose-600 hover:text-rose-800 font-bold px-3 py-2 rounded-xl hover:bg-rose-50"
                        >
                          حذف عکس
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="یا آدرس اینترنتی تصویر (https://...)"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-[11px] text-left ltr"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: SPECIAL PERKS & SYSTEM PRIVILEGES                                  */}
          {/* ========================================================================= */}
          {activeTab === 'perks' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="space-y-1">
                <label className="text-xs font-black text-amber-800 block flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>متن خاصیت در سامانه: <span className="text-rose-500">*</span></span>
                </label>
                <textarea
                  rows={2}
                  value={specialPerk}
                  onChange={(e) => setSpecialPerk(e.target.value)}
                  placeholder="مثلاً: اعطای نشان سپر سبز «امانت‌دار معتمد» در سراسر سامانه و اولویت در تایید درخواست‌ها..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-amber-300 bg-amber-50/50 text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden leading-relaxed"
                />
              </div>

              {/* Quick Privilege Toggles */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-black text-slate-800 block">
                  اختیارات و نشان‌های ویژه سیستمی:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label className="flex items-center gap-2 p-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={systemBadgeType === 'trusted_shield'}
                      onChange={(e) => setSystemBadgeType(e.target.checked ? 'trusted_shield' : 'custom')}
                      className="rounded-md text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>🛡️ نشان سپر سبز «امانت‌دار معتمد»</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={systemBadgeType === 'fast_reader'}
                      onChange={(e) => setSystemBadgeType(e.target.checked ? 'fast_reader' : 'custom')}
                      className="rounded-md text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>⚡ برچسب «کتاب‌خوان پرسرعت»</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={systemBadgeType === 'crown'}
                      onChange={(e) => setSystemBadgeType(e.target.checked ? 'crown' : 'custom')}
                      className="rounded-md text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>👑 نشان متحرک تاج زرین کنار نام</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={systemBadgeType === 'golden_star'}
                      onChange={(e) => setSystemBadgeType(e.target.checked ? 'golden_star' : 'custom')}
                      className="rounded-md text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>⭐ سنجاق شدن به عنوان نقد برتر</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={unlockAiFeature}
                      onChange={(e) => setUnlockAiFeature(e.target.checked)}
                      className="rounded-md text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>🤖 دسترسی ویژه به مشاور هوش مصنوعی</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={priorityReservation}
                      onChange={(e) => setPriorityReservation(e.target.checked)}
                      className="rounded-md text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>🎟️ اولویت در صف رزرو کتب پرتقاضا</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: ADVANCED CONDITIONS & EVALUATION LOGIC ENGINE                      */}
          {/* ========================================================================= */}
          {activeTab === 'logic' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Condition Mode Selector */}
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setConditionMode('single')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                    conditionMode === 'single'
                      ? 'bg-white text-slate-900 shadow-xs font-black'
                      : 'text-slate-600'
                  }`}
                >
                  شرط واحد (ساده و مستقیم)
                </button>
                <button
                  type="button"
                  onClick={() => setConditionMode('compound')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                    conditionMode === 'compound'
                      ? 'bg-indigo-600 text-white shadow-xs font-black'
                      : 'text-slate-600'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>شروط ترکیبی چندگانه (پیشرفته)</span>
                </button>
              </div>

              {/* Single Condition Mode */}
              {conditionMode === 'single' ? (
                <div className="space-y-3 bg-slate-50 p-4 rounded-3xl border border-slate-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-800 block">نوع شرط:</label>
                      <select
                        value={mainConditionType}
                        onChange={(e: any) => setMainConditionType(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white focus:outline-hidden"
                      >
                        {CONDITION_TYPES.map((ct) => (
                          <option key={ct.id} value={ct.id}>
                            {ct.icon} {ct.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-800 block">حد نصاب / مقدار شرط:</label>
                      <input
                        type="number"
                        min={1}
                        value={mainThreshold}
                        onChange={(e) => setMainThreshold(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-center"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Compound Multi-Condition Builder */
                <div className="space-y-3 bg-indigo-50/50 p-4 rounded-3xl border border-indigo-200">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-indigo-900 flex items-center gap-1">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <span>قوانین و شروط چندگانه:</span>
                    </label>

                    <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-indigo-200 text-xs font-bold">
                      <span>عملگر ارتباطی:</span>
                      <button
                        type="button"
                        onClick={() => setCompoundOperator('AND')}
                        className={`px-2 py-0.5 rounded-lg text-xs ${
                          compoundOperator === 'AND'
                            ? 'bg-indigo-600 text-white font-black'
                            : 'text-slate-600'
                        }`}
                      >
                        و همزمان (AND)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCompoundOperator('OR')}
                        className={`px-2 py-0.5 rounded-lg text-xs ${
                          compoundOperator === 'OR'
                            ? 'bg-indigo-600 text-white font-black'
                            : 'text-slate-600'
                        }`}
                      >
                        یا (OR)
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {secondaryConditions.map((cond, idx) => (
                      <div
                        key={cond.id}
                        className="bg-white p-3 rounded-2xl border border-indigo-100 flex items-center gap-2"
                      >
                        <span className="text-xs font-black text-indigo-700 w-6">#{idx + 1}</span>

                        <select
                          value={cond.type}
                          onChange={(e: any) =>
                            handleUpdateSecondaryRule(cond.id, { type: e.target.value })
                          }
                          className="flex-1 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold"
                        >
                          {CONDITION_TYPES.map((ct) => (
                            <option key={ct.id} value={ct.id}>
                              {ct.icon} {ct.label}
                            </option>
                          ))}
                        </select>

                        <input
                          type="number"
                          min={1}
                          value={cond.threshold}
                          onChange={(e) =>
                            handleUpdateSecondaryRule(cond.id, {
                              threshold: Number(e.target.value)
                            })
                          }
                          placeholder="تعداد"
                          className="w-20 px-2 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-center"
                        />

                        {secondaryConditions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSecondaryRule(cond.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleAddSecondaryRule}
                      className="w-full py-2 rounded-xl bg-white hover:bg-indigo-100 border border-dashed border-indigo-300 text-xs font-bold text-indigo-700 flex items-center justify-center gap-1 cursor-pointer transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>افزودن شرط تکمیلی دیگر</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Editable Condition Description */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-800 block">
                  متن نمایشی شرط خودکار در کارت:
                </label>
                <input
                  type="text"
                  value={customConditionDesc}
                  onChange={(e) => setCustomConditionDesc(e.target.value)}
                  placeholder={generatedConditionDesc}
                  className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: REWARDS & LEAGUE INCENTIVES                                       */}
          {/* ========================================================================= */}
          {activeTab === 'rewards' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 space-y-1">
                  <label className="text-xs font-black text-emerald-900 block">
                    🎁 سهمیه امانت رایگان:
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={freeLoanQuota}
                    onChange={(e) => setFreeLoanQuota(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-emerald-300 text-sm font-black text-center bg-white"
                  />
                  <span className="text-[10px] text-emerald-700 block text-center">
                    اعطای آنی به حساب دانش‌آموز
                  </span>
                </div>

                <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 space-y-1">
                  <label className="text-xs font-black text-amber-900 block">
                    ⭐ امتیاز مستقیم در لیگ:
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={10}
                    value={leaguePoints}
                    onChange={(e) => setLeaguePoints(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 text-sm font-black text-center bg-white"
                  />
                  <span className="text-[10px] text-amber-700 block text-center">
                    افزایش رتبه در جدول مسابقات
                  </span>
                </div>

                <div className="bg-indigo-50 p-3.5 rounded-2xl border border-indigo-200 space-y-1">
                  <label className="text-xs font-black text-indigo-900 block">
                    ⚡ ضریب امتیازی لیگ:
                  </label>
                  <select
                    value={leagueMultiplier}
                    onChange={(e) => setLeagueMultiplier(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-indigo-300 text-xs font-black text-center bg-white"
                  >
                    <option value={1.0}>۱.۰ (بدون ضریب)</option>
                    <option value={1.25}>۱.۲۵ برابر امتیازات</option>
                    <option value={1.5}>۱.۵ برابر امتیازات</option>
                    <option value={2.0}>۲.۰ برابر (دوبرابر)</option>
                  </select>
                  <span className="text-[10px] text-indigo-700 block text-center">
                    اعمال روی کلیه فعالیت‌های آینده
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-800 block">
                  عنوان خلاصه پاداش:
                </label>
                <input
                  type="text"
                  value={rewardTitle}
                  onChange={(e) => setRewardTitle(e.target.value)}
                  placeholder="مثلاً: ۳ سهمیه امانت رایگان + ضریب ۱.۲۵ برابری در لیگ..."
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold"
                />
              </div>
            </div>
          )}

          {/* Modal Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              انصراف
            </button>

            <div className="flex items-center gap-2">
              {activeTab !== 'identity' && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === 'perks') setActiveTab('identity');
                    if (activeTab === 'logic') setActiveTab('perks');
                    if (activeTab === 'rewards') setActiveTab('logic');
                  }}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold text-indigo-600 hover:bg-indigo-50 border border-indigo-100 cursor-pointer"
                >
                  مرحله قبل
                </button>
              )}

              {activeTab !== 'rewards' ? (
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === 'identity') setActiveTab('perks');
                    if (activeTab === 'perks') setActiveTab('logic');
                    if (activeTab === 'logic') setActiveTab('rewards');
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 py-2.5 rounded-2xl text-xs shadow-md transition cursor-pointer"
                >
                  مرحله بعد →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-7 py-2.5 rounded-2xl text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>در حال ثبت مدال...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{medalToEdit ? 'ذخیره تغییرات مدال' : 'ایجاد نهایی مدال'}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

