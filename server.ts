import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import crypto from 'crypto';
import multer from 'multer';
import { dbService, addSystemLogListener, DB_PATH } from './server/db';
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
const BUILD_DATE = '2026-08-28';

// Configurable Port (Environment variable PORT with default 8098)
const PORT = Number(process.env.PORT) || 8098;

// Configurable Upload Directory (Environment variable UPLOAD_DIR with default external drive path)
const RAW_UPLOAD_DIR = process.env.UPLOAD_DIR || '/media/mahdi/mm/maktab_uploads';

/**
 * Auto-create directory with recursive: true and handle permissions safely
 */
export function initializeUploadDirectory(targetDir: string): string {
  try {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const testFile = path.join(targetDir, `.write_test_${Date.now()}`);
    fs.writeFileSync(testFile, 'ok');
    fs.unlinkSync(testFile);
    console.log(`📁 [آپلود سرور] پوشه آپلود در مسیر ${targetDir} آماده و قابل نوشتن است.`);
    return targetDir;
  } catch (err: any) {
    console.warn(`⚠️ [آپلود سرور] ایجاد/دسترسی به ${targetDir} مقدور نیست (${err.message}). استفاده از پوشه محلی ./uploads`);
    const fallbackDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(fallbackDir)) {
      fs.mkdirSync(fallbackDir, { recursive: true });
    }
    return fallbackDir;
  }
}

const UPLOADS_DIR = initializeUploadDirectory(RAW_UPLOAD_DIR);

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
const adminAwaitingRejectReason = new Map<string | number, string>();
const ownerAwaitingLocation = new Map<string | number, string>();

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

/**
 * ارسال عکس به همراه کپشن و دکمه‌های شیشه‌ای به چت یا کانال بله
 */
