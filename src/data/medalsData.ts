import { Medal, MedalTier, User, LendingRequest, Book, BookReview } from '../types';

import sproutImg from '../assets/images/badge_sprout_3d_1790930077030.jpg';
import trustImg from '../assets/images/badge_trust_3d_1790930094416.jpg';
import wingsImg from '../assets/images/badge_wings_3d_1790930111420.jpg';
import hourglassImg from '../assets/images/badge_hourglass_3d_1790930125429.jpg';
import lanternImg from '../assets/images/badge_lantern_3d_1790930141177.jpg';
import flameImg from '../assets/images/badge_flame_3d_1790930154952.jpg';
import compassImg from '../assets/images/badge_compass_3d_1790930168598.jpg';
import starImg from '../assets/images/badge_star_3d_1790930181717.jpg';
import crownImg from '../assets/images/badge_crown_3d_1790930196160.jpg';
import phoenixImg from '../assets/images/badge_phoenix_3d_1790930209065.jpg';
import veteranImg from '../assets/images/badge_veteran_3d_1790951045497.jpg';
import leaderImg from '../assets/images/badge_leader_minimal_3d_1790961312478.jpg';

export interface MedalDefinition {
  id: string;
  title: string;
  titleEn: string;
  icon: string;
  imageUrl: string;
  tier: MedalTier;
  tierTitle: string;
  level: number; // 1 to 5
  description: string;
  occasion: string; // مناسبت و فلسفه نماد
  property: string; // خاصیت و مزیت کاربردی در سامانه
  criteriaDesc: string; // شرط دریافت خودکار
  color: string;
  badgeGlow: string;
  badgeBorder: string;
  badgeBg: string;
  isCustom?: boolean;
  rules?: CustomMedalRuleConfig;
  checkEligibility: (context: {
    user: User;
    borrowedRequests: LendingRequest[];
    ownedBooks: Book[];
    userReviews: BookReview[];
    leagueRank?: number;
    allBooks?: Book[];
  }) => boolean;
  calculateProgress: (context: {
    user: User;
    borrowedRequests: LendingRequest[];
    ownedBooks: Book[];
    userReviews: BookReview[];
    leagueRank?: number;
    allBooks?: Book[];
  }) => { current: number; target: number; percentage: number; label: string };
}

/**
 * ده نشان رسمی و اختصاصی مکتب‌خونه با گرافیک سه‌بعدی و هویت بومی
 */
