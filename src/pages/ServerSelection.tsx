import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { motion } from 'framer-motion';
import { Server, Database } from 'lucide-react';
import { useNotification } from '@/components/NotificationProvider';
import { ensureProcessPolyfill } from '@/polyfills/process';

export default function ServerSelection() {
  const navigate = useNavigate();
  const { switchStorage } = useStore();
  const { notify } = useNotification();
  const [selected, setSelected] = useState<'local' | 'redis'>('local');
  const [redisUrl, setRedisUrl] = useState('');
  const [redisToken, setRedisToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    setIsLoading(true);
    try {
      if (selected === 'redis' && redisUrl && redisToken) {
        ensureProcessPolyfill();
        // Validate URL format
        if (!redisUrl.startsWith('http://') && !redisUrl.startsWith('https://')) {
          notify({
            type: 'warning',
            title: 'Redis URL kurang pas',
            message: 'Redis URL harus diawali http:// atau https://',
          });
          setIsLoading(false);
          return;
        }
        
        // Test connection before switching
        try {
          const { Redis } = await import('@upstash/redis');
          const testRedis = new Redis({
            url: redisUrl.trim(),
            token: redisToken.trim(),
          });
          // Test connection by trying to get a key
          await testRedis.get('__connection_test__');
          console.log('✅ Redis connection test successful');
        } catch (testError) {
          console.error('❌ Redis connection test failed:', testError);
          notify({
            type: 'error',
            title: 'Tes Redis gagal',
            message: `Pastikan URL & token valid ya.\nDetail: ${
              testError instanceof Error ? testError.message : 'Unknown error'
            }\n\nContoh:\nURL: https://just-feline-6702.upstash.io\nToken: ARouAAImc...`,
          });
          setIsLoading(false);
          return;
        }
        
        await switchStorage('redis', redisUrl.trim(), redisToken.trim());
      } else {
        await switchStorage('local');
      }
      navigate('/login');
    } catch (error) {
      console.error('Failed to switch storage:', error);
      notify({
        type: 'error',
        title: 'Gagal ganti server',
        message: `Detail: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: 'linear-gradient(135deg, #0a0a0f 0%, #151520 50%, #1f1f2e 100%)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
        style={{
          maxWidth: '600px',
          width: '100%',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              display: 'inline-flex',
              marginBottom: '20px',
            }}
          >
            <img
              src="/Logo.gif"
              alt="Noxtiz POS"
              style={{
                width: '120px',
                height: '120px',
                objectFit: 'contain',
              }}
            />
          </motion.div>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #00ff88, #00d4ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px',
            }}
          >
            Noxtiz POS
          </h1>
          <p style={{ color: '#a0a0b0', fontSize: '16px' }}>
            Pilih metode penyimpanan data
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelected('local')}
            className="card"
            style={{
              cursor: 'pointer',
              border: selected === 'local' ? '2px solid #00ff88' : '1px solid #2a2a3a',
              background: selected === 'local' ? 'rgba(0, 255, 136, 0.1)' : undefined,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  padding: '12px',
                  background: 'rgba(0, 255, 136, 0.2)',
                  borderRadius: '8px',
                }}
              >
                <Database size={24} color="#00ff88" />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>
                  Local Storage
                </h3>
                <p style={{ color: '#a0a0b0', fontSize: '14px' }}>
                  Data disimpan lokal di komputer ini
                </p>
              </div>
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: '2px solid #00ff88',
                  background: selected === 'local' ? '#00ff88' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {selected === 'local' && (
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: '#0a0a0f',
                    }}
                  />
                )}
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelected('redis')}
            className="card"
            style={{
              cursor: 'pointer',
              border: selected === 'redis' ? '2px solid #00ff88' : '1px solid #2a2a3a',
              background: selected === 'redis' ? 'rgba(0, 255, 136, 0.1)' : undefined,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  padding: '12px',
                  background: 'rgba(0, 212, 255, 0.2)',
                  borderRadius: '8px',
                }}
              >
                <Server size={24} color="#00d4ff" />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>
                  Server Online (Upstash Redis)
                </h3>
                <p style={{ color: '#a0a0b0', fontSize: '14px' }}>
                  Data disimpan di cloud, bisa diakses dari mana saja
                </p>
              </div>
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: '2px solid #00ff88',
                  background: selected === 'redis' ? '#00ff88' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {selected === 'redis' && (
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: '#0a0a0f',
                    }}
                  />
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {selected === 'redis' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#a0a0b0' }}>
                Redis URL
              </label>
              <input
                type="text"
                className="input"
                placeholder="https://just-feline-6702.upstash.io"
                value={redisUrl}
                onChange={(e) => setRedisUrl(e.target.value)}
              />
              <p style={{ fontSize: '12px', color: '#a0a0b0', marginTop: '4px' }}>
                Contoh: https://just-feline-6702.upstash.io
              </p>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#a0a0b0' }}>
                Redis Token
              </label>
              <input
                type="password"
                className="input"
                placeholder="ARouAAImcDI5ZTUyMDE5ODlkYmE0Y2I0YTU4OTBiNTg2OTNiMmJjZnAyNjcwMg"
                value={redisToken}
                onChange={(e) => setRedisToken(e.target.value)}
              />
              <p style={{ fontSize: '12px', color: '#a0a0b0', marginTop: '4px' }}>
                Token dari Upstash Redis dashboard
              </p>
            </div>
          </motion.div>
        )}

        <button
          className="btn btn-primary"
          onClick={handleContinue}
          disabled={isLoading || (selected === 'redis' && (!redisUrl || !redisToken))}
          style={{
            width: '100%',
            opacity: isLoading || (selected === 'redis' && (!redisUrl || !redisToken)) ? 0.5 : 1,
            cursor:
              isLoading || (selected === 'redis' && (!redisUrl || !redisToken))
                ? 'not-allowed'
                : 'pointer',
          }}
        >
          {isLoading ? 'Menghubungkan...' : 'Lanjutkan'}
        </button>
      </motion.div>
    </div>
  );
}

