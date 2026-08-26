import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import crypto from 'crypto';

// بارگذاری متغیرهای محیطی
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

// آدرس وبهوک پیش‌فرض روی دامنه HTTPS
const DEFAULT_WEBHOOK_URL =
  process.env.BALE_WEBHOOK_URL ||
  (process.env.APP_URL ? `${process.env.APP_URL.replace(/\/$/, '')}/api/bale-webhook` : 'https://maktabkhune.ir/api/bale-webhook');

const SERVER_VERSION = '2.4.0';
const BUILD_DATE = '2026-08-26';

// پورت سرور: در صورت تعریف در متغیر محیطی PORT استفاده می‌شود (مثلاً 8098 روی سرور شما)
const PORT = Number(process.env.PORT) || 3000;

/**
 * ساختار داده نشست احراز هویت OTP
 */
export interface OtpSession {
  sessionId: string; // شناسه یکتای نشست
  phoneNumber: string; // شماره تلفن نرمال‌شده (مثلاً 989123456789)
  originalPhone: string; // شماره وارد شده توسط کاربر (مثلاً 09123456789)
  otpCode: string; // کد تایید ۵ رقمی تصادفی
  createdAt: number; // زمان ایجاد (میلی‌ثانیه)
  expiresAt: number; // زمان انقضا (۵ دقیقه بعد)
  chatId?: number | string; // شناسه چت کاربر در بله
  status:
    | 'PENDING_START' // در انتظار کلیک روی لینک بله و ارسال /start
    | 'STARTED' // کاربر دستور /start را ارسال کرده و دکمه ارسال شماره برایش نمایش داده شده
    | 'CODE_SENT' // شماره کاربر تایید و کد ۵ رقمی در بله ارسال شد
    | 'VERIFIED' // کد در سایت با موفقیت تایید شد
    | 'PHONE_MISMATCH' // شماره حساب بله کاربر با شماره وارد شده در سایت یکسان نبود
    | 'EXPIRED'; // زمان نشست منقضی شد
  attempts: number; // تعداد دفعات تلاش برای ورود کد
  verifiedAt?: number; // زمان تایید نهایی
}

/**
 * حافظه موقت نگهداری نشست‌ها (In-Memory Session Store)
 */
const otpSessions = new Map<string, OtpSession>();

// نقشه کمکی برای یافتن سریع نشست فعال بر اساس chatId
const chatToSessionMap = new Map<string | number, string>();

/**
 * ============================================================================
 * توابع کمکی (Helper Functions)
 * ============================================================================
 */

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
 * نرمال‌سازی شماره موبایل به فرمت استاندارد 989123456789
 * ورودی‌های مختلف: 0912..., +98912..., 0098912..., 912...
 */
export function normalizePhoneNumber(phone: string): string | null {
  if (!phone) return null;
  let cleaned = toEnglishDigits(phone).replace(/[\s\-\(\)\+]/g, '');

  // حذف پیشوندهای بین‌المللی 00 یا +
  if (cleaned.startsWith('0098')) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('098')) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith('09')) {
    // 09123456789 -> 989123456789
    cleaned = '98' + cleaned.substring(1);
  } else if (cleaned.startsWith('9') && cleaned.length === 10) {
    // 9123456789 -> 989123456789
    cleaned = '98' + cleaned;
  }

  // بررسی اعتبار نهایی شماره موبایل ایران (۱۲ رقم: 989XXXXXXXXX)
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

/**
 * پاکسازی دوره‌ای نشست‌های منقضی‌شده (هر ۶۰ ثانیه)
 */
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
 * ============================================================================
 * کلاینت ارتباط با API پیام‌رسان بله (Bale Bot API Client)
 * ============================================================================
 */

/**
 * ارسال درخواست به متدهای API بله
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

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`[Bale API Error] Failed to call ${method}:`, error);
    return { ok: false, error };
  }
}

/**
 * متد کمکی برای ارسال پیام متنی با کیبورد دلخواه در بله
 */
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
 * تنظیم وبهوک در سرورهای بله (Set Webhook)
 */
export async function setBaleWebhook(webhookUrl: string) {
  console.log(`🌐 [Bale Webhook] در حال تنظیم Webhook روی آدرس: ${webhookUrl}`);
  const result = await callBaleApi('setWebhook', { url: webhookUrl });
  console.log('📌 [Bale Webhook Response]:', result);
  return result;
}

/**
 * دریافت اطلاعات وبهوک جاری از بله (Get Webhook Info)
 */
