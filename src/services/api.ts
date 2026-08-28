import {
  User,
  Book,
  LendingRequest,
  SchoolClass,
  MutualFeedback,
  BankCardInfo,
  RegistrationInput,
  BookReview,
  SystemConfig,
  CustomAvatar
} from '../types';

const API_BASE = '/api';

export interface BootstrapResponse {
  users: User[];
  books: Book[];
  requests: LendingRequest[];
  schoolClasses: SchoolClass[];
  feedbacks: MutualFeedback[];
  bankCardInfo: BankCardInfo;
  systemConfig?: SystemConfig;
  customAvatars?: CustomAvatar[];
  systemLogs?: any[];
}

export const api = {
  // Bootstrap all database data
  async getBootstrap(): Promise<BootstrapResponse | null> {
    try {
      const res = await fetch(`${API_BASE}/bootstrap`);
      if (!res.ok) throw new Error('Bootstrap failed');
      const data = await res.json();
      return data.data;
    } catch (err) {
      console.warn('API getBootstrap error, using local fallback:', err);
      return null;
    }
  },

  // Upload image to server disk storage (returns /uploads/filename.ext)
  async uploadImage(file: File): Promise<{ success: boolean; fileUrl?: string; message?: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, message: data.message || 'خطا در آپلود تصویر' };
      }

      return { success: true, fileUrl: data.fileUrl };
    } catch (err: any) {
      console.error('Upload API error:', err);
      return { success: false, message: err.message || 'خطا در ارتباط با سرور آپلود' };
    }
  },

  // Auth APIs
  async register(data: RegistrationInput): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message || 'خطا در ارتباط با سرور' };
    }
  },

  async login(phone: string, pass: string): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password: pass })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message || 'خطا در ورود' };
    }
  },

  async baleLogin(phone: string): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      const res = await fetch(`${API_BASE}/auth/bale-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message || 'خطا در ورود بله' };
    }
  },

  // Users APIs
  async updateUser(id: string, data: Partial<User>) {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async approveUser(id: string) {
    const res = await fetch(`${API_BASE}/users/${id}/approve`, { method: 'POST' });
    return await res.json();
  },

  async rejectUser(id: string, reason?: string) {
    const res = await fetch(`${API_BASE}/users/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    return await res.json();
  },

  async suspendUser(id: string, reason: string) {
    const res = await fetch(`${API_BASE}/users/${id}/suspend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    return await res.json();
  },

  async unsuspendUser(id: string) {
    const res = await fetch(`${API_BASE}/users/${id}/unsuspend`, { method: 'POST' });
    return await res.json();
  },

  async sendBaleMessageToStudent(id: string, message: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`${API_BASE}/users/${id}/send-bale-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message || 'خطا در ارسال پیام به بله' };
    }
  },

  async deleteUser(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/users/${id}`, {
        method: 'DELETE'
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message || 'خطا در حذف کاربر' };
    }
  },

  async makeAdmin(id: string): Promise<{ success: boolean; message?: string; user?: any }> {
    try {
      const res = await fetch(`${API_BASE}/users/${id}/make-admin`, { method: 'POST' });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message || 'خطا در ترفیع کاربر به مدیر' };
    }
  },

  async addAdminByPhone(data: { phone: string; name?: string; password?: string }): Promise<{ success: boolean; message?: string; user?: any }> {
    try {
      const res = await fetch(`${API_BASE}/admin/add-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message || 'خطا در ثبت مدیر جدید' };
    }
  },

  // Books APIs
  async createBook(book: Book) {
    const res = await fetch(`${API_BASE}/books`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(book)
    });
    return await res.json();
  },

  async updateBook(id: string, data: Partial<Book>) {
    const res = await fetch(`${API_BASE}/books/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async deleteBook(id: string) {
    const res = await fetch(`${API_BASE}/books/${id}`, { method: 'DELETE' });
    return await res.json();
  },

  async reviewBook(id: string, review: BookReview) {
    const res = await fetch(`${API_BASE}/books/${id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ review })
    });
    return await res.json();
  },

  async deleteBookReview(bookId: string, reviewId: string) {
    const res = await fetch(`${API_BASE}/books/${bookId}/reviews/${reviewId}`, {
      method: 'DELETE'
    });
    return await res.json();
  },

  // Requests APIs
  async createRequest(bookId: string, borrowerId: string) {
    const res = await fetch(`${API_BASE}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId, borrowerId })
    });
    return await res.json();
  },

  async acceptRequest(id: string, pickupLocation: string, pickupTime: string, pickupShift: string) {
    const res = await fetch(`${API_BASE}/requests/${id}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pickupLocation, pickupTime, pickupShift })
    });
    return await res.json();
  },

  async rejectRequest(id: string) {
    const res = await fetch(`${API_BASE}/requests/${id}/reject`, { method: 'POST' });
    return await res.json();
  },

  async submitPaymentProof(id: string, trackingCode: string, paymentDate: string, receiptImage?: string) {
    const res = await fetch(`${API_BASE}/requests/${id}/payment-proof`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackingCode, paymentDate, receiptImage })
    });
    return await res.json();
  },

  async approvePayment(id: string) {
    const res = await fetch(`${API_BASE}/requests/${id}/approve-payment`, { method: 'POST' });
    return await res.json();
  },

  async rejectPayment(id: string, reason?: string) {
    const res = await fetch(`${API_BASE}/requests/${id}/reject-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    return await res.json();
  },

  async confirmHandover(id: string, role: string) {
    const res = await fetch(`${API_BASE}/requests/${id}/handover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    return await res.json();
  },

  async returnAndFeedback(
    id: string,
    payload?: { feedback?: MutualFeedback; isDamaged?: boolean; damageReason?: string; damagePhotoUrl?: string } | MutualFeedback
  ) {
    let bodyData: any = {};
    if (payload && 'rating' in payload && 'comment' in payload) {
      bodyData = { feedback: payload };
    } else if (payload) {
      bodyData = payload;
    }

    const res = await fetch(`${API_BASE}/requests/${id}/return-and-feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData)
    });
    return await res.json();
  },

  async reportDamage(id: string, borrowerId: string, damageReason: string, damagePhotoUrl?: string) {
    const res = await fetch(`${API_BASE}/requests/${id}/report-damage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ borrowerId, damageReason, damagePhotoUrl })
    });
    return await res.json();
  },

  // Classes APIs
  async createClass(name: string, grade: string, isExternal?: boolean) {
    const res = await fetch(`${API_BASE}/classes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, grade, isExternal })
    });
    return await res.json();
  },

  async deleteClass(id: string) {
    const res = await fetch(`${API_BASE}/classes/${id}`, { method: 'DELETE' });
    return await res.json();
  },

  // Feedbacks APIs
  async createFeedback(feedback: MutualFeedback) {
    const res = await fetch(`${API_BASE}/feedbacks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedback)
    });
    return await res.json();
  },

  async deleteFeedback(id: string) {
    const res = await fetch(`${API_BASE}/feedbacks/${id}`, {
      method: 'DELETE'
    });
    return await res.json();
  },

  // Notification APIs
  async getNotifications(userId: string) {
    try {
      const res = await fetch(`${API_BASE}/notifications?userId=${encodeURIComponent(userId)}`);
      return await res.json();
    } catch {
      return { success: false, notifications: [] };
    }
  },

  async markNotificationRead(id: string, userId: string) {
    try {
      const res = await fetch(`${API_BASE}/notifications/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, userId })
      });
      return await res.json();
    } catch {
      return { success: false };
    }
  },

  async clearNotifications(userId: string) {
    try {
      const res = await fetch(`${API_BASE}/notifications/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      return await res.json();
    } catch {
      return { success: false };
    }
  },

  // Bank Card APIs
  async updateBankCard(info: BankCardInfo) {
    const res = await fetch(`${API_BASE}/bank-card`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(info)
    });
    return await res.json();
  },

  // System Config APIs
  async getSystemConfig(): Promise<{ success: boolean; config?: SystemConfig }> {
    try {
      const res = await fetch(`${API_BASE}/settings/config`);
      return await res.json();
    } catch (e: any) {
      return { success: false };
    }
  },

  async updateSystemConfig(config: Partial<SystemConfig>): Promise<{ success: boolean; message?: string; config?: SystemConfig }> {
    try {
      const res = await fetch(`${API_BASE}/settings/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message || 'خطا در ارتباط با سرور' };
    }
  },

  // Bale Channel APIs
  async testBaleChannel(channelUsername?: string): Promise<{ success: boolean; message: string; baleResponse?: any }> {
    try {
      const res = await fetch(`${API_BASE}/admin/bale/test-channel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelUsername })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message || 'خطا در ارتباط با سرور' };
    }
  },

  async publishBookToBale(bookId: string, siteBaseUrl?: string): Promise<{ success: boolean; message: string; withPhoto?: boolean }> {
    try {
      const res = await fetch(`${API_BASE}/admin/bale/publish-book/${bookId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteBaseUrl })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message || 'خطا در ارتباط با سرور' };
    }
  },

  async publishAllBooksToBale(siteBaseUrl?: string): Promise<{ success: boolean; message: string; total: number; successful: number; failed: number }> {
    try {
      const res = await fetch(`${API_BASE}/admin/bale/publish-all-books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteBaseUrl })
      });
      return await res.json();
    } catch (e: any) {
      return {
        success: false,
        message: e.message || 'خطا در ارتباط با سرور',
        total: 0,
        successful: 0,
        failed: 0
      };
    }
  },

  // Custom Avatars Management
  async addCustomAvatar(name: string, url: string, bg?: string): Promise<CustomAvatar | null> {
    try {
      const res = await fetch(`${API_BASE}/avatars`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, url, bg })
      });
      if (!res.ok) throw new Error('Failed to add avatar');
      const data = await res.json();
      return data.avatar;
    } catch (err) {
      console.error('API addCustomAvatar error:', err);
      return null;
    }
  },

  async deleteCustomAvatar(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/avatars/${id}`, {
        method: 'DELETE'
      });
      return res.ok;
    } catch (err) {
      console.error('API deleteCustomAvatar error:', err);
      return false;
    }
  },

  // Report Client Error to System Admin Logs
  async reportError(
    message: string,
    details?: string,
    level: 'error' | 'warn' | 'info' = 'error',
    user?: { id?: string; name?: string }
  ) {
    try {
      await fetch(`${API_BASE}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level,
          message,
          details,
          userId: user?.id,
          userName: user?.name
        })
      });
    } catch (err) {
      console.warn('Could not report error to system logs:', err);
    }
  },

  // Get Server Storage & Path Info
  async getStorageInfo(): Promise<{
    success: boolean;
    upload_dir?: string;
    raw_upload_dir?: string;
    db_path?: string;
    port?: number | string;
    upload_dir_exists?: boolean;
    db_exists?: boolean;
    db_size_bytes?: number;
    total_uploaded_files?: number;
    is_external_drive?: boolean;
  } | null> {
    try {
      const res = await fetch(`${API_BASE}/admin/storage-info`);
      if (!res.ok) throw new Error('Failed to fetch storage info');
      return await res.json();
    } catch (err) {
      console.warn('API getStorageInfo error:', err);
      return null;
    }
  }
};
