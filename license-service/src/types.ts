export type LicenseType = 'trial' | 'weekly' | 'monthly' | 'yearly' | 'lifetime';

export type LicenseStatus = 'unused' | 'active' | 'expired' | 'revoked';

export interface StaffProfile {
  userId: string;
  role: string;
  name: string;
  username?: string;
}

export interface AccountProfile {
  accountId: string;
  outletName: string;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  staff: StaffProfile[];
}

export interface DeviceProfile {
  deviceId: string;
  platform: 'android' | 'windows' | 'ios' | 'web';
  model?: string;
  brand?: string;
  osVersion?: string;
  ipAddress?: string;
  appVersion?: string;
  extraMeta?: Record<string, unknown>;
}

export interface LicenseSession {
  token: string;
  deviceId: string;
  issuedAt: string;
  expiresAt: string;
  lastSeenAt?: string;
}

export interface LicenseRecord {
  key: string; // redis key: license:01 dst
  code: string;
  type: LicenseType;
  status: LicenseStatus;
  durationDays: number;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  activatedAt?: string;
  expiresAt?: string;
  account?: AccountProfile;
  device?: DeviceProfile;
  session?: LicenseSession;
  allowMultipleDevices?: boolean;
}

export interface ActivationRequest {
  code: string;
  device: DeviceProfile;
  account: AccountProfile;
}

export interface ActivationResponse {
  status: 'active' | 'pending' | 'error';
  message: string;
  type?: LicenseType;
  expiresAt?: string;
  remainingDays?: number;
  token?: string;
  trial?: boolean;
}

export interface TrialRequest {
  device: DeviceProfile;
  account: AccountProfile;
}

export interface TrialResponse {
  status: 'active' | 'error';
  expiresAt: string;
  token: string;
  message: string;
  code: string;
}

export interface StatusRequest {
  code: string;
  deviceId: string;
  token: string;
}

export interface StatusResponse {
  status: 'active' | 'expired' | 'revoked' | 'unknown';
  type?: LicenseType;
  expiresAt?: string;
  remainingDays?: number;
  message: string;
}

export interface LicenseLogEntry {
  event: 'trial_issued' | 'activated' | 'status_check' | 'revoked' | 'extended';
  timestamp: string;
  device?: DeviceProfile;
  account?: AccountProfile;
  notes?: string;
}

