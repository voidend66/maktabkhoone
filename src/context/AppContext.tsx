import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  Book,
  LendingRequest,
  SchoolClass,
  MutualFeedback,
  BookCondition,
  RequestStatus,
  RegistrationInput,
  BankCardInfo
} from '../types';
import { INITIAL_USERS, INITIAL_BOOKS, INITIAL_REQUESTS, INITIAL_CLASSES, isAdminPhone } from '../data/mockData';
import { api } from '../services/api';

const INITIAL_BANK_CARD: BankCardInfo = {
  cardNumber: '6037-9918-9876-5432',
  cardHolderName: 'پارسا فیض (مدیر و راهبر مکتب‌خانه)',
  bankName: 'بانک ملی ایران'
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
  isLoading: boolean;
  loginUser: (phone: string, pass: string) => Promise<{ success: boolean; message: string; user?: User }>;
  loginWithBale: (phone: string) => Promise<{ success: boolean; message: string; user?: User }>;
  loginWithOtpPhone: (phone: string) => Promise<{ success: boolean; message: string; user?: User }>;
  logoutUser: () => void;
  registerUser: (data: RegistrationInput) => Promise<{ success: boolean; message: string; user?: User }>;
  updateUser: (userId: string, data: Partial<User>) => boolean;
  resetPasswordWithSMS: (phone: string, name: string, newPass: string) => { success: boolean; message: string };
  approveUser: (userId: string) => void;
  rejectUser: (userId: string) => void;
  addBook: (book: {
    title: string;
    author: string;
    category: string;
    condition: BookCondition;
    coverImage: string;
    description: string;
  }) => Promise<Book>;
  deleteBook: (bookId: string) => void;
  requestBookLoan: (bookId: string) => Promise<{ success: boolean; message: string }>;
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
    feedback: { punctuality: number; condition: number; behavior: number; reliability: number; comment: string }
  ) => void;
  reportDamageAndSuspendUser: (requestId: string, borrowerId: string, reason: string) => void;
  addSchoolClass: (classData: { name: string; grade: string; isExternal?: boolean }) => void;
  updateSchoolClass: (id: string, name: string, grade: string) => void;
  deleteSchoolClass: (id: string) => void;
  addBookReview: (bookId: string, rating: number, comment: string) => void;
  updateBankCardInfo: (info: BankCardInfo) => void;
  resetToDefaults: () => void;
  refreshData: () => Promise<void>;
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
      }
    } catch (err) {
      console.error('Failed to load bootstrap data from SQLite:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Sync currentUser with users list from SQLite
  useEffect(() => {
    if (currentUser && users.length > 0) {
      const fresh = users.find((u) => u.id === currentUser.id);
      if (fresh) {
        if (
          fresh.status !== currentUser.status ||
          fresh.role !== currentUser.role ||
          fresh.rating !== currentUser.rating ||
          fresh.booksReadCount !== currentUser.booksReadCount ||
          fresh.booksContributedCount !== currentUser.booksContributedCount
        ) {
          setCurrentUser(fresh);
        }
      }
    }
  }, [users, currentUser]);

  // Persist currentUser to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(LOCAL_STORAGE_KEY_CURRENT_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY_CURRENT_USER);
    }
  }, [currentUser]);

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
      }
    } catch (e) {
      console.error('Error approving payment on server:', e);
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
      prev.map((u) => (u.id === userId ? { ...u, status: 'approved' as const } : u))
    );
    try {
      await api.approveUser(userId);
    } catch (e) {
      console.error('Error approving user on server:', e);
    }
  };

  // Admin Reject User
  const rejectUser = async (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: 'rejected' as const } : u))
    );
    try {
      await api.rejectUser(userId);
    } catch (e) {
      console.error('Error rejecting user on server:', e);
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
      coverImage: bookData.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
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
      return { success: false, message: 'حساب کاربری شما هنوز توسط مسئول کتابخانه تایید نشده است.' };
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

    try {
      const res = await api.createRequest(bookId, currentUser.id);
      if (res.success && res.request) {
        setRequests((prev) => [res.request, ...prev]);
        setBooks((prev) =>
          prev.map((b) => (b.id === bookId ? { ...b, status: 'requested' } : b))
        );
        return { success: true, message: `درخواست امانت کتاب "${book.title}" برای ${book.ownerName} ارسال شد.` };
      }
      return { success: false, message: res.message || 'خطا در ثبت درخواست' };
    } catch (e: any) {
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
    } catch (e) {
      console.error('Error rejecting request on server:', e);
    }
  };

  // Report damage and suspend user account
  const reportDamageAndSuspendUser = async (requestId: string, borrowerId: string, reason: string) => {
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
              damageNotes: reason
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
      await api.reportDamage(requestId, borrowerId, reason);
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
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return { ...u, ...data };
        }
        return u;
      })
    );

    if (currentUser?.id === userId) {
      const updatedUser = { ...currentUser, ...data };
      setCurrentUser(updatedUser);
      localStorage.setItem(LOCAL_STORAGE_KEY_CURRENT_USER, JSON.stringify(updatedUser));
    }

    // Also sync to server
    api.updateUser(userId, data).catch((err) => {
      console.error('Error updating user on server:', err);
    });

    return true;
  };

  // Complete Return & submit mutual feedback survey
  const completeReturnAndSubmitFeedback = async (
    requestId: string,
    feedback: { punctuality: number; condition: number; behavior: number; reliability: number; comment: string }
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
      date: new Date().toLocaleDateString('fa-IR')
    };

    setFeedbacks((prev) => [newMutualFeedback, ...prev]);

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === targetUserId) {
          const newCount = (u.ratingsCount || 0) + 1;
          const newRating = parseFloat(
            (((u.rating || 5.0) * (u.ratingsCount || 0) + avgFeedbackScore) / newCount).toFixed(1)
          );
          return {
            ...u,
            rating: newRating,
            ratingsCount: newCount,
            booksReadCount: u.id === req.borrowerId ? (u.booksReadCount || 0) + 1 : u.booksReadCount
          };
        }
        return u;
      })
    );

    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'returned' } : r))
    );

    setBooks((prev) =>
      prev.map((b) =>
        b.id === req.bookId
          ? { ...b, status: 'available', borrowerId: undefined, borrowerName: undefined }
          : b
      )
    );

    try {
      await api.returnAndFeedback(requestId, newMutualFeedback);
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
    } catch (e) {
      console.error('Error deleting class on server:', e);
    }
  };

  // Add review & star rating to a book
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
          const updatedReviews = [newReview, ...b.reviews];
          const newAvg = parseFloat(
            (updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length).toFixed(1)
          );
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
    } catch (e) {
      console.error('Error submitting review to server:', e);
    }
  };

  // Delete book
  const deleteBook = async (bookId: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== bookId));
    try {
      await api.deleteBook(bookId);
    } catch (e) {
      console.error('Error deleting book from server:', e);
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

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        books,
        requests,
        schoolClasses,
        feedbacks,
        bankCardInfo,
        isLoading,
        loginUser,
        loginWithBale,
        loginWithOtpPhone: loginWithBale,
        logoutUser,
        registerUser,
        updateUser,
        resetPasswordWithSMS,
        approveUser,
        rejectUser,
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
        updateBankCardInfo,
        resetToDefaults,
        refreshData
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
