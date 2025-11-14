import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Search, X, Shield, User, UserCheck } from 'lucide-react';

// Available menu permissions
const MENU_PERMISSIONS = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/pos', label: 'POS' },
  { path: '/products', label: 'Produk' },
  { path: '/inventory', label: 'Inventory' },
  { path: '/tables', label: 'Meja' },
  { path: '/orders', label: 'Pesanan' },
  { path: '/activity-logs', label: 'Activity Logs' },
  { path: '/users', label: 'Users' },
  { path: '/seed', label: 'Seed Data' },
  { path: '/settings', label: 'Settings' },
];

// Default permissions for cashier
const DEFAULT_CASHIER_PERMISSIONS = ['/pos', '/products', '/inventory', '/tables', '/orders'];

export default function Users() {
  const { users, loadUsers, createUser, updateUser, deleteUser, currentUser, storage } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [currentRole, setCurrentRole] = useState<string>('');

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Initialize permissions when editing user or creating new user
  useEffect(() => {
    if (editingUser) {
      setCurrentRole(editingUser.role || '');
      if (editingUser.permissions && editingUser.permissions.length > 0) {
        setSelectedPermissions(editingUser.permissions);
      } else if (editingUser.role === 'cashier') {
        setSelectedPermissions(DEFAULT_CASHIER_PERMISSIONS);
      } else {
        setSelectedPermissions([]);
      }
    } else {
      // New user - default to cashier permissions
      setCurrentRole('');
      setSelectedPermissions(DEFAULT_CASHIER_PERMISSIONS);
    }
  }, [editingUser]);

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const role = formData.get('role') as string;
    
    // Determine permissions based on role
    let permissions: string[] = [];
    if (role === 'admin') {
      // Admin has access to everything
      permissions = MENU_PERMISSIONS.map(m => m.path);
    } else {
      // Use selected permissions (default to cashier permissions if empty)
      permissions = selectedPermissions.length > 0 ? selectedPermissions : DEFAULT_CASHIER_PERMISSIONS;
    }
    
    const password = formData.get('password') as string;
    const data: any = {
      username: formData.get('username') as string,
      email: formData.get('email') as string,
      role: role,
      permissions: permissions,
      isActive: formData.get('isActive') === 'true',
    };
    
    // Only include password if provided (for new users or when updating)
    if (password && password.trim() !== '') {
      data.password = password;
    } else if (editingUser && !password) {
      // Keep existing password if not provided during edit
      data.password = editingUser.password;
    }

    try {
      if (editingUser) {
        const oldUser = users.find(u => u.id === editingUser.id);
        await updateUser(editingUser.id, data);
        
        // Log user update
        if (storage && currentUser) {
          await storage.createActivityLog({
            category: 'user',
            action: 'update',
            description: `Update user: ${data.username}`,
            userId: currentUser.id,
            userName: currentUser.username,
            details: {
              targetUserId: editingUser.id,
              targetUserName: data.username,
              previousValue: oldUser,
              newValue: { ...oldUser, ...data },
            },
          });
        }
      } else {
        const newUser = await createUser(data);
        
        // Log user create
        if (storage && currentUser) {
          await storage.createActivityLog({
            category: 'user',
            action: 'create',
            description: `Tambah user baru: ${data.username}`,
            userId: currentUser.id,
            userName: currentUser.username,
            details: {
              targetUserId: newUser.id,
              targetUserName: data.username,
              role: data.role,
            },
          });
        }
      }
      setShowModal(false);
      setEditingUser(null);
      setSelectedPermissions([]);
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error('Failed to save user:', error);
      alert('Gagal menyimpan user');
    }
  };

  const handleDelete = async (id: string) => {
    if (id === currentUser?.id) {
      alert('Tidak bisa menghapus user yang sedang login');
      return;
    }
    if (confirm('Yakin ingin menghapus user ini?')) {
      try {
        const user = users.find(u => u.id === id);
        await deleteUser(id);
        
        // Log user delete
        if (storage && currentUser && user) {
          await storage.createActivityLog({
            category: 'user',
            action: 'delete',
            description: `Hapus user: ${user.username}`,
            userId: currentUser.id,
            userName: currentUser.username,
            details: {
              targetUserId: id,
              targetUserName: user.username,
              previousValue: user,
            },
          });
        }
      } catch (error) {
        console.error('Failed to delete user:', error);
        alert('Gagal menghapus user');
      }
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield size={20} />;
      case 'manager':
        return <UserCheck size={20} />;
      default:
        return <User size={20} />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return '#00ff88';
      case 'manager':
        return '#00d4ff';
      default:
        return '#ffe66d';
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
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
            Users
          </h1>
          <p style={{ color: '#a0a0b0', fontSize: '16px' }}>Kelola pengguna sistem</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingUser(null);
            setShowModal(true);
          }}
        >
          <Plus size={18} />
          Tambah User
        </button>
      </div>

      <div style={{ marginBottom: '24px', position: 'relative' }}>
        <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#606070' }} />
        <input
          type="text"
          className="input"
          placeholder="Cari user..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ paddingLeft: '40px' }}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '20px',
        }}
      >
        {filteredUsers.map((user) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div style={{ display: 'flex', alignItems: 'start', gap: '16px', marginBottom: '16px' }}>
              <div
                style={{
                  padding: '16px',
                  background: `${getRoleColor(user.role)}20`,
                  borderRadius: '12px',
                  color: getRoleColor(user.role),
                }}
              >
                {getRoleIcon(user.role)}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>{user.username}</h3>
                <p style={{ color: '#a0a0b0', fontSize: '14px', marginBottom: '8px' }}>{user.email}</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      padding: '4px 12px',
                      background: `${getRoleColor(user.role)}20`,
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: getRoleColor(user.role),
                      textTransform: 'capitalize',
                    }}
                  >
                    {user.role}
                  </span>
                  <span
                    style={{
                      padding: '4px 12px',
                      background: user.isActive ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 107, 107, 0.2)',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: user.isActive ? '#00ff88' : '#ff6b6b',
                    }}
                  >
                    {user.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
              </div>
            </div>
            <p style={{ color: '#606070', fontSize: '12px', marginBottom: '16px' }}>
              Dibuat: {new Date(user.createdAt).toLocaleDateString('id-ID')}
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setEditingUser(user);
                  setShowModal(true);
                }}
                style={{ flex: 1, padding: '10px', fontSize: '13px' }}
              >
                <Edit size={16} />
                Edit
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDelete(user.id)}
                disabled={user.id === currentUser?.id}
                style={{ padding: '10px', fontSize: '13px' }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </motion.div>
        ))}
        {filteredUsers.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: '#606070' }}>
            Tidak ada user ditemukan
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
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
              paddingTop: '20px',
              paddingBottom: '60px',
              overflowY: 'auto',
              overflowX: 'hidden',
            }}
            onClick={() => {
              setShowModal(false);
              setEditingUser(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card"
              style={{ 
                maxWidth: '500px', 
                width: '100%', 
                maxHeight: 'calc(100vh - 100px)', 
                overflow: 'hidden',
                marginTop: 'auto',
                marginBottom: 'auto',
                display: 'flex',
                flexDirection: 'column',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 700 }}>
                  {editingUser ? 'Edit User' : 'Tambah User'}
                </h2>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowModal(false);
                    setEditingUser(null);
                  }}
                  style={{ padding: '8px', minWidth: 'auto' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                      Username *
                    </label>
                    <input
                      type="text"
                      name="username"
                      className="input"
                      defaultValue={editingUser?.username}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      className="input"
                      defaultValue={editingUser?.email}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                      Password {editingUser ? '(kosongkan jika tidak ingin mengubah)' : '*'}
                    </label>
                    <input
                      type="password"
                      name="password"
                      className="input"
                      placeholder={editingUser ? 'Kosongkan jika tidak ingin mengubah' : 'Masukkan password'}
                      required={!editingUser}
                    />
                    <p style={{ fontSize: '12px', color: '#606070', marginTop: '4px' }}>
                      {editingUser ? 'Kosongkan jika tidak ingin mengubah password' : 'Password untuk login'}
                    </p>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                      Role *
                    </label>
                    <input
                      type="text"
                      name="role"
                      className="input"
                      defaultValue={editingUser?.role || ''}
                      placeholder="Masukkan role (contoh: cashier, manager, supervisor, dll)"
                      required
                      onChange={(e) => setCurrentRole(e.target.value)}
                    />
                    <p style={{ fontSize: '12px', color: '#606070', marginTop: '4px' }}>
                      Role bisa custom atau pilih: admin, cashier, manager
                    </p>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                      Permissions (Menu yang bisa diakses)
                    </label>
                    <p style={{ fontSize: '12px', color: '#606070', marginBottom: '8px' }}>
                      {currentRole === 'admin' ? (
                        <span style={{ color: '#00ff88' }}>Admin otomatis punya akses ke semua menu</span>
                      ) : (
                        'Pilih menu yang bisa diakses oleh user ini'
                      )}
                    </p>
                    {currentRole !== 'admin' && (
                      <>
                        <div
                          style={{
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '12px',
                            maxHeight: '200px',
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            background: 'var(--bg-tertiary)',
                          }}
                        >
                        {MENU_PERMISSIONS.map((menu) => {
                          const isChecked = selectedPermissions.includes(menu.path);
                          return (
                            <label
                              key={menu.path}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px',
                                cursor: 'pointer',
                                borderRadius: '4px',
                                transition: 'background 0.2s',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(0, 255, 136, 0.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedPermissions([...selectedPermissions, menu.path]);
                                  } else {
                                    setSelectedPermissions(selectedPermissions.filter(p => p !== menu.path));
                                  }
                                }}
                                style={{ cursor: 'pointer' }}
                              />
                              <span style={{ fontSize: '14px', color: '#a0a0b0' }}>{menu.label}</span>
                            </label>
                          );
                        })}
                      </div>
                      <p style={{ fontSize: '12px', color: '#606070', marginTop: '4px' }}>
                        Pilih menu yang bisa diakses oleh user ini. Admin otomatis punya akses ke semua menu.
                      </p>
                    </>
                  )}
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                      Status
                    </label>
                    <select name="isActive" className="input" defaultValue={editingUser?.isActive ? 'true' : 'false'}>
                      <option value="true">Aktif</option>
                      <option value="false">Nonaktif</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexShrink: 0, paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowModal(false);
                      setEditingUser(null);
                    }}
                    style={{ flex: 1 }}
                  >
                    Batal
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    {editingUser ? 'Update' : 'Simpan'}
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

