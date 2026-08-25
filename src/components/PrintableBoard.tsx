import React from 'react';
import { User } from '../types';
import { Trophy, Medal, Star, BookOpen, Award, Sparkles } from 'lucide-react';
import { houseLogoImg } from './MaktabKhanehBranding';

interface PrintableBoardProps {
  topContributors: User[];
  topReaders: User[];
  topRatedUsers: User[];
  onClose: () => void;
}

export const PrintableBoard: React.FC<PrintableBoardProps> = ({
  topContributors,
  topReaders,
  topRatedUsers,
  onClose
}) => {
  const currentDateFa = new Date().toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm overflow-y-auto p-4 flex justify-center">
      <div className="max-w-4xl w-full my-6">
        {/* Top Control Bar for Print Action */}
        <div className="no-print bg-slate-900 text-white p-4 rounded-t-3xl flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm">پیش‌نمایش پوستر چاپی برد مدرسه (A4 / A3)</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              <span>🖨️ پرینت پوستر جهت نصب در برد مدرسه</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition"
            >
              بستن
            </button>
          </div>
        </div>

        {/* Printable Poster Canvas */}
        <div className="print-container bg-white p-8 rounded-b-3xl sm:rounded-t-none border-4 border-cyan-700 text-slate-900 shadow-2xl space-y-6">
          {/* School Header */}
          <div className="border-b-4 border-slate-900 pb-6 text-center space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-4">
              <span>وزارت آموزش و پرورش</span>
              <div className="flex items-center gap-2">
                <img src={houseLogoImg} alt="لوگوی مکتب خونه" className="w-8 h-8 rounded-lg border border-cyan-500 object-cover" />
                <span className="text-cyan-900 font-extrabold text-base">
                  سامانه امانت کتاب «مکتب خونه» 🎒
                </span>
              </div>
              <span>تاریخ بروزرسانی: {currentDateFa}</span>
            </div>

            <div className="py-2">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                🏆 جدول برترین‌های لیگ کتابخوانی و امانت‌داری مکتب خونه 🏆
              </h1>
              <p className="text-sm text-cyan-800 mt-1 font-black">
                • هر کتاب، یک سفر • هر امانت، یک اعتماد •
              </p>
            </div>
          </div>

          {/* Leaderboard Tables Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1: Top Contributors */}
            <div className="border-2 border-amber-300 rounded-2xl p-4 bg-amber-50/40 space-y-3">
              <div className="bg-amber-500 text-slate-950 px-3 py-1.5 rounded-xl text-center font-black text-xs flex items-center justify-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                <span>بیشترین اهدا و اشتراک کتاب</span>
              </div>

              <div className="space-y-2">
                {topContributors.slice(0, 5).map((u, idx) => (
                  <div
                    key={u.id}
                    className="bg-white p-2.5 rounded-xl border border-amber-200 flex items-center justify-between text-xs shadow-2xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${
                          idx === 0
                            ? 'bg-amber-400 text-slate-950'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-950'
                            : idx === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-800">{u.name}</span>
                    </div>
                    <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {u.booksContributedCount} جلد
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: Top Readers */}
            <div className="border-2 border-emerald-300 rounded-2xl p-4 bg-emerald-50/40 space-y-3">
              <div className="bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-center font-black text-xs flex items-center justify-center gap-1.5">
                <Trophy className="w-4 h-4" />
                <span>بیشترین امانت و کتاب‌های خوانده‌شده</span>
              </div>

              <div className="space-y-2">
                {topReaders.slice(0, 5).map((u, idx) => (
                  <div
                    key={u.id}
                    className="bg-white p-2.5 rounded-xl border border-emerald-200 flex items-center justify-between text-xs shadow-2xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${
                          idx === 0
                            ? 'bg-amber-400 text-slate-950'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-950'
                            : idx === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-800">{u.name}</span>
                    </div>
                    <span className="text-[11px] font-extrabold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">
                      {u.booksReadCount} جلد
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3: Highest Rated Lenders */}
            <div className="border-2 border-indigo-300 rounded-2xl p-4 bg-indigo-50/40 space-y-3">
              <div className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-center font-black text-xs flex items-center justify-center gap-1.5">
                <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>خوش‌قول‌ترین امانت‌داران (بالاترین امتیاز)</span>
              </div>

              <div className="space-y-2">
                {topRatedUsers.slice(0, 5).map((u, idx) => (
                  <div
                    key={u.id}
                    className="bg-white p-2.5 rounded-xl border border-indigo-200 flex items-center justify-between text-xs shadow-2xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${
                          idx === 0
                            ? 'bg-amber-400 text-slate-950'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-950'
                            : idx === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-800">{u.name}</span>
                    </div>
                    <span className="text-[11px] font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                      ⭐ {u.rating}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Notice for Wall Bulletin */}
          <div className="border-t-2 border-slate-300 pt-4 flex items-center justify-between text-[11px] text-slate-600 font-semibold">
            <span>کتابخانه مکتب خونه • مدیر سایت: پارسا فیض</span>
            <span className="text-emerald-800 font-bold">
              محل نصب: برد اطلاعیه‌های پرورشی و کتابخانه مدرسه
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
