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
  HelpCircle
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAuth?: () => void;
  onOpenLogin?: () => void;
  onOpenRegister?: () => void;
  onOpenPrintModal?: () => void;
  onOpenBaleOtp?: () => void;
  onOpenGuide?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAuth,
  onOpenLogin,
  onOpenRegister,
  onOpenPrintModal,
  onOpenBaleOtp,
  onOpenGuide
}) => {
  const { currentUser, setCurrentUser, logoutUser, users, switchUserRoleDemo, requests } = useApp();

  // Count pending requests for current user
  const pendingRequestsForMe = currentUser
    ? requests.filter(
        (r) =>
          (r.ownerId === currentUser.id && r.status === 'pending') ||
          (r.borrowerId === currentUser.id && r.status === 'accepted')
      ).length
    : 0;

  const pendingApprovalsForAdmin = users.filter((u) => u.status === 'pending').length;

  return (
    <header className="relative lg:sticky lg:top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2 sm:py-3 gap-2 sm:gap-4">
          {/* Prominent Logo & Brand Title */}
          <div
            className="flex items-center gap-2 sm:gap-3.5 cursor-pointer group py-0.5"
            onClick={() => setActiveTab('library')}
          >
            <MaktabKhanehLogo size="lg" showSlogan={true} />
          </div>

          {/* Navigation Items */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('library')}
              className={`px-3.5 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition ${
                activeTab === 'library'
                  ? 'bg-cyan-50 text-cyan-800 border border-cyan-200 shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4.5 h-4.5 text-cyan-600" />
              کتابخانه اصلی
            </button>

            <button
              onClick={() => setActiveTab('league')}
              className={`px-3.5 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition ${
                activeTab === 'league'
                  ? 'bg-amber-50 text-amber-900 border border-amber-200 shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Trophy className="w-4.5 h-4.5 text-amber-500" />
              لیگ کتابخوانی
            </button>

            {/* Features & Benefits Tab */}
            <button
              onClick={() => setActiveTab('benefits')}
              className={`px-3.5 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition ${
                activeTab === 'benefits'
                  ? 'bg-orange-50 text-orange-900 border border-orange-200 shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-4.5 h-4.5 text-orange-500" />
              مزایای مکتب خونه
            </button>

            {/* Top Site Rules Tab */}
            <button
              onClick={() => setActiveTab('rules')}
              className={`px-3.5 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition ${
                activeTab === 'rules'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-600" />
              قوانین مکتب خونه
            </button>

            {currentUser && (
              <>
                <button
                  onClick={() => setActiveTab('my_books')}
                  className={`px-3.5 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition ${
                    activeTab === 'my_books'
                      ? 'bg-cyan-50 text-cyan-800 border border-cyan-200 shadow-2xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <BookPlus className="w-4.5 h-4.5 text-cyan-600" />
                  طاقچه شخصی
                </button>

                <button
                  onClick={() => setActiveTab('requests')}
                  className={`relative px-3.5 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition ${
                    activeTab === 'requests'
                      ? 'bg-cyan-50 text-cyan-800 border border-cyan-200 shadow-2xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <ArrowLeftRight className="w-4.5 h-4.5 text-cyan-600" />
                  درخواست‌ها & امانت‌ها
                  {pendingRequestsForMe > 0 && (
                    <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[11px] flex items-center justify-center font-bold animate-pulse">
                      {pendingRequestsForMe}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('profile')}
                  className={`px-3.5 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition ${
                    activeTab === 'profile'
                      ? 'bg-cyan-50 text-cyan-800 border border-cyan-200 shadow-2xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <UserIcon className="w-4.5 h-4.5 text-cyan-600" />
                  پروفایل شخصی
                </button>
              </>
            )}

            {(currentUser?.role === 'admin' || currentUser?.id === 'user_admin') && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`relative px-3.5 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition ${
                  activeTab === 'admin'
                    ? 'bg-cyan-700 text-white shadow-md shadow-cyan-900/20'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <ShieldAlert className="w-4.5 h-4.5 text-amber-300" />
                پنل مدیریت
                {pendingApprovalsForAdmin > 0 && (
                  <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 text-xs flex items-center justify-center font-bold">
                    {pendingApprovalsForAdmin}
                  </span>
                )}
              </button>
            )}
          </nav>

          {/* User Auth Buttons & Profile Badge */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {currentUser ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div
                  onClick={() => setActiveTab('profile')}
                  className="flex items-center gap-2 bg-slate-100/90 hover:bg-slate-200/90 p-1 sm:p-1.5 pr-2 sm:pr-2.5 rounded-xl sm:rounded-2xl cursor-pointer transition border border-slate-200 max-w-[170px] sm:max-w-[240px]"
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl object-cover ring-2 ring-cyan-500 shadow-xs shrink-0"
                  />
                  <div className="text-right min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-xs sm:text-sm font-black text-slate-900 truncate block">
                        {currentUser.name}
                      </span>
                      {currentUser.status === 'pending' ? (
                        <span className="hidden md:inline-flex items-center gap-0.5 text-[9px] text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-full font-bold shrink-0 whitespace-nowrap">
                          <Clock className="w-2.5 h-2.5" />
                          در انتظار
                        </span>
                      ) : (
                        <span className="hidden md:inline-flex items-center gap-0.5 text-[9px] text-cyan-800 bg-cyan-100 px-1.5 py-0.5 rounded-full font-bold shrink-0 whitespace-nowrap">
                          <CheckCircle2 className="w-2.5 h-2.5 text-cyan-600" />
                          عضو
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-cyan-700 font-bold leading-none mt-0.5 truncate block">
                      {currentUser.className}
                    </div>
                  </div>
                </div>

                {onOpenGuide && (
                  <button
                    onClick={onOpenGuide}
                    title="راهنما و آموزش مکتب‌خانه"
                    className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-bold text-cyan-800 bg-cyan-50 hover:bg-cyan-100 rounded-xl transition border border-cyan-200 flex items-center gap-1 shrink-0 whitespace-nowrap cursor-pointer"
                  >
                    <HelpCircle className="w-4 h-4 text-cyan-600 shrink-0" />
                    <span className="hidden md:inline">راهنمای سامانه</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    if (confirm('آیا قصد خروج از حساب کاربری را دارید؟')) {
                      logoutUser();
                    }
                  }}
                  title="خروج از حساب کاربری"
                  className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition border border-slate-200 flex items-center gap-1 shrink-0 whitespace-nowrap cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="hidden sm:inline">خروج</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {onOpenGuide && (
                  <button
                    onClick={onOpenGuide}
                    title="راهنما و آموزش مکتب‌خانه"
                    className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition border border-slate-200 flex items-center gap-1 shrink-0 whitespace-nowrap cursor-pointer"
                  >
                    <HelpCircle className="w-4 h-4 text-slate-600 shrink-0" />
                    <span className="hidden md:inline">راهنما</span>
                  </button>
                )}

                <button
                  id="navbar-auth-btn"
                  onClick={onOpenAuth || onOpenLogin || onOpenBaleOtp}
                  className="px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-black text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-700 hover:from-emerald-700 hover:to-sky-800 rounded-xl shadow-md shadow-emerald-700/20 transition flex items-center gap-2 active:scale-95 cursor-pointer whitespace-nowrap"
                  title="ورود و ثبت‌نام با پیام‌رسان بله"
                >
                  <LogIn className="w-4 h-4 text-emerald-200 shrink-0" />
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

          {/* Row 2: 4 items depending on user state */}
          {currentUser ? (
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

              {/* Item 8: Admin or Login */}
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
          ) : (
            <>
              {/* Row 2 for Guest Users */}
              <button
                onClick={onOpenLogin}
                className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl border border-cyan-300 bg-cyan-50/90 text-cyan-900 text-xs font-black transition shadow-2xs active:scale-95"
              >
                <LogIn className="w-5 h-5 text-cyan-600" />
                <span className="text-[10px] sm:text-[11px] leading-tight font-extrabold">ورود دانش‌آموز</span>
              </button>

              <button
                onClick={onOpenRegister}
                className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl border border-amber-300 bg-amber-50/90 text-amber-950 text-xs font-black transition shadow-2xs active:scale-95"
              >
                <UserPlus className="w-5 h-5 text-amber-600" />
                <span className="text-[10px] sm:text-[11px] leading-tight font-extrabold">ثبت‌نام جدید</span>
              </button>

              <button
                onClick={() => setActiveTab('library')}
                className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold transition shadow-2xs active:scale-95"
              >
                <BookOpen className="w-5 h-5 text-slate-500" />
                <span className="text-[10px] sm:text-[11px] leading-tight font-extrabold">جستجو کتاب</span>
              </button>

              <button
                onClick={() => setActiveTab('rules')}
                className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl border border-emerald-300 bg-emerald-50/90 text-emerald-900 text-xs font-bold transition shadow-2xs active:scale-95"
              >
                <HelpCircle className="w-5 h-5 text-emerald-600" />
                <span className="text-[10px] sm:text-[11px] leading-tight font-extrabold">راهنمای امانت</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
