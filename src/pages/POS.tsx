import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Trash2, ShoppingBag, X, CreditCard, Banknote, QrCode, Wallet, CheckCircle, Clock, AlertCircle, Users, Lock, Printer, Share2, Download, Mail, MessageCircle, Copy, FileText, Smartphone } from 'lucide-react';

export default function POS() {
  const { products, categories, cart, addToCart, removeFromCart, updateCartQuantity, clearCart, createOrder, currentUser, settings, loadProducts, storage } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'debit' | 'qris' | 'digital'>('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tables, setTables] = useState<any[]>([]);
  const [tableCarts, setTableCarts] = useState<Record<string, typeof cart>>({});
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinAction, setPinAction] = useState<(() => Promise<void>) | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  useEffect(() => {
    loadTables();
    // Load saved table carts from localStorage
    const savedCarts = localStorage.getItem('tableCarts');
    if (savedCarts) {
      try {
        setTableCarts(JSON.parse(savedCarts));
      } catch (e) {
        console.error('Failed to load table carts:', e);
      }
    }
  }, []);

  // Save cart when it changes and table is selected
  useEffect(() => {
    if (selectedTable) {
      const newTableCarts = { ...tableCarts, [selectedTable]: cart };
      setTableCarts(newTableCarts);
      localStorage.setItem('tableCarts', JSON.stringify(newTableCarts));
    }
  }, [cart, selectedTable]);

  // Load cart when table changes
  useEffect(() => {
    if (!selectedTable) {
      clearCart();
      return;
    }

    // Update table status to occupied when selected (if not already)
    const currentTable = tables.find((t) => t.id === selectedTable);
    if (currentTable && currentTable.status === 'available' && storage) {
      storage.updateTable(selectedTable, { status: 'occupied' }).then(() => {
        loadTables();
      }).catch((error) => {
        console.error('Failed to update table status:', error);
      });
    }

    // Load cart for selected table
    const tableCart = tableCarts[selectedTable] || [];
    if (tableCart.length > 0) {
      // Clear current cart first
      clearCart();
      // Then add items from table cart after a short delay
      const timer = setTimeout(() => {
        tableCart.forEach((item) => {
          const product = products.find((p) => p.id === item.productId);
          if (product) {
            // Add all quantity at once
            addToCart(product, item.quantity);
          }
        });
      }, 50);
      return () => clearTimeout(timer);
    } else {
      clearCart();
    }
  }, [selectedTable, tables]);

  const loadTables = async () => {
    try {
      if (storage) {
        const data = await storage.getTables();
        setTables(data);
      }
    } catch (error) {
      console.error('Failed to load tables:', error);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && p.stock > 0;
  });

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxRate = settings.taxRate || 0.1;
  const taxDisplayMode = settings.taxDisplayMode || 'include_hide';
  
  // Calculate tax based on display mode
  let subtotal: number;
  let tax: number;
  let finalTotal: number;
  
  if (taxDisplayMode === 'exclude') {
    // Exclude: tax is added to subtotal
    subtotal = cartTotal;
    tax = cartTotal * taxRate;
    finalTotal = subtotal + tax;
  } else if (taxDisplayMode === 'include') {
    // Include: subtotal already includes tax, but show tax in receipt
    // If cartTotal is 100000 and tax is 10%, then:
    // subtotal = 100000 / 1.1 = 90909.09
    // tax = 100000 - 90909.09 = 9090.91
    finalTotal = cartTotal;
    subtotal = finalTotal / (1 + taxRate);
    tax = finalTotal - subtotal;
  } else {
    // Include Hide: harga sudah termasuk pajak, subtotal = total
    // Tax dihitung untuk laporan saja (tidak ditampilkan)
    finalTotal = cartTotal;
    subtotal = cartTotal; // Subtotal sama dengan total
    tax = cartTotal * (taxRate / (1 + taxRate)); // Tax untuk laporan: 70000 * (0.1/1.1) = 6363.64
  }

  const handleCheckout = async () => {
    if (cart.length === 0 || !currentUser) return;

    const orderItems = cart.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.price * item.quantity,
    }));

    const selectedTableData = tables.find((t) => t.id === selectedTable);
    const order = {
      items: orderItems,
      subtotal: subtotal,
      tax,
      discount: 0,
      total: finalTotal,
      userId: currentUser.id,
      userName: currentUser.username,
      tableId: selectedTable || undefined,
      tableNumber: selectedTableData?.number || undefined,
      status: 'completed' as const,
      paymentMethod,
      paymentReference: paymentMethod !== 'cash' ? paymentReference : undefined,
    };

    try {
      const createdOrder = await createOrder(order);
      
      // Log order activity
      if (storage && currentUser) {
        await storage.createActivityLog({
          category: 'order',
          action: 'create',
          description: `Order baru - ${selectedTableData?.number ? `Meja ${selectedTableData.number}` : 'Tanpa meja'}`,
          userId: currentUser.id,
          userName: currentUser.username,
          details: {
            orderId: createdOrder.id,
            orderTotal: finalTotal,
            tableId: selectedTable,
            tableNumber: selectedTableData?.number,
            paymentMethod,
            paymentReference: paymentMethod !== 'cash' ? paymentReference : undefined,
            items: orderItems.map(item => ({
              productName: item.productName,
              quantity: item.quantity,
              price: item.price,
              subtotal: item.subtotal,
            })),
          },
        });
      }
      
      // Create stock out movements for each item
      if (storage) {
        for (const item of orderItems) {
          const product = products.find((p) => p.id === item.productId);
          if (product) {
            try {
              await storage.createStockMovement({
                productId: item.productId,
                productName: item.productName,
                type: 'out',
                quantity: item.quantity,
                previousStock: product.stock,
                newStock: product.stock - item.quantity,
                reason: 'Penjualan',
                userId: currentUser.id,
                userName: currentUser.username,
                notes: `Order #${createdOrder.id}`,
              });
              
              // Log stock out from order
              if (storage) {
                await storage.createActivityLog({
                  category: 'stock',
                  action: 'stock_out',
                  description: `Stock keluar dari order: ${item.productName} (-${item.quantity})`,
                  userId: currentUser.id,
                  userName: currentUser.username,
                  details: {
                    productId: item.productId,
                    productName: item.productName,
                    quantity: item.quantity,
                    orderId: createdOrder.id,
                    previousStock: product.stock,
                    newStock: product.stock - item.quantity,
                    reason: 'Penjualan',
                  },
                });
              }
            } catch (movementError) {
              console.error('Failed to create stock movement:', movementError);
            }
          }
        }
        // Reload products to get updated stock
        await loadProducts();
      }

      // Update table status if table is selected
      if (selectedTable && storage) {
        try {
          await storage.updateTable(selectedTable, { status: 'occupied' });
          await loadTables();
        } catch (error) {
          console.error('Failed to update table status:', error);
        }
      }
      
      // Show receipt modal
      setLastOrder({
        ...createdOrder,
        items: orderItems,
        paymentReference: paymentMethod !== 'cash' ? paymentReference : undefined,
      });
      setShowPaymentModal(false);
      setShowReceiptModal(true);
      
      // Clear cart and remove from table carts
      if (selectedTable) {
        const newTableCarts = { ...tableCarts };
        delete newTableCarts[selectedTable];
        setTableCarts(newTableCarts);
        localStorage.setItem('tableCarts', JSON.stringify(newTableCarts));
      }
      clearCart();
      setPaymentReference(''); // Reset payment reference
      
      // Update table status to available after payment
      if (selectedTable && storage) {
        try {
          await storage.updateTable(selectedTable, { status: 'available' });
          await loadTables();
        } catch (error) {
          console.error('Failed to update table status:', error);
        }
      }
      
      setSelectedTable('');
      alert('Pesanan berhasil dibuat!');
    } catch (error) {
      console.error('Failed to create order:', error);
      alert('Gagal membuat pesanan');
    }
  };

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
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
          Point of Sale
        </h1>
        <p style={{ color: '#a0a0b0', fontSize: '16px' }}>Sistem kasir modern</p>
      </div>

      {/* Table Selection */}
      {tables.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '16px' }}>
            <div style={{ flex: 1, minWidth: '250px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#a0a0b0' }}>
                Pilih Meja
              </label>
              <select
                className="input"
                value={selectedTable}
                onChange={(e) => {
                  const newTableId = e.target.value;
                  // Save current table's cart before switching
                  if (selectedTable && cart.length > 0) {
                    const newTableCarts = { ...tableCarts, [selectedTable]: cart };
                    setTableCarts(newTableCarts);
                    localStorage.setItem('tableCarts', JSON.stringify(newTableCarts));
                  }
                  setSelectedTable(newTableId);
                }}
                style={{ width: '100%' }}
              >
                <option value="">Tanpa Meja</option>
                {tables.map((table) => {
                  const hasCart = tableCarts[table.id] && tableCarts[table.id].length > 0;
                  return (
                    <option key={table.id} value={table.id}>
                      Meja {table.number} {table.status === 'occupied' ? '(Terisi)' : ''} {hasCart ? '📋' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
            {selectedTable && (
              <>
                <button
                  className="btn btn-secondary"
                onClick={() => {
                  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
                  setPinAction(() => async () => {
                    const newTableCarts = { ...tableCarts };
                    delete newTableCarts[selectedTable];
                    setTableCarts(newTableCarts);
                    localStorage.setItem('tableCarts', JSON.stringify(newTableCarts));
                    clearCart();
                    
                    // Log void activity
                    if (storage && currentUser) {
                      const selectedTableData = tables.find((t) => t.id === selectedTable);
                      await storage.createActivityLog({
                        category: 'void',
                        action: 'clear_cart',
                        description: `Void clear cart meja ${selectedTableData?.number || selectedTable}`,
                        userId: currentUser.id,
                        userName: currentUser.username,
                        details: {
                          tableId: selectedTable,
                          tableNumber: selectedTableData?.number,
                          voidPin: settings.voidPin || '',
                          voidBy: currentUser.username,
                          cartTotal: cartTotal,
                          items: cart.map(item => ({
                            productName: item.productName,
                            quantity: item.quantity,
                            price: item.price,
                            subtotal: item.price * item.quantity,
                          })),
                        },
                      });
                    }
                  });
                  setShowPinModal(true);
                }}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  Clear Cart Meja
                </button>
              </>
            )}
          </div>

          {/* Table Status Display & Edit */}
          {selectedTable && (() => {
            const currentTable = tables.find((t) => t.id === selectedTable);
            if (!currentTable) return null;

            const getStatusInfo = (status: string) => {
              switch (status) {
                case 'available':
                  return { label: 'Tersedia', color: '#00ff88', bg: 'rgba(0, 255, 136, 0.2)', icon: CheckCircle };
                case 'occupied':
                  return { label: 'Terisi', color: '#ff6b6b', bg: 'rgba(255, 107, 107, 0.2)', icon: Users };
                case 'reserved':
                  return { label: 'Dipesan', color: '#ffe66d', bg: 'rgba(255, 230, 109, 0.2)', icon: Clock };
                case 'cleaning':
                  return { label: 'Bersih-bersih', color: '#00d4ff', bg: 'rgba(0, 212, 255, 0.2)', icon: AlertCircle };
                default:
                  return { label: status, color: '#a0a0b0', bg: 'rgba(160, 160, 176, 0.2)', icon: AlertCircle };
              }
            };

            const statusInfo = getStatusInfo(currentTable.status);
            const Icon = statusInfo.icon;

            return (
              <div
                className="card"
                style={{
                  padding: '16px',
                  background: statusInfo.bg,
                  border: `2px solid ${statusInfo.color}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Icon size={24} color={statusInfo.color} />
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: statusInfo.color, marginBottom: '4px' }}>
                      Meja {currentTable.number} {currentTable.name && `- ${currentTable.name}`}
                    </div>
                    <div style={{ fontSize: '14px', color: '#a0a0b0' }}>
                      Kapasitas: {currentTable.capacity} kursi
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', color: '#a0a0b0', marginRight: '8px' }}>Status:</span>
                    <select
                      className="input"
                      value={currentTable.status}
                      onChange={async (e) => {
                        const newStatus = e.target.value as 'available' | 'occupied' | 'reserved' | 'cleaning';
                        try {
                          if (storage) {
                            await storage.updateTable(selectedTable, { status: newStatus });
                            await loadTables();
                          }
                        } catch (error) {
                          console.error('Failed to update table status:', error);
                          alert('Gagal update status meja');
                        }
                      }}
                      style={{
                        background: 'var(--bg-primary)',
                        border: `1px solid ${statusInfo.color}`,
                        color: statusInfo.color,
                        fontWeight: 600,
                        minWidth: '150px',
                      }}
                    >
                      <option value="available">Tersedia</option>
                      <option value="occupied">Terisi</option>
                      <option value="reserved">Dipesan</option>
                      <option value="cleaning">Bersih-bersih</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isDesktop ? '1fr 400px' : '1fr',
          gap: '24px',
        }}
      >
        {/* Products Section */}
        <div>
          {/* Search & Category Filter */}
          <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="input"
              placeholder="Cari produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, minWidth: '200px' }}
            />
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                className={`btn ${selectedCategory === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedCategory('all')}
                style={{ fontSize: '13px', padding: '8px 16px' }}
              >
                Semua
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`btn ${selectedCategory === cat.id ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{ fontSize: '13px', padding: '8px 16px' }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '16px',
            }}
          >
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="card"
                style={{
                  cursor: 'pointer',
                  textAlign: 'center',
                  padding: '20px',
                }}
                onClick={() => addToCart(product)}
              >
                <div
                  style={{
                    width: '100%',
                    height: '120px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '48px',
                  }}
                >
                  {product.image ? (
                    <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                  ) : (
                    <span>🍽️</span>
                  )}
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                  {product.name}
                </h3>
                <p style={{ color: '#00ff88', fontSize: '18px', fontWeight: 700 }}>
                  Rp {product.price.toLocaleString('id-ID')}
                </p>
                {product.stock < 10 && (
                  <p style={{ color: '#ffe66d', fontSize: '12px', marginTop: '4px' }}>
                    Stok: {product.stock}
                  </p>
                )}
              </motion.div>
            ))}
            {filteredProducts.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: '#606070' }}>
                Tidak ada produk ditemukan
              </div>
            )}
          </div>
        </div>

        {/* Cart Section */}
        <div
          className="card"
          style={{
            position: isDesktop ? 'sticky' : 'relative',
            top: isDesktop ? '32px' : 'auto',
            height: isDesktop ? 'calc(100vh - 64px)' : 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <ShoppingBag size={24} color="#00ff88" />
            <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Keranjang</h2>
            {cart.length > 0 && (
              <button
                className="btn btn-secondary"
                onClick={() => {
                  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
                  setPinAction(() => async () => {
                    clearCart();
                    
                    // Log void activity
                    if (storage && currentUser) {
                      await storage.createActivityLog({
                        category: 'void',
                        action: 'clear_cart',
                        description: 'Void clear cart',
                        userId: currentUser.id,
                        userName: currentUser.username,
                        details: {
                          voidPin: settings.voidPin || '',
                          voidBy: currentUser.username,
                          cartTotal: cartTotal,
                          items: cart.map(item => ({
                            productName: item.productName,
                            quantity: item.quantity,
                            price: item.price,
                            subtotal: item.price * item.quantity,
                          })),
                        },
                      });
                    }
                  });
                  setShowPinModal(true);
                }}
                style={{ marginLeft: 'auto', padding: '6px 12px', fontSize: '12px' }}
              >
                <Trash2 size={14} />
                Hapus
              </button>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '24px' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#606070' }}>
                <ShoppingBag size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                <p>Keranjang kosong</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {cart.map((item) => {
                  const product = products.find((p) => p.id === item.productId);
                  return (
                    <div
                      key={item.productId}
                      style={{
                        padding: '16px',
                        background: 'var(--bg-tertiary)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontWeight: 600, marginBottom: '4px' }}>{item.productName}</h4>
                          <p style={{ color: '#00ff88', fontSize: '16px', fontWeight: 600 }}>
                            Rp {item.price.toLocaleString('id-ID')}
                          </p>
                        </div>
                        <button
                          className="btn btn-secondary"
                          onClick={() => {
                            const itemTotal = item.price * item.quantity;
                            setPinAction(() => async () => {
                              removeFromCart(item.productId);
                              
                              // Log void per item activity
                              if (storage && currentUser) {
                                const selectedTableData = tables.find((t) => t.id === selectedTable);
                                await storage.createActivityLog({
                                  category: 'void',
                                  action: 'void_item',
                                  description: `Void item: ${item.productName}`,
                                  userId: currentUser.id,
                                  userName: currentUser.username,
                                  details: {
                                    productId: item.productId,
                                    productName: item.productName,
                                    quantity: item.quantity,
                                    price: item.price,
                                    subtotal: itemTotal,
                                    voidPin: settings.voidPin || '',
                                    voidBy: currentUser.username,
                                    tableId: selectedTable,
                                    tableNumber: selectedTableData?.number,
                                  },
                                });
                              }
                            });
                            setShowPinModal(true);
                          }}
                          style={{ padding: '4px 8px', minWidth: 'auto' }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button
                          className="btn btn-secondary"
                          onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                          style={{ padding: '6px', minWidth: 'auto' }}
                        >
                          <Minus size={16} />
                        </button>
                        <span style={{ flex: 1, textAlign: 'center', fontWeight: 600, fontSize: '18px' }}>
                          {item.quantity}
                        </span>
                        <button
                          className="btn btn-secondary"
                          onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                          disabled={product && item.quantity >= product.stock}
                          style={{ padding: '6px', minWidth: 'auto' }}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <p style={{ textAlign: 'right', marginTop: '8px', fontWeight: 600, color: '#00ff88' }}>
                        Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#a0a0b0' }}>Subtotal</span>
                <span style={{ fontWeight: 600 }}>Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              {taxDisplayMode !== 'include_hide' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#a0a0b0' }}>Pajak ({((settings.taxRate || 0.1) * 100).toFixed(0)}%)</span>
                  <span style={{ fontWeight: 600 }}>Rp {tax.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border-color)',
                  marginTop: '16px',
                }}
              >
                <span style={{ fontSize: '20px', fontWeight: 700 }}>Total</span>
                <span style={{ fontSize: '24px', fontWeight: 800, color: '#00ff88' }}>
                  Rp {finalTotal.toLocaleString('id-ID')}
                </span>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => setShowPaymentModal(true)}
                style={{ width: '100%', marginTop: '20px', padding: '16px', fontSize: '16px', fontWeight: 700 }}
              >
                Checkout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px',
              overflowY: 'auto',
            }}
            onClick={() => setShowPaymentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card"
              style={{ maxWidth: '500px', width: '100%', maxHeight: '85vh', overflowY: 'auto', marginTop: '20px', marginBottom: '20px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>Metode Pembayaran</h2>
              
              {/* Payment Reference Input - hanya untuk non-cash */}
              {paymentMethod !== 'cash' && (
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                    Reference Code / No. Transaksi
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder={`Masukkan ref code ${paymentMethod === 'card' ? 'kartu' : paymentMethod === 'debit' ? 'debit' : paymentMethod === 'qris' ? 'QRIS' : 'digital wallet'}`}
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    style={{ width: '100%' }}
                    autoFocus
                  />
                  <p style={{ color: '#a0a0b0', fontSize: '12px', marginTop: '4px' }}>
                    Masukkan nomor referensi transaksi dari mesin EDC/QRIS
                  </p>
                </div>
              )}
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                <button
                  className={`btn ${paymentMethod === 'cash' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => {
                    setPaymentMethod('cash');
                    setPaymentReference('');
                  }}
                  style={{ justifyContent: 'flex-start' }}
                >
                  <Banknote size={20} />
                  Tunai
                </button>
                <button
                  className={`btn ${paymentMethod === 'card' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => {
                    setPaymentMethod('card');
                    setPaymentReference('');
                  }}
                  style={{ justifyContent: 'flex-start' }}
                >
                  <CreditCard size={20} />
                  Kartu Kredit
                </button>
                <button
                  className={`btn ${paymentMethod === 'debit' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => {
                    setPaymentMethod('debit');
                    setPaymentReference('');
                  }}
                  style={{ justifyContent: 'flex-start' }}
                >
                  <Wallet size={20} />
                  Debit
                </button>
                <button
                  className={`btn ${paymentMethod === 'qris' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => {
                    setPaymentMethod('qris');
                    setPaymentReference('');
                  }}
                  style={{ justifyContent: 'flex-start' }}
                >
                  <QrCode size={20} />
                  QRIS
                </button>
                <button
                  className={`btn ${paymentMethod === 'digital' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => {
                    setPaymentMethod('digital');
                    setPaymentReference('');
                  }}
                  style={{ justifyContent: 'flex-start' }}
                >
                  <CreditCard size={20} />
                  Digital Wallet
                </button>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowPaymentModal(false)}
                  style={{ flex: 1 }}
                >
                  Batal
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleCheckout}
                  style={{ flex: 1 }}
                  disabled={paymentMethod !== 'cash' && !paymentReference.trim()}
                >
                  Bayar Rp {finalTotal.toLocaleString('id-ID')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PIN Void Modal */}
      <AnimatePresence>
        {showPinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px',
              overflowY: 'auto',
            }}
            onClick={() => {
              setShowPinModal(false);
              setPinInput('');
              setPinAction(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card"
              style={{ maxWidth: '400px', width: '100%', maxHeight: '85vh', overflowY: 'auto', marginTop: '20px', marginBottom: '20px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Lock size={24} color="#ff6b6b" />
                  <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Konfirmasi PIN Void</h2>
                </div>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowPinModal(false);
                    setPinInput('');
                    setPinAction(null);
                  }}
                  style={{ padding: '8px', minWidth: 'auto' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                  Masukkan PIN Void
                </label>
                <input
                  type="password"
                  className="input"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="PIN Void"
                  maxLength={6}
                  autoFocus
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter') {
                      const voidPin = settings.voidPin || '';
                      if (!voidPin) {
                        alert('PIN Void belum diatur di Settings');
                        return;
                      }
                      if (pinInput === voidPin) {
                        if (pinAction) {
                          await pinAction();
                        }
                        setShowPinModal(false);
                        setPinInput('');
                        setPinAction(null);
                      } else {
                        alert('PIN salah!');
                        setPinInput('');
                      }
                    }
                  }}
                  style={{ width: '100%', fontSize: '18px', textAlign: 'center', letterSpacing: '8px' }}
                />
                <p style={{ color: '#a0a0b0', fontSize: '12px', marginTop: '8px', textAlign: 'center' }}>
                  Tekan Enter untuk konfirmasi
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowPinModal(false);
                    setPinInput('');
                    setPinAction(null);
                  }}
                  style={{ flex: 1 }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    const voidPin = settings.voidPin || '';
                    if (!voidPin) {
                      alert('PIN Void belum diatur di Settings');
                      return;
                    }
                    if (pinInput === voidPin) {
                      if (pinAction) {
                        pinAction();
                      }
                      setShowPinModal(false);
                      setPinInput('');
                      setPinAction(null);
                    } else {
                      alert('PIN salah!');
                      setPinInput('');
                    }
                  }}
                  style={{ flex: 1 }}
                >
                  <Lock size={18} />
                  Konfirmasi
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Receipt Modal */}
      <AnimatePresence>
        {showReceiptModal && lastOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px',
              overflowY: 'auto',
            }}
            onClick={() => setShowReceiptModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card"
              style={{ maxWidth: '400px', width: '100%', maxHeight: '85vh', overflowY: 'auto', marginTop: '20px', marginBottom: '20px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Struk Pembayaran</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      const receiptContent = generateReceiptContent(lastOrder, settings);
                      const blob = new Blob([receiptContent], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `struk-${lastOrder.id}-${new Date().toISOString().split('T')[0]}.txt`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    style={{ padding: '8px', minWidth: 'auto' }}
                    title="Download"
                  >
                    <Download size={18} />
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={async () => {
                      // Generate plain text receipt (printer-friendly, no ESC/POS commands)
                      const receiptContent = generateReceiptContent(lastOrder, settings);
                      // Use Web Share API - Android native share sheet with file
                      if (navigator.share && navigator.canShare) {
                        try {
                          // Create file for sharing - plain text format
                          const blob = new Blob([receiptContent], { type: 'text/plain' });
                          const file = new File([blob], `struk-${lastOrder.id}.txt`, { type: 'text/plain' });
                          
                          // Check if can share file
                          if (navigator.canShare({ files: [file] })) {
                            // Share as file - Android will show native share sheet with file
                            // Printer thermal apps will appear in the share sheet
                            await navigator.share({
                              title: 'Struk Pembayaran',
                              text: 'Struk untuk printer thermal',
                              files: [file],
                            });
                          } else {
                            // Fallback to text share if file sharing not supported
                            await navigator.share({
                              title: 'Struk Pembayaran',
                              text: receiptContent,
                            });
                          }
                        } catch (error: any) {
                          // User cancelled share (error.name === 'AbortError') - do nothing
                          if (error.name !== 'AbortError') {
                            console.error('Share failed:', error);
                            // If share failed, try text only
                            try {
                              await navigator.share({
                                title: 'Struk Pembayaran',
                                text: receiptContent,
                              });
                            } catch (textError: any) {
                              if (textError.name !== 'AbortError') {
                                // Fallback: open share modal
                                setShowShareModal(true);
                              }
                            }
                          }
                        }
                      } else if (navigator.share) {
                        // navigator.share available but canShare not available - try text share
                        try {
                          await navigator.share({
                            title: 'Struk Pembayaran',
                            text: receiptContent,
                          });
                        } catch (error: any) {
                          if (error.name !== 'AbortError') {
                            // Fallback: open share modal
                            setShowShareModal(true);
                          }
                        }
                      } else {
                        // Fallback: open share modal if Web Share API not available
                        setShowShareModal(true);
                      }
                    }}
                    style={{ padding: '8px', minWidth: 'auto' }}
                    title="Share ke Printer"
                  >
                    <Share2 size={18} />
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={async () => {
                      // Try Bluetooth printer first (Android)
                      if ('bluetooth' in navigator) {
                        try {
                          await printToBluetoothPrinter(lastOrder, settings);
                          return;
                        } catch (error: any) {
                          console.log('Bluetooth print failed, trying fallback:', error);
                          // Continue to fallback
                        }
                      }
                      
                      // Fallback: Check if print is available (may not work on mobile)
                      if (typeof window.print === 'function') {
                        try {
                          window.print();
                        } catch (e) {
                          // Fallback: download as PDF text format
                          const pdfContent = generatePDFContent(lastOrder, settings);
                          const blob = new Blob([pdfContent], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `struk-${lastOrder.id}.pdf`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        }
                      } else {
                        // Fallback for Android: download as PDF text format
                        const pdfContent = generatePDFContent(lastOrder, settings);
                        const blob = new Blob([pdfContent], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `struk-${lastOrder.id}.pdf`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }
                    }}
                    style={{ padding: '8px', minWidth: 'auto' }}
                    title="Print ke Bluetooth Printer"
                  >
                    <Printer size={18} />
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowReceiptModal(false)}
                    style={{ padding: '8px', minWidth: 'auto' }}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Receipt Content */}
              <div
                id="receipt-content"
                style={{
                  background: '#fff',
                  color: '#000',
                  padding: '24px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  lineHeight: '1.6',
                }}
              >
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  {settings.receiptLogo && (
                    <img
                      src={settings.receiptLogo}
                      alt="Logo"
                      style={{
                        maxWidth: '150px',
                        maxHeight: '80px',
                        objectFit: 'contain',
                        marginBottom: '12px',
                      }}
                    />
                  )}
                  {settings.receiptHeader && (
                    <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px', whiteSpace: 'pre-line', lineHeight: '1.4' }}>
                      {settings.receiptHeader}
                    </div>
                  )}
                  <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
                    {settings.companyName || 'Noxtiz Culinary Lab'}
                  </h3>
                  <p style={{ fontSize: '11px', color: '#666' }}>
                    {new Date().toLocaleString('id-ID')}
                  </p>
                </div>
                
                <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '12px 0', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Order ID:</span>
                    <span>{lastOrder.id}</span>
                  </div>
                  {lastOrder.tableNumber && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span>Meja:</span>
                      <span>{lastOrder.tableNumber}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Kasir:</span>
                    <span>{lastOrder.userName}</span>
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ borderBottom: '1px solid #000', paddingBottom: '4px', marginBottom: '8px', fontWeight: 700 }}>
                    ITEM
                  </div>
                  {lastOrder.items.map((item: any, idx: number) => (
                    <div key={idx} style={{ marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 600 }}>{item.productName}</span>
                        <span>Rp {item.price.toLocaleString('id-ID')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#666' }}>
                        <span>{item.quantity} x</span>
                        <span>Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '1px dashed #000', paddingTop: '12px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Subtotal:</span>
                    <span>Rp {lastOrder.subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  {(settings.taxDisplayMode || 'include_hide') !== 'include_hide' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span>Pajak ({((settings.taxRate || 0.1) * 100).toFixed(0)}%):</span>
                      <span>Rp {lastOrder.tax.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  {lastOrder.discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span>Diskon:</span>
                      <span>- Rp {lastOrder.discount.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #000', fontWeight: 700, fontSize: '14px' }}>
                    <span>TOTAL:</span>
                    <span>Rp {lastOrder.total.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div style={{ borderTop: '1px dashed #000', paddingTop: '12px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Metode:</span>
                    <span>
                      {lastOrder.paymentMethod === 'cash' && 'Tunai'}
                      {lastOrder.paymentMethod === 'card' && 'Kartu Kredit'}
                      {lastOrder.paymentMethod === 'debit' && 'Debit'}
                      {lastOrder.paymentMethod === 'qris' && 'QRIS'}
                      {lastOrder.paymentMethod === 'digital' && 'Digital Wallet'}
                    </span>
                  </div>
                  {lastOrder.paymentReference && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px' }}>
                      <span>Ref Code:</span>
                      <span>{lastOrder.paymentReference}</span>
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #000' }}>
                  {settings.receiptFooter ? (
                    <div style={{ fontSize: '11px', color: '#666', whiteSpace: 'pre-line', lineHeight: '1.4' }}>
                      {settings.receiptFooter}
                    </div>
                  ) : (
                    <>
                      <p style={{ fontSize: '11px', color: '#666' }}>Terima kasih atas kunjungan Anda!</p>
                      <p style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
                        {lastOrder.id}
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowReceiptModal(false)}
                  style={{ flex: 1 }}
                >
                  Tutup
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    const receiptContent = generateReceiptContent(lastOrder, settings);
                    const blob = new Blob([receiptContent], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `struk-${lastOrder.id}-${new Date().toISOString().split('T')[0]}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  style={{ flex: 1 }}
                >
                  <Download size={18} />
                  Simpan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && lastOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              zIndex: 1001,
              padding: '20px',
              overflowY: 'auto',
            }}
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card"
              style={{ maxWidth: '500px', width: '100%', maxHeight: '85vh', overflowY: 'auto', marginTop: '20px', marginBottom: '20px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Bagikan Struk</h2>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowShareModal(false)}
                  style={{ padding: '8px', minWidth: 'auto' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  className="btn btn-secondary"
                  onClick={async () => {
                    try {
                      const receiptContent = generateReceiptContent(lastOrder, settings);
                      await navigator.clipboard.writeText(receiptContent);
                      alert('Struk disalin ke clipboard!');
                      setShowShareModal(false);
                    } catch (error) {
                      alert('Gagal menyalin ke clipboard');
                    }
                  }}
                  style={{ justifyContent: 'flex-start', padding: '16px' }}
                >
                  <Copy size={20} />
                  Salin ke Clipboard
                </button>

                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    const receiptContent = generateReceiptContent(lastOrder, settings);
                    const blob = new Blob([receiptContent], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `struk-${lastOrder.id}-${new Date().toISOString().split('T')[0]}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    setShowShareModal(false);
                  }}
                  style={{ justifyContent: 'flex-start', padding: '16px' }}
                >
                  <Download size={20} />
                  Simpan sebagai File
                </button>

                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    const receiptContent = generateReceiptContent(lastOrder, settings);
                    const mailtoLink = `mailto:?subject=Struk Pembayaran ${lastOrder.id}&body=${encodeURIComponent(receiptContent)}`;
                    window.open(mailtoLink);
                    setShowShareModal(false);
                  }}
                  style={{ justifyContent: 'flex-start', padding: '16px' }}
                >
                  <Mail size={20} />
                  Kirim via Email
                </button>

                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    const receiptContent = generateReceiptContent(lastOrder, settings);
                    const whatsappText = encodeURIComponent(`Struk Pembayaran\n\n${receiptContent}`);
                    window.open(`https://wa.me/?text=${whatsappText}`, '_blank');
                    setShowShareModal(false);
                  }}
                  style={{ justifyContent: 'flex-start', padding: '16px' }}
                >
                  <MessageCircle size={20} />
                  Share via WhatsApp
                </button>

                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    const receiptContent = generateReceiptContent(lastOrder, settings);
                    const telegramText = encodeURIComponent(`Struk Pembayaran\n\n${receiptContent}`);
                    window.open(`https://t.me/share/url?url=&text=${telegramText}`, '_blank');
                    setShowShareModal(false);
                  }}
                  style={{ justifyContent: 'flex-start', padding: '16px' }}
                >
                  <MessageCircle size={20} />
                  Share via Telegram
                </button>

                {navigator.share && (
                  <button
                    className="btn btn-secondary"
                    onClick={async () => {
                      try {
                        const receiptContent = generateReceiptContent(lastOrder, settings);
                        // Share as text - Android will show native share sheet
                        await navigator.share({
                          title: 'Struk Pembayaran',
                          text: receiptContent,
                        });
                        setShowShareModal(false);
                      } catch (error: any) {
                        // User cancelled or share failed
                        if (error.name !== 'AbortError') {
                          console.error('Share failed:', error);
                        }
                        // Don't close modal if user cancelled
                        if (error.name === 'AbortError') {
                          // User cancelled - keep modal open
                        } else {
                          // Share failed - keep modal open for other options
                        }
                      }
                    }}
                    style={{ justifyContent: 'flex-start', padding: '16px' }}
                  >
                    <Share2 size={20} />
                    Share via System (Native Android/iOS)
                  </button>
                )}

                <div style={{ borderTop: '1px solid var(--border-color)', margin: '16px 0', paddingTop: '16px' }}>
                  <p style={{ fontSize: '12px', color: '#a0a0b0', marginBottom: '12px' }}>Format Khusus Printer:</p>
                  
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      const receiptContent = generateReceiptContentPOS80(lastOrder, settings);
                      const blob = new Blob([receiptContent], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `struk-pos80-${lastOrder.id}.txt`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      setShowShareModal(false);
                    }}
                    style={{ justifyContent: 'flex-start', padding: '16px', marginBottom: '8px' }}
                  >
                    <Printer size={20} />
                    Simpan Format POS80 (Thermal)
                  </button>

                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      // Create PDF-like text format
                      const pdfContent = generatePDFContent(lastOrder, settings);
                      const blob = new Blob([pdfContent], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `struk-${lastOrder.id}.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      setShowShareModal(false);
                    }}
                    style={{ justifyContent: 'flex-start', padding: '16px' }}
                  >
                    <FileText size={20} />
                    Simpan sebagai PDF (Text Format)
                  </button>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', margin: '16px 0', paddingTop: '16px' }}>
                  <p style={{ fontSize: '12px', color: '#a0a0b0', marginBottom: '12px' }}>Buka dengan Aplikasi:</p>
                  
                  <button
                    className="btn btn-primary"
                    onClick={async () => {
                      const receiptContent = generateReceiptContent(lastOrder, settings);
                      const blob = new Blob([receiptContent], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      const fileName = `struk-${lastOrder.id}-${Date.now()}.txt`;
                      a.download = fileName;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      
                      // For Android/Web: File already downloaded via blob
                      // Electron-specific code removed for Android compatibility
                      setShowShareModal(false);
                    }}
                    style={{ justifyContent: 'flex-start', padding: '16px', width: '100%' }}
                  >
                    <Smartphone size={20} />
                    Simpan & Buka dengan Aplikasi Lain
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper function to generate receipt content
function generateReceiptContent(order: any, settings: any) {
  const lines: string[] = [];
  lines.push('='.repeat(40));
  if (settings.receiptHeader) {
    const headerLines = settings.receiptHeader.split('\n').filter((line: string) => line.trim());
    headerLines.forEach((line: string) => {
      lines.push(line.trim());
    });
    lines.push('='.repeat(40));
  }
  lines.push(settings.companyName || 'Noxtiz Culinary Lab');
  lines.push('='.repeat(40));
  lines.push(new Date().toLocaleString('id-ID'));
  lines.push('');
  lines.push('-'.repeat(40));
  lines.push(`Order ID: ${order.id}`);
  if (order.tableNumber) {
    lines.push(`Meja: ${order.tableNumber}`);
  }
  lines.push(`Kasir: ${order.userName}`);
  lines.push('-'.repeat(40));
  lines.push('');
  lines.push('ITEM');
  lines.push('-'.repeat(40));
  order.items.forEach((item: any) => {
    lines.push(`${item.productName}`);
    lines.push(`  ${item.quantity} x Rp ${item.price.toLocaleString('id-ID')} = Rp ${(item.price * item.quantity).toLocaleString('id-ID')}`);
  });
  lines.push('');
  lines.push('-'.repeat(40));
  lines.push(`Subtotal:        Rp ${order.subtotal.toLocaleString('id-ID')}`);
  const taxDisplayMode = settings.taxDisplayMode || 'include_hide';
  if (taxDisplayMode !== 'include_hide') {
    lines.push(`Pajak (${((settings.taxRate || 0.1) * 100).toFixed(0)}%):     Rp ${order.tax.toLocaleString('id-ID')}`);
  }
  if (order.discount > 0) {
    lines.push(`Diskon:          - Rp ${order.discount.toLocaleString('id-ID')}`);
  }
  lines.push('='.repeat(40));
  lines.push(`TOTAL:           Rp ${order.total.toLocaleString('id-ID')}`);
  lines.push('='.repeat(40));
  lines.push('');
  lines.push(`Metode: ${order.paymentMethod === 'cash' ? 'Tunai' : order.paymentMethod === 'card' ? 'Kartu Kredit' : order.paymentMethod === 'debit' ? 'Debit' : order.paymentMethod === 'qris' ? 'QRIS' : 'Digital Wallet'}`);
  if (order.paymentReference) {
    lines.push(`Ref Code: ${order.paymentReference}`);
  }
  lines.push('');
  lines.push('='.repeat(40));
  if (settings.receiptFooter) {
    const footerLines = settings.receiptFooter.split('\n').filter((line: string) => line.trim());
    footerLines.forEach((line: string) => {
      lines.push(line.trim());
    });
  } else {
    lines.push('Terima kasih atas kunjungan Anda!');
  }
  lines.push('='.repeat(40));
  return lines.join('\n');
}

// Generate receipt content in POS80/Thermal printer format
function generateReceiptContentPOS80(order: any, settings: any) {
  const lines: string[] = [];
  // ESC/POS commands for thermal printer
  const ESC = '\x1B';
  const GS = '\x1D';
  
  // Initialize printer
  lines.push(ESC + '@'); // Initialize
  lines.push(ESC + 'a' + '\x01'); // Center align
  
  // Header
  if (settings.receiptHeader) {
    const headerLines = settings.receiptHeader.split('\n').filter((line: string) => line.trim());
    headerLines.forEach((line: string) => {
      lines.push(ESC + '!' + '\x00'); // Normal
      lines.push(line.trim());
    });
    lines.push('-'.repeat(32));
  }
  lines.push(ESC + '!' + '\x08'); // Double height
  lines.push(settings.companyName || 'Noxtiz Culinary Lab');
  lines.push(ESC + '!' + '\x00'); // Normal
  lines.push('-'.repeat(32));
  lines.push(new Date().toLocaleString('id-ID'));
  lines.push('');
  
  // Order info
  lines.push(ESC + 'a' + '\x00'); // Left align
  lines.push(`Order: ${order.id}`);
  if (order.tableNumber) {
    lines.push(`Meja: ${order.tableNumber}`);
  }
  lines.push(`Kasir: ${order.userName}`);
  lines.push('-'.repeat(32));
  lines.push('');
  
  // Items
  lines.push(ESC + '!' + '\x01'); // Emphasized
  lines.push('ITEM');
  lines.push(ESC + '!' + '\x00'); // Normal
  lines.push('-'.repeat(32));
  order.items.forEach((item: any) => {
    lines.push(item.productName);
    lines.push(`  ${item.quantity}x ${item.price.toLocaleString('id-ID')} = ${(item.price * item.quantity).toLocaleString('id-ID')}`);
  });
  lines.push('');
  
  // Totals
  lines.push('-'.repeat(32));
  lines.push(`Subtotal:     ${order.subtotal.toLocaleString('id-ID')}`);
  const taxDisplayMode = settings.taxDisplayMode || 'include_hide';
  if (taxDisplayMode !== 'include_hide') {
    lines.push(`Pajak (${((settings.taxRate || 0.1) * 100).toFixed(0)}%):    ${order.tax.toLocaleString('id-ID')}`);
  }
  if (order.discount > 0) {
    lines.push(`Diskon:        -${order.discount.toLocaleString('id-ID')}`);
  }
  lines.push('='.repeat(32));
  lines.push(ESC + '!' + '\x08'); // Double height
  lines.push(`TOTAL: ${order.total.toLocaleString('id-ID')}`);
  lines.push(ESC + '!' + '\x00'); // Normal
  lines.push('='.repeat(32));
  lines.push('');
  
  // Payment
  lines.push(`Metode: ${order.paymentMethod === 'cash' ? 'Tunai' : order.paymentMethod === 'card' ? 'Kartu' : order.paymentMethod === 'debit' ? 'Debit' : order.paymentMethod === 'qris' ? 'QRIS' : 'Digital'}`);
  if (order.paymentReference) {
    lines.push(`Ref: ${order.paymentReference}`);
  }
  lines.push('');
  lines.push(ESC + 'a' + '\x01'); // Center align
  if (settings.receiptFooter) {
    const footerLines = settings.receiptFooter.split('\n').filter((line: string) => line.trim());
    footerLines.forEach((line: string) => {
      lines.push(ESC + '!' + '\x00'); // Normal
      lines.push(line.trim());
    });
  } else {
    lines.push('Terima kasih!');
  }
  lines.push('');
  lines.push(GS + 'V' + '\x41' + '\x03'); // Cut paper
  lines.push(ESC + '@'); // Initialize
  
  return lines.join('\n');
}

// Generate PDF-like text format
function generatePDFContent(order: any, settings: any) {
  const lines: string[] = [];
  lines.push('%PDF-1.4');
  lines.push('1 0 obj');
  lines.push('<<');
  lines.push('/Type /Catalog');
  lines.push('/Pages 2 0 R');
  lines.push('>>');
  lines.push('endobj');
  lines.push('');
  lines.push('%% Receipt Content (Text Format)');
  lines.push('='.repeat(60));
  if (settings.receiptHeader) {
    const headerLines = settings.receiptHeader.split('\n').filter((line: string) => line.trim());
    headerLines.forEach((line: string) => {
      lines.push(line.trim());
    });
    lines.push('='.repeat(60));
  }
  lines.push(settings.companyName || 'Noxtiz Culinary Lab');
  lines.push('='.repeat(60));
  lines.push(`Date: ${new Date().toLocaleString('id-ID')}`);
  lines.push(`Order ID: ${order.id}`);
  if (order.tableNumber) {
    lines.push(`Table: ${order.tableNumber}`);
  }
  lines.push(`Cashier: ${order.userName}`);
  lines.push('-'.repeat(60));
  lines.push('');
  lines.push('ITEMS:');
  lines.push('-'.repeat(60));
  order.items.forEach((item: any, idx: number) => {
    lines.push(`${idx + 1}. ${item.productName}`);
    lines.push(`   ${item.quantity} x Rp ${item.price.toLocaleString('id-ID')} = Rp ${(item.price * item.quantity).toLocaleString('id-ID')}`);
  });
  lines.push('');
  lines.push('-'.repeat(60));
  lines.push(`Subtotal:                    Rp ${order.subtotal.toLocaleString('id-ID')}`);
  const taxDisplayMode = settings.taxDisplayMode || 'include_hide';
  if (taxDisplayMode !== 'include_hide') {
    lines.push(`Tax (${((settings.taxRate || 0.1) * 100).toFixed(0)}%):                    Rp ${order.tax.toLocaleString('id-ID')}`);
  }
  if (order.discount > 0) {
    lines.push(`Discount:                   -Rp ${order.discount.toLocaleString('id-ID')}`);
  }
  lines.push('='.repeat(60));
  lines.push(`TOTAL:                       Rp ${order.total.toLocaleString('id-ID')}`);
  lines.push('='.repeat(60));
  lines.push('');
  lines.push(`Payment Method: ${order.paymentMethod === 'cash' ? 'Cash' : order.paymentMethod === 'card' ? 'Credit Card' : order.paymentMethod === 'debit' ? 'Debit' : order.paymentMethod === 'qris' ? 'QRIS' : 'Digital Wallet'}`);
  if (order.paymentReference) {
    lines.push(`Reference Code: ${order.paymentReference}`);
  }
  lines.push('');
  lines.push('='.repeat(60));
  if (settings.receiptFooter) {
    const footerLines = settings.receiptFooter.split('\n').filter((line: string) => line.trim());
    footerLines.forEach((line: string) => {
      lines.push(line.trim());
    });
  } else {
    lines.push('Thank you for your visit!');
  }
  lines.push('='.repeat(60));
  return lines.join('\n');
}

// Print to Bluetooth printer - support both BLE and Classic Bluetooth
async function printToBluetoothPrinter(order: any, settings: any) {
  // Generate receipt in ESC/POS format
  const receiptContent = generateReceiptContentPOS80(order, settings);
  
  // Try Web Bluetooth API first (BLE)
  if ('bluetooth' in navigator) {
    try {
      await printViaWebBluetooth(receiptContent);
      return;
    } catch (error: any) {
      console.log('Web Bluetooth (BLE) failed, trying Classic Bluetooth:', error);
      // Continue to Classic Bluetooth fallback
    }
  }
  
  // Try Classic Bluetooth via Android Intent
  if (typeof window !== 'undefined' && (window as any).Capacitor) {
    try {
      await printViaClassicBluetooth(receiptContent);
      return;
    } catch (error: any) {
      console.log('Classic Bluetooth failed:', error);
      // Continue to share fallback
    }
  }
  
  // Fallback: Share to printer app
  try {
    await shareToPrinterApp(receiptContent, order.id);
    return;
  } catch (error: any) {
    throw new Error('Gagal print ke Bluetooth. Pastikan printer sudah di-pair atau gunakan aplikasi printer thermal.');
  }
}

// Print via Web Bluetooth API (BLE)
async function printViaWebBluetooth(receiptContent: string) {
  if (!('bluetooth' in navigator)) {
    throw new Error('Web Bluetooth tidak tersedia');
  }

  try {
    // Request Bluetooth device (printer thermal usually uses Serial Port Profile)
    const device = await (navigator as any).bluetooth.requestDevice({
      filters: [
        { services: ['00001101-0000-1000-8000-00805f9b34fb'] }, // Serial Port Profile (SPP)
      ],
      optionalServices: ['00001101-0000-1000-8000-00805f9b34fb'],
    });

    console.log('Connected to:', device.name);

    // Connect to GATT server
    const server = await device.gatt.connect();
    
    // Get Serial Port service
    const service = await server.getPrimaryService('00001101-0000-1000-8000-00805f9b34fb');
    
    // Get characteristic for writing
    const characteristic = await service.getCharacteristic('00001101-0000-1000-8000-00805f9b34fb');
    
    // Convert to Uint8Array
    const encoder = new TextEncoder();
    const data = encoder.encode(receiptContent);
    
    // Send data in chunks (max 20 bytes per write for BLE)
    const chunkSize = 20;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      await characteristic.writeValue(chunk);
    }
    
    // Disconnect
    device.gatt.disconnect();
    
    alert('Struk berhasil dikirim ke printer Bluetooth (BLE)!');
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      throw new Error('Printer Bluetooth tidak ditemukan. Pastikan printer sudah di-pair dan aktif.');
    } else if (error.name === 'SecurityError') {
      throw new Error('Izin Bluetooth diperlukan. Silakan aktifkan Bluetooth dan coba lagi.');
    } else if (error.name === 'NetworkError') {
      throw new Error('Gagal terhubung ke printer. Pastikan printer dalam jangkauan.');
    } else {
      throw error;
    }
  }
}

// Print via Classic Bluetooth (Android Intent)
async function printViaClassicBluetooth(receiptContent: string) {
  const Capacitor = (window as any).Capacitor;
  if (!Capacitor || !Capacitor.Plugins) {
    throw new Error('Capacitor tidak tersedia');
  }

  try {
    // Try to use Android Intent to send to printer
    // This will open printer selection dialog
    const { App } = Capacitor.Plugins;
    if (App && App.openUrl) {
      // Create intent to send data to printer apps
      const intent = `intent://print#Intent;action=android.intent.action.SEND;type=text/plain;S.android.intent.extra.TEXT=${encodeURIComponent(receiptContent)};end`;
      await App.openUrl({ url: intent });
      alert('Pilih aplikasi printer untuk print struk');
      return;
    }
    
    throw new Error('Classic Bluetooth tidak tersedia');
  } catch (error: any) {
    throw error;
  }
}

// Share to printer app as fallback
async function shareToPrinterApp(receiptContent: string, orderId: string) {
  if (navigator.share && navigator.canShare) {
    try {
      // Create file for sharing
      const blob = new Blob([receiptContent], { type: 'text/plain' });
      const file = new File([blob], `struk-thermal-${orderId}.txt`, { type: 'text/plain' });
      
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Struk Thermal Printer',
          text: 'Struk untuk printer thermal Bluetooth',
          files: [file],
        });
        return;
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        throw error;
      }
    }
  }
  
  // Final fallback: download file
  const blob = new Blob([receiptContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `struk-thermal-${orderId}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  throw new Error('File telah diunduh. Buka dengan aplikasi printer thermal untuk print.');
}

