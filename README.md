# Noxtiz Culinary Lab POS

Sistem POS (Point of Sale) untuk Culinary Lab dengan tema futuristik. Dibangun dengan Electron, React, dan TypeScript. Mendukung multi-user dan dapat berjalan di PC, tablet, dan smartphone.

## ✨ Features

- 🎨 **UI Futuristik** - Desain modern dengan tema Culinary Lab
- 👥 **Multi-User** - Sistem autentikasi dengan role-based access (Admin, Manager, Cashier)
- 💾 **Dual Storage** - Pilih antara Local Storage atau Upstash Redis (Server Online)
- 🛒 **POS Lengkap** - Sistem kasir dengan cart, checkout, dan payment methods
- 📦 **Manajemen Produk** - CRUD produk dengan kategori dan stok management
- 📊 **Dashboard** - Statistik real-time dan laporan penjualan
- 🔐 **License System** - Sistem lisensi dengan trial 7 hari
- 📱 **Responsive** - Optimized untuk desktop, tablet, dan mobile

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
   - Login menggunakan **email** (bukan username)
   - Email harus unique untuk setiap user
   - Default admin user dibuat otomatis saat pertama kali setup

3. **License**
   - Trial 7 hari otomatis aktif saat pertama kali registrasi
   - Setelah trial habis, perlu aktivasi license
   - License types: Trial, Weekly, Monthly, Yearly, Lifetime

### Features Overview

- **Dashboard**: Overview penjualan, statistik, dan produk stok menipis
- **POS**: Sistem kasir untuk transaksi penjualan
- **Produk**: Kelola produk, kategori, dan stok
- **Pesanan**: Riwayat transaksi dan pesanan
- **Users**: Manajemen user (Admin only)
- **Settings**: Konfigurasi aplikasi, storage, license, dan pengaturan keuangan

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

## 🔧 Configuration

### Storage Settings

Bisa diubah di halaman Settings:

- **Local Storage**: Tidak perlu konfigurasi tambahan
- **Upstash Redis**: 
  1. Daftar di [Upstash](https://upstash.com)
  2. Buat Redis database
  3. Copy URL dan Token
  4. Masukkan di Settings

### License Settings

- Trial 7 hari otomatis aktif saat registrasi pertama kali
- Aktivasi license bisa dilakukan di halaman Settings
- Untuk informasi license, hubungi admin

## 📱 Responsive Design

Aplikasi fully responsive dan optimized untuk:
- **Desktop**: Full sidebar dan layout
- **Tablet**: Adaptive layout dengan mobile menu
- **Mobile**: Mobile-first design dengan hamburger menu

## 🐛 Troubleshooting

### Build Errors

Jika ada error saat build, pastikan:
- Node.js version 18+
- Semua dependencies terinstall
- TypeScript version compatible

### Storage Issues

- **Local Storage**: Pastikan aplikasi punya permission write di folder user data
- **Redis**: Pastikan URL dan Token valid, dan koneksi internet tersedia

### License Issues

- Trial otomatis aktif saat registrasi pertama kali
- Jika license tidak terdeteksi, pastikan koneksi internet untuk sync ke server

## 📝 License

Sistem POS ini menggunakan license system dengan trial 7 hari. Untuk informasi lebih lanjut, hubungi admin.

## 👨‍💻 Development

### Scripts

- `npm run dev` - Run development server
- `npm run build` - Build for production
- `npm run build:win` - Build Windows executable
- `npm run preview` - Preview production build

### Project Structure

- `src/components/` - React components
- `src/pages/` - Page components
- `src/storage/` - Storage abstraction (Local, Redis, Electron)
- `src/store/` - Zustand state management
- `src/lib/` - Utility functions (license, device, etc)
- `src/types/` - TypeScript type definitions

---

**Noxtiz Culinary Lab POS**

