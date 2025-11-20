import { StatusRequest, StatusResponse } from '../types';
import {
  getLicenseRecord,
  updateLicenseStatus,
} from '../store/licenseStore';

export const handleCheckLicense = async (
  payload: StatusRequest
): Promise<StatusResponse> => {
  const license = await getLicenseRecord(payload.code);
  if (!license) {
    return {
      status: 'unknown',
      message: 'Lisensi tidak ditemukan.',
    };
  }

  if (license.status === 'revoked') {
    return {
      status: 'revoked',
      message: 'Lisensi dicabut oleh admin.',
    };
  }

  if (!license.session || license.session.token !== payload.token) {
    return {
      status: 'unknown',
      message: 'Token tidak valid. Silakan aktivasi ulang.',
    };
  }

  if (license.session.deviceId !== payload.deviceId) {
    return {
      status: 'unknown',
      message: 'Lisensi ini terikat ke device lain.',
    };
  }

  if (license.expiresAt) {
    const expires = new Date(license.expiresAt);
    if (expires.getTime() < Date.now()) {
      await updateLicenseStatus(license, 'expired');
      return {
        status: 'expired',
        message: 'Lisensi sudah kadaluarsa.',
        type: license.type,
        expiresAt: license.expiresAt,
        remainingDays: 0,
      };
    }
  }

  const remainingDays =
    license.expiresAt
      ? Math.max(
          0,
          Math.ceil(
            (new Date(license.expiresAt).getTime() - Date.now()) / 86400000
          )
        )
      : undefined;

  return {
    status: 'active',
    message: 'Lisensi masih aktif.',
    type: license.type,
    expiresAt: license.expiresAt ?? 'never',
    remainingDays,
  };
};

