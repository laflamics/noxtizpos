import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, TrendingUp, TrendingDown, Package, Calendar, FileText, X, Search } from 'lucide-react';
import type { StockMovement, InventoryReport } from '@/types';

export default function Inventory() {
  const { products, loadProducts, currentUser, storage } = useStore();
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [inventoryReport, setInventoryReport] = useState<InventoryReport[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showStockInModal, setShowStockInModal] = useState(false);
  const [showStockOutModal, setShowStockOutModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showOpeningStockModal, setShowOpeningStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadProducts();
    loadStockMovements();
    loadInventoryReport();
  }, [loadProducts, selectedPeriod]);

  const loadStockMovements = async () => {
    try {
      if (storage) {
        const movements = await storage.getStockMovementsByPeriod(selectedPeriod);
        setStockMovements(movements);
      }
    } catch (error) {
      console.error('Failed to load stock movements:', error);
    }
  };

  const loadInventoryReport = async () => {
    try {
      if (storage) {
        const report = await storage.getInventoryReport(selectedPeriod);
        setInventoryReport(report);
      }
    } catch (error) {
      console.error('Failed to load inventory report:', error);
    }
  };

  const handleStockIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProduct || !currentUser) return;

    const formData = new FormData(e.currentTarget);
    const quantity = parseInt(formData.get('quantity') as string);
    const reason = formData.get('reason') as string;
    const reference = formData.get('reference') as string;

    try {
      const movement: Omit<StockMovement, 'id' | 'createdAt'> = {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        type: 'in',
        quantity,
        previousStock: selectedProduct.stock,
        newStock: selectedProduct.stock + quantity,
        reason,
        reference,
        userId: currentUser.id,
        userName: currentUser.username,
        notes: formData.get('notes') as string,
      };

      if (storage) {
        await storage.createStockMovement(movement);
        
        // Log stock activity
        if (storage && currentUser) {
          await storage.createActivityLog({
            category: 'stock',
            action: 'stock_in',
            description: `Stock masuk: ${selectedProduct.name} (+${quantity})`,
            userId: currentUser.id,
            userName: currentUser.username,
            details: {
              productId: selectedProduct.id,
              productName: selectedProduct.name,
              quantity,
              previousStock: selectedProduct.stock,
              newStock: selectedProduct.stock + quantity,
              reason,
              reference,
            },
          });
        }
        
        await loadProducts();
        await loadStockMovements();
        await loadInventoryReport();
        setShowStockInModal(false);
        setSelectedProduct(null);
        (e.target as HTMLFormElement).reset();
      }
    } catch (error) {
      console.error('Failed to create stock movement:', error);
      alert('Gagal menambahkan stok masuk');
    }
  };

  const handleStockOut = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProduct || !currentUser) return;

    const formData = new FormData(e.currentTarget);
    const quantity = parseInt(formData.get('quantity') as string);
    const reason = formData.get('reason') as string;

    if (quantity > selectedProduct.stock) {
      alert('Stok tidak mencukupi!');
      return;
    }

    try {
      const movement: Omit<StockMovement, 'id' | 'createdAt'> = {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        type: 'out',
        quantity,
        previousStock: selectedProduct.stock,
        newStock: selectedProduct.stock - quantity,
        reason,
        userId: currentUser.id,
        userName: currentUser.username,
        notes: formData.get('notes') as string,
      };

      if (storage) {
        await storage.createStockMovement(movement);
        
        // Log stock activity
        if (storage && currentUser) {
          await storage.createActivityLog({
            category: 'stock',
            action: 'stock_out',
            description: `Stock keluar: ${selectedProduct.name} (-${quantity})`,
            userId: currentUser.id,
            userName: currentUser.username,
            details: {
              productId: selectedProduct.id,
              productName: selectedProduct.name,
              quantity,
              previousStock: selectedProduct.stock,
              newStock: selectedProduct.stock - quantity,
              reason,
            },
          });
        }
        
        await loadProducts();
        await loadStockMovements();
        await loadInventoryReport();
        setShowStockOutModal(false);
        setSelectedProduct(null);
        (e.target as HTMLFormElement).reset();
      }
    } catch (error) {
      console.error('Failed to create stock movement:', error);
      alert('Gagal mengurangi stok');
    }
  };

  const handleAdjustment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProduct || !currentUser) return;

    const formData = new FormData(e.currentTarget);
    const newStock = parseInt(formData.get('newStock') as string);
    const reason = formData.get('reason') as string;
    const difference = newStock - selectedProduct.stock;

    try {
      const movement: Omit<StockMovement, 'id' | 'createdAt'> = {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        type: 'adjustment',
        quantity: Math.abs(difference),
        previousStock: selectedProduct.stock,
        newStock,
        reason,
        userId: currentUser.id,
        userName: currentUser.username,
        notes: formData.get('notes') as string,
      };

      if (storage) {
        await storage.createStockMovement(movement);
        
        // Log stock activity
        if (storage && currentUser) {
          await storage.createActivityLog({
            category: 'inventory',
            action: 'adjustment',
            description: `Adjustment stok: ${selectedProduct.name} (${difference > 0 ? '+' : ''}${difference})`,
            userId: currentUser.id,
            userName: currentUser.username,
            details: {
              productId: selectedProduct.id,
              productName: selectedProduct.name,
              quantity: Math.abs(difference),
              previousStock: selectedProduct.stock,
              newStock,
              reason,
            },
          });
        }
        
        await loadProducts();
        await loadStockMovements();
        await loadInventoryReport();
        setShowAdjustmentModal(false);
        setSelectedProduct(null);
        (e.target as HTMLFormElement).reset();
      }
    } catch (error) {
      console.error('Failed to create stock movement:', error);
      alert('Gagal adjust stok');
    }
  };

  const handleOpeningStock = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const formData = new FormData(e.currentTarget);
    const quantity = parseInt(formData.get('quantity') as string);

    try {
      if (storage) {
        await storage.setOpeningStock(selectedProduct.id, selectedPeriod, quantity);
        await loadStockMovements();
        await loadInventoryReport();
        setShowOpeningStockModal(false);
        setSelectedProduct(null);
        (e.target as HTMLFormElement).reset();
      }
    } catch (error) {
      console.error('Failed to set opening stock:', error);
      alert('Gagal set stok awal');
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredReport = inventoryReport.filter((r) =>
    r.productName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
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
            Inventory Management
          </h1>
          <p style={{ color: '#a0a0b0', fontSize: '16px' }}>Kelola stok masuk, keluar, dan laporan inventory</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={() => {
              setSelectedProduct(null);
              setShowStockInModal(true);
            }}
          >
            <Plus size={18} />
            Stok Masuk
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setSelectedProduct(null);
              setShowStockOutModal(true);
            }}
          >
            <Minus size={18} />
            Stok Keluar
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setSelectedProduct(null);
              setShowAdjustmentModal(true);
            }}
          >
            <Package size={18} />
            Adjustment
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setSelectedProduct(null);
              setShowOpeningStockModal(true);
            }}
          >
            <Calendar size={18} />
            Stok Awal Bulan
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Calendar size={20} color="#00ff88" />
          <label style={{ color: '#a0a0b0', fontSize: '14px', fontWeight: 500 }}>Periode:</label>
          <input
            type="month"
            className="input"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            style={{ width: '200px' }}
          />
        </div>
        <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#606070' }} />
          <input
            type="text"
            className="input"
            placeholder="Cari produk..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '40px' }}
          />
        </div>
      </div>

      {/* Inventory Report */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
        style={{ marginBottom: '32px' }}
      >
        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FileText size={24} color="#00ff88" />
          Laporan Inventory - {new Date(selectedPeriod + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '12px', textAlign: 'left', color: '#a0a0b0', fontSize: '14px', fontWeight: 600 }}>Produk</th>
                <th style={{ padding: '12px', textAlign: 'right', color: '#a0a0b0', fontSize: '14px', fontWeight: 600 }}>Stok Awal</th>
                <th style={{ padding: '12px', textAlign: 'right', color: '#a0a0b0', fontSize: '14px', fontWeight: 600 }}>Masuk</th>
                <th style={{ padding: '12px', textAlign: 'right', color: '#a0a0b0', fontSize: '14px', fontWeight: 600 }}>Keluar</th>
                <th style={{ padding: '12px', textAlign: 'right', color: '#a0a0b0', fontSize: '14px', fontWeight: 600 }}>Adjustment</th>
                <th style={{ padding: '12px', textAlign: 'right', color: '#a0a0b0', fontSize: '14px', fontWeight: 600 }}>Stok Akhir</th>
              </tr>
            </thead>
            <tbody>
              {filteredReport.length > 0 ? (
                filteredReport.map((report) => (
                  <tr key={report.productId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px', fontWeight: 600 }}>{report.productName}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{report.openingStock}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#00ff88' }}>+{report.stockIn}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#ff6b6b' }}>-{report.stockOut}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#ffe66d' }}>{report.adjustment > 0 ? '+' : ''}{report.adjustment}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: '#00d4ff' }}>{report.closingStock}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#606070' }}>
                    Tidak ada data untuk periode ini
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Stock Movements History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
      >
        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>Riwayat Perpindahan Stok</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {stockMovements.length > 0 ? (
            stockMovements
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((movement) => (
                <div
                  key={movement.id}
                  style={{
                    padding: '16px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        {movement.type === 'in' ? (
                          <TrendingUp size={20} color="#00ff88" />
                        ) : movement.type === 'out' ? (
                          <TrendingDown size={20} color="#ff6b6b" />
                        ) : (
                          <Package size={20} color="#ffe66d" />
                        )}
                        <h3 style={{ fontSize: '18px', fontWeight: 600 }}>{movement.productName}</h3>
                        <span
                          style={{
                            padding: '4px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            background:
                              movement.type === 'in'
                                ? 'rgba(0, 255, 136, 0.2)'
                                : movement.type === 'out'
                                ? 'rgba(255, 107, 107, 0.2)'
                                : movement.type === 'opening'
                                ? 'rgba(0, 212, 255, 0.2)'
                                : 'rgba(255, 230, 109, 0.2)',
                            color:
                              movement.type === 'in'
                                ? '#00ff88'
                                : movement.type === 'out'
                                ? '#ff6b6b'
                                : movement.type === 'opening'
                                ? '#00d4ff'
                                : '#ffe66d',
                            textTransform: 'uppercase',
                          }}
                        >
                          {movement.type === 'in' ? 'Masuk' : movement.type === 'out' ? 'Keluar' : movement.type === 'opening' ? 'Awal' : 'Adjust'}
                        </span>
                      </div>
                      <p style={{ color: '#a0a0b0', fontSize: '14px', marginBottom: '4px' }}>
                        <strong>Qty:</strong> {movement.quantity} | <strong>Dari:</strong> {movement.previousStock} → <strong>Ke:</strong> {movement.newStock}
                      </p>
                      {movement.reason && (
                        <p style={{ color: '#a0a0b0', fontSize: '14px', marginBottom: '4px' }}>
                          <strong>Alasan:</strong> {movement.reason}
                        </p>
                      )}
                      {movement.reference && (
                        <p style={{ color: '#a0a0b0', fontSize: '14px', marginBottom: '4px' }}>
                          <strong>Referensi:</strong> {movement.reference}
                        </p>
                      )}
                      <p style={{ color: '#606070', fontSize: '12px' }}>
                        {movement.userName} • {new Date(movement.createdAt).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                </div>
              ))
          ) : (
            <div style={{ textAlign: 'center', padding: '60px', color: '#606070' }}>
              Belum ada riwayat perpindahan stok
            </div>
          )}
        </div>
      </motion.div>

      {/* Stock In Modal */}
      <AnimatePresence>
        {showStockInModal && (
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
              setShowStockInModal(false);
              setSelectedProduct(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card"
              style={{ maxWidth: '600px', width: '100%', maxHeight: '85vh', overflowY: 'auto', marginTop: '20px', marginBottom: '20px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Stok Masuk</h2>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowStockInModal(false);
                    setSelectedProduct(null);
                  }}
                  style={{ padding: '8px', minWidth: 'auto' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleStockIn}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                      Produk *
                    </label>
                    <select
                      name="productId"
                      className="input"
                      required
                      value={selectedProduct?.id || ''}
                      onChange={(e) => {
                        const product = products.find((p) => p.id === e.target.value);
                        setSelectedProduct(product || null);
                      }}
                    >
                      <option value="">Pilih produk</option>
                      {filteredProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Stok: {p.stock})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                      Jumlah *
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      className="input"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                      Alasan *
                    </label>
                    <select name="reason" className="input" required>
                      <option value="">Pilih alasan</option>
                      <option value="Pembelian">Pembelian</option>
                      <option value="Retur">Retur</option>
                      <option value="Transfer">Transfer</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                      Referensi (PO/Invoice)
                    </label>
                    <input type="text" name="reference" className="input" placeholder="PO-001, INV-123, dll" />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                      Catatan
                    </label>
                    <textarea name="notes" className="input" rows={3} style={{ resize: 'vertical' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowStockInModal(false);
                      setSelectedProduct(null);
                    }}
                    style={{ flex: 1 }}
                  >
                    Batal
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    <Plus size={18} />
                    Tambah Stok
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stock Out Modal */}
      <AnimatePresence>
        {showStockOutModal && (
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
              setShowStockOutModal(false);
              setSelectedProduct(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card"
              style={{ maxWidth: '600px', width: '100%', maxHeight: '85vh', overflowY: 'auto', marginTop: '20px', marginBottom: '20px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Stok Keluar</h2>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowStockOutModal(false);
                    setSelectedProduct(null);
                  }}
                  style={{ padding: '8px', minWidth: 'auto' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleStockOut}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                      Produk *
                    </label>
                    <select
                      name="productId"
                      className="input"
                      required
                      value={selectedProduct?.id || ''}
                      onChange={(e) => {
                        const product = products.find((p) => p.id === e.target.value);
                        setSelectedProduct(product || null);
                      }}
                    >
                      <option value="">Pilih produk</option>
                      {filteredProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Stok: {p.stock})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                      Jumlah *
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      className="input"
                      min="1"
                      max={selectedProduct?.stock || 0}
                      required
                    />
                    {selectedProduct && (
                      <p style={{ color: '#a0a0b0', fontSize: '12px', marginTop: '4px' }}>
                        Stok tersedia: {selectedProduct.stock}
                      </p>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                      Alasan *
                    </label>
                    <select name="reason" className="input" required>
                      <option value="">Pilih alasan</option>
                      <option value="Rusak">Rusak</option>
                      <option value="Kadaluarsa">Kadaluarsa</option>
                      <option value="Hilang">Hilang</option>
                      <option value="Sample">Sample</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                      Catatan
                    </label>
                    <textarea name="notes" className="input" rows={3} style={{ resize: 'vertical' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowStockOutModal(false);
                      setSelectedProduct(null);
                    }}
                    style={{ flex: 1 }}
                  >
                    Batal
                  </button>
                  <button type="submit" className="btn btn-danger" style={{ flex: 1 }}>
                    <Minus size={18} />
                    Kurangi Stok
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Adjustment Modal */}
      <AnimatePresence>
        {showAdjustmentModal && (
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
              setShowAdjustmentModal(false);
              setSelectedProduct(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card"
              style={{ maxWidth: '600px', width: '100%', maxHeight: '85vh', overflowY: 'auto', marginTop: '20px', marginBottom: '20px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Adjustment Stok</h2>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAdjustmentModal(false);
                    setSelectedProduct(null);
                  }}
                  style={{ padding: '8px', minWidth: 'auto' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAdjustment}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                      Produk *
                    </label>
                    <select
                      name="productId"
                      className="input"
                      required
                      value={selectedProduct?.id || ''}
                      onChange={(e) => {
                        const product = products.find((p) => p.id === e.target.value);
                        setSelectedProduct(product || null);
                      }}
                    >
                      <option value="">Pilih produk</option>
                      {filteredProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Stok: {p.stock})
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedProduct && (
                    <div style={{ padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                      <p style={{ color: '#a0a0b0', fontSize: '14px', marginBottom: '4px' }}>
                        Stok saat ini: <strong style={{ color: '#00ff88' }}>{selectedProduct.stock}</strong>
                      </p>
                    </div>
                  )}
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                      Stok Baru *
                    </label>
                    <input
                      type="number"
                      name="newStock"
                      className="input"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                      Alasan *
                    </label>
                    <select name="reason" className="input" required>
                      <option value="">Pilih alasan</option>
                      <option value="Stock Opname">Stock Opname</option>
                      <option value="Koreksi">Koreksi</option>
                      <option value="Rusak">Rusak</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                      Catatan
                    </label>
                    <textarea name="notes" className="input" rows={3} style={{ resize: 'vertical' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowAdjustmentModal(false);
                      setSelectedProduct(null);
                    }}
                    style={{ flex: 1 }}
                  >
                    Batal
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    <Package size={18} />
                    Adjust Stok
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Opening Stock Modal */}
      <AnimatePresence>
        {showOpeningStockModal && (
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
              setShowOpeningStockModal(false);
              setSelectedProduct(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card"
              style={{ maxWidth: '600px', width: '100%', maxHeight: '85vh', overflowY: 'auto', marginTop: '20px', marginBottom: '20px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Set Stok Awal Bulan</h2>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowOpeningStockModal(false);
                    setSelectedProduct(null);
                  }}
                  style={{ padding: '8px', minWidth: 'auto' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleOpeningStock}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '8px', marginBottom: '8px' }}>
                    <p style={{ color: '#a0a0b0', fontSize: '14px' }}>
                      Periode: <strong style={{ color: '#00ff88' }}>{new Date(selectedPeriod + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</strong>
                    </p>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                      Produk *
                    </label>
                    <select
                      name="productId"
                      className="input"
                      required
                      value={selectedProduct?.id || ''}
                      onChange={(e) => {
                        const product = products.find((p) => p.id === e.target.value);
                        setSelectedProduct(product || null);
                      }}
                    >
                      <option value="">Pilih produk</option>
                      {filteredProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Stok: {p.stock})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                      Stok Awal Bulan *
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      className="input"
                      min="0"
                      required
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowOpeningStockModal(false);
                      setSelectedProduct(null);
                    }}
                    style={{ flex: 1 }}
                  >
                    Batal
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    <Calendar size={18} />
                    Set Stok Awal
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