export const OFFICIAL_MEDALS: MedalDefinition[] = [
  // ۱. جوانه آغاز (سطح ۱ - برنزی)
  {
    id: 'badge_first_step',
    title: 'جوانه آغاز',
    titleEn: 'Sprout of Beginning',
    icon: '🌱',
    imageUrl: sproutImg,
    tier: 'bronze',
    tierTitle: 'برنزی • سطح ۱',
    level: 1,
    description: 'آغاز باشکوه سفر در دنیای کتاب‌ها و اولین تجربه امانت در مکتب‌خونه.',
    occasion: 'اهدای نشان در بدو تکمیل اولین مطالعه و آغاز پیوند با جریان دانایی مدرسه.',
    property: 'بازگشایی دسترسی به ثبت نقد و دیدگاه تحلیلی برای کتاب‌ها + ۵۰ امتیاز تجربه.',
    criteriaDesc: 'پایان موفقیت‌آمیز مطالعه و عودت اولین کتاب (حداقل ۱ کتاب خوانده‌شده).',
    color: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    badgeGlow: 'shadow-[0_0_20px_rgba(16,185,129,0.35)]',
    badgeBorder: 'border-emerald-400',
    badgeBg: 'from-emerald-500/20 via-teal-500/10 to-transparent',
    checkEligibility: ({ user, borrowedRequests }) => {
      const returnedCount = borrowedRequests.filter((r) => r.status === 'returned').length;
      return (user.booksReadCount || 0) >= 1 || returnedCount >= 1;
    },
    calculateProgress: ({ user, borrowedRequests }) => {
      const returnedCount = borrowedRequests.filter((r) => r.status === 'returned').length;
      const count = Math.max(user.booksReadCount || 0, returnedCount);
      const target = 1;
      return {
        current: Math.min(count, target),
        target,
        percentage: Math.min(100, Math.round((count / target) * 100)),
        label: `${count} از ۱ کتاب`
      };
    }
  },

  // ۲. نگهبان امانت (سطح ۲ - نقره‌ای)
  {
    id: 'badge_guardian_trust',
    title: 'نگهبان امانت',
    titleEn: 'Guardian of Trust',
    icon: '🗝️',
    imageUrl: trustImg,
    tier: 'silver',
    tierTitle: 'نقره‌ای • سطح ۲',
    level: 2,
    description: 'امانت‌داری نمونه، خوش‌قولی بی‌نقص و بازگرداندن کتاب‌ها در موعد مقرر با سلامت کامل.',
    occasion: 'تجلیل از اخلاق‌مداری و تثبیت اعتبار دانش‌آموز به عنوان امانت‌گیرنده‌ای کاملاً معتمد.',
    property: 'اعطای نشان سپر سبز «امانت‌دار معتمد» در سراسر سامانه و اولویت در بررسی و تایید درخواست‌های امانت.',
    criteriaDesc: 'حداقل ۳ امانت بازگردانده شده در موعد مقرر با میانگین رضایت بالای ۴.۸ ستاره.',
    color: 'bg-sky-50 text-sky-800 border-sky-300',
    badgeGlow: 'shadow-[0_0_20px_rgba(14,165,233,0.35)]',
    badgeBorder: 'border-sky-400',
    badgeBg: 'from-sky-500/20 via-blue-500/10 to-transparent',
    checkEligibility: ({ user, borrowedRequests }) => {
      const successfulLoans = borrowedRequests.filter((r) => r.status === 'returned').length;
      return successfulLoans >= 3 && (user.rating || 5) >= 4.8;
    },
    calculateProgress: ({ user, borrowedRequests }) => {
      const count = borrowedRequests.filter((r) => r.status === 'returned').length;
      const target = 3;
      return {
        current: Math.min(count, target),
        target,
        percentage: Math.min(100, Math.round((count / target) * 100)),
        label: `${count} از ۳ امانت خوش‌قول`
      };
    }
  },

  // ۳. چشمه سخاوت (سطح ۳ - طلایی)
  {
    id: 'badge_generous_giver',
    title: 'چشمه سخاوت',
    titleEn: 'Spring of Generosity',
    icon: '📖',
    imageUrl: wingsImg,
    tier: 'gold',
    tierTitle: 'طلایی • سطح ۳',
    level: 3,
    description: 'اهدای کتاب‌های کتابخانه شخصی به قفسه اشتراکی مدرسه برای استفاده همه دوستان.',
    occasion: 'بزرگداشت روحیه ایثار علمی و مشارکت در باروری چرخه فرهنگی مکتب‌خونه.',
    property: 'اعطای ۲ سهمیه امانت رایگان بدون کارمزد + ثبت نام در فهرست حامیان افتخاری مدرسه.',
    criteriaDesc: 'ثبت و اشتراک‌گذاری حداقل ۳ جلد کتاب سالم و فعال در سامانه.',
    color: 'bg-amber-50 text-amber-900 border-amber-300',
    badgeGlow: 'shadow-[0_0_25px_rgba(245,158,11,0.4)]',
    badgeBorder: 'border-amber-400',
    badgeBg: 'from-amber-500/20 via-yellow-500/10 to-transparent',
    checkEligibility: ({ user, ownedBooks }) => {
      const activeCount = ownedBooks.length;
      return (user.booksContributedCount || 0) >= 3 || activeCount >= 3;
    },
    calculateProgress: ({ user, ownedBooks }) => {
      const count = Math.max(user.booksContributedCount || 0, ownedBooks.length);
      const target = 3;
      return {
        current: Math.min(count, target),
        target,
        percentage: Math.min(100, Math.round((count / target) * 100)),
        label: `${count} از ۳ کتاب اهدایی`
      };
    }
  },

  // ۴. تندپای مطالعه (سطح ۲ - نقره‌ای)
  {
    id: 'badge_swift_reader',
    title: 'تندپای مطالعه',
    titleEn: 'Swift Reader',
    icon: '⏳',
    imageUrl: hourglassImg,
    tier: 'silver',
    tierTitle: 'نقره‌ای • سطح ۲',
    level: 2,
    description: 'سرعت عمل شگفت‌انگیز در خواندن، جمع‌بندی و بازگرداندن کتاب در کوتاه‌ترین زمان.',
    occasion: 'تشویق تمرکز بالا، مدیریت زمان و بهره‌وری حداکثری از فرصت‌های امانت هفتگی.',
    property: 'برچسب «کتاب‌خوان پرسرعت» در کارنامه و اولویت در نوبت رزرو کتاب‌های پرتقاضا.',
    criteriaDesc: 'امانت و عودت حداقل یک کتاب در کمتر از ۷۲ ساعت (۳ روز) با تایید دوطرفه.',
    color: 'bg-indigo-50 text-indigo-800 border-indigo-300',
    badgeGlow: 'shadow-[0_0_20px_rgba(99,102,241,0.35)]',
    badgeBorder: 'border-indigo-400',
    badgeBg: 'from-indigo-500/20 via-purple-500/10 to-transparent',
    checkEligibility: ({ borrowedRequests }) => {
      // بررسی وجود حداقل ۱ امانت که در کمتر از ۳ روز بازگشته است
      return borrowedRequests.some((r) => {
        if (r.status !== 'returned') return false;
        try {
          const rawDelivered = (r as any).deliveredDate || r.handoverConfirmedAt || r.acceptedAt || r.createdAt;
          const rawReturned = (r as any).returnedDate || (r as any).returnedAt || r.createdAt;
          const start = new Date(rawDelivered).getTime();
          const end = new Date(rawReturned).getTime();
          const diffDays = (end - start) / (1000 * 60 * 60 * 24);
          return diffDays >= 0 && diffDays <= 3.5;
        } catch {
          return false;
        }
      });
    },
    calculateProgress: ({ borrowedRequests }) => {
      const fastCount = borrowedRequests.filter((r) => {
        if (r.status !== 'returned') return false;
        try {
          const rawDelivered = (r as any).deliveredDate || r.handoverConfirmedAt || r.acceptedAt || r.createdAt;
          const rawReturned = (r as any).returnedDate || (r as any).returnedAt || r.createdAt;
          const start = new Date(rawDelivered).getTime();
          const end = new Date(rawReturned).getTime();
          const diffDays = (end - start) / (1000 * 60 * 60 * 24);
          return diffDays >= 0 && diffDays <= 3.5;
        } catch {
          return false;
        }
      }).length;
      return {
        current: Math.min(fastCount, 1),
        target: 1,
        percentage: fastCount >= 1 ? 100 : 0,
        label: fastCount >= 1 ? 'انجام شد (عودت زیر ۳ روز)' : 'نیازمند ۱ عودت زیر ۳ روز'
      };
    }
  },

  // ۵. فانوس حقیقت (سطح ۳ - طلایی)
  {
    id: 'badge_insightful_critic',
    title: 'فانوس حقیقت',
    titleEn: 'Lantern of Insight',
    icon: '🏮',
    imageUrl: lanternImg,
    tier: 'gold',
    tierTitle: 'طلایی • سطح ۳',
    level: 3,
    description: 'نگارش نقدهای تحلیلی، صادقانه و آموزنده برای راهنمایی سایر هم‌مدرسه‌ای‌ها.',
    occasion: 'گرامیداشت اندیشه نقادانه و تبدیل خواننده منفعل به نویسنده و منتقد موشکاف.',
    property: 'سنجاق شدن دیدگاه‌های کاربر به عنوان «نقد برتر و نشان‌دار» در بالای کتاب‌ها.',
    criteriaDesc: 'ثبت حداقل ۳ نقد یا بررسی تفصیلی برای کتاب‌های مطالعه‌شده در سامانه.',
    color: 'bg-amber-50 text-amber-900 border-amber-300',
    badgeGlow: 'shadow-[0_0_25px_rgba(217,119,6,0.4)]',
    badgeBorder: 'border-amber-500',
    badgeBg: 'from-amber-600/20 via-orange-500/10 to-transparent',
    checkEligibility: ({ userReviews }) => {
      return userReviews.length >= 3;
    },
    calculateProgress: ({ userReviews }) => {
      const count = userReviews.length;
      const target = 3;
      return {
        current: Math.min(count, target),
        target,
        percentage: Math.min(100, Math.round((count / target) * 100)),
        label: `${count} از ۳ نقد کتاب`
      };
    }
  },

  // ۶. مشعل استمرار (سطح ۳ - طلایی)
  {
    id: 'badge_eternal_streak',
    title: 'مشعل استمرار',
    titleEn: 'Flame of Habit',
    icon: '🔥',
    imageUrl: flameImg,
    tier: 'gold',
    tierTitle: 'طلایی • سطح ۳',
    level: 3,
    description: 'تداوم الهام‌بخش در مطالعه و حضور پویا در اکوسیستم کتابخوانی بدون وقفه.',
    occasion: 'تقدیر از استقامت فکری و تبدیل مطالعه روزانه به عادتی ماندگار و جدایی‌ناپذیر.',
    property: 'اعمال ضریب ۱.۲۵ برابری بر تمامی امتیازات کسب‌شده در لیگ هفتگی مدرسه.',
    criteriaDesc: 'حداقل ۵ کتاب خوانده‌شده با سابقه حضور فعال در چند ماه متوالی.',
    color: 'bg-rose-50 text-rose-800 border-rose-300',
    badgeGlow: 'shadow-[0_0_25px_rgba(244,63,94,0.4)]',
    badgeBorder: 'border-rose-400',
    badgeBg: 'from-rose-500/20 via-pink-500/10 to-transparent',
    checkEligibility: ({ user, borrowedRequests }) => {
      const returnedCount = borrowedRequests.filter((r) => r.status === 'returned').length;
      const read = Math.max(user.booksReadCount || 0, returnedCount);
      return read >= 5;
    },
    calculateProgress: ({ user, borrowedRequests }) => {
      const returnedCount = borrowedRequests.filter((r) => r.status === 'returned').length;
      const count = Math.max(user.booksReadCount || 0, returnedCount);
      const target = 5;
      return {
        current: Math.min(count, target),
        target,
        percentage: Math.min(100, Math.round((count / target) * 100)),
        label: `${count} از ۵ کتاب پیوسته`
      };
    }
  },

  // ۷. قطب‌نمای کاوشگر (سطح ۲ - نقره‌ای)
  {
    id: 'badge_genre_explorer',
    title: 'قطب‌نمای کاوشگر',
    titleEn: 'Genre Explorer',
    icon: '🧭',
    imageUrl: compassImg,
    tier: 'silver',
    tierTitle: 'نقره‌ای • سطح ۲',
    level: 2,
    description: 'کاوش در قلمروهای فکری گوناگون و مطالعه کتاب‌ها در دسته‌بندی‌های موضوعی مختلف.',
    occasion: 'ستایش کنجکاوی همه‌جانبه و پرهیز از تک‌بعدی‌نگری در انتخاب عناوین کتاب‌ها.',
    property: 'فعال‌سازی حالت «اکتشاف ژانرهای کمیاب» در مشاور هوش مصنوعی Gemini.',
    criteriaDesc: 'مطالعه کتاب در حداقل ۳ دسته‌بندی موضوعی متفاوت (داستانی، علمی، مذهبی، تاریخی، روانشناسی).',
    color: 'bg-teal-50 text-teal-800 border-teal-300',
    badgeGlow: 'shadow-[0_0_20px_rgba(20,184,166,0.35)]',
    badgeBorder: 'border-teal-400',
    badgeBg: 'from-teal-500/20 via-cyan-500/10 to-transparent',
    checkEligibility: ({ borrowedRequests, allBooks }) => {
      // شمارش ژانرهای متمایز کتاب‌های به امانت رفته
      const categories = new Set<string>();
      borrowedRequests
        .filter((r) => r.status === 'returned')
        .forEach((r) => {
          const matched = allBooks?.find((b) => b.id === r.bookId);
          const cat = (r as any).category || matched?.category;
          if (cat) categories.add(cat);
        });
      // اگر دیتا کم باشد، حداقل ۲ امانت بازگشتی یا متغیر اختصاصی
      return categories.size >= 3 || borrowedRequests.filter((r) => r.status === 'returned').length >= 4;
    },
    calculateProgress: ({ borrowedRequests }) => {
      const returned = borrowedRequests.filter((r) => r.status === 'returned').length;
      const count = Math.min(returned, 3);
      const target = 3;
      return {
        current: count,
        target,
        percentage: Math.min(100, Math.round((count / target) * 100)),
        label: `${count} از ۳ ژانر متفاوت`
      };
    }
  },

  // ۸. سفیر مکتب‌خونه (سطح ۴ - الماسی)
  {
    id: 'badge_school_ambassador',
    title: 'سفیر مکتب‌خونه',
    titleEn: 'School Ambassador',
    icon: '⭐',
    imageUrl: starImg,
    tier: 'diamond',
    tierTitle: 'الماسی • سطح ۴',
    level: 4,
    description: 'مروج پیشتاز دانایی و حلقه وصل هم‌کلاسی‌ها به سامانه اشتراک کتاب مدرسه.',
    occasion: 'افتخار نمایندگی فرهنگی، الهام‌بخشی به همسالان و نقش‌آفرینی در شورای کتاب مدرسه.',
    property: 'حاشیه الماسی در رتبه‌بندی کلاسی + امکان دعوت مستقیم دوستان با پاداش امتیازی دوطرفه.',
    criteriaDesc: 'ثبت حداقل ۵ تبادل امانت موفق درون کلاس یا اعطای مستقیم توسط مدیر مدرسه.',
    color: 'bg-cyan-50 text-cyan-900 border-cyan-300',
    badgeGlow: 'shadow-[0_0_30px_rgba(6,182,212,0.45)]',
    badgeBorder: 'border-cyan-400',
    badgeBg: 'from-cyan-500/25 via-blue-500/15 to-transparent',
    checkEligibility: ({ user, borrowedRequests, ownedBooks }) => {
      const returned = borrowedRequests.filter((r) => r.status === 'returned').length;
      const totalActivities = returned + (ownedBooks.length || user.booksContributedCount || 0);
      return totalActivities >= 6;
    },
    calculateProgress: ({ user, borrowedRequests, ownedBooks }) => {
      const returned = borrowedRequests.filter((r) => r.status === 'returned').length;
      const total = returned + (ownedBooks.length || user.booksContributedCount || 0);
      const target = 6;
      return {
        current: Math.min(total, target),
        target,
        percentage: Math.min(100, Math.round((total / target) * 100)),
        label: `${total} از ۶ تعامل کلاسی`
      };
    }
  },

  // ۹. تاج سکوی افتخار (سطح ۴ - الماسی)
  {
    id: 'badge_podium_champion',
    title: 'تاج سکوی افتخار',
    titleEn: 'Podium Champion Crown',
    icon: '👑',
    imageUrl: crownImg,
    tier: 'diamond',
    tierTitle: 'الماسی • سطح ۴',
    level: 4,
    description: 'دستیابی به قله جدول امتیازات و ایستادن در جایگاه رتبه ۱ لیگ کتابخوانی ماهانه مدرسه.',
    occasion: 'تجلیل ویژه از تنها قهرمان ماه و صدرنشین بلامنازع لیگ کتابخوانی مدرسه.',
    property: 'نمایش نشان متحرک تاج زرین در کنار نام کاربری در سراسر سامانه + ثبت رسمی به عنوان قهرمان ماه بر روی تابلوی چاپی مدرسه.',
    criteriaDesc: 'کسب رتبه ۱ (صدرنشین مطلق) در رده‌بندی لیگ کتابخوانی ماهانه مدرسه.',
    color: 'bg-amber-50 text-amber-900 border-amber-300',
    badgeGlow: 'shadow-[0_0_30px_rgba(245,158,11,0.5)]',
    badgeBorder: 'border-amber-400',
    badgeBg: 'from-amber-500/30 via-yellow-500/15 to-transparent',
    checkEligibility: ({ leagueRank }) => {
      return leagueRank === 1;
    },
    calculateProgress: ({ leagueRank }) => {
      const rank = leagueRank || 99;
      return {
        current: rank === 1 ? 1 : 0,
        target: 1,
        percentage: rank === 1 ? 100 : (rank <= 3 ? 75 : (rank <= 10 ? 40 : 15)),
        label: rank === 1 ? 'کسب شد (رتبه ۱ لیگ ماهانه)' : `رتبه فعلی شما: ${rank} (هدف: رتبه ۱)`
      };
    }
  },

  // ۱۰. ققنوس فرزانگی (سطح ۵ - اسطوره‌ای / Mythic)
  {
    id: 'badge_phoenix_wisdom',
    title: 'ققنوس فرزانگی',
    titleEn: 'Phoenix of Wisdom',
    icon: '✨',
    imageUrl: phoenixImg,
    tier: 'mythic',
    tierTitle: 'اسطوره‌ای • سطح ۵',
    level: 5,
    description: 'بالاترین مرتبه افتخار و فرزانگی؛ تجلی آرمان کتابخوانی، سخاوت بی‌دریغ و اعتماد کامل.',
    occasion: 'نشان استادی مدرسه، اهدای لوح زرین تقدیر فیزیکی توسط مدیر مدرسه در مراسم رسمی.',
    property: 'ثبت دائمی نام و نمایه در تالار مشاهیر دانایی مدرسه + اهدای لوح تقدیر فیزیکی زرین توسط مدیر در مراسم صبحگاه + حق پیشنهاد خرید کتاب با بودجه مدرسه.',
    criteriaDesc: 'مطالعه و عودت حداقل ۲۵ جلد کتاب، اهدای حداقل ۸ جلد کتاب فعال به مدرسه و حفظ میانگین رضایت بالای ۴.۸۵.',
    color: 'bg-purple-50 text-purple-900 border-purple-300',
    badgeGlow: 'shadow-[0_0_35px_rgba(168,85,247,0.55)]',
    badgeBorder: 'border-purple-400',
    badgeBg: 'from-purple-600/30 via-fuchsia-500/20 to-transparent',
    checkEligibility: ({ user, ownedBooks, borrowedRequests }) => {
      const read = Math.max(
        user.booksReadCount || 0,
        borrowedRequests.filter((r) => r.status === 'returned').length
      );
      const donated = Math.max(user.booksContributedCount || 0, ownedBooks.length);
      const rating = user.rating || 5;
      return read >= 25 && donated >= 8 && rating >= 4.85;
    },
    calculateProgress: ({ user, ownedBooks, borrowedRequests }) => {
      const read = Math.max(
        user.booksReadCount || 0,
        borrowedRequests.filter((r) => r.status === 'returned').length
      );
      const donated = Math.max(user.booksContributedCount || 0, ownedBooks.length);
      const readScore = Math.min(1, read / 25);
      const donatedScore = Math.min(1, donated / 8);
      const totalPct = Math.round(((readScore + donatedScore) / 2) * 100);
      return {
        current: Math.min(read, 25),
        target: 25,
        percentage: totalPct,
        label: `${read}/۲۵ مطالعه • ${donated}/۸ اهدایی`
      };
    }
  },

  // ۱۱. راهبر مکتب‌خانه (سطح ۵ - اسطوره‌ای • ویژه مدیریت کل)
  {
    id: 'badge_supreme_leader',
    title: 'راهبر مکتب‌خانه',
    titleEn: 'Maktab Supreme Leader',
    icon: '🏛️',
    imageUrl: leaderImg,
    tier: 'mythic',
    tierTitle: 'اسطوره‌ای • سطح ۵ (ویژه مدیریت)',
    level: 5,
    description: 'خاص‌ترین، والاترین و برترین نشان مکتب‌خانه؛ نشان زرین افتخار و خرد ویژه مدیران و راهبران عالی که سکان‌دار دانایی، اعتماد، پاسداری از امانت‌ها و شکوفایی فرهنگی مدرسه هستند.',
    occasion: 'پاسداشت رهبری خردمندانه، مدیریت امور کتابخانه، نظارت راهبردی و تدبیر اندیشمندانه در گسترش فرهنگ مطالعه مدرسه.',
    property: 'بالاترین اختیارات راهبری سامانه + نشان زرین اختصاصی راهبری دانایی در سراسر سامانه + امضای دیجیتال رسمی اعتبار الواح و مدارک + دسترسی به تالار فرماندهی کتابخانه.',
    criteriaDesc: 'منحصراً ویژه مدیران رسمی سامانه مکتب‌خانه (اعطای اختصاصی بر پایه نقش و مسئولیت مدیریت کتابخانه).',
    color: 'bg-amber-50 text-amber-900 border-amber-300',
    badgeGlow: 'shadow-[0_0_40px_rgba(234,179,8,0.65)]',
    badgeBorder: 'border-amber-400',
    badgeBg: 'from-amber-500/35 via-yellow-400/25 to-blue-900/30',
    checkEligibility: ({ user }) => {
      return user.role === 'admin';
    },
    calculateProgress: ({ user }) => {
      const isAdmin = user.role === 'admin';
      return {
        current: isAdmin ? 1 : 0,
        target: 1,
        percentage: isAdmin ? 100 : 0,
        label: isAdmin ? 'احراز شده (مدیر عالی سامانه)' : 'منحصراً ویژه مدیران مدرسه'
      };
    }
  }
];

