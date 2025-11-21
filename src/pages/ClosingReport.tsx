import { useState, useEffect, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { motion } from 'framer-motion';
import { Download, Printer, FileText, DollarSign, CreditCard, QrCode, Wallet, Banknote, TrendingUp, CheckCircle, AlertCircle, Lock } from 'lucide-react';
import LicenseCountdownBadge from '@/components/LicenseCountdownBadge';
import { useNotification } from '@/components/NotificationProvider';

interface PaymentSummary {
  method: string;
  label: string;
  count: number;
  total: number;
  icon: any;
}

export default function ClosingReport() {
  const { orders, loadOrders, settings, currentUser, storage } = useStore();
  const { notify } = useNotification();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  const [actualAmounts, setActualAmounts] = useState<{ [key: string]: string }>({});
  const [notes, setNotes] = useState('');
  const [isClosed, setIsClosed] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Reset closing state when period changes
  useEffect(() => {
    setIsClosed(false);
    setActualAmounts({});
    setNotes('');
  }, [selectedDate, selectedMonth, viewMode]);

  // Filter orders based on view mode
  const filteredOrders = useMemo(() => {
    if (viewMode === 'daily') {
      return orders.filter(
        (order) =>
          order.status === 'completed' &&
          order.createdAt.startsWith(selectedDate)
      );
    } else {
      return orders.filter(
        (order) =>
          order.status === 'completed' &&
          order.createdAt.startsWith(selectedMonth)
      );
    }
  }, [orders, selectedDate, selectedMonth, viewMode]);

  // Calculate payment summaries
  const paymentSummaries: PaymentSummary[] = useMemo(() => {
    const methods: { [key: string]: { label: string; icon: any } } = {
      cash: { label: 'Tunai', icon: Banknote },
      card: { label: 'Kartu Kredit', icon: CreditCard },
      debit: { label: 'Debit', icon: CreditCard },
      qris: { label: 'QRIS', icon: QrCode },
      digital: { label: 'Digital Wallet', icon: Wallet },
    };

    const summaries: { [key: string]: PaymentSummary } = {};

    filteredOrders.forEach((order) => {
      const method = order.paymentMethod;
      if (!summaries[method]) {
        summaries[method] = {
          method,
          label: methods[method]?.label || method,
          count: 0,
          total: 0,
          icon: methods[method]?.icon || DollarSign,
        };
      }
      summaries[method].count += 1;
      summaries[method].total += order.total;
    });

    return Object.values(summaries).sort((a, b) => b.total - a.total);
  }, [filteredOrders]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    const totalTransactions = filteredOrders.length;
    const totalItems = filteredOrders.reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
    const totalDiscount = filteredOrders.reduce((sum, order) => sum + order.discount, 0);
    const totalTax = filteredOrders.reduce((sum, order) => sum + order.tax, 0);
    const totalSubtotal = filteredOrders.reduce((sum, order) => sum + order.subtotal, 0);

    return {
      totalRevenue,
      totalTransactions,
      totalItems,
      totalDiscount,
      totalTax,
      totalSubtotal,
    };
  }, [filteredOrders]);

  // Calculate differences for all payment methods
  const paymentDifferences = useMemo(() => {
    const differences: { [key: string]: number } = {};
    paymentSummaries.forEach((summary) => {
      const actual = parseFloat(actualAmounts[summary.method] || '0');
      differences[summary.method] = actual - summary.total;
    });
    return differences;
  }, [paymentSummaries, actualAmounts]);

  // Check if all payment methods have actual amounts
  const allPaymentMethodsFilled = useMemo(() => {
    if (paymentSummaries.length === 0) return false;
    return paymentSummaries.every((summary) => {
      const actual = actualAmounts[summary.method];
      return actual !== undefined && actual !== '' && parseFloat(actual) >= 0;
    });
  }, [paymentSummaries, actualAmounts]);

  // Check if there are any discrepancies
  const hasDiscrepancies = useMemo(() => {
    return Object.values(paymentDifferences).some((diff) => Math.abs(diff) > 0.01);
  }, [paymentDifferences]);

  // Generate report content
  const generateReportContent = () => {
    const lines: string[] = [];
    const dateLabel = viewMode === 'daily' 
      ? new Date(selectedDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : new Date(selectedMonth + '-01').toLocaleDateString('id-ID', { year: 'numeric', month: 'long' });

    lines.push('='.repeat(50));
    lines.push(settings.companyName || 'Noxtiz Culinary Lab');
    lines.push('='.repeat(50));
    lines.push(`CLOSING REPORT - ${viewMode === 'daily' ? 'HARIAN' : 'BULANAN'}`);
    lines.push(`Periode: ${dateLabel}`);
    lines.push(`Dibuat oleh: ${currentUser?.username || 'System'}`);
    lines.push(`Tanggal: ${new Date().toLocaleString('id-ID')}`);
    lines.push('='.repeat(50));
    lines.push('');

    // Summary
    lines.push('RINGKASAN');
    lines.push('-'.repeat(50));
    lines.push(`Total Transaksi: ${totals.totalTransactions}`);
    lines.push(`Total Item Terjual: ${totals.totalItems}`);
    lines.push(`Total Revenue: Rp ${totals.totalRevenue.toLocaleString('id-ID')}`);
    lines.push(`Total Subtotal: Rp ${totals.totalSubtotal.toLocaleString('id-ID')}`);
    lines.push(`Total Pajak: Rp ${totals.totalTax.toLocaleString('id-ID')}`);
    lines.push(`Total Diskon: Rp ${totals.totalDiscount.toLocaleString('id-ID')}`);
    lines.push('');

    // Payment Methods
    lines.push('BREAKDOWN METODE PEMBAYARAN');
    lines.push('-'.repeat(50));
    paymentSummaries.forEach((summary) => {
      lines.push(`${summary.label}:`);
      lines.push(`  Jumlah Transaksi: ${summary.count}`);
      lines.push(`  Total: Rp ${summary.total.toLocaleString('id-ID')}`);
      lines.push('');
    });

    // Payment Method Settlement
    lines.push('SETTLEMENT METODE PEMBAYARAN');
    lines.push('-'.repeat(50));
    paymentSummaries.forEach((summary) => {
      const actual = parseFloat(actualAmounts[summary.method] || '0');
      const difference = paymentDifferences[summary.method] || 0;
      lines.push(`${summary.label}:`);
      lines.push(`  Total (Sistem): Rp ${summary.total.toLocaleString('id-ID')}`);
      lines.push(`  Actual (Dihitung): Rp ${actual.toLocaleString('id-ID')}`);
      lines.push(`  Selisih: Rp ${Math.abs(difference).toLocaleString('id-ID')}`);
      lines.push(difference === 0 ? '  ✓ Cocok' : difference > 0 ? '  ⚠ Kelebihan' : '  ⚠ Kekurangan');
      lines.push('');
    });

    if (notes) {
      lines.push('CATATAN');
      lines.push('-'.repeat(50));
      lines.push(notes);
      lines.push('');
    }

    lines.push('='.repeat(50));
    lines.push('Laporan ini dibuat secara otomatis oleh sistem');
    lines.push('='.repeat(50));

    return lines.join('\n');
  };

  const handleDownload = () => {
    const content = generateReportContent();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = `closing-report-${viewMode === 'daily' ? selectedDate : selectedMonth}-${Date.now()}.txt`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    // Check if print is available (may not work on mobile/Android)
    if (typeof window.print === 'function') {
      try {
        window.print();
      } catch (e) {
        // Fallback: download as text file
        handleDownload();
      }
    } else {
      // Fallback for Android: download as text file
      handleDownload();
    }
  };

  const handleClose = async () => {
    if (!allPaymentMethodsFilled) {
      notify({
        type: 'warning',
        title: 'Lengkapi nominal',
        message: 'Isi actual amount untuk semua metode pembayaran dulu ya.',
      });
      return;
    }

    if (hasDiscrepancies) {
      const confirmClose = confirm(
        `⚠ PERINGATAN: Terdeteksi selisih pada beberapa metode pembayaran!\n\n` +
        `Apakah Anda yakin ingin melanjutkan closing?`
      );
      if (!confirmClose) return;
    }

    // Log closing activity
    if (storage && currentUser) {
      const discrepancies: any = {};
      paymentSummaries.forEach((summary) => {
        const actual = parseFloat(actualAmounts[summary.method] || '0');
        const difference = paymentDifferences[summary.method] || 0;
        discrepancies[summary.method] = {
          label: summary.label,
          systemTotal: summary.total,
          actualAmount: actual,
          difference: difference,
          count: summary.count,
        };
      });

      await storage.createActivityLog({
        category: 'payment',
        action: 'closing',
        description: `Closing ${viewMode === 'daily' ? 'Harian' : 'Bulanan'} - ${viewMode === 'daily' ? selectedDate : selectedMonth}`,
        userId: currentUser.id,
        userName: currentUser.username,
        details: {
          period: viewMode === 'daily' ? selectedDate : selectedMonth,
          viewMode: viewMode,
          totalRevenue: totals.totalRevenue,
          totalTransactions: totals.totalTransactions,
          totalItems: totals.totalItems,
          paymentSummaries: paymentSummaries.map(s => ({
            method: s.method,
            label: s.label,
            count: s.count,
            total: s.total,
          })),
          discrepancies: discrepancies,
          hasDiscrepancies: hasDiscrepancies,
          notes: notes,
        },
      });
    }

    // Mark as closed
    setIsClosed(true);

    // Generate and print report
    const content = generateReportContent();
    
    // Try to create print window (may not work on Android)
    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Closing Report - ${viewMode === 'daily' ? selectedDate : selectedMonth}</title>
              <style>
                body {
                  font-family: 'Courier New', monospace;
                  font-size: 12px;
                  padding: 20px;
                  line-height: 1.6;
                }
                pre {
                  white-space: pre-wrap;
                  word-wrap: break-word;
                }
              </style>
            </head>
            <body>
              <pre>${content}</pre>
              <script>
                window.onload = function() {
                  if (typeof window.print === 'function') {
                    window.print();
                    window.onafterprint = function() {
                      window.close();
                    };
                  } else {
                    // Fallback: close window if print not available
                    setTimeout(() => window.close(), 1000);
                  }
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      } else {
        // Fallback: download as file if popup blocked (common on mobile)
        handleDownload();
      }
    } catch (e) {
      // Fallback: download as file if print window fails
      handleDownload();
    }

    notify({
      type: 'success',
      title: 'Closing selesai',
      message: 'Settlement berhasil dicetak/didownload.',
    });
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
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
            Closing Report
          </h1>
          <p style={{ color: '#a0a0b0', fontSize: '16px' }}>Settlement harian dan bulanan</p>
        </div>
        <LicenseCountdownBadge />
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
        style={{ marginBottom: '24px' }}
      >
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`btn ${viewMode === 'daily' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('daily')}
            >
              Harian
            </button>
            <button
              className={`btn ${viewMode === 'monthly' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('monthly')}
            >
              Bulanan
            </button>
          </div>
          {viewMode === 'daily' ? (
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                Pilih Tanggal
              </label>
              <input
                type="date"
                className="input"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          ) : (
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                Pilih Bulan
              </label>
              <input
                type="month"
                className="input"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="btn btn-secondary" 
              onClick={handleDownload}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleDownload();
              }}
            >
              <Download size={18} />
              Download
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={handlePrint}
              onTouchEnd={(e) => {
                e.preventDefault();
                handlePrint();
              }}
            >
              <Printer size={18} />
              Print
            </button>
          </div>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <TrendingUp size={24} color="#00ff88" />
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#a0a0b0' }}>Total Revenue</h3>
          </div>
          <p style={{ fontSize: '24px', fontWeight: 700, color: '#00ff88' }}>
            Rp {totals.totalRevenue.toLocaleString('id-ID')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <FileText size={24} color="#00d4ff" />
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#a0a0b0' }}>Total Transaksi</h3>
          </div>
          <p style={{ fontSize: '24px', fontWeight: 700, color: '#00d4ff' }}>
            {totals.totalTransactions}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <DollarSign size={24} color="#ffe66d" />
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#a0a0b0' }}>Total Item</h3>
          </div>
          <p style={{ fontSize: '24px', fontWeight: 700, color: '#ffe66d' }}>
            {totals.totalItems}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <CreditCard size={24} color="#ff6b6b" />
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#a0a0b0' }}>Total Diskon</h3>
          </div>
          <p style={{ fontSize: '24px', fontWeight: 700, color: '#ff6b6b' }}>
            Rp {totals.totalDiscount.toLocaleString('id-ID')}
          </p>
        </motion.div>
      </div>

      {/* Payment Methods Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card"
        style={{ marginBottom: '24px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Breakdown Metode Pembayaran</h2>
          {isClosed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(0, 255, 136, 0.1)', borderRadius: '8px', border: '1px solid #00ff88' }}>
              <CheckCircle size={20} color="#00ff88" />
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#00ff88' }}>CLOSED</span>
            </div>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {paymentSummaries.length > 0 ? (
            paymentSummaries.map((summary) => {
              const Icon = summary.icon;
              const percentage = totals.totalRevenue > 0 ? (summary.total / totals.totalRevenue) * 100 : 0;
              const difference = paymentDifferences[summary.method] || 0;
              const hasDifference = Math.abs(difference) > 0.01;
              
              return (
                <div
                  key={summary.method}
                  style={{
                    padding: '16px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '8px',
                    border: hasDifference ? '2px solid #ff6b6b' : '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <Icon size={24} color="#00ff88" />
                    <h3 style={{ fontSize: '16px', fontWeight: 600 }}>{summary.label}</h3>
                  </div>
                  
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500, color: '#a0a0b0' }}>
                        Total (Sistem)
                      </label>
                      <p style={{ fontSize: '18px', fontWeight: 700, color: '#00ff88' }}>
                        Rp {summary.total.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div style={{ fontSize: '12px', color: '#606070', marginBottom: '8px' }}>
                      {summary.count} transaksi • {percentage.toFixed(1)}% dari total
                    </div>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}>
                      Actual Amount *
                    </label>
                    <input
                      type="number"
                      className="input"
                      placeholder="Masukkan jumlah aktual"
                      value={actualAmounts[summary.method] || ''}
                      onChange={(e) => setActualAmounts({ ...actualAmounts, [summary.method]: e.target.value })}
                      disabled={isClosed}
                      style={{
                        fontSize: '14px',
                        borderColor: hasDifference ? '#ff6b6b' : undefined,
                      }}
                    />
                  </div>

                  {actualAmounts[summary.method] && (
                    <div style={{
                      padding: '8px',
                      background: difference === 0 ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 107, 107, 0.1)',
                      borderRadius: '6px',
                      border: `1px solid ${difference === 0 ? '#00ff88' : '#ff6b6b'}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        {difference === 0 ? (
                          <CheckCircle size={16} color="#00ff88" />
                        ) : (
                          <AlertCircle size={16} color="#ff6b6b" />
                        )}
                        <span style={{ fontSize: '12px', fontWeight: 600, color: difference === 0 ? '#00ff88' : '#ff6b6b' }}>
                          Selisih: Rp {Math.abs(difference).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <p style={{ fontSize: '11px', color: '#a0a0b0' }}>
                        {difference === 0
                          ? '✓ Cocok dengan sistem'
                          : difference > 0
                          ? `⚠ Kelebihan Rp ${difference.toLocaleString('id-ID')}`
                          : `⚠ Kekurangan Rp ${Math.abs(difference).toLocaleString('id-ID')}`}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#606070' }}>
              Tidak ada transaksi pada periode ini
            </div>
          )}
        </div>
      </motion.div>

      {/* Summary & Close Button */}
      {hasDiscrepancies && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card"
          style={{ marginBottom: '24px', border: '2px solid #ff6b6b', background: 'rgba(255, 107, 107, 0.05)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <AlertCircle size={24} color="#ff6b6b" />
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#ff6b6b' }}>
              ⚠ PERINGATAN: Terdeteksi Selisih!
            </h3>
          </div>
          <p style={{ fontSize: '14px', color: '#a0a0b0', marginBottom: '12px' }}>
            Beberapa metode pembayaran memiliki selisih antara sistem dan actual amount. Harap periksa kembali sebelum melakukan closing.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {paymentSummaries.map((summary) => {
              const difference = paymentDifferences[summary.method] || 0;
              if (Math.abs(difference) > 0.01) {
                return (
                  <div
                    key={summary.method}
                    style={{
                      padding: '8px 12px',
                      background: 'rgba(255, 107, 107, 0.1)',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#ff6b6b',
                    }}
                  >
                    <strong>{summary.label}:</strong> {difference > 0 ? '+' : ''}Rp {Math.abs(difference).toLocaleString('id-ID')}
                  </div>
                );
              }
              return null;
            })}
          </div>
        </motion.div>
      )}

      {/* Close Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="card"
        style={{ marginBottom: '24px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '4px' }}>Settlement</h2>
            <p style={{ fontSize: '14px', color: '#a0a0b0' }}>
              Pastikan semua actual amount sudah diisi sebelum melakukan closing
            </p>
          </div>
          <button
            className={`btn ${isClosed ? 'btn-secondary' : allPaymentMethodsFilled ? 'btn-primary' : 'btn-secondary'}`}
            onClick={handleClose}
            disabled={isClosed || !allPaymentMethodsFilled}
            style={{ minWidth: '150px', fontSize: '16px', fontWeight: 700 }}
          >
            {isClosed ? (
              <>
                <CheckCircle size={20} />
                Closed
              </>
            ) : (
              <>
                <Lock size={20} />
                Close Settlement
              </>
            )}
          </button>
        </div>
        {!allPaymentMethodsFilled && paymentSummaries.length > 0 && (
          <div style={{ padding: '12px', background: 'rgba(255, 193, 7, 0.1)', borderRadius: '8px', border: '1px solid #ffc107' }}>
            <p style={{ fontSize: '12px', color: '#ffc107' }}>
              ⚠ Harap isi semua actual amount untuk setiap metode pembayaran terlebih dahulu
            </p>
          </div>
        )}
      </motion.div>

      {/* Notes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="card"
        style={{ marginBottom: '24px' }}
      >
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>Catatan</h2>
        <textarea
          className="input"
          placeholder="Tambahkan catatan untuk laporan ini..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          style={{ resize: 'vertical' }}
        />
      </motion.div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .card, .card * {
            visibility: visible;
          }
          .card {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          button {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

