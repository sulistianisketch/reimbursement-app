# KlaimKu

Sistem reimbursement perusahaan dengan dashboard, empat data master, frontend HTML/CSS/JavaScript, backend Node.js bawaan, dan database Supabase Postgres. Tidak membutuhkan `package.json`, framework, CDN, atau berkas environment.

## Struktur

```text
frontend/
  index.html
  styles.css
  app.js
backend/
  app.js
database/
  schema.sql
  bootstrap-admin.sql
```

Empat entitas database: `departments`, `employees`, `categories`, dan `reimbursements`.

Dokumentasi skema, kamus data, ERD, aturan RLS, dan alur reimbursement tersedia di [`docs/skema-sistem-reimbursement.md`](docs/skema-sistem-reimbursement.md).

## Membuka aplikasi

- Buka `frontend/index.html` langsung di browser untuk mencoba mode demo. Data demo disimpan di local storage browser.
- Untuk menjalankan server opsional, gunakan Node.js 18 atau lebih baru: `node backend/app.js`, lalu buka `http://localhost:4173`.
- Endpoint pemeriksaan server: `http://localhost:4173/api/health`.

## Menyiapkan Supabase

1. Buat project Supabase.
2. Buka SQL Editor, lalu jalankan seluruh isi `database/schema.sql`.
3. Buka aplikasi, klik **Supabase terhubung** di kiri bawah, lalu isi Project URL dan publishable key. `anon` key lama juga didukung. Jangan masukkan secret key atau `service_role` key ke frontend.
4. Pada Supabase Authentication, sesuaikan URL configuration untuk alamat tempat aplikasi akan dibuka. Pastikan aturan email confirmation sesuai kebutuhan perusahaan.
5. Buat akun dan login ke KlaimKu menggunakan email yang akan dijadikan admin.
6. Buka `database/bootstrap-admin.sql`, ganti `GANTI_DENGAN_EMAIL_LOGIN_ANDA` dengan email login Anda, lalu jalankan seluruh skrip di SQL Editor. Skrip ini menambahkan departemen dan kategori awal serta menautkan akun menjadi admin.

7. Muat ulang KlaimKu. Admin dapat mengelola data master dan menyetujui pengajuan. Hak akses database tetap diperiksa dengan Row Level Security; publishable key bukan pengganti autentikasi.

Jika Finance/Admin tidak dapat membuat pengajuan untuk karyawan lain, jalankan `database/fix-reimbursement-insert-policy.sql` di SQL Editor lalu muat ulang aplikasi.

## Fitur

- Dashboard ringkasan, tren bulanan, kategori teratas, dan pengajuan terbaru.
- Master karyawan, departemen, dan kategori dengan tambah, ubah, hapus, dan pencarian.
- Pengajuan reimbursement, validasi batas kategori, detail, persetujuan, dan penolakan dengan alasan.
- Peran karyawan, finance, dan admin, beserta kebijakan RLS pada empat tabel.
- Layout responsif, navigasi mobile, ilustrasi uang SVG, dan animasi yang menghormati pengaturan reduced motion.