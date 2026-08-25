import React from 'react';
import {
  Sparkles,
  BookOpen,
  Users,
  Award,
  HeartHandshake,
  PiggyBank,
  Trees,
  MessageCircle,
  Brain,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import { MaktabKhanehHouseLogo, SloganBadge } from './MaktabKhanehBranding';

interface SiteBenefitsSectionProps {
  onNavigateLibrary?: () => void;
  onNavigateRules?: () => void;
}

export const SiteBenefitsSection: React.FC<SiteBenefitsSectionProps> = ({
  onNavigateLibrary,
  onNavigateRules
}) => {
  const benefitsList = [
    {
      id: 'cultural',
      category: 'مزایای فرهنگی',
      title: 'تشویق کودکان و نوجوانان به خواندن کتاب 📚',
      icon: <BookOpen className="w-7 h-7 text-amber-500" />,
      colorBg: 'bg-amber-50 border-amber-200 hover:border-amber-400',
      badgeBg: 'bg-amber-500 text-slate-950',
      description:
        'با تبدیل امانت کتاب به یک تجربه جذاب، انگیزه و اشتیاق خواندن در کودکان بیدار می‌شود. این سیستم سرانه مطالعه را به شکل چشمگیری افزایش داده و فرهنگ انس با کتاب را در خانه و مدرسه نهادینه می‌سازد.'
    },
    {
      id: 'social',
      category: 'مزایای اجتماعی',
      title: 'اشتراک نظرات و گفتگو پیرامون کتاب‌ها 💬',
      icon: <MessageCircle className="w-7 h-7 text-cyan-600" />,
      colorBg: 'bg-cyan-50 border-cyan-200 hover:border-cyan-400',
      badgeBg: 'bg-cyan-600 text-white',
      description:
        'اعضا می‌توانند پس از مطالعه هر کتاب، دیدگاه‌ها و نقد‌های خود را ثبت کنند. این امر محفلی زنده برای گفتگوهای صمیمانه در زنگ‌های تفریح و تقویت دوستی‌های هدفمند حول محور کتاب ایجاد می‌کند.'
    },
    {
      id: 'civic',
      category: 'مشارکت مدنی و اخلاقی',
      title: 'امتیازدهی به یکدیگر و ارتقای موقعیت فردی 🏆',
      icon: <Award className="w-7 h-7 text-indigo-600" />,
      colorBg: 'bg-indigo-50 border-indigo-200 hover:border-indigo-400',
      badgeBg: 'bg-indigo-600 text-white',
      description:
        'ارزیابی دوطرفه خوش‌قولی و امانت‌داری، تمرینی عالی برای مسئولیت‌پذیری مدنی است. اعضا با کسب رضایت دوستانشان، مدال‌های افتخار دریافت کرده و جایگاه خود را در لیگ امانت‌داری ارتقا می‌دهند.'
    },
    {
      id: 'cooperation',
      category: 'همکاری سازنده',
      title: 'ایجاد و حفظ یک سیستم فعال و خودجوش بين افراد 🤝',
      icon: <HeartHandshake className="w-7 h-7 text-emerald-600" />,
      colorBg: 'bg-emerald-50 border-emerald-200 hover:border-emerald-400',
      badgeBg: 'bg-emerald-600 text-white',
      description:
        'مکتب خونه بستری فراهم می‌کند که اعضا به صورت زنجیره‌ای و هم‌افزا، جریان امانت کتاب را بگردانند. این همکاری سازنده، حس تعلق به یک جامعه کوچک هوشمند و خودگردان را تقویت می‌کند.'
    },
    {
      id: 'financial',
      category: 'مزایای اقتصادی و مالی',
      title: 'کاهش هزینه‌ها و صرفه‌جویی اقتصادی خانواده‌ها 💰',
      icon: <PiggyBank className="w-7 h-7 text-rose-600" />,
      colorBg: 'bg-rose-50 border-rose-200 hover:border-rose-400',
      badgeBg: 'bg-rose-600 text-white',
      description:
        'با توجه به قیمت بالای کتاب‌های نو در بازار، اعضا می‌توانند تنها با پرداخت مبلغ بسیار مناسب ۱۰,۰۰۰ تومان به صدها عنوان کتاب متنوع دسترسی داشته باشند و هزینه‌های خانواده را بشدت کاهش دهند.'
    },
    {
      id: 'environment',
      category: 'حفظ محیط زیست (مزیت ویژه)',
      title: 'صرفه در مصرف کاغذ و حراست از زمین پاک 🍃',
      icon: <Trees className="w-7 h-7 text-green-600" />,
      colorBg: 'bg-green-50 border-green-200 hover:border-green-400',
      badgeBg: 'bg-green-600 text-white',
      description:
        'دست به دست شدن یک جلد کتاب بین ده‌ها فرد، مانع از چاپ بی‌رویه و قطع درختان می‌شود. این روش عملی‌ترین آموزش الگوی «چرخش سبز» و احترام به منابع طبیعی برای نسل آینده است.'
    },
    {
      id: 'communication',
      category: 'مهارت‌های بین‌فردی (مزیت ویژه)',
      title: 'تقویت فن بیان و آداب ارتباط حضوری 🗣️',
      icon: <Users className="w-7 h-7 text-sky-600" />,
      colorBg: 'bg-sky-50 border-sky-200 hover:border-sky-400',
      badgeBg: 'bg-sky-600 text-white',
      description:
        'هماهنگی برای تحویل و دریافت کتاب در مدرسه، اعتمادبه‌نفس کودکان را در برقراری ارتباط با هم‌سن‌وسالان افزایش داده و مهارت‌های کلامی و اجتماعی آن‌ها را صیقل می‌دهد.'
    },
    {
      id: 'thinking',
      category: 'رشد فکری و مهارتی (مزیت ویژه)',
      title: 'توسعه تفکر انتقادی و خلاقیت فکری 💡',
      icon: <Brain className="w-7 h-7 text-purple-600" />,
      colorBg: 'bg-purple-50 border-purple-200 hover:border-purple-400',
      badgeBg: 'bg-purple-600 text-white',
      description:
        'مواجهه با سبک‌های مختلف داستانی و علمی، ذهن کودکان را به تحلیل، پرسش‌گری و خلاقیت عادت می‌دهد و قدرت درک آن‌ها را برای تصمیم‌گیری‌های بهتر در زندگی بالاتر می‌برد.'
    }
  ];

  return (
    <div className="space-y-10 pb-16">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-cyan-950 via-sky-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl border-2 border-cyan-500/30 relative overflow-hidden">
        <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-10 top-0 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <SloganBadge />
              <span className="bg-amber-400 text-slate-950 font-black text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>مزایای اختصاصی</span>
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-amber-300 tracking-tight leading-tight">
              ویژگی‌ها و مزایای برجسته سامانه «مکتب خونه» 🎒
            </h1>

            <p className="text-cyan-100 text-sm sm:text-base font-medium leading-relaxed">
              روش نوین امانت کتاب در مکتب خونه، فراتر از یک الگوی ساده، تجربه‌ای سرشار از ارزش‌های فرهنگی، اجتماعی، اخلاقی و اقتصادی برای دانش‌آموزان و خانواده‌ها می‌سازد.
            </p>

            <div className="pt-2 flex items-center gap-3 flex-wrap">
              {onNavigateLibrary && (
                <button
                  onClick={onNavigateLibrary}
                  className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-5 py-2.5 rounded-2xl text-xs shadow-md transition flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4 text-slate-950" />
                  <span>ورود به گنجینه کتاب‌ها</span>
                </button>
              )}
              {onNavigateRules && (
                <button
                  onClick={onNavigateRules}
                  className="bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-2.5 rounded-2xl text-xs border border-white/20 transition flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-cyan-300" />
                  <span>مشاهده قوانین و مقررات</span>
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 flex justify-center">
            <MaktabKhanehHouseLogo size="sm" />
          </div>
        </div>
      </div>

      {/* Grid of 8 Comprehensive Benefits */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500" />
            <span>چرا «مکتب خونه» بهترین انتخاب است؟</span>
          </h2>
          <span className="text-xs font-bold bg-cyan-100 text-cyan-800 px-3 py-1 rounded-full">
            ۸ ارزش کلیدی
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {benefitsList.map((item) => (
            <div
              key={item.id}
              className={`p-6 rounded-3xl border-2 transition duration-200 ${item.colorBg} shadow-xs flex flex-col justify-between space-y-4`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="p-3 bg-white rounded-2xl shadow-xs border border-slate-100">
                    {item.icon}
                  </div>
                  <span
                    className={`text-[11px] font-black px-3 py-1 rounded-full ${item.badgeBg}`}
                  >
                    {item.category}
                  </span>
                </div>

                <h3 className="text-lg font-black text-slate-900 leading-snug">
                  {item.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2 text-slate-500 text-[11px] font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>طراحی شده مطابق با اصول رشد و پرورش دانش‌آموزان</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Highlight Box */}
      <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 rounded-3xl p-6 sm:p-8 text-slate-950 shadow-lg border-2 border-amber-300 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-950 text-amber-300 rounded-2xl">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-xl font-black">دست به دست هم برای آینده‌ای داناتر 🎒</h3>
            <p className="text-xs text-slate-900 font-bold mt-0.5">
              هر کتابی که به اشتراک گذاشته می‌شود، آغازی برای یک دوستی ماندگار و اندیشه‌ای پویا است.
            </p>
          </div>
        </div>

        <p className="text-xs sm:text-sm font-medium text-slate-950 leading-relaxed bg-white/40 p-4 rounded-2xl backdrop-blur-xs">
          در سامانه امانت کتاب «مکتب خونه»، دانش‌آموزان نه تنها به گنجینه‌ای از ده‌ها کتاب ارزشمند دسترسی می‌یابند، بلکه فرهنگ اعتماد، حفظ امانت، نقد سازنده و مسئولیت‌پذیری اجتماعی را در فضایی امن و دوستانه تمرین می‌کنند.
        </p>
      </div>
    </div>
  );
};
