import { Redis } from '@upstash/redis';
import type { IStorage } from './base';
import type { User, Product, Category, Order, AppSettings, StockMovement, InventoryReport, Table, ActivityLog, ActivityCategory } from '@/types';

export class RedisStorage implements IStorage {
  private redis: Redis | null = null;
  private redisUrl: string;
  private redisToken: string;

  constructor(url: string, token: string) {
    this.redisUrl = url;
    this.redisToken = token;
    this.redis = new Redis({
      url: url,
      token: token,
    });
  }

  async initialize(): Promise<void> {
    if (!this.redis) {
      this.redis = new Redis({
        url: this.redisUrl,
        token: this.redisToken,
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

  private async getKey(key: string): Promise<any[]> {
    if (!this.redis) throw new Error('Redis not initialized');
    const data = await this.redis.get(key);
    return data ? (Array.isArray(data) ? data : []) : [];
  }

  private async setKey(key: string, value: any[]): Promise<void> {
    if (!this.redis) throw new Error('Redis not initialized');
    await this.redis.set(key, value);
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
    const settings = await this.redis?.get('settings');
    if (settings) return settings as AppSettings;
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
      await this.redis.set('settings', updated);
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
}

