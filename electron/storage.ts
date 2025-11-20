import Store from 'electron-store';
import type {
  User,
  Product,
  Category,
  Order,
  AppSettings,
  StockMovement,
  InventoryReport,
  Table,
  ActivityLog,
  ActivityCategory,
  StorageSnapshot,
  SnapshotImportOptions,
  SyncReport,
  SyncEntityStats,
} from './types';

type SnapshotCollectionKey = Exclude<keyof StorageSnapshot, 'generatedAt'>;

const defaultImportOptions: SnapshotImportOptions = { mode: 'insert_only' };

function createEmptyStats(): SyncEntityStats {
  return { inserted: 0, updated: 0, skipped: 0 };
}

function createEmptyReport(): SyncReport {
  const stats = createEmptyStats();
  return {
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    totalInserted: 0,
    entities: {
      users: { ...stats },
      products: { ...stats },
      categories: { ...stats },
      orders: { ...stats },
      stockMovements: { ...stats },
      tables: { ...stats },
      activityLogs: { ...stats },
    },
  };
}

function finalizeReport(report: SyncReport): SyncReport {
  report.finishedAt = new Date().toISOString();
  report.totalInserted = Object.values(report.entities).reduce((sum, entity) => sum + entity.inserted, 0);
  return report;
}

function normalizeSnapshot(snapshot?: StorageSnapshot): StorageSnapshot {
  return {
    generatedAt: snapshot?.generatedAt ?? new Date().toISOString(),
    users: snapshot?.users ?? [],
    products: snapshot?.products ?? [],
    categories: snapshot?.categories ?? [],
    orders: snapshot?.orders ?? [],
    stockMovements: snapshot?.stockMovements ?? [],
    tables: snapshot?.tables ?? [],
    activityLogs: snapshot?.activityLogs ?? [],
  };
}

function mergeCollection<T extends { id: string }>(
  existing: T[],
  incoming: T[],
  options: SnapshotImportOptions = defaultImportOptions
): { data: T[]; stats: SyncEntityStats } {
  const mode = options.mode ?? 'insert_only';
  const map = new Map(existing.map(item => [item.id, item]));
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const item of incoming) {
    if (!item?.id) {
      skipped++;
      continue;
    }
    if (!map.has(item.id)) {
      map.set(item.id, item);
      inserted++;
      continue;
    }
    if (mode === 'upsert') {
      const current = map.get(item.id)!;
      map.set(item.id, { ...current, ...item });
      updated++;
    } else {
      skipped++;
    }
  }

  return {
    data: Array.from(map.values()),
    stats: { inserted, updated, skipped },
  };
}

const store = new Store({
  name: 'noxtiz-pos-data',
  defaults: {
    users: [],
    products: [],
    categories: [],
    orders: [],
      settings: {
        storageType: 'local',
        taxRate: 0.1,
        taxDisplayMode: 'include_hide',
        currency: 'IDR',
        companyName: 'Noxtiz Culinary Lab',
        voidPin: '',
      },
  },
});

// Initialize default data
function initializeDefaults() {
  const users = store.get('users', []) as User[];
  if (users.length === 0) {
    const defaultAdmin: User = {
      id: 'admin-1',
      username: 'admin',
      email: 'admin@noxtiz.com',
      password: 'admin', // Default password, bisa diubah di settings
      role: 'admin',
      permissions: ['/dashboard', '/pos', '/products', '/inventory', '/tables', '/orders', '/activity-logs', '/users', '/seed', '/settings'], // Admin has all permissions
      createdAt: new Date().toISOString(),
      isActive: true,
    };
    store.set('users', [defaultAdmin]);
  }

  const categories = store.get('categories', []) as Category[];
  if (categories.length === 0) {
    const defaultCategories: Category[] = [
      { id: 'cat-1', name: 'Makanan', color: '#FF6B6B' },
      { id: 'cat-2', name: 'Minuman', color: '#4ECDC4' },
      { id: 'cat-3', name: 'Dessert', color: '#FFE66D' },
      { id: 'cat-4', name: 'Snack', color: '#95E1D3' },
    ];
    store.set('categories', defaultCategories);
  }
}

initializeDefaults();

