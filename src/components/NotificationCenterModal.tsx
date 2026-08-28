import React from 'react';
import { AppNotification } from '../types';
import {
  Bell,
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MessageSquare,
  Star,
  BookOpen,
  ArrowLeftRight,
  ShieldAlert,
  Inbox,
  CheckCheck,
  Trash2
} from 'lucide-react';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onClearAll: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onClearAll,
  onNavigateTab
}) => {
  if (!isOpen) return null;

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'receipt_rejected':
        return <XCircle className="w-5 h-5 text-rose-600 shrink-0" />;
      case 'receipt_approved':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
      case 'account_suspended':
        return <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 animate-pulse" />;
      case 'book_review':
        return <MessageSquare className="w-5 h-5 text-sky-600 shrink-0" />;
      case 'feedback_received':
        return <Star className="w-5 h-5 text-amber-500 shrink-0" />;
      case 'loan_accepted':
        return <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />;
      case 'loan_requested':
        return <Inbox className="w-5 h-5 text-indigo-600 shrink-0" />;
      default:
        return <Bell className="w-5 h-5 text-cyan-600 shrink-0" />;
    }
  };

  const getBadgeColor = (type: AppNotification['type']) => {
    switch (type) {
      case 'receipt_rejected':
      case 'account_suspended':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'receipt_approved':
      case 'loan_accepted':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'feedback_received':
        return 'bg-amber-100 text-amber-900 border-amber-200';
      default:
        return 'bg-sky-100 text-sky-800 border-sky-200';
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-center items-start sm:items-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh] my-auto">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-600/30 rounded-2xl border border-cyan-400/30">
              <Bell className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black flex items-center gap-2">
                <span>مرکز اعلان‌ها و پیام‌ها</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-black rounded-full bg-rose-500 text-white animate-pulse">
                    {unreadCount} خوانده نشده
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-cyan-200/80 font-bold">
                مشاهده رویدادهای پرداخت، نظرات کاربران و وضعیت حساب
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Controls */}
        {notifications.length > 0 && (
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs shrink-0">
            <span className="font-bold text-slate-600">
              مجموع اعلان‌ها: {notifications.length} عدد
            </span>

            <button
              onClick={onClearAll}
              className="text-rose-600 hover:text-rose-800 font-extrabold flex items-center gap-1 hover:bg-rose-50 px-2 py-1 rounded-lg transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>پاک‌سازی همه اعلان‌ها</span>
            </button>
          </div>
        )}

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 no-scrollbar">
          {notifications.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 border border-slate-200">
                <Bell className="w-8 h-8 opacity-40" />
              </div>
              <p className="text-sm font-black text-slate-700">هیچ اعلانی ثبت نشده است</p>
              <p className="text-xs text-slate-700 max-w-xs mx-auto">
                رویدادهای مربوط به تایید/رد فیش، ثبت نظر روی کتاب‌ها و تغییرات حساب کاربری در این بخش به شما نمایش داده می‌شود.
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  if (!notif.isRead) onMarkRead(notif.id);
                  if (notif.linkTab && onNavigateTab) {
                    onNavigateTab(notif.linkTab);
                    onClose();
                  }
                }}
                className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3 relative ${
                  notif.isRead
                    ? 'bg-white border-slate-200 hover:bg-slate-50'
                    : 'bg-cyan-50/60 border-cyan-200 shadow-xs hover:bg-cyan-50'
                }`}
              >
                {!notif.isRead && (
                  <span className="absolute top-3 left-3 w-2 h-2 rounded-full bg-rose-500 ring-4 ring-rose-100 animate-ping" />
                )}

                <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs shrink-0 mt-0.5">
                  {getIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-black text-xs sm:text-sm text-slate-900 truncate">
                      {notif.title}
                    </h3>
                    <span className="text-[10px] font-extrabold text-slate-700 shrink-0">
                      {notif.createdAt}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-bold">
                    {notif.message}
                  </p>

                  {notif.linkTab && (
                    <div className="pt-1 flex items-center gap-1.5">
                      <span className="text-[10px] font-black text-cyan-700 bg-cyan-100/80 px-2 py-0.5 rounded-md border border-cyan-200 flex items-center gap-1">
                        <span>مشاهده و پیگیری</span>
                        <ArrowLeftRight className="w-3 h-3" />
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-slate-100 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition cursor-pointer"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
