import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/store/useStore';
import { motion } from 'framer-motion';
import { TrendingUp, Package, ShoppingCart, DollarSign, BarChart3, Calendar, Printer, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import LicenseCountdownBadge from '@/components/LicenseCountdownBadge';
import { useNotification } from '@/components/NotificationProvider';

type PeriodFilter = 'today' | 'yesterday' | 'thisMonth' | 'custom';

export default function Dashboard() {
  const { orders, products, categories, loadOrders, loadProducts, loadCategories, currentUser, settings } = useStore();
  const { notify } = useNotification();
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    loadOrders();
    loadProducts();
    loadCategories();
  }, [loadOrders, loadProducts, loadCategories]);

  // Filter orders based on selected period
  const filteredOrders = useMemo(() => {
    const now = new Date();
    let startDate: string;
    let endDate: string;

    switch (periodFilter) {
      case 'today':
        startDate = now.toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
        break;
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        startDate = yesterday.toISOString().split('T')[0];
        endDate = yesterday.toISOString().split('T')[0];
        break;
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
        break;
      case 'custom':
        if (!customStartDate || !customEndDate) return [];
        startDate = customStartDate;
        endDate = customEndDate;
        break;
      default:
        return [];
    }

    return orders.filter((o) => {
      const orderDate = o.createdAt.split('T')[0];
      return orderDate >= startDate && orderDate <= endDate;
    });
  }, [orders, periodFilter, customStartDate, customEndDate]);

  const periodOrders = filteredOrders.filter((o) => o.status === 'completed');
  const periodRevenue = periodOrders.reduce((sum, o) => sum + o.total, 0);
  const periodTransactionCount = periodOrders.length;
  const totalProducts = products.length;
  const lowStockProducts = products.filter((p) => p.stock < 10).length;

  const getPeriodLabel = () => {
    switch (periodFilter) {
      case 'today':
        return 'Hari Ini';
      case 'yesterday':
        return 'Kemarin';
      case 'thisMonth':
        return 'Bulan Ini';
      case 'custom':
        return customStartDate && customEndDate
          ? `${new Date(customStartDate).toLocaleDateString('id-ID')} - ${new Date(customEndDate).toLocaleDateString('id-ID')}`
          : 'Custom';
      default:
        return 'Hari Ini';
    }
  };

  const stats = [
    {
      label: `Pendapatan ${getPeriodLabel()}`,
      value: `Rp ${periodRevenue.toLocaleString('id-ID')}`,
      icon: DollarSign,
      color: '#00ff88',
      change: `${periodTransactionCount} transaksi`,
    },
    {
      label: 'Total Produk',
      value: totalProducts.toString(),
      icon: Package,
      color: '#00d4ff',
      change: '+5',
    },
    {
      label: `Pesanan ${getPeriodLabel()}`,
      value: periodTransactionCount.toString(),
      icon: ShoppingCart,
      color: '#ff6b6b',
      change: 'Completed',
    },
    {
      label: 'Stok Menipis',
      value: lowStockProducts.toString(),
      icon: TrendingUp,
      color: '#ffe66d',
      change: 'Perlu restock',
    },
  ];

  const recentOrders = filteredOrders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Calculate top 10 products by quantity sold
  const topProducts = useMemo(() => {
    const productSales: { [key: string]: { productId: string; productName: string; quantity: number; revenue: number } } = {};

    periodOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            productId: item.productId,
            productName: item.productName,
            quantity: 0,
            revenue: 0,
          };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += item.subtotal;
      });
    });

    return Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  }, [periodOrders]);

  // Calculate revenue by category
  const revenueByCategory = useMemo(() => {
    const categoryRevenue: { [key: string]: { name: string; revenue: number; count: number; cost: number; profit: number; margin: number } } = {};

    // Calculate revenue from filtered completed orders
    periodOrders.forEach((order) => {
        order.items.forEach((item) => {
          const product = products.find((p) => p.id === item.productId);
          if (product && product.category) {
            // Find category name from categories list
            const category = categories.find((c) => c.id === product.category);
            const categoryName = category ? category.name : product.category;
            const costingPercentage = category?.costingPercentage || 0;
            
            if (!categoryRevenue[product.category]) {
              categoryRevenue[product.category] = {
                name: categoryName,
                revenue: 0,
                count: 0,
                cost: 0,
                profit: 0,
                margin: 0,
              };
            }
            const itemRevenue = item.subtotal;
            const itemCost = itemRevenue * (costingPercentage / 100);
            const itemProfit = itemRevenue - itemCost;
            
            categoryRevenue[product.category].revenue += itemRevenue;
            categoryRevenue[product.category].cost += itemCost;
            categoryRevenue[product.category].profit += itemProfit;
            categoryRevenue[product.category].count += item.quantity;
          }
        });
      });

    // Calculate margin percentage for each category
    Object.keys(categoryRevenue).forEach((key) => {
      const cat = categoryRevenue[key];
      cat.margin = cat.revenue > 0 ? (cat.profit / cat.revenue) * 100 : 0;
    });

    // Convert to array and sort by revenue
    return Object.values(categoryRevenue)
      .filter((cat) => cat.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue);
  }, [periodOrders, products, categories]);

  const totalRevenue = useMemo(() => {
    return revenueByCategory.reduce((sum, cat) => sum + cat.revenue, 0);
  }, [revenueByCategory]);

  const totalCost = useMemo(() => {
    return revenueByCategory.reduce((sum, cat) => sum + cat.cost, 0);
  }, [revenueByCategory]);

  const totalProfit = useMemo(() => {
    return revenueByCategory.reduce((sum, cat) => sum + cat.profit, 0);
  }, [revenueByCategory]);

  const totalMargin = useMemo(() => {
    return totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  }, [totalRevenue, totalProfit]);

  const generateReportContent = () => {
    const lines: string[] = [];
    const periodLabel = getPeriodLabel();
    const now = new Date();

    lines.push('='.repeat(60));
    lines.push('DASHBOARD REPORT');
    lines.push('='.repeat(60));
    lines.push(`Periode: ${periodLabel}`);
    lines.push(`Tanggal Laporan: ${now.toLocaleString('id-ID')}`);
    lines.push(`Dibuat oleh: ${currentUser?.username || 'System'}`);
    lines.push('='.repeat(60));
    lines.push('');

    // Summary Stats
    lines.push('RINGKASAN');
    lines.push('-'.repeat(60));
    lines.push(`Pendapatan ${periodLabel}: Rp ${periodRevenue.toLocaleString('id-ID')}`);
    lines.push(`Total Transaksi: ${periodTransactionCount}`);
    lines.push(`Total Produk: ${totalProducts}`);
    lines.push(`Stok Menipis: ${lowStockProducts}`);
    lines.push('');

    // Profit & Margin
    if (revenueByCategory.length > 0) {
      lines.push('MARGIN & PROFIT');
      lines.push('-'.repeat(60));
      lines.push(`Total Revenue: Rp ${totalRevenue.toLocaleString('id-ID')}`);
      lines.push(`Total Cost: Rp ${totalCost.toLocaleString('id-ID')}`);
      lines.push(`Total Profit: Rp ${totalProfit.toLocaleString('id-ID')}`);
      lines.push(`Margin: ${totalMargin.toFixed(1)}%`);
      lines.push('');
    }

    // Revenue by Category
    if (revenueByCategory.length > 0) {
      lines.push('OMSET PER KATEGORI');
      lines.push('-'.repeat(60));
      revenueByCategory.forEach((cat, index) => {
        lines.push(`${index + 1}. ${cat.name}`);
        lines.push(`   Revenue: Rp ${cat.revenue.toLocaleString('id-ID')}`);
        lines.push(`   Cost: Rp ${cat.cost.toLocaleString('id-ID')}`);
        lines.push(`   Profit: Rp ${cat.profit.toLocaleString('id-ID')}`);
        lines.push(`   Margin: ${cat.margin.toFixed(1)}%`);
        lines.push(`   Item Terjual: ${cat.count}`);
        lines.push('');
      });
    }

    // Top 10 Products
    if (topProducts.length > 0) {
      lines.push('TOP 10 PRODUK TERLARIS');
      lines.push('-'.repeat(60));
      topProducts.forEach((product, index) => {
        lines.push(`${index + 1}. ${product.productName}`);
        lines.push(`   Terjual: ${product.quantity} unit`);
        lines.push(`   Revenue: Rp ${product.revenue.toLocaleString('id-ID')}`);
        lines.push('');
      });
    }

    // Recent Orders
    if (recentOrders.length > 0) {
      lines.push('PESANAN TERBARU');
      lines.push('-'.repeat(60));
      recentOrders.slice(0, 10).forEach((order, index) => {
        lines.push(`${index + 1}. Order #${order.id.slice(-6)}`);
        lines.push(`   User: ${order.userName}`);
        lines.push(`   Total: Rp ${order.total.toLocaleString('id-ID')}`);
        lines.push(`   Status: ${order.status === 'completed' ? 'Selesai' : order.status === 'pending' ? 'Pending' : 'Batal'}`);
        lines.push(`   Tanggal: ${new Date(order.createdAt).toLocaleString('id-ID')}`);
        if (order.tableNumber) {
          lines.push(`   Meja: ${order.tableNumber}`);
        }
        lines.push('');
      });
    }

    lines.push('='.repeat(60));
    lines.push('Laporan ini dibuat secara otomatis oleh sistem');
    lines.push('='.repeat(60));

    return lines.join('\n');
  };

  const handlePrint = () => {
    // Check if print is available (may not work on mobile/Android)
    if (typeof window.print === 'function' && typeof window.open === 'function') {
      try {
        const content = generateReportContent();
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Dashboard Report - ${getPeriodLabel()}</title>
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
                  @media print {
                    body {
                      margin: 0;
                      padding: 10px;
                    }
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
          // Fallback: save as PDF if popup blocked (common on mobile)
          handleSavePDF();
        }
      } catch (e) {
        // Fallback: save as PDF if print window fails
        handleSavePDF();
      }
    } else {
      // Fallback for Android: save as PDF
      handleSavePDF();
    }
  };

  const handleSavePDF = () => {
    const doc = new jsPDF('portrait', 'mm', 'a4');
    const periodLabel = getPeriodLabel();
    const now = new Date();
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 15;
    let yPos = margin;
    
    // Helper function to draw horizontal line
    const drawLine = (y: number) => {
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
    };
    
    // Helper function to add new page if needed
    const checkNewPage = (requiredSpace: number) => {
      if (yPos + requiredSpace > pageHeight - 20) {
        doc.addPage();
        yPos = margin;
        return true;
      }
      return false;
    };
    
    // Header like letterhead (kop surat) - logo left, text right, line below
    const logoAreaWidth = settings.receiptLogo ? 45 : 0;
    const contentStartX = margin + logoAreaWidth + (settings.receiptLogo ? 10 : 0);
    
    // Add logo on the left side if available (maintain aspect ratio)
    if (settings.receiptLogo) {
      try {
        // Create image to get dimensions
        const img = new Image();
        img.src = settings.receiptLogo;
        
        // Extract base64 data
        let imageData = settings.receiptLogo;
        let imageFormat = 'PNG';
        
        if (imageData.startsWith('data:')) {
          const formatMatch = imageData.match(/data:image\/(\w+);base64,/);
          if (formatMatch) {
            imageFormat = formatMatch[1].toUpperCase();
            if (imageFormat === 'JPEG') imageFormat = 'JPG';
          }
        } else if (imageData.startsWith('/')) {
          imageData = '';
        }
        
        if (imageData && imageData.startsWith('data:')) {
          // Fixed size to maintain aspect ratio (square-ish or maintain original)
          const logoSize = 30; // 30mm x 30mm untuk proporsi yang baik
          const logoX = margin;
          const logoY = yPos;
          
          doc.addImage(imageData, imageFormat, logoX, logoY, logoSize, logoSize);
        }
      } catch (error) {
        console.error('Error adding logo to PDF:', error);
      }
    }
    
    // Company name and report info on the right side
    const textYStart = yPos;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(settings.companyName || 'Noxtiz Culinary Lab', contentStartX, textYStart);
    
    // Report title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DASHBOARD REPORT', contentStartX, textYStart + 8);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Periode: ${periodLabel}`, contentStartX, textYStart + 15);
    doc.text(`${now.toLocaleString('id-ID')} | ${currentUser?.username || 'System'}`, contentStartX, textYStart + 21);
    
    // Draw horizontal line below header (like letterhead)
    const headerBottom = yPos + (settings.receiptLogo ? 30 : 25);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(margin, headerBottom, pageWidth - margin, headerBottom);
    
    yPos = headerBottom + 8;
    
    doc.setTextColor(0, 0, 0);
    
    // Summary Stats - Card Style (2x2 Grid)
    checkNewPage(50);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('RINGKASAN', margin, yPos);
    yPos += 8;
    drawLine(yPos);
    yPos += 8;
    
    const summaryData = [
      { label: `Pendapatan ${periodLabel}`, value: `Rp ${periodRevenue.toLocaleString('id-ID')}`, color: [0, 255, 136] },
      { label: 'Total Transaksi', value: periodTransactionCount.toString(), color: [255, 107, 107] },
      { label: 'Total Produk', value: totalProducts.toString(), color: [0, 212, 255] },
      { label: 'Stok Menipis', value: lowStockProducts.toString(), color: [255, 230, 109] },
    ];
    
    const cardWidth = 85;
    const cardHeight = 18;
    const cardGap = 10;
    const startY = yPos;
    
    summaryData.forEach((item, index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      const xPos = margin + col * (cardWidth + cardGap);
      const currentY = startY + row * (cardHeight + 8);
      
      // Colored box
      doc.setFillColor(item.color[0], item.color[1], item.color[2]);
      doc.roundedRect(xPos, currentY, cardWidth, cardHeight, 3, 3, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(item.label, xPos + 4, currentY + 6);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(item.value, xPos + 4, currentY + 13);
    });
    
    yPos = startY + (2 * (cardHeight + 8)) + 5;
    
    // Profit & Margin - Card Style (2x2 Grid)
    if (revenueByCategory.length > 0) {
      checkNewPage(50);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('MARGIN & PROFIT', margin, yPos);
      yPos += 8;
      drawLine(yPos);
      yPos += 8;
      
      const profitData = [
        { label: 'Total Revenue', value: `Rp ${totalRevenue.toLocaleString('id-ID')}`, color: [0, 255, 136] },
        { label: 'Total Cost', value: `Rp ${totalCost.toLocaleString('id-ID')}`, color: [255, 107, 107] },
        { label: 'Total Profit', value: `Rp ${totalProfit.toLocaleString('id-ID')}`, color: [0, 212, 255] },
        { label: 'Margin', value: `${totalMargin.toFixed(1)}%`, color: totalMargin >= 50 ? [0, 255, 136] : totalMargin >= 30 ? [255, 230, 109] : [255, 107, 107] },
      ];
      
      const profitCardWidth = 85;
      const profitCardHeight = 20;
      const profitCardGap = 10;
      const profitStartY = yPos;
      
      profitData.forEach((item, index) => {
        const row = Math.floor(index / 2);
        const col = index % 2;
        const xPos = margin + col * (profitCardWidth + profitCardGap);
        const currentY = profitStartY + row * (profitCardHeight + 8);
        
        // Card background
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(xPos, currentY, profitCardWidth, profitCardHeight, 3, 3, 'F');
        
        // Colored accent bar
        doc.setFillColor(item.color[0], item.color[1], item.color[2]);
        doc.rect(xPos, currentY, 4, profitCardHeight, 'F');
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(item.label, xPos + 7, currentY + 7);
        
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(item.value, xPos + 7, currentY + 15);
      });
      
      yPos = profitStartY + (2 * (profitCardHeight + 8)) + 5;
    }
    
    // Revenue by Category - Table Style
    if (revenueByCategory.length > 0) {
      checkNewPage(60);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('OMSET PER KATEGORI', margin, yPos);
      yPos += 8;
      drawLine(yPos);
      yPos += 8;
      
      // Table header
      const tableWidth = pageWidth - (margin * 2);
      const colPositions = [margin + 2, margin + 52, margin + 92, margin + 127, margin + 162];
      
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, yPos - 7, tableWidth, 9, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Kategori', colPositions[0], yPos);
      doc.text('Revenue', colPositions[1], yPos);
      doc.text('Cost', colPositions[2], yPos);
      doc.text('Profit', colPositions[3], yPos);
      doc.text('Margin', colPositions[4], yPos);
      yPos += 12;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      revenueByCategory.forEach((cat, index) => {
        checkNewPage(12);
        if (index > 0) {
          drawLine(yPos - 4);
          yPos += 3;
        }
        
        doc.setFont('helvetica', 'bold');
        doc.text(cat.name.length > 20 ? cat.name.substring(0, 20) + '...' : cat.name, colPositions[0], yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(`Rp ${cat.revenue.toLocaleString('id-ID')}`, colPositions[1], yPos);
        doc.text(`Rp ${cat.cost.toLocaleString('id-ID')}`, colPositions[2], yPos);
        doc.text(`Rp ${cat.profit.toLocaleString('id-ID')}`, colPositions[3], yPos);
        
        // Margin with color
        const marginColor = cat.margin >= 50 ? [0, 255, 136] : cat.margin >= 30 ? [255, 230, 109] : [255, 107, 107];
        doc.setTextColor(marginColor[0], marginColor[1], marginColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text(`${cat.margin.toFixed(1)}%`, colPositions[4], yPos);
        doc.setTextColor(0, 0, 0);
        
        yPos += 9;
      });
      yPos += 5;
    }
    
    // Top 10 Products - Table Style
    if (topProducts.length > 0) {
      checkNewPage(60);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('TOP 10 PRODUK TERLARIS', margin, yPos);
      yPos += 8;
      drawLine(yPos);
      yPos += 8;
      
      // Table header
      const tableWidth = pageWidth - (margin * 2);
      const prodColPositions = [margin + 2, margin + 15, margin + 110, margin + 150];
      
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, yPos - 7, tableWidth, 9, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Rank', prodColPositions[0], yPos);
      doc.text('Produk', prodColPositions[1], yPos);
      doc.text('Terjual', prodColPositions[2], yPos);
      doc.text('Revenue', prodColPositions[3], yPos);
      yPos += 12;
      
      doc.setFontSize(10);
      topProducts.forEach((product, index) => {
        checkNewPage(11);
        if (index > 0) {
          drawLine(yPos - 4);
          yPos += 3;
        }
        
        // Rank badge
        doc.setFillColor(0, 255, 136);
        doc.circle(prodColPositions[0] + 3, yPos - 2, 3.5, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text((index + 1).toString(), prodColPositions[0] + 3, yPos, { align: 'center' });
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        const productName = product.productName.length > 25 ? product.productName.substring(0, 25) + '...' : product.productName;
        doc.text(productName, prodColPositions[1], yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(`${product.quantity} unit`, prodColPositions[2], yPos);
        doc.text(`Rp ${product.revenue.toLocaleString('id-ID')}`, prodColPositions[3], yPos);
        
        yPos += 9;
      });
      yPos += 5;
    }
    
    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      drawLine(pageHeight - 15);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Laporan ini dibuat secara otomatis oleh sistem - Halaman ${i} dari ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }
    
    // Save PDF - compatible with Android
    try {
      const periodLabelSafe = periodLabel.replace(/\s+/g, '-');
      const filename = `dashboard-report-${periodLabelSafe}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
    } catch (error) {
      // Fallback: try to get PDF as blob and download
      try {
        const pdfBlob = doc.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-report-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (e) {
        console.error('Error saving PDF:', e);
        notify({
          type: 'error',
          title: 'Export PDF gagal',
          message: 'PDF belum kesave. Coba ulang sebentar lagi.',
        });
      }
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
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
              Dashboard
            </h1>
            <p style={{ color: '#a0a0b0', fontSize: '16px' }}>
              Selamat datang, {currentUser?.username}! 👨‍🍳
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <LicenseCountdownBadge />
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
            <button 
              className="btn btn-secondary" 
              onClick={handleSavePDF}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleSavePDF();
              }}
            >
              <Download size={18} />
              Save PDF
            </button>
          </div>
        </div>
      </div>

      {/* Period Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
        style={{ marginBottom: '24px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Calendar size={20} color="#00ff88" />
          <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Filter Periode</h3>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: periodFilter === 'custom' ? '16px' : '0' }}>
          <button
            className={`btn ${periodFilter === 'today' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setPeriodFilter('today')}
          >
            Hari Ini
          </button>
          <button
            className={`btn ${periodFilter === 'yesterday' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setPeriodFilter('yesterday')}
          >
            Kemarin
          </button>
          <button
            className={`btn ${periodFilter === 'thisMonth' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setPeriodFilter('thisMonth')}
          >
            Bulan Ini
          </button>
          <button
            className={`btn ${periodFilter === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setPeriodFilter('custom')}
          >
            Custom
          </button>
        </div>
        {periodFilter === 'custom' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                Dari Tanggal
              </label>
              <input
                type="date"
                className="input"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                Sampai Tanggal
              </label>
              <input
                type="date"
                className="input"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                min={customStartDate}
              />
            </div>
          </div>
        )}
      </motion.div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '32px',
        }}
      >
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card"
              style={{
                borderLeft: `4px solid ${stat.color}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#a0a0b0', fontSize: '14px', marginBottom: '8px' }}>
                    {stat.label}
                  </p>
                  <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>
                    {stat.value}
                  </h2>
                  <p style={{ color: stat.color, fontSize: '12px', fontWeight: 600 }}>
                    {stat.change}
                  </p>
                </div>
                <div
                  style={{
                    padding: '12px',
                    background: `${stat.color}20`,
                    borderRadius: '8px',
                  }}
                >
                  <Icon size={24} color={stat.color} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Profit & Margin Summary */}
      {revenueByCategory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card"
          style={{ marginTop: '24px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <TrendingUp size={24} color="#00ff88" />
            <h3 style={{ fontSize: '20px', fontWeight: 600 }}>Margin & Profit</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <p style={{ fontSize: '12px', color: '#a0a0b0', marginBottom: '8px' }}>Total Revenue</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: '#00ff88' }}>
                Rp {totalRevenue.toLocaleString('id-ID')}
              </p>
            </div>
            <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <p style={{ fontSize: '12px', color: '#a0a0b0', marginBottom: '8px' }}>Total Cost</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: '#ff6b6b' }}>
                Rp {totalCost.toLocaleString('id-ID')}
              </p>
            </div>
            <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <p style={{ fontSize: '12px', color: '#a0a0b0', marginBottom: '8px' }}>Total Profit</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: '#00d4ff' }}>
                Rp {totalProfit.toLocaleString('id-ID')}
              </p>
            </div>
            <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <p style={{ fontSize: '12px', color: '#a0a0b0', marginBottom: '8px' }}>Margin</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: totalMargin >= 50 ? '#00ff88' : totalMargin >= 30 ? '#ffe66d' : '#ff6b6b' }}>
                {totalMargin.toFixed(1)}%
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Top 10 Products */}
      {topProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="card"
          style={{ marginTop: '24px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <TrendingUp size={24} color="#00ff88" />
            <h3 style={{ fontSize: '20px', fontWeight: 600 }}>Top 10 Produk Terlaris</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            {topProducts.map((product, index) => {
              const colors = ['#00ff88', '#00d4ff', '#ffe66d', '#ff6b6b', '#ff9ff3', '#54a0ff'];
              const color = colors[index % colors.length];
              
              return (
                <div
                  key={product.productId}
                  style={{
                    padding: '16px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '8px',
                    border: `2px solid ${color}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: `${color}20`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: 700,
                            color: color,
                            flexShrink: 0,
                          }}
                        >
                          #{index + 1}
                        </div>
                        <h4 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>{product.productName}</h4>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#a0a0b0' }}>Terjual:</span>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: color }}>
                        {product.quantity} unit
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#a0a0b0' }}>Revenue:</span>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#00ff88' }}>
                        Rp {product.revenue.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${topProducts.length > 0 ? (product.quantity / topProducts[0].quantity) * 100 : 0}%`,
                        height: '100%',
                        background: color,
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Revenue by Category */}
      {revenueByCategory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="card"
          style={{ marginTop: '24px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <BarChart3 size={24} color="#00ff88" />
            <h3 style={{ fontSize: '20px', fontWeight: 600 }}>Omset per Kategori</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {revenueByCategory.map((cat, index) => {
              const percentage = totalRevenue > 0 ? (cat.revenue / totalRevenue) * 100 : 0;
              const colors = ['#00ff88', '#00d4ff', '#ffe66d', '#ff6b6b', '#ff9ff3', '#54a0ff'];
              const color = colors[index % colors.length];
              
              return (
                <div
                  key={cat.name}
                  style={{
                    padding: '16px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '8px',
                    border: `2px solid ${color}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>{cat.name}</h4>
                      <p style={{ fontSize: '12px', color: '#a0a0b0' }}>
                        {cat.count} item terjual
                      </p>
                    </div>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: `${color}20`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <BarChart3 size={20} color={color} />
                    </div>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#a0a0b0' }}>Revenue:</span>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: color }}>
                        Rp {cat.revenue.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#a0a0b0' }}>Cost:</span>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#ff6b6b' }}>
                        Rp {cat.cost.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#a0a0b0' }}>Profit:</span>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#00d4ff' }}>
                        Rp {cat.profit.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#a0a0b0' }}>Margin:</span>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: cat.margin >= 50 ? '#00ff88' : cat.margin >= 30 ? '#ffe66d' : '#ff6b6b' }}>
                        {cat.margin.toFixed(1)}%
                      </span>
                    </div>
                    <p style={{ fontSize: '11px', color: '#606070', marginTop: '8px' }}>
                      {percentage.toFixed(1)}% dari total omset
                    </p>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${percentage}%`,
                        height: '100%',
                        background: color,
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Pesanan Terbaru & Stok Menipis - Paling Bawah */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '20px',
          marginTop: '24px',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="card"
        >
          <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px' }}>
            Pesanan Terbaru
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  style={{
                    padding: '16px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <p style={{ fontWeight: 600, marginBottom: '4px' }}>#{order.id.slice(-6)}</p>
                      <p style={{ color: '#a0a0b0', fontSize: '14px' }}>{order.userName}</p>
                      <p style={{ color: '#606070', fontSize: '12px', marginTop: '4px' }}>
                        {new Date(order.createdAt).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: 700, fontSize: '18px', color: '#00ff88' }}>
                        Rp {order.total.toLocaleString('id-ID')}
                      </p>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          borderRadius: '4px',
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
                          marginTop: '4px',
                        }}
                      >
                        {order.status === 'completed' ? 'Selesai' : order.status === 'pending' ? 'Pending' : 'Batal'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: '#606070', textAlign: 'center', padding: '40px' }}>
                Belum ada pesanan
              </p>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="card"
        >
          <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px' }}>
            Produk Stok Menipis
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {products
              .filter((p) => p.stock < 10)
              .slice(0, 5)
              .map((product) => (
                <div
                  key={product.id}
                  style={{
                    padding: '16px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <p style={{ fontWeight: 600, marginBottom: '4px' }}>{product.name}</p>
                    <p style={{ color: '#a0a0b0', fontSize: '14px' }}>
                      {categories.find((c) => c.id === product.category)?.name || product.category}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p
                      style={{
                        fontWeight: 700,
                        fontSize: '18px',
                        color: product.stock < 5 ? '#ff6b6b' : '#ffe66d',
                      }}
                    >
                      {product.stock} unit
                    </p>
                  </div>
                </div>
              ))}
            {lowStockProducts === 0 && (
              <p style={{ color: '#606070', textAlign: 'center', padding: '40px' }}>
                Semua stok aman
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