/**
 * تصاویر سه‌بعدی پیش‌فرض آماده برای ساخت مدال‌های سفارشی توسط مدیر
 */
export const PRESET_3D_IMAGES = [
  { id: 'sprout', name: 'جوانه زمردین (شروع و جوانه زدن)', url: sproutImg },
  { id: 'trust', name: 'کلید و سپر طلایی (امانت و پاسداری)', url: trustImg },
  { id: 'wings', name: 'کتاب بالدار فیروزه‌ای (سخاوت و پرواز)', url: wingsImg },
  { id: 'hourglass', name: 'ساعت شنی کریستالی (سرعت و زمان)', url: hourglassImg },
  { id: 'lantern', name: 'فانوس کهربایی (نقد و روشنگری)', url: lanternImg },
  { id: 'flame', name: 'مشعل کریستالی (استمرار و شعله پایدار)', url: flameImg },
  { id: 'compass', name: 'قطب‌نمای ناوبری (کاوش و تنوع ژانرها)', url: compassImg },
  { id: 'star', name: 'ستاره الماسین (سفیر و ترویج دانایی)', url: starImg },
  { id: 'crown', name: 'تاج شاهوار (قهرمان اول ماه)', url: crownImg },
  { id: 'phoenix', name: 'ققنوس کیهانی (استادی و خرد مطلق)', url: phoenixImg },
  { id: 'veteran', name: 'مدال کهن پیشکسوت (لوح و برگ زرین خرد)', url: veteranImg },
  { id: 'leader', name: 'نشان زرین راهبر مکتب‌خانه (ویژه مدیران عالی)', url: leaderImg }
];

