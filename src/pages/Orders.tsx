import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Calendar, X, Printer, Share2, Download, Mail, MessageCircle, Copy, FileText, Smartphone } from 'lucide-react';
import type { Order } from '@/types';

export default function Orders() {
  const { orders, loadOrders, settings } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.userName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesDate = !dateFilter || order.createdAt.startsWith(dateFilter);
    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalRevenue = filteredOrders
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
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
          Pesanan
        </h1>
        <p style={{ color: '#a0a0b0', fontSize: '16px' }}>Riwayat transaksi dan pesanan</p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '32px',
        }}
      >
        <div className="card">
          <p style={{ color: '#a0a0b0', fontSize: '14px', marginBottom: '8px' }}>Total Pesanan</p>
          <h2 style={{ fontSize: '28px', fontWeight: 700 }}>{filteredOrders.length}</h2>
        </div>
        <div className="card">
          <p style={{ color: '#a0a0b0', fontSize: '14px', marginBottom: '8px' }}>Total Pendapatan</p>
          <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#00ff88' }}>
            Rp {totalRevenue.toLocaleString('id-ID')}
          </h2>
        </div>
        <div className="card">
          <p style={{ color: '#a0a0b0', fontSize: '14px', marginBottom: '8px' }}>Pesanan Selesai</p>
          <h2 style={{ fontSize: '28px', fontWeight: 700 }}>
            {filteredOrders.filter((o) => o.status === 'completed').length}
          </h2>
        </div>
        <div className="card">
          <p style={{ color: '#a0a0b0', fontSize: '14px', marginBottom: '8px' }}>Pesanan Pending</p>
          <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#ffe66d' }}>
            {filteredOrders.filter((o) => o.status === 'pending').length}
          </h2>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#606070' }} />
          <input
            type="text"
            className="input"
            placeholder="Cari pesanan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '40px' }}
          />
        </div>
        <select
          className="input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ width: '200px' }}
        >
          <option value="all">Semua Status</option>
          <option value="completed">Selesai</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Batal</option>
        </select>
        <input
          type="date"
          className="input"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          style={{ width: '200px' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
              style={{ cursor: 'pointer' }}
              onClick={() => {
                setSelectedOrder(order);
                setShowReceiptModal(true);
              }}
              whileHover={{ scale: 1.01 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 700 }}>#{order.id.slice(-8)}</h3>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background:
                          order.status === 'completed'
                            ? 'rgba(0, 255, 136, 0.2)'
                            : order.status === 'pending'
                            ? 'rgba(255, 230, 109, 0.2)'
                            : 'rgba(255, 107, 107, 0.2)',
                        color:
                          order.status === 'completed'
                            ? '#00ff88'
                            : order.status === 'pending'
                            ? '#ffe66d'
                            : '#ff6b6b',
                      }}
                    >
                      {order.status === 'completed' ? 'Selesai' : order.status === 'pending' ? 'Pending' : 'Batal'}
                    </span>
                  </div>
                  <p style={{ color: '#a0a0b0', marginBottom: '8px' }}>
                    <strong>Kasir:</strong> {order.userName}
                  </p>
                  {order.tableNumber && (
                    <p style={{ color: '#a0a0b0', marginBottom: '8px' }}>
                      <strong>Meja:</strong> {order.tableNumber}
                    </p>
                  )}
                  <p style={{ color: '#a0a0b0', marginBottom: '8px' }}>
                    <strong>Metode:</strong>{' '}
                    {order.paymentMethod === 'cash' 
                      ? 'Tunai' 
                      : order.paymentMethod === 'card' 
                      ? 'Kartu Kredit' 
                      : order.paymentMethod === 'debit'
                      ? 'Debit'
                      : order.paymentMethod === 'qris'
                      ? 'QRIS'
                      : 'Digital Wallet'}
                    {order.paymentReference && (
                      <span style={{ fontSize: '12px', color: '#606070', marginLeft: '8px', display: 'block', marginTop: '4px' }}>
                        Ref: {order.paymentReference}
                      </span>
                    )}
                  </p>
                  <p style={{ color: '#606070', fontSize: '14px' }}>
                    {new Date(order.createdAt).toLocaleString('id-ID')}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: '#a0a0b0', fontSize: '14px', marginBottom: '4px' }}>Total</p>
                  <p style={{ fontSize: '28px', fontWeight: 800, color: '#00ff88', marginBottom: '8px' }}>
                    Rp {order.total.toLocaleString('id-ID')}
                  </p>
                  <p style={{ color: '#606070', fontSize: '12px' }}>
                    {order.items.length} item
                  </p>
                </div>
              </div>
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <p style={{ color: '#a0a0b0', fontSize: '14px', marginBottom: '8px' }}>Items:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {order.items.map((item, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '6px 12px',
                        background: 'var(--bg-tertiary)',
                        borderRadius: '6px',
                        fontSize: '13px',
                        color: '#a0a0b0',
                      }}
                    >
                      {item.productName} x{item.quantity}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '60px', color: '#606070' }}>
            Tidak ada pesanan ditemukan
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      <AnimatePresence>
        {showReceiptModal && selectedOrder && (
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
                    onClick={async () => {
                      // Generate plain text receipt (printer-friendly, no ESC/POS commands)
                      const receiptContent = generateReceiptContent(selectedOrder, settings);
                      // Use Web Share API - Android native share sheet with file
                      if (navigator.share && navigator.canShare) {
                        try {
                          // Create file for sharing - plain text format
                          const blob = new Blob([receiptContent], { type: 'text/plain' });
                          const file = new File([blob], `struk-${selectedOrder.id}.txt`, { type: 'text/plain' });
                          
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
                    onClick={() => setShowReceiptModal(false)}
                    style={{ padding: '8px', minWidth: 'auto' }}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div id="receipt-content" style={{ fontFamily: 'monospace', fontSize: '14px', lineHeight: '1.6' }}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
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
                  <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
                    {settings.companyName || 'Noxtiz Culinary Lab'}
                  </h3>
                  <p style={{ color: '#606070', fontSize: '12px' }}>{new Date(selectedOrder.createdAt).toLocaleString('id-ID')}</p>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginBottom: '16px' }}>
                  <p style={{ marginBottom: '4px' }}>Order ID: {selectedOrder.id}</p>
                  {selectedOrder.tableNumber && <p style={{ marginBottom: '4px' }}>Meja: {selectedOrder.tableNumber}</p>}
                  <p style={{ marginBottom: '4px' }}>Kasir: {selectedOrder.userName}</p>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginBottom: '16px' }}>
                  <p style={{ fontWeight: 700, marginBottom: '12px' }}>ITEM</p>
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} style={{ marginBottom: '12px' }}>
                      <p style={{ fontWeight: 600 }}>{item.productName}</p>
                      <p style={{ color: '#606070', fontSize: '12px' }}>
                        {item.quantity} x Rp {item.price.toLocaleString('id-ID')} = Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                      </p>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Subtotal:</span>
                    <span>Rp {selectedOrder.subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  {(settings.taxDisplayMode || 'include_hide') !== 'include_hide' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span>Pajak ({((settings.taxRate || 0.1) * 100).toFixed(0)}%):</span>
                      <span>Rp {selectedOrder.tax.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  {selectedOrder.discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span>Diskon:</span>
                      <span>- Rp {selectedOrder.discount.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', fontWeight: 700, fontSize: '18px' }}>
                    <span>TOTAL:</span>
                    <span style={{ color: '#00ff88' }}>Rp {selectedOrder.total.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <p style={{ marginBottom: '4px' }}>
                    Metode: {selectedOrder.paymentMethod === 'cash' ? 'Tunai' : selectedOrder.paymentMethod === 'card' ? 'Kartu Kredit' : selectedOrder.paymentMethod === 'debit' ? 'Debit' : selectedOrder.paymentMethod === 'qris' ? 'QRIS' : 'Digital Wallet'}
                  </p>
                  {selectedOrder.paymentReference && (
                    <p style={{ marginBottom: '4px', fontSize: '12px', color: '#606070' }}>Ref Code: {selectedOrder.paymentReference}</p>
                  )}
                </div>

                <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                  {settings.receiptFooter ? (
                    <div style={{ fontSize: '11px', color: '#666', whiteSpace: 'pre-line', lineHeight: '1.4' }}>
                      {settings.receiptFooter}
                    </div>
                  ) : (
                    <p style={{ color: '#606070', fontSize: '12px' }}>Terima kasih atas kunjungan Anda!</p>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <button
                  className="btn btn-secondary"
                    onClick={() => {
                      // Check if print is available (may not work on mobile/Android)
                      if (typeof window.print === 'function') {
                        try {
                          window.print();
                        } catch (e) {
                          // Fallback: download as PDF text format
                          const pdfContent = generatePDFContent(selectedOrder, settings);
                          const blob = new Blob([pdfContent], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `struk-${selectedOrder.id}.pdf`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        }
                      } else {
                        // Fallback for Android: download as PDF text format
                        const pdfContent = generatePDFContent(selectedOrder, settings);
                        const blob = new Blob([pdfContent], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `struk-${selectedOrder.id}.pdf`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }
                    }}
                  style={{ flex: 1 }}
                >
                  <Printer size={18} />
                  Print
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    const receiptContent = generateReceiptContent(selectedOrder, settings);
                    const blob = new Blob([receiptContent], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `struk-${selectedOrder.id}-${new Date().toISOString().split('T')[0]}.txt`;
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

      {/* Share Modal - Same as POS */}
      <AnimatePresence>
        {showShareModal && selectedOrder && (
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
                      const receiptContent = generateReceiptContent(selectedOrder, settings);
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
                    const receiptContent = generateReceiptContent(selectedOrder, settings);
                    const blob = new Blob([receiptContent], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `struk-${selectedOrder.id}-${new Date().toISOString().split('T')[0]}.txt`;
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
                    const receiptContent = generateReceiptContent(selectedOrder, settings);
                    const mailtoLink = `mailto:?subject=Struk Pembayaran ${selectedOrder.id}&body=${encodeURIComponent(receiptContent)}`;
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
                    const receiptContent = generateReceiptContent(selectedOrder, settings);
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
                    const receiptContent = generateReceiptContent(selectedOrder, settings);
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
                        const receiptContent = generateReceiptContent(selectedOrder, settings);
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
                      const receiptContent = generateReceiptContentPOS80(selectedOrder, settings);
                      const blob = new Blob([receiptContent], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `struk-pos80-${selectedOrder.id}.txt`;
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
                      const pdfContent = generatePDFContent(selectedOrder, settings);
                      const blob = new Blob([pdfContent], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `struk-${selectedOrder.id}.pdf`;
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
  lines.push(new Date(order.createdAt).toLocaleString('id-ID'));
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
  const ESC = '\x1B';
  const GS = '\x1D';
  
  lines.push(ESC + '@');
  lines.push(ESC + 'a' + '\x01');
  // Header
  if (settings.receiptHeader) {
    const headerLines = settings.receiptHeader.split('\n').filter((line: string) => line.trim());
    headerLines.forEach((line: string) => {
      lines.push(ESC + '!' + '\x00'); // Normal
      lines.push(line.trim());
    });
    lines.push('-'.repeat(32));
  }
  lines.push(ESC + '!' + '\x08');
  lines.push(settings.companyName || 'Noxtiz Culinary Lab');
  lines.push(ESC + '!' + '\x00');
  lines.push('-'.repeat(32));
  lines.push(new Date(order.createdAt).toLocaleString('id-ID'));
  lines.push('');
  lines.push(ESC + 'a' + '\x00');
  lines.push(`Order: ${order.id}`);
  if (order.tableNumber) {
    lines.push(`Meja: ${order.tableNumber}`);
  }
  lines.push(`Kasir: ${order.userName}`);
  lines.push('-'.repeat(32));
  lines.push('');
  lines.push(ESC + '!' + '\x01');
  lines.push('ITEM');
  lines.push(ESC + '!' + '\x00');
  lines.push('-'.repeat(32));
  order.items.forEach((item: any) => {
    lines.push(item.productName);
    lines.push(`  ${item.quantity}x ${item.price.toLocaleString('id-ID')} = ${(item.price * item.quantity).toLocaleString('id-ID')}`);
  });
  lines.push('');
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
  lines.push(ESC + '!' + '\x08');
  lines.push(`TOTAL: ${order.total.toLocaleString('id-ID')}`);
  lines.push(ESC + '!' + '\x00');
  lines.push('='.repeat(32));
  lines.push('');
  lines.push(`Metode: ${order.paymentMethod === 'cash' ? 'Tunai' : order.paymentMethod === 'card' ? 'Kartu' : order.paymentMethod === 'debit' ? 'Debit' : order.paymentMethod === 'qris' ? 'QRIS' : 'Digital'}`);
  if (order.paymentReference) {
    lines.push(`Ref: ${order.paymentReference}`);
  }
  lines.push('');
  lines.push(ESC + 'a' + '\x01');
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
  lines.push(GS + 'V' + '\x41' + '\x03');
  lines.push(ESC + '@');
  
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
  lines.push(`Date: ${new Date(order.createdAt).toLocaleString('id-ID')}`);
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

