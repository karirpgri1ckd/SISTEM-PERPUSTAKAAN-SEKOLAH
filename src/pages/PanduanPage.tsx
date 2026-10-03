import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Printer,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Users,
  ArrowUpRight,
  ArrowDownLeft,
  BarChart3,
  Settings,
  HelpCircle,
  FileSpreadsheet,
  QrCode,
  CreditCard,
  Database,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
  Layers,
  Award
} from 'lucide-react';
import { Settings as SettingsType } from '../types';

interface PanduanPageProps {
  settings: SettingsType;
}

interface Section {
  id: string;
  title: string;
  badge: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export const PanduanPage: React.FC<PanduanPageProps> = ({ settings }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    pengenalan: true,
    pengaturan: true,
    buku: false,
    anggota: false,
    peminjaman: false,
    pengembalian: false,
    laporan: false,
    backup: false,
    faq: false
  });

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const allOpen: Record<string, boolean> = {};
    sections.forEach(s => {
      allOpen[s.id] = true;
    });
    setOpenSections(allOpen);
  };

  const collapseAll = () => {
    setOpenSections({});
  };

  const handlePrint = () => {
    // Expand all before printing
    expandAll();
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const sections: Section[] = [
    {
      id: 'pengenalan',
      title: '1. Pengenalan Sistem & Akun Masuk (Login)',
      badge: 'Dasar',
      icon: <ShieldCheck className="w-5 h-5 text-blue-600" />,
      content: (
        <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
          <p>
            Sistem Informasi Perpustakaan Sekolah ini dirancang untuk mempermudah dan mempercepat pengelolaan koleksi buku, data keanggotaan siswa/guru, sirkulasi peminjaman &amp; pengembalian dengan barcode/QR code, kalkulasi denda otomatis, hingga pembuatan laporan resmi berstandar sekolah.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-2">
            <h4 className="font-bold text-blue-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-700" />
              <span>Tingkatan Hak Akses Pengguna</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="bg-white p-3.5 rounded-xl border border-blue-100 shadow-2xs">
                <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 font-bold text-xs rounded-md mb-1">
                  Administrator
                </span>
                <p className="text-xs text-slate-600 leading-normal">
                  Memiliki akses penuh ke seluruh fitur: sirkulasi, data buku, data anggota, laporan ekspor, pengaturan sistem (identitas sekolah, kepala sekolah, NUPTK, aturan denda), manajemen akun pengguna, serta backup &amp; restore database.
                </p>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-blue-100 shadow-2xs">
                <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-md mb-1">
                  Petugas Perpustakaan
                </span>
                <p className="text-xs text-slate-600 leading-normal">
                  Fokus pada operasional harian: pelayanan peminjaman, penerimaan pengembalian buku, penagihan denda keterlambatan, manajemen buku &amp; anggota, serta melihat laporan sirkulasi harian.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <h4 className="font-bold text-slate-800 mb-2">Akun Bawaan (Default Login):</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <div className="font-bold text-slate-700">Akun Admin:</div>
                <div className="text-slate-600 font-mono mt-1">Username: <strong>admin</strong></div>
                <div className="text-slate-600 font-mono">Password: <strong>admin123</strong></div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <div className="font-bold text-slate-700">Akun Petugas:</div>
                <div className="text-slate-600 font-mono mt-1">Username: <strong>petugas</strong></div>
                <div className="text-slate-600 font-mono">Password: <strong>petugas123</strong></div>
              </div>
            </div>
            <p className="text-[11px] text-amber-700 mt-2 font-medium">
              * Segera ubah kata sandi akun bawaan pada menu <strong>Pengguna</strong> demi keamanan data perpustakaan sekolah.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'pengaturan',
      title: '2. Pengaturan Identitas Sekolah & NUPTK Pejabat',
      badge: 'Penting',
      icon: <Settings className="w-5 h-5 text-indigo-600" />,
      content: (
        <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
          <p>
            Menu <strong>Pengaturan</strong> (khusus Administrator) berfungsi untuk mengonfigurasi data resmi yang akan dicetak pada kartu anggota, struk bukti peminjaman, serta kop surat dan tanda tangan lembar laporan resmi.
          </p>

          <div className="space-y-3">
            <div className="flex gap-3 items-start bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                1
              </span>
              <div>
                <h5 className="font-bold text-slate-800 text-xs">Identitas Lembaga &amp; Logo</h5>
                <p className="text-xs text-slate-600 mt-0.5">
                  Isikan <strong>Nama Sekolah</strong>, <strong>Nama Perpustakaan</strong>, <strong>Alamat Lengkap</strong>, nomor telepon, dan email sekolah. Masukkan URL logo sekolah atau logo perpustakaan agar tampil di kartu anggota dan kop laporan.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-200">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                2
              </span>
              <div>
                <h5 className="font-bold text-indigo-950 text-xs flex items-center gap-1.5">
                  <span>Nama Pejabat &amp; NUPTK (Terkoneksi ke Semua Fitur Cetak)</span>
                  <Award className="w-3.5 h-3.5 text-indigo-600" />
                </h5>
                <p className="text-xs text-slate-700 mt-0.5">
                  Lengkapi data:
                </p>
                <ul className="list-disc list-inside text-xs text-slate-700 mt-1 space-y-0.5 pl-1">
                  <li><strong>Nama Kepala Sekolah</strong> &amp; <strong>NUPTK Kepala Sekolah</strong></li>
                  <li><strong>Nama Petugas / Kepala Perpustakaan</strong> &amp; <strong>NUPTK Petugas</strong></li>
                </ul>
                <p className="text-[11px] text-indigo-800 mt-1.5 font-medium bg-white/70 p-2 rounded-lg border border-indigo-100">
                  Data ini otomatis terhubung dan dicetak pada bagian tanda tangan pengesahan di seluruh lembar <strong>Laporan PDF</strong>, <strong>Cetak Browser</strong>, serta nama petugas pada <strong>Struk Peminjaman &amp; Pengembalian</strong>.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                3
              </span>
              <div>
                <h5 className="font-bold text-slate-800 text-xs">Aturan Sirkulasi &amp; Denda</h5>
                <p className="text-xs text-slate-600 mt-0.5">
                  Tentukan <strong>Maksimal Buku yang Dapat Dipinjam</strong> (misal 3 buku), <strong>Durasi Lama Pinjam</strong> (misal 7 hari), dan <strong>Tarif Denda per Hari</strong> (misal Rp 1.000 / hari per buku terlambat).
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'buku',
      title: '3. Manajemen Koleksi Buku & Cetak Barcode',
      badge: 'Koleksi',
      icon: <BookOpen className="w-5 h-5 text-emerald-600" />,
      content: (
        <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
          <p>
            Menu <strong>Data Buku</strong> menyediakan sarana lengkap untuk mengelola inventaris buku, mencetak label kode batang (barcode), serta impor data massal dari file Microsoft Excel.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Input Buku Manual</span>
              </div>
              <p className="text-slate-600">
                Klik tombol <strong>"Tambah Buku"</strong> di sudut kanan atas. Masukkan Kode Buku (unik, misal: <em>BK-001</em>), Judul, Pengarang, Penerbit, Tahun Terbit, Kategori, Letak Rak (misal: <em>Rak A-02</em>), dan Jumlah Stok eksemplar.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Import Massal dari Excel</span>
              </div>
              <p className="text-slate-600">
                Gunakan tombol <strong>"Import Excel"</strong> untuk mengunggah ratusan buku sekaligus. Sistem menyediakan tombol <strong>"Download Format Contoh"</strong> agar susunan kolom Excel sesuai standar sistem.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-emerald-600" />
                <span>Generate &amp; Cetak Barcode Buku</span>
              </div>
              <p className="text-slate-600">
                Setiap buku memiliki QR Code / Barcode yang dapat dicetak langsung. Tempelkan label barcode ini pada punggung atau sampul dalam buku untuk memudahkan scan saat peminjaman.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Manajemen Kategori Buku</span>
              </div>
              <p className="text-slate-600">
                Buku dikelompokkan berdasarkan kategori (Fiksi, Non-Fiksi, Pelajaran, Ensiklopedia, dsb.) yang dapat ditambah dan dikelola melalui menu <strong>Kategori Buku</strong>.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'anggota',
      title: '4. Manajemen Data Anggota & Cetak Kartu Anggota (Batch 8 Per Halaman)',
      badge: 'Anggota',
      icon: <CreditCard className="w-5 h-5 text-amber-600" />,
      content: (
        <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
          <p>
            Menu <strong>Data Anggota</strong> digunakan untuk mendata seluruh siswa, guru, dan staf sekolah yang berhak meminjam buku di perpustakaan.
          </p>

          <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 space-y-2">
            <h4 className="font-bold text-amber-900 text-xs flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-700" />
              <span>Fitur Unggulan: Cetak Kartu Anggota Standar CR80</span>
            </h4>
            <p className="text-xs text-slate-700 leading-normal">
              Sistem telah dilengkapi modul pembuatan kartu anggota resmi yang dilengkapi kop sekolah, pasfoto, identitas siswa, masa berlaku, dan QR Code pemindai cepat:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="bg-white p-3 rounded-xl border border-amber-100">
                <div className="font-bold text-xs text-slate-800">Cetak Satuan:</div>
                <p className="text-[11px] text-slate-600 mt-1">
                  Klik tombol <strong>Cetak Kartu</strong> pada baris siswa yang bersangkutan. Anda dapat melihat pratinjau kartu lalu mencetaknya langsung atau mengunduh berkas PDF satuan.
                </p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-amber-100">
                <div className="font-bold text-xs text-slate-800">Cetak Massal (Semua Kartu):</div>
                <p className="text-[11px] text-slate-600 mt-1">
                  Klik tombol <strong>"Cetak Semua Kartu (PDF)"</strong> di bagian atas. Sistem akan menghasilkan dokumen PDF siap cetak dengan format presisi <strong>8 kartu per lembar kertas A4</strong>, siap dipotong dan dilaminasi.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
            <div className="font-bold text-slate-800">Import Data Anggota via Excel:</div>
            <p className="text-slate-600">
              Sama seperti buku, Anda dapat mengimpor data seluruh siswa dari file Excel (NIS, Nama Lengkap, Kelas, No. HP, Alamat) hanya dengan satu klik.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'peminjaman',
      title: '5. Tata Cara Transaksi Peminjaman Buku',
      badge: 'Sirkulasi',
      icon: <ArrowUpRight className="w-5 h-5 text-emerald-600" />,
      content: (
        <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
          <p>
            Proses peminjaman buku dirancang sangat cepat menggunakan bantuan scanner barcode atau pencarian nama:
          </p>

          <ol className="space-y-3">
            <li className="flex gap-3 items-start bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                1
              </span>
              <div className="text-xs">
                <div className="font-bold text-slate-800">Pilih Anggota Peminjam</div>
                <p className="text-slate-600 mt-0.5">
                  Buka menu <strong>Peminjaman</strong>. Arahkan scanner ke QR Code kartu anggota siswa, atau ketik nama/NIS siswa di kolom pencarian. Sistem akan memvalidasi apakah siswa berstatus aktif dan kuota pinjam masih mencukupi.
                </p>
              </div>
            </li>

            <li className="flex gap-3 items-start bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                2
              </span>
              <div className="text-xs">
                <div className="font-bold text-slate-800">Pindai / Masukkan Buku</div>
                <p className="text-slate-600 mt-0.5">
                  Scan barcode buku atau ketik judul buku. Buku akan otomatis masuk ke keranjang peminjaman. Anda dapat menambahkan beberapa buku sekaligus sesuai kuota yang diizinkan.
                </p>
              </div>
            </li>

            <li className="flex gap-3 items-start bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                3
              </span>
              <div className="text-xs">
                <div className="font-bold text-slate-800">Simpan Transaksi &amp; Cetak Bukti</div>
                <p className="text-slate-600 mt-0.5">
                  Periksa tanggal jatuh tempo pengembalian. Klik <strong>"Simpan Transaksi Peminjaman"</strong>. Anda dapat mencetak <strong>Bukti Peminjaman</strong> (struk) sebagai pegangan siswa yang berisi daftar buku, tanggal jatuh tempo, dan nama petugas.
                </p>
              </div>
            </li>
          </ol>
        </div>
      )
    },
    {
      id: 'pengembalian',
      title: '6. Tata Cara Pengembalian Buku & Pelunasan Denda',
      badge: 'Sirkulasi',
      icon: <ArrowDownLeft className="w-5 h-5 text-blue-600" />,
      content: (
        <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
          <p>
            Menu <strong>Pengembalian</strong> menangani pengembalian buku dan menghitung denda keterlambatan secara otomatis berdasarkan tanggal jatuh tempo.
          </p>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="font-bold text-slate-800">Langkah 1: Cari Data Peminjaman Aktif</div>
              <p className="text-slate-600">
                Buka menu <strong>Pengembalian</strong>. Ketik nama siswa, nomor bukti transaksi, atau scan QR Code bukti peminjaman siswa untuk memunculkan detail transaksi.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="font-bold text-slate-800">Langkah 2: Cek Keterlambatan &amp; Denda</div>
              <p className="text-slate-600">
                Jika pengembalian melewati batas tanggal jatuh tempo, sistem akan secara otomatis menghitung selisih hari dan mengalikan dengan tarif denda yang telah diatur (misal: <em>Telat 3 hari × Rp 1.000 = Rp 3.000</em>).
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="font-bold text-slate-800">Langkah 3: Konfirmasi Pengembalian</div>
              <p className="text-slate-600">
                Pilih buku yang dikembalikan (bisa pengembalian penuh atau sebagian). Tandai status pembayaran denda (Lunas / Belum Lunas), lalu klik <strong>"Proses Pengembalian"</strong>. Stok buku akan otomatis bertambah kembali ke rak.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="font-bold text-slate-800">Langkah 4: Cetak Bukti Pengembalian</div>
              <p className="text-slate-600">
                Petugas dapat mencetak tanda bukti pengembalian dan kuitansi denda resmi yang memuat nama petugas dan nomor bukti transaksi.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'laporan',
      title: '7. Laporan Perpustakaan & Pengesahan Dokumen Resmi',
      badge: 'Laporan',
      icon: <BarChart3 className="w-5 h-5 text-purple-600" />,
      content: (
        <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
          <p>
            Menu <strong>Laporan</strong> menyediakan data rekapitulasi komprehensif untuk evaluasi berkala dan pelaporan resmi kepada Kepala Sekolah atau Pengawas Perpustakaan.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="font-bold text-slate-800">1. Laporan Data Buku</div>
              <p className="text-slate-600 mt-1">Daftar lengkap koleksi buku, nomor rak, stok, dan total eksemplar per kategori.</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="font-bold text-slate-800">2. Laporan Data Anggota</div>
              <p className="text-slate-600 mt-1">Rekap data siswa/anggota terdaftar aktif berdasarkan kelas dan jurusan.</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="font-bold text-slate-800">3. Laporan Peminjaman</div>
              <p className="text-slate-600 mt-1">Riwayat seluruh buku yang dipinjam pada rentang tanggal tertentu.</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="font-bold text-slate-800">4. Laporan Keterlambatan &amp; Denda</div>
              <p className="text-slate-600 mt-1">Rekap buku yang telat kembali serta rincian pemasukan kas denda perpustakaan.</p>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 space-y-2 text-xs">
            <h5 className="font-bold text-purple-900 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-purple-700" />
              <span>Format Ekspor Resmi Ber-Kop &amp; Tanda Tangan NUPTK</span>
            </h5>
            <p className="text-slate-700 leading-normal">
              Setiap laporan dapat diekspor menjadi <strong>Microsoft Excel (.xlsx)</strong> atau berkas <strong>PDF Resmi</strong>. Pada dokumen PDF, sistem menyertakan kop perpustakaan lengkap dengan alamat, tabel rapi bergaris, serta blok tanda tangan pengesahan di bawah:
            </p>
            <div className="bg-white p-3 rounded-xl border border-purple-150 flex justify-between items-center text-slate-800 text-[11px] font-mono">
              <div className="text-center">
                <div>Mengetahui,</div>
                <div className="font-bold">Kepala Sekolah</div>
                <div className="mt-4 font-bold underline">{settings.nama_kepala_sekolah || 'Drs. H. Mulyadi, M.Pd'}</div>
                <div className="text-slate-500">NUPTK. {settings.nip_kepala_sekolah || '-'}</div>
              </div>
              <div className="text-center">
                <div>Petugas / Kepala Perpustakaan</div>
                <div className="mt-4 font-bold underline">{settings.nama_petugas || 'Bambang Sudarsono, S.Pd'}</div>
                <div className="text-slate-500">NUPTK. {settings.nip_petugas || '-'}</div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'backup',
      title: '8. Pemeliharaan & Cadangan Data (Backup & Restore Database)',
      badge: 'Keamanan',
      icon: <Database className="w-5 h-5 text-rose-600" />,
      content: (
        <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
          <p>
            Data perpustakaan tersimpan secara aman di peramban (browser) komputer Anda. Untuk mengantisipasi kerusakan perangkat atau jika ingin memindahkan data ke komputer perpustakaan lain, gunakan fitur <strong>Backup &amp; Restore</strong>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Cara Mengunduh Cadangan (Backup)</span>
              </div>
              <ol className="list-decimal list-inside text-slate-600 space-y-1 pl-1">
                <li>Buka menu <strong>Pengaturan</strong>.</li>
                <li>Gulir ke bawah hingga bagian <strong>"Cadangan Data (Backup &amp; Restore)"</strong>.</li>
                <li>Klik tombol <strong>"Unduh Backup Database"</strong>.</li>
                <li>Simpan berkas `.json` tersebut di flashdisk atau Google Drive sekolah secara berkala (misal tiap akhir pekan).</li>
              </ol>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Cara Memulihkan Data (Restore)</span>
              </div>
              <ol className="list-decimal list-inside text-slate-600 space-y-1 pl-1">
                <li>Buka menu <strong>Pengaturan</strong> di komputer baru/tujuan.</li>
                <li>Klik tombol <strong>"Pilih File Backup"</strong> lalu pilih berkas backup `.json` sebelumnya.</li>
                <li>Klik <strong>"Pulihkan Data (Restore)"</strong>.</li>
                <li>Seluruh buku, anggota, transaksi, dan riwayat denda akan kembali seperti semula.</li>
              </ol>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'faq',
      title: '9. Tanya Jawab (FAQ) & Tips Penggunaan Alat Scanner',
      badge: 'Bantuan',
      icon: <HelpCircle className="w-5 h-5 text-teal-600" />,
      content: (
        <div className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <h5 className="font-bold text-slate-800 text-xs">T: Apakah aplikasi ini membutuhkan koneksi internet?</h5>
            <p className="text-xs text-slate-600">
              J: Aplikasi ini berbasis Progressive Web App (PWA) yang dapat berjalan lancar baik saat ada internet maupun secara offline di jaringan lokal perpustakaan.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <h5 className="font-bold text-slate-800 text-xs">T: Jenis scanner apa yang didukung?</h5>
            <p className="text-xs text-slate-600">
              J: Semua barcode scanner standar jenis <strong>USB Barcode Scanner</strong>, <strong>Bluetooth Wireless Scanner</strong>, maupun <strong>Kamera bawaan laptop/HP</strong> didukung penuh tanpa perlu driver tambahan (tipe HID keyboard emulation).
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <h5 className="font-bold text-slate-800 text-xs">T: Bagaimana jika hasil cetak printer terpotong?</h5>
            <p className="text-xs text-slate-600">
              J: Pada jendela cetak peramban (print dialog), pastikan opsi <strong>Margins (Batas Halaman)</strong> diatur ke <em>None</em> atau <em>Default</em>, dan centang opsi <strong>"Background Graphics" (Grafik Latar Belakang)</strong> agar warna kop dan garis tabel tercetak dengan sempurna.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <h5 className="font-bold text-slate-800 text-xs">T: Bagaimana jika ada siswa yang belum punya foto kartu?</h5>
            <p className="text-xs text-slate-600">
              J: Sistem otomatis menampilkan placeholder siluet siswa ("FOTO 3x4") sehingga kartu anggota tetap terlihat rapi, simetris, dan siap dicetak tanpa kendala.
            </p>
          </div>
        </div>
      )
    }
  ];

  const filteredSections = sections.filter(section => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      section.title.toLowerCase().includes(query) ||
      section.badge.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Dokumentasi Resmi &amp; Petunjuk Pengoperasian</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Buku Panduan Penggunaan Sistem Perpustakaan
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
              Panduan langkah demi langkah penggunaan fitur sirkulasi, manajemen buku, cetak kartu anggota standar CR80, pelunasan denda, hingga pembuatan laporan ber-NUPTK resmi di <strong>{settings.nama_sekolah}</strong>.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0 no-print">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
              title="Cetak Panduan Lengkap atau Simpan sebagai PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={expandAll}
              className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              Buka Semua
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              Tutup Semua
            </button>
          </div>
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs no-print">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari topik panduan (misal: denda, scan, nuptk)..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span><strong>{sections.length}</strong> Bab Panduan Tersedia</span>
          </div>
          <span className="hidden sm:inline text-slate-300">•</span>
          <div className="flex items-center gap-1.5">
            <Info className="w-4 h-4 text-emerald-600" />
            <span>Versi Sistem: <strong>2.5.0 Standar Sekolah</strong></span>
          </div>
        </div>
      </div>

      {/* Accordion List of Manual Chapters */}
      <div className="space-y-4">
        {filteredSections.map(section => {
          const isOpen = openSections[section.id];
          return (
            <div
              key={section.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden transition-all"
            >
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer border-b border-transparent"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-100 shrink-0">
                    {section.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm sm:text-base">
                        {section.title}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        {section.badge}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-slate-400 p-1">
                  {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-2 border-t border-slate-100">
                  {section.content}
                </div>
              )}
            </div>
          );
        })}

        {filteredSections.length === 0 && (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
            <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold">Topik panduan tidak ditemukan</p>
            <p className="text-xs text-slate-400 mt-1">Coba gunakan kata kunci lain seperti "buku", "kartu", "denda", atau "laporan".</p>
          </div>
        )}
      </div>

      {/* Official Footnote */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-700">
          Sistem Informasi Perpustakaan — {settings.nama_perpustakaan}
        </p>
        <p>{settings.nama_sekolah} • {settings.alamat}</p>
        <p className="text-[11px] text-slate-400">
          Penanggung Jawab: {settings.nama_petugas || 'Petugas Perpustakaan'} ({settings.nip_petugas ? `NUPTK. ${settings.nip_petugas}` : '-'}) &amp; {settings.nama_kepala_sekolah || 'Kepala Sekolah'} ({settings.nip_kepala_sekolah ? `NUPTK. ${settings.nip_kepala_sekolah}` : '-'})
        </p>
      </div>
    </div>
  );
};
