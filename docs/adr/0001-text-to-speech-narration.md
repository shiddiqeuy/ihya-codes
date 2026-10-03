# ADR 0001: Web Speech API untuk Narasi Suara Indonesia Mode Balita

## Context & Decision
Anak usia 2-4 tahun belum dapat membaca instruksi teks. Kami memutuskan untuk memanfaatkan **Web Speech API (`window.speechSynthesis`)** dengan pengisi suara bahasa Indonesia (`id-ID`) untuk membacakan narasi BIMO, nama objek, dan petunjuk game secara otomatis.

## Trade-offs & Rationale
- **Tanpa Dependency Tambahan**: Tidak memerlukan server backend audio atau file MP3 eksternal yang besar, membuat aplikasi tetap ringan (< 200KB).
- **Aksesibilitas Balita**: Balita dapat bermain secara mandiri tanpa harus didampingi orang tua secara terus-menerus untuk membacakan teks.
- **Fallback Halus**: Jika browser tidak mendukung Speech API atau suara dimatikan via Mute Button, aplikasi secara otomatis berjalan dalam mode visual murni tanpa melempar exception.