/**
 * ژانرهای استاندارد برای گزینش در شروط اختصاصی نشان‌ها
 */
export const STANDARD_GENRES = [
  'داستانی و رمان',
  'علمی و دانستنی‌ها',
  'تاریخی و کهن',
  'مذهبی و معارفی',
  'روانشناسی و خودسازی',
  'کمیک و مصور',
  'شعر و ادب',
  'زندگینامه و مشاهیر',
  'فلسفه و اندیشه',
  'ماجراجویی و کارآگاهی',
  'کودک و نوجوان'
];

/**
 * تنظیمات و پاداش‌های ساختاریافته نشان سفارشی
 */
export interface CustomMedalPerksConfig {
  freeLoanCredits?: number; // سهمیه امانت رایگان (۱، ۲، ۳ یا ۵)
  leagueMultiplier?: number; // ضریب امتیاز لیگ (مثلاً ۱.۱x، ۱.۲۵x، ۱.۵x)
  bonusLeaguePoints?: number; // پاداش امتیاز یکجای لیگ (+۵۰، +۱۰۰، +۲۵۰، +۵۰۰)
  honoraryTitle?: string; // عنوان افتخاری روی پروفایل
  verifiedShield?: boolean; // نشان سپر اعتماد و کاربر معتمد
  pinnedReviews?: boolean; // سنجاق شدن نقدها در صدر دیدگاه‌های کتاب
  canSuggestPurchases?: boolean; // حق ثبت پیشنهاد خرید کتاب جدید با بودجه مدرسه
  certificateEligible?: boolean; // لوح تقدیر فیزیکی در مراسم صبحگاه
  customPerkText?: string; // متن دلخواه تکمیلی مدیر
}

