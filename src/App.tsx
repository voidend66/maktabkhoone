import React, { useState } from 'react';
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
import { Book } from './types';
import { CheckCircle2, AlertCircle, Heart, BookOpen, ShieldCheck, Terminal, HelpCircle } from 'lucide-react';
import { houseLogoImg } from './components/MaktabKhanehBranding';
import { APP_VERSION, APP_BUILD_DATE } from './version';

function MainAppContent() {
  const { requestBookLoan, currentUser, systemConfig, resetToDefaults } = useApp();
  const [activeTab, setActiveTab] = useState<string>('library');
  const [selectedBookForDetail, setSelectedBookForDetail] = useState<Book | null>(null);

  // Unified Auth Modal (Login / Register via Bale)
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Guide Modal
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Complete Profile Modal Trigger
  const minRequiredBooks = systemConfig?.minBooksForRegistration ?? 0;
  const isProfileIncomplete =
    currentUser &&
    currentUser.role !== 'admin' &&
    (currentUser.name.startsWith('کاربر بله') ||
      (minRequiredBooks > 0 && currentUser.booksContributedCount < minRequiredBooks));

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleRequestLoan = (bookId: string) => {
    if (!currentUser) {
      setShowAuthModal(true);
      showToast('جهت ثبت درخواست امانت ابتدا باید وارد حساب کاربری شوید.', 'error');
      return;
    }

    const res = requestBookLoan(bookId);
    if (res.success) {
      showToast(res.message, 'success');
      setSelectedBookForDetail(null);
      setActiveTab('requests'); // Switch to requests tab so user sees their active request!
    } else {
      showToast(res.message, 'error');
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
      />

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
            <button
              onClick={() => setShowGuideModal(true)}
              className="text-xs text-cyan-300 hover:text-cyan-200 font-bold flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              راهنمای امانت و قوانین
            </button>
            <span>•</span>
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
