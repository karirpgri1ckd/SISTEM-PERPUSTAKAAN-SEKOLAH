import { db } from '../database/db';
import { Book } from '../types';

export class BookService {
  getAll(): Book[] {
    return db.getBooks();
  }

  getById(id: string): Book | undefined {
    return db.getBookById(id);
  }

  getByCodeOrQr(code: string): Book | undefined {
    return db.getBookByCodeOrQr(code);
  }

  search(query: string, categoryId?: string, statusFilter?: string): Book[] {
    let list = this.getAll();

    if (categoryId && categoryId !== 'all') {
      list = list.filter(b => b.kategori_id === categoryId);
    }

    if (statusFilter && statusFilter !== 'all') {
      list = list.filter(b => b.status === statusFilter);
    }

    if (!query.trim()) return list;

    const q = query.trim().toLowerCase();
    return list.filter(
      b => b.judul.toLowerCase().includes(q) ||
           b.kode_buku.toLowerCase().includes(q) ||
           b.penulis.toLowerCase().includes(q) ||
           b.penerbit.toLowerCase().includes(q) ||
           b.isbn.toLowerCase().includes(q) ||
           b.rak.toLowerCase().includes(q)
    );
  }

  save(book: Partial<Book>): { success: boolean; book?: Book; error?: string } {
    const books = db.getBooks();

    // Check code uniqueness
    if (book.kode_buku) {
      const dup = books.find(b => b.kode_buku.toUpperCase() === book.kode_buku?.toUpperCase() && b.id !== book.id);
      if (dup) {
        return { success: false, error: `Kode buku ${book.kode_buku} sudah digunakan oleh "${dup.judul}"` };
      }
    }

    const id = book.id || `bk-${Date.now()}`;
    const kode_buku = book.kode_buku || db.generateNextBookCode();

    const fullBook: Book = {
      id,
      kode_buku,
      qr_token: book.qr_token || kode_buku,
      isbn: book.isbn || '',
      judul: book.judul || '',
      penulis: book.penulis || '',
      penerbit: book.penerbit || '',
      tahun: Number(book.tahun) || new Date().getFullYear(),
      kategori_id: book.kategori_id || 'cat-1',
      rak: book.rak || 'R-01-A',
      stok: Number(book.stok) ?? 1,
      cover: book.cover || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&auto=format&fit=crop&q=80',
      deskripsi: book.deskripsi || '',
      status: (Number(book.stok) > 0 ? (book.status || 'Tersedia') : 'Dipinjam'),
      created_at: book.created_at || new Date().toISOString()
    };

    db.saveBook(fullBook);
    return { success: true, book: fullBook };
  }

  delete(id: string): { success: boolean; error?: string } {
    const details = db.getTransactionDetails();
    const isCurrentlyBorrowed = details.some(d => d.buku_id === id && d.status === 'Dipinjam');
    if (isCurrentlyBorrowed) {
      return {
        success: false,
        error: 'Buku ini sedang dipinjam oleh siswa, tidak dapat dihapus.'
      };
    }
    db.deleteBook(id);
    return { success: true };
  }

  getBorrowHistory(bookId: string) {
    const details = db.getTransactionDetails().filter(d => d.buku_id === bookId);
    const transactions = db.getTransactions();
    const members = db.getMembers();

    return details.map(d => {
      const trx = transactions.find(t => t.id === d.transaksi_id);
      const member = trx ? members.find(m => m.id === trx.anggota_id) : undefined;
      return {
        detail: d,
        transaksi: trx,
        anggota: member
      };
    });
  }
}

export const bookService = new BookService();