/**
 * تنظیمات و شروط لاجیک فوق‌پیشرفته برای مدال سفارشی
 */
export interface CustomMedalRuleConfig {
  awardType: 'auto' | 'manual_only';
  matchMode?: 'all' | 'any'; // همه شروط (AND) یا حداقل یکی (OR)
  targetClass?: string; // فیلتر کلاس خاص یا 'all'

  // Reading criteria
  minBooksRead?: number;
  targetGenre?: string; // ژانر خاص
  minBooksInGenre?: number; // حداقل مطالعه در آن ژانر
  minDistinctGenres?: number; // تنوع دسته‌بندی‌ها
  minTotalPagesRead?: number; // مجموع تخمینی صفحات

  // Lending criteria
  minReturnedLoans?: number;
  requireZeroDelays?: boolean; // بدون تاخیر
  requireFastReturn?: boolean; // زیر ۷۲ ساعت
  minRating?: number; // حداقل امتیاز رضایت

  // Sharing criteria
  minBooksContributed?: number; // کتاب اهدایی
  minClassInteractions?: number; // تبادلات کلاسی

  // Content criteria
  minReviews?: number; // تعداد نقد
  minReviewWords?: number; // حداقل کلمات در نقد

  // League criteria
  maxLeagueRank?: number; // رتبه لیگ
  minLeaguePoints?: number; // حداقل امتیاز لیگ
}

