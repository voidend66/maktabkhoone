import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CloudUpload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  HardDrive,
  FolderSync,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Zap,
  Sliders,
  Calendar,
  LogOut,
  Info,
  Layers,
  FileCheck,
  Send,
  Loader2,
  FolderOpen,
  KeyRound,
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';
import { GoogleDriveConfig, GoogleDriveScheduleFrequency } from '../types';

declare global {
  interface Window {
    google?: any;
  }
}

interface ConnectionInfo {
  ok: boolean;
  userEmail?: string;
  userName?: string;
  totalQuotaGb?: number;
  usedQuotaGb?: number;
  freeQuotaGb?: number;
  error?: string;
}

interface SyncDetails {
  totalUploadedPhotos: number;
  totalSkippedPhotos: number;
  dbBackupSizeBytes: number;
  totalDurationMs: number;
  driveFolderUrl?: string;
}

export const GoogleDriveBackupSection: React.FC = () => {
  const [config, setConfig] = useState<GoogleDriveConfig | null>(null);
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
  const [hasToken, setHasToken] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string; details?: SyncDetails } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states for schedule & OAuth settings
  const [enabled, setEnabled] = useState<boolean>(false);
  const [frequency, setFrequency] = useState<GoogleDriveScheduleFrequency>('daily');
  const [scheduledHour, setScheduledHour] = useState<number>(2);
  const [autoPrune, setAutoPrune] = useState<boolean>(true);
  const [maxSnapshots, setMaxSnapshots] = useState<number>(30);
  const [clientId, setClientId] = useState<string>('');

  // Modals & Helpers
  const [showManualTokenModal, setShowManualTokenModal] = useState<boolean>(false);
  const [showHelpGuideModal, setShowHelpGuideModal] = useState<boolean>(false);
  const [manualToken, setManualToken] = useState<string>('');
  const [copiedOrigin, setCopiedOrigin] = useState<boolean>(false);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  const fetchStatus = async () => {
    try {
      setIsLoadingStatus(true);
      setErrorMsg(null);
      const res = await fetch('/api/admin/gdrive/status');
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
        setHasToken(data.hasToken);
        setUserEmail(data.userEmail);
        setConnectionInfo(data.connectionInfo);

        setEnabled(data.config.enabled ?? false);
        setFrequency(data.config.frequency || 'daily');
        setScheduledHour(data.config.scheduledHour ?? 2);
        setAutoPrune(data.config.autoPruneOldDbSnapshots ?? true);
        setMaxSnapshots(data.config.maxDbSnapshotsToKeep ?? 30);
        setClientId(data.config.clientId || '');
      }
    } catch (err: any) {
      setErrorMsg('خطا در دریافت وضعیت گوگل درایو: ' + err.message);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  /**
   * Google Identity Services OAuth login
   */
  const handleConnectGoogle = () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const effectiveClientId = (clientId || config?.clientId || '').trim();

    if (!effectiveClientId) {
      setShowHelpGuideModal(true);
      return;
    }

    // Check if GIS client is loaded in window
    if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: effectiveClientId,
          scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email',
          callback: async (tokenResponse: any) => {
            if (tokenResponse.error) {
              setErrorMsg(`خطا در احراز هویت گوگل: ${tokenResponse.error_description || tokenResponse.error}`);
              return;
            }

            if (tokenResponse.access_token) {
              await sendTokenToServer(tokenResponse.access_token, tokenResponse.expires_in);
            }
          }
        });

        tokenClient.requestAccessToken({ prompt: 'consent' });
      } catch (err: any) {
        console.warn('GIS Token client error:', err);
        setErrorMsg('خطا در باز کردن پنجره ورود گوگل: ' + err.message);
        setShowManualTokenModal(true);
      }
    } else {
      setShowManualTokenModal(true);
    }
  };

  const sendTokenToServer = async (accessToken: string, expiresIn?: number) => {
    try {
      setIsLoadingStatus(true);
      const res = await fetch('/api/admin/gdrive/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken, expiresIn })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('✅ اتصال با حساب گوگل درایو با موفقیت برقرار شد.');
        setShowManualTokenModal(false);
        setManualToken('');
        await fetchStatus();
      } else {
        setErrorMsg(data.message || 'خطا در ثبت توکن');
      }
    } catch (err: any) {
      setErrorMsg('خطای شبکه در اتصال: ' + err.message);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('آیا از قطع اتصال حساب گوگل درایو اطمینان دارید؟')) return;
    try {
      setIsLoadingStatus(true);
      const res = await fetch('/api/admin/gdrive/disconnect', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('اتصال حساب گوگل با موفقیت قطع شد.');
        await fetchStatus();
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleSaveConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setIsSavingConfig(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      const res = await fetch('/api/admin/gdrive/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled,
          frequency,
          scheduledHour: Number(scheduledHour),
          autoPruneOldDbSnapshots: autoPrune,
          maxDbSnapshotsToKeep: Number(maxSnapshots),
          clientId: clientId.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('✅ تنظیمات زمان‌بندی و کلید گوگل درایو با موفقیت ذخیره شد.');
        await fetchStatus();
      } else {
        setErrorMsg(data.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleManualSyncNow = async () => {
    if (isSyncing) return;
    try {
      setIsSyncing(true);
      setSyncResult(null);
      setErrorMsg(null);
      setSuccessMsg(null);

      const res = await fetch('/api/admin/gdrive/sync-now', { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        setSyncResult({
          success: true,
          message: data.message,
          details: data.details
        });
        setSuccessMsg('✅ عملیات پشتیبان‌گیری تفاضلی در گوگل درایو با موفقیت پایان یافت و گزارش به بله ارسال شد.');
        await fetchStatus();
      } else {
        setErrorMsg(data.message || 'خطا در پشتیبان‌گیری');
      }
    } catch (err: any) {
      setErrorMsg('خطا در برقراری ارتباط با سرور: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const copyOriginToClipboard = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(currentOrigin);
      setCopiedOrigin(true);
      setTimeout(() => setCopiedOrigin(false), 3000);
    }
  };

  const toPersianDigits = (str: string | number) => {
    const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(str).replace(/\d/g, (x) => farsiDigits[parseInt(x, 10)]);
  };

  const formatHourLabel = (h: number) => {
    const padded = String(h).padStart(2, '0');
    return `${toPersianDigits(padded)}:۰۰ (${h < 12 ? 'بامداد/صبح' : h === 12 ? 'ظهر' : 'عصر/شب'})`;
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-6 space-y-6">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg border border-blue-800/40">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-44 h-44 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-44 h-44 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="flex items-start gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-white/10 border border-white/20 text-white flex items-center justify-center shrink-0 shadow-inner">
              <Cloud className="w-7 h-7 text-sky-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="font-black text-lg text-white">
                  پشتیبان‌گیری ابری تفاضلی گوگل درایو (Google Drive)
                </h3>
                {hasToken ? (
                  <span className="px-3 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    حساب متصل است
                  </span>
                ) : (
                  <span className="px-3 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    نیازمند اتصال حساب گوگل
                  </span>
                )}
              </div>
              <p className="text-xs text-blue-100/80 font-medium mt-1 leading-relaxed max-w-2xl">
                تهیه خودکار نسخه پشتیبان تفاضلی از پایگاه‌داده و تصاویر جدید کتاب‌ها بر روی حساب ابری گوگل شما به صورت برنامه‌ریزی‌شده و ارسال همزمان لاگ و گزارش به پیام‌رسان بله.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {hasToken ? (
              <>
                <button
                  type="button"
                  onClick={handleManualSyncNow}
                  disabled={isSyncing}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>در حال بکاپ‌گیری تفاضلی...</span>
                    </>
                  ) : (
                    <>
                      <FolderSync className="w-4 h-4" />
                      <span>پشتیبان‌گیری دستی همین حالا</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDisconnect}
                  title="قطع اتصال حساب گوگل"
                  className="p-2.5 bg-white/10 hover:bg-rose-500/30 text-rose-300 rounded-xl border border-white/10 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleConnectGoogle}
                  className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-black text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  <CloudUpload className="w-4 h-4 text-blue-600" />
                  <span>اتصال حساب گوگل درایو</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowHelpGuideModal(true)}
                  className="px-3 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4 text-sky-300" />
                  <span>راهنمای ۳ دقیقه‌ای اتصال</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowManualTokenModal(true)}
                  className="p-2.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded-xl border border-white/20 transition cursor-pointer"
                  title="وارد کردن دستی توکن دسترسی"
                >
                  <KeyRound className="w-4 h-4 text-amber-300" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Account Info / Storage Bar if Connected */}
        {hasToken && connectionInfo?.ok && (
          <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="flex items-center gap-2 text-blue-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>ایمیل متصل: <strong className="text-white font-mono">{userEmail || connectionInfo.userEmail}</strong></span>
            </div>

            <div className="flex items-center gap-2 text-blue-200">
              <HardDrive className="w-4 h-4 text-sky-400" />
              <span>فضای خالی درایو: <strong className="text-white font-mono">{toPersianDigits(connectionInfo.freeQuotaGb || 0)} GB</strong> از {toPersianDigits(connectionInfo.totalQuotaGb || 15)} GB</span>
            </div>

            <div className="flex items-center gap-2 text-blue-200">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>آخرین بکاپ: <strong className="text-white">{config?.lastBackupTimestamp ? new Date(config.lastBackupTimestamp).toLocaleDateString('fa-IR') + ' ' + new Date(config.lastBackupTimestamp).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) : 'هنوز اجرا نشده'}</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Notifications / Feedback Alerts */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-2xl flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold rounded-2xl flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="flex-1">
            <p>{errorMsg}</p>
            {errorMsg.includes('invalid_client') && (
              <button
                type="button"
                onClick={() => setShowHelpGuideModal(true)}
                className="text-[11px] text-rose-700 underline font-bold mt-1 inline-block"
              >
                مشاهده راهنمای رفع خطای invalid_client در ۳ مرحله
              </button>
            )}
          </div>
        </div>
      )}

      {/* Last Sync Results Card (Differential Report) */}
      {syncResult && (
        <div className="p-5 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sky-950 font-black text-xs">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span>گزارش آخرین عملیات تفاضلی (Incremental Sync Summary):</span>
            </div>
            {syncResult.details?.driveFolderUrl && (
              <a
                href={syncResult.details.driveFolderUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-sky-700 hover:text-sky-900 font-bold flex items-center gap-1 underline underline-offset-4"
              >
                <span>مشاهده پوشه در گوگل درایو</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
            <div className="p-3 bg-white rounded-xl border border-sky-100 space-y-1">
              <span className="text-[11px] text-slate-500 font-medium">تصاویر جدید منتقل‌شده</span>
              <div className="text-base font-black text-emerald-600">
                {toPersianDigits(syncResult.details?.totalUploadedPhotos || 0)} <span className="text-[10px] font-normal text-slate-500">فایل</span>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-sky-100 space-y-1">
              <span className="text-[11px] text-slate-500 font-medium">تصاویر تکراری رد شده</span>
              <div className="text-base font-black text-slate-700">
                {toPersianDigits(syncResult.details?.totalSkippedPhotos || 0)} <span className="text-[10px] font-normal text-slate-500">فایل (بدون مصرف ترافیک)</span>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-sky-100 space-y-1">
              <span className="text-[11px] text-slate-500 font-medium">حجم اسنپ‌شات دیتابیس</span>
              <div className="text-base font-black text-indigo-600">
                {toPersianDigits(((syncResult.details?.dbBackupSizeBytes || 0) / 1024).toFixed(1))} <span className="text-[10px] font-normal text-slate-500">KB</span>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-sky-100 space-y-1">
              <span className="text-[11px] text-slate-500 font-medium">مدت زمان کل</span>
              <div className="text-base font-black text-amber-600">
                {toPersianDigits(((syncResult.details?.totalDurationMs || 0) / 1000).toFixed(1))} <span className="text-[10px] font-normal text-slate-500">ثانیه</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: How It Works & Configuration Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: How Standard Differential Backup Works (4 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-3.5">
            <h4 className="text-xs font-black text-slate-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>مکانیسم پشتیبان‌گیری تفاضلی استاندارد:</span>
            </h4>
            <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed font-medium">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  ۱
                </span>
                <p>
                  <strong>عدم آپلود فایل‌های تکراری:</strong> سیستم هش کد (MD5) هر عکس جلد و آواتار را بررسی می‌کند و فقط فایل‌های جدید را در گوگل درایو کپی می‌نماید.
                </p>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  ۲
                </span>
                <p>
                  <strong>پوشه‌بندی اختصاصی در درایو:</strong> کلیه پشتیبان‌ها درون پوشه <code>MaktabKhaneh_Backups</code> شامل زیرپوشه‌های <code>Database_Snapshots</code> و <code>Uploaded_Photos</code> ذخیره می‌شوند.
                </p>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  ۳
                </span>
                <p>
                  <strong>ارسال آنی لاگ به بله و سایت:</strong> بلافاصله پس از اتمام هر نوبت بکاپ خودکار یا دستی، گزارش کامل با آمار دقیق عکس‌های جدید و حجم دیتابیس برای مدیر در پیام‌رسان بله و لاگ‌های سایت ارسال می‌شود.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-start gap-3">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-900 leading-relaxed font-medium">
              <strong>حفظ امنیت و حریم خصوصی:</strong> مجوز درخواستی (<code className="font-mono text-[10px] bg-amber-100 px-1 py-0.5 rounded">drive.file</code>) منحصراً اجازه دسترسی به پوشه پشتیبان مکتب‌خانه را دارد و هیچ دسترسی به سایر فایل‌های شخصی حساب گوگل شما نخواهد داشت.
            </div>
          </div>
        </div>

        {/* Right Column: Automation & Schedule Settings (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <form onSubmit={handleSaveConfig} className="p-5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-black text-slate-800">
                  تنظیمات زمان‌بندی و احراز هویت گوگل (Scheduler & OAuth)
                </h4>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                <span className="ms-3 text-xs font-bold text-slate-700">
                  {enabled ? 'بکاپ خودکار فعال است' : 'غیرفعال'}
                </span>
              </label>
            </div>

            {/* Google OAuth Client ID Configuration */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black text-slate-700">
                  شناسه کلاینت گوگل (Google OAuth Client ID):
                </label>
                <button
                  type="button"
                  onClick={() => setShowHelpGuideModal(true)}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>راهنمای ساخت رایگان در گوگل کلود</span>
                </button>
              </div>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="1234567890-abcdefg.apps.googleusercontent.com"
                className="w-full text-xs p-3 bg-white border border-slate-300 rounded-xl font-mono text-slate-800 focus:border-indigo-500 transition"
              />
              <p className="text-[10px] text-slate-500 font-medium">
                پس از ساخت در کنسول گوگل کلود، Client ID خود را اینجا وارد کرده و دکمه ذخیره را بزنید.
              </p>
            </div>

            {/* Frequency Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-700">
                  دوره تکرار زمان‌بندی:
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as GoogleDriveScheduleFrequency)}
                  disabled={!enabled}
                  className="w-full text-xs p-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 disabled:opacity-50"
                >
                  <option value="daily">هر شب (Daily - یک‌بار در شبانه‌روز)</option>
                  <option value="every_12_hours">هر ۱۲ ساعت (Twice a day)</option>
                  <option value="every_6_hours">هر ۶ ساعت (Four times a day)</option>
                  <option value="weekly">هفتگی (جمعه‌ها)</option>
                  <option value="manual">فقط دستی (دکمه پنل مدیریت)</option>
                </select>
              </div>

              {/* Scheduled Hour */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-700">
                  ساعت اجرای بکاپ در شبانه‌روز:
                </label>
                <select
                  value={scheduledHour}
                  onChange={(e) => setScheduledHour(Number(e.target.value))}
                  disabled={!enabled}
                  className="w-full text-xs p-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 disabled:opacity-50"
                >
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 12, 14, 18, 20, 22, 23].map((h) => (
                    <option key={h} value={h}>
                      {formatHourLabel(h)}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 font-medium">
                  پیشنهاد: ساعت ۰۲:۰۰ تا ۰۴:۰۰ بامداد به علت حداقل مصرف کاربران
                </p>
              </div>
            </div>

            {/* Auto Prune Old DB Snapshots */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-slate-800">
                    مدیریت فضای حساب گوگل (حذف خودکار اسنپ‌شات‌های بسیار قدیمی دیتابیس)
                  </h5>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    برای جلوگیری از پر شدن حجم، فقط N اسنپ‌شات آخر دیتابیس در درایو نگهداری می‌شود (عکس‌ها هرگز حذف نمی‌شوند).
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={autoPrune}
                  onChange={(e) => setAutoPrune(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded-md border-slate-300"
                />
              </div>

              {autoPrune && (
                <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                  <span className="text-xs font-medium text-slate-700">تعداد نسخه‌های دیتابیس جهت نگهداری:</span>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={maxSnapshots}
                    onChange={(e) => setMaxSnapshots(Number(e.target.value))}
                    className="w-20 text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg text-center font-bold"
                  />
                  <span className="text-[11px] text-slate-400">نسخه آخر (مثلاً ۳۰ روز اخیر)</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="submit"
                disabled={isSavingConfig}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
              >
                {isSavingConfig ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>در حال ذخیره تنظیمات...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ذخیره تنظیمات و کلید کلاینت</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Step-by-Step Google Cloud Guide Modal */}
      {showHelpGuideModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5 text-slate-800 font-black text-sm">
                <Cloud className="w-5 h-5 text-blue-600" />
                <span>راهنمای ۳ مرحله‌ای رفع خطای invalid_client و اتصال به گوگل</span>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpGuideModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              خطای <strong>invalid_client</strong> به این دلیل رخ می‌دهد که گوگل نیاز دارد دامنه این سامانه در یک <strong>OAuth Client ID</strong> ثبت شده باشد. انجام این کار کاملاً رایگان است و تنها ۳ دقیقه زمان می‌برد:
            </p>

            <div className="space-y-4 text-xs text-slate-700">
              {/* Step 1 */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 font-black text-indigo-900">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">۱</span>
                  <span>گام اول: ورود به کنسول گوگل کلود</span>
                </div>
                <p className="text-slate-600 pr-8">
                  وارد سایت <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-blue-600 font-bold underline">Google Cloud Console &gt; Credentials</a> شوید.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 font-black text-indigo-900">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">۲</span>
                  <span>گام دوم: ایجاد OAuth Client ID</span>
                </div>
                <p className="text-slate-600 pr-8 leading-relaxed">
                  روی دکمه <strong>+ CREATE CREDENTIALS</strong> کلیک کرده و گزینه <strong>OAuth client ID</strong> را انتخاب کنید.
                  <br />
                  - نوع اپلیکیشن (Application type): <strong>Web application</strong>
                  <br />
                  - نام: <strong>MaktabKhaneh Backup</strong>
                </p>

                {/* Origin copy box */}
                <div className="pr-8 pt-1">
                  <span className="block text-[11px] font-bold text-slate-700 mb-1">
                    در بخش Authorized JavaScript origins، آدرس سامانه خود را اضافه کنید:
                  </span>
                  <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-xl p-2 font-mono text-xs">
                    <span className="flex-1 text-indigo-950 font-bold truncate">{currentOrigin}</span>
                    <button
                      type="button"
                      onClick={copyOriginToClipboard}
                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      {copiedOrigin ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedOrigin ? 'کپی شد' : 'کپی آدرس'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 font-black text-indigo-900">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">۳</span>
                  <span>گام سوم: قرار دادن Client ID در سامانه</span>
                </div>
                <p className="text-slate-600 pr-8">
                  پس از ذخیره، عبارت <strong>Client ID</strong> (که شبیه <code>...apps.googleusercontent.com</code> است) را کپی کرده و در کادر بالا قرار دهید و دکمه ذخیره را بزنید.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowHelpGuideModal(false);
                  setShowManualTokenModal(true);
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>یا اتصال فوری از طریق وارد کردن مستقیم توکن (Access Token)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowHelpGuideModal(false)}
                className="px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                متوجه شدم
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual OAuth Token Modal */}
      {showManualTokenModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-800 font-black text-sm">
                <KeyRound className="w-5 h-5 text-blue-600" />
                <span>اتصال سریع از طریق Access Token</span>
              </div>
              <button
                type="button"
                onClick={() => setShowManualTokenModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              می‌توانید توکن دسترسی موقت حساب گوگل خود (OAuth Access Token یا Bearer Token تولید شده از OAuth Playground) را مستقیماً وارد نمایید:
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">توکن دسترسی گوگل (Bearer Token):</label>
              <textarea
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="ya29.a0AfH6SM..."
                rows={4}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 focus:bg-white transition"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowManualTokenModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={() => sendTokenToServer(manualToken.trim())}
                disabled={!manualToken.trim() || isLoadingStatus}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                {isLoadingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>ثبت و اعتبارسنجی توکن</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
