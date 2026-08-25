import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AddBookModal } from './AddBookModal';
import { BookCard } from './BookCard';
import { Book } from '../types';
import { MaktabKhanehHouseLogo, SloganBadge } from './MaktabKhanehBranding';
import {
  User,
  BookPlus,
  BookOpen,
  Star,
  Award,
  Phone,
  Calendar,
  CheckCircle2,
  Trash2,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface MyBooksAndProfileProps {
  onSelectBook: (book: Book) => void;
  onRequestLoan: (bookId: string) => void;
}

export const MyBooksAndProfile: React.FC<MyBooksAndProfileProps> = ({
  onSelectBook,
  onRequestLoan
}) => {
  const { currentUser, books, deleteBook } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);

  if (!currentUser) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-lg mx-auto my-12 space-y-4">
        <User className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="font-bold text-slate-800 text-lg">لطفاً وارد حساب کاربری خود شوید</h3>
        <p className="text-xs text-slate-500">
          برای مشاهده کتاب‌های شخصی، مدال‌ها و اطلاعات حساب کاربری وارد شوید.
        </p>
      </div>
    );
  }

  const myBooks = books.filter((b) => b.ownerId === currentUser.id);

  return (
    <div className="space-y-8 pb-12">
      {/* Student Profile Card Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs relative overflow-hidden space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-6">
          <div className="flex items-center gap-5">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover ring-4 ring-cyan-500 shadow-md"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900">{currentUser.name}</h1>
                <span className="bg-cyan-100 text-cyan-900 text-xs font-bold px-3 py-1 rounded-full">
                  کلاس {currentUser.className} 🎒
                </span>
              </div>

              <p className="text-xs text-slate-500 flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {currentUser.phone}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-bold text-cyan-700">
                  عضو مکتب خونه
                </span>
              </p>
              <SloganBadge className="mt-2" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <MaktabKhanehHouseLogo size="sm" />
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-3 rounded-2xl text-xs font-bold shadow-lg shadow-cyan-600/20 transition flex items-center gap-2"
            >
              <BookPlus className="w-4 h-4" />
              <span>+ افزودن کتاب جدید به کتابخانه</span>
            </button>
          </div>
        </div>

        {/* Status Notice */}
        <div className="pt-1">
          {currentUser.status === 'approved' ? (
            <span className="inline-flex items-center gap-1 bg-cyan-50 text-cyan-800 text-xs px-3 py-1.5 rounded-xl font-bold border border-cyan-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" /> حساب کاربری شما در مکتب‌خانه تایید شده است.
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 text-xs px-3 py-1.5 rounded-xl font-bold border border-amber-200">
              <Clock className="w-3.5 h-3.5 text-amber-600" /> حساب کاربری شما در انتظار تایید است.
            </span>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 block">کتاب‌های معرفی‌شده من:</span>
              <span className="text-2xl font-black text-slate-900">
                {myBooks.length} جلد
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              📚
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 block">کتاب‌های خوانده‌شده من:</span>
              <span className="text-2xl font-black text-slate-900">
                {currentUser.booksReadCount} جلد
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              📖
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 block">معدل رضایت دیگران (از ۵):</span>
              <span className="text-2xl font-black text-slate-900 flex items-center gap-1">
                ⭐ {currentUser.rating}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              🏆
            </div>
          </div>
        </div>

        {/* Medals & Badges Section */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-500" />
            <span>مدال‌ها و افتخارات کسب‌شده دانش‌آموز:</span>
          </h3>

          <div className="flex items-center gap-2 flex-wrap">
            {(!currentUser.medals || currentUser.medals.length === 0) ? (
              <span className="text-xs text-slate-400">
                با امانت دادن و گرفتن کتاب و جلب رضایت همکلاسی‌ها مدال‌های شما فعال خواهند شد.
              </span>
            ) : (
              currentUser.medals.map((medal) => (
                <div
                  key={medal.id}
                  className={`px-3 py-1.5 rounded-2xl border text-xs font-bold flex items-center gap-1.5 shadow-2xs ${medal.color}`}
                >
                  <span className="text-base">{medal.icon}</span>
                  <div>
                    <div>{medal.title}</div>
                    <div className="text-[10px] opacity-80 font-normal">{medal.description}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Minimum 3 to 5 Books Requirement Info Banner */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-5 text-xs text-indigo-950 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-sm">قانون اشتراک‌گذاری کتابخانه مدرسه:</h4>
          <p className="leading-relaxed">
            مطابق مصوبه کتابخانه، هر دانش‌آموز موقع ثبت‌نام حداقل ۳ الی ۵ جلد کتاب شخص برای استفاده دیگر همکلاسی‌ها وارد سامانه می‌کند. کتاب‌های شما همیشه متعلق به خودتان است و هنگام فراغت یا امانت مجددا به شما پس داده می‌شوند.
          </p>
        </div>
      </div>

      {/* My Books Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <span>گنجینه کتاب‌های من ({myBooks.length} جلد)</span>
          </h3>

          <button
            onClick={() => setShowAddModal(true)}
            className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 rounded-xl border border-indigo-100 transition"
          >
            + افزودن کتاب جدید
          </button>
        </div>

        {myBooks.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-700 text-base">شما هنوز کتابی به کتابخانه اضافه نکرده‌اید!</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              با افزودن کتاب‌های شخصی خود، شانس کسب مدال «گنجینه کتاب» و رتبه‌های اول لیگ کتابخوانی مدرسه را بالا ببرید.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-100 transition inline-block"
            >
              افزودن اولین کتاب من
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6 px-6 sm:px-0 max-w-sm sm:max-w-none mx-auto">
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
                    if (confirm(`آیا از حذف کتاب «${book.title}» اطمینان دارید؟`)) {
                      deleteBook(book.id);
                    }
                  }}
                  title="حذف کتاب"
                  className="absolute top-2 left-2 z-10 w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-md hover:bg-rose-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Book Modal */}
      {showAddModal && <AddBookModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
};
