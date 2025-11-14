const { contextBridge, ipcRenderer, shell } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  
  shell: {
    openExternal: (url: string) => shell.openExternal(url),
    showItemInFolder: (path: string) => shell.showItemInFolder(path),
    openPath: (path: string) => shell.openPath(path),
  },
  
  app: {
    getPath: (name: string) => ipcRenderer.invoke('app:getPath', name),
  },

  // Update API
  update: {
    check: () => ipcRenderer.invoke('update:check'),
    download: () => ipcRenderer.invoke('update:download'),
    install: () => ipcRenderer.invoke('update:install'),
    onChecking: (callback: () => void) => {
      ipcRenderer.on('update:checking', callback);
      return () => ipcRenderer.removeListener('update:checking', callback);
    },
    onAvailable: (callback: (info: any) => void) => {
      ipcRenderer.on('update:available', (_event: any, info: any) => callback(info));
      return () => ipcRenderer.removeAllListeners('update:available');
    },
    onNotAvailable: (callback: () => void) => {
      ipcRenderer.on('update:not-available', callback);
      return () => ipcRenderer.removeListener('update:not-available', callback);
    },
    onError: (callback: (error: any) => void) => {
      ipcRenderer.on('update:error', (_event: any, error: any) => callback(error));
      return () => ipcRenderer.removeAllListeners('update:error');
    },
    onDownloadProgress: (callback: (progress: any) => void) => {
      ipcRenderer.on('update:download-progress', (_event: any, progress: any) => callback(progress));
      return () => ipcRenderer.removeAllListeners('update:download-progress');
    },
    onDownloaded: (callback: (info: any) => void) => {
      ipcRenderer.on('update:downloaded', (_event: any, info: any) => callback(info));
      return () => ipcRenderer.removeAllListeners('update:downloaded');
    },
  },
  
  // Storage API
  storage: {
    getUsers: () => ipcRenderer.invoke('storage:getUsers'),
    getUser: (id: string) => ipcRenderer.invoke('storage:getUser', id),
    createUser: (user: any) => ipcRenderer.invoke('storage:createUser', user),
    updateUser: (id: string, user: any) => ipcRenderer.invoke('storage:updateUser', id, user),
    deleteUser: (id: string) => ipcRenderer.invoke('storage:deleteUser', id),
    
    getProducts: () => ipcRenderer.invoke('storage:getProducts'),
    getProduct: (id: string) => ipcRenderer.invoke('storage:getProduct', id),
    createProduct: (product: any) => ipcRenderer.invoke('storage:createProduct', product),
    updateProduct: (id: string, product: any) => ipcRenderer.invoke('storage:updateProduct', id, product),
    deleteProduct: (id: string) => ipcRenderer.invoke('storage:deleteProduct', id),
    
    getCategories: () => ipcRenderer.invoke('storage:getCategories'),
    getCategory: (id: string) => ipcRenderer.invoke('storage:getCategory', id),
    createCategory: (category: any) => ipcRenderer.invoke('storage:createCategory', category),
    updateCategory: (id: string, category: any) => ipcRenderer.invoke('storage:updateCategory', id, category),
    deleteCategory: (id: string) => ipcRenderer.invoke('storage:deleteCategory', id),
    
    getOrders: () => ipcRenderer.invoke('storage:getOrders'),
    getOrder: (id: string) => ipcRenderer.invoke('storage:getOrder', id),
    createOrder: (order: any) => ipcRenderer.invoke('storage:createOrder', order),
    updateOrder: (id: string, order: any) => ipcRenderer.invoke('storage:updateOrder', id, order),
    deleteOrder: (id: string) => ipcRenderer.invoke('storage:deleteOrder', id),
    
    getSettings: () => ipcRenderer.invoke('storage:getSettings'),
    updateSettings: (settings: any) => ipcRenderer.invoke('storage:updateSettings', settings),
    
    seedCoffeeShop: () => ipcRenderer.invoke('storage:seedCoffeeShop'),
    
    getStockMovements: () => ipcRenderer.invoke('storage:getStockMovements'),
    getStockMovement: (id: string) => ipcRenderer.invoke('storage:getStockMovement', id),
    createStockMovement: (movement: any) => ipcRenderer.invoke('storage:createStockMovement', movement),
    getStockMovementsByProduct: (productId: string) => ipcRenderer.invoke('storage:getStockMovementsByProduct', productId),
    getStockMovementsByPeriod: (period: string) => ipcRenderer.invoke('storage:getStockMovementsByPeriod', period),
    
    getInventoryReport: (period: string) => ipcRenderer.invoke('storage:getInventoryReport', period),
    setOpeningStock: (productId: string, period: string, quantity: number) => ipcRenderer.invoke('storage:setOpeningStock', productId, period, quantity),
    
    getTables: () => ipcRenderer.invoke('storage:getTables'),
    getTable: (id: string) => ipcRenderer.invoke('storage:getTable', id),
    createTable: (table: any) => ipcRenderer.invoke('storage:createTable', table),
    updateTable: (id: string, table: any) => ipcRenderer.invoke('storage:updateTable', id, table),
    deleteTable: (id: string) => ipcRenderer.invoke('storage:deleteTable', id),
    getTableByNumber: (number: string) => ipcRenderer.invoke('storage:getTableByNumber', number),
    
    getActivityLogs: () => ipcRenderer.invoke('storage:getActivityLogs'),
    getActivityLog: (id: string) => ipcRenderer.invoke('storage:getActivityLog', id),
    createActivityLog: (log: any) => ipcRenderer.invoke('storage:createActivityLog', log),
    getActivityLogsByCategory: (category: string) => ipcRenderer.invoke('storage:getActivityLogsByCategory', category),
    getActivityLogsByDateRange: (startDate: string, endDate: string) => ipcRenderer.invoke('storage:getActivityLogsByDateRange', startDate, endDate),
    getActivityLogsByUser: (userId: string) => ipcRenderer.invoke('storage:getActivityLogsByUser', userId),
    
    deleteOrdersByDateRange: (startDate: string, endDate: string) => ipcRenderer.invoke('storage:deleteOrdersByDateRange', startDate, endDate),
    deleteStockMovementsByDateRange: (startDate: string, endDate: string) => ipcRenderer.invoke('storage:deleteStockMovementsByDateRange', startDate, endDate),
    deleteActivityLogsByDateRange: (startDate: string, endDate: string) => ipcRenderer.invoke('storage:deleteActivityLogsByDateRange', startDate, endDate),
    deleteAllOrders: () => ipcRenderer.invoke('storage:deleteAllOrders'),
    deleteAllStockMovements: () => ipcRenderer.invoke('storage:deleteAllStockMovements'),
    deleteAllActivityLogs: () => ipcRenderer.invoke('storage:deleteAllActivityLogs'),
  },
});

