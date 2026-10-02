import React from 'react';
import { MedalDefinition, getTierBadgeStyle } from '../data/medalsData';
import { X, Award, Sparkles, CheckCircle2, Lock, ShieldCheck, HeartHandshake, Compass } from 'lucide-react';

interface BadgeDetailModalProps {
  definition: MedalDefinition;
  isUnlocked: boolean;
  onClose: () => void;
  progress?: { current: number; target: number; percentage: number; label: string };
  awardedAt?: string;
  adminNote?: string;
}

export const BadgeDetailModal: React.FC<BadgeDetailModalProps> = ({
  definition,
  isUnlocked,
  onClose,
  progress,
  awardedAt,
  adminNote
}) => {
  const tierStyle = getTierBadgeStyle(definition.tier);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background Ambient Glow */}
        <div
          className={`absolute top-0 inset-x-0 h-40 bg-gradient-to-b ${definition.badgeBg} opacity-80 pointer-events-none -z-0`}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-full bg-white/80 hover:bg-white text-slate-500 hover:text-slate-800 shadow-xs transition-all z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header / Hero 3D Badge Visual */}
        <div className="pt-8 pb-4 px-6 flex flex-col items-center text-center relative z-10">
          {/* Tier Tag */}
          <div className="mb-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm ${tierStyle.pillClass}`}
            >
              {definition.tierTitle}
            </span>
          </div>

          {/* 3D Visual Artwork */}
          <div className="relative group my-2">
            <div
              className={`w-36 h-36 sm:w-40 sm:h-40 rounded-3xl p-1.5 transition-all duration-300 shadow-xl ${
                isUnlocked
                  ? `ring-4 ring-offset-4 ring-amber-400/40 ${definition.badgeGlow}`
                  : 'filter grayscale contrast-75 ring-2 ring-slate-300'
              }`}
            >
              <img
                src={definition.imageUrl}
                alt={definition.title}
                className="w-full h-full object-cover rounded-2xl drop-shadow-md select-none pointer-events-none"
              />

              {!isUnlocked && (
                <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px] flex flex-col items-center justify-center rounded-2xl text-white">
                  <div className="w-10 h-10 rounded-full bg-slate-800/90 border border-slate-600 flex items-center justify-center shadow-lg mb-1">
                    <Lock className="w-5 h-5 text-slate-200" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-200">هنوز باز نشده</span>
                </div>
              )}
            </div>
          </div>

          {/* Title & Lore */}
          <h2 className="text-2xl font-black text-slate-900 mt-2 flex items-center justify-center gap-2">
            <span>{definition.title}</span>
            <span className="text-sm font-sans font-medium text-slate-400">({definition.titleEn})</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
            {definition.description}
          </p>
        </div>

        {/* Modal Scrollable Body */}
        <div className="px-6 py-4 space-y-4 overflow-y-auto text-right text-slate-800 text-sm">
          {/* Card: خاصیت و مزیت کاربردی (Special Perk / Property) */}
          <div className="bg-gradient-to-r from-amber-50/80 via-emerald-50/50 to-indigo-50/60 p-4 rounded-2xl border border-amber-200/70 shadow-2xs">
            <div className="flex items-center gap-2 mb-1.5 text-amber-900 font-extrabold text-xs">
              <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
              <span>خاصیت و امتیاز ویژه در سامانه:</span>
            </div>
            <p className="text-xs text-slate-800 font-medium leading-relaxed">
              {definition.property}
            </p>
          </div>

          {/* Card: مناسبت و فلسفه نماد (Occasion & Lore) */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
            <div className="flex items-center gap-2 mb-1.5 text-slate-800 font-bold text-xs">
              <Award className="w-4 h-4 text-indigo-600" />
              <span>مناسبت و فلسفه این نشان:</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {definition.occasion}
            </p>
          </div>

          {/* Card: شرط کسب خودکار (Requirement / Criteria) */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
            <div className="flex items-center gap-2 mb-1.5 text-slate-800 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>شرط دریافت خودکار:</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-mono">
              {definition.criteriaDesc}
            </p>
          </div>

          {/* Progress (if locked) */}
          {!isUnlocked && progress && (
            <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-950 mb-1.5">
                <span>میزان پیشرفت شما تا باز شدن:</span>
                <span className="font-mono text-indigo-700">{progress.percentage}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden mb-1">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(5, progress.percentage)}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-500 block text-left">
                {progress.label}
              </span>
            </div>
          )}

          {/* Awarded Info (if unlocked) */}
          {isUnlocked && (
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>این نشان افتخار در کارنامه شما ثبت شده است!</span>
              </div>
              {awardedAt && (
                <span className="text-[11px] font-mono text-emerald-700">
                  {new Date(awardedAt).toLocaleDateString('fa-IR')}
                </span>
              )}
            </div>
          )}

          {/* Admin Note (if any) */}
          {adminNote && (
            <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200 text-xs text-amber-950">
              <span className="font-bold block mb-1">یادداشت تقدیر مدیر مدرسه:</span>
              <p className="italic">{adminNote}</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all"
          >
            متوجه شدم
          </button>
        </div>
      </div>
    </div>
  );
};
