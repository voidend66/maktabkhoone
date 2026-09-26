import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PERSIAN_MONTHS } from '../utils/jalaliDate';
import { Cake, Gift, Sparkles, X, CheckCircle2, Calendar } from 'lucide-react';

interface SetBirthdayModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const SetBirthdayModal: React.FC<SetBirthdayModalProps> = ({ onClose, onSuccess }) => {
  const { currentUser, updateUserBirthday } = useApp();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentUser?.birthMonth || 1);
  const [selectedDay, setSelectedDay] = useState<number>(currentUser?.birthDay || 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Months 1-6 have 31 days, months 7-11 have 30 days, month 12 has 29 (or 30 in leap year)
  const maxDays = selectedMonth <= 6 ? 31 : selectedMonth <= 11 ? 30 : 29;

  const handleSave = async () => {
    if (!currentUser) return;
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const day = Math.min(selectedDay, maxDays);
      const res = await updateUserBirthday(selectedMonth, day);
      if (res.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setErrorMessage(res.message || 'خطا در ثبت تاریخ تولد');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'خطا در برقراری ارتباط');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-amber-400/90 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl relative animate-in zoom-in-95 duration-200 space-y-4">
        {/* Close / Remind later X button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition cursor-pointer"
          title="بعداً یادآوری کن"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Cake Icon */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-400 text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/25 animate-bounce">
            <Cake className="w-8 h-8" />
          </div>

          <div className="inline-flex items-center gap-1.5 bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs px-3 py-1 rounded-full font-black">
            <Gift className="w-3.5 h-3.5" />
            <span>یک سورپرایز و جایزه ویژه در روز تولدت!</span>
          </div>

          <h3 className="text-base sm:text-lg font-black text-white">
            تاریخ تولدت رو ثبت کن 🎂🎈
          </h3>

          <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto font-medium">
            با ثبت تاریخ تولدت، در روز تولدت از طرف مکتب‌خانه مدرسه <strong className="text-amber-300">سهمیه امانت رایگان کتاب</strong> هدیه می‌گیری!
          </p>
        </div>

        {/* Month & Day Selectors */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {/* Month Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                ماه تولد شما:
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  const m = Number(e.target.value);
                  setSelectedMonth(m);
                  if (m > 6 && selectedDay > 30) {
                    setSelectedDay(30);
                  }
                  if (m === 12 && selectedDay > 29) {
                    setSelectedDay(29);
                  }
                }}
                className="w-full bg-slate-900 border-2 border-amber-400/60 focus:border-amber-400 text-white rounded-xl p-2.5 text-xs font-black outline-hidden transition cursor-pointer"
              >
                {PERSIAN_MONTHS.map((monthName, idx) => (
                  <option key={idx + 1} value={idx + 1} className="bg-slate-900 text-white">
                    {idx + 1} - {monthName}
                  </option>
                ))}
              </select>
            </div>

            {/* Day Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                روز ماه:
              </label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(Number(e.target.value))}
                className="w-full bg-slate-900 border-2 border-amber-400/60 focus:border-amber-400 text-white rounded-xl p-2.5 text-xs font-black outline-hidden transition cursor-pointer"
              >
                {Array.from({ length: maxDays }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d} className="bg-slate-900 text-white">
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Birthday Preview Badge */}
          <div className="flex items-center justify-between bg-amber-400/10 border border-amber-400/20 p-2.5 rounded-xl text-xs font-bold text-amber-200">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
              <span>تاریخ تولد انتخابی شما:</span>
            </span>
            <span className="font-black text-amber-300">
              {selectedDay} {PERSIAN_MONTHS[selectedMonth - 1]}
            </span>
          </div>

          {/* One-time Lock Warning Notice */}
          <div className="p-2.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-[11px] text-rose-200 text-right leading-relaxed font-medium">
            🔒 <strong>توجه مهم:</strong> تاریخ تولد تنها <u>یک‌بار</u> قابل ثبت است و پس از ثبت نهایی جهت جلوگیری از سوءاستفاده در دریافت هدایا، قفل خواهد شد. لطفاً در انتخاب ماه و روز دقت نمایید.
          </div>
        </div>

        {errorMessage && (
          <p className="text-xs text-rose-400 font-bold text-center bg-rose-500/10 p-2 rounded-xl border border-rose-500/30">
            {errorMessage}
          </p>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSave}
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 hover:from-amber-600 hover:to-orange-600 active:scale-95 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isSubmitting ? 'در حال ثبت...' : 'ثبت تاریخ تولد و فعال‌سازی جایزه 🎈'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 px-4 text-slate-400 hover:text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            بعداً یادآوری کن
          </button>
        </div>
      </div>
    </div>
  );
};