async function sendBalePhoto(
  chatId: number | string,
  photoSource: string,
  caption?: string,
  replyMarkup?: Record<string, any>,
  baseUrl?: string
) {
  if (!photoSource) {
    return { ok: false, error: 'عکس مشخص نشده است.' };
  }

  // 1. فایل محلی آپلود شده روی دیسک (مانند /uploads/image_123.jpg)
  if (photoSource.startsWith('/uploads/') || photoSource.startsWith('uploads/')) {
    const filename = path.basename(photoSource);
    const localFilePath = path.join(UPLOADS_DIR, filename);

    if (fs.existsSync(localFilePath)) {
      try {
        const buffer = fs.readFileSync(localFilePath);
        const ext = path.extname(filename).toLowerCase();
        const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
        const blob = new Blob([buffer], { type: mimeType });

        const form = new FormData();
        form.append('chat_id', String(chatId));
        form.append('photo', blob, filename);
        if (caption) form.append('caption', caption);
        form.append('parse_mode', 'HTML');
        if (replyMarkup) form.append('reply_markup', JSON.stringify(replyMarkup));

        const res = await fetch(`${BALE_API_BASE_URL}/sendPhoto`, {
          method: 'POST',
          body: form,
        });
        const data = await res.json();
        return data;
      } catch (err) {
        console.error('[Bale sendPhoto] خطا در ارسال فایل محلی با FormData:', err);
      }
    }
  }

  // 2. فرمت Base64 (data:image/...)
  if (photoSource.startsWith('data:image/')) {
    try {
      const parts = photoSource.split(',');
      const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
      const buffer = Buffer.from(parts[1], 'base64');
      const blob = new Blob([buffer], { type: mime });

      const form = new FormData();
      form.append('chat_id', String(chatId));
      form.append('photo', blob, 'cover.jpg');
      if (caption) form.append('caption', caption);
      form.append('parse_mode', 'HTML');
      if (replyMarkup) form.append('reply_markup', JSON.stringify(replyMarkup));

      const res = await fetch(`${BALE_API_BASE_URL}/sendPhoto`, {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('[Bale sendPhoto] خطا در ارسال تصویر Base64:', err);
    }
  }

  // 3. آدرس اینترنتی (URL)
  let fullPhotoUrl = photoSource;
  if (photoSource.startsWith('/') && baseUrl) {
    fullPhotoUrl = `${baseUrl.replace(/\/$/, '')}${photoSource}`;
  }

  if (fullPhotoUrl.startsWith('http://') || fullPhotoUrl.startsWith('https://')) {
    // تلاش اول: ارسال مستقیم URL به API بله
    const urlResult = await callBaleApi('sendPhoto', {
      chat_id: chatId,
      photo: fullPhotoUrl,
      caption: caption,
      parse_mode: 'HTML',
      reply_markup: replyMarkup,
    });

    if (urlResult && urlResult.ok) {
      return urlResult;
    }

    // تلاش دوم در صورت عدم دانلود مستقیم توسط بله: دانلود به بافر سرور و ارسال با FormData
    try {
      const imageFetchRes = await fetch(fullPhotoUrl);
      if (imageFetchRes.ok) {
        const arrayBuf = await imageFetchRes.arrayBuffer();
        const contentType = imageFetchRes.headers.get('content-type') || 'image/jpeg';
        const blob = new Blob([arrayBuf], { type: contentType });

        const form = new FormData();
        form.append('chat_id', String(chatId));
        form.append('photo', blob, 'cover.jpg');
        if (caption) form.append('caption', caption);
        form.append('parse_mode', 'HTML');
        if (replyMarkup) form.append('reply_markup', JSON.stringify(replyMarkup));

        const formRes = await fetch(`${BALE_API_BASE_URL}/sendPhoto`, {
          method: 'POST',
          body: form,
        });
        return await formRes.json();
      }
    } catch (fetchErr) {
      console.error('[Bale sendPhoto] خطا در دانلود و ارسال تصویر از URL خارجی:', fetchErr);
    }
  }

  return { ok: false, error: 'روش معتبری برای ارسال عکس یافت نشد.' };
}

/**
 * فرمت‌بندی پست معرفی کتاب برای کانال بله با ساختار شکیل، ایموجی‌ها، هشتگ‌ها و دکمه‌های شیشه‌ای
 */
export function formatBookIntroductionPost(book: Book, siteBaseUrl?: string) {
  const config = dbService.getSystemConfig();
  const origin = siteBaseUrl || config.websiteBaseUrl || process.env.APP_URL || '';
  const cleanOrigin = origin.replace(/\/$/, '');
  const bookUrl = cleanOrigin ? `${cleanOrigin}?book=${encodeURIComponent(book.id)}` : '';
  const libraryUrl = cleanOrigin ? cleanOrigin : '';

  const conditionMap: Record<string, string> = {
    new: '✨ کاملاً نو و ورق‌نخورده',
    good: '👌 بسیار تمیز و در حد نو',
    fair: '📖 تمیز و خوانا'
  };
  const conditionText = conditionMap[book.condition] || '✨ سالم و تمیز';

  let postText = `✨ <b>معرفی کتاب جدید در گنجینه مکتب‌خانه</b> 📚\n`;
  postText += `━━━━━━━━━━━━━━━━━━\n\n`;
  postText += `📖 <b>نام کتاب:</b> <b>«${book.title}»</b>\n`;
  postText += `✍️ <b>پدیدآورنده / نویسنده:</b> ${book.author}\n`;
  if (book.category) {
    postText += `🏷 <b>موضوع / دسته‌بندی:</b> ${book.category}\n`;
  }
  postText += `👤 <b>اهداکننده / امانت‌دهنده:</b> ${book.ownerName} (کلاس ${book.ownerClass})\n`;
  postText += `🔍 <b>کیفیت فیزیکی:</b> ${conditionText}\n`;
  
  if (book.description && book.description.trim()) {
    let desc = book.description.trim();
    if (desc.length > 250) {
      desc = desc.substring(0, 247) + '...';
    }
    postText += `\n💬 <b>درباره این کتاب:</b>\n<i>«${desc}»</i>\n`;
  }

  postText += `\n📌 <b>شرایط و امتیازات امانت:</b>\n`;
  postText += `⏱ <b>مدت زمان امانت:</b> ${config.loanDurationDays || 7} روز (با امکان تمدید)\n`;
  postText += `💰 <b>هزینه امانت:</b> ${(config.loanFeeAmount || 10000).toLocaleString('fa-IR')} تومان (صرف توسعه کتابخانه)\n`;
  postText += `🏆 <b>امتیاز لیگ کتابخوانی:</b> ۵۰+ امتیاز برای مطالعه و ثبت نظر\n\n`;

  const categoryTag = book.category ? `#${book.category.replace(/[\s\-\/]+/g, '_')}` : '#کتاب';
  postText += `🔖 ${categoryTag} #مکتب_خانه #کتابخوانی #امانت_کتاب #معرفی_کتاب\n\n`;
  postText += `👇 <i>جهت رزرو و امانت فوری، روی دکمه زیر کلیک کنید:</i>`;

  const inlineKeyboard: any[][] = [];
  if (bookUrl) {
    inlineKeyboard.push([{ text: '📖 مشاهده و درخواست امانت در سایت 🚀', url: bookUrl }]);
  }
  if (libraryUrl) {
    inlineKeyboard.push([{ text: '🎒 ورود به کتابخانه آنلاین مکتب‌خانه 🏛', url: libraryUrl }]);
  }

  const replyMarkup = inlineKeyboard.length > 0 ? { inline_keyboard: inlineKeyboard } : undefined;

  return { text: postText, replyMarkup };
}

/**
 * انتشار مستقیم یک کتاب در کانال بله
 */
export async function publishBookToBaleChannel(book: Book, siteBaseUrl?: string) {
  try {
    const config = dbService.getSystemConfig();
    let channelId = config.baleChannelUsername?.trim();
    if (!channelId) {
      console.log('⚠️ [Bale Channel] نام کاربری یا آیدی کانال بله در تنظیمات ثبت نشده است.');
      return { ok: false, error: 'آیدی کانال بله تنظیم نشده است.' };
    }

    if (!channelId.startsWith('@') && !channelId.startsWith('-') && !/^\d+$/.test(channelId)) {
      channelId = `@${channelId}`;
    }

    const effectiveBaseUrl = siteBaseUrl || config.websiteBaseUrl || process.env.APP_URL || '';
    const { text, replyMarkup } = formatBookIntroductionPost(book, effectiveBaseUrl);

    // 1. اگر کتاب عکس جلد دارد، ارسال به عنوان Photo
    if (book.coverImage && book.coverImage.trim()) {
      const photoResult = await sendBalePhoto(channelId, book.coverImage.trim(), text, replyMarkup, effectiveBaseUrl);
      if (photoResult && photoResult.ok) {
        dbService.addSystemLog(
          'info',
          `انتشار کتاب «${book.title}» در کانال بله`,
          `با موفقیت به همراه تصویر جلد به کانال ${channelId} ارسال شد. شناسه پیام: ${photoResult.result?.message_id}`
        );
        return { ok: true, messageId: photoResult.result?.message_id, withPhoto: true, baleResponse: photoResult };
      }
      console.warn(`⚠️ [Bale Channel] ارسال عکس به کانال با خطا مواجه شد (${JSON.stringify(photoResult?.error || photoResult)}). در حال ارسال به عنوان متن ساده...`);
    }

    // 2. اگر عکس نداشت یا ارسال عکس ناموفق بود، ارسال به عنوان پیام متنی
    const msgResult = await sendBaleMessage(channelId, text, replyMarkup);
    if (msgResult && msgResult.ok) {
      dbService.addSystemLog(
        'info',
        `انتشار متنی کتاب «${book.title}» در کانال بله`,
        `با موفقیت به کانال ${channelId} ارسال شد. شناسه پیام: ${msgResult.result?.message_id}`
      );
      return { ok: true, messageId: msgResult.result?.message_id, withPhoto: false, baleResponse: msgResult };
    } else {
      dbService.addSystemLog(
        'error',
        `خطا در انتشار کتاب «${book.title}» در کانال بله`,
        `کانال: ${channelId} | خطا: ${JSON.stringify(msgResult?.error || msgResult)}`
      );
      return { ok: false, error: msgResult?.error || msgResult?.description || 'خطا در ارسال به کانال بله', baleResponse: msgResult };
    }
  } catch (err: any) {
    console.error('Error publishing book to Bale channel:', err);
    return { ok: false, error: err.message || 'خطای سرور' };
  }
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
 * ذخیره و به‌روزرسانی شناسه چت مدیران برای دریافت اعلانات (فقط چت‌های خصوصی کاربران، بدون کانال یا گروه)
 */
export function registerAdminBaleChatId(chatId: string | number) {
  try {
    const strId = chatId.toString().trim();
    // Channels or groups have negative IDs or start with @. Valid user private chat IDs are positive numbers.
    if (!strId || strId.startsWith('@') || strId.startsWith('-') || !/^\d+$/.test(strId)) {
      return;
    }
    const channelUsername = (dbService.getSystemConfig().baleChannelUsername || '').replace(/^@/, '').trim().toLowerCase();
    if (channelUsername && strId.toLowerCase() === channelUsername) {
      return;
    }

    const savedSetting = dbService.getSetting('admin_bale_chat_ids');
    let adminList: string[] = [];
    if (savedSetting) {
      try {
        const parsed = JSON.parse(savedSetting);
        if (Array.isArray(parsed)) {
          adminList = parsed
            .map(x => x.toString().trim())
            .filter(id => /^\d+$/.test(id) && !id.startsWith('-') && !id.startsWith('@'));
        }
      } catch (e) {}
    }
    if (!adminList.includes(strId)) {
      adminList.push(strId);
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
    const adminChatIds = new Set<string>();

    // 1. مدیران ثبت‌شده در دیتابیس
    allUsers.forEach((u) => {
      if (u.role === 'admin' && u.baleChatId) {
        const strId = u.baleChatId.toString().trim();
        if (/^\d+$/.test(strId) && !strId.startsWith('-') && !strId.startsWith('@')) {
          adminChatIds.add(strId);
        }
      }
    });

    // 2. چت‌آیدی‌های ذخیره‌شده از بله
    const savedSetting = dbService.getSetting('admin_bale_chat_ids');
    if (savedSetting) {
      try {
        const parsed = JSON.parse(savedSetting);
        if (Array.isArray(parsed)) {
          parsed.forEach((id) => {
            const strId = id.toString().trim();
            if (/^\d+$/.test(strId) && !strId.startsWith('-') && !strId.startsWith('@')) {
              adminChatIds.add(strId);
            }
          });
        }
      } catch (e) {}
    }

    const channelUsername = (dbService.getSystemConfig().baleChannelUsername || '').replace(/^@/, '').trim().toLowerCase();
    const filteredAdminIds = Array.from(adminChatIds).filter(id => {
      if (!/^\d+$/.test(id) || id.startsWith('-') || id.startsWith('@')) return false;
      if (channelUsername && id.toLowerCase() === channelUsername) return false;
      return true;
    });

    if (filteredAdminIds.length === 0) {
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

    for (const chatId of filteredAdminIds) {
      await sendBaleMessage(chatId, text, replyMarkup);
    }
  } catch (err) {
    console.error('Error notifying admins on Bale:', err);
  }
}

/**
 * ارسال پیام عمومی به تمامی مدیران ثبت‌شده در پیام‌رسان بله
 */
export async function notifyAdminsGeneralOnBale(text: string, replyMarkup?: any) {
  try {
    const allUsers = dbService.getAllUsers();
    const adminChatIds = new Set<string>();

    allUsers.forEach((u) => {
      if (u.role === 'admin' && u.baleChatId) {
        const strId = u.baleChatId.toString().trim();
        if (/^\d+$/.test(strId) && !strId.startsWith('-') && !strId.startsWith('@')) {
          adminChatIds.add(strId);
        }
      }
    });

    const savedSetting = dbService.getSetting('admin_bale_chat_ids');
    if (savedSetting) {
      try {
        const parsed = JSON.parse(savedSetting);
        if (Array.isArray(parsed)) {
          parsed.forEach((id) => {
            const strId = id.toString().trim();
            if (/^\d+$/.test(strId) && !strId.startsWith('-') && !strId.startsWith('@')) {
              adminChatIds.add(strId);
            }
          });
        }
      } catch (e) {}
    }

    const channelUsername = (dbService.getSystemConfig().baleChannelUsername || '').replace(/^@/, '').trim().toLowerCase();
    const filteredAdminIds = Array.from(adminChatIds).filter(id => {
      if (!/^\d+$/.test(id) || id.startsWith('-') || id.startsWith('@')) return false;
      if (channelUsername && id.toLowerCase() === channelUsername) return false;
      return true;
    });

    for (const chatId of filteredAdminIds) {
      await sendBaleMessage(chatId, text, replyMarkup);
    }
  } catch (err) {
    console.error('Error sending general notification to admins on Bale:', err);
  }
}

// Register system log listener to automatically notify admins on Bale whenever an error or warning log is recorded!
addSystemLogListener((log) => {
  if (log.level === 'error' || log.level === 'warn') {
    const icon = log.level === 'error' ? '🚨' : '⚠️';
    const errorText =
      `${icon} <b>هشدار لاگ سیستمی (${log.level === 'error' ? 'خطا' : 'هشدار'})</b>\n\n` +
      `📌 <b>موضوع:</b> ${log.message}\n` +
      `📝 <b>جزئیات:</b> ${log.details || 'بدون جزئیات تکمیلی'}\n` +
      (log.userName ? `👤 <b>کاربر مرتبط:</b> ${log.userName} (${log.userPhone || ''})\n` : '') +
      `⏰ <b>زمان ثبت:</b> ${log.timestamp}`;

    notifyAdminsGeneralOnBale(errorText);
  }
});

/**
 * ارسال پیام اعلان به کاربر در پیام‌رسان بله
 */
export async function notifyUserOnBale(userId: string, text: string, replyMarkup?: any) {
  try {
    const user = dbService.getUserById(userId);
    if (!user) {
      console.log(`⚠️ [Bale Notify] کاربر با شناسه ${userId} یافت نشد.`);
      return;
    }
    if (!user.baleChatId) {
      console.log(`⚠️ [Bale Notify] چت بله برای کاربر ${user.name} (${userId}) هنوز متصل نشده است.`);
      dbService.addSystemLog(
        'warn',
        `عدم ارسال اعلان بله به (${user.name})`,
        `چت بله این کاربر هنوز متصل نشده است. متن اعلان: ${text.substring(0, 100)}...`
      );
      return;
    }

    const res = await sendBaleMessage(user.baleChatId, text, replyMarkup);
    if (res && res.ok) {
      dbService.addSystemLog(
        'info',
        `ارسال اعلان بله به کاربر (${user.name})`,
        `چت‌آیدی بله: ${user.baleChatId} | متن: ${text.substring(0, 80)}...`
      );
    } else {
      dbService.addSystemLog(
        'error',
        `خطا در ارسال اعلان بله به (${user.name})`,
        `پاسخ بله: ${JSON.stringify(res)}`
      );
    }
  } catch (err) {
    console.error(`Error notifying user ${userId} on Bale:`, err);
  }
}

/**
 * پردازش کلیک روی دکمه‌های شیشه‌ای (Inline Keyboard) پیام‌رسان بله توسط مدیر یا کاربر
 */
export async function handleIncomingBaleCallbackQuery(callbackQuery: any) {
  try {
    const queryId = callbackQuery.id;
    const data = callbackQuery.data || '';
    const chatType = callbackQuery.message?.chat?.type;
    
    // Strict isolation: Never process callback queries from channels or groups
    if (chatType && chatType !== 'private') {
      return;
    }

    const fromChatId = callbackQuery.message?.chat?.id || callbackQuery.from?.id;
    const messageId = callbackQuery.message?.message_id;

    if (fromChatId) {
      registerAdminBaleChatId(fromChatId);
    }

    // 1. تایید عضویت کاربر توسط مدیر
    if (data.startsWith('approve_user:')) {
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

      const updatedUser = dbService.updateUser(userId, { status: 'approved', rejectionReason: '' });

      dbService.addSystemLog(
        'info',
        `تغییر وضعیت کاربر (${targetUser.name}) به تاییدشده از طریق پیام‌رسان بله`,
        `شناسه چت مدیر در بله: ${fromChatId}`
      );

      // 1. نمایش هشدار پاپ‌آپ روی صفحه مدیر در بله
      await callBaleApi('answerCallbackQuery', {
        callback_query_id: queryId,
        text: `✅ حساب کاربر «${targetUser.name}» با موفقیت تایید شد.`,
        show_alert: true,
      });

      // 2. به‌روزرسانی متن پیام در چت مدیر با وضعیت جدید
      if (fromChatId && messageId) {
        const updatedText =
          `🎒 <b>نتیجه بررسی درخواست عضویت در مکتب‌خانه</b>\n\n` +
          `👤 <b>نام:</b> ${targetUser.name}\n` +
          `🏫 <b>کلاس:</b> ${targetUser.className}\n` +
          `📱 <b>تلفن:</b> <code>${targetUser.phone}</code>\n\n` +
          `✅ <b>تایید شد:</b> دسترسی این کاربر توسط مدیر از طریق پیام‌رسان بله تایید شد.`;

        await callBaleApi('editMessageText', {
          chat_id: fromChatId,
          message_id: messageId,
          text: updatedText,
          parse_mode: 'HTML',
        });
      }

      // 3. ارسال اعلان اطلاع‌رسانی مستقیم برای دانش‌آموز در بله
      if (targetUser && targetUser.baleChatId) {
        const userNotification =
          `🎉 <b>تبریک ${targetUser.name} عزیز!</b>\n\n` +
          `حساب کاربری شما در مکتب‌خانه توسط مدیر مدرسه تایید و فعال شد. اکنون می‌توانید کتاب‌های مورد علاقه خود را امانت بگیرید. 🎒📚`;

        await sendBaleMessage(targetUser.baleChatId, userNotification);
      }
      return;
    }

    // 2. رد عضویت کاربر توسط مدیر (با امکان انتخاب علت)
    if (data.startsWith('reject_user:')) {
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

      const text =
        `🎒 <b>انتخاب علت رد عضویت «${targetUser.name}»</b>\n\n` +
        `لطفاً علت رد عضویت این کاربر را انتخاب نمایید تا علت آن به کاربر اطلاع‌رسانی شود:`;

      const replyMarkup = {
        inline_keyboard: [
          [
            { text: '✍️ نام نامفهوم یا ناقص', callback_data: `rj_rs:${userId}:name` },
            { text: '🏫 کلاس تحصیلی نادرست', callback_data: `rj_rs:${userId}:class` },
          ],
          [
            { text: '🚫 ثبت‌نام نامعتبر یا غیرمرتبط', callback_data: `rj_rs:${userId}:invalid` },
            { text: '⌨️ نوشتن علت دلخواه (تایپ متن)', callback_data: `rj_rs:${userId}:custom` },
          ],
          [
            { text: '↩️ لغو و بازگشت', callback_data: `rj_back:${userId}` }
          ]
        ]
      };

      await callBaleApi('editMessageText', {
        chat_id: fromChatId,
        message_id: messageId,
        text: text,
        reply_markup: replyMarkup,
        parse_mode: 'HTML',
      });

      await callBaleApi('answerCallbackQuery', {
        callback_query_id: queryId,
        text: 'لطفاً علت رد عضویت را انتخاب کنید.',
      });
      return;
    }

    // پردازش کدهای دلایل رد عضویت
    if (data.startsWith('rj_rs:')) {
      const parts = data.split(':');
      const userId = parts[1];
      const reasonCode = parts[2];
      const targetUser = dbService.getUserById(userId);

      if (!targetUser) {
        await callBaleApi('answerCallbackQuery', {
          callback_query_id: queryId,
          text: '❌ کاربر مورد نظر یافت نشد.',
          show_alert: true,
        });
        return;
      }

      if (reasonCode === 'custom') {
        adminAwaitingRejectReason.set(fromChatId, userId);

        const customPromptText =
          `⌨️ <b>در حال دریافت علت دلخواه رد عضویت «${targetUser.name}»</b>\n\n` +
          `لطفاً پیام/علت رد عضویت مورد نظر خود را در کادر چت تایپ کرده و ارسال فرمایید.\n\n` +
          `<i>مثال: سلام شما اسمتون رو درست وارد نکردید با نام کامل دوباره تلاش کنید</i>`;

        const cancelMarkup = {
          inline_keyboard: [
            [
              { text: '❌ انصراف و بازگشت', callback_data: `rj_back:${userId}` }
            ]
          ]
        };

        await callBaleApi('editMessageText', {
          chat_id: fromChatId,
          message_id: messageId,
          text: customPromptText,
          reply_markup: cancelMarkup,
          parse_mode: 'HTML',
        });

        await callBaleApi('answerCallbackQuery', {
          callback_query_id: queryId,
          text: 'لطفاً علت رد را تایپ کرده و ارسال کنید.',
        });
        return;
      }

      let reasonText = '';
      if (reasonCode === 'name') {
        reasonText = 'سلام، شما نام و نام خانوادگی خود را کامل و واقعی وارد نکرده‌اید. لطفاً با نام کامل و واقعی دوباره تلاش کنید.';
      } else if (reasonCode === 'class') {
        reasonText = 'سلام، کلاس یا پایه تحصیلی انتخاب شده نامعتبر است. لطفاً کلاس صحیح خود را انتخاب نمایید.';
      } else {
        reasonText = 'سلام، درخواست عضویت شما تایید نشد. اطلاعات ارائه‌شده نامعتبر یا نامربوط است.';
      }

      dbService.updateUser(userId, { status: 'rejected', rejectionReason: reasonText });

      dbService.addSystemLog(
        'info',
        `رد عضویت کاربر (${targetUser.name}) با علت: ${reasonText}`,
        `توسط مدیر از بله (شناسه چت: ${fromChatId})`
      );

      const finalAdminText =
        `🎒 <b>نتیجه بررسی درخواست عضویت در مکتب‌خانه</b>\n\n` +
        `👤 <b>نام:</b> ${targetUser.name}\n` +
        `🏫 <b>کلاس:</b> ${targetUser.className}\n` +
        `📱 <b>تلفن:</b> <code>${targetUser.phone}</code>\n\n` +
        `❌ <b>عضویت رد شد.</b>\n` +
        `💬 <b>علت ارسال شده:</b> ${reasonText}`;

      await callBaleApi('editMessageText', {
        chat_id: fromChatId,
        message_id: messageId,
        text: finalAdminText,
        parse_mode: 'HTML',
      });

      if (targetUser.baleChatId) {
        const userNotification =
          `⚠️ <b>اطلاعیه مکتب‌خانه</b>\n\n` +
          `درخواست عضویت شما توسط مدیر مدرسه پذیرفته نشد.\n\n` +
          `📌 <b>توضیح/علت رد عضویت:</b>\n` +
          `« ${reasonText} »\n\n` +
          `جهت اصلاح اطلاعات می‌توانید مجدداً در سایت مکتب‌خانه اقدام فرمایید.`;
        await sendBaleMessage(targetUser.baleChatId, userNotification);
      }

      await callBaleApi('answerCallbackQuery', {
        callback_query_id: queryId,
        text: '❌ درخواست عضویت رد شد و علت ارسال گردید.',
      });
      return;
    }

    if (data.startsWith('rj_back:')) {
      const userId = data.split(':')[1];
      const targetUser = dbService.getUserById(userId);
      if (fromChatId) {
        adminAwaitingRejectReason.delete(fromChatId);
      }

      if (!targetUser) {
        await callBaleApi('answerCallbackQuery', {
          callback_query_id: queryId,
          text: '❌ کاربر یافت نشد.',
          show_alert: true,
        });
        return;
      }

      const statusBadge = targetUser.status === 'approved' ? '✅ تایید شده' : '⏳ در انتظار تایید مدیر';
      const text =
        `🎒 <b>درخواست عضویت کاربر جدید در مکتب‌خانه</b>\n\n` +
        `👤 <b>نام و نام خانوادگی:</b> ${targetUser.name}\n` +
        `🏫 <b>کلاس / پایه تحصیلی:</b> ${targetUser.className}\n` +
        `📱 <b>شماره همراه:</b> <code>${targetUser.phone}</code>\n` +
        `📚 <b>تعداد کتاب‌های اهدا/ثبت‌شده:</b> ${targetUser.booksContributedCount} جلد\n` +
        `📌 <b>وضعیت حساب:</b> ${statusBadge}\n` +
        `📅 <b>تاریخ ثبت‌نام:</b> ${targetUser.joinedDate}\n\n` +
        `آیا دسترسی این دانش‌آموز را جهت امانت گرفتن کتاب از مکتب‌خانه تایید می‌فرمایید؟`;

      const replyMarkup = {
        inline_keyboard: [
          [
            { text: '✅ تایید حساب کاربر', callback_data: `approve_user:${targetUser.id}` },
            { text: '❌ رد عضویت کاربر', callback_data: `reject_user:${targetUser.id}` },
          ],
        ],
      };

      await callBaleApi('editMessageText', {
        chat_id: fromChatId,
        message_id: messageId,
        text: text,
        reply_markup: replyMarkup,
        parse_mode: 'HTML',
      });

      await callBaleApi('answerCallbackQuery', {
        callback_query_id: queryId,
        text: 'بازگشت به منوی بررسی.',
      });
      return;
    }

    // 2. پذیرش یا رد درخواست امانت کتاب توسط مالک با امکان تعیین زمان و مکان تحویل
    if (data.startsWith('accept_req:')) {
      const reqId = data.split(':')[1];
      const reqItem = dbService.getRequestById(reqId);

      if (!reqItem) {
        await callBaleApi('answerCallbackQuery', {
          callback_query_id: queryId,
          text: '❌ درخواست مورد نظر یافت نشد.',
          show_alert: true,
        });
        return;
      }

      const text =
        `📍 <b>تعیین زمان و مکان تحویل کتاب «${reqItem.bookTitle}»</b>\n\n` +
        `👤 <b>متقاضی:</b> ${reqItem.borrowerName} (${reqItem.borrowerClass})\n\n` +
        `لطفاً مکان و زمان تحویل کتاب در مدرسه را انتخاب فرمایید:`;

      const replyMarkup = {
        inline_keyboard: [
          [
            { text: '📍 دفتر پرورشی • زنگ دوم (۱۰:۱۵)', callback_data: `loc_set:${reqId}:parvareshi_z2` }
          ],
          [
            { text: '📍 کتابخانه مدرسه • زنگ اول (۰۹:۳۰)', callback_data: `loc_set:${reqId}:lib_z1` }
          ],
          [
            { text: '📍 حیاط/بوفه • ساعت تعطیلی (۱۲:۳۰)', callback_data: `loc_set:${reqId}:yard_exit` }
          ],
          [
            { text: '📍 نمازخانه • بعد از نماز ظهر', callback_data: `loc_set:${reqId}:namaz_noon` }
          ],
          [
            { text: '✏️ نوشتن زمان و مکان دلخواه (تایپ پیام)', callback_data: `loc_custom:${reqId}` }
          ],
          [
            { text: '↩️ لغو و رد درخواست', callback_data: `reject_req:${reqId}` }
          ]
        ]
      };

      await callBaleApi('editMessageText', {
        chat_id: fromChatId,
        message_id: messageId,
        text: text,
        reply_markup: replyMarkup,
        parse_mode: 'HTML',
      });

      await callBaleApi('answerCallbackQuery', {
        callback_query_id: queryId,
        text: 'لطفاً زمان و مکان تحویل کتاب را انتخاب کنید.',
      });
      return;
    }

    // تنظیم زمان و مکان از میانبرهای پیش‌فرض
    if (data.startsWith('loc_set:')) {
      const parts = data.split(':');
      const reqId = parts[1];
      const code = parts[2];
      const reqItem = dbService.getRequestById(reqId);

      if (!reqItem) {
        await callBaleApi('answerCallbackQuery', {
          callback_query_id: queryId,
          text: '❌ درخواست مورد نظر یافت نشد.',
          show_alert: true,
        });
        return;
      }

      let location = 'جلوی دفتر پرورشی مدرسه';
      let time = 'فردا - زنگ تفریح دوم (۱۰:۱۵)';
      let shift: 'morning' | 'afternoon' | 'evening_home' = 'morning';

      if (code === 'lib_z1') {
        location = 'کتابخانه مدرسه';
        time = 'فردا - زنگ تفریح اول (۰۹:۳۰)';
        shift = 'morning';
      } else if (code === 'yard_exit') {
        location = 'حیاط مدرسه (نزدیک بوفه)';
        time = 'هنگام تعطیلی مدرسه (۱۲:۳۰)';
        shift = 'afternoon';
      } else if (code === 'namaz_noon') {
        location = 'نمازخانه مدرسه';
        time = 'بعد از اقامه نماز ظهر';
        shift = 'afternoon';
      }

      const updated = dbService.updateRequest(reqId, {
        status: 'payment_pending',
        pickupLocation: location,
        pickupTime: time,
        pickupShift: shift,
        acceptedAt: new Date().toLocaleDateString('fa-IR'),
        paymentStatus: 'pending'
      });

      await callBaleApi('answerCallbackQuery', {
        callback_query_id: queryId,
        text: `✅ زمان و مکان تحویل ثبت و درخواست تایید شد.`,
        show_alert: true,
      });

      if (fromChatId && messageId) {
        await callBaleApi('editMessageText', {
          chat_id: fromChatId,
          message_id: messageId,
          text: `✅ <b>درخواست امانت کتاب «${reqItem.bookTitle}» توسط شما تایید شد.</b>\n\n` +
            `👤 <b>امانت‌گیرنده:</b> ${reqItem.borrowerName} (${reqItem.borrowerClass})\n` +
            `📍 <b>مکان تحویل:</b> ${location}\n` +
            `⏰ <b>زمان تحویل:</b> ${time}\n` +
            `💳 <b>وضعیت:</b> در انتظار ثبت فیش پرداخت ۱۰,۰۰۰ تومانی توسط متقاضی`,
          parse_mode: 'HTML',
        });
      }

      if (updated) {
        notifyUserOnBale(
          updated.borrowerId,
          `✅ <b>درخواست امانت شما پذیرفته شد!</b>\n\n` +
          `مالک کتاب <b>«${updated.bookTitle}»</b> درخواست امانت شما را پذیرفت.\n\n` +
          `📍 <b>مکان تحویل:</b> ${location}\n` +
          `⏰ <b>زمان تحویل:</b> ${time}\n` +
          `💳 <b>حق امانت:</b> ۱۰,۰۰۰ تومان\n\n` +
          `لطفاً وارد سامانه شده و نسبت به ثبت فیش پرداخت اقدام فرمایید.`
        );
      }
      return;
    }

    // نوشتن زمان و مکان دلخواه توسط مالک
    if (data.startsWith('loc_custom:')) {
      const reqId = data.split(':')[1];
      const reqItem = dbService.getRequestById(reqId);

      if (!reqItem) {
        await callBaleApi('answerCallbackQuery', {
          callback_query_id: queryId,
          text: '❌ درخواست یافت نشد.',
          show_alert: true,
        });
        return;
      }

      if (fromChatId) {
        ownerAwaitingLocation.set(fromChatId, reqId);
      }

      await callBaleApi('editMessageText', {
        chat_id: fromChatId,
        message_id: messageId,
        text: `✏️ <b>در حال دریافت زمان و مکان دلخواه برای تحویل کتاب «${reqItem.bookTitle}»</b>\n\n` +
          `لطفاً روز، زنگ تفریح و محل دقیق تحویل در مدرسه را در کادر چت تایپ کرده و ارسال فرمایید.\n\n` +
          `<i>مثال: فردا چهارشنبه زنگ تفریح سوم جلوی کلاس دهم تجربی</i>`,
        reply_markup: {
          inline_keyboard: [
            [{ text: '❌ انصراف و بازگشت', callback_data: `accept_req:${reqId}` }]
          ]
        },
        parse_mode: 'HTML',
      });

      await callBaleApi('answerCallbackQuery', {
        callback_query_id: queryId,
        text: 'لطفاً پیام حاوی زمان و مکان را تایپ و ارسال کنید.',
      });
      return;
    }

    if (data.startsWith('reject_req:')) {
      const reqId = data.split(':')[1];
      const reqItem = dbService.getRequestById(reqId);

      if (!reqItem) {
        await callBaleApi('answerCallbackQuery', {
          callback_query_id: queryId,
          text: '❌ درخواست مورد نظر یافت نشد.',
          show_alert: true,
        });
        return;
      }

      dbService.updateBook(reqItem.bookId, { status: 'available' });
      const updated = dbService.updateRequest(reqId, { status: 'rejected' });

      await callBaleApi('answerCallbackQuery', {
        callback_query_id: queryId,
        text: `❌ درخواست امانت کتاب «${reqItem.bookTitle}» رد شد.`,
        show_alert: true,
      });

      if (fromChatId && messageId) {
        await callBaleApi('editMessageText', {
          chat_id: fromChatId,
          message_id: messageId,
          text: `❌ <b>درخواست امانت کتاب «${reqItem.bookTitle}» رد شد.</b>`,
          parse_mode: 'HTML',
        });
      }

      if (updated) {
        notifyUserOnBale(
          updated.borrowerId,
          `❌ <b>درخواست امانت رد شد</b>\n\nمتأسفانه درخواست امانت کتاب <b>«${updated.bookTitle}»</b> توسط مالک پذیرفته نشد.`
        );
      }
      return;
    }
  } catch (err) {
    console.error('Error processing Bale Callback Query:', err);
  }
}

export async function handleIncomingBaleMessage(message: any) {
  const chatId = message.chat?.id || message.from?.id;
  if (!chatId) return;

  // STRICT CHANNEL & GROUP ISOLATION:
  // Never process or reply to messages originating from channels, supergroups, or groups.
  // The bot only interacts directly with individual users in 1-on-1 private chat sessions.
  const chatType = message.chat?.type;
  if (chatType && chatType !== 'private') {
    return;
  }

  const chatIdStr = String(chatId).trim();
  const chatUsername = (message.chat?.username || '').replace(/^@/, '').trim().toLowerCase();
  const channelUsername = (dbService.getSystemConfig().baleChannelUsername || '').replace(/^@/, '').trim().toLowerCase();

  // If chatId is negative (channel/group in Telegram/Bale protocol) or matches channel username
  if (chatIdStr.startsWith('-') || chatIdStr.startsWith('@') || (channelUsername && (chatUsername === channelUsername || chatIdStr.toLowerCase() === channelUsername))) {
    return;
  }

  const text = (message.text || '').trim();

  // Check if this chat is an admin awaiting custom reject reason
  if (adminAwaitingRejectReason.has(chatId)) {
    const userId = adminAwaitingRejectReason.get(chatId)!;
    adminAwaitingRejectReason.delete(chatId);

    const targetUser = dbService.getUserById(userId);
    if (!targetUser) {
      await sendBaleMessage(chatId, '❌ کاربر مورد نظر در سیستم یافت نشد.');
      return;
    }

    const customReason = text || 'اطلاعات نادرست وارد شده است.';

    // Reject in database
    dbService.updateUser(userId, { status: 'rejected', rejectionReason: customReason });

    dbService.addSystemLog(
      'info',
      `رد عضویت کاربر (${targetUser.name}) با علت دلخواه: ${customReason}`,
      `توسط مدیر از بله (شناسه چت: ${chatId})`
    );

    // Notify Admin of success
    const finalAdminText =
      `🎒 <b>نتیجه بررسی درخواست عضویت در مکتب‌خانه</b>\n\n` +
      `👤 <b>نام:</b> ${targetUser.name}\n` +
      `🏫 <b>کلاس:</b> ${targetUser.className}\n` +
      `📱 <b>تلفن:</b> <code>${targetUser.phone}</code>\n\n` +
      `❌ <b>عضویت رد شد.</b>\n` +
      `💬 <b>علت دلخواه ارسال شده:</b> ${customReason}`;

    await sendBaleMessage(chatId, finalAdminText);

    // Send rejection message to user
    if (targetUser.baleChatId) {
      const userNotification =
        `⚠️ <b>اطلاعیه مکتب‌خانه</b>\n\n` +
        `درخواست عضویت شما توسط مدیر مدرسه پذیرفته نشد.\n\n` +
        `📌 <b>توضیح/علت رد عضویت:</b>\n` +
        `« ${customReason} »\n\n` +
        `جهت اصلاح اطلاعات می‌توانید مجدداً در سایت مکتب‌خانه اقدام فرمایید.`;
      await sendBaleMessage(targetUser.baleChatId, userNotification);
    }
    return;
  }

  // Check if owner is typing custom location & time for a lending request
  if (ownerAwaitingLocation.has(chatId)) {
    const reqId = ownerAwaitingLocation.get(chatId)!;
    ownerAwaitingLocation.delete(chatId);

    const reqItem = dbService.getRequestById(reqId);
    if (!reqItem) {
      await sendBaleMessage(chatId, '❌ درخواست مورد نظر در سیستم یافت نشد.');
      return;
    }

    const customPickup = text || 'مدرسه (ساعات تفریح)';
    const updated = dbService.updateRequest(reqId, {
      status: 'payment_pending',
      pickupLocation: customPickup,
      pickupTime: customPickup,
      acceptedAt: new Date().toLocaleDateString('fa-IR'),
      paymentStatus: 'pending'
    });

    await sendBaleMessage(
      chatId,
      `✅ <b>زمان و مکان تحویل کتاب «${reqItem.bookTitle}» ثبت گردید.</b>\n\n` +
      `👤 <b>متقاضی:</b> ${reqItem.borrowerName} (${reqItem.borrowerClass})\n` +
      `📍 <b>مکان و زمان مشخص‌شده:</b> ${customPickup}\n` +
      `💳 <b>وضعیت:</b> در انتظار پرداخت حق امانت ۱۰,۰۰۰ تومانی توسط متقاضی`
    );

    if (updated) {
      notifyUserOnBale(
        updated.borrowerId,
        `✅ <b>درخواست امانت شما پذیرفته شد!</b>\n\n` +
        `مالک کتاب <b>«${updated.bookTitle}»</b> درخواست امانت شما را پذیرفت.\n\n` +
        `📍 <b>مکان و زمان تحویل:</b> ${customPickup}\n` +
        `💳 <b>حق امانت:</b> ۱۰,۰۰۰ تومان\n\n` +
        `لطفاً وارد سامانه شده و نسبت به ثبت فیش پرداخت اقدام فرمایید.`
      );
    }
    return;
  }

  // 1. /start
  if (text.startsWith('/start')) {
    const parts = text.split(/\s+/);
    const passedSessionId = parts.length > 1 ? parts[1].trim() : null;

    // Handle deep link /start user_USERID
    if (passedSessionId && passedSessionId.startsWith('user_')) {
      const targetUserId = passedSessionId.replace('user_', '');
      const targetUser = dbService.getUserById(targetUserId);
      if (targetUser) {
        dbService.updateUser(targetUser.id, { baleChatId: chatId });
        if (targetUser.role === 'admin' || isAdminPhone(targetUser.phone)) {
          registerAdminBaleChatId(chatId);
        }
        dbService.addSystemLog(
          'info',
          `اتصال موفق چت بله برای کاربر (${targetUser.name})`,
          `چت‌آیدی بله: ${chatId}`
        );

        const confirmText =
          `🎉 <b>سلام ${targetUser.name} عزیز! خوش آمدید.</b> 🎒\n\n` +
          `✅ حساب کاربری مکتب‌خانه شما با موفقیت به این چت بله متصل گردید.\n\n` +
          `از این پس کلیه اعلانات زیر به صورت لحظه‌ای برای شما ارسال می‌شود:\n` +
          `• 🟢 تایید یا رد عضویت توسط مدیر مدرسه\n` +
          `• 📚 درخواست‌های امانت و پاسخ مالک کتاب\n` +
          `• 💳 تایید فیش‌های پرداخت حق امانت\n` +
          `• 💬 نظرات و امتیازات جدید روی کتاب‌های شما`;

        await sendBaleMessage(chatId, confirmText, { remove_keyboard: true });
        return;
      }
    }

    // Handle deep link /start admin
    if (passedSessionId === 'admin') {
      registerAdminBaleChatId(chatId);
      dbService.addSystemLog(
        'info',
        `ثبت چت مدیریت بله از لینک مستقیم`,
        `چت‌آیدی بله: ${chatId}`
      );
      await sendBaleMessage(
        chatId,
        `👑 <b>مدیر محترم مکتب‌خانه خوش آمدید!</b>\n\n` +
        `چت بله شما به عنوان شناسه مدیریت اصلی سامانه ثبت گردید. کلیه اعلانات ثبت‌نام، پرداخت‌ها و گزارش‌های خسارت به همراه دکمه‌های تایید/رد مستقیم به همین چت ارسال خواهد شد. 🎒✨`,
        { remove_keyboard: true }
      );
      return;
    }

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
            dbService.addSystemLog('warn', 'خطای حجم آپلود', 'فایل تصویر بیش از ۱۰ مگابایت بود.');
            return res.status(400).json({
              success: false,
              message: 'حجم فایل عکس بیش از حد مجاز (حداکثر ۱۰ مگابایت) است.'
            });
          }
          dbService.addSystemLog('warn', 'خطای بارگذاری Multer', err.message);
          return res.status(400).json({
            success: false,
            message: `خطای بارگذاری فایل: ${err.message}`
          });
        }
        dbService.addSystemLog('error', 'خطای اعتبارسنجی تصویر آپلودی', err.message);
        return res.status(400).json({
          success: false,
          message: err.message || 'فقط فرمت‌های تصویری معتبر (JPG, JPEG, PNG, WEBP) مجاز هستند.'
        });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'هیچ فایل تصویری ارسال نشده است.' });
      }

      const fileUrl = `/uploads/${req.file.filename}`;

      // Log successful file upload in system logs
      dbService.addSystemLog(
        'info',
        'آپلود تصویر جدید در دیسک سرور',
        `فایل «${req.file.originalname}» با موفقیت در دایرکتوری ${UPLOADS_DIR} ذخیره شد. (نام: ${req.file.filename} - حجم: ${Math.round(req.file.size / 1024)}KB)`
      );

      return res.json({
        success: true,
        message: 'تصویر با موفقیت روی سرور ذخیره شد.',
        fileUrl,
        filename: req.file.filename,
        size: req.file.size,
        uploadDir: UPLOADS_DIR
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
   * API: مدیریت آواتارهای اختصاصی توسط مدیر
   * --------------------------------------------------------------------------
   */
  app.get('/api/avatars', (_req: Request, res: Response) => {
    try {
      const customAvatars = dbService.getCustomAvatars();
      res.json({ success: true, customAvatars });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'خطا در دریافت لیست آواتارها' });
    }
  });

  app.post('/api/avatars', (req: Request, res: Response): any => {
    try {
      const { name, url, bg } = req.body || {};
      if (!name || !url) {
        return res.status(400).json({ success: false, message: 'نام و تصویر آواتار الزامی است.' });
      }
      const avatar = dbService.addCustomAvatar({ name, url, bg });
      dbService.addSystemLog('info', `آواتار جدید با نام «${name}» توسط مدیریت اضافه شد.`);
      return res.json({ success: true, avatar, message: 'آواتار جدید با موفقیت اضافه شد.' });
    } catch (err: any) {
      console.error('Error adding avatar:', err);
      return res.status(500).json({ success: false, message: err.message || 'خطا در افزودن آواتار' });
    }
  });

  app.delete('/api/avatars/:id', (req: Request, res: Response): any => {
    try {
      const { id } = req.params;
      const ok = dbService.deleteCustomAvatar(id);
      if (!ok) {
        return res.status(404).json({ success: false, message: 'آواتار مورد نظر یافت نشد.' });
      }
      dbService.addSystemLog('info', `آواتار با شناسه ${id} توسط مدیریت حذف شد.`);
      return res.json({ success: true, message: 'آواتار با موفقیت حذف شد.' });
    } catch (err: any) {
      console.error('Error deleting avatar:', err);
      return res.status(500).json({ success: false, message: 'خطا در حذف آواتار' });
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

      // Ignore channel posts and edited channel posts completely
      if (update.channel_post || update.edited_channel_post) {
        return;
      }

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

      // Find verified session for this phone to extract baleChatId
      let baleChatId: string | undefined;
      const normalizedQueryPhone = normalizePhoneNumber(phone);
      for (const [sid, sess] of otpSessions.entries()) {
        if (sess.phoneNumber === normalizedQueryPhone && sess.status === 'VERIFIED') {
          baleChatId = sess.chatId?.toString();
          break;
        }
      }

      if (user) {
        const updateData: Partial<User> = {};
        if (isSystemAdmin && (user.role !== 'admin' || user.status !== 'approved')) {
          updateData.role = 'admin';
          updateData.status = 'approved';
        }
        if (baleChatId) {
          updateData.baleChatId = baleChatId;
        }
        if (Object.keys(updateData).length > 0) {
          user = dbService.updateUser(user.id, updateData)!;
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
        baleChatId: baleChatId,
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

      // Find verified session for this phone to extract baleChatId
      let baleChatId: string | undefined;
      const normalizedQueryPhone = normalizePhoneNumber(data.phone);
      for (const [sid, sess] of otpSessions.entries()) {
        if (sess.phoneNumber === normalizedQueryPhone && sess.status === 'VERIFIED') {
          baleChatId = sess.chatId?.toString();
          break;
        }
      }

      const isAdmin = isAdminPhone(data.phone);
      const sysConfig = dbService.getSystemConfig();

      const newUserId = `u_${Date.now()}`;
      const newUser: User = {
        id: newUserId,
        name: data.name.trim(),
        className: isAdmin ? 'مدیریت سامانه مکتب‌خانه' : data.className,
        phone: data.phone.trim(),
        baleChatId: baleChatId,
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
            description: 'عضویت و پیوستن به گنجینه مکتب‌خانه',
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

      const existingUser = dbService.getUserById(req.params.id);
      if (existingUser && existingUser.status === 'rejected') {
        updates.status = 'pending';
        updates.rejectionReason = '';
      }

      const user = dbService.updateUser(req.params.id, updates);
      if (!user) return res.status(404).json({ success: false, message: 'کاربر یافت نشد.' });

      // Notify admins if user completed their profile or resubmitted for review
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
    const user = dbService.updateUser(req.params.id, { status: 'approved', rejectionReason: '', suspensionReason: '' });
    if (!user) return res.status(404).json({ success: false, message: 'کاربر یافت نشد.' });
    
    dbService.addSystemLog(
      'info',
      `تایید و فعال‌سازی حساب کاربر (${user.name})`,
      `توسط مدیر از پنل وب`
    );

    // Notify user on Bale
    notifyUserOnBale(user.id, `🎉 <b>تبریک ${user.name} عزیز!</b>\n\nحساب کاربری شما در مکتب‌خانه توسط مدیر مدرسه تایید و فعال شد. اکنون می‌توانید از گنجینه کتابخانه استفاده فرمایید. 🎒📚`);

    res.json({ success: true, user });
  });

  app.post('/api/users/:id/unsuspend', (req: Request, res: Response): any => {
    const user = dbService.updateUser(req.params.id, {
      status: 'approved',
      suspensionReason: '',
      rejectionReason: ''
    });
    if (!user) return res.status(404).json({ success: false, message: 'کاربر یافت نشد.' });

    dbService.addSystemLog(
      'info',
      `رفع تعلیق حساب کاربر (${user.name})`,
      `توسط مدیر از پنل وب`
    );

    // Notify user on Bale
    notifyUserOnBale(
      user.id,
      `✅ <b>اطلاعیه رفع تعلیق حساب مکتب‌خانه</b>\n\n` +
      `حساب کاربری شما مجدداً فعال گردید و می‌توانید از امکانات سامانه امانت کتاب استفاده فرمایید.`
    );

    res.json({ success: true, user });
  });

  app.post('/api/users/:id/reject', (req: Request, res: Response): any => {
    const { reason } = req.body || {};
    const reasonText = reason && reason.trim() ? reason.trim() : 'اطلاعات وارد شده ناقص یا نادرست است.';

    const user = dbService.updateUser(req.params.id, {
      status: 'rejected',
      rejectionReason: reasonText
    });
    if (!user) return res.status(404).json({ success: false, message: 'کاربر یافت نشد.' });

    dbService.addSystemLog(
      'info',
      `رد عضویت کاربر (${user.name}) با علت: ${reasonText}`,
      `توسط مدیر از پنل وب`
    );

    // Notify user on Bale with custom reason
    notifyUserOnBale(
      user.id,
      `⚠️ <b>اطلاعیه مکتب‌خانه</b>\n\n` +
      `درخواست عضویت شما توسط مدیر مدرسه پذیرفته نشد.\n\n` +
      `📌 <b>توضیح/علت رد عضویت:</b>\n` +
      `« ${reasonText} »\n\n` +
      `جهت اصلاح اطلاعات می‌توانید مجدداً در سایت مکتب‌خانه اقدام فرمایید.`
    );

    res.json({ success: true, user });
  });

  app.post('/api/users/:id/suspend', (req: Request, res: Response): any => {
    const { reason } = req.body;
    const user = dbService.updateUser(req.params.id, {
      status: 'suspended',
      suspensionReason: reason || 'تخلف در رعایت قوانین امانت کتاب'
    });
    if (!user) return res.status(404).json({ success: false, message: 'کاربر یافت نشد.' });

    // Notify user on Bale
    notifyUserOnBale(
      user.id,
      `⛔️ <b>هشدار تعلیق حساب مکتب‌خانه</b>\n\n` +
      `حساب کاربری شما به دلیل زیر موقتاً تعلیق شد:\n` +
      `📌 <b>علت:</b> ${user.suspensionReason}\n\n` +
      `جهت برطرف شدن مشکل با مسئول کتابخانه مدرسه تماس بگیرید.`
    );

    dbService.createNotification({
      userId: user.id,
      title: 'تعلیق موقت حساب کاربری',
      message: `حساب کاربری شما موقتاً تعلیق شد. علت: ${user.suspensionReason}`,
      type: 'account_suspended',
      linkTab: 'requests'
    });

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

  // Promote existing user to admin
  app.post('/api/users/:id/make-admin', (req: Request, res: Response): any => {
    try {
      const user = dbService.getUserById(req.params.id);
      if (!user) return res.status(404).json({ success: false, message: 'کاربر یافت نشد.' });

      const updated = dbService.updateUser(user.id, {
        role: 'admin',
        status: 'approved'
      });

      dbService.addSystemLog(
        'info',
        `ترفیع کاربر به مدیریت سامانه`,
        `کاربر ${user.name} (${user.phone}) به عنوان مدیر جدید ارتقا یافت.`
      );

      notifyAdminsGeneralOnBale(
        `👑 <b>انتصاب مدیر جدید!</b>\n\n` +
        `کاربر <b>${user.name}</b> (${user.phone}) به عنوان مدیر جدید سامانه مکتب‌خانه منصوب گردید.`
      );

      // Notify user on Bale if connected
      notifyUserOnBale(
        user.id,
        `👑 <b>ارتقای حساب کاربری!</b>\n\n` +
        `تبریک ${user.name} عزیز! حساب کاربری شما در مکتب‌خانه به سطح <b>مدیریت سامانه</b> ارتقا یافت.`
      );

      res.json({ success: true, user: updated, message: `کاربر ${user.name} با موفقیت به عنوان مدیر ارتقا یافت.` });
    } catch (err: any) {
      console.error('Make Admin Error:', err);
      res.status(500).json({ success: false, message: 'خطا در ارتقای کاربر به مدیریت.' });
    }
  });

  // Add or register new admin by phone number & name
  app.post('/api/admin/add-admin', (req: Request, res: Response): any => {
    try {
      const { phone, name, password } = req.body || {};
      if (!phone || !phone.trim()) {
        return res.status(400).json({ success: false, message: 'شماره تلفن مدیر الزامی است.' });
      }

      const normalizedPhone = phone.trim();
      let existingUser = dbService.getUserByPhone(normalizedPhone);

      if (existingUser) {
        // Upgrade existing user to admin
        const updated = dbService.updateUser(existingUser.id, {
          role: 'admin',
          status: 'approved',
          name: name && name.trim() ? name.trim() : existingUser.name,
          password: password ? password : existingUser.password
        });

        dbService.addSystemLog(
          'info',
          'افزودن/ترفیع مدیر جدید با شماره تلفن',
          `کاربر موجود با شماره ${normalizedPhone} به مدیریت ارتقا یافت.`
        );

        notifyAdminsGeneralOnBale(
          `👑 <b>افزودن مدیر جدید</b>\n\n` +
          `شماره تلفن <b>${normalizedPhone}</b> (${updated?.name}) به لیست مدیران اصلی مکتب‌خانه اضافه و فعال گردید.`
        );

        return res.json({
          success: true,
          message: `کاربر ${updated?.name} با شماره ${normalizedPhone} به عنوان مدیر فعال گردید.`,
          user: updated
        });
      } else {
        // Create brand new admin user
        const newAdminName = name && name.trim() ? name.trim() : 'مدیر کتابخانه';
        const newAdminPassword = password || '123456';

        const newAdminUser: User = {
          id: `u_admin_${Date.now()}`,
          name: newAdminName,
          phone: normalizedPhone,
          className: 'مدیریت کتابخانه',
          role: 'admin',
          password: newAdminPassword,
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
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(newAdminName)}`,
          status: 'approved'
        };

        const saved = dbService.createUser(newAdminUser);

        dbService.addSystemLog(
          'info',
          'ایجاد حساب مدیر جدید',
          `مدیر جدید با نام ${newAdminUser.name} و شماره ${normalizedPhone} ایجاد شد.`
        );

        notifyAdminsGeneralOnBale(
          `👑 <b>ایجاد حساب مدیر جدید</b>\n\n` +
          `حساب جدید مدیریت برای <b>${newAdminUser.name}</b> (${normalizedPhone}) ثبت و فعال شد.`
        );

        return res.json({
          success: true,
          message: `حساب مدیریت برای ${newAdminUser.name} با موفقیت ثبت شد.`,
          user: saved
        });
      }
    } catch (err: any) {
      console.error('Add Admin Error:', err);
      res.status(500).json({ success: false, message: 'خطا در ثبت مدیر جدید.' });
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

      // Check user approval status
      const user = dbService.getUserById(bookData.ownerId);
      if (!user || user.status !== 'approved') {
        return res.status(403).json({
          success: false,
          message: 'تنها کاربران تاییدشده مجاز به اضافه کردن کتاب به طاقچه هستند.'
        });
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

      // Notify owner on Bale
      notifyUserOnBale(
        created.ownerId,
        `📚 <b>ثبت موفق کتاب در مکتب‌خانه!</b>\n\n` +
        `کتاب <b>«${created.title}»</b> با موفقیت در گنجینه مکتب‌خانه قرار گرفت. با تشکر از مشارکت شما در ترویج کتابخوانی! 🎒✨`
      );

      // Notify admins on Bale
      notifyAdminsGeneralOnBale(
        `📚 <b>کتاب جدید در مکتب‌خانه ثبت شد</b>\n\n` +
        `📖 <b>عنوان:</b> ${created.title}\n` +
        `✍️ <b>نویسنده:</b> ${created.author}\n` +
        `👤 <b>اهداکننده / مالک:</b> ${created.ownerName} (کلاس ${created.ownerClass})`
      );

      // Auto-publish new book to Bale Channel if enabled in settings
      const sysConfig = dbService.getSystemConfig();
      if (sysConfig.autoPublishBooksToBale !== false && sysConfig.baleChannelUsername?.trim()) {
        const originHeader = req.get('origin') || `${req.protocol}://${req.get('host')}`;
        const siteUrl = sysConfig.websiteBaseUrl?.trim() || originHeader || process.env.APP_URL || '';
        publishBookToBaleChannel(created, siteUrl).catch((channelErr) => {
          console.error('Error auto-publishing new book to Bale channel:', channelErr);
        });
      }

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

    // Notify book owner about the new review
    if (updated.ownerId) {
      notifyUserOnBale(
        updated.ownerId,
        `💬 <b>نظر جدید روی کتاب شما!</b>\n\n` +
        `دانش‌آموز <b>${review.userName}</b> روی کتاب <b>«${updated.title}»</b> نظر و امتیاز ⭐ ${review.rating} ثبت کرد:\n` +
        `<i>"${review.comment}"</i>`
      );

      dbService.createNotification({
        userId: updated.ownerId,
        title: 'نظر جدید روی کتاب شما',
        message: `همکلاسی شما ${review.userName} روی کتاب «${updated.title}» نظر و امتیاز ${review.rating} ستاره ثبت کرد: «${review.comment}»`,
        type: 'book_review',
        linkTab: 'my_books',
        relatedId: updated.id
      });
    }

    res.json({ success: true, book: updated });
  });

  app.delete('/api/books/:id/reviews/:reviewId', (req: Request, res: Response): any => {
    const updated = dbService.deleteBookReview(req.params.id, req.params.reviewId);
    if (!updated) return res.status(404).json({ success: false, message: 'کتاب یا نظر یافت نشد.' });
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

      // Create local user notification
      dbService.createNotification({
        userId: book.ownerId,
        title: 'درخواست جدید امانت کتاب',
        message: `همکلاسی شما ${borrower.name} درخواست امانت کتاب «${book.title}» را دارد.`,
        type: 'loan_requested',
        linkTab: 'requests',
        relatedId: reqId
      });

      // Notify book owner on Bale with interactive accept/reject inline keyboard buttons!
      notifyUserOnBale(
        book.ownerId,
        `📚 <b>درخواست امانت کتاب جدید!</b>\n\n` +
        `👤 <b>متقاضی:</b> ${borrower.name} (کلاس ${borrower.className})\n` +
        `📖 <b>کتاب:</b> «${book.title}»\n` +
        `📅 <b>تاریخ درخواست:</b> ${newReq.createdAt}\n\n` +
        `آیا با امانت دادن این کتاب موافقت می‌فرمایید؟`,
        {
          inline_keyboard: [
            [
              { text: '✅ پذیرش درخواست امانت', callback_data: `accept_req:${reqId}` },
              { text: '❌ رد درخواست', callback_data: `reject_req:${reqId}` },
            ],
          ],
        }
      );

      // Notify admins on Bale
      notifyAdminsGeneralOnBale(
        `🔄 <b>ثبت درخواست امانت جدید</b>\n\n` +
        `📖 <b>کتاب:</b> «${book.title}»\n` +
        `👤 <b>امانت‌گیرنده:</b> ${borrower.name} (${borrower.className})\n` +
        `👤 <b>مالک:</b> ${book.ownerName} (${book.ownerClass})`
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

    // Create user notification
    dbService.createNotification({
      userId: updated.borrowerId,
      title: 'پذیرش درخواست امانت کتاب',
      message: `درخواست شما برای کتاب «${updated.bookTitle}» پذیرفته شد. لطفاً فیش پرداخت را واریز و ثبت کنید.`,
      type: 'loan_accepted',
      linkTab: 'requests',
      relatedId: updated.id
    });

    // Notify borrower on Bale
    notifyUserOnBale(
      updated.borrowerId,
      `✅ <b>درخواست امانت شما پذیرفته شد!</b>\n\n` +
      `مالک کتاب <b>«${updated.bookTitle}»</b> درخواست امانت شما را پذیرفت.\n` +
      `📍 <b>مکان تحویل:</b> ${pickupLocation || 'مدرسه'}\n` +
      `⏰ <b>زمان تحویل:</b> ${pickupTime || 'ساعات تفریح'}\n` +
      `💳 <b>حق امانت:</b> ۱۰,۰۰۰ تومان\n\n` +
      `لطفاً وارد سامانه شده و فیش پرداخت خود را ثبت فرمایید.`
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
        `❌ <b>درخواست امانت رد شد</b>\n\nمتأسفانه درخواست امانت کتاب <b>«${updated.bookTitle}»</b> توسط مالک پذیرفته نشد.`
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

    // Notify admins on Bale about payment proof
    notifyAdminsGeneralOnBale(
      `💳 <b>ثبت فیش پرداخت حق امانت جدید</b>\n\n` +
      `📖 <b>کتاب:</b> «${updated.bookTitle}»\n` +
      `👤 <b>پرداخت‌کننده:</b> ${updated.borrowerName} (${updated.borrowerClass})\n` +
      `🔢 <b>کد پیگیری:</b> <code>${trackingCode || 'ثبت نشده'}</code>\n` +
      `📅 <b>تاریخ پرداخت:</b> ${paymentDate}\n\n` +
      `لطفاً فیش واریزی را در پنل مدیریت بررسی و تایید فرمایید.`
    );

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

    // Notify borrower
    notifyUserOnBale(
      reqItem.borrowerId,
      `🎉 <b>فیش پرداخت حق امانت تایید شد!</b>\n\n` +
      `فیش واریزی شما برای امانت کتاب <b>«${reqItem.bookTitle}»</b> توسط مسئول کتابخانه تایید گردید.\n` +
      `اکنون می‌توانید جهت تحویل کتاب اقدام فرمایید.`
    );

    dbService.createNotification({
      userId: reqItem.borrowerId,
      title: 'تایید فیش پرداخت حق امانت',
      message: `فیش واریزی شما برای کتاب «${reqItem.bookTitle}» تایید شد. می‌توانید نسبت به تحویل فیزیکی اقدام کنید.`,
      type: 'receipt_approved',
      linkTab: 'requests',
      relatedId: reqItem.id
    });

    // Notify owner
    notifyUserOnBale(
      reqItem.ownerId,
      `💳 <b>پرداخت حق امانت تایید شد</b>\n\n` +
      `پرداخت حق امانت کتاب <b>«${reqItem.bookTitle}»</b> توسط ${reqItem.borrowerName} تایید گردید. تحویل کتاب مجاز است.`
    );

    dbService.createNotification({
      userId: reqItem.ownerId,
      title: 'تایید پرداخت حق امانت همکلاسی',
      message: `پرداخت حق امانت کتاب «${reqItem.bookTitle}» توسط همکلاسی شما (${reqItem.borrowerName}) تایید شد. تحویل فیزیکی بلامانع است.`,
      type: 'receipt_approved',
      linkTab: 'requests',
      relatedId: reqItem.id
    });

    res.json({ success: true, request: updated });
  });

  app.post('/api/requests/:id/reject-payment', (req: Request, res: Response): any => {
    const { reason } = req.body || {};
    const reqItem = dbService.getRequestById(req.params.id);
    if (!reqItem) return res.status(404).json({ success: false, message: 'درخواست یافت نشد.' });

    const reasonText = reason && reason.trim() ? reason.trim() : 'تصویر فیش یا کد پیگیری واریز نامعتبر است.';

    const paymentProof = reqItem.paymentProof || { trackingCode: '', paymentDate: '', submittedAt: '' };
    const updated = dbService.updateRequest(req.params.id, {
      status: 'accepted',
      paymentStatus: 'rejected',
      paymentProof: {
        ...paymentProof,
        rejectionReason: reasonText
      }
    });

    dbService.addSystemLog(
      'info',
      `رد فیش پرداخت امانت کتاب (${reqItem.bookTitle}) با علت: ${reasonText}`,
      `امانت‌گیرنده: ${reqItem.borrowerName}`
    );

    // Notify borrower
    notifyUserOnBale(
      reqItem.borrowerId,
      `⚠️ <b>رد فیش پرداخت حق امانت</b>\n\n` +
      `متأسفانه فیش واریزی شما برای امانت کتاب <b>«${reqItem.bookTitle}»</b> مورد تایید قرار نگرفت.\n\n` +
      `📌 <b>علت رد پرداخت:</b>\n` +
      `« ${reasonText} »\n\n` +
      `لطفاً وارد سامانه شده و نسبت به ثبت مجدد فیش پرداخت معتبر اقدام فرمایید.`
    );

    dbService.createNotification({
      userId: reqItem.borrowerId,
      title: 'رد فیش پرداخت حق امانت',
      message: `فیش واریزی شما برای کتاب «${reqItem.bookTitle}» رد شد. علت: ${reasonText}`,
      type: 'receipt_rejected',
      linkTab: 'requests',
      relatedId: reqItem.id
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

    // Notify borrower
    notifyUserOnBale(
      reqItem.borrowerId,
      `📦 <b>تحویل کتاب با موفقیت تایید شد!</b>\n\n` +
      `شما کتاب <b>«${reqItem.bookTitle}»</b> را تحویل گرفتید.\n` +
      `📅 <b>مهلت بازگرداندن:</b> ${returnDueDate} (۷ روز)\n\n` +
      `از مطالعه آن لذت ببرید! 🎒📚`
    );

    // Notify owner
    notifyUserOnBale(
      reqItem.ownerId,
      `📦 <b>تایید تحویل کتاب</b>\n\n` +
      `تحویل کتاب <b>«${reqItem.bookTitle}»</b> به ${reqItem.borrowerName} به ثبت رسید.`
    );

    res.json({ success: true, request: updated });
  });

  app.post('/api/requests/:id/return-and-feedback', (req: Request, res: Response): any => {
    const { feedback, isDamaged, damageReason, damagePhotoUrl } = req.body;
    const reqItem = dbService.getRequestById(req.params.id);
    if (!reqItem) return res.status(404).json({ success: false, message: 'درخواست یافت نشد.' });

    // If damage was reported in this feedback
    if (isDamaged) {
      dbService.updateBook(reqItem.bookId, {
        isDamaged: true,
        damageDescription: damageReason || 'آسیب‌دیدگی هنگام عودت'
      });

      const borrowerId = reqItem.borrowerId;
      if (borrowerId) {
        dbService.updateUser(borrowerId, {
          status: 'suspended',
          suspensionReason: `خسارت به کتاب «${reqItem.bookTitle}»: ${damageReason || 'آسیب وارده به کتاب'}`
        });

        dbService.createNotification({
          userId: borrowerId,
          title: 'تعلیق حساب به دلیل گزارش خسارت کتاب',
          message: `حساب کاربری شما به دلیل وارد کردن خسارت به کتاب «${reqItem.bookTitle}» موقتاً تعلیق شد. شرح خسارت: ${damageReason || 'آسیب وارده'}`,
          type: 'account_suspended',
          linkTab: 'requests',
          relatedId: reqItem.id
        });
      }

      dbService.updateRequest(req.params.id, {
        isDamagedReported: true,
        damageNotes: damageReason,
        damagePhotoUrl: damagePhotoUrl || undefined
      });

      notifyAdminsGeneralOnBale(
        `🚨 <b>گزارش خسارت به کتاب!</b>\n\n` +
        `📖 <b>کتاب:</b> «${reqItem.bookTitle}»\n` +
        `👤 <b>امانت‌گیرنده:</b> ${reqItem.borrowerName} (${reqItem.borrowerClass})\n` +
        `📝 <b>شرح خسارت:</b> ${damageReason || 'نامشخص'}\n` +
        (damagePhotoUrl ? `📷 <b>عکس پیوست:</b> ${damagePhotoUrl}\n\n` : '\n') +
        `⚠️ حساب کاربری امانت‌گیرنده تعلیق گردید.`
      );
    } else {
      // Mark book as available again
      dbService.updateBook(reqItem.bookId, {
        status: 'available',
        borrowerId: undefined,
        borrowerName: undefined,
        estimatedReturnDate: undefined
      });
    }

    // Record feedback if provided
    if (feedback) {
      dbService.createFeedback(feedback);
    }

    const role = feedback?.role || 'borrower_to_owner';
    const updates: Partial<LendingRequest> = {
      status: 'returned',
      ...(role === 'borrower_to_owner' ? { borrowerFeedbackGiven: true } : { ownerFeedbackGiven: true })
    };

    const updated = dbService.updateRequest(req.params.id, updates);

    // Notify parties on Bale
    if (role === 'borrower_to_owner') {
      notifyUserOnBale(
        reqItem.ownerId,
        `✅ <b>بازگرداندن کتاب</b>\n\n` +
        `کتاب <b>«${reqItem.bookTitle}»</b> توسط ${reqItem.borrowerName} بازگردانده شد و مجدداً آماده امانت است.`
      );
      notifyUserOnBale(
        reqItem.borrowerId,
        `✨ <b>تشکر از شما!</b>\n\n` +
        `بازگرداندن کتاب <b>«${reqItem.bookTitle}»</b> با موفقیت ثبت شد. امیدواریم از مطالعه آن لذت برده باشید.`
      );

      dbService.createNotification({
        userId: reqItem.ownerId,
        title: 'کتاب شما بازگردانده شد',
        message: `کتاب «${reqItem.bookTitle}» توسط ${reqItem.borrowerName} بازگردانده شد.`,
        type: 'loan_accepted',
        linkTab: 'my_books',
        relatedId: reqItem.id
      });
      dbService.createNotification({
        userId: reqItem.borrowerId,
        title: 'تشکر بابت بازگرداندن کتاب',
        message: `بازگرداندن کتاب «${reqItem.bookTitle}» با موفقیت ثبت شد. مایه افتخار است که کتاب را به موقع برگرداندید!`,
        type: 'system',
        linkTab: 'requests',
        relatedId: reqItem.id
      });
      if (feedback && !feedback.isConfidentialToAdmin) {
        dbService.createNotification({
          userId: reqItem.ownerId,
          title: 'ثبت بازخورد جدید برای شما',
          message: `${reqItem.borrowerName} برای امانت گرفتن کتاب «${reqItem.bookTitle}» به شما امتیاز و نظر داد: «${feedback.comment || 'بدون توضیح'}»`,
          type: 'feedback_received',
          linkTab: 'requests',
          relatedId: reqItem.id
        });
      }
    } else {
      notifyUserOnBale(
        reqItem.borrowerId,
        `⭐ <b>ثبت ارزیابی مالک کتاب</b>\n\n` +
        `مالک کتاب <b>«${reqItem.bookTitle}»</b> نظر و امتیاز امانت‌داری شما را ثبت کرد.`
      );

      if (feedback && !feedback.isConfidentialToAdmin) {
        dbService.createNotification({
          userId: reqItem.borrowerId,
          title: 'ثبت بازخورد جدید برای شما',
          message: `مالک کتاب «${reqItem.bookTitle}» برای امانت‌داری شما امتیاز و نظر داد: «${feedback.comment || 'بدون توضیح'}»`,
          type: 'feedback_received',
          linkTab: 'requests',
          relatedId: reqItem.id
        });
      }
    }

    res.json({ success: true, request: updated });
  });

  app.post('/api/requests/:id/report-damage', (req: Request, res: Response): any => {
    const { borrowerId, damageReason, damagePhotoUrl } = req.body;
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

    dbService.createNotification({
      userId: borrowerId,
      title: 'تعلیق حساب به دلیل گزارش خسارت کتاب',
      message: `حساب کاربری شما به دلیل وارد کردن خسارت به کتاب «${reqItem.bookTitle}» موقتاً تعلیق شد. شرح خسارت: ${damageReason}`,
      type: 'account_suspended',
      linkTab: 'requests',
      relatedId: reqItem.id
    });

    const updated = dbService.updateRequest(req.params.id, {
      isDamagedReported: true,
      damageNotes: damageReason,
      damagePhotoUrl: damagePhotoUrl || undefined
    });

    // Notify admins on Bale with photo if available
    let adminMsg = `🚨 <b>گزارش خسارت به کتاب!</b>\n\n` +
      `📖 <b>کتاب:</b> «${reqItem.bookTitle}»\n` +
      `👤 <b>امانت‌گیرنده:</b> ${reqItem.borrowerName} (${reqItem.borrowerClass})\n` +
      `📝 <b>توضیحات خسارت:</b> ${damageReason}\n\n` +
      `⚠️ حساب امانت‌گیرنده طبق قوانین مکتب‌خانه تعلیق گردید.`;

    if (damagePhotoUrl) {
      adminMsg += `\n\n📷 <b>تصویر آسیب:</b> ${damagePhotoUrl}`;
    }

    notifyAdminsGeneralOnBale(adminMsg);

    // Notify borrower
    notifyUserOnBale(
      borrowerId,
      `🚨 <b>گزارش خسارت به کتاب</b>\n\n` +
      `گزارش آسیب به کتاب <b>«${reqItem.bookTitle}»</b> ثبت شد و حساب شما تعلیق گردید.\n` +
      `📌 <b>توضیحات:</b> ${damageReason}`
    );

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

  app.delete('/api/feedbacks/:id', (req: Request, res: Response): any => {
    const success = dbService.deleteFeedback(req.params.id);
    res.json({ success });
  });

  /**
   * --------------------------------------------------------------------------
   * API: اعلان‌های کاربران (Notifications)
   * --------------------------------------------------------------------------
   */
  app.get('/api/notifications', (req: Request, res: Response): any => {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'شناسه کاربر الزامی است' });
    }
    const notifications = dbService.getUserNotifications(userId);
    res.json({ success: true, notifications });
  });

  app.post('/api/notifications/read', (req: Request, res: Response): any => {
    const { id, userId } = req.body;
    if (!id || !userId) {
      return res.status(400).json({ success: false, message: 'اطلاعات ناقص است' });
    }
    const success = dbService.markNotificationRead(id, userId);
    res.json({ success });
  });

  app.post('/api/notifications/clear', (req: Request, res: Response): any => {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'شناسه کاربر الزامی است' });
    }
    const success = dbService.clearNotifications(userId);
    res.json({ success });
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

  app.post('/api/logs', (req: Request, res: Response): any => {
    try {
      const { level, message, details, userId, userName } = req.body || {};
      const userInfo = userName ? ` (کاربر: ${userName})` : userId ? ` (کد کاربر: ${userId})` : '';
      const formattedMsg = `[خطای کاربر/برنامه] ${message || 'خطای غیرمنتظره'}${userInfo}`;
      const log = dbService.addSystemLog(level || 'error', formattedMsg, details || '');
      return res.json({ success: true, log });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  app.delete('/api/admin/logs', (_req: Request, res: Response) => {
    dbService.clearSystemLogs();
    dbService.addSystemLog('info', 'پاک‌سازی لیست لاگ‌های سامانه توسط مدیر');
    res.json({ success: true, message: 'لیست لاگ‌های سامانه با موفقیت پاک شد.' });
  });

  /**
   * --------------------------------------------------------------------------
   * API: پشتیبان‌گیری و بازیابی کل اطلاعات دیتابیس (Backup & Restore System)
   * --------------------------------------------------------------------------
   */
  app.get('/api/admin/backup', (_req: Request, res: Response): any => {
    try {
      const rawData = dbService.getRawDatabase();
      res.setHeader('Content-disposition', `attachment; filename=maktabkhune-backup-${Date.now()}.json`);
      res.setHeader('Content-type', 'application/json');
      return res.send(JSON.stringify(rawData, null, 2));
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'خطا در خروجی گرفتن از اطلاعات: ' + err.message });
    }
  });

  const jsonUpload = multer({ limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB limit

  app.post('/api/admin/restore', jsonUpload.single('backupFile'), (req: Request, res: Response): any => {
    try {
      let rawJson: any = null;

      if (req.file) {
        const fileContent = req.file.buffer.toString('utf-8');
        rawJson = JSON.parse(fileContent);
      } else if (req.body && req.body.backupData) {
        rawJson = typeof req.body.backupData === 'string' ? JSON.parse(req.body.backupData) : req.body.backupData;
      } else if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
        rawJson = req.body;
      }

      if (!rawJson) {
        return res.status(400).json({ success: false, message: 'هیچ فایل پشتیبان یا داده معتبری جهت بازیابی پیدا نشد.' });
      }

      dbService.restoreDatabase(rawJson);
      dbService.addSystemLog('info', 'بازیابی موفقیت‌آمیز کل اطلاعات سامانه از طریق فایل پشتیبان توسط مدیر');
      return res.json({ success: true, message: 'اطلاعات با موفقیت بازیابی شد و آماده استفاده است.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'خطا در بازیابی فایل دیتابیس: ' + err.message });
    }
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
   * API: تست ارسال پیام آزمایشی به کانال بله جهت بررسی دسترسی ادمین بات
   * --------------------------------------------------------------------------
   */
  app.post('/api/admin/bale/test-channel', async (req: Request, res: Response): Promise<void> => {
    try {
      const config = dbService.getSystemConfig();
      let targetChannel = req.body?.channelUsername || config.baleChannelUsername;
      if (!targetChannel || !targetChannel.trim()) {
        res.status(400).json({
          success: false,
          message: 'نام کاربری یا آیدی کانال مشخص نشده است.'
        });
        return;
      }

      targetChannel = targetChannel.trim();
      if (!targetChannel.startsWith('@') && !targetChannel.startsWith('-') && !/^\d+$/.test(targetChannel)) {
        targetChannel = `@${targetChannel}`;
      }

      const originHeader = req.get('origin') || `${req.protocol}://${req.get('host')}`;
      const siteUrl = config.websiteBaseUrl?.trim() || originHeader || process.env.APP_URL || '';

      const testMessage =
        `🔔 <b>تست اتصال و دسترسی بات به کانال مکتب‌خانه</b> ✨\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `✅ بات هوشمند مکتب‌خانه (<code>@${BOT_USERNAME}</code>) با موفقیت به این کانال متصل گردید.\n\n` +
        `📚 از این پس، هر کتاب جدیدی که در سامانه ثبت شود، به‌صورت خودکار همراه با تصویر و مشخصات کامل در این کانال معرفی خواهد شد.\n\n` +
        `⏰ <b>زمان تست:</b> ${new Date().toLocaleTimeString('fa-IR')} - ${new Date().toLocaleDateString('fa-IR')}`;

      const replyMarkup = siteUrl ? {
        inline_keyboard: [
          [{ text: '🎒 ورود به سایت مکتب‌خانه 🏛', url: siteUrl.replace(/\/$/, '') }]
        ]
      } : undefined;

      const baleRes = await sendBaleMessage(targetChannel, testMessage, replyMarkup);

      if (baleRes && baleRes.ok) {
        dbService.addSystemLog(
          'info',
          `تست موفق کانال بله (${targetChannel})`,
          `پیام آزمایشی با موفقیت در کانال ارسال شد.`
        );
        res.json({
          success: true,
          message: `پیام آزمایشی با موفقیت در کانال ${targetChannel} منتشر شد!`,
          baleResponse: baleRes
        });
      } else {
        const errorDesc = baleRes?.description || baleRes?.error || 'خطای دسترسی در بله';
        dbService.addSystemLog(
          'error',
          `خطا در تست کانال بله (${targetChannel})`,
          `پاسخ خطا: ${JSON.stringify(baleRes)}`
        );
        res.status(400).json({
          success: false,
          message: `خطا در ارسال پیام به کانال: مطمئن شوید بازوی @${BOT_USERNAME} به عنوان مدیر (Admin) در کانال عضو شده و دسترسی «ارسال پیام» دارد. جزئیات خطا: ${errorDesc}`,
          baleResponse: baleRes
        });
      }
    } catch (err: any) {
      console.error('Error testing Bale channel:', err);
      res.status(500).json({ success: false, message: err.message || 'خطای سرور' });
    }
  });

  /**
   * --------------------------------------------------------------------------
   * API: انتشار دستی یک کتاب مشخص در کانال بله
   * --------------------------------------------------------------------------
   */
  app.post('/api/admin/bale/publish-book/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const book = dbService.getBookById(req.params.id);
      if (!book) {
        res.status(404).json({ success: false, message: 'کتاب مورد نظر یافت نشد.' });
        return;
      }

      const config = dbService.getSystemConfig();
      const originHeader = req.get('origin') || `${req.protocol}://${req.get('host')}`;
      const siteUrl = req.body?.siteBaseUrl || config.websiteBaseUrl?.trim() || originHeader || process.env.APP_URL || '';

      const publishRes = await publishBookToBaleChannel(book, siteUrl);

      if (publishRes.ok) {
        res.json({
          success: true,
          message: `کتاب «${book.title}» با موفقیت در کانال بله منتشر شد!`,
          withPhoto: publishRes.withPhoto,
          messageId: publishRes.messageId
        });
      } else {
        res.status(400).json({
          success: false,
          message: `خطا در انتشار کتاب در کانال بله: ${publishRes.error || 'دسترسی بات را در کانال بررسی کنید.'}`,
          details: publishRes
        });
      }
    } catch (err: any) {
      console.error('Error publishing book to channel:', err);
      res.status(500).json({ success: false, message: err.message || 'خطای سرور' });
    }
  });

  /**
   * --------------------------------------------------------------------------
   * API: انتشار دسته‌جمعی همه کتاب‌های موجود دیتابیس در کانال بله (Backfill)
   * --------------------------------------------------------------------------
   */
  app.post('/api/admin/bale/publish-all-books', async (req: Request, res: Response): Promise<void> => {
    try {
      const allBooks = dbService.getAllBooks();
      if (!allBooks || allBooks.length === 0) {
        res.json({
          success: true,
          message: 'هیچ کتابی در کتابخانه جهت انتشار وجود ندارد.',
          total: 0,
          successful: 0,
          failed: 0
        });
        return;
      }

      const config = dbService.getSystemConfig();
      const originHeader = req.get('origin') || `${req.protocol}://${req.get('host')}`;
      const siteUrl = req.body?.siteBaseUrl || config.websiteBaseUrl?.trim() || originHeader || process.env.APP_URL || '';

      let successCount = 0;
      let failCount = 0;

      // انتشار ترتیبی با فاصله زمانی کوتاه جهت جلوگیری از محدودیت نرخ (Rate Limit) بله
      for (const book of allBooks) {
        try {
          const pubRes = await publishBookToBaleChannel(book, siteUrl);
          if (pubRes.ok) {
            successCount++;
          } else {
            failCount++;
          }
          // تاخیر ۶۰۰ میلی‌ثانیه‌ای بین هر ارسال
          await new Promise((resolve) => setTimeout(resolve, 600));
        } catch (e) {
          failCount++;
        }
      }

      dbService.addSystemLog(
        'info',
        'انتشار گروهی کتاب‌ها در کانال بله',
        `تعداد کل: ${allBooks.length} | موفق: ${successCount} | ناموفق: ${failCount}`
      );

      res.json({
        success: true,
        message: `عملیات انتشار پایان یافت: ${successCount} کتاب با موفقیت در کانال بله منتشر شد.${failCount > 0 ? ` (${failCount} مورد با خطا مواجه شد)` : ''}`,
        total: allBooks.length,
        successful: successCount,
        failed: failCount
      });
    } catch (err: any) {
      console.error('Error publishing all books to channel:', err);
      res.status(500).json({ success: false, message: err.message || 'خطای سرور' });
    }
  });

  /**
   * --------------------------------------------------------------------------
   * API: دریافت اطلاعات سیستم، دایرکتوری آپلود و وضعیت ذخیره‌سازی
   * --------------------------------------------------------------------------
   */
  app.get(['/api/admin/storage-info', '/api/version', '/version'], (_req: Request, res: Response) => {
    let uploadedFilesCount = 0;
    let uploadDirExists = false;
    try {
      if (fs.existsSync(UPLOADS_DIR)) {
        uploadDirExists = true;
        uploadedFilesCount = fs.readdirSync(UPLOADS_DIR).length;
      }
    } catch (e) {}

    let dbExists = false;
    let dbSize = 0;
    try {
      if (fs.existsSync(DB_PATH)) {
        dbExists = true;
        dbSize = fs.statSync(DB_PATH).size;
      }
    } catch (e) {}

    res.json({
      success: true,
      app: 'MaktabKhaneh',
      version: SERVER_VERSION,
      build_date: BUILD_DATE,
      port: PORT,
      upload_dir: UPLOADS_DIR,
      raw_upload_dir: RAW_UPLOAD_DIR,
      db_path: DB_PATH,
      upload_dir_exists: uploadDirExists,
      db_exists: dbExists,
      db_size_bytes: dbSize,
      total_uploaded_files: uploadedFilesCount,
      is_external_drive: UPLOADS_DIR.startsWith('/media') || UPLOADS_DIR.startsWith('/mnt') || UPLOADS_DIR.includes('external'),
      bot_username: BOT_USERNAME,
      webhook_url: DEFAULT_WEBHOOK_URL,
      database: 'SQLite / JSON Persistent Store',
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

  // Bind to port and 0.0.0.0
  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 سرور مکتب‌خونه با پایگاه داده SQLite و سیستم ذخیره‌سازی تصاویر روی پورت ${PORT} اجرا شد.`);
    console.log(`💾 مسیر دیتابیس (DB_PATH): ${DB_PATH}`);
    console.log(`🖼️ مسیر آپلود تصاویر (UPLOAD_DIR): ${UPLOADS_DIR}`);
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
