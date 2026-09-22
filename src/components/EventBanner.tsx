import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { SystemEvent, UserEventProgress } from '../types';
import {
  Sparkles,
  Trophy,
  Gift,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  ChevronLeft,
  Flame,
  Star,
  PlusCircle,
  Award,
  Zap,
  Info
} from 'lucide-react';

interface EventBannerProps {
  onNavigateAddBooks: () => void;
  onNavigateLibrary?: () => void;
  onOpenAuth?: () => void;
}

export const EventBanner: React.FC<EventBannerProps> = ({
  onNavigateAddBooks,
  onOpenAuth
}) => {
  const { activeEvents, currentUser, getEventProgress, claimEventReward } = useApp();
  const [userProgressMap, setUserProgressMap] = useState<Record<string, UserEventProgress>>({});
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  const [claimingEventId, setClaimingEventId] = useState<string | null>(null);
  const [claimSuccessMessage, setClaimSuccessMessage] = useState<string | null>(null);

  // Load user progress for active events
  useEffect(() => {
    if (!currentUser?.id || activeEvents.length === 0) return;

    let isMounted = true;
    const fetchProgress = async () => {
      setIsLoadingProgress(true);
      const newMap: Record<string, UserEventProgress> = {};
      for (const ev of activeEvents) {
        try {
          const prog = await getEventProgress(ev.id, currentUser.id);
          if (prog) {
            newMap[ev.id] = prog;
          }
        } catch (e) {
          console.error(`Failed to fetch progress for event ${ev.id}:`, e);
        }
      }
      if (isMounted) {
        setUserProgressMap(newMap);
        setIsLoadingProgress(false);
      }
    };

    fetchProgress();
    return () => {
      isMounted = false;
    };
  }, [activeEvents, currentUser?.id, currentUser?.booksCount]);

  if (activeEvents.length === 0) {
    return null;
  }

  const handleClaimReward = async (eventId: string) => {
    setClaimingEventId(eventId);
    setClaimSuccessMessage(null);
    try {
      const res = await claimEventReward(eventId);
      if (res.success) {
        setClaimSuccessMessage(res.message);
        // Update local map
        if (res.progress) {
          setUserProgressMap((prev) => ({ ...prev, [eventId]: res.progress! }));
        }
        setTimeout(() => {
          setClaimSuccessMessage(null);
        }, 6000);
      } else {
        alert(res.message || 'خطا در دریافت پاداش');
      }
    } catch (e: any) {
      alert(e.message || 'خطا در دریافت پاداش');
    } finally {
      setClaimingEventId(null);
    }
  };

  const calculateDaysLeft = (endTimestamp?: number): { daysLeft: number; text: string; isEndingSoon: boolean } => {
    if (!endTimestamp) {
      return { daysLeft: 99, text: 'نامحدود / بدون مهلت انقضا', isEndingSoon: false };
    }
    const now = Date.now();
    const diffMs = endTimestamp - now;
    if (diffMs <= 0) {
      return { daysLeft: 0, text: 'مهلت ایونت به پایان رسیده است', isEndingSoon: true };
    }
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (days === 1) {
      return { daysLeft: 1, text: 'تنها ۱ روز تا پایان ایونت مانده!', isEndingSoon: true };
    }
    return { daysLeft: days, text: `تا پایان ایونت ${days} روز مانده`, isEndingSoon: days <= 3 };
  };

  return (
    <div className="space-y-4" id="active-events-section">
      {claimSuccessMessage && (
        <div className="bg-emerald-900 border-2 border-emerald-400 text-white p-4 rounded-3xl shadow-xl flex items-center gap-3 animate-in fade-in zoom-in duration-300">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/30 flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6 text-amber-300 animate-bounce" />
          </div>
          <div className="flex-1">
            <h4 className="font-black text-sm text-emerald-200">تبریک ویژه! 🎉</h4>
            <p className="text-xs font-bold text-white mt-0.5">{claimSuccessMessage}</p>
          </div>
        </div>
      )}

      {activeEvents.map((event) => {
        const progress = userProgressMap[event.id];
        const daysInfo = calculateDaysLeft(event.endTimestamp);
        const currentCount = progress ? progress.currentCount : 0;
        const targetCount = event.targetCount || 8;
        const percentage = Math.min(100, Math.round((currentCount / targetCount) * 100));
        const isCompleted = currentCount >= targetCount;
        const isClaimed = progress?.isRewardClaimed || false;

        return (
          <div
            key={event.id}
            id={`event-card-${event.id}`}
            className="relative rounded-3xl bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-7 shadow-2xl border-2 border-amber-400/40 overflow-hidden"
          >
            {/* Ambient Background Glows */}
            <div className="absolute -right-12 -top-12 w-56 h-56 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-12 -bottom-12 w-56 h-56 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-5">
              {/* Header row: Badge, Countdown, and Bale publish tag */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-amber-400 text-slate-950 font-['Lalezar',cursive] text-sm px-3.5 py-1 rounded-full flex items-center gap-1.5 shadow-md">
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>رویداد و ایونت ویژه کتابخانه</span>
                  </span>

                  {event.tag && (
                    <span className="bg-white/10 text-amber-200 text-xs px-3 py-1 rounded-full font-bold border border-white/10">
                      {event.tag}
                    </span>
                  )}

                  {event.isPublishedToBale && (
                    <span className="bg-sky-500/20 text-sky-300 text-[11px] px-2.5 py-0.5 rounded-full font-bold border border-sky-400/30 flex items-center gap-1">
                      <span>منتشرشده در کانال بله</span>
                    </span>
                  )}
                </div>

                {/* Remaining Days Badge */}
                <div
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs font-black shadow-xs ${
                    daysInfo.isEndingSoon
                      ? 'bg-rose-500/30 text-rose-200 border border-rose-400/40 animate-pulse'
                      : 'bg-white/10 text-cyan-200 border border-white/15'
                  }`}
                >
                  <Clock className="w-4 h-4 text-amber-300" />
                  <span>{daysInfo.text}</span>
                </div>
              </div>

              {/* Event Content & Mission */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-8 space-y-3">
                  <h3 className="text-2xl sm:text-3xl font-['Lalezar',cursive] text-amber-300 tracking-wide flex items-center gap-2">
                    <span>{event.title}</span>
                    <Flame className="w-6 h-6 text-orange-400 animate-pulse" />
                  </h3>

                  <p className="text-slate-200 text-xs sm:text-sm leading-relaxed font-medium whitespace-pre-line">
                    {event.description}
                  </p>

                  {/* Reward Explanation Pill */}
                  <div className="bg-amber-500/10 border border-amber-400/30 p-3.5 rounded-2xl flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
                      <Gift className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-amber-300">
                        🎁 جایزه ویژه این ایونت:
                      </div>
                      <div className="text-xs font-bold text-white mt-0.5">
                        {event.rewardDescription || `دریافت ${event.freeLoanCount || 2} سهمیه امانت کتاب بدون پرداخت هیچ هزینه‌ای!`}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Side for Non-Logged-in vs Logged-in */}
                <div className="lg:col-span-4 flex flex-col justify-center items-stretch gap-3">
                  {!currentUser ? (
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-center space-y-3">
                      <p className="text-xs font-bold text-slate-300">
                        جهت شرکت در این ایونت و ثبت کتاب‌های خود وارد حساب شوید:
                      </p>
                      {onOpenAuth && (
                        <button
                          onClick={onOpenAuth}
                          className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Zap className="w-4 h-4" />
                          <span>ورود و شرکت در چالش</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={onNavigateAddBooks}
                      className="w-full py-3 px-4 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-lg transition flex items-center justify-center gap-2 hover:scale-102 cursor-pointer"
                    >
                      <PlusCircle className="w-5 h-5" />
                      <span>ثبت و اهدای کتاب در ایونت</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar Component for Logged-In User */}
              {currentUser && (
                <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/10 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-cyan-400" />
                      <span className="font-bold text-slate-300">
                        پیشرفت شما در این رویداد:
                      </span>
                      <span className="font-black text-amber-300 text-sm">
                        {currentCount} از {targetCount} کتاب
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-bold">
                        {percentage}٪ تکمیل شده
                      </span>
                      {isCompleted && (
                        <span className="text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/20 px-2 py-0.5 rounded-md text-[11px] border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>هدف محقق شد!</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Line */}
                  <div className="w-full h-3.5 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/15">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isCompleted
                          ? 'bg-gradient-to-r from-amber-400 via-emerald-400 to-emerald-300 shadow-lg shadow-emerald-500/30'
                          : 'bg-gradient-to-r from-cyan-400 to-amber-400'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  {/* Progress Status Message & Claim Reward Area */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                    <div className="text-[11px] sm:text-xs text-slate-300 font-medium">
                      {!isCompleted ? (
                        <span>
                          💡 شما از ابتدا ایونت <strong>{currentCount}</strong> کتاب اضافه کرده‌اید. با افزودن <strong>{Math.max(0, targetCount - currentCount)}</strong> کتاب دیگر، جایزه <strong>{event.freeLoanCount || 2} امانت رایگان</strong> را دریافت خواهید کرد.
                        </span>
                      ) : (
                        <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>
                            تبریک! هدف کامل شد. شما می‌توانید {event.freeLoanCount || 2} کتاب را بدون پرداخت هزینه امانت بگیرید.
                          </span>
                        </span>
                      )}
                    </div>

                    {/* Reward Claim Button */}
                    {isCompleted && (
                      <div>
                        {isClaimed ? (
                          <div className="px-4 py-2 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>سهمیه رایگان فعال شد ✓</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleClaimReward(event.id)}
                            disabled={claimingEventId === event.id}
                            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center gap-2 hover:scale-105 cursor-pointer whitespace-nowrap animate-bounce"
                          >
                            <Trophy className="w-4 h-4 text-slate-950" />
                            <span>
                              {claimingEventId === event.id ? 'در حال ثبت جایزه...' : 'دریافت جایزه و سهمیه رایگان 🎁'}
                            </span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
