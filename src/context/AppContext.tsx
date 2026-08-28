import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  User,
  Book,
  LendingRequest,
  SchoolClass,
  MutualFeedback,
  BookCondition,
  RequestStatus,
  RegistrationInput,
  BankCardInfo,
  SystemConfig,
  CustomAvatar,
  AppNotification
} from '../types';
import { INITIAL_USERS, INITIAL_BOOKS, INITIAL_REQUESTS, INITIAL_CLASSES, isAdminPhone } from '../data/mockData';
import { api } from '../services/api';
import { DEFAULT_BOOK_COVER, getSafeImageUrl } from '../utils/coverPresets';

const INITIAL_BANK_CARD: BankCardInfo = {
  cardNumber: '6037-9918-9876-5432',
  cardHolderName: 'پارسا فیض (مدیر و راهبر مکتب‌خانه)',
  bankName: 'بانک ملی ایران'
};

const INITIAL_SYSTEM_CONFIG: SystemConfig = {
  minBooksForRegistration: 3,
  maxBooksForRegistration: 5,
  requireAdminApproval: true,
  loanFeeAmount: 10000,
  loanDurationDays: 7,
  paymentWindowHours: 3,
  handoverWindowHours: 12,
  supportPhone: '09121112233',
  supportBaleId: 'maktabkhune_admin',
  supportAdminName: 'پارسا فیض (مسئول مکتب‌خانه)',
  supportHours: 'شنبه تا چهارشنبه - ساعت ۷:۳۰ الی ۱۴:۰۰',
  baleChannelUsername: '@maktabkhune_books',
  autoPublishBooksToBale: true,
  websiteBaseUrl: ''
};

