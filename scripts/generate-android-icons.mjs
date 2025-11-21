import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Ukuran icon untuk setiap density
const iconSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

// Ukuran foreground untuk adaptive icon (Android 8.0+)
const foregroundSizes = {
  'mipmap-mdpi': 108,
  'mipmap-hdpi': 162,
  'mipmap-xhdpi': 216,
  'mipmap-xxhdpi': 324,
  'mipmap-xxxhdpi': 432,
};

async function generateAndroidIcons() {
  const sourceIcon = path.join(rootDir, 'public', 'noxtiz.png');
  const androidResDir = path.join(rootDir, 'android', 'app', 'src', 'main', 'res');

  // Cek apakah source icon ada
  if (!fs.existsSync(sourceIcon)) {
    console.error('❌ Source icon tidak ditemukan:', sourceIcon);
    console.error('   Pastikan file public/noxtiz.png ada!');
    process.exit(1);
  }

  console.log('🔄 Generating Android icons dari:', sourceIcon);

  // Generate icon untuk setiap density
  for (const [mipmapDir, size] of Object.entries(iconSizes)) {
    const targetDir = path.join(androidResDir, mipmapDir);
    const iconPath = path.join(targetDir, 'ic_launcher.png');
    const roundIconPath = path.join(targetDir, 'ic_launcher_round.png');

    // Buat folder jika belum ada
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Generate square icon
    await sharp(sourceIcon)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(iconPath);

    // Generate round icon (sama dengan square untuk sekarang)
    await sharp(sourceIcon)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(roundIconPath);

    console.log(`✅ Generated ${mipmapDir}/ic_launcher.png (${size}x${size})`);
  }

  // Generate foreground untuk adaptive icon
  for (const [mipmapDir, size] of Object.entries(foregroundSizes)) {
    const targetDir = path.join(androidResDir, mipmapDir);
    const foregroundPath = path.join(targetDir, 'ic_launcher_foreground.png');

    // Buat folder jika belum ada
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Generate foreground (dengan padding untuk adaptive icon)
    await sharp(sourceIcon)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(foregroundPath);

    console.log(`✅ Generated ${mipmapDir}/ic_launcher_foreground.png (${size}x${size})`);
  }

  console.log('\n✨ Semua icon Android berhasil di-generate!');
  console.log('   Icon akan digunakan saat build APK.');
}

generateAndroidIcons().catch((error) => {
  console.error('❌ Error generating icons:', error);
  process.exit(1);
});

