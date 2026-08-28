import path from 'path';
import fs from 'fs';
import {
  User,
  Book,
  LendingRequest,
  SchoolClass,
  MutualFeedback,
  BankCardInfo,
  BookReview,
  SystemConfig
} from '../src/types';
import { ADMIN_PHONES, isAdminPhone, SCHOOL_GRADES, CATEGORIES } from '../src/data/mockData';

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_FILE = path.join(DATA_DIR, 'maktabkhune.json');
const DB_BACKUP = path.join(DATA_DIR, 'maktabkhune.json.bak');

export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'db';
  message: string;
  details?: string;
  userName?: string;
  userPhone?: string;
}

interface DatabaseSchema {
  users: User[];
  books: Book[];
  requests: LendingRequest[];
  schoolClasses: SchoolClass[];
  feedbacks: MutualFeedback[];
  settings: Record<string, string>;
  systemLogs?: SystemLog[];
}

// In-memory data store with disk persistence
let memoryDb: DatabaseSchema = {
  users: [],
  books: [],
  requests: [],
  schoolClasses: [],
  feedbacks: [],
  settings: {},
  systemLogs: []
};

/**
 * Persist database to disk atomically
 */
function saveToDisk() {
  try {
    const jsonStr = JSON.stringify(memoryDb, null, 2);
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, jsonStr, 'utf-8');
    fs.renameSync(tempFile, DB_FILE);

    // Keep a backup occasionally
    try {
      fs.copyFileSync(DB_FILE, DB_BACKUP);
    } catch {
      // ignore backup errors
    }
  } catch (error) {
    console.error('Error persisting database to disk:', error);
  }
}

/**
 * Load database from disk or initialize
 */
function loadFromDisk(): boolean {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      if (content.trim()) {
        const parsed = JSON.parse(content);
        memoryDb = {
          users: Array.isArray(parsed.users) ? parsed.users : [],
          books: Array.isArray(parsed.books) ? parsed.books : [],
          requests: Array.isArray(parsed.requests) ? parsed.requests : [],
          schoolClasses: Array.isArray(parsed.schoolClasses) ? parsed.schoolClasses : [],
          feedbacks: Array.isArray(parsed.feedbacks) ? parsed.feedbacks : [],
          settings: typeof parsed.settings === 'object' && parsed.settings !== null ? parsed.settings : {},
          systemLogs: Array.isArray(parsed.systemLogs) ? parsed.systemLogs : []
        };
        return true;
      }
    }
  } catch (error) {
    console.error('Error reading primary database file, checking backup...', error);
    try {
      if (fs.existsSync(DB_BACKUP)) {
        const backupContent = fs.readFileSync(DB_BACKUP, 'utf-8');
        const parsed = JSON.parse(backupContent);
        memoryDb = {
          users: Array.isArray(parsed.users) ? parsed.users : [],
          books: Array.isArray(parsed.books) ? parsed.books : [],
          requests: Array.isArray(parsed.requests) ? parsed.requests : [],
          schoolClasses: Array.isArray(parsed.schoolClasses) ? parsed.schoolClasses : [],
          feedbacks: Array.isArray(parsed.feedbacks) ? parsed.feedbacks : [],
          settings: typeof parsed.settings === 'object' && parsed.settings !== null ? parsed.settings : {},
          systemLogs: Array.isArray(parsed.systemLogs) ? parsed.systemLogs : []
        };
        return true;
      }
    } catch (bErr) {
      console.error('Backup load also failed, initializing empty db', bErr);
    }
  }
  return false;
}

// Initial load
loadFromDisk();

