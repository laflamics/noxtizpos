import { create } from 'zustand';
import type {
  User,
  Product,
  Category,
  Order,
  AppSettings,
  StorageType,
  SyncReport,
  StorageSnapshot,
  LicensePlanType,
  LicenseStatusState,
  AccountProfile,
} from '@/types';
import { initializeStorage, getStorage, resetStorage } from '@/storage';
import { RedisStorage } from '@/storage/redis';
import type { IStorage } from '@/storage/base';
import { getLocalReceiptLogo, setLocalReceiptLogo } from '@/storage/receiptLogo';
import { getDeviceProfile } from '@/lib/device';
import {
  saveLicenseRecord,
  fetchLicenseRecord,
  appendLicenseLog,
  syncUserLicenseToUpstash,
  type LicenseRecord,
} from '@/lib/licenseStore';

let autoSyncTimer: number | null = null;

const applyLocalReceiptLogo = (settings: AppSettings): AppSettings => {
  if (settings.storageType === 'redis') {
    return {
      ...settings,
      receiptLogo: getLocalReceiptLogo(),
    };
  }
  return settings;
};

const sanitizeSettingsPayload = (settings: Partial<AppSettings>, target: StorageType): Partial<AppSettings> => {
  if (target === 'redis') {
    const { receiptLogo, ...rest } = settings;
    return rest;
  }
  return settings;
};

const TRIAL_DURATION_DAYS = 7;

const getLicenseDurationDays = (type: LicensePlanType): number => {
  switch (type) {
    case 'trial':
    case 'weekly':
      return 7;
    case 'monthly':
      return 30;
    case 'yearly':
      return 365;
    case 'lifetime':
      return 365 * 30;
    default:
      return 7;
  }
};

const isLifetimePlan = (type: LicensePlanType) => type === 'lifetime';

const buildLicenseRecord = (
  code: string,
  type: LicensePlanType,
  status: LicenseRecord['status'],
  deviceId: string,
  expiresAt: string | undefined,
  account: AccountProfile
): LicenseRecord => {
  const now = new Date().toISOString();
  return {
    code,
    type,
    status,
    durationDays: getLicenseDurationDays(type),
    createdAt: now,
    updatedAt: now,
    activatedAt: status === 'active' ? now : undefined,
    expiresAt,
    deviceId,
    accountName: account.accountId,
    outletName: account.outletName,
    ownerName: account.ownerName,
    ownerEmail: account.ownerEmail,
    ownerPhone: account.ownerPhone,
    staff: account.staff,
    lastSyncedAt: now,
  };
};

interface AppState {
  // Storage
  storage: IStorage | null;
  storageType: StorageType;
  isInitialized: boolean;

  // Current User
  currentUser: User | null;

  // Data
  users: User[];
  products: Product[];
  categories: Category[];
  orders: Order[];
  settings: AppSettings;
  isSyncing: boolean;
  lastSyncReport: SyncReport | null;
  syncError: string | null;

  // Cart
  cart: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;

  // Actions
  initialize: (settings?: AppSettings) => Promise<void>;
  switchStorage: (type: StorageType, redisUrl?: string, redisToken?: string) => Promise<void>;
  syncNow: () => Promise<void>;
  setCurrentUser: (user: User | null) => void;
  login: (username: string, password?: string) => Promise<User | null>;

  // Users
  loadUsers: () => Promise<void>;
  createUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<User>;
  updateUser: (id: string, user: Partial<User>) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;

  // Products
  loadProducts: () => Promise<void>;
  createProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Product>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;

  // Categories
  loadCategories: () => Promise<void>;
  createCategory: (category: Omit<Category, 'id'>) => Promise<Category>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;

  // Orders
  loadOrders: () => Promise<void>;
  createOrder: (order: Omit<Order, 'id' | 'createdAt'>) => Promise<Order>;
  updateOrder: (id: string, order: Partial<Order>) => Promise<Order>;

  // Cart
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;

  // Settings
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;

