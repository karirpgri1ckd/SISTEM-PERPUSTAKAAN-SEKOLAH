import { db } from '../database/db';
import {
  Transaction,
  TransactionDetail,
  TransactionWithDetails,
  ReturnCondition,
  Book,
  Member,
  User
} from '../types';
import { memberService } from './memberService';

export class TransactionService {
  getAllWithDetails(): TransactionWithDetails[] {
    const transactions = db.getTransactions();
    const details = db.getTransactionDetails();
    const books = db.getBooks();
    const members = db.getMembers();
    const users = db.getUsers();

    return transactions.map(trx => {
      const trxDetails = details
        .filter(d => d.transaksi_id === trx.id)
        .map(d => ({
          ...d,
          buku: books.find(b => b.id === d.buku_id)
        }));

      return {
        ...trx,
        anggota: members.find(m => m.id === trx.anggota_id),
        petugas: users.find(u => u.id === trx.petugas_id),
        details: trxDetails
      };
    });
  }

  getByIdWithDetails(trxId: string): TransactionWithDetails | undefined {
    const trx = db.getTransactionById(trxId);
    if (!trx) return undefined;

    const details = db.getTransactionDetails().filter(d => d.transaksi_id === trx.id);
    const books = db.getBooks();
    const members = db.getMembers();
    const users = db.getUsers();

    return {
      ...trx,
      anggota: members.find(m => m.id === trx.anggota_id),
      petugas: users.find(u => u.id === trx.petugas_id),
      details: details.map(d => ({
        ...d,
        buku: books.find(b => b.id === d.buku_id)
      }))
    };
  }

  validateLoanEligibility(member: Member, currentCartBookIds: string[], newBook: Book): { valid: boolean; error?: string } {
    const settings = db.getSettings();

    if (member.status !== 'Aktif') {
      return { valid: false, error: 'ANGGOTA TIDAK AKTIF' };
    }

    // Check active loans already borrowed by member
    const activeLoans = memberService.getActiveLoans(member.id);
    const totalWillBorrow = activeLoans.length + currentCartBookIds.length + 1;
    if (totalWillBorrow > settings.maksimal_peminjaman) {
      return {
        valid: false,
        error: `BATAS PEMINJAMAN TERCAPAI (Maksimal ${settings.maksimal_peminjaman} buku, saat ini meminjam ${activeLoans.length} buku)`
      };
    }

    // Check if newBook is already in current cart
    if (currentCartBookIds.includes(newBook.id)) {
      return { valid: false, error: 'BUKU SUDAH ADA DALAM DAFTAR' };
    }

    // Check stock & availability
    if (newBook.stok <= 0 || newBook.status === 'Dipinjam') {
      return { valid: false, error: 'BUKU SEDANG DIPINJAM' };
    }

    if (newBook.status !== 'Tersedia') {
      return { valid: false, error: 'BUKU SEDANG TIDAK TERSEDIA' };
    }

    return { valid: true };
  }

