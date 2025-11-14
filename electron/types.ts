export type StorageType = 'local' | 'redis';

export interface User {
  id: string;
  username: string;
  email: string;
  password?: string; // Password untuk login
  role: string; // Bisa custom role atau 'admin' | 'cashier' | 'manager'
  permissions?: string[]; // Array of menu paths yang bisa diakses
  createdAt: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  image?: string;
  stock: number;
  barcode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  costingPercentage?: number; // Persentase costing (0-100), default 0
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  userId: string;
  userName: string;
  tableId?: string;
  tableNumber?: string;
  status: 'pending' | 'completed' | 'cancelled';
  paymentMethod: 'cash' | 'card' | 'debit' | 'qris' | 'digital';
  paymentReference?: string; // Reference code untuk kartu, debit, QRIS, dll
  createdAt: string;
  completedAt?: string;
}

export interface Table {
  id: string;
  number: string;
  name?: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  currentOrderId?: string;
  currentOrder?: Order;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'in' | 'out' | 'adjustment' | 'opening';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  reference?: string; // PO number, invoice, etc
  userId: string;
  userName: string;
  createdAt: string;
  notes?: string;
}

export interface InventoryReport {
  productId: string;
  productName: string;
  openingStock: number; // Stok awal bulan
  stockIn: number; // Total masuk
  stockOut: number; // Total keluar
  adjustment: number; // Adjustment
  closingStock: number; // Stok akhir
  period: string; // YYYY-MM format
}

export type ActivityCategory = 
  | 'order' 
  | 'void' 
  | 'stock' 
  | 'product' 
  | 'user' 
  | 'table' 
  | 'settings' 
  | 'inventory'
  | 'payment';

export interface ActivityLog {
  id: string;
  category: ActivityCategory;
  action: string; // 'create', 'update', 'delete', 'void', 'stock_in', 'stock_out', etc
  description: string;
  userId?: string;
  userName?: string;
  details?: {
    orderId?: string;
    orderTotal?: number;
    voidPin?: string;
    voidBy?: string;
    productId?: string;
    productName?: string;
    quantity?: number;
    tableId?: string;
    tableNumber?: string;
    paymentMethod?: string;
    stockMovement?: string;
    previousValue?: any;
    newValue?: any;
    cartTotal?: number;
    items?: Array<{
      productName: string;
      quantity: number;
      price: number;
      subtotal: number;
    }>;
    [key: string]: any;
  };
  createdAt: string;
  ipAddress?: string;
}

export interface AppSettings {
  storageType: StorageType;
  redisUrl?: string;
  redisToken?: string;
  taxRate: number;
  taxDisplayMode?: 'exclude' | 'include' | 'include_hide'; // Default: 'include_hide'
  currency: string;
  companyName: string;
  voidPin?: string;
  receiptLogo?: string; // Base64 encoded image atau path
  receiptHeader?: string; // Header text untuk receipt (bisa multi-line)
  receiptFooter?: string; // Footer text untuk receipt (bisa multi-line)
}

