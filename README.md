# Noxtiz POS - Multi User Point of Sale System

Sistem POS (Point of Sale) modern dengan tema futuristik Culinary Lab, dibangun dengan Electron, React, dan TypeScript. Mendukung multi-user dan dapat berjalan di PC, tablet, dan smartphone.

## ✨ Features

- 🎨 **UI Futuristik** - Desain modern dengan tema Culinary Lab
- 👥 **Multi-User** - Sistem autentikasi dengan role-based access (Admin, Manager, Cashier)
- 💾 **Dual Storage** - Pilih antara Local Storage atau Upstash Redis (Server Online)
- 🛒 **POS Lengkap** - Sistem kasir dengan cart, checkout, dan payment methods
- 📦 **Manajemen Produk** - CRUD produk dengan kategori dan stok management
- 📊 **Dashboard** - Statistik real-time dan laporan penjualan
- 📱 **Responsive** - Optimized untuk desktop, tablet, dan mobile
- ⚡ **Fast & Modern** - Built dengan React, TypeScript, dan Vite

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm atau yarn

### Installation

1. Clone repository atau extract project
2. Install dependencies:

```bash
npm install
```

3. Run development mode:

```bash
npm run dev
```

4. Build untuk production:

```bash
npm run build
```

5. Build executable:

```bash
npm run build:win
```

## 📖 Usage

### First Time Setup

1. **Pilih Storage Type**
   - **Local Storage**: Data disimpan lokal di komputer (tidak perlu koneksi internet)
   - **Server Online (Upstash Redis)**: Data disimpan di cloud, bisa diakses dari mana saja
     - Butuh Redis URL dan Token dari [Upstash](https://upstash.com)

2. **Login**
   - Default admin user: `admin`
   - Bisa tambah user baru di halaman Users (hanya admin)

### Features Overview

- **Dashboard**: Overview penjualan, statistik, dan produk stok menipis
- **POS**: Sistem kasir untuk transaksi penjualan
- **Produk**: Kelola produk, kategori, dan stok
- **Pesanan**: Riwayat transaksi dan pesanan
- **Users**: Manajemen user (Admin only)
- **Settings**: Konfigurasi aplikasi, storage, dan pengaturan keuangan

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Desktop**: Electron 28
- **Build Tool**: Vite
- **State Management**: Zustand
- **UI**: Custom CSS dengan Framer Motion
- **Icons**: Lucide React
- **Storage**: 
  - Local: electron-store
  - Cloud: @upstash/redis

## 📁 Project Structure

```
noxtizpos/
├── electron/          # Electron main process
│   ├── main.ts       # Main entry point
│   └── preload.ts    # Preload script
├── src/
│   ├── components/   # React components
│   ├── pages/        # Page components
│   ├── storage/      # Storage abstraction layer
│   ├── store/        # Zustand store
│   ├── types/        # TypeScript types
│   └── main.tsx      # React entry point
├── package.json
└── vite.config.ts
```

## 🔧 Configuration

### Storage Settings

Bisa diubah di halaman Settings atau saat pertama kali setup:

- **Local Storage**: Tidak perlu konfigurasi tambahan
- **Upstash Redis**: 
  1. Daftar di [Upstash](https://upstash.com)
  2. Buat Redis database
  3. Copy URL dan Token
  4. Masukkan di Settings

### Environment Variables

Tidak diperlukan environment variables untuk local storage. Untuk Redis, credentials disimpan di settings aplikasi.

## 📱 Responsive Design

Aplikasi fully responsive dan optimized untuk:
- **Desktop**: Full sidebar dan layout
- **Tablet**: Adaptive layout dengan mobile menu
- **Mobile**: Mobile-first design dengan hamburger menu

## 🎨 Customization

### Theme Colors

Edit `src/index.css` untuk mengubah warna tema:

```css
:root {
  --accent-primary: #00ff88;    /* Green accent */
  --accent-secondary: #00d4ff;  /* Blue accent */
  --bg-primary: #0a0a0f;        /* Dark background */
  /* ... */
}
```

## 🐛 Troubleshooting

### Build Errors

Jika ada error saat build, pastikan:
- Node.js version 18+
- Semua dependencies terinstall
- TypeScript version compatible

### Storage Issues

- **Local Storage**: Pastikan aplikasi punya permission write di folder user data
- **Redis**: Pastikan URL dan Token valid, dan koneksi internet tersedia

## 📝 License

MIT License - Feel free to use and modify!

## 👨‍💻 Development

### Scripts

- `npm run dev` - Run development server
- `npm run build` - Build for production
- `npm run build:win` - Build Windows executable
- `npm run preview` - Preview production build

### Adding Features

1. Components: Tambah di `src/components/`
2. Pages: Tambah di `src/pages/` dan register di `src/App.tsx`
3. Storage: Extend interface di `src/storage/base.ts`

---

**Made with ❤️ for Culinary Lab POS**

