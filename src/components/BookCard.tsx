import React from 'react';
import { Book } from '../types';
import { Star, User, Bookmark, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

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
      <div className="relative h-44 sm:h-56 md:h-64 w-full bg-slate-100 overflow-hidden flex items-center justify-center">
        <img
          src={book.coverImage}
          alt={book.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Top Badges overlay */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
          <span className="bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-xs">
            {book.category}
          </span>

          <span
            className={`text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs backdrop-blur-md ${
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
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4">
            <div className="bg-white/95 text-slate-800 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg">
              {book.status === 'borrowed' ? (
                <>
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>در دست امانت ({book.borrowerName || 'همکلاسی'})</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  <span>در حال بررسی درخواست</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Book Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Rating */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <div className="flex items-center gap-1 text-amber-500 font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{book.rating}</span>
              <span className="text-slate-400 font-normal">({book.reviewsCount} نظر)</span>
            </div>
            <span className="text-[11px] text-slate-400">{book.addedDate}</span>
          </div>

          <h3 className="font-bold text-slate-900 text-base line-clamp-1 group-hover:text-indigo-600 transition-colors">
            {book.title}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-3 line-clamp-1">
            نویسنده: {book.author}
          </p>
        </div>

        {/* Owner Info & Action */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {book.ownerAvatar ? (
              <img
                src={book.ownerAvatar}
                alt={book.ownerName}
                className="w-7 h-7 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                <User className="w-4 h-4" />
              </div>
            )}
            <div className="min-w-0">
              <div className="text-[11px] text-slate-400 leading-tight truncate">مالک اصلی:</div>
              <div className="text-xs font-bold text-slate-700 truncate">
                {book.ownerName} <span className="text-slate-400 font-normal text-[10px]">({book.ownerClass})</span>
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
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1 shrink-0 ${
              isAvailable
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-100'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>{isAvailable ? 'درخواست امانت' : 'جزییات'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
