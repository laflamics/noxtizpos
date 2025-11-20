import type { LicensePlanType } from '@/types';

export const formatLicenseInfo = (type?: LicensePlanType, expiresAt?: string): string => {
  if (!type) return 'Belum aktif';
  if (type === 'lifetime') return 'Lifetime';
  if (!expiresAt) return `${type} (tanpa tanggal)`;
  const date = new Date(expiresAt);
  return `${type} • aktif sampai ${date.toLocaleDateString('id-ID')}`;
};

