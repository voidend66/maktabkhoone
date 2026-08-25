import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  Book,
  LendingRequest,
  RegistrationInput,
  BookCondition,
  RequestStatus,
  SchoolClass,
  MutualFeedback,
  BankCardInfo,
  PaymentProof
} from '../types';
import { INITIAL_USERS, INITIAL_BOOKS, INITIAL_REQUESTS, INITIAL_CLASSES } from '../data/mockData';

const INITIAL_BANK_CARD: BankCardInfo = {
  cardNumber: '6037-9918-9876-5432',
  cardHolderName: 'پارسا فیض (مدیر مکتب خونه)',
  bankName: 'بانک ملی ایران'
};

interface AppContextType {
  currentUser: User | null;
  users: User[];
  books: Book[];
  requests: LendingRequest[];
  schoolClasses: SchoolClass[];
  feedbacks: MutualFeedback[];
  bankCardInfo: BankCardInfo;
  setCurrentUser: (user: User | null) => void;
  registerUser: (data: RegistrationInput) => { success: boolean; message: string; user?: User };
  loginUser: (phone: string, pass: string) => { success: boolean; message: string; user?: User };
  resetPasswordWithSMS: (phone: string, name: string, newPass: string) => { success: boolean; message: string };
  approveUser: (userId: string) => void;
  rejectUser: (userId: string) => void;
  addBook: (bookData: {
    title: string;
    author: string;
    category: string;
    condition: BookCondition;
    coverImage: string;
    description: string;
  }) => Book;
  requestBookLoan: (bookId: string) => { success: boolean; message: string };
  acceptLoanRequest: (
    requestId: string,
    pickupLocation: string,
    pickupTime: string,
    pickupShift?: 'morning' | 'afternoon' | 'evening_home'
  ) => void;
  rejectLoanRequest: (requestId: string) => void;
  reportDamageAndSuspendUser: (requestId: string, borrowerId: string, reason: string) => void;
  submitPaymentProof: (
    requestId: string,
    proof: { trackingCode: string; paymentDate: string; receiptImage?: string }
  ) => void;
  verifyPaymentByAdmin: (requestId: string, isApproved: boolean, rejectionReason?: string) => void;
  updateBankCardInfo: (info: BankCardInfo) => void;
  confirmHandover: (requestId: string, confirmedByRole?: string) => void;
  completeReturnAndSubmitFeedback: (
    requestId: string,
    feedback: { punctuality: number; condition: number; behavior: number; reliability: number; comment: string }
  ) => void;
  addBookReview: (bookId: string, rating: number, comment: string) => void;
  deleteBook: (bookId: string) => void;
  addSchoolClass: (classData: { name: string; grade: string; isExternal?: boolean }) => void;
  updateSchoolClass: (id: string, name: string, grade: string) => void;
  deleteSchoolClass: (id: string) => void;
  resetToDefaults: () => void;
  switchUserRoleDemo: (userId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_USERS = 'school_lib_users_v2';
const LOCAL_STORAGE_KEY_BOOKS = 'school_lib_books_v2';
const LOCAL_STORAGE_KEY_REQUESTS = 'school_lib_requests_v2';
const LOCAL_STORAGE_KEY_CLASSES = 'school_lib_classes_v2';
const LOCAL_STORAGE_KEY_FEEDBACKS = 'school_lib_feedbacks_v2';
const LOCAL_STORAGE_KEY_CURRENT_USER = 'school_lib_curr_user_v2';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_USERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((u: any) => ({
            ...u,
            medals: Array.isArray(u.medals) ? u.medals : [],
            booksReadCount: typeof u.booksReadCount === 'number' ? u.booksReadCount : 0,
            booksContributedCount: typeof u.booksContributedCount === 'number' ? u.booksContributedCount : 0,
            rating: typeof u.rating === 'number' ? u.rating : 5.0,
            ratingsCount: typeof u.ratingsCount === 'number' ? u.ratingsCount : 0,
            status: u.status || 'approved',
            role: u.role || 'student'
          }));
        }
      }
    } catch (e) {
      console.error('Error loading users from localStorage:', e);
    }
    return INITIAL_USERS;
  });

  const [books, setBooks] = useState<Book[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_BOOKS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((b: any) => ({
            ...b,
            reviews: Array.isArray(b.reviews) ? b.reviews : [],
            status: b.status || 'available',
            rating: typeof b.rating === 'number' ? b.rating : 5.0,
            reviewsCount: typeof b.reviewsCount === 'number' ? b.reviewsCount : 0
          }));
        }
      }
    } catch (e) {
      console.error('Error loading books from localStorage:', e);
    }
    return INITIAL_BOOKS;
  });

  const [requests, setRequests] = useState<LendingRequest[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_REQUESTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error loading requests from localStorage:', e);
    }
    return INITIAL_REQUESTS;
  });

  const [schoolClasses, setSchoolClasses] = useState<SchoolClass[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_CLASSES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading schoolClasses from localStorage:', e);
    }
    return INITIAL_CLASSES;
  });

  const [feedbacks, setFeedbacks] = useState<MutualFeedback[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_FEEDBACKS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error loading feedbacks from localStorage:', e);
    }
    return [];
  });

  const [bankCardInfo, setBankCardInfo] = useState<BankCardInfo>(() => {
    try {
      const saved = localStorage.getItem('school_lib_bank_card_v2');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading bank card info:', e);
    }
    return INITIAL_BANK_CARD;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_CURRENT_USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.id) {
          return {
            ...parsed,
            medals: Array.isArray(parsed.medals) ? parsed.medals : [],
            booksReadCount: typeof parsed.booksReadCount === 'number' ? parsed.booksReadCount : 0,
            booksContributedCount: typeof parsed.booksContributedCount === 'number' ? parsed.booksContributedCount : 0,
            rating: typeof parsed.rating === 'number' ? parsed.rating : 5.0,
            ratingsCount: typeof parsed.ratingsCount === 'number' ? parsed.ratingsCount : 0,
            status: parsed.status || 'approved',
            role: parsed.role || 'student'
          };
        }
      }
    } catch (e) {
      console.error('Error loading currentUser from localStorage:', e);
    }
    return INITIAL_USERS[1];
  });

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_BOOKS, JSON.stringify(books));
  }, [books]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_REQUESTS, JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_CLASSES, JSON.stringify(schoolClasses));
  }, [schoolClasses]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_FEEDBACKS, JSON.stringify(feedbacks));
  }, [feedbacks]);

  useEffect(() => {
    localStorage.setItem('school_lib_bank_card_v2', JSON.stringify(bankCardInfo));
  }, [bankCardInfo]);

  const updateBankCardInfo = (info: BankCardInfo) => {
    setBankCardInfo(info);
    try {
      localStorage.setItem('school_lib_bank_card_v2', JSON.stringify(info));
    } catch (e) {
      console.error('Error saving bank card info:', e);
    }
  };

  const submitPaymentProof = (
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
  };

  const verifyPaymentByAdmin = (requestId: string, isApproved: boolean, rejectionReason?: string) => {
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
  };

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(LOCAL_STORAGE_KEY_CURRENT_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY_CURRENT_USER);
    }
  }, [currentUser]);

  // Register user
  const registerUser = (data: RegistrationInput) => {
    // Check if phone already registered
    const existing = users.find((u) => u.phone === data.phone);
    if (existing) {
      return { success: false, message: 'این شماره تلفن قبلاً در سامانه ثبت شده است.' };
    }

    if (data.initialBooks.length < 3) {
      return { success: false, message: 'جهت تکمیل ثبت‌نام، باید حداقل ۳ جلد کتاب جهت اشتراک‌گذاری معرفی کنید.' };
    }

    const newUserId = `user_${Date.now()}`;
    const newUser: User = {
      id: newUserId,
      name: data.name,
      className: data.className,
      phone: data.phone,
      avatar: data.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250',
      status: 'pending', // Pending admin approval!
      role: 'student',
      password: data.password,
      rating: 5.0,
      ratingsCount: 0,
      booksContributedCount: data.initialBooks.length,
      booksReadCount: 0,
      medals: [
        {
          id: 'm_starter',
          title: 'عضو جدید کتابخانه',
          icon: '🌱',
          description: 'پیوستن به جامعه کتابخوانی مدرسه',
          color: 'bg-emerald-100 text-emerald-800 border-emerald-300'
        }
      ],
      joinedDate: new Date().toLocaleDateString('fa-IR')
    };

    // Add initial books
    const createdBooks: Book[] = data.initialBooks.map((b, idx) => ({
      id: `b_${Date.now()}_${idx}`,
      title: b.title,
      author: b.author,
      ownerId: newUserId,
      ownerName: data.name,
      ownerClass: data.className,
      ownerAvatar: newUser.avatar,
      coverImage: b.coverImage || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=600',
      category: b.category,
      condition: b.condition,
      description: b.description,
      status: 'available',
      rating: 5.0,
      reviewsCount: 0,
      reviews: [],
      addedDate: new Date().toLocaleDateString('fa-IR')
    }));

    setUsers((prev) => [...prev, newUser]);
    setBooks((prev) => [...prev, ...createdBooks]);

    return {
      success: true,
      message: 'ثبت‌نام شما با موفقیت انجام شد! حساب شما پس از بررسی و تایید توسط مسئول کتابخانه فعال خواهد شد.',
      user: newUser
    };
  };

  // Login
  const loginUser = (phone: string, pass: string) => {
    const user = users.find((u) => u.phone === phone);
    if (!user) {
      return { success: false, message: 'کاربری با این شماره تلفن یافت نشد.' };
    }
    if (user.password && user.password !== pass) {
      return { success: false, message: 'رمز عبور وارد شده اشتباه است.' };
    }
    setCurrentUser(user);
    return { success: true, message: `خوش آمدید ${user.name}`, user };
  };

  // Admin Approve User
  const approveUser = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: 'approved' as const } : u))
    );
  };

  // Admin Reject User
  const rejectUser = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: 'rejected' as const } : u))
    );
  };

  // Add a book
  const addBook = (bookData: {
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

    // Update user contributed count
    setUsers((prev) =>
      prev.map((u) =>
        u.id === currentUser.id
          ? { ...u, booksContributedCount: u.booksContributedCount + 1 }
          : u
      )
    );

    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        booksContributedCount: currentUser.booksContributedCount + 1
      });
    }

    return newBook;
  };

  // Request Book Loan
  const requestBookLoan = (bookId: string) => {
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

    const newRequest: LendingRequest = {
      id: `req_${Date.now()}`,
      bookId: book.id,
      bookTitle: book.title,
      bookCover: book.coverImage,
      ownerId: book.ownerId,
      ownerName: book.ownerName,
      ownerClass: book.ownerClass,
      borrowerId: currentUser.id,
      borrowerName: currentUser.name,
      borrowerClass: currentUser.className,
      borrowerPhone: currentUser.phone,
      status: 'pending',
      createdAt: new Date().toLocaleString('fa-IR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    setRequests((prev) => [newRequest, ...prev]);

    // Mark book status as requested
    setBooks((prev) =>
      prev.map((b) => (b.id === bookId ? { ...b, status: 'requested' } : b))
    );

    return { success: true, message: `درخواست امانت کتاب "${book.title}" برای ${book.ownerName} ارسال شد.` };
  };

  // Accept loan request & set time/location with half-day shift window
  const acceptLoanRequest = (
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
  };



  // Reject loan request
  const rejectLoanRequest = (requestId: string) => {
    const req = requests.find((r) => r.id === requestId);
    if (req) {
      // Free up book
      setBooks((prev) =>
        prev.map((b) => (b.id === req.bookId ? { ...b, status: 'available' } : b))
      );
    }
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'rejected' } : r))
    );
  };

  // Report damage and suspend user account
  const reportDamageAndSuspendUser = (requestId: string, borrowerId: string, reason: string) => {
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
  };

  // Confirm handover at school with 12h half-day retroactive confirmation
  const confirmHandover = (requestId: string, confirmedByRole: string = 'parent_student') => {
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

  // Complete Return & submit mutual feedback survey with 4 criteria
  const completeReturnAndSubmitFeedback = (
    requestId: string,
    feedback: { punctuality: number; condition: number; behavior: number; reliability: number; comment: string }
  ) => {
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;

    // Calculate score from 4 criteria
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
          const newCount = u.ratingsCount + 1;
          const newRating = parseFloat(
            ((u.rating * u.ratingsCount + avgFeedbackScore) / newCount).toFixed(1)
          );
          return {
            ...u,
            rating: newRating,
            ratingsCount: newCount,
            booksReadCount: u.id === req.borrowerId ? u.booksReadCount + 1 : u.booksReadCount
          };
        }
        return u;
      })
    );

    // Mark request as returned
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'returned' } : r))
    );

    // Make book available again
    setBooks((prev) =>
      prev.map((b) =>
        b.id === req.bookId
          ? { ...b, status: 'available', borrowerId: undefined, borrowerName: undefined }
          : b
      )
    );
  };

  // School Classes Management
  const addSchoolClass = (classData: { name: string; grade: string; isExternal?: boolean }) => {
    const newClass: SchoolClass = {
      id: `class_${Date.now()}`,
      name: classData.name,
      grade: classData.grade,
      isExternal: classData.isExternal
    };
    setSchoolClasses((prev) => [...prev, newClass]);
  };

  const updateSchoolClass = (id: string, name: string, grade: string) => {
    setSchoolClasses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name, grade } : c))
    );
  };

  const deleteSchoolClass = (id: string) => {
    setSchoolClasses((prev) => prev.filter((c) => c.id !== id));
  };

  // Add review & star rating to a book
  const addBookReview = (bookId: string, rating: number, comment: string) => {
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
  };

  // Delete book (owner or admin)
  const deleteBook = (bookId: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== bookId));
  };

  // Reset to initial mock data
  const resetToDefaults = () => {
    setUsers(INITIAL_USERS);
    setBooks(INITIAL_BOOKS);
    setRequests(INITIAL_REQUESTS);
    setSchoolClasses(INITIAL_CLASSES);
    setFeedbacks([]);
    setCurrentUser(INITIAL_USERS[1]);
    localStorage.removeItem(LOCAL_STORAGE_KEY_USERS);
    localStorage.removeItem(LOCAL_STORAGE_KEY_BOOKS);
    localStorage.removeItem(LOCAL_STORAGE_KEY_REQUESTS);
    localStorage.removeItem(LOCAL_STORAGE_KEY_CLASSES);
    localStorage.removeItem(LOCAL_STORAGE_KEY_FEEDBACKS);
    localStorage.removeItem(LOCAL_STORAGE_KEY_CURRENT_USER);
  };

  // Switch demo persona
  const switchUserRoleDemo = (userId: string) => {
    const found = users.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
    }
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
        setCurrentUser,
        registerUser,
        loginUser,
        resetPasswordWithSMS,
        approveUser,
        rejectUser,
        addBook,
        requestBookLoan,
        acceptLoanRequest,
        rejectLoanRequest,
        reportDamageAndSuspendUser,
        submitPaymentProof,
        verifyPaymentByAdmin,
        updateBankCardInfo,
        confirmHandover,
        completeReturnAndSubmitFeedback,
        addBookReview,
        deleteBook,
        addSchoolClass,
        updateSchoolClass,
        deleteSchoolClass,
        resetToDefaults,
        switchUserRoleDemo
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
