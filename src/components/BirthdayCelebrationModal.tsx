import React from 'react';
import { Cake, Gift, Sparkles, X, Heart, BookOpen, PartyPopper } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface BirthdayCelebrationModalProps {
  onClose: () => void;
  rewardCount: number;
}

export const BirthdayCelebrationModal: React.FC<BirthdayCelebrationModalProps> = ({
  onClose,
  rewardCount
}) => {
  const { currentUser, systemConfig } = useApp();

  const customMessage =
    systemConfig?.birthdayCustomMessage ||
    'زادروزت فرخنده باد! مکتب‌خانه تولد شما را تبریک می‌گوید و این هدیه تقدیم شماست 🎂🎁';

  return (
    <div className="fixed inset-0 z-70 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 border-2 border-amber-400 rounded-3xl max-w-md w-full p-6 text-white text-center shadow-2xl relative animate-in zoom-in-95 duration-300 space-y-5 overflow-hidden">
        {/* Glow ambient background circle */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Close X button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cake Icon with confetti decoration */}
        <div className="relative pt-2">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-400 text-slate-950 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/30 animate-bounce">
            <Cake className="w-10 h-10" />
          </div>
          <div className="absolute top-1 right-1/4 text-2xl animate-spin">✨</div>
          <div className="absolute top-4 left-1/4 text-2xl animate-pulse">🎈</div>
        </div>

        {/* Congratulatory Text */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs px-3.5 py-1 rounded-full shadow-md">
            <PartyPopper className="w-3.5 h-3.5" />
            <span>تولدت مبارک {currentUser?.name}! 🎉</span>
          </div>

          <h3 className="text-xl font-black text-amber-300">
            زادروزت فرخنده و مبارک باد! 🎂🎈
          </h3>

          <p className="text-xs text-slate-300 leading-relaxed font-medium px-2">
            {customMessage}
          </p>
        </div>

        {/* Free Loan Gift Box */}
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-emerald-500/15 border-2 border-amber-400/80 rounded-2xl p-4 text-center space-y-1.5 shadow-inner">
          <span className="text-[11px] font-bold text-amber-300 block">هدیه ویژه تولد شما از طرف مکتب‌خانه:</span>
          <div className="text-xl font-black text-white flex items-center justify-center gap-2">
            <Gift className="w-6 h-6 text-amber-400 animate-bounce" />
            <span>{rewardCount} سهمیه امانت رایگان کتاب</span>
          </div>
          <p className="text-[11px] text-emerald-300 font-bold">
            به موجودی سهمیه‌های شما اضافه شد! (بدون پرداخت ۱۰,۰۰۰ تومان کارمزد)
          </p>
        </div>

        {/* Explore library button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 hover:from-amber-600 hover:to-orange-600 active:scale-95 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-500/25 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>عالیه! بریم کتاب‌های کتابخونه رو ببینیم 📚</span>
          </button>
        </div>
      </div>
    </div>
  );
};
