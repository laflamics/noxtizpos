import { useState } from 'react';
import { motion } from 'framer-motion';
import { Book, ChevronRight, ChevronDown, ShoppingCart, Package, Warehouse, Table2, Receipt, Users, Settings, BarChart3, History, Lock } from 'lucide-react';

export default function UserGuide() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'getting-started': true,
    'pos': false,
    'products': false,
    'inventory': false,
    'tables': false,
    'orders': false,
    'users': false,
    'settings': false,
    'license': false,
    'dashboard': false,
    'activity-logs': false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' }}>
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          style={{ marginBottom: '20px' }}
        >
          <img
            src="/Logo.gif"
            alt="Noxtiz POS"
            style={{
              width: '120px',
              height: '120px',
              objectFit: 'contain',
              animation: 'spin 3s linear infinite',
            }}
          />
        </motion.div>
        <h1
          style={{
            fontSize: '36px',
            fontWeight: 800,
            marginBottom: '12px',
            background: 'linear-gradient(135deg, #00ff88, #00d4ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          User Guide
        </h1>
        <p style={{ color: '#a0a0b0', fontSize: '18px' }}>
          Panduan lengkap penggunaan Noxtiz POS System
        </p>
      </div>

      {/* Getting Started */}
      <GuideSection
        id="getting-started"
        title="Getting Started"
        icon={<Book size={24} />}
        isOpen={openSections['getting-started']}
        onToggle={() => toggleSection('getting-started')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--accent-color)' }}>
              1. Login ke Sistem
            </h3>
            <ol style={{ paddingLeft: '24px', lineHeight: '1.8', color: '#a0a0b0' }}>
              <li>Buka aplikasi Noxtiz POS</li>
              <li>Masukkan <strong>Email</strong> dan <strong>Password</strong> yang diberikan admin</li>
              <li>Klik tombol <strong>"Masuk"</strong></li>
              <li>Jika belum punya akun, klik <strong>"Belum punya akun? Daftar"</strong> untuk membuat akun baru</li>
              <li><strong>Catatan:</strong> Email harus unique untuk setiap user</li>
            </ol>
          </div>

          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--accent-color)' }}>
              2. Memahami Role & Permission
            </h3>
            <ul style={{ paddingLeft: '24px', lineHeight: '1.8', color: '#a0a0b0' }}>
              <li><strong>Admin:</strong> Akses penuh ke semua fitur</li>
              <li><strong>Cashier:</strong> Akses ke POS, Produk, Inventory, Meja, dan Pesanan</li>
              <li><strong>Manager:</strong> Akses ke semua fitur kecuali Settings</li>
              <li><strong>Custom Role:</strong> Admin dapat membuat role custom dengan permission tertentu</li>
            </ul>
          </div>

          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--accent-color)' }}>
              3. Navigasi Menu
            </h3>
            <p style={{ color: '#a0a0b0', lineHeight: '1.8', marginBottom: '12px' }}>
              Menu utama berada di sidebar kiri. Klik menu untuk berpindah halaman.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {[
                { name: 'Dashboard', icon: <BarChart3 size={20} /> },
                { name: 'POS', icon: <ShoppingCart size={20} /> },
                { name: 'Produk', icon: <Package size={20} /> },
                { name: 'Inventory', icon: <Warehouse size={20} /> },
                { name: 'Meja', icon: <Table2 size={20} /> },
                { name: 'Pesanan', icon: <Receipt size={20} /> },
                { name: 'Users', icon: <Users size={20} /> },
                { name: 'Settings', icon: <Settings size={20} /> },
              ].map((menu) => (
                <div key={menu.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: 'var(--bg-tertiary)', borderRadius: '6px' }}>
                  <div style={{ color: 'var(--accent-color)' }}>{menu.icon}</div>
                  <span style={{ fontSize: '14px' }}>{menu.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </GuideSection>

      {/* POS */}
      <GuideSection
        id="pos"
        title="Point of Sale (POS)"
        icon={<ShoppingCart size={24} />}
        isOpen={openSections['pos']}
        onToggle={() => toggleSection('pos')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--accent-color)' }}>
              Cara Menggunakan POS
            </h3>
            <ol style={{ paddingLeft: '24px', lineHeight: '1.8', color: '#a0a0b0' }}>
              <li><strong>Pilih Meja (Opsional):</strong> Klik dropdown "Pilih Meja" untuk memilih meja yang akan melayani</li>
              <li><strong>Tambah Produk ke Keranjang:</strong> Klik produk yang ingin dijual, atau gunakan barcode scanner</li>
              <li><strong>Edit Quantity:</strong> Klik tombol +/- di keranjang untuk mengubah jumlah</li>
              <li><strong>Hapus Item:</strong> Klik tombol "X" di item untuk menghapus (perlu PIN void)</li>
              <li><strong>Checkout:</strong> Klik tombol "Bayar" di bagian bawah keranjang</li>
              <li><strong>Pilih Metode Pembayaran:</strong> Pilih Cash, Card, Debit, QRIS, atau Digital Wallet</li>
              <li><strong>Input Reference Code:</strong> Untuk non-cash payment, masukkan reference code (opsional)</li>
              <li><strong>Konfirmasi:</strong> Klik "Konfirmasi Pembayaran"</li>
              <li><strong>Receipt:</strong> Setelah checkout, akan muncul preview struk dengan opsi Download, Share, atau Print</li>
            </ol>
          </div>

          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--accent-color)' }}>
              Fitur Khusus POS
            </h3>
            <ul style={{ paddingLeft: '24px', lineHeight: '1.8', color: '#a0a0b0' }}>
              <li><strong>Cart per Meja:</strong> Setiap meja memiliki keranjang terpisah, data tersimpan otomatis</li>
              <li><strong>Status Meja:</strong> Dapat mengubah status meja langsung dari POS (Available, Occupied, Reserved, Cleaning)</li>
              <li><strong>PIN Void:</strong> Untuk menghapus item atau clear cart, perlu memasukkan PIN void (dapat diatur di Settings)</li>
              <li><strong>Tax Display:</strong> Pajak dapat diatur sebagai Exclude, Include, atau Include Hide (default)</li>
            </ul>
          </div>
        </div>
      </GuideSection>

      {/* Products */}
      <GuideSection
        id="products"
        title="Manajemen Produk"
        icon={<Package size={24} />}
        isOpen={openSections['products']}
        onToggle={() => toggleSection('products')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--accent-color)' }}>
              Menambah Produk Baru
            </h3>
            <ol style={{ paddingLeft: '24px', lineHeight: '1.8', color: '#a0a0b0' }}>
              <li>Klik tombol <strong>"Tambah Produk"</strong></li>
              <li>Isi form: Nama, Deskripsi, Harga, Kategori, Stok, Barcode (opsional)</li>
              <li>Upload gambar produk (opsional)</li>
              <li>Klik <strong>"Simpan"</strong></li>
            </ol>
          </div>

          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--accent-color)' }}>
              Import Produk dari Excel/CSV
            </h3>
            <ol style={{ paddingLeft: '24px', lineHeight: '1.8', color: '#a0a0b0' }}>
              <li>Klik tombol <strong>"Download Template"</strong> untuk mendapatkan template Excel</li>
              <li>Isi template dengan data produk (Nama, Deskripsi, Harga, Kategori ID, Stok, Barcode)</li>
              <li>Klik tombol <strong>"Import Produk"</strong></li>
              <li>Pilih file Excel/CSV yang sudah diisi</li>
              <li>Sistem akan otomatis membuat produk baru atau update produk yang sudah ada (berdasarkan nama atau barcode)</li>
            </ol>
          </div>

          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--accent-color)' }}>
              Costing per Kategori
            </h3>
            <p style={{ color: '#a0a0b0', lineHeight: '1.8' }}>
              Di bagian bawah halaman Produk, terdapat section "Costing per Kategori". Admin dapat mengatur persentase costing untuk setiap kategori. Ini digunakan untuk menghitung margin/profit di Dashboard.
            </p>
          </div>
        </div>
      </GuideSection>

      {/* Inventory */}
      <GuideSection
        id="inventory"
        title="Manajemen Inventory"
        icon={<Warehouse size={24} />}
        isOpen={openSections['inventory']}
        onToggle={() => toggleSection('inventory')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--accent-color)' }}>
              Stock In (Masuk)
            </h3>
            <ol style={{ paddingLeft: '24px', lineHeight: '1.8', color: '#a0a0b0' }}>
              <li>Klik tombol <strong>"Stock In"</strong></li>
              <li>Pilih produk yang akan ditambah stoknya</li>
              <li>Masukkan jumlah stok yang masuk</li>
              <li>Tambahkan catatan (opsional)</li>
              <li>Klik <strong>"Simpan"</strong></li>
            </ol>
          </div>

          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--accent-color)' }}>
              Stock Out (Keluar)
            </h3>
            <ol style={{ paddingLeft: '24px', lineHeight: '1.8', color: '#a0a0b0' }}>
              <li>Klik tombol <strong>"Stock Out"</strong></li>
              <li>Pilih produk yang akan dikurangi stoknya</li>
              <li>Masukkan jumlah stok yang keluar</li>
              <li>Tambahkan catatan (opsional)</li>
              <li>Klik <strong>"Simpan"</strong></li>
            </ol>
          </div>

          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--accent-color)' }}>
              Adjustment (Penyesuaian)
            </h3>
            <p style={{ color: '#a0a0b0', lineHeight: '1.8', marginBottom: '12px' }}>
              Digunakan untuk menyesuaikan stok yang tidak sesuai (misal: stok hilang, rusak, dll).
            </p>
            <ol style={{ paddingLeft: '24px', lineHeight: '1.8', color: '#a0a0b0' }}>
              <li>Klik tombol <strong>"Adjustment"</strong></li>
              <li>Pilih produk</li>
              <li>Masukkan stok baru (akan mengganti stok lama)</li>
              <li>Tambahkan catatan alasan adjustment</li>
              <li>Klik <strong>"Simpan"</strong></li>
            </ol>
          </div>

          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--accent-color)' }}>
              Opening Stock (Stok Awal Bulan)
            </h3>
            <p style={{ color: '#a0a0b0', lineHeight: '1.8' }}>
              Set stok awal untuk periode tertentu (biasanya per bulan). Digunakan untuk laporan inventory.
            </p>
          </div>
        </div>
      </GuideSection>

      {/* Tables */}
      <GuideSection
        id="tables"
        title="Manajemen Meja"
        icon={<Table2 size={24} />}
        isOpen={openSections['tables']}
        onToggle={() => toggleSection('tables')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--accent-color)' }}>
              Menambah Meja Baru
            </h3>
            <ol style={{ paddingLeft: '24px', lineHeight: '1.8', color: '#a0a0b0' }}>
              <li>Klik tombol <strong>"Tambah Meja"</strong></li>
              <li>Isi form: Nomor Meja, Nama (opsional), Kapasitas</li>
              <li>Klik <strong>"Simpan"</strong></li>
            </ol>
          </div>

          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--accent-color)' }}>
              Status Meja
            </h3>
            <ul style={{ paddingLeft: '24px', lineHeight: '1.8', color: '#a0a0b0' }}>
              <li><strong>Available:</strong> Meja tersedia dan siap digunakan</li>
              <li><strong>Occupied:</strong> Meja sedang digunakan (ada pesanan aktif)</li>
              <li><strong>Reserved:</strong> Meja sudah dipesan/reservasi</li>
              <li><strong>Cleaning:</strong> Meja sedang dibersihkan</li>
            </ul>
            <p style={{ color: '#a0a0b0', lineHeight: '1.8', marginTop: '12px' }}>
              Status meja dapat diubah dari halaman Meja atau langsung dari POS saat memilih meja.
            </p>
          </div>
        </div>
      </GuideSection>

      {/* Orders */}
      <GuideSection
        id="orders"
        title="Pesanan"
        icon={<Receipt size={24} />}
        isOpen={openSections['orders']}
        onToggle={() => toggleSection('orders')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--accent-color)' }}>
              Melihat History Pesanan
            </h3>
            <p style={{ color: '#a0a0b0', lineHeight: '1.8' }}>
              Di halaman Pesanan, Anda dapat melihat semua pesanan yang pernah dibuat. Klik pada pesanan untuk melihat detail struk/bill.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--accent-color)' }}>
              Filter & Search
            </h3>
            <p style={{ color: '#a0a0b0', lineHeight: '1.8' }}>
              Gunakan filter untuk mencari pesanan berdasarkan tanggal, status, atau metode pembayaran.
            </p>
          </div>
        </div>
      </GuideSection>

      {/* Users */}
      <GuideSection
        id="users"
        title="Manajemen User"
        icon={<Users size={24} />}
        isOpen={openSections['users']}
        onToggle={() => toggleSection('users')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--accent-color)' }}>
              Menambah User Baru
            </h3>
            <ol style={{ paddingLeft: '24px', lineHeight: '1.8', color: '#a0a0b0' }}>
              <li>Klik tombol <strong>"Tambah User"</strong></li>
              <li>Isi form: Username, <strong>Email</strong> (wajib, harus unique), Password, Role</li>
              <li>Untuk role selain Admin, pilih permission yang diizinkan (checklist menu)</li>
              <li>Klik <strong>"Simpan"</strong></li>
            </ol>
            <p style={{ color: '#a0a0b0', lineHeight: '1.8', marginTop: '12px' }}>
              <strong>Catatan:</strong> Email digunakan untuk login, bukan username. Email harus unique untuk setiap user.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--accent-color)' }}>
              Role & Permission
            </h3>
            <ul style={{ paddingLeft: '24px', lineHeight: '1.8', color: '#a0a0b0' }}>
              <li><strong>Admin:</strong> Otomatis dapat akses semua menu</li>
              <li><strong>Cashier:</strong> Default permission: POS, Produk, Inventory, Meja, Pesanan</li>
              <li><strong>Custom Role:</strong> Admin dapat membuat role baru dan menentukan permission secara manual</li>
            </ul>
          </div>
        </div>
      </GuideSection>

      {/* Settings */}
      <GuideSection
        id="settings"
        title="Settings"
        icon={<Settings size={24} />}
        isOpen={openSections['settings']}
        onToggle={() => toggleSection('settings')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--accent-color)' }}>
              General Settings
            </h3>
            <ul style={{ paddingLeft: '24px', lineHeight: '1.8', color: '#a0a0b0' }}>
              <li><strong>Nama Perusahaan:</strong> Nama yang akan muncul di receipt</li>
              <li><strong>Currency:</strong> Mata uang yang digunakan (default: IDR)</li>
              <li><strong>Tax Rate:</strong> Persentase pajak (default: 10%)</li>
              <li><strong>Tax Display Mode:</strong> Exclude, Include, atau Include Hide (default)</li>
              <li><strong>Void PIN:</strong> PIN yang diperlukan untuk void item atau clear cart</li>
            </ul>
          </div>

          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--accent-color)' }}>
              Receipt Settings
            </h3>
            <ul style={{ paddingLeft: '24px', lineHeight: '1.8', color: '#a0a0b0' }}>
              <li><strong>Logo Receipt:</strong> Upload logo yang akan muncul di receipt</li>
              <li><strong>Header Receipt:</strong> Teks header (bisa multi-line, contoh: alamat, telepon)</li>
              <li><strong>Footer Receipt:</strong> Teks footer (bisa multi-line, contoh: terima kasih, dll)</li>
            </ul>
          </div>

          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--accent-color)' }}>
              Storage Settings
            </h3>
            <p style={{ color: '#a0a0b0', lineHeight: '1.8' }}>
              Pilih antara <strong>Local Storage</strong> (data tersimpan di komputer) atau <strong>Redis (Online)</strong> (data tersimpan di cloud). Untuk Redis, masukkan URL dan Token dari Upstash.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--accent-color)' }}>
              Update Aplikasi
            </h3>
            <p style={{ color: '#a0a0b0', lineHeight: '1.8', marginBottom: '12px' }}>
              Di bagian bawah Settings, terdapat section "Update Aplikasi":
            </p>
            <ul style={{ paddingLeft: '24px', lineHeight: '1.8', color: '#a0a0b0' }}>
              <li>Aplikasi akan otomatis mengecek update setiap 1 jam</li>
              <li>Klik <strong>"Cek Update Sekarang"</strong> untuk manual check</li>
              <li>Jika ada update, klik <strong>"Download Update"</strong></li>
              <li>Setelah download selesai, klik <strong>"Install & Restart"</strong></li>
            </ul>
          </div>
        </div>
      </GuideSection>

      {/* License */}
      <GuideSection
        id="license"
        title="License"
        icon={<Lock size={24} />}
        isOpen={openSections['license']}
        onToggle={() => toggleSection('license')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--accent-color)' }}>
              Trial 7 Hari
            </h3>
            <p style={{ color: '#a0a0b0', lineHeight: '1.8', marginBottom: '12px' }}>
              Saat pertama kali registrasi atau login, Anda akan mendapatkan <strong>trial 7 hari</strong> secara otomatis. Selama masa trial, semua fitur POS dapat digunakan dengan lengkap.
            </p>
            <p style={{ color: '#a0a0b0', lineHeight: '1.8' }}>
              <strong>Catatan:</strong> Trial aktif baik saat online maupun offline.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--accent-color)' }}>
              Melihat Status License
            </h3>
            <ol style={{ paddingLeft: '24px', lineHeight: '1.8', color: '#a0a0b0' }}>
              <li>Klik menu <strong>Settings</strong></li>
              <li>Scroll ke bagian <strong>License</strong></li>
              <li>Lihat informasi:
                <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                  <li><strong>Status:</strong> Trial, Active, Expired, atau Revoked</li>
                  <li><strong>Type:</strong> Trial, Weekly, Monthly, Yearly, atau Lifetime</li>
                  <li><strong>Expires At:</strong> Tanggal kadaluarsa license</li>
                  <li><strong>Countdown:</strong> Sisa waktu license (ditampilkan di header setiap halaman)</li>
                </ul>
              </li>
            </ol>
          </div>

          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--accent-color)' }}>
              Aktivasi License
            </h3>
            <p style={{ color: '#a0a0b0', lineHeight: '1.8', marginBottom: '12px' }}>
              Setelah trial habis, Anda perlu mengaktivasi license untuk melanjutkan penggunaan:
            </p>
            <ol style={{ paddingLeft: '24px', lineHeight: '1.8', color: '#a0a0b0' }}>
              <li>Klik menu <strong>Settings</strong></li>
              <li>Scroll ke bagian <strong>License</strong></li>
              <li>Masukkan <strong>kode license</strong> yang diberikan</li>
              <li>Klik tombol <strong>"Aktifkan Lisensi"</strong></li>
              <li>Tunggu proses aktivasi selesai</li>
            </ol>
            <p style={{ color: '#a0a0b0', lineHeight: '1.8', marginTop: '12px' }}>
              <strong>Catatan:</strong> Kode license akan dikirim setelah pembayaran. Pastikan koneksi internet saat aktivasi. License terikat ke perangkat yang digunakan.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--accent-color)' }}>
              Tipe License
            </h3>
            <ul style={{ paddingLeft: '24px', lineHeight: '1.8', color: '#a0a0b0' }}>
              <li><strong>Trial:</strong> 7 hari gratis (otomatis aktif)</li>
              <li><strong>Weekly:</strong> 1 minggu</li>
              <li><strong>Monthly:</strong> 1 bulan</li>
              <li><strong>Yearly:</strong> 1 tahun</li>
              <li><strong>Lifetime:</strong> Selamanya (ditandai dengan badge bintang kuning ⭐)</li>
            </ul>
          </div>

          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--accent-color)' }}>
              License Expired
            </h3>
            <p style={{ color: '#a0a0b0', lineHeight: '1.8', marginBottom: '12px' }}>
              Jika license sudah habis:
            </p>
            <ol style={{ paddingLeft: '24px', lineHeight: '1.8', color: '#a0a0b0' }}>
              <li>Popup license akan muncul otomatis</li>
              <li>Popup <strong>tidak bisa ditutup</strong> sampai license diaktivasi</li>
              <li>Masukkan kode license baru di popup</li>
              <li>Klik <strong>"Aktifkan Lisensi"</strong></li>
            </ol>
          </div>

          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--accent-color)' }}>
              Membeli License
            </h3>
            <p style={{ color: '#a0a0b0', lineHeight: '1.8', marginBottom: '12px' }}>
              Untuk membeli license:
            </p>
            <ol style={{ paddingLeft: '24px', lineHeight: '1.8', color: '#a0a0b0' }}>
              <li>Hubungi <strong>081311549824 (Panji)</strong> via WhatsApp</li>
              <li>Transfer ke <strong>BCA a/n Panji: 0821112345</strong></li>
              <li>Kirim bukti transfer via WhatsApp</li>
              <li>Tunggu kode license dikirim</li>
            </ol>
          </div>

          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--accent-color)' }}>
              Troubleshooting License
            </h3>
            <ul style={{ paddingLeft: '24px', lineHeight: '1.8', color: '#a0a0b0' }}>
              <li><strong>License tidak terdeteksi:</strong> Pastikan koneksi internet untuk sync, cek status license di Settings, restart aplikasi</li>
              <li><strong>Trial tidak aktif:</strong> Pastikan sudah registrasi/login pertama kali, cek koneksi internet (untuk sync ke server), hubungi admin jika masalah berlanjut</li>
              <li><strong>License expired padahal masih lama:</strong> Cek tanggal sistem komputer/device, pastikan tanggal sudah benar, hubungi admin untuk verifikasi</li>
            </ul>
          </div>
        </div>
      </GuideSection>

      {/* Dashboard */}
      <GuideSection
        id="dashboard"
        title="Dashboard"
        icon={<BarChart3 size={24} />}
        isOpen={openSections['dashboard']}
        onToggle={() => toggleSection('dashboard')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--accent-color)' }}>
              Filter Periode
            </h3>
            <ul style={{ paddingLeft: '24px', lineHeight: '1.8', color: '#a0a0b0' }}>
              <li><strong>Hari Ini:</strong> Menampilkan data transaksi hari ini</li>
              <li><strong>Kemarin:</strong> Menampilkan data transaksi kemarin</li>
              <li><strong>Bulan Ini:</strong> Menampilkan data transaksi bulan ini</li>
              <li><strong>Custom:</strong> Pilih rentang tanggal secara manual</li>
            </ul>
          </div>

          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--accent-color)' }}>
              Informasi yang Ditampilkan
            </h3>
            <ul style={{ paddingLeft: '24px', lineHeight: '1.8', color: '#a0a0b0' }}>
              <li><strong>Ringkasan:</strong> Pendapatan, Total Transaksi, Total Produk, Stok Menipis</li>
              <li><strong>Margin & Profit:</strong> Total Revenue, Cost, Profit, dan Margin</li>
              <li><strong>Omset per Kategori:</strong> Breakdown revenue, cost, profit, dan margin per kategori</li>
              <li><strong>Top 10 Produk Terlaris:</strong> Ranking produk berdasarkan jumlah terjual</li>
              <li><strong>Pesanan Terbaru:</strong> 10 pesanan terakhir</li>
              <li><strong>Stok Menipis:</strong> Produk dengan stok kurang dari 10</li>
            </ul>
          </div>

          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--accent-color)' }}>
              Print & Save PDF
            </h3>
            <p style={{ color: '#a0a0b0', lineHeight: '1.8' }}>
              Klik tombol <strong>"Print"</strong> untuk mencetak laporan, atau <strong>"Save PDF"</strong> untuk menyimpan sebagai file PDF.
            </p>
          </div>
        </div>
      </GuideSection>

      {/* Activity Logs */}
      <GuideSection
        id="activity-logs"
        title="Activity Logs"
        icon={<History size={24} />}
        isOpen={openSections['activity-logs']}
        onToggle={() => toggleSection('activity-logs')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--accent-color)' }}>
              Melihat Activity Logs
            </h3>
            <p style={{ color: '#a0a0b0', lineHeight: '1.8' }}>
              Activity Logs mencatat semua aktivitas yang terjadi di sistem, termasuk:
            </p>
            <ul style={{ paddingLeft: '24px', lineHeight: '1.8', color: '#a0a0b0', marginTop: '12px' }}>
              <li>Order (pembuatan pesanan)</li>
              <li>Void (pembatalan item/pesanan, termasuk PIN yang digunakan)</li>
              <li>Stock (pergerakan stok: in, out, adjustment)</li>
              <li>Product (tambah, edit, hapus produk)</li>
              <li>User (tambah, edit, hapus user)</li>
              <li>Table (tambah, edit, hapus, perubahan status meja)</li>
              <li>Settings (perubahan settings)</li>
              <li>Payment (settlement/closing report)</li>
            </ul>
          </div>

          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--accent-color)' }}>
              Filter Activity Logs
            </h3>
            <ul style={{ paddingLeft: '24px', lineHeight: '1.8', color: '#a0a0b0' }}>
              <li>Filter berdasarkan <strong>Kategori</strong> (Order, Void, Stock, dll)</li>
              <li>Filter berdasarkan <strong>Rentang Tanggal</strong></li>
              <li>Search berdasarkan <strong>Keyword</strong> (nama user, produk, dll)</li>
            </ul>
            <p style={{ color: '#a0a0b0', lineHeight: '1.8', marginTop: '12px' }}>
              Activity Logs akan otomatis refresh setiap 30 menit.
            </p>
          </div>
        </div>
      </GuideSection>

      {/* Tips & Tricks */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
        style={{ marginTop: '32px', background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 212, 255, 0.1))', border: '1px solid var(--accent-color)' }}
      >
        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px', color: 'var(--accent-color)' }}>
          💡 Tips & Tricks
        </h2>
        <ul style={{ paddingLeft: '24px', lineHeight: '1.8', color: '#a0a0b0' }}>
          <li>Gunakan <strong>Barcode Scanner</strong> untuk menambah produk ke keranjang dengan cepat</li>
          <li>Setiap meja memiliki <strong>keranjang terpisah</strong>, jadi Anda bisa switch antar meja tanpa kehilangan data</li>
          <li>Gunakan <strong>Import Excel/CSV</strong> untuk menambah banyak produk sekaligus</li>
          <li>Atur <strong>Costing per Kategori</strong> untuk mendapatkan analisis margin yang akurat</li>
          <li>Gunakan <strong>Closing Report</strong> untuk settlement harian dan bulanan</li>
          <li>Pastikan <strong>Void PIN</strong> diatur dengan aman untuk mencegah abuse</li>
          <li>Gunakan <strong>Activity Logs</strong> untuk audit trail dan troubleshooting</li>
        </ul>
      </motion.div>
    </div>
  );
}

interface GuideSectionProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function GuideSection({ id, title, icon, isOpen, onToggle, children }: GuideSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
      style={{ marginBottom: '16px' }}
    >
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'none',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          padding: '0',
          marginBottom: isOpen ? '20px' : '0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ color: 'var(--accent-color)' }}>{icon}</div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, textAlign: 'left' }}>{title}</h2>
        </div>
        {isOpen ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
      </button>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{ overflow: 'hidden' }}
        >
          {children}
        </motion.div>
      )}
    </motion.div>
  );
}

