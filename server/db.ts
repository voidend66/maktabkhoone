import path from 'path';
import fs from 'fs';
import {
  User,
  Book,
  LendingRequest,
  SchoolClass,
  MutualFeedback,
  BankCardInfo,
  BookReview
} from '../src/types';
import { ADMIN_PHONES, isAdminPhone, SCHOOL_GRADES, CATEGORIES } from '../src/data/mockData';

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_FILE = path.join(DATA_DIR, 'maktabkhune.json');
const DB_BACKUP = path.join(DATA_DIR, 'maktabkhune.json.bak');

interface DatabaseSchema {
  users: User[];
  books: Book[];
  requests: LendingRequest[];
  schoolClasses: SchoolClass[];
  feedbacks: MutualFeedback[];
  settings: Record<string, string>;
}

// In-memory data store with disk persistence
let memoryDb: DatabaseSchema = {
  users: [],
  books: [],
  requests: [],
  schoolClasses: [],
  feedbacks: [],
  settings: {}
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
          settings: typeof parsed.settings === 'object' && parsed.settings !== null ? parsed.settings : {}
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
          settings: typeof parsed.settings === 'object' && parsed.settings !== null ? parsed.settings : {}
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

  // Seed default classes if empty
  if (memoryDb.schoolClasses.length === 0) {
    const defaultClasses: SchoolClass[] = [
      { id: 'c_7_1', name: 'کلاس ۱/۷', grade: 'پایه هفتم' },
      { id: 'c_7_2', name: 'کلاس ۲/۷', grade: 'پایه هفتم' },
      { id: 'c_8_1', name: 'کلاس ۱/۸', grade: 'پایه هشتم' },
      { id: 'c_8_2', name: 'کلاس ۲/۸', grade: 'پایه هشتم' },
      { id: 'c_9_1', name: 'کلاس ۱/۹', grade: 'پایه نهم' },
      { id: 'c_9_2', name: 'کلاس ۲/۹', grade: 'پایه نهم' },
      { id: 'c_10_exp', name: '۱۰ تجربی', grade: 'پایه دهم' },
      { id: 'c_10_math', name: '۱۰ ریاضی', grade: 'پایه دهم' },
      { id: 'c_10_hum', name: '۱۰ انسانی', grade: 'پایه دهم' },
      { id: 'c_11_exp', name: '۱۱ تجربی', grade: 'پایه یازدهم' },
      { id: 'c_11_math', name: '۱۱ ریاضی', grade: 'پایه یازدهم' },
      { id: 'c_11_hum', name: '۱۱ انسانی', grade: 'پایه یازدهم' },
      { id: 'c_12_exp', name: '۱۲ تجربی', grade: 'پایه دوازدهم' },
      { id: 'c_12_math', name: '۱۲ ریاضی', grade: 'پایه دوازدهم' },
      { id: 'c_12_hum', name: '۱۲ انسانی', grade: 'پایه دوازدهم' },
      { id: 'c_alumni', name: 'فارغ‌التحصیلان و معلمان', grade: 'سایر / مهمان', isExternal: true }
    ];
    memoryDb.schoolClasses = defaultClasses;
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

export const dbService = {
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
    const initialLen = memoryDb.users.length;
    memoryDb.users = memoryDb.users.filter((u) => u.id !== id);
    if (memoryDb.users.length !== initialLen) {
      saveToDisk();
      return true;
    }
    return false;
  },

  // ---- BOOKS ----
  getAllBooks(): Book[] {
    return memoryDb.books.map((b) => ({
      ...b,
      reviews: Array.isArray(b.reviews) ? b.reviews : [],
      rating: Number(b.rating) || 5.0,
      reviewsCount: Number(b.reviewsCount) || 0,
      isDamaged: Boolean(b.isDamaged)
    }));
  },

  getBookById(id: string): Book | null {
    const book = memoryDb.books.find((b) => b.id === id);
    if (!book) return null;
    return {
      ...book,
      reviews: Array.isArray(book.reviews) ? book.reviews : [],
      rating: Number(book.rating) || 5.0,
      reviewsCount: Number(book.reviewsCount) || 0,
      isDamaged: Boolean(book.isDamaged)
    };
  },

  createBook(book: Book): Book {
    const newBook: Book = {
      ...book,
      status: book.status || 'available',
      rating: Number(book.rating) || 5.0,
      reviewsCount: Number(book.reviewsCount) || 0,
      reviews: Array.isArray(book.reviews) ? book.reviews : [],
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
    const updated: Book = {
      ...current,
      ...updates,
      reviews: updates.reviews !== undefined ? updates.reviews : (current.reviews || []),
      rating: updates.rating !== undefined ? Number(updates.rating) : current.rating,
      reviewsCount: updates.reviewsCount !== undefined ? Number(updates.reviewsCount) : current.reviewsCount,
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

    const updatedReviews = [review, ...(book.reviews || [])];
    const totalScore = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
    const newRating = Number((totalScore / updatedReviews.length).toFixed(1));

    return this.updateBook(bookId, {
      reviews: updatedReviews,
      reviewsCount: updatedReviews.length,
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

    // Update target user's rating & read count
    const targetUser = this.getUserById(fb.toUserId);
    if (targetUser) {
      const avgScore = (newFb.punctualityScore + newFb.conditionScore + newFb.behaviorScore + newFb.reliabilityScore) / 4;
      const currentCount = targetUser.ratingsCount || 0;
      const currentRating = targetUser.rating || 5.0;
      const newRating = Number(((currentRating * currentCount + avgScore) / (currentCount + 1)).toFixed(1));

      const isBorrowerFinished = fb.role === 'owner_to_borrower';
      this.updateUser(targetUser.id, {
        rating: newRating,
        ratingsCount: currentCount + 1,
        booksReadCount: isBorrowerFinished ? (targetUser.booksReadCount || 0) + 1 : targetUser.booksReadCount
      });
    }

    saveToDisk();
    return newFb;
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

  // Bootstrap full state
  getBootstrapData() {
    return {
      users: this.getAllUsers(),
      books: this.getAllBooks(),
      requests: this.getAllRequests(),
      schoolClasses: this.getAllClasses(),
      feedbacks: this.getAllFeedbacks(),
      bankCardInfo: this.getBankCardInfo()
    };
  }
};
