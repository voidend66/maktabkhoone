import { DatabaseSync } from 'node:sqlite';
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

const DB_PATH = path.join(DATA_DIR, 'maktabkhune.db');

// Initialize native SQLite connection
const db = new DatabaseSync(DB_PATH);

// Enable WAL mode for better concurrency
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA synchronous = NORMAL;');

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    className TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    avatar TEXT,
    status TEXT NOT NULL,
    role TEXT NOT NULL,
    password TEXT,
    rating REAL DEFAULT 5.0,
    ratingsCount INTEGER DEFAULT 0,
    booksContributedCount INTEGER DEFAULT 0,
    booksReadCount INTEGER DEFAULT 0,
    medals TEXT,
    joinedDate TEXT,
    suspensionReason TEXT,
    activeLoanCount INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    ownerId TEXT NOT NULL,
    ownerName TEXT NOT NULL,
    ownerClass TEXT NOT NULL,
    ownerAvatar TEXT,
    coverImage TEXT NOT NULL,
    category TEXT NOT NULL,
    condition TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL,
    borrowerId TEXT,
    borrowerName TEXT,
    rating REAL DEFAULT 5.0,
    reviewsCount INTEGER DEFAULT 0,
    reviews TEXT,
    addedDate TEXT,
    estimatedReturnDate TEXT,
    isDamaged INTEGER DEFAULT 0,
    damageDescription TEXT
  );

  CREATE TABLE IF NOT EXISTS lending_requests (
    id TEXT PRIMARY KEY,
    bookId TEXT NOT NULL,
    bookTitle TEXT NOT NULL,
    bookCover TEXT,
    ownerId TEXT NOT NULL,
    ownerName TEXT NOT NULL,
    ownerClass TEXT,
    borrowerId TEXT NOT NULL,
    borrowerName TEXT NOT NULL,
    borrowerClass TEXT,
    borrowerPhone TEXT,
    status TEXT NOT NULL,
    pickupLocation TEXT,
    pickupTime TEXT,
    pickupShift TEXT,
    handoverWindow TEXT,
    handoverConfirmedAt TEXT,
    handoverConfirmedByRole TEXT,
    is12hGraceConfirmed INTEGER DEFAULT 0,
    createdAt TEXT NOT NULL,
    acceptedAt TEXT,
    ownerFeedbackGiven INTEGER DEFAULT 0,
    borrowerFeedbackGiven INTEGER DEFAULT 0,
    feeAmount INTEGER DEFAULT 10000,
    paymentStatus TEXT,
    paymentDeadline TEXT,
    paidAt TEXT,
    paymentProof TEXT,
    dueDate TEXT,
    extensionStatus TEXT,
    extensionCount INTEGER DEFAULT 0,
    extensionRequestedAt TEXT,
    isDamagedReported INTEGER DEFAULT 0,
    damageNotes TEXT
  );

  CREATE TABLE IF NOT EXISTS school_classes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    grade TEXT NOT NULL,
    isExternal INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS feedbacks (
    id TEXT PRIMARY KEY,
    requestId TEXT NOT NULL,
    fromUserId TEXT NOT NULL,
    fromUserName TEXT NOT NULL,
    toUserId TEXT NOT NULL,
    toUserName TEXT NOT NULL,
    role TEXT NOT NULL,
    punctualityScore REAL DEFAULT 5.0,
    conditionScore REAL DEFAULT 5.0,
    behaviorScore REAL DEFAULT 5.0,
    reliabilityScore REAL DEFAULT 5.0,
    comment TEXT,
    date TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Helper function to seed initial classes & default settings if empty
function seedInitialDataIfEmpty() {
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM school_classes');
  const result = countStmt.get() as { count: number };
  if (result.count === 0) {
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

    const insertClassStmt = db.prepare(
      'INSERT INTO school_classes (id, name, grade, isExternal) VALUES (?, ?, ?, ?)'
    );

    for (const c of defaultClasses) {
      insertClassStmt.run(c.id, c.name, c.grade, c.isExternal ? 1 : 0);
    }
  }

  // Seed default bank card info if not set
  const cardSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('bank_card_info') as { value: string } | undefined;
  if (!cardSetting) {
    const defaultCard: BankCardInfo = {
      cardNumber: '6037-9918-9876-5432',
      cardHolderName: 'پارسا فیض (مدیر و راهبر مکتب‌خانه)',
      bankName: 'بانک ملی ایران'
    };
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('bank_card_info', JSON.stringify(defaultCard));
  }

  // Ensure default admin users exist in DB if not registered yet
  for (const adminPhone of ADMIN_PHONES) {
    const cleanPhone = adminPhone.replace(/\D/g, '');
    const userRow = db.prepare('SELECT id FROM users WHERE phone = ?').get(adminPhone);
    if (!userRow) {
      const adminId = `u_admin_${cleanPhone.slice(-4)}`;
      const medals = JSON.stringify([
        {
          id: 'm_admin_crown',
          title: 'راهبر کتابخانه',
          icon: '👑',
          description: 'مدیریت و سرپرستی کتابخانه مکتب‌خانه',
          color: 'bg-amber-100 text-amber-800 border-amber-300'
        }
      ]);

      db.prepare(`
        INSERT OR IGNORE INTO users (
          id, name, className, phone, avatar, status, role, password,
          rating, ratingsCount, booksContributedCount, booksReadCount, medals, joinedDate
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        adminId,
        'مدیر سامانه مکتب‌خانه',
        'مدیریت کتابخانه',
        adminPhone,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
        'approved',
        'admin',
        'admin123',
        5.0,
        1,
        0,
        0,
        medals,
        new Date().toLocaleDateString('fa-IR')
      );
    }
  }
}

seedInitialDataIfEmpty();

// ==========================================
// Database Access Functions
// ==========================================

export const dbService = {
  // ---- USERS ----
  getAllUsers(): User[] {
    const rows = db.prepare('SELECT * FROM users').all() as any[];
    return rows.map((r) => ({
      ...r,
      medals: r.medals ? JSON.parse(r.medals) : [],
      rating: Number(r.rating) || 5.0,
      ratingsCount: Number(r.ratingsCount) || 0,
      booksContributedCount: Number(r.booksContributedCount) || 0,
      booksReadCount: Number(r.booksReadCount) || 0,
      activeLoanCount: Number(r.activeLoanCount) || 0
    }));
  },

  getUserById(id: string): User | null {
    const r = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
    if (!r) return null;
    return {
      ...r,
      medals: r.medals ? JSON.parse(r.medals) : [],
      rating: Number(r.rating) || 5.0,
      ratingsCount: Number(r.ratingsCount) || 0,
      booksContributedCount: Number(r.booksContributedCount) || 0,
      booksReadCount: Number(r.booksReadCount) || 0,
      activeLoanCount: Number(r.activeLoanCount) || 0
    };
  },

  getUserByPhone(phone: string): User | null {
    const cleanDigits = phone.replace(/\D/g, '');
    const users = this.getAllUsers();
    return users.find((u) => {
      const uClean = u.phone.replace(/\D/g, '');
      return uClean === cleanDigits || u.phone === phone || (cleanDigits.length >= 10 && uClean.endsWith(cleanDigits.slice(-10)));
    }) || null;
  },

  createUser(user: User): User {
    const stmt = db.prepare(`
      INSERT INTO users (
        id, name, className, phone, avatar, status, role, password,
        rating, ratingsCount, booksContributedCount, booksReadCount, medals, joinedDate, suspensionReason, activeLoanCount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      user.id,
      user.name,
      user.className,
      user.phone,
      user.avatar || '',
      user.status,
      user.role,
      user.password || '',
      user.rating || 5.0,
      user.ratingsCount || 0,
      user.booksContributedCount || 0,
      user.booksReadCount || 0,
      JSON.stringify(user.medals || []),
      user.joinedDate || new Date().toLocaleDateString('fa-IR'),
      user.suspensionReason || null,
      user.activeLoanCount || 0
    );

    return user;
  },

  updateUser(id: string, updates: Partial<User>): User | null {
    const current = this.getUserById(id);
    if (!current) return null;

    const merged: User = { ...current, ...updates };

    const stmt = db.prepare(`
      UPDATE users SET
        name = ?,
        className = ?,
        phone = ?,
        avatar = ?,
        status = ?,
        role = ?,
        password = ?,
        rating = ?,
        ratingsCount = ?,
        booksContributedCount = ?,
        booksReadCount = ?,
        medals = ?,
        suspensionReason = ?,
        activeLoanCount = ?
      WHERE id = ?
    `);

    stmt.run(
      merged.name,
      merged.className,
      merged.phone,
      merged.avatar,
      merged.status,
      merged.role,
      merged.password || '',
      merged.rating,
      merged.ratingsCount,
      merged.booksContributedCount,
      merged.booksReadCount,
      JSON.stringify(merged.medals || []),
      merged.suspensionReason || null,
      merged.activeLoanCount || 0,
      id
    );

    return merged;
  },

  // ---- BOOKS ----
  getAllBooks(): Book[] {
    const rows = db.prepare('SELECT * FROM books').all() as any[];
    return rows.map((r) => ({
      ...r,
      reviews: r.reviews ? JSON.parse(r.reviews) : [],
      rating: Number(r.rating) || 5.0,
      reviewsCount: Number(r.reviewsCount) || 0,
      isDamaged: Boolean(r.isDamaged)
    }));
  },

  getBookById(id: string): Book | null {
    const r = db.prepare('SELECT * FROM books WHERE id = ?').get(id) as any;
    if (!r) return null;
    return {
      ...r,
      reviews: r.reviews ? JSON.parse(r.reviews) : [],
      rating: Number(r.rating) || 5.0,
      reviewsCount: Number(r.reviewsCount) || 0,
      isDamaged: Boolean(r.isDamaged)
    };
  },

  createBook(book: Book): Book {
    const stmt = db.prepare(`
      INSERT INTO books (
        id, title, author, ownerId, ownerName, ownerClass, ownerAvatar,
        coverImage, category, condition, description, status, borrowerId,
        borrowerName, rating, reviewsCount, reviews, addedDate,
        estimatedReturnDate, isDamaged, damageDescription
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      book.id,
      book.title,
      book.author,
      book.ownerId,
      book.ownerName,
      book.ownerClass,
      book.ownerAvatar || '',
      book.coverImage,
      book.category,
      book.condition,
      book.description || '',
      book.status || 'available',
      book.borrowerId || null,
      book.borrowerName || null,
      book.rating || 5.0,
      book.reviewsCount || 0,
      JSON.stringify(book.reviews || []),
      book.addedDate || new Date().toLocaleDateString('fa-IR'),
      book.estimatedReturnDate || null,
      book.isDamaged ? 1 : 0,
      book.damageDescription || null
    );

    // Increment owner's booksContributedCount
    const owner = this.getUserById(book.ownerId);
    if (owner) {
      this.updateUser(owner.id, { booksContributedCount: (owner.booksContributedCount || 0) + 1 });
    }

    return book;
  },

  updateBook(id: string, updates: Partial<Book>): Book | null {
    const current = this.getBookById(id);
    if (!current) return null;

    const merged: Book = { ...current, ...updates };

    const stmt = db.prepare(`
      UPDATE books SET
        title = ?,
        author = ?,
        ownerName = ?,
        ownerClass = ?,
        ownerAvatar = ?,
        coverImage = ?,
        category = ?,
        condition = ?,
        description = ?,
        status = ?,
        borrowerId = ?,
        borrowerName = ?,
        rating = ?,
        reviewsCount = ?,
        reviews = ?,
        estimatedReturnDate = ?,
        isDamaged = ?,
        damageDescription = ?
      WHERE id = ?
    `);

    stmt.run(
      merged.title,
      merged.author,
      merged.ownerName,
      merged.ownerClass,
      merged.ownerAvatar || '',
      merged.coverImage,
      merged.category,
      merged.condition,
      merged.description || '',
      merged.status,
      merged.borrowerId || null,
      merged.borrowerName || null,
      merged.rating,
      merged.reviewsCount,
      JSON.stringify(merged.reviews || []),
      merged.estimatedReturnDate || null,
      merged.isDamaged ? 1 : 0,
      merged.damageDescription || null,
      id
    );

    return merged;
  },

  deleteBook(id: string): boolean {
    const book = this.getBookById(id);
    if (!book) return false;

    db.prepare('DELETE FROM books WHERE id = ?').run(id);

    // Decrement user's count
    const owner = this.getUserById(book.ownerId);
    if (owner && (owner.booksContributedCount || 0) > 0) {
      this.updateUser(owner.id, { booksContributedCount: owner.booksContributedCount - 1 });
    }

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
    const rows = db.prepare('SELECT * FROM lending_requests ORDER BY createdAt DESC').all() as any[];
    return rows.map((r) => ({
      ...r,
      is12hGraceConfirmed: Boolean(r.is12hGraceConfirmed),
      ownerFeedbackGiven: Boolean(r.ownerFeedbackGiven),
      borrowerFeedbackGiven: Boolean(r.borrowerFeedbackGiven),
      isDamagedReported: Boolean(r.isDamagedReported),
      paymentProof: r.paymentProof ? JSON.parse(r.paymentProof) : undefined,
      feeAmount: Number(r.feeAmount) || 10000,
      extensionCount: Number(r.extensionCount) || 0
    }));
  },

  getRequestById(id: string): LendingRequest | null {
    const r = db.prepare('SELECT * FROM lending_requests WHERE id = ?').get(id) as any;
    if (!r) return null;
    return {
      ...r,
      is12hGraceConfirmed: Boolean(r.is12hGraceConfirmed),
      ownerFeedbackGiven: Boolean(r.ownerFeedbackGiven),
      borrowerFeedbackGiven: Boolean(r.borrowerFeedbackGiven),
      isDamagedReported: Boolean(r.isDamagedReported),
      paymentProof: r.paymentProof ? JSON.parse(r.paymentProof) : undefined,
      feeAmount: Number(r.feeAmount) || 10000,
      extensionCount: Number(r.extensionCount) || 0
    };
  },

  createRequest(req: LendingRequest): LendingRequest {
    const stmt = db.prepare(`
      INSERT INTO lending_requests (
        id, bookId, bookTitle, bookCover, ownerId, ownerName, ownerClass,
        borrowerId, borrowerName, borrowerClass, borrowerPhone, status,
        pickupLocation, pickupTime, pickupShift, handoverWindow, handoverConfirmedAt,
        handoverConfirmedByRole, is12hGraceConfirmed, createdAt, acceptedAt,
        ownerFeedbackGiven, borrowerFeedbackGiven, feeAmount, paymentStatus,
        paymentDeadline, paidAt, paymentProof, dueDate, extensionStatus,
        extensionCount, extensionRequestedAt, isDamagedReported, damageNotes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      req.id,
      req.bookId,
      req.bookTitle,
      req.bookCover || '',
      req.ownerId,
      req.ownerName,
      req.ownerClass || '',
      req.borrowerId,
      req.borrowerName,
      req.borrowerClass || '',
      req.borrowerPhone || '',
      req.status || 'pending',
      req.pickupLocation || null,
      req.pickupTime || null,
      req.pickupShift || null,
      req.handoverWindow || null,
      req.handoverConfirmedAt || null,
      req.handoverConfirmedByRole || null,
      req.is12hGraceConfirmed ? 1 : 0,
      req.createdAt || new Date().toLocaleDateString('fa-IR'),
      req.acceptedAt || null,
      req.ownerFeedbackGiven ? 1 : 0,
      req.borrowerFeedbackGiven ? 1 : 0,
      req.feeAmount || 10000,
      req.paymentStatus || 'pending',
      req.paymentDeadline || null,
      req.paidAt || null,
      req.paymentProof ? JSON.stringify(req.paymentProof) : null,
      req.dueDate || null,
      req.extensionStatus || 'none',
      req.extensionCount || 0,
      req.extensionRequestedAt || null,
      req.isDamagedReported ? 1 : 0,
      req.damageNotes || null
    );

    // Update book status to requested
    this.updateBook(req.bookId, { status: 'requested' });

    return req;
  },

  updateRequest(id: string, updates: Partial<LendingRequest>): LendingRequest | null {
    const current = this.getRequestById(id);
    if (!current) return null;

    const merged: LendingRequest = { ...current, ...updates };

    const stmt = db.prepare(`
      UPDATE lending_requests SET
        status = ?,
        pickupLocation = ?,
        pickupTime = ?,
        pickupShift = ?,
        handoverWindow = ?,
        handoverConfirmedAt = ?,
        handoverConfirmedByRole = ?,
        is12hGraceConfirmed = ?,
        acceptedAt = ?,
        ownerFeedbackGiven = ?,
        borrowerFeedbackGiven = ?,
        feeAmount = ?,
        paymentStatus = ?,
        paymentDeadline = ?,
        paidAt = ?,
        paymentProof = ?,
        dueDate = ?,
        extensionStatus = ?,
        extensionCount = ?,
        extensionRequestedAt = ?,
        isDamagedReported = ?,
        damageNotes = ?
      WHERE id = ?
    `);

    stmt.run(
      merged.status,
      merged.pickupLocation || null,
      merged.pickupTime || null,
      merged.pickupShift || null,
      merged.handoverWindow || null,
      merged.handoverConfirmedAt || null,
      merged.handoverConfirmedByRole || null,
      merged.is12hGraceConfirmed ? 1 : 0,
      merged.acceptedAt || null,
      merged.ownerFeedbackGiven ? 1 : 0,
      merged.borrowerFeedbackGiven ? 1 : 0,
      merged.feeAmount || 10000,
      merged.paymentStatus || 'pending',
      merged.paymentDeadline || null,
      merged.paidAt || null,
      merged.paymentProof ? JSON.stringify(merged.paymentProof) : null,
      merged.dueDate || null,
      merged.extensionStatus || 'none',
      merged.extensionCount || 0,
      merged.extensionRequestedAt || null,
      merged.isDamagedReported ? 1 : 0,
      merged.damageNotes || null,
      id
    );

    return merged;
  },

  // ---- SCHOOL CLASSES ----
  getAllClasses(): SchoolClass[] {
    const rows = db.prepare('SELECT * FROM school_classes ORDER BY grade, name').all() as any[];
    return rows.map((r) => ({
      ...r,
      isExternal: Boolean(r.isExternal)
    }));
  },

  createClass(c: SchoolClass): SchoolClass {
    const stmt = db.prepare('INSERT INTO school_classes (id, name, grade, isExternal) VALUES (?, ?, ?, ?)');
    stmt.run(c.id, c.name, c.grade, c.isExternal ? 1 : 0);
    return c;
  },

  updateClass(id: string, updates: Partial<SchoolClass>): SchoolClass | null {
    const current = db.prepare('SELECT * FROM school_classes WHERE id = ?').get(id) as any;
    if (!current) return null;
    const merged: SchoolClass = { ...current, isExternal: Boolean(current.isExternal), ...updates };
    db.prepare('UPDATE school_classes SET name = ?, grade = ?, isExternal = ? WHERE id = ?').run(
      merged.name,
      merged.grade,
      merged.isExternal ? 1 : 0,
      id
    );
    return merged;
  },

  deleteClass(id: string): boolean {
    db.prepare('DELETE FROM school_classes WHERE id = ?').run(id);
    return true;
  },

  // ---- FEEDBACKS ----
  getAllFeedbacks(): MutualFeedback[] {
    const rows = db.prepare('SELECT * FROM feedbacks ORDER BY date DESC').all() as any[];
    return rows.map((r) => ({
      ...r,
      punctualityScore: Number(r.punctualityScore) || 5.0,
      conditionScore: Number(r.conditionScore) || 5.0,
      behaviorScore: Number(r.behaviorScore) || 5.0,
      reliabilityScore: Number(r.reliabilityScore) || 5.0
    }));
  },

  createFeedback(fb: MutualFeedback): MutualFeedback {
    const stmt = db.prepare(`
      INSERT INTO feedbacks (
        id, requestId, fromUserId, fromUserName, toUserId, toUserName,
        role, punctualityScore, conditionScore, behaviorScore, reliabilityScore, comment, date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      fb.id,
      fb.requestId,
      fb.fromUserId,
      fb.fromUserName,
      fb.toUserId,
      fb.toUserName,
      fb.role,
      fb.punctualityScore,
      fb.conditionScore,
      fb.behaviorScore,
      fb.reliabilityScore,
      fb.comment || '',
      fb.date
    );

    // Update target user's rating & read count
    const targetUser = this.getUserById(fb.toUserId);
    if (targetUser) {
      const avgScore = (fb.punctualityScore + fb.conditionScore + fb.behaviorScore + fb.reliabilityScore) / 4;
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

    return fb;
  },

  // ---- SETTINGS ----
  getBankCardInfo(): BankCardInfo {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('bank_card_info') as { value: string } | undefined;
    if (row && row.value) {
      try {
        return JSON.parse(row.value);
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
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('bank_card_info', JSON.stringify(info));
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
