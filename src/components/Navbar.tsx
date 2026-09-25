import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MaktabKhanehLogo } from './MaktabKhanehBranding';
import {
  BookOpen,
  Trophy,
  User as UserIcon,
  BookPlus,
  ArrowLeftRight,
  ShieldAlert,
  LogOut,
  LogIn,
  UserPlus,
  Bell,
  Sparkles,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Plus,
  HelpCircle,
  Send,
  Gift
} from 'lucide-react';

const toFarsiNumber = (n: number | string) => {
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return n.toString().replace(/\d/g, (x) => farsiDigits[parseInt(x)]);
};

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAuth?: () => void;
  onOpenLogin?: () => void;
  onOpenRegister?: () => void;
  onOpenPrintModal?: () => void;
  onOpenBaleOtp?: () => void;
  onOpenGuide?: () => void;
  onOpenNotifications?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAuth,
  onOpenLogin,
  onOpenRegister,
  onOpenPrintModal,
  onOpenBaleOtp,
  onOpenGuide,
  onOpenNotifications
}) => {
  const {
    currentUser,
    setCurrentUser,
    logoutUser,
    users,
    switchUserRoleDemo,
    requests,
    notifications,
    markNotificationRead,
    clearNotifications,
    systemConfig
  } = useApp();

  const baleChannelUrl = systemConfig?.baleChannelUsername
    ? `https://ble.ir/${systemConfig.baleChannelUsername.replace('@', '')}`
    : 'https://ble.ir/maktabkhune_books';

  // Count pending requests for current user
  const pendingRequestsForMe = currentUser
    ? requests.filter(
        (r) =>
          (r.ownerId === currentUser.id && r.status === 'pending') ||
          (r.borrowerId === currentUser.id && r.status === 'accepted')
      ).length
    : 0;

  const pendingApprovalsForAdmin = users.filter((u) => u.status === 'pending').length;
  const unreadNotificationsCount = currentUser
    ? notifications.filter((n) => !n.isRead).length
    : 0;

  return (
    <header className="relative lg:sticky lg:top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2 sm:py-3 gap-1.5 sm:gap-3">
          {/* Prominent Logo & Brand Title (Compact in Header) */}
          <div
            className="flex items-center gap-2 cursor-pointer group py-0.5 shrink-0"
            onClick={() => setActiveTab('library')}
          >
            <MaktabKhanehLogo size="xs" showSlogan={false} hideSubtitleOnMobile={true} />
          </div>

          {/* Navigation Items (Scrollable & Responsive) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 shrink min-w-0 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setActiveTab('library')}
              className={`px-2.5 xl:px-3 py-1.5 rounded-xl font-bold text-xs xl:text-sm flex items-center gap-1.5 transition whitespace-nowrap shrink-0 ${
                activeTab === 'library'
                  ? 'bg-cyan-50 text-cyan-800 border border-cyan-200 shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4 text-cyan-600 shrink-0" />
              <span>کتابخانه</span>
            </button>

            <button
              onClick={() => setActiveTab('league')}
              className={`px-2.5 xl:px-3 py-1.5 rounded-xl font-bold text-xs xl:text-sm flex items-center gap-1.5 transition whitespace-nowrap shrink-0 ${
                activeTab === 'league'
                  ? 'bg-amber-50 text-amber-900 border border-amber-200 shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
              <span>لیگ</span>
            </button>

            {/* Features & Benefits Tab */}
            <button
              onClick={() => setActiveTab('benefits')}
              className={`px-2.5 xl:px-3 py-1.5 rounded-xl font-bold text-xs xl:text-sm flex items-center gap-1.5 transition whitespace-nowrap shrink-0 ${
                activeTab === 'benefits'
                  ? 'bg-orange-50 text-orange-900 border border-orange-200 shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-4 h-4 text-orange-500 shrink-0" />
              <span>مزایا</span>
            </button>

            {/* Top Site Rules Tab */}
            <button
              onClick={() => setActiveTab('rules')}
              className={`px-2.5 xl:px-3 py-1.5 rounded-xl font-bold text-xs xl:text-sm flex items-center gap-1.5 transition whitespace-nowrap shrink-0 ${
                activeTab === 'rules'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>قوانین</span>
            </button>

            {currentUser && (
              <>
                <button
                  onClick={() => setActiveTab('my_books')}
                  className={`px-2.5 xl:px-3 py-1.5 rounded-xl font-bold text-xs xl:text-sm flex items-center gap-1.5 transition whitespace-nowrap shrink-0 ${
                    activeTab === 'my_books'
                      ? 'bg-cyan-50 text-cyan-800 border border-cyan-200 shadow-2xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <BookPlus className="w-4 h-4 text-cyan-600 shrink-0" />
                  <span>طاقچه</span>
                </button>

                <button
                  onClick={() => setActiveTab('requests')}
                  className={`relative px-2.5 xl:px-3 py-1.5 rounded-xl font-bold text-xs xl:text-sm flex items-center gap-1.5 transition whitespace-nowrap shrink-0 ${
                    activeTab === 'requests'
                      ? 'bg-cyan-50 text-cyan-800 border border-cyan-200 shadow-2xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <ArrowLeftRight className="w-4 h-4 text-cyan-600 shrink-0" />
                  <span>درخواست‌ها</span>
                  {pendingRequestsForMe > 0 && (
                    <span className="w-4 h-4 rounded-full bg-orange-500 text-white text-[10px] flex items-center justify-center font-bold animate-pulse">
                      {pendingRequestsForMe}
                    </span>
                  )}
                </button>
              </>
            )}

            {(currentUser?.role === 'admin' || currentUser?.id === 'user_admin') && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`relative px-2.5 xl:px-3 py-1.5 rounded-xl font-bold text-xs xl:text-sm flex items-center gap-1.5 transition whitespace-nowrap shrink-0 ${
                  activeTab === 'admin'
                    ? 'bg-cyan-700 text-white shadow-md shadow-cyan-900/20'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-amber-300 shrink-0" />
                <span>مدیریت</span>
                {pendingApprovalsForAdmin > 0 && (
                  <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[10px] flex items-center justify-center font-bold">
                    {pendingApprovalsForAdmin}
                  </span>
                )}
              </button>
            )}
          </nav>

          {/* User Auth Buttons & Profile Badge */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0 lg:border-r lg:border-slate-200 lg:pr-3">
            {/* Bale Channel Quick Access Button */}
            <a
              href={baleChannelUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="کانال رسمی معرفی کتاب‌های مکتب‌خانه در پیام‌رسان بله"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-bold text-xs bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200 shadow-2xs transition shrink-0 whitespace-nowrap cursor-pointer group"
            >
              <Send className="w-3.5 h-3.5 text-sky-600 group-hover:translate-x-0.5 transition-transform" />
              <span>کانال بله</span>
            </a>

            {currentUser ? (
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                {/* Free Loan Quota Top Indicator */}
                {(currentUser.freeLoanQuota || 0) > 0 && (
                  <button
                    onClick={() => setActiveTab('library')}
                    title={`شما دارای ${toFarsiNumber(currentUser.freeLoanQuota || 0)} سهمیه امانت رایگان فعال هستید (برای مشاهده طاقچه و امانت کلیک کنید)`}
                    className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl font-black text-[10px] sm:text-xs bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-500 text-white shadow-xs shadow-amber-500/30 hover:shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0 animate-pulse border border-white/20 whitespace-nowrap"
                  >
                    <Gift className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-100 shrink-0" />
                    <span className="sm:hidden">{toFarsiNumber(currentUser.freeLoanQuota || 0)} رایگان</span>
                    <span className="hidden sm:inline">{toFarsiNumber(currentUser.freeLoanQuota || 0)} تا رایگان</span>
                  </button>
                )}

                {/* Notification Bell Button */}
                <button
                  onClick={() => onOpenNotifications?.()}
                  className="relative p-1.5 sm:p-2 text-slate-600 hover:text-cyan-600 hover:bg-slate-100 rounded-xl transition cursor-pointer shrink-0"
                  title="اعلان‌ها"
                >
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-rose-600 text-white text-[8px] sm:text-[9px] font-black rounded-full flex items-center justify-center animate-bounce">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </button>

                {/* User Profile Pill */}
                <div
                  onClick={() => setActiveTab('profile')}
                  title={`پروفایل ${currentUser.name}`}
                  className="flex items-center gap-1.5 sm:gap-2 bg-slate-100/90 hover:bg-slate-200/90 p-1 sm:p-1.5 px-1 sm:px-2 rounded-xl sm:rounded-2xl cursor-pointer transition border border-slate-200 shrink-0"
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl object-cover ring-2 ring-cyan-500 shadow-xs shrink-0"
                  />
                  <div className="hidden sm:block text-right min-w-0 max-w-[100px] md:max-w-[140px]">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-black text-slate-900 truncate block">
                        {currentUser.name}
                      </span>
                    </div>
                    <div className="text-[10px] text-cyan-700 font-bold leading-none mt-0.5 truncate block">
                      {currentUser.role === 'admin' ? 'مدیر سیستم' : currentUser.className}
                    </div>
                  </div>
                </div>

                {onOpenGuide && currentUser?.role !== 'admin' && (
                  <button
                    onClick={onOpenGuide}
                    title="راهنما و آموزش مکتب‌خانه"
                    className="hidden md:flex px-2.5 py-1.5 text-xs font-bold text-cyan-800 bg-cyan-50 hover:bg-cyan-100 rounded-xl transition border border-cyan-200 items-center gap-1 shrink-0 whitespace-nowrap cursor-pointer"
                  >
                    <HelpCircle className="w-4 h-4 text-cyan-600 shrink-0" />
                    <span>راهنما</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    if (confirm('آیا قصد خروج از حساب کاربری را دارید؟')) {
                      logoutUser();
                    }
                  }}
                  title="خروج از حساب کاربری"
                  className="hidden md:flex px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition border border-slate-200 items-center gap-1 shrink-0 whitespace-nowrap cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>خروج</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {onOpenGuide && (
                  <button
                    onClick={onOpenGuide}
                    title="راهنما و آموزش مکتب‌خانه"
                    className="hidden md:flex px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition border border-slate-200 items-center gap-1 shrink-0 whitespace-nowrap cursor-pointer"
                  >
                    <HelpCircle className="w-4 h-4 text-slate-600 shrink-0" />
                    <span>راهنما</span>
                  </button>
                )}

                <button
                  id="navbar-auth-btn"
                  onClick={onOpenAuth || onOpenLogin || onOpenBaleOtp}
                  className="px-2.5 sm:px-4 py-1.5 sm:py-2.5 text-xs sm:text-sm font-black text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-700 hover:from-emerald-700 hover:to-sky-800 rounded-xl shadow-md shadow-emerald-700/20 transition flex items-center gap-1.5 sm:gap-2 active:scale-95 cursor-pointer whitespace-nowrap"
                  title="ورود و ثبت‌نام با پیام‌رسان بله"
                >
                  <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-200 shrink-0" />
                  <span className="font-extrabold">ورود و ثبت‌نام</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Grid (2 Rows of 4 Items with distinct touch borders) */}
        <div className="lg:hidden grid grid-cols-4 gap-1.5 sm:gap-2 py-2 px-1 border-t border-slate-200 bg-slate-50/70">
          {/* Row 1 - Item 1: Library */}
          <button
            onClick={() => setActiveTab('library')}
            className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl border text-xs font-bold transition shadow-2xs active:scale-95 ${
              activeTab === 'library'
                ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <BookOpen className={`w-5 h-5 ${activeTab === 'library' ? 'text-white' : 'text-cyan-600'}`} />
            <span className="text-[10px] sm:text-[11px] leading-tight font-extrabold">کتابخانه</span>
          </button>

          {/* Row 1 - Item 2: League */}
          <button
            onClick={() => setActiveTab('league')}
            className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl border text-xs font-bold transition shadow-2xs active:scale-95 ${
              activeTab === 'league'
                ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm font-black'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Trophy className={`w-5 h-5 ${activeTab === 'league' ? 'text-slate-950' : 'text-amber-500'}`} />
            <span className="text-[10px] sm:text-[11px] leading-tight font-extrabold">لیگ کتابخوانی</span>
          </button>

          {/* Row 1 - Item 3: Benefits */}
          <button
            onClick={() => setActiveTab('benefits')}
            className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl border text-xs font-bold transition shadow-2xs active:scale-95 ${
              activeTab === 'benefits'
                ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Sparkles className={`w-5 h-5 ${activeTab === 'benefits' ? 'text-white' : 'text-orange-500'}`} />
            <span className="text-[10px] sm:text-[11px] leading-tight font-extrabold">مزایای مکتب خونه</span>
          </button>

          {/* Row 1 - Item 4: Rules */}
          <button
            onClick={() => setActiveTab('rules')}
            className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl border text-xs font-bold transition shadow-2xs active:scale-95 ${
              activeTab === 'rules'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className={`w-5 h-5 ${activeTab === 'rules' ? 'text-white' : 'text-emerald-600'}`} />
            <span className="text-[10px] sm:text-[11px] leading-tight font-extrabold">قوانین مکتب خونه</span>
          </button>

          {/* Row 2: Only for logged-in users with personal tabs */}
          {currentUser && (
            <>
              {/* Item 5: My Bookshelf */}
              <button
                onClick={() => setActiveTab('my_books')}
                className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl border text-xs font-bold transition shadow-2xs active:scale-95 ${
                  activeTab === 'my_books'
                    ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <BookPlus className={`w-5 h-5 ${activeTab === 'my_books' ? 'text-white' : 'text-cyan-600'}`} />
                <span className="text-[10px] sm:text-[11px] leading-tight font-extrabold">طاقچه من</span>
              </button>

              {/* Item 6: Requests */}
              <button
                onClick={() => setActiveTab('requests')}
                className={`relative flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl border text-xs font-bold transition shadow-2xs active:scale-95 ${
                  activeTab === 'requests'
                    ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <ArrowLeftRight className={`w-5 h-5 ${activeTab === 'requests' ? 'text-white' : 'text-cyan-600'}`} />
                <span className="text-[10px] sm:text-[11px] leading-tight font-extrabold">درخواست‌ها</span>
                {pendingRequestsForMe > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 text-white text-[9px] flex items-center justify-center font-bold animate-pulse">
                    {pendingRequestsForMe}
                  </span>
                )}
              </button>

              {/* Item 7: Profile */}
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl border text-xs font-bold transition shadow-2xs active:scale-95 ${
                  activeTab === 'profile'
                    ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <UserIcon className={`w-5 h-5 ${activeTab === 'profile' ? 'text-white' : 'text-cyan-600'}`} />
                <span className="text-[10px] sm:text-[11px] leading-tight font-extrabold">پروفایل من</span>
              </button>

              {/* Item 8: Admin or Logout */}
              {(currentUser?.role === 'admin' || currentUser?.id === 'user_admin') ? (
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`relative flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl border text-xs font-bold transition shadow-2xs active:scale-95 ${
                    activeTab === 'admin'
                      ? 'bg-slate-900 text-amber-300 border-slate-900 shadow-sm'
                      : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                  }`}
                >
                  <ShieldAlert className="w-5 h-5 text-amber-500" />
                  <span className="text-[10px] sm:text-[11px] leading-tight font-extrabold">مدیریت</span>
                  {pendingApprovalsForAdmin > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[9px] flex items-center justify-center font-bold">
                      {pendingApprovalsForAdmin}
                    </span>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (confirm('آیا قصد خروج از حساب کاربری را دارید؟')) {
                      logoutUser();
                    }
                  }}
                  className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl border border-rose-200 bg-rose-50/90 text-rose-800 text-xs font-black transition shadow-2xs active:scale-95 cursor-pointer"
                  title="خروج از حساب"
                >
                  <LogOut className="w-5 h-5 text-rose-600" />
                  <span className="text-[10px] sm:text-[11px] leading-tight font-extrabold">خروج</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};
