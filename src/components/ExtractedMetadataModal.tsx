import React, { useState, useEffect } from 'react';
import { Book } from '../types';
import { useApp } from '../context/AppContext';
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
  RefreshCw,
  Edit2,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle
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
  const { updateBook } = useApp();
  const [copiedTags, setCopiedTags] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Editable Form State
  const [publisher, setPublisher] = useState(book.publisher || '');
  const [translator, setTranslator] = useState(book.translator || '');
  const [originalTitle, setOriginalTitle] = useState(book.originalTitle || '');
  const [isbn, setIsbn] = useState(book.isbn || '');
  const [pageCount, setPageCount] = useState<string | number>(book.pageCount || '');
  const [description, setDescription] = useState(book.description || '');
  const [tagsList, setTagsList] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [extraCategoriesList, setExtraCategoriesList] = useState<string[]>([]);
  const [newCatInput, setNewCatInput] = useState('');
  const [rawMetadataEntries, setRawMetadataEntries] = useState<Array<{ key: string; value: string }>>([]);
  const [newMetaKey, setNewMetaKey] = useState('');
  const [newMetaVal, setNewMetaVal] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{ success: boolean; text: string } | null>(null);

  // Sync state whenever book changes
  useEffect(() => {
    setPublisher(book.publisher || '');
    setTranslator(book.translator || '');
    setOriginalTitle(book.originalTitle || '');
    setIsbn(book.isbn || '');
    setPageCount(book.pageCount || '');
    setDescription(book.description || '');

    const rawTags = book.tags || [];
    const cleanTags = rawTags
      .map((t) => t.replace(/&[a-z0-9#]+;/gi, '').replace(/;x[0-9a-f]+/gi, '').trim())
      .filter((t) => t.length > 1 && !t.includes(';'));
    setTagsList(cleanTags);

    setExtraCategoriesList(book.extraCategories || []);

    const rawMeta = book.rawMetadata || {};
    setRawMetadataEntries(
      Object.entries(rawMeta).map(([k, v]) => ({ key: k, value: String(v) }))
    );
  }, [book]);

  const handleCopyTags = () => {
    if (tagsList.length === 0) return;
    const text = tagsList.map((t) => `#${t.replace(/\s+/g, '_')}`).join(' ');
    navigator.clipboard.writeText(text);
    setCopiedTags(true);
    setTimeout(() => setCopiedTags(false), 2500);
  };

  const handleAddTag = () => {
    const trimmed = newTagInput.trim().replace(/^#+/, '');
    if (!trimmed) return;
    if (!tagsList.includes(trimmed)) {
      setTagsList([...tagsList, trimmed]);
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTagsList(tagsList.filter((t) => t !== tagToRemove));
  };

  const handleAddCategory = () => {
    const trimmed = newCatInput.trim();
    if (!trimmed) return;
    if (!extraCategoriesList.includes(trimmed)) {
      setExtraCategoriesList([...extraCategoriesList, trimmed]);
    }
    setNewCatInput('');
  };

  const handleRemoveCategory = (catToRemove: string) => {
    setExtraCategoriesList(extraCategoriesList.filter((c) => c !== catToRemove));
  };

  const handleAddMetaEntry = () => {
    const k = newMetaKey.trim();
    const v = newMetaVal.trim();
    if (!k) return;
    setRawMetadataEntries([...rawMetadataEntries, { key: k, value: v }]);
    setNewMetaKey('');
    setNewMetaVal('');
  };

  const handleRemoveMetaEntry = (indexToRemove: number) => {
    setRawMetadataEntries(rawMetadataEntries.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSaveMetadata = async () => {
    setIsSaving(true);
    setSaveFeedback(null);
    try {
      const rawMetaObj: Record<string, any> = {};
      for (const entry of rawMetadataEntries) {
        if (entry.key.trim()) {
          rawMetaObj[entry.key.trim()] = entry.value.trim();
        }
      }

      const updates: Partial<Book> = {
        publisher: publisher.trim() || undefined,
        translator: translator.trim() || undefined,
        originalTitle: originalTitle.trim() || undefined,
        isbn: isbn.trim() || undefined,
        pageCount: pageCount ? String(pageCount).trim() : undefined,
        tags: tagsList,
        extraCategories: extraCategoriesList,
        rawMetadata: Object.keys(rawMetaObj).length > 0 ? rawMetaObj : undefined,
        description: description.trim() || undefined
      };

      const res = await updateBook(book.id, updates);
      if (res.success) {
        setSaveFeedback({ success: true, text: 'اطلاعات و شناسنامه کتاب با موفقیت ذخیره و به‌روزرسانی شد ✓' });
        setTimeout(() => {
          setIsEditing(false);
          setSaveFeedback(null);
        }, 1200);
      } else {
        setSaveFeedback({ success: false, text: res.message || 'خطا در ذخیره اطلاعات.' });
      }
    } catch (err: any) {
      setSaveFeedback({ success: false, text: err.message || 'خطا در برقراری ارتباط.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-100 my-8 animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-indigo-900 via-sky-950 to-slate-900 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-400/40 text-sky-300 flex items-center justify-center shrink-0 shadow-inner">
              <Sparkles className="w-5 h-5 text-sky-300 animate-pulse" />
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-base sm:text-lg leading-tight text-white flex items-center gap-2 truncate">
                <span>شناسنامه و اطلاعات استخراج‌شده</span>
                {isEditing && (
                  <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-md">
                    حالت ویرایش
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5 truncate">
                کتاب: «{book.title}» اثر {book.author}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                isEditing
                  ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              }`}
              title={isEditing ? 'خروج از حالت ویرایش' : 'ویرایش اطلاعات و هشتگ‌ها'}
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isEditing ? 'پیش‌نمایش' : 'ویرایش اطلاعات'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {saveFeedback && (
          <div
            className={`p-3 text-xs font-bold flex items-center gap-2 border-b ${
              saveFeedback.success
                ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                : 'bg-rose-100 text-rose-950 border-rose-300'
            }`}
          >
            {saveFeedback.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{saveFeedback.text}</span>
          </div>
        )}

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

            <div className="grow space-y-2.5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-900 font-extrabold text-[11px] border border-indigo-200">
                  {book.category}
                </span>
                {!isEditing && isbn && (
                  <span className="font-mono bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 font-bold text-[11px] shadow-2xs">
                    شابک: {isbn}
                  </span>
                )}
              </div>

              <h4 className="text-base font-black text-slate-900">{book.title}</h4>
              <p className="font-bold text-slate-700 flex items-center gap-1.5">
                <span>نویسنده:</span>
                <span className="text-indigo-800 font-black">{book.author}</span>
              </p>

              {/* View / Edit Primary Specs */}
              {!isEditing ? (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80 text-[11px]">
                  {publisher && (
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>ناشر: <strong>{publisher}</strong></span>
                    </div>
                  )}
                  {translator && (
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>مترجم: <strong>{translator}</strong></span>
                    </div>
                  )}
                  {originalTitle && (
                    <div className="flex items-center gap-1.5 text-slate-700 col-span-2">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>عنوان اصلی: <strong className="font-mono text-slate-800">{originalTitle}</strong></span>
                    </div>
                  )}
                  {pageCount && (
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>تعداد صفحه: <strong>{pageCount}</strong></span>
                    </div>
                  )}
                </div>
              ) : (
                /* Edit Mode: Input Fields */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-200/80">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">ناشر:</label>
                    <input
                      type="text"
                      value={publisher}
                      onChange={(e) => setPublisher(e.target.value)}
                      placeholder="نام انتشارات..."
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:border-indigo-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">مترجم:</label>
                    <input
                      type="text"
                      value={translator}
                      onChange={(e) => setTranslator(e.target.value)}
                      placeholder="نام مترجم..."
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:border-indigo-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">عنوان اصلی (لاتین):</label>
                    <input
                      type="text"
                      value={originalTitle}
                      onChange={(e) => setOriginalTitle(e.target.value)}
                      placeholder="Original Title..."
                      dir="ltr"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:border-indigo-500 outline-hidden font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">شابک (ISBN):</label>
                    <input
                      type="text"
                      value={isbn}
                      onChange={(e) => setIsbn(e.target.value)}
                      placeholder="978600..."
                      dir="ltr"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:border-indigo-500 outline-hidden font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">تعداد صفحه:</label>
                    <input
                      type="text"
                      value={pageCount}
                      onChange={(e) => setPageCount(e.target.value)}
                      placeholder="مثلاً: 320"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:border-indigo-500 outline-hidden"
                    />
                  </div>
                </div>
              )}

              {book.sourceUrl && !isEditing && (
                <div className="pt-1">
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
                <span>هشتگ‌ها و موضوعات اختصاصی ({tagsList.length} مورد)</span>
              </h5>

              {!isEditing && tagsList.length > 0 && (
                <button
                  onClick={handleCopyTags}
                  className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200 transition text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedTags ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-sky-600" />}
                  <span>{copiedTags ? 'کپی شد' : 'کپی هشتگ‌ها'}</span>
                </button>
              )}
            </div>

            {/* Tags Badges */}
            {tagsList.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {tagsList.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-xl text-xs font-bold bg-sky-50 text-sky-900 border border-sky-200/90 shadow-2xs hover:bg-sky-100 transition flex items-center gap-1.5"
                  >
                    <span>#{tag.replace(/\s+/g, '_')}</span>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-rose-500 hover:text-rose-700 p-0.5 rounded-full hover:bg-rose-50 transition cursor-pointer"
                        title="حذف هشتگ"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">هشتگی برای این کتاب ثبت نشده است.</p>
            )}

            {/* Add New Tag Input in Edit Mode */}
            {isEditing && (
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="افزودن هشتگ جدید (مثلاً: رمان فانتزی)..."
                  className="flex-1 p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:border-sky-500 outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  disabled={!newTagInput.trim()}
                  className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>افزودن</span>
                </button>
              </div>
            )}

            {/* Sub-categories */}
            <div className="pt-2 border-t border-slate-100 text-xs space-y-2">
              <span className="text-slate-500 font-bold block">دسته‌بندی‌های فرعی ایران‌کتاب:</span>
              <div className="flex flex-wrap gap-1">
                {extraCategoriesList.map((cat, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold flex items-center gap-1"
                  >
                    <span>{cat}</span>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(cat)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </span>
                ))}
              </div>

              {isEditing && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newCatInput}
                    onChange={(e) => setNewCatInput(e.target.value)}
                    placeholder="افزودن دسته‌بندی فرعی جدید..."
                    className="flex-1 p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-medium outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={!newCatInput.trim()}
                    className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
                  >
                    افزودن
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Raw Specifications Grid */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h5 className="font-black text-xs text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>مشخصات فنی و چاپی ({rawMetadataEntries.length} فاکتور)</span>
            </h5>

            {rawMetadataEntries.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {rawMetadataEntries.map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 gap-2"
                  >
                    <span className="font-bold text-slate-500 text-[11px] truncate">{entry.key}:</span>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-black text-slate-900 dir-ltr text-end truncate">{entry.value}</span>
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMetaEntry(idx)}
                          className="text-rose-400 hover:text-rose-600 p-0.5 rounded transition"
                          title="حذف این فاکتور"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">مشخصات چاپی دیگری ثبت نشده است.</p>
            )}

            {isEditing && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 pt-2">
                <span className="text-[11px] font-bold text-slate-700 block">افزودن مشخصه فنی جدید:</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newMetaKey}
                    onChange={(e) => setNewMetaKey(e.target.value)}
                    placeholder="نام فاکتور (مثلاً: نوبت چاپ)"
                    className="p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                  />
                  <input
                    type="text"
                    value={newMetaVal}
                    onChange={(e) => setNewMetaVal(e.target.value)}
                    placeholder="مقدار (مثلاً: چاپ دوم)"
                    className="p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddMetaEntry}
                  disabled={!newMetaKey.trim()}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
                >
                  + افزودن فاکتور فنی
                </button>
              </div>
            )}
          </div>

          {/* Full Introduction / Description */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <h5 className="font-black text-xs text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Info className="w-4 h-4 text-emerald-600" />
              <span>متن معرفی و خلاصه داستان</span>
            </h5>
            {!isEditing ? (
              <p className="text-xs text-slate-700 leading-relaxed text-justify whitespace-pre-line bg-slate-50 p-3 rounded-xl border border-slate-100">
                {description || 'توضیحی ثبت نشده است.'}
              </p>
            ) : (
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="خلاصه کتاب و معرفی..."
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:border-emerald-500 outline-hidden"
              />
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {onReEnrich && (
              <button
                type="button"
                onClick={onReEnrich}
                disabled={isReEnriching || isSaving}
                className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                title="استعلام مجدد از ایران‌کتاب و جایگزینی با اطلاعات آنلاین"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isReEnriching ? 'animate-spin' : ''}`} />
                <span>{isReEnriching ? 'در حال استعلام مجدد...' : 'استعلام مجدد ایران‌کتاب'}</span>
              </button>
            )}

            {isEditing && (
              <button
                type="button"
                onClick={handleSaveMetadata}
                disabled={isSaving}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'در حال ذخیره...' : 'ذخیره تغییرات شناسنامه'}</span>
              </button>
            )}
          </div>

          <button
            type="button"
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

