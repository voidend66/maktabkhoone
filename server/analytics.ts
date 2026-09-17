import fs from 'fs';
import path from 'path';

export interface AnalyticsRecord {
  totalPageViews: number;
  totalTimeSpentSeconds: number;
  totalInteractions: number;
  activeUsersCount: number;
  onlineNow: number;
  dailyTrend: {
    date: string;
    pageViews: number;
    timeSpentMinutes: number;
    interactions: number;
    activeUsers: number;
  }[];
  pathPopularity: { path: string; views: number }[];
  interactionTypes: { type: string; label: string; count: number }[];
  topActiveUsers: {
    name: string;
    minutes: number;
    views: number;
    interactions: number;
    lastSeen: string;
  }[];
  deviceTypes: { device: string; count: number; percentage: number }[];
  browserTypes: { browser: string; count: number; percentage: number }[];
  topSearches: { query: string; count: number }[];
  liveUsers: {
    sessionId: string;
    userName: string;
    userRole: string;
    currentPath: string;
    device: string;
    browser: string;
    connectedMinutes: number;
    lastSeenSecondsAgo: number;
  }[];
  peakHours: { hour: number; hourLabel: string; count: number }[];
}

interface ActiveSession {
  sessionId: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  lastHeartbeat: number;
  firstSeen: number;
  totalSeconds: number;
  pageViews: number;
  currentPath: string;
  userAgent?: string;
  device: string;
  browser: string;
}

interface DailyBucket {
  date: string; // YYYY-MM-DD
  pageViews: number;
  timeSpentSeconds: number;
  interactions: number;
  userSessions: Set<string>;
  hourlyViews: number[]; // 24 hours
  pathViews: Record<string, number>;
  interactionCounts: Record<string, number>;
  deviceCounts: Record<string, number>;
  browserCounts: Record<string, number>;
  searchQueries: Record<string, number>;
  userStats: Record<
    string,
    {
      name: string;
      seconds: number;
      views: number;
      interactions: number;
      lastSeen: number;
    }
  >;
}

export function parseDeviceAndBrowser(
  ua?: string,
  screenWidth?: number
): { device: string; browser: string } {
  if (!ua && !screenWidth) {
    return { device: 'رایانه و لپ‌تاپ 💻', browser: 'مرورگر وب' };
  }

  const userAgent = (ua || '').toLowerCase();
  let device = 'رایانه و لپ‌تاپ 💻';

  if (
    /tablet|ipad|playbook|silk/i.test(userAgent) ||
    (screenWidth && screenWidth >= 768 && screenWidth <= 1024 && /android/i.test(userAgent))
  ) {
    device = 'تبلت 📟';
  } else if (
    /mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(userAgent) ||
    (screenWidth && screenWidth < 768)
  ) {
    device = 'موبایل 📱';
  }

  let browser = 'سایر مرورگرها';
  if (userAgent.includes('bale') || userAgent.includes('ble.ir')) {
    browser = 'پیام‌رسان بله (Webview)';
  } else if (userAgent.includes('shad')) {
    browser = 'پیام‌رسان شاد (Webview)';
  } else if (userAgent.includes('edg')) {
    browser = 'Microsoft Edge';
  } else if (userAgent.includes('chrome') || userAgent.includes('crios')) {
    browser = 'Google Chrome';
  } else if (userAgent.includes('firefox') || userAgent.includes('fxios')) {
    browser = 'Mozilla Firefox';
  } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
    browser = 'Apple Safari';
  }

  return { device, browser };
}

class LightweightAnalyticsManager {
  private activeSessions: Map<string, ActiveSession> = new Map();
  private dailyData: Map<string, DailyBucket> = new Map();
  private filePath: string;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.filePath = path.join(process.cwd(), 'data', 'analytics_cache.json');
    this.ensureDataDir();
    this.loadFromDisk();

