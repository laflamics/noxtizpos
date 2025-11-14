import type { User, Product, Category, Order, AppSettings, StockMovement, InventoryReport, Table, ActivityLog, ActivityCategory } from '@/types';

export interface IStorage {
  // Users
  getUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | null>;
  createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<boolean>;

  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | null>;
  createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product>;
  updateProduct(id: string, product: Partial<Product>): Promise<Product>;
  deleteProduct(id: string): Promise<boolean>;

  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | null>;
  createCategory(category: Omit<Category, 'id'>): Promise<Category>;
  updateCategory(id: string, category: Partial<Category>): Promise<Category>;
  deleteCategory(id: string): Promise<boolean>;

  // Orders
  getOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | null>;
  createOrder(order: Omit<Order, 'id' | 'createdAt'>): Promise<Order>;
  updateOrder(id: string, order: Partial<Order>): Promise<Order>;
  deleteOrder(id: string): Promise<boolean>;

  // Settings
  getSettings(): Promise<AppSettings>;
  updateSettings(settings: Partial<AppSettings>): Promise<AppSettings>;

  // Stock Movements
  getStockMovements(): Promise<StockMovement[]>;
  getStockMovement(id: string): Promise<StockMovement | null>;
  createStockMovement(movement: Omit<StockMovement, 'id' | 'createdAt'>): Promise<StockMovement>;
  getStockMovementsByProduct(productId: string): Promise<StockMovement[]>;
  getStockMovementsByPeriod(period: string): Promise<StockMovement[]>;

  // Inventory Reports
  getInventoryReport(period: string): Promise<InventoryReport[]>;
  setOpeningStock(productId: string, period: string, quantity: number): Promise<void>;

  // Tables
  getTables(): Promise<Table[]>;
  getTable(id: string): Promise<Table | null>;
  createTable(table: Omit<Table, 'id' | 'createdAt' | 'updatedAt'>): Promise<Table>;
  updateTable(id: string, table: Partial<Table>): Promise<Table>;
  deleteTable(id: string): Promise<boolean>;
  getTableByNumber(number: string): Promise<Table | null>;

  // Activity Logs
  getActivityLogs(): Promise<ActivityLog[]>;
  getActivityLog(id: string): Promise<ActivityLog | null>;
  createActivityLog(log: Omit<ActivityLog, 'id' | 'createdAt'>): Promise<ActivityLog>;
  getActivityLogsByCategory(category: ActivityCategory): Promise<ActivityLog[]>;
  getActivityLogsByDateRange(startDate: string, endDate: string): Promise<ActivityLog[]>;
  getActivityLogsByUser(userId: string): Promise<ActivityLog[]>;

  // Delete Data Operations
  deleteOrdersByDateRange(startDate: string, endDate: string): Promise<number>;
  deleteStockMovementsByDateRange(startDate: string, endDate: string): Promise<number>;
  deleteActivityLogsByDateRange(startDate: string, endDate: string): Promise<number>;
  deleteAllOrders(): Promise<number>;
  deleteAllStockMovements(): Promise<number>;
  deleteAllActivityLogs(): Promise<number>;

  // Initialize
  initialize(): Promise<void>;

  // Seed Data (optional, for LocalStorage)
  seedCoffeeShop?(): Promise<{ success: boolean; message: string }>;
}