/**
 * مدل ذخیره‌سازی مدال سفارشی ایجادشده توسط مدیر
 */
export interface CustomMedalData {
  id: string;
  title: string;
  titleEn?: string;
  icon: string;
  imageUrl?: string;
  tier: MedalTier;
  tierTitle?: string;
  level: number;
  description: string;
  occasion: string;
  property: string;
  criteriaDesc: string;
  isCustom: true;
  createdAt: string;
  rules: CustomMedalRuleConfig;
  perks?: CustomMedalPerksConfig;
}

/**
 * تبدیل پاداش‌های انتخابی به متن شیوا و جذاب
 */
export function formatPerksSummary(perks?: CustomMedalPerksConfig, customProperty?: string): string {
  if (customProperty && customProperty.trim()) {
    return customProperty.trim();
  }
  if (!perks) return 'افزایش اعتبار و ثبت در کارنامه افتخارات دانش‌آموز.';

  const perksList: string[] = [];
  if (perks.freeLoanCredits && perks.freeLoanCredits > 0) {
    perksList.push(`اعطای ${perks.freeLoanCredits} سهمیه امانت رایگان`);
  }
  if (perks.leagueMultiplier && perks.leagueMultiplier > 1) {
    perksList.push(`اعمال ضریب ${perks.leagueMultiplier} برابری بر امتیازات لیگ`);
  }
  if (perks.bonusLeaguePoints && perks.bonusLeaguePoints > 0) {
    perksList.push(`پاداش ${perks.bonusLeaguePoints} امتیاز تجربه در لیگ کتابخوانی`);
  }
  if (perks.honoraryTitle && perks.honoraryTitle.trim()) {
    perksList.push(`اعطای عنوان افتخاری «${perks.honoraryTitle.trim()}»`);
  }
  if (perks.verifiedShield) {
    perksList.push('نشان سپر سبز کاربر معتمد در سراسر سامانه');
  }
  if (perks.pinnedReviews) {
    perksList.push('سنجاق شدن دیدگاه‌ها به عنوان نقد برتر در صدر کتاب‌ها');
  }
  if (perks.canSuggestPurchases) {
    perksList.push('حق پیشنهاد مستقیم خرید کتاب با بودجه کتابخانه مدرسه');
  }
  if (perks.certificateEligible) {
    perksList.push('اهدای لوح تقدیر فیزیکی زرین توسط مدیر در صبحگاه');
  }
  if (perks.customPerkText && perks.customPerkText.trim()) {
    perksList.push(perks.customPerkText.trim());
  }

  return perksList.length > 0
    ? perksList.join(' + ')
    : 'افزایش اعتبار و ثبت در کارنامه افتخارات دانش‌آموز.';
}

/**
 * تبدیل مدال سفارشی به تعریف کامل MedalDefinition با منطق ارزیابی پویا
 */
