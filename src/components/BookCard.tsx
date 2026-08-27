import React from 'react';
import { Book } from '../types';
import { Star, User, Bookmark, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { getSafeImageUrl, DEFAULT_BOOK_COVER } from '../utils/coverPresets';

interface BookCardProps {
  book: Book;
  onSelect: (book: Book) => void;
  onRequestLoan: (bookId: string) => void;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onSelect, onRequestLoan }) => {
  const isAvailable = book.status === 'available';

  return (
    <div
      onClick={() => onSelect(book)}
      className="group bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col cursor-pointer"
    >
      {/* Cover Image Container */}
      <div className="relative h-36 xs:h-44 sm:h-56 md:h-64 w-full bg-slate-100 overflow-hidden flex items-center justify-center">
        <img
          src={getSafeImageUrl(book.coverImage, 'book')}
          alt={book.title}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = DEFAULT_BOOK_COVER;
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Top Badges overlay */}
        <div className="absolute top-2 sm:top-3 inset-x-2 sm:inset-x-3 flex items-center justify-between pointer-events-none">
          <span className="bg-slate-900/80 backdrop-blur-md text-white text-[9px] sm:text-[11px] font-semibold px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-xs whitespace-nowrap">
            {book.category}
          </span>

          <span
            className={`text-[9px] sm:text-[11px] font-bold px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-xs backdrop-blur-md whitespace-nowrap ${
              book.condition === 'عالی (نو)'
                ? 'bg-emerald-500/90 text-white'
                : book.condition === 'خوب'
                ? 'bg-blue-500/90 text-white'
                : 'bg-amber-500/90 text-white'
            }`}
          >
            {book.condition}
          </span>
        </div>

        {/* Status Overlay Badge if not available */}
        {!isAvailable && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-2">
            <div className="bg-white/95 text-slate-800 px-2 py-1 rounded-lg font-bold text-[9px] sm:text-xs flex items-center gap-1 shadow-lg text-center">
              {book.status === 'borrowed' ? (
                <>
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-amber-600 shrink-0" />
                  <span className="truncate max-w-[100px]">در امانت همکلاسی</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 shrink-0" />
                  <span>در بررسی درخواست</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Book Content */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Rating */}
          <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-500 mb-1">
            {book.reviewsCount && book.reviewsCount > 0 ? (
              <div className="flex items-center gap-0.5 text-amber-500 font-bold">
                <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-400" />
                <span>{book.rating}</span>
                <span className="text-slate-400 font-normal hidden xs:inline">({book.reviewsCount} نظر)</span>
              </div>
            ) : (
              <div className="flex items-center gap-0.5 text-slate-400 font-medium text-[9px] sm:text-[11px]">
                <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-300" />
                <span>بدون دیدگاه</span>
              </div>
            )}
            <span className="text-[9px] sm:text-[11px] text-slate-400">{book.addedDate}</span>
          </div>

          <h3 className="font-bold text-slate-900 text-xs sm:text-sm md:text-base line-clamp-1 group-hover:text-indigo-600 transition-colors">
            {book.title}
          </h3>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 mb-2 line-clamp-1">
            نویسنده: {book.author}
          </p>
        </div>

        {/* Owner Info & Action */}
        <div className="pt-2 sm:pt-3 border-t border-slate-100 flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {book.ownerAvatar ? (
              <img
                src={book.ownerAvatar}
                alt={book.ownerName}
                className="w-5 h-5 sm:w-7 sm:h-7 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[9px] sm:text-xs shrink-0">
                <User className="w-3 h-3 sm:w-4 sm:h-4" />
              </div>
            )}
            <div className="min-w-0">
              <div className="text-[9px] text-slate-700 font-bold truncate leading-tight">
                {book.ownerName}
              </div>
              <div className="text-[8px] text-slate-400 leading-tight truncate">
                کلاس {book.ownerClass}
              </div>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isAvailable) {
                onRequestLoan(book.id);
              } else {
                onSelect(book);
              }
            }}
            disabled={!isAvailable}
            className={`px-2 py-1 sm:px-3 sm:py-1.5 text-[9px] sm:text-xs font-black rounded-lg sm:rounded-xl transition flex items-center justify-center gap-0.5 shrink-0 w-full xs:w-auto cursor-pointer ${
              isAvailable
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Bookmark className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
            <span>{isAvailable ? 'امانت' : 'جزییات'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
