import React, { useState, useEffect, useMemo } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { MainLibrary } from './components/MainLibrary';
import { BookDetailModal } from './components/BookDetailModal';
import { MyBooksAndProfile } from './components/MyBooksAndProfile';
import { LendingRequests } from './components/LendingRequests';
import { ReadingLeague } from './components/ReadingLeague';
import { SiteRulesPage } from './components/SiteRulesPage';
import { SiteBenefitsSection } from './components/SiteBenefitsSection';
import { AdminPanel } from './components/AdminPanel';
import { BaleOtpModal } from './components/BaleOtpModal';
import { CompleteProfileModal } from './components/CompleteProfileModal';
import { SystemGuideModal } from './components/SystemGuideModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { FreeLoanCelebrationModal } from './components/FreeLoanCelebrationModal';
import { NotFoundPage } from './components/NotFoundPage';
import { Book } from './types';
import { CheckCircle2, AlertCircle, Heart, BookOpen, ShieldCheck, Terminal, HelpCircle, Clock, AlertTriangle, Send, Gift, Sparkles, X } from 'lucide-react';
import { houseLogoImg } from './components/MaktabKhanehBranding';
import { APP_VERSION, APP_BUILD_DATE } from './version';
import { api } from './services/api';
import { analyticsTracker } from './services/analyticsTracker';

const VALID_TABS = new Set([
  'library',
  'league',
  'benefits',
  'rules',
  'my_books',
  'my-books',
  'requests',
  'profile',
  'admin'
]);

