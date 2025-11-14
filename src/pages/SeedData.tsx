import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { motion } from 'framer-motion';
import { Coffee, CheckCircle, AlertCircle, Loader } from 'lucide-react';

export default function SeedData() {
  const { loadUsers, loadProducts, loadCategories } = useStore();
  const [isSeeding, setIsSeeding] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSeed = async () => {
    setIsSeeding(true);
    setResult(null);

    try {
      const { storage } = useStore.getState();
      
      if (!storage) {
        throw new Error('Storage belum diinisialisasi. Silakan refresh halaman.');
      }

      // Check if seedCoffeeShop method exists (for LocalStorage)
      if (typeof storage.seedCoffeeShop === 'function') {
        const result = await storage.seedCoffeeShop();
        setResult(result);

        if (result.success) {
          // Reload data
          await Promise.all([loadUsers(), loadProducts(), loadCategories()]);
        }
      } else if (typeof window !== 'undefined' && window.electronAPI?.storage?.seedCoffeeShop) {
        // Fallback to Electron API if available
        const result = await window.electronAPI.storage.seedCoffeeShop();
        setResult(result);

        if (result.success) {
          // Reload data
          await Promise.all([loadUsers(), loadProducts(), loadCategories()]);
        }
      } else {
        throw new Error('Fungsi seed tidak tersedia. Pastikan storage sudah diinisialisasi.');
      }
    } catch (error) {
      console.error('Seed error:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Gagal seed data',
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
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
          Seed Data - Coffee Shop
        </h1>
        <p style={{ color: '#a0a0b0', fontSize: '16px' }}>
          Generate sample data untuk Coffee Shop POS
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div
            style={{
              padding: '16px',
              background: 'linear-gradient(135deg, #8B4513, #654321)',
              borderRadius: '12px',
            }}
          >
            <Coffee size={32} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>
              Coffee Shop Data
            </h2>
            <p style={{ color: '#a0a0b0', fontSize: '14px' }}>
              Seed data akan menambahkan produk, kategori, dan user sample
            </p>
          </div>
        </div>

        <div style={{ marginBottom: '24px', padding: '20px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Data yang akan ditambahkan:</h3>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckCircle size={20} color="#00ff88" />
              <span>8 Kategori (Coffee, Espresso, Latte, Cold Drinks, Pastries, Snacks, Desserts, Others)</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckCircle size={20} color="#00ff88" />
              <span>30+ Produk (Kopi, Latte, Cold Brew, Pastries, Snacks, Desserts)</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckCircle size={20} color="#00ff88" />
              <span>3 User tambahan (2 Cashier, 1 Manager)</span>
            </li>
          </ul>
        </div>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '16px',
              background: result.success ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 107, 107, 0.1)',
              border: `1px solid ${result.success ? '#00ff88' : '#ff6b6b'}`,
              borderRadius: '8px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            {result.success ? (
              <CheckCircle size={24} color="#00ff88" />
            ) : (
              <AlertCircle size={24} color="#ff6b6b" />
            )}
            <div>
              <p
                style={{
                  fontWeight: 600,
                  color: result.success ? '#00ff88' : '#ff6b6b',
                  marginBottom: '4px',
                }}
              >
                {result.success ? 'Success!' : 'Error'}
              </p>
              <p style={{ color: '#a0a0b0', fontSize: '14px' }}>{result.message}</p>
            </div>
          </motion.div>
        )}

        <button
          className="btn btn-primary"
          onClick={handleSeed}
          disabled={isSeeding}
          style={{
            width: '100%',
            padding: '16px',
            fontSize: '16px',
            fontWeight: 700,
            opacity: isSeeding ? 0.5 : 1,
            cursor: isSeeding ? 'not-allowed' : 'pointer',
          }}
        >
          {isSeeding ? (
            <>
              <Loader size={20} className="animate-spin" />
              Seeding data...
            </>
          ) : (
            <>
              <Coffee size={20} />
              Seed Coffee Shop Data
            </>
          )}
        </button>

        <div style={{ marginTop: '24px', padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
          <p style={{ color: '#606070', fontSize: '12px', lineHeight: '1.6', marginBottom: '12px' }}>
            <strong>Note:</strong> Seed data akan menambahkan data baru tanpa menghapus data yang sudah ada.
            Jika produk/kategori dengan ID yang sama sudah ada, mereka tidak akan di-overwrite.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {useStore.getState().storage ? (
              <>
                <p style={{ color: '#00ff88', fontSize: '12px', lineHeight: '1.6' }}>
                  ✓ Storage initialized
                </p>
                {typeof useStore.getState().storage?.seedCoffeeShop === 'function' ? (
                  <p style={{ color: '#00ff88', fontSize: '12px', lineHeight: '1.6' }}>
                    ✓ Seed function available (LocalStorage)
                  </p>
                ) : typeof window !== 'undefined' && window.electronAPI?.storage?.seedCoffeeShop ? (
                  <p style={{ color: '#00ff88', fontSize: '12px', lineHeight: '1.6' }}>
                    ✓ Seed function available (Electron)
                  </p>
                ) : (
                  <p style={{ color: '#ffe66d', fontSize: '12px', lineHeight: '1.6' }}>
                    ⚠ Seed function not available
                  </p>
                )}
              </>
            ) : (
              <p style={{ color: '#ffe66d', fontSize: '12px', lineHeight: '1.6' }}>
                ⚠ Storage belum diinisialisasi. Silakan refresh halaman.
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

