import {
  ActivationRequest,
  ActivationResponse,
} from '../types';
import {
  activateLicenseRecord,
  getLicenseRecord,
  updateLicenseStatus,
} from '../store/licenseStore';

export const handleActivateLicense = async (
  payload: ActivationRequest
): Promise<ActivationResponse> => {
  const { code, device, account } = payload;

  const license = await getLicenseRecord(code);
  if (!license) {
    return {
      status: 'error',
      message: 'Kode lisensi tidak ditemukan.',
    };
  }

  if (license.status === 'revoked') {
    return {
      status: 'error',
      message: 'Lisensi ini sudah dicabut. Hubungi admin.',
    };
  }

  if (license.status === 'active' && license.expiresAt) {
    const expires = new Date(license.expiresAt);
    if (expires.getTime() > Date.now() && license.session?.deviceId !== device.deviceId) {
      return {
        status: 'error',
        message: 'Lisensi sedang terpakai di device lain. Hubungi admin untuk pindah device.',
      };
    }
  }

  const activated = await activateLicenseRecord(license, { code, device, account });
  if (activated.type !== 'lifetime' && activated.expiresAt) {
    const expires = new Date(activated.expiresAt);
    if (expires.getTime() < Date.now()) {
      await updateLicenseStatus(activated, 'expired');
      return {
        status: 'error',
        message: 'Lisensi ini sudah kadaluarsa.',
      };
    }
  }

  const expiresAt = activated.expiresAt ?? 'never';
  const remainingDays =
    activated.type === 'lifetime' || !activated.expiresAt
      ? undefined
      : Math.max(
          0,
          Math.ceil(
            (new Date(activated.expiresAt).getTime() - Date.now()) / 86400000
          )
        );

  return {
    status: 'active',
    message: 'Lisensi berhasil diaktivasi.',
    type: activated.type,
    expiresAt,
    remainingDays: remainingDays === Infinity ? undefined : remainingDays,
    token: activated.session?.token,
  };
};

