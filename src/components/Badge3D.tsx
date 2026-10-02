import React, { useState, useRef } from 'react';
import { MedalDefinition, getTierBadgeStyle } from '../data/medalsData';
import { Lock, Sparkles, CheckCircle2, Info, Award } from 'lucide-react';

interface Badge3DProps {
  definition: MedalDefinition;
  isUnlocked: boolean;
  progress?: { current: number; target: number; percentage: number; label: string };
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  showProgress?: boolean;
  awardedAt?: string;
  adminNote?: string;
}

export const Badge3D: React.FC<Badge3DProps> = ({
  definition,
  isUnlocked,
  progress,
  size = 'md',
  onClick,
  showProgress = true,
  awardedAt,
  adminNote
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState<number>(0);
  const [rotateY, setRotateY] = useState<number>(0);
  const [shineOpacity, setShineOpacity] = useState<number>(0);
  const [shinePos, setShinePos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });

  const tierStyle = getTierBadgeStyle(definition.tier);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = -((y - centerY) / centerY) * 12;
    const rotY = ((x - centerX) / centerX) * 12;

    setRotateX(rotX);
    setRotateY(rotY);
    setShineOpacity(0.45);
    setShinePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100
    });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setShineOpacity(0);
  };

  // Dimensions based on size
  const sizeClasses = {
    sm: 'w-36 p-3 text-xs',
    md: 'w-56 p-4 text-sm',
    lg: 'w-64 p-5 text-base'
  }[size];

  const imgSizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  }[size];

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        transform: `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`,
        transition: 'transform 0.15s ease-out, box-shadow 0.2s ease-out'
      }}
      className={`group relative rounded-3xl cursor-pointer select-none overflow-hidden transition-all duration-300 border ${
        isUnlocked
          ? `bg-white/95 backdrop-blur-md ${definition.badgeBorder} shadow-lg hover:shadow-2xl ${definition.badgeGlow}`
          : 'bg-slate-100/80 border-slate-300/80 opacity-80 hover:opacity-100 hover:border-slate-400'
      } ${sizeClasses}`}
    >
      {/* Dynamic Specular Reflection (Shine flare) */}
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl transition-opacity duration-300 mix-blend-overlay"
        style={{
          opacity: shineOpacity,
          background: `radial-gradient(circle at ${shinePos.x}% ${shinePos.y}%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 65%)`
        }}
      />

      {/* Top Header Row: Tier Pill & Status */}
      <div className="flex items-center justify-between gap-1.5 mb-2.5 relative z-10">
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-xs ${tierStyle.pillClass}`}
        >
          {definition.tierTitle}
        </span>

        {isUnlocked ? (
          <span className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>کسب‌شده</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full">
            <Lock className="w-2.5 h-2.5 text-slate-500" />
            <span>قفل</span>
          </span>
        )}
      </div>

      {/* 3D Image Artwork Vessel */}
      <div className="relative flex items-center justify-center my-2 z-10">
        <div
          className={`relative rounded-2xl overflow-hidden p-1 transition-transform duration-300 group-hover:scale-105 ${
            isUnlocked
              ? 'ring-4 ring-offset-2 ring-amber-400/30'
              : 'filter grayscale contrast-75 ring-1 ring-slate-300'
          } ${imgSizeClasses}`}
        >
          {/* Subtle Ambient Glow Behind Image */}
          {isUnlocked && (
            <div
              className={`absolute inset-0 bg-gradient-to-tr ${definition.badgeBg} blur-lg -z-10`}
            />
          )}

          <img
            src={definition.imageUrl}
            alt={definition.title}
            className="w-full h-full object-cover rounded-xl drop-shadow-md select-none pointer-events-none"
            loading="lazy"
          />

          {/* Lock Overlay on Image if Locked */}
          {!isUnlocked && (
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
              <div className="w-8 h-8 rounded-full bg-slate-800/80 border border-slate-600/80 flex items-center justify-center shadow-md">
                <Lock className="w-4 h-4 text-slate-200" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Title & Short Description */}
      <div className="text-center relative z-10 mt-1">
        <h3
          className={`font-black tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors ${
            size === 'sm' ? 'text-xs' : 'text-sm'
          }`}
        >
          {definition.title}
        </h3>
        <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
          {definition.property}
        </p>
      </div>

      {/* Progress Bar (If Locked and Progress is provided) */}
      {!isUnlocked && showProgress && progress && (
        <div className="mt-3 pt-2 border-t border-slate-200/80 relative z-10">
          <div className="flex items-center justify-between text-[10px] text-slate-600 font-bold mb-1">
            <span>پیشرفت:</span>
            <span className="font-mono text-slate-800">{progress.percentage}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(5, progress.percentage)}%` }}
            />
          </div>
          <span className="block text-[9px] text-slate-400 font-medium text-center mt-1 truncate">
            {progress.label}
          </span>
        </div>
      )}

      {/* Date Awarded or Admin Note (If Unlocked) */}
      {isUnlocked && awardedAt && (
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 relative z-10">
          <span className="flex items-center gap-0.5 text-emerald-700 font-medium">
            <Sparkles className="w-2.5 h-2.5 text-amber-500" /> افتخار فعال
          </span>
          <span className="font-mono text-[9px]">
            {new Date(awardedAt).toLocaleDateString('fa-IR')}
          </span>
        </div>
      )}

      {/* Hover Info Prompt */}
      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-slate-400 z-20">
        <Info className="w-3.5 h-3.5" />
      </div>
    </div>
  );
};
