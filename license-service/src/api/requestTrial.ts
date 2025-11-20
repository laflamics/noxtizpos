import { TrialRequest, TrialResponse } from '../types';
import { issueTrialLicense } from '../store/licenseStore';

export const handleRequestTrial = async (
  payload: TrialRequest
): Promise<TrialResponse> => {
  const record = await issueTrialLicense(payload);
  const expiresAt = record.expiresAt ?? new Date(Date.now() + record.durationDays * 86400000).toISOString();

  return {
    status: 'active',
    message: 'Trial 7 hari aktif.',
    expiresAt,
    token: record.session?.token ?? '',
    code: record.code,
  };
};

