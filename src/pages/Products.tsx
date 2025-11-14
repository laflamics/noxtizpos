import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Search, X, Upload, Download, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Products() {
  const { products, categories, loadProducts, loadCategories, createProduct, updateProduct, deleteProduct, updateCategory, currentUser, storage } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [editingCategoryCosting, setEditingCategoryCosting] = useState<string | null>(null);
  const [costingPercentage, setCostingPercentage] = useState<string>('');

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [loadProducts, loadCategories]);

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      price: parseFloat(formData.get('price') as string),
      category: formData.get('category') as string,
      stock: parseInt(formData.get('stock') as string),
      barcode: formData.get('barcode') as string,
    };

    try {
      if (editingProduct) {
        const oldProduct = products.find(p => p.id === editingProduct.id);
        await updateProduct(editingProduct.id, data);
        
        // Log product update
        if (storage && currentUser) {
          await storage.createActivityLog({
            category: 'product',
            action: 'update',
            description: `Update produk: ${data.name}`,
            userId: currentUser.id,
            userName: currentUser.username,
            details: {
              productId: editingProduct.id,
              productName: data.name,
              previousValue: oldProduct,
              newValue: { ...oldProduct, ...data },
            },
          });
        }
      } else {
        const newProduct = await createProduct(data);
        
        // Log product create
        if (storage && currentUser) {
          await storage.createActivityLog({
            category: 'product',
            action: 'create',
            description: `Tambah produk baru: ${data.name}`,
            userId: currentUser.id,
            userName: currentUser.username,
            details: {
              productId: newProduct.id,
              productName: data.name,
              price: data.price,
              stock: data.stock,
              category: data.category,
            },
          });
        }
      }
      setShowModal(false);
      setEditingProduct(null);
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Gagal menyimpan produk');
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  // Download template Excel/CSV
  const downloadTemplate = () => {
    const templateData = [
      {
        'Nama Produk': 'Contoh Produk 1',
        'Deskripsi': 'Deskripsi produk',
        'Harga': 25000,
        'Kategori ID': 'cat-1',
        'Stok': 100,
        'Barcode': 'PROD001',
      },
      {
        'Nama Produk': 'Contoh Produk 2',
        'Deskripsi': 'Deskripsi produk 2',
        'Harga': 30000,
        'Kategori ID': 'cat-2',
        'Stok': 50,
        'Barcode': 'PROD002',
      },
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 20 }, // Nama Produk
      { wch: 30 }, // Deskripsi
      { wch: 12 }, // Harga
      { wch: 15 }, // Kategori ID
      { wch: 10 }, // Stok
      { wch: 15 }, // Barcode
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Template Produk');
    XLSX.writeFile(wb, 'Template_Import_Produk.xlsx');
  };

  // Handle file import
  const handleFileImport = async (file: File) => {
    setIsImporting(true);
    setImportError('');
    setImportSuccess('');

    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      let jsonData: any[] = [];

      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Parse Excel
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        jsonData = XLSX.utils.sheet_to_json(worksheet);
      } else if (fileExtension === 'csv') {
        // Parse CSV (simple parser, handles quoted values)
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
          throw new Error('File CSV kosong');
        }

        // Parse header
        const parseCSVLine = (line: string): string[] => {
          const result: string[] = [];
          let current = '';
          let inQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };

        const headers = parseCSVLine(lines[0]);
        
        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim()) {
            const values = parseCSVLine(lines[i]);
            const row: any = {};
            headers.forEach((header, index) => {
              row[header] = (values[index] || '').replace(/^"|"$/g, ''); // Remove quotes
            });
            jsonData.push(row);
          }
        }
      } else {
        throw new Error('Format file tidak didukung. Gunakan Excel (.xlsx, .xls) atau CSV (.csv)');
      }

      if (jsonData.length === 0) {
        throw new Error('File kosong atau tidak valid');
      }

      // Validate and import products
      const errors: string[] = [];
      const successCount = { created: 0, updated: 0 };
      
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        const rowNum = i + 2; // +2 karena header dan 0-based index

        try {
          // Map column names (support both Indonesian and English)
          const name = row['Nama Produk'] || row['Name'] || row['nama'] || row['name'];
          const description = row['Deskripsi'] || row['Description'] || row['deskripsi'] || row['description'] || '';
          const price = parseFloat(row['Harga'] || row['Price'] || row['harga'] || row['price'] || '0');
          const categoryId = row['Kategori ID'] || row['Category ID'] || row['Category'] || row['category'] || row['kategori'] || row['kategori_id'];
          const stock = parseInt(row['Stok'] || row['Stock'] || row['stok'] || row['stock'] || '0');
          const barcode = row['Barcode'] || row['barcode'] || '';

          // Validation
          if (!name || name.trim() === '') {
            errors.push(`Baris ${rowNum}: Nama produk wajib diisi`);
            continue;
          }

          if (isNaN(price) || price <= 0) {
            errors.push(`Baris ${rowNum}: Harga harus berupa angka positif`);
            continue;
          }

          if (!categoryId || categoryId.trim() === '') {
            errors.push(`Baris ${rowNum}: Kategori ID wajib diisi`);
            continue;
          }

          // Check if category exists
          const categoryExists = categories.find(c => c.id === categoryId);
          if (!categoryExists) {
            errors.push(`Baris ${rowNum}: Kategori dengan ID "${categoryId}" tidak ditemukan`);
            continue;
          }

          if (isNaN(stock) || stock < 0) {
            errors.push(`Baris ${rowNum}: Stok harus berupa angka >= 0`);
            continue;
          }

          // Check if product exists (by name or barcode)
          const existingProduct = products.find(
            p => p.name.toLowerCase() === name.toLowerCase().trim() || 
            (barcode && p.barcode && p.barcode === barcode.trim())
          );

          const productData = {
            name: name.trim(),
            description: description?.trim() || '',
            price: price,
            category: categoryId.trim(),
            stock: stock,
            barcode: barcode?.trim() || '',
          };

          if (existingProduct) {
            // Update existing product
            await updateProduct(existingProduct.id, productData);
            successCount.updated++;
          } else {
            // Create new product
            await createProduct(productData);
            successCount.created++;
          }
        } catch (error) {
          errors.push(`Baris ${rowNum}: ${error instanceof Error ? error.message : 'Error tidak diketahui'}`);
        }
      }

      // Reload products
      await loadProducts();

      // Log import activity
      if (storage && currentUser) {
        await storage.createActivityLog({
          category: 'product',
          action: 'import',
          description: `Import produk: ${successCount.created} baru, ${successCount.updated} diupdate`,
          userId: currentUser.id,
          userName: currentUser.username,
          details: {
            totalRows: jsonData.length,
            created: successCount.created,
            updated: successCount.updated,
            errors: errors.length,
            fileName: file.name,
          },
        });
      }

      if (errors.length > 0) {
        setImportError(`Import selesai dengan ${errors.length} error:\n${errors.slice(0, 10).join('\n')}${errors.length > 10 ? `\n... dan ${errors.length - 10} error lainnya` : ''}`);
      }

      if (successCount.created > 0 || successCount.updated > 0) {
        setImportSuccess(`Berhasil import: ${successCount.created} produk baru, ${successCount.updated} produk diupdate`);
      }

      if (errors.length === 0 && successCount.created === 0 && successCount.updated === 0) {
        setImportError('Tidak ada produk yang diimport. Pastikan format file sesuai template.');
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportError(error instanceof Error ? error.message : 'Gagal mengimport produk');
    } finally {
      setIsImporting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus produk ini?')) {
      try {
        const product = products.find(p => p.id === id);
        await deleteProduct(id);
        
        // Log product delete
        if (storage && currentUser && product) {
          await storage.createActivityLog({
            category: 'product',
            action: 'delete',
            description: `Hapus produk: ${product.name}`,
            userId: currentUser.id,
            userName: currentUser.username,
            details: {
              productId: id,
              productName: product.name,
              previousValue: product,
            },
          });
        }
      } catch (error) {
        console.error('Failed to delete product:', error);
        alert('Gagal menghapus produk');
      }
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
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
            Produk
          </h1>
          <p style={{ color: '#a0a0b0', fontSize: '16px' }}>Kelola produk dan stok</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={downloadTemplate}
          >
            <Download size={18} />
            Download Template
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setShowImportModal(true);
              setImportError('');
              setImportSuccess('');
            }}
          >
            <Upload size={18} />
            Import Produk
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingProduct(null);
              setShowModal(true);
            }}
          >
            <Plus size={18} />
            Tambah Produk
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
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
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className={`btn ${selectedCategory === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedCategory('all')}
          >
            Semua
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`btn ${selectedCategory === cat.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px',
        }}
      >
        {filteredProducts.map((product) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div
              style={{
                width: '100%',
                height: '180px',
                background: 'var(--bg-tertiary)',
                borderRadius: '8px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '64px',
              }}
            >
              {product.image ? (
                <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
              ) : (
                <span>🍽️</span>
              )}
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>{product.name}</h3>
            {product.description && (
              <p style={{ color: '#a0a0b0', fontSize: '14px', marginBottom: '12px' }}>{product.description}</p>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <p style={{ color: '#00ff88', fontSize: '20px', fontWeight: 700 }}>
                  Rp {product.price.toLocaleString('id-ID')}
                </p>
                <p style={{ color: product.stock < 10 ? '#ffe66d' : '#a0a0b0', fontSize: '14px', marginTop: '4px' }}>
                  Stok: {product.stock}
                </p>
              </div>
              <span
                style={{
                  padding: '6px 12px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#a0a0b0',
                }}
              >
                {categories.find((c) => c.id === product.category)?.name || product.category}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => handleEdit(product)}
                style={{ flex: 1, padding: '10px', fontSize: '13px' }}
              >
                <Edit size={16} />
                Edit
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDelete(product.id)}
                style={{ padding: '10px', fontSize: '13px' }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </motion.div>
        ))}
        {filteredProducts.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: '#606070' }}>
            Tidak ada produk ditemukan
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
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
              setShowModal(false);
              setEditingProduct(null);
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
                <h2 style={{ fontSize: '24px', fontWeight: 700 }}>
                  {editingProduct ? 'Edit Produk' : 'Tambah Produk'}
                </h2>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProduct(null);
                  }}
                  style={{ padding: '8px', minWidth: 'auto' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                      Nama Produk *
                    </label>
                    <input
                      type="text"
                      name="name"
                      className="input"
                      defaultValue={editingProduct?.name}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                      Deskripsi
                    </label>
                    <textarea
                      name="description"
                      className="input"
                      defaultValue={editingProduct?.description}
                      rows={3}
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                        Harga *
                      </label>
                      <input
                        type="number"
                        name="price"
                        className="input"
                        defaultValue={editingProduct?.price}
                        step="0.01"
                        min="0"
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                        Stok *
                      </label>
                      <input
                        type="number"
                        name="stock"
                        className="input"
                        defaultValue={editingProduct?.stock}
                        min="0"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                      Kategori *
                    </label>
                    <select name="category" className="input" defaultValue={editingProduct?.category} required>
                      <option value="">Pilih kategori</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                      Barcode
                    </label>
                    <input
                      type="text"
                      name="barcode"
                      className="input"
                      defaultValue={editingProduct?.barcode}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowModal(false);
                      setEditingProduct(null);
                    }}
                    style={{ flex: 1 }}
                  >
                    Batal
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    {editingProduct ? 'Update' : 'Simpan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Import Modal */}
      <AnimatePresence>
        {showImportModal && (
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
              paddingTop: '20px',
              paddingBottom: '60px',
              overflowY: 'auto',
              overflowX: 'hidden',
            }}
            onClick={() => {
              if (!isImporting) {
                setShowImportModal(false);
                setImportError('');
                setImportSuccess('');
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card"
              style={{ 
                maxWidth: '600px', 
                width: '100%', 
                maxHeight: 'calc(100vh - 100px)', 
                overflow: 'hidden',
                marginTop: '0',
                marginBottom: '0',
                display: 'flex',
                flexDirection: 'column',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexShrink: 0 }}>
                <h2 style={{ fontSize: '24px', fontWeight: 700 }}>
                  Import Produk
                </h2>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    if (!isImporting) {
                      setShowImportModal(false);
                      setImportError('');
                      setImportSuccess('');
                    }
                  }}
                  style={{ padding: '8px', minWidth: 'auto' }}
                  disabled={isImporting}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
                <div style={{ marginBottom: '24px' }}>
                  <p style={{ color: '#a0a0b0', fontSize: '14px', marginBottom: '16px' }}>
                    Upload file Excel (.xlsx, .xls) atau CSV (.csv) untuk import produk. Download template terlebih dahulu untuk melihat format yang benar.
                  </p>
                  
                  <div
                    style={{
                      border: '2px dashed var(--border-color)',
                      borderRadius: '8px',
                      padding: '40px',
                      textAlign: 'center',
                      background: 'var(--bg-tertiary)',
                      cursor: isImporting ? 'not-allowed' : 'pointer',
                      opacity: isImporting ? 0.5 : 1,
                      transition: 'all 0.2s',
                    }}
                    onDragOver={(e) => {
                      if (!isImporting) {
                        e.preventDefault();
                        e.currentTarget.style.borderColor = '#00ff88';
                        e.currentTarget.style.background = 'rgba(0, 255, 136, 0.1)';
                      }
                    }}
                    onDragLeave={(e) => {
                      if (!isImporting) {
                        e.preventDefault();
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.background = 'var(--bg-tertiary)';
                      }
                    }}
                    onDrop={(e) => {
                      if (!isImporting) {
                        e.preventDefault();
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.background = 'var(--bg-tertiary)';
                        const file = e.dataTransfer.files[0];
                        if (file) {
                          handleFileImport(file);
                        }
                      }
                    }}
                    onClick={() => {
                      if (!isImporting) {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.xlsx,.xls,.csv';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) {
                            handleFileImport(file);
                          }
                        };
                        input.click();
                      }
                    }}
                  >
                    <FileSpreadsheet size={48} style={{ color: '#00ff88', marginBottom: '16px' }} />
                    <p style={{ color: '#a0a0b0', fontSize: '16px', marginBottom: '8px' }}>
                      {isImporting ? 'Memproses import...' : 'Klik atau drag & drop file di sini'}
                    </p>
                    <p style={{ color: '#606070', fontSize: '12px' }}>
                      Format: Excel (.xlsx, .xls) atau CSV (.csv)
                    </p>
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>Format Kolom:</h3>
                  <div style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px', fontSize: '12px', fontFamily: 'monospace' }}>
                    <div style={{ marginBottom: '4px' }}><strong>Nama Produk</strong> (wajib) - Nama produk</div>
                    <div style={{ marginBottom: '4px' }}><strong>Deskripsi</strong> (opsional) - Deskripsi produk</div>
                    <div style={{ marginBottom: '4px' }}><strong>Harga</strong> (wajib) - Harga produk (angka)</div>
                    <div style={{ marginBottom: '4px' }}><strong>Kategori ID</strong> (wajib) - ID kategori (contoh: cat-1)</div>
                    <div style={{ marginBottom: '4px' }}><strong>Stok</strong> (wajib) - Jumlah stok (angka)</div>
                    <div><strong>Barcode</strong> (opsional) - Kode barcode</div>
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>Daftar Kategori:</h3>
                  <div style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                    {categories.length > 0 ? (
                      categories.map((cat) => (
                        <div key={cat.id} style={{ fontSize: '12px', marginBottom: '4px' }}>
                          <strong>{cat.name}</strong>: {cat.id}
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: '12px', color: '#606070' }}>Belum ada kategori</div>
                    )}
                  </div>
                </div>

                {importError && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      padding: '12px',
                      background: 'rgba(255, 107, 107, 0.1)',
                      border: '1px solid #ff6b6b',
                      borderRadius: '8px',
                      color: '#ff6b6b',
                      fontSize: '14px',
                      marginBottom: '16px',
                      whiteSpace: 'pre-wrap',
                      maxHeight: '200px',
                      overflowY: 'auto',
                    }}
                  >
                    {importError}
                  </motion.div>
                )}

                {importSuccess && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      padding: '12px',
                      background: 'rgba(0, 255, 136, 0.1)',
                      border: '1px solid #00ff88',
                      borderRadius: '8px',
                      color: '#00ff88',
                      fontSize: '14px',
                      marginBottom: '16px',
                    }}
                  >
                    {importSuccess}
                  </motion.div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexShrink: 0, paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    if (!isImporting) {
                      setShowImportModal(false);
                      setImportError('');
                      setImportSuccess('');
                    }
                  }}
                  style={{ flex: 1 }}
                  disabled={isImporting}
                >
                  Tutup
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={downloadTemplate}
                  style={{ flex: 1 }}
                  disabled={isImporting}
                >
                  <Download size={18} />
                  Download Template
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Costing Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
        style={{ marginTop: '24px' }}
      >
        <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px' }}>
          Costing per Kategori
        </h3>
        <p style={{ color: '#a0a0b0', fontSize: '14px', marginBottom: '20px' }}>
          Atur persentase costing untuk setiap kategori. Costing digunakan untuk menghitung margin/profit.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {categories.map((cat) => (
            <div
              key={cat.id}
              style={{
                padding: '16px',
                background: 'var(--bg-tertiary)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 600 }}>{cat.name}</h4>
                {editingCategoryCosting === cat.id ? (
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setEditingCategoryCosting(null);
                      setCostingPercentage('');
                    }}
                    style={{ padding: '4px 8px', fontSize: '12px' }}
                  >
                    Batal
                  </button>
                ) : (
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setEditingCategoryCosting(cat.id);
                      setCostingPercentage((cat.costingPercentage || 0).toString());
                    }}
                    style={{ padding: '4px 8px', fontSize: '12px' }}
                  >
                    <Edit size={14} />
                    Edit
                  </button>
                )}
              </div>
              {editingCategoryCosting === cat.id ? (
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                    Costing Percentage (%)
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="number"
                      className="input"
                      value={costingPercentage}
                      onChange={(e) => setCostingPercentage(e.target.value)}
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="0"
                      style={{ flex: 1 }}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={async () => {
                        try {
                          const percentage = parseFloat(costingPercentage) || 0;
                          if (percentage < 0 || percentage > 100) {
                            alert('Persentase harus antara 0-100');
                            return;
                          }
                          await updateCategory(cat.id, { costingPercentage: percentage });
                          setEditingCategoryCosting(null);
                          setCostingPercentage('');
                          
                          // Log activity
                          if (storage && currentUser) {
                            await storage.createActivityLog({
                              category: 'product',
                              action: 'update',
                              description: `Update costing percentage kategori "${cat.name}" menjadi ${percentage}%`,
                              userId: currentUser.id,
                              userName: currentUser.username,
                              details: {
                                categoryId: cat.id,
                                categoryName: cat.name,
                                previousValue: cat.costingPercentage || 0,
                                newValue: percentage,
                              },
                            });
                          }
                        } catch (error) {
                          console.error('Failed to update category costing:', error);
                          alert('Gagal mengupdate costing percentage');
                        }
                      }}
                      style={{ padding: '8px 16px', fontSize: '14px' }}
                    >
                      Simpan
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: '24px', fontWeight: 700, color: '#00ff88', marginBottom: '4px' }}>
                    {cat.costingPercentage || 0}%
                  </p>
                  <p style={{ fontSize: '12px', color: '#a0a0b0' }}>
                    {cat.costingPercentage 
                      ? `Costing: ${cat.costingPercentage}% dari harga jual`
                      : 'Belum diatur'}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

