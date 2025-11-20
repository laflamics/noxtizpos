export const getDeviceId = () => {
  if (typeof navigator === 'undefined') return 'server';
  const stored = localStorage.getItem('noxtiz_device_id');
  if (stored) return stored;
  const id = crypto.randomUUID();
  localStorage.setItem('noxtiz_device_id', id);
  return id;
};

export const getDeviceProfile = () => {
  const id = getDeviceId();
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : 'server';
  const platform = typeof navigator !== 'undefined' ? navigator.platform : 'server';
  return {
    deviceId: id,
    platform: /Android/i.test(ua) ? 'android' : /iPhone|iPad|iPod/i.test(ua) ? 'ios' : 'windows',
    model: ua,
    brand: platform,
    osVersion:
      typeof navigator !== 'undefined' && (navigator as any).userAgentData
        ? (navigator as any).userAgentData.platform
        : platform,
  };
};

