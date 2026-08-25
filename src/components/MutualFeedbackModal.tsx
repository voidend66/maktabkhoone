import React, { useState } from 'react';
import { LendingRequest } from '../types';
import { X, Star, CheckCircle2, ShieldCheck, Heart, ThumbsUp, Sparkles } from 'lucide-react';

interface MutualFeedbackModalProps {
  request: LendingRequest | null;
  onClose: () => void;
  onSubmitFeedback: (
    requestId: string,
    feedback: { punctuality: number; condition: number; behavior: number; reliability: number; comment: string }
  ) => void;
}

export const MutualFeedbackModal: React.FC<MutualFeedbackModalProps> = ({
  request,
  onClose,
  onSubmitFeedback
}) => {
  const [punctualityScore, setPunctualityScore] = useState(5);
  const [conditionScore, setConditionScore] = useState(5);
  const [behaviorScore, setBehaviorScore] = useState(5);
  const [reliabilityScore, setReliabilityScore] = useState(5);
  const [comment, setComment] = useState('');

  if (!request) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitFeedback(request.id, {
      punctuality: punctualityScore,
      condition: conditionScore,
      behavior: behaviorScore,
      reliability: reliabilityScore,
      comment
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-300" />
            <div>
              <h3 className="font-bold text-base">ثبت بازخورد و ارزیابی امانت‌داری</h3>
              <p className="text-xs text-indigo-200">کتاب: «{request.bookTitle}»</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Survey Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 leading-relaxed flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              <strong>ثبت عودت نیم‌روزی (۱۲ ساعته):</strong> پس از پس دادن کتاب در زنگ تفریح، این فرم توسط والدین یا دانش‌آموز در خانه تکمیل می‌شود.
            </span>
          </div>

          <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-950 leading-relaxed flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              ارزیابی شما مدال‌های افتخار (بهترین در پس دادن به موقع، تمیز نگهداشتن، اخلاق و خوش‌قولی) را برای همکلاسی شما فعال می‌سازد.
            </span>
          </div>

          {/* Criteria 1: Punctuality */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                ⏰ ۱. تحویل و پس دادن به موقع:
              </label>
              <span className="text-xs font-extrabold text-indigo-700">
                {punctualityScore} از ۵
              </span>
            </div>
            <div className="flex items-center justify-end gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setPunctualityScore(star)}
                  className="p-1 hover:scale-110 transition"
                >
                  <Star
                    className={`w-5 h-5 ${
                      star <= punctualityScore ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Criteria 2: Cleanliness & Condition */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                ✨ ۲. تمیز و سالم نگه داشتن کتاب:
              </label>
              <span className="text-xs font-extrabold text-indigo-700">
                {conditionScore} از ۵
              </span>
            </div>
            <div className="flex items-center justify-end gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setConditionScore(star)}
                  className="p-1 hover:scale-110 transition"
                >
                  <Star
                    className={`w-5 h-5 ${
                      star <= conditionScore ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Criteria 3: Behavior & Courtesy */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                😊 ۳. رفتار، ادب و برخورد صمیمی:
              </label>
              <span className="text-xs font-extrabold text-indigo-700">
                {behaviorScore} از ۵
              </span>
            </div>
            <div className="flex items-center justify-end gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setBehaviorScore(star)}
                  className="p-1 hover:scale-110 transition"
                >
                  <Star
                    className={`w-5 h-5 ${
                      star <= behaviorScore ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Criteria 4: Reliability & Trustworthiness */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                🤝 ۴. خوش‌قولی و قابلیت اعتماد:
              </label>
              <span className="text-xs font-extrabold text-indigo-700">
                {reliabilityScore} از ۵
              </span>
            </div>
            <div className="flex items-center justify-end gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setReliabilityScore(star)}
                  className="p-1 hover:scale-110 transition"
                >
                  <Star
                    className={`w-5 h-5 ${
                      star <= reliabilityScore ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Optional Comment */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              پیام تشکر یا یادداشت صمیمانه:
            </label>
            <textarea
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="مثلا: بسیار خوش‌برخورد و تمیز بودن. کتاب رو خیلی خوب نگه داشتن!"
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-100 transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>ثبت ارزیابی و تکمیل امانت</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
