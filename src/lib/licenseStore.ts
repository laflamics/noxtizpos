import type { LicensePlanType } from '@/types';

/**
 * LICENSE STORE - Redis License Server (Global)
 * 
 * File ini mengakses Redis License Server GLOBAL yang lo siapin (Upstash),
 * BUKAN Redis masing-masing user yang mereka input di Settings.
 * 
 * Redis License Server (Global):
 * - Key: license:email, user_account:deviceId, license_log:email
 * - Dipakai untuk: License management, tracking user, aktivasi
 * - Diakses via: VITE_UPSTASH_REDIS_REST_URL (env global)
 * 
 * Redis User (Masing-masing klien):
 * - Key: users, products, orders, settings, dll
 * - Dipakai untuk: Data POS mereka
 * - Diakses via: URL/token yang user input di Settings
 */

const UPSTASH_URL =
  (import.meta as any).env?.VITE_LICENSE_UPSTASH_URL ||
  (import.meta as any).env?.VITE_UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN =
  (import.meta as any).env?.VITE_LICENSE_UPSTASH_TOKEN ||
  (import.meta as any).env?.VITE_UPSTASH_REDIS_REST_TOKEN;

const executeCommand = async (...args: (string | number)[]) => {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    console.error('[licenseStore] Env missing:', {
      hasUrl: !!UPSTASH_URL,
      hasToken: !!UPSTASH_TOKEN,
      envKeys: Object.keys((import.meta as any).env || {}).filter((k) =>
        k.includes('UPSTASH')
      ),
    });
    throw new Error(
      'Env Upstash lisensi belum diset. Pastikan VITE_UPSTASH_REDIS_REST_URL dan VITE_UPSTASH_REDIS_REST_TOKEN ada di .env dan restart dev server.'
    );
  }
  
  // Upstash REST API format: command sebagai array string langsung
  const command = args.map((arg) => String(arg));
  
  try {
    const res = await fetch(UPSTASH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
      },
      body: JSON.stringify(command),
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('[licenseStore] Upstash API error:', {
        status: res.status,
        statusText: res.statusText,
        error: errorText,
        command,
        url: UPSTASH_URL,
      });
      throw new Error(`Upstash API error (${res.status}): ${errorText}`);
    }
    
    const data = await res.json();
    if (data.error) {
      console.error('[licenseStore] Upstash command error:', {
        error: data.error,
        command,
      });
      throw new Error(
        typeof data.error === 'string' ? data.error : JSON.stringify(data.error)
      );
    }
    return data.result as string | null;
  } catch (error) {
    console.error('[licenseStore] Execute command failed:', {
      error,
      command,
      url: UPSTASH_URL,
    });
    throw error;
  }
};

export type LicenseRecord = {
  code: string;
  type: LicensePlanType;
  status: 'unused' | 'active' | 'trial' | 'expired' | 'revoked';
  durationDays: number;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  activatedAt?: string;
  lastSyncedAt?: string;
  deviceId?: string;
  accountName?: string;
  outletName?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  softwareName?: string;
  staff?: Array<{
    userId: string;
    role: string;
    name: string;
    username?: string;
  }>;
  notes?: string;
};

const buildKey = (code: string) => `license:${code}`;
const buildLogKey = (code: string) => `license_log:${code}`;

export const saveLicenseRecord = async (record: LicenseRecord) => {
  await executeCommand('SET', buildKey(record.code), JSON.stringify(record));
};

export const fetchLicenseRecord = async (
  code: string
): Promise<LicenseRecord | null> => {
  const raw = await executeCommand('GET', buildKey(code));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LicenseRecord;
  } catch {
    return null;
  }
};

export const appendLicenseLog = async (
  code: string,
  payload: Record<string, unknown>
) => {
  await executeCommand('RPUSH', buildLogKey(code), JSON.stringify(payload));
};

// User account data untuk tracking di dashboard
export type UserAccountRecord = {
  deviceId: string;
  accountId: string;
  outletName?: string;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  softwareName?: string;
  staff: Array<{
    userId: string;
    role: string;
    name: string;
    username?: string;
  }>;
  licenseCode?: string;
  licenseStatus?: 'trial' | 'active' | 'expired' | 'revoked';
  licenseType?: LicensePlanType;
  licenseExpiresAt?: string;
  firstSeenAt: string;
  lastSeenAt: string;
  lastLoginAt?: string;
  totalLogins: number;
};

const buildUserKey = (deviceId: string) => `user_account:${deviceId}`;

export const saveUserAccountRecord = async (record: UserAccountRecord) => {
  await executeCommand('SET', buildUserKey(record.deviceId), JSON.stringify(record));
};

