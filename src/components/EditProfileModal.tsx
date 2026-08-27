import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { STUDENT_AVATARS, ADMIN_SPECIAL_AVATARS } from '../utils/avatars';
import { User, Sparkles, X, Check, Save, ShieldCheck, Upload, Camera, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { CameraCaptureModal } from './CameraCaptureModal';

interface EditProfileModalProps {
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ onClose }) => {
  const { currentUser, updateUser, schoolClasses } = useApp();

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin' || currentUser.id.startsWith('u_admin_');

  const [name, setName] = useState(currentUser.name || '');
  const [className, setClassName] = useState(currentUser.className || '');
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser.avatar || '');
  const [password, setPassword] = useState(currentUser.password || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('لطفا فقط فایل تصویری انتخاب کنید.');
      return;
    }

    setIsUploading(true);
    setErrorMsg('');

    try {
      const res = await api.uploadImage(file);
      if (res.success && res.fileUrl) {
        setSelectedAvatar(res.fileUrl);
      } else {
        setErrorMsg(res.message || 'خطا در آپلود آواتار');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در شبکه');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCameraCapture = async (file: File) => {
    setIsUploading(true);
    setErrorMsg('');

    try {
      const res = await api.uploadImage(file);
      if (res.success && res.fileUrl) {
        setSelectedAvatar(res.fileUrl);
      } else {
        setErrorMsg(res.message || 'خطا در آپلود تصویر دوربین');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در شبکه');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('لطفاً نام و نام خانوادگی را وارد کنید.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    try {
      const updated = updateUser(currentUser.id, {
        name: name.trim(),
        className: className.trim() || (isAdmin ? 'مدیریت کتابخانه' : 'نامشخص'),
        avatar: selectedAvatar,
        password: password.trim() || currentUser.password
      });

      if (updated) {
        setSuccessMsg('اطلاعات حساب کاربری با موفقیت به‌روزرسانی شد.');
        setTimeout(() => {
          onClose();
        }, 900);
      } else {
        setErrorMsg('خطا در ذخیره اطلاعات. لطفاً دوباره تلاش کنید.');
      }
    } catch {
      setErrorMsg('خطایی رخ داد.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <span>ویرایش مشخصات و آواتار</span>
              {isAdmin && (
                <span className="text-[11px] bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <span>👑</span>
                  <span>حساب مدیر</span>
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500">
              {isAdmin
                ? 'امکان ویرایش نام نمایشی راهبر، عنوان و انتخاب آواتار ویژه مدیریت'
                : 'تغییر نام نمایشی، کلاس و آواتار اختصاصی شما در مکتب‌خانه'}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl border border-rose-200">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar Picker */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-700 block flex items-center justify-between">
              <span>انتخاب آواتار چهره:</span>
              <span className="text-[11px] text-cyan-700 font-normal">
                {isAdmin ? '✨ شامل آواتارهای اختصاصی راهبر سامانه' : 'یک تصویر ۳ بعدی انتخاب کنید'}
              </span>
            </label>

            {/* If Admin, show special Admin Avatars in spotlight */}
            {isAdmin && (
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 mb-2 space-y-2">
                <div className="text-[11px] font-black text-amber-900 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>آواتارهای ویژه و اختصاصی مدیر و راهبر:</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {ADMIN_SPECIAL_AVATARS.map((av) => {
                    const isSelected = selectedAvatar === av.url;
                    return (
                      <div
                        key={av.id}
                        onClick={() => setSelectedAvatar(av.url)}
                        className={`cursor-pointer p-2 rounded-xl border-2 transition flex items-center gap-2.5 ${
                          isSelected
                            ? 'border-amber-500 bg-amber-100 ring-2 ring-amber-400/50 shadow-sm'
                            : 'border-amber-200 bg-white hover:bg-amber-50/80'
                        }`}
                      >
                        <img
                          src={av.url}
                          alt={av.name}
                          className="w-10 h-10 rounded-xl object-cover ring-1 ring-amber-300 shrink-0"
                        />
                        <div className="text-right leading-tight">
                          <span className="text-[11px] font-black text-slate-800 block">
                            {av.name.replace('آواتار ویژه ', '')}
                          </span>
                          <span className="text-[9px] text-amber-800 block opacity-80">
                            ویژه مدیریت 👑
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Custom Avatar Upload or Camera Photo option */}
            <div className="flex items-center gap-2 mb-2">
              <label className="cursor-pointer px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition flex items-center gap-1.5">
                {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 text-slate-600" />}
                <span>بارگذاری عکس شخصی</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => setShowCameraModal(true)}
                disabled={isUploading}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-300 transition flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5 text-emerald-600" />
                <span>عکاسی با دوربین</span>
              </button>
            </div>

            {/* Standard 3D Student Avatars */}
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200">
              {STUDENT_AVATARS.map((av) => {
                const isSelected = selectedAvatar === av.url;
                return (
                  <button
                    type="button"
                    key={av.id}
                    onClick={() => setSelectedAvatar(av.url)}
                    className={`relative p-1 rounded-2xl border-2 transition flex flex-col items-center justify-center ${
                      isSelected
                        ? 'border-cyan-600 bg-cyan-100 ring-2 ring-cyan-500/50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <img
                      src={av.url}
                      alt="avatar"
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-600 text-white rounded-full flex items-center justify-center text-[9px] font-black">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              {isAdmin ? 'نام و عنوان مدیر سامانه:' : 'نام و نام خانوادگی دانش‌آموز:'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isAdmin ? 'مثال: پارسا فیض (مدیر مکتب‌خانه)' : 'مثال: علی محمدی'}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs sm:text-sm font-bold bg-slate-50 focus:bg-white transition"
            />
          </div>

          {/* Class or Position */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              {isAdmin ? 'عنوان سازمانی یا سمت:' : 'کلاس و پایه تحصیلی:'}
            </label>
            {isAdmin ? (
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="مثال: مدیر و راهبر مکتب‌خانه"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs sm:text-sm font-bold bg-slate-50 focus:bg-white transition"
              />
            ) : (
              <select
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs sm:text-sm font-bold bg-slate-50 focus:bg-white transition"
              >
                <option value="">انتخاب کلاس...</option>
                {schoolClasses.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name} ({c.grade})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Phone (Readonly) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 block">
              شماره همراه (غیرقابل تغییر):
            </label>
            <input
              type="text"
              disabled
              value={currentUser.phone}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-500 bg-slate-100 cursor-not-allowed font-mono"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-cyan-600 hover:bg-cyan-700 shadow-md shadow-cyan-600/20 transition flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}</span>
            </button>
          </div>
        </form>

        <CameraCaptureModal
          isOpen={showCameraModal}
          onClose={() => setShowCameraModal(false)}
          onCapture={handleCameraCapture}
          title="عکاسی آواتار با دوربین"
          facingMode="user"
        />
      </div>
    </div>
  );
};
