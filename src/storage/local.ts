import type { IStorage } from './base';
import type { User, Product, Category, Order, AppSettings, StockMovement, InventoryReport, Table, ActivityLog, ActivityCategory } from '@/types';

// Browser localStorage wrapper
class BrowserStorage {
  private prefix = 'noxtiz-pos-';

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  get<T>(key: string, defaultValue: T): T {
    try {
      if (typeof localStorage === 'undefined') {
        console.warn('localStorage is not available, returning default value');
        return defaultValue;
      }
      const item = localStorage.getItem(this.getKey(key));
      if (item === null) return defaultValue;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error);
      return defaultValue;
    }
  }

  set<T>(key: string, value: T): void {
    try {
      if (typeof localStorage === 'undefined') {
        console.warn('localStorage is not available, cannot save data');
        return;
      }
      localStorage.setItem(this.getKey(key), JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing ${key} to localStorage:`, error);
      // Don't throw, just log - some browsers may have quota exceeded
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error('Storage quota exceeded. Please free up some space.');
      }
    }
  }
}

const storage = new BrowserStorage();

export class LocalStorage implements IStorage {
  async initialize(): Promise<void> {
    // Initialize default admin user if no users exist
    const users = storage.get<User[]>('users', []);
    if (users.length === 0) {
      const defaultAdmin: User = {
        id: 'admin-1',
        username: 'admin',
        email: 'admin@noxtiz.com',
        role: 'admin',
        createdAt: new Date().toISOString(),
        isActive: true,
      };
      storage.set('users', [defaultAdmin]);
    }

    // Initialize default categories
    const categories = storage.get<Category[]>('categories', []);
    if (categories.length === 0) {
      const defaultCategories: Category[] = [
        { id: 'cat-1', name: 'Makanan', color: '#FF6B6B' },
        { id: 'cat-2', name: 'Minuman', color: '#4ECDC4' },
        { id: 'cat-3', name: 'Dessert', color: '#FFE66D' },
        { id: 'cat-4', name: 'Snack', color: '#95E1D3' },
      ];
      storage.set('categories', defaultCategories);
    }
  }

  // Users
  async getUsers(): Promise<User[]> {
    return storage.get<User[]>('users', []);
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
    storage.set('users', [...users, newUser]);
    return newUser;
  }

  async updateUser(id: string, user: Partial<User>): Promise<User> {
    const users = await this.getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) throw new Error('User not found');
    users[index] = { ...users[index], ...user };
    storage.set('users', users);
    return users[index];
  }

  async deleteUser(id: string): Promise<boolean> {
    const users = await this.getUsers();
    const filtered = users.filter(u => u.id !== id);
    storage.set('users', filtered);
    return true;
  }

  // Products
  async getProducts(): Promise<Product[]> {
    return storage.get<Product[]>('products', []);
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
    storage.set('products', [...products, newProduct]);
    return newProduct;
  }

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    const products = await this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Product not found');
    products[index] = { ...products[index], ...product, updatedAt: new Date().toISOString() };
    storage.set('products', products);
    return products[index];
  }

  async deleteProduct(id: string): Promise<boolean> {
    const products = await this.getProducts();
    const filtered = products.filter(p => p.id !== id);
    storage.set('products', filtered);
    return true;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return storage.get<Category[]>('categories', []);
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
    storage.set('categories', [...categories, newCategory]);
    return newCategory;
  }

  async updateCategory(id: string, category: Partial<Category>): Promise<Category> {
    const categories = await this.getCategories();
    const index = categories.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Category not found');
    categories[index] = { ...categories[index], ...category };
    storage.set('categories', categories);
    return categories[index];
  }

  async deleteCategory(id: string): Promise<boolean> {
    const categories = await this.getCategories();
    const filtered = categories.filter(c => c.id !== id);
    storage.set('categories', filtered);
    return true;
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return storage.get<Order[]>('orders', []);
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
    storage.set('orders', [...orders, newOrder]);
    return newOrder;
  }

  async updateOrder(id: string, order: Partial<Order>): Promise<Order> {
    const orders = await this.getOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) throw new Error('Order not found');
    orders[index] = { ...orders[index], ...order };
    storage.set('orders', orders);
    return orders[index];
  }

  async deleteOrder(id: string): Promise<boolean> {
    const orders = await this.getOrders();
    const filtered = orders.filter(o => o.id !== id);
    storage.set('orders', filtered);
    return true;
  }

  // Settings
  async getSettings(): Promise<AppSettings> {
    return storage.get<AppSettings>('settings', {
      storageType: 'local',
      taxRate: 0.1,
      taxDisplayMode: 'include_hide',
      currency: 'IDR',
      companyName: 'Noxtiz Culinary Lab',
      voidPin: '',
    });
  }

  async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    // Ensure voidPin is always set (even if empty)
    if (!updated.voidPin) {
      updated.voidPin = '';
    }
    storage.set('settings', updated);
    return updated;
  }

  // Stock Movements
  async getStockMovements(): Promise<StockMovement[]> {
    return storage.get<StockMovement[]>('stockMovements', []);
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
    storage.set('stockMovements', [...movements, newMovement]);

    // Update product stock
    const products = await this.getProducts();
    const productIndex = products.findIndex((p) => p.id === movement.productId);
    if (productIndex !== -1) {
      products[productIndex].stock = movement.newStock;
      products[productIndex].updatedAt = new Date().toISOString();
      storage.set('products', products);
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
      storage.set('stockMovements', movements);
    } else {
      storage.set('stockMovements', [...movements, newMovement]);
    }
  }

  // Tables
  async getTables(): Promise<Table[]> {
    return storage.get<Table[]>('tables', []);
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
    storage.set('tables', [...tables, newTable]);
    return newTable;
  }

  async updateTable(id: string, table: Partial<Table>): Promise<Table> {
    const tables = await this.getTables();
    const index = tables.findIndex((t) => t.id === id);
    if (index === -1) throw new Error('Table not found');
    const updated = { ...tables[index], ...table, updatedAt: new Date().toISOString() };
    tables[index] = updated;
    storage.set('tables', tables);
    return updated;
  }

  async deleteTable(id: string): Promise<boolean> {
    const tables = await this.getTables();
    const filtered = tables.filter((t) => t.id !== id);
    storage.set('tables', filtered);
    return filtered.length < tables.length;
  }

  async getTableByNumber(number: string): Promise<Table | null> {
    const tables = await this.getTables();
    return tables.find((t) => t.number === number) || null;
  }

  // Activity Logs
  async getActivityLogs(): Promise<ActivityLog[]> {
    return storage.get<ActivityLog[]>('activityLogs', []);
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
    storage.set('activityLogs', updatedLogs);
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
    storage.set('orders', filtered);
    return beforeCount - filtered.length;
  }

  async deleteStockMovementsByDateRange(startDate: string, endDate: string): Promise<number> {
    const movements = await this.getStockMovements();
    const beforeCount = movements.length;
    const filtered = movements.filter((m) => {
      const movementDate = new Date(m.createdAt).toISOString();
      return movementDate < startDate || movementDate > `${endDate}T23:59:59.999Z`;
    });
    storage.set('stockMovements', filtered);
    return beforeCount - filtered.length;
  }

  async deleteActivityLogsByDateRange(startDate: string, endDate: string): Promise<number> {
    const logs = await this.getActivityLogs();
    const beforeCount = logs.length;
    const filtered = logs.filter((l) => {
      const logDate = new Date(l.createdAt).toISOString();
      return logDate < startDate || logDate > `${endDate}T23:59:59.999Z`;
    });
    storage.set('activityLogs', filtered);
    return beforeCount - filtered.length;
  }

  async deleteAllOrders(): Promise<number> {
    const orders = await this.getOrders();
    const count = orders.length;
    storage.set('orders', []);
    return count;
  }

  async deleteAllStockMovements(): Promise<number> {
    const movements = await this.getStockMovements();
    const count = movements.length;
    storage.set('stockMovements', []);
    return count;
  }

  async deleteAllActivityLogs(): Promise<number> {
    const logs = await this.getActivityLogs();
    const count = logs.length;
    storage.set('activityLogs', []);
    return count;
  }

  // Seed Data
  async seedCoffeeShop(): Promise<{ success: boolean; message: string }> {
    try {
      // Seed Categories
      const categories = await this.getCategories();
      const newCategories: Category[] = [
        { id: 'cat-coffee', name: 'Coffee', color: '#8B4513' },
        { id: 'cat-espresso', name: 'Espresso', color: '#654321' },
        { id: 'cat-latte', name: 'Latte & Cappuccino', color: '#D2B48C' },
        { id: 'cat-cold', name: 'Cold Drinks', color: '#87CEEB' },
        { id: 'cat-pastry', name: 'Pastries', color: '#FFD700' },
        { id: 'cat-snack', name: 'Snacks', color: '#FF6347' },
        { id: 'cat-dessert', name: 'Desserts', color: '#FF69B4' },
        { id: 'cat-other', name: 'Others', color: '#9370DB' },
      ];

      // Only add categories that don't exist
      for (const cat of newCategories) {
        const exists = categories.find(c => c.id === cat.id);
        if (!exists) {
          await this.createCategory(cat);
        }
      }

      // Seed Products
      const products = await this.getProducts();
      const newProducts: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[] = [
        // Coffee - Hot
        {
          name: 'Americano',
          description: 'Espresso dengan air panas',
          price: 25000,
          category: 'cat-coffee',
          stock: 100,
          barcode: 'COFFEE001',
        },
        {
          name: 'Espresso',
          description: 'Kopi espresso murni',
          price: 20000,
          category: 'cat-espresso',
          stock: 150,
          barcode: 'COFFEE002',
        },
        {
          name: 'Doppio',
          description: 'Double espresso shot',
          price: 25000,
          category: 'cat-espresso',
          stock: 120,
          barcode: 'COFFEE003',
        },
        {
          name: 'Cappuccino',
          description: 'Espresso dengan steamed milk dan foam',
          price: 30000,
          category: 'cat-latte',
          stock: 200,
          barcode: 'COFFEE004',
        },
        {
          name: 'Caffe Latte',
          description: 'Espresso dengan steamed milk',
          price: 32000,
          category: 'cat-latte',
          stock: 180,
          barcode: 'COFFEE005',
        },
        {
          name: 'Flat White',
          description: 'Espresso dengan microfoam milk',
          price: 33000,
          category: 'cat-latte',
          stock: 150,
          barcode: 'COFFEE006',
        },
        {
          name: 'Macchiato',
          description: 'Espresso dengan sedikit foam',
          price: 28000,
          category: 'cat-latte',
          stock: 140,
          barcode: 'COFFEE007',
        },
        {
          name: 'Mocha',
          description: 'Espresso dengan coklat dan steamed milk',
          price: 35000,
          category: 'cat-latte',
          stock: 160,
          barcode: 'COFFEE008',
        },
        {
          name: 'Vanilla Latte',
          description: 'Latte dengan vanilla syrup',
          price: 36000,
          category: 'cat-latte',
          stock: 170,
          barcode: 'COFFEE009',
        },
        {
          name: 'Caramel Latte',
          description: 'Latte dengan caramel syrup',
          price: 36000,
          category: 'cat-latte',
          stock: 165,
          barcode: 'COFFEE010',
        },
        {
          name: 'Iced Americano',
          description: 'Espresso dengan air dingin dan es',
          price: 27000,
          category: 'cat-cold',
          stock: 200,
          barcode: 'COFFEE011',
        },
        {
          name: 'Iced Latte',
          description: 'Latte dingin dengan es',
          price: 34000,
          category: 'cat-cold',
          stock: 190,
          barcode: 'COFFEE012',
        },
        {
          name: 'Cold Brew',
          description: 'Kopi yang diseduh dingin selama 12-24 jam',
          price: 30000,
          category: 'cat-cold',
          stock: 100,
          barcode: 'COFFEE013',
        },
        {
          name: 'Frappuccino',
          description: 'Blended coffee dengan es',
          price: 40000,
          category: 'cat-cold',
          stock: 150,
          barcode: 'COFFEE014',
        },
        {
          name: 'Matcha Latte',
          description: 'Matcha dengan steamed milk',
          price: 35000,
          category: 'cat-other',
          stock: 120,
          barcode: 'COFFEE015',
        },
        {
          name: 'Chai Latte',
          description: 'Teh chai dengan steamed milk',
          price: 33000,
          category: 'cat-other',
          stock: 110,
          barcode: 'COFFEE016',
        },
        // Pastries
        {
          name: 'Croissant',
          description: 'Croissant klasik Prancis',
          price: 25000,
          category: 'cat-pastry',
          stock: 50,
          barcode: 'PASTRY001',
        },
        {
          name: 'Chocolate Croissant',
          description: 'Croissant dengan isi coklat',
          price: 30000,
          category: 'cat-pastry',
          stock: 45,
          barcode: 'PASTRY002',
        },
        {
          name: 'Donut',
          description: 'Donut dengan berbagai topping',
          price: 15000,
          category: 'cat-pastry',
          stock: 80,
          barcode: 'PASTRY003',
        },
        {
          name: 'Muffin',
          description: 'Muffin blueberry atau coklat',
          price: 20000,
          category: 'cat-pastry',
          stock: 60,
          barcode: 'PASTRY004',
        },
        {
          name: 'Bagel',
          description: 'Bagel dengan cream cheese',
          price: 22000,
          category: 'cat-pastry',
          stock: 40,
          barcode: 'PASTRY005',
        },
        {
          name: 'Sandwich',
          description: 'Sandwich isi ayam atau tuna',
          price: 35000,
          category: 'cat-pastry',
          stock: 30,
          barcode: 'PASTRY006',
        },
        // Snacks
        {
          name: 'Cookies',
          description: 'Cookies coklat chip',
          price: 12000,
          category: 'cat-snack',
          stock: 100,
          barcode: 'SNACK001',
        },
        {
          name: 'Brownie',
          description: 'Brownie coklat fudge',
          price: 18000,
          category: 'cat-snack',
          stock: 70,
          barcode: 'SNACK002',
        },
        {
          name: 'Cake Slice',
          description: 'Potongan kue (cheesecake, red velvet, dll)',
          price: 25000,
          category: 'cat-dessert',
          stock: 50,
          barcode: 'DESSERT001',
        },
        {
          name: 'Tiramisu',
          description: 'Tiramisu klasik Italia',
          price: 35000,
          category: 'cat-dessert',
          stock: 40,
          barcode: 'DESSERT002',
        },
        {
          name: 'Waffle',
          description: 'Waffle dengan maple syrup',
          price: 30000,
          category: 'cat-dessert',
          stock: 35,
          barcode: 'DESSERT003',
        },
      ];

      // Only add products that don't exist (by barcode)
      let productsAdded = 0;
      for (const prod of newProducts) {
        const exists = products.find(p => p.barcode === prod.barcode);
        if (!exists) {
          await this.createProduct(prod);
          productsAdded++;
        }
      }

      // Seed Users
      const users = await this.getUsers();
      const newUsers: Omit<User, 'id' | 'createdAt'>[] = [
        {
          username: 'cashier1',
          email: 'cashier1@coffeeshop.com',
          role: 'cashier',
          isActive: true,
        },
        {
          username: 'cashier2',
          email: 'cashier2@coffeeshop.com',
          role: 'cashier',
          isActive: true,
        },
        {
          username: 'manager',
          email: 'manager@coffeeshop.com',
          role: 'manager',
          isActive: true,
        },
      ];

      // Only add users that don't exist
      let usersAdded = 0;
      for (const user of newUsers) {
        const exists = users.find(u => u.username === user.username);
        if (!exists) {
          await this.createUser(user);
          usersAdded++;
        }
      }

      const categoriesAdded = newCategories.filter(cat => !categories.find(c => c.id === cat.id)).length;

      return {
        success: true,
        message: `✅ Seed data berhasil! ${categoriesAdded} kategori, ${productsAdded} produk, dan ${usersAdded} user ditambahkan.`,
      };
    } catch (error) {
      console.error('Seed error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Gagal seed data',
      };
    }
  }
}
