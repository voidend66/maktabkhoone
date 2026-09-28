export const PERSIAN_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند'
];

/**
 * Returns current Persian (Jalali) date { year, month, day }
 */
export function getCurrentJalaliDate(): { year: number; month: number; day: number } {
  try {
    const formatter = new Intl.DateTimeFormat('fa-IR-u-nu-latn', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
    const parts = formatter.formatToParts(new Date());
    const year = Number(parts.find((p) => p.type === 'year')?.value || 1403);
    const month = Number(parts.find((p) => p.type === 'month')?.value || 1);
    const day = Number(parts.find((p) => p.type === 'day')?.value || 1);
    return { year, month, day };
  } catch (e) {
    return { year: 1403, month: 1, day: 1 };
  }
}

/**
 * Formats day and month to Persian string, e.g. "۱۵ مهر"
 */
export function formatPersianBirthday(month?: number, day?: number): string {
  if (!month || !day) return 'ثبت نشده';
  const monthName = PERSIAN_MONTHS[month - 1] || 'نامشخص';
  return `${day} ${monthName}`;
}

/**
 * Checks if today matches the given birth month and day
 */
export function isTodayBirthday(birthMonth?: number, birthDay?: number): boolean {
  if (!birthMonth || !birthDay) return false;
  const { month, day } = getCurrentJalaliDate();
  return birthMonth === month && birthDay === day;
}

/**
 * Calculates day of the year in Jalali calendar (1..365)
 */
export function getDayOfYearJalali(month: number, day: number): number {
  if (month <= 6) {
    return (month - 1) * 31 + day;
  } else {
    return 6 * 31 + (month - 7) * 30 + day;
  }
}

/**
 * Calculates how many days remain until the next birthday in the Jalali calendar (0..364)
 */
export function getDaysUntilBirthday(birthMonth?: number, birthDay?: number): number | null {
  if (!birthMonth || !birthDay) return null;
  const { month, day } = getCurrentJalaliDate();
  const currentDayOfYear = getDayOfYearJalali(month, day);
  const birthDayOfYear = getDayOfYearJalali(birthMonth, birthDay);

  if (currentDayOfYear === birthDayOfYear) return 0;
  if (birthDayOfYear > currentDayOfYear) {
    return birthDayOfYear - currentDayOfYear;
  } else {
    return (365 - currentDayOfYear) + birthDayOfYear;
  }
}

/**
 * Human-readable Persian label for days until birthday
 */
export function formatDaysUntilBirthday(birthMonth?: number, birthDay?: number): string {
  const days = getDaysUntilBirthday(birthMonth, birthDay);
  if (days === null) return 'ثبت نشده';
  if (days === 0) return 'امروز! 🎂🎉';
  if (days === 1) return 'فردا 🎈';
  if (days <= 7) return `${days} روز دیگر (همین هفته)`;
  if (days <= 30) return `${days} روز دیگر (همین ماه)`;
  return `${days} روز مانده`;
}

/**
 * Returns Persian season for the given birth month
 */
export function getPersianSeason(month?: number): { name: string; icon: string; color: string } {
  if (!month || month < 1 || month > 12) return { name: 'نامشخص', icon: '🌱', color: 'text-slate-600 bg-slate-100' };
  if (month <= 3) return { name: 'بهار', icon: '🌸', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  if (month <= 6) return { name: 'تابستان', icon: '☀️', color: 'text-amber-700 bg-amber-50 border-amber-200' };
  if (month <= 9) return { name: 'پاییز', icon: '🍁', color: 'text-orange-700 bg-orange-50 border-orange-200' };
  return { name: 'زمستان', icon: '❄️', color: 'text-sky-700 bg-sky-50 border-sky-200' };
}

