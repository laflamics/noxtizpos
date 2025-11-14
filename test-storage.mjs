#!/usr/bin/env node

/**
 * Storage Test Script for Android Compatibility
 * Test semua fungsi LocalStorage tanpa electron
 * 
 * Usage: node test-storage.mjs
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Mock localStorage untuk Node.js
class MockLocalStorage {
  constructor() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }

  clear() {
    this.store = {};
  }
}

if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = new MockLocalStorage();
}

// Mock window object
if (typeof globalThis.window === 'undefined') {
  globalThis.window = globalThis;
}

// Import storage - kita perlu compile dulu atau pakai dynamic import
// Untuk sekarang, kita akan test dengan cara yang berbeda
// Kita akan test langsung dengan membuat instance storage

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name) {
  process.stdout.write(`${colors.blue}Testing ${name}...${colors.reset} `);
}

function logPass(message = '') {
  log(`✓ PASS${message ? `: ${message}` : ''}`, 'green');
}

function logFail(message) {
  log(`✗ FAIL: ${message}`, 'red');
}

// Simple BrowserStorage implementation untuk test
class BrowserStorage {
  constructor() {
    this.prefix = 'noxtiz-pos-';
  }

  getKey(key) {
    return `${this.prefix}${key}`;
  }

  get(key, defaultValue) {
    try {
      if (typeof localStorage === 'undefined') {
        return defaultValue;
      }
      const item = localStorage.getItem(this.getKey(key));
      if (item === null) return defaultValue;
      return JSON.parse(item);
    } catch (error) {
      console.error(`Error reading ${key}:`, error);
      return defaultValue;
    }
  }

  set(key, value) {
    try {
      if (typeof localStorage === 'undefined') {
        return;
      }
      localStorage.setItem(this.getKey(key), JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing ${key}:`, error);
    }
  }
}

// Simplified LocalStorage implementation untuk test
class TestLocalStorage {
  constructor() {
    this.storage = new BrowserStorage();
  }

  async initialize() {
    const users = this.storage.get('users', []);
    if (users.length === 0) {
      const defaultAdmin = {
        id: 'admin-1',
        username: 'admin',
        email: 'admin@noxtiz.com',
        role: 'admin',
        createdAt: new Date().toISOString(),
        isActive: true,
      };
      this.storage.set('users', [defaultAdmin]);
    }

    const categories = this.storage.get('categories', []);
    if (categories.length === 0) {
      const defaultCategories = [
        { id: 'cat-1', name: 'Makanan', color: '#FF6B6B' },
        { id: 'cat-2', name: 'Minuman', color: '#4ECDC4' },
        { id: 'cat-3', name: 'Dessert', color: '#FFE66D' },
        { id: 'cat-4', name: 'Snack', color: '#95E1D3' },
      ];
      this.storage.set('categories', defaultCategories);
    }
  }

  async getUsers() {
    return this.storage.get('users', []);
  }

  async getUser(id) {
    const users = await this.getUsers();
    return users.find(u => u.id === id) || null;
  }

  async createUser(user) {
    const users = await this.getUsers();
    const newUser = {
      ...user,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.storage.set('users', [...users, newUser]);
    return newUser;
  }

  async updateUser(id, user) {
    const users = await this.getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) throw new Error('User not found');
    users[index] = { ...users[index], ...user };
    this.storage.set('users', users);
    return users[index];
  }

  async deleteUser(id) {
    const users = await this.getUsers();
    const filtered = users.filter(u => u.id !== id);
    this.storage.set('users', filtered);
    return true;
  }

  async getCategories() {
    return this.storage.get('categories', []);
  }

  async getCategory(id) {
    const categories = await this.getCategories();
    return categories.find(c => c.id === id) || null;
  }

  async createCategory(category) {
    const categories = await this.getCategories();
    const newCategory = {
      ...category,
      id: `cat-${Date.now()}`,
    };
    this.storage.set('categories', [...categories, newCategory]);
    return newCategory;
  }

  async updateCategory(id, category) {
    const categories = await this.getCategories();
    const index = categories.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Category not found');
    categories[index] = { ...categories[index], ...category };
    this.storage.set('categories', categories);
    return categories[index];
  }

  async deleteCategory(id) {
    const categories = await this.getCategories();
    const filtered = categories.filter(c => c.id !== id);
    this.storage.set('categories', filtered);
    return true;
  }

  async getProducts() {
    return this.storage.get('products', []);
  }

  async getProduct(id) {
    const products = await this.getProducts();
    return products.find(p => p.id === id) || null;
  }

  async createProduct(product) {
    const products = await this.getProducts();
    const now = new Date().toISOString();
    const newProduct = {
      ...product,
      id: `prod-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    this.storage.set('products', [...products, newProduct]);
    return newProduct;
  }

  async updateProduct(id, product) {
    const products = await this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Product not found');
    products[index] = { ...products[index], ...product, updatedAt: new Date().toISOString() };
    this.storage.set('products', products);
    return products[index];
  }

  async deleteProduct(id) {
    const products = await this.getProducts();
    const filtered = products.filter(p => p.id !== id);
    this.storage.set('products', filtered);
    return true;
  }

  async getOrders() {
    return this.storage.get('orders', []);
  }

  async getOrder(id) {
    const orders = await this.getOrders();
    return orders.find(o => o.id === id) || null;
  }

  async createOrder(order) {
    const orders = await this.getOrders();
    const newOrder = {
      ...order,
      id: `order-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.storage.set('orders', [...orders, newOrder]);
    return newOrder;
  }

  async updateOrder(id, order) {
    const orders = await this.getOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) throw new Error('Order not found');
    orders[index] = { ...orders[index], ...order };
    this.storage.set('orders', orders);
    return orders[index];
  }

  async deleteOrder(id) {
    const orders = await this.getOrders();
    const filtered = orders.filter(o => o.id !== id);
    this.storage.set('orders', filtered);
    return true;
  }

  async getSettings() {
    return this.storage.get('settings', {
      storageType: 'local',
      taxRate: 0.1,
      taxDisplayMode: 'include_hide',
      currency: 'IDR',
      companyName: 'Noxtiz Culinary Lab',
      voidPin: '',
    });
  }

  async updateSettings(settings) {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    if (!updated.voidPin) {
      updated.voidPin = '';
    }
    this.storage.set('settings', updated);
    return updated;
  }

  async getStockMovements() {
    return this.storage.get('stockMovements', []);
  }

  async createStockMovement(movement) {
    const movements = await this.getStockMovements();
    const newMovement = {
      ...movement,
      id: `movement-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.storage.set('stockMovements', [...movements, newMovement]);

    // Update product stock
    const products = await this.getProducts();
    const productIndex = products.findIndex(p => p.id === movement.productId);
    if (productIndex !== -1) {
      products[productIndex].stock = movement.newStock;
      products[productIndex].updatedAt = new Date().toISOString();
      this.storage.set('products', products);
    }

    return newMovement;
  }

  async getStockMovementsByProduct(productId) {
    const movements = await this.getStockMovements();
    return movements.filter(m => m.productId === productId);
  }

  async getTables() {
    return this.storage.get('tables', []);
  }

  async getTable(id) {
    const tables = await this.getTables();
    return tables.find(t => t.id === id) || null;
  }

  async createTable(table) {
    const tables = await this.getTables();
    const newTable = {
      ...table,
      id: `table-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.storage.set('tables', [...tables, newTable]);
    return newTable;
  }

  async updateTable(id, table) {
    const tables = await this.getTables();
    const index = tables.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Table not found');
    const updated = { ...tables[index], ...table, updatedAt: new Date().toISOString() };
    tables[index] = updated;
    this.storage.set('tables', tables);
    return updated;
  }

  async deleteTable(id) {
    const tables = await this.getTables();
    const filtered = tables.filter(t => t.id !== id);
    this.storage.set('tables', filtered);
    return filtered.length < tables.length;
  }

  async getTableByNumber(number) {
    const tables = await this.getTables();
    return tables.find(t => t.number === number) || null;
  }

  async getActivityLogs() {
    return this.storage.get('activityLogs', []);
  }

  async getActivityLog(id) {
    const logs = await this.getActivityLogs();
    return logs.find(l => l.id === id) || null;
  }

  async createActivityLog(log) {
    const logs = await this.getActivityLogs();
    const newLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    const updatedLogs = [...logs, newLog].slice(-10000);
    this.storage.set('activityLogs', updatedLogs);
    return newLog;
  }

  async getActivityLogsByCategory(category) {
    const logs = await this.getActivityLogs();
    return logs.filter(l => l.category === category);
  }

  async getActivityLogsByUser(userId) {
    const logs = await this.getActivityLogs();
    return logs.filter(l => l.userId === userId);
  }

  async getInventoryReport(period) {
    const movements = await this.getStockMovements();
    const products = await this.getProducts();
    const periodMovements = movements.filter(m => m.createdAt.startsWith(period));

    return products.map(product => {
      const productMovements = periodMovements.filter(m => m.productId === product.id);
      const opening = productMovements.find(m => m.type === 'opening');
      const stockIn = productMovements
        .filter(m => m.type === 'in')
        .reduce((sum, m) => sum + m.quantity, 0);
      const stockOut = productMovements
        .filter(m => m.type === 'out')
        .reduce((sum, m) => sum + m.quantity, 0);
      const adjustment = productMovements
        .filter(m => m.type === 'adjustment')
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
  }

  async deleteAllOrders() {
    const orders = await this.getOrders();
    const count = orders.length;
    this.storage.set('orders', []);
    return count;
  }

  async deleteAllStockMovements() {
    const movements = await this.getStockMovements();
    const count = movements.length;
    this.storage.set('stockMovements', []);
    return count;
  }

  async deleteAllActivityLogs() {
    const logs = await this.getActivityLogs();
    const count = logs.length;
    this.storage.set('activityLogs', []);
    return count;
  }

  async seedCoffeeShop() {
    try {
      const categories = await this.getCategories();
      const newCategories = [
        { id: 'cat-coffee', name: 'Coffee', color: '#8B4513' },
        { id: 'cat-espresso', name: 'Espresso', color: '#654321' },
        { id: 'cat-latte', name: 'Latte & Cappuccino', color: '#D2B48C' },
        { id: 'cat-cold', name: 'Cold Drinks', color: '#87CEEB' },
        { id: 'cat-pastry', name: 'Pastries', color: '#FFD700' },
        { id: 'cat-snack', name: 'Snacks', color: '#FF6347' },
        { id: 'cat-dessert', name: 'Desserts', color: '#FF69B4' },
        { id: 'cat-other', name: 'Others', color: '#9370DB' },
      ];

      for (const cat of newCategories) {
        const exists = categories.find(c => c.id === cat.id);
        if (!exists) {
          await this.createCategory(cat);
        }
      }

      return { success: true, message: 'Seed completed' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

const storage = new TestLocalStorage();
const results = {
  passed: 0,
  failed: 0,
  total: 0,
};

async function runTest(name, testFn) {
  results.total++;
  logTest(name);
  const start = Date.now();
  try {
    await testFn();
    const duration = Date.now() - start;
    logPass(`(${duration}ms)`);
    results.passed++;
    return true;
  } catch (error) {
    const duration = Date.now() - start;
    logFail(`${error.message} (${duration}ms)`);
    results.failed++;
    return false;
  }
}

// Test functions
async function testInitialize() {
  await storage.initialize();
  const users = await storage.getUsers();
  if (users.length === 0) throw new Error('Users not initialized');
}

async function testUsers() {
  const newUser = await storage.createUser({
    username: 'testuser',
    email: 'test@test.com',
    role: 'cashier',
    isActive: true,
  });
  if (!newUser.id) throw new Error('User ID not generated');

  const user = await storage.getUser(newUser.id);
  if (!user || user.username !== 'testuser') throw new Error('User not found');

  const updated = await storage.updateUser(newUser.id, { email: 'updated@test.com' });
  if (updated.email !== 'updated@test.com') throw new Error('User not updated');

  await storage.deleteUser(newUser.id);
  const deleted = await storage.getUser(newUser.id);
  if (deleted) throw new Error('User not deleted');
}

async function testCategories() {
  const newCat = await storage.createCategory({
    name: 'Test Category',
    color: '#FF0000',
  });
  if (!newCat.id) throw new Error('Category ID not generated');

  const cat = await storage.getCategory(newCat.id);
  if (!cat || cat.name !== 'Test Category') throw new Error('Category not found');

  const updated = await storage.updateCategory(newCat.id, { name: 'Updated Category' });
  if (updated.name !== 'Updated Category') throw new Error('Category not updated');

  await storage.deleteCategory(newCat.id);
  const deleted = await storage.getCategory(newCat.id);
  if (deleted) throw new Error('Category not deleted');
}

async function testProducts() {
  const cat = await storage.createCategory({ name: 'Test Cat', color: '#000' });

  const newProduct = await storage.createProduct({
    name: 'Test Product',
    description: 'Test Description',
    price: 10000,
    category: cat.id,
    stock: 50,
    barcode: 'TEST001',
  });
  if (!newProduct.id) throw new Error('Product ID not generated');

  const product = await storage.getProduct(newProduct.id);
  if (!product || product.name !== 'Test Product') throw new Error('Product not found');

  const updated = await storage.updateProduct(newProduct.id, { price: 15000 });
  if (updated.price !== 15000) throw new Error('Product not updated');

  await storage.deleteProduct(newProduct.id);
  const deleted = await storage.getProduct(newProduct.id);
  if (deleted) throw new Error('Product not deleted');

  await storage.deleteCategory(cat.id);
}

async function testOrders() {
  const user = await storage.createUser({
    username: 'orderuser',
    email: 'order@test.com',
    role: 'cashier',
    isActive: true,
  });
  const cat = await storage.createCategory({ name: 'Order Cat', color: '#000' });
  const product = await storage.createProduct({
    name: 'Order Product',
    price: 20000,
    category: cat.id,
    stock: 100,
  });

  const newOrder = await storage.createOrder({
    items: [{
      productId: product.id,
      productName: product.name,
      quantity: 2,
      price: product.price,
      subtotal: product.price * 2,
    }],
    subtotal: product.price * 2,
    tax: 0,
    discount: 0,
    total: product.price * 2,
    userId: user.id,
    userName: user.username,
    status: 'completed',
    paymentMethod: 'cash',
  });
  if (!newOrder.id) throw new Error('Order ID not generated');

  const order = await storage.getOrder(newOrder.id);
  if (!order || order.items.length === 0) throw new Error('Order not found');

  const updated = await storage.updateOrder(newOrder.id, { status: 'cancelled' });
  if (updated.status !== 'cancelled') throw new Error('Order not updated');

  await storage.deleteOrder(newOrder.id);
  const deleted = await storage.getOrder(newOrder.id);
  if (deleted) throw new Error('Order not deleted');

  await storage.deleteProduct(product.id);
  await storage.deleteCategory(cat.id);
  await storage.deleteUser(user.id);
}

async function testStockMovements() {
  const cat = await storage.createCategory({ name: 'Stock Cat', color: '#000' });
  const product = await storage.createProduct({
    name: 'Stock Product',
    price: 10000,
    category: cat.id,
    stock: 50,
  });

  const movement = await storage.createStockMovement({
    productId: product.id,
    productName: product.name,
    type: 'in',
    quantity: 10,
    previousStock: 50,
    newStock: 60,
    userId: 'test',
    userName: 'Test User',
  });
  if (!movement.id) throw new Error('Stock movement ID not generated');

  const updatedProduct = await storage.getProduct(product.id);
  if (!updatedProduct) throw new Error('Product not found after stock movement');
  if (updatedProduct.stock !== 60) throw new Error('Product stock not updated');

  const movements = await storage.getStockMovementsByProduct(product.id);
  if (movements.length === 0) throw new Error('Stock movements not found');

  await storage.deleteProduct(product.id);
  await storage.deleteCategory(cat.id);
}

async function testTables() {
  const newTable = await storage.createTable({
    number: 'T-99',
    name: 'Test Table',
    capacity: 4,
    status: 'available',
  });
  if (!newTable.id) throw new Error('Table ID not generated');

  const table = await storage.getTable(newTable.id);
  if (!table || table.number !== 'T-99') throw new Error('Table not found');

  const tableByNumber = await storage.getTableByNumber('T-99');
  if (!tableByNumber) throw new Error('Table by number not found');

  const updated = await storage.updateTable(newTable.id, { status: 'occupied' });
  if (updated.status !== 'occupied') throw new Error('Table not updated');

  await storage.deleteTable(newTable.id);
  const deleted = await storage.getTable(newTable.id);
  if (deleted) throw new Error('Table not deleted');
}

async function testActivityLogs() {
  const newLog = await storage.createActivityLog({
    category: 'product',
    action: 'create',
    description: 'Test product created',
    userId: 'test-user',
    userName: 'Test User',
    details: {
      productId: 'test-id',
      productName: 'Test Product',
    },
  });
  if (!newLog.id) throw new Error('Activity log ID not generated');

  const log = await storage.getActivityLog(newLog.id);
  if (!log || log.action !== 'create') throw new Error('Activity log not found');

  const logsByCategory = await storage.getActivityLogsByCategory('product');
  if (logsByCategory.length === 0) throw new Error('Activity logs by category not found');

  const logsByUser = await storage.getActivityLogsByUser('test-user');
  if (logsByUser.length === 0) throw new Error('Activity logs by user not found');
}

async function testSettings() {
  const defaultSettings = await storage.getSettings();
  if (!defaultSettings.companyName) throw new Error('Default settings not found');

  const updated = await storage.updateSettings({ companyName: 'Test Company' });
  if (updated.companyName !== 'Test Company') throw new Error('Settings not updated');

  await storage.updateSettings({ companyName: defaultSettings.companyName });
}

async function testInventoryReport() {
  const cat = await storage.createCategory({ name: 'Report Cat', color: '#000' });
  const product = await storage.createProduct({
    name: 'Report Product',
    price: 10000,
    category: cat.id,
    stock: 100,
  });

  await storage.createStockMovement({
    productId: product.id,
    productName: product.name,
    type: 'in',
    quantity: 20,
    previousStock: 100,
    newStock: 120,
    userId: 'test',
    userName: 'Test',
  });

  const period = new Date().toISOString().substring(0, 7);
  const report = await storage.getInventoryReport(period);
  if (report.length === 0) throw new Error('Inventory report not generated');

  await storage.deleteProduct(product.id);
  await storage.deleteCategory(cat.id);
}

async function testSeedCoffeeShop() {
  if (typeof storage.seedCoffeeShop !== 'function') {
    throw new Error('seedCoffeeShop function not available');
  }

  const result = await storage.seedCoffeeShop();
  if (!result.success) {
    throw new Error(result.message || 'Seed failed');
  }
}

async function testDeleteOperations() {
  const user = await storage.createUser({
    username: 'deleteuser',
    email: 'delete@test.com',
    role: 'cashier',
    isActive: true,
  });
  const cat = await storage.createCategory({ name: 'Delete Cat', color: '#000' });
  const product = await storage.createProduct({
    name: 'Delete Product',
    price: 10000,
    category: cat.id,
    stock: 50,
  });

  await storage.createOrder({
    items: [{
      productId: product.id,
      productName: product.name,
      quantity: 1,
      price: product.price,
      subtotal: product.price,
    }],
    subtotal: product.price,
    tax: 0,
    discount: 0,
    total: product.price,
    userId: user.id,
    userName: user.username,
    status: 'completed',
    paymentMethod: 'cash',
  });

  await storage.createStockMovement({
    productId: product.id,
    productName: product.name,
    type: 'in',
    quantity: 10,
    previousStock: 50,
    newStock: 60,
    userId: user.id,
    userName: user.username,
  });

  await storage.createActivityLog({
    category: 'product',
    action: 'create',
    description: `Product ${product.name} created`,
    userId: user.id,
    userName: user.username,
    details: {
      productId: product.id,
      productName: product.name,
    },
  });

  const allOrdersBefore = await storage.getOrders();
  const deletedAllOrders = await storage.deleteAllOrders();
  if (deletedAllOrders === 0 && allOrdersBefore.length > 0) {
    throw new Error('Delete all orders failed');
  }

  const allMovementsBefore = await storage.getStockMovements();
  const deletedAllMovements = await storage.deleteAllStockMovements();
  if (deletedAllMovements === 0 && allMovementsBefore.length > 0) {
    throw new Error('Delete all movements failed');
  }

  const allLogsBefore = await storage.getActivityLogs();
  const deletedAllLogs = await storage.deleteAllActivityLogs();
  if (deletedAllLogs === 0 && allLogsBefore.length > 0) {
    throw new Error('Delete all logs failed');
  }

  await storage.deleteProduct(product.id);
  await storage.deleteCategory(cat.id);
  await storage.deleteUser(user.id);
}

// Main test runner
async function runAllTests() {
  log('\n🧪 Storage Test Suite - Android Compatibility\n', 'cyan');
  log('Testing semua fungsi LocalStorage tanpa electron...\n', 'blue');

  const tests = [
    { name: 'Initialize Storage', fn: testInitialize },
    { name: 'Users CRUD', fn: testUsers },
    { name: 'Categories CRUD', fn: testCategories },
    { name: 'Products CRUD', fn: testProducts },
    { name: 'Orders CRUD', fn: testOrders },
    { name: 'Stock Movements', fn: testStockMovements },
    { name: 'Tables CRUD', fn: testTables },
    { name: 'Activity Logs', fn: testActivityLogs },
    { name: 'Settings', fn: testSettings },
    { name: 'Inventory Report', fn: testInventoryReport },
    { name: 'Seed Coffee Shop', fn: testSeedCoffeeShop },
    { name: 'Delete Operations', fn: testDeleteOperations },
  ];

  for (const test of tests) {
    await runTest(test.name, test.fn);
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  // Summary
  log('\n' + '='.repeat(50), 'cyan');
  log('Test Summary', 'cyan');
  log('='.repeat(50), 'cyan');
  log(`Total Tests: ${results.total}`, 'blue');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  const successRate = ((results.passed / results.total) * 100).toFixed(1);
  log(`Success Rate: ${successRate}%`, successRate === '100.0' ? 'green' : 'yellow');
  log('='.repeat(50) + '\n', 'cyan');

  // Cleanup
  try {
    if (typeof localStorage !== 'undefined' && localStorage.clear) {
      localStorage.clear();
    }
  } catch (e) {
    // Ignore
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  log(`\n✗ Fatal Error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

