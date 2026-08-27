import React, { useState } from 'react';
import { Book } from '../types';
import { useApp } from '../context/AppContext';
import { getSafeImageUrl, DEFAULT_BOOK_COVER, DEFAULT_AVATARS } from '../utils/coverPresets';
import {
  X,
  Star,
  User,
  Bookmark,
  MessageSquare,
  Send,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface BookDetailModalProps {
  book: Book | null;
  onClose: () => void;
  onRequestLoan: (bookId: string) => void;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
  book,
  onClose,
  onRequestLoan
}) => {
  const { currentUser, addBookReview, users } = useApp();
  
  const existingUserReview = book?.reviews?.find((r) => r.userId === currentUser?.id);

  const [newRating, setNewRating] = useState(existingUserReview ? existingUserReview.rating : 5);
  const [newComment, setNewComment] = useState(existingUserReview ? existingUserReview.comment : '');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Sync state if existing review changes
  React.useEffect(() => {
    if (existingUserReview) {
      setNewRating(existingUserReview.rating);
      setNewComment(existingUserReview.comment);
    } else {
      setNewRating(5);
      setNewComment('');
    }
  }, [book?.id, currentUser?.id]);

  if (!book) return null;

  const isAvailable = book.status === 'available';
  const owner = users.find((u) => u.id === book.ownerId);

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsSubmittingReview(true);
    addBookReview(book.id, newRating, newComment.trim());
    setIsSubmittingReview(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-100 my-8 animate-in fade-in zoom-in duration-200">
        {/* Header Modal Bar */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-xs px-3 py-1 rounded-full font-bold">
              {book.category}
            </span>
            <span className="text-xs text-slate-300">شناسه کتاب: #{book.id}</span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
          {/* Main Info Header Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Cover Column */}
            <div className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-slate-100 shadow-md">
              <img
                src={getSafeImageUrl(book.coverImage, 'book')}
                alt={book.title}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = DEFAULT_BOOK_COVER;
                }}
                className="w-full h-full object-cover"
              />
              <span
                className={`absolute bottom-3 right-3 text-xs font-bold px-3 py-1 rounded-full text-white shadow-md ${
                  book.condition === 'عالی (نو)'
                    ? 'bg-emerald-600'
                    : book.condition === 'خوب'
                    ? 'bg-blue-600'
                    : 'bg-amber-600'
                }`}
              >
                وضعیت: {book.condition}
              </span>
            </div>

            {/* Book Details Column */}
            <div className="sm:col-span-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-amber-500 font-bold text-sm mb-1">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= Math.round(book.rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span>{book.rating} از ۵</span>
                  <span className="text-slate-400 text-xs font-normal">
                    ({book.reviewsCount} نظر دانش‌آموزان)
                  </span>
                </div>

                <h2 className="text-2xl font-black text-slate-900 leading-snug">
                  {book.title}
                </h2>
                <p className="text-sm font-semibold text-slate-600 mt-1">
                  نویسنده: <span className="text-slate-800">{book.author}</span>
                </p>

                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
                  <p>
                    <strong className="text-slate-800">توضیحات و خلاصه:</strong>
                  </p>
                  <p className="leading-relaxed">{book.description || 'توضیحاتی برای این کتاب وارد نشده است.'}</p>
                </div>
              </div>

              {/* Action Request Button */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-400 block">وضعیت فعلی:</span>
                  <span
                    className={`text-sm font-bold flex items-center gap-1 ${
                      isAvailable ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    {isAvailable ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> آماده امانت
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4" /> غیرقابل امانت (در دست امانت/درخواست)
                      </>
                    )}
                  </span>
                </div>

                <button
                  onClick={() => {
                    onRequestLoan(book.id);
                  }}
                  disabled={!isAvailable}
                  className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition ${
                    isAvailable
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 hover:scale-102'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Bookmark className="w-4 h-4" />
                  <span>ثبت درخواست امانت</span>
                </button>
              </div>
            </div>
          </div>

          {/* Owner Information Card */}
          <div className="bg-indigo-50/60 rounded-2xl p-4 border border-indigo-100 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <img
                src={getSafeImageUrl(book.ownerAvatar || owner?.avatar, 'avatar')}
                alt={book.ownerName}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATARS.studentMale;
                }}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500"
              />
              <div>
                <div className="text-xs text-indigo-800 font-semibold">
                  مالک و اشتراک‌گذار اصلی کتاب:
                </div>
                <div className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>کتاب متعلق به «{book.ownerName}» است</span>
                  <span className="bg-indigo-100 text-indigo-900 text-xs px-2 py-0.5 rounded-full font-bold">
                    کلاس {book.ownerClass}
                  </span>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                  <span>امتیاز امانت‌داری مالک: ⭐ {owner?.rating || 5.0}</span>
                  <span>•</span>
                  <span>تعداد کتاب‌های اشتراکی: {owner?.booksContributedCount || 1} جلد</span>
                </div>
              </div>
            </div>

            {/* Medals preview */}
            {owner?.medals && owner.medals.length > 0 && (
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-emerald-100 shadow-2xs">
                {owner.medals.map((m) => (
                  <span
                    key={m.id}
                    title={`${m.title}: ${m.description}`}
                    className="text-lg"
                  >
                    {m.icon}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Reviews & Ratings Section */}
          <div className="border-t border-slate-200 pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                نظرات و امتیازهای دانش‌آموزان ({book.reviewsCount})
              </h3>
            </div>

            {/* Add Review Form */}
            {currentUser ? (
              <form
                onSubmit={handleReviewSubmit}
                className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold text-slate-700">
                    ثبت نظر شما برای این کتاب:
                  </span>

                  {/* Rating Selector */}
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-500 ml-2">امتیاز شما:</span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setNewRating(star)}
                        className="p-1 hover:scale-110 transition"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= newRating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  rows={2}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="نظر خود را درباره متن کتاب یا تجربه امانت گرفتن آن بنویسید..."
                  className="w-full bg-white rounded-xl p-3 text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!newComment.trim() || isSubmittingReview}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-100 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>ثبت نظر</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-3 bg-slate-100 rounded-xl text-center text-xs text-slate-600">
                جهت ثبت نظر برای این کتاب باید وارد حساب کاربری خود شوید.
              </div>
            )}

            {/* Reviews List */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {(!book.reviews || book.reviews.length === 0) ? (
                <p className="text-xs text-slate-400 text-center py-4">
                  هنوز نظری برای این کتاب ثبت نشده است. اولین نفری باشید که نظر می‌دهید!
                </p>
              ) : (
                book.reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-3.5 bg-white rounded-xl border border-slate-100 shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={rev.userAvatar}
                          alt={rev.userName}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-800">
                            {rev.userName}
                          </span>
                          <span className="text-[10px] text-slate-400 mr-1.5">
                            (کلاس {rev.userClass})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{rev.rating}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed pr-9">
                      {rev.comment}
                    </p>
                    <div className="text-[10px] text-slate-400 text-left">
                      {rev.date}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
