export type Role = 'ADMIN' | 'PETUGAS';

export type UserStatus = 'Aktif' | 'Tidak Aktif';

export interface User {
  id: string;
  username: string;
  password: string; // SHA-256 hashed
  nama: string;
  role: Role;
  status: UserStatus;
  created_at: string;
}

export type Gender = 'L' | 'P';
export type MemberStatus = 'Aktif' | 'Tidak Aktif';

export interface Member {
  id: string;
  kode_anggota: string; // e.g. AGT-00001
  qr_token: string;
  nis: string;
  nisn: string;
  nama: string;
  kelas: string;
  jenis_kelamin: Gender;
  no_hp: string;
  alamat: string;
  foto: string;
  status: MemberStatus;
  created_at: string;
}

export type BookStatus = 'Tersedia' | 'Dipinjam' | 'Perbaikan' | 'Hilang';

export interface Book {
  id: string;
  kode_buku: string; // e.g. BK-00001
  qr_token: string;
  isbn: string;
  judul: string;
  penulis: string;
  penerbit: string;
  tahun: number;
  kategori_id: string;
  rak: string;
  stok: number;
  cover: string;
  deskripsi: string;
  status: BookStatus;
  created_at: string;
}

export interface Category {
  id: string;
  nama: string;
  created_at: string;
}

export type TransactionStatus = 'Dipinjam' | 'Dikembalikan' | 'Terlambat' | 'Sebagian';
export type ReturnCondition = 'Baik' | 'Rusak Ringan' | 'Rusak Berat' | 'Hilang';
export type DetailStatus = 'Dipinjam' | 'Dikembalikan' | 'Hilang' | 'Rusak';

export interface TransactionDetail {
  id: string;
  transaksi_id: string;
  buku_id: string;
  kondisi_kembali?: ReturnCondition | null;
  catatan_kondisi?: string;
  status: DetailStatus;
  tanggal_kembali?: string | null;
  denda?: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  kode_transaksi: string; // e.g. PJM-20261002-0001
  anggota_id: string;
  petugas_id: string;
  tanggal_pinjam: string; // YYYY-MM-DD
  tanggal_jatuh_tempo: string; // YYYY-MM-DD
  tanggal_kembali?: string | null;
  status: TransactionStatus;
  catatan?: string;
  created_at: string;
}

export interface Settings {
  id: string;
  nama_sekolah: string;
  nama_perpustakaan: string;
  alamat: string;
  telepon: string;
  email: string;
  logo: string;
  nama_kepala_sekolah?: string;
  nip_kepala_sekolah?: string;
  nama_petugas?: string;
  nip_petugas?: string;
  maksimal_peminjaman: number; // e.g. 3
  lama_peminjaman: number; // e.g. 7 hari
  denda_per_hari: number; // e.g. 1000
  format_kode_transaksi: string; // e.g. PJM-YYYYMMDD-####
}

// Populated or View Model helper types
export interface TransactionWithDetails extends Transaction {
  anggota?: Member;
  petugas?: User;
  details: (TransactionDetail & { buku?: Book })[];
}

export interface ActiveLoanItem {
  detailId: string;
  transaksiId: string;
  kodeTransaksi: string;
  buku: Book;
  tanggalPinjam: string;
  tanggalJatuhTempo: string;
  isTerlambat: boolean;
  hariTerlambat: number;
  estimasiDenda: number;
}
