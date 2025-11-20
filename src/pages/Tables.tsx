import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Edit2, Trash2, CheckCircle, Clock, AlertCircle, Sparkles, Users } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { Table } from '@/types';
import LicenseCountdownBadge from '@/components/LicenseCountdownBadge';
import { useNotification } from '@/components/NotificationProvider';

export default function Tables() {
  const { currentUser, storage } = useStore();
  const { notify } = useNotification();
  const [tables, setTables] = useState<Table[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      if (storage) {
        const data = await storage.getTables();
        setTables(data);
      }
    } catch (error) {
      console.error('Failed to load tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const tableData = {
      number: formData.get('number') as string,
      name: formData.get('name') as string || undefined,
      capacity: parseInt(formData.get('capacity') as string),
      status: 'available' as const,
    };

    try {
      if (storage) {
        const newTable = await storage.createTable(tableData);
        
        // Log table create
        if (storage && currentUser) {
          await storage.createActivityLog({
            category: 'table',
            action: 'create',
            description: `Tambah meja baru: Meja ${tableData.number}`,
            userId: currentUser.id,
            userName: currentUser.username,
            details: {
              tableId: newTable.id,
              tableNumber: tableData.number,
              tableName: tableData.name,
              capacity: tableData.capacity,
            },
          });
        }
        
        await loadTables();
        setShowCreateModal(false);
        (e.target as HTMLFormElement).reset();
      }
    } catch (error) {
      console.error('Failed to create table:', error);
      notify({
        type: 'error',
        title: 'Tambah meja gagal',
        message: 'Meja baru belum bisa dibuat. Coba lagi.',
      });
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedTable) return;

    const formData = new FormData(e.currentTarget);
    const tableData = {
      number: formData.get('number') as string,
      name: formData.get('name') as string || undefined,
      capacity: parseInt(formData.get('capacity') as string),
      status: formData.get('status') as Table['status'],
    };

    try {
      if (storage) {
        const oldTable = { ...selectedTable };
        await storage.updateTable(selectedTable.id, tableData);
        
        // Log table update
        if (storage && currentUser) {
          await storage.createActivityLog({
            category: 'table',
            action: 'update',
            description: `Update meja: Meja ${tableData.number}`,
            userId: currentUser.id,
            userName: currentUser.username,
            details: {
              tableId: selectedTable.id,
              tableNumber: tableData.number,
              previousValue: oldTable,
              newValue: { ...oldTable, ...tableData },
            },
          });
        }
        
        await loadTables();
        setShowEditModal(false);
        setSelectedTable(null);
      }
    } catch (error) {
      console.error('Failed to update table:', error);
      notify({
        type: 'error',
        title: 'Update meja gagal',
        message: 'Perubahan meja belum tersimpan.',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus meja ini?')) return;

    try {
      const table = tables.find(t => t.id === id);
      if (storage) {
        await storage.deleteTable(id);
        
        // Log table delete
        if (storage && currentUser && table) {
          await storage.createActivityLog({
            category: 'table',
            action: 'delete',
            description: `Hapus meja: Meja ${table.number}`,
            userId: currentUser.id,
            userName: currentUser.username,
            details: {
              tableId: id,
              tableNumber: table.number,
              previousValue: table,
            },
          });
        }
        
        await loadTables();
      }
    } catch (error) {
      console.error('Failed to delete table:', error);
      notify({
        type: 'error',
        title: 'Hapus meja gagal',
        message: 'Meja belum terhapus. Silakan coba ulang.',
      });
    }
  };

  const handleStatusChange = async (table: Table, newStatus: Table['status']) => {
    try {
      if (storage) {
        await storage.updateTable(table.id, { status: newStatus });
        
        // Log table status change
        if (storage && currentUser) {
          await storage.createActivityLog({
            category: 'table',
            action: 'status_change',
            description: `Ubah status meja ${table.number}: ${table.status} → ${newStatus}`,
            userId: currentUser.id,
            userName: currentUser.username,
            details: {
              tableId: table.id,
              tableNumber: table.number,
              previousStatus: table.status,
              newStatus,
            },
          });
        }
        
        await loadTables();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const getStatusColor = (status: Table['status']) => {
    switch (status) {
      case 'available':
        return { bg: 'rgba(0, 255, 136, 0.2)', color: '#00ff88', icon: CheckCircle };
      case 'occupied':
        return { bg: 'rgba(255, 107, 107, 0.2)', color: '#ff6b6b', icon: Users };
      case 'reserved':
        return { bg: 'rgba(255, 230, 109, 0.2)', color: '#ffe66d', icon: Clock };
      case 'cleaning':
        return { bg: 'rgba(0, 212, 255, 0.2)', color: '#00d4ff', icon: AlertCircle };
      default:
        return { bg: 'rgba(160, 160, 176, 0.2)', color: '#a0a0b0', icon: AlertCircle };
    }
  };

  const getStatusLabel = (status: Table['status']) => {
    switch (status) {
      case 'available':
        return 'Tersedia';
      case 'occupied':
        return 'Terisi';
      case 'reserved':
        return 'Dipesan';
      case 'cleaning':
        return 'Bersih-bersih';
      default:
        return status;
    }
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
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
            Table Management
          </h1>
          <p style={{ color: '#a0a0b0', fontSize: '16px' }}>Kelola meja restoran dan statusnya</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <LicenseCountdownBadge />
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={18} />
            Tambah Meja
          </button>
        </div>
      </div>

      {/* Status Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {(['available', 'occupied', 'reserved', 'cleaning'] as Table['status'][]).map((status) => {
          const count = tables.filter((t) => t.status === status).length;
          const { bg, color, icon: Icon } = getStatusColor(status);
          return (
            <motion.div
              key={status}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
              style={{ padding: '20px', background: bg }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <Icon size={24} color={color} />
                <span style={{ color, fontSize: '14px', fontWeight: 600, textTransform: 'uppercase' }}>
                  {getStatusLabel(status)}
                </span>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color }}>{count}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Tables Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
        {tables.length > 0 ? (
          tables.map((table) => {
            const { bg, color, icon: Icon } = getStatusColor(table.status);
            return (
              <motion.div
                key={table.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card"
                style={{
                  padding: '24px',
                  background: bg,
                  border: `2px solid ${color}`,
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '24px', fontWeight: 800, color, marginBottom: '4px' }}>
                      {table.number}
                    </h3>
                    {table.name && (
                      <p style={{ color: '#a0a0b0', fontSize: '14px' }}>{table.name}</p>
                    )}
                  </div>
                  <Icon size={24} color={color} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Users size={16} color={color} />
                  <span style={{ color, fontSize: '14px', fontWeight: 600 }}>
                    {table.capacity} Kursi
                  </span>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <select
                    className="input"
                    value={table.status}
                    onChange={(e) => handleStatusChange(table, e.target.value as Table['status'])}
                    style={{
                      width: '100%',
                      background: 'var(--bg-primary)',
                      border: `1px solid ${color}`,
                      color: color,
                      fontSize: '12px',
                      padding: '8px',
                    }}
                  >
                    <option value="available">Tersedia</option>
                    <option value="occupied">Terisi</option>
                    <option value="reserved">Dipesan</option>
                    <option value="cleaning">Bersih-bersih</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setSelectedTable(table);
                      setShowEditModal(true);
                    }}
                    style={{ flex: 1, padding: '8px', fontSize: '12px' }}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(table.id)}
                    style={{ padding: '8px', fontSize: '12px' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: '#606070' }}>
            <Sparkles size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p>Belum ada meja. Klik "Tambah Meja" untuk membuat meja pertama.</p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
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
              padding: '20px',
              overflowY: 'auto',
            }}
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card"
              style={{ maxWidth: '500px', width: '100%', maxHeight: '85vh', overflowY: 'auto', marginTop: '20px', marginBottom: '20px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Tambah Meja</h2>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: '8px', minWidth: 'auto' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreate}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                      Nomor Meja *
                    </label>
                    <input
                      type="text"
                      name="number"
                      className="input"
                      required
                      placeholder="1, A1, VIP-1, dll"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                      Nama Meja (opsional)
                    </label>
                    <input
                      type="text"
                      name="name"
                      className="input"
                      placeholder="Meja Kaca, Meja Teras, dll"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                      Kapasitas *
                    </label>
                    <input
                      type="number"
                      name="capacity"
                      className="input"
                      min="1"
                      required
                      defaultValue={4}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowCreateModal(false)}
                    style={{ flex: 1 }}
                  >
                    Batal
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    <Plus size={18} />
                    Tambah
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && selectedTable && (
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
              padding: '20px',
              overflowY: 'auto',
            }}
            onClick={() => {
              setShowEditModal(false);
              setSelectedTable(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card"
              style={{ maxWidth: '500px', width: '100%', maxHeight: '85vh', overflowY: 'auto', marginTop: '20px', marginBottom: '20px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Edit Meja</h2>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedTable(null);
                  }}
                  style={{ padding: '8px', minWidth: 'auto' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdate}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                      Nomor Meja *
                    </label>
                    <input
                      type="text"
                      name="number"
                      className="input"
                      required
                      defaultValue={selectedTable.number}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                      Nama Meja (opsional)
                    </label>
                    <input
                      type="text"
                      name="name"
                      className="input"
                      defaultValue={selectedTable.name || ''}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                      Kapasitas *
                    </label>
                    <input
                      type="number"
                      name="capacity"
                      className="input"
                      min="1"
                      required
                      defaultValue={selectedTable.capacity}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                      Status *
                    </label>
                    <select name="status" className="input" required defaultValue={selectedTable.status}>
                      <option value="available">Tersedia</option>
                      <option value="occupied">Terisi</option>
                      <option value="reserved">Dipesan</option>
                      <option value="cleaning">Bersih-bersih</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedTable(null);
                    }}
                    style={{ flex: 1 }}
                  >
                    Batal
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    <Edit2 size={18} />
                    Update
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

