import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, LogIn, Phone, Lock, AlertCircle } from 'lucide-react';
import { MaktabKhanehLogo } from './MaktabKhanehBranding';

interface LoginModalProps {
  onClose: () => void;
  onOpenRegister: () => void;
  onOpenForgotPassword: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  onClose,
  onOpenRegister,
  onOpenForgotPassword
}) => {
  const { loginUser } = useApp();

  const [phone, setPhone] = useState('09123456789'); // Demo default
  const [password, setPassword] = useState('123'); // Demo default
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !password.trim()) {
      setErrorMessage('لطفاً شماره تلفن همراه و رمز عبور را وارد کنید.');
      return;
    }

    const res = loginUser(phone.trim(), password.trim());
    if (res.success) {
      onClose();
    } else {
      setErrorMessage(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border-2 border-cyan-400 my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 via-sky-700 to-indigo-950 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs border border-white/20">
              <LogIn className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-black text-lg text-white">ورود به مکتب خونه 🎒</h3>
              <p className="text-xs text-cyan-100 font-bold">سامانه امانت کتاب اعضا</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Branding Subhead */}
        <div className="p-4 bg-cyan-50/60 border-b border-cyan-100 flex items-center justify-center">
          <MaktabKhanehLogo size="sm" showSlogan={true} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-black text-slate-700 block mb-1">
              شماره تلفن همراه *:
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-cyan-600 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09123456789"
                className="w-full text-xs pr-9 pl-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 text-left font-semibold text-slate-800"
                dir="ltr"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-black text-slate-700 block">
                رمز عبور *:
              </label>
              <button
                type="button"
                onClick={onOpenForgotPassword}
                className="text-[11px] text-orange-600 font-black hover:underline"
              >
                رمز عبور را فراموش کرده‌اید؟
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-cyan-600 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs pr-9 pl-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 text-left font-semibold"
                dir="ltr"
                required
              />
            </div>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-950 font-medium">
            💡 <strong>اکانت‌های آزمایشی:</strong> شماره 09123456789 و رمز 123 (کاربر: حسن) یا 09121112233 و رمز admin (مدیر سایت مکتب خونه).
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 text-white font-black text-xs rounded-xl shadow-md shadow-cyan-600/20 transition flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4 text-amber-300" />
              <span>ورود به سامانه مکتب خونه</span>
            </button>
          </div>

          <div className="pt-3 border-t border-slate-100 text-center">
            <span className="text-xs text-slate-500">حساب کاربری ندارید؟ </span>
            <button
              type="button"
              onClick={onOpenRegister}
              className="text-xs text-orange-600 font-black hover:underline"
            >
              ثبت‌نام عضو جدید 🎒
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

