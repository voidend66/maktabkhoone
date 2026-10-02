import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PrintableBoard } from './PrintableBoard';
import { MaktabKhanehHouseLogo, SloganBadge } from './MaktabKhanehBranding';
import {
  Trophy,
  Medal,
  Star,
  BookOpen,
  Printer,
  Sparkles,
  Award,
  Crown,
  TrendingUp,
  Flame,
  Backpack,
  Lightbulb,
  Shield,
  Gift
} from 'lucide-react';
import { TIER_CONFIG } from '../data/defaultMedals';

export const ReadingLeague: React.FC = () => {
  const { users, currentUser, resolveClassName, medals } = useApp();
  const [showPrintModal, setShowPrintModal] = useState(false);

  const studentUsers = users.filter((u) => u.status === 'approved' && u.role === 'student');

  // Sort by Contributed
  const topContributors = [...studentUsers].sort(
    (a, b) => (b.booksContributedCount || 0) - (a.booksContributedCount || 0)
  );

  // Sort by Read
  const topReaders = [...studentUsers].sort(
    (a, b) => (b.booksReadCount || 0) - (a.booksReadCount || 0)
  );

  // Sort by Rating
  const topRatedUsers = [...studentUsers].sort(
    (a, b) => (b.rating || 0) - (a.rating || 0)
  );

  const champion = topContributors[0] || studentUsers[0];

  return (
    <div className="space-y-8 pb-12">
      {/* Title & Banner */}
      <div className="bg-gradient-to-r from-cyan-950 via-sky-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex items-center justify-between flex-wrap gap-6 relative overflow-hidden border-2 border-cyan-500/30">
        <div className="relative z-10 max-w-xl space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <SloganBadge />
            <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
              <span>مسابقات مکتب خونه</span>
              <span>🎒</span>
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-amber-300">
            لیگ کتابخوانی و امانت‌داری مکتب خونه 🏆
          </h2>

          <p className="text-cyan-100 text-xs sm:text-sm leading-relaxed font-medium">
            با اشتراک‌گذاری کتاب‌های جدید، مطالعه مستمر با چراغ مطالعه و کسب رضایت اعضا هنگام امانت، مدال‌های افتخار مکتب خونه دریافت کنید و نام خود را در برد عمومی ثبت کنید!
          </p>

          <div className="pt-2 flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setShowPrintModal(true)}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black px-5 py-3 rounded-2xl text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-950" />
              <span>
                {currentUser?.role === 'admin'
                  ? '🖨️ خروجی رسمی کارنامه و پوستر برد مدرسه (ویژه مدیر)'
                  : 'دریافت خروجی چاپی برای نصب در برد دیواری'}
              </span>
            </button>

            {currentUser?.role === 'admin' && (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                ✨ دسترسی مدیریت فعال: قالب دوگانه پوستر رنگی و کارنامه رسمی ممهور
              </span>
            )}
          </div>
        </div>

        {/* House Logo Badge */}
        <div className="relative z-10 hidden md:block">
          <MaktabKhanehHouseLogo size="sm" />
        </div>

        {/* Top Winner Card Graphic */}
        {champion && (
          <div className="relative z-10 bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/20 text-center max-w-xs w-full space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center mx-auto shadow-lg font-bold text-xl">
              👑
            </div>
            <div>
              <span className="text-[10px] text-amber-200 font-bold block">
                قهرمان کتابخوانی این هفته:
              </span>
              <h3 className="font-extrabold text-lg text-white">{champion.name}</h3>
              <p className="text-xs text-amber-100">کلاس {resolveClassName(champion.className)}</p>
            </div>
            <div className="pt-2 border-t border-white/10 flex justify-around text-xs">
              <div>
                <span className="font-bold text-amber-300 block">{champion.booksContributedCount} جلد</span>
                <span className="text-[10px] text-slate-200">کتاب اهدا شده</span>
              </div>
              <div>
                <span className="font-bold text-amber-300 block">⭐ {champion.rating}</span>
                <span className="text-[10px] text-slate-200">امتیاز امانت</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Podium & Ranking Tables */}
      {studentUsers.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border-2 border-dashed border-amber-300 space-y-4 shadow-sm max-w-2xl mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-amber-50 text-amber-500 mx-auto flex items-center justify-center shadow-inner">
            <Trophy className="w-10 h-10" />
          </div>
          <h3 className="font-black text-slate-900 text-lg sm:text-xl">
            لیگ کتابخوانی در حال آماده‌سازی و شروع است! 🏆
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            به محض اینکه دانش‌آموزان ثبت‌نام کرده و اولین کتاب‌ها را امانت بگیرند و به اشتراک بگذارند، رتبه‌بندی و قهرمانان هفتگی در این بخش نمایش داده خواهند شد.
          </p>
        </div>
      ) : (
        <>
          {/* Podium Top 3 Students */}
          <div className="space-y-4">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>سکوی افتخار کتاب‌خوانان برتر این هفته</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              {/* 2nd Place */}
              {topContributors[1] && (
                <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-xs text-center space-y-3 relative order-2 md:order-1">
                  <span className="absolute -top-3 right-1/2 translate-x-1/2 bg-slate-300 text-slate-900 text-xs font-black px-3 py-1 rounded-full shadow-xs">
                    مقام دوم 🥈
                  </span>
                  <img
                    src={topContributors[1].avatar}
                    alt={topContributors[1].name}
                    className="w-16 h-16 rounded-full object-cover mx-auto ring-4 ring-slate-200"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{topContributors[1].name}</h4>
                    <p className="text-xs text-slate-500">{resolveClassName(topContributors[1].className)}</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 flex justify-around text-xs">
                    <span>📚 {topContributors[1].booksContributedCount} کتاب</span>
                    <span>⭐ {topContributors[1].rating}</span>
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {topContributors[0] && (
                <div className="bg-gradient-to-b from-amber-500/10 via-white to-amber-500/20 rounded-3xl p-6 border-2 border-amber-400 shadow-lg text-center space-y-3 relative order-1 md:order-2 scale-105">
                  <span className="absolute -top-3 right-1/2 translate-x-1/2 bg-amber-400 text-slate-950 text-xs font-black px-4 py-1 rounded-full shadow-md flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5" /> مقام اول 🥇
                  </span>
                  <img
                    src={topContributors[0].avatar}
                    alt={topContributors[0].name}
                    className="w-20 h-20 rounded-full object-cover mx-auto ring-4 ring-amber-400 shadow-md"
                  />
                  <div>
                    <h4 className="font-black text-slate-900 text-lg">{topContributors[0].name}</h4>
                    <p className="text-xs text-amber-800 font-bold">{resolveClassName(topContributors[0].className)}</p>
                  </div>
                  <div className="bg-amber-100/80 p-3 rounded-2xl border border-amber-200 flex justify-around text-xs font-bold text-slate-900">
                    <span>📚 {topContributors[0].booksContributedCount} کتاب</span>
                    <span>📖 {topContributors[0].booksReadCount} مطالعه</span>
                    <span>⭐ {topContributors[0].rating}</span>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {topContributors[2] && (
                <div className="bg-white rounded-3xl p-6 border-2 border-amber-200 shadow-xs text-center space-y-3 relative order-3">
                  <span className="absolute -top-3 right-1/2 translate-x-1/2 bg-amber-700 text-white text-xs font-black px-3 py-1 rounded-full shadow-xs">
                    مقام سوم 🥉
                  </span>
                  <img
                    src={topContributors[2].avatar}
                    alt={topContributors[2].name}
                    className="w-16 h-16 rounded-full object-cover mx-auto ring-4 ring-amber-200"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{topContributors[2].name}</h4>
                    <p className="text-xs text-slate-500">{resolveClassName(topContributors[2].className)}</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 flex justify-around text-xs">
                    <span>📚 {topContributors[2].booksContributedCount} کتاب</span>
                    <span>⭐ {topContributors[2].rating}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Detailed Top 1 to 5 Ranking Tables */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Table 1: Most Contributed */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <h4 className="font-bold text-slate-900 text-sm">
                  بیشترین اشتراک کتاب (نفر ۱ تا ۵)
                </h4>
              </div>

              <div className="space-y-2">
                {topContributors.slice(0, 5).map((u, idx) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-full text-xs font-extrabold flex items-center justify-center ${
                          idx === 0
                            ? 'bg-amber-400 text-slate-950'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-950'
                            : idx === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-bold text-slate-800">{u.name}</div>
                        <div className="text-[10px] text-slate-400">{resolveClassName(u.className)}</div>
                      </div>
                    </div>

                    <span className="font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl">
                      {u.booksContributedCount} جلد
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Table 2: Most Read */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h4 className="font-bold text-slate-900 text-sm">
                  بیشترین امانت و مطالعه (نفر ۱ تا ۵)
                </h4>
              </div>

              <div className="space-y-2">
                {topReaders.slice(0, 5).map((u, idx) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-amber-200 transition text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-full text-xs font-extrabold flex items-center justify-center ${
                          idx === 0
                            ? 'bg-amber-400 text-slate-950'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-950'
                            : idx === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-bold text-slate-800">{u.name}</div>
                        <div className="text-[10px] text-slate-400">{resolveClassName(u.className)}</div>
                      </div>
                    </div>

                    <span className="font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl">
                      {u.booksReadCount} جلد
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Table 3: Highest Reputation Lenders */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                <h4 className="font-bold text-slate-900 text-sm">
                  خوش‌قول‌ترین امانت‌داران (امتیاز از ۵)
                </h4>
              </div>

              <div className="space-y-2">
                {topRatedUsers.slice(0, 5).map((u, idx) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-full text-xs font-extrabold flex items-center justify-center ${
                          idx === 0
                            ? 'bg-amber-400 text-slate-950'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-950'
                            : idx === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-bold text-slate-800">{u.name}</div>
                        <div className="text-[10px] text-slate-400">{resolveClassName(u.className)}</div>
                      </div>
                    </div>

                    <span className="font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-xl flex items-center gap-1">
                      ⭐ {u.rating}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Medals & Achievements Showcase Section in League */}
          <div className="bg-gradient-to-br from-amber-500/10 via-white to-orange-500/10 rounded-3xl p-6 sm:p-8 border-2 border-amber-300 shadow-sm space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Award className="w-6 h-6 text-amber-600" />
                  <h3 className="text-xl font-black text-slate-900">
                    ویترین ۱۰ نشان و درجه افتخار مکتب‌خانه 🏅
                  </h3>
                </div>
                <p className="text-xs text-slate-600">
                  با اشتراک کتاب، مطالعه مستمر، امانتداری صادقانه و نقدنویسی، این نشان‌های افتخار را کسب کرده و جوایز ویژه آن را دریافت کنید!
                </p>
              </div>

              <span className="text-xs bg-amber-500 text-slate-950 font-black px-3 py-1.5 rounded-full shadow-xs">
                از رده برنز تا اسطوره‌ای
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {medals.map((medal) => {
                const tierInfo = TIER_CONFIG[medal.tier] || TIER_CONFIG.bronze;

                return (
                  <div
                    key={medal.id}
                    className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-amber-400 transition-all space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${tierInfo.badge}`}>
                          {tierInfo.label} • لول {medal.level}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          #{medal.order}
                        </span>
                      </div>

                      <div className="w-14 h-14 rounded-2xl bg-amber-50 mx-auto flex items-center justify-center overflow-hidden ring-2 ring-amber-100 shadow-2xs">
                        {medal.imageUrl ? (
                          <img
                            src={medal.imageUrl}
                            alt={medal.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl">{medal.icon || '🏅'}</span>
                        )}
                      </div>

                      <div className="text-center space-y-1">
                        <h4 className="font-black text-slate-900 text-xs line-clamp-1">{medal.title}</h4>
                        <p className="text-[10px] text-amber-800 line-clamp-2 leading-tight">
                          {medal.specialPerk}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 text-[10px] text-emerald-700 font-bold text-center">
                      🎁 {medal.reward.title}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Printable Board Poster Modal */}
      {showPrintModal && (
        <PrintableBoard
          topContributors={topContributors}
          topReaders={topReaders}
          topRatedUsers={topRatedUsers}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
};