export function createDefinitionFromCustomMedal(custom: CustomMedalData): MedalDefinition {
  const tierStyle = getTierBadgeStyle(custom.tier);
  const rules = custom.rules || { awardType: 'manual_only' };

  return {
    id: custom.id,
    title: custom.title,
    titleEn: custom.titleEn || 'Custom Achievement',
    icon: custom.icon || '🏅',
    imageUrl: custom.imageUrl || sproutImg,
    tier: custom.tier,
    tierTitle: custom.tierTitle || `${tierStyle.label} • سطح ${custom.level || 1}`,
    level: custom.level || 1,
    description: custom.description,
    occasion: custom.occasion,
    property: custom.property || formatPerksSummary(custom.perks),
    criteriaDesc: custom.criteriaDesc,
    isCustom: true,
    rules: custom.rules,
    color:
      custom.tier === 'mythic'
        ? 'bg-purple-50 text-purple-900 border-purple-300'
        : custom.tier === 'diamond'
        ? 'bg-cyan-50 text-cyan-900 border-cyan-300'
        : custom.tier === 'gold'
        ? 'bg-amber-50 text-amber-900 border-amber-300'
        : custom.tier === 'silver'
        ? 'bg-sky-50 text-sky-800 border-sky-300'
        : 'bg-emerald-50 text-emerald-800 border-emerald-300',
    badgeGlow:
      custom.tier === 'mythic'
        ? 'shadow-[0_0_35px_rgba(168,85,247,0.55)]'
        : custom.tier === 'diamond'
        ? 'shadow-[0_0_30px_rgba(6,182,212,0.45)]'
        : custom.tier === 'gold'
        ? 'shadow-[0_0_25px_rgba(245,158,11,0.4)]'
        : 'shadow-[0_0_20px_rgba(14,165,233,0.35)]',
    badgeBorder:
      custom.tier === 'mythic'
        ? 'border-purple-400'
        : custom.tier === 'diamond'
        ? 'border-cyan-400'
        : custom.tier === 'gold'
        ? 'border-amber-400'
        : 'border-sky-400',
    badgeBg:
      custom.tier === 'mythic'
        ? 'from-purple-600/30 via-fuchsia-500/20 to-transparent'
        : custom.tier === 'diamond'
        ? 'from-cyan-500/25 via-blue-500/15 to-transparent'
        : 'from-amber-500/20 via-yellow-500/10 to-transparent',
    checkEligibility: (ctx) => {
      if (rules.awardType === 'manual_only') return false;

      const { user, borrowedRequests, ownedBooks, userReviews, leagueRank, allBooks } = ctx;
      const returnedRequests = borrowedRequests.filter((r) => r.status === 'returned');
      const returnedCount = returnedRequests.length;
      const read = Math.max(user.booksReadCount || 0, returnedCount);
      const donated = Math.max(user.booksContributedCount || 0, ownedBooks.length);
      const rating = user.rating || 5;

      // Class filter check
      if (rules.targetClass && rules.targetClass !== 'all') {
        if (user.className !== rules.targetClass) return false;
      }

      // Check each condition
      const checks: boolean[] = [];

      // 1. Min Books Read
      if (rules.minBooksRead !== undefined && rules.minBooksRead > 0) {
        checks.push(read >= rules.minBooksRead);
      }

      // 2. Specific Genre Criteria
      if (rules.targetGenre && rules.minBooksInGenre && rules.minBooksInGenre > 0) {
        const inGenreCount = returnedRequests.filter((r) => {
          const b = allBooks?.find((bk) => bk.id === r.bookId);
          const cat = (r as any).category || b?.category;
          return cat === rules.targetGenre;
        }).length;
        checks.push(inGenreCount >= rules.minBooksInGenre);
      }

      // 3. Min Distinct Genres
      if (rules.minDistinctGenres !== undefined && rules.minDistinctGenres > 0) {
        const categories = new Set<string>();
        returnedRequests.forEach((r) => {
          const b = allBooks?.find((bk) => bk.id === r.bookId);
          const cat = (r as any).category || b?.category;
          if (cat) categories.add(cat);
        });
        checks.push(categories.size >= rules.minDistinctGenres);
      }

      // 4. Min Books Contributed
      if (rules.minBooksContributed !== undefined && rules.minBooksContributed > 0) {
        checks.push(donated >= rules.minBooksContributed);
      }

      // 5. Min Rating
      if (rules.minRating !== undefined && rules.minRating > 0) {
        checks.push(rating >= rules.minRating);
      }

      // 6. Min Reviews
      if (rules.minReviews !== undefined && rules.minReviews > 0) {
        checks.push((userReviews?.length || 0) >= rules.minReviews);
      }

      // 7. Min Review Words
      if (rules.minReviewWords !== undefined && rules.minReviewWords > 0) {
        const hasLongReview = (userReviews || []).some(
          (rev) => rev.comment && rev.comment.trim().split(/\s+/).length >= rules.minReviewWords!
        );
        checks.push(hasLongReview);
      }

      // 8. Max League Rank
      if (rules.maxLeagueRank !== undefined && rules.maxLeagueRank > 0) {
        checks.push(!!leagueRank && leagueRank <= rules.maxLeagueRank);
      }

      // 9. Min League Points
      if (rules.minLeaguePoints !== undefined && rules.minLeaguePoints > 0) {
        const points = read * 10 + donated * 15 + Math.round(rating * 5);
        checks.push(points >= rules.minLeaguePoints);
      }

      // 10. Min Returned Loans
      if (rules.minReturnedLoans !== undefined && rules.minReturnedLoans > 0) {
        checks.push(returnedCount >= rules.minReturnedLoans);
      }

      // 11. Zero Delays (100% on time)
      if (rules.requireZeroDelays) {
        const hadDelay = returnedRequests.some((r) => {
          if (!r.dueDate) return false;
          const returnedDate = (r as any).returnedDate || (r as any).returnedAt;
          if (!returnedDate) return false;
          return new Date(returnedDate).getTime() > new Date(r.dueDate).getTime() + 1000 * 60 * 60 * 24;
        });
        checks.push(!hadDelay && returnedCount >= 2);
      }

      // 12. Fast Return (< 72 hours)
      if (rules.requireFastReturn) {
        const hasFast = returnedRequests.some((r) => {
          try {
            const rawDelivered = (r as any).deliveredDate || r.handoverConfirmedAt || r.acceptedAt || r.createdAt;
            const rawReturned = (r as any).returnedDate || (r as any).returnedAt || r.createdAt;
            const start = new Date(rawDelivered).getTime();
            const end = new Date(rawReturned).getTime();
            const diffDays = (end - start) / (1000 * 60 * 60 * 24);
            return diffDays >= 0 && diffDays <= 3.5;
          } catch {
            return false;
          }
        });
        checks.push(hasFast);
      }

      if (checks.length === 0) return true;

      // Evaluate according to matchMode
      return rules.matchMode === 'any' ? checks.some(Boolean) : checks.every(Boolean);
    },
    calculateProgress: (ctx) => {
      const { user, borrowedRequests, ownedBooks, leagueRank } = ctx;
      if (rules.awardType === 'manual_only') {
        return {
          current: 0,
          target: 1,
          percentage: 0,
          label: 'اعطای اختصاصی با صلاحدید مدیر مدرسه'
        };
      }
      const returnedCount = borrowedRequests.filter((r) => r.status === 'returned').length;
      const read = Math.max(user.booksReadCount || 0, returnedCount);
      const donated = Math.max(user.booksContributedCount || 0, ownedBooks.length);

      if (rules.minBooksRead && rules.minBooksRead > 0) {
        return {
          current: Math.min(read, rules.minBooksRead),
          target: rules.minBooksRead,
          percentage: Math.min(100, Math.round((read / rules.minBooksRead) * 100)),
          label: `${read} از ${rules.minBooksRead} مطالعه`
        };
      }
      if (rules.minBooksContributed && rules.minBooksContributed > 0) {
        return {
          current: Math.min(donated, rules.minBooksContributed),
          target: rules.minBooksContributed,
          percentage: Math.min(100, Math.round((donated / rules.minBooksContributed) * 100)),
          label: `${donated} از ${rules.minBooksContributed} اهدایی`
        };
      }
      if (rules.maxLeagueRank && rules.maxLeagueRank > 0) {
        const rank = leagueRank || 99;
        const reached = rank <= rules.maxLeagueRank;
        return {
          current: reached ? 1 : 0,
          target: 1,
          percentage: reached ? 100 : Math.max(10, 100 - (rank - rules.maxLeagueRank) * 10),
          label: reached ? `رتبه ${rank} (کسب شد)` : `رتبه فعلی شما: ${rank} (هدف: رتبه ${rules.maxLeagueRank})`
        };
      }
      return { current: 1, target: 1, percentage: 100, label: 'شرط اختصاصی' };
    }
  };
}

