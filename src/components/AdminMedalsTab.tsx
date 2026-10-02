import React, { useState, useEffect, useMemo } from 'react';
import { User, LendingRequest, Book, BookReview } from '../types';
import {
  OFFICIAL_MEDALS,
  MedalDefinition,
  getTierBadgeStyle,
  medalDefinitionToUserMedal,
  CustomMedalData,
  createDefinitionFromCustomMedal,
  computeStudentLeagueRank
} from '../data/medalsData';
import { Badge3D } from './Badge3D';
import { BadgeDetailModal } from './BadgeDetailModal';
import { CreateCustomMedalModal } from './CreateCustomMedalModal';
import {
  Award,
  Sparkles,
  Zap,
  Plus,
  Users,
  Search,
  Filter,
  CheckCircle2,
  Trash2,
  AlertCircle,
  X,
  MessageSquare,
  Shield,
  Layers,
  ChevronLeft,
  Settings2
} from 'lucide-react';

interface AdminMedalsTabProps {
  users: User[];
  requests: LendingRequest[];
  books: Book[];
  onRefreshData?: () => void;
  onUpdateUser?: (updatedUser: User) => void;
}

export const AdminMedalsTab: React.FC<AdminMedalsTabProps> = ({
  users,
  requests,
  books,
  onRefreshData,
  onUpdateUser
}) => {
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inspectBadge, setInspectBadge] = useState<MedalDefinition | null>(null);

  // Custom Medals State
  const [customMedals, setCustomMedals] = useState<CustomMedalData[]>([]);
  const [showCreateCustomModal, setShowCreateCustomModal] = useState<boolean>(false);

  // Fetch custom medals on mount
  useEffect(() => {
    fetch('/api/medals/custom')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.medals)) {
          setCustomMedals(data.medals);
        }
      })
      .catch((err) => console.error('Error fetching custom medals:', err));
  }, []);

  // All Medals (10 Official + Dynamic Custom Medals)
  const allMedals = useMemo<MedalDefinition[]>(() => {
    const customDefs = customMedals.map(createDefinitionFromCustomMedal);
    return [...OFFICIAL_MEDALS, ...customDefs];
  }, [customMedals]);

  // Modal: View Holders of a specific medal
  const [viewHoldersBadge, setViewHoldersBadge] = useState<MedalDefinition | null>(null);

  // Modal: Manual Award Medal
  const [showAwardModal, setShowAwardModal] = useState<boolean>(false);
  const [targetStudentId, setTargetStudentId] = useState<string>('');
  const [targetBadgeId, setTargetBadgeId] = useState<string>(OFFICIAL_MEDALS[0].id);
  const [adminNote, setAdminNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string>('');
  const [autoEvaluateLog, setAutoEvaluateLog] = useState<{ totalEvaluated: number; newlyAwarded: number } | null>(null);

  // Compute stats
  const stats = useMemo(() => {
    let totalAwardedCount = 0;
    const medalHoldersMap: Record<string, User[]> = {};

    allMedals.forEach((m) => {
      medalHoldersMap[m.id] = [];
    });

    users.forEach((u) => {
      if (Array.isArray(u.medals)) {
        u.medals.forEach((m) => {
          totalAwardedCount++;
          if (medalHoldersMap[m.id]) {
            medalHoldersMap[m.id].push(u);
          }
        });
      }
    });

    // Student with highest medals
    let topStudent: { user: User; count: number } | null = null;
    users.forEach((u) => {
      const count = (u.medals || []).length;
      if (!topStudent || count > topStudent.count) {
        if (count > 0) {
          topStudent = { user: u, count };
        }
      }
    });

    return {
      totalAwardedCount,
      medalHoldersMap,
      topStudent
    };
  }, [users, allMedals]);

  // Filter medals
  const filteredMedals = useMemo(() => {
    return allMedals.filter((m) => {
      const matchTier =
        selectedTier === 'all'
          ? true
          : selectedTier === 'custom'
          ? m.isCustom
          : m.tier === selectedTier;
      const matchSearch =
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.property.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.occasion.toLowerCase().includes(searchQuery.toLowerCase());
      return matchTier && matchSearch;
    });
  }, [allMedals, selectedTier, searchQuery]);

  // Handle Delete Custom Medal
  const handleDeleteCustomMedal = async (medalId: string, medalTitle: string) => {
    if (
      !window.confirm(
        `آیا از حذف مدال سفارشی «${medalTitle}» مطمئن هستید؟ این عمل نشان را از لیست سامانه حذف می‌کند.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/medals/custom/${medalId}`, { method: 'DELETE' });
      if (res.ok) {
        setCustomMedals((prev) => prev.filter((m) => m.id !== medalId));
        setActionSuccessMsg(`مدال سفارشی «${medalTitle}» با موفقیت حذف شد.`);
      } else {
        alert('خطا در حذف مدال.');
      }
    } catch (err) {
      console.error(err);
      alert('خطا در برقراری ارتباط با سرور.');
    }
  };

  // Handle Manual Awarding
  const handleAwardMedalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStudentId || !targetBadgeId) return;

    const student = users.find((u) => u.id === targetStudentId);
    const badgeDef = allMedals.find((m) => m.id === targetBadgeId);
    if (!student || !badgeDef) return;

    // Check if student already holds this badge
    const existing = (student.medals || []).some((m) => m.id === badgeDef.id);
    if (existing) {
      alert(`دانش‌آموز «${student.name}» قبلاً نشان «${badgeDef.title}» را دریافت کرده است.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const newMedal = medalDefinitionToUserMedal(badgeDef, {
        awardedBy: 'admin',
        adminNote: adminNote.trim() || undefined
      });

      const updatedMedals = [...(student.medals || []), newMedal];

      const res = await fetch(`/api/users/${student.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medals: updatedMedals })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user && onUpdateUser) {
          onUpdateUser(data.user);
        }
        setActionSuccessMsg(`نشان «${badgeDef.title}» با موفقیت به «${student.name}» اعطا شد!`);
        setShowAwardModal(false);
        setAdminNote('');
        if (onRefreshData) onRefreshData();
      } else {
        alert('خطا در اعطای نشان. لطفاً دوباره تلاش کنید.');
      }
    } catch (err) {
      console.error(err);
      alert('خطای ارتباط با سرور.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Revoking a Medal
  const handleRevokeMedal = async (studentId: string, badgeId: string) => {
    const student = users.find((u) => u.id === studentId);
    const badge = allMedals.find((m) => m.id === badgeId);
    if (!student || !badge) return;

    if (
      !window.confirm(
        `آیا از حذف نشان «${badge.title}» از کارنامه دانش‌آموز «${student.name}» مطمئن هستید؟`
      )
    ) {
      return;
    }

    try {
      const updatedMedals = (student.medals || []).filter((m) => m.id !== badgeId);
      const res = await fetch(`/api/users/${student.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medals: updatedMedals })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user && onUpdateUser) {
          onUpdateUser(data.user);
        }
        setActionSuccessMsg(`نشان «${badge.title}» با موفقیت از «${student.name}» حذف شد.`);
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      console.error(err);
      alert('خطا در لغو نشان.');
    }
  };

  // Run Automated Evaluation on ALL students with REAL context
  const handleAutoEvaluateAll = async () => {
    if (
      !window.confirm(
        'آیا مایلید تمام دانش‌آموزان مدرسه را اسکن کرده و بر اساس عملکرد (کتاب‌های خوانده‌شده، اهدایی‌ها، خوش‌قولی، نقدها، تنوع ژانرها و رتبه لیگ) نشان‌های جدید استحقاقی را خودکار اعطا کنید؟'
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    let newlyAwardedCount = 0;
    let evaluatedStudentsCount = 0;

    try {
      // Evaluate each student
      for (const student of users) {
        if (student.role === 'admin') continue;
        evaluatedStudentsCount++;

        const studentBorrowed = requests.filter((r) => r.borrowerId === student.id);
        const studentOwned = books.filter((b) => b.ownerId === student.id);
        const studentReviews = books
          .flatMap((b) => b.reviews || [])
          .filter((rev) => rev.userId === student.id);
        const leagueRank = computeStudentLeagueRank(student.id, users);

        const existingMedalIds = new Set((student.medals || []).map((m) => m.id));
        const newlyEarned: MedalDefinition[] = [];

        allMedals.forEach((badgeDef) => {
          if (!existingMedalIds.has(badgeDef.id)) {
            const isEligible = badgeDef.checkEligibility({
              user: student,
              borrowedRequests: studentBorrowed,
              ownedBooks: studentOwned,
              userReviews: studentReviews,
              leagueRank,
              allBooks: books
            });
            if (isEligible) {
              newlyEarned.push(badgeDef);
            }
          }
        });

        if (newlyEarned.length > 0) {
          const newMedalObjects = newlyEarned.map((def) =>
            medalDefinitionToUserMedal(def, { awardedBy: 'auto' })
          );
          const updatedMedals = [...(student.medals || []), ...newMedalObjects];

          await fetch(`/api/users/${student.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ medals: updatedMedals })
          });

          newlyAwardedCount += newlyEarned.length;
        }
      }

      setAutoEvaluateLog({
        totalEvaluated: evaluatedStudentsCount,
        newlyAwarded: newlyAwardedCount
      });

      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error('Auto evaluate error:', err);
      alert('خطایی در حین ارزیابی رخ داد.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-800">
      {/* Toast Notification */}
      {actionSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center justify-between shadow-xs animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button
            onClick={() => setActionSuccessMsg('')}
            className="text-emerald-500 hover:text-emerald-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Auto-Evaluation Result Banner */}
      {autoEvaluateLog && (
        <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 p-4 rounded-2xl flex items-center justify-between shadow-xs animate-in zoom-in-95">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
              <Zap className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h4 className="font-black text-sm">ارزیابی هوشمند با موفقیت به پایان رسید</h4>
              <p className="text-xs text-indigo-700 mt-0.5">
                تعداد {autoEvaluateLog.totalEvaluated} دانش‌آموز بررسی شدند و مجموعاً{' '}
                <strong className="text-indigo-950 font-bold">{autoEvaluateLog.newlyAwarded} نشان جدید</strong> استحقاقی به کارنامه آنها اضافه شد.
              </p>
            </div>
          </div>
          <button
            onClick={() => setAutoEvaluateLog(null)}
            className="text-indigo-400 hover:text-indigo-700 text-xs font-bold"
          >
            بستن
          </button>
        </div>
      )}

      {/* Page Title & Intro */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-black">
              <Award className="w-3.5 h-3.5" />
              <span>سیستم نشان‌ها و دستاوردهای ۳بعدی</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              مدیریت و پایش نشان‌های افتخار مکتب‌خونه
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              نشان‌های اختصاصی با طراحی مدرن سه‌بعدی و سطح‌بندی ۵ گانه (برنزی تا اسطوره‌ای). این نشان‌ها بر اساس رفتار امانت، خوش‌قولی، اهدای کتاب و استمرار اعطا می‌شوند و ویژگی‌های کاربردی خاصی در سامانه فعال می‌کنند.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowCreateCustomModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs shadow-md shadow-purple-500/25 transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
              <span>✨ ساخت نشان جدید (شخصی‌سازی پیشرفته)</span>
            </button>

            <button
              onClick={handleAutoEvaluateAll}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs shadow-md shadow-amber-500/25 transition-all disabled:opacity-50"
            >
              <Zap className="w-4 h-4 text-slate-950 fill-current" />
              <span>{isSubmitting ? 'در حال ارزیابی...' : 'ارزیابی خودکار کل مدرسه'}</span>
            </button>

            <button
              onClick={() => setShowAwardModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 backdrop-blur-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>اعطای دستی به دانش‌آموز</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 block">تعداد عناوین نشان‌ها:</span>
          <span className="text-2xl font-black text-slate-900 font-mono">{allMedals.length}</span>
          <span className="text-[10px] text-slate-500 block">
            ۱۰ رسمی {customMedals.length > 0 ? `+ ${customMedals.length} سفارشی مدیر` : ''}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 block">کل نشان‌های اعطاشده:</span>
          <span className="text-2xl font-black text-indigo-600 font-mono">
            {stats.totalAwardedCount}
          </span>
          <span className="text-[10px] text-slate-500 block">در کارنامه دانش‌آموزان</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 block">دانش‌آموزان دارای نشان:</span>
          <span className="text-2xl font-black text-emerald-600 font-mono">
            {users.filter((u) => (u.medals || []).length > 0).length}
          </span>
          <span className="text-[10px] text-slate-500 block">
            از مجموع {users.length} دانش‌آموز
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 block">پیشتاز مدال‌ها:</span>
          <span className="text-sm font-black text-amber-600 truncate block">
            {stats.topStudent ? stats.topStudent.user.name : '—'}
          </span>
          <span className="text-[10px] text-slate-500 block">
            {stats.topStudent ? `${stats.topStudent.count} نشان فعال` : 'هنوز اعطا نشده'}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Tier Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'همه سطوح' },
            { id: 'custom', label: `سفارشی مدیر (${customMedals.length})` },
            { id: 'bronze', label: 'برنزی (سطح ۱)' },
            { id: 'silver', label: 'نقره‌ای (سطح ۲)' },
            { id: 'gold', label: 'طلایی (سطح ۳)' },
            { id: 'diamond', label: 'الماسی (سطح ۴)' },
            { id: 'mythic', label: 'اسطوره‌ای (سطح ۵)' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTier(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedTier === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            placeholder="جستجوی نام یا خاصیت نشان..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* 3D Medals Showcase Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMedals.map((badgeDef) => {
          const holders = stats.medalHoldersMap[badgeDef.id] || [];
          const tierStyle = getTierBadgeStyle(badgeDef.tier);

          return (
            <div
              key={badgeDef.id}
              className={`bg-white rounded-3xl border shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col ${
                badgeDef.isCustom ? 'border-purple-200 ring-2 ring-purple-100' : 'border-slate-200'
              }`}
            >
              {/* Card Header with 3D Thumbnail & Tier */}
              <div className="p-5 flex items-start gap-4">
                <div
                  onClick={() => setInspectBadge(badgeDef)}
                  className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 cursor-pointer shadow-md ring-2 ring-slate-100 hover:scale-105 transition-transform"
                >
                  <img
                    src={badgeDef.imageUrl}
                    alt={badgeDef.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase shadow-xs ${tierStyle.pillClass}`}
                    >
                      {badgeDef.tierTitle}
                    </span>
                    <div className="flex items-center gap-1">
                      {badgeDef.isCustom && (
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                          ✨ سفارشی
                        </span>
                      )}
                      <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg">
                        {holders.length} دارنده
                      </span>
                    </div>
                  </div>

                  <h3
                    onClick={() => setInspectBadge(badgeDef)}
                    className="font-black text-slate-900 text-base hover:text-indigo-600 cursor-pointer transition-colors"
                  >
                    {badgeDef.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {badgeDef.description}
                  </p>
                </div>
              </div>

              {/* Special Perk Box */}
              <div className="px-5 py-3 bg-slate-50/80 border-t border-b border-slate-100 space-y-1">
                <div className="flex items-center gap-1.5 text-amber-900 font-bold text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>خاصیت در سامانه:</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {badgeDef.property}
                </p>
              </div>

              {/* Criteria Summary */}
              <div className="px-5 py-2.5 text-[11px] text-slate-500">
                <span className="font-bold text-slate-700">شرط خودکار: </span>
                <span>{badgeDef.criteriaDesc}</span>
              </div>

              {/* Card Actions Footer */}
              <div className="p-4 mt-auto bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setViewHoldersBadge(badgeDef)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all shadow-2xs"
                >
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  <span>دارندگان ({holders.length})</span>
                </button>

                <div className="flex items-center gap-1.5">
                  {badgeDef.isCustom && (
                    <button
                      onClick={() => handleDeleteCustomMedal(badgeDef.id, badgeDef.title)}
                      title="حذف این مدال سفارشی"
                      className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setTargetBadgeId(badgeDef.id);
                      setShowAwardModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>اعطا به دانش‌آموز</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: View Holders of a Specific Medal */}
      {viewHoldersBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <img
                  src={viewHoldersBadge.imageUrl}
                  alt={viewHoldersBadge.title}
                  className="w-12 h-12 rounded-xl object-cover shadow-sm ring-1 ring-slate-200"
                />
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    دارندگان نشان «{viewHoldersBadge.title}»
                  </h3>
                  <span className="text-xs text-slate-500">
                    مجموعاً {stats.medalHoldersMap[viewHoldersBadge.id]?.length || 0} دانش‌آموز
                  </span>
                </div>
              </div>
              <button
                onClick={() => setViewHoldersBadge(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-2 overflow-y-auto flex-1">
              {(stats.medalHoldersMap[viewHoldersBadge.id] || []).length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  هنوز هیچ دانش‌آموزی این نشان را کسب نکرده است.
                </div>
              ) : (
                stats.medalHoldersMap[viewHoldersBadge.id].map((student) => {
                  const studentMedal = (student.medals || []).find((m) => m.id === viewHoldersBadge.id);
                  return (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={student.avatar || '/assets/avatar.png'}
                          alt={student.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <span className="font-bold text-xs text-slate-900 block">
                            {student.name}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            کلاس: {student.className || 'نامشخص'} • خوانده: {student.booksReadCount || 0}
                          </span>
                          {studentMedal?.adminNote && (
                            <span className="text-[9px] text-amber-700 block italic mt-0.5">
                              یادداشت: {studentMedal.adminNote}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {studentMedal?.awardedAt && (
                          <span className="text-[10px] font-mono text-slate-400">
                            {new Date(studentMedal.awardedAt).toLocaleDateString('fa-IR')}
                          </span>
                        )}
                        <button
                          onClick={() => handleRevokeMedal(student.id, viewHoldersBadge.id)}
                          title="حذف نشان از دانش‌آموز"
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-100 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setViewHoldersBadge(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Manual Award to Student */}
      {showAwardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                <h3 className="font-black text-slate-900 text-base">
                  اعطای دستی نشان به دانش‌آموز
                </h3>
              </div>
              <button
                onClick={() => setShowAwardModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAwardMedalSubmit} className="py-4 space-y-4 text-xs">
              {/* Select Student */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  انتخاب دانش‌آموز:
                </label>
                <select
                  value={targetStudentId}
                  onChange={(e) => setTargetStudentId(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500/30"
                >
                  <option value="">-- لطفاً یک دانش‌آموز را انتخاب کنید --</option>
                  {users
                    .filter((u) => u.role !== 'admin' && u.status === 'approved')
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.className || 'بدون کلاس'}) - دارای {(s.medals || []).length} نشان
                      </option>
                    ))}
                </select>
              </div>

              {/* Select Badge */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  نشان افتخار مورد نظر:
                </label>
                <select
                  value={targetBadgeId}
                  onChange={(e) => setTargetBadgeId(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500/30"
                >
                  {OFFICIAL_MEDALS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.icon} {m.title} ({m.tierTitle})
                    </option>
                  ))}
                </select>
              </div>

              {/* Badge Preview */}
              {(() => {
                const previewDef = OFFICIAL_MEDALS.find((m) => m.id === targetBadgeId);
                if (!previewDef) return null;
                return (
                  <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center gap-3">
                    <img
                      src={previewDef.imageUrl}
                      alt={previewDef.title}
                      className="w-12 h-12 rounded-xl object-cover shadow-sm ring-1 ring-indigo-200"
                    />
                    <div>
                      <span className="font-black text-indigo-950 block">
                        {previewDef.title} ({previewDef.tierTitle})
                      </span>
                      <span className="text-[11px] text-indigo-700">
                        {previewDef.property}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Admin Note */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  متن یادداشت و انگیزه تقدیر مدیر (اختیاری):
                </label>
                <textarea
                  rows={2}
                  placeholder="مثال: تقدیر از دانش‌آموز بابت نظم در تحویل و راه‌اندازی نمایشگاه کتاب کلاس..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAwardModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !targetStudentId}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-md shadow-indigo-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'در حال ثبت...' : 'اعطای رسمی نشان ✨'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Modal */}
      {inspectBadge && (
        <BadgeDetailModal
          definition={inspectBadge}
          isUnlocked={true}
          onClose={() => setInspectBadge(null)}
        />
      )}

      {/* Modal: Create Custom Medal */}
      {showCreateCustomModal && (
        <CreateCustomMedalModal
          onClose={() => setShowCreateCustomModal(false)}
          availableClasses={Array.from(new Set(users.map((u) => u.className).filter(Boolean))) as string[]}
          onSuccess={(newMedal) => {
            setCustomMedals((prev) => [...prev, newMedal]);
            setActionSuccessMsg(`نشان جدید «${newMedal.title}» با موفقیت ایجاد و فعال شد!`);
          }}
        />
      )}
    </div>
  );
};
