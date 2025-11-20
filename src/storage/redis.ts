import { Redis } from '@upstash/redis';
import type { IStorage } from './base';
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
} from '@/types';
import {
  createEmptySyncReport,
  finalizeReport,
  mergeCollection,
  normalizeSnapshot,
  type SnapshotCollectionKey,
  type Entity,
} from './snapshotUtils';

interface ChunkMeta {
  version: 'chunked';
  kind: 'array' | 'string';
  chunks: number;
}

export class RedisStorage implements IStorage {
  private readonly MAX_PAYLOAD_SIZE = 600_000; // ~0.6 MB buffer for 1MB Upstash limit
  private readonly CHUNK_META_SUFFIX = '__meta';
  private readonly CHUNK_KEY_PREFIX = '__chunk__';

  private redis: Redis | null = null;
  private redisUrl: string;
  private redisToken: string;

  constructor(url: string, token: string) {
    this.redisUrl = url;
    this.redisToken = token;
    this.redis = new Redis({
      url: url,
      token: token,
      enableAutoPipelining: false,
    });
  }

  async initialize(): Promise<void> {
    if (!this.redis) {
      this.redis = new Redis({
        url: this.redisUrl,
        token: this.redisToken,
        enableAutoPipelining: false,
      });
    }

    // Test connection first by trying to get a key
    try {
      await this.redis.get('__connection_test__');
      console.log('✅ Redis connection successful');
    } catch (error) {
      console.error('❌ Redis connection failed:', error);
      throw new Error(`Gagal terhubung ke Redis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Check if users exist, if not create default admin
    const users = await this.getUsers();
    if (users.length === 0) {
      const defaultAdmin: User = {
        id: 'admin-1',
        username: 'admin',
        email: 'admin@noxtiz.com',
        role: 'admin',
        createdAt: new Date().toISOString(),
        isActive: true,
      };
      await this.createUser(defaultAdmin);
    }

    // Initialize default categories
    const categories = await this.getCategories();
    if (categories.length === 0) {
      const defaultCategories: Category[] = [
        { id: 'cat-1', name: 'Makanan', color: '#FF6B6B' },
        { id: 'cat-2', name: 'Minuman', color: '#4ECDC4' },
        { id: 'cat-3', name: 'Dessert', color: '#FFE66D' },
        { id: 'cat-4', name: 'Snack', color: '#95E1D3' },
      ];
      for (const cat of defaultCategories) {
        await this.createCategory(cat);
      }
    }
  }

  private buildMetaKey(key: string): string {
    return `${key}:${this.CHUNK_META_SUFFIX}`;
  }

  private buildChunkKey(key: string, index: number): string {
    return `${key}:${this.CHUNK_KEY_PREFIX}${index}`;
  }

  private async getChunkMeta(key: string): Promise<ChunkMeta | null> {
    if (!this.redis) throw new Error('Redis not initialized');
    const meta = await this.redis.get(this.buildMetaKey(key));
    if (meta && typeof meta === 'object' && (meta as ChunkMeta).version === 'chunked') {
      return meta as ChunkMeta;
    }
    return null;
  }

  private async clearChunks(key: string, providedMeta?: ChunkMeta | null): Promise<void> {
    if (!this.redis) throw new Error('Redis not initialized');
    const meta = providedMeta ?? (await this.getChunkMeta(key));
    if (meta) {
      for (let i = 0; i < meta.chunks; i++) {
        await this.redis.del(this.buildChunkKey(key, i));
      }
    }
    await this.redis.del(this.buildMetaKey(key));
  }

  private async readChunkedArray(key: string, meta: ChunkMeta): Promise<any[]> {
    const aggregated: any[] = [];
    for (let i = 0; i < meta.chunks; i++) {
      const chunk = await this.redis!.get(this.buildChunkKey(key, i));
      if (Array.isArray(chunk)) {
        aggregated.push(...chunk);
      } else if (typeof chunk === 'string') {
        try {
          const parsed = JSON.parse(chunk);
          if (Array.isArray(parsed)) {
            aggregated.push(...parsed);
          }
        } catch {
          // ignore
        }
      }
    }
    return aggregated;
  }

  private async readChunkedString(key: string, meta: ChunkMeta): Promise<string> {
    let result = '';
    for (let i = 0; i < meta.chunks; i++) {
      const chunk = await this.redis!.get(this.buildChunkKey(key, i));
      if (typeof chunk === 'string') {
        result += chunk;
      } else if (Array.isArray(chunk) || typeof chunk === 'object') {
        result += JSON.stringify(chunk);
      }
    }
    return result;
  }

  private async setChunkedString(key: string, value: string | null): Promise<void> {
    if (!this.redis) throw new Error('Redis not initialized');
    if (!value) {
      await this.clearChunks(key);
      await this.redis.del(key);
      return;
    }
    if (value.length <= this.MAX_PAYLOAD_SIZE) {
      await this.clearChunks(key);
      await this.redis.set(key, value);
      return;
    }
    const chunks = Math.ceil(value.length / this.MAX_PAYLOAD_SIZE);
    await this.clearChunks(key);
    await this.redis.del(key);
    for (let i = 0; i < chunks; i++) {
      const slice = value.slice(i * this.MAX_PAYLOAD_SIZE, (i + 1) * this.MAX_PAYLOAD_SIZE);
      await this.redis.set(this.buildChunkKey(key, i), slice);
    }
    await this.redis.set(this.buildMetaKey(key), { version: 'chunked', kind: 'string', chunks });
    console.log(`[RedisStorage] Key ${key} (string) displit jadi ${chunks} chunk`);
  }

  private async setJsonValue(key: string, value: any): Promise<void> {
    const serialized = JSON.stringify(value);
    await this.setChunkedString(key, serialized);
  }

  private async getJsonValue<T>(key: string): Promise<T | null> {
    if (!this.redis) throw new Error('Redis not initialized');
    const meta = await this.getChunkMeta(key);
    if (meta && meta.kind === 'string') {
      const raw = await this.readChunkedString(key, meta);
      try {
        return JSON.parse(raw) as T;
      } catch {
        return null;
      }
    }
    if (meta && meta.kind === 'array') {
      const aggregated = await this.readChunkedArray(key, meta);
      return aggregated as T;
    }
    const data = await this.redis.get(key);
    if (typeof data === 'string') {
      try {
        return JSON.parse(data) as T;
      } catch {
        return null;
      }
    }
    return (data ?? null) as T | null;
  }

  private chunkArray<T>(value: T[]): T[][] {
    const chunks: T[][] = [];
    let current: T[] = [];
    let currentSize = 2; // account for []

    for (const item of value) {
      const itemString = JSON.stringify(item);
      const itemSize = itemString.length + 1; // comma

      if (current.length && currentSize + itemSize > this.MAX_PAYLOAD_SIZE) {
        chunks.push(current);
        current = [];
        currentSize = 2;
      }

      current.push(item);
      currentSize += itemSize;
    }

    if (current.length) {
      chunks.push(current);
    }

    return chunks;
  }

  private async getKey<T>(key: string): Promise<T[]> {
    if (!this.redis) throw new Error('Redis not initialized');
    try {
      const meta = await this.getChunkMeta(key);
      if (meta && meta.kind === 'array') {
        return (await this.readChunkedArray(key, meta)) as T[];
      }
      if (meta && meta.kind === 'string') {
        const raw = await this.readChunkedString(key, meta);
        try {
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? (parsed as T[]) : [];
        } catch {
          console.warn(`[RedisStorage] Gagal parse chunk string untuk ${key}, reset array`);
          await this.clearChunks(key, meta);
          await this.redis!.del(key);
          return [];
        }
      }

      const data = await this.redis.get(key);
      if (data && !Array.isArray(data)) {
        console.warn(`[RedisStorage] Key ${key} tipe beda, reset ke array[]`);
        await this.redis.del(key);
        return [];
      }
      return (data as T[]) ?? [];
    } catch (error) {
      if (error instanceof Error && error.message.includes('WRONGTYPE')) {
        console.warn(`[RedisStorage] Key ${key} WRONGTYPE, reset ke array[]`);
        await this.clearChunks(key);
        await this.redis!.del(key);
        return [];
      }
      throw error;
    }
  }

  private async setKey<T>(key: string, value: T[]): Promise<void> {
    if (!this.redis) throw new Error('Redis not initialized');
    const serializedLength = JSON.stringify(value).length;

    if (serializedLength <= this.MAX_PAYLOAD_SIZE) {
      await this.clearChunks(key);
      try {
        await this.redis.set(key, value);
      } catch (error) {
        if (error instanceof Error && error.message.includes('WRONGTYPE')) {
          console.warn(`[RedisStorage] Key ${key} tipe beda saat set, force reset`);
          await this.redis.del(key);
          await this.redis.set(key, value);
          return;
        }
        throw error;
      }
      return;
    }

    const chunks = this.chunkArray(value);
    await this.clearChunks(key);
    await this.redis.del(key);

    for (let i = 0; i < chunks.length; i++) {
      await this.redis.set(this.buildChunkKey(key, i), chunks[i]);
    }
    await this.redis.set(this.buildMetaKey(key), { version: 'chunked', kind: 'array', chunks: chunks.length });
    console.log(`[RedisStorage] Key ${key} displit jadi ${chunks.length} chunk biar aman <1MB`);
  }

  // Users
  async getUsers(): Promise<User[]> {
    return this.getKey('users');
  }

  async getUser(id: string): Promise<User | null> {
    const users = await this.getUsers();
    return users.find(u => u.id === id) || null;
  }

  async createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const users = await this.getUsers();
    const newUser: User = {
      ...user,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    await this.setKey('users', [...users, newUser]);
    return newUser;
  }

  async updateUser(id: string, user: Partial<User>): Promise<User> {
    const users = await this.getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) throw new Error('User not found');
    users[index] = { ...users[index], ...user };
    await this.setKey('users', users);
    return users[index];
  }

  async deleteUser(id: string): Promise<boolean> {
    const users = await this.getUsers();
    const filtered = users.filter(u => u.id !== id);
    await this.setKey('users', filtered);
    return true;
  }

  // Products
  async getProducts(): Promise<Product[]> {
    return this.getKey('products');
  }

  async getProduct(id: string): Promise<Product | null> {
    const products = await this.getProducts();
    return products.find(p => p.id === id) || null;
  }

  async createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const products = await this.getProducts();
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    await this.setKey('products', [...products, newProduct]);
    return newProduct;
  }

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    const products = await this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Product not found');
    products[index] = { ...products[index], ...product, updatedAt: new Date().toISOString() };
    await this.setKey('products', products);
    return products[index];
  }

  async deleteProduct(id: string): Promise<boolean> {
    const products = await this.getProducts();
    const filtered = products.filter(p => p.id !== id);
    await this.setKey('products', filtered);
    return true;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return this.getKey('categories');
  }

  async getCategory(id: string): Promise<Category | null> {
    const categories = await this.getCategories();
    return categories.find(c => c.id === id) || null;
  }

  async createCategory(category: Omit<Category, 'id'>): Promise<Category> {
    const categories = await this.getCategories();
    const newCategory: Category = {
      ...category,
      id: `cat-${Date.now()}`,
    };
    await this.setKey('categories', [...categories, newCategory]);
    return newCategory;
  }

  async updateCategory(id: string, category: Partial<Category>): Promise<Category> {
    const categories = await this.getCategories();
    const index = categories.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Category not found');
    categories[index] = { ...categories[index], ...category };
    await this.setKey('categories', categories);
    return categories[index];
  }

  async deleteCategory(id: string): Promise<boolean> {
    const categories = await this.getCategories();
    const filtered = categories.filter(c => c.id !== id);
    await this.setKey('categories', filtered);
    return true;
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return this.getKey('orders');
  }

  async getOrder(id: string): Promise<Order | null> {
    const orders = await this.getOrders();
    return orders.find(o => o.id === id) || null;
  }

  async createOrder(order: Omit<Order, 'id' | 'createdAt'>): Promise<Order> {
    const orders = await this.getOrders();
    const newOrder: Order = {
      ...order,
      id: `order-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    await this.setKey('orders', [...orders, newOrder]);
    return newOrder;
  }

  async updateOrder(id: string, order: Partial<Order>): Promise<Order> {
    const orders = await this.getOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) throw new Error('Order not found');
    orders[index] = { ...orders[index], ...order };
    await this.setKey('orders', orders);
    return orders[index];
  }

  async deleteOrder(id: string): Promise<boolean> {
    const orders = await this.getOrders();
    const filtered = orders.filter(o => o.id !== id);
    await this.setKey('orders', filtered);
    return true;
  }

  // Settings
  async getSettings(): Promise<AppSettings> {
    const settings = await this.getJsonValue<AppSettings>('settings');
    if (settings) {
      return {
        storageType: settings.storageType ?? 'redis',
        taxRate: settings.taxRate ?? 0.1,
        taxDisplayMode: settings.taxDisplayMode ?? 'include_hide',
        currency: settings.currency ?? 'IDR',
        companyName: settings.companyName ?? 'Noxtiz Culinary Lab',
        voidPin: settings.voidPin ?? '',
        redisUrl: settings.redisUrl,
        redisToken: settings.redisToken,
        receiptHeader: settings.receiptHeader,
        receiptFooter: settings.receiptFooter,
        autoSyncIntervalHours: settings.autoSyncIntervalHours,
        lastSyncedAt: settings.lastSyncedAt,
        lastSyncDirection: settings.lastSyncDirection,
        licenseCode: settings.licenseCode,
        licenseToken: settings.licenseToken,
        licenseType: settings.licenseType,
        licenseStatus: settings.licenseStatus,
        licenseExpiresAt: settings.licenseExpiresAt,
        licenseLastSyncedAt: settings.licenseLastSyncedAt,
        licenseDeviceId: settings.licenseDeviceId,
        licenseMessage: settings.licenseMessage,
      };
    }
    return {
      storageType: 'redis',
      taxRate: 0.1,
      taxDisplayMode: 'include_hide',
      currency: 'IDR',
      companyName: 'Noxtiz Culinary Lab',
      voidPin: '',
    };
  }

  async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    if (this.redis) {
      const { receiptLogo, ...rest } = updated;
      await this.setJsonValue('settings', rest);
      await this.clearChunks('settings:receiptLogo');
      await this.redis.del('settings:receiptLogo');
    }
    return updated;
  }

