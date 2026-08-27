import React, { useState } from 'react';
import { User } from '../types';
import { Trophy, Medal, Star, BookOpen, Award, Sparkles, Printer, Eye, ListOrdered, CheckSquare } from 'lucide-react';
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
  const [printMode, setPrintMode] = useState<'poster' | 'detailed_table'>('poster');

  const currentDateFa = new Date().toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Calculate a consolidated reading index score for all students:
  // Score = (Books Read * 3) + (Books Contributed * 2) + (Average Rating * 1)
  const allStudentsWithScores = [...topReaders]
    .map((student) => {
      const read = student.booksReadCount || 0;
      const contributed = student.booksContributedCount || 0;
      const rate = student.rating || 0;
      const score = read * 3 + contributed * 2 + rate;
      return {
        ...student,
        score
      };
    })
    .sort((a, b) => b.score - a.score);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md overflow-y-auto p-2 sm:p-6 flex justify-center">
      <div className="max-w-4xl w-full my-4">
        {/* Top Control Bar for Print Action - Hidden in Print */}
        <div className="no-print bg-slate-900 text-white p-4 rounded-t-3xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Trophy className="w-5 h-5 text-amber-400 animate-pulse" />
            <div>
              <span className="font-black text-sm block">مدیریت چاپ و خروجی رسمی رده‌بندی لیگ کتابخوانی 🎒</span>
              <span className="text-[10px] text-slate-400 font-medium">نوع سند خروجی و چاپ را انتخاب کنید:</span>
            </div>
          </div>

          {/* Toggle Print Modes */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setPrintMode('poster')}
              className={`px-3.5 py-1.5 text-xs font-black rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                printMode === 'poster'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>پوستر رنگی دیواری</span>
            </button>
            <button
              onClick={() => setPrintMode('detailed_table')}
              className={`px-3.5 py-1.5 text-xs font-black rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                printMode === 'detailed_table'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>کارنامه رسمی و لیست نمرات (A4)</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => window.print()}
              className="px-4.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-950" />
              <span>چاپ سند (Print / PDF)</span>
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              بستن
            </button>
          </div>
        </div>

        {/* Printable Poster Canvas */}
        <div className="print-container bg-white p-6 sm:p-10 rounded-b-3xl border-4 border-indigo-900 text-slate-900 shadow-2xl space-y-8 print:border-none print:p-0 print:shadow-none">
          
          {/* 1. WALL POSTER VIEW */}
          {printMode === 'poster' ? (
            <div className="space-y-6">
              {/* School Header */}
              <div className="border-b-4 border-slate-900 pb-5 text-center space-y-3">
                <div className="flex items-center justify-between text-[11px] font-black text-slate-600 px-2 sm:px-4">
                  <span>اداره کل آموزش و پرورش استان</span>
                  <div className="flex items-center gap-2">
                    <img src={houseLogoImg} alt="لوگوی مکتب خونه" className="w-10 h-10 rounded-xl border-2 border-indigo-900 object-cover" />
                    <span className="text-indigo-900 font-black text-lg">
                      سامانه امانت کتاب «مکتب خونه» 🎒
                    </span>
                  </div>
                  <span>تاریخ انتشار: {currentDateFa}</span>
                </div>

                <div className="py-2">
                  <h1 className="text-2xl sm:text-3.5xl font-black text-slate-950 tracking-tight leading-normal">
                    🏆 جدول برترین‌های لیگ کتابخوانی و امانت‌داری مدرسه 🏆
                  </h1>
                  <p className="text-xs sm:text-sm text-indigo-800 font-extrabold">
                    «هر کتاب یک دنیای تازه است؛ با اهدای کتاب و مطالعه مستمر، برترین کتابخوان مدرسه شوید»
                  </p>
                </div>
              </div>

              {/* Leaderboard Tables Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Column 1: Top Contributors */}
                <div className="border-2 border-amber-300 rounded-2.5xl p-4 bg-amber-50/30 space-y-3.5">
                  <div className="bg-amber-500 text-slate-950 px-3 py-2 rounded-xl text-center font-black text-xs flex items-center justify-center gap-1.5 shadow-sm">
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
                          <span className="font-extrabold text-slate-900">{u.name}</span>
                        </div>
                        <span className="text-[10px] font-black text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                          {u.booksContributedCount || 0} جلد
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 2: Top Readers */}
                <div className="border-2 border-emerald-300 rounded-2.5xl p-4 bg-emerald-50/30 space-y-3.5">
                  <div className="bg-emerald-600 text-white px-3 py-2 rounded-xl text-center font-black text-xs flex items-center justify-center gap-1.5 shadow-sm">
                    <Trophy className="w-4 h-4" />
                    <span>بیشترین کتاب‌های خوانده‌شده</span>
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
                          <span className="font-extrabold text-slate-900">{u.name}</span>
                        </div>
                        <span className="text-[10px] font-black text-emerald-900 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                          {u.booksReadCount || 0} جلد
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 3: Highest Rated Lenders */}
                <div className="border-2 border-indigo-300 rounded-2.5xl p-4 bg-indigo-50/30 space-y-3.5">
                  <div className="bg-indigo-600 text-white px-3 py-2 rounded-xl text-center font-black text-xs flex items-center justify-center gap-1.5 shadow-sm">
                    <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                    <span>امتیاز امانت‌داری و خوش‌قولی</span>
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
                          <span className="font-extrabold text-slate-900">{u.name}</span>
                        </div>
                        <span className="text-[10px] font-black text-indigo-900 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg flex items-center gap-0.5">
                          ⭐ {u.rating || 5}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Poster Footer Notice */}
              <div className="border-t-2 border-slate-300 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 font-bold gap-2">
                <span>سامانه دیجیتال امانت کتاب دانش‌آموزی مکتب خونه 📚</span>
                <span className="text-indigo-900 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-100">
                  📍 محل نصب پوستر: تابلوی اعلانات کتابخانه، راهرو آموزشگاه و کلاس‌های درس
                </span>
              </div>
            </div>
          ) : (
            /* 2. OFFICIAL DETAILED REPORT TABLE (PRINT FOCUSSED) */
            <div className="space-y-6">
              {/* Formal Letterhead */}
              <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
                <div className="text-[11px] font-bold text-slate-700 space-y-1">
                  <div>جمهوری اسلامی ایران</div>
                  <div>وزارت آموزش و پرورش منطقه</div>
                  <div>دبیرستان دوره اول پسرانه</div>
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-black text-slate-900">لیست کارنامه جامع لیگ کتابخوانی و امانت‌داری مدرسه</h2>
                  <p className="text-[11px] text-slate-600 font-bold mt-1">«گزارش رسمی نمرات، مشارکت‌ها و امتیازات دانش‌آموزان فعال»</p>
                </div>
                <div className="text-[11px] font-bold text-slate-700 text-left space-y-1">
                  <div>تاریخ انتشار: {currentDateFa}</div>
                  <div>سند خروجی: مکتب خونه</div>
                  <div>وضعیت: تایید شده</div>
                </div>
              </div>

              {/* Table of Rankings */}
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 border-y-2 border-slate-900">
                      <th className="py-2 px-3 font-black border border-slate-300 text-center w-12">رتبه</th>
                      <th className="py-2 px-3 font-black border border-slate-300">نام و نام خانوادگی دانش‌آموز</th>
                      <th className="py-2 px-3 font-black border border-slate-300 text-center w-24">کلاس / پایه</th>
                      <th className="py-2 px-3 font-black border border-slate-300 text-center w-28">کتاب‌های اهدایی</th>
                      <th className="py-2 px-3 font-black border border-slate-300 text-center w-28">کتاب‌های خوانده‌شده</th>
                      <th className="py-2 px-3 font-black border border-slate-300 text-center w-24">میانگین امتیاز</th>
                      <th className="py-2 px-3 font-black border border-slate-300 text-center w-28 bg-slate-50">شاخص کل نهایی</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allStudentsWithScores.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-4 text-center text-slate-500 font-medium">هیچ کاربری ثبت نام نکرده است.</td>
                      </tr>
                    ) : (
                      allStudentsWithScores.map((u, idx) => (
                        <tr key={u.id} className="hover:bg-slate-50 border-b border-slate-200">
                          <td className="py-2.5 px-3 border border-slate-200 text-center font-black">{idx + 1}</td>
                          <td className="py-2.5 px-3 border border-slate-200 font-black text-slate-900">{u.name}</td>
                          <td className="py-2.5 px-3 border border-slate-200 text-center font-bold text-slate-600">کلاس {u.className}</td>
                          <td className="py-2.5 px-3 border border-slate-200 text-center font-bold text-emerald-800">{u.booksContributedCount || 0} جلد</td>
                          <td className="py-2.5 px-3 border border-slate-200 text-center font-bold text-indigo-800">{u.booksReadCount || 0} جلد</td>
                          <td className="py-2.5 px-3 border border-slate-200 text-center font-bold text-amber-700">⭐ {u.rating || 5}</td>
                          <td className="py-2.5 px-3 border border-slate-200 text-center font-black text-slate-950 bg-slate-50/50">{u.score} امتیاز</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* School Official Signature Box */}
              <div className="pt-12 grid grid-cols-3 gap-6 text-center text-xs font-black text-slate-900">
                <div className="space-y-16">
                  <div>مهر و امضای معاون پرورشی مدرسه:</div>
                  <div className="text-slate-400 font-normal">........................................</div>
                </div>
                <div className="space-y-16">
                  <div>مهر و امضای مربی پرورشی / کتابدار:</div>
                  <div className="text-slate-400 font-normal">........................................</div>
                </div>
                <div className="space-y-16">
                  <div>مهر و امضای نهایی مدیر آموزشگاه:</div>
                  <div className="text-slate-400 font-normal">........................................</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
