import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { motion } from 'framer-motion';
import { Save, Server, Database, DollarSign, Building, Lock, Receipt, Image, X, Download, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export default function Settings() {
  const { settings, loadSettings, updateSettings, switchStorage, storageType } = useStore();
  const [formData, setFormData] = useState({
    companyName: '',
    currency: 'IDR',
    taxRate: 0.1,
    taxDisplayMode: 'include_hide' as 'exclude' | 'include' | 'include_hide',
    storageType: 'local' as 'local' | 'redis',
    redisUrl: '',
    redisToken: '',
    voidPin: '',
    receiptLogo: '',
    receiptHeader: '',
    receiptFooter: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  
  // Update state
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'>('idle');
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [updateError, setUpdateError] = useState<string>('');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [appVersion, setAppVersion] = useState<string>('');

  useEffect(() => {
    // Get app version
    if (window.electronAPI?.getVersion) {
      window.electronAPI.getVersion().then((version: string) => {
        setAppVersion(version);
      });
    }

    // Setup update event listeners
    if (window.electronAPI?.update) {
      const cleanupChecking = window.electronAPI.update.onChecking(() => {
        setUpdateStatus('checking');
        setUpdateError('');
      });

      const cleanupAvailable = window.electronAPI.update.onAvailable((info: any) => {
        setUpdateStatus('available');
        setUpdateInfo(info);
        // Show notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Update Tersedia!', {
            body: `Versi ${info.version} tersedia. Klik untuk download.`,
            icon: '/noxtiz.png',
          });
        }
      });

      const cleanupNotAvailable = window.electronAPI.update.onNotAvailable(() => {
        setUpdateStatus('not-available');
        setUpdateInfo(null);
      });

      const cleanupError = window.electronAPI.update.onError((error: any) => {
        setUpdateStatus('error');
        setUpdateError(error.message || 'Terjadi kesalahan saat mengecek update');
      });

      const cleanupProgress = window.electronAPI.update.onDownloadProgress((progress: any) => {
        setUpdateStatus('downloading');
        setDownloadProgress(Math.round(progress.percent || 0));
      });

      const cleanupDownloaded = window.electronAPI.update.onDownloaded((info: any) => {
        setUpdateStatus('downloaded');
        setUpdateInfo(info);
        // Show notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Update Siap Diinstall!', {
            body: `Versi ${info.version} sudah didownload. Klik untuk restart dan install.`,
            icon: '/noxtiz.png',
          });
        }
      });

      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }

      return () => {
        cleanupChecking();
        cleanupAvailable();
        cleanupNotAvailable();
        cleanupError();
        cleanupProgress();
        cleanupDownloaded();
      };
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (settings) {
      setFormData({
        companyName: settings.companyName || '',
        currency: settings.currency || 'IDR',
        taxRate: settings.taxRate || 0.1,
        taxDisplayMode: settings.taxDisplayMode || 'include_hide',
        storageType: settings.storageType || 'local',
        redisUrl: settings.redisUrl || '',
        redisToken: settings.redisToken || '',
        voidPin: settings.voidPin || '',
        receiptLogo: settings.receiptLogo || '',
        receiptHeader: settings.receiptHeader || '',
        receiptFooter: settings.receiptFooter || '',
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // If storage type changed, switch storage first
      if (formData.storageType !== storageType) {
        if (formData.storageType === 'redis' && formData.redisUrl && formData.redisToken) {
          // Validate URL format
          if (!formData.redisUrl.startsWith('http://') && !formData.redisUrl.startsWith('https://')) {
            alert('Redis URL harus dimulai dengan http:// atau https://');
            setIsSaving(false);
            return;
          }
          
          // Test connection before switching
          try {
            const { Redis } = await import('@upstash/redis');
            const testRedis = new Redis({
              url: formData.redisUrl.trim(),
              token: formData.redisToken.trim(),
            });
            // Test connection by trying to get a key
            await testRedis.get('__connection_test__');
            console.log('✅ Redis connection test successful');
          } catch (testError) {
            console.error('❌ Redis connection test failed:', testError);
            alert(`Gagal terhubung ke Redis:\n${testError instanceof Error ? testError.message : 'Unknown error'}\n\nPastikan URL dan Token benar.\n\nContoh format:\nURL: https://just-feline-6702.upstash.io\nToken: ARouAAImcDI5ZTUyMDE5ODlkYmE0Y2I0YTU4OTBiNTg2OTNiMmJjZnAyNjcwMg`);
            setIsSaving(false);
            return;
          }
          
          await switchStorage('redis', formData.redisUrl.trim(), formData.redisToken.trim());
        } else {
          await switchStorage('local');
        }
      }

      await updateSettings({
        companyName: formData.companyName,
        currency: formData.currency,
        taxRate: formData.taxRate,
        taxDisplayMode: formData.taxDisplayMode,
        storageType: formData.storageType,
        redisUrl: formData.redisUrl,
        redisToken: formData.redisToken,
        voidPin: formData.voidPin,
        receiptLogo: formData.receiptLogo,
        receiptHeader: formData.receiptHeader,
        receiptFooter: formData.receiptFooter,
      });

      alert('Settings berhasil disimpan!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Gagal menyimpan settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '40px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1
          style={{
            fontSize: '32px',
            fontWeight: 800,
            marginBottom: '8px',
            background: 'linear-gradient(135deg, #00ff88, #00d4ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Settings
        </h1>
        <p style={{ color: '#a0a0b0', fontSize: '16px' }}>Konfigurasi aplikasi</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Company Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
          style={{ marginBottom: '24px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <Building size={24} color="#00ff88" />
            <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Informasi Perusahaan</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                Nama Perusahaan
              </label>
              <input
                type="text"
                className="input"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                required
              />
            </div>
          </div>
        </motion.div>

        {/* Financial Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
          style={{ marginBottom: '24px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <DollarSign size={24} color="#00d4ff" />
            <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Pengaturan Keuangan</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                Mata Uang
              </label>
              <select
                className="input"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              >
                <option value="IDR">IDR (Rupiah)</option>
                <option value="USD">USD (Dollar)</option>
                <option value="EUR">EUR (Euro)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                Pajak (%)
              </label>
              <input
                type="number"
                className="input"
                value={formData.taxRate}
                onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                min="0"
                max="100"
                step="0.01"
                required
              />
            </div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
              Mode Tampilan Pajak
            </label>
            <select
              className="input"
              value={formData.taxDisplayMode}
              onChange={(e) => setFormData({ ...formData, taxDisplayMode: e.target.value as 'exclude' | 'include' | 'include_hide' })}
            >
              <option value="exclude">Exclude - Pajak ditambahkan ke subtotal</option>
              <option value="include">Include - Pajak sudah termasuk, ditampilkan di struk</option>
              <option value="include_hide">Include Hide - Pajak sudah termasuk, tidak ditampilkan di struk (Default)</option>
            </select>
            <p style={{ color: '#a0a0b0', fontSize: '12px', marginTop: '4px' }}>
              {formData.taxDisplayMode === 'exclude' && 'Pajak akan ditambahkan ke subtotal. Contoh: Subtotal 100.000 + Pajak 10% = Total 110.000'}
              {formData.taxDisplayMode === 'include' && 'Subtotal sudah termasuk pajak dan pajak ditampilkan di struk. Contoh: Total 100.000 (Subtotal 90.909 + Pajak 9.091)'}
              {formData.taxDisplayMode === 'include_hide' && 'Subtotal sudah termasuk pajak tapi pajak tidak ditampilkan di struk. Di laporan tetap terlihat. Contoh: Total 100.000 (pajak sudah termasuk)'}
            </p>
          </div>
        </motion.div>

        {/* Storage Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
          style={{ marginBottom: '24px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <Database size={24} color="#ffe66d" />
            <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Penyimpanan Data</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                Tipe Penyimpanan
              </label>
              <select
                className="input"
                value={formData.storageType}
                onChange={(e) =>
                  setFormData({ ...formData, storageType: e.target.value as 'local' | 'redis' })
                }
              >
                <option value="local">Local Storage</option>
                <option value="redis">Server Online (Upstash Redis)</option>
              </select>
            </div>

            {formData.storageType === 'redis' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
              >
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                    Redis URL
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="https://just-feline-6702.upstash.io"
                    value={formData.redisUrl}
                    onChange={(e) => setFormData({ ...formData, redisUrl: e.target.value })}
                    required={formData.storageType === 'redis'}
                  />
                  <p style={{ fontSize: '12px', color: '#a0a0b0', marginTop: '4px' }}>
                    Contoh: https://just-feline-6702.upstash.io
                  </p>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                    Redis Token
                  </label>
                  <input
                    type="password"
                    className="input"
                    placeholder="ARouAAImcDI5ZTUyMDE5ODlkYmE0Y2I0YTU4OTBiNTg2OTNiMmJjZnAyNjcwMg"
                    value={formData.redisToken}
                    onChange={(e) => setFormData({ ...formData, redisToken: e.target.value })}
                    required={formData.storageType === 'redis'}
                  />
                  <p style={{ fontSize: '12px', color: '#a0a0b0', marginTop: '4px' }}>
                    Token dari Upstash Redis dashboard
                  </p>
                </div>
                {formData.storageType === 'redis' && formData.redisUrl && formData.redisToken && (
                  <div style={{ marginTop: '8px', padding: '12px', background: 'rgba(0, 212, 255, 0.1)', borderRadius: '8px', border: '1px solid rgba(0, 212, 255, 0.3)' }}>
                    <p style={{ fontSize: '12px', color: '#00d4ff', margin: 0 }}>
                      💡 Sistem akan test koneksi sebelum menyimpan. Pastikan URL dan Token benar.
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            <div
              style={{
                padding: '12px',
                background: 'var(--bg-tertiary)',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#a0a0b0',
              }}
            >
              <strong>Status saat ini:</strong> {storageType === 'local' ? 'Local Storage' : 'Server Online'}
            </div>
          </div>
        </motion.div>

        {/* Receipt Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
          style={{ marginBottom: '24px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <Receipt size={24} color="#00d4ff" />
            <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Pengaturan Receipt</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                Logo Receipt
              </label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {formData.receiptLogo && (
                  <div style={{ position: 'relative', marginBottom: '12px' }}>
                    <img
                      src={formData.receiptLogo}
                      alt="Receipt Logo"
                      style={{
                        maxWidth: '150px',
                        maxHeight: '150px',
                        objectFit: 'contain',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '8px',
                        background: 'var(--bg-tertiary)',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, receiptLogo: '' })}
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        background: '#ff6b6b',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'white',
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData({ ...formData, receiptLogo: reader.result as string });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    style={{ display: 'none' }}
                    id="receipt-logo-upload"
                  />
                  <label
                    htmlFor="receipt-logo-upload"
                    className="btn btn-secondary"
                    style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Image size={18} />
                    {formData.receiptLogo ? 'Ganti Logo' : 'Upload Logo'}
                  </label>
                  <p style={{ color: '#a0a0b0', fontSize: '12px', marginTop: '4px' }}>
                    Upload logo yang akan ditampilkan di receipt (format: PNG, JPG, GIF)
                  </p>
                </div>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                Header Receipt
              </label>
              <textarea
                className="input"
                placeholder="Masukkan header untuk receipt (contoh: Alamat, Telepon, dll)"
                value={formData.receiptHeader}
                onChange={(e) => setFormData({ ...formData, receiptHeader: e.target.value })}
                rows={4}
                style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '13px' }}
              />
              <p style={{ color: '#a0a0b0', fontSize: '12px', marginTop: '4px' }}>
                Header akan ditampilkan di bagian atas receipt. Setiap baris akan ditampilkan sebagai baris terpisah.
              </p>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                Footer Receipt
              </label>
              <textarea
                className="input"
                placeholder="Masukkan footer untuk receipt (contoh: Terima kasih, Alamat website, dll)"
                value={formData.receiptFooter}
                onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                rows={4}
                style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '13px' }}
              />
              <p style={{ color: '#a0a0b0', fontSize: '12px', marginTop: '4px' }}>
                Footer akan ditampilkan di bagian bawah receipt. Setiap baris akan ditampilkan sebagai baris terpisah.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Security Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
          style={{ marginBottom: '24px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <Lock size={24} color="#ff6b6b" />
            <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Keamanan</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                PIN Void (untuk hapus keranjang/batal pesanan)
              </label>
              <input
                type="password"
                className="input"
                placeholder="Masukkan PIN void"
                value={formData.voidPin}
                onChange={(e) => setFormData({ ...formData, voidPin: e.target.value })}
                maxLength={6}
              />
              <p style={{ color: '#a0a0b0', fontSize: '12px', marginTop: '4px' }}>
                PIN ini diperlukan untuk menghapus keranjang atau membatalkan pesanan
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSaving}
            style={{ width: '100%', padding: '16px', fontSize: '16px', fontWeight: 700 }}
          >
            <Save size={20} />
            {isSaving ? 'Menyimpan...' : 'Simpan Settings'}
          </button>
        </motion.div>
      </form>

      {/* Update Section */}
      {window.electronAPI?.update && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
          style={{ marginTop: '32px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Download size={24} style={{ color: 'var(--accent-color)' }} />
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>Update Aplikasi</h2>
              <p style={{ color: '#a0a0b0', fontSize: '14px' }}>
                Versi saat ini: <strong>{appVersion || '1.0.0'}</strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Status Display */}
            {updateStatus === 'checking' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <RefreshCw size={20} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                <span>Mengecek update...</span>
              </div>
            )}

            {updateStatus === 'available' && updateInfo && (
              <div style={{ padding: '16px', background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 212, 255, 0.1))', borderRadius: '8px', border: '1px solid var(--accent-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <CheckCircle size={20} style={{ color: 'var(--accent-color)' }} />
                  <strong>Update Tersedia!</strong>
                </div>
                <p style={{ marginBottom: '12px', color: '#a0a0b0' }}>
                  Versi <strong>{updateInfo.version}</strong> tersedia untuk diunduh.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={async () => {
                    try {
                      setUpdateStatus('downloading');
                      await window.electronAPI.update.download();
                    } catch (error) {
                      setUpdateStatus('error');
                      setUpdateError('Gagal mendownload update');
                    }
                  }}
                  style={{ width: 'fit-content' }}
                >
                  <Download size={18} />
                  Download Update
                </button>
              </div>
            )}

            {updateStatus === 'not-available' && (
              <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CheckCircle size={20} style={{ color: 'var(--accent-color)' }} />
                <span>Aplikasi sudah menggunakan versi terbaru.</span>
              </div>
            )}

            {updateStatus === 'downloading' && (
              <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <RefreshCw size={20} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Mendownload update...</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${downloadProgress}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, var(--accent-color), #00d4ff)',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
                <p style={{ marginTop: '8px', fontSize: '12px', color: '#a0a0b0', textAlign: 'center' }}>
                  {downloadProgress}%
                </p>
              </div>
            )}

            {updateStatus === 'downloaded' && updateInfo && (
              <div style={{ padding: '16px', background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 212, 255, 0.1))', borderRadius: '8px', border: '1px solid var(--accent-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <CheckCircle size={20} style={{ color: 'var(--accent-color)' }} />
                  <strong>Update Siap Diinstall!</strong>
                </div>
                <p style={{ marginBottom: '12px', color: '#a0a0b0' }}>
                  Versi <strong>{updateInfo.version}</strong> sudah didownload. Aplikasi akan restart untuk menginstall update.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    window.electronAPI.update.install();
                  }}
                  style={{ width: 'fit-content' }}
                >
                  <Download size={18} />
                  Install & Restart
                </button>
              </div>
            )}

            {updateStatus === 'error' && (
              <div style={{ padding: '12px', background: 'rgba(255, 107, 107, 0.1)', borderRadius: '8px', border: '1px solid #ff6b6b' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <AlertCircle size={20} style={{ color: '#ff6b6b' }} />
                  <strong style={{ color: '#ff6b6b' }}>Error</strong>
                </div>
                <p style={{ color: '#a0a0b0', fontSize: '14px' }}>{updateError || 'Terjadi kesalahan saat mengecek update'}</p>
              </div>
            )}

            {/* Manual Check Button */}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={async () => {
                try {
                  setUpdateStatus('checking');
                  setUpdateError('');
                  setUpdateInfo(null);
                  await window.electronAPI.update.check();
                } catch (error) {
                  setUpdateStatus('error');
                  setUpdateError('Gagal mengecek update');
                }
              }}
              disabled={updateStatus === 'checking' || updateStatus === 'downloading'}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <RefreshCw size={18} />
              {updateStatus === 'checking' ? 'Mengecek...' : 'Cek Update Sekarang'}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

