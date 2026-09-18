import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
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
  Key,
  Settings2,
  Globe
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

  // Form states for schedule settings
  const [enabled, setEnabled] = useState<boolean>(false);
  const [frequency, setFrequency] = useState<GoogleDriveScheduleFrequency>('daily');
  const [scheduledHour, setScheduledHour] = useState<number>(2);
  const [autoPrune, setAutoPrune] = useState<boolean>(true);
  const [maxSnapshots, setMaxSnapshots] = useState<number>(30);

  // Manual token input dialog / modal
  const [showManualTokenModal, setShowManualTokenModal] = useState<boolean>(false);
  const [manualToken, setManualToken] = useState<string>('');

  // Custom Client ID modal
  const [showClientIdModal, setShowClientIdModal] = useState<boolean>(false);
  const [customClientIdInput, setCustomClientIdInput] = useState<string>('');

  // Domain check
  const isCustomDomain = typeof window !== 'undefined' && 
    !window.location.hostname.includes('localhost') && 
    !window.location.hostname.includes('127.0.0.1') && 
    !window.location.hostname.includes('run.app') &&
    !window.location.hostname.includes('aistudio.google.com');

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
        if (data.config.customClientId) {
          setCustomClientIdInput(data.config.customClientId);
        }
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
   * Google OAuth login (Firebase Auth + GIS fallback)
   */
  const handleConnectGoogle = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoadingStatus(true);

    const effectiveClientId = config?.customClientId?.trim() || firebaseConfig.oAuthClientId || '267727679201-q0g370h7v21q099s2efjf9c1nbh6dduc.apps.googleusercontent.com';

    try {
      // 1. Try Firebase Authentication with Google Provider
      const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      const auth = getAuth(firebaseApp);
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/drive.file');
      provider.addScope('https://www.googleapis.com/auth/userinfo.email');
      provider.setCustomParameters({ prompt: 'consent' });

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        await sendTokenToServer(credential.accessToken);
        return;
      }
    } catch (popupErr: any) {
      console.warn('Firebase popup error, attempting Google Identity Services fallback:', popupErr);
    }

    // 2. Fallback to Google Identity Services (GIS)
    if (typeof window !== 'undefined' && window.google?.accounts?.oauth2 && effectiveClientId) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: effectiveClientId,
          scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email',
          callback: async (tokenResponse: any) => {
            if (tokenResponse.error) {
              if (tokenResponse.error === 'origin_mismatch' || String(tokenResponse.error_description || '').includes('origin')) {
                setErrorMsg('دامنه فعلی در فهرست دامنه‌های مجاز Google Cloud قرار ندارد. لطفاً از گزینه «اتصال از لینک سرور ابری» یا «اتصال مستقیم (توکن)» استفاده فرمایید.');
              } else {
                setErrorMsg(`خطا در احراز هویت گوگل: ${tokenResponse.error_description || tokenResponse.error}`);
              }
              setIsLoadingStatus(false);
              return;
            }

            if (tokenResponse.access_token) {
              await sendTokenToServer(tokenResponse.access_token, tokenResponse.expires_in);
            }
          }
        });

        tokenClient.requestAccessToken({ prompt: 'consent' });
        return;
      } catch (err: any) {
        console.warn('GIS Token client error, opening fallback modal:', err);
        setShowManualTokenModal(true);
      }
    } else {
      setShowManualTokenModal(true);
    }
    setIsLoadingStatus(false);
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

  const handleSaveCustomClientId = async () => {
    try {
      setIsLoadingStatus(true);
      const res = await fetch('/api/admin/gdrive/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customClientId: customClientIdInput.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('✅ شناسه کارخواه (Client ID) با موفقیت ذخیره شد.');
        setShowClientIdModal(false);
        await fetchStatus();
      } else {
        setErrorMsg(data.message || 'خطا در ذخیره Client ID');
      }
    } catch (err: any) {
      setErrorMsg('خطا در ارتباط با سرور: ' + err.message);
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
      } else {
        setErrorMsg(data.message || 'خطا در قطع اتصال');
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
          maxDbSnapshotsToKeep: Number(maxSnapshots)
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('✅ تنظیمات زمان‌بندی پشتیبان‌گیری درایو با موفقیت ذخیره شد.');
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
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleConnectGoogle}
                  disabled={isLoadingStatus}
                  className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-black text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoadingStatus ? <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> : <CloudUpload className="w-4 h-4 text-blue-600" />}
                  <span>اتصال حساب گوگل</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualTokenModal(true)}
                  className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Key className="w-4 h-4 text-slate-950" />
                  <span>اتصال مستقیم با توکن</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowClientIdModal(true)}
                  title="تنظیمات شناسه اختصاصی Client ID"
                  className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition cursor-pointer"
                >
                  <Settings2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Account Info / Storage Bar if Connected */}
        {hasToken && connectionInfo?.ok && (
          <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="flex items-center gap-2 text-blue-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>ایمیل متصل: <strong className="text-white font-mono">{userEmail || connectionInfo.userEmail}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-blue-200">
              <HardDrive className="w-4 h-4 text-sky-400 shrink-0" />
              <span>
                فضای درایو: <strong className="text-white font-bold">{toPersianDigits(connectionInfo.usedQuotaGb?.toFixed(2) || 0)} GB</strong> از <strong className="text-white font-bold">{toPersianDigits(connectionInfo.totalQuotaGb?.toFixed(1) || 15)} GB</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 text-blue-200">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>پوشه اصلی: <strong className="text-white font-mono">MaktabKhaneh_Backups</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Custom Domain Notice if applicable */}
      {isCustomDomain && !hasToken && (
        <div className="p-4 bg-amber-50/90 border border-amber-300/80 rounded-2xl space-y-2 text-xs text-amber-900 animate-in fade-in">
          <div className="flex items-center gap-2 font-bold text-amber-950 text-xs">
            <Globe className="w-4 h-4 text-amber-600 shrink-0" />
            <span>راهنمای اتصال گوگل درایو روی دامنه اختصاصی ({typeof window !== 'undefined' ? window.location.hostname : 'maktabkhune.ir'}):</span>
          </div>
          <p className="leading-relaxed text-amber-800">
            خطای <span className="font-mono font-bold bg-amber-100 px-1 py-0.5 rounded">origin_mismatch</span> زمانی از سمت گوگل رخ می‌دهد که پنجره ورود روی دامنه‌ای غیر از سرور اصلی ابری باز شود. برای اتصال سریع و بدون مشکل، یکی از ۳ روش زیر را انجام دهید:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-1">
              <span className="font-bold text-emerald-700 block">روش ۱: اتصال از سرور اصلی ابری (فوری)</span>
              <p className="text-[11px] text-slate-600 leading-normal">
                پنل مدیریت را در لینک Cloud Run باز کنید و روی دکمه اتصال بزنید؛ چون دیتابیس مشترک است، دامنه maktabkhune.ir هم خودکار متصل می‌شود.
              </p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-1">
              <span className="font-bold text-amber-800 block">روش ۲: اتصال سریع با توکن</span>
              <p className="text-[11px] text-slate-600 leading-normal">
                با زدن دکمه نارنجی «اتصال مستقیم با توکن» و دریافت توکن از OAuth Playground، بدون نیاز به هیچ دامنه‌ای فوراً متصل شوید.
              </p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-1">
              <span className="font-bold text-blue-700 block">روش ۳: ثبت Client ID اختصاصی</span>
              <p className="text-[11px] text-slate-600 leading-normal">
                اگر در Google Cloud کنسول، Client ID با دامنه maktabkhune.ir ساخته‌اید، آن را در آیکون چرخ‌دنده تنظیمات وارد نمایید.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Status Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-2xl flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold rounded-2xl flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
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
        {/* Left Column: How Standard Differential Backup Works (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-3.5">
            <div className="flex items-center gap-2 text-slate-800 font-black text-xs border-b border-slate-200/80 pb-2.5">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>مکانیسم بهینه پشتیبان‌گیری تفاضلی (Differential Sync)</span>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed font-medium">
              <div className="flex items-start gap-2">
                <Layers className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800">۱. پوشه‌بندی استاندارد در گوگل درایو:</strong>
                  <p className="text-[11px] text-slate-500">
                    پوشه <span className="font-mono font-bold text-slate-700">MaktabKhaneh_Backups</span> شامل دو زیرپوشه <span className="font-mono text-slate-700">Database_Snapshots</span> و <span className="font-mono text-slate-700">Uploaded_Photos</span> در درایو شما ایجاد می‌شود.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800">۲. مقایسه هش MD5 (تفاضلی هوشمند):</strong>
                  <p className="text-[11px] text-slate-500">
                    برای تصاویر کتاب‌ها، تنها فایل‌های جدید یا ویرایش‌شده آپلود می‌شوند و از مصرف حجم و ترافیک تکراری جلوگیری می‌شود.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Send className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800">۳. ارسال آنی نوتیفیکیشن و لاگ به بله:</strong>
                  <p className="text-[11px] text-slate-500">
                    در پایان هر بکاپ، خلاصه وضعیت و تعداد فایل‌های منتقل‌شده به کانال یا ادمین بله تلگراف می‌شود.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Configuration Form (7 cols) */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSaveConfig} className="p-5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <div className="flex items-center gap-2 text-slate-800 font-black text-xs">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span>تنظیمات زمان‌بندی پشتیبان‌گیری خودکار (Scheduler)</span>
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
                    <span>ذخیره تنظیمات زمان‌بندی</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Manual OAuth Token Modal */}
      {showManualTokenModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-right">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-800 font-black text-sm">
                <Key className="w-5 h-5 text-amber-600" />
                <span>اتصال مستقیم با توکن گوگل (OAuth Access Token)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowManualTokenModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-950 space-y-2 leading-relaxed">
              <p className="font-bold">نحوه دریافت سریع توکن در ۱ دقیقه بدون نیاز به تنظیم دامنه:</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-700 text-[11px]">
                <li>
                  وارد سایت{' '}
                  <a
                    href="https://developers.google.com/oauthplayground"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 font-bold underline font-mono"
                  >
                    Google OAuth Playground
                  </a>{' '}
                  شوید.
                </li>
                <li>در لیست سمت چپ، دسترسی <span className="font-mono bg-white px-1 py-0.5 rounded border border-amber-200 font-bold">Drive API v3</span> را باز کرده و تیک <span className="font-mono font-semibold">https://www.googleapis.com/auth/drive.file</span> را بزنید.</li>
                <li>روی دکمه <span className="font-bold">Authorize APIs</span> کلیک کرده و با حساب گوگل خود اجازه دسترسی دهید.</li>
                <li>در مرحله ۲ روی <span className="font-bold">Exchange authorization code for tokens</span> کلیک کنید.</li>
                <li>مقدار <span className="font-mono font-bold bg-white px-1 py-0.5 rounded border border-amber-200">Access token</span> را کپی کرده و در کادر زیر جای‌گذاری کنید.</li>
              </ol>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">توکن دسترسی گوگل (Bearer Token):</label>
              <textarea
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="ya29.a0AfH6SM..."
                rows={3}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 focus:bg-white transition text-left dir-ltr"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowManualTokenModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
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
                <span>ثبت و اتصال به گوگل درایو</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Client ID Modal */}
      {showClientIdModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-right">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-800 font-black text-sm">
                <Settings2 className="w-5 h-5 text-indigo-600" />
                <span>تنظیم شناسه کارخواه اختصاصی گوگل (OAuth Client ID)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowClientIdModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              اگر در کنسول گوگل (<span className="font-mono text-slate-800 font-bold">Google Cloud Console</span>) برای دامنه خود یک OAuth Client ID از نوع Web Application ساخته‌اید و آدرس <span className="font-mono font-bold text-indigo-700">https://maktabkhune.ir</span> را در <span className="font-mono font-bold">Authorized JavaScript origins</span> قرار داده‌اید، شناسه آن را در کادر زیر وارد فرمایید:
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">شناسه اختصاصی Google OAuth Client ID:</label>
              <input
                type="text"
                value={customClientIdInput}
                onChange={(e) => setCustomClientIdInput(e.target.value)}
                placeholder="مثلاً: 123456789-xyz.apps.googleusercontent.com"
                className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 focus:bg-white transition text-left dir-ltr"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowClientIdModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleSaveCustomClientId}
                disabled={isLoadingStatus}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                {isLoadingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>ذخیره Client ID</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
