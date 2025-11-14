import { useState } from 'react';
import { LocalStorage } from '@/storage/local';
import { CheckCircle, XCircle, Loader, Play } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
  duration?: number;
}

export default function StorageTest() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [storage] = useState(() => new LocalStorage());

  const updateResult = (name: string, status: TestResult['status'], message?: string, duration?: number) => {
    setResults(prev => {
      const existing = prev.find(r => r.name === name);
      if (existing) {
        return prev.map(r => r.name === name ? { ...r, status, message, duration } : r);
      }
      return [...prev, { name, status, message, duration }];
    });
  };

  const runTest = async (name: string, testFn: () => Promise<void>) => {
    updateResult(name, 'running');
    const start = Date.now();
    try {
      await testFn();
      const duration = Date.now() - start;
      updateResult(name, 'passed', `✅ Passed in ${duration}ms`, duration);
    } catch (error) {
      const duration = Date.now() - start;
      updateResult(name, 'failed', `❌ ${error instanceof Error ? error.message : String(error)}`, duration);
    }
  };

  const testInitialize = async () => {
    await storage.initialize();
    const users = await storage.getUsers();
    if (users.length === 0) throw new Error('Users not initialized');
  };

  const testUsers = async () => {
    // Create
    const newUser = await storage.createUser({
      username: 'testuser',
      email: 'test@test.com',
      role: 'cashier',
      isActive: true,
    });
    if (!newUser.id) throw new Error('User ID not generated');

    // Read
    const user = await storage.getUser(newUser.id);
    if (!user || user.username !== 'testuser') throw new Error('User not found');

    // Update
    const updated = await storage.updateUser(newUser.id, { email: 'updated@test.com' });
    if (updated.email !== 'updated@test.com') throw new Error('User not updated');

    // Delete
    await storage.deleteUser(newUser.id);
    const deleted = await storage.getUser(newUser.id);
    if (deleted) throw new Error('User not deleted');
  };

  const testCategories = async () => {
    // Create
    const newCat = await storage.createCategory({
      name: 'Test Category',
      color: '#FF0000',
    });
    if (!newCat.id) throw new Error('Category ID not generated');

    // Read
    const cat = await storage.getCategory(newCat.id);
    if (!cat || cat.name !== 'Test Category') throw new Error('Category not found');

    // Update
    const updated = await storage.updateCategory(newCat.id, { name: 'Updated Category' });
    if (updated.name !== 'Updated Category') throw new Error('Category not updated');

    // Delete
    await storage.deleteCategory(newCat.id);
    const deleted = await storage.getCategory(newCat.id);
    if (deleted) throw new Error('Category not deleted');
  };

  const testProducts = async () => {
    // Create category first
    const cat = await storage.createCategory({ name: 'Test Cat', color: '#000' });

    // Create
    const newProduct = await storage.createProduct({
      name: 'Test Product',
      description: 'Test Description',
      price: 10000,
      category: cat.id,
      stock: 50,
      barcode: 'TEST001',
    });
    if (!newProduct.id) throw new Error('Product ID not generated');

    // Read
    const product = await storage.getProduct(newProduct.id);
    if (!product || product.name !== 'Test Product') throw new Error('Product not found');

    // Update
    const updated = await storage.updateProduct(newProduct.id, { price: 15000 });
    if (updated.price !== 15000) throw new Error('Product not updated');

    // Delete
    await storage.deleteProduct(newProduct.id);
    const deleted = await storage.getProduct(newProduct.id);
    if (deleted) throw new Error('Product not deleted');

    // Cleanup
    await storage.deleteCategory(cat.id);
  };

  const testOrders = async () => {
    // Create user and product first
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

    // Create order
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

    // Read
    const order = await storage.getOrder(newOrder.id);
    if (!order || order.items.length === 0) throw new Error('Order not found');

    // Update
    const updated = await storage.updateOrder(newOrder.id, { status: 'cancelled' });
    if (updated.status !== 'cancelled') throw new Error('Order not updated');

    // Delete
    await storage.deleteOrder(newOrder.id);
    const deleted = await storage.getOrder(newOrder.id);
    if (deleted) throw new Error('Order not deleted');

    // Cleanup
    await storage.deleteProduct(product.id);
    await storage.deleteCategory(cat.id);
    await storage.deleteUser(user.id);
  };

  const testStockMovements = async () => {
    const cat = await storage.createCategory({ name: 'Stock Cat', color: '#000' });
    const product = await storage.createProduct({
      name: 'Stock Product',
      price: 10000,
      category: cat.id,
      stock: 50,
    });

    // Create stock movement
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

    // Check product stock updated
    const updatedProduct = await storage.getProduct(product.id);
    if (!updatedProduct) throw new Error('Product not found after stock movement');
    if (updatedProduct.stock !== 60) throw new Error('Product stock not updated');

    // Get movements by product
    const movements = await storage.getStockMovementsByProduct(product.id);
    if (movements.length === 0) throw new Error('Stock movements not found');

    // Cleanup
    await storage.deleteProduct(product.id);
    await storage.deleteCategory(cat.id);
  };

  const testTables = async () => {
    // Create
    const newTable = await storage.createTable({
      number: 'T-99',
      name: 'Test Table',
      capacity: 4,
      status: 'available',
    });
    if (!newTable.id) throw new Error('Table ID not generated');

    // Read
    const table = await storage.getTable(newTable.id);
    if (!table || table.number !== 'T-99') throw new Error('Table not found');

    // Get by number
    const tableByNumber = await storage.getTableByNumber('T-99');
    if (!tableByNumber) throw new Error('Table by number not found');

    // Update
    const updated = await storage.updateTable(newTable.id, { status: 'occupied' });
    if (updated.status !== 'occupied') throw new Error('Table not updated');

    // Delete
    await storage.deleteTable(newTable.id);
    const deleted = await storage.getTable(newTable.id);
    if (deleted) throw new Error('Table not deleted');
  };

  const testActivityLogs = async () => {
    // Create
    const newLog = await storage.createActivityLog({
      category: 'product',
      action: 'create',
      description: 'Test product created',
      userId: 'test-user',
      userName: 'Test User',
      details: {
        productId: 'test-id',
        productName: 'Test Product',
        test: true,
      },
    });
    if (!newLog.id) throw new Error('Activity log ID not generated');

    // Read
    const log = await storage.getActivityLog(newLog.id);
    if (!log || log.action !== 'create') throw new Error('Activity log not found');

    // Get by category
    const logsByCategory = await storage.getActivityLogsByCategory('product');
    if (logsByCategory.length === 0) throw new Error('Activity logs by category not found');

    // Get by user
    const logsByUser = await storage.getActivityLogsByUser('test-user');
    if (logsByUser.length === 0) throw new Error('Activity logs by user not found');
  };

  const testSettings = async () => {
    // Get default settings
    const defaultSettings = await storage.getSettings();
    if (!defaultSettings.companyName) throw new Error('Default settings not found');

    // Update
    const updated = await storage.updateSettings({ companyName: 'Test Company' });
    if (updated.companyName !== 'Test Company') throw new Error('Settings not updated');

    // Reset
    await storage.updateSettings({ companyName: defaultSettings.companyName });
  };

  const testInventoryReport = async () => {
    const cat = await storage.createCategory({ name: 'Report Cat', color: '#000' });
    const product = await storage.createProduct({
      name: 'Report Product',
      price: 10000,
      category: cat.id,
      stock: 100,
    });

    // Create some movements
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

    const period = new Date().toISOString().substring(0, 7); // YYYY-MM
    const report = await storage.getInventoryReport(period);
    if (report.length === 0) throw new Error('Inventory report not generated');

    // Cleanup
    await storage.deleteProduct(product.id);
    await storage.deleteCategory(cat.id);
  };

  const testSeedCoffeeShop = async () => {
    if (typeof storage.seedCoffeeShop !== 'function') {
      throw new Error('seedCoffeeShop function not available');
    }

    const result = await storage.seedCoffeeShop();
    if (!result.success) {
      throw new Error(result.message || 'Seed failed');
    }
  };

  const testDeleteOperations = async () => {
    // Create test data
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
    
    // Create order with current date
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

    // Test delete all operations
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

    // Cleanup
    await storage.deleteProduct(product.id);
    await storage.deleteCategory(cat.id);
    await storage.deleteUser(user.id);
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);

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
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsRunning(false);
  };

  const passed = results.filter(r => r.status === 'passed').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const total = results.length;
  const successRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0';

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <div style={{ marginBottom: '32px' }}>
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
          Storage Test Suite
        </h1>
        <p style={{ color: '#a0a0b0', fontSize: '16px' }}>
          Test semua fungsi LocalStorage untuk memastikan kompatibilitas Android
        </p>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>Test Results</h2>
            <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#a0a0b0' }}>
              <span>Total: {total}</span>
              <span style={{ color: '#00ff88' }}>Passed: {passed}</span>
              <span style={{ color: '#ff6b6b' }}>Failed: {failed}</span>
              <span>Success Rate: {successRate}%</span>
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={runAllTests}
            disabled={isRunning}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: 700,
              opacity: isRunning ? 0.5 : 1,
              cursor: isRunning ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {isRunning ? (
              <>
                <Loader size={20} className="animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Play size={20} />
                Run All Tests
              </>
            )}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {results.length === 0 ? (
            <p style={{ color: '#a0a0b0', textAlign: 'center', padding: '40px' }}>
              Klik "Run All Tests" untuk memulai testing
            </p>
          ) : (
            results.map((result, index) => (
              <div
                key={index}
                style={{
                  padding: '16px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  border: `1px solid ${
                    result.status === 'passed' ? '#00ff88' :
                    result.status === 'failed' ? '#ff6b6b' :
                    result.status === 'running' ? '#ffe66d' : 'transparent'
                  }`,
                }}
              >
                {result.status === 'running' && <Loader size={20} className="animate-spin" color="#ffe66d" />}
                {result.status === 'passed' && <CheckCircle size={20} color="#00ff88" />}
                {result.status === 'failed' && <XCircle size={20} color="#ff6b6b" />}
                {result.status === 'pending' && <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#606070' }} />}
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, fontSize: '16px' }}>{result.name}</span>
                    {result.duration !== undefined && (
                      <span style={{ color: '#a0a0b0', fontSize: '12px' }}>{result.duration}ms</span>
                    )}
                  </div>
                  {result.message && (
                    <p style={{ color: '#a0a0b0', fontSize: '14px', margin: 0 }}>{result.message}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>Test Coverage</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
          {[
            'Initialize Storage',
            'Users CRUD',
            'Categories CRUD',
            'Products CRUD',
            'Orders CRUD',
            'Stock Movements',
            'Tables CRUD',
            'Activity Logs',
            'Settings',
            'Inventory Report',
            'Seed Coffee Shop',
            'Delete Operations',
          ].map((testName) => {
            const result = results.find(r => r.name === testName);
            return (
              <div
                key={testName}
                style={{
                  padding: '12px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                }}
              >
                {result?.status === 'passed' && <CheckCircle size={16} color="#00ff88" />}
                {result?.status === 'failed' && <XCircle size={16} color="#ff6b6b" />}
                {result?.status === 'running' && <Loader size={16} className="animate-spin" color="#ffe66d" />}
                {!result && <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#606070' }} />}
                <span>{testName}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

