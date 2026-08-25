import React from 'react';
import {
  ShieldCheck,
  BookOpen,
  Clock,
  PhoneCall,
  CreditCard,
  AlertTriangle,
  Home,
  CheckCircle2,
  X,
  Sparkles,
  RefreshCw,
  Award
} from 'lucide-react';
import { MaktabKhanehLogo, SloganBadge } from './MaktabKhanehBranding';

interface RulesProps {
  isOpen?: boolean;
  onClose?: () => void;
  isStandalonePage?: boolean;
}

export const RulesContent: React.FC = () => {
  return (
    <div className="space-y-6 text-slate-800 dir-rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-cyan-600 via-sky-700 to-indigo-900 text-white p-6 rounded-3xl shadow-lg border border-cyan-400 relative overflow-hidden space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-2xl border border-white/20">
              <ShieldCheck className="w-8 h-8 text-amber-300" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">قوانین و مقررات رسمی مکتب خونه 🎒</h2>
              <p className="text-xs text-cyan-100 font-bold mt-0.5">
                راهنمای جامع امانت کتاب، حقوق امانت‌دهندگان و حفظ سلامت کتاب‌ها
              </p>
            </div>
          </div>
          <SloganBadge />
        </div>
      </div>

      {/* 8 Golden Rules List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Rule 1 */}
        <div className="bg-white p-5 rounded-2xl border-2 border-cyan-100 hover:border-cyan-400 shadow-xs space-y-2 transition">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 bg-cyan-500 text-white rounded-xl font-black text-xs flex items-center justify-center shrink-0">
              ۱
            </span>
            <PhoneCall className="w-5 h-5 text-cyan-600" />
            <h3 className="font-black text-slate-900 text-sm">ثبت‌نام و احراز هویت دانش‌آموزان</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            برای عضویت در مکتب خونه، ثبت اطلاعات دانش‌آموزی و نام کلاس الزامی است. پس از ثبت‌نام، حساب کاربری توسط مسئول کتابخانه مدرسه بررسی و تایید می‌گردد.
          </p>
        </div>

        {/* Rule 2 */}
        <div className="bg-white p-5 rounded-2xl border-2 border-orange-100 hover:border-orange-400 shadow-xs space-y-2 transition">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 bg-orange-500 text-white rounded-xl font-black text-xs flex items-center justify-center shrink-0">
              ۲
            </span>
            <BookOpen className="w-5 h-5 text-orange-600" />
            <h3 className="font-black text-slate-900 text-sm">سقف امانت: فقط ۱ کتاب در یک زمان</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            هر کاربر در یک زمان فقط می‌تواند **۱ کتاب** در امانت داشته باشد. تنها پس از تحویل دادن و ثبت عودت کتاب قبلی، امکان ثبت درخواست امانت برای کتاب جدید فعال خواهد شد.
          </p>
        </div>

        {/* Rule 3 */}
        <div className="bg-white p-5 rounded-2xl border-2 border-sky-100 hover:border-sky-400 shadow-xs space-y-2 transition">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 bg-sky-500 text-white rounded-xl font-black text-xs flex items-center justify-center shrink-0">
              ۳
            </span>
            <Clock className="w-5 h-5 text-sky-600" />
            <h3 className="font-black text-slate-900 text-sm">مدت امانت استاندارد: ۷ الی ۱۴ روز</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            مهلت مطالعه هر کتاب امانت گرفته شده **۷ الی ۱۴ روز** است. تاریخ حدود عودت در کارت هر کتاب در امانت به روشنی نمایش داده می‌شود.
          </p>
        </div>

        {/* Rule 4 */}
        <div className="bg-white p-5 rounded-2xl border-2 border-indigo-100 hover:border-indigo-400 shadow-xs space-y-2 transition">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 bg-indigo-600 text-white rounded-xl font-black text-xs flex items-center justify-center shrink-0">
              ۴
            </span>
            <RefreshCw className="w-5 h-5 text-indigo-600" />
            <h3 className="font-black text-slate-900 text-sm">تمدید مهلت: با هماهنگی طرفین و مدیر</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            در صورت نیاز به زمان بیشتر، امانت‌گیرنده می‌تواند درخواست تمدید در سایت ثبت کند. تمدید مهلت پس از بررسی و تایید فعال خواهد شد.
          </p>
        </div>

        {/* Rule 5 */}
        <div className="bg-white p-5 rounded-2xl border-2 border-emerald-100 hover:border-emerald-400 shadow-xs space-y-2 transition">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 bg-emerald-600 text-white rounded-xl font-black text-xs flex items-center justify-center shrink-0">
              ۵
            </span>
            <CreditCard className="w-5 h-5 text-emerald-600" />
            <h3 className="font-black text-slate-900 text-sm">هزینه امانت و پرداخت کارت به کارت</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            هزینه امانت گرفتن هر کتاب <strong>مبلغ مناسب ۱۰,۰۰۰ تومان</strong> است. این مبلغ برای خرید کتاب‌های جدید برای کتابخانه مدرسه و هزینه‌های پشتیبانی و نگهداری سایت گرفته می‌شود. پرداخت به صورت <strong>کارت به کارت</strong> انجام شده و اطلاعات شماره کارت در صفحه امانت نمایش داده می‌شود. امانت‌گیرنده اطلاعات پرداخت (کد پیگیری، تاریخ و فیش) را بارگذاری کرده و تایید پرداخت و تکمیل امانت پس از تایید مدیر سایت (پارسا فیض) صورت می‌پذیرد.
          </p>
        </div>

        {/* Rule 6 */}
        <div className="bg-white p-5 rounded-2xl border-2 border-amber-100 hover:border-amber-400 shadow-xs space-y-2 transition">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 bg-amber-500 text-white rounded-xl font-black text-xs flex items-center justify-center shrink-0">
              ۶
            </span>
            <Home className="w-5 h-5 text-amber-600" />
            <h3 className="font-black text-slate-900 text-sm">مهلت تایید ۱۲ ساعته نیم‌روزی از منزل</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            از آنجا که دانش‌آموزان در مدرسه به گوشی دسترسی ندارند، تایید تحویل یا پس گرفتن کتاب تا **۱۲ ساعت (نیم‌روز)** فرصت دارد تا از خانه در سایت ثبت گردد.
          </p>
        </div>

        {/* Rule 7 */}
        <div className="bg-white p-5 rounded-2xl border-2 border-rose-100 hover:border-rose-400 shadow-xs space-y-2 transition">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 bg-rose-600 text-white rounded-xl font-black text-xs flex items-center justify-center shrink-0">
              ۷
            </span>
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <h3 className="font-black text-slate-900 text-sm">جریمه آسیب‌زدن و جبران خسارت</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            امانت‌گیرنده موظف است کتاب را تمیز و سالم نگه دارد. در صورت پارگی یا آسیب شدید، امانت‌گیرنده موظف به تهیه جلد نو یا جبران خسارت به امانت‌دهنده است.
          </p>
        </div>

        {/* Rule 8 */}
        <div className="bg-white p-5 rounded-2xl border-2 border-purple-100 hover:border-purple-400 shadow-xs space-y-2 transition">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 bg-purple-600 text-white rounded-xl font-black text-xs flex items-center justify-center shrink-0">
              ۸
            </span>
            <Award className="w-5 h-5 text-purple-600" />
            <h3 className="font-black text-slate-900 text-sm">امتیازدهی و فعال‌سازی مدال‌های لیگ مکتب خونه</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            پس از پایان امانت، هر دو طرف به خوش‌قولی و امانت‌داری امتیاز می‌دهند. امتیاز بالا باعث کسب مدال‌های افتخار و رتبه اول در جدول رده‌بندی لیگ مکتب خونه خواهد شد.
          </p>
        </div>
      </div>
    </div>
  );
};

export const RulesModal: React.FC<RulesProps> = ({ isOpen = true, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-50 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        {/* Top Header Bar */}
        <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <MaktabKhanehLogo size="sm" showSlogan={false} />
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <RulesContent />
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl shadow-md shadow-cyan-200 transition"
          >
            متوجه قوانین شدم • متشکرم
          </button>
        </div>
      </div>
    </div>
  );
};
