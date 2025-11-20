import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import pkg from 'electron-updater';
const { autoUpdater } = pkg;
import { storageAPI } from './storage.js';
import { seedCoffeeShopData } from './seed.js';

// Get __dirname equivalent for ES modules
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

// Register IPC handlers immediately (before app ready)
function registerIpcHandlers() {
  // IPC Handlers
  ipcMain.handle('app:getVersion', () => {
    return app.getVersion();
  });
  
  ipcMain.handle('app:getPath', (_event, name: string) => {
    return app.getPath(name as any);
  });

  // Storage IPC Handlers
  ipcMain.handle('storage:getUsers', () => storageAPI.getUsers());
  ipcMain.handle('storage:getUser', (_event, id: string) => storageAPI.getUser(id));
  ipcMain.handle('storage:createUser', (_event, user: any) => storageAPI.createUser(user));
  ipcMain.handle('storage:updateUser', (_event, id: string, user: any) => storageAPI.updateUser(id, user));
  ipcMain.handle('storage:deleteUser', (_event, id: string) => storageAPI.deleteUser(id));

  ipcMain.handle('storage:getProducts', () => storageAPI.getProducts());
  ipcMain.handle('storage:getProduct', (_event, id: string) => storageAPI.getProduct(id));
  ipcMain.handle('storage:createProduct', (_event, product: any) => storageAPI.createProduct(product));
  ipcMain.handle('storage:updateProduct', (_event, id: string, product: any) => storageAPI.updateProduct(id, product));
  ipcMain.handle('storage:deleteProduct', (_event, id: string) => storageAPI.deleteProduct(id));

  ipcMain.handle('storage:getCategories', () => storageAPI.getCategories());
  ipcMain.handle('storage:getCategory', (_event, id: string) => storageAPI.getCategory(id));
  ipcMain.handle('storage:createCategory', (_event, category: any) => storageAPI.createCategory(category));
  ipcMain.handle('storage:updateCategory', (_event, id: string, category: any) => storageAPI.updateCategory(id, category));
  ipcMain.handle('storage:deleteCategory', (_event, id: string) => storageAPI.deleteCategory(id));

  ipcMain.handle('storage:getOrders', () => storageAPI.getOrders());
  ipcMain.handle('storage:getOrder', (_event, id: string) => storageAPI.getOrder(id));
  ipcMain.handle('storage:createOrder', (_event, order: any) => storageAPI.createOrder(order));
  ipcMain.handle('storage:updateOrder', (_event, id: string, order: any) => storageAPI.updateOrder(id, order));
  ipcMain.handle('storage:deleteOrder', (_event, id: string) => storageAPI.deleteOrder(id));

  ipcMain.handle('storage:getSettings', () => storageAPI.getSettings());
  ipcMain.handle('storage:updateSettings', (_event, settings: any) => storageAPI.updateSettings(settings));

  // Stock Movements
  ipcMain.handle('storage:getStockMovements', () => storageAPI.getStockMovements());
  ipcMain.handle('storage:getStockMovement', (_event, id: string) => storageAPI.getStockMovement(id));
  ipcMain.handle('storage:createStockMovement', (_event, movement: any) => storageAPI.createStockMovement(movement));
  ipcMain.handle('storage:getStockMovementsByProduct', (_event, productId: string) => storageAPI.getStockMovementsByProduct(productId));
  ipcMain.handle('storage:getStockMovementsByPeriod', (_event, period: string) => storageAPI.getStockMovementsByPeriod(period));

  // Inventory Reports
  ipcMain.handle('storage:getInventoryReport', (_event, period: string) => storageAPI.getInventoryReport(period));
  ipcMain.handle('storage:setOpeningStock', (_event, productId: string, period: string, quantity: number) => storageAPI.setOpeningStock(productId, period, quantity));

  // Tables
  ipcMain.handle('storage:getTables', () => storageAPI.getTables());
  ipcMain.handle('storage:getTable', (_event, id: string) => storageAPI.getTable(id));
  ipcMain.handle('storage:createTable', (_event, table: any) => storageAPI.createTable(table));
  ipcMain.handle('storage:updateTable', (_event, id: string, table: any) => storageAPI.updateTable(id, table));
  ipcMain.handle('storage:deleteTable', (_event, id: string) => storageAPI.deleteTable(id));
  ipcMain.handle('storage:getTableByNumber', (_event, number: string) => storageAPI.getTableByNumber(number));

  // Activity Logs
  ipcMain.handle('storage:getActivityLogs', () => {
    try {
      return storageAPI.getActivityLogs();
    } catch (error) {
      console.error('Error in getActivityLogs:', error);
      return [];
    }
  });
  ipcMain.handle('storage:getActivityLog', (_event, id: string) => {
    try {
      return storageAPI.getActivityLog(id);
    } catch (error) {
      console.error('Error in getActivityLog:', error);
      return null;
    }
  });
  ipcMain.handle('storage:createActivityLog', (_event, log: any) => {
    try {
      return storageAPI.createActivityLog(log);
    } catch (error) {
      console.error('Error in createActivityLog:', error);
      throw error;
    }
  });
  ipcMain.handle('storage:getActivityLogsByCategory', (_event, category: string) => {
    try {
      return storageAPI.getActivityLogsByCategory(category as any);
    } catch (error) {
      console.error('Error in getActivityLogsByCategory:', error);
      return [];
    }
  });
  ipcMain.handle('storage:getActivityLogsByDateRange', (_event, startDate: string, endDate: string) => {
    try {
      return storageAPI.getActivityLogsByDateRange(startDate, endDate);
    } catch (error) {
      console.error('Error in getActivityLogsByDateRange:', error);
      return [];
    }
  });
  ipcMain.handle('storage:getActivityLogsByUser', (_event, userId: string) => {
    try {
      return storageAPI.getActivityLogsByUser(userId);
    } catch (error) {
      console.error('Error in getActivityLogsByUser:', error);
      return [];
    }
  });

  // Seed data handler
  ipcMain.handle('storage:seedCoffeeShop', () => {
    try {
      seedCoffeeShopData();
      return { success: true, message: 'Coffee shop data seeded successfully' };
    } catch (error) {
      console.error('Seed error:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Failed to seed data' };
    }
  });

  // Update handlers
  ipcMain.handle('update:check', () => {
    return autoUpdater.checkForUpdates();
  });

  ipcMain.handle('update:download', () => {
    return autoUpdater.downloadUpdate();
  });

  ipcMain.handle('update:install', () => {
    autoUpdater.quitAndInstall();
  });

  // Delete Data handlers
  ipcMain.handle('storage:deleteOrdersByDateRange', (_event, startDate: string, endDate: string) => {
    try {
      return storageAPI.deleteOrdersByDateRange(startDate, endDate);
    } catch (error) {
      console.error('Error deleting orders:', error);
      throw error;
    }
  });

  ipcMain.handle('storage:deleteStockMovementsByDateRange', (_event, startDate: string, endDate: string) => {
    try {
      return storageAPI.deleteStockMovementsByDateRange(startDate, endDate);
    } catch (error) {
      console.error('Error deleting stock movements:', error);
      throw error;
    }
  });

  ipcMain.handle('storage:deleteActivityLogsByDateRange', (_event, startDate: string, endDate: string) => {
    try {
      return storageAPI.deleteActivityLogsByDateRange(startDate, endDate);
    } catch (error) {
      console.error('Error deleting activity logs:', error);
      throw error;
    }
  });

  ipcMain.handle('storage:deleteAllOrders', () => {
    try {
      return storageAPI.deleteAllOrders();
    } catch (error) {
      console.error('Error deleting all orders:', error);
      throw error;
    }
  });

  ipcMain.handle('storage:deleteAllStockMovements', () => {
    try {
      return storageAPI.deleteAllStockMovements();
    } catch (error) {
      console.error('Error deleting all stock movements:', error);
      throw error;
    }
  });

  ipcMain.handle('storage:deleteAllActivityLogs', () => {
    try {
      return storageAPI.deleteAllActivityLogs();
    } catch (error) {
      console.error('Error deleting all activity logs:', error);
      throw error;
    }
  });

  ipcMain.handle('storage:exportSnapshot', () => storageAPI.exportSnapshot());
  ipcMain.handle('storage:importSnapshot', (_event, snapshot, options) => storageAPI.importSnapshot(snapshot, options));
}

