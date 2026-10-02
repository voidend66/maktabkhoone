import { SystemMedal } from '../types';

export const DEFAULT_MEDALS: SystemMedal[] = [
  {
    id: 'medal_sprout_start',
    title: 'جوانه آغاز',
    occasion: 'آغاز باشکوه سفر در دنیای کتاب‌ها و اولین تجربه امانت در مکتب‌خونه.',
    specialPerk: 'بازگشایی دسترسی به ثبت نقد و دیدگاه تحلیلی برای کتاب‌ها + ۵۰ امتیاز تجربه.',
    description: 'این نشان به پاس ورود پرشور به جمع کتاب‌خوان‌های مکتب‌خونه و تکمیل اولین چرخه امانت اهدا می‌شود.',
    tier: 'bronze',
    level: 1,
    icon: '🌱',
    imageUrl: '',
    color: 'border-amber-600 text-amber-900 bg-amber-50',
    bgGradient: 'from-amber-500/10 via-orange-500/5 to-white',
    criteria: {
      type: 'books_read',
      threshold: 1,
      description: 'پایان موفقیت‌آمیز مطالعه و عودت اولین کتاب (حداقل ۱ کتاب خوانده‌شده).'
    },
    reward: {
      freeLoanQuota: 1,
      leaguePoints: 50,
      title: 'دسترسی به ثبت نقد + ۵۰ امتیاز تجربه'
    },
    isActive: true,
    order: 1,
    createdAt: '1403/07/01'
  },
  {
    id: 'medal_custodian_trust',
    title: 'نگهبان امانت',
    occasion: 'امانتداری نمونه، خوش‌قولی بی‌نقص و بازگرداندن کتاب‌ها در موعد مقرر با سلامت کامل.',
    specialPerk: 'اعطای نشان سپر سبز «امانت‌دار معتمد» در سراسر سامانه و اولویت در بررسی و تایید درخواست‌های امانت.',
    description: 'نماد مسئولیت‌پذیری و اخلاق حسنه؛ تحویل کتاب‌ها در موعد مقرر و بدون کوچک‌ترین آسیب.',
    tier: 'silver',
    level: 2,
    icon: '🛡️',
    imageUrl: '',
    color: 'border-slate-500 text-slate-800 bg-slate-50',
    bgGradient: 'from-slate-500/10 via-slate-400/5 to-white',
    criteria: {
      type: 'successful_loans',
      threshold: 3,
      description: 'حداقل ۳ امانت بازگردانده شده در موعد مقرر با میانگین رضایت بالای ۴.۸ ستاره.'
    },
    reward: {
      freeLoanQuota: 1,
      leaguePoints: 80,
      title: 'نشان سپر سبز امانت‌دار معتمد + ۸۰ امتیاز لیگ'
    },
    isActive: true,
    order: 2,
    createdAt: '1403/07/01'
  },
  {
    id: 'medal_generous_spring',
    title: 'چشمه سخاوت',
    occasion: 'اهدای کتاب‌های کتابخانه شخصی به قفسه اشتراکی مدرسه برای استفاده همه دوستان.',
    specialPerk: 'اعطای ۲ سهمیه امانت رایگان بدون کارمزد + ثبت نام در فهرست حامیان افتخاری مدرسه.',
    description: 'نشان بخشندگی و نشر دانش از طریق غنی‌سازی قفسه‌های کتابخانه مکتب‌خونه.',
    tier: 'gold',
    level: 3,
    icon: '✨',
    imageUrl: '',
    color: 'border-yellow-500 text-yellow-950 bg-yellow-50',
    bgGradient: 'from-yellow-400/15 via-amber-400/5 to-white',
    criteria: {
      type: 'books_contributed',
      threshold: 3,
      description: 'ثبت و اشتراک‌گذاری حداقل ۳ جلد کتاب سالم و فعال در سامانه.'
    },
    reward: {
      freeLoanQuota: 2,
      leaguePoints: 120,
      title: '۲ سهمیه امانت رایگان + ثبت نام در فهرست حامیان'
    },
    isActive: true,
    order: 3,
    createdAt: '1403/07/01'
  },
  {
    id: 'medal_swift_reader',
    title: 'تندپای مطالعه',
    occasion: 'سرعت عمل شگفت‌انگیز در خواندن، جمع‌بندی و بازگرداندن کتاب در کوتاه‌ترین زمان.',
    specialPerk: 'برچسب «کتاب‌خوان پرسرعت» در کارنامه و اولویت در نوبت رزرو کتاب‌های پرتقاضا.',
    description: 'مخصوص دانش‌آموزان کوشایی که کتاب‌ها را سریع مطالعه کرده و فوراً به چرخه امانت برمی‌گردانند.',
    tier: 'silver',
    level: 2,
    icon: '⏳',
    imageUrl: '',
    color: 'border-slate-500 text-slate-800 bg-slate-50',
    bgGradient: 'from-slate-500/10 via-slate-400/5 to-white',
    criteria: {
      type: 'speed_return',
      threshold: 1,
      description: 'امانت و عودت حداقل یک کتاب در کمتر از ۷۲ ساعت (۳ روز) با تایید دوطرفه.'
    },
    reward: {
      freeLoanQuota: 1,
      leaguePoints: 100,
      title: 'برچسب کتاب‌خوان پرسرعت + اولویت رزرو'
    },
    isActive: true,
    order: 4,
    createdAt: '1403/07/01'
  },
  {
    id: 'medal_lantern_truth',
    title: 'فانوس حقیقت',
    occasion: 'نگارش نقدهای تحلیلی، صادقانه و آموزنده برای راهنمایی سایر هم‌مدرسه‌ای‌ها.',
    specialPerk: 'سنجاق شدن دیدگاه‌های کاربر به عنوان «نقد برتر و نشان‌دار» در بالای کتاب‌ها.',
    description: 'این نشان به پاس نگارش نقدهای عمیق، خلاصه کتاب‌های مفید و راهنمایی صادقانه دوستان اهدا می‌شود.',
    tier: 'gold',
    level: 3,
    icon: '🏮',
    imageUrl: '',
    color: 'border-yellow-500 text-yellow-950 bg-yellow-50',
    bgGradient: 'from-yellow-400/15 via-amber-400/5 to-white',
    criteria: {
      type: 'reviews_written',
      threshold: 3,
      description: 'ثبت حداقل ۳ نقد یا بررسی تفصیلی برای کتاب‌های مطالعه‌شده در سامانه.'
    },
    reward: {
      freeLoanQuota: 2,
      leaguePoints: 140,
      title: 'سنجاق دیدگاه‌ها به عنوان نقد برتر + ۱۴۰ امتیاز'
    },
    isActive: true,
    order: 5,
    createdAt: '1403/07/01'
  },
  {
    id: 'medal_torch_continuity',
    title: 'مشعل استمرار',
    occasion: 'تداوم الهام‌بخش در مطالعه و حضور پویا در اکوسیستم کتابخوانی بدون وقفه.',
    specialPerk: 'اعمال ضریب ۱.۲۵ برابری بر تمامی امتیازات کسب‌شده در لیگ هفتگی مدرسه.',
    description: 'ویژه دانش‌آموزانی که پیوسته در حال مطالعه هستند و کتابخوانی را به عادت روزانه تبدیل کرده‌اند.',
    tier: 'gold',
    level: 3,
    icon: '🔥',
    imageUrl: '',
    color: 'border-yellow-500 text-yellow-950 bg-yellow-50',
    bgGradient: 'from-yellow-400/15 via-amber-400/5 to-white',
    criteria: {
      type: 'books_read',
      threshold: 5,
      description: 'حداقل ۵ کتاب خوانده‌شده با سابقه حضور فعال در چند ماه متوالی.'
    },
    reward: {
      freeLoanQuota: 3,
      leaguePoints: 200,
      title: 'اعمال ضریب ۱.۲۵ برابری در لیگ هفتگی'
    },
    isActive: true,
    order: 6,
    createdAt: '1403/07/01'
  },
  {
    id: 'medal_explorer_compass',
    title: 'قطب‌نمای کاوشگر',
    occasion: 'کاوش در قلمروهای فکری گوناگون و مطالعه کتاب‌ها در دسته‌بندی‌های موضوعی مختلف.',
    specialPerk: 'فعال‌سازی حالت «اکتشاف ژانرهای کمیاب» در مشاور هوش مصنوعی Gemini.',
    description: 'برای دانش‌آموزان کنجکاوی که به ژانرهای گوناگون از داستانی و علمی تا مذهبی، تاریخی و روانشناسی سرک می‌کشند.',
    tier: 'silver',
    level: 2,
    icon: '🧭',
    imageUrl: '',
    color: 'border-slate-500 text-slate-800 bg-slate-50',
    bgGradient: 'from-slate-500/10 via-slate-400/5 to-white',
    criteria: {
      type: 'multi_category',
      threshold: 3,
      description: 'مطالعه کتاب در حداقل ۳ دسته‌بندی موضوعی متفاوت (داستانی، علمی، مذهبی، تاریخی، روانشناسی).'
    },
    reward: {
      freeLoanQuota: 2,
      leaguePoints: 160,
      title: 'فعال‌سازی حالت اکتشاف ژانرهای کمیاب در هوش مصنوعی'
    },
    isActive: true,
    order: 7,
    createdAt: '1403/07/01'
  },
  {
    id: 'medal_ambassador_maktab',
    title: 'سفیر مکتب‌خونه',
    occasion: 'مروج پیشتاز دانایی و حلقه وصل هم‌کلاسی‌ها به سامانه اشتراک کتاب مدرسه.',
    specialPerk: 'حاشیه الماسی در رتبه‌بندی کلاسی + امکان دعوت مستقیم دوستان با پاداش امتیازی دوطرفه.',
    description: 'این نشان به مروجان فعال کتاب که دوستان و هم‌کلاسی‌های خود را به مکتب‌خونه پیوند می‌دهند تعلق می‌گیرد.',
    tier: 'diamond',
    level: 4,
    icon: '⭐',
    imageUrl: '',
    color: 'border-sky-500 text-sky-950 bg-sky-50',
    bgGradient: 'from-sky-400/20 via-cyan-400/5 to-white',
    criteria: {
      type: 'successful_loans',
      threshold: 5,
      description: 'ثبت حداقل ۵ تبادل امانت موفق درون کلاس یا اعطای مستقیم توسط مدیر مدرسه.'
    },
    reward: {
      freeLoanQuota: 3,
      leaguePoints: 300,
      title: 'حاشیه الماسی در رتبه‌بندی + دعوت مستقیم دوستان'
    },
    isActive: true,
    order: 8,
    createdAt: '1403/07/01'
  },
  {
    id: 'medal_crown_honor',
    title: 'تاج سکوی افتخار',
    occasion: 'دستیابی به قله جدول امتیازات و ایستادن در جایگاه رتبه ۱ لیگ کتابخوانی ماهانه مدرسه.',
    specialPerk: 'نمایش نشان متحرک تاج زرین در کنار نام کاربری در سراسر سامانه + ثبت رسمی به عنوان قهرمان ماه بر روی تابلوی چاپی مدرسه.',
    description: 'بالاترین رتبه لیگ ماهانه؛ قهرمان کتابخوانی مدرسه با درخشش در تمامی شاخص‌های فعالیت و امانت.',
    tier: 'diamond',
    level: 4,
    icon: '👑',
    imageUrl: '',
    color: 'border-sky-500 text-sky-950 bg-sky-50',
    bgGradient: 'from-sky-400/20 via-cyan-400/5 to-white',
    criteria: {
      type: 'league_top',
      threshold: 1,
      description: 'کسب رتبه ۱ (صدرنشین مطلق) در رده‌بندی لیگ کتابخوانی ماهانه مدرسه.'
    },
    reward: {
      freeLoanQuota: 5,
      leaguePoints: 500,
      title: 'نشان متحرک تاج زرین + ثبت قهرمان ماه در تابلوی مدرسه'
    },
    isActive: true,
    order: 9,
    createdAt: '1403/07/01'
  },
  {
    id: 'medal_phoenix_wisdom',
    title: 'ققنوس فرزانگی',
    occasion: 'بالاترین مرتبه افتخار و فرزانگی؛ تجلی آرمان کتابخوانی، سخاوت بی‌دریغ و اعتماد کامل.',
    specialPerk: 'ثبت دائمی نام و نمایه در تالار مشاهیر دانایی مدرسه + اهدای لوح تقدیر فیزیکی زرین توسط مدیر در مراسم صبحگاه + حق پیشنهاد خرید کتاب با بودجه مدرسه.',
    description: 'نشان جاودان فرزانگی برای دانش‌آموزانی که در تمام حوزه‌ها به اوج افتخار و تأثیرگذاری فرهنگی در مدرسه رسیده‌اند.',
    tier: 'legendary',
    level: 5,
    icon: '🦅',
    imageUrl: '',
    color: 'border-purple-600 text-purple-950 bg-purple-50',
    bgGradient: 'from-purple-600/20 via-indigo-500/10 to-white',
    criteria: {
      type: 'books_read',
      threshold: 25,
      description: 'مطالعه و عودت حداقل ۲۵ جلد کتاب، اهدای حداقل ۸ جلد کتاب فعال به مدرسه و حفظ میانگین رضایت بالای ۴.۸۵.'
    },
    reward: {
      freeLoanQuota: 10,
      leaguePoints: 1000,
      title: 'ثبت در تالار مشاهیر + لوح تقدیر فیزیکی زرین مدیر'
    },
    isActive: true,
    order: 10,
    createdAt: '1403/07/01'
  },
  {
    id: 'medal_leader_maktab',
    title: 'راهبر مکتب‌خانه',
    occasion: 'خاص‌ترین، والاترین و برترین نشان مکتب‌خانه؛ نشان زرین افتخار و خرد ویژه مدیران و راهبران عالی که...',
    specialPerk: 'بالاترین اختیارات راهبری سامانه + نشان زرین اختصاصی راهبری دانایی در سراسر سامانه + امضای دیجیتال رسمی اعتبار الواح و مدارک + دسترسی به تالار فرماندهی کتابخانه.',
    description: 'نشان انحصاری مدیریت و راهبری کتابخانه؛ پاسدار میراث دانایی، هدایتگر فرهنگی و ناظر بر گردش کتاب‌ها در مدرسه.',
    tier: 'legendary',
    level: 5,
    icon: '🎖️',
    imageUrl: '',
    color: 'border-indigo-700 text-indigo-950 bg-indigo-50',
    bgGradient: 'from-indigo-700/25 via-purple-600/10 to-white',
    criteria: {
      type: 'custom_manual',
      threshold: 1,
      description: 'منحصراً ویژه مدیران رسمی سامانه مکتب‌خانه (اعطای اختصاصی بر پایه نقش و مسئولیت مدیریت کتابخانه).'
    },
    reward: {
      freeLoanQuota: 99,
      leaguePoints: 2000,
      title: 'بالاترین اختیارات راهبری + نشان زرین اختصاصی'
    },
    isActive: true,
    order: 11,
    createdAt: '1403/07/01'
  },
  {
    id: 'medal_veteran_maktab',
    title: 'پیشکسوت مکتب‌خانه',
    occasion: 'نشان زرین تجلیل از ۵ عضو پیشگام و بنیان‌گذار مکتب‌خانه که با حضور ارزشمند و وفاداری‌شان، چراغ...',
    specialPerk: 'اعطای ۳ سهمیه امانت رایگان + ضریب ۱.۲۵ برابری در لیگ + نشان اختصاصی پیشکسوت معتمد در کنار نام',
    description: 'نشان افتخاری اعطا شده به پیشگامان و اعضای وفادار مکتب‌خانه که از نخستین روزها حامی و همراه کتابخانه بوده‌اند.',
    tier: 'legendary',
    level: 5,
    icon: '🏛️',
    imageUrl: '',
    color: 'border-pink-600 text-pink-950 bg-pink-50',
    bgGradient: 'from-pink-500/20 via-purple-400/5 to-white',
    criteria: {
      type: 'custom_manual',
      threshold: 1,
      description: 'اختصاصی ۵ کاربر قدیمی و پیشگام مکتب‌خانه به پاس همراهی، اعتماد و وفاداری مستمر (صرفاً دستی توسط مدیر).'
    },
    reward: {
      freeLoanQuota: 3,
      leaguePoints: 400,
      title: '۳ سهمیه رایگان + ضریب ۱.۲۵ لیگ + نشان پیشکسوت معتمد'
    },
    isActive: true,
    order: 12,
    createdAt: '1403/07/01'
  }
];

