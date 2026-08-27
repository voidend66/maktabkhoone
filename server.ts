import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import crypto from 'crypto';
import multer from 'multer';
import { dbService } from './server/db';
import { isAdminPhone } from './src/data/mockData';
import {
  User,
  Book,
  LendingRequest,
  SchoolClass,
  MutualFeedback,
  BankCardInfo,
  RegistrationInput,
  NewBookInput
} from './src/types';

// Load environment variables
dotenv.config();

/**
 * ============================================================================
 * تنظیمات و اطلاعات بات بله (Bale Messenger Bot Configuration)
 * ============================================================================
 */
const BALE_BOT_TOKEN =
  process.env.BALE_BOT_TOKEN ||
  '860811866:eyEm5PqS_XG11G6CpHAFb8kIzhd1lDygMXM';
const BOT_USERNAME = 'Maktabkunebot';
const BALE_API_BASE_URL = `https://tapi.bale.ai/bot${BALE_BOT_TOKEN}`;
const BALE_DEEP_LINK_BASE = `https://ble.ir/${BOT_USERNAME}`;

// Webhook URL
const DEFAULT_WEBHOOK_URL =
  process.env.BALE_WEBHOOK_URL ||
  (process.env.APP_URL ? `${process.env.APP_URL.replace(/\/$/, '')}/api/bale-webhook` : 'https://maktabkhune.ir/api/bale-webhook');

const SERVER_VERSION = '3.0.0';
const BUILD_DATE = '2026-08-26';
const PORT = Number(process.env.PORT) || 3000;