const LOCAL_STORAGE_KEY_CURRENT_USER = 'school_lib_curr_user_v3';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  books: Book[];
  requests: LendingRequest[];
  schoolClasses: SchoolClass[];
  feedbacks: MutualFeedback[];
  bankCardInfo: BankCardInfo;
  systemConfig: SystemConfig;
  isLoading: boolean;
  loginUser: (phone: string, pass: string) => Promise<{ success: boolean; message: string; user?: User }>;
  loginWithBale: (phone: string) => Promise<{ success: boolean; message: string; user?: User }>;
  loginWithOtpPhone: (phone: string) => Promise<{ success: boolean; message: string; user?: User }>;
  logoutUser: () => void;
  registerUser: (data: RegistrationInput) => Promise<{ success: boolean; message: string; user?: User }>;
  updateUser: (userId: string, data: Partial<User>) => boolean;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; message?: string; user?: User }>;
  resetPasswordWithSMS: (phone: string, name: string, newPass: string) => { success: boolean; message: string };
  approveUser: (userId: string) => void;
  rejectUser: (userId: string, reason?: string) => void;
  suspendUser: (userId: string, reason: string) => Promise<{ success: boolean; message?: string }>;
  unsuspendUser: (userId: string) => Promise<{ success: boolean; message?: string }>;
  sendBaleMessageToStudent: (userId: string, message: string) => Promise<{ success: boolean; message: string }>;
  deleteUser: (userId: string) => Promise<{ success: boolean; message?: string }>;
  makeAdmin: (id: string) => Promise<{ success: boolean; message?: string }>;
  addAdminByPhone: (data: { phone: string; name?: string; password?: string }) => Promise<{ success: boolean; message?: string }>;
  addBook: (book: {
    title: string;
    author: string;
    category: string;
    condition: BookCondition;
    coverImage: string;
    description: string;
  }) => Promise<Book>;
  deleteBook: (bookId: string) => void;
  requestBookLoan: (bookId: string) => Promise<{ success: boolean; message: string; needBooks?: boolean }>;
  acceptLoanRequest: (
    requestId: string,
    pickupLocation: string,
    pickupTime: string,
    pickupShift?: 'morning' | 'afternoon' | 'evening_home'
  ) => void;
  rejectLoanRequest: (requestId: string) => void;
  submitPaymentProof: (
    requestId: string,
    proof: { trackingCode: string; paymentDate: string; receiptImage?: string }
  ) => void;
  verifyPaymentByAdmin: (requestId: string, isApproved: boolean, rejectionReason?: string) => void;
  confirmHandover: (requestId: string, confirmedByRole?: string) => void;
  completeReturnAndSubmitFeedback: (
    requestId: string,
    feedback: {
      punctuality: number;
      condition: number;
      behavior: number;
      reliability: number;
      comment: string;
      isConfidentialToAdmin?: boolean;
      isDamaged?: boolean;
      damageDescription?: string;
      damagePhotoUrl?: string;
    }
  ) => void;
  reportDamageAndSuspendUser: (requestId: string, borrowerId: string, reason: string, damagePhotoUrl?: string) => void;
  addSchoolClass: (classData: { name: string; grade: string; isExternal?: boolean }) => void;
  updateSchoolClass: (id: string, name: string, grade: string) => void;
  deleteSchoolClass: (id: string) => void;
  addBookReview: (bookId: string, rating: number, comment: string) => void;
  deleteBookReview: (bookId: string, reviewId: string) => Promise<{ success: boolean; message?: string }>;
  deleteFeedback: (feedbackId: string) => Promise<{ success: boolean; message?: string }>;
  updateBankCardInfo: (info: BankCardInfo) => void;
  updateSystemConfig: (config: Partial<SystemConfig>) => Promise<{ success: boolean; message?: string; config?: SystemConfig }>;
  customAvatars: CustomAvatar[];
  addCustomAvatar: (name: string, url: string, bg?: string) => Promise<{ success: boolean; message: string; avatar?: CustomAvatar }>;
  deleteCustomAvatar: (id: string) => Promise<{ success: boolean; message: string }>;
  resetToDefaults: () => void;
  refreshData: () => Promise<void>;
  notifications: AppNotification[];
  markNotificationRead: (id: string) => Promise<void>;
  clearNotifications: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [requests, setRequests] = useState<LendingRequest[]>([]);
  const [schoolClasses, setSchoolClasses] = useState<SchoolClass[]>([]);
  const [feedbacks, setFeedbacks] = useState<MutualFeedback[]>([]);
  const [bankCardInfo, setBankCardInfo] = useState<BankCardInfo>(INITIAL_BANK_CARD);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(INITIAL_SYSTEM_CONFIG);
  const [customAvatars, setCustomAvatars] = useState<CustomAvatar[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_CURRENT_USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.id) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading currentUser from localStorage:', e);
    }
    return null;
  });

  // Fetch initial data from SQLite backend
  const refreshData = async () => {
    try {
      const data = await api.getBootstrap();
      if (data) {
        setUsers(data.users || []);
        setBooks(data.books || []);
        setRequests(data.requests || []);
        setSchoolClasses(data.schoolClasses || []);
        setFeedbacks(data.feedbacks || []);
        if (data.bankCardInfo) {
          setBankCardInfo(data.bankCardInfo);
        }
        if (data.systemConfig) {
          setSystemConfig(data.systemConfig);
        }
        if (data.customAvatars) {
          setCustomAvatars(data.customAvatars);
        }
      }
    } catch (err) {
      console.error('Failed to load bootstrap data from SQLite:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addCustomAvatar = async (name: string, url: string, bg?: string) => {
    try {
      const avatar = await api.addCustomAvatar(name, url, bg);
      if (avatar) {
        setCustomAvatars((prev) => [...prev, avatar]);
        return { success: true, message: 'آواتار جدید با موفقیت اضافه شد.', avatar };
      }
      return { success: false, message: 'خطا در افزودن آواتار' };
    } catch (e: any) {
      return { success: false, message: e.message || 'خطا در افزودن آواتار' };
    }
  };

  const deleteCustomAvatar = async (id: string) => {
    try {
      const ok = await api.deleteCustomAvatar(id);
      if (ok) {
        setCustomAvatars((prev) => prev.filter((a) => a.id !== id));
        return { success: true, message: 'آواتار با موفقیت حذف شد.' };
      }
      return { success: false, message: 'حذف آواتار با خطا مواجه شد.' };
    } catch (e: any) {
      return { success: false, message: e.message || 'خطا در حذف آواتار' };
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const fetchNotifications = async () => {
    if (!currentUser?.id) {
      setNotifications([]);
      return;
    }
    try {
      const res = await api.getNotifications(currentUser.id);
      if (res && res.success) {
        setNotifications(res.notifications || []);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Poll notifications every 15 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 15000);

    return () => clearInterval(interval);
  }, [currentUser?.id]);

  const markNotificationRead = async (id: string) => {
    if (!currentUser?.id) return;
    try {
      const res = await api.markNotificationRead(id, currentUser.id);
      if (res && res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const clearNotifications = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await api.clearNotifications(currentUser.id);
      if (res && res.success) {
        setNotifications([]);
      }
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  };

  // Sync currentUser with users list from SQLite & auto-logout stale accounts
  useEffect(() => {
    if (currentUser && !isLoading) {
      if (users.length > 0) {
        const fresh = users.find((u) => u.id === currentUser.id);
        if (fresh) {
          if (
            fresh.status !== currentUser.status ||
            fresh.role !== currentUser.role ||
            fresh.rating !== currentUser.rating ||
            fresh.booksReadCount !== currentUser.booksReadCount ||
            fresh.booksContributedCount !== currentUser.booksContributedCount ||
            fresh.name !== currentUser.name ||
            fresh.avatar !== currentUser.avatar ||
            fresh.className !== currentUser.className ||
            fresh.suspensionReason !== currentUser.suspensionReason ||
            fresh.rejectionReason !== currentUser.rejectionReason
          ) {
            setCurrentUser(fresh);
          }
        } else {
          // Current user from localStorage is not in active database users list (e.g. version change, wiped database)!
          console.warn(`[Auth Check] User ${currentUser.id} (${currentUser.name}) is missing from database users list. Logging out stale session.`);
          logoutUser();
        }
      } else {
        // Database has 0 users
        console.warn(`[Auth Check] Database has 0 users. Logging out stale session.`);
        logoutUser();
      }
    }
  }, [users, isLoading]);

  // Persist currentUser to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(LOCAL_STORAGE_KEY_CURRENT_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY_CURRENT_USER);
    }
  }, [currentUser]);

  // System Configuration
  const updateSystemConfig = async (config: Partial<SystemConfig>) => {
    setSystemConfig((prev) => ({ ...prev, ...config }));
    try {
      const res = await api.updateSystemConfig(config);
      if (res.success && res.config) {
        setSystemConfig(res.config);
      }
      return res;
    } catch (e: any) {
      console.error('Error updating system config on server:', e);
      return { success: false, message: e.message || 'خطا در به‌روزرسانی تنظیمات سیستم' };
    }
  };

  // Bank Card Info
  const updateBankCardInfo = async (info: BankCardInfo) => {
    setBankCardInfo(info);
    try {
      await api.updateBankCard(info);
    } catch (e) {
      console.error('Error updating bank card on server:', e);
    }
  };

  // Payment Proof Submission
  const submitPaymentProof = async (
    requestId: string,
    proof: { trackingCode: string; paymentDate: string; receiptImage?: string }
  ) => {
    const formattedNow = new Date().toLocaleString('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'payment_proof_submitted',
              paymentStatus: 'proof_submitted',
              paymentProof: {
                trackingCode: proof.trackingCode,
                paymentDate: proof.paymentDate,
                receiptImage: proof.receiptImage,
                submittedAt: formattedNow
              }
            }
          : r
      )
    );

    try {
      await api.submitPaymentProof(requestId, proof.trackingCode, proof.paymentDate, proof.receiptImage);
      await refreshData();
    } catch (e) {
      console.error('Error submitting payment proof to server:', e);
    }
  };

  // Admin verifies payment
  const verifyPaymentByAdmin = async (requestId: string, isApproved: boolean, rejectionReason?: string) => {
    const formattedNow = new Date().toLocaleString('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== requestId) return r;
        if (isApproved) {
          return {
            ...r,
            status: 'payment_completed',
            paymentStatus: 'paid',
            paidAt: formattedNow,
            paymentProof: r.paymentProof
              ? { ...r.paymentProof, verifiedAt: formattedNow }
              : undefined
          };
        } else {
          return {
            ...r,
            status: 'accepted',
            paymentStatus: 'rejected',
            paymentProof: r.paymentProof
              ? { ...r.paymentProof, rejectionReason }
              : undefined
          };
        }
      })
    );

    try {
      if (isApproved) {
        await api.approvePayment(requestId);
      } else {
        await api.rejectPayment(requestId, rejectionReason);
      }
      await refreshData();
    } catch (e) {
      console.error('Error verifying/rejecting payment on server:', e);
    }
  };

  // Register User
  const registerUser = async (data: RegistrationInput) => {
    try {
      const res = await api.register(data);
      if (res.success && res.user) {
        // Refresh users & books from SQLite
        await refreshData();
      }
      return res;
    } catch (e: any) {
      return { success: false, message: e.message || 'خطا در ثبت‌نام' };
    }
  };

  // Login User
  const loginUser = async (phone: string, pass: string) => {
    try {
      const res = await api.login(phone, pass);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        await refreshData();
      }
      return res;
    } catch (e: any) {
      return { success: false, message: e.message || 'خطا در ورود به سامانه' };
    }
  };

  // Login With Bale OTP
  const loginWithBale = async (phone: string) => {
    try {
      const res = await api.baleLogin(phone);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        await refreshData();
      }
      return res;
    } catch (e: any) {
      return { success: false, message: e.message || 'خطا در احراز هویت بله' };
    }
  };

  // Logout User
  const logoutUser = () => {
    setCurrentUser(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY_CURRENT_USER);
  };

  // Admin Approve User
  const approveUser = async (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: 'approved' as const, rejectionReason: '' } : u))
    );
    if (currentUser && currentUser.id === userId) {
      setCurrentUser((prev) => prev ? { ...prev, status: 'approved' as const, rejectionReason: '' } : null);
    }
    try {
      await api.approveUser(userId);
      await refreshData();
    } catch (e) {
      console.error('Error approving user on server:', e);
    }
  };

  // Admin Reject User
  const rejectUser = async (userId: string, reason?: string) => {
    const reasonText = reason || 'اطلاعات وارد شده ناقص یا نادرست است.';
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: 'rejected' as const, rejectionReason: reasonText } : u))
    );
    if (currentUser && currentUser.id === userId) {
      setCurrentUser((prev) => prev ? { ...prev, status: 'rejected' as const, rejectionReason: reasonText } : null);
    }
    try {
      await api.rejectUser(userId, reasonText);
      await refreshData();
    } catch (e) {
      console.error('Error rejecting user on server:', e);
    }
  };

  // Suspend User
  const suspendUser = async (userId: string, reason: string): Promise<{ success: boolean; message?: string }> => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: 'suspended' as const, suspensionReason: reason } : u))
    );
    if (currentUser && currentUser.id === userId) {
      setCurrentUser((prev) => prev ? { ...prev, status: 'suspended' as const, suspensionReason: reason } : null);
    }
    try {
      const res = await api.suspendUser(userId, reason);
      await refreshData();
      return res;
    } catch (e: any) {
      console.error('Error suspending user on server:', e);
      return { success: false, message: e.message || 'خطا در تعلیق حساب کاربر' };
    }
  };

  // Unsuspend User
  const unsuspendUser = async (userId: string): Promise<{ success: boolean; message?: string }> => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: 'approved' as const, suspensionReason: '', rejectionReason: '' } : u))
    );
    if (currentUser && currentUser.id === userId) {
      setCurrentUser((prev) => prev ? { ...prev, status: 'approved' as const, suspensionReason: '', rejectionReason: '' } : null);
    }
    try {
      const res = await api.unsuspendUser(userId);
      await refreshData();
      return res;
    } catch (e: any) {
      console.error('Error unsuspending user on server:', e);
      return { success: false, message: e.message || 'خطا در رفع تعلیق حساب کاربر' };
    }
  };

  const sendBaleMessageToStudent = async (userId: string, message: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await api.sendBaleMessageToStudent(userId, message);
      await refreshData();
      return res;
    } catch (e: any) {
      console.error('Error sending direct Bale message:', e);
      return { success: false, message: e.message || 'خطا در ارسال پیام به بله' };
    }
  };

  // Delete User (by self or admin)
  const deleteUser = async (userId: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await api.deleteUser(userId);
      if (res.success) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        setBooks((prev) => prev.filter((b) => b.ownerId !== userId));
        setRequests((prev) => prev.filter((r) => r.ownerId !== userId && r.borrowerId !== userId));
        setFeedbacks((prev) => prev.filter((f) => f.fromUserId !== userId && f.toUserId !== userId));

        if (currentUser?.id === userId) {
          logoutUser();
        }
        await refreshData();
      }
      return res;
    } catch (err: any) {
      console.error('Error deleting user:', err);
      return { success: false, message: err.message || 'خطا در حذف حساب کاربری' };
    }
  };

  // Add a book
  const addBook = async (bookData: {
    title: string;
    author: string;
    category: string;
    condition: BookCondition;
    coverImage: string;
    description: string;
  }) => {
    if (!currentUser) throw new Error('باید وارد حساب کاربری خود شوید.');

    const newBook: Book = {
      id: `b_${Date.now()}`,
      title: bookData.title,
      author: bookData.author,
      ownerId: currentUser.id,
      ownerName: currentUser.name,
      ownerClass: currentUser.className,
      ownerAvatar: currentUser.avatar,
      coverImage: getSafeImageUrl(bookData.coverImage, 'book'),
      category: bookData.category,
      condition: bookData.condition,
      description: bookData.description,
      status: 'available',
      rating: 5.0,
      reviewsCount: 0,
      reviews: [],
      addedDate: new Date().toLocaleDateString('fa-IR')
    };

    setBooks((prev) => [newBook, ...prev]);

    setUsers((prev) =>
      prev.map((u) =>
        u.id === currentUser.id
          ? { ...u, booksContributedCount: (u.booksContributedCount || 0) + 1 }
          : u
      )
    );

    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        booksContributedCount: (currentUser.booksContributedCount || 0) + 1
      });
    }

    try {
      await api.createBook(newBook);
      await refreshData();
    } catch (e) {
      console.error('Error adding book to SQLite:', e);
    }

    return newBook;
  };

  // Request Book Loan
  const requestBookLoan = async (bookId: string) => {
    if (!currentUser) {
      return { success: false, message: 'لطفا ابتدا وارد حساب کاربری خود شوید.' };
    }
    if (currentUser.status !== 'approved') {
      const msg = 'حساب کاربری شما هنوز توسط مسئول کتابخانه تایید نشده است.';
      api.reportError('تلاش کاربر تاییدنشده برای امانت کتاب', msg, 'warn', currentUser);
      return { success: false, message: msg };
    }

    const book = books.find((b) => b.id === bookId);
    if (!book) {
      return { success: false, message: 'کتاب یافت نشد.' };
    }

    if (book.ownerId === currentUser.id) {
      return { success: false, message: 'شما نمی‌توانید کتاب خودتان را امانت بگیرید!' };
    }

    if (book.status !== 'available') {
      return { success: false, message: 'این کتاب در حال حاضر در دست امانت یا درخواست‌شده است.' };
    }

    // Check minimum required books contributed before loan
    const userContributedBooks = books.filter((b) => b.ownerId === currentUser.id).length;
    const minRequired = systemConfig?.minBooksForRegistration ?? 3;
    if (userContributedBooks < minRequired) {
      const msg = `برای امانت گرفتن این کتاب، طبق قوانین مکتب‌خانه ابتدا باید حداقل ${minRequired} جلد کتاب به طاقچه شخصی خود جهت امانت به سایر بچه‌ها اضافه کنید. (تعداد کتاب‌های ثبت‌شده شما: ${userContributedBooks} از ${minRequired})`;
      api.reportError('کمبود کتاب ثبت‌شده برای دریافت امانت', msg, 'warn', currentUser);
      return {
        success: false,
        needBooks: true,
        message: msg
      };
    }

    try {
      const res = await api.createRequest(bookId, currentUser.id);
      if (res.success && res.request) {
        setRequests((prev) => [res.request, ...prev]);
        setBooks((prev) =>
          prev.map((b) => (b.id === bookId ? { ...b, status: 'requested' } : b))
        );
        await refreshData();
        return { success: true, message: `درخواست امانت کتاب "${book.title}" برای ${book.ownerName} ارسال شد.` };
      }
      api.reportError('خطا در ثبت درخواست امانت از سرور', res.message || 'ناموفق', 'error', currentUser);
      return { success: false, message: res.message || 'خطا در ثبت درخواست' };
    } catch (e: any) {
      api.reportError('استثنا در ثبت درخواست امانت', e.stack || e.message, 'error', currentUser);
      return { success: false, message: e.message || 'خطا در ثبت درخواست امانت' };
    }
  };

  // Accept loan request
  const acceptLoanRequest = async (
    requestId: string,
    pickupLocation: string,
    pickupTime: string,
    pickupShift: 'morning' | 'afternoon' | 'evening_home' = 'morning'
  ) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'payment_pending' as RequestStatus,
              pickupLocation,
              pickupTime,
              pickupShift,
              handoverWindow: 'مهلت ۱۲ ساعته نیم‌روزی (تایید از منزل بدون نیاز به گوشی در مدرسه)',
              acceptedAt: new Date().toLocaleDateString('fa-IR'),
              paymentStatus: 'pending'
            }
          : r
      )
    );

    try {
      await api.acceptRequest(requestId, pickupLocation, pickupTime, pickupShift);
      await refreshData();
    } catch (e) {
      console.error('Error accepting request on server:', e);
    }
  };

  // Reject loan request
  const rejectLoanRequest = async (requestId: string) => {
    const req = requests.find((r) => r.id === requestId);
    if (req) {
      setBooks((prev) =>
        prev.map((b) => (b.id === req.bookId ? { ...b, status: 'available' } : b))
      );
    }
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'rejected' } : r))
    );

    try {
      await api.rejectRequest(requestId);
      await refreshData();
    } catch (e) {
      console.error('Error rejecting request on server:', e);
    }
  };

  // Report damage and suspend user account
  const reportDamageAndSuspendUser = async (
    requestId: string,
    borrowerId: string,
    reason: string,
    damagePhotoUrl?: string
  ) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === borrowerId
          ? { ...u, status: 'suspended' as const, suspensionReason: reason }
          : u
      )
    );

    if (currentUser?.id === borrowerId) {
      setCurrentUser({
        ...currentUser,
        status: 'suspended',
        suspensionReason: reason
      });
    }

    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              isDamagedReported: true,
              damageNotes: reason,
              damagePhotoUrl: damagePhotoUrl || undefined
            }
          : r
      )
    );

    const req = requests.find((r) => r.id === requestId);
    if (req) {
      setBooks((prev) =>
        prev.map((b) =>
          b.id === req.bookId
            ? { ...b, isDamaged: true, damageDescription: reason }
            : b
        )
      );
    }

    try {
      await api.reportDamage(requestId, borrowerId, reason, damagePhotoUrl);
      await refreshData();
    } catch (e) {
      console.error('Error reporting damage on server:', e);
    }
  };

  // Confirm handover
  const confirmHandover = async (requestId: string, confirmedByRole: string = 'parent_student') => {
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;

    const formattedTimestamp = new Date().toLocaleString('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'handover_confirmed',
              handoverConfirmedAt: formattedTimestamp,
              is12hGraceConfirmed: true,
              handoverConfirmedByRole: confirmedByRole
            }
          : r
      )
    );

    setBooks((prev) =>
      prev.map((b) =>
        b.id === req.bookId
          ? {
              ...b,
              status: 'borrowed',
              borrowerId: req.borrowerId,
              borrowerName: req.borrowerName
            }
          : b
      )
    );

    try {
      await api.confirmHandover(requestId, confirmedByRole);
      await refreshData();
    } catch (e) {
      console.error('Error confirming handover on server:', e);
    }
  };

  // Reset Password with SMS check
  const resetPasswordWithSMS = (phone: string, name: string, newPass: string) => {
    const user = users.find((u) => u.phone === phone && u.name.trim() === name.trim());
    if (!user) {
      return { success: false, message: 'اطلاعات وارد شده (نام یا شماره تلفن) با حساب کاربری مطابقت ندارد.' };
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, password: newPass } : u))
    );

    return { success: true, message: 'رمز عبور شما با موفقیت تغییر کرد. اکنون می‌توانید وارد شوید.' };
  };

  // Update User profile (name, avatar, className, etc.)
  const updateUser = (userId: string, data: Partial<User>): boolean => {
    let finalData = { ...data };
    const userToUpdate = users.find(u => u.id === userId) || (currentUser?.id === userId ? currentUser : null);
    if (userToUpdate && userToUpdate.status === 'rejected') {
      finalData.status = 'pending';
      finalData.rejectionReason = '';
    }

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return { ...u, ...finalData };
        }
        return u;
      })
    );

    if (currentUser?.id === userId) {
      const updatedUser = { ...currentUser, ...finalData };
      setCurrentUser(updatedUser);
      localStorage.setItem(LOCAL_STORAGE_KEY_CURRENT_USER, JSON.stringify(updatedUser));
    }

    // Also sync to server
    api.updateUser(userId, finalData).catch((err) => {
      console.error('Error updating user on server:', err);
    });

    return true;
  };

  // Update current user profile async
  const updateProfile = async (data: Partial<User>): Promise<{ success: boolean; message?: string; user?: User }> => {
    if (!currentUser) return { success: false, message: 'کاربر به سیستم وارد نشده است' };
    try {
      updateUser(currentUser.id, data);
      const res = await api.updateUser(currentUser.id, data);
      if (res && res.user) {
        setCurrentUser(res.user);
        setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? res.user : u)));
        localStorage.setItem(LOCAL_STORAGE_KEY_CURRENT_USER, JSON.stringify(res.user));
      }
      return { success: true, user: res?.user || currentUser };
    } catch (err: any) {
      console.error('Error in updateProfile:', err);
      return { success: false, message: err.message || 'خطا در به روزرسانی پروفایل' };
    }
  };

  // Complete Return & submit mutual feedback survey
  const completeReturnAndSubmitFeedback = async (
    requestId: string,
    feedback: {
      punctuality: number;
      condition: number;
      behavior: number;
      reliability: number;
      comment: string;
      isConfidentialToAdmin?: boolean;
      isDamaged?: boolean;
      damageDescription?: string;
      damagePhotoUrl?: string;
    }
  ) => {
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;

    const avgFeedbackScore =
      (feedback.punctuality + feedback.condition + feedback.behavior + feedback.reliability) / 4;

    const isBorrower = currentUser?.id === req.borrowerId;
    const targetUserId = isBorrower ? req.ownerId : req.borrowerId;
    const targetUserName = isBorrower ? req.ownerName : req.borrowerName;

    const newMutualFeedback: MutualFeedback = {
      id: `fb_${Date.now()}`,
      requestId: req.id,
      fromUserId: currentUser?.id || 'anon',
      fromUserName: currentUser?.name || 'دانش‌آموز',
      toUserId: targetUserId,
      toUserName: targetUserName,
      role: isBorrower ? 'borrower_to_owner' : 'owner_to_borrower',
      punctualityScore: feedback.punctuality,
      conditionScore: feedback.condition,
      behaviorScore: feedback.behavior,
      reliabilityScore: feedback.reliability,
      comment: feedback.comment,
      isConfidentialToAdmin: Boolean(feedback.isConfidentialToAdmin),
      isDamaged: Boolean(feedback.isDamaged),
      damageDescription: feedback.damageDescription,
      damagePhotoUrl: feedback.damagePhotoUrl,
      date: new Date().toLocaleDateString('fa-IR')
    };

    setFeedbacks((prev) => [newMutualFeedback, ...prev]);

    // Star rating ALWAYS updates user rating, regardless of confidential comment toggle
    setUsers((prev) =>
      prev.map((u) => {
        let updatedUser = u;
        if (u.id === targetUserId) {
          const newCount = (u.ratingsCount || 0) + 1;
          const newRating = parseFloat(
            (((u.rating || 5.0) * (u.ratingsCount || 0) + avgFeedbackScore) / newCount).toFixed(1)
          );
          updatedUser = {
            ...updatedUser,
            rating: newRating,
            ratingsCount: newCount
          };
        }
        if (u.id === req.borrowerId) {
          updatedUser = {
            ...updatedUser,
            booksReadCount: (updatedUser.booksReadCount || 0) + 1
          };
          if (feedback.isDamaged) {
            updatedUser = {
              ...updatedUser,
              status: 'suspended' as const,
              suspensionReason: `خسارت به کتاب «${req.bookTitle}»: ${feedback.damageDescription || 'آسیب وارده به کتاب'}`
            };
          }
        }
        return updatedUser;
      })
    );

    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'returned',
              ...(isBorrower ? { borrowerFeedbackGiven: true } : { ownerFeedbackGiven: true }),
              isDamagedReported: Boolean(feedback.isDamaged),
              damageNotes: feedback.damageDescription,
              damagePhotoUrl: feedback.damagePhotoUrl
            }
          : r
      )
    );

    setBooks((prev) =>
      prev.map((b) =>
        b.id === req.bookId
          ? {
              ...b,
              ...(feedback.isDamaged
                ? { isDamaged: true, damageDescription: feedback.damageDescription }
                : { status: 'available', borrowerId: undefined, borrowerName: undefined })
            }
          : b
      )
    );

    try {
      await api.returnAndFeedback(requestId, {
        feedback: newMutualFeedback,
        isDamaged: feedback.isDamaged,
        damageReason: feedback.damageDescription,
        damagePhotoUrl: feedback.damagePhotoUrl
      });
      await refreshData();
    } catch (e) {
      console.error('Error returning book on server:', e);
    }
  };

  // School Classes Management
  const addSchoolClass = async (classData: { name: string; grade: string; isExternal?: boolean }) => {
    const newClass: SchoolClass = {
      id: `class_${Date.now()}`,
      name: classData.name,
      grade: classData.grade,
      isExternal: classData.isExternal
    };
    setSchoolClasses((prev) => [...prev, newClass]);
    try {
      await api.createClass(classData.name, classData.grade, classData.isExternal);
      await refreshData();
    } catch (e) {
      console.error('Error creating class on server:', e);
    }
  };

  const updateSchoolClass = (id: string, name: string, grade: string) => {
    setSchoolClasses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name, grade } : c))
    );
  };

  const deleteSchoolClass = async (id: string) => {
    setSchoolClasses((prev) => prev.filter((c) => c.id !== id));
    try {
      await api.deleteClass(id);
      await refreshData();
    } catch (e) {
      console.error('Error deleting class on server:', e);
    }
  };

  // Add or update review & star rating to a book (1 review per user)
  const addBookReview = async (bookId: string, rating: number, comment: string) => {
    if (!currentUser) return;

    const newReview = {
      id: `rev_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      userClass: currentUser.className,
      rating,
      comment,
      date: new Date().toLocaleDateString('fa-IR')
    };

    setBooks((prev) =>
      prev.map((b) => {
        if (b.id === bookId) {
          const prevReviews = Array.isArray(b.reviews) ? [...b.reviews] : [];
          const existingIndex = prevReviews.findIndex((r) => r.userId === currentUser.id);
          let updatedReviews;
          if (existingIndex >= 0) {
            prevReviews[existingIndex] = {
              ...prevReviews[existingIndex],
              rating,
              comment,
              date: newReview.date,
              userName: currentUser.name,
              userAvatar: currentUser.avatar,
              userClass: currentUser.className
            };
            updatedReviews = prevReviews;
          } else {
            updatedReviews = [newReview, ...prevReviews];
          }

          const newAvg = updatedReviews.length > 0
            ? parseFloat((updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length).toFixed(1))
            : 0;

          return {
            ...b,
            rating: newAvg,
            reviewsCount: updatedReviews.length,
            reviews: updatedReviews
          };
        }
        return b;
      })
    );

    try {
      await api.reviewBook(bookId, newReview);
      await refreshData();
    } catch (e) {
      console.error('Error submitting review to server:', e);
    }
  };

  // Delete book review (Admin or reviewer)
  const deleteBookReview = async (bookId: string, reviewId: string) => {
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id === bookId) {
          const updatedReviews = (b.reviews || []).filter((r) => r.id !== reviewId);
          const newAvg = updatedReviews.length > 0
            ? parseFloat((updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length).toFixed(1))
            : 0;
          return {
            ...b,
            rating: newAvg,
            reviewsCount: updatedReviews.length,
            reviews: updatedReviews
          };
        }
        return b;
      })
    );

    try {
      const res = await api.deleteBookReview(bookId, reviewId);
      await refreshData();
      return res;
    } catch (e: any) {
      console.error('Error deleting review on server:', e);
      return { success: false, message: e.message || 'خطا در حذف نظر' };
    }
  };

  // Delete mutual feedback (Admin)
  const deleteFeedback = async (feedbackId: string) => {
    setFeedbacks((prev) => prev.filter((f) => f.id !== feedbackId));
    try {
      const res = await api.deleteFeedback(feedbackId);
      await refreshData();
      return res;
    } catch (e: any) {
      console.error('Error deleting feedback on server:', e);
      return { success: false, message: e.message || 'خطا در حذف بازخورد' };
    }
  };

  // Delete book
  const deleteBook = async (bookId: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== bookId));
    setRequests((prev) => prev.filter((r) => r.bookId !== bookId));
    try {
      await api.deleteBook(bookId);
      await refreshData();
    } catch (e) {
      console.error('Error deleting book from server:', e);
    }
  };

  // Promote user to admin
  const makeAdmin = async (id: string) => {
    try {
      const res = await api.makeAdmin(id);
      if (res.success && res.user) {
        setUsers((prev) => prev.map((u) => (u.id === id ? res.user : u)));
      }
      return res;
    } catch (e: any) {
      return { success: false, message: e.message || 'خطا در ارتقای کاربر' };
    }
  };

  // Add new admin by phone
  const addAdminByPhone = async (data: { phone: string; name?: string; password?: string }) => {
    try {
      const res = await api.addAdminByPhone(data);
      if (res.success && res.user) {
        setUsers((prev) => {
          const idx = prev.findIndex((u) => u.id === res.user.id);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = res.user;
            return updated;
          }
          return [res.user, ...prev];
        });
      }
      return res;
    } catch (e: any) {
      return { success: false, message: e.message || 'خطا در ثبت مدیر جدید' };
    }
  };

  // Reset to initial clean state
  const resetToDefaults = () => {
    setUsers([]);
    setBooks([]);
    setRequests([]);
    setSchoolClasses([]);
    setFeedbacks([]);
    setCurrentUser(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY_CURRENT_USER);
  };

  const mappedBooks = useMemo(() => {
    return books.map((book) => {
      let updatedBook = { ...book };
      const owner = users.find((u) => u.id === book.ownerId);
      if (owner) {
        updatedBook.ownerName = owner.name;
        updatedBook.ownerAvatar = owner.avatar;
        updatedBook.ownerClass = owner.schoolClass || book.ownerClass;
      }
      if (book.borrowerId) {
        const borrower = users.find((u) => u.id === book.borrowerId);
        if (borrower) {
          updatedBook.borrowerName = borrower.name;
        }
      }
      const updatedReviews = (book.reviews || []).map((review) => {
        let updatedReview = { ...review };
        const reviewer = users.find((u) => u.id === review.userId);
        if (reviewer) {
          updatedReview.userName = reviewer.name;
          updatedReview.userAvatar = reviewer.avatar;
          updatedReview.userClass = reviewer.schoolClass || review.userClass;
        }
        return updatedReview;
      });
      updatedBook.reviews = updatedReviews;
      return updatedBook;
    });
  }, [books, users]);

  const mappedRequests = useMemo(() => {
    return requests.map((req) => {
      let updatedReq = { ...req };
      const owner = users.find((u) => u.id === req.ownerId);
      if (owner) {
        updatedReq.ownerName = owner.name;
        updatedReq.ownerClass = owner.schoolClass || req.ownerClass;
      }
      const borrower = users.find((u) => u.id === req.borrowerId);
      if (borrower) {
        updatedReq.borrowerName = borrower.name;
        updatedReq.borrowerClass = borrower.schoolClass || req.borrowerClass;
        updatedReq.borrowerPhone = borrower.phone || req.borrowerPhone;
      }
      return updatedReq;
    });
  }, [requests, users]);

  const mappedFeedbacks = useMemo(() => {
    return feedbacks.map((fb) => {
      let updatedFb = { ...fb };
      const fromUser = users.find((u) => u.id === fb.fromUserId);
      if (fromUser) {
        updatedFb.fromUserName = fromUser.name;
      }
      const toUser = users.find((u) => u.id === fb.toUserId);
      if (toUser) {
        updatedFb.toUserName = toUser.name;
      }
      return updatedFb;
    });
  }, [feedbacks, users]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        books: mappedBooks,
        requests: mappedRequests,
        schoolClasses,
        feedbacks: mappedFeedbacks,
        bankCardInfo,
        systemConfig,
        isLoading,
        loginUser,
        loginWithBale,
        loginWithOtpPhone: loginWithBale,
        logoutUser,
        registerUser,
        updateUser,
        updateProfile,
        resetPasswordWithSMS,
        approveUser,
        rejectUser,
        suspendUser,
        unsuspendUser,
        sendBaleMessageToStudent,
        deleteUser,
        makeAdmin,
        addAdminByPhone,
        addBook,
        deleteBook,
        requestBookLoan,
        acceptLoanRequest,
        rejectLoanRequest,
        submitPaymentProof,
        verifyPaymentByAdmin,
        confirmHandover,
        completeReturnAndSubmitFeedback,
        reportDamageAndSuspendUser,
        addSchoolClass,
        updateSchoolClass,
        deleteSchoolClass,
        addBookReview,
        deleteBookReview,
        deleteFeedback,
        updateBankCardInfo,
        updateSystemConfig,
        customAvatars,
        addCustomAvatar,
        deleteCustomAvatar,
        resetToDefaults,
        refreshData,
        notifications,
        markNotificationRead,
        clearNotifications
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