export const fetchUserAccountRecord = async (
  deviceId: string
): Promise<UserAccountRecord | null> => {
  const raw = await executeCommand('GET', buildUserKey(deviceId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserAccountRecord;
  } catch {
    return null;
  }
};

// Helper untuk sync user + license data (dipanggil saat login/createUser)
// Flow: Baca dulu dari Redis, kalau ga ada write otomatis (trial), kalau sudah ada baca & cek expired
export const syncUserLicenseToUpstash = async (payload: {
  deviceId: string;
  accountId: string;
  outletName?: string;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  staff: Array<{
    userId: string;
    role: string;
    name: string;
    username?: string;
  }>;
  licenseCode?: string;
  licenseStatus?: 'trial' | 'active' | 'expired' | 'revoked';
  licenseType?: LicensePlanType;
  licenseExpiresAt?: string;
}) => {
  try {
    // 1. Baca dulu dari Redis
    const existing = await fetchUserAccountRecord(payload.deviceId);
    const now = new Date().toISOString();
    
    // 2. Kalau ga ada di Redis → write otomatis (trial 7 hari)
    if (!existing) {
      console.log('[licenseStore] User baru terdeteksi, auto-write trial ke Upstash');
      
      // Generate trial license code dari email user pertama langsung (normalized)
      // Key format: license:<email> (bukan TRIAL- prefix)
      if (!payload.ownerEmail) {
        throw new Error('Email owner diperlukan untuk membuat license');
      }
      const trialCode = payload.ownerEmail.toLowerCase().trim();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      
      // Write trial license record dengan semua data user
      const trialLicense: LicenseRecord = {
        code: trialCode,
        type: 'trial',
        status: 'trial',
        durationDays: 7,
        createdAt: now,
        updatedAt: now,
        expiresAt,
        deviceId: payload.deviceId,
        accountName: payload.outletName || payload.accountId,
        outletName: payload.outletName,
        ownerName: payload.ownerName,
        ownerEmail: payload.ownerEmail,
        ownerPhone: payload.ownerPhone,
        softwareName: 'Noxtiz Culinary Lab',
        staff: payload.staff,
      };
      
      await saveLicenseRecord(trialLicense);
      
      // Write user account record dengan trial
      const userRecord: UserAccountRecord = {
        deviceId: payload.deviceId,
        accountId: payload.accountId,
        outletName: payload.outletName,
        ownerName: payload.ownerName,
        ownerPhone: payload.ownerPhone,
        ownerEmail: payload.ownerEmail,
        softwareName: 'Noxtiz Culinary Lab',
        staff: payload.staff,
        licenseCode: trialCode,
        licenseStatus: 'trial',
        licenseType: 'trial',
        licenseExpiresAt: expiresAt,
        firstSeenAt: now,
        lastSeenAt: now,
        lastLoginAt: now,
        totalLogins: 1,
      };
      
      await saveUserAccountRecord(userRecord);
      console.log('[licenseStore] Trial license auto-created untuk device:', payload.deviceId);
      return { isNew: true, licenseCode: trialCode, expiresAt };
    }
    
    // 3. Kalau sudah ada → baca license status & cek expired
    let licenseRecord: LicenseRecord | null = null;
    if (existing.licenseCode) {
      licenseRecord = await fetchLicenseRecord(existing.licenseCode);
      
      // Cek expired
      if (licenseRecord && licenseRecord.expiresAt) {
        const expires = new Date(licenseRecord.expiresAt);
        if (expires.getTime() <= Date.now()) {
          // License expired
          licenseRecord.status = 'expired';
          await saveLicenseRecord(licenseRecord);
          
          // Update user record
          existing.licenseStatus = 'expired';
          console.log('[licenseStore] License expired untuk device:', payload.deviceId);
        }
      }
    }
    
    // Update lastSeenAt & lastLoginAt
    const userRecord: UserAccountRecord = {
      ...existing,
      outletName: payload.outletName || existing.outletName,
      ownerName: payload.ownerName || existing.ownerName,
      ownerPhone: payload.ownerPhone || existing.ownerPhone,
      ownerEmail: payload.ownerEmail || existing.ownerEmail,
      softwareName: 'Noxtiz Culinary Lab',
      staff: payload.staff.length > 0 ? payload.staff : existing.staff,
      licenseCode: payload.licenseCode || existing.licenseCode,
      licenseStatus: payload.licenseStatus || existing.licenseStatus,
      licenseType: payload.licenseType || existing.licenseType,
      licenseExpiresAt: payload.licenseExpiresAt || existing.licenseExpiresAt,
      lastSeenAt: now,
      lastLoginAt: now,
      totalLogins: existing.totalLogins + 1,
    };
    
    await saveUserAccountRecord(userRecord);
    console.log('[licenseStore] User account updated di Upstash:', payload.deviceId);
    
    return {
      isNew: false,
      licenseCode: userRecord.licenseCode,
      licenseStatus: userRecord.licenseStatus,
      licenseType: userRecord.licenseType,
      expiresAt: userRecord.licenseExpiresAt,
      licenseRecord,
    };
  } catch (error) {
    console.warn('[licenseStore] Failed to sync user account to Upstash:', error);
    // Jangan throw error, biar app tetap jalan walau sync gagal
    return null;
  }
};

