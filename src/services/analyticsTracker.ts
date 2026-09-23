/**
 * Client-Side Ultra-Lightweight Analytics Tracker
 * Runs non-blocking heartbeats in background to monitor real metrics:
 * - Active sessions & real-time online presence
 * - Actual device & browser information
 * - Page views & route changes
 * - User engagement duration (in seconds)
 * - Real interactions (search queries, borrow requests, book submissions, reviews, clicks)
 */

class AnalyticsTracker {
  private sessionId: string;
  private intervalId: any = null;
  private currentPath: string = '/';
  private pendingClicksInWindow: number = 0;
  private clickListenerAttached: boolean = false;
  private currentUserInfo: {
    userId?: string;
    userName?: string;
    userRole?: string;
  } = {};

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.initInteractionListeners();
  }

  private initInteractionListeners() {
    if (typeof window === 'undefined' || this.clickListenerAttached) return;
    this.clickListenerAttached = true;

    // Passive click listener on interactive DOM elements
    window.addEventListener(
      'click',
      (e) => {
        const target = e.target as HTMLElement | null;
        if (!target) return;
        const interactive = target.closest('button, a, input, select, textarea, [role="button"], [data-interactive]');
        if (interactive) {
          this.pendingClicksInWindow = Math.min(this.pendingClicksInWindow + 1, 50);
        }
      },
      { passive: true }
    );
  }

  private getOrCreateSessionId(): string {
    try {
      let id = sessionStorage.getItem('maktab_analytics_sess_id');
      if (!id) {
        id = 'sess_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
        sessionStorage.setItem('maktab_analytics_sess_id', id);
      }
      return id;
    } catch {
      return 'sess_' + Math.random().toString(36).substring(2, 11);
    }
  }

  public startHeartbeat(userInfo?: {
    userId?: string;
    userName?: string;
    userRole?: string;
    currentPath?: string;
  }) {
    if (userInfo) {
      this.currentUserInfo = {
        userId: userInfo.userId,
        userName: userInfo.userName,
        userRole: userInfo.userRole
      };
      if (userInfo.currentPath) {
        this.currentPath = userInfo.currentPath;
      }
    }

    // Send immediate initial ping
    this.sendPing(5);

    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    // Ping every 15 seconds (minimal payload: ~150 bytes)
    this.intervalId = setInterval(() => {
      // Only ping if page is currently visible/focused
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        this.sendPing(15);
      }
    }, 15000);
  }

  public setPath(path: string) {
    if (this.currentPath !== path) {
      this.currentPath = path;
      this.sendPing(5);
    }
  }

  public stopHeartbeat() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async sendPing(seconds: number = 15) {
    try {
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
      const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
      const interactions = this.pendingClicksInWindow;
      this.pendingClicksInWindow = 0;

      await fetch('/api/analytics/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          userId: this.currentUserInfo.userId,
          userName: this.currentUserInfo.userName,
          userRole: this.currentUserInfo.userRole,
          currentPath: this.currentPath,
          userAgent,
          screenWidth,
          seconds,
          interactionsCount: interactions
        }),
        keepalive: true
      });
    } catch {
      // Non-blocking silent error
    }
  }

  public async trackEvent(type: string, label: string = '', metadata?: any) {
    try {
      await fetch('/api/analytics/event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          label,
          userId: this.currentUserInfo.userId,
          userName: this.currentUserInfo.userName,
          userRole: this.currentUserInfo.userRole,
          path: this.currentPath,
          metadata
        })
      });
    } catch {
      // Non-blocking silent error
    }
  }

  public trackBookView(bookTitle: string, metadata?: any) {
    this.trackEvent('view_book', bookTitle, metadata);
  }

  public trackSearch(query: string) {
    this.trackEvent('search_book', query);
  }

  public trackCategory(category: string) {
    this.trackEvent('filter_category', category);
  }

  public trackGrade(grade: string) {
    this.trackEvent('filter_grade', grade);
  }

  public trackLoan(bookTitle: string, ownerName?: string) {
    this.trackEvent('borrow_request', `درخواست امانت: ${bookTitle}`, { bookTitle, ownerName });
  }

  public trackReview(bookTitle: string, rating?: number) {
    this.trackEvent('review_book', `ثبت نظر برای «${bookTitle}»`, { rating });
  }
}

export const analyticsTracker = new AnalyticsTracker();


