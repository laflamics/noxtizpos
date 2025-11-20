import crypto from 'node:crypto';
import {
  ActivationRequest,
  LicenseLogEntry,
  LicenseRecord,
  LicenseStatus,
  LicenseType,
  TrialRequest,
} from '../types';

const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = process.env;

if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
  console.warn('[license-store] Upstash env vars belum diset. Pastikan diset sebelum runtime.');
}

const redisFetch = async <T>(command: string, ...args: string[]): Promise<T | null> => {
  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('Upstash Redis env belum terisi');
  }

  const encodedArgs = args.map((arg) => encodeURIComponent(arg));
  const url = `${UPSTASH_REDIS_REST_URL}/${command}/${encodedArgs.join('/')}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upstash error: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { result: string | null };
  if (!data.result) return null;
  try {
    return JSON.parse(data.result) as T;
  } catch (err) {
    return data.result as unknown as T;
  }
};

const redisSet = async (key: string, value: unknown) => {
  await redisFetch('SET', key, JSON.stringify(value));
};

export const buildLicenseKey = (code: string) => `license:${code}`;

export const getLicenseRecord = (code: string) =>
  redisFetch<LicenseRecord>('GET', buildLicenseKey(code));

export const saveLicenseRecord = async (record: LicenseRecord) => {
  const key = buildLicenseKey(record.code);
  await redisSet(key, { ...record, updatedAt: new Date().toISOString() });
};

export const logLicenseEvent = async (code: string, log: LicenseLogEntry) => {
  const logKey = `license_log:${code}:${Date.now()}`;
  await redisSet(logKey, log);
};

export const calculateDurationDays = (type: LicenseType): number => {
  switch (type) {
    case 'trial':
      return 7;
    case 'weekly':
      return 7;
    case 'monthly':
      return 30;
    case 'yearly':
      return 365;
    case 'lifetime':
      return 365 * 30;
    default:
      return 7;
  }
};

export const issueTrialLicense = async (payload: TrialRequest) => {
  const code = `trial-${payload.device.deviceId}`;
  const existing = await getLicenseRecord(code);
  if (existing && existing.status !== 'revoked') {
    return existing;
  }
  const now = new Date();
  const expires = new Date(now.getTime() + calculateDurationDays('trial') * 86400000);

  const record: LicenseRecord = {
    key: buildLicenseKey(code),
    code,
    type: 'trial',
    status: 'active',
    durationDays: calculateDurationDays('trial'),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    notes: 'Auto-issued trial',
    activatedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    device: payload.device,
    account: payload.account,
    session: {
      token: crypto.randomUUID(),
      deviceId: payload.device.deviceId,
      issuedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    },
  };

  await saveLicenseRecord(record);
  await logLicenseEvent(code, {
    event: 'trial_issued',
    timestamp: now.toISOString(),
    device: payload.device,
    account: payload.account,
  });
  return record;
};

export const activateLicenseRecord = async (
  license: LicenseRecord,
  payload: ActivationRequest
) => {
  const now = new Date();
  const expireAt =
    license.type === 'lifetime'
      ? null
      : new Date(now.getTime() + license.durationDays * 86400000);

  const session = {
    token: crypto.randomUUID(),
    deviceId: payload.device.deviceId,
    issuedAt: now.toISOString(),
    expiresAt: expireAt ? expireAt.toISOString() : 'never',
    lastSeenAt: now.toISOString(),
  };

  const updated: LicenseRecord = {
    ...license,
    status: 'active',
    activatedAt: now.toISOString(),
    expiresAt: expireAt ? expireAt.toISOString() : undefined,
    device: payload.device,
    account: payload.account,
    session,
    updatedAt: now.toISOString(),
  };

  await saveLicenseRecord(updated);
  await logLicenseEvent(license.code, {
    event: 'activated',
    timestamp: now.toISOString(),
    device: payload.device,
    account: payload.account,
  });

  return updated;
};

export const updateLicenseStatus = async (license: LicenseRecord, status: LicenseStatus) => {
  const updated = { ...license, status, updatedAt: new Date().toISOString() };
  if (status === 'expired' && !license.expiresAt) {
    updated.expiresAt = new Date().toISOString();
  }
  await saveLicenseRecord(updated);
  return updated;
};