    // Clean up dead sessions every 30 seconds
    setInterval(() => this.cleanupExpiredSessions(), 30000);
  }

  private ensureDataDir() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private getTodayKey(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  private getOrCreateDailyBucket(dateStr: string): DailyBucket {
    let bucket = this.dailyData.get(dateStr);
    if (!bucket) {
      bucket = {
        date: dateStr,
        pageViews: 0,
        timeSpentSeconds: 0,
        interactions: 0,
        userSessions: new Set<string>(),
        hourlyViews: new Array(24).fill(0),
        pathViews: {},
        interactionCounts: {},
        deviceCounts: {},
        browserCounts: {},
        searchQueries: {},
        userStats: {}
      };
      this.dailyData.set(dateStr, bucket);
    }
    return bucket;
  }

  public recordHeartbeat(params: {
    sessionId: string;
    userId?: string;
    userName?: string;
    userRole?: string;
    currentPath: string;
    seconds?: number;
    userAgent?: string;
    screenWidth?: number;
  }) {
    const now = Date.now();
    const todayKey = this.getTodayKey();
    const bucket = this.getOrCreateDailyBucket(todayKey);
    const addedSeconds = Math.min(Math.max(params.seconds || 15, 5), 60);

    const { device, browser } = parseDeviceAndBrowser(params.userAgent, params.screenWidth);

    let session = this.activeSessions.get(params.sessionId);
    const isNewPath = session ? session.currentPath !== params.currentPath : true;

    if (!session) {
      session = {
        sessionId: params.sessionId,
        userId: params.userId,
        userName: params.userName || 'کاربر مهمان',
        userRole: params.userRole || 'guest',
        lastHeartbeat: now,
        firstSeen: now,
        totalSeconds: addedSeconds,
        pageViews: 1,
        currentPath: params.currentPath,
        userAgent: params.userAgent,
        device,
        browser
      };
      this.activeSessions.set(params.sessionId, session);
      bucket.pageViews++;
      bucket.deviceCounts[device] = (bucket.deviceCounts[device] || 0) + 1;
      bucket.browserCounts[browser] = (bucket.browserCounts[browser] || 0) + 1;
    } else {
      session.totalSeconds += addedSeconds;
      session.lastHeartbeat = now;
      if (params.userId) session.userId = params.userId;
      if (params.userName) session.userName = params.userName;
      if (params.userRole) session.userRole = params.userRole;
      if (device) session.device = device;
      if (browser) session.browser = browser;

      if (isNewPath) {
        session.currentPath = params.currentPath;
        session.pageViews++;
        bucket.pageViews++;
        bucket.deviceCounts[device] = (bucket.deviceCounts[device] || 0) + 1;
      }
    }

    // Daily totals
    bucket.timeSpentSeconds += addedSeconds;
    bucket.userSessions.add(params.sessionId);

    // Path stats
    const cleanPath = this.normalizePath(params.currentPath);
    bucket.pathViews[cleanPath] = (bucket.pathViews[cleanPath] || 0) + (isNewPath ? 1 : 0);

    // Peak Hour
    const currentHour = new Date().getHours();
    bucket.hourlyViews[currentHour] = (bucket.hourlyViews[currentHour] || 0) + (isNewPath ? 1 : 0);

    // User aggregation
    const userIdentifier = params.userId || params.userName || `guest_${params.sessionId.slice(0, 6)}`;
    const displayName = params.userName || 'کاربر مهمان';

    if (!bucket.userStats[userIdentifier]) {
      bucket.userStats[userIdentifier] = {
        name: displayName,
        seconds: addedSeconds,
        views: isNewPath ? 1 : 0,
        interactions: 0,
        lastSeen: now
      };
    } else {
      const u = bucket.userStats[userIdentifier];
      u.name = displayName;
      u.seconds += addedSeconds;
      if (isNewPath) u.views += 1;
      u.lastSeen = now;
    }

    this.scheduleSave();
  }

  public recordEvent(type: string, label: string, userId?: string, metadata?: any) {
    const todayKey = this.getTodayKey();
    const bucket = this.getOrCreateDailyBucket(todayKey);

    bucket.interactions++;
    bucket.interactionCounts[type] = (bucket.interactionCounts[type] || 0) + 1;

    // Track real search queries
    if ((type === 'search_book' || type === 'search') && label && label.trim()) {
      const q = label.trim();
      bucket.searchQueries[q] = (bucket.searchQueries[q] || 0) + 1;
    }

    if (userId && bucket.userStats[userId]) {
      bucket.userStats[userId].interactions += 1;
      bucket.userStats[userId].lastSeen = Date.now();
    }

    this.scheduleSave();
  }

  private normalizePath(rawPath: string): string {
    if (!rawPath || rawPath === '/' || rawPath === 'library') return 'کتابخانه اصلی و فهرست کتب';
    if (rawPath === 'league') return 'لیگ کتابخوانی و رتبه‌بندی';
    if (rawPath === 'my-books' || rawPath === 'profile') return 'پروفایل و کتاب‌های من';
    if (rawPath === 'requests' || rawPath === 'lending') return 'امانت‌ها و درخواست‌ها';
    if (rawPath === 'rules') return 'قوانین و راهنمای سامانه';
    if (rawPath === 'admin') return 'پنل مدیریت';
    return rawPath;
  }

  private cleanupExpiredSessions() {
    const cutoff = Date.now() - 60000; // 60 seconds without ping = offline
    for (const [key, session] of this.activeSessions.entries()) {
      if (session.lastHeartbeat < cutoff) {
        this.activeSessions.delete(key);
      }
    }
  }

  public getOnlineUsersCount(): number {
    this.cleanupExpiredSessions();
    return this.activeSessions.size;
  }

  public getLiveUsersList() {
    this.cleanupExpiredSessions();
    const now = Date.now();
    return Array.from(this.activeSessions.values()).map((s) => ({
      sessionId: s.sessionId,
      userName: s.userName || 'کاربر مهمان',
      userRole: s.userRole === 'admin' ? 'مدیر سامانه 🛡️' : s.userRole === 'student' ? 'دانش‌آموز 🎒' : 'مهمان 👤',
      currentPath: this.normalizePath(s.currentPath),
      device: s.device,
      browser: s.browser,
      connectedMinutes: Math.max(1, Math.round((s.totalSeconds / 60) * 10) / 10),
      lastSeenSecondsAgo: Math.max(0, Math.floor((now - s.lastHeartbeat) / 1000))
    }));
  }

  public getSummary(daysCount: number = 7): AnalyticsRecord {
    this.cleanupExpiredSessions();

    const dates: string[] = [];
    const now = new Date();
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      dates.push(d.toISOString().split('T')[0]);
    }

    let totalViews = 0;
    let totalSeconds = 0;
    let totalInteractions = 0;
    const activeSessionsSet = new Set<string>();

    const pathTotals: Record<string, number> = {};
    const interactionTotals: Record<string, number> = {};
    const deviceTotals: Record<string, number> = {};
    const browserTotals: Record<string, number> = {};
    const searchTotals: Record<string, number> = {};
    const hourlyTotals: number[] = new Array(24).fill(0);
    const userTotals: Record<
      string,
      {
        name: string;
        seconds: number;
        views: number;
        interactions: number;
        lastSeen: number;
      }
    > = {};

    const dailyTrend = dates.map((dateStr) => {
      const bucket = this.dailyData.get(dateStr);
      const views = bucket ? bucket.pageViews : 0;
      const seconds = bucket ? bucket.timeSpentSeconds : 0;
      const interactions = bucket ? bucket.interactions : 0;
      const activeUsers = bucket ? bucket.userSessions.size : 0;

      totalViews += views;
      totalSeconds += seconds;
      totalInteractions += interactions;

      if (bucket) {
        bucket.userSessions.forEach((s) => activeSessionsSet.add(s));

        // Paths
        for (const [p, count] of Object.entries(bucket.pathViews || {})) {
          pathTotals[p] = (pathTotals[p] || 0) + count;
        }

        // Interactions
        for (const [t, count] of Object.entries(bucket.interactionCounts || {})) {
          interactionTotals[t] = (interactionTotals[t] || 0) + count;
        }

        // Devices
        for (const [dev, count] of Object.entries(bucket.deviceCounts || {})) {
          deviceTotals[dev] = (deviceTotals[dev] || 0) + count;
        }

        // Browsers
        for (const [b, count] of Object.entries(bucket.browserCounts || {})) {
          browserTotals[b] = (browserTotals[b] || 0) + count;
        }

        // Searches
        for (const [q, count] of Object.entries(bucket.searchQueries || {})) {
          searchTotals[q] = (searchTotals[q] || 0) + count;
        }

        // Hourly
        (bucket.hourlyViews || []).forEach((count, h) => {
          hourlyTotals[h] += count || 0;
        });

        // Users
        for (const [uid, u] of Object.entries(bucket.userStats || {})) {
          if (!userTotals[uid]) {
            userTotals[uid] = { ...u };
          } else {
            userTotals[uid].seconds += u.seconds;
            userTotals[uid].views += u.views;
            userTotals[uid].interactions += u.interactions;
            userTotals[uid].lastSeen = Math.max(userTotals[uid].lastSeen, u.lastSeen);
          }
        }
      }

      const pDate = this.formatPersianDate(dateStr);
      return {
        date: pDate,
        pageViews: views,
        timeSpentMinutes: Math.round((seconds / 60) * 10) / 10,
        interactions,
        activeUsers
      };
    });

    // Top active users
    const topActiveUsers = Object.values(userTotals)
      .sort((a, b) => b.seconds - a.seconds)
      .slice(0, 8)
      .map((u) => ({
        name: u.name,
        minutes: Math.round((u.seconds / 60) * 10) / 10,
        views: u.views,
        interactions: u.interactions,
        lastSeen: this.formatTimeAgo(u.lastSeen)
      }));

    // Path Popularity
    const pathPopularity = Object.entries(pathTotals)
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 8);

    // Interaction Types map labels
    const eventLabels: Record<string, string> = {
      view_book: 'مشاهده جزئیات کتاب 📖',
      search_book: 'جستجوی کتاب‌ها 🔍',
      search: 'جستجوی کتاب‌ها 🔍',
      borrow_request: 'ثبت درخواست امانت 🤝',
      approve_request: 'تایید امانت توسط مالک ✅',
      add_book: 'ثبت و اهدای کتاب جدید ➕',
      review_book: 'ثبت نظر و ارزیابی ⭐',
      login: 'ورود به حساب کاربری 🔐',
      register: 'ثبت‌نام دانش‌آموز جدید 🎓',
      filter_category: 'فیلتر موضوعی کتابخانه 🏷️'
    };

    const interactionTypes = Object.entries(interactionTotals)
      .map(([type, count]) => ({
        type,
        label: eventLabels[type] || type,
        count
      }))
      .sort((a, b) => b.count - a.count);

    // Real Device Types Breakdown
    const totalDeviceCounts = Object.values(deviceTotals).reduce((a, b) => a + b, 0);
    const deviceTypes = Object.entries(deviceTotals)
      .map(([device, count]) => ({
        device,
        count,
        percentage: totalDeviceCounts > 0 ? Math.round((count / totalDeviceCounts) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);

    // Real Browser Types Breakdown
    const totalBrowserCounts = Object.values(browserTotals).reduce((a, b) => a + b, 0);
    const browserTypes = Object.entries(browserTotals)
      .map(([browser, count]) => ({
        browser,
        count,
        percentage: totalBrowserCounts > 0 ? Math.round((count / totalBrowserCounts) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);

    // Real Top Searches
    const topSearches = Object.entries(searchTotals)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Peak hours
    const peakHours = hourlyTotals.map((count, hour) => {
      const start = String(hour).padStart(2, '0');
      const end = String((hour + 1) % 24).padStart(2, '0');
      return {
        hour,
        hourLabel: `${this.toPersianDigits(start)}:۰۰ تا ${this.toPersianDigits(end)}:۰۰`,
        count
      };
    });

    return {
      totalPageViews: totalViews,
      totalTimeSpentSeconds: totalSeconds,
      totalInteractions: totalInteractions,
      activeUsersCount: activeSessionsSet.size || Object.keys(userTotals).length,
      onlineNow: this.getOnlineUsersCount(),
      dailyTrend,
      pathPopularity,
      interactionTypes,
      topActiveUsers,
      deviceTypes,
      browserTypes,
      topSearches,
      liveUsers: this.getLiveUsersList(),
      peakHours
    };
  }

  private formatPersianDate(isoDate: string): string {
    try {
      const parts = isoDate.split('-');
      if (parts.length === 3) {
        const d = new Date(isoDate);
        return new Intl.DateTimeFormat('fa-IR', {
          month: '2-digit',
          day: '2-digit',
          calendar: 'persian'
        }).format(d);
      }
    } catch {
      // fallback
    }
    return isoDate;
  }

  private formatTimeAgo(timestamp: number): string {
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return 'لحظاتی پیش';
    if (diffSec < 3600) return `${this.toPersianDigits(Math.floor(diffSec / 60))} دقیقه پیش`;
    if (diffSec < 86400) return `${this.toPersianDigits(Math.floor(diffSec / 3600))} ساعت پیش`;
    return `${this.toPersianDigits(Math.floor(diffSec / 86400))} روز پیش`;
  }

  private toPersianDigits(str: string | number): string {
    const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(str).replace(/\d/g, (x) => farsiDigits[parseInt(x, 10)]);
  }

  private scheduleSave() {
    if (this.saveTimeout) return;
    this.saveTimeout = setTimeout(() => {
      this.saveToDisk();
      this.saveTimeout = null;
    }, 5000);
  }

  private saveToDisk() {
    try {
      const raw: Record<string, any> = {};
      for (const [k, v] of this.dailyData.entries()) {
        raw[k] = {
          ...v,
          userSessions: Array.from(v.userSessions)
        };
      }
      fs.writeFileSync(this.filePath, JSON.stringify(raw, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Analytics] Failed to save cache:', err);
    }
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.filePath)) {
        const content = fs.readFileSync(this.filePath, 'utf-8');
        const raw = JSON.parse(content);
        for (const [k, v] of Object.entries(raw)) {
          const item = v as any;
          this.dailyData.set(k, {
            ...item,
            userSessions: new Set(item.userSessions || []),
            deviceCounts: item.deviceCounts || {},
            browserCounts: item.browserCounts || {},
            searchQueries: item.searchQueries || {}
          });
        }
      }
    } catch (err) {
      console.error('[Analytics] Failed to load cache:', err);
    }
  }
}

export const analytics = new LightweightAnalyticsManager();
