import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FileText,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Database,
  Warehouse,
  Table2,
  History,
  Receipt,
  Book,
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, setCurrentUser } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = () => {
    setCurrentUser(null);
    navigate('/login');
  };

  // Define all available menu items
  const allMenuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/pos', icon: ShoppingCart, label: 'POS' },
    { path: '/products', icon: Package, label: 'Produk' },
    { path: '/inventory', icon: Warehouse, label: 'Inventory' },
    { path: '/tables', icon: Table2, label: 'Meja' },
    { path: '/orders', icon: FileText, label: 'Pesanan' },
    { path: '/closing-report', icon: Receipt, label: 'Closing Report' },
    { path: '/activity-logs', icon: History, label: 'Activity Logs' },
    { path: '/users', icon: Users, label: 'Users' },
    { path: '/seed', icon: Database, label: 'Seed Data' },
    { path: '/user-guide', icon: Book, label: 'User Guide' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  // Filter menu items based on user permissions
  const navItems = allMenuItems.filter((item) => {
    // User Guide is accessible to everyone
    if (item.path === '/user-guide') {
      return true;
    }
    
    // Admin always has access to everything
    if (currentUser?.role === 'admin') {
      return true;
    }
    
    // Check if user has permissions array
    if (currentUser?.permissions && currentUser.permissions.length > 0) {
      return currentUser.permissions.includes(item.path);
    }
    
    // Default permissions for cashier (backward compatibility)
    if (currentUser?.role === 'cashier') {
      return ['/pos', '/products', '/inventory', '/tables', '/orders'].includes(item.path);
    }
    
    // Default permissions for manager (backward compatibility)
    if (currentUser?.role === 'manager') {
      return !['/users', '/seed'].includes(item.path);
    }
    
    // No access by default
    return false;
  });

  const SidebarContent = () => (
    <>
      <div style={{ marginBottom: '32px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px',
          }}
        >
          <img
            src="/Logo.gif"
            alt="Noxtiz POS"
            style={{
              width: '48px',
              height: '48px',
              objectFit: 'contain',
            }}
          />
          <div>
            <h1
              style={{
                fontSize: '20px',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #00ff88, #00d4ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Noxtiz POS
            </h1>
            <p style={{ fontSize: '12px', color: '#606070' }}>Culinary Lab</p>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{ textDecoration: 'none' }}
              onClick={() => isMobile && setIsMobileMenuOpen(false)}
            >
              <motion.div
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: isActive ? 'rgba(0, 255, 136, 0.1)' : 'transparent',
                  border: isActive ? '1px solid #00ff88' : '1px solid transparent',
                  color: isActive ? '#00ff88' : '#a0a0b0',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
              >
                <Icon size={20} />
                <span style={{ fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto', paddingTop: '24px', paddingBottom: '24px', borderTop: '1px solid var(--border-color)', flexShrink: 0 }}>
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '12px',
            background: 'var(--bg-tertiary)',
            borderRadius: '8px',
            fontSize: '14px',
          }}
        >
          <p style={{ color: '#a0a0b0', fontSize: '12px', marginBottom: '4px' }}>Logged in as</p>
          <p style={{ fontWeight: 600, color: '#00ff88' }}>{currentUser?.username}</p>
          <p style={{ fontSize: '12px', color: '#606070', textTransform: 'capitalize' }}>
            {currentUser?.role}
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={handleLogout}
          style={{ width: '100%', justifyContent: 'center', flexShrink: 0, marginBottom: '0' }}
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        flexDirection: isMobile ? 'column' : 'row',
      }}
    >
      {/* Mobile Header */}
      {isMobile && (
        <div
          style={{
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-color)',
            padding: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            zIndex: 100,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src="/Logo.gif"
              alt="Noxtiz POS"
              style={{
                width: '32px',
                height: '32px',
                objectFit: 'contain',
              }}
            />
            <h1
              style={{
                fontSize: '18px',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #00ff88, #00d4ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Noxtiz POS
            </h1>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{ padding: '8px', minWidth: 'auto' }}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      )}

      {/* Sidebar */}
      {!isMobile ? (
        <aside
          style={{
            width: '260px',
            background: 'var(--bg-secondary)',
            borderRight: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            padding: '24px',
            position: 'sticky',
            top: 0,
            maxHeight: 'calc(100vh - 50px)',
            height: 'calc(100vh - 50px)',
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          <SidebarContent />
        </aside>
      ) : (
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'fixed',
                top: '57px',
                left: 0,
                width: '280px',
                height: 'calc(100vh - 57px)',
                maxHeight: 'calc(100vh - 57px)',
                background: 'var(--bg-secondary)',
                borderRight: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                padding: '24px',
                paddingBottom: '40px',
                overflowY: 'auto',
                overflowX: 'hidden',
                zIndex: 99,
              }}
            >
              <SidebarContent />
            </motion.aside>
          )}
        </AnimatePresence>
      )}

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          padding: isMobile ? '16px' : '32px',
          paddingBottom: isMobile ? '60px' : '60px',
          overflowY: 'auto',
          maxWidth: isMobile ? '100%' : 'calc(100vw - 260px)',
        }}
      >
        {children}
      </main>
    </div>
  );
}