export async function getBaleWebhookInfo() {
  return await callBaleApi('getWebhookInfo');
}

/**
 * ============================================================================
 * منطق پردازش پیام‌های دریافتی از طریق Webhook
 * ============================================================================
 */
export async function handleIncomingBaleMessage(message: any) {
  const chatId = message.chat?.id || message.from?.id;
  if (!chatId) return;

  const text = (message.text || '').trim();

  // ۱) پردازش دستور /start (ورود با شناسه نشست: /start SESSION_ID)
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

      // ارسال کیبورد دکمه اشتراک‌گذاری شماره همراه (request_contact)
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
        `⚠️ <b>نشست احراز هویت یافت نشد یا منقضی شده است.</b>\n\n` +
        `لطفاً به سایت مکتب‌خونه مراجعه کرده و مجدداً شماره همراه خود را وارد نمایید.`;

      await sendBaleMessage(chatId, notFoundText, {
        remove_keyboard: true,
      });
      return;
    }
  }

  // ۲) پردازش دریافت آبجکت Contact (اشتراک‌گذاری شماره همراه)
  if (message.contact) {
    const contact = message.contact;
    const rawContactPhone = contact.phone_number || '';
    const normalizedContactPhone = normalizePhoneNumber(rawContactPhone);

    const activeSessionId = chatToSessionMap.get(chatId);
    const session = activeSessionId ? otpSessions.get(activeSessionId) : null;

    if (!session || session.expiresAt < Date.now()) {
      await sendBaleMessage(
        chatId,
        '⚠️ زمان نشست احراز هویت شما منقضی شده است. لطفاً از طریق سایت مجدداً درخواست ارسال نمایید.',
        { remove_keyboard: true }
      );
      return;
    }

    // تطابق شماره ارسال شده در بله با شماره ثبت‌شده در سایت
    if (
      normalizedContactPhone &&
      normalizedContactPhone === session.phoneNumber
    ) {
      // ✅ شماره مطابقت دارد -> ارسال کد تایید ۵ رقمی به کاربر در بله
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
    } else {
      // ❌ عدم تطابق شماره
      session.status = 'PHONE_MISMATCH';

      const mismatchText =
        `❌ <b>عدم تطابق شماره همراه!</b>\n\n` +
        `شماره حساب بله شما (<code>${rawContactPhone}</code>) با شماره وارد شده در سایت (<code>${session.originalPhone}</code>) مطابقت ندارد.\n\n` +
        `💡 لطفاً یا با حسابی در بله وارد شوید که شماره آن یکسان است، یا در سایت شماره مربوط به این حساب بله را وارد فرمایید.`;

      await sendBaleMessage(chatId, mismatchText, {
        remove_keyboard: true,
      });
    }
    return;
  }

  // ۳) پیام‌های متفرقه دیگر
  const helpText =
    `🎒 <b>بات احراز هویت «مکتب‌خونه»</b>\n\n` +
    `برای ورود یا ثبت‌نام، ابتدا شماره همراه خود را در سایت وارد نمایید و سپس روی پیوند ورود به بله کلیک کنید.`;

  await sendBaleMessage(chatId, helpText);
}

/**
 * ============================================================================
 * راه‌اندازی سرور Express و مسیرهای API
 * ============================================================================
 */
