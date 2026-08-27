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
    sm: 'w-12 h-12 sm:w-14 sm:h-14',
    md: 'w-14 h-14 sm:w-16 sm:h-16',
    lg: 'w-14 h-14 sm:w-20 sm:h-20',
    xl: 'w-20 h-20 sm:w-32 sm:h-32'
  };

  return (
    <div className={`flex items-center gap-2.5 sm:gap-4 ${className}`}>
      {/* Featured House Logo Image with generous sizing on mobile */}
      <div className={`relative ${sizeMap[size]} shrink-0 transition-all duration-300 hover:scale-105 group`}>
        <div className="w-full h-full rounded-2xl bg-gradient-to-br from-cyan-500 via-sky-600 to-amber-400 p-1 shadow-md shadow-cyan-900/20 ring-2 sm:ring-4 ring-cyan-500/20 overflow-hidden">
          <img
            src={houseLogoImg}
            alt="لوگوی مکتب خونه"
            className="w-full h-full object-cover rounded-xl bg-white transition-transform duration-300 group-hover:scale-110"
          />
        </div>
        {/* Floating Paper Airplane decoration */}
        <div className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white p-0.5 sm:p-1 rounded-full text-[10px] sm:text-xs shadow-xs animate-bounce">
          ✈️
        </div>
      </div>

      {/* Brand Title with Beautiful Persian Calligraphy & Subtitle */}
      <div className="flex flex-col justify-center select-none">
        <h1 className="text-2xl sm:text-4xl font-['Lalezar',cursive] tracking-wide flex items-center leading-none">
          <span className="text-cyan-800 drop-shadow-xs">مَکـتَب‌</span>
          <span className="text-amber-500 drop-shadow-xs">خـونـه</span>
        </h1>

        {/* Replaced 'امانت کتاب' badge with simple, clear subtitle */}
        <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
          <p className="text-[11px] sm:text-xs font-black text-slate-600 flex items-center gap-1 leading-tight">
            <span>سامانه آنلاین تبادل و امانت کتاب</span>
          </p>
        </div>

        {showSlogan && (
          <p className="hidden md:flex text-[11px] font-bold text-slate-400 items-center gap-1 mt-0.5">
            <span className="text-cyan-600">•</span> هر کتاب، یک سفر
            <span className="text-orange-500">•</span> هر امانت، یک اعتماد
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
            <h2 className="text-2xl sm:text-3xl font-['Lalezar',cursive] text-amber-300 tracking-wide">
              مکتب‌خونه • پاتوق کتاب‌خوان‌ها
            </h2>
            <span className="text-amber-300 text-lg">🎒</span>
          </div>
          <p className="text-xs sm:text-sm text-cyan-100 font-bold tracking-wide bg-cyan-950/70 py-2 px-3 rounded-xl border border-cyan-500/30">
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
          <span className="text-xs font-black text-slate-900">فرصت طلایی یک‌هفته‌ای</span>
        </div>
      </div>
    </div>
  );
};
