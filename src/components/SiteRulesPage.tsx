import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck,
  BookOpen,
  Clock,
  AlertTriangle,
  Award,
  CheckCircle2,
  FileText,
  Printer,
  Sparkles,
  HelpCircle,
  PhoneCall,
  ChevronDown,
  ChevronUp,
  MessageCircle
} from 'lucide-react';
import { MaktabKhanehHouseLogo, SloganBadge } from './MaktabKhanehBranding';

export const SiteRulesPage: React.FC = () => {
  const { systemConfig } = useApp();
  const [openSection, setOpenSection] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setOpenSection(openSection === index ? null : index);
  };

  const supportPhone = systemConfig?.supportPhone || '09121112233';
  const supportBaleId = systemConfig?.supportBaleId || 'maktabkhune_admin';
  const supportAdminName = systemConfig?.supportAdminName || 'مسئول مکتب‌خانه';
  const supportHours = systemConfig?.supportHours || 'شنبه تا چهارشنبه - ساعت ۷:۳۰ الی ۱۴:۰۰';

  const rulesList = [
    {
      id: 1,
      title: '۱. قوانین عضویت و ثبت‌نام در مکتب خونه 🎒',
      icon: <ShieldCheck className="w-6 h-6 text-cyan-600" />,
      summary: 'احراز هویت با تلفن همراه، تایید حساب کاربری و ثبت حداقل کتاب اولیه',
      content: (
        <ul className="space-y-3 text-slate-700 text-xs sm:text-sm leading-relaxed list-disc list-inside">
          <li>
            <strong>احراز هویت معتبر:</strong> برای عضویت در سامانه «مکتب خونه»، ثبت شماره تلفن همراه معتبر و فعال (والدین یا دانش‌آموز) الزامی است.
          </li>
          <li>
            <strong>نام و عکس واقعی/آواتار:</strong> کاربران موظف‌اند نام و نام خانوادگی مشخص یا نام مستعار مناسب به همراه یک آواتار فانتزی انتخاب کنند.
          </li>
          <li>
            <strong>شرکت در شبکه امانت:</strong> تمام افراد و دانش‌آموزان با هر رده سنی می‌توانند در مکتب خونه ثبت‌نام و فعالیت نمایند.
          </li>
          <li>
            <strong>قانون اشتراک‌گذاری کتاب:</strong> هر عضو جدید برای فعال‌سازی کامل امکان امانت‌گیری، پیشنهاد می‌شود حداقل ۳ جلد کتاب سالم خود را در سامانه به ثبت برساند تا چرخه امانت تقویت شود.
          </li>
        </ul>
      )
    },
    {
      id: 2,
      title: '۲. قوانین امانت گرفتن و رزرو کتاب 📖',
      icon: <BookOpen className="w-6 h-6 text-orange-600" />,
      summary: 'محدودیت امانت همزمان، مهلت ۱۲ ساعته تایید و کارمزد مناسب برای توسعه کتابخانه',
      content: (
        <ul className="space-y-3 text-slate-700 text-xs sm:text-sm leading-relaxed list-disc list-inside">
          <li>
            <strong>محدودیت امانت همزمان:</strong> هر کاربر در آن واحد فقط می‌تواند <strong>۱ جلد کتاب</strong> را در امانت داشته باشد تا فرصت مطالعه برای همه برابری کند.
          </li>
          <li>
            <strong>پروتکل ۱۲ ساعته تایید از خانه:</strong> از آنجا که دانش‌آموزان در مدرسه به گوشی دسترسی ندارند، صاحب کتاب ۱۲ ساعت مهلت دارد درخواست امانت را از منزل بررسی و تایید نماید.
          </li>
          <li>
            <strong>تعیین زمان و مکان تحویل:</strong> هنگام پذیرش درخواست، مکان و زمان تحویل حضوری (مثلاً زنگ تفریح دوم یا دفتر مدرسه) مشخص می‌شود.
          </li>
          <li>
            <strong>هزینه امانت و تخصیص آن:</strong> مبلغ مناسب ۱۰,۰۰۰ تومان دریافت می‌شود. این مبلغ برای خرید کتاب‌های جدید برای کتابخانه مدرسه و هزینه‌های پشتیبانی و نگهداری سایت گرفته می‌شود.
          </li>
          <li>
            <strong>روش پرداخت کارت به کارت:</strong> پرداخت به صورت کارت به کارت انجام شده و اطلاعات شماره کارت در صفحه امانت به کاربر نمایش داده می‌شود. پس از واریز، کاربر کد پیگیری، تاریخ و فیش واریزی را بارگذاری کرده و تایید پرداخت و تکامل امانت توسط مدیر سایت (پارسا فیض) انجام می‌شود.
          </li>
        </ul>
      )
    },
    {
      id: 3,
      title: '۳. قوانین تحویل، بازگرداندن و حفظ سلامت کتاب ⏳',
      icon: <Clock className="w-6 h-6 text-emerald-600" />,
      summary: 'مهلت مطالعه، نحوه تحویل و بررسی سلامت کامل صفحات',
      content: (
        <ul className="space-y-3 text-slate-700 text-xs sm:text-sm leading-relaxed list-disc list-inside">
          <li>
            <strong>مهلت بازگرداندن کتاب:</strong> مدت استاندارد امانت هر کتاب <strong>۷ الی ۱۴ روز</strong> است (مگر آنکه با هماهنگی طرفین تمدید شود).
          </li>
          <li>
            <strong>بررسی اولیه هنگام تحویل:</strong> امانت‌گیرنده موظف است هنگام دریافت کتاب، سلامت صفحات و جلد آن را چک کند و در صورت وجود پارگی قبلی، به امانت‌دهنده اطلاع دهد.
          </li>
          <li>
            <strong>ممنوعیت خط‌کشی و نوشتن:</strong> علامت‌گذاری با خودکار، هایلایتر، تا کردن گوشه صفحات یا نوشتن یادداشت روی کتاب‌های امانتی اکیداً ممنوع است.
          </li>
        </ul>
      )
    },
    {
      id: 4,
      title: '۴. جریمه‌های آسیب زدن، مخدوش کردن یا مفقودی کتاب ⚠️',
      icon: <AlertTriangle className="w-6 h-6 text-rose-600" />,
      summary: 'نحوه جبران خسارت، تعویض کتاب و مسدودی حساب کاربری',
      content: (
        <div className="space-y-3 text-slate-700 text-xs sm:text-sm leading-relaxed">
          <p>
            در صورت بروز هرگونه آسیب به کتاب، سامانه قوانین زیر را اعمال می‌کند:
          </p>
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-2 text-rose-950 font-medium">
            <div className="flex items-start gap-2">
              <span className="text-rose-600 font-black">🔸 آسیب جزئی (پارگی کم یا کثیفی):</span>
              <span>امانت‌گیرنده موظف به ترمیم صحیح کتاب و جلب رضایت صاحب کتاب است.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-rose-600 font-black">🔸 آسیب شدید یا مفقودی:</span>
              <span>امانت‌گیرنده موظف است یک جلد کتاب نو و مشابه خریداری کرده و به امانت‌دهنده تحویل دهد.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-rose-600 font-black">🔸 مسدودی حساب:</span>
              <span>تا زمان جبران کامل خسارت و جلب رضایت مالک، حساب کاربری امانت‌گیرنده در «مکتب خونه» معلق خواهد شد.</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 5,
      title: '۵. امتیازدهی، مدال‌های افتخار و لیگ مکتب خونه 🏆',
      icon: <Award className="w-6 h-6 text-amber-600" />,
      summary: 'دریافت مدال‌های کتاب‌خوان برتر، امانت‌دار نمونه و ثبت در برد مدرسه',
      content: (
        <ul className="space-y-3 text-slate-700 text-xs sm:text-sm leading-relaxed list-disc list-inside">
          <li>
            <strong>ثبت بازخورد دوطرفه:</strong> پس از تحویل نهایی کتاب، طرفین به یکدیگر از ۱ تا ۵ ستاره امتیاز می‌دهند.
          </li>
          <li>
            <strong>مدال امانت‌دار نمونه:</strong> کاربران با امتیاز بالای ۴.۸ مدال «امانت‌دار نمونه» دریافت می‌کنند.
          </li>
          <li>
            <strong>رتبه‌بندی در لیگ:</strong> کاربران برتر هفتگی در برد چاپی و آنلاین «مکتب خونه» معرفی شده و تشویق می‌شوند.
          </li>
        </ul>
      )
    }
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-cyan-950 via-sky-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl border-2 border-cyan-500/30 relative overflow-hidden">
        <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-10 top-0 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <SloganBadge />
              <span className="bg-amber-400 text-slate-950 font-black text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow-xs">
                <FileText className="w-3.5 h-3.5" />
                <span>قوانین رسمی</span>
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-amber-300 tracking-tight leading-tight">
              قوانین و مقررات استفاده از مکتب خونه 🎒
            </h1>

            <p className="text-cyan-100 text-sm sm:text-base font-medium leading-relaxed">
              راهنمای جامع امانت کتاب، حقوق امانت‌دهنده و امانت‌گیرنده، حفظ سلامت کتاب‌ها و نحوه جبران خسارت در سامانه «مکتب خونه».
            </p>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => window.print()}
                className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-5 py-2.5 rounded-2xl text-xs shadow-md transition flex items-center gap-2"
              >
                <Printer className="w-4 h-4 text-slate-950" />
                <span>چاپ متن قوانین</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-4 flex justify-center">
            <MaktabKhanehHouseLogo size="sm" />
          </div>
        </div>
      </div>

      {/* Accordion Rules Container */}
      <div className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-cyan-600" />
          <span>بخش‌های اصلی قوانین و مقررات مکتب خونه</span>
        </h2>

        <div className="space-y-3">
          {rulesList.map((rule) => {
            const isOpen = openSection === rule.id;
            return (
              <div
                key={rule.id}
                className="bg-white rounded-3xl border-2 border-slate-200 shadow-xs overflow-hidden transition duration-200 hover:border-cyan-300"
              >
                <button
                  onClick={() => toggleAccordion(rule.id)}
                  className="w-full p-5 sm:p-6 text-right flex items-center justify-between gap-4 bg-white hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-3 bg-cyan-50 rounded-2xl shrink-0">
                      {rule.icon}
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900">
                        {rule.title}
                      </h3>
                      <p className="text-xs text-slate-500 font-bold mt-0.5">
                        {rule.summary}
                      </p>
                    </div>
                  </div>

                  <div className="p-2 text-slate-400 rounded-full bg-slate-100 shrink-0">
                    {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="p-5 sm:p-6 bg-slate-50 border-t border-slate-200 animate-in fade-in-50 duration-200">
                    {rule.content}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Help & Support Banner */}
      <div className="bg-gradient-to-r from-cyan-600 via-sky-600 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-right">
          <h3 className="text-lg sm:text-xl font-black text-amber-300 flex items-center justify-center md:justify-start gap-2">
            <HelpCircle className="w-6 h-6" />
            <span>سوال یا مشکلی در قوانین دارید؟</span>
          </h3>
          <p className="text-xs sm:text-sm text-cyan-100 font-medium">
            تیم پشتیبانی ({supportAdminName}) در خدمت شما هستند تا تجربه امانت کتابی آسان و امن داشته باشید.
          </p>
          <div className="text-[11px] text-cyan-200 font-bold flex items-center justify-center md:justify-start gap-2 pt-1">
            <Clock className="w-3.5 h-3.5" />
            <span>ساعات پاسخگویی: {supportHours}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap justify-center">
          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20 text-center min-w-[130px]">
            <span className="text-[10px] text-cyan-200 block font-bold">تلفن پشتیبانی</span>
            <a href={`tel:${supportPhone}`} className="text-sm font-black text-amber-300 dir-ltr hover:underline">
              {supportPhone}
            </a>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20 text-center min-w-[130px]">
            <span className="text-[10px] text-cyan-200 block font-bold">آیدی بله پشتیبان</span>
            <span className="text-sm font-black text-amber-300 dir-ltr">
              @{supportBaleId.replace('@', '')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
