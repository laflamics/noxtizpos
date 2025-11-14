import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { motion } from 'framer-motion';
import { LogIn, Settings } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login, loadUsers, users, setCurrentUser } = useStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await login(username, password);
      if (user) {
        setCurrentUser(user);
        navigate('/pos');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Gagal login. Coba lagi.');
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
            Culinary Lab POS
          </h1>
          <p style={{ color: '#a0a0b0', fontSize: '14px' }}>
            Masuk ke sistem POS
          </p>
        </div>

        <form onSubmit={handleLogin}>
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
              Username
            </label>
            <input
              type="text"
              className="input"
              placeholder="Masukkan username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
              Password
            </label>
            <input
              type="password"
              className="input"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
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
            disabled={isLoading || !username}
            style={{
              width: '100%',
              opacity: isLoading || !username ? 0.5 : 1,
              cursor: isLoading || !username ? 'not-allowed' : 'pointer',
            }}
          >
            <LogIn size={18} />
            {isLoading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/signup')}
            style={{
              width: '100%',
              justifyContent: 'center',
            }}
          >
            Belum punya akun? Daftar
          </button>
        </div>

        <button
          className="btn btn-secondary"
          onClick={() => navigate('/server-selection')}
          style={{
            width: '100%',
            marginTop: '16px',
            justifyContent: 'center',
          }}
        >
          <Settings size={18} />
          Ganti Server
        </button>
      </motion.div>
    </div>
  );
}

