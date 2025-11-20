import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react';
import { CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

type NotificationOptions = {
  type?: NotificationType;
  title?: string;
  message: string;
  duration?: number;
};

type NotificationRecord = Required<NotificationOptions> & { id: string };

type NotificationContextValue = {
  notify: (options: NotificationOptions) => void;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

const typeConfig: Record<
  NotificationType,
  { color: string; bg: string; icon: typeof CheckCircle }
> = {
  success: {
    color: '#00ff88',
    bg: 'rgba(0, 255, 136, 0.1)',
    icon: CheckCircle,
  },
  error: {
    color: '#ff6b6b',
    bg: 'rgba(255, 107, 107, 0.12)',
    icon: XCircle,
  },
  warning: {
    color: '#ffe66d',
    bg: 'rgba(255, 230, 109, 0.12)',
    icon: AlertTriangle,
  },
  info: {
    color: '#00d4ff',
    bg: 'rgba(0, 212, 255, 0.12)',
    icon: Info,
  },
};

const DEFAULT_DURATION = 4200;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback(
    ({ type = 'info', title, message, duration = DEFAULT_DURATION }: NotificationOptions) => {
      if (!message) return;
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const record: NotificationRecord = {
        id,
        type,
        title: title || (type === 'success' ? 'Berhasil' : type === 'error' ? 'Terjadi Kesalahan' : type === 'warning' ? 'Perhatian' : 'Info'),
        message,
        duration,
      };
      setNotifications((prev) => [...prev, record]);

      if (duration > 0) {
        window.setTimeout(() => removeNotification(id), duration);
      }
    },
    [removeNotification]
  );

  const contextValue = useMemo(() => ({ notify }), [notify]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <div className="notification-stack">
        {notifications.map((item) => {
          const config = typeConfig[item.type];
          const Icon = config.icon;
          return (
            <div
              key={item.id}
              className="notification-card"
              style={{
                borderColor: config.color,
                background: 'var(--bg-primary)',
                boxShadow: `0 8px 24px rgba(0, 0, 0, 0.35)`,
              }}
            >
              <div className="notification-accent" style={{ background: config.bg }} />
              <div className="notification-icon" style={{ color: config.color }}>
                <Icon size={18} />
              </div>
              <div className="notification-content">
                {item.title && (
                  <div className="notification-title" style={{ color: config.color }}>
                    {item.title}
                  </div>
                )}
                <p className="notification-message">{item.message}</p>
              </div>
              <button
                className="notification-close"
                onClick={() => removeNotification(item.id)}
                aria-label="Tutup notifikasi"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
}


