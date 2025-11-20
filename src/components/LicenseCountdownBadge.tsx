import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/store/useStore';
import { Star } from 'lucide-react';

const getCountdownLabel = (
  status: string | undefined,
  expiresAt: string | undefined,
  type?: string
): { label: string; tone: 'safe' | 'warn' | 'danger' } => {
  if (status === 'revoked') {
    return { label: 'Lisensi dicabut', tone: 'danger' };
  }
  if (!expiresAt || expiresAt === 'never' || type === 'lifetime') {
    return { label: type === 'lifetime' ? 'Lifetime' : 'Lisensi aktif', tone: 'safe' };
  }
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) {
    return { label: 'Lisensi habis', tone: 'danger' };
  }
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 3) {
    return { label: `${days} hari tersisa`, tone: 'safe' };
  }
  if (days > 0) {
    return { label: `${days} hari tersisa`, tone: 'warn' };
  }
  return { label: `${hours} jam tersisa`, tone: 'danger' };
};

export default function LicenseCountdownBadge() {
  const { licenseStatus, licenseType, licenseExpiresAt } = useStore();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  const { label, tone } = useMemo(
    () => getCountdownLabel(licenseStatus, licenseExpiresAt, licenseType),
    [licenseStatus, licenseExpiresAt, licenseType, now]
  );

  if (!licenseType && !licenseExpiresAt) return null;

  // Khusus untuk lifetime, tampilkan bintang kuning
  if (licenseType === 'lifetime') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 10px',
          borderRadius: '999px',
          fontSize: '12px',
          fontWeight: 600,
          color: '#ffd700',
          background: 'rgba(255, 215, 0, 0.15)',
          border: '1px solid #ffd700',
        }}
        title="Lisensi Lifetime - Aktif selamanya"
      >
        <Star size={14} fill="#ffd700" color="#ffd700" />
        <span>Lifetime</span>
      </span>
    );
  }

  const baseColor =
    tone === 'danger' ? '#ff6b6b' : tone === 'warn' ? '#ffe66d' : '#00ff88';
  const bg =
    tone === 'danger'
      ? 'rgba(255, 107, 107, 0.15)'
      : tone === 'warn'
      ? 'rgba(255, 230, 109, 0.15)'
      : 'rgba(0, 255, 136, 0.15)';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 600,
        color: baseColor,
        background: bg,
        border: `1px solid ${baseColor}`,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}
      title={`Lisensi: ${licenseType || 'unknown'} • ${label}`}
    >
      {licenseType ? licenseType.toUpperCase() : 'LICENSE'} • {label}
    </span>
  );
}

