import React from 'react';
import { MedalDefinition, getTierBadgeStyle } from '../data/medalsData';
import { Sparkles, Trophy, X, PartyPopper } from 'lucide-react';

interface MedalUnlockedCelebrationModalProps {
  definition: MedalDefinition;
  onClose: () => void;
}

export const MedalUnlockedCelebrationModal: React.FC<MedalUnlockedCelebrationModalProps> = ({
  definition,
  onClose
}) => {
  const tierStyle = getTierBadgeStyle(definition.tier);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div
        className="relative w-full max-w-md bg-white rounded-3xl p-6 text-center shadow-2xl border border-amber-200 overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Celebration Aura */}
        <div className="absolute -top-24 -left-24 w-56 h-56 bg-amber-400/25 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-56 h-56 bg-purple-400/25 rounded-full blur-3xl animate-pulse delay-500" />

        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all z-20"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Celebration Badges */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black mb-3">
          <PartyPopper className="w-4 h-4 text-amber-600 animate-bounce" />
          <span>تبریک! نشان جدیدی باز شد!</span>
        </div>

        {/* 3D Image Artwork */}
        <div className="relative mx-auto my-3 w-40 h-40">
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-400 to-indigo-500 rounded-3xl blur-xl opacity-50 animate-pulse" />
          <div className="relative w-full h-full rounded-3xl overflow-hidden ring-4 ring-amber-400/60 shadow-2xl">
            <img
              src={definition.imageUrl}
              alt={definition.title}
              className="w-full h-full object-cover select-none"
            />
          </div>
        </div>

        {/* Tier and Title */}
        <div className="my-2">
          <span
            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase shadow-xs mb-1.5 ${tierStyle.pillClass}`}
          >
            {definition.tierTitle}
          </span>
          <h2 className="text-2xl font-black text-slate-900">
            {definition.title}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            {definition.description}
          </p>
        </div>

        {/* Special Perk / Property */}
        <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-3 my-4 text-right">
          <div className="flex items-center gap-1.5 text-amber-900 font-extrabold text-xs mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>خاصیت و امتیاز کسب‌شده:</span>
          </div>
          <p className="text-xs text-slate-800 font-medium leading-relaxed">
            {definition.property}
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-extrabold text-sm shadow-lg shadow-indigo-500/25 transition-all"
        >
          دریافت و ثبت در کارنامه ✨
        </button>
      </div>
    </div>
  );
};
