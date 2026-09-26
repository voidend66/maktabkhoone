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
