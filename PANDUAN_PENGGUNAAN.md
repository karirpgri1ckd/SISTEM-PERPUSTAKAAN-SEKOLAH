# BUKU PANDUAN PENGGUNAAN
## SISTEM INFORMASI PERPUSTAKAAN SEKOLAH

Buku panduan ini disusun sebagai pedoman operasional lengkap bagi **Administrator** dan **Petugas Perpustakaan** dalam mengoperasikan aplikasi Sistem Informasi Perpustakaan Sekolah.

---

### DAFTAR ISI
1. [Pengenalan & Akun Masuk (Login)](#1-pengenalan--akun-masuk-login)
2. [Pengaturan Identitas Sekolah & NUPTK Pejabat](#2-pengaturan-identitas-sekolah--nuptk-pejabat)
3. [Manajemen Koleksi Buku](#3-manajemen-koleksi-buku)
4. [Manajemen Anggota & Cetak Kartu Anggota (8 Kartu / Lembar A4)](#4-manajemen-anggota--cetak-kartu-anggota-8-kartu--lembar-a4)
5. [Alur Transaksi Sirkulasi Peminjaman Buku](#5-alur-transaksi-sirkulasi-peminjaman-buku)
6. [Alur Transaksi Sirkulasi Pengembalian & Denda Keterlambatan](#6-alur-transaksi-sirkulasi-pengembalian--denda-keterlambatan)
7. [Laporan Perpustakaan & Pengesahan Dokumen](#7-laporan-perpustakaan--pengesahan-dokumen)
8. [Pemeliharaan Sistem & Cadangan Data (Backup & Restore)](#8-pemeliharaan-sistem--cadangan-data-backup--restore)
9. [Tips Penggunaan Alat Scanner & Tanya Jawab (FAQ)](#9-tips-penggunaan-alat-scanner--tanya-jawab-faq)

---

### 1. Pengenalan & Akun Masuk (Login)

Aplikasi ini berbasis web modern (Progressive Web App) yang dapat diakses melalui laptop, komputer perpustakaan, maupun tablet. Sistem mendukung pemindaian Barcode/QR Code untuk mempercepat pelayanan tanpa perlu mengetik manual.

#### Tingkat Akses (Role):
- **Administrator (Admin)**: Mengelola seluruh data, laporan, akun pengguna, pengaturan identitas, pejabat & NUPTK, aturan denda, serta pencadangan database.
- **Petugas**: Melayani transaksi peminjaman, pengembalian buku, pembayaran denda, melihat katalog buku, dan data anggota.

#### Akun Masuk Standar (Default Login):
| Peran | Username | Password Standar | Keterangan |
|---|---|---|---|
| **Administrator** | `admin` | `admin123` | Hak akses penuh |
| **Petugas Perpustakaan** | `petugas` | `petugas123` | Operasional sirkulasi harian |

> ⚠️ **Penting**: Segera ganti kata sandi bawaan melalui menu **Pengguna** demi menjaga keamanan data sekolah.

---

### 2. Pengaturan Identitas Sekolah & NUPTK Pejabat

Sebelum memulai operasional harian, Administrator disarankan melengkapi data sekolah melalui menu **Pengaturan**:

1. **Identitas Sekolah & Logo**:
   - **Nama Sekolah**: Nama resmi lembaga sekolah (contoh: *SMA Negeri 1 Harapan Bangsa*).
   - **Nama Perpustakaan**: Nama unit perpustakaan (contoh: *Perpustakaan Graha Pustaka*).
   - **Alamat, Telepon & Email**: Tercetak otomatis di kop laporan dan kartu anggota.
   - **Logo Perpustakaan / Sekolah**: Tempelkan URL logo untuk ditampilkan di kartu anggota dan kop surat.

2. **Pejabat Penanggung Jawab & NUPTK**:
   - **Nama Kepala Sekolah**: Masukkan nama lengkap beserta gelar (contoh: *Drs. H. Mulyadi, M.Pd*).
   - **NUPTK Kepala Sekolah**: Nomor Unik Pendidik dan Tenaga Kependidikan (16 digit) Kepala Sekolah.
   - **Nama Petugas / Kepala Perpustakaan**: Nama penanggung jawab teknis perpustakaan.
   - **NUPTK Petugas / Kepala Perpustakaan**: NUPTK penanggung jawab perpustakaan.
   *Data ini secara otomatis terhubung dan dicetak pada bagian tanda tangan pengesahan seluruh Laporan PDF resmi, lembar cetak browser, dan struk transaksi.*

3. **Ketentuan Sirkulasi & Denda**:
   - **Maksimal Peminjaman**: Batas jumlah eksemplar buku yang boleh dipinjam oleh satu siswa dalam satu waktu (misal: 3 buku).
   - **Lama Peminjaman**: Batas hari peminjaman sebelum dinyatakan terlambat (misal: 7 hari).
   - **Tarif Denda**: Nominal denda harian per buku per hari keterlambatan (misal: Rp 1.000).

---

### 3. Manajemen Koleksi Buku

Menu **Data Buku** digunakan untuk mengelola seluruh eksemplar buku perpustakaan.

#### A. Menambah Buku Baru (Manual)
1. Klik tombol **"Tambah Buku"**.
2. Masukkan **Kode Buku** (unik, misal: `BK-001`), **Judul Buku**, **Pengarang**, **Penerbit**, **Tahun Terbit**, **Kategori**, **Nomor Rak** (misal: `Rak A-02`), dan **Jumlah Stok**.
3. Klik **Simpan**.

#### B. Impor Data Buku Massal (Excel)
1. Klik tombol **"Import Excel"**.
2. Klik tautan **"Download Template Excel"** untuk mengunduh format tabel standar.
3. Buka file Excel dan masukkan data buku Anda.
4. Unggah berkas Excel tersebut ke sistem. Ratusan buku akan tersimpan otomatis.

#### C. Cetak Barcode / QR Code Buku
- Pada tabel data buku, klik tombol **Barcode/QR** untuk melihat atau mencetak label kode batang.
- Gunting label dan tempelkan pada sampul/punggung buku untuk discan saat transaksi.

---

### 4. Manajemen Anggota & Cetak Kartu Anggota (8 Kartu / Lembar A4)

Menu **Data Anggota** digunakan untuk mencatat identitas siswa, guru, dan staf sekolah.

#### A. Menambah Anggota
- Masukkan **NIS / NIP**, **Nama Lengkap**, **Kelas / Jabatan**, **Alamat**, dan **Nomor WhatsApp/HP**.
- Sistem juga mendukung **Import Excel Anggota** untuk memasukkan data seluruh siswa per kelas secara cepat.

#### B. Cetak Kartu Anggota Resmi:
1. **Cetak Satuan**:
   - Klik ikon **Kartu (Cetak)** pada baris siswa yang bersangkutan.
   - Tampil pratinjau kartu anggota berstandar CR80.
   - Anda dapat mengklik tombol **Cetak** (ke printer) atau **PDF** (simpan file PDF satuan).
2. **Cetak Massal (Batch 8 Kartu per A4)**:
   - Klik tombol **"Cetak Semua Kartu (PDF)"** di bagian atas tabel Anggota.
   - Sistem menghasilkan file PDF dengan tata letak presisi **8 kartu per lembar kertas A4**.
   - Setiap kartu memuat kop perpustakaan, pasfoto 3x4 (atau placeholder siluet), NIS, kelas, masa berlaku, dan QR Code pemindai cepat.

---

### 5. Alur Transaksi Sirkulasi Peminjaman Buku

1. Buka menu **Peminjaman** (atau klik tombol *Peminjaman Baru* di Dashboard).
2. **Identifikasi Peminjam**:
   - Arahkan scanner ke **QR Code kartu anggota siswa**, ATAU ketik nama/NIS siswa pada kotak pencarian.
   - Sistem otomatis memeriksa status aktif dan sisa kuota pinjam siswa.
3. **Pindai Buku**:
   - Scan barcode pada buku fisik, ATAU ketik judul buku.
   - Buku yang discan akan otomatis masuk ke daftar peminjaman.
4. **Periksa & Konfirmasi**:
   - Periksa tanggal peminjaman dan batas tanggal jatuh tempo.
   - Klik tombol **"Simpan Transaksi Peminjaman"**.
5. **Cetak Struk Bukti**:
   - Klik **Cetak Bukti Peminjaman** untuk mencetak struk sebagai tanda terima bagi siswa yang memuat daftar buku, tanggal jatuh tempo pengembalian, dan nama petugas.

---

### 6. Alur Transaksi Sirkulasi Pengembalian & Denda Keterlambatan

1. Buka menu **Pengembalian**.
2. **Cari Transaksi Peminjaman**:
   - Scan QR Code pada bukti peminjaman siswa, ATAU ketik nama siswa / kode transaksi.
3. **Kalkulasi Denda Otomatis**:
   - Jika buku dikembalikan melewati tanggal jatuh tempo, sistem menghitung otomatis hari keterlambatan dan jumlah denda:
     $$\text{Denda} = \text{Hari Terlambat} \times \text{Tarif Denda per Hari} \times \text{Jumlah Buku Terlambat}$$
4. **Pilih Buku yang Dikembalikan**:
   - Beri centang pada buku yang dikembalikan (mendukung pengembalian bertahap).
   - Pilih status pelunasan denda (*Lunas* atau *Belum Lunas*).
5. **Konfirmasi & Cetak Bukti**:
   - Klik **"Proses Pengembalian"**. Stok buku akan otomatis kembali bertambah di rak perpustakaan.
   - Cetak struk bukti pengembalian dan kuitansi denda resmi.

---

### 7. Laporan Perpustakaan & Pengesahan Dokumen

Menu **Laporan** menyediakan sarana audit dan laporan periodik ke pimpinan sekolah.

#### Macam-Macam Laporan:
- **Laporan Inventaris Buku**: Rekap seluruh judul, pengarang, penerbit, kategori, dan posisi rak.
- **Laporan Data Anggota**: Rekap anggota terdaftar per kelas.
- **Laporan Sirkulasi Peminjaman**: Riwayat seluruh peminjaman buku dalam kurun waktu harian, mingguan, atau bulanan.
- **Laporan Sirkulasi Pengembalian**: Rekap pengembalian buku dan status kondisi buku.
- **Laporan Denda Keterlambatan**: Rincian pemasukan kas denda perpustakaan.

#### Fitur Ekspor Dokumen Resmi:
- **Export Excel (.xlsx)**: Untuk pengolahan data lanjutan atau arsip digital.
- **Export PDF Resmi**: Dokumen siap cetak dengan kop sekolah, tabel rapi, serta **blok tanda tangan pengesahan Kepala Sekolah & Kepala Perpustakaan lengkap dengan NUPTK**.

---

### 8. Pemeliharaan Sistem & Cadangan Data (Backup & Restore)

Data transaksi dan koleksi perpustakaan tersimpan secara lokal dan aman di browser komputer petugas. Untuk menjaga keamanan data:

1. **Rutin Melakukan Cadangan (Backup)**:
   - Masuk ke menu **Pengaturan** > bagian **Cadangan Data (Backup & Restore)**.
   - Klik tombol **"Unduh Backup Database"**.
   - Berkas berekstensi `.json` akan tersimpan di komputer Anda. Simpan file ini di flashdisk atau Google Drive secara rutin (misal setiap Jumat sore).
2. **Memulihkan Data (Restore)**:
   - Jika berpindah komputer atau peramban dibersihkan, buka menu **Pengaturan**.
   - Klik tombol **"Pilih File Backup"** lalu pilih berkas cadangan `.json`.
   - Klik **"Pulihkan Data (Restore)"**. Seluruh buku, anggota, dan riwayat transaksi akan kembali utuh.

---

### 9. Tips Penggunaan Alat Scanner & Tanya Jawab (FAQ)

- **Pemindai Barcode (Scanner)**:
  Sistem mendukung segala merk **USB Barcode Scanner** dan **Bluetooth Wireless Scanner** (tipe *keyboard wedge/HID*). Cukup colokkan ke komputer tanpa perlu install aplikasi driver tambahan.
- **Pemindai Kamera**:
  Jika tidak memiliki alat scanner fisik, gunakan tombol **Scan Kamera** di aplikasi untuk memindai QR Code menggunakan webcam laptop atau kamera HP.
- **Pengaturan Cetak Printer (Margins & Background)**:
  Saat mencetak kartu anggota atau laporan PDF:
  - Atur **Margins (Batas)** ke *None* atau *Minimum*.
  - Pastikan opsi **Background graphics (Grafik Latar Belakang)** dicentang agar warna kartu dan garis kop tercetak tajam.
- **Format Kertas Cetak Kartu Anggota**:
  Gunakan kertas A4 tebal (misal: *Matte Photo Paper 210-230 gsm*) saat mencetak batch 8 kartu, kemudian potong sesuai garis batas dan masukkan ke plastik holder ID card atau dilaminasi.

---
*Diterbitkan untuk Perpustakaan Sekolah — Sistem Informasi Perpustakaan Terpadu.*