// Storage API
export const storageAPI = {
  // Users
  getUsers: (): User[] => store.get('users', []) as User[],
  getUser: (id: string): User | null => {
    const users = store.get('users', []) as User[];
    return users.find((u) => u.id === id) || null;
  },
  createUser: (user: Omit<User, 'id' | 'createdAt'>): User => {
    const users = store.get('users', []) as User[];
    const newUser: User = {
      ...user,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    store.set('users', [...users, newUser]);
    return newUser;
  },
  updateUser: (id: string, user: Partial<User>): User => {
    const users = store.get('users', []) as User[];
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) throw new Error('User not found');
    users[index] = { ...users[index], ...user };
    store.set('users', users);
    return users[index];
  },
  deleteUser: (id: string): boolean => {
    const users = store.get('users', []) as User[];
    store.set('users', users.filter((u) => u.id !== id));
    return true;
  },

  // Products
  getProducts: (): Product[] => store.get('products', []) as Product[],
  getProduct: (id: string): Product | null => {
    const products = store.get('products', []) as Product[];
    return products.find((p) => p.id === id) || null;
  },
  createProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product => {
    const products = store.get('products', []) as Product[];
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    store.set('products', [...products, newProduct]);
    return newProduct;
  },
  updateProduct: (id: string, product: Partial<Product>): Product => {
    const products = store.get('products', []) as Product[];
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Product not found');
    products[index] = { ...products[index], ...product, updatedAt: new Date().toISOString() };
    store.set('products', products);
    return products[index];
  },
  deleteProduct: (id: string): boolean => {
    const products = store.get('products', []) as Product[];
    store.set('products', products.filter((p) => p.id !== id));
    return true;
  },

  // Categories
  getCategories: (): Category[] => store.get('categories', []) as Category[],
  getCategory: (id: string): Category | null => {
    const categories = store.get('categories', []) as Category[];
    return categories.find((c) => c.id === id) || null;
  },
  createCategory: (category: Omit<Category, 'id'>): Category => {
    const categories = store.get('categories', []) as Category[];
    const newCategory: Category = {
      ...category,
      id: `cat-${Date.now()}`,
    };
    store.set('categories', [...categories, newCategory]);
    return newCategory;
  },
  updateCategory: (id: string, category: Partial<Category>): Category => {
    const categories = store.get('categories', []) as Category[];
    const index = categories.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Category not found');
    categories[index] = { ...categories[index], ...category };
    store.set('categories', categories);
    return categories[index];
  },
  deleteCategory: (id: string): boolean => {
    const categories = store.get('categories', []) as Category[];
    store.set('categories', categories.filter((c) => c.id !== id));
    return true;
  },

  // Orders
  getOrders: (): Order[] => store.get('orders', []) as Order[],
  getOrder: (id: string): Order | null => {
    const orders = store.get('orders', []) as Order[];
    return orders.find((o) => o.id === id) || null;
  },
  createOrder: (order: Omit<Order, 'id' | 'createdAt'>): Order => {
    const orders = store.get('orders', []) as Order[];
    const newOrder: Order = {
      ...order,
      id: `order-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    store.set('orders', [...orders, newOrder]);
    return newOrder;
  },
  updateOrder: (id: string, order: Partial<Order>): Order => {
    const orders = store.get('orders', []) as Order[];
    const index = orders.findIndex((o) => o.id === id);
    if (index === -1) throw new Error('Order not found');
    orders[index] = { ...orders[index], ...order };
    store.set('orders', orders);
    return orders[index];
  },
  deleteOrder: (id: string): boolean => {
    const orders = store.get('orders', []) as Order[];
    store.set('orders', orders.filter((o) => o.id !== id));
    return true;
  },

  // Settings
  getSettings: (): AppSettings =>
    (store.get('settings', {
      storageType: 'local',
      taxRate: 0.1,
      taxDisplayMode: 'include_hide',
      currency: 'IDR',
      companyName: 'Noxtiz Culinary Lab',
      voidPin: '',
    }) as AppSettings),
  updateSettings: (settings: Partial<AppSettings>): AppSettings => {
    const current = store.get('settings', {
      storageType: 'local',
      taxRate: 0.1,
      taxDisplayMode: 'include_hide',
      currency: 'IDR',
      companyName: 'Noxtiz Culinary Lab',
      voidPin: '',
    }) as AppSettings;
    const updated = { ...current, ...settings };
    store.set('settings', updated);
    return updated;
  },

  // Stock Movements
  getStockMovements: (): StockMovement[] => store.get('stockMovements', []) as StockMovement[],
  getStockMovement: (id: string): StockMovement | null => {
    const movements = store.get('stockMovements', []) as StockMovement[];
    return movements.find((m) => m.id === id) || null;
  },
  createStockMovement: (movement: Omit<StockMovement, 'id' | 'createdAt'>): StockMovement => {
    const movements = store.get('stockMovements', []) as StockMovement[];
    const newMovement: StockMovement = {
      ...movement,
      id: `movement-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    store.set('stockMovements', [...movements, newMovement]);

    // Update product stock
    const products = store.get('products', []) as Product[];
    const productIndex = products.findIndex((p) => p.id === movement.productId);
    if (productIndex !== -1) {
      products[productIndex].stock = movement.newStock;
      products[productIndex].updatedAt = new Date().toISOString();
      store.set('products', products);
    }

    return newMovement;
  },
  getStockMovementsByProduct: (productId: string): StockMovement[] => {
    const movements = store.get('stockMovements', []) as StockMovement[];
    return movements.filter((m) => m.productId === productId);
  },
  getStockMovementsByPeriod: (period: string): StockMovement[] => {
    const movements = store.get('stockMovements', []) as StockMovement[];
    return movements.filter((m) => m.createdAt.startsWith(period));
  },

  // Inventory Reports
  getInventoryReport: (period: string): InventoryReport[] => {
    const movements = store.get('stockMovements', []) as StockMovement[];
    const products = store.get('products', []) as Product[];
    const periodMovements = movements.filter((m) => m.createdAt.startsWith(period));

    const reports: InventoryReport[] = products.map((product) => {
      const productMovements = periodMovements.filter((m) => m.productId === product.id);
      const opening = productMovements.find((m) => m.type === 'opening');
      const stockIn = productMovements
        .filter((m) => m.type === 'in')
        .reduce((sum, m) => sum + m.quantity, 0);
      const stockOut = productMovements
        .filter((m) => m.type === 'out')
        .reduce((sum, m) => sum + m.quantity, 0);
      const adjustment = productMovements
        .filter((m) => m.type === 'adjustment')
        .reduce((sum, m) => sum + m.quantity, 0);

      return {
        productId: product.id,
        productName: product.name,
        openingStock: opening?.previousStock || product.stock - stockIn + stockOut - adjustment,
        stockIn,
        stockOut,
        adjustment,
        closingStock: product.stock,
        period,
      };
    });

    return reports;
  },
  setOpeningStock: (productId: string, period: string, quantity: number): void => {
    const products = store.get('products', []) as Product[];
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const movements = store.get('stockMovements', []) as StockMovement[];
    const existingOpening = movements.find(
      (m) => m.productId === productId && m.type === 'opening' && m.createdAt.startsWith(period)
    );

    const newMovement: StockMovement = {
      id: existingOpening?.id || `movement-${Date.now()}`,
      productId,
      productName: product.name,
      type: 'opening',
      quantity,
      previousStock: existingOpening?.previousStock || product.stock,
      newStock: quantity,
      userId: 'system',
      userName: 'System',
      createdAt: existingOpening?.createdAt || `${period}-01T00:00:00.000Z`,
      notes: 'Opening stock for period',
    };

    if (existingOpening) {
      const index = movements.findIndex((m) => m.id === existingOpening.id);
      movements[index] = newMovement;
      store.set('stockMovements', movements);
    } else {
      store.set('stockMovements', [...movements, newMovement]);
    }
  },

  // Tables
  getTables: (): Table[] => store.get('tables', []) as Table[],
  getTable: (id: string): Table | null => {
    const tables = store.get('tables', []) as Table[];
    return tables.find((t) => t.id === id) || null;
  },
  createTable: (table: Omit<Table, 'id' | 'createdAt' | 'updatedAt'>): Table => {
    const tables = store.get('tables', []) as Table[];
    const newTable: Table = {
      ...table,
      id: `table-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.set('tables', [...tables, newTable]);
    return newTable;
  },
  updateTable: (id: string, table: Partial<Table>): Table => {
    const tables = store.get('tables', []) as Table[];
    const index = tables.findIndex((t) => t.id === id);
    if (index === -1) throw new Error('Table not found');
    const updated = { ...tables[index], ...table, updatedAt: new Date().toISOString() };
    tables[index] = updated;
    store.set('tables', tables);
    return updated;
  },
  deleteTable: (id: string): boolean => {
    const tables = store.get('tables', []) as Table[];
    const filtered = tables.filter((t) => t.id !== id);
    store.set('tables', filtered);
    return filtered.length < tables.length;
  },
  getTableByNumber: (number: string): Table | null => {
    const tables = store.get('tables', []) as Table[];
    return tables.find((t) => t.number === number) || null;
  },

  // Activity Logs
  getActivityLogs: (): ActivityLog[] => store.get('activityLogs', []) as ActivityLog[],
  getActivityLog: (id: string): ActivityLog | null => {
    const logs = store.get('activityLogs', []) as ActivityLog[];
    return logs.find((l) => l.id === id) || null;
  },
  createActivityLog: (log: Omit<ActivityLog, 'id' | 'createdAt'>): ActivityLog => {
    const logs = store.get('activityLogs', []) as ActivityLog[];
    const newLog: ActivityLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    // Keep only last 10000 logs to prevent storage bloat
    const updatedLogs = [...logs, newLog].slice(-10000);
    store.set('activityLogs', updatedLogs);
    return newLog;
  },
  getActivityLogsByCategory: (category: ActivityCategory): ActivityLog[] => {
    const logs = store.get('activityLogs', []) as ActivityLog[];
    return logs.filter((l) => l.category === category);
  },
  getActivityLogsByDateRange: (startDate: string, endDate: string): ActivityLog[] => {
    const logs = store.get('activityLogs', []) as ActivityLog[];
    return logs.filter((l) => l.createdAt >= startDate && l.createdAt <= endDate);
  },
  getActivityLogsByUser: (userId: string): ActivityLog[] => {
    const logs = store.get('activityLogs', []) as ActivityLog[];
    return logs.filter((l) => l.userId === userId);
  },

  // Delete Data Operations
  deleteOrdersByDateRange: (startDate: string, endDate: string): number => {
    const orders = store.get('orders', []) as Order[];
    const beforeCount = orders.length;
    const filtered = orders.filter((o) => {
      const orderDate = new Date(o.createdAt).toISOString();
      return orderDate < startDate || orderDate > `${endDate}T23:59:59.999Z`;
    });
    store.set('orders', filtered);
    return beforeCount - filtered.length;
  },
  deleteStockMovementsByDateRange: (startDate: string, endDate: string): number => {
    const movements = store.get('stockMovements', []) as StockMovement[];
    const beforeCount = movements.length;
    const filtered = movements.filter((m) => {
      const movementDate = new Date(m.createdAt).toISOString();
      return movementDate < startDate || movementDate > `${endDate}T23:59:59.999Z`;
    });
    store.set('stockMovements', filtered);
    return beforeCount - filtered.length;
  },
  deleteActivityLogsByDateRange: (startDate: string, endDate: string): number => {
    const logs = store.get('activityLogs', []) as ActivityLog[];
    const beforeCount = logs.length;
    const filtered = logs.filter((l) => {
      const logDate = new Date(l.createdAt).toISOString();
      return logDate < startDate || logDate > `${endDate}T23:59:59.999Z`;
    });
    store.set('activityLogs', filtered);
    return beforeCount - filtered.length;
  },
  deleteAllOrders: (): number => {
    const orders = store.get('orders', []) as Order[];
    const count = orders.length;
    store.set('orders', []);
    return count;
  },
  deleteAllStockMovements: (): number => {
    const movements = store.get('stockMovements', []) as StockMovement[];
    const count = movements.length;
    store.set('stockMovements', []);
    return count;
  },
  deleteAllActivityLogs: (): number => {
    const logs = store.get('activityLogs', []) as ActivityLog[];
    const count = logs.length;
    store.set('activityLogs', []);
    return count;
  },

  exportSnapshot: (): StorageSnapshot => ({
    generatedAt: new Date().toISOString(),
    users: storageAPI.getUsers(),
    products: storageAPI.getProducts(),
    categories: storageAPI.getCategories(),
    orders: storageAPI.getOrders(),
    stockMovements: storageAPI.getStockMovements(),
    tables: storageAPI.getTables(),
    activityLogs: storageAPI.getActivityLogs(),
  }),

  importSnapshot: (snapshot: StorageSnapshot, options?: SnapshotImportOptions): SyncReport => {
    const normalized = normalizeSnapshot(snapshot);
    const report = createEmptyReport();

    const mergeAndStore = <T extends { id: string }>(
      key: SnapshotCollectionKey,
      storeKey: string,
      incoming: T[]
    ) => {
      const existing = store.get(storeKey, []) as T[];
      const merged = mergeCollection(existing, incoming, options);
      store.set(storeKey, merged.data);
      report.entities[key] = merged.stats;
    };

    mergeAndStore('users', 'users', normalized.users);
    mergeAndStore('products', 'products', normalized.products);
    mergeAndStore('categories', 'categories', normalized.categories);
    mergeAndStore('orders', 'orders', normalized.orders);
    mergeAndStore('stockMovements', 'stockMovements', normalized.stockMovements);
    mergeAndStore('tables', 'tables', normalized.tables);
    mergeAndStore('activityLogs', 'activityLogs', normalized.activityLogs);

    return finalizeReport(report);
  },
};