async function startServer() {
  const app = express();

  // فعال‌سازی CORS برای تمام درخواست‌ها
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

  // فعال‌سازی پارسر JSON و Urlencoded با سقف مناسب
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  /**
   * --------------------------------------------------------------------------
   * Webhook API: دریافت آپدیت‌های ارسالی از پیام‌رسان بله (POST /api/bale-webhook)
   * --------------------------------------------------------------------------
   */
  app.post('/api/bale-webhook', async (req: Request, res: Response): Promise<void> => {
    // پاسخ فوری 200 OK به سرور بله جهت جلوگیری از تکرار درخواست
    res.status(200).json({ ok: true });

    try {
      const update = req.body;
      if (!update) return;

      // پردازش پیام دریافتی (مستقیم یا داخل message)
      if (update.message) {
        await handleIncomingBaleMessage(update.message);
      } else if (update.edited_message) {
        await handleIncomingBaleMessage(update.edited_message);
      }
    } catch (err) {
      console.error('[Webhook Processing Error]:', err);
    }
  });

  /**
   * --------------------------------------------------------------------------
   * API ۱: ثبت درخواست کد تایید (POST /api/request-otp)
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

      // نرمال‌سازی شماره موبایل
      const normalized = normalizePhoneNumber(phone);
      if (!normalized) {
        return res.status(400).json({
          success: false,
          message: 'فرمت شماره تلفن همراه نامعتبر است. نمونه صحیح: 09123456789',
        });
      }

      // تولید شناسه نشست و کد ۵ رقمی
      const sessionId = crypto.randomBytes(12).toString('hex');
      const otpCode = generateOtpCode();
      const now = Date.now();
      const expiresAt = now + 5 * 60 * 1000; // ۵ دقیقه

      // ایجاد و ذخیره نشست در حافظه
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

      // لینک‌های اتصال به بات بله
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
        expires_in: 300, // ثانیه
        message:
          'درخواست با موفقیت ثبت شد. لطفاً وارد ربات بله شوید و شماره خود را ارسال کنید.',
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
   * API ۲: تایید کد OTP وارد شده توسط کاربر (POST /api/verify-otp)
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
          message:
            'نشست احراز هویت یافت نشد یا منقضی شده است. لطفاً مجدداً شماره خود را وارد نمایید.',
        });
      }

      // بررسی انقضای زمان
      if (Date.now() > session.expiresAt) {
        session.status = 'EXPIRED';
        return res.status(400).json({
          success: false,
          message: 'کد تایید منقضی شده است (مهلت ۵ دقیقه به پایان رسیده است).',
        });
      }

      // افزایش شمارنده تلاش‌ها جهت جلوگیری از Brute-force
      session.attempts += 1;
      if (session.attempts > 5) {
        otpSessions.delete(session_id);
        return res.status(429).json({
          success: false,
          message:
            'تعداد دفعات ورود اشتباه بیش از حد مجاز بود. لطفاً مجدداً درخواست ارسال کنید.',
        });
      }

      // تبدیل رقم‌های ورودی به انگلیسی و مقایسه
      const cleanUserOtp = toEnglishDigits(String(user_otp)).trim();

      if (cleanUserOtp !== session.otpCode) {
        return res.status(400).json({
          success: false,
          message: 'کد تایید وارد شده نادرست است. لطفاً مجدداً بررسی فرمایید.',
        });
      }

      // ✅ تایید موفقیت‌آمیز کد
      session.status = 'VERIFIED';
      session.verifiedAt = Date.now();

      // ساخت توکن احراز هویت
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
   * API ۳: بررسی وضعیت لحظه‌ای نشست (GET /api/otp-status/:sessionId)
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
   * API ۴: تنظیم دستی یا خودکار Webhook بله (POST /api/set-bale-webhook)
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
   * API ۵: بررسی وضعیت سلامت بات و Webhook بله (GET /api/bale-bot-status)
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
   * API ۶: دریافت نسخه و وضعیت سرور (GET /api/version و /version)
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
      uptime_seconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * --------------------------------------------------------------------------
   * Fallback اختصاصی برای مسیرهای نامعتبر /api/* (همیشه خروجی JSON بازمی‌گرداند)
   * جلوگیری از بازگشت خروجی HTML <pre> و ایجاد خطای JSON.parse در فرانت‌اند
   * --------------------------------------------------------------------------
   */
  app.all('/api/*', (req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: `مسیر API درخواستی (${req.method} ${req.path}) یافت نشد.`,
    });
  });

  /**
   * --------------------------------------------------------------------------
   * اتصال Vite Middleware در حالت توسعه یا فایل‌های استاتیک در حالت تولید
   * --------------------------------------------------------------------------
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

  // راه‌اندازی سرور روی پورت 3000 و هوست 0.0.0.0
  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 سرور مکتب‌خونه با موفقیت روی پورت ${PORT} اجرا شد.`);
    console.log(`🔗 آدرس محلی: http://localhost:${PORT}`);
    console.log(`🤖 متصل به بات بله: @${BOT_USERNAME}`);
    console.log(`🌐 حالت فعال: Webhook (${DEFAULT_WEBHOOK_URL})`);

    // تلاش برای ثبت خودکار Webhook در سرورهای بله هنگام استارت سرور
    try {
      if (DEFAULT_WEBHOOK_URL && DEFAULT_WEBHOOK_URL.startsWith('https://')) {
        await setBaleWebhook(DEFAULT_WEBHOOK_URL);
      }
    } catch (webhookErr) {
      console.warn('⚠️ توجه: امکان ثبت خودکار Webhook در استارت اولیه وجود نداشت:', webhookErr);
    }
  });
}

// استارت اپلیکیشن
startServer().catch((err) => {
  console.error('خطای بحرانی در اجرای سرور:', err);
});
