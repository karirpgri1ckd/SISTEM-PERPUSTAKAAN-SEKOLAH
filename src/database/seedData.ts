import { User, Member, Book, Category, Transaction, TransactionDetail, Settings } from '../types';

export const SEED_CATEGORIES: Category[] = [
  { id: 'cat-1', nama: 'Fiksi & Sastra', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cat-2', nama: 'Novel', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cat-3', nama: 'Pelajaran & Buku Teks', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cat-4', nama: 'Sains & Matematika', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cat-5', nama: 'Sejarah & Budaya', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cat-6', nama: 'Teknologi & Komputer', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cat-7', nama: 'Agama & Budi Pekerti', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cat-8', nama: 'Pengembangan Diri & Nonfiksi', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cat-9', nama: 'Referensi & Ensiklopedia', created_at: '2026-01-01T00:00:00Z' },
];

export const SEED_SETTINGS: Settings = {
  id: 'setting-1',
  nama_sekolah: 'Perpustakaan Sekolah',
  nama_perpustakaan: 'Sistem Informasi Perpustakaan',
  alamat: 'Jl. Sekolah No. 1',
  telepon: '',
  email: '',
  logo: '',
  maksimal_peminjaman: 3,
  lama_peminjaman: 7,
  denda_per_hari: 1000,
  format_kode_transaksi: 'PJM-YYYYMMDD-####'
};

// Kosong untuk produksi (data diinput mandiri via Form / Import Excel)
export const SEED_MEMBERS: Member[] = [];

// Kosong untuk produksi (data diinput mandiri via Form / Import Excel)
export const SEED_BOOKS: Book[] = [];

// Akun Pengguna Bawaan Bersih
export const SEED_USERS_RAW: (Omit<User, 'password'> & { rawPassword: string })[] = [
  {
    id: 'usr-1',
    username: 'admin',
    rawPassword: 'admin123',
    nama: 'Administrator',
    role: 'ADMIN',
    status: 'Aktif',
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'usr-2',
    username: 'petugas',
    rawPassword: 'petugas123',
    nama: 'Petugas Perpustakaan',
    role: 'PETUGAS',
    status: 'Aktif',
    created_at: '2026-01-01T00:00:00Z'
  }
];

// Transaksi Kosong untuk awal produksi
export const SEED_TRANSACTIONS: Transaction[] = [];

// Detail Transaksi Kosong untuk awal produksi
export const SEED_TRANSACTION_DETAILS: TransactionDetail[] = [];
