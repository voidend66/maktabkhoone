import React, { useState } from 'react';
import {
  BookOpen,
  ArrowLeftRight,
  Trophy,
  ShieldCheck,
  CheckCircle2,
  X,
  Sparkles,
  Clock,
  Coins,
  HeartHandshake,
  UserCheck,
  Building2
} from 'lucide-react';
import { MaktabKhanehLogo } from './MaktabKhanehBranding';

interface SystemGuideModalProps {
  onClose: () => void;
}

export const SystemGuideModal: React.FC<SystemGuideModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'lending' | 'league' | 'safety'>('overview');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-3xl w-full p-6 sm:p-8 space-y-6 dir-rtl text-right my-8 max-h-[90vh] overflow-y-auto relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 left-6 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <MaktabKhanehLogo size="md" />
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
              راهنما و توضیحات جامع مکتب‌خانه 🎒
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              آموزش گام‌به‌گام امانت کتاب، امنیت دانش‌آموزان و کسب مدال‌های افتخار
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>نحوه کار با مکتب‌خانه</span>
          </button>

          <button
            onClick={() => setActiveTab('lending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'lending'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>امانت و تحویل کتاب</span>
          </button>

          <button
            onClick={() => setActiveTab('league')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'league'
                ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>لیگ کتابخوانی & مدال‌ها</span>
          </button>

          <button
            onClick={() => setActiveTab('safety')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'safety'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>تایید مدیر و امنیت بچه ها</span>
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="bg-cyan-50 border border-cyan-200 p-4 rounded-2xl text-cyan-950 space-y-2 text-xs">
              <span className="font-black text-sm block">مکتب‌خانه چیست و چطور کار می‌کند؟</span>
              <p className="leading-relaxed text-slate-700">
                مکتب‌خانه یک شبکه آنلاین امانت کتاب دانش‌آموزی است. شما کتاب‌هایی که در منزل خوانده‌اید و نیاز ندارید را در طاقچه شخصی خود ثبت می‌کنید تا دوستان و هم‌کلاسی‌های شما بتوانند آن‌ها را امانت بگیرند. در مقابل، شما هم می‌توانید صدها کتاب جذاب از طاقچه سایر دانش‌آموزان امانت بگیرید!
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-2 shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-800 font-black flex items-center justify-center">۱</div>
                <div className="font-bold text-slate-900">۱. اشتراک‌گذاری کتاب</div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  کتاب‌های خود را در بخش «طاقچه من» اضافه کنید تا در کتابخانه اصلی مدرسه قرار بگیرد.
                </p>
              </div>

              <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-2 shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 font-black flex items-center justify-center">۲</div>
                <div className="font-bold text-slate-900">۲. ثبت درخواست امانت</div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  کتاب مورد علاقه خود را انتخاب کرده و دکمه «درخواست امانت» را بزنید.
                </p>
              </div>

              <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-2 shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center">۳</div>
                <div className="font-bold text-slate-900">۳. تحویل در مدرسه / منزل</div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  کتاب را در زنگ تفریح مدرسه یا تحویل درب منزل از مالک تحویل بگیرید و مطالعه کنید!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Lending Details */}
        {activeTab === 'lending' && (
          <div className="space-y-4 animate-in fade-in duration-150 text-xs">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-2 text-slate-800">
              <span className="font-black text-slate-950 text-sm block flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                قوانین مهلت امانت و تحویل کتاب
              </span>
              <ul className="list-disc list-inside space-y-1.5 text-slate-700">
                <li><strong>مدت امانت استاندارد:</strong> ۷ روز کاری برای هر کتاب تعیین شده است.</li>
                <li><strong>تمدید مهلت:</strong> در صورت نیاز می‌توانید ۱ بار درخواست تمدید امانت ثبت کنید.</li>
                <li><strong>مهلت ۱۲ ساعته تحویل:</strong> تحویل کتاب را می‌توانید از منزل و بدون نیاز به همراه داشتن گوشی در مدرسه ثبت نمایید.</li>
                <li><strong>امکان بازخورد دوطرفه:</strong> پس از پس دادن کتاب، به امانت‌گیرنده یا مالِک کتاب امتیاز و نظر دهید!</li>
              </ul>
            </div>
          </div>
        )}

        {/* Tab 3: League & Medals */}
        {activeTab === 'league' && (
          <div className="space-y-4 animate-in fade-in duration-150 text-xs">
            <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 p-4 rounded-2xl text-slate-950 space-y-2">
              <span className="font-black text-sm block flex items-center gap-1.5">
                <Trophy className="w-5 h-5 text-slate-950" />
                لیگ کتابخوانی و کسب مدال‌های افتخار
              </span>
              <p className="leading-relaxed font-bold">
                با خواندن کتاب‌های بیشتر و به اشتراک‌گذاری کتاب‌های مفید، امتیاز شما در جدول رده‌بندی لیگ کتابخوانی مدرسه بالا می‌رود و مدال‌های افتخار دریافت می‌کنید!
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-3 bg-slate-50 border rounded-2xl">
                <div className="text-2xl mb-1">👑</div>
                <div className="font-black text-slate-900">سفیر کتابخوانی</div>
                <div className="text-[10px] text-slate-500 mt-0.5">ثبت ۱۰+ کتاب</div>
              </div>
              <div className="p-3 bg-slate-50 border rounded-2xl">
                <div className="text-2xl mb-1">⭐</div>
                <div className="font-black text-slate-900">کتابخوان برتر</div>
                <div className="text-[10px] text-slate-500 mt-0.5">خواندن ۵+ کتاب</div>
              </div>
              <div className="p-3 bg-slate-50 border rounded-2xl">
                <div className="text-2xl mb-1">🤝</div>
                <div className="font-black text-slate-900">امانت‌دار خوش‌قول</div>
                <div className="text-[10px] text-slate-500 mt-0.5">امتیاز ۵ از دوستان</div>
              </div>
              <div className="p-3 bg-slate-50 border rounded-2xl">
                <div className="text-2xl mb-1">🚀</div>
                <div className="font-black text-slate-900">پیشگام مکتب‌خانه</div>
                <div className="text-[10px] text-slate-500 mt-0.5">عضو فعال کتابخانه</div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Safety & Admin Approval */}
        {activeTab === 'safety' && (
          <div className="space-y-4 animate-in fade-in duration-150 text-xs">
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl space-y-2 text-emerald-950">
              <span className="font-black text-sm block flex items-center gap-1.5 text-emerald-900">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                تایید سلامت هویت و نظارت مسئول مدرسه 🛡️
              </span>
              <p className="leading-relaxed text-slate-700">
                برای حفظ امنیت بچه‌ها و عدم حضور افراد غریبه و ناشناس در سیستم، تمامی حساب‌های کاربری پس از ثبت‌نام اولیه توسط مدیر و مسئول کتابخانه مدرسه احراز هویت و تایید خواهند شد.
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-700 mt-2">
                <li>تنها دانش‌آموزان تاییدشده امکان ثبت درخواست امانت کتاب را دارند.</li>
                <li>تمام امانت‌ها تحت نظارت قوانین مدرسه انجام می‌شود.</li>
                <li>شماره تلفن‌ها و اطلاعات شخصی دانش‌آموزان به صورت کاملاً امن نگهداری می‌شود.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Bottom Action Button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-black text-xs rounded-2xl shadow-lg shadow-cyan-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>متوجه شدم! شروع کار با مکتب‌خانه</span>
          </button>
        </div>
      </div>
    </div>
  );
};