  // License
  licenseStatus: LicenseStatusState;
  licenseType?: LicensePlanType;
  licenseExpiresAt?: string;
  licenseMessage?: string;
  isLicenseModalOpen: boolean;
  isLicenseRequesting: boolean;
  ensureLicense: () => Promise<void>;
  refreshLicenseStatus: (options?: { force?: boolean }) => Promise<void>;
  activateLicenseCode: (code: string) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => {
  const pushLocalToRedis = async (options: { silent?: boolean } = {}): Promise<SyncReport | null> => {
    const { storage, settings } = get();
    if (!storage) throw new Error('Storage belum siap');
    if (settings.storageType !== 'local') {
      return null;
    }
    if (!settings.redisUrl || !settings.redisToken) {
      throw new Error('Redis URL & token belum diisi');
    }

    if (!options.silent) {
      set({ isSyncing: true, syncError: null });
    }

    try {
      const redisStorage = new RedisStorage(settings.redisUrl, settings.redisToken);
      await redisStorage.initialize();
      const snapshot = await storage.exportSnapshot();
      const report = await redisStorage.importSnapshot(snapshot);
      const updatedSettings = await storage.updateSettings({
        lastSyncedAt: new Date().toISOString(),
        lastSyncDirection: 'local_to_redis',
      });
      set({
        settings: applyLocalReceiptLogo(updatedSettings),
        lastSyncReport: report,
        syncError: null,
      });
      return report;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Sinkronisasi gagal:', error);
      set({ syncError: message });
      throw error;
    } finally {
      if (!options.silent) {
        set({ isSyncing: false });
      }
    }
  };

  const shouldForceLicenseModal = (status: LicenseStatusState, expiresAt?: string) => {
    if (status === 'revoked' || status === 'expired') return true;
    if (!expiresAt) return status === 'unknown';
    return new Date(expiresAt).getTime() <= Date.now();
  };

  const syncLicenseStateFromSettings = (settings: AppSettings) => {
    const status = settings.licenseStatus || 'unknown';
    set({
      licenseStatus: status,
      licenseType: settings.licenseType,
      licenseExpiresAt: settings.licenseExpiresAt,
      licenseMessage: settings.licenseMessage,
      isLicenseModalOpen: shouldForceLicenseModal(status, settings.licenseExpiresAt),
    });
  };

  const persistLicenseSettings = async (payload: Partial<AppSettings>) => {
    const storage = get().storage;
    if (!storage) {
      console.warn('Storage belum siap untuk simpan license state');
      return;
    }
    await storage.updateSettings(payload);
    const merged = applyLocalReceiptLogo({
      ...get().settings,
      ...payload,
    });
    set({ settings: merged });
    syncLicenseStateFromSettings(merged);
  };

  const buildAccountProfile = (): AccountProfile => {
    const { settings, users } = get();
    
    // Ambil user pertama (biasanya admin atau user pertama yang dibuat)
    const firstUser = users.length > 0 ? users[0] : null;
    const adminUser = users.find(u => u.role === 'admin') || firstUser;
    const ownerUser = adminUser || firstUser;
    
    return {
      accountId: settings.companyName || 'default',
      outletName: settings.companyName,
      ownerName: ownerUser?.username || settings.companyName,
      ownerEmail: ownerUser?.email,
      ownerPhone: ownerUser?.phone,
      staff: users.map((user) => ({
        userId: user.id,
        role: user.role,
        name: user.name || user.username,
        username: user.username,
      })),
    };
  };

  const syncPendingTrialWithServer = async () => {
    const { settings } = get();
    if (
      !settings.licensePendingSync ||
      !settings.licenseCode ||
      settings.licenseStatus !== 'trial'
    ) {
      return;
    }
    const device = getDeviceProfile();
    const account = buildAccountProfile();
    const expiresAt =
      settings.licenseExpiresAt ||
      new Date(Date.now() + TRIAL_DURATION_DAYS * 86400000).toISOString();
    const record = buildLicenseRecord(
      settings.licenseCode,
      'trial',
      'active',
      device.deviceId,
      expiresAt,
      account
    );
    try {
      await saveLicenseRecord(record);
      await persistLicenseSettings({
        licensePendingSync: false,
        licenseLastSyncedAt: record.lastSyncedAt,
        licenseMessage: 'Trial aktif.',
      });
    } catch (error) {
      console.warn('Sync trial ke server gagal:', error);
    }
  };

  const issueTrial = async (preferOnline: boolean) => {
    const device = getDeviceProfile();
    const account = buildAccountProfile();
    
    // Generate license code dari email user pertama langsung (normalized)
    // Key format: license:<email> (bukan TRIAL- prefix)
    if (!account.ownerEmail) {
      throw new Error('Email owner diperlukan untuk membuat license');
    }
    const code = account.ownerEmail.toLowerCase().trim();
    const expiresAt = new Date(Date.now() + TRIAL_DURATION_DAYS * 86400000).toISOString();
    const record = buildLicenseRecord(
      code,
      'trial',
      'active',
      device.deviceId,
      expiresAt,
      account
    );
    let pendingSync = false;
    if (preferOnline) {
      try {
        await saveLicenseRecord(record);
      } catch (error) {
        pendingSync = true;
        console.warn('Trial online gagal sync ke server:', error);
      }
    } else {
      pendingSync = true;
      try {
        await saveLicenseRecord(record);
        pendingSync = false;
      } catch {
        // tetap pending
      }
    }
    await persistLicenseSettings({
      licenseCode: code,
      licenseToken: code,
      licenseType: 'trial',
      licenseStatus: 'trial',
      licenseExpiresAt: expiresAt,
      licenseDeviceId: device.deviceId,
      licenseMessage: pendingSync
        ? 'Trial aktif offline. Akan sync otomatis ketika online.'
        : 'Trial aktif.',
      licensePendingSync: pendingSync,
      licenseLastSyncedAt: pendingSync ? undefined : new Date().toISOString(),
    });
  };

  const requestTrial = async () => {
    await issueTrial(true);
  };

  const startOfflineTrial = async () => {
    await issueTrial(false);
  };

  const scheduleAutoSync = () => {
    if (typeof window === 'undefined') return;
    if (autoSyncTimer) {
      window.clearInterval(autoSyncTimer);
      autoSyncTimer = null;
    }
    const settings = get().settings;
    if (settings.storageType !== 'local') {
      return;
    }
    if (!settings.redisUrl || !settings.redisToken) {
      return;
    }
    const intervalHours = settings.autoSyncIntervalHours ?? 6;
    if (!intervalHours || intervalHours <= 0) return;

    const intervalMs = Math.max(intervalHours, 1) * 60 * 60 * 1000;
    autoSyncTimer = window.setInterval(() => {
      pushLocalToRedis({ silent: true }).catch(error => {
        console.debug('Auto sync skip:', error);
      });
    }, intervalMs);
  };

  return {
  storage: null,
  storageType: 'local',
  isInitialized: false,
  isSyncing: false,
  currentUser: null,
  users: [],
  products: [],
  categories: [],
  orders: [],
  settings: {
    storageType: 'local',
    taxRate: 0.1,
    currency: 'IDR',
    companyName: 'Noxtiz Culinary Lab',
  },
  lastSyncReport: null,
  syncError: null,
  cart: [],
  licenseStatus: 'unknown',
  licenseType: undefined,
  licenseExpiresAt: undefined,
  licenseMessage: undefined,
  isLicenseModalOpen: false,
  isLicenseRequesting: false,

  initialize: async (settings?: AppSettings) => {
    const currentSettings = settings || get().settings;
    const storage = await initializeStorage(currentSettings);
    const loadedSettings = applyLocalReceiptLogo(await storage.getSettings());

    set({
      storage,
      storageType: loadedSettings.storageType,
      settings: loadedSettings,
      isInitialized: true,
      isSyncing: false,
      lastSyncReport: null,
      syncError: null,
    });
    syncLicenseStateFromSettings(loadedSettings);

    // Load initial data
    await Promise.all([
      get().loadUsers(),
      get().loadProducts(),
      get().loadCategories(),
      get().loadOrders(),
    ]);

    scheduleAutoSync();
    await get().ensureLicense().catch((error) => {
      console.warn('Inisialisasi lisensi gagal:', error);
    });
  },

  switchStorage: async (type: StorageType, redisUrl?: string, redisToken?: string) => {
    const currentStorage = get().storage;
    const currentSettings = get().settings;
    const previousType = currentSettings.storageType;
    const redisChanged =
      type === 'redis' &&
      (!!redisUrl && !!redisToken) &&
      (redisUrl !== currentSettings.redisUrl || redisToken !== currentSettings.redisToken);

    let snapshot: StorageSnapshot | null = null;
    if (currentStorage && (previousType !== type || redisChanged)) {
      snapshot = await currentStorage.exportSnapshot();
    }

    resetStorage();

    const newSettings: AppSettings = {
      ...currentSettings,
      storageType: type,
      redisUrl,
      redisToken,
    };

    if (type === 'redis') {
      setLocalReceiptLogo(currentSettings.receiptLogo || getLocalReceiptLogo());
    }

    const storage = await initializeStorage(newSettings);

    if (snapshot) {
      const report = await storage.importSnapshot(snapshot);
      set({ lastSyncReport: report });
    } else {
      set({ lastSyncReport: null });
    }

    const syncedAt = snapshot ? new Date().toISOString() : currentSettings.lastSyncedAt;

    const updatedSettings = await storage.updateSettings(
      sanitizeSettingsPayload(
        {
          ...currentSettings,
          storageType: type,
          redisUrl,
          redisToken,
          lastSyncedAt: syncedAt,
          lastSyncDirection: snapshot
            ? type === 'redis'
              ? 'local_to_redis'
              : 'redis_to_local'
            : currentSettings.lastSyncDirection,
        },
        type
      )
    );

    const mergedUpdatedSettings = applyLocalReceiptLogo(updatedSettings);

    set({
      storage,
      storageType: mergedUpdatedSettings.storageType,
      settings: mergedUpdatedSettings,
    });

    await Promise.all([
      get().loadUsers(),
      get().loadProducts(),
      get().loadCategories(),
      get().loadOrders(),
    ]);

    set({ isInitialized: true });
    scheduleAutoSync();
    await get().ensureLicense().catch((error) => {
      console.warn('Lisensi gagal setelah ganti storage:', error);
    });
  },

  syncNow: async () => {
    await pushLocalToRedis();
  },

  setCurrentUser: (user: User | null) => {
    set({ currentUser: user });
  },

  login: async (email: string, password?: string) => {
    try {
      // Ensure storage is initialized
      if (!get().storage) {
        await get().initialize();
      }
      
      // Load users
      await get().loadUsers();
      const users = get().users;
      
      // Find user by email (case-insensitive)
      const emailLower = email.toLowerCase().trim();
      const user = users.find(u => u.email.toLowerCase() === emailLower && u.isActive);
      if (user) {
        // Check password if provided
        if (password !== undefined) {
          if (!user.password || user.password !== password) {
            throw new Error('Password salah');
          }
        } else if (user.password) {
          // User has password but none provided
          throw new Error('Password diperlukan');
        }
        set({ currentUser: user });
        
        // Sync user/license data ke Upstash (background, tidak block login)
        const device = getDeviceProfile();
        const account = buildAccountProfile();
        const { settings } = get();
        
        syncUserLicenseToUpstash({
          deviceId: device.deviceId,
          accountId: account.accountId,
          outletName: account.outletName,
          ownerName: account.ownerName,
          ownerPhone: account.ownerPhone,
          ownerEmail: account.ownerEmail,
          staff: account.staff,
          licenseCode: settings.licenseCode,
          licenseStatus: settings.licenseStatus as 'trial' | 'active' | 'expired' | 'revoked' | undefined,
          licenseType: settings.licenseType,
          licenseExpiresAt: settings.licenseExpiresAt,
        }).catch((err) => {
          console.warn('Sync user data ke Upstash gagal (akan retry saat online):', err);
        });
        
        return user;
      }
      throw new Error('Email tidak ditemukan atau tidak aktif');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  loadUsers: async () => {
    const storage = get().storage;
    if (!storage) {
      console.warn('Storage not initialized, initializing...');
      await get().initialize();
      const newStorage = get().storage;
      if (!newStorage) {
        throw new Error('Failed to initialize storage');
      }
      const users = await newStorage.getUsers();
      set({ users });
      return;
    }
    const users = await storage.getUsers();
    set({ users });
  },

  createUser: async (user) => {
    const storage = get().storage;
    if (!storage) throw new Error('Storage not initialized');
    
    // Validasi email harus unique (case-insensitive)
    if (!user.email || !user.email.trim()) {
      throw new Error('Email wajib diisi');
    }
    
    const emailLower = user.email.toLowerCase().trim();
    await get().loadUsers();
    const existingUsers = get().users;
    
    // Untuk create user baru, cukup cek apakah email sudah digunakan
    // (user baru belum punya id, jadi tidak perlu cek id)
    const emailExists = existingUsers.some(
      u => u.email.toLowerCase() === emailLower
    );
    
    if (emailExists) {
      throw new Error('Email sudah digunakan. Silakan gunakan email lain.');
    }
    
    // Normalize email (lowercase, trim)
    const normalizedUser = {
      ...user,
      email: emailLower,
    };
    
    const newUser = await storage.createUser(normalizedUser);
    await get().loadUsers();
    
    // Sync user/license data ke Upstash (background, tidak block createUser)
    const device = getDeviceProfile();
    const account = buildAccountProfile();
    const { settings } = get();
    
    syncUserLicenseToUpstash({
      deviceId: device.deviceId,
      accountId: account.accountId,
      outletName: account.outletName,
      ownerName: account.ownerName,
      ownerPhone: account.ownerPhone,
      ownerEmail: account.ownerEmail,
      staff: account.staff,
      licenseCode: settings.licenseCode,
      licenseStatus: settings.licenseStatus as 'trial' | 'active' | 'expired' | 'revoked' | undefined,
      licenseType: settings.licenseType,
      licenseExpiresAt: settings.licenseExpiresAt,
    }).catch((err) => {
      console.warn('Sync user data ke Upstash gagal (akan retry saat online):', err);
    });
    
    return newUser;
  },

  updateUser: async (id, user) => {
    const storage = get().storage;
    if (!storage) throw new Error('Storage not initialized');
    
    // Validasi email harus unique (case-insensitive) jika email diubah
    if (user.email) {
      const emailLower = user.email.toLowerCase().trim();
      await get().loadUsers();
      const existingUsers = get().users;
      
      const emailExists = existingUsers.some(
        u => u.email.toLowerCase() === emailLower && u.id !== id
      );
      
      if (emailExists) {
        throw new Error('Email sudah digunakan. Silakan gunakan email lain.');
      }
      
      // Normalize email (lowercase, trim)
      user = {
        ...user,
        email: emailLower,
      };
    }
    
    const updated = await storage.updateUser(id, user);
    await get().loadUsers();
    return updated;
  },

  deleteUser: async (id) => {
    const storage = get().storage;
    if (!storage) throw new Error('Storage not initialized');
    await storage.deleteUser(id);
    await get().loadUsers();
  },

  loadProducts: async () => {
    const storage = get().storage;
    if (!storage) return;
    const products = await storage.getProducts();
    set({ products });
  },

  createProduct: async (product) => {
    const storage = get().storage;
    if (!storage) throw new Error('Storage not initialized');
    const newProduct = await storage.createProduct(product);
    await get().loadProducts();
    return newProduct;
  },

  updateProduct: async (id, product) => {
    const storage = get().storage;
    if (!storage) throw new Error('Storage not initialized');
    const updated = await storage.updateProduct(id, product);
    await get().loadProducts();
    return updated;
  },

  deleteProduct: async (id) => {
    const storage = get().storage;
    if (!storage) throw new Error('Storage not initialized');
    await storage.deleteProduct(id);
    await get().loadProducts();
  },

  loadCategories: async () => {
    const storage = get().storage;
    if (!storage) return;
    const categories = await storage.getCategories();
    set({ categories });
  },

  createCategory: async (category) => {
    const storage = get().storage;
    if (!storage) throw new Error('Storage not initialized');
    const newCategory = await storage.createCategory(category);
    await get().loadCategories();
    return newCategory;
  },

  updateCategory: async (id, category) => {
    const storage = get().storage;
    if (!storage) throw new Error('Storage not initialized');
    const updated = await storage.updateCategory(id, category);
    await get().loadCategories();
    return updated;
  },

  deleteCategory: async (id) => {
    const storage = get().storage;
    if (!storage) throw new Error('Storage not initialized');
    await storage.deleteCategory(id);
    await get().loadCategories();
  },

  loadOrders: async () => {
    const storage = get().storage;
    if (!storage) return;
    const orders = await storage.getOrders();
    set({ orders });
  },

  createOrder: async (order) => {
    const storage = get().storage;
    if (!storage) throw new Error('Storage not initialized');
    const newOrder = await storage.createOrder(order);
    await get().loadOrders();
    get().clearCart();
    return newOrder;
  },

  updateOrder: async (id, order) => {
    const storage = get().storage;
    if (!storage) throw new Error('Storage not initialized');
    const updated = await storage.updateOrder(id, order);
    await get().loadOrders();
    return updated;
  },

  addToCart: (product, quantity = 1) => {
    const cart = get().cart;
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      get().updateCartQuantity(product.id, existing.quantity + quantity);
    } else {
      set({
        cart: [
          ...cart,
          {
            productId: product.id,
            productName: product.name,
            quantity,
            price: product.price,
          },
        ],
      });
    }
  },

  removeFromCart: (productId) => {
    set({ cart: get().cart.filter(item => item.productId !== productId) });
  },

  updateCartQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(productId);
      return;
    }
    set({
      cart: get().cart.map(item =>
        item.productId === productId ? { ...item, quantity } : item
      ),
    });
  },

  clearCart: () => {
    set({ cart: [] });
  },

  loadSettings: async () => {
    const storage = get().storage;
    if (!storage) return;
    const settings = applyLocalReceiptLogo(await storage.getSettings());
    set({ settings });
    syncLicenseStateFromSettings(settings);
  },

  updateSettings: async (newSettings) => {
    const storage = get().storage;
    if (!storage) throw new Error('Storage not initialized');
    if (typeof newSettings.receiptLogo !== 'undefined') {
      setLocalReceiptLogo(newSettings.receiptLogo || '');
    }
    const targetType = get().settings.storageType;
    const payload = sanitizeSettingsPayload(newSettings, targetType);
    const updated = await storage.updateSettings(payload);
    const merged = applyLocalReceiptLogo(updated);
    set({ settings: merged });
    syncLicenseStateFromSettings(merged);
    scheduleAutoSync();
  },

  ensureLicense: async () => {
    const { settings } = get();
    const device = getDeviceProfile();
    
    // 1. Cek dulu di Redis apakah sudah ada user account record
    try {
      const { fetchUserAccountRecord } = await import('@/lib/licenseStore');
      const existing = await fetchUserAccountRecord(device.deviceId);
      
      if (existing) {
        // 2. Kalau sudah ada → baca license status & cek expired
        console.log('[ensureLicense] User account ditemukan di Redis, membaca license status');
        
        if (existing.licenseCode) {
          const licenseRecord = await fetchLicenseRecord(existing.licenseCode);
          
          if (licenseRecord) {
            // Update local settings dari Redis
            const isLifetime = isLifetimePlan(licenseRecord.type);
            const expires = licenseRecord.expiresAt 
              ? new Date(licenseRecord.expiresAt) 
              : null;
            const isExpired = !isLifetime && expires && expires.getTime() <= Date.now();
            
            await persistLicenseSettings({
              licenseCode: licenseRecord.code,
              licenseToken: licenseRecord.code,
              licenseType: licenseRecord.type,
              licenseStatus: isExpired ? 'expired' : (licenseRecord.status as LicenseStatusState),
              licenseExpiresAt: licenseRecord.expiresAt,
              licenseDeviceId: licenseRecord.deviceId,
              licenseMessage: isExpired 
                ? 'Trial sudah habis. Silakan aktivasi lisensi.' 
                : isLifetime
                ? 'Lisensi lifetime aktif.'
                : 'Trial aktif dari Redis.',
              licensePendingSync: false,
              licenseLastSyncedAt: licenseRecord.lastSyncedAt || new Date().toISOString(),
            });
            
            // Jika expired, trigger overlay (lifetime tidak akan expired)
            if (isExpired) {
              set({ isLicenseModalOpen: true });
            }
            return;
          }
        }
      }
    } catch (error) {
      console.warn('[ensureLicense] Gagal baca dari Redis, lanjut ke trial lokal:', error);
    }
    
    // 3. Kalau ga ada di Redis → write otomatis (trial)
    // Tapi cek dulu apakah local settings sudah punya license valid
    if (settings.licenseStatus && settings.licenseStatus !== 'revoked') {
      if (settings.licenseExpiresAt) {
        const expires = new Date(settings.licenseExpiresAt);
        if (expires.getTime() > Date.now()) {
          syncLicenseStateFromSettings(settings);
          // Sync ke Redis juga
          const account = buildAccountProfile();
          const { syncUserLicenseToUpstash } = await import('@/lib/licenseStore');
          syncUserLicenseToUpstash({
            deviceId: device.deviceId,
            accountId: account.accountId,
            outletName: account.outletName,
            ownerName: account.ownerName,
            ownerPhone: account.ownerPhone,
            ownerEmail: account.ownerEmail,
            staff: account.staff,
            licenseCode: settings.licenseCode,
            licenseStatus: settings.licenseStatus as 'trial' | 'active' | 'expired' | 'revoked' | undefined,
            licenseType: settings.licenseType,
            licenseExpiresAt: settings.licenseExpiresAt,
          }).catch((err) => console.warn('Sync ke Redis gagal:', err));
          return;
        }
      }
    }
    
    // 4. Kalau local juga ga ada → request trial baru
    await requestTrial();
  },

  refreshLicenseStatus: async ({ force = false } = {}) => {
    const { settings } = get();
    await syncPendingTrialWithServer();
    if (!settings.licenseCode) return;
    if (!force && settings.licenseLastSyncedAt) {
      const last = new Date(settings.licenseLastSyncedAt);
      if (Date.now() - last.getTime() < 3 * 60 * 60 * 1000) {
        return;
      }
    }
    try {
      const record = await fetchLicenseRecord(settings.licenseCode);
      if (!record) return;
      const mappedStatus: LicenseStatusState =
        record.status === 'unused'
          ? 'unknown'
          : (record.status as LicenseStatusState);
      await persistLicenseSettings({
        licenseStatus: mappedStatus,
        licenseType: record.type,
        licenseExpiresAt: record.expiresAt,
        licenseDeviceId: record.deviceId,
        licenseMessage:
          record.status === 'revoked'
            ? 'Lisensi dicabut oleh admin.'
            : undefined,
        licensePendingSync: false,
        licenseLastSyncedAt: record.lastSyncedAt || new Date().toISOString(),
      });
    } catch (error) {
      console.warn('Refresh license gagal:', error);
    }
  },

  activateLicenseCode: async (code: string) => {
    if (!code) {
      throw new Error('Kode lisensi wajib diisi');
    }
    set({ isLicenseRequesting: true });
    try {
      const device = getDeviceProfile();
      const account = buildAccountProfile();
      const record = await fetchLicenseRecord(code);
      if (!record) {
        throw new Error('Kode lisensi tidak ditemukan');
      }
      if (record.status === 'revoked') {
        throw new Error('Lisensi ini sudah dicabut');
      }
      if (
        record.status === 'active' &&
        record.deviceId &&
        record.deviceId !== device.deviceId
      ) {
        throw new Error('Lisensi ini terikat pada perangkat lain');
      }
      const now = new Date();
      const duration =
        record.durationDays || getLicenseDurationDays(record.type);
      const expiresAt = isLifetimePlan(record.type)
        ? undefined
        : new Date(now.getTime() + duration * 86400000).toISOString();
      const updatedRecord: LicenseRecord = {
        ...record,
        status: 'active',
        deviceId: device.deviceId,
        updatedAt: now.toISOString(),
        activatedAt: now.toISOString(),
        expiresAt,
        lastSyncedAt: now.toISOString(),
        accountName: account.accountId,
        outletName: account.outletName,
        staff: account.staff,
      };
      await saveLicenseRecord(updatedRecord);
      await appendLicenseLog(code, {
        event: 'activate',
        timestamp: now.toISOString(),
        deviceId: device.deviceId,
      });
      await persistLicenseSettings({
        licenseCode: code,
        licenseToken: code,
        licenseType: record.type,
        licenseStatus: 'active',
        licenseExpiresAt: expiresAt,
        licenseDeviceId: device.deviceId,
        licenseMessage: `Lisensi ${record.type} aktif.`,
        licensePendingSync: false,
        licenseLastSyncedAt: now.toISOString(),
      });
    } finally {
      set({ isLicenseRequesting: false });
    }
  },
  };
});

