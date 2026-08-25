import React from 'react';
import { Sparkles, BookOpen, Lamp, Navigation, Backpack, Book, Lightbulb, Compass, ShieldCheck } from 'lucide-react';
import houseLogoImg from '../assets/images/maktabkhaneh_house_logo_1785878189626.jpg';

export { houseLogoImg };

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSlogan?: boolean;
}

export const MaktabKhanehLogo: React.FC<LogoProps> = ({
  className = '',
  size = 'lg',
  showSlogan = true
}) => {
  const sizeMap = {
    sm: 'w-10 h-10 sm:w-12 sm:h-12',
    md: 'w-12 h-12 sm:w-16 sm:h-16',
    lg: 'w-12 h-12 sm:w-20 sm:h-20',
    xl: 'w-20 h-20 sm:w-32 sm:h-32'
  };

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3.5 ${className}`}>
      {/* Featured House Logo Image in clean, vibrant frame */}
      <div className={`relative ${sizeMap[size]} shrink-0 transition-all duration-300 hover:scale-105 group`}>
        <div className="w-full h-full rounded-xl sm:rounded-2xl bg-gradient-to-br from-cyan-500 via-sky-600 to-amber-400 p-0.5 sm:p-1 shadow-md shadow-cyan-900/20 ring-2 sm:ring-4 ring-cyan-500/20 overflow-hidden">
          <img
            src={houseLogoImg}
            alt="لوگوی مکتب خونه"
            className="w-full h-full object-cover rounded-lg sm:rounded-xl bg-white transition-transform duration-300 group-hover:scale-110"
          />
        </div>
        {/* Floating Paper Airplane decoration */}
        <div className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white p-0.5 sm:p-1 rounded-full text-[10px] sm:text-xs shadow-xs animate-bounce">
          ✈️
        </div>
      </div>

      {/* Brand Title & Slogan */}
      <div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <h1 className="text-xl sm:text-3xl font-black tracking-tight flex items-center gap-1 leading-none">
            <span className="text-cyan-700">مکتب</span>
            <span className="text-orange-500">خونه</span>
          </h1>
          <span className="bg-gradient-to-r from-cyan-600 to-sky-600 text-white text-[9px] sm:text-[11px] font-black px-2 sm:px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-0.5">
            <span>امانت کتاب</span>
            <span>📚</span>
          </span>
        </div>
        {showSlogan && (
          <p className="hidden sm:flex text-xs font-black text-slate-600 mt-1 items-center gap-1 flex-wrap">
            <span className="text-cyan-600 font-bold">•</span> هر کتاب، یک سفر
            <span className="text-orange-500 font-bold">•</span> هر امانت، یک اعتماد
          </p>
        )}
      </div>
    </div>
  );
};

export const MaktabKhanehHouseLogo: React.FC<{ size?: 'sm' | 'md' | 'lg' | 'hero'; className?: string }> = ({
  size = 'md',
  className = ''
}) => {
  const sizeMap = {
    sm: 'max-w-xs',
    md: 'max-w-md',
    lg: 'max-w-lg',
    hero: 'max-w-xl'
  };

  return (
    <div className={`relative inline-block group ${sizeMap[size]} ${className}`}>
      <div className="bg-gradient-to-br from-cyan-700 via-sky-800 to-indigo-950 text-white rounded-3xl p-4 sm:p-6 border-4 border-amber-400 shadow-xl space-y-3 relative overflow-hidden text-center">
        {/* Image Display */}
        <div className="relative rounded-2xl overflow-hidden border-2 border-amber-300 shadow-md bg-white p-1">
          <img
            src={houseLogoImg}
            alt="خانه کتابی مکتب خونه"
            className="w-full h-auto object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        {/* Text Banner & Slogan */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-center gap-2">
            <span className="text-amber-300 text-lg">💡</span>
            <h2 className="text-xl sm:text-2xl font-black text-amber-300 tracking-tight">
              مکتب خونه • پاتوق کتاب خوارها
            </h2>
            <span className="text-amber-300 text-lg">🎒</span>
          </div>
          <p className="text-xs sm:text-sm text-cyan-100 font-black tracking-wide bg-cyan-950/70 py-2 px-3 rounded-xl border border-cyan-500/30">
            • هر کتاب، یک سفر • هر امانت، یک اعتماد •
          </p>
        </div>
      </div>
    </div>
  );
};

export const SloganBadge: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`inline-flex items-center gap-2 bg-gradient-to-r from-cyan-600 via-sky-600 to-orange-500 text-white px-4 py-2 rounded-full text-xs font-black shadow-md shadow-cyan-600/20 border-2 border-amber-300 ${className}`}>
      <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
      <span>• هر کتاب، یک سفر • هر امانت، یک اعتماد •</span>
    </div>
  );
};

export const BoyishMotifsBanner: React.FC = () => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
      <div className="bg-white/90 backdrop-blur-xs p-3.5 rounded-2xl border-2 border-cyan-200 shadow-xs flex items-center gap-2.5 text-slate-800">
        <div className="p-2.5 bg-cyan-100 text-cyan-800 rounded-xl">
          <Backpack className="w-5 h-5 text-cyan-700" />
        </div>
        <div>
          <span className="text-[10px] text-cyan-700 font-bold block">کوله امانت کتاب</span>
          <span className="text-xs font-black text-slate-900">امانت‌داری آسان</span>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-xs p-3.5 rounded-2xl border-2 border-orange-200 shadow-xs flex items-center gap-2.5 text-slate-800">
        <div className="p-2.5 bg-orange-100 text-orange-800 rounded-xl">
          <Lightbulb className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <span className="text-[10px] text-orange-700 font-bold block">چراغ مطالعه مطالعاتی</span>
          <span className="text-xs font-black text-slate-900">سفر در دنیای داستان</span>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-xs p-3.5 rounded-2xl border-2 border-amber-200 shadow-xs flex items-center gap-2.5 text-slate-800">
        <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
          <Book className="w-5 h-5 text-amber-700" />
        </div>
        <div>
          <span className="text-[10px] text-amber-700 font-bold block">دسته‌بندی‌های متنوع</span>
          <span className="text-xs font-black text-slate-900">داستانی، علمی و درسی</span>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-xs p-3.5 rounded-2xl border-2 border-indigo-200 shadow-xs flex items-center gap-2.5 text-slate-800">
        <div className="p-2.5 bg-indigo-100 text-indigo-800 rounded-xl">
          <Navigation className="w-5 h-5 text-indigo-700 rotate-45" />
        </div>
        <div>
          <span className="text-[10px] text-indigo-700 font-bold block">موشک کاغذی ایده‌ها</span>
          <span className="text-xs font-black text-slate-900">تایید ۱۲ ساعته امانت</span>
        </div>
      </div>
    </div>
  );
};
