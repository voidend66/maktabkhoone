import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { EditProfileModal } from './EditProfileModal';
import { api } from '../services/api';
import {
  ShieldAlert,
  UserCheck,
  UserX,
  BookOpen,
  Clock,
  CheckCircle2,
  Trash2,
  Users,
  Search,
  BookPlus,
  ShieldCheck,
  GraduationCap,
  Plus,
  Edit2,
  Check,
  X,
  CreditCard,
  FileCheck,
  XCircle,
  Save,
  LogOut,
  Edit3,
  Sliders,
  Settings,
  AlertCircle,
  Coins,
  Terminal,
  RotateCcw,
  Filter,
  Crown,
  UserPlus,
  Shield,
  ArrowLeftRight,
  Database,
  Download,
  Upload,
  MessageSquare,
  Lock,
  EyeOff,
  AlertTriangle,
  Star,
  Send,
  Radio,
  Share2,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Phone,
  HelpCircle,
  Smile,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const {
    currentUser,
    logoutUser,
    users,
    books,
    requests,
    approveUser,
    rejectUser,
    deleteUser,
    deleteBook,
    deleteBookReview,
    deleteFeedback,
    schoolClasses,
    addSchoolClass,
    updateSchoolClass,
    deleteSchoolClass,
    bankCardInfo,
    updateBankCardInfo,
    systemConfig,
    updateSystemConfig,
    verifyPaymentByAdmin,
    makeAdmin,
    addAdminByPhone,
    customAvatars,
    addCustomAvatar,
    deleteCustomAvatar,
    refreshData
  } = useApp();

  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'pending_users' | 'bank_card' | 'lending_history' | 'reviews_feedbacks' | 'system_settings' | 'all_books' | 'all_users' | 'class_management' | 'system_logs' | 'avatars'
  >('pending_users');
  const [reviewsSubTab, setReviewsSubTab] = useState<'book_reviews' | 'user_feedbacks'>('book_reviews');
  const [reviewSearch, setReviewSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Avatar Management states & handlers
  const [newAvatarName, setNewAvatarName] = useState('');
  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarSuccessMsg, setAvatarSuccessMsg] = useState('');
  const [avatarErrorMsg, setAvatarErrorMsg] = useState('');

  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarErrorMsg('لطفاً یک فایل تصویری (PNG, JPG, WEBP) انتخاب کنید.');
      return;
    }

    setIsUploadingAvatar(true);
    setAvatarErrorMsg('');
    setAvatarSuccessMsg('');

    try {
      const uploadRes = await api.uploadImage(file);
      if (uploadRes.success && uploadRes.fileUrl) {
        setNewAvatarUrl(uploadRes.fileUrl);
        setAvatarSuccessMsg('تصویر آواتار با موفقیت روی سرور بارگذاری شد.');
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result) {
            setNewAvatarUrl(reader.result.toString());
            setAvatarSuccessMsg('تصویر آماده ثبت است.');
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setNewAvatarUrl(reader.result.toString());
          setAvatarSuccessMsg('تصویر آماده ثبت است.');
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCreateCustomAvatar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAvatarName.trim()) {
      setAvatarErrorMsg('لطفاً نام آواتار را وارد کنید.');
      return;
    }
    if (!newAvatarUrl) {
      setAvatarErrorMsg('لطفاً یک فایل تصویری PNG برای آواتار بارگذاری کنید.');
      return;
    }

    setAvatarErrorMsg('');
    setAvatarSuccessMsg('');
    setIsUploadingAvatar(true);

    const res = await addCustomAvatar(newAvatarName.trim(), newAvatarUrl);
    setIsUploadingAvatar(false);

    if (res.success) {
      setAvatarSuccessMsg(res.message || 'آواتار جدید با موفقیت اضافه شد.');
      setNewAvatarName('');
      setNewAvatarUrl('');
    } else {
      setAvatarErrorMsg(res.message || 'خطا در ثبت آواتار.');
    }
  };

  const handleDeleteCustomAvatar = async (id: string, name: string) => {
    if (!window.confirm(`آیا از حذف آواتار «${name}» اطمینان دارید؟`)) return;
    const res = await deleteCustomAvatar(id);
    if (res.success) {
      setAvatarSuccessMsg(res.message || 'آواتار با موفقیت حذف شد.');
    } else {
      setAvatarErrorMsg(res.message || 'خطا در حذف آواتار.');
    }
  };

  // Backup and Restore states & handlers
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState<boolean>(false);

  const handleDownloadBackup = () => {
    window.location.href = '/api/admin/backup';
  };

  const handleUploadBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmRestore = window.confirm(
      '⚠️ هشدار بسیار مهم!\n\nآیا از بازیابی و بازنشانی دیتابیس اطمینان کامل دارید؟\nبا این کار، تمامی کتب، امانت‌ها، کاربران و سوابق فعلی سایت پاک شده و با اطلاعات فایل بکاپ جایگزین خواهند شد.'
    );
    if (!confirmRestore) {
      e.target.value = '';
      return;
    }

    setIsRestoring(true);
    setRestoreError(null);
    setRestoreSuccess(false);

    const formData = new FormData();
    formData.append('backupFile', file);

    try {
      const res = await fetch('/api/admin/restore', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setRestoreSuccess(true);
        if (typeof fetchSystemLogs === 'function') {
          fetchSystemLogs();
        }
        await refreshData();
        alert('✅ اطلاعات دیتابیس با موفقیت به فایل پشتیبان بازگردانی شد.');
      } else {
        setRestoreError(data.message || 'خطا در خواندن فایل پشتیبان.');
      }
    } catch (err: any) {
      setRestoreError(err.message || 'خطای شبکه در ارتباط با سرور.');
    } finally {
      setIsRestoring(false);
      e.target.value = '';
    }
  };

  // Payment Archive State
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'rejected' | 'proof_submitted'>('all');

  // Lending History State
  const [lendingSearch, setLendingSearch] = useState('');
  const [lendingFilter, setLendingFilter] = useState<string>('all');

  // System Logs State
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [logSearch, setLogSearch] = useState('');
  const [logLevelFilter, setLogLevelFilter] = useState<'all' | 'error' | 'warn' | 'info' | 'db'>('all');
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchSystemLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch('/api/admin/logs');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSystemLogs(data.logs || []);
        }
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleClearLogs = async () => {
    if (!confirm('آیا از پاک‌سازی تمامی لاگ‌های ثبت‌شده دیتابیس و رویدادهای سامانه اطمینان دارید؟')) return;
    try {
      const res = await fetch('/api/admin/logs', { method: 'DELETE' });
      if (res.ok) {
        setSystemLogs([]);
      }
    } catch (err) {
      console.error('Error clearing logs:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'system_logs') {
      fetchSystemLogs();
    }
  }, [activeTab]);

  // Bank Card Form State
  const [cardNumber, setCardNumber] = useState(bankCardInfo.cardNumber);
  const [cardHolderName, setCardHolderName] = useState(bankCardInfo.cardHolderName);
  const [bankName, setBankName] = useState(bankCardInfo.bankName);
  const [cardSaveMsg, setCardSaveMsg] = useState('');

  // System Config State
  const [minBooksForReg, setMinBooksForReg] = useState(systemConfig?.minBooksForRegistration ?? 3);
  const [maxBooksForReg, setMaxBooksForReg] = useState(systemConfig?.maxBooksForRegistration ?? 5);
  const [reqAdminApproval, setReqAdminApproval] = useState(systemConfig?.requireAdminApproval ?? true);
  const [loanFee, setLoanFee] = useState(systemConfig?.loanFeeAmount ?? 10000);
  const [loanDuration, setLoanDuration] = useState(systemConfig?.loanDurationDays ?? 7);
  const [paymentHours, setPaymentHours] = useState(systemConfig?.paymentWindowHours ?? 3);
  const [handoverHours, setHandoverHours] = useState(systemConfig?.handoverWindowHours ?? 12);

  // Support and Contact State
  const [supportPhone, setSupportPhone] = useState(systemConfig?.supportPhone ?? '09121112233');
  const [supportBaleId, setSupportBaleId] = useState(systemConfig?.supportBaleId ?? 'maktabkhune_admin');
  const [supportAdminName, setSupportAdminName] = useState(systemConfig?.supportAdminName ?? 'پارسا فیض (مسئول مکتب‌خانه)');
  const [supportHours, setSupportHours] = useState(systemConfig?.supportHours ?? 'شنبه تا چهارشنبه - ساعت ۷:۳۰ الی ۱۴:۰۰');

  // Bale Channel Integration State
  const [baleChannelUsername, setBaleChannelUsername] = useState(systemConfig?.baleChannelUsername ?? '@maktabkhune_books');
  const [autoPublishBooks, setAutoPublishBooks] = useState(systemConfig?.autoPublishBooksToBale ?? true);
  const [websiteBaseUrl, setWebsiteBaseUrl] = useState(systemConfig?.websiteBaseUrl || (typeof window !== 'undefined' ? window.location.origin : ''));

  // Testing & Channel Action States
  const [isTestingChannel, setIsTestingChannel] = useState(false);
  const [channelTestStatus, setChannelTestStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isPublishingAll, setIsPublishingAll] = useState(false);
  const [publishAllStatus, setPublishAllStatus] = useState<{ success: boolean; message: string; total?: number; successful?: number; failed?: number } | null>(null);
  const [publishingBookId, setPublishingBookId] = useState<string | null>(null);
  const [bookPublishFeedback, setBookPublishFeedback] = useState<{ bookId: string; success: boolean; message: string } | null>(null);

  const [configSaveMsg, setConfigSaveMsg] = useState('');
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  useEffect(() => {
    if (systemConfig) {
      setMinBooksForReg(systemConfig.minBooksForRegistration ?? 3);
      setMaxBooksForReg(systemConfig.maxBooksForRegistration ?? 5);
      setReqAdminApproval(systemConfig.requireAdminApproval ?? true);
      setLoanFee(systemConfig.loanFeeAmount ?? 10000);
      setLoanDuration(systemConfig.loanDurationDays ?? 7);
      setPaymentHours(systemConfig.paymentWindowHours ?? 3);
      setHandoverHours(systemConfig.handoverWindowHours ?? 12);
      setSupportPhone(systemConfig.supportPhone ?? '09121112233');
      setSupportBaleId(systemConfig.supportBaleId ?? 'maktabkhune_admin');
      setSupportAdminName(systemConfig.supportAdminName ?? 'پارسا فیض (مسئول مکتب‌خانه)');
      setSupportHours(systemConfig.supportHours ?? 'شنبه تا چهارشنبه - ساعت ۷:۳۰ الی ۱۴:۰۰');
      setBaleChannelUsername(systemConfig.baleChannelUsername ?? '@maktabkhune_books');
      setAutoPublishBooks(systemConfig.autoPublishBooksToBale ?? true);
      if (systemConfig.websiteBaseUrl) {
        setWebsiteBaseUrl(systemConfig.websiteBaseUrl);
      } else if (typeof window !== 'undefined') {
        setWebsiteBaseUrl(window.location.origin);
      }
    }
  }, [systemConfig]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    try {
      const res = await updateSystemConfig({
        minBooksForRegistration: Number(minBooksForReg) || 3,
        maxBooksForRegistration: Number(maxBooksForReg) || 5,
        requireAdminApproval: reqAdminApproval,
        loanFeeAmount: Number(loanFee) || 10000,
        loanDurationDays: Number(loanDuration) || 7,
        paymentWindowHours: Number(paymentHours) || 3,
        handoverWindowHours: Number(handoverHours) || 12,
        supportPhone: supportPhone.trim(),
        supportBaleId: supportBaleId.trim(),
        supportAdminName: supportAdminName.trim(),
        supportHours: supportHours.trim(),
        baleChannelUsername: baleChannelUsername.trim(),
        autoPublishBooksToBale: autoPublishBooks,
        websiteBaseUrl: websiteBaseUrl.trim()
      });
      if (res.success) {
        setConfigSaveMsg('قوانین، اطلاعات پشتیبانی و تنظیمات کانال بله با موفقیت ذخیره شد ✓');
      } else {
        setConfigSaveMsg(res.message || 'خطا در ذخیره تنظیمات');
      }
    } catch (err: any) {
      setConfigSaveMsg('خطا در ذخیره تنظیمات');
    } finally {
      setIsSavingConfig(false);
      setTimeout(() => setConfigSaveMsg(''), 5000);
    }
  };

  const handleTestChannel = async () => {
    if (!baleChannelUsername.trim()) {
      alert('لطفاً ابتدا نام کاربری یا شناسه کانال بله را وارد کنید.');
      return;
    }
    setIsTestingChannel(true);
    setChannelTestStatus(null);
    try {
      const res = await api.testBaleChannel(baleChannelUsername.trim());
      setChannelTestStatus({
        success: res.success,
        message: res.message
      });
    } catch (err: any) {
      setChannelTestStatus({
        success: false,
        message: 'خطا در برقراری ارتباط با سرور'
      });
    } finally {
      setIsTestingChannel(false);
    }
  };

  const handlePublishAllBooks = async () => {
    const confirmPublish = window.confirm(
      `📢 آیا از انتشار تمام ${books.length} کتاب موجود در کتابخانه به کانال بله (${baleChannelUsername}) اطمینان دارید؟`
    );
    if (!confirmPublish) return;

    setIsPublishingAll(true);
    setPublishAllStatus(null);
    try {
      const effectiveUrl = websiteBaseUrl.trim() || (typeof window !== 'undefined' ? window.location.origin : '');
      const res = await api.publishAllBooksToBale(effectiveUrl);
      setPublishAllStatus({
        success: res.success,
        message: res.message,
        total: res.total,
        successful: res.successful,
        failed: res.failed
      });
    } catch (err: any) {
      setPublishAllStatus({
        success: false,
        message: 'خطا در انجام عملیات انتشار همگانی'
      });
    } finally {
      setIsPublishingAll(false);
    }
  };

  const handlePublishSingleBook = async (bookId: string, bookTitle: string) => {
    setPublishingBookId(bookId);
    setBookPublishFeedback(null);
    try {
      const effectiveUrl = websiteBaseUrl.trim() || (typeof window !== 'undefined' ? window.location.origin : '');
      const res = await api.publishBookToBale(bookId, effectiveUrl);
      setBookPublishFeedback({
        bookId,
        success: res.success,
        message: res.message
      });
      setTimeout(() => {
        setBookPublishFeedback((curr) => (curr?.bookId === bookId ? null : curr));
      }, 4000);
    } catch (err: any) {
      setBookPublishFeedback({
        bookId,
        success: false,
        message: 'خطا در انتشار کتاب در بله'
      });
    } finally {
      setPublishingBookId(null);
    }
  };

  // Class Management Form State
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState('پایه اول');
  const [isExternal, setIsExternal] = useState(false);

  // Add Admin Form State
  const [adminPhone, setAdminPhone] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [addAdminSuccessMsg, setAddAdminSuccessMsg] = useState('');
  const [addAdminErrorMsg, setAddAdminErrorMsg] = useState('');
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);

  const handleAddAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPhone.trim()) {
      setAddAdminErrorMsg('وارد کردن شماره تلفن الزامی است.');
      return;
    }
    setIsSubmittingAdmin(true);
    setAddAdminSuccessMsg('');
    setAddAdminErrorMsg('');
    try {
      const res = await addAdminByPhone({
        phone: adminPhone.trim(),
        name: adminName.trim() || undefined,
        password: adminPassword.trim() || undefined
      });
      if (res.success) {
        setAddAdminSuccessMsg(res.message || 'حساب مدیریت با موفقیت ثبت/فعال گردید.');
        setAdminPhone('');
        setAdminName('');
        setAdminPassword('');
        setTimeout(() => setAddAdminSuccessMsg(''), 5000);
      } else {
        setAddAdminErrorMsg(res.message || 'خطا در ثبت حساب مدیریت.');
        setTimeout(() => setAddAdminErrorMsg(''), 5000);
      }
    } catch (err: any) {
      setAddAdminErrorMsg('خطا در برقراری ارتباط با سرور.');
      setTimeout(() => setAddAdminErrorMsg(''), 5000);
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  // Editing Class inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editGrade, setEditGrade] = useState('');

  const pendingUsers = users.filter((u) => u.status === 'pending');
  const approvedStudents = users.filter((u) => u.status === 'approved' && u.role === 'student');
  const pendingPayments = requests.filter((r) => r.status === 'payment_proof_submitted');

  const handleSaveBankCard = (e: React.FormEvent) => {
    e.preventDefault();
    updateBankCardInfo({
      cardNumber: cardNumber.trim(),
      cardHolderName: cardHolderName.trim(),
      bankName: bankName.trim()
    });
    setCardSaveMsg('اطلاعات کارت با موفقیت به‌روزرسانی شد.');
    setTimeout(() => setCardSaveMsg(''), 4000);
  };

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    addSchoolClass({
      name: newClassName.trim(),
      grade: newClassGrade,
      isExternal
    });
    setNewClassName('');
    setIsExternal(false);
  };

  const startEdit = (c: { id: string; name: string; grade: string }) => {
    setEditingId(c.id);
    setEditName(c.name);
    setEditGrade(c.grade);
  };

  const saveEdit = (id: string) => {
    if (!editName.trim()) return;
    updateSchoolClass(id, editName.trim(), editGrade);
    setEditingId(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white p-6 rounded-3xl shadow-xl flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs px-3 py-1 rounded-full font-bold">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>پنل اختصاصی مسئول کتابخانه مدرسه</span>
          </div>

          <h2 className="text-2xl font-black">
            مدیریت صلاحیت اعضا، کلاس‌ها و نظارت بر کتابخانه 👑
          </h2>
          <p className="text-xs text-slate-300">
            بررسی و تایید ثبت‌نام دانش‌آموزان جدید، مدیریت نام کلاس‌های مدرسه و تایید کتاب‌ها
          </p>
        </div>

        {/* Admin User Actions & Quick Stats */}
        <div className="flex items-center gap-3 flex-wrap">
          {currentUser && (
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-2.5 px-3.5 rounded-2xl border border-white/15">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-11 h-11 rounded-xl object-cover ring-2 ring-amber-400 shrink-0"
              />
              <div className="text-right">
                <div className="text-xs font-black text-white flex items-center gap-1">
                  <span>{currentUser.name}</span>
                  <span className="text-[10px] bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-md font-bold">مدیر</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => setShowEditProfileModal(true)}
                    className="text-[11px] text-amber-300 hover:text-amber-200 font-bold flex items-center gap-0.5 underline cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    ویرایش مشخصات و آواتار
                  </button>
                  <span className="text-white/30">•</span>
                  <button
                    onClick={() => {
                      if (confirm('آیا از حساب کاربری مدیریت خارج می‌شوید؟')) {
                        logoutUser();
                      }
                    }}
                    className="text-[11px] text-rose-300 hover:text-rose-200 font-bold flex items-center gap-0.5 cursor-pointer"
                  >
                    <LogOut className="w-3 h-3" />
                    خروج
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 text-center">
            <div className="text-2xl font-black text-amber-400">{pendingUsers.length} نفر</div>
            <div className="text-[10px] text-slate-300">در انتظار تایید</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 text-center">
            <div className="text-2xl font-black text-indigo-300">{schoolClasses.length} کلاس</div>
            <div className="text-[10px] text-slate-300">کلاس‌های تعریف‌شده</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs max-w-2xl flex-wrap gap-1">
        <button
          onClick={() => setActiveTab('pending_users')}
          className={`relative flex-1 min-w-[130px] py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'pending_users'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>تایید افراد ({pendingUsers.length})</span>
          {pendingUsers.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute top-2 left-2" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('bank_card')}
          className={`relative flex-1 min-w-[150px] py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'bank_card'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4 text-emerald-400" />
          <span>کارت و فیش‌ها ({pendingPayments.length})</span>
          {pendingPayments.length > 0 && (
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse absolute top-2 left-2" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('lending_history')}
          className={`relative flex-1 min-w-[150px] py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'lending_history'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4 text-amber-400" />
          <span>تاریخچه کل امانت‌ها ({requests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reviews_feedbacks')}
          className={`relative flex-1 min-w-[150px] py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'reviews_feedbacks'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-cyan-400" />
          <span>نظرات و بازخوردها</span>
        </button>

        <button
          onClick={() => setActiveTab('system_settings')}
          className={`flex-1 min-w-[140px] py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'system_settings'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4 text-amber-400" />
          <span>قوانین و تنظیمات سامانه</span>
        </button>

        <button
          onClick={() => setActiveTab('class_management')}
          className={`flex-1 min-w-[130px] py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'class_management'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>مدیریت کلاس‌ها ({schoolClasses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('all_books')}
          className={`flex-1 min-w-[130px] py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'all_books'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>مدیریت کتاب‌ها ({books.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('all_users')}
          className={`flex-1 min-w-[130px] py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'all_users'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>دانش‌آموزان ({approvedStudents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('system_logs')}
          className={`flex-1 min-w-[150px] py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'system_logs'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>لاگ‌های دیتابیس و رویدادها ({systemLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('avatars')}
          className={`flex-1 min-w-[140px] py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'avatars'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Smile className="w-4 h-4 text-pink-400" />
          <span>مدیریت آواتارها ({customAvatars.length})</span>
        </button>
      </div>

      {/* Tab 1: Pending User Registrations */}
      {activeTab === 'pending_users' && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <span>درخواست‌های جدید ثبت‌نام در انتظار تایید مسئول کتابخانه:</span>
          </h3>

          {pendingUsers.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h4 className="font-bold text-slate-800 text-base">هیچ درخواست معوقه‌ای وجود ندارد!</h4>
              <p className="text-xs text-slate-500">
                تمامی دانش‌آموزان جدید بررسی و تعیین تکلیف شده‌اند.
              </p>
            </div>
          ) : (
            pendingUsers.map((user) => {
              const userBooks = books.filter((b) => b.ownerId === user.id);

              return (
                <div
                  key={user.id}
                  className="bg-white rounded-3xl p-6 border-2 border-amber-200 shadow-xs space-y-4"
                >
                  <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-14 h-14 rounded-full object-cover ring-2 ring-amber-400"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-slate-900 text-lg">{user.name}</h4>
                          <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                            کلاس {user.className}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          شماره تماس: <strong className="text-slate-800">{user.phone}</strong> • تاریخ ثبت‌نام: {user.joinedDate}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => approveUser(user.id)}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-100 transition flex items-center gap-1.5"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>تایید صلاحیت دانش‌آموز</span>
                      </button>

                      <button
                        onClick={() => {
                          const reason = window.prompt(
                            `لطفاً علت رد عضویت «${user.name}» را بنویسید تا به وی در پیام‌رسان بله اطلاع‌رسانی شود:\n(به عنوان مثال: سلام شما اسمتون رو درست وارد نکردید با نام کامل دوباره تلاش کنید)`,
                            ""
                          );
                          if (reason !== null) {
                            rejectUser(user.id, reason.trim());
                          }
                        }}
                        className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                      >
                        <UserX className="w-4 h-4" />
                        <span>عدم تایید</span>
                      </button>
                    </div>
                  </div>

                  {/* Submitted Books Preview */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 block">
                      📚 کتاب‌های اولیه ارائه‌شده جهت اشتراک‌گذاری ({userBooks.length} جلد):
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {userBooks.map((b) => (
                        <div
                          key={b.id}
                          className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3 text-xs"
                        >
                          <img
                            src={b.coverImage}
                            alt={b.title}
                            className="w-10 h-14 object-cover rounded-lg shadow-2xs shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900 leading-tight">{b.title}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{b.author}</div>
                            <span className="inline-block mt-1 bg-white px-2 py-0.5 rounded text-[10px] text-emerald-800 font-bold">
                              {b.condition}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab: Bank Card & Payment Proof Verification */}
      {activeTab === 'bank_card' && (
        <div className="space-y-6">
          {/* Card Config Box */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <span>تنظیمات کارت بانکی دریافت هزینه امانت (کارت به کارت) 💳</span>
              </h3>
              <span className="text-xs bg-emerald-50 text-emerald-800 font-bold px-3 py-1 rounded-full border border-emerald-200">
                مدیر سایت: پارسا فیض
              </span>
            </div>

            {cardSaveMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{cardSaveMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveBankCard} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">شماره کارت بانکی (۱۶ رقمی):</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="6037-xxxx-xxxx-xxxx"
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-left tracking-widest text-slate-900"
                  dir="ltr"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">نام و خانوادگی صاحب کارت:</label>
                <input
                  type="text"
                  value={cardHolderName}
                  onChange={(e) => setCardHolderName(e.target.value)}
                  placeholder="پارسا فیض"
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">نام بانک صادرکننده:</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="مثلا: بانک ملی ایران"
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  required
                />
              </div>

              <div className="sm:col-span-3 pt-2">
                <button
                  type="submit"
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>ذخیره مشخصات کارت بانکی</span>
                </button>
              </div>
            </form>
          </div>

          {/* Pending Payment Proofs List */}
          <div className="space-y-4">
            <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-indigo-600" />
              <span>فیش‌ها و کد‌های پیگیری ارسالی کاربران در انتظار تایید ({pendingPayments.length} مورد):</span>
            </h3>

            {pendingPayments.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-slate-800 text-base">هیچ فیش پرداخت معوقه‌ای وجود ندارد!</h4>
                <p className="text-xs text-slate-500">
                  تمامی واریزهای کارت به کارت کاربران بررسی و تایید شده‌اند.
                </p>
              </div>
            ) : (
              pendingPayments.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-3xl p-6 border-2 border-emerald-300 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                      <img
                        src={req.bookCover}
                        alt={req.bookTitle}
                        className="w-12 h-16 rounded-xl object-cover shadow-xs shrink-0"
                      />
                      <div>
                        <h4 className="font-black text-slate-900 text-base">{req.bookTitle}</h4>
                        <p className="text-xs text-slate-600 font-bold mt-1">
                          امانت‌گیرنده: <span className="text-cyan-700">{req.borrowerName}</span> ({req.borrowerClass}) • مالک کتاب: {req.ownerName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => verifyPaymentByAdmin(req.id, true)}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>تایید واریز و تایید نهایی امانت</span>
                      </button>

                      <button
                        onClick={() => {
                          const reason = window.prompt(
                            `لطفاً علت رد فیش پرداخت حق امانت را بنویسید تا به وی در پیام‌رسان بله اطلاع‌رسانی شود:\n(به عنوان مثال: تصویر فیش واضح نیست یا کد پیگیری نادرست است)`,
                            ""
                          );
                          if (reason !== null) {
                            verifyPaymentByAdmin(req.id, false, reason.trim());
                          }
                        }}
                        className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>رد پرداخت</span>
                      </button>
                    </div>
                  </div>

                  {/* Payment Details Box */}
                  <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block">کد پیگیری واریز:</span>
                      <strong className="text-emerald-900 text-sm font-black tracking-wider" dir="ltr">
                        {req.paymentProof?.trackingCode || 'ثبت نشده'}
                      </strong>
                    </div>

                    <div>
                      <span className="text-slate-500 block">تاریخ و زمان واریز:</span>
                      <strong className="text-slate-800 font-bold">
                        {req.paymentProof?.paymentDate || 'ثبت نشده'}
                      </strong>
                    </div>

                    <div>
                      <span className="text-slate-500 block">تاریخ ثبت فیش در سایت:</span>
                      <strong className="text-slate-800 font-bold">
                        {req.paymentProof?.submittedAt || req.createdAt}
                      </strong>
                    </div>

                    {req.paymentProof?.receiptImage && (
                      <div className="sm:col-span-3 pt-2">
                        <span className="text-slate-600 font-bold block mb-1">تصویر فیش واریزی بارگذاری‌شده:</span>
                        <img
                          src={req.paymentProof.receiptImage}
                          alt="تصویر فیش واریزی"
                          className="max-h-48 rounded-xl border border-emerald-300 shadow-sm object-contain bg-white p-1"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Historical Payments Archive & Stats */}
          <div className="border-t border-slate-200 pt-8 mt-8 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-amber-500" />
                  <span>بایگانی تراکنش‌های مالی و تاریخچه کل فیش‌ها</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  نظارت بر مبالغ دریافتی، فیش‌های تایید شده، رد شده و کل تسویه حساب‌های سامانه
                </p>
              </div>
            </div>

            {/* Financial Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-950">
                <span className="text-[10px] text-emerald-800 block font-semibold">کل مبالغ وصول شده:</span>
                <strong className="text-lg font-black block mt-1">
                  {requests
                    .filter((r) => r.paymentStatus === 'paid')
                    .reduce((sum, r) => sum + (r.feeAmount || 10000), 0)
                    .toLocaleString('fa-IR')}{' '}
                  <span className="text-xs font-normal">تومان</span>
                </strong>
                <span className="text-[9px] text-emerald-700 block mt-0.5">کارمزد امانت‌ کتابخانه</span>
              </div>

              <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 text-sky-950">
                <span className="text-[10px] text-sky-800 block font-semibold">کل فیش‌های تایید شده:</span>
                <strong className="text-lg font-black block mt-1">
                  {requests.filter((r) => r.paymentStatus === 'paid').length.toLocaleString('fa-IR')}{' '}
                  <span className="text-xs font-normal">مورد</span>
                </strong>
                <span className="text-[9px] text-sky-700 block mt-0.5">ثبت نهایی امانت‌ها</span>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-950">
                <span className="text-[10px] text-amber-800 block font-semibold">فیش‌های معوقه (فعلی):</span>
                <strong className="text-lg font-black block mt-1">
                  {requests.filter((r) => r.status === 'payment_proof_submitted').length.toLocaleString('fa-IR')}{' '}
                  <span className="text-xs font-normal">مورد</span>
                </strong>
                <span className="text-[9px] text-amber-700 block mt-0.5">در انتظار تایید مدیریت</span>
              </div>

              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-950">
                <span className="text-[10px] text-rose-800 block font-semibold">فیش‌های رد شده:</span>
                <strong className="text-lg font-black block mt-1">
                  {requests.filter((r) => r.paymentStatus === 'rejected').length.toLocaleString('fa-IR')}{' '}
                  <span className="text-xs font-normal">مورد</span>
                </strong>
                <span className="text-[9px] text-rose-700 block mt-0.5">اطلاعات نادرست/نامعتبر</span>
              </div>
            </div>

            {/* Search & Filter Controls for Payments Archive */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
              {/* Search input */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                <input
                  type="text"
                  placeholder="جستجو در امانت‌گیرنده، نام کتاب یا کد پیگیری..."
                  value={paymentSearch}
                  onChange={(e) => setPaymentSearch(e.target.value)}
                  className="w-full text-xs pr-9 pl-3 py-3 bg-white border border-slate-300 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Filter Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
                <span className="text-[11px] text-slate-500 font-bold ml-1">وضعیت پرداخت:</span>
                {(['all', 'paid', 'rejected', 'proof_submitted'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setPaymentFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition cursor-pointer ${
                      paymentFilter === filter
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {filter === 'all' && 'همه رکوردها'}
                    {filter === 'paid' && 'تایید شده ✅'}
                    {filter === 'rejected' && 'رد شده ❌'}
                    {filter === 'proof_submitted' && 'در انتظار تایید ⏳'}
                  </button>
                ))}
              </div>
            </div>

            {/* Payments List Container */}
            <div className="space-y-3">
              {(() => {
                const allPaymentReqs = requests.filter(
                  (r) => r.paymentProof !== undefined || r.paymentStatus !== undefined
                );
                const sortedPayments = [...allPaymentReqs].sort(
                  (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                const filteredPayments = sortedPayments.filter((req) => {
                  const matchesStatus =
                    paymentFilter === 'all' ||
                    (paymentFilter === 'paid' && req.paymentStatus === 'paid') ||
                    (paymentFilter === 'rejected' && req.paymentStatus === 'rejected') ||
                    (paymentFilter === 'proof_submitted' &&
                      (req.paymentStatus === 'proof_submitted' || req.status === 'payment_proof_submitted'));

                  const term = paymentSearch.trim().toLowerCase();
                  const matchesSearch =
                    !term ||
                    req.bookTitle.toLowerCase().includes(term) ||
                    req.borrowerName.toLowerCase().includes(term) ||
                    req.ownerName.toLowerCase().includes(term) ||
                    (req.paymentProof?.trackingCode &&
                      req.paymentProof.trackingCode.toLowerCase().includes(term));

                  return matchesStatus && matchesSearch;
                });

                if (filteredPayments.length === 0) {
                  return (
                    <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 text-xs text-slate-400">
                      هیچ فیش یا تراکنش مالی منطبق با فیلتر شما در سیستم یافت نشد.
                    </div>
                  );
                }

                return filteredPayments.map((req) => (
                  <div
                    key={req.id + '-archive'}
                    className="bg-white rounded-2xl p-4 border border-slate-200 shadow-3xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={req.bookCover}
                        alt={req.bookTitle}
                        className="w-9 h-12 rounded-lg object-cover shadow-3xs shrink-0"
                      />
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs">{req.bookTitle}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          توسط: <span className="text-cyan-800 font-bold">{req.borrowerName}</span> (کلاس {req.borrowerClass}) 
                          • مالک: {req.ownerName}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-[10px] bg-slate-50 p-2.5 rounded-xl border border-slate-150 flex-1 max-w-xl">
                      <div>
                        <span className="text-slate-400">کد پیگیری:</span>
                        <span className="font-mono text-slate-800 block font-bold" dir="ltr">
                          {req.paymentProof?.trackingCode || 'ثبت‌نشده'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">تاریخ واریز:</span>
                        <span className="text-slate-800 block font-semibold">
                          {req.paymentProof?.paymentDate || 'ثبت‌نشده'}
                        </span>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-slate-400">مبلغ واریزی:</span>
                        <span className="text-emerald-700 block font-black">
                          {(req.feeAmount || 10000).toLocaleString('fa-IR')} تومان
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {req.paymentProof?.receiptImage && (
                        <button
                          onClick={() => {
                            const w = window.open();
                            if (w && req.paymentProof?.receiptImage) {
                              w.document.write(`<img src="${req.paymentProof.receiptImage}" style="max-width:100%; max-height:100vh; display:block; margin:auto;"/>`);
                            } else {
                              alert('تصویر فیش باز نشد. مرورگر شما پاپ‌آپ را مسدود کرده است.');
                            }
                          }}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          مشاهده تصویر فیش
                        </button>
                      )}

                      <span
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black ${
                          req.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : req.paymentStatus === 'rejected'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {req.paymentStatus === 'paid' && 'تایید شده ✅'}
                        {req.paymentStatus === 'rejected' && 'رد صلاحیت شده ❌'}
                        {req.paymentStatus === 'proof_submitted' && 'معلق (جدید) ⏳'}
                        {!req.paymentStatus && 'پرداخت‌نشده ⛔'}
                      </span>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Comprehensive Lending & Exchange History */}
      {activeTab === 'lending_history' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <ArrowLeftRight className="w-5 h-5 text-indigo-600" />
                  <span>دفتر اسناد و بایگانی جامع امانات کتاب</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  نظارت بر تمامی کتاب‌های امانت داده شده، امانت‌های فعال، مهلت تحویل، بازگشت‌ها و تاخیرها
                </p>
              </div>
            </div>

            {/* Lending Statistics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900">
                <span className="text-[10px] text-slate-500 block font-semibold">کل بده‌بستان‌های ثبت شده:</span>
                <strong className="text-2xl font-black block mt-1 text-slate-800">
                  {requests.length.toLocaleString('fa-IR')}{' '}
                  <span className="text-xs font-normal text-slate-500">تراکنش</span>
                </strong>
                <span className="text-[9px] text-slate-400 block mt-0.5">آمار تجمعی کل تاریخ مدرسه</span>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-950">
                <span className="text-[10px] text-amber-800 block font-semibold">امانت‌های فعال (دست دانش‌آموز):</span>
                <strong className="text-2xl font-black block mt-1 text-amber-900">
                  {requests.filter((r) => r.status === 'handover_confirmed').length.toLocaleString('fa-IR')}{' '}
                  <span className="text-xs font-normal text-amber-700">جلد کتاب</span>
                </strong>
                <span className="text-[9px] text-amber-600 block mt-0.5">در خارج از کتابخانه</span>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-950">
                <span className="text-[10px] text-emerald-800 block font-semibold">کتاب‌های عودت داده شده:</span>
                <strong className="text-2xl font-black block mt-1 text-emerald-900">
                  {requests.filter((r) => r.status === 'returned').length.toLocaleString('fa-IR')}{' '}
                  <span className="text-xs font-normal text-emerald-700">جلد کتاب</span>
                </strong>
                <span className="text-[9px] text-emerald-600 block mt-0.5">بازگشت موفقیت‌آمیز به مالک</span>
              </div>

              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-950">
                <span className="text-[10px] text-rose-800 block font-semibold">کتاب‌های دارای تاخیر/دیرکرد:</span>
                <strong className="text-2xl font-black block mt-1 text-rose-900">
                  {requests
                    .filter(
                      (r) =>
                        r.status === 'handover_confirmed' &&
                        r.dueDate &&
                        new Date(r.dueDate).getTime() < new Date().getTime()
                    )
                    .length.toLocaleString('fa-IR')}{' '}
                  <span className="text-xs font-normal text-rose-700">جلد کتاب</span>
                </strong>
                <span className="text-[9px] text-rose-600 block mt-0.5">نیازمند پیگیری تلفنی</span>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
              {/* Search bar */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                <input
                  type="text"
                  placeholder="جستجو بر اساس کتاب، مالک یا امانت‌گیرنده..."
                  value={lendingSearch}
                  onChange={(e) => setLendingSearch(e.target.value)}
                  className="w-full text-xs pr-9 pl-3 py-3 bg-white border border-slate-300 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
                <span className="text-[11px] text-slate-500 font-bold ml-1">فیلتر وضعیت امانت:</span>
                {[
                  { value: 'all', label: 'همه موارد' },
                  { value: 'active', label: 'امانت‌های فعال 📖' },
                  { value: 'returned', label: 'عودت شده‌ها ✅' },
                  { value: 'pending', label: 'در انتظار تایید اولیه ⏳' },
                  { value: 'rejected', label: 'رد شده/لغو شده ❌' }
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setLendingFilter(item.value)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition cursor-pointer ${
                      lendingFilter === item.value
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lending Records Cards List */}
            <div className="space-y-4">
              {(() => {
                const sortedRequests = [...requests].sort(
                  (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );

                const filteredLendings = sortedRequests.filter((req) => {
                  const matchesStatus =
                    lendingFilter === 'all' ||
                    (lendingFilter === 'active' && req.status === 'handover_confirmed') ||
                    (lendingFilter === 'returned' && req.status === 'returned') ||
                    (lendingFilter === 'pending' && (req.status === 'pending' || req.status === 'accepted')) ||
                    (lendingFilter === 'rejected' && req.status === 'rejected');

                  const term = lendingSearch.trim().toLowerCase();
                  const matchesSearch =
                    !term ||
                    req.bookTitle.toLowerCase().includes(term) ||
                    req.borrowerName.toLowerCase().includes(term) ||
                    req.ownerName.toLowerCase().includes(term) ||
                    req.borrowerClass.toLowerCase().includes(term) ||
                    req.ownerClass.toLowerCase().includes(term);

                  return matchesStatus && matchesSearch;
                });

                if (filteredLendings.length === 0) {
                  return (
                    <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-xs text-slate-400">
                      هیچ پرونده امانتی منطبق با جستجو و فیلترهای بالا یافت نشد.
                    </div>
                  );
                }

                return filteredLendings.map((req) => {
                  const isOverdue =
                    req.status === 'handover_confirmed' &&
                    req.dueDate &&
                    new Date(req.dueDate).getTime() < new Date().getTime();

                  return (
                    <div
                      key={req.id}
                      className={`bg-white rounded-2xl p-5 border shadow-3xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:border-slate-300 ${
                        isOverdue ? 'border-rose-300 bg-rose-50/10' : 'border-slate-200'
                      }`}
                    >
                      {/* Left: Book & People Details */}
                      <div className="flex items-start gap-4">
                        <img
                          src={req.bookCover}
                          alt={req.bookTitle}
                          className="w-12 h-16 rounded-xl object-cover shadow-sm shrink-0 border border-slate-100"
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-black text-slate-900 text-sm">{req.bookTitle}</h4>
                            
                            {isOverdue && (
                              <span className="bg-rose-100 text-rose-800 text-[9px] px-2 py-0.5 rounded-md font-bold border border-rose-200 animate-pulse">
                                ⚠️ دیرکرد تحویل
                              </span>
                            )}
                          </div>
                          
                          <div className="text-[11px] text-slate-600 font-bold space-y-0.5">
                            <p>
                              امانت‌گیرنده:{' '}
                              <span className="text-indigo-700">{req.borrowerName}</span> (کلاس{' '}
                              {req.borrowerClass}) •{' '}
                              <span className="text-slate-400 font-normal">شماره همراه:</span>{' '}
                              <strong className="text-slate-800 font-mono text-[10px]" dir="ltr">
                                {req.borrowerPhone || 'نامشخص'}
                              </strong>
                            </p>
                            <p>
                              مالک کتاب:{' '}
                              <span className="text-cyan-700">{req.ownerName}</span> (کلاس{' '}
                              {req.ownerClass})
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Timeline & Dates */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] bg-slate-50 p-3 rounded-xl border border-slate-150 flex-1 max-w-lg md:mx-4">
                        <div>
                          <span className="text-slate-400 block">تاریخ درخواست:</span>
                          <span className="text-slate-800 font-bold">
                            {new Date(req.createdAt).toLocaleDateString('fa-IR')}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">وضعیت پرداخت:</span>
                          <span
                            className={`font-black ${
                              req.paymentStatus === 'paid'
                                ? 'text-emerald-700'
                                : req.paymentStatus === 'rejected'
                                ? 'text-rose-700'
                                : 'text-amber-700'
                            }`}
                          >
                            {req.paymentStatus === 'paid'
                              ? 'تایید شده (۱۰,۰۰۰ تومان)'
                              : req.paymentStatus === 'rejected'
                              ? 'فیش رد شده'
                              : req.paymentStatus === 'proof_submitted'
                              ? 'در انتظار بررسی فیش'
                              : 'پرداخت‌نشده'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">تاریخ تحویل فیزیکی:</span>
                          <span className="text-slate-800 font-semibold">
                            {req.handoverConfirmedAt
                              ? new Date(req.handoverConfirmedAt).toLocaleDateString('fa-IR')
                              : 'هنوز تحویل داده نشده'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">مهلت عودت کتاب:</span>
                          <span
                            className={`font-bold block ${
                              isOverdue ? 'text-rose-600' : 'text-slate-800'
                            }`}
                          >
                            {req.dueDate
                              ? new Date(req.dueDate).toLocaleDateString('fa-IR')
                              : 'تعیین‌نشده'}
                          </span>
                        </div>
                      </div>

                      {/* Right: Actions / Status Badge */}
                      <div className="shrink-0 flex items-center gap-2">
                        <span
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-black border ${
                            req.status === 'returned'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : req.status === 'handover_confirmed'
                              ? isOverdue
                                ? 'bg-rose-100 text-rose-800 border-rose-300 shadow-xs'
                                : 'bg-amber-100 text-amber-800 border-amber-200'
                              : req.status === 'rejected'
                              ? 'bg-slate-100 text-slate-700 border-slate-200'
                              : 'bg-indigo-100 text-indigo-800 border-indigo-200'
                          }`}
                        >
                          {req.status === 'pending' && 'در انتظار پذیرش مالک ⏳'}
                          {req.status === 'accepted' && 'پذیرفته شده / منتظر پرداخت 💳'}
                          {req.status === 'payment_pending' && 'در انتظار ارسال فیش 💳'}
                          {req.status === 'payment_proof_submitted' && 'بررسی فیش توسط مدیر 📁'}
                          {req.status === 'payment_completed' && 'آماده تحویل فیزیکی 📦'}
                          {req.status === 'handover_confirmed' &&
                            (isOverdue ? '⚠️ دارای دیرکرد در عودت' : '📖 در دست امانت فعال')}
                          {req.status === 'returned' && 'بازگردانده شد به مالک ✅'}
                          {req.status === 'rejected' && 'لغو شده / رد شده ❌'}
                        </span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Reviews, Confidential Feedbacks & Damage Reports */}
      {activeTab === 'reviews_feedbacks' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-lg">
                  مدیریت نظرات کتاب‌ها، بازخوردهای محرمانه و گزارش‌های آسیب
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  مشاهده، نظارت و حذف نظرات ثبت‌شده کاربران به همراه بررسی گزارش‌های خسارت و نظرات محرمانه
                </p>
              </div>
            </div>

            {/* Sub Tabs */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 gap-1">
              <button
                type="button"
                onClick={() => setReviewsSubTab('book_reviews')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  reviewsSubTab === 'book_reviews'
                    ? 'bg-white text-indigo-900 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>
                  نظرات کتاب‌ها (
                  {books.reduce((acc, b) => acc + (b.reviews?.length || 0), 0)}
                  )
                </span>
              </button>

              <button
                type="button"
                onClick={() => setReviewsSubTab('user_feedbacks')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  reviewsSubTab === 'user_feedbacks'
                    ? 'bg-white text-indigo-900 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>
                  بازخوردهای امانت & گزارش آسیب (
                  {requests.filter((r) => r.feedbackForOwner || r.feedbackForBorrower || r.damageReason).length}
                  )
                </span>
              </button>
            </div>
          </div>

          {/* Sub Tab 1: Book Reviews */}
          {reviewsSubTab === 'book_reviews' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                  <span>فهرست کل نظرات و امتیازات ثبت‌شده برای کتب مدرسه:</span>
                </h4>

                <div className="relative w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={reviewSearch}
                    onChange={(e) => setReviewSearch(e.target.value)}
                    placeholder="جستجو در نظرات، نام کتاب یا نویسنده..."
                    className="w-full text-xs pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {(() => {
                const allBookReviews = books.flatMap((b) =>
                  (b.reviews || []).map((r) => ({
                    ...r,
                    bookId: b.id,
                    bookTitle: b.title,
                    bookCover: b.coverImage,
                    bookCategory: b.category,
                    bookOwner: b.ownerName
                  }))
                );

                const filtered = allBookReviews.filter(
                  (r) =>
                    !reviewSearch ||
                    r.bookTitle.includes(reviewSearch) ||
                    r.userName.includes(reviewSearch) ||
                    r.comment.includes(reviewSearch)
                );

                if (filtered.length === 0) {
                  return (
                    <div className="p-12 text-center text-slate-400 space-y-2">
                      <MessageSquare className="w-10 h-10 mx-auto text-slate-300" />
                      <p className="text-xs font-bold">هیچ نظری یافت نشد.</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.map((rev) => (
                      <div
                        key={`${rev.bookId}-${rev.id}`}
                        className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 shadow-2xs hover:border-indigo-300 transition"
                      >
                        {/* Book header */}
                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={rev.bookCover}
                              alt={rev.bookTitle}
                              className="w-9 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                            <div>
                              <h5 className="font-black text-xs text-slate-900 line-clamp-1">
                                {rev.bookTitle}
                              </h5>
                              <span className="text-[10px] text-slate-500 block">
                                مالک: {rev.bookOwner} • دسته‌بندی: {rev.bookCategory}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`آیا از حذف این نظر توسط «${rev.userName}» اطمینان دارید؟`)) {
                                deleteBookReview(rev.bookId, rev.id);
                              }
                            }}
                            className="p-1.5 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl border border-slate-200 hover:border-rose-200 transition shadow-2xs flex items-center gap-1 text-[11px] font-bold"
                            title="حذف نظر توسط مدیر"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف نظر</span>
                          </button>
                        </div>

                        {/* Reviewer info and comment */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img
                              src={rev.userAvatar}
                              alt={rev.userName}
                              className="w-7 h-7 rounded-full object-cover border border-slate-200"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800">
                                {rev.userName}
                              </span>
                              <span className="text-[10px] text-slate-500 mr-1.5">
                                (کلاس {rev.userClass})
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-amber-500 text-xs font-black">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{rev.rating} از ۵</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed font-medium bg-white p-3 rounded-xl border border-slate-200">
                          {rev.comment}
                        </p>

                        <div className="text-[10px] text-slate-400 text-left dir-ltr">
                          {rev.date}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Sub Tab 2: Mutual Feedbacks, Confidential Comments & Damage Reports */}
          {reviewsSubTab === 'user_feedbacks' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>بازخوردهای امانت، نظرات محرمانه و گزارش‌های آسیب کاربران:</span>
                </h4>

                <div className="relative w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={reviewSearch}
                    onChange={(e) => setReviewSearch(e.target.value)}
                    placeholder="جستجو در نام کاربر، کتاب یا شرح آسیب..."
                    className="w-full text-xs pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {(() => {
                const feedbackItems: Array<{
                  requestId: string;
                  bookTitle: string;
                  bookCover: string;
                  evaluatorRole: 'borrower' | 'owner';
                  evaluatorName: string;
                  evaluatorClass: string;
                  targetRole: 'owner' | 'borrower';
                  targetName: string;
                  targetClass: string;
                  feedback: any;
                  damageReason?: string;
                  damagePhotoUrl?: string;
                }> = [];

                requests.forEach((req) => {
                  if (req.feedbackForOwner) {
                    feedbackItems.push({
                      requestId: req.id,
                      bookTitle: req.bookTitle,
                      bookCover: req.bookCover,
                      evaluatorRole: 'borrower',
                      evaluatorName: req.borrowerName,
                      evaluatorClass: req.borrowerClass,
                      targetRole: 'owner',
                      targetName: req.ownerName,
                      targetClass: req.ownerClass,
                      feedback: req.feedbackForOwner,
                      damageReason: req.feedbackForOwner.damageDescription,
                      damagePhotoUrl: req.feedbackForOwner.damagePhotoUrl
                    });
                  }

                  if (req.feedbackForBorrower) {
                    feedbackItems.push({
                      requestId: req.id,
                      bookTitle: req.bookTitle,
                      bookCover: req.bookCover,
                      evaluatorRole: 'owner',
                      evaluatorName: req.ownerName,
                      evaluatorClass: req.ownerClass,
                      targetRole: 'borrower',
                      targetName: req.borrowerName,
                      targetClass: req.borrowerClass,
                      feedback: req.feedbackForBorrower,
                      damageReason: req.feedbackForBorrower.damageDescription || req.damageReason,
                      damagePhotoUrl: req.feedbackForBorrower.damagePhotoUrl || req.damagePhotoUrl
                    });
                  } else if (req.damageReason) {
                    // Solo damage report without full feedback
                    feedbackItems.push({
                      requestId: req.id,
                      bookTitle: req.bookTitle,
                      bookCover: req.bookCover,
                      evaluatorRole: 'owner',
                      evaluatorName: req.ownerName,
                      evaluatorClass: req.ownerClass,
                      targetRole: 'borrower',
                      targetName: req.borrowerName,
                      targetClass: req.borrowerClass,
                      feedback: {
                        punctuality: 1,
                        condition: 1,
                        behavior: 3,
                        reliability: 1,
                        comment: 'گزارش خسارت فیزیکی وارده به کتاب',
                        isDamaged: true,
                        damageDescription: req.damageReason,
                        damagePhotoUrl: req.damagePhotoUrl
                      },
                      damageReason: req.damageReason,
                      damagePhotoUrl: req.damagePhotoUrl
                    });
                  }
                });

                const filtered = feedbackItems.filter(
                  (item) =>
                    !reviewSearch ||
                    item.bookTitle.includes(reviewSearch) ||
                    item.evaluatorName.includes(reviewSearch) ||
                    item.targetName.includes(reviewSearch) ||
                    (item.feedback.comment && item.feedback.comment.includes(reviewSearch)) ||
                    (item.damageReason && item.damageReason.includes(reviewSearch))
                );

                if (filtered.length === 0) {
                  return (
                    <div className="p-12 text-center text-slate-400 space-y-2">
                      <ShieldCheck className="w-10 h-10 mx-auto text-slate-300" />
                      <p className="text-xs font-bold">هیچ بازخورد یا گزارش آسیبی ثبت نشده است.</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {filtered.map((item, idx) => (
                      <div
                        key={`${item.requestId}-${item.targetRole}-${idx}`}
                        className={`p-5 rounded-3xl border transition-all ${
                          item.feedback.isDamaged || item.damageReason
                            ? 'bg-rose-50/40 border-rose-300 shadow-sm'
                            : item.feedback.isConfidentialToAdmin
                            ? 'bg-amber-50/40 border-amber-300 shadow-sm'
                            : 'bg-slate-50 border-slate-200'
                        } space-y-3`}
                      >
                        {/* Top bar: parties & badges */}
                        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-200/80">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.bookCover}
                              alt={item.bookTitle}
                              className="w-10 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-black text-slate-900">
                                  {item.evaluatorName} ({item.evaluatorRole === 'borrower' ? 'امانت‌گیرنده' : 'مالک'})
                                </span>
                                <span className="text-slate-400 text-xs">➔ درباره</span>
                                <span className="text-xs font-black text-indigo-900">
                                  {item.targetName} ({item.targetRole === 'owner' ? 'مالک' : 'امانت‌گیرنده'})
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                کتاب: «{item.bookTitle}» • شناسه درخواست: #{item.requestId}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {item.feedback.isConfidentialToAdmin && (
                              <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs">
                                <Lock className="w-3 h-3 text-amber-700" />
                                <span>نظر محرمانه مدیر (پنهان از کاربر)</span>
                              </span>
                            )}

                            {(item.feedback.isDamaged || item.damageReason) && (
                              <span className="bg-rose-100 text-rose-900 border border-rose-300 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs animate-pulse">
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                <span>گزارش آسیب دیدگی کتاب</span>
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                if (confirm('آیا از حذف این بازخورد اطمینان دارید؟')) {
                                  deleteFeedback(item.requestId, item.targetRole);
                                }
                              }}
                              className="p-1.5 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl border border-slate-200 hover:border-rose-200 transition shadow-2xs flex items-center gap-1 text-[11px] font-bold"
                              title="حذف این ارزیابی توسط مدیر"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>حذف بازخورد</span>
                            </button>
                          </div>
                        </div>

                        {/* Scores breakdown */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                          <div className="p-2 bg-white rounded-xl border border-slate-200">
                            <span className="text-[10px] text-slate-500 block">⏰ تحویل به موقع</span>
                            <span className="font-extrabold text-indigo-700">
                              {item.feedback.punctuality || 5} از ۵
                            </span>
                          </div>
                          <div className="p-2 bg-white rounded-xl border border-slate-200">
                            <span className="text-[10px] text-slate-500 block">✨ تمیزی و سلامت</span>
                            <span className="font-extrabold text-indigo-700">
                              {item.feedback.condition || 5} از ۵
                            </span>
                          </div>
                          <div className="p-2 bg-white rounded-xl border border-slate-200">
                            <span className="text-[10px] text-slate-500 block">😊 ادب و رفتار</span>
                            <span className="font-extrabold text-indigo-700">
                              {item.feedback.behavior || 5} از ۵
                            </span>
                          </div>
                          <div className="p-2 bg-white rounded-xl border border-slate-200">
                            <span className="text-[10px] text-slate-500 block">🤝 خوش‌قولی و اعتماد</span>
                            <span className="font-extrabold text-indigo-700">
                              {item.feedback.reliability || 5} از ۵
                            </span>
                          </div>
                        </div>

                        {/* Comment text */}
                        {item.feedback.comment && (
                          <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 block">
                              {item.feedback.isConfidentialToAdmin
                                ? '🔒 متن نظر محرمانه (فقط قابل مشاهده توسط شما به عنوان مدیر):'
                                : '💬 متن نظر و بازخورد:'}
                            </span>
                            <p className="text-xs text-slate-800 font-medium leading-relaxed">
                              {item.feedback.comment}
                            </p>
                          </div>
                        )}

                        {/* Damage Report Section with Photo */}
                        {(item.feedback.isDamaged || item.damageReason) && (
                          <div className="p-4 bg-rose-100/70 border border-rose-300 rounded-2xl space-y-2.5">
                            <div className="flex items-center gap-1.5 text-rose-900 font-black text-xs">
                              <AlertTriangle className="w-4 h-4 text-rose-600" />
                              <span>جزئیات آسیب گزارش‌شده به کتاب:</span>
                            </div>

                            <p className="text-xs text-rose-950 font-bold leading-relaxed bg-white p-2.5 rounded-xl border border-rose-200">
                              {item.damageReason || item.feedback.damageDescription || 'عدم اعلام شرح تکمیلی'}
                            </p>

                            {(item.damagePhotoUrl || item.feedback.damagePhotoUrl) && (
                              <div className="space-y-1 pt-1">
                                <span className="text-[10px] font-bold text-rose-900 block">
                                  📸 عکس مستند از آسیب کتاب:
                                </span>
                                <div className="inline-block relative rounded-xl overflow-hidden border-2 border-rose-400 shadow-md">
                                  <a
                                    href={item.damagePhotoUrl || item.feedback.damagePhotoUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block group"
                                  >
                                    <img
                                      src={item.damagePhotoUrl || item.feedback.damagePhotoUrl}
                                      alt="عکس آسیب کتاب"
                                      className="max-h-48 rounded-lg object-contain group-hover:opacity-90 transition cursor-pointer"
                                    />
                                    <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-2 py-0.5 rounded-md font-bold">
                                      کلیک جهت مشاهده تصویر در اندازه کامل ↗
                                    </span>
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Tab: System Settings & Rules */}
      {activeTab === 'system_settings' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                <Sliders className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-lg">قوانین و تنظیمات پلتفرم مکتب‌خانه</h3>
                <p className="text-xs text-slate-500 font-medium">
                  مدیریت شرایط ثبت‌نام اعضا، سهمیه کتاب‌های اولیه، قوانین امانت‌گیری و زمان‌بندی‌ها
                </p>
              </div>
            </div>

            {configSaveMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{configSaveMsg}</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-6">
            {/* Section 1: Registration Rules */}
            <div className="space-y-4">
              <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>قوانین ثبت‌نام و عضویت دانش‌آموزان:</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-black text-slate-700">
                    حداقل تعداد کتاب برای ثبت‌نام (جلد):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={minBooksForReg}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setMinBooksForReg(isNaN(val) ? 0 : Math.max(0, val));
                    }}
                    className="w-full text-sm p-3 bg-white border border-slate-300 rounded-xl font-black text-indigo-700 text-center"
                    required
                  />
                  <p className="text-[11px] text-slate-500 font-medium">
                    تعداد کتاب اجباری برای عضویت (اگر روی ۰ تنظیم شود، ثبت‌نام بدون افزودن کتاب ممکن می‌شود).
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-black text-slate-700">
                    حداکثر سقف معرفی کتاب در ثبت‌نام:
                  </label>
                  <input
                    type="number"
                    min={minBooksForReg}
                    max="50"
                    value={maxBooksForReg}
                    onChange={(e) => setMaxBooksForReg(parseInt(e.target.value) || minBooksForReg)}
                    className="w-full text-sm p-3 bg-white border border-slate-300 rounded-xl font-black text-indigo-700 text-center"
                    required
                  />
                  <p className="text-[11px] text-slate-500 font-medium">
                    حداکثر تعداد کتابی که در فرم ثبت‌نام اولیه قابل اضافه کردن است.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-black text-slate-700">
                    نیاز به تایید مدیر برای فعال‌سازی حساب:
                  </label>
                  <div className="pt-2 flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="requireApproval"
                        checked={reqAdminApproval === true}
                        onChange={() => setReqAdminApproval(true)}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <span className="text-xs font-bold text-slate-800">بله (در انتظار تایید)</span>
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="requireApproval"
                        checked={reqAdminApproval === false}
                        onChange={() => setReqAdminApproval(false)}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <span className="text-xs font-bold text-slate-800">خیر (فعال‌سازی فوری)</span>
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    در حالت بله، تا زمان بررسی کارت و کتب توسط مدیر، حساب در وضعیت Pending می‌ماند.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2: Lending & Fee Rules */}
            <div className="space-y-4 pt-2">
              <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-600" />
                <span>قوانین امانت‌دهی، مبلغ و بازه‌های زمانی:</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-black text-slate-700">
                    مبلغ حق امانت کتاب (تومان):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={loanFee}
                    onChange={(e) => setLoanFee(parseInt(e.target.value) || 0)}
                    className="w-full text-sm p-3 bg-white border border-slate-300 rounded-xl font-black text-emerald-700 text-center"
                    required
                  />
                  <p className="text-[11px] text-slate-500 font-medium">
                    مبلغ واریزی به شماره کارت مکتب‌خانه بابت هر بار امانت کتاب.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-black text-slate-700">
                    مدت مجاز امانت کتاب (روز):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={loanDuration}
                    onChange={(e) => setLoanDuration(parseInt(e.target.value) || 7)}
                    className="w-full text-sm p-3 bg-white border border-slate-300 rounded-xl font-black text-indigo-700 text-center"
                    required
                  />
                  <p className="text-[11px] text-slate-500 font-medium">
                    فرصت دانش‌آموز برای خواندن و بازگرداندن کتاب به مالک.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-black text-slate-700">
                    مهلت ثبت فیش واریزی (ساعت):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="48"
                    value={paymentHours}
                    onChange={(e) => setPaymentHours(parseInt(e.target.value) || 3)}
                    className="w-full text-sm p-3 bg-white border border-slate-300 rounded-xl font-black text-indigo-700 text-center"
                    required
                  />
                  <p className="text-[11px] text-slate-500 font-medium">
                    مهلت امانت‌گیرنده پس از تایید مالک برای کارت به کارت و ثبت فیش.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-black text-slate-700">
                    مهلت هماهنگی تحویل حضوری (ساعت):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="72"
                    value={handoverHours}
                    onChange={(e) => setHandoverHours(parseInt(e.target.value) || 12)}
                    className="w-full text-sm p-3 bg-white border border-slate-300 rounded-xl font-black text-indigo-700 text-center"
                    required
                  />
                  <p className="text-[11px] text-slate-500 font-medium">
                    مهلت تحویل فیزیکی کتاب در شیفت مدرسه یا آدرس منزل.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 3: Bale Channel Integration */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <Send className="w-4 h-4 text-sky-600" />
                  <span>اتصال به کانال پیام‌رسان بله و انتشار خودکار کتب:</span>
                </h4>
                <span className="px-3 py-1 bg-sky-50 text-sky-700 text-[11px] font-bold rounded-lg border border-sky-200 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-sky-500 animate-pulse" />
                  <span>بازوی رسمی: @Maktabkunebot</span>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-black text-slate-700">
                    آیدی یا نام کاربری کانال بله:
                  </label>
                  <input
                    type="text"
                    value={baleChannelUsername}
                    onChange={(e) => setBaleChannelUsername(e.target.value)}
                    placeholder="@maktabkhune_books"
                    dir="ltr"
                    className="w-full text-sm p-3 bg-white border border-slate-300 rounded-xl font-bold text-sky-700 text-center placeholder:text-slate-400"
                  />
                  <p className="text-[11px] text-slate-500 font-medium">
                    نام کاربری عمومی کانال (همراه با @) یا شناسه عددی چت کانال.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-black text-slate-700">
                    انتشار خودکار کتاب‌های جدید:
                  </label>
                  <div className="pt-2 flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="autoPublishBooks"
                        checked={autoPublishBooks === true}
                        onChange={() => setAutoPublishBooks(true)}
                        className="w-4 h-4 text-sky-600"
                      />
                      <span className="text-xs font-bold text-slate-800">فعال (انتشار فوری)</span>
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="autoPublishBooks"
                        checked={autoPublishBooks === false}
                        onChange={() => setAutoPublishBooks(false)}
                        className="w-4 h-4 text-sky-600"
                      />
                      <span className="text-xs font-bold text-slate-800">غیرفعال (دستی)</span>
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    بلافاصله پس از ثبت هر کتاب در سایت، پست معرفی آن در کانال منتشر شود.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-black text-slate-700">
                    آدرس دامنه سایت (جهت دکمه شیشه‌ای لینک‌دار):
                  </label>
                  <input
                    type="url"
                    value={websiteBaseUrl}
                    onChange={(e) => setWebsiteBaseUrl(e.target.value)}
                    placeholder="https://mysite.ir"
                    dir="ltr"
                    className="w-full text-xs p-3 bg-white border border-slate-300 rounded-xl font-medium text-slate-700 placeholder:text-slate-400 text-left"
                  />
                  <p className="text-[11px] text-slate-500 font-medium">
                    آدرس پایه سامانه که کاربر را از دکمه تلگرام/بله مستقیماً به صفحه کتاب می‌برد.
                  </p>
                </div>
              </div>

              {/* Channel Action Controls */}
              <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <span className="text-xs font-black text-sky-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-sky-600" />
                    <span>عملیات و ابزارهای مدیریت کانال:</span>
                  </span>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleTestChannel}
                      disabled={isTestingChannel || !baleChannelUsername.trim()}
                      className="px-4 py-2 bg-white hover:bg-sky-100 text-sky-800 font-bold text-xs rounded-xl border border-sky-300 transition flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      <Radio className={`w-4 h-4 ${isTestingChannel ? 'animate-spin' : 'text-sky-600'}`} />
                      <span>{isTestingChannel ? 'در حال ارسال تست...' : 'ارسال پیام آزمایشی به کانال'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePublishAllBooks}
                      disabled={isPublishingAll || books.length === 0}
                      className="px-4 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <Share2 className={`w-4 h-4 ${isPublishingAll ? 'animate-spin' : ''}`} />
                      <span>{isPublishingAll ? 'در حال انتشار همه کتب...' : `انتشار همگانی همه کتاب‌ها (${books.length} جلد)`}</span>
                    </button>
                  </div>
                </div>

                {channelTestStatus && (
                  <div
                    className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                      channelTestStatus.success
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-rose-100 text-rose-900 border border-rose-300'
                    }`}
                  >
                    {channelTestStatus.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{channelTestStatus.message}</span>
                  </div>
                )}

                {publishAllStatus && (
                  <div
                    className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                      publishAllStatus.success
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{publishAllStatus.message}</span>
                  </div>
                )}

                {/* Step-by-step Setup Guide */}
                <div className="p-3 bg-white/90 rounded-xl border border-sky-100 text-xs text-slate-700 space-y-1.5 font-medium leading-relaxed">
                  <div className="font-bold text-sky-900 flex items-center gap-1 text-[13px]">
                    <HelpCircle className="w-4 h-4 text-sky-600" />
                    <span>راهنمای فعال‌سازی و ارتقای دسترسی بازو در کانال بله:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-600 pr-1 text-[11px]">
                    <li>وارد پیام‌رسان بله و کانال اختصاصی مدرسه/مکتب‌خانه شوید.</li>
                    <li>به بخش <b>«اطلاعات کانال»</b> رفته و بازوی <code>@Maktabkunebot</code> را به عنوان عضو به کانال دعوت کنید.</li>
                    <li>در بخش <b>«مدیران کانال»</b>، بازوی مکتب‌خانه را به عنوان <b>مدیر (Admin)</b> با مجوز <b>«ارسال پیام و رسانه»</b> تعیین کنید.</li>
                    <li>آیدی کانال را در کادر بالا درج کرده و روی دکمه <b>«ارسال پیام آزمایشی»</b> کلیک کنید تا اتصال تایید شود.</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Section 4: Support & Contact Information */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>اطلاعات تماس و پشتیبانی سامانه مکتب‌خانه (نمایش به کاربران):</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-black text-slate-700">
                    نام و سمت مسئول پشتیبانی:
                  </label>
                  <input
                    type="text"
                    value={supportAdminName}
                    onChange={(e) => setSupportAdminName(e.target.value)}
                    placeholder="پارسا فیض (مسئول مکتب‌خانه)"
                    className="w-full text-xs p-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-800"
                    required
                  />
                  <p className="text-[11px] text-slate-500 font-medium">
                    نام مدیر یا رابط مدرسه که در قوانین و بخش پشتیبانی نمایش داده می‌شود.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-black text-slate-700">
                    شماره تلفن تماس مستقیم:
                  </label>
                  <input
                    type="tel"
                    value={supportPhone}
                    onChange={(e) => setSupportPhone(e.target.value)}
                    placeholder="09121112233"
                    dir="ltr"
                    className="w-full text-xs p-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 text-center"
                    required
                  />
                  <p className="text-[11px] text-slate-500 font-medium">
                    جهت تماس اضطراری یا رفع مشکلات امانت و کارت به کارت.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-black text-slate-700">
                    شناسه (آیدی) بله پشتیبان:
                  </label>
                  <input
                    type="text"
                    value={supportBaleId}
                    onChange={(e) => setSupportBaleId(e.target.value)}
                    placeholder="maktabkhune_admin"
                    dir="ltr"
                    className="w-full text-xs p-3 bg-white border border-slate-300 rounded-xl font-bold text-sky-700 text-center"
                    required
                  />
                  <p className="text-[11px] text-slate-500 font-medium">
                    آیدی کاربری مدیر در بله برای گفتگوی مستقیم دانش‌آموزان با پشتیبان.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-black text-slate-700">
                    روزها و ساعات پاسخگویی:
                  </label>
                  <input
                    type="text"
                    value={supportHours}
                    onChange={(e) => setSupportHours(e.target.value)}
                    placeholder="شنبه تا چهارشنبه - ۷:۳۰ الی ۱۴:۰۰"
                    className="w-full text-xs p-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-800"
                    required
                  />
                  <p className="text-[11px] text-slate-500 font-medium">
                    بازه زمانی حضور در مدرسه یا پاسخگویی به پیام‌ها.
                  </p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="submit"
                disabled={isSavingConfig}
                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingConfig ? 'در حال ذخیره‌سازی...' : 'ذخیره و اعمال قوانین در کل سامانه'}</span>
              </button>
            </div>
          </form>

          {/* Section 3: Backup and Restore Database Panel */}
          <div className="border-t border-slate-200 pt-8 mt-8 space-y-6">
            <div>
              <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-600" />
                <span>پشتیبان‌گیری و بازیابی هوشمند کل اطلاعات (دیتابیس):</span>
              </h4>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                از این بخش می‌توانید یک بکاپ جامع از کلیه اطلاعات سامانه (کاربران، کتب، امانت‌ها، کلاس‌ها، لاگ‌ها و تنظیمات) دانلود کرده و در صورت نیاز مجدداً بازیابی کنید.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Backup Card */}
              <div className="p-5 bg-indigo-50/40 border border-indigo-100 rounded-2xl flex flex-col justify-between space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-black text-indigo-950 block">۱. دریافت فایل پشتیبان (بکاپ کامل)</span>
                  <p className="text-[11px] text-indigo-900/80 leading-relaxed font-medium">
                    با کلیک روی دکمه زیر، فایل پشتیبان کاملی با فرمت JSON دریافت خواهید کرد که شامل تمام اطلاعات ثبت شده در کتابخانه مدرسه است. این فایل را در جای امن نگهداری کنید تا به راحتی کل سایت را بازنشانی کنید.
                  </p>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={handleDownloadBackup}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>دانلود بکاپ جامع دیتابیس (.json)</span>
                  </button>
                </div>
              </div>

              {/* Restore Card */}
              <div className="p-5 bg-rose-50/20 border border-rose-100 rounded-2xl flex flex-col justify-between space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-black text-rose-950 block">۲. بازنشانی و بازیابی اطلاعات (Restore)</span>
                  <p className="text-[11px] text-rose-900/80 leading-relaxed font-medium">
                    فایل بکاپ دانلود شده قبلی خود را انتخاب کنید. سامانه به صورت خودکار اطلاعات را اعتبارسنجی کرده و کل وضعیت کتابخانه (اعضا، کلاس‌ها، کتاب‌ها و امانت‌ها) را دقیقاً به همان لحظه بازمی‌گرداند.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <label className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs">
                      <Upload className="w-4 h-4 text-emerald-400" />
                      <span>{isRestoring ? 'در حال بازیابی...' : 'انتخاب و آپلود فایل پشتیبان'}</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleUploadBackup}
                        disabled={isRestoring}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {restoreSuccess && (
                    <p className="text-[11px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 p-2 rounded-xl animate-in fade-in">
                      ✅ پایگاه داده با موفقیت بازنویسی و بازیابی شد. اطلاعات به‌روزرسانی گردید.
                    </p>
                  )}

                  {restoreError && (
                    <p className="text-[11px] font-black text-rose-700 bg-rose-50 border border-rose-200 p-2 rounded-xl animate-in fade-in">
                      ❌ خطا در بازیابی فایل بکاپ: {restoreError}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: School Class Management */}
      {activeTab === 'class_management' && (
        <div className="space-y-6">
          {/* Add New Class Form */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              <span>تعریف کلاس جدید / گزینه «غیره‌یا خارج از مدرسه»:</span>
            </h3>

            <form onSubmit={handleAddClass} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نام دقیق کلاس:</label>
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="مثلاً: کلاس ۱-الف یا ۳-ب"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">پایه تحصیلی:</label>
                <select
                  value={newClassGrade}
                  onChange={(e) => setNewClassGrade(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200/90 rounded-2xl font-black text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition cursor-pointer shadow-2xs hover:border-indigo-400"
                >
                  <option value="پایه اول دبستان" className="py-2 text-slate-900 font-semibold">پایه اول دبستان</option>
                  <option value="پایه دوم دبستان" className="py-2 text-slate-900 font-semibold">پایه دوم دبستان</option>
                  <option value="پایه سوم دبستان" className="py-2 text-slate-900 font-semibold">پایه سوم دبستان</option>
                  <option value="پایه چهارم دبستان" className="py-2 text-slate-900 font-semibold">پایه چهارم دبستان</option>
                  <option value="پایه پنجم دبستان" className="py-2 text-slate-900 font-semibold">پایه پنجم دبستان</option>
                  <option value="پایه ششم دبستان" className="py-2 text-slate-900 font-semibold">پایه ششم دبستان</option>
                  <option value="معلمان و کادر مدرسه" className="py-2 text-slate-900 font-semibold">معلمان و کادر مدرسه</option>
                  <option value="متفرقه / غیره" className="py-2 text-slate-900 font-semibold">متفرقه / غیره</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pb-2">
                <input
                  type="checkbox"
                  id="isExternalCheck"
                  checked={isExternal}
                  onChange={(e) => setIsExternal(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <label htmlFor="isExternalCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                  کلاس غیره / مهمان خارج از مدرسه
                </label>
              </div>

              <button
                type="submit"
                className="py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>افزودن کلاس جدید</span>
              </button>
            </form>
          </div>

          {/* Classes Table */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base">لیست کلاس‌های فعال مدرسه ({schoolClasses.length} کلاس):</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">نام کلاس</th>
                    <th className="p-3">پایه تحصیلی</th>
                    <th className="p-3">نوع کلاس</th>
                    <th className="p-3 text-center">ویرایش / حذف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {schoolClasses.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-bold text-slate-900">
                        {editingId === c.id ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="p-1 border border-indigo-400 rounded-lg text-xs font-bold"
                          />
                        ) : (
                          c.name
                        )}
                      </td>

                      <td className="p-3 text-slate-600">
                        {editingId === c.id ? (
                          <input
                            type="text"
                            value={editGrade}
                            onChange={(e) => setEditGrade(e.target.value)}
                            className="p-1 border border-indigo-400 rounded-lg text-xs font-bold"
                          />
                        ) : (
                          c.grade
                        )}
                      </td>

                      <td className="p-3">
                        {c.isExternal ? (
                          <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            غیره‌یا مهمان خارج مدرسه
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            کلاس رسمی مدرسه
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        {editingId === c.id ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => saveEdit(c.id)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                              title="ذخیره تغییرات"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg"
                              title="انصراف"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => startEdit(c)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                              title="ویرایش نام کلاس"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`آیا از حذف کلاس «${c.name}» مطمئن هستید؟`)) {
                                  deleteSchoolClass(c.id);
                                }
                              }}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="حذف کلاس"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: All Books Management */}
      {activeTab === 'all_books' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <span>فهرست کل کتاب‌های ثبت‌شده در مدرسه ({books.length} جلد)</span>
              </h3>

              <button
                onClick={handlePublishAllBooks}
                disabled={isPublishingAll || books.length === 0}
                className="px-3 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="انتشار همگانی کلیه کتب موجود به کانال بله"
              >
                <Send className={`w-3.5 h-3.5 ${isPublishingAll ? 'animate-spin' : 'text-sky-600'}`} />
                <span>{isPublishingAll ? 'در حال ارسال به بله...' : 'انتشار همه در کانال بله'}</span>
              </button>
            </div>

            <div className="relative w-64">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در تمام کتاب‌ها..."
                className="w-full text-xs pr-8 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          {publishAllStatus && (
            <div
              className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                publishAllStatus.success
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{publishAllStatus.message}</span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">عنوان کتاب</th>
                  <th className="p-3">نویسنده</th>
                  <th className="p-3">دسته‌بندی</th>
                  <th className="p-3">مالک دانش‌آموز</th>
                  <th className="p-3">کلاس</th>
                  <th className="p-3">وضعیت</th>
                  <th className="p-3 text-center">انتشار بله / حذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {books
                  .filter(
                    (b) =>
                      !searchQuery ||
                      b.title.includes(searchQuery) ||
                      b.author.includes(searchQuery) ||
                      b.ownerName.includes(searchQuery)
                  )
                  .map((book) => (
                    <tr key={book.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                        <img
                          src={book.coverImage}
                          alt={book.title}
                          className="w-8 h-10 object-cover rounded-md"
                        />
                        <span>{book.title}</span>
                      </td>
                      <td className="p-3 text-slate-600">{book.author}</td>
                      <td className="p-3 text-slate-600">{book.category}</td>
                      <td className="p-3 font-semibold text-slate-800">{book.ownerName}</td>
                      <td className="p-3 text-slate-500">{book.ownerClass}</td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            book.status === 'available'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {book.status === 'available' ? 'آماده امانت' : 'در دست امانت'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handlePublishSingleBook(book.id, book.title)}
                            disabled={publishingBookId === book.id}
                            className={`p-1.5 rounded-lg border transition cursor-pointer ${
                              bookPublishFeedback?.bookId === book.id && bookPublishFeedback.success
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                                : 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100'
                            }`}
                            title="انتشار / ارسال به کانال بله"
                          >
                            <Send className={`w-3.5 h-3.5 ${publishingBookId === book.id ? 'animate-spin text-sky-600' : ''}`} />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`آیا از حذف کتاب «${book.title}» مطمئن هستید؟`)) {
                                deleteBook(book.id);
                              }
                            }}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg transition cursor-pointer"
                            title="حذف کتاب"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {bookPublishFeedback?.bookId === book.id && (
                          <div className="text-[10px] font-bold text-emerald-700 mt-1 animate-in fade-in">
                            {bookPublishFeedback.message}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: All Students and Admins List */}
      {activeTab === 'all_users' && (
        <div className="space-y-6">
          {/* Section 1: Add New Admin Form */}
          <div className="bg-gradient-to-br from-indigo-50 via-white to-slate-50 rounded-3xl p-6 border border-indigo-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-indigo-100 pb-3">
              <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">ثبت و افزودن مدیر یا مسئول جدید کتابخانه</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  می‌توانید شماره تلفن مدیر جدیدی که هنوز ثبت‌نام نکرده را اضافه کنید یا حساب کاربری فعلی را ترفیع دهید.
                </p>
              </div>
            </div>

            <form onSubmit={handleAddAdminSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700">شماره همراه مدیر (مثال: ۰۹۱۲۳۴۵۶۷۸۹) *</label>
                <input
                  type="text"
                  required
                  placeholder="شماره همراه"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  className="w-full text-xs sm:text-sm p-3 bg-white border border-slate-200/90 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-bold text-slate-800 shadow-2xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700">نام و نام خانوادگی مسئول (اختیاری)</label>
                <input
                  type="text"
                  placeholder="مثال: آقای حسینی (مسئول پرورشی)"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full text-xs sm:text-sm p-3 bg-white border border-slate-200/90 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-bold text-slate-800 shadow-2xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700">رمز عبور (پیش‌فرض: ۱۲۳۴۵۶)</label>
                <input
                  type="password"
                  placeholder="رمز عبور ورود"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full text-xs sm:text-sm p-3 bg-white border border-slate-200/90 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-bold text-slate-800 shadow-2xs"
                />
              </div>

              <div className="sm:col-span-3 flex justify-end items-center gap-3 pt-2">
                {addAdminSuccessMsg && (
                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                    ✓ {addAdminSuccessMsg}
                  </span>
                )}
                {addAdminErrorMsg && (
                  <span className="text-xs font-black text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
                    ⚠️ {addAdminErrorMsg}
                  </span>
                )}
                <button
                  type="submit"
                  disabled={isSubmittingAdmin}
                  className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-black text-xs px-5 py-3 rounded-2xl shadow-xs transition duration-150 flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isSubmittingAdmin ? 'در حال ثبت...' : 'افزودن و فعال‌سازی مدیر'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Admins List */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
              <Crown className="w-5 h-5 text-amber-500" />
              <span>مدیران و مسئولین فعال سامانه ({users.filter(u => u.role === 'admin').length} نفر)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {users
                .filter((u) => u.role === 'admin')
                .map((adm) => (
                  <div
                    key={adm.id}
                    className="p-4 bg-gradient-to-br from-slate-50 to-amber-50/20 rounded-2xl border border-amber-200/60 flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={adm.avatar}
                        alt={adm.name}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-amber-400 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-sm truncate flex items-center gap-1.5">
                          <span>{adm.name}</span>
                          <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.5 rounded-md border border-amber-300">مدیر</span>
                        </div>
                        <div className="text-xs text-slate-500 truncate mt-0.5">
                          {adm.phone}
                        </div>
                        {adm.baleChatId ? (
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 mt-1">
                            💬 پیام‌رسان بله متصل است
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-0.5 mt-1">
                            💬 فاقد اتصال بله
                          </span>
                        )}
                      </div>
                    </div>

                    {adm.id !== currentUser?.id && (
                      <button
                        onClick={async () => {
                          if (
                            confirm(
                              `آیا از حذف کامل حساب مدیریت «${adm.name}» مطمئن هستید؟`
                            )
                          ) {
                            const res = await deleteUser(adm.id);
                            if (!res.success) {
                              alert(res.message || 'خطا در حذف مدیر');
                            }
                          }
                        }}
                        title="حذف حساب مدیر"
                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>

          {/* Section 3: Students List */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
              <Users className="w-5 h-5 text-indigo-600" />
              <span>فهرست دانش‌آموزان تاییدشده کتابخانه ({approvedStudents.length} نفر)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {approvedStudents.map((st) => (
                <div
                  key={st.id}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3 hover:bg-slate-100/60 transition shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={st.avatar}
                      alt={st.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-sm truncate">{st.name}</div>
                      <div className="text-xs text-slate-500 truncate mt-0.5">
                        کلاس {st.className} • ⭐ {st.rating}
                      </div>
                      <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                        {st.booksContributedCount} کتاب • {st.booksReadCount} خوانده
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={async () => {
                        if (
                          confirm(
                            `آیا مایل هستید دانش‌آموز «${st.name}» را به مقام مدیریت سامانه مکتب‌خانه ارتقا دهید؟`
                          )
                        ) {
                          const res = await makeAdmin(st.id);
                          if (res.success) {
                            alert(res.message || 'کاربر با موفقیت به مدیریت ارتقا یافت.');
                          } else {
                            alert(res.message || 'خطا در ارتقای کاربر.');
                          }
                        }
                      }}
                      title="ترفیع به مدیر سامانه"
                      className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-100/80 rounded-xl transition"
                    >
                      <Crown className="w-4 h-4" />
                    </button>

                    <button
                      onClick={async () => {
                        if (
                          confirm(
                            `آیا از حذف کامل حساب دانش‌آموز «${st.name}» مطمئن هستید؟ تمام کتاب‌ها و سوابق وی حذف خواهد شد.`
                          )
                        ) {
                          const res = await deleteUser(st.id);
                          if (!res.success) {
                            alert(res.message || 'خطا در حذف کاربر');
                          }
                        }
                      }}
                      title="حذف حساب کاربر"
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-100/80 rounded-xl transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: System Logs */}
      {activeTab === 'system_logs' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="font-bold text-slate-900 text-base">لاگ‌های دیتابیس و تراکنش‌های سامانه</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  گزارش به‌روزرسانی‌ها، ورود و ثبت‌نام، رخدادهای دیتابیس و خطاهای سیستم ({systemLogs.length} لاگ ثبت‌شده)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchSystemLogs}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                title="به‌روزرسانی"
              >
                <RotateCcw className={`w-4 h-4 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                <span>بازخوانی لاگ‌ها</span>
              </button>

              <button
                onClick={handleClearLogs}
                disabled={systemLogs.length === 0}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>پاک‌سازی لاگ‌ها</span>
              </button>
            </div>
          </div>

          {/* Search & Level Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              <input
                type="text"
                placeholder="جستجو در متن لاگ یا جزئیات..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {(['all', 'error', 'warn', 'info', 'db'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLogLevelFilter(lvl)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    logLevelFilter === lvl
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {lvl === 'all' && 'همه'}
                  {lvl === 'error' && '🚨 خطاها'}
                  {lvl === 'warn' && '⚠️ هشدارها'}
                  {lvl === 'info' && 'ℹ️ عمومی'}
                  {lvl === 'db' && '🗄️ دیتابیس'}
                </button>
              ))}
            </div>
          </div>

          {/* Logs List Table */}
          <div className="border border-slate-200 rounded-3xl overflow-hidden shadow-2xs bg-white">
            <div className="max-h-[600px] overflow-y-auto">
              {systemLogs.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs font-bold space-y-2">
                  <Terminal className="w-8 h-8 text-slate-300 mx-auto" />
                  <div>هیچ لاگی در حافظه سامانه یافت نشد.</div>
                </div>
              ) : (
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="p-3 w-36">زمان ثبت</th>
                      <th className="p-3 w-24 text-center">نوع</th>
                      <th className="p-3">پیام رویداد</th>
                      <th className="p-3">کاربر مرتبط</th>
                      <th className="p-3 text-center w-20">جزئیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {systemLogs
                      .filter((l) => {
                        if (logLevelFilter !== 'all' && l.level !== logLevelFilter) return false;
                        if (logSearch) {
                          const q = logSearch.toLowerCase();
                          return (
                            l.message.toLowerCase().includes(q) ||
                            (l.details && l.details.toLowerCase().includes(q)) ||
                            (l.userName && l.userName.toLowerCase().includes(q)) ||
                            (l.userPhone && l.userPhone.toLowerCase().includes(q))
                          );
                        }
                        return true;
                      })
                      .map((log) => {
                        const isExpanded = expandedLogId === log.id;
                        return (
                          <React.Fragment key={log.id}>
                            <tr
                              onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                              className={`hover:bg-slate-50/80 transition cursor-pointer ${isExpanded ? 'bg-indigo-50/20' : ''}`}
                            >
                              <td className="p-3 font-mono text-[11px] text-slate-500 dir-ltr text-right whitespace-nowrap">
                                {log.timestamp}
                              </td>
                              <td className="p-3 text-center">
                                {log.level === 'error' && (
                                  <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-md text-[10px] font-black border border-rose-200">
                                    ERROR
                                  </span>
                                )}
                                {log.level === 'warn' && (
                                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[10px] font-black border border-amber-200">
                                    WARN
                                  </span>
                                )}
                                {log.level === 'info' && (
                                  <span className="px-2 py-0.5 bg-cyan-100 text-cyan-800 rounded-md text-[10px] font-black border border-cyan-200">
                                    INFO
                                  </span>
                                )}
                                {log.level === 'db' && (
                                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md text-[10px] font-black border border-indigo-200">
                                    DB
                                  </span>
                                )}
                              </td>
                              <td className="p-3 font-bold text-slate-900">{log.message}</td>
                              <td className="p-3 text-slate-600 font-semibold">
                                {log.userName ? (
                                  <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 text-[10px] text-slate-700">
                                    👤 {log.userName}
                                  </span>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                <button className="text-xs text-indigo-600 hover:text-indigo-800 font-black">
                                  {isExpanded ? 'بستن ▲' : 'مشاهده ▼'}
                                </button>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr className="bg-slate-50/80">
                                <td colSpan={5} className="p-4 border-t border-b border-slate-200/60">
                                  <div className="space-y-3 text-xs">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <div>
                                        <span className="font-black text-slate-500 block mb-1">📝 عنوان رویداد:</span>
                                        <span className="font-black text-slate-900 text-sm bg-white p-2 rounded-xl border border-slate-200 block">
                                          {log.message}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="font-black text-slate-500 block mb-1">⏰ زمان دقیق ثبت سیستم:</span>
                                        <span className="font-mono text-slate-700 font-bold bg-white p-2 rounded-xl border border-slate-200 block dir-ltr text-right">
                                          {log.timestamp}
                                        </span>
                                      </div>
                                    </div>

                                    {log.userName && (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-3 rounded-2xl border border-slate-200">
                                        <div>
                                          <span className="font-black text-slate-500">👤 کاربر مرتبط:</span>
                                          <span className="font-bold text-slate-900 mr-2">{log.userName}</span>
                                        </div>
                                        <div>
                                          <span className="font-black text-slate-500">📞 شماره تماس:</span>
                                          <span className="font-mono text-slate-700 font-bold mr-2">{log.userPhone || 'نامشخص'}</span>
                                        </div>
                                      </div>
                                    )}

                                    <div>
                                      <span className="font-black text-slate-500 block mb-1">⚙️ جزئیات فنی و لاگ دیتابیس:</span>
                                      <pre className="font-mono text-slate-700 bg-slate-900 text-slate-200 p-4 rounded-2xl border border-slate-800 overflow-x-auto text-[11px] whitespace-pre-wrap leading-relaxed shadow-inner">
                                        {log.details || 'بدون جزئیات فنی تکمیلی.'}
                                      </pre>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Avatar Management */}
      {activeTab === 'avatars' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-pink-500 to-rose-600 rounded-3xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-xl font-black flex items-center gap-2">
                <Smile className="w-6 h-6 text-amber-300" />
                <span>مدیریت آواتار‌های اختصاصی سامانه</span>
              </h3>
              <p className="text-xs text-pink-100 leading-relaxed max-w-2xl">
                در این بخش می‌توانید آواتارهای سفارشی جدید با فرمت PNG به همراه اسم اختصاصی آپلود و اضافه کنید.
                آواتارهای افزوده‌شده بلافاصله برای تمامی کاربران در بخش ثبت‌نام، ورود، و ویرایش پروفایل قابل انتخاب خواهند بود.
              </p>
            </div>
          </div>

          {/* Feedback Messages */}
          {avatarSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{avatarSuccessMsg}</span>
              </div>
              <button onClick={() => setAvatarSuccessMsg('')} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {avatarErrorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{avatarErrorMsg}</span>
              </div>
              <button onClick={() => setAvatarErrorMsg('')} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Form Card: Add New Avatar */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Plus className="w-5 h-5 text-indigo-600" />
              <span>افزودن آواتار PNG جدید به سامانه:</span>
            </h4>

            <form onSubmit={handleCreateCustomAvatar} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Avatar Name Input */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">
                    نام آواتار (عنوان نمایش داده‌شده برای کاربران) <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    value={newAvatarName}
                    onChange={(e) => setNewAvatarName(e.target.value)}
                    placeholder="مثال: آواتار دانش‌آموز پژوهشگر"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  />
                </div>

                {/* PNG Image Upload */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">
                    آپلود تصویر آواتار (فرمت PNG / JPG) <span className="text-rose-500">*</span>:
                  </label>
                  <label className="cursor-pointer w-full px-4 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 text-xs font-bold rounded-2xl flex items-center justify-center gap-2 transition">
                    {isUploadingAvatar ? (
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    ) : (
                      <Upload className="w-4 h-4 text-indigo-600" />
                    )}
                    <span>{newAvatarUrl ? 'تغییر تصویر آواتار' : 'انتخاب و آپلود فایل PNG'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileUpload}
                      disabled={isUploadingAvatar}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Image Preview Box */}
              {newAvatarUrl && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-white border border-slate-300 p-1 flex items-center justify-center shadow-xs">
                    <img src={newAvatarUrl} alt="پیش‌نمایش آواتار" className="w-full h-full object-cover rounded-xl" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-800 block">پیش‌نمایش آواتار انتخاب شده</span>
                    <span className="text-[11px] text-slate-500 block">{newAvatarName || 'بدون نام'}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isUploadingAvatar || !newAvatarName || !newAvatarUrl}
                  className="px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 disabled:opacity-50 text-white font-black text-xs rounded-2xl shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  {isUploadingAvatar ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>ثبت و انتشار آواتار جدید</span>
                </button>
              </div>
            </form>
          </div>

          {/* List of Custom Avatars */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h4 className="text-sm font-black text-slate-900 flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Smile className="w-5 h-5 text-amber-500" />
                <span>آواتارهای اختصاصی ثبت‌شده توسط مدیریت ({customAvatars.length})</span>
              </div>
            </h4>

            {customAvatars.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
                <ImageIcon className="w-10 h-10 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-600">هنوز آواتار اختصاصی جدیدی ثبت نشده است.</p>
                <p className="text-[11px] text-slate-400">با استفاده از فرم بالا می‌توانید اولین آواتار PNG سفارشی را اضافه نمایید.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {customAvatars.map((avatar) => (
                  <div
                    key={avatar.id}
                    className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-between gap-3 relative group hover:shadow-md transition"
                  >
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white border border-slate-200 p-1 flex items-center justify-center shadow-xs">
                      <img src={avatar.url} alt={avatar.name} className="w-full h-full object-cover rounded-xl" />
                    </div>
                    <div className="text-center w-full">
                      <span className="text-xs font-black text-slate-800 block truncate" title={avatar.name}>
                        {avatar.name}
                      </span>
                      {avatar.createdAt && (
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {avatar.createdAt}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteCustomAvatar(avatar.id, avatar.name)}
                      className="w-full py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold rounded-xl border border-rose-200 transition flex items-center justify-center gap-1 cursor-pointer"
                      title="حذف این آواتار"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Admin Profile & Avatar Modal */}
      {showEditProfileModal && (
        <EditProfileModal onClose={() => setShowEditProfileModal(false)} />
      )}
    </div>
  );
};
