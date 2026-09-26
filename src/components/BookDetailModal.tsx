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
  AlertCircle,
  Trash2,
  Check,
  Gift,
  Sparkles,
  Crop,
  Undo2
} from 'lucide-react';
import { CamScannerModal } from './CamScannerModal';
import { ExtractedMetadataModal } from './ExtractedMetadataModal';

interface BookDetailModalProps {
  book: Book | null;
  onClose: () => void;
  onRequestLoan: (bookId: string, options?: { useFreeLoan?: boolean; freeEventTitle?: string; freeEventId?: string }) => void;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
  book,
  onClose,
  onRequestLoan
}) => {
  const { currentUser, addBookReview, deleteBookReview, users, activeEvents, updateBook, revertBookCover, enrichBookFromIranKetab } = useApp();
  
  const existingUserReview = book?.reviews?.find((r) => r.userId === currentUser?.id);

  const [newRating, setNewRating] = useState(existingUserReview ? existingUserReview.rating : 5);
  const [newComment, setNewComment] = useState(existingUserReview ? existingUserReview.comment : '');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccessMessage, setReviewSuccessMessage] = useState('');
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [useFreeLoanQuota, setUseFreeLoanQuota] = useState(false);
  const [showCamScanner, setShowCamScanner] = useState(false);
  const [showFreeLoanReminderModal, setShowFreeLoanReminderModal] = useState(false);
  const [showExtractedModal, setShowExtractedModal] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);

  const hasFreeQuota = (currentUser?.freeLoanQuota || 0) > 0;
  const activeEvent = activeEvents[0];

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

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsSubmittingReview(true);
    setReviewSuccessMessage('');
    try {
      await addBookReview(book.id, newRating, newComment.trim());
      setReviewSuccessMessage('نظر شما با موفقیت ثبت شد ✓');
      setTimeout(() => {
        setReviewSuccessMessage('');
      }, 4000);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('آیا از حذف این نظر اطمینان دارید؟')) return;
    setDeletingReviewId(reviewId);
    try {
      await deleteBookReview(book.id, reviewId);
    } finally {
      setDeletingReviewId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-100 my-8 animate-in fade-in zoom-in duration-200">
        {/* Header Modal Bar */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-bold whitespace-nowrap">
              {book.category}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-300 truncate max-w-[130px] sm:max-w-none">شناسه: #{book.id}</span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition shrink-0 cursor-pointer"
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

            {/* Admin Crop Action Button */}
            {currentUser?.role === 'admin' && (
              <div className="sm:col-span-3 -mt-2 mb-2 p-3 bg-gradient-to-r from-amber-500/10 to-emerald-500/10 border border-amber-300/80 rounded-2xl flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 text-xs">
                  <span className="p-1.5 bg-gradient-to-br from-amber-500 to-emerald-600 text-white rounded-lg">
                    <Crop className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <span className="font-black text-slate-900">ابزار برش جلد (مدیریت): </span>
                    <span className="text-slate-600 text-[11px]">
                      {book.isCoverScanned
                        ? 'این جلد قبلاً برش خورده و مرتب شده است ✨'
                        : 'می‌توانید کادر این جلد را به دلخواه برش داده و تنظیم کنید.'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCamScanner(true)}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-600 hover:to-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Crop className="w-3.5 h-3.5 text-amber-100" />
                    <span>برش و تنظیم جلد</span>
                  </button>

                  {book.originalCoverImage && (
                    <button
                      onClick={async () => {
                        if (
                          confirm(
                            `آیا مایل هستید جلد کتاب «${book.title}» را به عکس اولیه برگردانید؟`
                          )
                        ) {
                          const res = await revertBookCover(book.id);
                          if (res && res.success) {
                            alert('جلد کتاب با موفقیت به عکس اولیه بازگردانده شد.');
                          }
                        }
                      }}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
                      title="بازگشت به عکس خام اولیه دانش‌آموز"
                    >
                      <Undo2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>بازگشت به عکس اولیه</span>
                    </button>
                  )}
                </div>
              </div>
            )}

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
                <p className="text-sm font-semibold text-slate-600 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span>نویسنده: <strong className="text-indigo-900">{book.author}</strong></span>
                  {book.publisher && (
                    <span className="text-slate-500 font-normal">| ناشر: <strong className="text-slate-800">{book.publisher}</strong></span>
                  )}
                  {book.translator && (
                    <span className="text-slate-500 font-normal">| مترجم: <strong className="text-slate-800">{book.translator}</strong></span>
                  )}
                </p>

                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
                  <p>
                    <strong className="text-slate-800">توضیحات و خلاصه:</strong>
                  </p>
                  <p className="leading-relaxed">{book.description || 'توضیحاتی برای این کتاب وارد نشده است.'}</p>
                </div>

                {/* Admin Metadata Passport Option */}
                {currentUser?.role === 'admin' && (
                  <div className="mt-4 p-3.5 bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-md border border-indigo-500/30 flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-sky-400 shrink-0 animate-pulse" />
                      <div>
                        <h4 className="text-xs font-black text-white">
                          شناسنامه جامع ایران‌کتاب (مدیریت)
                        </h4>
                        <p className="text-[10px] text-slate-300">
                          مشاهده هشتگ‌ها، مشخصات فنی، قطع، سال انتشار و مشخصات استخراج شده
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowExtractedModal(true)}
                      className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs transition shadow-2xs cursor-pointer flex items-center gap-1"
                    >
                      <span>مشاهده تمام اطلاعات استخراج‌شده 📋</span>
                    </button>
                  </div>
                )}

                {/* Free Loan Option (Event Reward Quota) */}
                {hasFreeQuota && isAvailable && (
                  <div className="mt-4 p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-300 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Gift className="w-5 h-5 text-amber-600 animate-bounce shrink-0" />
                        <div>
                          <h4 className="text-xs font-black text-amber-950">
                            استفاده از سهمیه امانت رایگان ایونت 🎁
                          </h4>
                          <p className="text-[11px] text-amber-800 font-medium mt-0.5">
                            شما دارای <strong>{currentUser?.freeLoanQuota} سهمیه امانت رایگان</strong> هستید (بدون پرداخت هزینه کارمزد).
                          </p>
                        </div>
                      </div>
                    </div>

                    <label className="flex items-center gap-2 pt-1 border-t border-amber-200/70 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useFreeLoanQuota}
                        onChange={(e) => setUseFreeLoanQuota(e.target.checked)}
                        className="w-4 h-4 text-amber-600 rounded-md focus:ring-amber-500 cursor-pointer"
                      />
                      <span className="text-xs font-black text-slate-900">
                        قرض گرفتن این کتاب با سهمیه رایگان ایونت (بدون پرداخت کارمزد)
                      </span>
                    </label>
                  </div>
                )}
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
                    if (hasFreeQuota && !useFreeLoanQuota) {
                      setShowFreeLoanReminderModal(true);
                    } else {
                      onRequestLoan(book.id, {
                        useFreeLoan: useFreeLoanQuota,
                        freeEventTitle: activeEvent?.title,
                        freeEventId: activeEvent?.id
                      });
                    }
                  }}
                  disabled={!isAvailable}
                  className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition cursor-pointer ${
                    !isAvailable
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : useFreeLoanQuota
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-200 hover:scale-102'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 hover:scale-102'
                  }`}
                >
                  {useFreeLoanQuota ? (
                    <>
                      <Gift className="w-4 h-4 text-slate-950" />
                      <span>ثبت درخواست امانت رایگان (جایزه ایونت)</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4" />
                      <span>ثبت درخواست امانت</span>
                    </>
                  )}
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
              currentUser.id === book.ownerId ? (
                <div className="p-4 bg-amber-50/80 border border-amber-200 text-amber-900 rounded-2xl text-xs font-bold flex items-center gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>شما مالک و صاحب این کتاب هستید. طبق قوانین سامانه امکان ثبت نظر و امتیاز روی کتاب‌های شخصی خودتان وجود ندارد.</span>
                </div>
              ) : (
                <form
                  onSubmit={handleReviewSubmit}
                  className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3"
                >
                  {reviewSuccessMessage && (
                    <div className="p-3 bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center justify-between shadow-md animate-in fade-in">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        <span>{reviewSuccessMessage}</span>
                      </div>
                    </div>
                  )}

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
                      <span>{isSubmittingReview ? 'در حال ثبت...' : 'ثبت نظر'}</span>
                    </button>
                  </div>
                </form>
              )
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

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{rev.rating}</span>
                        </div>

                        {(currentUser?.role === 'admin' || currentUser?.id === rev.userId) && (
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(rev.id)}
                            disabled={deletingReviewId === rev.id}
                            title={currentUser?.role === 'admin' ? 'حذف این نظر توسط مدیر' : 'حذف نظر من'}
                            className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
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

      {/* Free Loan Quota Reminder Modal (Prevents accidental payment) */}
      {showFreeLoanReminderModal && (
        <div className="fixed inset-0 z-70 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border-2 border-amber-400 rounded-3xl max-w-md w-full p-6 text-white text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-300 text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
              <Gift className="w-8 h-8 animate-bounce" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-amber-300">
                شما یک جایزه امانت رایگان دارید! 🎉
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                در حساب کاربری شما <strong>{currentUser?.freeLoanQuota} سهمیه امانت رایگان</strong> فعال است. آیا می‌خواهید این کتاب را با سهمیه جایزه خود امانت بگیرید تا نیازی به پرداخت هزینه ۱۰,۰۰۰ تومان نباشد؟
              </p>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-[11px] text-amber-200 text-right leading-relaxed">
              💡 با انتخاب گزینه رایگان، یک سهمیه از موجودی شما کسر شده و بدون نیاز به پرداخت کارت‌به‌کارت و ارسال فیش، درخواست فوراً برای صاحب کتاب ارسال می‌شود.
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowFreeLoanReminderModal(false);
                  setUseFreeLoanQuota(true);
                  onRequestLoan(book.id, {
                    useFreeLoan: true,
                    freeEventTitle: activeEvent?.title || 'سهمیه امانت رایگان ایونت',
                    freeEventId: activeEvent?.id
                  });
                }}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>✨ بله، استفاده از جایزه رایگان (بدون پرداخت)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowFreeLoanReminderModal(false);
                  onRequestLoan(book.id, {
                    useFreeLoan: false,
                    freeEventTitle: activeEvent?.title,
                    freeEventId: activeEvent?.id
                  });
                }}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                خیر، پرداخت عادی (ذخیره سهمیه رایگان برای بعد)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CamScanner Modal for Admin */}
      {showCamScanner && (
        <CamScannerModal
          initialImageUrl={book.coverImage}
          bookTitle={book.title}
          originalCoverImage={book.originalCoverImage}
          onClose={() => setShowCamScanner(false)}
          onSave={async (scannedImageDataUrl, originalBackupUrl) => {
            const res = await updateBook(book.id, {
              coverImage: scannedImageDataUrl,
              originalCoverImage: originalBackupUrl,
              isCoverScanned: true
            });
            if (!res.success) {
              throw new Error(res.message || 'خطا در ذخیره جلد کتاب');
            }
          }}
          onRevertToOriginal={
            book.originalCoverImage
              ? async () => {
                  await revertBookCover(book.id);
                }
              : undefined
          }
        />
      )}

      {/* Extracted Metadata Modal for Admin */}
      {showExtractedModal && (
        <ExtractedMetadataModal
          book={book}
          onClose={() => setShowExtractedModal(false)}
          onReEnrich={async () => {
            setIsEnriching(true);
            const res = await enrichBookFromIranKetab(book.id);
            setIsEnriching(false);
            if (res && res.success) {
              alert(res.message || 'اطلاعات با موفقیت به‌روزرسانی شد.');
            } else {
              alert(res?.message || 'خطا در به‌روزرسانی اطلاعات.');
            }
          }}
          isReEnriching={isEnriching}
        />
      )}
    </div>
  );
};
