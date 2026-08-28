export type UserStatus = 'approved' | 'pending' | 'suspended' | 'rejected';
export type UserRole = 'student' | 'admin';

export interface Medal {
  id: string;
  title: string;
  icon: string;
  description: string;
  color: string;
}

export interface User {
  id: string;
  name: string;
  className: string; // e.g., "۱۰ تجربی ۱"
  phone: string;
  avatar: string;
  status: UserStatus;
  role: UserRole;
  password?: string;
  rating: number; // 1-5
  ratingsCount: number;
  booksContributedCount: number;
  booksReadCount: number;
  medals: Medal[];
  joinedDate: string;
  suspensionReason?: string;
  rejectionReason?: string;
  activeLoanCount?: number;
  baleChatId?: number | string;
}

export interface BookReview {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userClass: string;
  rating: number;
  comment: string;
  date: string;
}

export type BookCondition = 'عالی (نو)' | 'خوب' | 'متوسط';
export type BookStatus = 'available' | 'requested' | 'borrowed';

export interface Book {
  id: string;
  title: string;
  author: string;
  ownerId: string;
  ownerName: string;
  ownerClass: string;
  ownerAvatar?: string;
  coverImage: string;
  category: string;
  condition: BookCondition;
  description: string;
  status: BookStatus;
  borrowerId?: string;
  borrowerName?: string;
  rating: number; // 1-5
  reviewsCount: number;
  reviews: BookReview[];
  addedDate: string;
  estimatedReturnDate?: string;
  isDamaged?: boolean;
  damageDescription?: string;
}

export interface BankCardInfo {
  cardNumber: string;
  cardHolderName: string;
  bankName: string;
}

export interface PaymentProof {
  trackingCode: string;
  paymentDate: string; // e.g., "1403/05/10 - 14:30"
  receiptImage?: string; // base64 or URL
  submittedAt: string;
  verifiedAt?: string;
  rejectionReason?: string;
}

export type RequestStatus =
  | 'pending'
  | 'accepted'
  | 'payment_pending'
  | 'payment_proof_submitted'
  | 'payment_completed'
  | 'handover_confirmed'
  | 'returned'
  | 'rejected';

export interface LendingRequest {
  id: string;
  bookId: string;
  bookTitle: string;
  bookCover: string;
  ownerId: string;
  ownerName: string;
  ownerClass: string;
  borrowerId: string;
  borrowerName: string;
  borrowerClass: string;
  borrowerPhone: string;
  status: RequestStatus;
  pickupLocation?: string;
  pickupTime?: string;
  pickupShift?: 'morning' | 'afternoon' | 'evening_home';
  handoverWindow?: string;
  handoverConfirmedAt?: string;
  handoverConfirmedByRole?: string;
  is12hGraceConfirmed?: boolean;
  createdAt: string;
  acceptedAt?: string;
  ownerFeedbackGiven?: boolean;
  borrowerFeedbackGiven?: boolean;
  // Financial & Extension properties
  feeAmount?: number; // 10000 Toman
  paymentStatus?: 'pending' | 'proof_submitted' | 'paid' | 'rejected';
  paymentDeadline?: string; // 3-hour window timestamp string
  paidAt?: string;
  paymentProof?: PaymentProof;
  dueDate?: string; // Estimated return date (7 days standard)
  extensionStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  extensionCount?: number; // 0 or 1
  extensionRequestedAt?: string;
  isDamagedReported?: boolean;
  damageNotes?: string;
  damagePhotoUrl?: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  grade: string;
  isExternal?: boolean;
}

export interface MutualFeedback {
  id: string;
  requestId: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  role: 'borrower_to_owner' | 'owner_to_borrower';
  punctualityScore: number; // 1-5
  conditionScore: number; // 1-5
  behaviorScore: number; // 1-5
  reliabilityScore: number; // 1-5
  comment: string;
  isConfidentialToAdmin?: boolean; // If true, comment is hidden from toUser, but visible to admin and fromUser
  isDamaged?: boolean;
  damageDescription?: string;
  damagePhotoUrl?: string;
  date: string;
}

export interface NewBookInput {
  title: string;
  author: string;
  category: string;
  condition: BookCondition;
  coverImage: string;
  description: string;
}

export interface RegistrationInput {
  name: string;
  className: string;
  phone: string;
  password: string;
  avatar: string;
  agreedToRules: boolean;
  initialBooks: NewBookInput[];
}

export interface SystemConfig {
  minBooksForRegistration: number;
  maxBooksForRegistration: number;
  requireAdminApproval: boolean;
  loanFeeAmount: number;
  loanDurationDays: number;
  paymentWindowHours: number;
  handoverWindowHours: number;
  supportPhone?: string;
  supportBaleId?: string;
  supportAdminName?: string;
  supportHours?: string;
  baleChannelUsername?: string;
  autoPublishBooksToBale?: boolean;
  websiteBaseUrl?: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'db';
  message: string;
  details?: string;
  userName?: string;
  userPhone?: string;
}