// Seed initial data if empty
function seedInitialDataIfEmpty() {
  let hasChanges = false;

  // Seed default classes if empty or containing old secondary school classes
  const hasOldSecondaryClasses = memoryDb.schoolClasses.some(
    (c) =>
      c.grade.includes('هفتم') ||
      c.grade.includes('هشتم') ||
      c.grade.includes('نهم') ||
      c.grade.includes('دهم') ||
      c.grade.includes('یازدهم') ||
      c.grade.includes('دوازدهم')
  );

  if (memoryDb.schoolClasses.length === 0 || hasOldSecondaryClasses) {
    const elementaryClasses: SchoolClass[] = [
      { id: 'c_1_1', name: 'کلاس ۱/۱', grade: 'پایه اول دبستان' },
      { id: 'c_1_2', name: 'کلاس ۱/۲', grade: 'پایه اول دبستان' },
      { id: 'c_2_1', name: 'کلاس ۲/۱', grade: 'پایه دوم دبستان' },
      { id: 'c_2_2', name: 'کلاس ۲/۲', grade: 'پایه دوم دبستان' },
      { id: 'c_3_1', name: 'کلاس ۳/۱', grade: 'پایه سوم دبستان' },
      { id: 'c_3_2', name: 'کلاس ۳/۲', grade: 'پایه سوم دبستان' },
      { id: 'c_4_1', name: 'کلاس ۴/۱', grade: 'پایه چهارم دبستان' },
      { id: 'c_5_1', name: 'کلاس ۵/۱', grade: 'پایه پنجم دبستان' },
      { id: 'c_6_1', name: 'کلاس ۶/۱', grade: 'پایه ششم دبستان' },
      { id: 'c_staff', name: 'معلمان و کادر مدرسه', grade: 'معلمان و کادر مدرسه (سایر / مهمان)', isExternal: true }
    ];
    memoryDb.schoolClasses = elementaryClasses;
    hasChanges = true;
  }

  // Seed default bank card info if not set
  if (!memoryDb.settings['bank_card_info']) {
    const defaultCard: BankCardInfo = {
      cardNumber: '6037-9918-9876-5432',
      cardHolderName: 'پارسا فیض (مدیر و راهبر مکتب‌خانه)',
      bankName: 'بانک ملی ایران'
    };
    memoryDb.settings['bank_card_info'] = JSON.stringify(defaultCard);
    hasChanges = true;
  }

  // Seed default system configuration if not set
  if (!memoryDb.settings['system_config']) {
    const defaultConfig: SystemConfig = {
      minBooksForRegistration: 3,
      maxBooksForRegistration: 5,
      requireAdminApproval: true,
      loanFeeAmount: 10000,
      loanDurationDays: 7,
      paymentWindowHours: 3,
      handoverWindowHours: 12
    };
    memoryDb.settings['system_config'] = JSON.stringify(defaultConfig);
    hasChanges = true;
  }

  // Ensure default admin users exist in DB if not registered yet
  for (const adminPhone of ADMIN_PHONES) {
    const cleanPhone = adminPhone.replace(/\D/g, '');
    const userExists = memoryDb.users.some(
      (u) => u.phone === adminPhone || u.phone.replace(/\D/g, '') === cleanPhone
    );

    if (!userExists) {
      const adminId = `u_admin_${cleanPhone.slice(-4)}`;
      memoryDb.users.push({
        id: adminId,
        name: 'مدیر سامانه مکتب‌خانه',
        className: 'مدیریت کتابخانه',
        phone: adminPhone,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
        status: 'approved',
        role: 'admin',
        password: 'admin123',
        rating: 5.0,
        ratingsCount: 1,
        booksContributedCount: 0,
        booksReadCount: 0,
        medals: [
          {
            id: 'm_admin_crown',
            title: 'راهبر کتابخانه',
            icon: '👑',
            description: 'مدیریت و سرپرستی کتابخانه مکتب‌خانه',
            color: 'bg-amber-100 text-amber-800 border-amber-300'
          }
        ],
        joinedDate: new Date().toLocaleDateString('fa-IR'),
        activeLoanCount: 0
      });
      hasChanges = true;
    }
  }

  if (hasChanges) {
    saveToDisk();
  }
}