  // Stock Movements
  async getStockMovements(): Promise<StockMovement[]> {
    return this.getKey('stockMovements');
  }

  async getStockMovement(id: string): Promise<StockMovement | null> {
    const movements = await this.getStockMovements();
    return movements.find((m) => m.id === id) || null;
  }

  async createStockMovement(movement: Omit<StockMovement, 'id' | 'createdAt'>): Promise<StockMovement> {
    const movements = await this.getStockMovements();
    const newMovement: StockMovement = {
      ...movement,
      id: `movement-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    await this.setKey('stockMovements', [...movements, newMovement]);

    // Update product stock
    const products = await this.getProducts();
    const productIndex = products.findIndex((p) => p.id === movement.productId);
    if (productIndex !== -1) {
      products[productIndex].stock = movement.newStock;
      products[productIndex].updatedAt = new Date().toISOString();
      await this.setKey('products', products);
    }

    return newMovement;
  }

  async getStockMovementsByProduct(productId: string): Promise<StockMovement[]> {
    const movements = await this.getStockMovements();
    return movements.filter((m) => m.productId === productId);
  }

  async getStockMovementsByPeriod(period: string): Promise<StockMovement[]> {
    const movements = await this.getStockMovements();
    return movements.filter((m) => m.createdAt.startsWith(period));
  }

  // Inventory Reports
  async getInventoryReport(period: string): Promise<InventoryReport[]> {
    const movements = await this.getStockMovements();
    const products = await this.getProducts();
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
        .reduce((sum, m) => sum + (m.newStock - m.previousStock), 0);

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
  }

  async setOpeningStock(productId: string, period: string, quantity: number): Promise<void> {
    const products = await this.getProducts();
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const movements = await this.getStockMovements();
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
      await this.setKey('stockMovements', movements);
    } else {
      await this.setKey('stockMovements', [...movements, newMovement]);
    }
  }

  // Tables
  async getTables(): Promise<Table[]> {
    return this.getKey('tables');
  }

  async getTable(id: string): Promise<Table | null> {
    const tables = await this.getTables();
    return tables.find((t) => t.id === id) || null;
  }

  async createTable(table: Omit<Table, 'id' | 'createdAt' | 'updatedAt'>): Promise<Table> {
    const tables = await this.getTables();
    const newTable: Table = {
      ...table,
      id: `table-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await this.setKey('tables', [...tables, newTable]);
    return newTable;
  }

  async updateTable(id: string, table: Partial<Table>): Promise<Table> {
    const tables = await this.getTables();
    const index = tables.findIndex((t) => t.id === id);
    if (index === -1) throw new Error('Table not found');
    const updated = { ...tables[index], ...table, updatedAt: new Date().toISOString() };
    tables[index] = updated;
    await this.setKey('tables', tables);
    return updated;
  }

  async deleteTable(id: string): Promise<boolean> {
    const tables = await this.getTables();
    const filtered = tables.filter((t) => t.id !== id);
    await this.setKey('tables', filtered);
    return filtered.length < tables.length;
  }

  async getTableByNumber(number: string): Promise<Table | null> {
    const tables = await this.getTables();
    return tables.find((t) => t.number === number) || null;
  }

  // Activity Logs
  async getActivityLogs(): Promise<ActivityLog[]> {
    return this.getKey('activityLogs');
  }

  async getActivityLog(id: string): Promise<ActivityLog | null> {
    const logs = await this.getActivityLogs();
    return logs.find((l) => l.id === id) || null;
  }

  async createActivityLog(log: Omit<ActivityLog, 'id' | 'createdAt'>): Promise<ActivityLog> {
    const logs = await this.getActivityLogs();
    const newLog: ActivityLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    // Keep only last 10000 logs to prevent storage bloat
    const updatedLogs = [...logs, newLog].slice(-10000);
    await this.setKey('activityLogs', updatedLogs);
    return newLog;
  }

  async getActivityLogsByCategory(category: ActivityCategory): Promise<ActivityLog[]> {
    const logs = await this.getActivityLogs();
    return logs.filter((l) => l.category === category);
  }

  async getActivityLogsByDateRange(startDate: string, endDate: string): Promise<ActivityLog[]> {
    const logs = await this.getActivityLogs();
    return logs.filter((l) => l.createdAt >= startDate && l.createdAt <= endDate);
  }

  async getActivityLogsByUser(userId: string): Promise<ActivityLog[]> {
    const logs = await this.getActivityLogs();
    return logs.filter((l) => l.userId === userId);
  }

  // Delete Data Operations
  async deleteOrdersByDateRange(startDate: string, endDate: string): Promise<number> {
    const orders = await this.getOrders();
    const beforeCount = orders.length;
    const filtered = orders.filter((o) => {
      const orderDate = new Date(o.createdAt).toISOString();
      return orderDate < startDate || orderDate > `${endDate}T23:59:59.999Z`;
    });
    await this.setKey('orders', filtered);
    return beforeCount - filtered.length;
  }

  async deleteStockMovementsByDateRange(startDate: string, endDate: string): Promise<number> {
    const movements = await this.getStockMovements();
    const beforeCount = movements.length;
    const filtered = movements.filter((m) => {
      const movementDate = new Date(m.createdAt).toISOString();
      return movementDate < startDate || movementDate > `${endDate}T23:59:59.999Z`;
    });
    await this.setKey('stockMovements', filtered);
    return beforeCount - filtered.length;
  }

  async deleteActivityLogsByDateRange(startDate: string, endDate: string): Promise<number> {
    const logs = await this.getActivityLogs();
    const beforeCount = logs.length;
    const filtered = logs.filter((l) => {
      const logDate = new Date(l.createdAt).toISOString();
      return logDate < startDate || logDate > `${endDate}T23:59:59.999Z`;
    });
    await this.setKey('activityLogs', filtered);
    return beforeCount - filtered.length;
  }

  async deleteAllOrders(): Promise<number> {
    const orders = await this.getOrders();
    const count = orders.length;
    await this.setKey('orders', []);
    return count;
  }

  async deleteAllStockMovements(): Promise<number> {
    const movements = await this.getStockMovements();
    const count = movements.length;
    await this.setKey('stockMovements', []);
    return count;
  }

  async deleteAllActivityLogs(): Promise<number> {
    const logs = await this.getActivityLogs();
    const count = logs.length;
    await this.setKey('activityLogs', []);
    return count;
  }

  async exportSnapshot(): Promise<StorageSnapshot> {
    const [users, products, categories, orders, stockMovements, tables, activityLogs] = await Promise.all([
      this.getUsers(),
      this.getProducts(),
      this.getCategories(),
      this.getOrders(),
      this.getStockMovements(),
      this.getTables(),
      this.getActivityLogs(),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      users,
      products,
      categories,
      orders,
      stockMovements,
      tables,
      activityLogs,
    };
  }

  async importSnapshot(
    snapshot: StorageSnapshot,
    options?: SnapshotImportOptions
  ): Promise<SyncReport> {
    const normalized = normalizeSnapshot(snapshot);
    const report = createEmptySyncReport();

    const mergeAndStore = async <T extends Entity>(
      key: SnapshotCollectionKey,
      getter: () => Promise<T[]>,
      setter: (data: T[]) => Promise<void>,
      incoming: T[]
    ) => {
      const existing = await getter();
      const merged = mergeCollection<T>(existing, incoming, options);
      await setter(merged.data);
      report.entities[key] = merged.stats;
    };

    await mergeAndStore<User>('users', () => this.getUsers(), data => this.setKey('users', data), normalized.users);
    await mergeAndStore<Product>('products', () => this.getProducts(), data => this.setKey('products', data), normalized.products);
    await mergeAndStore<Category>(
      'categories',
      () => this.getCategories(),
      data => this.setKey('categories', data),
      normalized.categories
    );
    await mergeAndStore<Order>('orders', () => this.getOrders(), data => this.setKey('orders', data), normalized.orders);
    await mergeAndStore<StockMovement>(
      'stockMovements',
      () => this.getStockMovements(),
      data => this.setKey('stockMovements', data),
      normalized.stockMovements
    );
    await mergeAndStore<Table>('tables', () => this.getTables(), data => this.setKey('tables', data), normalized.tables);
    await mergeAndStore<ActivityLog>(
      'activityLogs',
      () => this.getActivityLogs(),
      data => this.setKey('activityLogs', data),
      normalized.activityLogs
    );

    return finalizeReport(report);
  }
}