export const TIER_CONFIG: Record<
  string,
  { label: string; english: string; bg: string; border: string; text: string; badge: string; glow: string }
> = {
  bronze: {
    label: 'برنزی • سطح ۱',
    english: 'Bronze',
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-900',
    badge: 'bg-amber-700 text-white',
    glow: 'shadow-amber-500/20'
  },
  silver: {
    label: 'نقره‌ای • سطح ۲',
    english: 'Silver',
    bg: 'bg-slate-50',
    border: 'border-slate-300',
    text: 'text-slate-800',
    badge: 'bg-slate-600 text-white',
    glow: 'shadow-slate-500/20'
  },
  gold: {
    label: 'طلایی • سطح ۳',
    english: 'Gold',
    bg: 'bg-yellow-50',
    border: 'border-yellow-300',
    text: 'text-yellow-950',
    badge: 'bg-amber-500 text-slate-950',
    glow: 'shadow-yellow-500/30'
  },
  diamond: {
    label: 'الماسی • سطح ۴',
    english: 'Diamond',
    bg: 'bg-sky-50',
    border: 'border-sky-300',
    text: 'text-sky-950',
    badge: 'bg-sky-500 text-white',
    glow: 'shadow-sky-500/30'
  },
  legendary: {
    label: 'اسطوره‌ای • سطح ۵',
    english: 'Legendary',
    bg: 'bg-purple-50',
    border: 'border-purple-300',
    text: 'text-purple-950',
    badge: 'bg-purple-700 text-white',
    glow: 'shadow-purple-500/40'
  }
};
