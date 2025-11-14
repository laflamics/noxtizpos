import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { motion } from 'framer-motion';
import { UserPlus, ArrowLeft } from 'lucide-react';

export default function SignUp() {
  const navigate = useNavigate();
  const { createUser } = useStore();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'cashier',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.username || !formData.email || !formData.password) {
      setError('Semua field wajib diisi');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Password dan konfirmasi password tidak sama');
      return;
    }

    if (formData.password.length < 4) {
      setError('Password minimal 4 karakter');
      return;
    }

    setIsLoading(true);

    try {
      // Determine permissions based on role
      let permissions: string[] = [];
      if (formData.role === 'admin') {
        // Admin has access to everything
        permissions = ['/dashboard', '/pos', '/products', '/inventory', '/tables', '/orders', '/activity-logs', '/users', '/seed', '/settings'];
      } else if (formData.role === 'manager') {
        // Manager has access to most things except users and seed
        permissions = ['/dashboard', '/pos', '/products', '/inventory', '/tables', '/orders', '/activity-logs', '/settings'];
      } else {
        // Default cashier permissions
        permissions = ['/pos', '/products', '/inventory', '/tables', '/orders'];
      }

      await createUser({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        permissions: permissions,
        isActive: true,
      });
      
      // Redirect to login
      navigate('/login', { state: { message: 'Akun berhasil dibuat! Silakan login.' } });
    } catch (err) {
      console.error('Sign up error:', err);
      setError(err instanceof Error ? err.message : 'Gagal membuat akun. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '20px',
        paddingTop: '40px',
        paddingBottom: '40px',
        background: 'linear-gradient(135deg, #0a0a0f 0%, #151520 50%, #1f1f2e 100%)',
        position: 'relative',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      {/* Animated background elements */}
      <div
        style={{
          position: 'absolute',
          top: '-50%',
          right: '-50%',
          width: '800px',
          height: '800px',
          background: 'radial-gradient(circle, rgba(0,255,136,0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'pulse 8s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-50%',
          left: '-50%',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(0,212,255,0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'pulse 10s ease-in-out infinite',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card glass"
        style={{
          maxWidth: '450px',
          width: '100%',
          position: 'relative',
          zIndex: 1,
          marginTop: '20px',
          marginBottom: '20px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              display: 'inline-flex',
              marginBottom: '16px',
            }}
          >
            <img
              src="/Logo.gif"
              alt="Noxtiz POS"
              style={{
                width: '100px',
                height: '100px',
                objectFit: 'contain',
              }}
            />
          </motion.div>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #00ff88, #00d4ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '6px',
            }}
          >
            Daftar Akun
          </h1>
          <p style={{ color: '#a0a0b0', fontSize: '14px' }}>
            Buat akun baru untuk mengakses POS
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#a0a0b0',
              }}
            >
              Username *
            </label>
            <input
              type="text"
              className="input"
              placeholder="Masukkan username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              autoFocus
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#a0a0b0',
              }}
            >
              Email *
            </label>
            <input
              type="email"
              className="input"
              placeholder="Masukkan email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#a0a0b0',
              }}
            >
              Password *
            </label>
            <input
              type="password"
              className="input"
              placeholder="Masukkan password (min 4 karakter)"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={4}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#a0a0b0',
              }}
            >
              Konfirmasi Password *
            </label>
            <input
              type="password"
              className="input"
              placeholder="Masukkan ulang password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              minLength={4}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#a0a0b0',
              }}
            >
              Role
            </label>
            <select
              className="input"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="cashier">Cashier</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            <p style={{ fontSize: '12px', color: '#606070', marginTop: '4px' }}>
              Pilih role sesuai kebutuhan
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                padding: '12px',
                background: 'rgba(255, 107, 107, 0.1)',
                border: '1px solid #ff6b6b',
                borderRadius: '8px',
                color: '#ff6b6b',
                fontSize: '14px',
                marginBottom: '20px',
              }}
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
            style={{
              width: '100%',
              opacity: isLoading ? 0.5 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            <UserPlus size={18} />
            {isLoading ? 'Memproses...' : 'Daftar'}
          </button>
        </form>

        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/login')}
            style={{
              width: '100%',
              justifyContent: 'center',
            }}
          >
            <ArrowLeft size={18} />
            Kembali ke Login
          </button>
        </div>
      </motion.div>
    </div>
  );
}

