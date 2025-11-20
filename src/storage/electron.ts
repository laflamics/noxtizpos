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

declare global {
  interface Window {
    electronAPI: {
      getVersion?: () => Promise<string>;
      shell?: {
        openExternal: (url: string) => Promise<void>;
        showItemInFolder: (path: string) => void;
        openPath: (path: string) => Promise<string>;
      };
      app?: {
        getPath: (name: string) => Promise<string>;
      };
      update?: {
        check: () => Promise<any>;
        download: () => Promise<any>;
        install: () => Promise<void>;
        onChecking: (callback: () => void) => () => void;
        onAvailable: (callback: (info: any) => void) => () => void;
        onNotAvailable: (callback: () => void) => () => void;
        onError: (callback: (error: any) => void) => () => void;
        onDownloadProgress: (callback: (progress: any) => void) => () => void;
        onDownloaded: (callback: (info: any) => void) => () => void;
      };
      storage: {
        getUsers: () => Promise<User[]>;
        getUser: (id: string) => Promise<User | null>;
        createUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<User>;
        updateUser: (id: string, user: Partial<User>) => Promise<User>;
        deleteUser: (id: string) => Promise<boolean>;
        getProducts: () => Promise<Product[]>;
        getProduct: (id: string) => Promise<Product | null>;
        createProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Product>;
        updateProduct: (id: string, product: Partial<Product>) => Promise<Product>;
        deleteProduct: (id: string) => Promise<boolean>;
        getCategories: () => Promise<Category[]>;
        getCategory: (id: string) => Promise<Category | null>;
        createCategory: (category: Omit<Category, 'id'>) => Promise<Category>;
        updateCategory: (id: string, category: Partial<Category>) => Promise<Category>;
        deleteCategory: (id: string) => Promise<boolean>;
        getOrders: () => Promise<Order[]>;
        getOrder: (id: string) => Promise<Order | null>;
        createOrder: (order: Omit<Order, 'id' | 'createdAt'>) => Promise<Order>;
        updateOrder: (id: string, order: Partial<Order>) => Promise<Order>;
        deleteOrder: (id: string) => Promise<boolean>;
        getSettings: () => Promise<AppSettings>;
        updateSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>;
        seedCoffeeShop: () => Promise<{ success: boolean; message: string }>;
        getStockMovements: () => Promise<StockMovement[]>;
        getStockMovement: (id: string) => Promise<StockMovement | null>;
        createStockMovement: (movement: Omit<StockMovement, 'id' | 'createdAt'>) => Promise<StockMovement>;
        getStockMovementsByProduct: (productId: string) => Promise<StockMovement[]>;
        getStockMovementsByPeriod: (period: string) => Promise<StockMovement[]>;
        getInventoryReport: (period: string) => Promise<InventoryReport[]>;
        setOpeningStock: (productId: string, period: string, quantity: number) => Promise<void>;
        getTables: () => Promise<Table[]>;
        getTable: (id: string) => Promise<Table | null>;
        createTable: (table: Omit<Table, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Table>;
        updateTable: (id: string, table: Partial<Table>) => Promise<Table>;
        deleteTable: (id: string) => Promise<boolean>;
        getTableByNumber: (number: string) => Promise<Table | null>;
        getActivityLogs: () => Promise<ActivityLog[]>;
        getActivityLog: (id: string) => Promise<ActivityLog | null>;
        createActivityLog: (log: Omit<ActivityLog, 'id' | 'createdAt'>) => Promise<ActivityLog>;
        getActivityLogsByCategory: (category: ActivityCategory) => Promise<ActivityLog[]>;
        getActivityLogsByDateRange: (startDate: string, endDate: string) => Promise<ActivityLog[]>;
        getActivityLogsByUser: (userId: string) => Promise<ActivityLog[]>;
        
        deleteOrdersByDateRange: (startDate: string, endDate: string) => Promise<number>;
        deleteStockMovementsByDateRange: (startDate: string, endDate: string) => Promise<number>;
        deleteActivityLogsByDateRange: (startDate: string, endDate: string) => Promise<number>;
        deleteAllOrders: () => Promise<number>;
        deleteAllStockMovements: () => Promise<number>;
        deleteAllActivityLogs: () => Promise<number>;
        exportSnapshot: () => Promise<StorageSnapshot>;
        importSnapshot: (snapshot: StorageSnapshot, options?: SnapshotImportOptions) => Promise<SyncReport>;
      };
    };
  }
}

export class ElectronStorage implements IStorage {
  private get api() {
    if (!window.electronAPI?.storage) {
      throw new Error('Electron API not available. Make sure you are running in Electron.');
    }
    return window.electronAPI.storage;
  }

  async initialize(): Promise<void> {
    // Already initialized in main process
  }

  // Users
  async getUsers(): Promise<User[]> {
    return this.api.getUsers();
  }

  async getUser(id: string): Promise<User | null> {
    return this.api.getUser(id);
  }

  async createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    return this.api.createUser(user);
  }

  async updateUser(id: string, user: Partial<User>): Promise<User> {
    return this.api.updateUser(id, user);
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.api.deleteUser(id);
  }

  // Products
  async getProducts(): Promise<Product[]> {
    return this.api.getProducts();
  }

  async getProduct(id: string): Promise<Product | null> {
    return this.api.getProduct(id);
  }

  async createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    return this.api.createProduct(product);
  }

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    return this.api.updateProduct(id, product);
  }

  async deleteProduct(id: string): Promise<boolean> {
    return this.api.deleteProduct(id);
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return this.api.getCategories();
  }

  async getCategory(id: string): Promise<Category | null> {
    return this.api.getCategory(id);
  }

  async createCategory(category: Omit<Category, 'id'>): Promise<Category> {
    return this.api.createCategory(category);
  }

  async updateCategory(id: string, category: Partial<Category>): Promise<Category> {
    return this.api.updateCategory(id, category);
  }

  async deleteCategory(id: string): Promise<boolean> {
    return this.api.deleteCategory(id);
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return this.api.getOrders();
  }

  async getOrder(id: string): Promise<Order | null> {
    return this.api.getOrder(id);
  }

  async createOrder(order: Omit<Order, 'id' | 'createdAt'>): Promise<Order> {
    return this.api.createOrder(order);
  }

  async updateOrder(id: string, order: Partial<Order>): Promise<Order> {
    return this.api.updateOrder(id, order);
  }

  async deleteOrder(id: string): Promise<boolean> {
    return this.api.deleteOrder(id);
  }

  // Settings
  async getSettings(): Promise<AppSettings> {
    return this.api.getSettings();
  }

  async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    return this.api.updateSettings(settings);
  }

  // Stock Movements
  async getStockMovements(): Promise<StockMovement[]> {
    return this.api.getStockMovements();
  }

  async getStockMovement(id: string): Promise<StockMovement | null> {
    return this.api.getStockMovement(id);
  }

  async createStockMovement(movement: Omit<StockMovement, 'id' | 'createdAt'>): Promise<StockMovement> {
    return this.api.createStockMovement(movement);
  }

  async getStockMovementsByProduct(productId: string): Promise<StockMovement[]> {
    return this.api.getStockMovementsByProduct(productId);
  }

  async getStockMovementsByPeriod(period: string): Promise<StockMovement[]> {
    return this.api.getStockMovementsByPeriod(period);
  }

  // Inventory Reports
  async getInventoryReport(period: string): Promise<InventoryReport[]> {
    return this.api.getInventoryReport(period);
  }

  async setOpeningStock(productId: string, period: string, quantity: number): Promise<void> {
    return this.api.setOpeningStock(productId, period, quantity);
  }

  // Tables
  async getTables(): Promise<Table[]> {
    return this.api.getTables();
  }

  async getTable(id: string): Promise<Table | null> {
    return this.api.getTable(id);
  }

  async createTable(table: Omit<Table, 'id' | 'createdAt' | 'updatedAt'>): Promise<Table> {
    return this.api.createTable(table);
  }

  async updateTable(id: string, table: Partial<Table>): Promise<Table> {
    return this.api.updateTable(id, table);
  }

  async deleteTable(id: string): Promise<boolean> {
    return this.api.deleteTable(id);
  }

  async getTableByNumber(number: string): Promise<Table | null> {
    return this.api.getTableByNumber(number);
  }

  // Activity Logs
  async getActivityLogs(): Promise<ActivityLog[]> {
    return this.api.getActivityLogs();
  }

  async getActivityLog(id: string): Promise<ActivityLog | null> {
    return this.api.getActivityLog(id);
  }

  async createActivityLog(log: Omit<ActivityLog, 'id' | 'createdAt'>): Promise<ActivityLog> {
    return this.api.createActivityLog(log);
  }

  async getActivityLogsByCategory(category: ActivityCategory): Promise<ActivityLog[]> {
    return this.api.getActivityLogsByCategory(category);
  }

  async getActivityLogsByDateRange(startDate: string, endDate: string): Promise<ActivityLog[]> {
    return this.api.getActivityLogsByDateRange(startDate, endDate);
  }

  async getActivityLogsByUser(userId: string): Promise<ActivityLog[]> {
    return this.api.getActivityLogsByUser(userId);
  }

  // Delete Data Operations
  async deleteOrdersByDateRange(startDate: string, endDate: string): Promise<number> {
    return this.api.deleteOrdersByDateRange(startDate, endDate);
  }

  async deleteStockMovementsByDateRange(startDate: string, endDate: string): Promise<number> {
    return this.api.deleteStockMovementsByDateRange(startDate, endDate);
  }

  async deleteActivityLogsByDateRange(startDate: string, endDate: string): Promise<number> {
    return this.api.deleteActivityLogsByDateRange(startDate, endDate);
  }

  async deleteAllOrders(): Promise<number> {
    return this.api.deleteAllOrders();
  }

  async deleteAllStockMovements(): Promise<number> {
    return this.api.deleteAllStockMovements();
  }

  async deleteAllActivityLogs(): Promise<number> {
    return this.api.deleteAllActivityLogs();
  }

  async exportSnapshot(): Promise<StorageSnapshot> {
    return this.api.exportSnapshot();
  }

  async importSnapshot(
    snapshot: StorageSnapshot,
    options?: SnapshotImportOptions
  ): Promise<SyncReport> {
    return this.api.importSnapshot(snapshot, options);
  }
}

