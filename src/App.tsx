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
import { Book } from './types';
import { CheckCircle2, AlertCircle, Heart, BookOpen, ShieldCheck, Terminal, HelpCircle, Clock, AlertTriangle } from 'lucide-react';
import { houseLogoImg } from './components/MaktabKhanehBranding';
import { APP_VERSION, APP_BUILD_DATE } from './version';
import { api } from './services/api';

function MainAppContent() {
  const {
    requestBookLoan,
    currentUser,
    resetToDefaults,
    books,
    notifications,
    markNotificationRead,
    clearNotifications,
    requests
  } = useApp();
  const [activeTab, setActiveTab] = useState<string>('library');
  const [selectedBookForDetail, setSelectedBookForDetail] = useState<Book | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  const borrowedBooksCountdowns = useMemo(() => {
    if (!currentUser) return [];
    return requests
      .filter((r) => r.borrowerId === currentUser.id && r.status === 'handover_confirmed')
      .map((r) => {
        const now = Date.now();
        let ts = r.dueDateTimestamp;
        if (!ts) {
          // Fallback if timestamp isn't explicitly set
          ts = Date.now() + 4 * 24 * 60 * 60 * 1000; // 4 days fallback
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

  // Deep Link Handling (e.g. from Bale Channel post ?book=id)
  useEffect(() => {
    if (books && books.length > 0) {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const bookId = urlParams.get('book');
        if (bookId) {
          const targetBook = books.find((b) => b.id === bookId);
          if (targetBook) {
            setSelectedBookForDetail(targetBook);
            setActiveTab('library');
          }
        }
      } catch (err) {
        console.warn('Error reading book deep link param:', err);
      }
    }
  }, [books]);

  // Unified Auth Modal (Login / Register via Bale)
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Guide Modal
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Complete Profile Modal Trigger (Profile completeness: Name check only)
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

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleRequestLoan = async (bookId: string) => {
    if (!currentUser) {
      setShowAuthModal(true);
      showToast('جهت ثبت درخواست امانت ابتدا باید وارد حساب کاربری شوید.', 'error');
      return;
    }

    const res = await requestBookLoan(bookId);
    if (res.success) {
      showToast(res.message, 'success');
      setSelectedBookForDetail(null);
      setActiveTab('requests'); // Switch to requests tab so user sees their active request!
    } else {
      showToast(res.message, 'error');
      if (res.needBooks) {
        setSelectedBookForDetail(null);
        setActiveTab('my_books'); // Switch user to personal shelf to add books
      }
    }
  };

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
                  <div key={request.id} className="bg-cyan-50 border border-cyan-200 text-cyan-950 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-cyan-600 flex items-center justify-center text-white shrink-0">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-black text-xs sm:text-sm">📅 روزشمار تحویل: {daysLeft} روز دیگر تا تحویل کتاب «{request.bookTitle}»</h4>
                        <p className="text-[11px] text-cyan-800 mt-0.5">مهلت عودت کتاب شما تا تاریخ <strong>{request.dueDate}</strong> است.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => { setActiveTab('requests'); }}
                      className="text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-xl transition cursor-pointer self-start sm:self-auto shrink-0"
                    >
                      ورود به صفحه امانت‌ها ➜
                    </button>
                  </div>
                );
              }
              return null;
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

        {activeTab === 'requests' && <LendingRequests />}

        {activeTab === 'profile' && (
          <MyBooksAndProfile
            onSelectBook={(book) => setSelectedBookForDetail(book)}
            onRequestLoan={handleRequestLoan}
          />
        )}

        {activeTab === 'admin' && <AdminPanel />}
      </main>

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