  executeLoan(params: {
    memberId: string;
    bookIds: string[];
    notes?: string;
    userId: string;
  }): { success: boolean; transaction?: Transaction; error?: string } {
    const { memberId, bookIds, notes, userId } = params;

    if (bookIds.length === 0) {
      return { success: false, error: 'Belum ada buku yang dipilih untuk dipinjam.' };
    }

    const member = db.getMemberById(memberId);
    if (!member) {
      return { success: false, error: 'Data anggota tidak ditemukan.' };
    }

    if (member.status !== 'Aktif') {
      return { success: false, error: 'ANGGOTA TIDAK AKTIF' };
    }

    const settings = db.getSettings();
    const activeLoans = memberService.getActiveLoans(member.id);
    if (activeLoans.length + bookIds.length > settings.maksimal_peminjaman) {
      return { success: false, error: 'BATAS PEMINJAMAN TERCAPAI' };
    }

    // Verify all books exist and are available before modifying anything (Atomic check)
    const allBooks = db.getBooks();
    const booksToBorrow: Book[] = [];

    for (const bId of bookIds) {
      const book = allBooks.find(b => b.id === bId);
      if (!book) {
        return { success: false, error: 'BUKU TIDAK DITEMUKAN' };
      }
      if (book.stok <= 0 || book.status === 'Dipinjam') {
        return { success: false, error: `BUKU SEDANG DIPINJAM: "${book.judul}"` };
      }
      if (book.status !== 'Tersedia') {
        return { success: false, error: `BUKU SEDANG TIDAK TERSEDIA: "${book.judul}"` };
      }
      booksToBorrow.push(book);
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (settings.lama_peminjaman || 7));
    const dueDateStr = dueDate.toISOString().split('T')[0];

    const trxId = `trx-${Date.now()}`;
    const kodeTrx = db.generateNextTransactionCode();

    const newTransaction: Transaction = {
      id: trxId,
      kode_transaksi: kodeTrx,
      anggota_id: memberId,
      petugas_id: userId,
      tanggal_pinjam: todayStr,
      tanggal_jatuh_tempo: dueDateStr,
      tanggal_kembali: null,
      status: 'Dipinjam',
      catatan: notes || '',
      created_at: new Date().toISOString()
    };

    const detailsToCreate: TransactionDetail[] = [];
    const updatedBooksList: Book[] = [];

    for (const book of booksToBorrow) {
      detailsToCreate.push({
        id: `dtl-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        transaksi_id: trxId,
        buku_id: book.id,
        status: 'Dipinjam',
        kondisi_kembali: null,
        created_at: new Date().toISOString()
      });

      // Decrease available on-shelf stock
      const updatedStock = Math.max(0, (book.stok || 1) - 1);
      updatedBooksList.push({
        ...book,
        stok: updatedStock,
        status: updatedStock === 0 ? 'Dipinjam' : 'Tersedia'
      });
    }

    // Atomic execution
    db.saveTransaction(newTransaction);
    db.saveTransactionDetails(detailsToCreate);
    db.saveMultipleBooks(updatedBooksList);

    return { success: true, transaction: newTransaction };
  }

  executeReturn(params: {
    returns: {
      detailId: string;
      kondisi: ReturnCondition;
      catatan?: string;
    }[];
    userId: string;
  }): { success: boolean; returnedCount: number; error?: string } {
    const { returns } = params;

    if (returns.length === 0) {
      return { success: false, returnedCount: 0, error: 'Tidak ada buku yang dipilih untuk dikembalikan.' };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allDetails = db.getTransactionDetails();
    const allBooks = db.getBooks();
    const allTxs = db.getTransactions();
    const settings = db.getSettings();

    const affectedTxIds = new Set<string>();

    for (const ret of returns) {
      const detail = allDetails.find(d => d.id === ret.detailId);
      if (!detail) continue;

      const parentTx = allTxs.find(t => t.id === detail.transaksi_id);
      if (!parentTx) continue;

      affectedTxIds.add(parentTx.id);

      // Overdue & fine calculation
      const dueDate = new Date(parentTx.tanggal_jatuh_tempo);
      dueDate.setHours(0, 0, 0, 0);
      const diffTime = today.getTime() - dueDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const fine = diffDays > 0 ? diffDays * (settings.denda_per_hari || 1000) : 0;

      // Update detail status
      let detailStatus: TransactionDetail['status'] = 'Dikembalikan';
      if (ret.kondisi === 'Hilang') {
        detailStatus = 'Hilang';
      } else if (ret.kondisi === 'Rusak Berat') {
        detailStatus = 'Rusak';
      }

      const updatedDetail: TransactionDetail = {
        ...detail,
        status: detailStatus,
        kondisi_kembali: ret.kondisi,
        catatan_kondisi: ret.catatan || '',
        tanggal_kembali: todayStr,
        denda: fine
      };
      db.saveSingleTransactionDetail(updatedDetail);

      // Update book stock according to condition
      const currentBook = db.getBookById(detail.buku_id);
      if (currentBook) {
        if (ret.kondisi === 'Baik') {
          db.saveBook({
            ...currentBook,
            stok: currentBook.stok + 1,
            status: 'Tersedia'
          });
        } else if (ret.kondisi === 'Rusak Ringan') {
          db.saveBook({
            ...currentBook,
            stok: currentBook.stok + 1,
            status: 'Perbaikan'
          });
        } else if (ret.kondisi === 'Rusak Berat') {
          db.saveBook({
            ...currentBook,
            status: 'Perbaikan' // Do not increment stock back
          });
        } else if (ret.kondisi === 'Hilang') {
          db.saveBook({
            ...currentBook,
            status: 'Hilang' // Do not increment stock back
          });
        }
      }
    }

    // Update parent transactions status
    const refreshedDetails = db.getTransactionDetails();
    for (const txId of affectedTxIds) {
      const tx = db.getTransactionById(txId);
      if (!tx) continue;

      const txDetails = refreshedDetails.filter(d => d.transaksi_id === txId);
      const allDone = txDetails.every(d => d.status !== 'Dipinjam');

      if (allDone) {
        db.saveTransaction({
          ...tx,
          status: 'Dikembalikan',
          tanggal_kembali: todayStr
        });
      } else {
        db.saveTransaction({
          ...tx,
          status: 'Sebagian'
        });
      }
    }

    return { success: true, returnedCount: returns.length };
  }

  getDashboardStats() {
    const books = db.getBooks();
    const members = db.getMembers();
    const transactions = db.getTransactions();
    const details = db.getTransactionDetails();

    const formatYMD = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const todayStr = formatYMD(new Date());
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. SEDANG DIPINJAM: jumlah eksemplar buku yang saat ini aktif dipinjam oleh siswa
    const sedangDipinjam = details.filter(d => d.status === 'Dipinjam').length;

    // 2. BUKU TERSEDIA: jumlah stok fisik yang saat ini ada di rak perpustakaan
    const bukuTersedia = books.reduce((acc, b) => acc + Math.max(0, b.stok || 0), 0);

    // 3. TOTAL BUKU: jumlah seluruh eksemplar buku yang tercatat (Tersedia + Sedang Dipinjam)
    // Sesuai rumus: TERSEDIA = TOTAL BUKU - DIPINJAM, sehingga angka selalu 100% konsisten!
    const totalBuku = bukuTersedia + sedangDipinjam;

    // 4. ANGGOTA: jumlah anggota siswa yang berstatus 'Aktif'
    const totalAnggota = members.filter(m => m.status === 'Aktif').length;

    // 5. PINJAM HARI INI: jumlah total buku yang dipinjam pada hari ini
    const peminjamanHariIni = details.filter(d => {
      const parentTx = transactions.find(t => t.id === d.transaksi_id);
      if (!parentTx) return false;
      const pDate = parentTx.tanggal_pinjam || (parentTx.created_at ? parentTx.created_at.split('T')[0] : '');
      return pDate === todayStr;
    }).length;

    // 6. KEMBALI HARI INI: jumlah total buku yang dikembalikan hari ini
    const pengembalianHariIni = details.filter(
      d => d.status !== 'Dipinjam' && (d.tanggal_kembali === todayStr || (d.created_at && d.created_at.split('T')[0] === todayStr && d.status === 'Dikembalikan'))
    ).length;

    // 7. BUKU TERLAMBAT: jumlah buku yang melewati tanggal jatuh tempo dan belum dikembalikan
    let bukuTerlambat = 0;
    const activeDetails = details.filter(d => d.status === 'Dipinjam');
    for (const d of activeDetails) {
      const parentTx = transactions.find(t => t.id === d.transaksi_id);
      if (parentTx) {
        const dueDate = new Date(parentTx.tanggal_jatuh_tempo);
        dueDate.setHours(0, 0, 0, 0);
        if (today.getTime() > dueDate.getTime()) {
          bukuTerlambat++;
        }
      }
    }

    // 8. TREN PEMINJAMAN 7 HARI (Senin, Selasa, Rabu, Kamis, Jumat, Sabtu, Minggu)
    // Hitung tanggal Senin minggu ini
    const currentDayOfWeek = today.getDay(); // 0 is Minggu, 1 is Senin...
    const diffToMonday = (currentDayOfWeek === 0 ? -6 : 1) - currentDayOfWeek;
    const mondayDate = new Date(today);
    mondayDate.setDate(today.getDate() + diffToMonday);

    const indonesianDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const trendDays = indonesianDays.map((name, index) => {
      const targetDate = new Date(mondayDate);
      targetDate.setDate(mondayDate.getDate() + index);
      const targetDateStr = formatYMD(targetDate);

      // Hitung jumlah BUKU yang dipinjam pada tanggal tersebut dari database nyata
      const count = details.filter(d => {
        const parentTx = transactions.find(t => t.id === d.transaksi_id);
        if (!parentTx) return false;
        const pDate = parentTx.tanggal_pinjam || (parentTx.created_at ? parentTx.created_at.split('T')[0] : '');
        return pDate === targetDateStr;
      }).length;

      const isToday = targetDateStr === todayStr;

      return {
        dayName: name,
        dateFormatted: `${targetDate.getDate()} ${new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(targetDate)}`,
        dateStr: targetDateStr,
        count,
        isToday
      };
    });

    // 9. Buku Terpopuler (dihitung dari transaksi aktual peminjaman buku)
    const bookBorrowCounts = new Map<string, number>();
    for (const d of details) {
      bookBorrowCounts.set(d.buku_id, (bookBorrowCounts.get(d.buku_id) || 0) + 1);
    }
    const popularBooks = Array.from(bookBorrowCounts.entries())
      .map(([bookId, count]) => ({
        book: books.find(b => b.id === bookId),
        count
      }))
      .filter(item => item.book !== undefined)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 10. Aktivitas terbaru
    const activities: {
      time: string;
      text: string;
      type: 'pinjam' | 'kembali';
      date: string;
    }[] = [];

    // From recent transactions
    for (const tx of transactions.slice(0, 6)) {
      const mem = members.find(m => m.id === tx.anggota_id);
      const count = details.filter(d => d.transaksi_id === tx.id).length;
      activities.push({
        time: tx.created_at.substring(11, 16) || '09:00',
        text: `${mem?.nama || 'Siswa'} meminjam ${count} buku`,
        type: 'pinjam',
        date: tx.tanggal_pinjam
      });
    }

    // From recent returns
    const returnedDetails = details.filter(d => d.status === 'Dikembalikan' && d.tanggal_kembali).slice(0, 4);
    for (const d of returnedDetails) {
      const parentTx = transactions.find(t => t.id === d.transaksi_id);
      const mem = parentTx ? members.find(m => m.id === parentTx.anggota_id) : undefined;
      const b = books.find(item => item.id === d.buku_id);
      activities.push({
        time: '11:15',
        text: `${mem?.nama || 'Siswa'} mengembalikan 1 buku (${b?.judul || 'Buku'})`,
        type: 'kembali',
        date: d.tanggal_kembali || todayStr
      });
    }

    return {
      totalBuku,
      bukuTersedia,
      sedangDipinjam,
      totalAnggota,
      peminjamanHariIni,
      pengembalianHariIni,
      bukuTerlambat,
      trendDays,
      popularBooks,
      activities: activities.slice(0, 6)
    };
  }
}

export const transactionService = new TransactionService();
