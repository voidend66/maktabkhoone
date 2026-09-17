import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { GoogleDriveBackupLog, GoogleDriveConfig, SystemConfig } from '../src/types';

const ROOT_FOLDER_NAME = 'MaktabKhaneh_Backups';
const DB_FOLDER_NAME = 'Database_Snapshots';
const PHOTOS_FOLDER_NAME = 'Uploaded_Photos';

interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
}

interface ManifestEntry {
  hash: string;
  size: number;
  driveFileId: string;
  uploadedAt: string;
}

interface SyncManifest {
  lastUpdated: string;
  syncedFiles: Record<string, ManifestEntry>;
}

export class GoogleDriveBackupService {
  private static isRunning = false;
  private static manifestPath: string = '';

  private static getManifestPath(dataDir: string): string {
    if (!this.manifestPath) {
      this.manifestPath = path.join(dataDir, 'gdrive_sync_manifest.json');
    }
    return this.manifestPath;
  }

  private static loadManifest(dataDir: string): SyncManifest {
    const p = this.getManifestPath(dataDir);
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('⚠️ [GDrive] Could not read manifest file, initializing fresh:', e);
    }
    return { lastUpdated: new Date().toISOString(), syncedFiles: {} };
  }

  private static saveManifest(dataDir: string, manifest: SyncManifest): void {
    const p = this.getManifestPath(dataDir);
    try {
      const dir = path.dirname(p);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(p, JSON.stringify(manifest, null, 2), 'utf-8');
    } catch (e) {
      console.error('❌ [GDrive] Failed to save sync manifest:', e);
    }
  }

  private static computeFileHash(filePath: string): string {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      return crypto.createHash('md5').update(fileBuffer).digest('hex');
    } catch (e) {
      return '';
    }
  }

  /**
   * Helper: Calls Google Drive REST API v3
   */
  private static async callDriveApi(
    accessToken: string,
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const url = endpoint.startsWith('http') ? endpoint : `https://www.googleapis.com/drive/v3/${endpoint}`;
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      ...(options.headers || {})
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      let errBody = '';
      try {
        const json = await response.json();
        errBody = json.error?.message || JSON.stringify(json);
      } catch {
        errBody = await response.text();
      }
      throw new Error(`Google Drive API error (${response.status}): ${errBody}`);
    }

    if (response.status === 204) return true;
    return await response.json();
  }

  /**
   * Search for a folder or create it if not found
   */
  public static async getOrCreateFolder(
    accessToken: string,
    folderName: string,
    parentFolderId?: string
  ): Promise<{ id: string; name: string; webViewLink?: string }> {
    let query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    if (parentFolderId) {
      query += ` and '${parentFolderId}' in parents`;
    }

    const searchUrl = `files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink)&spaces=drive`;
    const searchRes = await this.callDriveApi(accessToken, searchUrl);

    if (searchRes.files && searchRes.files.length > 0) {
      return searchRes.files[0];
    }

    // Create folder
    const metadata: any = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder'
    };
    if (parentFolderId) {
      metadata.parents = [parentFolderId];
    }

    const createRes = await this.callDriveApi(accessToken, 'files?fields=id,name,webViewLink', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metadata)
    });

    return createRes;
  }

  /**
   * List all files in a specific Google Drive folder
   */
  public static async listFilesInFolder(
    accessToken: string,
    folderId: string
  ): Promise<DriveFileItem[]> {
    const query = `'${folderId}' in parents and trashed = false`;
    const url = `files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink)&pageSize=1000`;
    const res = await this.callDriveApi(accessToken, url);
    return res.files || [];
  }

  /**
   * Uploads a file buffer to Google Drive using multipart upload
   */
  public static async uploadFile(
    accessToken: string,
    fileName: string,
    mimeType: string,
    buffer: Buffer,
    parentFolderId: string
  ): Promise<DriveFileItem> {
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: fileName,
      parents: [parentFolderId]
    };

    const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`;
    const mediaPartHeader = `${delimiter}Content-Type: ${mimeType}\r\n\r\n`;

    const multipartBuffer = Buffer.concat([
      Buffer.from(metadataPart, 'utf-8'),
      Buffer.from(mediaPartHeader, 'utf-8'),
      buffer,
      Buffer.from(closeDelimiter, 'utf-8')
    ]);

    const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,webViewLink,createdTime';

    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
        'Content-Length': String(multipartBuffer.length)
      },
      body: multipartBuffer
    });

    if (!res.ok) {
      let errBody = '';
      try {
        const json = await res.json();
        errBody = json.error?.message || JSON.stringify(json);
      } catch {
        errBody = await res.text();
      }
      throw new Error(`Upload to Drive failed (${res.status}): ${errBody}`);
    }

    return await res.json();
  }

  /**
   * Delete a file from Google Drive
   */
  public static async deleteFile(accessToken: string, fileId: string): Promise<boolean> {
    try {
      await this.callDriveApi(accessToken, `files/${fileId}`, { method: 'DELETE' });
      return true;
    } catch (e) {
      console.warn(`⚠️ [GDrive] Failed to delete file ${fileId}:`, e);
      return false;
    }
  }

  /**
   * Test connection & return user profile and drive storage quota
   */
  public static async testConnection(accessToken: string): Promise<{
    ok: boolean;
    userEmail?: string;
    userName?: string;
    totalQuotaGb?: number;
    usedQuotaGb?: number;
    freeQuotaGb?: number;
    error?: string;
  }> {
    try {
      const res = await this.callDriveApi(
        accessToken,
        'about?fields=user(displayName,emailAddress),storageQuota(limit,usage,usageInDrive)'
      );

      const limitBytes = Number(res.storageQuota?.limit || 0);
      const usageBytes = Number(res.storageQuota?.usage || 0);
      const totalGb = limitBytes > 0 ? parseFloat((limitBytes / (1024 * 1024 * 1024)).toFixed(2)) : 15;
      const usedGb = parseFloat((usageBytes / (1024 * 1024 * 1024)).toFixed(2));
      const freeGb = parseFloat(Math.max(0, totalGb - usedGb).toFixed(2));

      return {
        ok: true,
        userEmail: res.user?.emailAddress || 'حساب متصل گوگل',
        userName: res.user?.displayName || 'کاربر گوگل',
        totalQuotaGb: totalGb,
        usedQuotaGb: usedGb,
        freeQuotaGb: freeGb
      };
    } catch (err: any) {
      return {
        ok: false,
        error: err.message || 'خطا در برقراری ارتباط با گوگل درایو'
      };
    }
  }

  /**
   * Core Engine: Performs 100% Differential / Incremental Backup to Google Drive
   */
  public static async executeBackup(params: {
    dbService: any;
    uploadsDir: string;
    notifyAdminsBale?: (text: string) => Promise<void>;
  }): Promise<{
    success: boolean;
    totalUploadedPhotos: number;
    totalSkippedPhotos: number;
    dbBackupSizeBytes: number;
    totalDurationMs: number;
    driveFolderUrl?: string;
    message: string;
  }> {
    if (this.isRunning) {
      throw new Error('یک عملیات بکاپ‌گیری در حال حاضر در حال اجراست. لطفاً چند لحظه شکیبا باشید.');
    }

    this.isRunning = true;
    const startTime = Date.now();
    const { dbService, uploadsDir, notifyAdminsBale } = params;
    const config = dbService.getSystemConfig();
    const gdriveConfig: GoogleDriveConfig = config.googleDrive || {
      enabled: false,
      frequency: 'daily',
      scheduledHour: 2
    };

    const accessToken = gdriveConfig.accessToken;
    if (!accessToken) {
      this.isRunning = false;
      throw new Error('توکن دسترسی گوگل درایو یافت نشد. لطفاً ابتدا حساب گوگل خود را در پنل مدیریت متصل فرمایید.');
    }

    const dataDir = typeof dbService.getDbPath === 'function' ? path.dirname(dbService.getDbPath()) : path.join(process.cwd(), 'data');
    const manifest = this.loadManifest(dataDir);

    let totalUploadedPhotos = 0;
    let totalSkippedPhotos = 0;
    let dbBackupSizeBytes = 0;
    let rootFolderUrl = '';

    try {
      console.log('🚀 [GDrive Backup] Starting differential Google Drive backup...');

      // 1. Initialize root and subfolders
      const rootFolder = await this.getOrCreateFolder(accessToken, ROOT_FOLDER_NAME);
      rootFolderUrl = rootFolder.webViewLink || `https://drive.google.com/drive/folders/${rootFolder.id}`;
      const dbFolder = await this.getOrCreateFolder(accessToken, DB_FOLDER_NAME, rootFolder.id);
      const photosFolder = await this.getOrCreateFolder(accessToken, PHOTOS_FOLDER_NAME, rootFolder.id);

      // 2. Fetch existing files in Photos folder to avoid duplicate uploads
      const remotePhotos = await this.listFilesInFolder(accessToken, photosFolder.id);
      const remotePhotoNames = new Set(remotePhotos.map((f) => f.name));

      // 3. Database Backup Snapshot
      const rawDb = dbService.getRawDatabase();
      const rawDbString = JSON.stringify(rawDb, null, 2);
      const dbBuffer = Buffer.from(rawDbString, 'utf-8');
      dbBackupSizeBytes = dbBuffer.length;

      const now = new Date();
      const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const dbFileName = `maktab-db-snapshot-${dateStr}.json`;

      await this.uploadFile(accessToken, dbFileName, 'application/json', dbBuffer, dbFolder.id);
      console.log(`✅ [GDrive Backup] DB Snapshot uploaded: ${dbFileName} (${(dbBackupSizeBytes / 1024).toFixed(1)} KB)`);

      // 4. Prune old database snapshots if enabled (keep last N snapshots)
      if (gdriveConfig.autoPruneOldDbSnapshots !== false) {
        const maxSnapshots = gdriveConfig.maxDbSnapshotsToKeep || 30;
        const allDbSnapshots = await this.listFilesInFolder(accessToken, dbFolder.id);
        if (allDbSnapshots.length > maxSnapshots) {
          // Sort by creation time ascending
          const sorted = allDbSnapshots.sort((a, b) => (a.createdTime || '').localeCompare(b.createdTime || ''));
          const toDelete = sorted.slice(0, sorted.length - maxSnapshots);
          for (const item of toDelete) {
            await this.deleteFile(accessToken, item.id);
            console.log(`🗑️ [GDrive Backup] Pruned older snapshot: ${item.name}`);
          }
        }
      }

      // 5. Differential Upload of Uploaded Photos
      if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        for (const file of files) {
          const fullPath = path.join(uploadsDir, file);
          const stat = fs.statSync(fullPath);
          if (!stat.isFile()) continue;

          // Compute MD5 hash
          const fileHash = this.computeFileHash(fullPath);
          const manifestEntry = manifest.syncedFiles[file];

          // Check if already in Google Drive
          if (manifestEntry && manifestEntry.hash === fileHash && remotePhotoNames.has(file)) {
            totalSkippedPhotos++;
            continue;
          }

          if (remotePhotoNames.has(file) && !manifestEntry) {
            // Already on remote, update local manifest
            manifest.syncedFiles[file] = {
              hash: fileHash,
              size: stat.size,
              driveFileId: 'remote-synced',
              uploadedAt: new Date().toISOString()
            };
            totalSkippedPhotos++;
            continue;
          }

          // Determine mime type
          let mime = 'image/jpeg';
          const ext = path.extname(file).toLowerCase();
          if (ext === '.png') mime = 'image/png';
          else if (ext === '.webp') mime = 'image/webp';
          else if (ext === '.gif') mime = 'image/gif';
          else if (ext === '.svg') mime = 'image/svg+xml';

          const fileBuffer = fs.readFileSync(fullPath);
          const uploadedDriveFile = await this.uploadFile(accessToken, file, mime, fileBuffer, photosFolder.id);

          manifest.syncedFiles[file] = {
            hash: fileHash,
            size: stat.size,
            driveFileId: uploadedDriveFile.id,
            uploadedAt: new Date().toISOString()
          };
          totalUploadedPhotos++;
          console.log(`📸 [GDrive Backup] Uploaded photo: ${file} (${(stat.size / 1024).toFixed(1)} KB)`);
        }
      }

      // 6. Save updated manifest
      manifest.lastUpdated = new Date().toISOString();
      this.saveManifest(dataDir, manifest);

      const durationMs = Date.now() - startTime;
      const durationSec = (durationMs / 1000).toFixed(1);
      const dbSizeKb = (dbBackupSizeBytes / 1024).toFixed(1);

      // 7. Update System Config Status
      const summaryText = `${totalUploadedPhotos} تصویر جدید و نسخه پایگاه‌داده (${dbSizeKb} KB) با موفقیت به گوگل درایو منتقل شد (${totalSkippedPhotos} تصویر تکراری رد شد)`;
      dbService.setSystemConfig({
        googleDrive: {
          ...gdriveConfig,
          lastBackupTimestamp: new Date().toISOString(),
          lastBackupStatus: 'success',
          lastBackupSummary: summaryText
        }
      });

      // 8. Log in System Logs
      dbService.addSystemLog(
        'info',
        'پشتیبان‌گیری گوگل درایو (Google Drive)',
        summaryText
      );

      // 9. Send Notification to Bale Admins
      if (notifyAdminsBale) {
        const timeFa = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
        const dateFa = new Date().toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
        
        const baleMessage = `☁️ گزارش پشتیبان‌گیری هوشمند در گوگل درایو (Google Drive)

📅 تاریخ و ساعت: ${dateFa} - ساعت ${timeFa}
📦 وضعیت: ✅ با موفقیت در پوشه ${ROOT_FOLDER_NAME} ذخیره شد

📊 خلاصه عملیات تفاضلی (Incremental):
• 💾 نسخه پشتیبان دیتابیس: ${dbFileName} (حجم: ${dbSizeKb} KB)
• 📸 تصاویر جدید آپلود شده: ${totalUploadedPhotos} فایل جدید
• ⏩ تصاویر بدون تغییر (رد شده): ${totalSkippedPhotos} فایل
• ⏱️ مدت زمان انجام: ${durationSec} ثانیه
• 📂 دسترسی: در حساب گوگل (${gdriveConfig.userEmail || 'متصل'})

🛡️ سامانه کتابخانه مکتب‌خانه`;

        try {
          await notifyAdminsBale(baleMessage);
        } catch (baleErr) {
          console.warn('⚠️ [GDrive Backup] Could not send Bale notification:', baleErr);
        }
      }

      this.isRunning = false;

      return {
        success: true,
        totalUploadedPhotos,
        totalSkippedPhotos,
        dbBackupSizeBytes,
        totalDurationMs: durationMs,
        driveFolderUrl: rootFolderUrl,
        message: summaryText
      };
    } catch (err: any) {
      this.isRunning = false;
      const durationMs = Date.now() - startTime;
      const errMsg = err.message || 'خطای نامشخص در پشتیبان‌گیری گوگل درایو';

      dbService.setSystemConfig({
        googleDrive: {
          ...gdriveConfig,
          lastBackupTimestamp: new Date().toISOString(),
          lastBackupStatus: 'failed',
          lastBackupSummary: `خطا در پشتیبان‌گیری: ${errMsg}`
        }
      });

      dbService.addSystemLog('error', 'خطا در پشتیبان‌گیری گوگل درایو', errMsg);

      if (notifyAdminsBale) {
        const timeFa = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
        const baleErrorMsg = `⚠️ هشدار: خطا در پشتیبان‌گیری گوگل درایو

⏰ زمان: ساعت ${timeFa}
❌ علت خطا: ${errMsg}
لطفاً توکن یا اتصال حساب گوگل را در پنل مدیریت مکتب‌خانه بررسی فرمایید.`;
        try {
          await notifyAdminsBale(baleErrorMsg);
        } catch {}
      }

      throw err;
    }
  }

  /**
   * Initializes the cron / interval scheduler in the background
   */
  public static startScheduler(params: {
    dbService: any;
    uploadsDir: string;
    notifyAdminsBale?: (text: string) => Promise<void>;
  }): void {
    let lastCheckedHour = -1;
    let lastRunDate = '';

    console.log('⏰ [GDrive Scheduler] Google Drive backup scheduler started.');

    setInterval(async () => {
      try {
        const config: SystemConfig = params.dbService.getSystemConfig();
        const gdrive = config.googleDrive;

        if (!gdrive || !gdrive.enabled || !gdrive.accessToken) {
          return;
        }

        const now = new Date();
        const currentHour = now.getHours();
        const currentDate = now.toISOString().slice(0, 10);
        const scheduledHour = gdrive.scheduledHour !== undefined ? gdrive.scheduledHour : 2;

        let shouldRun = false;

        if (gdrive.frequency === 'daily') {
          // Run once per day at scheduledHour (e.g. 02:00 AM)
          if (currentHour === scheduledHour && lastRunDate !== currentDate) {
            shouldRun = true;
          }
        } else if (gdrive.frequency === 'every_12_hours') {
          // Run at scheduledHour and scheduledHour + 12
          const targetHours = [scheduledHour, (scheduledHour + 12) % 24];
          if (targetHours.includes(currentHour) && lastCheckedHour !== currentHour) {
            shouldRun = true;
          }
        } else if (gdrive.frequency === 'every_6_hours') {
          const targetHours = [scheduledHour, (scheduledHour + 6) % 24, (scheduledHour + 12) % 24, (scheduledHour + 18) % 24];
          if (targetHours.includes(currentHour) && lastCheckedHour !== currentHour) {
            shouldRun = true;
          }
        } else if (gdrive.frequency === 'weekly') {
          // Run on Friday (or current day) at scheduledHour once a week
          const dayOfWeek = now.getDay(); // 5 is Friday
          if (dayOfWeek === 5 && currentHour === scheduledHour && lastRunDate !== currentDate) {
            shouldRun = true;
          }
        }

        if (shouldRun && !this.isRunning) {
          console.log(`⏰ [GDrive Scheduler] Triggering automatic backup for frequency: ${gdrive.frequency}`);
          lastRunDate = currentDate;
          lastCheckedHour = currentHour;
          await this.executeBackup(params);
        }
      } catch (err) {
        console.error('❌ [GDrive Scheduler Error]:', err);
      }
    }, 60000); // Check every 60 seconds
  }
}
