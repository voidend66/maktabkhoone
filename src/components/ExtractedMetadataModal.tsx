import React from 'react';
import { Book } from '../types';
import { getSafeImageUrl, DEFAULT_BOOK_COVER } from '../utils/coverPresets';
import {
  X,
  Sparkles,
  BookOpen,
  Tag,
  Info,
  ExternalLink,
  Layers,
  Calendar,
  Building2,
  UserCheck,
  FileText,
  Copy,
  Check,
  RefreshCw
} from 'lucide-react';

interface ExtractedMetadataModalProps {
  book: Book;
  onClose: () => void;
  onReEnrich?: () => Promise<void>;
  isReEnriching?: boolean;
}

export const ExtractedMetadataModal: React.FC<ExtractedMetadataModalProps> = ({
  book,
  onClose,
  onReEnrich,
  isReEnriching = false
}) => {
  const [copiedTags, setCopiedTags] = React.useState(false);

  const rawTags = book.tags || [];
  const tags = rawTags
    .map((t) => t.replace(/&[a-z0-9#]+;/gi, '').replace(/;x[0-9a-f]+/gi, '').trim())
    .filter((t) => t.length > 1 && !t.includes(';'));
  const extraCategories = book.extraCategories || [];
  const rawMetadata = book.rawMetadata || {};

  const handleCopyTags = () => {
    if (tags.length === 0) return;
    const text = tags.map((t) => `#${t.replace(/\s+/g, '_')}`).join(' ');
    navigator.clipboard.writeText(text);
    setCopiedTags(true);
    setTimeout(() => setCopiedTags(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-100 my-8 animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-indigo-900 via-sky-950 to-slate-900 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-400/40 text-sky-300 flex items-center justify-center shrink-0 shadow-inner">
              <Sparkles className="w-5 h-5 text-sky-300 animate-pulse" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg leading-tight text-white flex items-center gap-2">
                شناسنامه و اطلاعات استخراج‌شده (ایران‌کتاب)
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                کتاب: «{book.title}» اثر {book.author}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {/* Main Book Banner */}
          <div className="flex flex-col sm:flex-row gap-5 p-4 bg-gradient-to-br from-slate-50 to-sky-50/50 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="w-24 sm:w-28 shrink-0 mx-auto sm:mx-0 aspect-[3/4] rounded-xl overflow-hidden shadow-md bg-white border border-slate-200">
              <img
                src={getSafeImageUrl(book.coverImage, 'book')}
                alt={book.title}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = DEFAULT_BOOK_COVER;
                }}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="grow space-y-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-900 font-extrabold text-[11px] border border-indigo-200">
                  {book.category}
                </span>
                {book.isbn && (
                  <span className="font-mono bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 font-bold text-[11px] shadow-2xs">
                    شابک: {book.isbn}
                  </span>
                )}
              </div>

              <h4 className="text-base font-black text-slate-900">{book.title}</h4>
              <p className="font-bold text-slate-700 flex items-center gap-1.5">
                <span>نویسنده:</span>
                <span className="text-indigo-800">{book.author}</span>
              </p>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80 text-[11px]">
                {book.publisher && (
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>ناشر: <strong>{book.publisher}</strong></span>
                  </div>
                )}
                {book.translator && (
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>مترجم: <strong>{book.translator}</strong></span>
                  </div>
                )}
                {book.originalTitle && (
                  <div className="flex items-center gap-1.5 text-slate-700 col-span-2">
                    <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>عنوان اصلی: <strong className="font-mono text-slate-800">{book.originalTitle}</strong></span>
                  </div>
                )}
                {book.pageCount && (
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>تعداد صفحه: <strong>{book.pageCount}</strong></span>
                  </div>
                )}
              </div>

              {book.sourceUrl && (
                <div className="pt-2">
                  <a
                    href={book.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sky-700 hover:text-sky-900 font-bold text-[11px] hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>مشاهده مستقیم صفحه محصول در ایران‌کتاب</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Hashtags & Categories Section */}
          <div className="p-4 bg-white rounded-2xl border border-sky-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h5 className="font-black text-xs text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-sky-600" />
                هشتگ‌ها و موضوعات استخراج‌شده ({tags.length} مورد)
              </h5>

              {tags.length > 0 && (
                <button
                  onClick={handleCopyTags}
                  className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200 transition text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedTags ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-sky-600" />}
                  <span>{copiedTags ? 'کپی شد' : 'کپی هشتگ‌ها'}</span>
                </button>
              )}
            </div>

            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-xl text-xs font-bold bg-sky-50 text-sky-900 border border-sky-200/90 shadow-2xs hover:bg-sky-100 transition"
                  >
                    #{tag.replace(/\s+/g, '_')}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">هشتگی برای این کتاب ثبت نشده است.</p>
            )}

            {extraCategories.length > 0 && (
              <div className="pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500 font-bold block mb-1.5">دسته‌بندی‌های فرعی ایران‌کتاب:</span>
                <div className="flex flex-wrap gap-1">
                  {extraCategories.map((cat, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Raw Specifications Grid */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h5 className="font-black text-xs text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              مشخصات دقیق و فنی استخراج‌شده ({Object.keys(rawMetadata).length} فاکتور)
            </h5>

            {Object.keys(rawMetadata).length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {Object.entries(rawMetadata).map(([key, val], idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700"
                  >
                    <span className="font-bold text-slate-500 text-[11px]">{key}:</span>
                    <span className="font-black text-slate-900 dir-ltr text-end">{String(val)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">مشخصات خام بیشتری ثبت نشده است.</p>
            )}
          </div>

          {/* Full Introduction / Description */}
          {book.description && (
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <h5 className="font-black text-xs text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Info className="w-4 h-4 text-emerald-600" />
                متن کامل معرفی و خلاصه استخراج‌شده
              </h5>
              <p className="text-xs text-slate-700 leading-relaxed text-justify whitespace-pre-line bg-slate-50 p-3 rounded-xl border border-slate-100">
                {book.description}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          {onReEnrich ? (
            <button
              onClick={onReEnrich}
              disabled={isReEnriching}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isReEnriching ? 'animate-spin' : ''}`} />
              <span>{isReEnriching ? 'در حال استعلام مجدد...' : 'استعلام و بروزرسانی مجدد از ایران‌کتاب'}</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition cursor-pointer"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