// Register handlers immediately
registerIpcHandlers();
console.log('IPC handlers registered, including activity logs handlers');
console.log('Delete handlers registered:', {
  deleteOrdersByDateRange: true,
  deleteStockMovementsByDateRange: true,
  deleteActivityLogsByDateRange: true,
  deleteAllOrders: true,
  deleteAllStockMovements: true,
  deleteAllActivityLogs: true,
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'default',
    backgroundColor: '#0a0a0f',
    icon: path.join(__dirname, '../public/noxtiz.ico'),
  });

  // Load app
  // Check if we're in development mode
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  
  if (isDev) {
    // Try to load from Vite dev server
    mainWindow.loadURL('http://localhost:5173').catch(() => {
      // If dev server not ready, show error
      mainWindow?.webContents.executeJavaScript(`
        document.body.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column; color: white; font-family: system-ui;">
          <h1>Waiting for Vite dev server...</h1>
          <p>Make sure Vite is running on http://localhost:5173</p>
        </div>';
      `);
    });
    mainWindow.webContents.openDevTools();
  } else {
    // Production: load from dist
    // In production, __dirname points to dist-electron, so we need to go up one level
    const indexPath = path.join(__dirname, '../dist/index.html');
    console.log('Loading production index from:', indexPath);
    console.log('__dirname:', __dirname);
    console.log('app.getAppPath():', app.getAppPath());
    
    // Try loadFile first (recommended for Electron)
    if (mainWindow) {
      mainWindow.loadFile(indexPath).catch((err) => {
        console.error('Failed to load index.html with loadFile:', err);
        if (!mainWindow) return;
        // Fallback: use app.getAppPath() for packaged apps
        const appPath = app.getAppPath();
        const fallbackPath = path.join(appPath, 'dist', 'index.html');
        console.log('Trying fallback path:', fallbackPath);
        mainWindow.loadFile(fallbackPath).catch((fallbackErr) => {
          console.error('Fallback loadFile also failed:', fallbackErr);
          if (!mainWindow) return;
          // Last resort: try as URL
          mainWindow.loadURL(`file://${fallbackPath}`).catch((urlErr) => {
            console.error('All load methods failed:', urlErr);
          });
        });
      });
    }
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  // Setup auto-updater
  if (app.isPackaged) {
    autoUpdater.setFeedURL({
      provider: 'generic',
      url: 'https://noxtiz.com/updates/',
    });

    // Auto check for updates every hour (3600000 ms)
    autoUpdater.checkForUpdates();
    setInterval(() => {
      autoUpdater.checkForUpdates();
    }, 3600000); // 1 hour

    // Update events
    autoUpdater.on('checking-for-update', () => {
      console.log('Checking for update...');
      mainWindow?.webContents.send('update:checking');
    });

    autoUpdater.on('update-available', (info) => {
      console.log('Update available:', info.version);
      mainWindow?.webContents.send('update:available', {
        version: info.version,
        releaseDate: info.releaseDate,
      });
    });

    autoUpdater.on('update-not-available', () => {
      console.log('Update not available');
      mainWindow?.webContents.send('update:not-available');
    });

    autoUpdater.on('error', (error) => {
      console.error('Update error:', error);
      mainWindow?.webContents.send('update:error', {
        message: error.message,
      });
    });

    autoUpdater.on('download-progress', (progress) => {
      mainWindow?.webContents.send('update:download-progress', {
        percent: progress.percent,
        transferred: progress.transferred,
        total: progress.total,
      });
    });

    autoUpdater.on('update-downloaded', (info) => {
      console.log('Update downloaded:', info.version);
      mainWindow?.webContents.send('update:downloaded', {
        version: info.version,
      });
    });
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