function checkIs404Route(booksList: Book[], isLoadingData: boolean): { is404: boolean; matchedTab?: string; targetBook?: Book } {
  try {
    const pathname = window.location.pathname.replace(/\/$/, '') || '/';
    const rawHash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
    const searchParams = new URLSearchParams(window.location.search);
    const tabParam = (searchParams.get('tab') || searchParams.get('page') || '').toLowerCase();
    const bookIdParam = searchParams.get('book');

    // Explicit 404
    if (pathname === '/404' || rawHash === '404' || tabParam === '404') {
      return { is404: true };
    }

    // Check pathname
    const cleanPath = pathname.toLowerCase();
    const isRootPath = cleanPath === '/' || cleanPath === '' || cleanPath === '/index.html';

    let resolvedTab: string | undefined = undefined;

    if (!isRootPath) {
      const pathTab = cleanPath.replace(/^\//, '');
      if (VALID_TABS.has(pathTab)) {
        resolvedTab = pathTab === 'my-books' ? 'my_books' : pathTab;
      } else {
        // Unknown path segment (e.g. /broken-url, /test, /panel)
        return { is404: true };
      }
    }

    // Check hash if present
    if (rawHash && rawHash !== 'guide' && rawHash !== 'auth') {
      if (VALID_TABS.has(rawHash)) {
        resolvedTab = rawHash === 'my-books' ? 'my_books' : rawHash;
      } else {
        return { is404: true };
      }
    }

    // Check tabParam if present
    if (tabParam) {
      if (VALID_TABS.has(tabParam)) {
        resolvedTab = tabParam === 'my-books' ? 'my_books' : tabParam;
      } else {
        return { is404: true };
      }
    }

    // Check book deep link if present
    if (bookIdParam) {
      if (!isLoadingData && booksList.length > 0) {
        const foundBook = booksList.find((b) => b.id === bookIdParam);
        if (foundBook) {
          return { is404: false, matchedTab: 'library', targetBook: foundBook };
        } else {
          // Specified a book ID that does not exist -> 404!
          return { is404: true };
        }
      }
    }

    return { is404: false, matchedTab: resolvedTab };
  } catch {
    return { is404: false };
  }
}

function MainAppContent() {
  const {
    requestBookLoan,
    currentUser,
    resetToDefaults,
    books,
    notifications,
    markNotificationRead,
    clearNotifications,
    requests,
    isLoading
  } = useApp();
  const [activeTab, setActiveTab] = useState<string>('library');
  const [selectedBookForDetail, setSelectedBookForDetail] = useState<Book | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  const borrowedBooksCountdowns = useMemo(() => {
    if (!currentUser) return [];
    return requests
      .filter((r) => r.borrowerId === currentUser.id && r.status === 'handover_confirmed')
      .map((r) => {
        const now = Date.now();
        let ts = r.dueDateTimestamp;
        if (!ts) {
          ts = Date.now() + 4 * 24 * 60 * 60 * 1000;
        }
        const diffMs = ts - now;
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        const hoursLeft = Math.ceil(diffMs / (1000 * 60 * 60));

        return {
          request: r,
          daysLeft: diffDays,
          hoursLeft: hoursLeft,
          isOverdue: diffMs < 0,
        };
      });
  }, [requests, currentUser]);

  const isProfileIncomplete =
    currentUser &&
    currentUser.role !== 'admin' &&
    (!currentUser.name || currentUser.name.startsWith('کاربر بله'));

  // Global Error Listener for Admin System Logs
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      api.reportError(
        `خطای کلاینت: ${event.message}`,
        `${event.filename}:${event.lineno}:${event.colno}\n${event.error?.stack || ''}`,
        'error',
        currentUser || undefined
      );
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      api.reportError(
        `خطای پرامیس درمانده (Unhandled Rejection)`,
        typeof reason === 'object' ? JSON.stringify(reason) : String(reason),
        'error',
        currentUser || undefined
      );
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [currentUser]);

  // Ultra-lightweight session heartbeat & tracking for admin monitoring
  useEffect(() => {
    analyticsTracker.startHeartbeat({
      userId: currentUser?.id,
      userName: currentUser?.name,
      userRole: currentUser?.role,
      currentPath: activeTab
    });

    return () => analyticsTracker.stopHeartbeat();
  }, [currentUser?.id, currentUser?.name, currentUser?.role, activeTab]);

  const [is404Route, setIs404Route] = useState<boolean>(() => {
    const res = checkIs404Route([], true);
    return res.is404;
  });

  // Evaluate URL on load, route change, or when books load
  useEffect(() => {
    const evaluateRoute = () => {
      const { is404, matchedTab, targetBook } = checkIs404Route(books, isLoading);
      setIs404Route(is404);
      if (targetBook) {
        setSelectedBookForDetail(targetBook);
      }
      if (matchedTab) {
        setActiveTab(matchedTab);
      }
    };

    evaluateRoute();

    window.addEventListener('popstate', evaluateRoute);
    window.addEventListener('hashchange', evaluateRoute);
    return () => {
      window.removeEventListener('popstate', evaluateRoute);
      window.removeEventListener('hashchange', evaluateRoute);
    };
  }, [books, isLoading]);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [lendingRequestsSubTab, setLendingRequestsSubTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [loanSuccessModal, setLoanSuccessModal] = useState<{
    bookTitle: string;
    bookCover: string;
    ownerName: string;
    ownerClass: string;
    isFreeLoan?: boolean;
    freeEventTitle?: string;
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleRequestLoan = async (
    bookId: string,
    options?: { useFreeLoan?: boolean; freeEventTitle?: string; freeEventId?: string }
  ) => {
    if (!currentUser) {
      setShowAuthModal(true);
      showToast('جهت ثبت درخواست امانت ابتدا باید وارد حساب کاربری شوید.', 'error');
      return;
    }

    const targetBook = books.find((b) => b.id === bookId);
    const res = await requestBookLoan(bookId, options);
    if (res.success) {
      setSelectedBookForDetail(null);
      // Directly redirect specifically to "My Requested Books" (outgoing tab)
      setLendingRequestsSubTab('outgoing');
      setActiveTab('requests');

      // Open the large, prominent success notification modal
      setLoanSuccessModal({
        bookTitle: targetBook?.title || 'کتاب درخواستی',
        bookCover: targetBook?.coverImage || '',
        ownerName: targetBook?.ownerName || 'همکلاسی',
        ownerClass: targetBook?.ownerClass || '',
        isFreeLoan: options?.useFreeLoan,
        freeEventTitle: options?.freeEventTitle
      });

      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
      if (res.needBooks) {
        setSelectedBookForDetail(null);
        setActiveTab('my_books'); // Switch user to personal shelf to add books
      }
    }
  };

  if (is404Route || activeTab === '404') {
    return (
      <NotFoundPage
        onGoBack={() => {
          setIs404Route(false);
          setActiveTab('library');
          try {
            window.history.pushState(null, '', '/');
          } catch {}
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-['Vazirmatn',sans-serif] dir-rtl">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div
            className={`p-4 rounded-2xl shadow-2xl border flex items-center gap-3 text-xs font-bold max-w-md ${
              toastMessage.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-700'
                : 'bg-rose-900 text-white border-rose-700'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenLogin={() => setShowAuthModal(true)}
        onOpenRegister={() => setShowAuthModal(true)}
        onOpenPrintModal={() => setActiveTab('league')}
        onOpenGuide={() => setShowGuideModal(true)}
        onOpenNotifications={() => setShowNotifications(true)}
      />

      {/* Account Suspended Notice Banner */}
      {currentUser && currentUser.status === 'suspended' && (
        <div className="bg-rose-600 text-white font-bold text-xs sm:text-sm py-3 px-4 shadow-md flex items-center justify-between flex-wrap gap-2 animate-pulse border-b border-rose-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-white" />
            <span>
              ⛔️ <strong>حساب کاربری شما تعلیق شده است!</strong> به علت: {currentUser.suspensionReason || 'عدم بازگرداندن به موقع کتاب یا گزارش خسارت'}
            </span>
          </div>
          <div className="text-[11px] bg-rose-800 text-white px-3 py-1.5 rounded-xl border border-rose-500">
            📞 جهت فعال‌سازی مجدد، به مسئول کتابخانه مدرسه مراجعه کنید یا با آیدی پشتیبانی تماس بگیرید.
          </div>
        </div>
      )}

      {/* Borrowed Books Countdown Reminder Banners */}
      {currentUser && borrowedBooksCountdowns.length > 0 && (
        <div className="bg-slate-50 border-b border-slate-200 py-3 px-4">
          <div className="max-w-7xl mx-auto flex flex-col gap-2">
            {borrowedBooksCountdowns.map(({ request, daysLeft, hoursLeft, isOverdue }) => {
              if (isOverdue) {
                return (
                  <div key={request.id} className="bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-rose-600 flex items-center justify-center text-white shrink-0">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-black text-xs sm:text-sm">⚠️ مهلت تحویل کتاب «{request.bookTitle}» به پایان رسیده است!</h4>
                        <p className="text-[11px] text-rose-700 mt-0.5">لطفاً هرچه سریع‌تر کتاب را به همکلاسی خود <strong>«{request.ownerName}»</strong> تحویل داده و دکمه عودت را ثبت کنید تا حساب شما معلق نشود.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => { setActiveTab('requests'); }}
                      className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl transition cursor-pointer self-start sm:self-auto shrink-0"
                    >
                      ورود به صفحه امانت‌ها و عودت ➜
                    </button>
                  </div>
                );
              } else if (hoursLeft <= 24) {
                return (
                  <div key={request.id} className="bg-amber-50 border border-amber-200 text-amber-950 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-bounce">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white shrink-0">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-black text-xs sm:text-sm">⏰ هشدار: کمتر از ۲۴ ساعت تا تحویل کتاب «{request.bookTitle}» باقی مانده است!</h4>
                        <p className="text-[11px] text-amber-800 mt-0.5">تنها <strong>{hoursLeft} ساعت</strong> فرصت دارید تا کتاب را به مالک آن ({request.ownerName}) پس دهید.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => { setActiveTab('requests'); }}
                      className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl transition cursor-pointer self-start sm:self-auto shrink-0"
                    >
                      مشاهده جزئیات امانت ➜
                    </button>
                  </div>
                );
              } else if (daysLeft <= 3) {
                return (
                  <div key={request.id} className="bg-amber-50/90 border-2 border-amber-300 text-amber-950 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white shrink-0 shadow-xs">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-black text-xs sm:text-sm">⏳ یادآور مکتب‌خانه: {daysLeft} روز دیگر تا تحویل کتاب «{request.bookTitle}»</h4>
                        <p className="text-[11px] text-amber-800 mt-0.5">موعد بازگرداندن کتاب به مالک («{request.ownerName}»): <strong>{request.dueDate || `${daysLeft} روز دیگر`}</strong></p>
                      </div>
                    </div>
                    <button 
                      onClick={() => { setActiveTab('requests'); }}
                      className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl transition cursor-pointer self-start sm:self-auto shrink-0 shadow-xs"
                    >
                      ورود به صفحه امانت‌ها ➜
                    </button>
                  </div>
                );
              } else {
                return (
                  <div key={request.id} className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border-2 border-emerald-300/80 text-emerald-950 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-black text-xs sm:text-sm">📖 کتاب «{request.bookTitle}» در امانت شماست</h4>
                          <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full shadow-2xs">
                            ⏳ {daysLeft} روز مهلت باقی‌مانده
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-800/90 mt-0.5 font-medium">
                          شما تا <strong>{daysLeft} روز دیگر (تاریخ {request.dueDate || `${daysLeft} روز آینده`})</strong> فرصت مطالعه دارید تا به همکلاسی خود («{request.ownerName}») تحویل دهید.
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => { setActiveTab('requests'); }}
                      className="text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl transition cursor-pointer self-start sm:self-auto shrink-0 shadow-xs"
                    >
                      مشاهده جزئیات امانت ➜
                    </button>
                  </div>
                );
              }
            })}
          </div>
        </div>
      )}

      {/* Mandatory First-Time Complete Profile Modal */}
      {isProfileIncomplete && (
        <CompleteProfileModal
          onClose={() => {}}
          onComplete={() => {
            showToast('اطلاعات عضویت شما با موفقیت تکمیل شد! به مکتب‌خانه خوش آمدید 🎉', 'success');
            setShowGuideModal(true);
          }}
        />
      )}

      {/* Interactive System Guide Modal */}
      {showGuideModal && (
        <SystemGuideModal onClose={() => setShowGuideModal(false)} />
      )}

      {/* Main Body Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'library' && (
          <MainLibrary
            onSelectBook={(book) => setSelectedBookForDetail(book)}
            onRequestLoan={handleRequestLoan}
            onNavigateAddBooks={() => setActiveTab('my_books')}
            onNavigateBenefits={() => setActiveTab('benefits')}
          />
        )}

        {activeTab === 'league' && <ReadingLeague />}

        {activeTab === 'benefits' && (
          <SiteBenefitsSection
            onNavigateLibrary={() => setActiveTab('library')}
            onNavigateRules={() => setActiveTab('rules')}
          />
        )}

        {activeTab === 'rules' && <SiteRulesPage />}

        {activeTab === 'my_books' && (
          <MyBooksAndProfile
            onSelectBook={(book) => setSelectedBookForDetail(book)}
            onRequestLoan={handleRequestLoan}
          />
        )}

        {activeTab === 'requests' && <LendingRequests initialTab={lendingRequestsSubTab} />}

        {activeTab === 'profile' && (
          <MyBooksAndProfile
            onSelectBook={(book) => setSelectedBookForDetail(book)}
            onRequestLoan={handleRequestLoan}
          />
        )}

        {activeTab === 'admin' && <AdminPanel />}
      </main>

      {/* High-Visibility Loan Request Confirmation Modal */}
      {loanSuccessModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-4 border-cyan-400 relative space-y-6 animate-in zoom-in-95 duration-300">
            {/* Close Button */}
            <button
              onClick={() => setLoanSuccessModal(null)}
              className="absolute top-4 left-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header with animated icon */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-cyan-600 via-teal-500 to-emerald-400 rounded-3xl mx-auto flex items-center justify-center text-white shadow-xl shadow-cyan-500/25 rotate-3">
                <Send className="w-8 h-8 sm:w-10 sm:h-10 -mr-1" />
              </div>
              <h3 className="font-black text-slate-900 text-lg sm:text-xl">
                درخواست امانت شما با موفقیت ارسال گردید! 🎉
              </h3>
              <p className="text-xs sm:text-sm text-cyan-800 font-bold bg-cyan-50 py-1.5 px-3 rounded-xl inline-block border border-cyan-200">
                درخواست در بخش «کتاب‌های درخواستی من» ثبت شد
              </p>
            </div>

            {/* Book & Target Details Card */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center gap-4">
              {loanSuccessModal.bookCover && (
                <img
                  src={loanSuccessModal.bookCover}
                  alt={loanSuccessModal.bookTitle}
                  className="w-14 h-20 object-cover rounded-xl shadow-md shrink-0 border border-slate-200"
                />
              )}
              <div className="space-y-1 text-right">
                <span className="text-[11px] font-black text-cyan-700 block">کتاب امانتی:</span>
                <h4 className="font-black text-slate-900 text-base">{loanSuccessModal.bookTitle}</h4>
                <p className="text-xs text-slate-600">
                  ارسال‌شده برای همکلاسی: <strong className="text-slate-900 font-black">{loanSuccessModal.ownerName}</strong> ({loanSuccessModal.ownerClass})
                </p>
              </div>
            </div>

            {/* Status & Next Steps Timeline Box */}
            <div className="bg-amber-50/90 rounded-2xl p-4 border border-amber-300 space-y-3 text-xs text-amber-950">
              <div className="flex items-start gap-2.5">
                <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-black text-amber-900">⏳ مهلت ۴۸ ساعته پاسخگویی صاحب کتاب:</h5>
                  <p className="text-[11px] text-amber-800 leading-relaxed font-medium mt-0.5">
                    مالک کتاب حداکثر <strong>۴۸ ساعت</strong> فرصت دارد تا درخواست را تایید یا رد کند. در صورت عدم پاسخ پس از ۴۸ ساعت، سیستم به صورت خودکار درخواست را لغو و کتاب را آزاد می‌نماید.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 pt-2 border-t border-amber-200/80">
                {loanSuccessModal.isFreeLoan ? (
                  <>
                    <Gift className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-black text-emerald-900">🎁 سهمیه امانت رایگان ایونت اعمال شد:</h5>
                      <p className="text-[11px] text-emerald-800 font-medium mt-0.5">
                        این امانت به عنوان جایزه ایونت {loanSuccessModal.freeEventTitle || 'مکتب‌خانه'} کاملاً رایگان است و نیازی به پرداخت هزینه ۱۰,۰۰۰ تومانی نیست.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-black text-cyan-900">💳 مرحله بعد (پس از تایید):</h5>
                      <p className="text-[11px] text-slate-700 font-medium mt-0.5">
                        به محض اینکه {loanSuccessModal.ownerName} درخواست را تایید کند، بخش پرداخت ۱۰,۰۰۰ تومان کارت‌به‌کارت در تب کتاب‌های درخواستی شما فعال خواهد شد.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2">
              <button
                onClick={() => setLoanSuccessModal(null)}
                className="w-full py-3.5 bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-cyan-600/30 transition transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>مشاهده کتاب‌های درخواستی من ➜</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Book Detail Modal */}
      {selectedBookForDetail && (
        <BookDetailModal
          book={selectedBookForDetail}
          onClose={() => setSelectedBookForDetail(null)}
          onRequestLoan={handleRequestLoan}
        />
      )}

      {/* Auth Modal (Login / Register via Bale) */}
      {showAuthModal && (
        <BaleOtpModal
          onClose={() => setShowAuthModal(false)}
          onSuccessLogin={(phone) => {
            showToast(`خوش آمدید! ورود با شماره ${phone} با موفقیت انجام شد.`, 'success');
          }}
        />
      )}

      {/* Notification Center Modal */}
      {currentUser && (
        <NotificationCenterModal
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
          notifications={notifications}
          onMarkRead={markNotificationRead}
          onClearAll={clearNotifications}
          onNavigateTab={(tab) => {
            setActiveTab(tab);
            setShowNotifications(false);
          }}
        />
      )}

      {/* Joyful Celebration Modal for Free Loan Reward */}
      {currentUser?.pendingFreeLoanReward && (
        <FreeLoanCelebrationModal
          onNavigateToLibrary={() => setActiveTab('library')}
        />
      )}

      {/* Footer */}
      <footer className="no-print bg-slate-900 text-slate-400 py-8 border-t border-slate-800 mt-auto text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-sky-600 to-amber-400 p-0.5 shadow-md overflow-hidden shrink-0">
              <img
                src={houseLogoImg}
                alt="لوگوی مکتب خونه"
                className="w-full h-full object-cover rounded-lg bg-white"
              />
            </div>
            <div>
              <span className="text-white font-black text-sm block">سامانه امانت کتاب «مکتب خونه» 🎒</span>
              <span className="text-[11px] text-cyan-400 font-bold">• هر کتاب، یک سفر • هر امانت، یک اعتماد •</span>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap justify-center">
            <span
              id="app-version-badge"
              className="text-[11px] bg-slate-800 text-cyan-300 font-mono px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1.5"
              title={`تاریخ بیلد: ${APP_BUILD_DATE}`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              نسخه سامانه: v{APP_VERSION} (فاز عملیاتی)
            </span>
            <span>•</span>
            {currentUser?.role !== 'admin' && (
              <>
                <button
                  onClick={() => setShowGuideModal(true)}
                  className="text-xs text-cyan-300 hover:text-cyan-200 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  راهنمای امانت و قوانین
                </button>
                <span>•</span>
              </>
            )}
            <button
              onClick={() => setActiveTab('rules')}
              className="text-xs text-amber-300 hover:text-amber-200 font-bold flex items-center gap-1 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              قوانین و مقررات سایت
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