seedInitialDataIfEmpty();

// ==========================================
// Database Access Service
// ==========================================

// ---- SYSTEM LOG LISTENERS ----
type SystemLogListener = (log: SystemLog) => void;
const logListeners: SystemLogListener[] = [];

export function addSystemLogListener(fn: SystemLogListener) {
  logListeners.push(fn);
}

export const dbService = {
  // .... existing code ...
  // ---- USERS ----
  getAllUsers(): User[] {
    return memoryDb.users.map((u) => ({
      ...u,
      medals: Array.isArray(u.medals) ? u.medals : [],
      rating: Number(u.rating) || 5.0,
      ratingsCount: Number(u.ratingsCount) || 0,
      booksContributedCount: Number(u.booksContributedCount) || 0,
      booksReadCount: Number(u.booksReadCount) || 0,
      activeLoanCount: Number(u.activeLoanCount) || 0
    }));
  },

  getUserById(id: string): User | null {
    const user = memoryDb.users.find((u) => u.id === id);
    if (!user) return null;
    return {
      ...user,
      medals: Array.isArray(user.medals) ? user.medals : [],
      rating: Number(user.rating) || 5.0,
      ratingsCount: Number(user.ratingsCount) || 0,
      booksContributedCount: Number(user.booksContributedCount) || 0,
      booksReadCount: Number(user.booksReadCount) || 0,
      activeLoanCount: Number(user.activeLoanCount) || 0
    };
  },

  getUserByPhone(phone: string): User | null {
    const cleanDigits = phone.replace(/\D/g, '');
    const user = memoryDb.users.find((u) => {
      const uClean = (u.phone || '').replace(/\D/g, '');
      return (
        uClean === cleanDigits ||
        u.phone === phone ||
        (cleanDigits.length >= 10 && uClean.endsWith(cleanDigits.slice(-10)))
      );
    });
    if (!user) return null;
    return this.getUserById(user.id);
  },

  createUser(user: User): User {
    const existingIndex = memoryDb.users.findIndex((u) => u.id === user.id);
    const newUser: User = {
      ...user,
      medals: Array.isArray(user.medals) ? user.medals : [],
      rating: Number(user.rating) || 5.0,
      ratingsCount: Number(user.ratingsCount) || 0,
      booksContributedCount: Number(user.booksContributedCount) || 0,
      booksReadCount: Number(user.booksReadCount) || 0,
      activeLoanCount: Number(user.activeLoanCount) || 0,
      joinedDate: user.joinedDate || new Date().toLocaleDateString('fa-IR')
    };

    if (existingIndex >= 0) {
      memoryDb.users[existingIndex] = newUser;
    } else {
      memoryDb.users.push(newUser);
    }

    saveToDisk();
    return newUser;
  },

  updateUser(id: string, updates: Partial<User>): User | null {
    const index = memoryDb.users.findIndex((u) => u.id === id);
    if (index === -1) return null;

    const current = memoryDb.users[index];
    const updated: User = {
      ...current,
      ...updates,
      medals: updates.medals !== undefined ? updates.medals : (current.medals || []),
      rating: updates.rating !== undefined ? Number(updates.rating) : current.rating,
      ratingsCount: updates.ratingsCount !== undefined ? Number(updates.ratingsCount) : current.ratingsCount,
      booksContributedCount: updates.booksContributedCount !== undefined ? Number(updates.booksContributedCount) : current.booksContributedCount,
      booksReadCount: updates.booksReadCount !== undefined ? Number(updates.booksReadCount) : current.booksReadCount,
      activeLoanCount: updates.activeLoanCount !== undefined ? Number(updates.activeLoanCount) : current.activeLoanCount
    };

    memoryDb.users[index] = updated;
    saveToDisk();
    return updated;
  },

  deleteUser(id: string): boolean {
    const user = this.getUserById(id);
    if (!user) return false;

    // 1. Remove user
    memoryDb.users = memoryDb.users.filter((u) => u.id !== id);

    // 2. Remove books owned by user
    memoryDb.books = memoryDb.books.filter((b) => b.ownerId !== id);

    // 3. Remove lending requests involving user
    memoryDb.requests = memoryDb.requests.filter((r) => r.ownerId !== id && r.borrowerId !== id);

    // 4. Clean up reviews submitted by this user on other books and re-calculate ratings
    memoryDb.books = memoryDb.books.map((b) => {
      if (!b.reviews || b.reviews.length === 0) return b;
      const filteredReviews = b.reviews.filter((r) => r.userId !== id);
      if (filteredReviews.length === b.reviews.length) return b;
      const totalScore = filteredReviews.reduce((sum, r) => sum + r.rating, 0);
      const newRating = filteredReviews.length > 0 ? Number((totalScore / filteredReviews.length).toFixed(1)) : 0;
      return {
        ...b,
        reviews: filteredReviews,
        reviewsCount: filteredReviews.length,
        rating: newRating
      };
    });

    // 5. Clean up user feedbacks
    memoryDb.feedbacks = memoryDb.feedbacks.filter((f) => f.fromUserId !== id && f.toUserId !== id);

    saveToDisk();
    return true;
  },

  // ---- BOOKS ----
  getAllBooks(): Book[] {
    return memoryDb.books.map((b) => {
      const reviews = Array.isArray(b.reviews) ? b.reviews : [];
      const calculatedRating = reviews.length > 0
        ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
        : (b.rating && reviews.length > 0 ? Number(b.rating) : 0);

      return {
        ...b,
        reviews: reviews,
        rating: calculatedRating,
        reviewsCount: reviews.length,
        isDamaged: Boolean(b.isDamaged)
      };
    });
  },

  getBookById(id: string): Book | null {
    const book = memoryDb.books.find((b) => b.id === id);
    if (!book) return null;
    const reviews = Array.isArray(book.reviews) ? book.reviews : [];
    const calculatedRating = reviews.length > 0
      ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
      : (book.rating && reviews.length > 0 ? Number(book.rating) : 0);

    return {
      ...book,
      reviews: reviews,
      rating: calculatedRating,
      reviewsCount: reviews.length,
      isDamaged: Boolean(book.isDamaged)
    };
  },

  createBook(book: Book): Book {
    const reviews = Array.isArray(book.reviews) ? book.reviews : [];
    const calculatedRating = reviews.length > 0
      ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
      : 0;

    const newBook: Book = {
      ...book,
      status: book.status || 'available',
      rating: calculatedRating,
      reviewsCount: reviews.length,
      reviews: reviews,
      addedDate: book.addedDate || new Date().toLocaleDateString('fa-IR'),
      isDamaged: Boolean(book.isDamaged)
    };

    const existingIdx = memoryDb.books.findIndex((b) => b.id === book.id);
    if (existingIdx >= 0) {
      memoryDb.books[existingIdx] = newBook;
    } else {
      memoryDb.books.push(newBook);
    }

    // Increment owner's booksContributedCount
    const owner = this.getUserById(book.ownerId);
    if (owner) {
      this.updateUser(owner.id, { booksContributedCount: (owner.booksContributedCount || 0) + 1 });
    }

    saveToDisk();
    return newBook;
  },

  updateBook(id: string, updates: Partial<Book>): Book | null {
    const index = memoryDb.books.findIndex((b) => b.id === id);
    if (index === -1) return null;

    const current = memoryDb.books[index];
    const updatedReviews = updates.reviews !== undefined ? updates.reviews : (current.reviews || []);
    const calculatedRating = updates.rating !== undefined 
      ? Number(updates.rating) 
      : (updatedReviews.length > 0 
          ? Number((updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length).toFixed(1))
          : 0);

    const updated: Book = {
      ...current,
      ...updates,
      reviews: updatedReviews,
      rating: calculatedRating,
      reviewsCount: updates.reviewsCount !== undefined ? Number(updates.reviewsCount) : updatedReviews.length,
      isDamaged: updates.isDamaged !== undefined ? Boolean(updates.isDamaged) : current.isDamaged
    };

    memoryDb.books[index] = updated;
    saveToDisk();
    return updated;
  },

  deleteBook(id: string): boolean {
    const book = this.getBookById(id);
    if (!book) return false;

    memoryDb.books = memoryDb.books.filter((b) => b.id !== id);
    memoryDb.requests = memoryDb.requests.filter((r) => r.bookId !== id);

    // Decrement user's count
    const owner = this.getUserById(book.ownerId);
    if (owner && (owner.booksContributedCount || 0) > 0) {
      this.updateUser(owner.id, { booksContributedCount: owner.booksContributedCount - 1 });
    }

    saveToDisk();
    return true;
  },

  addBookReview(bookId: string, review: BookReview): Book | null {
    const book = this.getBookById(bookId);
    if (!book) return null;

    const existingReviews = Array.isArray(book.reviews) ? [...book.reviews] : [];
    const existingIndex = existingReviews.findIndex((r) => r.userId === review.userId);

    let updatedReviews: BookReview[];
    if (existingIndex >= 0) {
      // Update existing review
      existingReviews[existingIndex] = {
        ...existingReviews[existingIndex],
        rating: review.rating,
        comment: review.comment,
        date: review.date || new Date().toLocaleDateString('fa-IR'),
        userName: review.userName || existingReviews[existingIndex].userName,
        userAvatar: review.userAvatar || existingReviews[existingIndex].userAvatar,
        userClass: review.userClass || existingReviews[existingIndex].userClass
      };
      updatedReviews = existingReviews;
    } else {
      // Add new review to beginning
      updatedReviews = [review, ...existingReviews];
    }

    const totalScore = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
    const newRating = updatedReviews.length > 0 ? Number((totalScore / updatedReviews.length).toFixed(1)) : 0;

    return this.updateBook(bookId, {
      reviews: updatedReviews,
      reviewsCount: updatedReviews.length,
      rating: newRating
    });
  },

  deleteBookReview(bookId: string, reviewId: string): Book | null {
    const book = this.getBookById(bookId);
    if (!book) return null;

    const existingReviews = Array.isArray(book.reviews) ? book.reviews : [];
    const filteredReviews = existingReviews.filter((r) => r.id !== reviewId && r.userId !== reviewId);

    const totalScore = filteredReviews.reduce((sum, r) => sum + r.rating, 0);
    const newRating = filteredReviews.length > 0 ? Number((totalScore / filteredReviews.length).toFixed(1)) : 0;

    return this.updateBook(bookId, {
      reviews: filteredReviews,
      reviewsCount: filteredReviews.length,
      rating: newRating
    });
  },

  // ---- LENDING REQUESTS ----
  getAllRequests(): LendingRequest[] {
    return memoryDb.requests.map((r) => ({
      ...r,
      is12hGraceConfirmed: Boolean(r.is12hGraceConfirmed),
      ownerFeedbackGiven: Boolean(r.ownerFeedbackGiven),
      borrowerFeedbackGiven: Boolean(r.borrowerFeedbackGiven),
      isDamagedReported: Boolean(r.isDamagedReported),
      feeAmount: Number(r.feeAmount) || 10000,
      extensionCount: Number(r.extensionCount) || 0
    }));
  },

  getRequestById(id: string): LendingRequest | null {
    const req = memoryDb.requests.find((r) => r.id === id);
    if (!req) return null;
    return {
      ...req,
      is12hGraceConfirmed: Boolean(req.is12hGraceConfirmed),
      ownerFeedbackGiven: Boolean(req.ownerFeedbackGiven),
      borrowerFeedbackGiven: Boolean(req.borrowerFeedbackGiven),
      isDamagedReported: Boolean(req.isDamagedReported),
      feeAmount: Number(req.feeAmount) || 10000,
      extensionCount: Number(req.extensionCount) || 0
    };
  },

  createRequest(req: LendingRequest): LendingRequest {
    const newReq: LendingRequest = {
      ...req,
      status: req.status || 'pending',
      feeAmount: Number(req.feeAmount) || 10000,
      paymentStatus: req.paymentStatus || 'pending',
      extensionStatus: req.extensionStatus || 'none',
      extensionCount: Number(req.extensionCount) || 0,
      createdAt: req.createdAt || new Date().toLocaleDateString('fa-IR'),
      is12hGraceConfirmed: Boolean(req.is12hGraceConfirmed),
      ownerFeedbackGiven: Boolean(req.ownerFeedbackGiven),
      borrowerFeedbackGiven: Boolean(req.borrowerFeedbackGiven),
      isDamagedReported: Boolean(req.isDamagedReported)
    };

    const existingIdx = memoryDb.requests.findIndex((r) => r.id === req.id);
    if (existingIdx >= 0) {
      memoryDb.requests[existingIdx] = newReq;
    } else {
      memoryDb.requests.unshift(newReq);
    }

    // Update book status to requested
    this.updateBook(req.bookId, { status: 'requested' });

    saveToDisk();
    return newReq;
  },

  updateRequest(id: string, updates: Partial<LendingRequest>): LendingRequest | null {
    const index = memoryDb.requests.findIndex((r) => r.id === id);
    if (index === -1) return null;

    const current = memoryDb.requests[index];
    const updated: LendingRequest = {
      ...current,
      ...updates,
      feeAmount: updates.feeAmount !== undefined ? Number(updates.feeAmount) : current.feeAmount,
      extensionCount: updates.extensionCount !== undefined ? Number(updates.extensionCount) : current.extensionCount,
      is12hGraceConfirmed: updates.is12hGraceConfirmed !== undefined ? Boolean(updates.is12hGraceConfirmed) : current.is12hGraceConfirmed,
      ownerFeedbackGiven: updates.ownerFeedbackGiven !== undefined ? Boolean(updates.ownerFeedbackGiven) : current.ownerFeedbackGiven,
      borrowerFeedbackGiven: updates.borrowerFeedbackGiven !== undefined ? Boolean(updates.borrowerFeedbackGiven) : current.borrowerFeedbackGiven,
      isDamagedReported: updates.isDamagedReported !== undefined ? Boolean(updates.isDamagedReported) : current.isDamagedReported
    };

    memoryDb.requests[index] = updated;
    saveToDisk();
    return updated;
  },

  // ---- SCHOOL CLASSES ----
  getAllClasses(): SchoolClass[] {
    return [...memoryDb.schoolClasses];
  },

  createClass(c: SchoolClass): SchoolClass {
    const existingIdx = memoryDb.schoolClasses.findIndex((item) => item.id === c.id);
    if (existingIdx >= 0) {
      memoryDb.schoolClasses[existingIdx] = c;
    } else {
      memoryDb.schoolClasses.push(c);
    }
    saveToDisk();
    return c;
  },

  updateClass(id: string, updates: Partial<SchoolClass>): SchoolClass | null {
    const index = memoryDb.schoolClasses.findIndex((c) => c.id === id);
    if (index === -1) return null;

    const current = memoryDb.schoolClasses[index];
    const updated: SchoolClass = { ...current, ...updates };
    memoryDb.schoolClasses[index] = updated;
    saveToDisk();
    return updated;
  },

  deleteClass(id: string): boolean {
    const initialLen = memoryDb.schoolClasses.length;
    memoryDb.schoolClasses = memoryDb.schoolClasses.filter((c) => c.id !== id);
    if (memoryDb.schoolClasses.length !== initialLen) {
      saveToDisk();
      return true;
    }
    return false;
  },

  // ---- FEEDBACKS ----
  getAllFeedbacks(): MutualFeedback[] {
    return memoryDb.feedbacks.map((fb) => ({
      ...fb,
      punctualityScore: Number(fb.punctualityScore) || 5.0,
      conditionScore: Number(fb.conditionScore) || 5.0,
      behaviorScore: Number(fb.behaviorScore) || 5.0,
      reliabilityScore: Number(fb.reliabilityScore) || 5.0
    }));
  },

  createFeedback(fb: MutualFeedback): MutualFeedback {
    const newFb: MutualFeedback = {
      ...fb,
      punctualityScore: Number(fb.punctualityScore) || 5.0,
      conditionScore: Number(fb.conditionScore) || 5.0,
      behaviorScore: Number(fb.behaviorScore) || 5.0,
      reliabilityScore: Number(fb.reliabilityScore) || 5.0
    };

    memoryDb.feedbacks.unshift(newFb);

    // Update target user's rating
    const targetUser = this.getUserById(fb.toUserId);
    if (targetUser) {
      const avgScore = (newFb.punctualityScore + newFb.conditionScore + newFb.behaviorScore + newFb.reliabilityScore) / 4;
      const currentCount = targetUser.ratingsCount || 0;
      const currentRating = targetUser.rating || 5.0;
      const newRating = Number(((currentRating * currentCount + avgScore) / (currentCount + 1)).toFixed(1));

      this.updateUser(targetUser.id, {
        rating: newRating,
        ratingsCount: currentCount + 1
      });
    }

    // Always increment borrower's booksReadCount when a feedback/return is recorded
    const reqItem = this.getRequestById(fb.requestId);
    const borrowerId = reqItem?.borrowerId || (fb.role === 'owner_to_borrower' ? fb.toUserId : fb.fromUserId);
    if (borrowerId) {
      const borrower = this.getUserById(borrowerId);
      if (borrower) {
        this.updateUser(borrower.id, {
          booksReadCount: (borrower.booksReadCount || 0) + 1
        });
      }
    }

    saveToDisk();
    return newFb;
  },

  deleteFeedback(id: string): boolean {
    const initialLen = memoryDb.feedbacks.length;
    memoryDb.feedbacks = memoryDb.feedbacks.filter((fb) => fb.id !== id);
    if (memoryDb.feedbacks.length !== initialLen) {
      saveToDisk();
      return true;
    }
    return false;
  },

  getSetting(key: string): string | null {
    return memoryDb.settings[key] || null;
  },

  setSetting(key: string, value: string): void {
    memoryDb.settings[key] = value;
    saveToDisk();
  },

  // ---- SETTINGS ----
  getBankCardInfo(): BankCardInfo {
    const val = memoryDb.settings['bank_card_info'];
    if (val) {
      try {
        return JSON.parse(val);
      } catch (e) {
        // fallback
      }
    }
    return {
      cardNumber: '6037-9918-9876-5432',
      cardHolderName: 'پارسا فیض (مدیر و راهبر مکتب‌خانه)',
      bankName: 'بانک ملی ایران'
    };
  },

  setBankCardInfo(info: BankCardInfo): BankCardInfo {
    memoryDb.settings['bank_card_info'] = JSON.stringify(info);
    saveToDisk();
    return info;
  },

  getSystemConfig(): SystemConfig {
    const val = memoryDb.settings['system_config'];
    if (val) {
      try {
        const parsed = JSON.parse(val);
        return {
          minBooksForRegistration: parsed.minBooksForRegistration ?? 3,
          maxBooksForRegistration: parsed.maxBooksForRegistration ?? 5,
          requireAdminApproval: parsed.requireAdminApproval ?? true,
          loanFeeAmount: parsed.loanFeeAmount ?? 10000,
          loanDurationDays: parsed.loanDurationDays ?? 7,
          paymentWindowHours: parsed.paymentWindowHours ?? 3,
          handoverWindowHours: parsed.handoverWindowHours ?? 12,
          supportPhone: parsed.supportPhone ?? '09121112233',
          supportBaleId: parsed.supportBaleId ?? 'maktabkhune_admin',
          supportAdminName: parsed.supportAdminName ?? 'پارسا فیض (مسئول مکتب‌خانه)',
          supportHours: parsed.supportHours ?? 'شنبه تا چهارشنبه - ساعت ۷:۳۰ الی ۱۴:۰۰',
          baleChannelUsername: parsed.baleChannelUsername ?? '@maktabkhune_books',
          autoPublishBooksToBale: parsed.autoPublishBooksToBale ?? true,
          websiteBaseUrl: parsed.websiteBaseUrl ?? ''
        };
      } catch (e) {
        // fallback
      }
    }
    return {
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
  },

  setSystemConfig(config: Partial<SystemConfig>): SystemConfig {
    const current = this.getSystemConfig();
    const updated: SystemConfig = {
      ...current,
      ...config
    };
    memoryDb.settings['system_config'] = JSON.stringify(updated);
    saveToDisk();
    return updated;
  },

  // ---- SYSTEM LOGS ----
  addSystemLog(
    level: 'info' | 'warn' | 'error' | 'db',
    message: string,
    details?: string,
    userName?: string,
    userPhone?: string
  ): SystemLog {
    if (!memoryDb.systemLogs) memoryDb.systemLogs = [];
    const newLog: SystemLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: `${new Date().toLocaleDateString('fa-IR')} ${new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`,
      level,
      message,
      details,
      userName,
      userPhone
    };
    memoryDb.systemLogs.unshift(newLog);
    if (memoryDb.systemLogs.length > 500) {
      memoryDb.systemLogs = memoryDb.systemLogs.slice(0, 500);
    }
    saveToDisk();

    // Trigger registered log listeners (e.g. Bale notifications for errors)
    logListeners.forEach((listener) => {
      try {
        listener(newLog);
      } catch (e) {
        console.error('Error in log listener:', e);
      }
    });

    return newLog;
  },

  getSystemLogs(): SystemLog[] {
    return memoryDb.systemLogs || [];
  },

  clearSystemLogs(): boolean {
    memoryDb.systemLogs = [];
    saveToDisk();
    return true;
  },

  // Bootstrap full state
  getBootstrapData() {
    return {
      users: this.getAllUsers(),
      books: this.getAllBooks(),
      requests: this.getAllRequests(),
      schoolClasses: this.getAllClasses(),
      feedbacks: this.getAllFeedbacks(),
      bankCardInfo: this.getBankCardInfo(),
      systemConfig: this.getSystemConfig(),
      systemLogs: this.getSystemLogs()
    };
  },

  getRawDatabase(): DatabaseSchema {
    return memoryDb;
  },

  restoreDatabase(rawJson: any): boolean {
    if (!rawJson || typeof rawJson !== 'object') {
      throw new Error('فایل پشتیبان نامعتبر است.');
    }
    
    // Core validation: should have at least users or books, or be an empty schema structure
    memoryDb = {
      users: Array.isArray(rawJson.users) ? rawJson.users : [],
      books: Array.isArray(rawJson.books) ? rawJson.books : [],
      requests: Array.isArray(rawJson.requests) ? rawJson.requests : [],
      schoolClasses: Array.isArray(rawJson.schoolClasses) ? rawJson.schoolClasses : [],
      feedbacks: Array.isArray(rawJson.feedbacks) ? rawJson.feedbacks : [],
      settings: typeof rawJson.settings === 'object' && rawJson.settings !== null ? rawJson.settings : {},
      systemLogs: Array.isArray(rawJson.systemLogs) ? rawJson.systemLogs : []
    };
    
    saveToDisk();
    return true;
  }
};
