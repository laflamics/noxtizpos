## License Service (Noxtiz)

Service ini disiapin khusus buat nge-handle lifecycle lisensi Noxtiz POS. Backend POS utama tetap terpisah; modul ini cukup disimpan di repo `noxtiz.com` dan dipanggil oleh:

1. **POS Client** – buat aktivasi / cek status lisensi (termasuk trial 7 hari).
2. **Dashboard internal** – buat generate / revoke / extend lisensi.

### Fitur utama

- Simpan lisensi di Upstash Redis (REST).
- Bind lisensi ke device (ANDROID_ID + detail hardware).
- Catat detail account + sub user (staff) pas aktivasi.
- Trial auto 7 hari tapi tetap kirim detail user/device dari awal.
- Endpoint aktivasi dan status memastikan mode offline tetap aman (selama token lokal valid).

### Struktur folder

```
license-service/
├── README.md
├── src/
│   ├── api/
│   │   ├── activateLicense.ts   # handler aktivasi lisensi
│   │   ├── checkLicense.ts      # handler sync status
│   │   └── requestTrial.ts      # handler trial 7 hari per device
│   ├── store/
│   │   └── licenseStore.ts      # akses Upstash Redis
│   └── types.ts                 # definisi tipe shared POS + dashboard
└── tsconfig.json (opsional kalau mau compile terpisah)
```

> Catatan: module ini belum dikaitin ke framework tertentu. Tinggal bungkus handler ke Next.js API Route, Express, Cloudflare Worker, dll.

### Env yang wajib

```
UPSTASH_REDIS_REST_URL=https://discrete-bream-33796.upstash.io
UPSTASH_REDIS_REST_TOKEN=AYQEAAIncDFkNjI4M2ExMTU1NWI0N2ZiYTdhMTViNjg4ZmRhZDdmOHAxMzM3OTY
LICENSE_API_KEY=xxx           # key buat POS client
LICENSE_ADMIN_API_KEY=yyy     # key buat dashboard
```

POS cukup pakai `LICENSE_API_KEY`. Dashboard/admin perlu key khusus buat CRUD lisensi.

### Integrasi POS (gambaran)

1. Saat pertama run, POS panggil `POST /license/trial` kirim detail device & akun → dapet token + expiry trial.
2. User beli lisensi → input kode → POS panggil `POST /license/activate`.
3. POS simpen token lokal; fitur offline tetap jalan selama `expiresAt` belum lewat.
4. POS rutin panggil `GET /license/status` saat ada internet; kalau status server expire/revoke → lock app dan minta lisensi baru.

Implementasi detailnya ada di file `src/api/*.ts`.

