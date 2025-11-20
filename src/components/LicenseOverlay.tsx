import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { useNotification } from '@/components/NotificationProvider';
import { formatLicenseInfo } from '@/lib/licenseUtils';

export default function LicenseOverlay() {
  const {
    licenseStatus,
    licenseType,
    licenseExpiresAt,
    licenseMessage,
    isLicenseModalOpen,
    isLicenseRequesting,
    activateLicenseCode,
  } = useStore();
  const { notify } = useNotification();
  const [code, setCode] = useState('');

  if (!isLicenseModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await activateLicenseCode(code.trim());
      notify({
        type: 'success',
        title: 'Lisensi aktif',
        message: 'Terima kasih, lisensi berhasil diperbarui.',
      });
      setCode('');
    } catch (error) {
      notify({
        type: 'error',
        title: 'Aktivasi gagal',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.92)',
        zIndex: 4000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '520px',
          width: '100%',
          border: '1px solid #ff6b6b',
          boxShadow: '0 10px 40px rgba(255, 107, 107, 0.4)',
          textAlign: 'center',
        }}
      >
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#ff6b6b', marginBottom: '8px' }}>
          Lisensi dibutuhkan
        </h2>
        <p style={{ color: '#a0a0b0', marginBottom: '16px' }}>
          Status saat ini: <strong>{formatLicenseInfo(licenseType, licenseExpiresAt)}</strong>
        </p>
        {licenseMessage && (
          <p style={{ color: '#ffb347', marginBottom: '16px', whiteSpace: 'pre-line' }}>
            {licenseMessage}
          </p>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="text"
            className="input"
            placeholder="Masukkan kode lisensi"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoFocus
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLicenseRequesting || !code.trim()}
            style={{ width: '100%' }}
          >
            {isLicenseRequesting ? 'Memproses...' : 'Aktifkan Lisensi'}
          </button>
        </form>
        <div
          style={{
            marginTop: '20px',
            padding: '16px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '8px',
            textAlign: 'left',
            color: '#a0a0b0',
            fontSize: '13px',
            lineHeight: 1.6,
          }}
        >
          <p style={{ marginBottom: '4px' }}>
            Silakan hubungi <strong>081311549824 (Panji)</strong> untuk membeli lisensi.
          </p>
          <p style={{ marginBottom: '4px' }}>
            Transfer ke <strong>BCA a/n Panji: 0821112345</strong>.
          </p>
          <p>Kirim bukti transfer via WhatsApp ke nomor di atas.</p>
        </div>
        <p style={{ color: '#606070', fontSize: '12px', marginTop: '16px' }}>
          Mode POS akan terkunci sampai lisensi aktif. Terima kasih.
        </p>
      </div>
    </div>
  );
}

