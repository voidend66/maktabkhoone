import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Phone,
  KeyRound,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  Bot,
  Send,
  Sparkles,
  Smartphone,
  ArrowRight,
  MessageSquare,
  HelpCircle
} from 'lucide-react';
import { MaktabKhanehLogo } from './MaktabKhanehBranding';
import { APP_VERSION } from '../version';

interface BaleOtpModalProps {
  onClose: () => void;
  onSuccessLogin?: (phone: string) => void;
  initialPhone?: string;
}

export const BaleOtpModal: React.FC<BaleOtpModalProps> = ({
  onClose,
  onSuccessLogin,
  initialPhone = '09123456789'
}) => {
  const { loginWithOtpPhone } = useApp();

  // وضعیت‌های مرحله فرم (مرحله ۱: دریافت شماره، مرحله ۲: دریافت کد ۵ رقمی)
  const [step, setStep] = useState<1 | 2>(1);

  // فیلدهای ورودی
  const [phone, setPhone] = useState(initialPhone);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '']);
  const [sessionId, setSessionId] = useState<string>('');
  const [baleLink, setBaleLink] = useState<string>('');
  const [baleWebLink, setBaleWebLink] = useState<string>('');
  const [botUsername, setBotUsername] = useState<string>('Maktabkunebot');

  // وضعیت‌های بارگذاری و پیام‌ها
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [sessionStatus, setSessionStatus] = useState<string>('PENDING_START');

  // تایمر معکوس ۵ دقیقه (۳۰۰ ثانیه)
  const [timeLeft, setTimeLeft] = useState<number>(300);

  // رفرنس فیلدهای ورودی ۵ رقمی OTP
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // --------------------------------------------------------------------------
  // مدیریت تایمر معکوس
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (step !== 2 || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step, timeLeft]);

  // --------------------------------------------------------------------------
  // پولینگ وضعیت زنده نشست در مرحله ۲ (برای تشخیص لحظه‌ای ارسال کد توسط بات)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (step !== 2 || !sessionId || sessionStatus === 'VERIFIED') return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/otp-status/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setSessionStatus(data.status);
            if (data.status === 'CODE_SENT' && !successMessage) {
              setSuccessMessage('کد تایید ۵ رقمی در پیام‌رسان بله برای شما ارسال شد!');
            } else if (data.status === 'PHONE_MISMATCH') {
              setErrorMessage('شماره حساب بله شما با شماره وارد شده مطابقت ندارد.');
            }
          }
        }
      } catch (err) {
        // نادیده گرفتن خطاهای موقت شبکه در پولینگ
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [step, sessionId, sessionStatus, successMessage]);

  // --------------------------------------------------------------------------
  // مرحله ۱: ارسال شماره موبایل به سرور (POST /api/request-otp)
  // --------------------------------------------------------------------------
  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      setErrorMessage('لطفاً شماره تلفن همراه را وارد کنید.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/request-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ phone: cleanPhone })
      });

      let data: any = {};
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { success: false, message: text || `خطای سرور (${response.status})` };
      }

      if (response.ok && data.success) {
        setSessionId(data.session_id);
        setBaleLink(data.bale_link);
        setBaleWebLink(data.bale_web_link || `https://ble.ir/${data.bot_username || 'Maktabkunebot'}?start=${data.session_id}`);
        setBotUsername(data.bot_username || 'Maktabkunebot');
        setTimeLeft(data.expires_in || 300);
        setStep(2);
        setOtpDigits(['', '', '', '', '']);
        setSessionStatus('PENDING_START');
      } else {
        setErrorMessage(data.message || 'خطا در ثبت درخواست کد تایید.');
      }
    } catch (err: any) {
      console.error('Request OTP Error:', err);
      setErrorMessage(err.message || 'امکان برقراری ارتباط با سرور وجود ندارد.');
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // مرحله ۲: تایید کد ۵ رقمی وارد شده (POST /api/verify-otp)
  // --------------------------------------------------------------------------
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 5) {
      setErrorMessage('لطفاً کد تایید ۵ رقمی دریافتی از بله را کامل وارد کنید.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          user_otp: fullOtp
        })
      });

      let data: any = {};
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { success: false, message: text || `خطای سرور (${response.status})` };
      }

      if (response.ok && data.success) {
        setSuccessMessage('✅ احراز هویت با موفقیت انجام شد!');
        setSessionStatus('VERIFIED');

        // ورود خودکار در اپلیکیشن
        setTimeout(() => {
          loginWithOtpPhone(phone);
          if (onSuccessLogin) {
            onSuccessLogin(phone);
          }
          onClose();
        }, 1200);
      } else {
        setErrorMessage(data.message || 'کد تایید وارد شده نادرست یا منقضی است.');
      }
    } catch (err: any) {
      console.error('Verify OTP Error:', err);
      setErrorMessage(err.message || 'خطا در بررسی کد تایید.');
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // مدیریت ورودی خانه‌های ۵ رقمی OTP
  // --------------------------------------------------------------------------
  const handleOtpChange = (index: number, value: string) => {
    // فقط عدد مجاز است
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length > 1) {
      // حالت Paste کردن کل کد ۵ رقمی
      const pasted = cleaned.slice(0, 5).split('');
      const newDigits = [...otpDigits];
      pasted.forEach((char, i) => {
        if (i < 5) newDigits[i] = char;
      });
      setOtpDigits(newDigits);
      const nextFocus = Math.min(pasted.length, 4);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = cleaned;
    setOtpDigits(newDigits);

    // حرکت فوکوس به خانه بعدی
    if (cleaned && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // فرمت زمان دقیقه:ثانیه
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div
      id="bale-otp-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        id="bale-otp-modal-container"
        className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border-2 border-emerald-500 my-6 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header با نشان تجاری پیام‌رسان بله و مکتب‌خونه */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center shadow-lg p-1.5 shrink-0">
              {/* آیکون بات بله با رنگ سبز اختصاصی */}
              <div className="w-full h-full bg-emerald-500 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-inner">
                <Bot className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-white">ورود و ثبت‌نام در مکتب‌خونه 🎒</h3>
                <span className="text-[10px] bg-emerald-400 text-emerald-950 px-2 py-0.5 rounded-full font-black">
                  با پیام‌رسان بله
                </span>
                <span className="text-[9px] bg-slate-800/80 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                  v{APP_VERSION}
                </span>
              </div>
              <p className="text-xs text-emerald-100 font-medium">
                تایید هویت سریع و امن با بات رسمی <span className="font-mono text-emerald-200">@{botUsername}</span>
              </p>
            </div>
          </div>

          <button
            id="close-bale-modal-btn"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
            title="بستن پنجره"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Branding Slogan */}
        <div className="bg-emerald-50/70 px-5 py-3 border-b border-emerald-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-900 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>احراز هویت بدون نیاز به رمز عبور و پیامک</span>
          </div>
          <span className="text-[11px] font-bold text-slate-500">
            {step === 1 ? 'مرحله ۱ از ۲: شماره همراه' : 'مرحله ۲ از ۲: تایید کد بله'}
          </span>
        </div>

        {/* بدنه مدال */}
        <div className="p-6 space-y-5">
          {/* نمایش خطا */}
          {errorMessage && (
            <div
              id="bale-otp-error-box"
              className="p-3.5 bg-rose-50 text-rose-800 rounded-2xl text-xs font-bold border border-rose-200 flex items-center gap-2.5 animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* نمایش پیام موفقیت */}
          {successMessage && (
            <div
              id="bale-otp-success-box"
              className="p-3.5 bg-emerald-50 text-emerald-900 rounded-2xl text-xs font-bold border border-emerald-300 flex items-center gap-2.5 animate-in fade-in"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ================================================================ */}
          {/* مرحله ۱: فرم دریافت شماره تلفن همراه */}
          {/* ================================================================ */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 leading-relaxed space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>راهنمای ورود و ثبت‌نام:</span>
                </div>
                <p>
                  برای ورود به حساب کاربری یا ثبت‌نام جدید، شماره همراه خود را وارد کنید. کد تایید یکبار مصرف از طریق بات مکتب‌خونه در پیام‌رسان بله برای شما ارسال می‌شود.
                </p>
              </div>

              <div>
                <label className="text-xs font-black text-slate-800 block mb-1.5">
                  شماره تلفن همراه شما *:
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-emerald-600 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="bale-phone-input"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="مثال: 09123456789"
                    className="w-full text-sm pr-10 pl-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-left font-mono font-bold text-slate-900"
                    dir="ltr"
                    required
                    autoFocus
                  />
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  شماره وارد شده باید با شماره اکانت شما در پیام‌رسان بله یکسان باشد.
                </span>
              </div>

              <div className="pt-2">
                <button
                  id="request-bale-otp-btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <span>در حال ارتباط با بات بله...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>ارسال کد تایید به بله و ادامه</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs text-slate-500 hover:text-slate-800 font-bold"
                >
                  انصراف و بستن
                </button>
              </div>
            </form>
          )}

          {/* ================================================================ */}
          {/* مرحله ۲: دکمه ورود به بله و فرم ورود کد ۵ رقمی */}
          {/* ================================================================ */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {/* بخش باز کردن مستقیم بات در بله */}
              <div className="p-4 bg-emerald-50 rounded-2xl border-2 border-emerald-200 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    ارسال شماره به بات <span className="font-mono text-emerald-700">@{botUsername}</span>:
                  </span>
                  <span className="text-[11px] text-slate-600 font-mono bg-white px-2 py-0.5 rounded-lg border border-emerald-200">
                    شماره: {phone}
                  </span>
                </div>

                <p className="text-slate-700 text-[11px] leading-relaxed">
                  ۱. روی دکمه زیر کلیک کنید تا صفحه بات در پیام‌رسان بله باز شود.<br />
                  ۲. دکمه <strong>«ارسال شماره همراه من»</strong> را لمس کنید تا کد ۵ رقمی برایتان ارسال شود.<br />
                  ۳. کد ارسال‌شده را در کادرهای زیر وارد فرمایید.
                </p>

                {/* دکمه‌های باز کردن بات بله */}
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <a
                    id="open-bale-app-btn"
                    href={baleLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20 transition cursor-pointer text-center"
                  >
                    <ExternalLink className="w-4 h-4 text-white" />
                    <span>ورود به بات بله برای دریافت کد 📲</span>
                  </a>

                  <a
                    id="open-bale-web-btn"
                    href={baleWebLink}
                    target="_blank"
                    rel="noreferrer"
                    className="py-3 px-3 bg-white hover:bg-slate-100 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition text-center"
                    title="باز کردن در نسخه وب بله"
                  >
                    <span>نسخه وب بله</span>
                  </a>
                </div>

                {/* نشانگر وضعیت زنده */}
                <div className="flex items-center justify-between text-[11px] pt-1 text-slate-600 border-t border-emerald-200/60">
                  <span>وضعیت ارتباط با بله:</span>
                  {sessionStatus === 'PENDING_START' && (
                    <span className="text-amber-700 font-bold flex items-center gap-1 animate-pulse">
                      ⏳ در انتظار ورود شما به بات...
                    </span>
                  )}
                  {sessionStatus === 'STARTED' && (
                    <span className="text-blue-700 font-bold flex items-center gap-1 animate-pulse">
                      📲 منتظر ارسال شماره در بله...
                    </span>
                  )}
                  {sessionStatus === 'CODE_SENT' && (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      ✅ کد ارسال شد! کادر زیر را پر کنید.
                    </span>
                  )}
                  {sessionStatus === 'PHONE_MISMATCH' && (
                    <span className="text-rose-700 font-bold flex items-center gap-1">
                      ❌ شماره حساب بله مطابقت نداشت!
                    </span>
                  )}
                </div>
              </div>

              {/* کادر ورود ۵ رقمی کد تایید */}
              <div>
                <label className="text-xs font-black text-slate-800 block text-center mb-2">
                  کد تایید ۵ رقمی دریافتی از بله را وارد کنید:
                </label>

                <div className="flex items-center justify-center gap-2 sm:gap-3" dir="ltr">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      id={`otp-digit-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-black font-mono bg-slate-50 border-2 border-slate-300 focus:border-emerald-500 focus:bg-emerald-50/50 rounded-2xl outline-none shadow-xs transition text-slate-900"
                    />
                  ))}
                </div>
              </div>

              {/* تایمر معکوس و ارسال مجدد */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <div className="flex items-center gap-1.5 font-mono">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>زمان باقیمانده:</span>
                  <span className={`font-bold ${timeLeft < 30 ? 'text-rose-600 animate-pulse' : 'text-slate-800'}`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>

                {timeLeft === 0 ? (
                  <button
                    type="button"
                    onClick={() => handleRequestOtp()}
                    className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 text-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    ارسال مجدد کد
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-slate-500 hover:text-slate-700 text-[11px] font-bold"
                  >
                    ویرایش شماره ({phone})
                  </button>
                )}
              </div>

              {/* دکمه تایید نهایی */}
              <div className="pt-2">
                <button
                  id="submit-verify-otp-btn"
                  type="submit"
                  disabled={isLoading || otpDigits.join('').length !== 5}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
                >
                  {isLoading ? (
                    <span>در حال بررسی کد...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>تایید کد و ورود به حساب کاربری</span>
                    </>
                  )}
                </button>
              </div>

              {/* بازگشت به مرحله قبل */}
              <div className="text-center pt-2 flex items-center justify-center gap-4 text-xs">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>تغییر شماره تلفن</span>
                </button>
              </div>
            </form>
          )}

          {/* Footer Info Box */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Bot className="w-3.5 h-3.5 text-emerald-600" />
              <span>بات رسمی:</span>
              <strong className="text-slate-800 font-mono">@{botUsername}</strong>
            </span>
            <span className="text-emerald-700 font-bold">بدون هزینه پیامک</span>
          </div>
        </div>
      </div>
    </div>
  );
};
