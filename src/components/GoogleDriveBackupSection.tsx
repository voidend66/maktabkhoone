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
  Globe,
  Lock,
  Server,
  FileCode,
  HelpCircle,
  ChevronDown,
  ChevronUp,
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

type AuthTab = 'refresh_token' | 'service_account' | 'direct_token';

export const GoogleDriveBackupSection: React.FC = () => {
  const [config, setConfig] = useState<GoogleDriveConfig | null>(null);
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
  const [hasToken, setHasToken] = useState<boolean>(false);
  const [hasPermanentAuth, setHasPermanentAuth] = useState<boolean>(false);
  const [authType, setAuthType] = useState<string>('oauth_token');
  const [isTokenValid, setIsTokenValid] = useState<boolean>(false);
  const [isTokenExpired, setIsTokenExpired] = useState<boolean>(false);
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

  // Permanent Auth Dialog / Modal
  const [showPermanentAuthModal, setShowPermanentAuthModal] = useState<boolean>(false);
  const [activeAuthTab, setActiveAuthTab] = useState<AuthTab>('refresh_token');

  // Input states
  const [refreshTokenInput, setRefreshTokenInput] = useState<string>('');
  const [serviceAccountJsonInput, setServiceAccountJsonInput] = useState<string>('');
  const [directTokenInput, setDirectTokenInput] = useState<string>('');
  const [customClientIdInput, setCustomClientIdInput] = useState<string>('');
  const [customClientSecretInput, setCustomClientSecretInput] = useState<string>('');

  // Guide accordion state
  const [showPlaygroundGuide, setShowPlaygroundGuide] = useState<boolean>(true);
  const [copiedScope, setCopiedScope] = useState<boolean>(false);

  const fetchStatus = async () => {
    try {
      setIsLoadingStatus(true);
      setErrorMsg(null);
      const res = await fetch('/api/admin/gdrive/status');
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
        setHasToken(data.hasToken);
        setHasPermanentAuth(data.hasPermanentAuth ?? false);
        setAuthType(data.authType || 'oauth_token');
        setUserEmail(data.userEmail);
        setConnectionInfo(data.connectionInfo);

        const valid = data.isTokenValid ?? (data.hasToken && data.connectionInfo?.ok);
        const expired = data.isTokenExpired ?? (data.hasToken && data.connectionInfo?.ok === false);
        setIsTokenValid(valid);
        setIsTokenExpired(expired);

        setEnabled(data.config.enabled ?? false);
        setFrequency(data.config.frequency || 'daily');
        setScheduledHour(data.config.scheduledHour ?? 2);
        setAutoPrune(data.config.autoPruneOldDbSnapshots ?? true);
        setMaxSnapshots(data.config.maxDbSnapshotsToKeep ?? 30);
        if (data.config.customClientId) {
          setCustomClientIdInput(data.config.customClientId);
        }
        if (data.config.customClientSecret) {
          setCustomClientSecretInput(data.config.customClientSecret);
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
   * Submit credentials to server
   */
  const handleSaveAuthCredentials = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoadingStatus(true);

    try {
      const payload: any = {};

      if (activeAuthTab === 'refresh_token') {
        if (!refreshTokenInput.trim()) {
          setErrorMsg('لطفاً مقدار Refresh Token را وارد فرمایید.');
          setIsLoadingStatus(false);
          return;
        }
        payload.refreshToken = refreshTokenInput.trim();
        if (customClientIdInput.trim()) payload.customClientId = customClientIdInput.trim();
        if (customClientSecretInput.trim()) payload.customClientSecret = customClientSecretInput.trim();
      } else if (activeAuthTab === 'service_account') {
        if (!serviceAccountJsonInput.trim()) {
          setErrorMsg('لطفاً محتوای JSON کلید سرویس اکانت گوگل را وارد فرمایید.');
          setIsLoadingStatus(false);
          return;
        }
        payload.serviceAccountJson = serviceAccountJsonInput.trim();
      } else if (activeAuthTab === 'direct_token') {
        if (!directTokenInput.trim()) {
          setErrorMsg('لطفاً توکن دسترسی گوگل (Access Token) را وارد فرمایید.');
          setIsLoadingStatus(false);
          return;
        }
        payload.accessToken = directTokenInput.trim();
      }

      const res = await fetch('/api/admin/gdrive/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMsg(data.message || '✅ اطلاعات احراز هویت با موفقیت در سرور ذخیره شد.');
        setShowPermanentAuthModal(false);
        setRefreshTokenInput('');
        setServiceAccountJsonInput('');
        setDirectTokenInput('');
        await fetchStatus();
      } else {
        setErrorMsg(data.message || 'خطا در ثبت احراز هویت');
      }
    } catch (err: any) {
      setErrorMsg('خطای شبکه در اتصال: ' + err.message);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  /**
   * Handle Service Account JSON File Upload
   */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setServiceAccountJsonInput(content);
    };
    reader.readAsText(file);
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
          maxDbSnapshotsToKeep: Number(maxSnapshots),
          customClientId: customClientIdInput.trim(),
          customClientSecret: customClientSecretInput.trim()
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
        setSuccessMsg('✅ عملیات پشتیبان‌گیری تفاضلی در گوگل درایو با موفقیت پایان یافت و گزارش به پیام‌رسان بله ارسال شد.');
        setIsTokenValid(true);
        setIsTokenExpired(false);
        await fetchStatus();
      } else {
        if (res.status === 401 || data.isTokenExpired || data.message?.includes('منقضی') || data.message?.includes('401')) {
          setIsTokenExpired(true);
          setIsTokenValid(false);
        }
        setErrorMsg(data.message || 'خطا در پشتیبان‌گیری');
      }
    } catch (err: any) {
      setErrorMsg('خطا در برقراری ارتباط با سرور: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const copyDriveScope = () => {
    navigator.clipboard.writeText('https://www.googleapis.com/auth/drive.file');
    setCopiedScope(true);
    setTimeout(() => setCopiedScope(false), 2500);
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
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg border border-indigo-900/50">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="flex items-start gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-white/10 border border-white/20 text-white flex items-center justify-center shrink-0 shadow-inner">
              <Cloud className="w-7 h-7 text-sky-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="font-black text-lg text-white">
                  پشتیبان‌گیری ابری دائمی و تفاضلی گوگل درایو (Google Drive)
                </h3>
                {hasToken && isTokenValid && hasPermanentAuth ? (
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>اتصال دائمی و تمدید خودکار سروری (بدون انقضا)</span>
                  </span>
                ) : hasToken && isTokenValid && !hasPermanentAuth ? (
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>اتصال موقت با توکن (پیشنهاد: دائمی‌سازی با رفرش‌توکن)</span>
                  </span>
                ) : hasToken && isTokenExpired ? (
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-rose-500/25 text-rose-300 border border-rose-400/40 flex items-center gap-1.5 animate-pulse">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                    <span>توکن منقضی شده (دائمی‌سازی با رفرش‌توکن)</span>
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-slate-700/80 text-slate-200 border border-slate-600">
                    نیازمند اتصال دائمی به حساب گوگل
                  </span>
                )}
              </div>
              <p className="text-xs text-blue-100/80 font-medium mt-1 leading-relaxed max-w-2xl">
                پشتیبان‌گیری کاملاً خودکار و تفاضلی (Incremental) در پس‌زمینه بدون نیاز به باز بودن مرورگر. با اتصال دائمی (Refresh Token یا Service Account)، سرور به صورت مادام‌العمر توکن‌ها را در زمان زمان‌بندی‌شده تمدید می‌کند و هیچ نیازی به تایید دستی مجدد نخواهد بود.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {hasToken && isTokenValid ? (
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
                  onClick={() => setShowPermanentAuthModal(true)}
                  className="px-3.5 py-2.5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-xl border border-white/20 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Key className="w-4 h-4 text-amber-300" />
                  <span>{hasPermanentAuth ? 'تغییر کلید اتصال' : 'دائمی‌سازی اتصال (Refresh Token)'}</span>
                </button>

                <button
                  type="button"
                  onClick={fetchStatus}
                  title="بررسی مجدد وضعیت اتصال"
                  disabled={isLoadingStatus}
                  className="p-2.5 bg-white/10 hover:bg-white/20 text-blue-200 rounded-xl border border-white/10 transition cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingStatus ? 'animate-spin' : ''}`} />
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
                  onClick={() => setShowPermanentAuthModal(true)}
                  className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer shadow-amber-500/20"
                >
                  <ShieldCheck className="w-4 h-4 text-slate-950" />
                  <span>اتصال دائمی و خودکار گوگل درایو</span>
                </button>

                {hasToken && (
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    title="حذف و قطع اتصال قبلی"
                    className="p-2.5 bg-white/10 hover:bg-rose-500/30 text-rose-300 rounded-xl border border-white/10 transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Account Info / Storage Bar if Connected */}
        {hasToken && isTokenValid && connectionInfo?.ok && (
          <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="flex items-center gap-2 text-blue-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                ایمیل متصل: <strong className="text-white font-mono">{userEmail || connectionInfo.userEmail}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 text-blue-200">
              <HardDrive className="w-4 h-4 text-sky-400 shrink-0" />
              <span>
                فضای درایو: <strong className="text-white font-bold">{toPersianDigits(connectionInfo.usedQuotaGb?.toFixed(2) || 0)} GB</strong> از <strong className="text-white font-bold">{toPersianDigits(connectionInfo.totalQuotaGb?.toFixed(1) || 15)} GB</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 text-blue-200">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                شیوه احراز: <strong className="text-white font-bold">{authType === 'service_account' ? 'سرویس‌اکانت دائمی' : authType === 'refresh_token' ? 'تمدید خودکار رفرش‌توکن' : 'توکن موقت'}</strong>
              </span>
            </div>
          </div>
        )}

        {/* Warning if using temporary token */}
        {hasToken && isTokenValid && !hasPermanentAuth && (
          <div className="mt-4 pt-3 border-t border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-200 bg-amber-500/10 p-3 rounded-xl">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>توکن فعلی شما موقت است و ممکن است پس از چند ساعت منقضی شود. برای اینکه بکاپ‌ها شبانه بدون توقف انجام شوند، «اتصال دائمی با Refresh Token» را ثبت کنید.</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveAuthTab('refresh_token');
                setShowPermanentAuthModal(true);
              }}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition shrink-0 cursor-pointer flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ثبت Refresh Token دائمی</span>
            </button>
          </div>
        )}

        {/* Notice if token is expired */}
        {hasToken && isTokenExpired && (
          <div className="mt-4 pt-3 border-t border-rose-500/30 flex items-center justify-between gap-3 text-xs text-rose-200 bg-rose-500/15 p-3 rounded-xl">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>اعتبار توکن منقضی شده است. با ثبت Refresh Token در بخش اتصال، برای همیشه از انقضا خلاص شوید و سیستم خودکار تمدید کند.</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveAuthTab('refresh_token');
                setShowPermanentAuthModal(true);
              }}
              className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-lg transition shrink-0 cursor-pointer flex items-center gap-1 shadow-md"
            >
              <Key className="w-3.5 h-3.5" />
              <span>اتصال دائمی با Refresh Token</span>
            </button>
          </div>
        )}
      </div>

      {/* Status Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-2xl flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveAuthTab('refresh_token');
              setShowPermanentAuthModal(true);
            }}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>تنظیم اتصال دائمی (Refresh Token)</span>
          </button>
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
                {toPersianDigits(syncResult.details?.totalSkippedPhotos || 0)} <span className="text-[10px] font-normal text-slate-500">فایل (بدون مصرف حجم)</span>
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
              <span>مکانیسم پشتیبان‌گیری تمام خودکار و تفاضلی سرور</span>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed font-medium">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800">۱. تمدید خودکار و بی‌وقفه توسط سرور:</strong>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    با یک‌بار ذخیره <strong className="text-slate-700">Refresh Token</strong>، سرور در پس‌زمینه خودکار توکن تازه می‌گیرد؛ نیازی به حضور یا لاگین مجدد شما نیست.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Layers className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800">۲. ساختاربندی منظم در پوشه اختصاصی:</strong>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    پوشه <span className="font-mono font-bold text-slate-700">MaktabKhaneh_Backups</span> شامل دو بخش <span className="font-mono text-slate-700">Database_Snapshots</span> و <span className="font-mono text-slate-700">Uploaded_Photos</span> در درایو شما تشکیل می‌گردد.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800">۳. کنترل هش تفاضلی (عدم آپلود تکراری):</strong>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    تصاویر قبلاً آپلودشده رد می‌شوند و فقط تصاویر تازه اضافه شده کتاب‌ها منتقل می‌گردند.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Send className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800">۴. پیام‌رسانی هوشمند به ادمین در بله:</strong>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    پس از هر بار بکاپ شبانه، وضعیت دقیق و حجم فایل‌ها به بله ارسال خواهد شد.
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
                <span>تنظیمات زمان‌بندی پشتیبان‌گیری خودکار (Cron Scheduler)</span>
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
                  پیشنهاد: ساعت ۰۲:۰۰ تا ۰۴:۰۰ بامداد به علت حداقل استفاده کاربران
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

      {/* Permanent Authentication Modal */}
      {showPermanentAuthModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 text-right my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5 text-slate-900 font-black text-sm">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
                <div>
                  <h4 className="text-sm font-black text-slate-900">اتصال دائمی و تمدید خودکار گوگل درایو</h4>
                  <p className="text-[11px] text-slate-500 font-normal">برای اینکه بکاپ‌های خودکار سروری هرگز منقضی نشوند</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPermanentAuthModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-xs font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => setActiveAuthTab('refresh_token')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeAuthTab === 'refresh_token'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Key className="w-4 h-4 text-indigo-600" />
                <span>۱. روش Refresh Token (ساده و پیشنهادی)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveAuthTab('service_account')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeAuthTab === 'service_account'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Server className="w-4 h-4 text-emerald-600" />
                <span>۲. سرویس اکانت گوگل (سازمانی)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveAuthTab('direct_token')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeAuthTab === 'direct_token'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>۳. توکن مستقیم</span>
              </button>
            </div>

            {/* TAB 1: REFRESH TOKEN (RECOMMENDED & PERMANENT) */}
            {activeAuthTab === 'refresh_token' && (
              <div className="space-y-4">
                <div className="p-4 bg-indigo-50/80 rounded-2xl border border-indigo-200 text-xs text-indigo-950 space-y-2.5 leading-relaxed">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-indigo-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      آموزش ۳۰ ثانیه‌ای دریافت Refresh Token دائمی از Google OAuth Playground:
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPlaygroundGuide(!showPlaygroundGuide)}
                      className="text-indigo-600 font-bold text-[11px] flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <span>{showPlaygroundGuide ? 'بستن راهنما' : 'نمایش مراحل'}</span>
                      {showPlaygroundGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {showPlaygroundGuide && (
                    <ol className="list-decimal list-inside space-y-2 text-slate-700 text-[11px] pt-1 border-t border-indigo-200/60">
                      <li>
                        وارد سایت رسمی{' '}
                        <a
                          href="https://developers.google.com/oauthplayground"
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-700 font-bold underline font-mono inline-flex items-center gap-0.5"
                        >
                          Google OAuth Playground
                          <ExternalLink className="w-3 h-3 inline" />
                        </a>{' '}
                        شوید.
                      </li>
                      <li>
                        در سمت چپ (Step 1)، در کادر <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-indigo-200 font-bold">Input your own scopes</span>، آدرس زیر را کپی و قرار دهید:
                        <div className="mt-1 flex items-center gap-2">
                          <code className="px-2.5 py-1 bg-white rounded-lg border border-indigo-200 font-mono text-[11px] text-indigo-900 font-bold dir-ltr flex-1 truncate">
                            https://www.googleapis.com/auth/drive.file
                          </code>
                          <button
                            type="button"
                            onClick={copyDriveScope}
                            className="px-2.5 py-1 bg-indigo-600 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            {copiedScope ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedScope ? 'کپی شد' : 'کپی آدرس'}</span>
                          </button>
                        </div>
                      </li>
                      <li>
                        روی دکمه آبی <strong className="text-indigo-900 font-bold">Authorize APIs</strong> کلیک کنید و وارد حساب جیمیل خود شوید و تایید کنید.
                      </li>
                      <li>
                        در مرحله دوم (Step 2)، روی دکمه آبی <strong className="text-indigo-900 font-bold">Exchange authorization code for tokens</strong> بزنید.
                      </li>
                      <li>
                        مقدار فیلد <strong className="text-emerald-700 font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-300">Refresh token</strong> (که با <span className="font-mono">1//...</span> آغاز می‌شود) را کپی کرده و در کادر زیر قرار دهید.
                      </li>
                    </ol>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    مقدار Refresh Token دائمی گوگل (شروع با 1//...):
                  </label>
                  <textarea
                    value={refreshTokenInput}
                    onChange={(e) => setRefreshTokenInput(e.target.value)}
                    placeholder="1//04..."
                    rows={2}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 focus:bg-white transition text-left dir-ltr"
                  />
                  <p className="text-[11px] text-emerald-700 font-medium">
                    🛡️ سرور با داشتن این رفرش‌توکن، پیش از هر بکاپ خودکار یک Access Token تازه دریافت می‌کند؛ بنابراین دیگر هیچ‌وقت منقضی نخواهد شد.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <span className="font-bold text-slate-700 block">شناسه و سکرت اختصاصی کارخواه (اختیاری - اگر از پروژه کنسول خودتان استفاده می‌کنید):</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={customClientIdInput}
                      onChange={(e) => setCustomClientIdInput(e.target.value)}
                      placeholder="Custom Client ID (اختیاری)"
                      className="text-xs p-2.5 bg-white border border-slate-300 rounded-lg font-mono text-left dir-ltr"
                    />
                    <input
                      type="password"
                      value={customClientSecretInput}
                      onChange={(e) => setCustomClientSecretInput(e.target.value)}
                      placeholder="Custom Client Secret (اختیاری)"
                      className="text-xs p-2.5 bg-white border border-slate-300 rounded-lg font-mono text-left dir-ltr"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SERVICE ACCOUNT JSON (ENTERPRISE) */}
            {activeAuthTab === 'service_account' && (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-2 leading-relaxed">
                  <span className="font-black text-emerald-900 block">
                    اتصال به کمک سرویس اکانت گوگل (Google Cloud Service Account):
                  </span>
                  <p className="text-[11px] text-slate-600">
                    در کنسول ابری گوگل (Google Cloud Console)، یک Service Account بسازید، برای آن کلید JSON ایجاد و دانلود نمایید. سپس فایل را در زیر آپلود یا متن آن را جای‌گذاری کنید.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800">محتوای کلید JSON سرویس اکانت:</label>
                    <label className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer flex items-center gap-1">
                      <FileCode className="w-4 h-4" />
                      <span>آپلود فایل JSON</span>
                      <input
                        type="file"
                        accept=".json,application/json"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <textarea
                    value={serviceAccountJsonInput}
                    onChange={(e) => setServiceAccountJsonInput(e.target.value)}
                    placeholder='{"type": "service_account", "project_id": "...", "private_key": "...", ...}'
                    rows={6}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 focus:bg-white transition text-left dir-ltr"
                  />
                </div>
              </div>
            )}

            {/* TAB 3: DIRECT ACCESS TOKEN */}
            {activeAuthTab === 'direct_token' && (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-950 space-y-2 leading-relaxed">
                  <span className="font-black text-amber-900 block">
                    توکن دسترسی مستقیم (موقت - ۱ ساعته):
                  </span>
                  <p className="text-[11px] text-slate-600">
                    این روش فقط برای آزمایش فوری کاربرد دارد؛ چون توکن‌های مستقیم بعد از ۱ ساعت منقضی می‌شوند. برای بکاپ‌های خودکار همیشگی، حتماً از تب Refresh Token استفاده کنید.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">توکن دسترسی موقت (Bearer Token):</label>
                  <textarea
                    value={directTokenInput}
                    onChange={(e) => setDirectTokenInput(e.target.value)}
                    placeholder="ya29.a0AfH6SM..."
                    rows={3}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 focus:bg-white transition text-left dir-ltr"
                  />
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPermanentAuthModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleSaveAuthCredentials}
                disabled={isLoadingStatus}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                {isLoadingStatus ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>در حال اعتبارسنجی و ثبت دائمی...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>بررسی و ثبت دائمی در سرور</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
