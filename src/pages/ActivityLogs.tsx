import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Filter, Calendar, Search, User, ShoppingCart, Package, Trash2, TrendingUp, Settings, Users, Table2, Warehouse, AlertTriangle, X, CheckCircle } from 'lucide-react';
import type { ActivityLog, ActivityCategory } from '@/types';
import { useStore } from '@/store/useStore';
import { useNotification } from '@/components/NotificationProvider';
import LicenseCountdownBadge from '@/components/LicenseCountdownBadge';

export default function ActivityLogs() {
  const { storageType, settings } = useStore();
  const { notify } = useNotification();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Delete data modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStorageType, setDeleteStorageType] = useState<'local' | 'redis'>('local');
  const [deleteDataTypes, setDeleteDataTypes] = useState<{
    orders: boolean;
    stockMovements: boolean;
    activityLogs: boolean;
  }>({
    orders: false,
    stockMovements: false,
    activityLogs: false,
  });
  const [deleteDateRange, setDeleteDateRange] = useState<{
    useDateRange: boolean;
    startDate: string;
    endDate: string;
  }>({
    useDateRange: false,
    startDate: '',
    endDate: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState<{ success: boolean; message: string; counts?: Record<string, number> } | null>(null);

  useEffect(() => {
    loadLogs();
    // Auto refresh every 30 minutes
    const interval = setInterval(() => {
      loadLogs();
    }, 30 * 60 * 1000); // 30 minutes in milliseconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, selectedCategory, searchQuery, startDate, endDate]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const { storage } = useStore.getState();
      if (storage) {
        const data = await storage.getActivityLogs();
        const sortedData = Array.isArray(data) 
          ? data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          : [];
        setLogs(sortedData);
        console.log('Loaded activity logs:', sortedData.length);
      } else {
        console.warn('Electron API not available for activity logs');
        setLogs([]);
      }
    } catch (error) {
      console.error('Failed to load activity logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = [...logs];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((log) => log.category === selectedCategory);
    }

    // Filter by date range
    if (startDate) {
      filtered = filtered.filter((log) => log.createdAt >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter((log) => log.createdAt <= `${endDate}T23:59:59.999Z`);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.description.toLowerCase().includes(query) ||
          log.userName?.toLowerCase().includes(query) ||
          log.action.toLowerCase().includes(query) ||
          log.details?.orderId?.toLowerCase().includes(query) ||
          log.details?.productName?.toLowerCase().includes(query) ||
          log.details?.tableNumber?.toLowerCase().includes(query)
      );
    }

    setFilteredLogs(filtered);
  };

  const getCategoryIcon = (category: ActivityCategory) => {
    switch (category) {
      case 'order':
        return ShoppingCart;
      case 'void':
        return Trash2;
      case 'stock':
      case 'inventory':
        return Warehouse;
      case 'product':
        return Package;
      case 'user':
        return Users;
      case 'table':
        return Table2;
      case 'settings':
        return Settings;
      case 'payment':
        return TrendingUp;
      default:
        return FileText;
    }
  };

  const getCategoryColor = (category: ActivityCategory) => {
    switch (category) {
      case 'order':
        return '#00ff88';
      case 'void':
        return '#ff6b6b';
      case 'stock':
      case 'inventory':
        return '#00d4ff';
      case 'product':
        return '#ffe66d';
      case 'user':
        return '#95e1d3';
      case 'table':
        return '#ffa07a';
      case 'settings':
        return '#dda0dd';
      case 'payment':
        return '#98d8c8';
      default:
        return '#a0a0b0';
    }
  };

  const formatDetails = (details: ActivityLog['details']) => {
    if (!details) return null;
    
    const parts: string[] = [];
    if (details.orderTotal) parts.push(`Total: Rp ${details.orderTotal.toLocaleString('id-ID')}`);
    if (details.quantity && !details.items) parts.push(`Qty: ${details.quantity}`);
    if (details.tableNumber) parts.push(`Meja: ${details.tableNumber}`);
    if (details.paymentMethod) parts.push(`Pembayaran: ${details.paymentMethod}`);
    if (details.paymentReference) parts.push(`Ref: ${details.paymentReference}`);
    if (details.voidPin) parts.push(`PIN: ${details.voidPin}`);
    if (details.voidBy) parts.push(`Void by: ${details.voidBy}`);
    if (details.cartTotal) parts.push(`Nilai Cart: Rp ${details.cartTotal.toLocaleString('id-ID')}`);
    if (details.subtotal && !details.items) parts.push(`Nilai: Rp ${details.subtotal.toLocaleString('id-ID')}`);
    
    return parts.length > 0 ? parts.join(' • ') : null;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ color: '#a0a0b0' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
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
            Activity Logs
          </h1>
          <p style={{ color: '#a0a0b0', fontSize: '16px' }}>Riwayat aktivitas sistem</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <LicenseCountdownBadge />
          <button
            className="btn btn-danger"
            onClick={() => setShowDeleteModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Trash2 size={18} />
            Hapus Data
          </button>
        </div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
        style={{ marginBottom: '24px' }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#a0a0b0' }}>
              <Filter size={16} style={{ display: 'inline', marginRight: '8px' }} />
              Kategori
            </label>
            <select
              className="input"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as ActivityCategory | 'all')}
            >
              <option value="all">Semua</option>
              <option value="order">Order</option>
              <option value="void">Void</option>
              <option value="stock">Stock</option>
              <option value="inventory">Inventory</option>
              <option value="product">Product</option>
              <option value="user">User</option>
              <option value="table">Table</option>
              <option value="settings">Settings</option>
              <option value="payment">Payment</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#a0a0b0' }}>
              <Calendar size={16} style={{ display: 'inline', marginRight: '8px' }} />
              Dari Tanggal
            </label>
            <input
              type="date"
              className="input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#a0a0b0' }}>
              <Calendar size={16} style={{ display: 'inline', marginRight: '8px' }} />
              Sampai Tanggal
            </label>
            <input
              type="date"
              className="input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#a0a0b0' }}>
              <Search size={16} style={{ display: 'inline', marginRight: '8px' }} />
              Cari
            </label>
            <input
              type="text"
              className="input"
              placeholder="Cari aktivitas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {(['order', 'void', 'stock', 'product'] as ActivityCategory[]).map((category) => {
          const count = logs.filter((l) => l.category === category).length;
          const Icon = getCategoryIcon(category);
          const color = getCategoryColor(category);
          return (
            <motion.div
              key={category}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card"
              style={{ padding: '16px', textAlign: 'center' }}
            >
              <Icon size={24} color={color} style={{ marginBottom: '8px' }} />
              <div style={{ fontSize: '24px', fontWeight: 800, color }}>{count}</div>
              <div style={{ fontSize: '12px', color: '#a0a0b0', textTransform: 'capitalize' }}>{category}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Logs List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
      >
        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>
          Riwayat Aktivitas ({filteredLogs.length})
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '600px', overflowY: 'auto' }}>
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log) => {
              const Icon = getCategoryIcon(log.category);
              const color = getCategoryColor(log.category);
              const details = formatDetails(log.details);
              
              return (
                <div
                  key={log.id}
                  style={{
                    padding: '16px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '8px',
                    border: `1px solid ${color}40`,
                    borderLeft: `4px solid ${color}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ flex: 1, minWidth: '300px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <Icon size={20} color={color} />
                        <span
                          style={{
                            padding: '4px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            background: `${color}20`,
                            color,
                            textTransform: 'uppercase',
                          }}
                        >
                          {log.category}
                        </span>
                        <span
                          style={{
                            padding: '4px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            background: 'var(--bg-secondary)',
                            color: '#a0a0b0',
                            textTransform: 'capitalize',
                          }}
                        >
                          {log.action}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: '#fff' }}>
                        {log.description}
                      </h3>
                      {details && (
                        <p style={{ color: '#a0a0b0', fontSize: '14px', marginBottom: '8px' }}>{details}</p>
                      )}
                      {log.details?.items && log.details.items.length > 0 && (
                        <div style={{ marginTop: '8px', padding: '8px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                          <p style={{ fontSize: '12px', color: '#a0a0b0', marginBottom: '4px' }}>Items:</p>
                          {log.details.items.map((item: any, idx: number) => (
                            <p key={idx} style={{ fontSize: '12px', color: '#606070' }}>
                              • {item.productName} x{item.quantity} = Rp {item.subtotal?.toLocaleString('id-ID') || (item.price * item.quantity).toLocaleString('id-ID')}
                            </p>
                          ))}
                        </div>
                      )}
                      {log.category === 'void' && log.details && !log.details.items && (
                        <div style={{ marginTop: '8px', padding: '8px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                          <p style={{ fontSize: '12px', color: '#606070' }}>
                            {log.details.productName && (
                              <>• {log.details.productName} x{log.details.quantity || 1} = Rp {(log.details.subtotal || log.details.price * (log.details.quantity || 1)).toLocaleString('id-ID')}</>
                            )}
                          </p>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
                        {log.userName && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#a0a0b0' }}>
                            <User size={14} />
                            {log.userName}
                          </div>
                        )}
                        <div style={{ fontSize: '12px', color: '#606070' }}>
                          {new Date(log.createdAt).toLocaleString('id-ID')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', padding: '60px', color: '#606070' }}>
              Tidak ada aktivitas yang ditemukan
            </div>
          )}
        </div>
      </motion.div>

      {/* Delete Data Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              zIndex: 1000,
              paddingTop: '40px',
              paddingBottom: '40px',
              overflowY: 'auto',
              overflowX: 'hidden',
            }}
            onClick={() => {
              if (!isDeleting) {
                setShowDeleteModal(false);
                setDeleteResult(null);
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="card"
              style={{
                maxWidth: '600px',
                width: '90%',
                maxHeight: 'calc(100vh - 80px)',
                marginTop: '20px',
                marginBottom: '20px',
                position: 'relative',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <AlertTriangle size={24} style={{ color: '#ff6b6b' }} />
                  Hapus Data Database
                </h2>
                <button
                  onClick={() => {
                    if (!isDeleting) {
                      setShowDeleteModal(false);
                      setDeleteResult(null);
                    }
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#a0a0b0',
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    padding: '4px',
                  }}
                  disabled={isDeleting}
                >
                  <X size={24} />
                </button>
              </div>

              {deleteResult ? (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  {deleteResult.success ? (
                    <div>
                      <CheckCircle size={48} style={{ color: 'var(--accent-color)', marginBottom: '16px' }} />
                      <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--accent-color)' }}>
                        Data Berhasil Dihapus!
                      </h3>
                      {deleteResult.counts && (
                        <div style={{ marginTop: '16px', textAlign: 'left', background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '8px' }}>
                          <p style={{ color: '#a0a0b0', marginBottom: '8px' }}>Data yang dihapus:</p>
                          {deleteResult.counts.orders > 0 && (
                            <p style={{ color: '#a0a0b0', fontSize: '14px' }}>• Orders: {deleteResult.counts.orders} data</p>
                          )}
                          {deleteResult.counts.stockMovements > 0 && (
                            <p style={{ color: '#a0a0b0', fontSize: '14px' }}>• Stock Movements: {deleteResult.counts.stockMovements} data</p>
                          )}
                          {deleteResult.counts.activityLogs > 0 && (
                            <p style={{ color: '#a0a0b0', fontSize: '14px' }}>• Activity Logs: {deleteResult.counts.activityLogs} data</p>
                          )}
                        </div>
                      )}
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          setShowDeleteModal(false);
                          setDeleteResult(null);
                          loadLogs();
                        }}
                        style={{ marginTop: '20px', width: '100%' }}
                      >
                        Tutup
                      </button>
                    </div>
                  ) : (
                    <div>
                      <AlertTriangle size={48} style={{ color: '#ff6b6b', marginBottom: '16px' }} />
                      <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: '#ff6b6b' }}>
                        Gagal Menghapus Data
                      </h3>
                      <p style={{ color: '#a0a0b0', marginBottom: '20px' }}>{deleteResult.message}</p>
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          setDeleteResult(null);
                        }}
                        style={{ width: '100%' }}
                      >
                        Coba Lagi
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Storage Type Selection */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                      Pilih Database
                    </label>
                    <select
                      className="input"
                      value={deleteStorageType}
                      onChange={(e) => setDeleteStorageType(e.target.value as 'local' | 'redis')}
                      disabled={isDeleting}
                    >
                      <option value="local">Local Storage</option>
                      <option value="redis">Upstash Redis</option>
                    </select>
                    <p style={{ color: '#a0a0b0', fontSize: '12px', marginTop: '4px' }}>
                      Database saat ini: <strong>{storageType === 'local' ? 'Local Storage' : 'Upstash Redis'}</strong>
                    </p>
                  </div>

                  {/* Data Type Selection */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: 500 }}>
                      Pilih Data yang Akan Dihapus
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: isDeleting ? 'not-allowed' : 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={deleteDataTypes.orders}
                          onChange={(e) => setDeleteDataTypes({ ...deleteDataTypes, orders: e.target.checked })}
                          disabled={isDeleting}
                          style={{ width: '18px', height: '18px', cursor: isDeleting ? 'not-allowed' : 'pointer' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600 }}>Semua Transaksi (Orders)</div>
                          <div style={{ fontSize: '12px', color: '#a0a0b0' }}>Menghapus semua data pesanan/transaksi</div>
                        </div>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: isDeleting ? 'not-allowed' : 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={deleteDataTypes.stockMovements}
                          onChange={(e) => setDeleteDataTypes({ ...deleteDataTypes, stockMovements: e.target.checked })}
                          disabled={isDeleting}
                          style={{ width: '18px', height: '18px', cursor: isDeleting ? 'not-allowed' : 'pointer' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600 }}>Stock Movements</div>
                          <div style={{ fontSize: '12px', color: '#a0a0b0' }}>Menghapus semua data pergerakan stok (in, out, adjustment)</div>
                        </div>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: isDeleting ? 'not-allowed' : 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={deleteDataTypes.activityLogs}
                          onChange={(e) => setDeleteDataTypes({ ...deleteDataTypes, activityLogs: e.target.checked })}
                          disabled={isDeleting}
                          style={{ width: '18px', height: '18px', cursor: isDeleting ? 'not-allowed' : 'pointer' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600 }}>Activity Logs</div>
                          <div style={{ fontSize: '12px', color: '#a0a0b0' }}>Menghapus semua riwayat aktivitas sistem</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Date Range Selection */}
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', cursor: isDeleting ? 'not-allowed' : 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={deleteDateRange.useDateRange}
                        onChange={(e) => setDeleteDateRange({ ...deleteDateRange, useDateRange: e.target.checked })}
                        disabled={isDeleting}
                        style={{ width: '18px', height: '18px', cursor: isDeleting ? 'not-allowed' : 'pointer' }}
                      />
                      <span style={{ fontWeight: 500 }}>Gunakan Custom Date Range</span>
                    </label>
                    {deleteDateRange.useDateRange && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: '#a0a0b0' }}>
                            Dari Tanggal
                          </label>
                          <input
                            type="date"
                            className="input"
                            value={deleteDateRange.startDate}
                            onChange={(e) => setDeleteDateRange({ ...deleteDateRange, startDate: e.target.value })}
                            disabled={isDeleting}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: '#a0a0b0' }}>
                            Sampai Tanggal
                          </label>
                          <input
                            type="date"
                            className="input"
                            value={deleteDateRange.endDate}
                            onChange={(e) => setDeleteDateRange({ ...deleteDateRange, endDate: e.target.value })}
                            disabled={isDeleting}
                          />
                        </div>
                      </div>
                    )}
                    {!deleteDateRange.useDateRange && (
                      <p style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '8px', fontWeight: 600 }}>
                        ⚠️ Jika tidak menggunakan date range, SEMUA data akan dihapus!
                      </p>
                    )}
                  </div>

                  {/* Warning */}
                  <div style={{ padding: '16px', background: 'rgba(255, 107, 107, 0.1)', borderRadius: '8px', border: '1px solid #ff6b6b' }}>
                    <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                      <AlertTriangle size={20} style={{ color: '#ff6b6b', flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong style={{ color: '#ff6b6b', display: 'block', marginBottom: '4px' }}>Peringatan!</strong>
                        <p style={{ color: '#a0a0b0', fontSize: '12px', lineHeight: '1.6' }}>
                          Tindakan ini tidak dapat dibatalkan. Pastikan Anda sudah membackup data penting sebelum menghapus.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowDeleteModal(false);
                        setDeleteResult(null);
                        setDeleteDataTypes({ orders: false, stockMovements: false, activityLogs: false });
                        setDeleteDateRange({ useDateRange: false, startDate: '', endDate: '' });
                      }}
                      disabled={isDeleting}
                      style={{ flex: 1 }}
                    >
                      Batal
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={handleDeleteData}
                      disabled={isDeleting || (!deleteDataTypes.orders && !deleteDataTypes.stockMovements && !deleteDataTypes.activityLogs) || (deleteDateRange.useDateRange && (!deleteDateRange.startDate || !deleteDateRange.endDate))}
                      style={{ flex: 1 }}
                    >
                      {isDeleting ? (
                        <>
                          <div style={{ width: '16px', height: '16px', border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                          Menghapus...
                        </>
                      ) : (
                        <>
                          <Trash2 size={18} />
                          Hapus Data
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  async function handleDeleteData() {
    if (!deleteDataTypes.orders && !deleteDataTypes.stockMovements && !deleteDataTypes.activityLogs) {
      notify({
        type: 'warning',
        title: 'Belum pilih data',
        message: 'Pilih minimal satu jenis data dulu sebelum hapus.',
      });
      return;
    }

    if (deleteDateRange.useDateRange && (!deleteDateRange.startDate || !deleteDateRange.endDate)) {
      notify({
        type: 'warning',
        title: 'Rentang tanggal belum lengkap',
        message: 'Isi tanggal mulai dan akhir dulu ya.',
      });
      return;
    }

    const confirmed = window.confirm(
      `Yakin ingin menghapus data dari ${deleteStorageType === 'local' ? 'Local Storage' : 'Upstash Redis'}?\n\n` +
      `Data yang akan dihapus:\n` +
      `${deleteDataTypes.orders ? '• Semua Transaksi\n' : ''}` +
      `${deleteDataTypes.stockMovements ? '• Stock Movements\n' : ''}` +
      `${deleteDataTypes.activityLogs ? '• Activity Logs\n' : ''}` +
      `${deleteDateRange.useDateRange ? `\nRentang: ${deleteDateRange.startDate} - ${deleteDateRange.endDate}` : '\n(Semua data)'}\n\n` +
      `Tindakan ini TIDAK DAPAT DIBATALKAN!`
    );

    if (!confirmed) return;

    setIsDeleting(true);
    setDeleteResult(null);

    try {
      // Switch storage if needed
      const { switchStorage } = useStore.getState();
      if (deleteStorageType !== storageType) {
        if (deleteStorageType === 'redis' && settings.redisUrl && settings.redisToken) {
          await switchStorage('redis', settings.redisUrl, settings.redisToken);
        } else if (deleteStorageType === 'local') {
          await switchStorage('local');
        } else {
          throw new Error('Redis URL dan Token harus diisi di Settings untuk menggunakan Redis');
        }
      }

      const counts: Record<string, number> = {};
      
      // Wait a bit after storage switch to ensure API is ready
      if (deleteStorageType !== storageType) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const { storage } = useStore.getState();

      if (!storage) {
        throw new Error('Storage tidak tersedia. Silakan refresh halaman.');
      }

      // Delete based on date range or all
      if (deleteDateRange.useDateRange) {
        const startDate = new Date(deleteDateRange.startDate).toISOString();
        const endDate = new Date(deleteDateRange.endDate).toISOString();
        
        if (deleteDataTypes.orders) {
          counts.orders = await storage.deleteOrdersByDateRange(startDate, endDate);
        }
        if (deleteDataTypes.stockMovements) {
          counts.stockMovements = await storage.deleteStockMovementsByDateRange(startDate, endDate);
        }
        if (deleteDataTypes.activityLogs) {
          counts.activityLogs = await storage.deleteActivityLogsByDateRange(startDate, endDate);
        }
      } else {
        if (deleteDataTypes.orders) {
          counts.orders = await storage.deleteAllOrders();
        }
        if (deleteDataTypes.stockMovements) {
          counts.stockMovements = await storage.deleteAllStockMovements();
        }
        if (deleteDataTypes.activityLogs) {
          counts.activityLogs = await storage.deleteAllActivityLogs();
        }
      }

      // Log activity
      if (storage) {
        await storage.createActivityLog({
          category: 'settings',
          action: 'delete_data',
          description: `Menghapus data dari ${deleteStorageType === 'local' ? 'Local Storage' : 'Upstash Redis'}`,
          userId: useStore.getState().currentUser?.id,
          userName: useStore.getState().currentUser?.username,
          details: {
            storageType: deleteStorageType,
            dataTypes: deleteDataTypes,
            dateRange: deleteDateRange.useDateRange ? { start: deleteDateRange.startDate, end: deleteDateRange.endDate } : null,
            counts,
          },
        });
      }

      // Reload logs
      await loadLogs();

      setDeleteResult({
        success: true,
        message: 'Data berhasil dihapus',
        counts,
      });
    } catch (error) {
      console.error('Error deleting data:', error);
      setDeleteResult({
        success: false,
        message: error instanceof Error ? error.message : 'Gagal menghapus data',
      });
    } finally {
      setIsDeleting(false);
    }
  }
}

