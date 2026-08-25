import React, { useState } from 'react';
import { X, KeyRound, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Lock } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ForgotPasswordModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onOpenLogin: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen = true,
  onClose,
  onOpenLogin
}) => {
  const { resetPasswordWithSMS, users } = useApp();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  // Step 1: Validate Name & Phone match an existing account
  const handleCheckAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !phone.trim()) {
      setError('لطفاً نام و شماره تلفن همراه خود را وارد کنید.');
      return;
    }
    if (phone.length < 10) {
      setError('لطفاً یک شماره تلفن معتبر ۱۰ یا ۱۱ رقمی وارد کنید.');
      return;
    }

    const found = users.find(u => u.phone === phone.trim() && u.name.trim() === name.trim());
    if (!found) {
      setError('حساب کاربری با این نام و شماره تلفن یافت نشد.');
      return;
    }

    // Proceed to Set New Password directly
    setStep(2);
  };

  // Step 2: Set New Password
  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPassword || newPassword.length < 3) {
      setError('رمز عبور جدید باید حداقل ۳ کاراکتر باشد.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('رمز عبور جدید و تکرار آن با یکدیگر مطابقت ندارند!');
      return;
    }

    const res = resetPasswordWithSMS(phone, name, newPassword);
    if (!res.success) {
      setError(res.message);
      return;
    }

    setSuccessMsg(res.message);
    setStep(3);
  };

  const handleCloseAll = () => {
    setStep(1);
    setName('');
    setPhone('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccessMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-6 h-6 text-indigo-300" />
            <div>
              <h3 className="font-bold text-base">بازیابی رمز عبور</h3>
              <p className="text-xs text-indigo-200">تایید شماره تلفن و تنظیم رمز جدید</p>
            </div>
          </div>
          <button
            onClick={handleCloseAll}
            className="p-1.5 hover:bg-white/10 rounded-xl transition text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="bg-indigo-50 border-b border-indigo-100 px-6 py-2.5 flex items-center justify-between text-xs font-bold text-indigo-700">
          <span className={step === 1 ? 'text-indigo-900 font-extrabold underline' : ''}>۱. تایید اطلاعات</span>
          <span>←</span>
          <span className={step === 2 ? 'text-indigo-900 font-extrabold underline' : ''}>۲. تنظیم رمز جدید</span>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs text-rose-800 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: Info */}
          {step === 1 && (
            <form onSubmit={handleCheckAccount} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                لطفا نام کامل و شماره تلفن همراه خود را که در مکتب خونه ثبت کرده‌اید وارد کنید تا حساب کاربری شما شناسی گردد.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  نام و نام خانوادگی دانش‌آموز / کاربر
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: حسن محمدی"
                  className="w-full text-xs px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  شماره تلفن همراه
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09123456789"
                  className="w-full text-xs px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-left font-semibold"
                  dir="ltr"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-100 transition flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>تایید حساب و مرحله بعد</span>
              </button>
            </form>
          )}

          {/* Step 2: New Password */}
          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 font-medium">
                ✅ حساب کاربری شناسی شد. اکنون رمز عبور جدید خود را وارد کنید.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رمز عبور جدید
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs pr-9 pl-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-left font-semibold"
                    dir="ltr"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  تکرار رمز عبور جدید
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs pr-9 pl-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-left font-semibold"
                    dir="ltr"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  بازگشت
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-100 transition flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ذخیره رمز عبور جدید</span>
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="font-bold text-slate-900 text-base">رمز عبور به‌روزرسانی شد!</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{successMsg}</p>
              <button
                type="button"
                onClick={() => {
                  handleCloseAll();
                  onOpenLogin();
                }}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-100 transition flex items-center justify-center gap-1.5"
              >
                <span>ورود به حساب کاربری</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
            </div>
          )}

          {/* Footer Back to Login */}
          {step !== 3 && (
            <div className="mt-5 pt-4 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => {
                  handleCloseAll();
                  onOpenLogin();
                }}
                className="text-xs text-indigo-700 font-bold hover:underline"
              >
                بازگشت به صفحه ورود
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