/**
 * محاسبه دقیق رتبه لیگ کتابخوانی یک دانش‌آموز در سطح مدرسه
 */
export function computeStudentLeagueRank(studentId: string, allUsers: User[]): number {
  const students = allUsers.filter((u) => u.role === 'student' && u.status === 'approved');
  const sorted = [...students].sort((a, b) => {
    const scoreA =
      (a.booksReadCount || 0) * 10 +
      (a.booksContributedCount || 0) * 15 +
      Math.round((a.rating || 5) * 5);
    const scoreB =
      (b.booksReadCount || 0) * 10 +
      (b.booksContributedCount || 0) * 15 +
      Math.round((b.rating || 5) * 5);
    return scoreB - scoreA;
  });
  const index = sorted.findIndex((u) => u.id === studentId);
  return index >= 0 ? index + 1 : 99;
}

/**
 * دریافت یک مدال بر اساس شناسه (از لیست رسمی)
 */
export function getMedalDefinitionById(id: string): MedalDefinition | undefined {
  return OFFICIAL_MEDALS.find((m) => m.id === id);
}

/**
 * تبدیل تعریف مدال به شیء مدال ذخیره‌پذیر در مدل User
 */
export function medalDefinitionToUserMedal(
  def: MedalDefinition,
  options?: { awardedBy?: 'auto' | 'admin'; adminNote?: string }
): Medal {
  return {
    id: def.id,
    title: def.title,
    icon: def.icon,
    description: def.description,
    color: def.color,
    imageUrl: def.imageUrl,
    tier: def.tier,
    tierTitle: def.tierTitle,
    level: def.level,
    property: def.property,
    occasion: def.occasion,
    criteriaDesc: def.criteriaDesc,
    awardedAt: new Date().toISOString(),
    awardedBy: options?.awardedBy || 'auto',
    adminNote: options?.adminNote
  };
}

/**
 * رنگ‌بندی و استایل برچسب رده (Tier)
 */
export function getTierBadgeStyle(tier: MedalTier): {
  label: string;
  badgeClass: string;
  pillClass: string;
  glowClass: string;
} {
  switch (tier) {
    case 'bronze':
      return {
        label: 'برنزی',
        badgeClass: 'bg-amber-900/10 text-amber-800 border-amber-300',
        pillClass: 'bg-gradient-to-r from-amber-700 to-yellow-600 text-white',
        glowClass: 'shadow-amber-500/30'
      };
    case 'silver':
      return {
        label: 'نقره‌ای',
        badgeClass: 'bg-slate-200/60 text-slate-700 border-slate-300',
        pillClass: 'bg-gradient-to-r from-slate-400 to-slate-600 text-white',
        glowClass: 'shadow-slate-400/30'
      };
    case 'gold':
      return {
        label: 'طلایی',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-400',
        pillClass: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-bold',
        glowClass: 'shadow-amber-400/40'
      };
    case 'diamond':
      return {
        label: 'الماسی',
        badgeClass: 'bg-cyan-100 text-cyan-900 border-cyan-400',
        pillClass: 'bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 text-white font-bold',
        glowClass: 'shadow-cyan-400/50'
      };
    case 'mythic':
      return {
        label: 'اسطوره‌ای',
        badgeClass: 'bg-purple-100 text-purple-900 border-purple-400',
        pillClass: 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-600 text-white font-bold',
        glowClass: 'shadow-purple-500/50'
      };
  }
}
