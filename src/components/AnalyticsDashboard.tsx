import React, { useState, useEffect } from 'react';
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
  ShieldCheck
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

interface AnalyticsData {
  totalPageViews: number;
  totalTimeSpentSeconds: number;
  totalInteractions: number;
  activeUsersCount: number;
  onlineNow: number;
  dailyTrend: {
    date: string;
    pageViews: number;
    timeSpentMinutes: number;
    interactions: number;
    activeUsers: number;
  }[];
  pathPopularity: { path: string; views: number }[];
  interactionTypes: { type: string; label: string; count: number }[];
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
  const [activeTab, setActiveTab] = useState<'traffic' | 'library' | 'live'>('traffic');

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

  const lib = data?.realLibraryMetrics;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl border border-indigo-900/50 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-44 h-44 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-44 h-44 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-300 flex items-center justify-center shadow-inner">
              <Activity className="w-6 h-6 animate-pulse text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-white">
                  مرکز مانیتورینگ و آنالیز واقعی سامانه
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  داده‌های ۱۰۰٪ واقعی
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 font-medium mt-0.5">
                بررسی لحظه‌ای حضور کاربران، امانات کتابخانه، واژه‌های جستجوشده و دستگاه‌های مراجعه‌کنندگان
              </p>
            </div>
          </div>

          {/* Time Filter Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/80 shadow-inner">
            <button
              type="button"
              onClick={() => setDays(1)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                days === 1
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              امروز
            </button>
            <button
              type="button"
              onClick={() => setDays(7)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                days === 7
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              ۷ روز گذشته
            </button>
            <button
              type="button"
              onClick={() => setDays(30)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                days === 30
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              ۳۰ روز اخیر
            </button>

            <button
              type="button"
              onClick={() => fetchAnalytics(days)}
              title="تازه‌سازی زنده داده‌ها"
              className="p-1.5 text-indigo-300 hover:text-white hover:bg-slate-700 rounded-xl transition"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-5 pt-4 border-t border-indigo-900/60 flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('traffic')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition ${
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
            onClick={() => setActiveTab('library')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition ${
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
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition ${
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

        {/* Total Interactions */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">کل تعاملات و کلیک‌ها</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {toPersianDigits(data?.totalInteractions || 0)}
            </span>
            <span className="text-[11px] font-bold text-purple-600">رویداد ثبت‌شده</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-400 font-medium">
            درخواست امانت، ثبت کتاب و جستجو
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
                    روند روزانه بازدید و زمان حضور دانش‌آموزان
                  </h4>
                </div>
                <span className="text-[11px] text-slate-400 font-bold">
                  {toPersianDigits(data?.dailyTrend?.length || 0)} روز اخیر
                </span>
              </div>

              {/* Bar Chart */}
              <div className="space-y-3 pt-2">
                {data?.dailyTrend?.map((item, idx) => {
                  const maxViews = Math.max(...(data?.dailyTrend?.map((d) => d.pageViews) || [1]), 1);
                  const percent = maxViews > 0 ? Math.min(Math.round((item.pageViews / maxViews) * 100), 100) : 0;

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">{item.date}</span>
                        <div className="flex items-center gap-3 text-[11px]">
                          <span className="text-indigo-600 font-bold">
                            {toPersianDigits(item.pageViews)} بازدید
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-amber-600 font-bold">
                            {toPersianDigits(item.timeSpentMinutes)} دقیقه حضور
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-emerald-600 font-bold">
                            {toPersianDigits(item.interactions)} تعامل
                          </span>
                        </div>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                        <div
                          className="bg-gradient-to-l from-indigo-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(percent, item.pageViews > 0 ? 4 : 0)}%` }}
                        />
                      </div>
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

          {/* Real Device Breakdown & Real Browser Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Real Device Types */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-bold text-sm text-slate-800">
                    نوع دستگاه کاربران (واقعی)
                  </h4>
                </div>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  Real UA Data
                </span>
              </div>

              <div className="space-y-3 pt-1">
                {data?.deviceTypes && data.deviceTypes.length > 0 ? (
                  data.deviceTypes.map((dev, idx) => (
                    <div key={idx} className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">{dev.device}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-mono text-[11px]">
                            {toPersianDigits(dev.count)} مراجعه
                          </span>
                          <span className="font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200">
                            {toPersianDigits(dev.percentage)}٪
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-slate-200/80 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(dev.percentage, 2)}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-slate-400 font-medium">
                    در انتظار ثبت اولین ورود و مراجعه
                  </div>
                )}
              </div>
            </div>

            {/* Real Browsers */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-teal-600" />
                  <h4 className="font-bold text-sm text-slate-800">
                    مرورگرها و برنامه‌ها
                  </h4>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">Webview / App</span>
              </div>

              <div className="space-y-2.5 pt-1">
                {data?.browserTypes && data.browserTypes.length > 0 ? (
                  data.browserTypes.map((b, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs">
                      <span className="font-bold text-slate-700">{b.browser}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-mono text-[11px]">
                          {toPersianDigits(b.count)}
                        </span>
                        <span className="font-black text-teal-700 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200">
                          {toPersianDigits(b.percentage)}٪
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
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
                        <td className="py-2.5 text-center font-mono text-slate-600">
                          {toPersianDigits(user.views)}
                        </td>
                        <td className="py-2.5 text-center font-mono text-emerald-600 font-bold">
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

      {/* TAB 2: Real Library & Lending Metrics */}
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
                    هنوز کلاسی در لیگ امتیاز ثبت نکرده است
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Live Real-Time Active Sessions Monitor */}
      {activeTab === 'live' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Radio className="w-5 h-5 text-emerald-500 animate-pulse" />
              <div>
                <h4 className="font-bold text-sm text-slate-900">
                  مانیتورینگ زنده کاربران حاضر در سامانه
                </h4>
                <p className="text-[11px] text-slate-500">
                  این لیست هر ۱۵ ثانیه بر اساس پالس‌های فعال مرورگر کاربران به‌روزرسانی می‌شود.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-black">
              {toPersianDigits(data?.onlineNow || 0)} کاربر متصل
            </span>
          </div>

          <div className="overflow-x-auto pt-2">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-medium">
                  <th className="pb-2.5">وضعیت</th>
                  <th className="pb-2.5">نام کاربر</th>
                  <th className="pb-2.5">نقش</th>
                  <th className="pb-2.5">صفحه فعلی</th>
                  <th className="pb-2.5">دستگاه / برنامه</th>
                  <th className="pb-2.5 text-center">مدت حضور</th>
                  <th className="pb-2.5 text-left">آخرین پالس</th>
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
