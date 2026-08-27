import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AddBookModal } from './AddBookModal';
import { EditProfileModal } from './EditProfileModal';
import { BookCard } from './BookCard';
import { Book } from '../types';
import { MaktabKhanehHouseLogo, SloganBadge } from './MaktabKhanehBranding';
import {
  User,
  BookPlus,
  BookOpen,
  Award,
  Phone,
  CheckCircle2,
  Trash2,
  Clock,
  Sparkles,
  Edit3,
  LogOut,
  Library,
  Star
} from 'lucide-react';

interface MyBooksAndProfileProps {
  onSelectBook: (book: Book) => void;
  onRequestLoan: (bookId: string) => void;
}

export const MyBooksAndProfile: React.FC<MyBooksAndProfileProps> = ({
  onSelectBook,
  onRequestLoan
}) => {
  const { currentUser, books, deleteBook, deleteUser, logoutUser } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  if (!currentUser) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-lg mx-auto my-12 space-y-4 shadow-sm">
        <User className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="font-bold text-slate-800 text-lg">لطفاً وارد حساب کاربری خود شوید</h3>
        <p className="text-xs text-slate-500">
          برای مشاهده طاقچه شخصی، کتاب‌ها و مدیریت پروفایل خود وارد شوید.
        </p>
      </div>
    );
  }

  const myBooks = books.filter((b) => b.ownerId === currentUser.id);
  const isAdmin = currentUser.role === 'admin' || currentUser.id.startsWith('u_admin_');

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner: Bookshelf Header (طاقچه شخصی من) */}
      <div className="bg-gradient-to-r from-cyan-900 via-sky-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border-2 border-cyan-500/30 relative overflow-hidden">
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-cyan-400/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          {/* Left Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-amber-400 text-slate-950 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1 shadow-xs">
                <span>📚</span>
                <span>طاقچه اختصاصی شما</span>
              </span>
              <span className="text-xs text-cyan-200 font-bold bg-white/10 px-3 py-1 rounded-full">
                {myBooks.length} جلد کتاب ثبت‌شده
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-['Lalezar',cursive] text-amber-300 tracking-wide leading-tight">
              طاقچه شخصی و کتاب‌های من
            </h1>

            <p className="text-xs sm:text-sm text-cyan-100 max-w-xl leading-relaxed font-medium">
              در این بخش می‌توانید کتاب‌های موجود در طاقچه خود را مشاهده کنید، کتاب‌های جدید برای اشتراک‌گذاری با دوستان بیافزایید یا اطلاعات کتاب‌ها را ویرایش کنید.
            </p>
          </div>

          {/* Prominent Large Add Book Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 px-6 py-3.5 rounded-2xl text-sm font-black shadow-lg shadow-amber-500/30 hover:scale-[1.02] active:scale-95 transition flex items-center justify-center gap-2.5"
            >
              <BookPlus className="w-5 h-5 text-slate-950" />
              <span>+ افزودن کتاب جدید به طاقچه</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Books Grid (طاقچه کتاب‌ها) - Placed FIRST and PROMINENTLY */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold">
              <Library className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                کتاب‌های موجود در طاقچه شما ({myBooks.length} جلد)
              </h2>
              <p className="text-xs text-slate-500">
                کتاب‌هایی که برای امانت به دوستان و همکلاسی‌های خود معرفی کرده‌اید
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="text-xs font-black text-cyan-800 bg-cyan-50 hover:bg-cyan-100 px-4 py-2.5 rounded-xl border border-cyan-200 transition flex items-center gap-1.5 shadow-2xs"
          >
            <BookPlus className="w-4 h-4 text-cyan-600" />
            <span>افزودن کتاب دیگر</span>
          </button>
        </div>

        {myBooks.length === 0 ? (
          <div className="rounded-3xl p-10 text-center border-2 border-dashed border-slate-200 space-y-4 bg-slate-50/50">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto text-2xl shadow-inner">
              📖
            </div>
            <div className="space-y-1">
              <h4 className="font-black text-slate-800 text-base">طاقچه شما هنوز خالی است!</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                با افزودن حداقل ۳ الی ۵ جلد از کتاب‌های خوانده‌شده‌تان به طاقچه، به همکلاسی‌هایتان کتاب امانت دهید و در لیگ کتابخوانی مدال بگیرید.
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-black text-xs rounded-xl shadow-md shadow-cyan-600/20 transition inline-flex items-center gap-2"
            >
              <BookPlus className="w-4 h-4" />
              <span>افزودن اولین کتاب به طاقچه</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
            {myBooks.map((book) => (
              <div key={book.id} className="relative group">
                <BookCard
                  book={book}
                  onSelect={onSelectBook}
                  onRequestLoan={onRequestLoan}
                />
                {/* Delete button overlay */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`آیا از حذف کتاب «${book.title}» از طاقچه اطمینان دارید؟`)) {
                      deleteBook(book.id);
                    }
                  }}
                  title="حذف کتاب از طاقچه"
                  className="absolute top-2 left-2 z-10 w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-md hover:bg-rose-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Profile & Compact Info Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-5 border-b border-slate-100">
          {/* User Info with Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover ring-3 ring-cyan-500 shadow-sm"
              />
              {isAdmin && (
                <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-400 text-slate-950 rounded-full flex items-center justify-center text-xs shadow-xs">
                  👑
                </span>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-black text-slate-900">{currentUser.name}</h3>
                {isAdmin ? (
                  <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <span>👑</span>
                    <span>مدیر و راهبر مکتب‌خانه</span>
                  </span>
                ) : (
                  <span className="bg-cyan-100 text-cyan-900 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                    کلاس {currentUser.className}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {currentUser.phone}
                </span>
                <span>•</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> عضو رسمی
                </span>
              </p>
            </div>
          </div>

          {/* Action Buttons: Edit Profile, Delete Account & Logout */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setShowEditProfileModal(true)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black rounded-xl transition flex items-center gap-1.5 border border-slate-200 shadow-2xs"
            >
              <Edit3 className="w-3.5 h-3.5 text-cyan-700" />
              <span>ویرایش مشخصات و آواتار</span>
            </button>

            {!isAdmin && (
              <button
                onClick={async () => {
                  const confirmed = window.confirm(
                    'آیا از حذف حساب کاربری خود مطمئن هستید؟ با این کار تمام کتاب‌ها، نظرات و سوابق امانت شما به‌طور کامل حذف خواهد شد.'
                  );
                  if (confirmed) {
                    const res = await deleteUser(currentUser.id);
                    if (!res.success) {
                      alert(res.message || 'خطا در حذف حساب کاربری');
                    }
                  }
                }}
                title="حذف کامل حساب کاربری"
                className="px-3 py-2.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 border border-slate-200 hover:border-rose-200"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>حذف حساب</span>
              </button>
            )}

            <button
              onClick={() => {
                if (confirm('آیا قصد خروج از حساب کاربری را دارید؟')) {
                  logoutUser();
                }
              }}
              title="خروج از حساب کاربری"
              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-black rounded-xl transition flex items-center gap-1.5 border border-rose-200 shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span>خروج از حساب</span>
            </button>
          </div>
        </div>

        {/* Compact Stats and Medals Summary (Clean & Minimalist) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 block">کتاب‌های طاقچه:</span>
            <span className="text-lg font-black text-slate-800">{myBooks.length} جلد</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 block">کتاب‌های خوانده‌شده:</span>
            <span className="text-lg font-black text-slate-800">{currentUser.booksReadCount || 0} جلد</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 block">امتیاز رضایت:</span>
            <span className="text-lg font-black text-amber-600 flex items-center gap-1">
              ⭐ {currentUser.rating || 5.0}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 block">افتخارات و نشان‌ها:</span>
            <span className="text-lg font-black text-indigo-700">
              {(currentUser.medals || []).length} نشان
            </span>
          </div>
        </div>

        {/* Compact Badges Row */}
        {(currentUser.medals && currentUser.medals.length > 0) && (
          <div className="pt-2 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-500" /> نشان‌های فعال:
            </span>
            {currentUser.medals.map((medal) => (
              <div
                key={medal.id}
                className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold flex items-center gap-1 ${medal.color}`}
              >
                <span>{medal.icon}</span>
                <span>{medal.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Book Modal */}
      {showAddModal && <AddBookModal onClose={() => setShowAddModal(false)} />}

      {/* Edit Profile & Avatar Modal */}
      {showEditProfileModal && (
        <EditProfileModal onClose={() => setShowEditProfileModal(false)} />
      )}
    </div>
  );
};
