import { create } from 'zustand';
import type { User, Product, Category, Order, AppSettings, StorageType } from '@/types';
import { initializeStorage, getStorage, resetStorage } from '@/storage';
import type { IStorage } from '@/storage/base';

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
}

export const useStore = create<AppState>((set, get) => ({
  storage: null,
  storageType: 'local',
  isInitialized: false,
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
  cart: [],

  initialize: async (settings?: AppSettings) => {
    const currentSettings = settings || get().settings;
    const storage = await initializeStorage(currentSettings);
    const loadedSettings = await storage.getSettings();

    set({
      storage,
      storageType: loadedSettings.storageType,
      settings: loadedSettings,
      isInitialized: true,
    });

    // Load initial data
    await Promise.all([
      get().loadUsers(),
      get().loadProducts(),
      get().loadCategories(),
      get().loadOrders(),
    ]);
  },

  switchStorage: async (type: StorageType, redisUrl?: string, redisToken?: string) => {
    resetStorage();
    const newSettings: AppSettings = {
      ...get().settings,
      storageType: type,
      redisUrl,
      redisToken,
    };
    await get().initialize(newSettings);
  },

  setCurrentUser: (user: User | null) => {
    set({ currentUser: user });
  },

  login: async (username: string, password?: string) => {
    try {
      // Ensure storage is initialized
      if (!get().storage) {
        await get().initialize();
      }
      
      // Load users
      await get().loadUsers();
      const users = get().users;
      
      // Find user
      const user = users.find(u => u.username === username && u.isActive);
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
        return user;
      }
      throw new Error('Username tidak ditemukan atau tidak aktif');
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
    const newUser = await storage.createUser(user);
    await get().loadUsers();
    return newUser;
  },

  updateUser: async (id, user) => {
    const storage = get().storage;
    if (!storage) throw new Error('Storage not initialized');
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
    const settings = await storage.getSettings();
    set({ settings });
  },

  updateSettings: async (newSettings) => {
    const storage = get().storage;
    if (!storage) throw new Error('Storage not initialized');
    const updated = await storage.updateSettings(newSettings);
    set({ settings: updated });
  },
}));

