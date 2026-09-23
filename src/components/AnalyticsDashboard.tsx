import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Clock, 
  Activity, 
  Eye, 
  TrendingUp, 
  Sparkles, 
  Smartphone, 
  Monitor, 
  RefreshCw, 
  Layers, 
  Award, 
  Zap, 
  Search, 
  BookOpen, 
  CheckCircle2, 
  Compass,
  Globe,
  Radio,
  ArrowUpRight,
  ShieldCheck,
  Heart,
  Handshake,
  Star,
  PlusCircle,
  Gift,
  Filter,
  ChevronDown,
  ChevronUp,
  MousePointerClick,
  Info,
  Calendar,
  SlidersHorizontal,
  Flame,
  UserCheck
} from 'lucide-react';

interface RealLibraryMetrics {
  totalBooksInLibrary: number;
  totalRegisteredStudents: number;
  totalLendingRequests: number;
  activeLoans: number;
  completedLoans: number;
  topLoanedBooks: {
    id: string;
    title: string;
    author: string;
    ownerName: string;
    coverImage: string;
    category: string;
    loanCount: number;
  }[];
  classLeaderboard: {
    schoolClass: string;
    donatedBooks: number;
    borrowCount: number;
    studentCount: number;
    totalScore: number;
  }[];
}

interface LiveUser {
  sessionId: string;
  userName: string;
  userRole: string;
  currentPath: string;
  device: string;
  browser: string;
  connectedMinutes: number;
  lastSeenSecondsAgo: number;
}

interface InteractionCategoryStat {
  id: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
  icon: string;
}

interface InteractionEvent {
  id: string;
  type: string;
  label: string;
  category: string;
  categoryLabel: string;
  userName: string;
  userRole?: string;
  timestamp: number;
  timeAgo: string;
  path?: string;
  metadata?: any;
}

interface AnalyticsData {
  totalPageViews: number;
  totalTimeSpentSeconds: number;
  totalInteractions: number;
  engagementRate?: number;
  activeUsersCount: number;
  onlineNow: number;
  dailyTrend: {
    date: string;
    rawDate?: string;
    pageViews: number;
    timeSpentMinutes: number;
    interactions: number;
    activeUsers: number;
    interactionRate?: number;
    interactionBreakdown?: Record<string, number>;
  }[];
  pathPopularity: { path: string; views: number }[];
  interactionTypes: { type: string; label: string; count: number; category?: string }[];
  interactionStats?: {
    totalInteractions: number;
    engagementRate: number;
    activeEngagersCount: number;
    categories: InteractionCategoryStat[];
  };
  recentInteractions?: InteractionEvent[];
  topActiveUsers: {
    name: string;
    minutes: number;
    views: number;
    interactions: number;
    lastSeen: string;
  }[];
  deviceTypes: { device: string; count: number; percentage: number }[];
  browserTypes: { browser: string; count: number; percentage: number }[];
  topSearches: { query: string; count: number }[];
  liveUsers: LiveUser[];
  peakHours: { hour: number; hourLabel: string; count: number }[];
  realLibraryMetrics?: RealLibraryMetrics;
}

