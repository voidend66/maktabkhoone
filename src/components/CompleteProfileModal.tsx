import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getAvailableAvatars } from '../utils/avatars';
import {
  User,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Smile
} from 'lucide-react';
import { MaktabKhanehLogo } from './MaktabKhanehBranding';
import { api } from '../services/api';

interface CompleteProfileModalProps {
  onClose: () => void;
  onComplete: () => void;
}

export const CompleteProfileModal: React.FC<CompleteProfileModalProps> = ({
  onClose,
  onComplete
}) => {
  const { currentUser, updateProfile, schoolClasses, systemConfig, customAvatars } = useApp();
  const availableAvatars = getAvailableAvatars(currentUser?.role === 'admin', customAvatars);

  const [name, setName] = useState(
    currentUser?.name && !currentUser.name.startsWith('کاربر بله') ? currentUser.name : ''
  );
  const [className, setClassName] = useState(
    currentUser?.className || (schoolClasses.length > 0 ? schoolClasses[0].name : 'کلاس ۱/۱')
  );
  const [avatar, setAvatar] = useState(currentUser?.avatar || availableAvatars[0]?.url || '');

  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('لطفاً نام و نام خانوادگی خود را وارد کنید.');
      return;
    }

    if (!className) {
      setErrorMessage('لطفاً پایه تحصیلی خود را انتخاب کنید.');
      return;
    }

    setIsLoading(true);

    try {
      // Update Profile (Name, Class, Avatar)
      const res = await updateProfile({
        name: name.trim(),
        className,
        avatar
      });

      if (!res.success) {
        const msg = res.message || 'خطا در به‌روزرسانی پروفایل';
        setErrorMessage(msg);
        api.reportError('خطا در تکمیلی پروفایل', msg, 'error', currentUser || undefined);
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      onComplete();
    } catch (err: any) {
      console.error('Error completing profile:', err);
      const msg = err.message || 'خطا در ذخیره اطلاعات، لطفاً مجدداً تلاش کنید.';
      setErrorMessage(msg);
      api.reportError('استثنا در تکمیل پروفایل کاربر', err.stack || err.message, 'error', currentUser || undefined);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 sm:p-8 space-y-6 dir-rtl text-right my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <MaktabKhanehLogo size="sm" />
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                تکمیل پروفایل عضـویت 🎒
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                لطفاً نام و آواتار کاربری خود را برای حضور در مکتب‌خانه مشخص کنید.
              </p>
            </div>
          </div>
        </div>

        {/* Notice */}
        <div className="bg-gradient-to-r from-cyan-50 to-teal-50 border border-cyan-200/80 p-3.5 rounded-2xl flex items-start gap-3 text-xs text-cyan-900">
          <Sparkles className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">خوش‌آمدید به کتابخانه آنلاین مکتب‌خانه!</span>
            <p className="text-slate-600">
              ثبت‌نام و عضویت در مکتب‌خانه کاملاً رایگان است. کافی است نام، آواتار و پایه تحصیلی خود را مشخص نمایید.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  نام و نام خانوادگی <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: علی محمدی"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  کلاس و پایه تحصیلی <span className="text-rose-500">*</span>
                </label>
                <select
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition cursor-pointer shadow-2xs hover:border-cyan-400"
                >
                  {schoolClasses.map((c) => (
                    <option key={c.id} value={c.name} className="py-2 text-slate-900 font-semibold">
                      {c.name} ({c.grade})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Avatar Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <Smile className="w-4 h-4 text-amber-500" />
                <span>انتخاب آواتار حساب کاربری:</span>
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1 bg-slate-50 rounded-2xl border border-slate-200">
                {availableAvatars.map((av) => (
                  <div
                    key={av.id}
                    onClick={() => setAvatar(av.url)}
                    title={av.name || av.description}
                    className={`relative rounded-2xl p-1 cursor-pointer border-2 transition flex flex-col items-center justify-center ${av.bg || 'bg-white'} ${
                      avatar === av.url ? 'border-cyan-600 scale-105 shadow-md ring-2 ring-cyan-400' : 'border-slate-200 opacity-80 hover:opacity-100'
                    }`}
                  >
                    {av.isCustom && (
                      <span className="absolute -top-1 -right-1 px-1 py-0.2 bg-amber-500 text-white text-[8px] font-bold rounded-full">
                        جدید
                      </span>
                    )}
                    <img
                      src={av.url}
                      alt={av.name || av.description}
                      className="w-10 h-10 object-cover rounded-xl"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-black text-xs rounded-2xl shadow-lg shadow-cyan-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isLoading ? 'در حال ثبت اطلاعات...' : 'تکمیل عضویت و ورود به مکتب‌خانه'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
