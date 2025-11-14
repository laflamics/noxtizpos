import { motion } from 'framer-motion';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0a0f 0%, #151520 100%)',
        gap: '24px',
      }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        style={{
          width: '64px',
          height: '64px',
          border: '4px solid rgba(0, 255, 136, 0.2)',
          borderTopColor: '#00ff88',
          borderRadius: '50%',
        }}
      />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{
          color: '#00ff88',
          fontSize: '18px',
          fontWeight: 600,
        }}
      >
        {message}
      </motion.p>
    </div>
  );
}

