# ADR 0003: HTML5 Canvas Renderer untuk Ekspor Gambar Sertifikat & Stiker

## Context & Decision
Pengguna ingin menyimpan dan membagikan Sertifikat Petualang & Album Buku Stiker ke media sosial atau grup WhatsApp keluarga. Kami memutuskan menggunakan **HTML5 Canvas 2D Context API** untuk merender gambar resolusi tinggi (PNG) secara dinamis langsung di sisi browser client.

## Trade-offs & Rationale
- **Siap Siap Bagikan di HP**: Gambar PNG yang dihasilkan dapat langsung diunduh ke Galeri Foto HP atau dibagikan via WhatsApp tanpa dialog cetak dokumen (`window.print`).
- **Murni Client-Side**: Tidak membutuhkan pustaka converter PDF server-side yang berat.
- **Kualitas Visual**: Mempertahankan warna cerah, stiker bintang, dan nama anak sesuai desain asli aplikasi.