// Ensure upload directory exists
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer Storage Configuration (Strict image validation & Unique file naming)
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    let ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
      if (file.mimetype === 'image/png') ext = '.png';
      else if (file.mimetype === 'image/webp') ext = '.webp';
      else ext = '.jpg';
    }
    // Unique name using timestamp + random crypto bytes
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    cb(null, `img-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 Megabytes limit
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype.toLowerCase();

    const isMimeValid = ALLOWED_IMAGE_MIMES.includes(mime) || mime.startsWith('image/');
    const isExtValid = ALLOWED_IMAGE_EXTENSIONS.includes(ext) || ext === '';

    if (isMimeValid && isExtValid) {
      cb(null, true);
    } else {
      cb(new Error('فقط فایل‌های تصویری با فرمت‌های مجاز (JPG, JPEG, PNG, WEBP) قابل بارگذاری هستند.'));
    }
  }
});

/**
 * ساختار داده نشست احراز هویت OTP
 */
export interface OtpSession {
  sessionId: string;
  phoneNumber: string;
  originalPhone: string;
  otpCode: string;
  createdAt: number;
  expiresAt: number;
  chatId?: number | string;
  status:
    | 'PENDING_START'
    | 'STARTED'
    | 'CODE_SENT'
    | 'VERIFIED'
    | 'PHONE_MISMATCH'
    | 'EXPIRED';
  attempts: number;
  verifiedAt?: number;
}

const otpSessions = new Map<string, OtpSession>();
const chatToSessionMap = new Map<string | number, string>();

/**
 * تبدیل ارقام فارسی و عربی به انگلیسی
 */
export function toEnglishDigits(str: string): string {
  if (!str) return '';
  return str
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
}

/**
 * نرمال‌سازی شماره موبایل
 */
export function normalizePhoneNumber(phone: string): string | null {
  if (!phone) return null;
  let cleaned = toEnglishDigits(phone).replace(/[\s\-\(\)\+]/g, '');

  if (cleaned.startsWith('0098')) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('098')) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith('09')) {
    cleaned = '98' + cleaned.substring(1);
  } else if (cleaned.startsWith('9') && cleaned.length === 10) {
    cleaned = '98' + cleaned;
  }

  const iranMobileRegex = /^989\d{9}$/;
  if (iranMobileRegex.test(cleaned)) {
    return cleaned;
  }

  return null;
}

/**
 * تولید کد ۵ رقمی تصادفی امن
 */
export function generateOtpCode(): string {
  const randomNum = crypto.randomInt(10000, 100000);
  return randomNum.toString();
}

// Clean up expired sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of otpSessions.entries()) {
    if (session.expiresAt < now && session.status !== 'VERIFIED') {
      session.status = 'EXPIRED';
      if (now - session.createdAt > 10 * 60 * 1000) {
        if (session.chatId) {
          chatToSessionMap.delete(session.chatId);
        }
        otpSessions.delete(sessionId);
      }
    }
  }
}, 60 * 1000);

/**
 * کلاینت ارتباط با API پیام‌رسان بله
 */
async function callBaleApi(method: string, payload: Record<string, any> = {}) {
  const url = `${BALE_API_BASE_URL}/${method}`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return await response.json();
  } catch (error) {
    console.error(`[Bale API Error] Failed to call ${method}:`, error);
    return { ok: false, error };
  }
}

async function sendBaleMessage(
  chatId: number | string,
  text: string,
  replyMarkup?: Record<string, any>
) {
  return await callBaleApi('sendMessage', {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML',
    reply_markup: replyMarkup,
  });
}

export async function setBaleWebhook(webhookUrl: string) {
  console.log(`🌐 [Bale Webhook] در حال تنظیم Webhook روی آدرس: ${webhookUrl}`);
  const result = await callBaleApi('setWebhook', { url: webhookUrl });
  console.log('📌 [Bale Webhook Response]:', result);
  return result;
}

export async function getBaleWebhookInfo() {
  return await callBaleApi('getWebhookInfo');
}

/**
 * ذخیره و به‌روزرسانی شناسه چت مدیران برای دریافت اعلانات
 */
export function registerAdminBaleChatId(chatId: string | number) {
  try {
    const savedSetting = dbService.getSetting('admin_bale_chat_ids');
    let adminList: (string | number)[] = [];
    if (savedSetting) {
      try {
        adminList = JSON.parse(savedSetting);
      } catch (e) {}
    }
    if (!adminList.includes(chatId)) {
      adminList.push(chatId);
      dbService.setSetting('admin_bale_chat_ids', JSON.stringify(adminList));
    }
  } catch (err) {
    console.error('Error registering admin Bale chatId:', err);
  }
}

/**
 * ارسال اعلان هوشمند به مدیران در پیام‌رسان بله (همراه با دکمه‌های تایید / رد)
 */
export async function notifyAdminsOnBale(user: User) {
  try {
    const allUsers = dbService.getAllUsers();
    const adminChatIds = new Set<string | number>();

    // 1. مدیران ثبت‌شده در دیتابیس
    allUsers.forEach((u) => {
      if (u.role === 'admin' && u.baleChatId) {
        adminChatIds.add(u.baleChatId);
      }
    });

    // 2. چت‌آیدی‌های ذخیره‌شده از بله
    const savedSetting = dbService.getSetting('admin_bale_chat_ids');
    if (savedSetting) {
      try {
        const parsed = JSON.parse(savedSetting);
        if (Array.isArray(parsed)) {
          parsed.forEach((id) => adminChatIds.add(id));
        }
      } catch (e) {}
    }

    if (adminChatIds.size === 0) {
      console.log('⚠️ [Bale Notify] هیچ چت‌آیدی مدیری برای ارسال پیام ثبت نشده است.');
      return;
    }

    const statusBadge = user.status === 'approved' ? '✅ تایید شده' : '⏳ در انتظار تایید مدیر';
    const text =
      `🎒 <b>درخواست عضویت کاربر جدید در مکتب‌خانه</b>\n\n` +
      `👤 <b>نام و نام خانوادگی:</b> ${user.name}\n` +
      `🏫 <b>کلاس / پایه تحصیلی:</b> ${user.className}\n` +
      `📱 <b>شماره همراه:</b> <code>${user.phone}</code>\n` +
      `📚 <b>تعداد کتاب‌های اهدا/ثبت‌شده:</b> ${user.booksContributedCount} جلد\n` +
      `📌 <b>وضعیت حساب:</b> ${statusBadge}\n` +
      `📅 <b>تاریخ ثبت‌نام:</b> ${user.joinedDate}\n\n` +
      `آیا دسترسی این دانش‌آموز را جهت امانت گرفتن کتاب از مکتب‌خانه تایید می‌فرمایید؟`;

    const replyMarkup = {
      inline_keyboard: [
        [
          { text: '✅ تایید حساب کاربر', callback_data: `approve_user:${user.id}` },
          { text: '❌ رد عضویت کاربر', callback_data: `reject_user:${user.id}` },
        ],
      ],
    };

    for (const chatId of adminChatIds) {
      await sendBaleMessage(chatId, text, replyMarkup);
    }
  } catch (err) {
    console.error('Error notifying admins on Bale:', err);
  }
}

/**
 * ارسال پیام اعلان به کاربر در پیام‌رسان بله
 */
export async function notifyUserOnBale(userId: string, text: string) {
  try {
    const user = dbService.getUserById(userId);
    if (user && user.baleChatId) {
      await sendBaleMessage(user.baleChatId, text);
    }
  } catch (err) {
    console.error(`Error notifying user ${userId} on Bale:`, err);
  }
}

/**
 * پردازش کلیک روی دکمه‌های شیشه‌ای (Inline Keyboard) پیام‌رسان بله توسط مدیر
 */
export async function handleIncomingBaleCallbackQuery(callbackQuery: any) {
  try {
    const queryId = callbackQuery.id;
    const data = callbackQuery.data || '';
    const fromChatId = callbackQuery.message?.chat?.id || callbackQuery.from?.id;
    const messageId = callbackQuery.message?.message_id;

    if (fromChatId) {
      registerAdminBaleChatId(fromChatId);
    }

    if (data.startsWith('approve_user:') || data.startsWith('reject_user:')) {
      const isApprove = data.startsWith('approve_user:');
      const userId = data.split(':')[1];
      const targetUser = dbService.getUserById(userId);

      if (!targetUser) {
        await callBaleApi('answerCallbackQuery', {
          callback_query_id: queryId,
          text: '❌ کاربر مورد نظر در دیتابیس سامانه یافت نشد.',
          show_alert: true,
        });
        return;
      }

      const newStatus = isApprove ? 'approved' : 'rejected';
      const updatedUser = dbService.updateUser(userId, { status: newStatus });

      dbService.addSystemLog(
        'info',
        `تغییر وضعیت کاربر (${targetUser.name}) به ${newStatus === 'approved' ? 'تاییدشده' : 'ردشده'} از طریق پیام‌رسان بله`,
        `شناسه چت مدیر در بله: ${fromChatId}`
      );

      // 1. نمایش هشدار پاپ‌آپ روی صفحه مدیر در بله
      const alertMessage = isApprove
        ? `✅ حساب کاربر «${targetUser.name}» با موفقیت تایید شد.`
        : `❌ حساب کاربر «${targetUser.name}» رد شد.`;

      await callBaleApi('answerCallbackQuery', {
        callback_query_id: queryId,
        text: alertMessage,
        show_alert: true,
      });

      // 2. به‌روزرسانی متن پیام در چت مدیر با وضعیت جدید
      if (fromChatId && messageId) {
        const updatedText =
          `🎒 <b>نتیجه بررسی درخواست عضویت در مکتب‌خانه</b>\n\n` +
          `👤 <b>نام:</b> ${targetUser.name}\n` +
          `🏫 <b>کلاس:</b> ${targetUser.className}\n` +
          `📱 <b>تلفن:</b> <code>${targetUser.phone}</code>\n\n` +
          (isApprove
            ? `✅ <b>تایید شد:</b> دسترسی این کاربر توسط مدیر از طریق پیام‌رسان بله تایید شد.`
            : `❌ <b>رد شد:</b> عضویت این کاربر توسط مدیر رد گردید.`);

        await callBaleApi('editMessageText', {
          chat_id: fromChatId,
          message_id: messageId,
          text: updatedText,
          parse_mode: 'HTML',
        });
      }

      // 3. ارسال اعلان اطلاع‌رسانی مستقیم برای دانش‌آموز در بله
      if (targetUser && targetUser.baleChatId) {
        const userNotification = isApprove
          ? `🎉 <b>تبریک ${targetUser.name} عزیز!</b>\n\n` +
            `حساب کاربری شما در مکتب‌خانه توسط مدیر مدرسه تایید شد. اکنون می‌توانید کتاب‌های مورد علاقه خود را امانت بگیرید. 🎒📚`
          : `⚠️ <b>اطلاعیه مکتب‌خانه</b>\n\n` +
            `متأسفانه درخواست عضویت شما توسط مدیر مدرسه تایید نشد. جهت کسب اطلاعات بیشتر با مسئول کتابخانه مدرسه تماس بگیرید.`;

        await sendBaleMessage(targetUser.baleChatId, userNotification);
      }
    }
  } catch (err) {
    console.error('Error processing Bale Callback Query:', err);
  }
}

export async function handleIncomingBaleMessage(message: any) {
  const chatId = message.chat?.id || message.from?.id;
  if (!chatId) return;

  const text = (message.text || '').trim();

  // 1. /start
  if (text.startsWith('/start')) {
    const parts = text.split(/\s+/);
    const passedSessionId = parts.length > 1 ? parts[1].trim() : null;

    let targetSession: OtpSession | undefined;

    if (passedSessionId && otpSessions.has(passedSessionId)) {
      targetSession = otpSessions.get(passedSessionId);
    } else {
      const existingSessionId = chatToSessionMap.get(chatId);
      if (existingSessionId && otpSessions.has(existingSessionId)) {
        targetSession = otpSessions.get(existingSessionId);
      }
    }

    if (targetSession && targetSession.expiresAt > Date.now()) {
      targetSession.chatId = chatId;
      targetSession.status = 'STARTED';
      chatToSessionMap.set(chatId, targetSession.sessionId);

      const welcomeText =
        `👋 <b>سلام به سامانه امانت کتاب «مکتب‌خونه» خوش آمدید!</b> 🎒\n\n` +
        `🔐 شما درخواست دریافت کد تایید برای شماره <code>${targetSession.originalPhone}</code> را ثبت کرده‌اید.\n\n` +
        `📲 جهت تایید هویت و دریافت کد ۵ رقمی، لطفاً روی دکمه زیر (<b>ارسال شماره همراه من</b>) کلیک کنید:`;

      await sendBaleMessage(chatId, welcomeText, {
        keyboard: [
          [
            {
              text: '📲 ارسال شماره همراه من',
              request_contact: true,
            },
          ],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      });
      return;
    } else {
      const notFoundText =
        `👋 <b>سلام! به ربات اطلاع‌رسانی و مدیریت «مکتب‌خونه» خوش آمدید!</b> 🎒\n\n` +
        `📱 جهت تایید شماره همراه یا اتصال این چت به حساب کاربری/مدیریت خود، لطفاً روی دکمه زیر کلیک کنید:`;

      await sendBaleMessage(chatId, notFoundText, {
        keyboard: [
          [
            {
              text: '📲 ارسال شماره همراه من جهت اتصال حساب',
              request_contact: true,
            },
          ],
        ],
        resize_keyboard: true,
      });
      return;
    }
  }

  // 2. Contact object received
  if (message.contact) {
    const contact = message.contact;
    const rawContactPhone = contact.phone_number || '';
    const normalizedContactPhone = normalizePhoneNumber(rawContactPhone);

    // Save baleChatId to User in Database if user exists
    if (normalizedContactPhone) {
      const existingUser = dbService.getUserByPhone(normalizedContactPhone);
      if (existingUser) {
        dbService.updateUser(existingUser.id, { baleChatId: chatId });
        if (isAdminPhone(normalizedContactPhone) || existingUser.role === 'admin') {
          registerAdminBaleChatId(chatId);
          await sendBaleMessage(
            chatId,
            `👑 <b>مدیر محترم مکتب‌خانه خوش آمدید!</b>\n\n` +
            `چت بله شما به عنوان شناسه مدیریت سامانه ثبت گردید. از این پس کلیه اعلانات ثبت‌نام دانش‌آموزان و دکمه‌های تایید/رد مستقیم به همین چت ارسال می‌شود. 🎒✨`
          );
        }
      } else if (isAdminPhone(normalizedContactPhone)) {
        registerAdminBaleChatId(chatId);
        await sendBaleMessage(
          chatId,
          `👑 <b>مدیر محترم مکتب‌خانه خوش آمدید!</b>\n\n` +
          `چت بله شما به عنوان شناسه مدیریت سامانه ثبت گردید.`
        );
      }
    }

    const activeSessionId = chatToSessionMap.get(chatId);
    const session = activeSessionId ? otpSessions.get(activeSessionId) : null;

    if (session && session.expiresAt > Date.now()) {
      if (
        normalizedContactPhone &&
        normalizedContactPhone === session.phoneNumber
      ) {
        session.status = 'CODE_SENT';

        const successOtpText =
          `✅ <b>شماره تلفن شما با موفقیت تایید شد!</b>\n\n` +
          `🎒 <b>کد تایید ۵ رقمی مکتب‌خونه:</b>\n` +
          `🔢 <code>${session.otpCode}</code>\n\n` +
          `⏱ این کد به مدت <b>۵ دقیقه</b> معتبر است.\n` +
          `لطفاً این کد را در فرم تایید سایت مکتب‌خونه وارد فرمایید.`;

        await sendBaleMessage(chatId, successOtpText, {
          remove_keyboard: true,
        });
        return;
      } else {
        session.status = 'PHONE_MISMATCH';

        const mismatchText =
          `❌ <b>عدم تطابق شماره همراه!</b>\n\n` +
          `شماره حساب بله شما (<code>${rawContactPhone}</code>) با شماره وارد شده در سایت (<code>${session.originalPhone}</code>) مطابقت ندارد.`;

        await sendBaleMessage(chatId, mismatchText, {
          remove_keyboard: true,
        });
        return;
      }
    } else {
      await sendBaleMessage(
        chatId,
        `✅ <b>حساب بله شما با موفقیت به سامانه مکتب‌خانه متصل شد!</b>\n\n` +
        `اکنون اعلانات مربوط به امانت کتاب، تایید حساب و اعلانات مدیر برای شما ارسال خواهد شد. 📚✨`
      );
      return;
    }
  }

  // 3. Fallback message
  const helpText =
    `🎒 <b>بات اطلاع‌رسانی و مدیریت «مکتب‌خونه»</b>\n\n` +
    `برای ورود یا ثبت‌نام، شماره همراه خود را در سایت وارد کرده و وارد بله شوید.`;

  await sendBaleMessage(chatId, helpText);
}

/**
 * ============================================================================
 * راه‌اندازی سرور Express و مسیرهای API
 * ============================================================================
 */
async function startServer() {
  const app = express();

  // CORS
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    if (_req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Body parsers
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Static serving for uploaded files on disk
  app.use('/uploads', express.static(UPLOADS_DIR, {
    maxAge: '7d',
    setHeaders: (res) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  }));

  // Direct route for uploads to ensure cross-server compatibility
  app.get('/uploads/:filename', (req: Request, res: Response): any => {
    const safeName = path.basename(req.params.filename);
    const filePath = path.join(UPLOADS_DIR, safeName);
    if (fs.existsSync(filePath)) {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=604800');
      return res.sendFile(filePath);
    }
    return res.status(404).json({ error: 'File not found' });
  });

  /**
   * --------------------------------------------------------------------------
   * API: آپلود مستقیم فایل تصویر بر روی سرور و بازگرداندن URL واقعی
   * با بررسی دقیق فرمت فایل، محدودیت حجم ۱۰ مگابایت و نامگذاری امن
   * --------------------------------------------------------------------------
   */
  app.post('/api/upload', (req: Request, res: Response): any => {
    upload.single('file')(req, res, (err: any) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              message: 'حجم فایل عکس بیش از حد مجاز (حداکثر ۱۰ مگابایت) است.'
            });
          }
          return res.status(400).json({
            success: false,
            message: `خطای بارگذاری فایل: ${err.message}`
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message || 'فقط فرمت‌های تصویری معتبر (JPG, JPEG, PNG, WEBP) مجاز هستند.'
        });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'هیچ فایل تصویری ارسال نشده است.' });
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      return res.json({
        success: true,
        message: 'تصویر با موفقیت روی سرور ذخیره شد.',
        fileUrl,
        filename: req.file.filename,
        size: req.file.size
      });
    });
  });

  /**
   * --------------------------------------------------------------------------
   * API: دریافت کل اطلاعات اولیه از دیتابیس SQLite (Bootstrap)
   * --------------------------------------------------------------------------
   */
  app.get('/api/bootstrap', (_req: Request, res: Response) => {
    try {
      const data = dbService.getBootstrapData();
      res.json({ success: true, data });
    } catch (err: any) {
      console.error('Bootstrap error:', err);
      res.status(500).json({ success: false, message: 'خطا در خواندن داده‌ها از دیتابیس' });
    }
  });

  /**
   * --------------------------------------------------------------------------
   * Webhook API: دریافت آپدیت‌های ارسالی از پیام‌رسان بله
   * --------------------------------------------------------------------------
   */
  app.post('/api/bale-webhook', async (req: Request, res: Response): Promise<void> => {
    res.status(200).json({ ok: true });
    try {
      const update = req.body;
      if (!update) return;

      if (update.message) {
        await handleIncomingBaleMessage(update.message);
      } else if (update.edited_message) {
        await handleIncomingBaleMessage(update.edited_message);
      } else if (update.callback_query) {
        await handleIncomingBaleCallbackQuery(update.callback_query);
      }
    } catch (err) {
      console.error('[Webhook Processing Error]:', err);
    }
  });

  /**
   * --------------------------------------------------------------------------
   * API: ثبت درخواست کد تایید OTP
   * --------------------------------------------------------------------------
   */
  app.post('/api/request-otp', (req: Request, res: Response): any => {
    try {
      const { phone } = req.body || {};

      if (!phone || typeof phone !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'لطفاً شماره تلفن همراه معتبر وارد کنید.',
        });
      }

      const normalized = normalizePhoneNumber(phone);
      if (!normalized) {
        return res.status(400).json({
          success: false,
          message: 'فرمت شماره تلفن همراه نامعتبر است. نمونه صحیح: 09123456789',
        });
      }

      const sessionId = crypto.randomBytes(12).toString('hex');
      const otpCode = generateOtpCode();
      const now = Date.now();
      const expiresAt = now + 5 * 60 * 1000;

      const session: OtpSession = {
        sessionId,
        phoneNumber: normalized,
        originalPhone: phone.trim(),
        otpCode,
        createdAt: now,
        expiresAt,
        status: 'PENDING_START',
        attempts: 0,
      };

      otpSessions.set(sessionId, session);

      const baleLink = `${BALE_DEEP_LINK_BASE}?start=${sessionId}`;
      const baleWebLink = `https://web.bale.ai/#/im?p=@${BOT_USERNAME}&start=${sessionId}`;

      return res.json({
        success: true,
        session_id: sessionId,
        phone: session.originalPhone,
        normalized_phone: normalized,
        bale_link: baleLink,
        bale_web_link: baleWebLink,
        bot_username: BOT_USERNAME,
        expires_in: 300,
        message: 'درخواست با موفقیت ثبت شد. لطفاً وارد ربات بله شوید و شماره خود را ارسال کنید.',
      });
    } catch (error) {
      console.error('Error in /api/request-otp:', error);
      return res.status(500).json({
        success: false,
        message: 'خطای سرور در ثبت درخواست کد تایید.',
      });
    }
  });

  /**
   * --------------------------------------------------------------------------
   * API: تایید کد OTP
   * --------------------------------------------------------------------------
   */
  app.post('/api/verify-otp', (req: Request, res: Response): any => {
    try {
      const { session_id, user_otp } = req.body || {};

      if (!session_id || !user_otp) {
        return res.status(400).json({
          success: false,
          message: 'شناسه نشست و کد تایید ۵ رقمی الزامی است.',
        });
      }

      const session = otpSessions.get(session_id);

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'نشست احراز هویت یافت نشد یا منقضی شده است.',
        });
      }

      if (Date.now() > session.expiresAt) {
        session.status = 'EXPIRED';
        return res.status(400).json({
          success: false,
          message: 'کد تایید منقضی شده است (مهلت ۵ دقیقه به پایان رسیده است).',
        });
      }

      session.attempts += 1;
      if (session.attempts > 5) {
        otpSessions.delete(session_id);
        return res.status(429).json({
          success: false,
          message: 'تعداد دفعات ورود اشتباه بیش از حد مجاز بود. لطفاً مجدداً درخواست ارسال کنید.',
        });
      }

      const cleanUserOtp = toEnglishDigits(String(user_otp)).trim();

      if (cleanUserOtp !== session.otpCode) {
        return res.status(400).json({
          success: false,
          message: 'کد تایید وارد شده نادرست است. لطفاً مجدداً بررسی فرمایید.',
        });
      }

      session.status = 'VERIFIED';
      session.verifiedAt = Date.now();

      const authToken = crypto
        .createHmac('sha256', 'maktabkhaneh_secret_key')
        .update(`${session.phoneNumber}_${session.verifiedAt}`)
        .digest('hex');

      return res.json({
        success: true,
        message: 'احراز هویت با موفقیت انجام شد.',
        phone: session.originalPhone,
        normalized_phone: session.phoneNumber,
        token: authToken,
        verified_at: new Date(session.verifiedAt).toISOString(),
      });
    } catch (error) {
      console.error('Error in /api/verify-otp:', error);
      return res.status(500).json({
        success: false,
        message: 'خطای سرور در اعتبارسنجی کد تایید.',
      });
    }
  });

  /**
   * --------------------------------------------------------------------------
   * API: وضعیت لحظه‌ای نشست OTP
   * --------------------------------------------------------------------------
   */
  app.get('/api/otp-status/:sessionId', (req: Request, res: Response): any => {
    const { sessionId } = req.params;
    const session = otpSessions.get(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        status: 'EXPIRED',
        message: 'نشست یافت نشد یا منقضی شده است.',
      });
    }

    const isExpired = Date.now() > session.expiresAt;
    const currentStatus = isExpired ? 'EXPIRED' : session.status;

    return res.json({
      success: true,
      sessionId: session.sessionId,
      status: currentStatus,
      is_expired: isExpired,
      expires_in: Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000)),
      phone: session.originalPhone,
    });
  });

  /**
   * --------------------------------------------------------------------------
   * API: ورود و لاگین با کد بله (ذخیره یا خواندن مستقیم از SQLite)
   * --------------------------------------------------------------------------
   */
  app.post('/api/auth/bale-login', (req: Request, res: Response): any => {
    try {
      const { phone } = req.body || {};
      if (!phone) {
        return res.status(400).json({ success: false, message: 'شماره تلفن الزامی است.' });
      }

      const isSystemAdmin = isAdminPhone(phone);
      let user = dbService.getUserByPhone(phone);

      if (user) {
        if (isSystemAdmin && (user.role !== 'admin' || user.status !== 'approved')) {
          user = dbService.updateUser(user.id, { role: 'admin', status: 'approved' })!;
        }
        return res.json({
          success: true,
          message: isSystemAdmin ? 'خوش آمدید مدیر گرامی! دسترسی مدیریت فعال گردید.' : `خوش آمدید ${user.name}`,
          user
        });
      }

      const sysConfig = dbService.getSystemConfig();
      // Create new user in SQLite
      const newUser: User = {
        id: isSystemAdmin ? `u_admin_${Date.now()}` : `u_bale_${Date.now()}`,
        name: isSystemAdmin ? 'مدیر سامانه مکتب‌خانه' : `کاربر بله (${phone.slice(-4)})`,
        phone: phone.trim(),
        className: isSystemAdmin ? 'مدیریت کتابخانه' : 'کلاس ۱/۱',
        role: isSystemAdmin ? 'admin' : 'student',
        rating: 5,
        ratingsCount: 1,
        booksContributedCount: 0,
        booksReadCount: 0,
        medals: isSystemAdmin ? [
          {
            id: 'm_admin_crown',
            title: 'راهبر کتابخانه',
            icon: '👑',
            description: 'مدیریت و سرپرستی کتابخانه مکتب‌خانه',
            color: 'bg-amber-100 text-amber-800 border-amber-300'
          }
        ] : [],
        joinedDate: new Date().toLocaleDateString('fa-IR'),
        avatar: isSystemAdmin
          ? 'https://api.dicebear.com/7.x/bottts/svg?seed=AdminCrown'
          : 'https://api.dicebear.com/7.x/bottts/svg?seed=Student',
        status: isSystemAdmin ? 'approved' : (sysConfig.requireAdminApproval ? 'pending' : 'approved')
      };

      const savedUser = dbService.createUser(newUser);
      dbService.addSystemLog(
        'info',
        `ایجاد حساب کاربر بله جدید (${savedUser.name}) - شماره: ${phone}`,
        `وضعیت: ${savedUser.status}`
      );
      return res.json({
        success: true,
        message: isSystemAdmin
          ? `خوش آمدید مدیر گرامی! حساب مدیریت با شماره ${phone} با موفقیت فعال شد.`
          : `حساب شما با شماره ${phone} با موفقیت ایجاد شد.`,
        user: savedUser
      });
    } catch (err: any) {
      console.error('Bale Login Error:', err);
      return res.status(500).json({ success: false, message: 'خطا در ورود با بله' });
    }
  });

  /**
   * --------------------------------------------------------------------------
   * API: لاگین با رمز عبور و شماره تلفن
   * --------------------------------------------------------------------------
   */
  app.post('/api/auth/login', (req: Request, res: Response): any => {
    try {
      const { phone, password } = req.body || {};
      if (!phone || !password) {
        return res.status(400).json({ success: false, message: 'شماره تلفن و رمز عبور الزامی است.' });
      }

      const isSystemAdmin = isAdminPhone(phone);
      let user = dbService.getUserByPhone(phone);

      if (!user) {
        if (isSystemAdmin) {
          const newAdmin: User = {
            id: `u_admin_${Date.now()}`,
            name: 'مدیر سامانه مکتب‌خانه',
            phone: phone.trim(),
            className: 'مدیریت کتابخانه',
            role: 'admin',
            password: password,
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
            avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=AdminCrown',
            status: 'approved'
          };
          const savedAdmin = dbService.createUser(newAdmin);
          return res.json({ success: true, message: 'خوش آمدید مدیر گرامی! حساب مدیریت شما فعال شد.', user: savedAdmin });
        }
        return res.status(404).json({ success: false, message: 'کاربری با این شماره تلفن یافت نشد.' });
      }

      if (user.password && user.password !== password) {
        return res.status(400).json({ success: false, message: 'رمز عبور وارد شده نادرست است.' });
      }

      if (isSystemAdmin && (user.role !== 'admin' || user.status !== 'approved')) {
        user = dbService.updateUser(user.id, { role: 'admin', status: 'approved' })!;
      }

      return res.json({ success: true, message: `خوش آمدید ${user.name}`, user });
    } catch (err: any) {
      console.error('Login Error:', err);
      return res.status(500).json({ success: false, message: 'خطای سرور در احراز هویت.' });
    }
  });

  /**
   * --------------------------------------------------------------------------
   * API: ثبت‌نام کامل دانش‌آموز به همراه کتاب‌های اولیه
   * --------------------------------------------------------------------------
   */
  app.post('/api/auth/register', (req: Request, res: Response): any => {
    try {
      const data = req.body as RegistrationInput;
      if (!data || !data.phone || !data.name) {
        return res.status(400).json({ success: false, message: 'اطلاعات نام و شماره تلفن الزامی است.' });
      }

      const existing = dbService.getUserByPhone(data.phone);
      if (existing) {
        return res.status(400).json({ success: false, message: 'این شماره تلفن قبلاً در سامانه ثبت شده است.' });
      }

      const isAdmin = isAdminPhone(data.phone);
      const sysConfig = dbService.getSystemConfig();
      const minRequired = sysConfig.minBooksForRegistration ?? 3;
      if (!isAdmin && (!data.initialBooks || data.initialBooks.length < minRequired)) {
        return res.status(400).json({
          success: false,
          message: `جهت تکمیل ثبت‌نام، باید حداقل ${minRequired} جلد کتاب جهت اشتراک‌گذاری معرفی کنید.`
        });
      }

      const newUserId = `u_${Date.now()}`;
      const newUser: User = {
        id: newUserId,
        name: data.name.trim(),
        className: isAdmin ? 'مدیریت سامانه مکتب‌خانه' : data.className,
        phone: data.phone.trim(),
        avatar: data.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=Student',
        status: isAdmin ? 'approved' : (sysConfig.requireAdminApproval ? 'pending' : 'approved'),
        role: isAdmin ? 'admin' : 'student',
        password: data.password,
        rating: 5.0,
        ratingsCount: 0,
        booksContributedCount: (data.initialBooks || []).length,
        booksReadCount: 0,
        medals: isAdmin ? [
          {
            id: 'm_admin_crown',
            title: 'راهبر کتابخانه',
            icon: '👑',
            description: 'مدیریت و سرپرستی کتابخانه مکتب‌خانه',
            color: 'bg-amber-100 text-amber-800 border-amber-300'
          }
        ] : [
          {
            id: 'm_starter',
            title: 'عضو جدید کتابخانه',
            icon: '🌱',
            description: `ثبت‌نام و مشارکت ${minRequired} کتاب در گنجینه مکتب‌خانه`,
            color: 'bg-emerald-100 text-emerald-800 border-emerald-300'
          }
        ],
        joinedDate: new Date().toLocaleDateString('fa-IR')
      };

      dbService.createUser(newUser);

      // Add initial books
      if (data.initialBooks && data.initialBooks.length > 0) {
        data.initialBooks.forEach((b, index) => {
          const book: Book = {
            id: `b_${Date.now()}_${index}`,
            title: b.title,
            author: b.author,
            ownerId: newUserId,
            ownerName: data.name,
            ownerClass: newUser.className,
            ownerAvatar: newUser.avatar,
            coverImage: b.coverImage || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 560" width="400" height="560"><rect width="400" height="560" fill="%231e1b4b"/><text x="200" y="280" font-size="24" fill="%23ffffff" text-anchor="middle" font-family="sans-serif">مکتب‌خانه</text></svg>',
            category: b.category,
            condition: b.condition,
            description: b.description || 'معرفی شده توسط کاربر هنگام ثبت‌نام اولیه',
            status: 'available',
            rating: 5.0,
            reviewsCount: 0,
            reviews: [],
            addedDate: new Date().toLocaleDateString('fa-IR')
          };
          dbService.createBook(book);
        });
      }

      // Notify admins on Bale Bot about new registration
      if (!isAdmin) {
        notifyAdminsOnBale(newUser);
      }

      return res.json({
        success: true,
        message: isAdmin
          ? 'حساب مدیریت شما با موفقیت ایجاد و فعال شد!'
          : 'ثبت‌نام شما با موفقیت انجام شد! حساب شما پس از بررسی و تایید توسط مسئول کتابخانه فعال خواهد شد.',
        user: newUser
      });
    } catch (err: any) {
      console.error('Register Error:', err);
      return res.status(500).json({ success: false, message: 'خطا در ثبت‌نام کاربر.' });
    }
  });

  /**
   * --------------------------------------------------------------------------
   * API: کاربران (Users)
   * --------------------------------------------------------------------------
   */
  app.get('/api/users', (_req: Request, res: Response) => {
    res.json({ success: true, users: dbService.getAllUsers() });
  });

  app.put('/api/users/:id', (req: Request, res: Response): any => {
    try {
      const { name, className, avatar, password } = req.body || {};
      const updates: Partial<User> = {};
      if (name) updates.name = name;
      if (className) updates.className = className;
      if (avatar) updates.avatar = avatar;
      if (password) updates.password = password;

      const user = dbService.updateUser(req.params.id, updates);
      if (!user) return res.status(404).json({ success: false, message: 'کاربر یافت نشد.' });

      // Notify admins if user completed their profile
      if (user.role !== 'admin' && user.status === 'pending') {
        notifyAdminsOnBale(user);
      }

      res.json({ success: true, user });
    } catch (err: any) {
      console.error('Update User Error:', err);
      res.status(500).json({ success: false, message: 'خطا در به‌روزرسانی اطلاعات کاربر.' });
    }
  });

  app.post('/api/users/:id/approve', (req: Request, res: Response): any => {
    const user = dbService.updateUser(req.params.id, { status: 'approved' });
    if (!user) return res.status(404).json({ success: false, message: 'کاربر یافت نشد.' });
    
    // Notify user on Bale
    notifyUserOnBale(user.id, `🎉 <b>تبریک ${user.name} عزیز!</b>\n\nحساب کاربری شما در مکتب‌خانه توسط مدیر مدرسه تایید شد. اکنون می‌توانید از گنجینه کتابخانه استفاده فرمایید. 🎒📚`);

    res.json({ success: true, user });
  });

  app.post('/api/users/:id/reject', (req: Request, res: Response): any => {
    const user = dbService.updateUser(req.params.id, { status: 'rejected' });
    if (!user) return res.status(404).json({ success: false, message: 'کاربر یافت نشد.' });

    // Notify user on Bale
    notifyUserOnBale(user.id, `⚠️ <b>اطلاعیه مکتب‌خانه</b>\n\nمتأسفانه درخواست عضویت شما توسط مدیر مدرسه تایید نشد.`);

    res.json({ success: true, user });
  });

  app.post('/api/users/:id/suspend', (req: Request, res: Response): any => {
    const { reason } = req.body;
    const user = dbService.updateUser(req.params.id, {
      status: 'suspended',
      suspensionReason: reason || 'تخلف در رعایت قوانین امانت کتاب'
    });
    if (!user) return res.status(404).json({ success: false, message: 'کاربر یافت نشد.' });
    res.json({ success: true, user });
  });

  app.delete('/api/users/:id', (req: Request, res: Response): any => {
    try {
      const { id } = req.params;
      const user = dbService.getUserById(id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'کاربر مورد نظر یافت نشد.' });
      }

      // Safeguard: Prevent deleting the main system admin
      if (isAdminPhone(user.phone) || user.role === 'admin') {
        return res.status(403).json({ success: false, message: 'امکان حذف حساب کاربری مدیر اصلی سامانه وجود ندارد.' });
      }

      const deleted = dbService.deleteUser(id);
      if (!deleted) {
        return res.status(500).json({ success: false, message: 'خطا در حذف کاربر از دیتابیس.' });
      }

      res.json({ success: true, message: 'حساب کاربری و اطلاعات مرتبط با موفقیت حذف شد.' });
    } catch (err: any) {
      console.error('Delete User Error:', err);
      res.status(500).json({ success: false, message: 'خطای سرور در فرآیند حذف حساب کاربری.' });
    }
  });

  /**
   * --------------------------------------------------------------------------
   * API: کتاب‌ها (Books)
   * --------------------------------------------------------------------------
   */
  app.get('/api/books', (_req: Request, res: Response) => {
    res.json({ success: true, books: dbService.getAllBooks() });
  });

  app.post('/api/books', (req: Request, res: Response): any => {
    try {
      const bookData = req.body as Book;
      if (!bookData || !bookData.title || !bookData.author || !bookData.ownerId) {
        return res.status(400).json({ success: false, message: 'اطلاعات کامل کتاب الزامی است.' });
      }

      const bookId = bookData.id || `b_${Date.now()}`;
      const newBook: Book = {
        ...bookData,
        id: bookId,
        addedDate: bookData.addedDate || new Date().toLocaleDateString('fa-IR'),
        status: 'available',
        rating: 5.0,
        reviewsCount: 0,
        reviews: []
      };

      const created = dbService.createBook(newBook);
      res.json({ success: true, book: created });
    } catch (err: any) {
      console.error('Create Book Error:', err);
      res.status(500).json({ success: false, message: 'خطا در ثبت کتاب.' });
    }
  });

  app.put('/api/books/:id', (req: Request, res: Response): any => {
    const updated = dbService.updateBook(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'کتاب یافت نشد.' });
    res.json({ success: true, book: updated });
  });

  app.delete('/api/books/:id', (req: Request, res: Response): any => {
    const success = dbService.deleteBook(req.params.id);
    res.json({ success });
  });

  app.post('/api/books/:id/review', (req: Request, res: Response): any => {
    const { review } = req.body;
    if (!review) return res.status(400).json({ success: false, message: 'نظر الزامی است.' });
    const updated = dbService.addBookReview(req.params.id, review);
    if (!updated) return res.status(404).json({ success: false, message: 'کتاب یافت نشد.' });
    res.json({ success: true, book: updated });
  });

  /**
   * --------------------------------------------------------------------------
   * API: درخواست‌های امانت (Lending Requests)
   * --------------------------------------------------------------------------
   */
  app.get('/api/requests', (_req: Request, res: Response) => {
    res.json({ success: true, requests: dbService.getAllRequests() });
  });

  app.post('/api/requests', (req: Request, res: Response): any => {
    try {
      const { bookId, borrowerId } = req.body;
      const book = dbService.getBookById(bookId);
      const borrower = dbService.getUserById(borrowerId);

      if (!book || !borrower) {
        return res.status(404).json({ success: false, message: 'کتاب یا کاربر متقاضی یافت نشد.' });
      }

      if (book.ownerId === borrower.id) {
        return res.status(400).json({ success: false, message: 'شما مالک این کتاب هستید و نمی‌توانید آن را از خود به امانت بگیرید.' });
      }

      const reqId = `req_${Date.now()}`;
      const newReq: LendingRequest = {
        id: reqId,
        bookId: book.id,
        bookTitle: book.title,
        bookCover: book.coverImage,
        ownerId: book.ownerId,
        ownerName: book.ownerName,
        ownerClass: book.ownerClass,
        borrowerId: borrower.id,
        borrowerName: borrower.name,
        borrowerClass: borrower.className,
        borrowerPhone: borrower.phone,
        status: 'pending',
        createdAt: new Date().toLocaleDateString('fa-IR'),
        feeAmount: 10000,
        paymentStatus: 'pending'
      };

      const created = dbService.createRequest(newReq);

      // Notify book owner on Bale
      notifyUserOnBale(
        book.ownerId,
        `📚 <b>درخواست امانت کتاب جدید!</b>\n\n` +
        `دانش‌آموز <b>${borrower.name}</b> (کلاس ${borrower.className}) درخواست امانت کتاب <b>«${book.title}»</b> شما را ثبت نمود.`
      );

      res.json({ success: true, request: created });
    } catch (err: any) {
      console.error('Create Request Error:', err);
      res.status(500).json({ success: false, message: 'خطا در ثبت درخواست امانت.' });
    }
  });

  app.post('/api/requests/:id/accept', (req: Request, res: Response): any => {
    const { pickupLocation, pickupTime, pickupShift } = req.body;
    const now = Date.now();
    const deadline = new Date(now + 3 * 60 * 60 * 1000).toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const updated = dbService.updateRequest(req.params.id, {
      status: 'payment_pending',
      pickupLocation,
      pickupTime,
      pickupShift,
      acceptedAt: new Date().toLocaleDateString('fa-IR'),
      paymentStatus: 'pending',
      paymentDeadline: `ساعت ${deadline} (مهلت ۳ ساعته)`
    });

    if (!updated) return res.status(404).json({ success: false, message: 'درخواست یافت نشد.' });

    // Notify borrower on Bale
    notifyUserOnBale(
      updated.borrowerId,
      `✅ <b>درخواست امانت پذیرفته شد!</b>\n\n` +
      `مالک کتاب <b>«${updated.bookTitle}»</b> درخواست امانت شما را پذیرفت.\n` +
      `📍 <b>مکان تحویل:</b> ${pickupLocation || 'مدرسه'}\n` +
      `⏰ <b>زمان تحویل:</b> ${pickupTime || 'ساعات تفریح'}`
    );

    res.json({ success: true, request: updated });
  });

  app.post('/api/requests/:id/reject', (req: Request, res: Response): any => {
    const reqItem = dbService.getRequestById(req.params.id);
    if (reqItem) {
      dbService.updateBook(reqItem.bookId, { status: 'available' });
    }
    const updated = dbService.updateRequest(req.params.id, { status: 'rejected' });

    if (updated) {
      notifyUserOnBale(
        updated.borrowerId,
        `❌ <b>درخواست امانت رد شد</b>\n\nدرخواست امانت کتاب <b>«${updated.bookTitle}»</b> پذیرفته نشد.`
      );
    }

    res.json({ success: true, request: updated });
  });

  app.post('/api/requests/:id/payment-proof', (req: Request, res: Response): any => {
    const { trackingCode, paymentDate, receiptImage } = req.body;
    const updated = dbService.updateRequest(req.params.id, {
      status: 'payment_proof_submitted',
      paymentStatus: 'proof_submitted',
      paymentProof: {
        trackingCode,
        paymentDate,
        receiptImage,
        submittedAt: new Date().toLocaleDateString('fa-IR') + ' - ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
      }
    });
    if (!updated) return res.status(404).json({ success: false, message: 'درخواست یافت نشد.' });
    res.json({ success: true, request: updated });
  });

  app.post('/api/requests/:id/approve-payment', (req: Request, res: Response): any => {
    const reqItem = dbService.getRequestById(req.params.id);
    if (!reqItem) return res.status(404).json({ success: false, message: 'درخواست یافت نشد.' });

    const updated = dbService.updateRequest(req.params.id, {
      status: 'payment_completed',
      paymentStatus: 'paid',
      paidAt: new Date().toLocaleDateString('fa-IR')
    });
    res.json({ success: true, request: updated });
  });

  app.post('/api/requests/:id/handover', (req: Request, res: Response): any => {
    const { role } = req.body; // 'borrower' or 'owner'
    const reqItem = dbService.getRequestById(req.params.id);
    if (!reqItem) return res.status(404).json({ success: false, message: 'درخواست یافت نشد.' });

    const now = new Date();
    const returnDueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('fa-IR');

    dbService.updateBook(reqItem.bookId, {
      status: 'borrowed',
      borrowerId: reqItem.borrowerId,
      borrowerName: reqItem.borrowerName,
      estimatedReturnDate: returnDueDate
    });

    const updated = dbService.updateRequest(req.params.id, {
      status: 'handover_confirmed',
      handoverConfirmedAt: now.toLocaleDateString('fa-IR') + ' ساعت ' + now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      handoverConfirmedByRole: role || 'borrower',
      is12hGraceConfirmed: true,
      dueDate: returnDueDate
    });

    res.json({ success: true, request: updated });
  });

  app.post('/api/requests/:id/return-and-feedback', (req: Request, res: Response): any => {
    const { feedback } = req.body;
    const reqItem = dbService.getRequestById(req.params.id);
    if (!reqItem) return res.status(404).json({ success: false, message: 'درخواست یافت نشد.' });

    // Mark book as available again
    dbService.updateBook(reqItem.bookId, {
      status: 'available',
      borrowerId: undefined,
      borrowerName: undefined,
      estimatedReturnDate: undefined
    });

    // Record feedback if provided
    if (feedback) {
      dbService.createFeedback(feedback);
    }

    const updated = dbService.updateRequest(req.params.id, {
      status: 'returned',
      borrowerFeedbackGiven: true
    });

    res.json({ success: true, request: updated });
  });

  app.post('/api/requests/:id/report-damage', (req: Request, res: Response): any => {
    const { borrowerId, damageReason } = req.body;
    const reqItem = dbService.getRequestById(req.params.id);
    if (!reqItem) return res.status(404).json({ success: false, message: 'درخواست یافت نشد.' });

    dbService.updateBook(reqItem.bookId, {
      isDamaged: true,
      damageDescription: damageReason
    });

    dbService.updateUser(borrowerId, {
      status: 'suspended',
      suspensionReason: `خسارت به کتاب «${reqItem.bookTitle}»: ${damageReason}`
    });

    const updated = dbService.updateRequest(req.params.id, {
      isDamagedReported: true,
      damageNotes: damageReason
    });

    res.json({ success: true, request: updated });
  });

  /**
   * --------------------------------------------------------------------------
   * API: کلاس‌ها (School Classes)
   * --------------------------------------------------------------------------
   */
  app.get('/api/classes', (_req: Request, res: Response) => {
    res.json({ success: true, classes: dbService.getAllClasses() });
  });

  app.post('/api/classes', (req: Request, res: Response): any => {
    const { name, grade, isExternal } = req.body;
    if (!name || !grade) return res.status(400).json({ success: false, message: 'نام و پایه کلاس الزامی است.' });
    const newClass: SchoolClass = {
      id: `c_${Date.now()}`,
      name,
      grade,
      isExternal: Boolean(isExternal)
    };
    const created = dbService.createClass(newClass);
    res.json({ success: true, class: created });
  });

  app.delete('/api/classes/:id', (req: Request, res: Response): any => {
    const success = dbService.deleteClass(req.params.id);
    res.json({ success });
  });

  /**
   * --------------------------------------------------------------------------
   * API: نظرات و امتیازدهی‌ها (Feedbacks)
   * --------------------------------------------------------------------------
   */
  app.get('/api/feedbacks', (_req: Request, res: Response) => {
    res.json({ success: true, feedbacks: dbService.getAllFeedbacks() });
  });

  app.post('/api/feedbacks', (req: Request, res: Response): any => {
    const fb = req.body as MutualFeedback;
    if (!fb || !fb.fromUserId || !fb.toUserId) {
      return res.status(400).json({ success: false, message: 'اطلاعات نظر ناقص است.' });
    }
    const created = dbService.createFeedback(fb);
    res.json({ success: true, feedback: created });
  });

  /**
   * --------------------------------------------------------------------------
   * API: شماره کارت و حساب بانکی مکتب‌خانه
   * --------------------------------------------------------------------------
   */
  app.get('/api/bank-card', (_req: Request, res: Response) => {
    res.json({ success: true, bankCardInfo: dbService.getBankCardInfo() });
  });

  app.put('/api/bank-card', (req: Request, res: Response): any => {
    const { cardNumber, cardHolderName, bankName } = req.body;
    if (!cardNumber || !cardHolderName) {
      return res.status(400).json({ success: false, message: 'شماره کارت و نام دارنده الزامی است.' });
    }
    const saved = dbService.setBankCardInfo({ cardNumber, cardHolderName, bankName: bankName || 'بانک ملی ایران' });
    res.json({ success: true, bankCardInfo: saved });
  });

  /**
   * --------------------------------------------------------------------------
   * API: لاگ‌های دیتابیس و رویدادهای سامانه (System & DB Logs)
   * --------------------------------------------------------------------------
   */
  app.get('/api/admin/logs', (_req: Request, res: Response) => {
    res.json({ success: true, logs: dbService.getSystemLogs() });
  });

  app.delete('/api/admin/logs', (_req: Request, res: Response) => {
    dbService.clearSystemLogs();
    dbService.addSystemLog('info', 'پاک‌سازی لیست لاگ‌های سامانه توسط مدیر');
    res.json({ success: true, message: 'لیست لاگ‌های سامانه با موفقیت پاک شد.' });
  });

  /**
   * --------------------------------------------------------------------------
   * API: تنظیمات سامانه و قوانین ثبت‌نام و امانت
   * --------------------------------------------------------------------------
   */
  app.get('/api/settings/config', (_req: Request, res: Response) => {
    res.json({ success: true, config: dbService.getSystemConfig() });
  });

  app.post('/api/settings/config', (req: Request, res: Response): any => {
    const config = req.body;
    if (!config || typeof config !== 'object') {
      return res.status(400).json({ success: false, message: 'اطلاعات تنظیمات نامعتبر است.' });
    }
    const updated = dbService.setSystemConfig(config);
    dbService.addSystemLog('info', 'به‌روزرسانی قوانین و تنظیمات سامانه توسط مدیر', JSON.stringify(updated));
    res.json({ success: true, message: 'تنظیمات با موفقیت ذخیره شد.', config: updated });
  });

  /**
   * --------------------------------------------------------------------------
   * API: تنظیم وب‌هوک بله
   * --------------------------------------------------------------------------
   */
  app.post('/api/set-bale-webhook', async (req: Request, res: Response): Promise<void> => {
    try {
      const requestedUrl = req.body?.url || DEFAULT_WEBHOOK_URL;
      const result = await setBaleWebhook(requestedUrl);
      res.json({
        success: true,
        webhook_url: requestedUrl,
        bale_response: result,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  });

  /**
   * --------------------------------------------------------------------------
   * API: بررسی وضعیت بات بله
   * --------------------------------------------------------------------------
   */
  app.get('/api/bale-bot-status', async (_req: Request, res: Response): Promise<void> => {
    try {
      const [meRes, webhookInfo] = await Promise.all([
        callBaleApi('getMe'),
        getBaleWebhookInfo(),
      ]);

      res.json({
        success: true,
        mode: 'WEBHOOK',
        bot_username: BOT_USERNAME,
        default_webhook_url: DEFAULT_WEBHOOK_URL,
        webhook_info: webhookInfo,
        active_sessions_count: otpSessions.size,
        bale_api_status: meRes.ok ? 'CONNECTED' : 'DISCONNECTED',
        bot_info: meRes.result || null,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  });

  /**
   * --------------------------------------------------------------------------
   * API: دریافت نسخه و وضعیت سرور
   * --------------------------------------------------------------------------
   */
  app.get(['/api/version', '/version'], (_req: Request, res: Response) => {
    res.json({
      success: true,
      app: 'MaktabKhaneh',
      version: SERVER_VERSION,
      build_date: BUILD_DATE,
      port: PORT,
      bot_username: BOT_USERNAME,
      webhook_url: DEFAULT_WEBHOOK_URL,
      database: 'SQLite (Native DatabaseSync)',
      uptime_seconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Fallback JSON for unknown API routes
   */
  app.all('/api/*', (req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: `مسیر API درخواستی (${req.method} ${req.path}) یافت نشد.`,
    });
  });

  /**
   * Vite middleware in development or static index in production
   */
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Bind to port 3000 and 0.0.0.0
  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 سرور مکتب‌خونه با پایگاه داده SQLite و آپلود فایل روی پورت ${PORT} اجرا شد.`);
    console.log(`📁 مسیر ذخیره دائمی دیتابیس: ${path.join(process.cwd(), 'data', 'maktabkhune.db')}`);
    console.log(`🖼️ مسیر ذخیره فایل‌های آپلودی: ${UPLOADS_DIR}`);
    console.log(`🤖 متصل به بات بله: @${BOT_USERNAME}`);
    console.log(`🌐 وب‌هوک: ${DEFAULT_WEBHOOK_URL}`);

    try {
      if (DEFAULT_WEBHOOK_URL && DEFAULT_WEBHOOK_URL.startsWith('https://')) {
        await setBaleWebhook(DEFAULT_WEBHOOK_URL);
      }
    } catch (webhookErr) {
      console.warn('⚠️ توجه: ثبت وب‌هوک در استارت:', webhookErr);
    }
  });
}

// Start application
startServer().catch((err) => {
  console.error('خطای بحرانی در اجرای سرور:', err);
});
