# ✅ Deploy Checklist - Noxtiz POS

## Sebelum Build
- [ ] Pastikan semua fitur sudah di-test
- [ ] Update version di `package.json` (jika ada update baru)
- [ ] Commit semua perubahan ke git
- [ ] Check tidak ada error di console

## Build Process
- [ ] Run `npm run build:win`
- [ ] Check build berhasil tanpa error
- [ ] Verify file di folder `dist/`:
  - [ ] `latest.yml` ada
  - [ ] Installer `.exe` ada
  - [ ] File size reasonable

## Upload ke Server
- [ ] Connect ke server noxtiz.com
- [ ] Navigate ke folder `/updates/`
- [ ] Upload `latest.yml`
- [ ] Upload installer `.exe`
- [ ] Set permission file (644 untuk yml, 755 untuk exe)

## Testing
- [ ] Test akses `latest.yml` via browser
- [ ] Test download installer via browser
- [ ] Install aplikasi versi lama (jika ada)
- [ ] Test auto-update detection
- [ ] Test download update
- [ ] Test install update
- [ ] Verify aplikasi berjalan setelah update

## Post-Deploy
- [ ] Backup versi sebelumnya
- [ ] Document perubahan di changelog
- [ ] Notify users tentang update (jika perlu)

---

**Status:** ⬜ Belum Deploy | ✅ Sudah Deploy

