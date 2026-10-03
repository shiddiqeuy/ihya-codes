# ADR 0002: Saklar Multi-Profil Anak di LocalStorage

## Context & Decision
Satu perangkat HP atau komputer keluarga sering digunakan oleh lebih dari satu anak (misal: Kakak usia 6 tahun dan Adik usia 3 tahun). Kami memutuskan untuk mengimplementasikan **Saklar Multi-Profil Anak** (hingga 3 profil) yang tersimpan secara terisolasi di `localStorage`.

## Trade-offs & Rationale
- **Isolasi Progress**: Progress bintang, bab yang diselesaikan, dan album Buku Stiker tersimpan khusus untuk setiap nama profil anak sehingga tidak tertukar antara Kakak dan Adik.
- **Tanpa Login/Database**: Tidak memerlukan autentikasi email atau database server cloud, menjaga privasi anak dan kesederhanaan aplikasi secara penuh.
- **Kemudahan Peralihan**: Anak atau orang tua dapat berganti profil dengan 1 kali klik di halaman Beranda.
