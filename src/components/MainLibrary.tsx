import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { BookCard } from './BookCard';
import { Book } from '../types';
import { CATEGORIES } from '../data/mockData';
import {
  MaktabKhanehHouseLogo,
  MaktabKhanehLogo,
  BoyishMotifsBanner,
  SloganBadge
} from './MaktabKhanehBranding';
import {
  Search,
  Filter,
  BookOpen,
  Sparkles,
  Users,
  BookmarkCheck,
  CheckCircle2,
  TrendingUp,
  SlidersHorizontal,
  Backpack,
  Lightbulb,
  Compass
} from 'lucide-react';

interface MainLibraryProps {
  onSelectBook: (book: Book) => void;
  onRequestLoan: (bookId: string) => void;
  onNavigateAddBooks: () => void;
  onNavigateBenefits?: () => void;
}

export const MainLibrary: React.FC<MainLibraryProps> = ({
  onSelectBook,
  onRequestLoan,
  onNavigateAddBooks,
  onNavigateBenefits
}) => {
  const { books, users, currentUser, systemConfig } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('همه تصنیف‌ها');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'rating' | 'reviews'>('newest');

  const announcement = systemConfig?.announcement;
  const isAnnouncementValid = useMemo(() => {
    if (!announcement || !announcement.isActive || !announcement.text) return false;
    if (announcement.durationDays && announcement.durationDays > 0) {
      const createdTimestamp = announcement.createdAtTimestamp || Date.now();
      const durationMs = announcement.durationDays * 24 * 60 * 60 * 1000;
      if (Date.now() - createdTimestamp > durationMs) {
        return false;
      }
    }
    return true;
  }, [announcement]);

  // Filtered & Sorted Books
  const filteredBooks = useMemo(() => {
    return books
      .filter((book) => {
        // Search Filter
        const query = searchQuery.trim().toLowerCase();
        const matchesSearch =
          !query ||
          book.title.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query) ||
          book.ownerName.toLowerCase().includes(query) ||
          book.ownerClass.toLowerCase().includes(query) ||
          book.description.toLowerCase().includes(query);

        // Category Filter
        const matchesCategory =
          selectedCategory === 'همه تصنیف‌ها' || book.category === selectedCategory;

        // Availability Filter
        const matchesAvailability = !onlyAvailable || book.status === 'available';

        return matchesSearch && matchesCategory && matchesAvailability;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'reviews') return b.reviewsCount - a.reviewsCount;
        return b.id.localeCompare(a.id); // Default newest
      });
  }, [books, searchQuery, selectedCategory, onlyAvailable, sortBy]);

  const totalAvailable = books.filter((b) => b.status === 'available').length;
  const approvedStudentsCount = users.filter((u) => u.status === 'approved' && u.role === 'student').length;

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Welcome Banner with MaktabKhaneh House Logo */}
      <div className="relative rounded-3xl bg-gradient-to-r from-cyan-950 via-sky-950 to-indigo-950 text-white p-6 sm:p-8 shadow-xl overflow-hidden border-2 border-cyan-500/30">
        {/* Background Decorative Graphic */}
        <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-10 top-0 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
          {/* Main Info Side */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <SloganBadge />
            </div>

            <h1 className="text-3xl sm:text-4xl font-['Lalezar',cursive] leading-tight text-amber-300 tracking-normal">
              سامانه تبادل و امانت کتاب مَکـتَب‌خـونه 📚
            </h1>

            <p className="text-cyan-100 text-sm sm:text-base leading-relaxed font-medium">
              به دنیایی از کتاب‌های دوستان‌تان وارد شوید و یک عالمه کتاب جذاب و خواندنی بخوانید! کتاب‌های خود را در مکتب‌خونه به دوستان و همکلاسی‌هایتان امانت بدهید؛ برای مطالعه هر کتاب یک هفته فرصت طلایی دارید و در لیگ کتابخوانی مدرسه مدال افتخار کسب کنید.
            </p>

            {/* Quick Stats Grid */}
            <div className="pt-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 text-center sm:text-right">
                <div className="text-2xl font-black text-amber-300">{books.length} جلد</div>
                <div className="text-xs text-cyan-200 font-bold">کتاب به اشتراک گذاشته‌شده</div>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 text-center sm:text-right">
                <div className="text-2xl font-black text-cyan-300">{totalAvailable} جلد</div>
                <div className="text-xs text-cyan-200 font-bold">آماده امانت گرفتن فوری</div>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 col-span-2 sm:col-span-1 text-center sm:text-right">
                <div className="text-2xl font-black text-emerald-300">{approvedStudentsCount} نفر</div>
                <div className="text-xs text-cyan-200 font-bold">دانش‌آموز فعال مدرسه</div>
              </div>
            </div>
          </div>

          {/* Logo Showcase Side */}
          <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col items-center justify-center gap-4">
            <MaktabKhanehHouseLogo size="md" className="w-full" />
          </div>
        </div>
      </div>

      {/* Active Announcement Card */}
      {isAnnouncementValid && announcement && (
        <div className="relative rounded-3xl bg-gradient-to-r from-cyan-950 via-sky-950 to-indigo-950 text-white p-6 sm:p-8 shadow-xl overflow-hidden border-2 border-cyan-500/30 flex flex-col md:flex-row items-center gap-6">
          {/* Background Decorative Graphic */}
          <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
          {announcement.imageUrl && (
            <div className="w-full md:w-1/3 shrink-0 rounded-2xl overflow-hidden border border-cyan-500/20 shadow-lg">
              <img
                src={announcement.imageUrl}
                alt="تصویر اطلاعیه"
                className="w-full h-44 md:h-52 object-cover hover:scale-105 transition duration-500"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
          <div className="flex-1 space-y-3 relative z-10 text-right">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 px-3 py-1 rounded-full text-[10px] font-black tracking-wide uppercase flex items-center gap-1">
                <Sparkles className="w-3 h-3 animate-pulse text-amber-400" />
                <span>اطلاعیه جدید کتابخانه</span>
              </span>
              <span className="text-cyan-300 text-[10px] font-bold">
                📅 منتشر شده در: {announcement.createdAt}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-['Lalezar',cursive] leading-tight text-amber-300">
              اعلان مهم کتابخانه مدرسه 📢
            </h2>
            <div className="text-cyan-100 text-xs sm:text-sm leading-relaxed font-bold whitespace-pre-line bg-sky-950/40 p-4 rounded-2xl border border-sky-500/10">
              {announcement.text}
            </div>
          </div>
        </div>
      )}

      {/* Boyish School Motifs Banner (Backpack, Desk Lamp, Paper Airplane, Books) */}
      <BoyishMotifsBanner />

      {/* Main Benefits & Values Quick Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-5 sm:p-6 text-slate-950 shadow-md border border-amber-300 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-950 text-amber-300 rounded-2xl shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-black text-base sm:text-lg text-slate-950">
              ویژگی‌ها و مزایای برجسته امانت کتاب در «مکتب خونه» 🎒
            </h3>
            <p className="text-xs font-bold text-slate-900 mt-0.5">
              مزایای فرهنگی، اجتماعی، مشارکت مدنی، صرفه‌جویی مالی و حفظ محیط زیست
            </p>
          </div>
        </div>

        {onNavigateBenefits && (
          <button
            onClick={onNavigateBenefits}
            className="w-full md:w-auto px-5 py-2.5 bg-slate-950 hover:bg-slate-900 text-amber-300 font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 shrink-0"
          >
            <span>مشاهده کامل ویژگی‌ها و مزایا</span>
            <Compass className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Controls Bar: Search & Filters */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="md:col-span-6 relative">
            <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو با عنوان کتاب، نویسنده، نام همکلاسی (مثلا حسن) یا کلاس..."
              className="w-full pl-4 pr-11 py-3 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md hover:bg-slate-300"
              >
                پاک‌کردن
              </button>
            )}
          </div>

          {/* Availability Toggle */}
          <div className="md:col-span-3 flex items-center justify-start md:justify-center">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 select-none">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded-md focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
              />
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                فقط کتاب‌های آماده امانت
              </span>
            </label>
          </div>

          {/* Sort Selector */}
          <div className="md:col-span-3 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200/95 rounded-2xl py-2.5 px-4 text-xs font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition cursor-pointer shadow-2xs hover:border-indigo-400"
            >
              <option value="newest" className="font-semibold text-slate-900">✨ جدیدترین کتاب‌ها</option>
              <option value="rating" className="font-semibold text-slate-900">⭐ بالاترین امتیاز و محبوبیت</option>
              <option value="reviews" className="font-semibold text-slate-900">💬 بیشترین نظرات و گفتگو</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 scrollbar-none">
          <span className="text-xs font-bold text-slate-400 whitespace-nowrap ml-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> دسته‌بندی:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Book Grid Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <span>کتاب‌های کتابخانه مدرسه</span>
          <span className="bg-indigo-100 text-indigo-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
            {filteredBooks.length} جلد
          </span>
        </h2>

        {currentUser && (
          <button
            onClick={onNavigateAddBooks}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 rounded-xl border border-indigo-100 transition"
          >
            + افزودن کتاب جدید به گنجینه من
          </button>
        )}
      </div>

      {/* Book Cards Grid */}
      {books.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 sm:p-16 text-center border-2 border-dashed border-cyan-300 space-y-4 shadow-sm max-w-2xl mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-100 to-sky-200 text-cyan-700 mx-auto flex items-center justify-center shadow-inner">
            <BookOpen className="w-10 h-10" />
          </div>
          <h3 className="font-black text-slate-900 text-lg sm:text-xl">
            هنوز کتابی در کتابخانه مکتب‌خانه ثبت نشده است! 📚
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            اولین نفری باشید که کتاب‌های خوانده‌شده و جذاب خود را با همکلاسی‌هایتان به اشتراک می‌گذارد و در لیگ کتابخوانی مدال افتخار دریافت می‌کند.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onNavigateAddBooks}
              className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-cyan-600/20 transition flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>+ افزودن اولین کتاب به گنجینه</span>
            </button>
          </div>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 mx-auto flex items-center justify-center">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">کتابی با این مشخصات فیلتر یافت نشد!</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            می‌توانید عبارت جستجو را تغییر دهید یا فیلتر دسته‌بندی را روی «همه تصنیف‌ها» بگذارید.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('همه تصنیف‌ها');
              setOnlyAvailable(false);
            }}
            className="text-xs font-bold text-indigo-600 hover:underline pt-2 inline-block"
          >
            پاک کردن تمام فیلترها
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 px-1.5 sm:px-0 max-w-none mx-auto">
          {filteredBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onSelect={onSelectBook}
              onRequestLoan={onRequestLoan}
            />
          ))}
        </div>
      )}
    </div>
  );
};