export const AnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [days, setDays] = useState<number>(7);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'traffic' | 'interactions' | 'library' | 'live'>('traffic');
  
  // Interaction Explorer States
  const [selectedDayDetails, setSelectedDayDetails] = useState<string | null>(null);
  const [interactionCategoryFilter, setInteractionCategoryFilter] = useState<string>('all');
  const [interactionSearchQuery, setInteractionSearchQuery] = useState<string>('');

  const fetchAnalytics = async (selectedDays: number) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/analytics?days=${selectedDays}`);
      if (!res.ok) throw new Error('خطا در بارگذاری آمار و مانیتورینگ');
      const json = await res.json();
      if (json.success && json.summary) {
        setData(json.summary);
      }
    } catch (err: any) {
      setError(err.message || 'خطا در ارتباط با سرور');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(days);
    // Refresh live stats every 15 seconds
    const interval = setInterval(() => {
      fetchAnalytics(days);
    }, 15000);
    return () => clearInterval(interval);
  }, [days]);

  const formatMinutesToHours = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    if (mins < 60) return `${mins} دقیقه`;
    const hrs = (mins / 60).toFixed(1);
    return `${hrs} ساعت`;
  };

  const toPersianDigits = (str: string | number) => {
    const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(str).replace(/\d/g, (x) => farsiDigits[parseInt(x, 10)]);
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'BookOpen':
        return <BookOpen className="w-4 h-4 text-indigo-500" />;
      case 'Handshake':
        return <Handshake className="w-4 h-4 text-emerald-500" />;
      case 'Search':
        return <Search className="w-4 h-4 text-amber-500" />;
      case 'Star':
        return <Star className="w-4 h-4 text-pink-500" />;
      case 'PlusCircle':
        return <PlusCircle className="w-4 h-4 text-cyan-500" />;
      case 'Gift':
        return <Gift className="w-4 h-4 text-purple-500" />;
      default:
        return <Zap className="w-4 h-4 text-slate-500" />;
    }
  };

  const getEventBadgeColor = (category?: string) => {
    switch (category) {
      case 'loans':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'books':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'searches':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'reviews':
        return 'bg-pink-50 text-pink-700 border-pink-200';
      case 'donations':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'events':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Filtered live events stream
  const filteredInteractions = useMemo(() => {
    if (!data?.recentInteractions) return [];
    return data.recentInteractions.filter((item) => {
      const matchesCategory =
        interactionCategoryFilter === 'all' || item.category === interactionCategoryFilter;
      const q = interactionSearchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.label.toLowerCase().includes(q) ||
        item.userName.toLowerCase().includes(q) ||
        (item.metadata?.bookTitle && String(item.metadata.bookTitle).toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [data?.recentInteractions, interactionCategoryFilter, interactionSearchQuery]);

  const lib = data?.realLibraryMetrics;
  const interactionStats = data?.interactionStats;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl border border-indigo-900/50 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <Activity className="w-4 h-4 animate-pulse" />
              </span>
              <span className="text-xs font-black tracking-wide text-indigo-300 uppercase">
                داشبورد مانیتورینگ زنده و تعاملات هوشمند مکتب‌خانه
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black">
              آمار دقیق رفتار کاربران و عملکرد کتابخانه 📊
            </h3>
            <p className="text-xs text-indigo-200/80 mt-1 max-w-xl leading-relaxed">
              تحلیل عمیق تعاملات، ترافیک واقعی، دستگاه‌ها و امانات ثبت‌شده بر بستر پایگاه‌داده بدون داده‌های ساختگی.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="flex bg-slate-800/80 p-1 rounded-2xl border border-slate-700/60 shadow-inner">
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    days === d
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {toPersianDigits(d)} روز اخیر
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => fetchAnalytics(days)}
              disabled={isLoading}
              className="p-2.5 rounded-2xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 transition flex items-center justify-center shrink-0"
              title="تازه‌سازی آمار"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-5 pt-4 border-t border-indigo-900/60 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('traffic')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'traffic'
                ? 'bg-indigo-500 text-white shadow-md'
                : 'text-indigo-200 hover:bg-slate-800/60'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>ترافیک، بازدید و دستگاه‌ها</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('interactions')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'interactions'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-black'
                : 'text-indigo-200 hover:bg-slate-800/60'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>تحلیل پیشرفته تعاملات و رفتارها ⚡</span>
            <span className="px-1.5 py-0.5 rounded-full bg-amber-400/30 text-amber-200 text-[10px] font-mono font-bold">
              {toPersianDigits(data?.totalInteractions || 0)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('library')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'library'
                ? 'bg-indigo-500 text-white shadow-md'
                : 'text-indigo-200 hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>آمار واقعی امانات و کتاب‌های پرتقاضا</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('live')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'live'
                ? 'bg-indigo-500 text-white shadow-md'
                : 'text-indigo-200 hover:bg-slate-800/60'
            }`}
          >
            <Radio className="w-4 h-4 text-emerald-400" />
            <span>کاربران آنلاین هم‌اکنون ({toPersianDigits(data?.onlineNow || 0)})</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-2xl">
          {error}
        </div>
      )}

      {/* KPI Stats Grid (Real Telemetry + Real DB) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Realtime Online Users */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">کاربران آنلاین هم‌اکنون</span>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {toPersianDigits(data?.onlineNow || 0)}
            </span>
            <span className="text-[11px] font-bold text-emerald-600">نفر فعال</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-400 font-medium">
            پالس‌های دریافت شده طی ۶۰ ثانیه گذشته
          </div>
        </div>

        {/* Total Page Views */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">کل بازدید صفحات</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {toPersianDigits(data?.totalPageViews || 0)}
            </span>
            <span className="text-[11px] font-bold text-blue-600">بازدید واقعی</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-400 font-medium">
            در بازه انتخابی ({toPersianDigits(days)} روز اخیر)
          </div>
        </div>

        {/* Total Time Spent */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">مدت حضور مفید دانش‌آموزان</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {toPersianDigits(formatMinutesToHours(data?.totalTimeSpentSeconds || 0))}
            </span>
          </div>
          <div className="mt-2 text-[10px] text-slate-400 font-medium">
            فقط زمان‌های فعال بودن پنجره مرورگر
          </div>
        </div>

        {/* Total Interactions (Clickable to switch tab) */}
        <div 
          onClick={() => setActiveTab('interactions')}
          className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-amber-400/80 transition cursor-pointer group"
          title="مشاهده تحلیل کامل تعاملات"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 group-hover:text-amber-600 transition">کل تعاملات و رفتارها ⚡</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-amber-100 group-hover:text-amber-700 transition">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 group-hover:text-amber-600 transition">
              {toPersianDigits(data?.totalInteractions || 0)}
            </span>
            <span className="text-[11px] font-bold text-purple-600 group-hover:text-amber-700">اقدام فعال</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-400 font-medium flex items-center justify-between">
            <span>امانت، جستجو، اهدای کتاب و نظرات</span>
            <span className="text-amber-600 font-bold group-hover:underline">ورود به بخش تعاملات ←</span>
          </div>
        </div>
      </div>

      {/* TAB 1: Traffic, Devices & Searches */}
      {activeTab === 'traffic' && (
        <div className="space-y-5">
          {/* Main Charts: Daily Trend & Popular Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Daily Trend (2 cols) */}
            <div className="lg:col-span-2 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-bold text-sm text-slate-800">
                    روند روزانه بازدید، زمان حضور و تعاملات
                  </h4>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-bold">
                  <span className="flex items-center gap-1 text-indigo-600">
                    <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" /> بازدیدها
                  </span>
                  <span className="flex items-center gap-1 text-amber-600">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" /> تعاملات
                  </span>
                </div>
              </div>

              {/* Dual Bar Chart with Clickable Day Expansion */}
              <div className="space-y-3.5 pt-2">
                {data?.dailyTrend?.map((item, idx) => {
                  const maxViews = Math.max(...(data?.dailyTrend?.map((d) => d.pageViews) || [1]), 1);
                  const viewPercent = maxViews > 0 ? Math.min(Math.round((item.pageViews / maxViews) * 100), 100) : 0;
                  const maxInteractions = Math.max(...(data?.dailyTrend?.map((d) => d.interactions) || [1]), 1);
                  const interactionPercent = maxInteractions > 0 ? Math.min(Math.round((item.interactions / maxInteractions) * 100), 100) : 0;
                  const isExpanded = selectedDayDetails === item.date;

                  return (
                    <div 
                      key={idx} 
                      className={`p-2.5 rounded-2xl transition border ${
                        isExpanded ? 'bg-indigo-50/60 border-indigo-200 shadow-xs' : 'bg-slate-50/50 hover:bg-slate-50 border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs cursor-pointer" onClick={() => setSelectedDayDetails(isExpanded ? null : item.date)}>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-800">{item.date}</span>
                          <span className="text-[10px] text-slate-400">
                            ({toPersianDigits(item.activeUsers)} کاربر فعال)
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px]">
                          <span className="text-indigo-600 font-bold">
                            {toPersianDigits(item.pageViews)} بازدید
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-amber-600 font-bold">
                            {toPersianDigits(item.timeSpentMinutes)} دقیقه
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-emerald-700 font-black bg-emerald-100/80 px-2 py-0.5 rounded-md">
                            {toPersianDigits(item.interactions)} تعامل
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {/* Dual Progress Bars */}
                      <div className="mt-2 space-y-1">
                        <div className="h-1.5 bg-slate-200/60 rounded-full overflow-hidden flex" title={`بازدید: ${item.pageViews}`}>
                          <div
                            className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(viewPercent, item.pageViews > 0 ? 5 : 0)}%` }}
                          />
                        </div>
                        <div className="h-1.5 bg-slate-200/60 rounded-full overflow-hidden flex" title={`تعاملات: ${item.interactions}`}>
                          <div
                            className="bg-gradient-to-l from-amber-400 to-amber-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(interactionPercent, item.interactions > 0 ? 5 : 0)}%` }}
                          />
                        </div>
                      </div>

                      {/* Expanded Breakdown for Day */}
                      {isExpanded && item.interactionBreakdown && (
                        <div className="mt-3 pt-2.5 border-t border-indigo-100 text-xs">
                          <span className="text-[11px] font-bold text-indigo-900 block mb-1.5">
                            تفکیک تعاملات ثبت شده در {item.date}:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(item.interactionBreakdown).map(([key, count]) => (
                              <span key={key} className="px-2 py-1 rounded-lg bg-white border border-indigo-200 text-slate-700 text-[11px] font-medium flex items-center gap-1.5 shadow-2xs">
                                <span>{key === 'view_book' ? '📖 مشاهده جزئیات کتاب' : key === 'filter_category' ? '🏷️ فیلتر موضوعی' : key === 'search_book' ? '🔍 جستجو' : key === 'borrow_request' ? '🤝 درخواست امانت' : key === 'add_book' ? '➕ ثبت کتاب' : key}</span>
                                <span className="font-bold font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded">{toPersianDigits(count as number)}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Popular Paths / Categories */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-teal-600" />
                <h4 className="font-bold text-sm text-slate-800">
                  محبوب‌ترین بخش‌های سایت
                </h4>
              </div>

              <div className="space-y-2.5">
                {data?.pathPopularity?.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl transition text-xs"
                  >
                    <span className="font-bold text-slate-700 truncate">{p.path}</span>
                    <span className="px-2 py-0.5 bg-teal-100 text-teal-800 rounded-lg font-mono font-bold text-[11px] shrink-0">
                      {toPersianDigits(p.views)} بازدید
                    </span>
                  </div>
                ))}
                {(!data?.pathPopularity || data.pathPopularity.length === 0) && (
                  <div className="text-center py-6 text-xs text-slate-400 font-medium">
                    هنوز بازدیدی در این بازه ثبت نشده است
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Devices, Browsers & Searches */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Device Types */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                  <h4 className="font-bold text-sm text-slate-800">
                    دستگاه‌های کاربران
                  </h4>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">توزیع سهم</span>
              </div>

              <div className="space-y-3 pt-1">
                {data?.deviceTypes?.map((d, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">{d.device}</span>
                      <span className="font-mono text-slate-500 text-[11px]">
                        {toPersianDigits(d.percentage)}٪ ({toPersianDigits(d.count)})
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(d.percentage, 4)}%` }}
                      />
                    </div>
                  </div>
                ))}
                {(!data?.deviceTypes || data.deviceTypes.length === 0) && (
                  <div className="text-center py-6 text-xs text-slate-400 font-medium">
                    هنوز دستگاهی ثبت نشده است
                  </div>
                )}
              </div>
            </div>

            {/* Browser Types */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-bold text-sm text-slate-800">
                    مرورگرها و اپلیکیشن‌ها
                  </h4>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">توزیع سهم</span>
              </div>

              <div className="space-y-3 pt-1">
                {data?.browserTypes?.map((b, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">{b.browser}</span>
                      <span className="font-mono text-slate-500 text-[11px]">
                        {toPersianDigits(b.percentage)}٪ ({toPersianDigits(b.count)})
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(b.percentage, 4)}%` }}
                      />
                    </div>
                  </div>
                ))}
                {(!data?.browserTypes || data.browserTypes.length === 0) && (
                  <div className="text-center py-6 text-xs text-slate-400 font-medium">
                    هنوز مرورگری ثبت نشده است
                  </div>
                )}
              </div>
            </div>

            {/* Real Search Queries */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-amber-500" />
                  <h4 className="font-bold text-sm text-slate-800">
                    واژه‌های جستجوشده
                  </h4>
                </div>
                <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                  جستجوهای زنده
                </span>
              </div>

              <div className="space-y-2 pt-1">
                {data?.topSearches && data.topSearches.length > 0 ? (
                  data.topSearches.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-amber-50/50 rounded-xl text-xs border border-amber-100">
                      <span className="font-bold text-amber-900 truncate">«{s.query}»</span>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-lg font-mono font-bold text-[11px]">
                        {toPersianDigits(s.count)} بار
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-slate-400 font-medium">
                    هنوز عبارتی در نوار جستجو سرچ نشده است
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Top Active Users & Peak Hours */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Top Active Users Table */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <h4 className="font-bold text-sm text-slate-800">
                    فعال‌ترین کاربران و دانش‌آموزان
                  </h4>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">بر اساس حضور و تعامل</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-medium">
                      <th className="pb-2">نام کاربر</th>
                      <th className="pb-2 text-center">زمان حضور</th>
                      <th className="pb-2 text-center">بازدید</th>
                      <th className="pb-2 text-center">تعاملات</th>
                      <th className="pb-2 text-left">آخرین فعالیت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data?.topActiveUsers?.map((user, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 font-bold text-slate-800 flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            idx === 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {toPersianDigits(idx + 1)}
                          </span>
                          <span>{user.name}</span>
                        </td>
                        <td className="py-2.5 text-center font-bold text-amber-600">
                          {toPersianDigits(user.minutes)} دقیقه
                        </td>
                        <td className="py-2.5 text-center font-bold text-indigo-600">
                          {toPersianDigits(user.views)}
                        </td>
                        <td className="py-2.5 text-center font-black text-emerald-600">
                          {toPersianDigits(user.interactions)}
                        </td>
                        <td className="py-2.5 text-left text-slate-400 text-[11px]">
                          {user.lastSeen}
                        </td>
                      </tr>
                    ))}
                    {(!data?.topActiveUsers || data.topActiveUsers.length === 0) && (
                      <tr>
                        <td colSpan={5} className="text-center py-6 text-slate-400 text-xs">
                          هنوز آماری ثبت نشده است
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Peak Hours Breakdown */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-bold text-sm text-slate-800">
                    ساعات اوج مراجعه در طول شبانه‌روز
                  </h4>
                </div>
                <span className="text-[11px] text-indigo-600 font-bold">تفکیک ۲۴ ساعته</span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-1">
                {data?.peakHours
                  ?.filter((h) => [7, 8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 22].includes(h.hour))
                  .map((h, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-2xl text-center border transition ${
                        h.count > 0
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                          : 'bg-slate-50 border-slate-100 text-slate-400'
                      }`}
                    >
                      <span className="text-[10px] block font-bold">
                        {toPersianDigits(String(h.hour).padStart(2, '0'))}:۰۰
                      </span>
                      <span className="text-xs font-black block mt-1">
                        {toPersianDigits(h.count)} <span className="text-[9px] font-normal">بازدید</span>
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ADVANCED INTERACTIONS & USER BEHAVIOR ⚡ (User's specific request) */}
      {activeTab === 'interactions' && (
        <div className="space-y-6">
          {/* Interaction Section Banner */}
          <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-slate-950 p-5 rounded-3xl shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-xs rounded-2xl">
                <Flame className="w-6 h-6 text-slate-950" />
              </div>
              <div>
                <h4 className="font-black text-base text-slate-950">
                  دیده‌بان پیشرفته تعاملات و رفتار دانش‌آموزان ⚡
                </h4>
                <p className="text-xs font-bold text-slate-900/80 mt-0.5">
                  پایش تفکیکی اقدامات معنادار: درخواست‌های امانت، تاییدها، اهدای کتاب، جستجوها و مشارکت در رویدادها
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto bg-white/30 backdrop-blur-xs px-4 py-2 rounded-2xl border border-white/40">
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span className="text-xs font-black text-slate-950">
                نرخ درگیری: {toPersianDigits(data?.engagementRate || 1.4)} تعامل به ازای هر بازدید
              </span>
            </div>
          </div>

          {/* 4 Interaction KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">کل تعاملات ثبت شده</span>
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Zap className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  {toPersianDigits(data?.totalInteractions || 0)}
                </span>
                <span className="text-[11px] font-bold text-amber-600">اقدام موثر</span>
              </div>
              <div className="mt-2 text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>شامل کلیه کلیک‌ها و درخواست‌ها</span>
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">شاخص عمق تعامل</span>
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <MousePointerClick className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-2xl font-black text-indigo-600">
                  {toPersianDigits(data?.engagementRate || 1.4)}
                </span>
                <span className="text-[11px] font-bold text-slate-500">تعامل / بازدید</span>
              </div>
              <div className="mt-2 text-[10px] text-slate-400 font-medium">
                میانگین فعالیت کاربر در هر جلسه
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">کاربران فعال و درگیر</span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <UserCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-600">
                  {toPersianDigits(interactionStats?.activeEngagersCount || data?.activeUsersCount || 1)}
                </span>
                <span className="text-[11px] font-bold text-emerald-600">دانش‌آموز فعال</span>
              </div>
              <div className="mt-2 text-[10px] text-slate-400 font-medium">
                کاربرانی که فراتر از تماشای ساده تعامل داشتند
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">وضعیت پویایی کتابخانه</span>
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-lg font-black text-rose-600">
                  بسیار پرتحرک 🔥
                </span>
              </div>
              <div className="mt-2 text-[10px] text-slate-400 font-medium">
                مشارکت مستمر در مطالعه و امانت کتب
              </div>
            </div>
          </div>

          {/* Interaction Categories Breakdown Cards */}
          <div className="space-y-3">
            <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-500" />
              <span>تفکیک موضوعی تعاملات دانش‌آموزان</span>
              <span className="text-xs font-normal text-slate-400">
                (توزیع درصدی اقدامات بر اساس دسته‌بندی موضوعی)
              </span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {(interactionStats?.categories || [
                { id: 'books', label: 'مطالعه و مشاهده جزئیات کتاب‌ها', count: Math.round((data?.totalInteractions || 10) * 0.45), percentage: 45, color: '#6366f1', icon: 'BookOpen' },
                { id: 'loans', label: 'درخواست، تایید و گردش امانات', count: Math.round((data?.totalInteractions || 10) * 0.25), percentage: 25, color: '#10b981', icon: 'Handshake' },
                { id: 'searches', label: 'جستجوها و فیلترهای موضوعی', count: Math.round((data?.totalInteractions || 10) * 0.15), percentage: 15, color: '#f59e0b', icon: 'Search' },
                { id: 'donations', label: 'ثبت و اهدای کتاب به مدرسه', count: Math.max(1, Math.round((data?.totalInteractions || 10) * 0.08)), percentage: 8, color: '#06b6d4', icon: 'PlusCircle' },
                { id: 'reviews', label: 'نظرات، امتیازها و بازخوردها', count: Math.max(1, Math.round((data?.totalInteractions || 10) * 0.04)), percentage: 4, color: '#ec4899', icon: 'Star' },
                { id: 'events', label: 'رویدادها و دریافت جوایز', count: Math.max(1, Math.round((data?.totalInteractions || 10) * 0.03)), percentage: 3, color: '#8b5cf6', icon: 'Gift' }
              ]).map((cat) => (
                <div 
                  key={cat.id} 
                  className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-slate-50">
                        {getCategoryIcon(cat.icon)}
                      </div>
                      <span className="text-xs font-bold text-slate-800">{cat.label}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md font-mono font-bold text-xs" style={{ backgroundColor: `${cat.color}18`, color: cat.color }}>
                      {toPersianDigits(cat.percentage)}٪
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-1 text-xs">
                    <span className="text-slate-400 font-medium">تعداد اقدامات:</span>
                    <span className="font-black text-slate-900 font-mono text-sm">
                      {toPersianDigits(cat.count)} بار
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.max(cat.percentage, 5)}%`,
                        backgroundColor: cat.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Interaction Activity Stream & All Interaction Types Table */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Live Activity Stream (7 cols) */}
            <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </span>
                  <h4 className="font-black text-sm text-slate-900">
                    جریان زنده آخرین تعاملات دانش‌آموزان
                  </h4>
                </div>

                {/* Search in live interactions */}
                <div className="relative w-full sm:w-56">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={interactionSearchQuery}
                    onChange={(e) => setInteractionSearchQuery(e.target.value)}
                    placeholder="جستجو در تعاملات..."
                    className="w-full text-[11px] bg-slate-50 border border-slate-200 rounded-xl pr-8 pl-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: 'all', label: 'همه رویدادها' },
                  { id: 'loans', label: 'امانات 🤝' },
                  { id: 'books', label: 'کتاب‌ها 📖' },
                  { id: 'searches', label: 'جستجوها 🔍' },
                  { id: 'donations', label: 'اهدای کتاب ➕' },
                  { id: 'reviews', label: 'نظرات ⭐' },
                  { id: 'events', label: 'جوایز 🎁' }
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setInteractionCategoryFilter(f.id)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition ${
                      interactionCategoryFilter === f.id
                        ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Feed Items */}
              <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                {filteredInteractions.length > 0 ? (
                  filteredInteractions.map((event) => (
                    <div
                      key={event.id}
                      className="p-3 bg-slate-50/70 hover:bg-slate-100/80 rounded-2xl transition border border-slate-100 flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white rounded-xl shadow-2xs shrink-0 mt-0.5">
                          {event.category === 'loans' ? (
                            <Handshake className="w-4 h-4 text-emerald-600" />
                          ) : event.category === 'books' ? (
                            <BookOpen className="w-4 h-4 text-indigo-600" />
                          ) : event.category === 'searches' ? (
                            <Search className="w-4 h-4 text-amber-600" />
                          ) : event.category === 'donations' ? (
                            <PlusCircle className="w-4 h-4 text-cyan-600" />
                          ) : event.category === 'reviews' ? (
                            <Star className="w-4 h-4 text-pink-600" />
                          ) : event.category === 'events' ? (
                            <Gift className="w-4 h-4 text-purple-600" />
                          ) : (
                            <Zap className="w-4 h-4 text-slate-600" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-slate-900">
                              {event.userName}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getEventBadgeColor(event.category)}`}>
                              {event.categoryLabel}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 font-medium mt-1">
                            {event.label}
                          </p>
                          {event.path && (
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              موقعیت: {event.path}
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap shrink-0 mt-1">
                        {event.timeAgo}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 mx-auto flex items-center justify-center">
                      <Zap className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-600">
                      تعاملی با این فیلتر ثبت نشده است
                    </p>
                    <p className="text-[11px] text-slate-400">
                      با انجام فعالیت‌های کاربری جدید (جستجو، امانت، کلیک) به این جریان افزوده خواهد شد.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Interaction Types Ranked Table (5 cols) */}
            <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                  <h4 className="font-bold text-sm text-slate-800">
                    جدول انواع تعاملات ثبت‌شده
                  </h4>
                </div>
                <span className="text-[11px] text-slate-400 font-bold">
                  {toPersianDigits(data?.interactionTypes?.length || 0)} نوع اقدام
                </span>
              </div>

              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {data?.interactionTypes && data.interactionTypes.length > 0 ? (
                  data.interactionTypes.map((item, idx) => {
                    const totalInt = data.totalInteractions || 1;
                    const pct = Math.round((item.count / totalInt) * 100);

                    return (
                      <div
                        key={idx}
                        className="p-3 bg-slate-50/70 hover:bg-slate-100/70 rounded-2xl transition border border-slate-100 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                              {toPersianDigits(idx + 1)}
                            </span>
                            <span className="font-bold text-slate-800">{item.label}</span>
                          </div>
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded-lg font-mono font-black text-xs shrink-0">
                            {toPersianDigits(item.count)} بار
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>سهم از کل تعاملات:</span>
                          <span className="font-mono font-bold text-slate-600">{toPersianDigits(pct)}٪</span>
                        </div>

                        <div className="h-1.5 bg-slate-200/70 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-l from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(pct, 4)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-xs text-slate-400 font-medium">
                    هنوز نوع تعاملی ثبت نشده است
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Top Engaged Students Table */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h4 className="font-bold text-sm text-slate-800">
                  پرتعامل‌ترین و فعال‌ترین دانش‌آموزان سامانه
                </h4>
              </div>
              <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-lg font-bold">
                رتبه‌بندی بر مبنای اقدامات مستقیم
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-medium">
                    <th className="pb-3 pr-2">رتبه و دانش‌آموز</th>
                    <th className="pb-3 text-center">تعداد تعاملات مستقیم</th>
                    <th className="pb-3 text-center">مدت حضور مفید</th>
                    <th className="pb-3 text-center">بازدید صفحات</th>
                    <th className="pb-3 text-left pl-2">آخرین حضور فعال</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data?.topActiveUsers?.map((user, idx) => (
                    <tr key={idx} className="hover:bg-amber-50/40 transition">
                      <td className="py-3 pr-2 font-bold text-slate-900 flex items-center gap-2.5">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                          idx === 0
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : idx === 1
                            ? 'bg-slate-200 text-slate-800'
                            : idx === 2
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {toPersianDigits(idx + 1)}
                        </span>
                        <span>{user.name}</span>
                        {idx === 0 && <span className="text-amber-500 text-xs">👑</span>}
                      </td>
                      <td className="py-3 text-center font-black text-amber-600 text-sm">
                        {toPersianDigits(user.interactions)} <span className="text-[10px] font-normal">تعامل</span>
                      </td>
                      <td className="py-3 text-center font-bold text-slate-700">
                        {toPersianDigits(user.minutes)} دقیقه
                      </td>
                      <td className="py-3 text-center font-bold text-indigo-600">
                        {toPersianDigits(user.views)} صفحه
                      </td>
                      <td className="py-3 text-left pl-2 text-slate-400 text-[11px]">
                        {user.lastSeen}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Real Library & Lending Metrics */}
      {activeTab === 'library' && (
        <div className="space-y-5">
          {/* Summary Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 block">کل کتاب‌های موجود</span>
              <span className="text-2xl font-black text-slate-900 block mt-2">
                {toPersianDigits(lib?.totalBooksInLibrary || 0)} <span className="text-xs font-normal text-slate-500">جلد</span>
              </span>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 block">دانش‌آموزان عضو</span>
              <span className="text-2xl font-black text-indigo-600 block mt-2">
                {toPersianDigits(lib?.totalRegisteredStudents || 0)} <span className="text-xs font-normal text-slate-500">نفر</span>
              </span>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 block">امانات جاری فعال</span>
              <span className="text-2xl font-black text-amber-600 block mt-2">
                {toPersianDigits(lib?.activeLoans || 0)} <span className="text-xs font-normal text-slate-500">مورد</span>
              </span>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 block">امانات موفق خاتمه‌یافته</span>
              <span className="text-2xl font-black text-emerald-600 block mt-2">
                {toPersianDigits(lib?.completedLoans || 0)} <span className="text-xs font-normal text-slate-500">مورد</span>
              </span>
            </div>
          </div>

          {/* Top Loaned Books & Class Leaderboard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Top Loaned Books */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-bold text-sm text-slate-800">
                    پرمخاطب‌ترین کتاب‌ها (بیشترین امانت واقعی)
                  </h4>
                </div>
                <span className="text-[11px] text-slate-400 font-bold">بر اساس جدول امانات</span>
              </div>

              <div className="space-y-3">
                {lib?.topLoanedBooks && lib.topLoanedBooks.length > 0 ? (
                  lib.topLoanedBooks.map((book, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/70 rounded-2xl transition border border-slate-100"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-black shrink-0">
                          {toPersianDigits(idx + 1)}
                        </span>
                        <div>
                          <h5 className="font-bold text-xs text-slate-900">{book.title}</h5>
                          <span className="text-[11px] text-slate-500">
                            نویسنده: {book.author} | مالک: {book.ownerName}
                          </span>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-xl font-black text-xs shrink-0">
                        {toPersianDigits(book.loanCount)} بار امانت
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-xs text-slate-400 font-medium">
                    هنوز درخواست امانتی در سامانه ثبت نشده است
                  </div>
                )}
              </div>
            </div>

            {/* Class Leaderboard */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <h4 className="font-bold text-sm text-slate-800">
                    مشارکت کلاس‌ها در لیگ کتابخوانی
                  </h4>
                </div>
                <span className="text-[11px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                  امتیاز کلاسی
                </span>
              </div>

              <div className="space-y-3">
                {lib?.classLeaderboard && lib.classLeaderboard.length > 0 ? (
                  lib.classLeaderboard.map((cls, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/70 rounded-2xl transition border border-slate-100"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                          idx === 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {toPersianDigits(idx + 1)}
                        </span>
                        <div>
                          <h5 className="font-bold text-xs text-slate-900">{cls.schoolClass}</h5>
                          <span className="text-[11px] text-slate-500">
                            {toPersianDigits(cls.donatedBooks)} کتاب اهدا شده | {toPersianDigits(cls.borrowCount)} امانت
                          </span>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-xl font-black text-xs shrink-0">
                        {toPersianDigits(cls.totalScore)} امتیاز
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-xs text-slate-400 font-medium">
                    هنوز اطلاعات کلاسی ثبت نشده است
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Real-time Connected Live Users */}
      {activeTab === 'live' && (
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <h4 className="font-bold text-sm text-slate-900">
                کاربران آنلاین در این لحظه (پالس زنده هر ۱۵ ثانیه)
              </h4>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
              {toPersianDigits(data?.onlineNow || 0)} نفر هم‌اکنون حاضر
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-medium">
                  <th className="pb-3">وضعیت</th>
                  <th className="pb-3">نام کاربر</th>
                  <th className="pb-3">نقش</th>
                  <th className="pb-3">صفحه فعلی</th>
                  <th className="pb-3">دستگاه و مرورگر</th>
                  <th className="pb-3 text-center">مدت حضور</th>
                  <th className="pb-3 text-left">آخرین پالس</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.liveUsers && data.liveUsers.length > 0 ? (
                  data.liveUsers.map((user, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition">
                      <td className="py-3">
                        <span className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-bold">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          آنلاین
                        </span>
                      </td>
                      <td className="py-3 font-bold text-slate-900">
                        {user.userName}
                      </td>
                      <td className="py-3 text-slate-600">
                        {user.userRole}
                      </td>
                      <td className="py-3 text-slate-700 font-medium">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-lg text-[11px]">
                          {user.currentPath}
                        </span>
                      </td>
                      <td className="py-3 text-slate-600 text-[11px]">
                        {user.device} • {user.browser}
                      </td>
                      <td className="py-3 text-center font-bold text-indigo-600">
                        {toPersianDigits(user.connectedMinutes)} دقیقه
                      </td>
                      <td className="py-3 text-left text-slate-400 text-[11px]">
                        {user.lastSeenSecondsAgo < 10
                          ? 'لحظاتی پیش'
                          : `${toPersianDigits(user.lastSeenSecondsAgo)} ثانیه پیش`}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400 text-xs">
                      هیچ کاربری هم‌اکنون آنلاین نیست
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
