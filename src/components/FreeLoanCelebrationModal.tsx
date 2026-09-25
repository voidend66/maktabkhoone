import React, { useEffect, useState } from 'react';
import { Gift, Sparkles, BookOpen, Check, PartyPopper } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface FreeLoanCelebrationModalProps {
  onNavigateToLibrary?: () => void;
}

export const FreeLoanCelebrationModal: React.FC<FreeLoanCelebrationModalProps> = ({
  onNavigateToLibrary
}) => {
  const { currentUser, acknowledgeFreeLoanReward } = useApp();
  const [isClosing, setIsClosing] = useState(false);

  const reward = currentUser?.pendingFreeLoanReward;

  useEffect(() => {
    // Optional celebration effect or sound can be triggered here
  }, []);

  if (!reward) return null;

  const count = reward.count || 1;
  const isEvent = reward.source === 'event';
  const totalBalance = currentUser?.freeLoanQuota || count;

  const toFarsiNumber = (n: number | string) => {
    const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return n.toString().replace(/\d/g, (x) => farsiDigits[parseInt(x)]);
  };

  const handleClose = async () => {
    setIsClosing(true);
    await acknowledgeFreeLoanReward();
    setIsClosing(false);
  };

  const handleGoToLibrary = async () => {
    setIsClosing(true);
    await acknowledgeFreeLoanReward();
    setIsClosing(false);
    if (onNavigateToLibrary) {
      onNavigateToLibrary();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      {/* Decorative floating particles / confetti background effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 w-24 h-24 bg-amber-400/20 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-12 right-12 w-32 h-32 bg-emerald-400/20 rounded-full blur-3xl animate-pulse delay-700" />
        <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-cyan-400/20 rounded-full blur-xl animate-pulse delay-300" />
      </div>

      <div className="relative w-full max-w-lg bg-gradient-to-b from-white via-amber-50/40 to-white rounded-3xl p-6 sm:p-8 border-2 border-amber-300/80 shadow-2xl text-center space-y-6 overflow-hidden">
        {/* Top Celebration Ribbon / Banner */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-400/10 rounded-full blur-xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-400/10 rounded-full blur-xl" />

        {/* Big Gleaming Icon */}
        <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-400 via-yellow-300 to-emerald-400 rounded-3xl rotate-6 animate-pulse opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-400 via-teal-400 to-amber-400 rounded-3xl -rotate-3 opacity-80" />
          <div className="relative w-full h-full bg-gradient-to-br from-amber-500 to-emerald-600 rounded-3xl flex items-center justify-center shadow-lg border-2 border-white/80">
            <Gift className="w-12 h-12 sm:w-14 sm:h-14 text-white drop-shadow-md animate-bounce" />
          </div>
          <Sparkles className="absolute -top-2 -right-2 w-7 h-7 text-amber-500 animate-spin" style={{ animationDuration: '6s' }} />
          <PartyPopper className="absolute -bottom-1 -left-2 w-6 h-6 text-emerald-500" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black border border-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>تبریک ویژه مکتب‌خانه</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
            🎉 سهمیه امانت رایگان دریافت کردید! 🎉
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            همکلاسی عزیز <strong className="text-slate-900 font-black">{currentUser?.name}</strong>، سهمیه امانت رایگان با موفقیت به حساب شما اضافه شد.
          </p>
        </div>

        {/* Reward Highlight Badge */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-500 rounded-2xl text-white shadow-md space-y-1.5 border border-amber-300">
          <div className="text-xs font-bold opacity-90">پاداش و هدیه شما:</div>
          <div className="text-2xl sm:text-3xl font-black drop-shadow-xs flex items-center justify-center gap-2">
            <span>{toFarsiNumber(count)}</span>
            <span>امانت کاملاً رایگان کتاب</span>
            <Gift className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div className="text-[11px] font-medium bg-black/15 py-1 px-3 rounded-xl inline-block mt-1">
            بدون نیاز به پرداخت کارمزد ۱۰,۰۰۰ تومانی کارت‌به‌کارت!
          </div>
        </div>

        {/* Details Box */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 text-right space-y-2 text-xs">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
            <span className="text-slate-500 font-bold">علت و مناسبت هدیه:</span>
            <span className="text-slate-800 font-black">
              {isEvent
                ? `تکمیل ایونت «${reward.eventTitle || 'کتابخانه'}» 🏆`
                : (reward.reason || 'هدیه تشویقی مدیریت کتابخانه مدرسه 🎁')}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-bold">موجودی کل سهمیه‌های فعال شما:</span>
            <span className="text-emerald-700 font-black text-sm">
              {toFarsiNumber(totalBalance)} سهمیه رایگان
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
          <button
            onClick={handleGoToLibrary}
            disabled={isClosing}
            className="w-full sm:flex-1 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <BookOpen className="w-4 h-4" />
            <span>مشاهده طاقچه و امانت کتاب</span>
          </button>

          <button
            onClick={handleClose}
            disabled={isClosing}
            className="w-full sm:w-auto py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs sm:text-sm rounded-2xl transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50 border border-slate-200"
          >
            <Check className="w-4 h-4 text-emerald-600" />
            <span>متوجه شدم و متشکرم</span>
          </button>
        </div>
      </div>
    </div>
  );
};
