# Spesifikasi Fitur: Narasi Suara TTS, Multi-Profil Anak & Ekspor Gambar Sertifikat

## Problem Statement

Orang tua dan anak usia dini menghadapi 3 tantangan utama saat menggunakan aplikasi edukasi:
1. Anak balita (usia 2-4 tahun) belum dapat membaca teks instruksi di layar, sehingga balita memerlukan bantuan narasi lisan agar dapat bermain secara mandiri.
2. Ketika lebih dari satu anak (misalnya Kakak usia 6 tahun dan Adik usia 3 tahun) berbagi HP/komputer yang sama, progress bintang, bab yang telah diselesaikan, dan stiker digital mereka menjadi saling tertukar.
3. Fitur cetak sertifikat bawaan browser (`window.print()`) kurang ramah pengguna perangkat seluler (HP), sehingga orang tua kesulitan menyimpan sertifikat atau album stiker ke galeri foto HP untuk dibagikan ke WhatsApp keluarga.

## Solution

Mengimplementasikan 3 modul pengayaan utama pada aplikasi *Petualangan Coding Cilik*:
1. **Narator Suara BIMO (Web Speech API TTS Bahasa Indonesia)**: Pembacaan suara otomatis untuk setiap petunjuk permainan, dialog BIMO, dan nama objek saat tombol disentuh atau layar terbuka.
2. **Saklar Multi-Profil Anak**: Manajemen profil lokal (hingga 3 anak) dengan isolasi simpanan progress bintang, bab completed, dan Buku Stiker Digital di `localStorage`.
3. **Generator Gambar Sertifikat & Stiker (HTML5 Canvas Export)**: Fitur pembuatan file gambar PNG beresolusi tinggi yang dapat diunduh langsung ke galeri HP/PC.

## User Stories

1. As a toddler user (2-4yo), I want Robot BIMO to speak instructions out loud in Indonesian, so that I can play and learn computing concepts without needing to read text.
2. As a toddler user, I want objects to speak their names when I tap them (e.g. "Sabun!", "Roda!"), so that I learn vocabulary while playing.
3. As a parent, I want to toggle text-to-speech narration on or off, so that I can control sound levels depending on the environment.
4. As a parent with multiple children, I want to create separate profiles for each child on the welcome screen, so that their progress and stars do not get mixed up.
5. As a child user, I want to select my own name profile when starting the game, so that I see my personal star count and unlocked stickers.
6. As a parent, I want to switch between active profiles with a single click, so that both my 3-year-old and 6-year-old can take turns playing.
7. As a child who finished all chapters, I want to download a picture of my Certificate of Achievement, so that I can keep it in my photo gallery.
8. As a parent, I want to export my child's Digital Sticker Book as a PNG image, so that I can share their computing achievements on WhatsApp family groups.
9. As a parent, I want profile data to stay strictly local on my device, so that my children's data remains private and secure without needing account creation.
10. As a toddler user, I want narration to automatically pause if sound is muted, so that no audio overlaps with system sounds.

## Implementation Decisions

- **Domain Glossary Alignment**: Menggunakan istilah resmi dari `GLOSSARY.md` (*Mode Balita*, *Mode Anak*, *Robot BIMO*, *Buku Stiker Digital*, *Auto-Hint*, *Panduan Co-Play*).
- **Web Speech API Narration (ADR 0001)**: Menggunakan `window.speechSynthesis` dengan kode bahasa `id-ID`. Pengucapan disesuaikan dengan teks pesan BIMO dan petunjuk level.
- **LocalStorage Profile Schema (ADR 0002)**: Mengubah skema simpanan `localStorage` dari objek tunggal menjadi struktur berkunci `profiles: { [profileId]: ProfileData }` dan `activeProfileId: string`.
- **Canvas Rendering Engine (ADR 0003)**: Membuat modul utilitas pembuat Canvas 2D untuk menggambar Sertifikat Petualang & Album Buku Stiker secara prosedural, kemudian dikonversi menjadi data URL (`data:image/png`) untuk diunduh otomatis.

## Testing Decisions

- **Test Seam**: Pengujian dilakukan pada modul eksternal antarmuka pengguna (`STATE`, `toddlerState`, modul audio TTS, dan generator Canvas).
- **Behavioral Testing**:
  - Verifikasi bahwa pergantian profil anak berhasil mengubah nama, total bintang, bab selesai, dan stiker terbuka di UI.
  - Verifikasi fungsi fallback Web Speech API jika browser tidak memiliki engine bahasa Indonesia.
  - Verifikasi bahwa canvas mengembalikan data URL PNG yang valid tanpa CORS breakage.

## Out of Scope

- Autentikasi cloud atau login akun pengguna di server backend.
- Pengisian suara oleh pengisi suara rekaman studio MP3 (menggunakan Text-to-Speech browser).
- Integrasi SDK sosial media langsung (cukup dengan unduhan file PNG langsung).

## Further Notes

Fitur ini kompatibel penuh dengan semua game komputasi balita (15 level) dan mode petualangan anak (Bab 1-6) yang sudah ada.
