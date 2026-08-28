import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LendingRequest } from '../types';
import { MutualFeedbackModal } from './MutualFeedbackModal';
import { MaktabKhanehLogo } from './MaktabKhanehBranding';
import { api } from '../services/api';
import {
  ArrowLeftRight,
  Inbox,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  Calendar,
  Phone,
  User,
  ShieldCheck,
  AlertCircle,
  Sunrise,
  Sun,
  Home,
  CreditCard,
  AlertTriangle,
  FileCheck,
  Upload,
  Loader2,
  Star
} from 'lucide-react';

export const LendingRequests: React.FC = () => {
  const {
    currentUser,
    requests,
    acceptLoanRequest,
    rejectLoanRequest,
    confirmHandover,
    completeReturnAndSubmitFeedback,
    reportDamageAndSuspendUser,
    bankCardInfo,
    submitPaymentProof
  } = useApp();

  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [selectedRequestForFeedback, setSelectedRequestForFeedback] = useState<LendingRequest | null>(null);

  // Accept modal state
  const [acceptingReqId, setAcceptingReqId] = useState<string | null>(null);
  const [pickupLocation, setPickupLocation] = useState('جلوی دفتر پرورشی مدرسه');
  const [pickupTime, setPickupTime] = useState('زنگ تفریح دوم (ساعت ۱۰:۱۵)');
  const [pickupShift, setPickupShift] = useState<'morning' | 'afternoon' | 'evening_home'>('morning');

  // Damage reporting state
  const [damageReportingReq, setDamageReportingReq] = useState<LendingRequest | null>(null);
  const [damageReason, setDamageReason] = useState('پارگی صفحات و کثیف شدن جلد کتاب');
  const [damagePhotoUrl, setDamagePhotoUrl] = useState('');
  const [damagePhotoPreview, setDamagePhotoPreview] = useState('');
  const [isUploadingDamagePhoto, setIsUploadingDamagePhoto] = useState(false);
  const [damagePhotoError, setDamagePhotoError] = useState('');
  const [feedbackSuccessToast, setFeedbackSuccessToast] = useState<string | null>(null);

  // Card-to-Card payment proof state
  const [submittingProofReqId, setSubmittingProofReqId] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState('');
  const [paymentDate, setPaymentDate] = useState(
    new Date().toLocaleDateString('fa-IR') + ' - ساعت ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
  );
  const [receiptImage, setReceiptImage] = useState('');
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState('');
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [receiptUploadError, setReceiptUploadError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type) && !file.type.startsWith('image/')) {
      setReceiptUploadError('فقط فرمت‌های تصویری معتبر (JPG, JPEG, PNG, WEBP) مجاز هستند.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setReceiptUploadError('حجم فایل فیش باید کمتر از ۱۰ مگابایت باشد.');
      return;
    }

    // Instant local preview
    const localUrl = URL.createObjectURL(file);
    setReceiptPreviewUrl(localUrl);
    setIsUploadingReceipt(true);
    setReceiptUploadError('');

    try {
      const res = await api.uploadImage(file);
      if (res.success && res.fileUrl) {
        setReceiptImage(res.fileUrl);
      } else {
        setReceiptUploadError(res.message || 'خطا در بارگذاری فیش');
        setReceiptPreviewUrl('');
      }
    } catch (err: any) {
      setReceiptUploadError(err.message || 'خطا در ارتباط با سرور آپلود');
      setReceiptPreviewUrl('');
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border-2 border-cyan-200 max-w-lg mx-auto my-12 space-y-4 shadow-xl">
        <ArrowLeftRight className="w-12 h-12 text-cyan-500 mx-auto" />
        <h3 className="font-black text-slate-800 text-lg">لطفاً وارد حساب دانش‌آموز شوید</h3>
        <p className="text-xs text-slate-500">
          برای مشاهده و پاسخ به درخواست‌های امانت کتاب مکتب‌خانه، ابتدا وارد حساب کاربری خود شوید.
        </p>
      </div>
    );
  }

  const incomingRequests = requests.filter((r) => r.ownerId === currentUser.id);
  const outgoingRequests = requests.filter((r) => r.borrowerId === currentUser.id);

  const handleAcceptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptingReqId) return;
    acceptLoanRequest(acceptingReqId, pickupLocation, pickupTime, pickupShift);
    setAcceptingReqId(null);
  };

  const applyPresetTime = (location: string, time: string, shift: 'morning' | 'afternoon' | 'evening_home') => {
    setPickupLocation(location);
    setPickupTime(time);
    setPickupShift(shift);
  };

  const handleConfirmReportDamage = () => {
    if (!damageReportingReq) return;
    reportDamageAndSuspendUser(
      damageReportingReq.id,
      damageReportingReq.borrowerId,
      damageReason,
      damagePhotoUrl || undefined
    );
    setFeedbackSuccessToast('گزارش آسیب دیدن کتاب با موفقیت ثبت شد و برای مدیر ارسال گردید.');
    setTimeout(() => setFeedbackSuccessToast(null), 5000);
    setDamageReportingReq(null);
    setDamagePhotoUrl('');
    setDamagePhotoPreview('');
  };

  const handleDamagePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type) && !file.type.startsWith('image/')) {
      setDamagePhotoError('فقط فرمت‌های تصویری معتبر (JPG, PNG, WEBP) مجاز هستند.');
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setDamagePhotoPreview(localUrl);
    setIsUploadingDamagePhoto(true);
    setDamagePhotoError('');

    try {
      const res = await api.uploadImage(file);
      if (res.success && res.fileUrl) {
        setDamagePhotoUrl(res.fileUrl);
      } else {
        setDamagePhotoError(res.message || 'خطا در آپلود عکس');
        setDamagePhotoPreview('');
      }
    } catch (err: any) {
      setDamagePhotoError(err.message || 'خطا در اتصال به سرور آپلود');
      setDamagePhotoPreview('');
    } finally {
      setIsUploadingDamagePhoto(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Global Feedback Toast */}
      {feedbackSuccessToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3.5 rounded-2xl shadow-xl border-2 border-emerald-400 text-sm font-black flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-100" />
          <span>{feedbackSuccessToast}</span>
        </div>
      )}

      {/* Title Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white p-6 rounded-3xl border-2 border-cyan-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-cyan-500 to-sky-600 text-white rounded-2xl shadow-sm">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <span>مدیریت درخواست‌ها و امانت‌های کتاب</span>
            </h2>
            <p className="text-xs text-slate-500 font-bold mt-0.5">
              مکتب‌خانه • پروتکل امانت با مهلت ۱۲ ساعته (ویژه عدم دسترسی به گوشی در مدرسه) + پرداخت ۱۰,۰۰۰ تومانی
            </p>
          </div>
        </div>

        {/* Tab Switchers */}
        <div className="flex bg-cyan-50/70 p-1.5 rounded-2xl border border-cyan-200">
          <button
            onClick={() => setActiveTab('incoming')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
              activeTab === 'incoming'
                ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-md shadow-cyan-600/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>درخواست‌های دریافتی برای کتاب‌های من ({incomingRequests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('outgoing')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
              activeTab === 'outgoing'
                ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-md shadow-cyan-600/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>درخواست‌های امانت من از دیگران ({outgoingRequests.length})</span>
          </button>
        </div>
      </div>

      {/* 12-Hour Grace Period & 3-Hour Payment Banner */}
      <div className="bg-gradient-to-r from-cyan-900 via-sky-950 to-indigo-950 text-white p-6 rounded-3xl shadow-lg border-2 border-cyan-500/30 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-3 bg-orange-500/20 text-orange-400 rounded-2xl shrink-0 border border-orange-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-sm text-cyan-200">
                قوانین امانت مکتب‌خانه: مهلت ۱۲ ساعته نیم‌روزی تحویل + مهلت ۳ ساعته پرداخت ۱۰ هزار تومانی
              </h3>
              <span className="bg-orange-500/30 text-orange-300 text-[10px] px-2.5 py-0.5 rounded-full font-black border border-orange-400/30">
                بدون استفاده از گوشی در مدرسه
              </span>
            </div>
            <p className="text-xs text-cyan-100 leading-relaxed font-medium">
              ۱. تحویل کتاب در زنگ تفریح به‌صورت حضوری انجام شده و ثبت تایید تا ۱۲ ساعت بعد در منزل توسط والدین صورت می‌پذیرد.<br />
              ۲. پس از تایید طلب امانت توسط مالک، امانت‌گیرنده <strong>۳ ساعت فرصت دارد مبلغ ۱۰,۰۰۰ تومان</strong> هزینه حق امانت را پرداخت نماید.<br />
              ۳. در صورت بروز آسیب به کتاب، حساب کاربر خاطی تا زمان تسویه و جبران مسدود خواهد شد.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px] text-cyan-100 font-bold">
          <div className="bg-white/10 p-3 rounded-2xl flex items-center gap-2 backdrop-blur-xs border border-white/10">
            <Sunrise className="w-4 h-4 text-amber-300 shrink-0" />
            <span><strong>شیفت صبح:</strong> مبادله در زنگ تفریح • تایید عصر در منزل</span>
          </div>
          <div className="bg-white/10 p-3 rounded-2xl flex items-center gap-2 backdrop-blur-xs border border-white/10">
            <CreditCard className="w-4 h-4 text-emerald-300 shrink-0" />
            <span><strong>حق امانت ۱۰ هزار تومان:</strong> مهلت ۳ ساعته پرداخت آنلاین</span>
          </div>
          <div className="bg-white/10 p-3 rounded-2xl flex items-center gap-2 backdrop-blur-xs border border-white/10">
            <Home className="w-4 h-4 text-cyan-300 shrink-0" />
            <span><strong>تایید ۲ طرفه:</strong> توسط والدین از خانه با شماره OTP</span>
          </div>
        </div>
      </div>

      {/* Incoming Requests Tab */}
      {activeTab === 'incoming' && (
        <div className="space-y-4">
          {incomingRequests.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-cyan-200 space-y-2">
              <Inbox className="w-10 h-10 text-cyan-300 mx-auto" />
              <h4 className="font-black text-slate-700 text-sm">درخواستی دریافت نشده است</h4>
              <p className="text-xs text-slate-400">
                وقتی همکلاسی‌های شما درخواست امانت یکی از کتاب‌های شما را ثبت کنند، در این قسمت قرار می‌گیرد.
              </p>
            </div>
          ) : (
            incomingRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-3xl p-5 border-2 border-cyan-100 shadow-sm space-y-4 hover:border-cyan-300 transition"
              >
                <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <img
                      src={req.bookCover}
                      alt={req.bookTitle}
                      className="w-12 h-16 object-cover rounded-xl shadow-xs"
                    />
                    <div>
                      <span className="text-[10px] text-cyan-700 font-bold block">درخواست امانت کتاب:</span>
                      <h3 className="font-black text-slate-900 text-base">{req.bookTitle}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        متقاضی امانت: <strong className="text-slate-800 font-black">{req.borrowerName}</strong> ({req.borrowerClass})
                      </p>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {req.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 text-xs px-3 py-1 rounded-full font-black">
                        <Clock className="w-3.5 h-3.5" /> نیازمند تایید شما
                      </span>
                    )}
                    {req.status === 'accepted' && req.paymentStatus === 'rejected' && (
                      <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-950 text-xs px-3 py-1 rounded-full font-black border border-rose-200">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" /> فیش رد شد (در انتظار ارسال مجدد)
                      </span>
                    )}
                    {req.status === 'accepted' && req.paymentStatus !== 'rejected' && (
                      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 text-xs px-3 py-1 rounded-full font-black">
                        <Clock className="w-3.5 h-3.5 text-amber-600" /> تایید شده (در انتظار پرداخت فیش)
                      </span>
                    )}
                    {req.status === 'payment_completed' && (
                      <span className="inline-flex items-center gap-1 bg-teal-100 text-teal-900 text-xs px-3 py-1 rounded-full font-black">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> پرداخت تایید شد (آماده تحویل کتاب)
                      </span>
                    )}
                    {(req.status === 'handover_confirmed' || req.status === 'returned') && (
                      <span className="inline-flex items-center gap-1 bg-cyan-100 text-cyan-900 text-xs px-3 py-1 rounded-full font-black">
                        <ShieldCheck className="w-3.5 h-3.5" /> {req.status === 'returned' ? 'پس داده شده' : 'در دست امانت همکلاسی'}
                      </span>
                    )}
                    {req.status === 'rejected' && (
                      <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-xs px-3 py-1 rounded-full font-black">
                        <XCircle className="w-3.5 h-3.5" /> رد شده
                      </span>
                    )}

                    {/* Payment Status Badge */}
                    {req.paymentStatus === 'paid' && (
                      <span className="inline-flex items-center gap-1 bg-teal-100 text-teal-800 text-[11px] px-2.5 py-0.5 rounded-full font-bold">
                        <CreditCard className="w-3 h-3 text-teal-600" /> ۱۰,۰۰۰ تومان پرداخت شده
                      </span>
                    )}
                  </div>
                </div>

                {/* Handover Details Banner if accepted */}
                {req.pickupLocation && (
                  <div className="bg-cyan-50/60 p-4 rounded-2xl border border-cyan-200 text-xs space-y-2">
                    <div className="flex items-center gap-4 text-slate-800 flex-wrap font-bold">
                      <span className="flex items-center gap-1 text-cyan-900">
                        <MapPin className="w-4 h-4 text-cyan-600" />
                        مکان قرار تحویل: {req.pickupLocation}
                      </span>
                      <span className="flex items-center gap-1 text-cyan-900">
                        <Clock className="w-4 h-4 text-cyan-600" />
                        زمان قرار: {req.pickupTime}
                      </span>
                      <span className="flex items-center gap-1 text-slate-600">
                        <Phone className="w-3.5 h-3.5" />
                        شماره تماس گیرنده: {req.borrowerPhone}
                      </span>
                    </div>

                    <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-cyan-200/60 text-[11px]">
                      <span className="text-emerald-800 font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        بازه زمانی تایید: ۱۲ ساعت فرصت ثبت از منزل پس از زنگ تفریح
                      </span>
                      {req.handoverConfirmedAt && (
                        <span className="text-slate-500 font-sans dir-ltr">
                          تایید شده در: {req.handoverConfirmedAt}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions Bar */}
                <div className="flex items-center justify-between flex-wrap gap-2 pt-2">
                  <span className="text-[11px] text-slate-400 font-medium">تاریخ ثبت درخواست: {req.createdAt}</span>

                  <div className="flex items-center gap-2 flex-wrap">
                    {req.status === 'pending' && (
                      <>
                        <button
                          onClick={() => setAcceptingReqId(req.id)}
                          className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 text-white text-xs font-black rounded-xl shadow-md shadow-cyan-600/20 transition"
                        >
                          تایید درخواست & تعیین قرار تحویل
                        </button>
                        <button
                          onClick={() => rejectLoanRequest(req.id)}
                          className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition"
                        >
                          رد درخواست
                        </button>
                      </>
                    )}

                    {(req.status === 'payment_completed' || (req.status === 'accepted' && (!req.paymentStatus || req.paymentStatus === 'paid'))) && (
                      <button
                        onClick={() => confirmHandover(req.id, 'owner')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>تایید تحویل فیزیکی (ثبت ۱۲ ساعته از منزل)</span>
                      </button>
                    )}
                    {req.status === 'accepted' && req.paymentStatus && req.paymentStatus !== 'paid' && (
                      <span className="text-amber-700 text-xs font-bold bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                        ⏳ منتظر واریز و تایید فیش توسط مدیر
                      </span>
                    )}

                    {req.status === 'handover_confirmed' && (
                      <>
                        <button
                          onClick={() => setSelectedRequestForFeedback(req)}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 text-xs font-black rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>ثبت پس‌گرفتن کتاب & ثبت نظر درباره قرض‌گیرنده</span>
                        </button>

                        <button
                          onClick={() => setDamageReportingReq(req)}
                          className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition flex items-center gap-1 cursor-pointer"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>گزارش آسیب کتاب (مسدودی حساب)</span>
                        </button>
                      </>
                    )}

                    {req.status === 'returned' && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {!req.ownerFeedbackGiven ? (
                          <button
                            onClick={() => setSelectedRequestForFeedback(req)}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 text-xs font-black rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Star className="w-4 h-4 fill-slate-950 text-slate-950" />
                            <span>ثبت نظر و امتیاز درباره قرض‌گیرنده ({req.borrowerName})</span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 text-xs px-3 py-1.5 rounded-xl font-bold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>نظر شما در مورد قرض‌گیرنده ثبت گردید</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Outgoing Requests Tab */}
      {activeTab === 'outgoing' && (
        <div className="space-y-4">
          {outgoingRequests.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-cyan-200 space-y-2">
              <Send className="w-10 h-10 text-cyan-300 mx-auto" />
              <h4 className="font-black text-slate-700 text-sm">درخواستی ارسال نکرده‌اید</h4>
              <p className="text-xs text-slate-400">
                می‌توانید به بخش «کتابخانه اصلی» بروید و کتاب مورد علاقه خود را انتخاب کرده و درخواست دهید.
              </p>
            </div>
          ) : (
            outgoingRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-3xl p-5 border-2 border-cyan-100 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <img
                      src={req.bookCover}
                      alt={req.bookTitle}
                      className="w-12 h-16 object-cover rounded-xl shadow-xs"
                    />
                    <div>
                      <span className="text-[10px] text-cyan-700 font-bold block">درخواست امانت برای کتاب:</span>
                      <h3 className="font-black text-slate-900 text-base">{req.bookTitle}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        مالک اصلی کتاب: <strong className="text-slate-800 font-black">{req.ownerName}</strong> ({req.ownerClass})
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {req.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 text-xs px-3 py-1 rounded-full font-black animate-pulse">
                        <Clock className="w-3.5 h-3.5" /> در انتظار تایید {req.ownerName}
                      </span>
                    )}
                    {req.status === 'payment_pending' && (
                      <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-950 text-xs px-3 py-1 rounded-full font-black animate-pulse">
                        <CreditCard className="w-3.5 h-3.5 text-orange-600" /> در انتظار پرداخت ۱۰,۰۰۰ تومان (کارت به کارت)
                      </span>
                    )}
                    {req.status === 'payment_proof_submitted' && (
                      <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-900 text-xs px-3 py-1 rounded-full font-black">
                        <FileCheck className="w-3.5 h-3.5 text-blue-600" /> فیش بارگذاری شد (در انتظار تایید مدیر)
                      </span>
                    )}
                    {(req.status === 'accepted' || req.status === 'payment_completed') && (
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 text-xs px-3 py-1 rounded-full font-black">
                        <CheckCircle2 className="w-3.5 h-3.5" /> قبول شد! آمادگی تحویل در مدرسه
                      </span>
                    )}
                    {req.status === 'handover_confirmed' && (
                      <span className="inline-flex items-center gap-1 bg-cyan-100 text-cyan-900 text-xs px-3 py-1 rounded-full font-black">
                        <ShieldCheck className="w-3.5 h-3.5" /> در امانت شماست (در حال مطالعه)
                      </span>
                    )}
                    {req.status === 'returned' && (
                      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-xs px-3 py-1 rounded-full font-black">
                        <CheckCircle2 className="w-3.5 h-3.5" /> بازگردانده شده
                      </span>
                    )}

                    {/* Payment badge */}
                    {(req.paymentStatus === 'paid' || req.status === 'payment_completed') ? (
                      <span className="inline-flex items-center gap-1 bg-teal-100 text-teal-800 text-[11px] px-2.5 py-0.5 rounded-full font-bold">
                        <CreditCard className="w-3 h-3 text-teal-600" /> واریز کارت به کارت تایید شد ✔️
                      </span>
                    ) : req.status === 'payment_proof_submitted' ? (
                      <span className="inline-flex items-center gap-1 bg-sky-100 text-sky-800 text-[11px] px-2.5 py-0.5 rounded-full font-bold">
                        <FileCheck className="w-3 h-3 text-sky-600" /> فیش و کد پیگیری ثبت شد
                      </span>
                    ) : req.paymentStatus === 'rejected' ? (
                      <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-[11px] px-2.5 py-0.5 rounded-full font-bold">
                        <XCircle className="w-3 h-3 text-rose-600" /> فیش توسط مدیر رد شد (لطفاً مجدد ارسال کنید)
                      </span>
                    ) : (
                      (req.status === 'accepted' || req.status === 'payment_pending') && (
                        <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-900 text-[11px] px-2.5 py-0.5 rounded-full font-black">
                          <Clock className="w-3 h-3 text-orange-600" /> پرداخت به شماره کارت سایت
                        </span>
                      )
                    )}
                  </div>
                </div>

                {/* Card to Card Payment Box & Proof Submission Form */}
                {(req.status === 'payment_pending' || (req.status === 'accepted' && req.paymentStatus !== 'paid')) && (
                  <div className="bg-amber-50/90 p-5 rounded-2xl border-2 border-amber-300 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2 border-b border-amber-200 pb-3">
                      <div className="flex items-center gap-2 text-amber-950 font-black text-sm">
                        <CreditCard className="w-5 h-5 text-amber-700" />
                        <span>پرداخت هزینه ۱۰,۰۰۰ تومان امانت کتاب به روش کارت به کارت</span>
                      </div>
                      <span className="bg-amber-200 text-amber-900 text-xs px-2.5 py-0.5 rounded-full font-bold">
                        واریز به حساب سایت
                      </span>
                    </div>

                    <p className="text-xs text-amber-900 leading-relaxed font-medium">
                      لطفاً مبلغ <strong>۱۰,۰۰۰ تومان</strong> را به کارت بانکی زیر واریز نموده و کد پیگیری و تاریخ واریز را در کادر زیر ثبت یا تصویر فیش را بارگذاری نمایید. پس از تایید مدیر سایت (پارسا فیض)، تحویل کتاب تکمیل می‌شود.
                    </p>

                    {/* Bank Card Info Display */}
                    <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-4 rounded-2xl shadow-sm space-y-2">
                      <div className="flex items-center justify-between text-xs text-emerald-200 font-bold">
                        <span>{bankCardInfo.bankName}</span>
                        <span>صاحب کارت: {bankCardInfo.cardHolderName}</span>
                      </div>
                      <div className="flex items-center justify-between bg-black/20 p-3 rounded-xl">
                        <span className="text-lg font-black tracking-widest font-mono text-emerald-100" dir="ltr">
                          {bankCardInfo.cardNumber}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(bankCardInfo.cardNumber);
                            setCopySuccess(true);
                            setTimeout(() => setCopySuccess(false), 2000);
                          }}
                          className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                        >
                          {copySuccess ? 'کپی شد! ✓' : 'کپی شماره کارت'}
                        </button>
                      </div>
                    </div>

                    {/* Proof Submission Form */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!receiptImage.trim()) {
                          setReceiptUploadError('بارگذاری تصویر / اسکرین‌شات فیش واریزی الزامی است.');
                          return;
                        }
                        submitPaymentProof(req.id, {
                          trackingCode: trackingCode.trim() || undefined,
                          paymentDate: paymentDate.trim(),
                          receiptImage: receiptImage.trim()
                        });
                        setTrackingCode('');
                        setReceiptImage('');
                        setReceiptPreviewUrl('');
                        setReceiptUploadError('');
                      }}
                      className="space-y-3 bg-white p-4 rounded-2xl border border-amber-200"
                    >
                      <h4 className="font-black text-xs text-slate-800 flex items-center gap-1.5">
                        <FileCheck className="w-4 h-4 text-emerald-600" />
                        <span>ثبت مشخصات و فیش واریزی شما:</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            کد پیگیری یا شماره ارجاع بانکی (اختیاری):
                          </label>
                          <input
                            type="text"
                            value={trackingCode}
                            onChange={(e) => setTrackingCode(e.target.value)}
                            placeholder="مثلا: 894520136 (در صورت وجود)"
                            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                            dir="ltr"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">تاریخ و ساعت دقیق واریز:</label>
                          <input
                            type="text"
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                          />
                        </div>

                        <div className="sm:col-span-2 space-y-2">
                          <label className="block text-[11px] font-bold text-slate-700">
                            تصویر / اسکرین‌شات فیش واریز <span className="text-rose-500 font-black">* (الزامی)</span>:
                          </label>

                          <div className="flex items-center gap-3 flex-wrap">
                            <label
                              className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-black shadow-xs flex items-center gap-2 transition ${
                                isUploadingReceipt
                                  ? 'bg-slate-200 text-slate-500 cursor-wait'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                              }`}
                            >
                              {isUploadingReceipt ? (
                                <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                              ) : (
                                <Upload className="w-4 h-4 text-emerald-700" />
                              )}
                              <span>{isUploadingReceipt ? 'در حال ارسال فیش به سرور...' : 'بارگذاری عکس فیش از گوشی / کامپیوتر'}</span>
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/jpg"
                                onChange={handleReceiptUpload}
                                disabled={isUploadingReceipt}
                                className="hidden"
                              />
                            </label>

                            <span className="text-[10px] text-slate-500">
                              (فرمت‌های مجاز: JPG, PNG, WEBP - حداکثر ۱۰ مگابایت)
                            </span>
                          </div>

                          {(receiptPreviewUrl || receiptImage) && (
                            <div className="flex items-center justify-between p-2.5 bg-emerald-50/80 border border-emerald-300 rounded-xl mt-2 animate-in fade-in">
                              <div className="flex items-center gap-2.5">
                                <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-emerald-300 bg-white shrink-0">
                                  <img
                                    src={receiptPreviewUrl || receiptImage}
                                    alt="پیش‌نمایش فیش"
                                    className={`w-full h-full object-cover transition ${
                                      isUploadingReceipt ? 'opacity-50 blur-[1px]' : 'opacity-100'
                                    }`}
                                  />
                                  {isUploadingReceipt && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-emerald-900/40">
                                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <span className="text-xs font-bold text-emerald-900 block">
                                    {isUploadingReceipt ? 'در حال آپلود و ذخیره فیش...' : 'تصویر فیش با موفقیت در سرور ذخیره شد ✓'}
                                  </span>
                                  <span className="text-[10px] text-emerald-700 font-mono dir-ltr">
                                    {receiptImage || 'در انتظار تایید سرور...'}
                                  </span>
                                </div>
                              </div>

                              {!isUploadingReceipt && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReceiptImage('');
                                    setReceiptPreviewUrl('');
                                  }}
                                  className="text-xs text-rose-600 hover:text-rose-800 font-bold px-2 py-1 hover:bg-rose-50 rounded-lg transition"
                                >
                                  حذف
                                </button>
                              )}
                            </div>
                          )}

                          {receiptUploadError && (
                            <p className="text-[11px] text-rose-600 font-bold">{receiptUploadError}</p>
                          )}
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                      >
                        <FileCheck className="w-4 h-4" />
                        <span>ارسال اطلاعات پرداخت برای تایید مدیر سایت</span>
                      </button>
                    </form>
                  </div>
                )}

                {/* Payment Proof Submitted Banner */}
                {req.status === 'payment_proof_submitted' && (
                  <div className="bg-sky-50 p-4 rounded-2xl border border-sky-200 text-xs space-y-2">
                    <div className="flex items-center gap-2 text-sky-950 font-black">
                      <Clock className="w-4 h-4 text-sky-600 animate-spin" />
                      <span>اطلاعات پرداخت شما با موفقیت ثبت شد و در انتظار تایید پارسا فیض (مدیر سایت) می‌باشد.</span>
                    </div>
                    {req.paymentProof && (
                      <div className="text-[11px] text-slate-600 font-bold bg-white p-2.5 rounded-xl border border-sky-100 flex items-center gap-4 flex-wrap">
                        <span>کد پیگیری: <strong className="text-sky-800" dir="ltr">{req.paymentProof.trackingCode || 'ثبت نشده'}</strong></span>
                        <span>زمان واریز: {req.paymentProof.paymentDate}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Handover Details Box */}
                {((req.status === 'accepted' && (!req.paymentStatus || req.paymentStatus === 'paid')) || req.status === 'payment_completed' || req.status === 'handover_confirmed') && req.pickupLocation && (
                  <div className="bg-cyan-50/70 p-4 rounded-2xl border border-cyan-200 text-xs space-y-3">
                    <div className="font-black text-cyan-950 text-sm flex items-center justify-between flex-wrap gap-2">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-cyan-600" />
                        قرار تحویل کتاب در مدرسه:
                      </span>
                      <span className="bg-cyan-100 text-cyan-950 text-[10px] px-2.5 py-0.5 rounded-full font-black border border-cyan-200">
                        مهلت تایید ۱۲ ساعته نیم‌روزی
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                      <div className="flex items-center gap-1 bg-white p-2.5 rounded-xl border border-cyan-100 font-bold">
                        <MapPin className="w-4 h-4 text-cyan-600 shrink-0" />
                        <span>مکان قرار: {req.pickupLocation}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-white p-2.5 rounded-xl border border-cyan-100 font-bold">
                        <Clock className="w-4 h-4 text-cyan-600 shrink-0" />
                        <span>زمان قرار: {req.pickupTime}</span>
                      </div>
                    </div>

                    <div className="pt-1 flex items-center justify-between flex-wrap gap-2">
                      <span className="text-[11px] text-cyan-800 font-medium">
                        💡 کتاب را در زنگ تفریح دریافت کنید و پس از بازگشت به منزل دریافت را ثبت کنید.
                      </span>
                      {req.status !== 'handover_confirmed' && (
                        <button
                          onClick={() => confirmHandover(req.id, 'borrower')}
                          className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>تایید دریافت فیزیکی کتاب (ثبت ۱۲ ساعته از منزل)</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {req.status === 'handover_confirmed' && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => setSelectedRequestForFeedback(req)}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 active:scale-95 text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-300" />
                      <span>ثبت پس‌دادن کتاب & امتیازدهی به مالک</span>
                    </button>
                  </div>
                )}

                {req.status === 'returned' && (
                  <div className="flex justify-end pt-2">
                    {!req.borrowerFeedbackGiven ? (
                      <button
                        onClick={() => setSelectedRequestForFeedback(req)}
                        className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 active:scale-95 text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                        <span>ثبت نظر و امتیازدهی به مالک کتاب ({req.ownerName})</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 text-xs px-3 py-1.5 rounded-xl font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>نظر و امتیاز شما برای مالک ثبت شد</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Accept Pickup Time Form Modal */}
      {acceptingReqId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-cyan-400 space-y-4">
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              تعیین زمان، مکان و شیفت نیم‌روزی تحویل
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              مشخص کنید دانش‌آموز متقاضی چه زنگ تفریحی و در کدام بخش مدرسه کتاب را دریافت کند. با توجه به عدم دسترسی به گوشی در مدرسه، تایید نهایی تا ۱۲ ساعت بعد از منزل انجام می‌شود.
            </p>

            {/* Presets */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-600 block">میانبرهای پیشنهادی مکتب‌خانه:</label>
              <div className="grid grid-cols-1 gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPresetTime('جلوی دفتر پرورشی مدرسه', 'فردا - زنگ تفریح دوم (۱۰:۱۵)', 'morning')}
                  className="text-right text-xs p-2 bg-cyan-50/60 hover:bg-cyan-100 hover:border-cyan-300 border border-cyan-200 rounded-xl transition flex items-center justify-between font-bold"
                >
                  <span>📍 دفتر پرورشی • زنگ تفریح دوم (۱۰:۱۵)</span>
                  <span className="text-[10px] text-cyan-700 font-black">شیفت صبح</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyPresetTime('کتابخانه مدرسه', 'فردا - زنگ تفریح اول (۰۹:۳۰)', 'morning')}
                  className="text-right text-xs p-2 bg-cyan-50/60 hover:bg-cyan-100 hover:border-cyan-300 border border-cyan-200 rounded-xl transition flex items-center justify-between font-bold"
                >
                  <span>📍 کتابخانه مدرسه • زنگ تفریح اول (۰۹:۳۰)</span>
                  <span className="text-[10px] text-cyan-700 font-black">شیفت صبح</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyPresetTime('حیاط مدرسه (نزدیک بوفه)', 'هنگام تعطیلی مدرسه (۱۲:۳۰)', 'afternoon')}
                  className="text-right text-xs p-2 bg-cyan-50/60 hover:bg-cyan-100 hover:border-cyan-300 border border-cyan-200 rounded-xl transition flex items-center justify-between font-bold"
                >
                  <span>📍 حیاط/بوفه • هنگام تعطیلی (۱۲:۳۰)</span>
                  <span className="text-[10px] text-orange-600 font-black">شیفت عصر</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleAcceptSubmit} className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">
                  شیفت تحویل نیم‌روزی:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPickupShift('morning')}
                    className={`p-2 rounded-xl text-xs font-black border flex flex-col items-center gap-1 transition ${
                      pickupShift === 'morning'
                        ? 'bg-cyan-600 text-white border-cyan-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Sunrise className="w-4 h-4 text-amber-300" />
                    <span>شیفت صبح</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPickupShift('afternoon')}
                    className={`p-2 rounded-xl text-xs font-black border flex flex-col items-center gap-1 transition ${
                      pickupShift === 'afternoon'
                        ? 'bg-cyan-600 text-white border-cyan-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Sun className="w-4 h-4 text-amber-300" />
                    <span>شیفت عصر</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPickupShift('evening_home')}
                    className={`p-2 rounded-xl text-xs font-black border flex flex-col items-center gap-1 transition ${
                      pickupShift === 'evening_home'
                        ? 'bg-cyan-600 text-white border-cyan-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Home className="w-4 h-4 text-amber-300" />
                    <span>ثبت خانه</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">
                  مکان دقیق قرار در مدرسه:
                </label>
                <input
                  type="text"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  placeholder="مثلا: جلوی دفتر پرورشی / حیاط مدرسه"
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">
                  روز و زنگ تفریح:
                </label>
                <input
                  type="text"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  placeholder="مثلا: فردا سه شنبه - زنگ تفریح دوم (۱۰:۱۵)"
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 font-bold"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAcceptingReqId(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 text-white text-xs font-black rounded-xl shadow-md transition"
                >
                  تایید و ارسال (فعالسازی مهلت ۱۲ ساعته)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Damage Reporting Modal */}
      {damageReportingReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-rose-400 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-black text-slate-900 text-base">گزارش آسیب دیدن کتاب و درخواست تعلیق حساب</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              طبق قوانین مکتب‌خانه، چنانچه امانت‌گیرنده ({damageReportingReq.borrowerName}) به کتاب آسیب بزند، حساب کاربری وی تا زمان جبران خسارت و جلب رضایت شما مسدود خواهد شد.
            </p>

            <div>
              <label className="text-xs font-black text-slate-700 block mb-1">
                علت و شرح آسیب وارده به کتاب <span className="text-rose-600">*</span>:
              </label>
              <textarea
                rows={3}
                value={damageReason}
                onChange={(e) => setDamageReason(e.target.value)}
                placeholder="مثلا: پارگی صفحات، ریختن چای، خط خوردگی..."
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 font-bold"
                required
              />
            </div>

            {/* Damage Photo Upload */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-700">
                عکس از آسیب کتاب (اختیاری):
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                <label
                  className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-black shadow-2xs flex items-center gap-2 transition ${
                    isUploadingDamagePhoto
                      ? 'bg-slate-200 text-slate-500 cursor-wait'
                      : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
                  }`}
                >
                  {isUploadingDamagePhoto ? (
                    <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                  ) : (
                    <Upload className="w-4 h-4 text-rose-600" />
                  )}
                  <span>{isUploadingDamagePhoto ? 'در حال ارسال...' : 'بارگذاری عکس آسیب کتاب'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={handleDamagePhotoUpload}
                    disabled={isUploadingDamagePhoto}
                    className="hidden"
                  />
                </label>
              </div>

              {(damagePhotoPreview || damagePhotoUrl) && (
                <div className="flex items-center justify-between p-2.5 bg-rose-50 border border-rose-200 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={damagePhotoPreview || damagePhotoUrl}
                      alt="پیش نمایش آسیب"
                      className="w-12 h-12 rounded-lg object-cover border border-rose-200"
                    />
                    <span className="text-xs font-bold text-rose-900">عکس آسیب ثبت شد ✓</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDamagePhotoUrl('');
                      setDamagePhotoPreview('');
                    }}
                    className="text-xs text-rose-600 font-bold hover:underline"
                  >
                    حذف
                  </button>
                </div>
              )}

              {damagePhotoError && (
                <p className="text-[11px] text-rose-600 font-bold">{damagePhotoError}</p>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDamageReportingReq(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleConfirmReportDamage}
                disabled={!damageReason.trim()}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-md shadow-rose-600/20 disabled:opacity-50"
              >
                تایید گزارش آسیب & مسدودی حساب
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mutual Feedback Survey Modal */}
      <MutualFeedbackModal
        request={selectedRequestForFeedback}
        onClose={() => setSelectedRequestForFeedback(null)}
        onSubmitFeedback={(reqId, feedbackData) => {
          completeReturnAndSubmitFeedback(reqId, feedbackData);
          setFeedbackSuccessToast('نظر و ارزیابی شما با موفقیت ثبت شد ✓');
          setTimeout(() => setFeedbackSuccessToast(null), 5000);
        }}
      />
    </div>
  );
};

