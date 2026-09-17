import { SchoolClass } from '../types';

export const GRADES = [
  'پایه اول دبستان',
  'پایه دوم دبستان',
  'پایه سوم دبستان',
  'پایه چهارم دبستان',
  'پایه پنجم دبستان',
  'پایه ششم دبستان',
  'معلمان و کادر مدرسه (سایر / مهمان)'
];

export const SCHOOL_GRADES = GRADES;

export const CATEGORIES = [
  'همه تصنیف‌ها',
  'داستان و قصه کودک',
  'ورزش، قهرمانان و تندرستی',
  'کمیک و کتاب تصویری',
  'شعر و ترانه کودکانه',
  'علمی و رازهای جهان',
  'سرگرمی، بازی و معما',
  'افسانه‌ها و اساطیر',
  'حیوانات و طبیعت',
  'ادبیات و نوجوان',
  'روانشناسی و مهارت زندگی'
];

// Admin Phone Numbers
export const ADMIN_PHONES: string[] = ['09125404132', '09355657569'];

export const isAdminPhone = (phone: string): boolean => {
  if (!phone) return false;
  const clean = phone.replace(/\D/g, '');
  return ADMIN_PHONES.some(p => {
    const pClean = p.replace(/\D/g, '');
    return clean === pClean || clean.endsWith(pClean.slice(-10)) || pClean.endsWith(clean.slice(-10));
  });
};

// Empty production defaults
export const INITIAL_CLASSES: SchoolClass[] = [];
export const INITIAL_USERS = [];
export const INITIAL_BOOKS = [];
export const INITIAL_REQUESTS = [];

