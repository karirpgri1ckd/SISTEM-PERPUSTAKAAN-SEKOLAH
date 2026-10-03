import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Search,
  BookOpen,
  User,
  Users,
  Plus,
  Trash2,
  CheckCircle2,
  Printer,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Calendar,
  Clock,
  ArrowRight,
  FileDown
} from 'lucide-react';
import { Member, Book, TransactionWithDetails, Settings } from '../types';
import { memberService } from '../services/memberService';
import { bookService } from '../services/bookService';
import { transactionService } from '../services/transactionService';
import { pdfService } from '../services/pdfService';
import { db } from '../database/db';
import { soundService } from '../services/soundService';
import { useToast } from '../components/common/Toast';
import { QrScannerModal } from '../components/common/QrScannerModal';
import { PrintBuktiPeminjaman } from '../components/print/PrintBuktiPeminjaman';
import { BookCover } from '../components/common/BookCover';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';

interface PeminjamanPageProps {
  currentUserId: string;
  settings: Settings;
}

export const PeminjamanPage: React.FC<PeminjamanPageProps> = ({ currentUserId, settings }) => {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [cartBooks, setCartBooks] = useState<Book[]>([]);
  const [notes, setNotes] = useState('');

  // Scanner modal states
  const [isMemberScannerOpen, setIsMemberScannerOpen] = useState(false);
  const [isBookScannerOpen, setIsBookScannerOpen] = useState(false);

  // Manual search fallbacks
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [isManualMemberModalOpen, setIsManualMemberModalOpen] = useState(false);

  const [bookManualCode, setBookManualCode] = useState('');

  // Completed transaction
  const [completedTransaction, setCompletedTransaction] = useState<TransactionWithDetails | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const toast = useToast();

  // Listen to USB Barcode Scanner globally on this page
  useBarcodeScanner({
    enabled: !completedTransaction,
    onScan: scannedCode => {
      handleGlobalBarcodeScan(scannedCode);
    }
  });

  const handleGlobalBarcodeScan = (code: string) => {
    // If no member selected yet, check if code matches member
    if (!selectedMember) {
      const member = memberService.getByCodeOrQr(code);
      if (member) {
        handleSelectMember(member);
        return;
      }
    }

    // Otherwise try to add book to cart
    if (selectedMember) {
      const book = bookService.getByCodeOrQr(code);
      if (book) {
        handleAddBookToCart(book);
        return;
      }
    }

    // Try finding member if book didn't match
    const altMember = memberService.getByCodeOrQr(code);
    if (altMember) {
      handleSelectMember(altMember);
      return;
    }

    toast.warning(`Kode "${code}" tidak ditemukan dalam data siswa ataupun buku perpustakaan.`);
    soundService.playErrorBeep();
  };

  const handleSelectMember = (member: Member) => {
    if (member.status !== 'Aktif') {
      toast.error(`Anggota ${member.nama} berstatus TIDAK AKTIF.`);
      soundService.playErrorBeep();
      return;
    }

    const activeLoans = memberService.getActiveLoans(member.id);
    if (activeLoans.length >= settings.maksimal_peminjaman) {
      toast.warning(
        `ANGGOTA SUDAH MENCAPAI BATAS MAKSIMAL PEMINJAMAN (${settings.maksimal_peminjaman} buku).`
      );
      soundService.playErrorBeep();
    }

    setSelectedMember(member);
    soundService.playSuccessBeep();
    toast.success(`Anggota dipilih: ${member.nama} (${member.kelas})`);
  };

  const handleAddBookToCart = (book: Book) => {
    if (!selectedMember) {
      toast.warning('Silakan scan atau pilih kartu anggota siswa terlebih dahulu.');
      soundService.playErrorBeep();
      return;
    }

    // Validation
    const cartIds = cartBooks.map(b => b.id);
    const validation = transactionService.validateLoanEligibility(selectedMember, cartIds, book);

    if (!validation.valid) {
      toast.error(validation.error || 'Buku tidak dapat dipinjam.');
      soundService.playErrorBeep();
      return;
    }

    setCartBooks(prev => [...prev, book]);
    soundService.playSuccessBeep();
    toast.success(`Buku "${book.judul}" dimasukkan ke daftar.`);
  };

  const handleRemoveBookFromCart = (index: number) => {
    setCartBooks(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveLoan = () => {
    if (!selectedMember) {
      toast.warning('Pilih anggota terlebih dahulu.');
      return;
    }
    if (cartBooks.length === 0) {
      toast.warning('Tambahkan minimal 1 buku untuk dipinjam.');
      return;
    }

    const res = transactionService.executeLoan({
      memberId: selectedMember.id,
      bookIds: cartBooks.map(b => b.id),
      notes,
      userId: currentUserId
    });

    if (res.success && res.transaction) {
      soundService.playSuccessBeep();
      toast.success('Peminjaman buku berhasil disimpan!');

      const fullTrx = transactionService.getByIdWithDetails(res.transaction.id);
      if (fullTrx) {
        setCompletedTransaction(fullTrx);
        setIsPrintModalOpen(true);
      }
    } else {
      toast.error(res.error || 'Gagal menyimpan transaksi peminjaman.');
      soundService.playErrorBeep();
    }
  };

  const handleReset = () => {
    setSelectedMember(null);
    setCartBooks([]);
    setNotes('');
    setCompletedTransaction(null);
    setIsPrintModalOpen(false);
  };

  // Due date preview
  const today = new Date();
  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(today);

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + (settings.lama_peminjaman || 7));
  const dueDateFormatted = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(dueDate);

  // Active loans for selected member
  const memberActiveLoans = selectedMember ? memberService.getActiveLoans(selectedMember.id) : [];

  // Filtered members for manual search
  const membersList = memberService.search(memberSearchQuery);
  const availableBooks = bookService.search('', 'all', 'Tersedia');

  return (
    <div className="space-y-6">
      {/* Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </span>
            <span>Transaksi Peminjaman Buku</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Alur cepat: Scan kartu siswa &rarr; Scan buku &rarr; Simpan &amp; Cetak Bukti
          </p>
        </div>

        {selectedMember && !completedTransaction && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset / Ganti Siswa</span>
          </button>
        )}
      </div>

      {/* SUCCESS STATE AFTER LOAN */}
      {completedTransaction ? (
        <div className="bg-white rounded-3xl p-8 border border-emerald-200 shadow-md text-center max-w-xl mx-auto space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Transaksi Berhasil Disimpan
            </span>
            <h3 className="text-2xl font-black text-slate-800 mt-2">
              {completedTransaction.kode_transaksi}
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Peminjaman {completedTransaction.details.length} buku untuk{' '}
              <strong>{completedTransaction.anggota?.nama}</strong> ({completedTransaction.anggota?.kelas}) berhasil dicatat.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Tanggal Pinjam:</span>
              <span className="font-semibold text-slate-800">{completedTransaction.tanggal_pinjam}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Batas Pengembalian:</span>
              <span className="font-bold text-rose-600">{completedTransaction.tanggal_jatuh_tempo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Buku Dipinjam:</span>
              <span className="font-semibold text-slate-800">
                {completedTransaction.details.map(d => d.buku?.judul).join(', ')}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                pdfService.exportBuktiPeminjaman(completedTransaction);
                toast.success('Bukti peminjaman berhasil diunduh (PDF).');
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span>Unduh Bukti PDF</span>
            </button>
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Bukti</span>
            </button>
            <button
              onClick={handleReset}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Peminjaman Baru</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: IDENTITAS ANGGOTA (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {!selectedMember ? (
              /* MEMBER SELECTION BOX */
              <div className="bg-white rounded-3xl p-6 border-2 border-dashed border-blue-200 hover:border-blue-400 transition-all shadow-xs space-y-5">
                <div className="text-center">
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-3">
                    <User className="w-7 h-7" />
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-base">
                    Langkah 1: Identitas Siswa
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Scan QR Code kartu siswa atau gunakan pencarian manual
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => setIsMemberScannerOpen(true)}
                    className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                  >
                    <QrCode className="w-5 h-5" />
                    <span>Scan Kartu Anggota (Kamera)</span>
                  </button>

                  <button
                    onClick={() => setIsManualMemberModalOpen(true)}
                    className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Search className="w-4 h-4 text-slate-500" />
                    <span>Cari Anggota Manual (Nama / NIS)</span>
                  </button>
                </div>
              </div>
            ) : (
              /* SELECTED MEMBER PROFILE CARD */
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Identitas Anggota
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {selectedMember.status}
                  </span>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-20 h-24 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200 shadow-2xs flex items-center justify-center">
                    {selectedMember.foto && selectedMember.foto.trim() !== '' ? (
                      <img
                        src={selectedMember.foto}
                        alt={selectedMember.nama}
                        className="w-full h-full object-cover"
                        onError={e => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Users className="w-8 h-8 text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="font-extrabold text-slate-900 text-base leading-snug truncate">
                      {selectedMember.nama}
                    </h3>
                    <div className="text-xs text-slate-600">
                      <span className="font-semibold text-slate-800">NIS:</span> {selectedMember.nis}
                    </div>
                    <div className="text-xs text-slate-600">
                      <span className="font-semibold text-slate-800">Kelas:</span> {selectedMember.kelas}
                    </div>
                    <div className="text-xs font-mono text-blue-700 font-bold">
                      {selectedMember.kode_anggota}
                    </div>
                  </div>
                </div>

                {/* Active Loans Status Indicator */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Sedang dipinjam:</span>
                    <span className="font-bold text-slate-800">
                      {memberActiveLoans.length} dari {settings.maksimal_peminjaman} buku
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
                    <div
                      style={{
                        width: `${Math.min(100, (memberActiveLoans.length / settings.maksimal_peminjaman) * 100)}%`
                      }}
                      className={`h-full ${
                        memberActiveLoans.length >= settings.maksimal_peminjaman
                          ? 'bg-rose-500'
                          : 'bg-blue-600'
                      }`}
                    />
                  </div>
                </div>

                {/* Warning if currently borrowing overdue books */}
                {memberActiveLoans.some(l => l.isTerlambat) && (
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>
                      Siswa memiliki buku pinjaman yang <strong>terlambat dikembalikan</strong>. Harap selesaikan pengembalian terlebih dahulu.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* TRANSAKSI DETAIL PREVIEW */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">
                Informasi Periode Peminjaman
              </h3>

              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>Tanggal Pinjam:</span>
                  </span>
                  <span className="font-bold text-slate-800">{todayFormatted}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>Lama Peminjaman:</span>
                  </span>
                  <span className="font-semibold">{settings.lama_peminjaman} Hari</span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <span className="text-slate-500 font-medium">Batas Jatuh Tempo:</span>
                  <span className="font-extrabold text-blue-700">{dueDateFormatted}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Peminjaman (Opsional)
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Misal: untuk tugas kelompok, olimpiade, dll"
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: SCAN & CART BUKU (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">
                    Langkah 2: Scan Buku yang Dipinjam
                  </h3>
                  <p className="text-xs text-slate-500">
                    Arahkan scanner ke QR Code / Barcode buku (mendukung multi-scan)
                  </p>
                </div>

                <button
                  disabled={!selectedMember}
                  onClick={() => setIsBookScannerOpen(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Scan Buku (Kamera)</span>
                </button>
              </div>

              {/* Manual Barcode / Quick Input Bar */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={bookManualCode}
                  onChange={e => setBookManualCode(e.target.value.toUpperCase())}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const b = bookService.getByCodeOrQr(bookManualCode);
                      if (b) {
                        handleAddBookToCart(b);
                        setBookManualCode('');
                      } else {
                        toast.error(`Buku dengan kode "${bookManualCode}" tidak ditemukan.`);
                      }
                    }
                  }}
                  placeholder="Input Kode Buku manual (contoh: BK-00001) atau scan USB..."
                  disabled={!selectedMember}
                  data-scanner-input="true"
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs uppercase font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white disabled:opacity-50"
                />
                <button
                  type="button"
                  disabled={!selectedMember || !bookManualCode.trim()}
                  onClick={() => {
                    const b = bookService.getByCodeOrQr(bookManualCode);
                    if (b) {
                      handleAddBookToCart(b);
                      setBookManualCode('');
                    } else {
                      toast.error(`Buku dengan kode "${bookManualCode}" tidak ditemukan.`);
                    }
                  }}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Tambah
                </button>
              </div>

              {/* CART / LIST BUKU YANG AKAN DIPINJAM */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Daftar Buku yang Akan Dipinjam ({cartBooks.length} buku)
                  </h4>
                  {cartBooks.length > 0 && (
                    <button
                      onClick={() => setCartBooks([])}
                      className="text-[11px] text-rose-600 hover:underline"
                    >
                      Kosongkan Daftar
                    </button>
                  )}
                </div>

                {cartBooks.length === 0 ? (
                  <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2">
                    <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-500 font-medium">
                      Belum ada buku yang di-scan ke dalam daftar peminjaman.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Gunakan tombol "Scan Buku" di atas atau ketik kode buku.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {cartBooks.map((book, index) => (
                      <div
                        key={`${book.id}-${index}`}
                        className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-blue-300 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <div className="w-10 h-14 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200 shadow-2xs">
                            <BookCover
                              src={book.cover}
                              title={book.judul}
                              className="w-full h-full"
                            />
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-slate-800 line-clamp-1">
                              {book.judul}
                            </h5>
                            <p className="text-[10px] text-slate-500">{book.penulis}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                {book.kode_buku}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                Rak: {book.rak}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveBookFromCart(index)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="Hapus dari daftar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SUBMIT BUTTON */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-500">
                  Total pinjaman kali ini:{' '}
                  <strong className="text-slate-800 font-bold">{cartBooks.length} buku</strong>
                </div>

                <button
                  disabled={!selectedMember || cartBooks.length === 0}
                  onClick={handleSaveLoan}
                  className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>SIMPAN PEMINJAMAN</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCANNER MODAL - KARTU ANGGOTA */}
      <QrScannerModal
        isOpen={isMemberScannerOpen}
        onClose={() => setIsMemberScannerOpen(false)}
        onScan={code => {
          const m = memberService.getByCodeOrQr(code);
          if (m) {
            handleSelectMember(m);
          } else {
            toast.error(`Anggota dengan kode/QR "${code}" tidak ditemukan.`);
            soundService.playErrorBeep();
          }
        }}
        title="Scan Kartu Anggota Siswa"
        subtitle="Arahkan kamera ke QR Code pada kartu perpustakaan"
        expectedPrefix="AGT"
        sampleCodes={[
          { code: 'AGT-00001', label: 'Ahmad Fauzan' },
          { code: 'AGT-00002', label: 'Siti Aisyah' },
          { code: 'AGT-00003', label: 'Budi Santoso' },
          { code: 'AGT-00004', label: 'Dewi Lestari' }
        ]}
      />

      {/* SCANNER MODAL - SCAN BUKU */}
      <QrScannerModal
        isOpen={isBookScannerOpen}
        onClose={() => setIsBookScannerOpen(false)}
        keepOpenOnScan={true}
        onScan={code => {
          const b = bookService.getByCodeOrQr(code);
          if (b) {
            handleAddBookToCart(b);
          } else {
            toast.error(`Buku dengan kode/QR "${code}" tidak ditemukan.`);
            soundService.playErrorBeep();
          }
        }}
        title="Scan QR / Barcode Buku"
        subtitle="Arahkan kamera ke label barcode/QR pada sampul buku (Bisa scan berturut-turut)"
        expectedPrefix="BK"
        sampleCodes={[
          { code: 'BK-00001', label: 'Laskar Pelangi' },
          { code: 'BK-00002', label: 'Bumi' },
          { code: 'BK-00003', label: 'Negeri 5 Menara' },
          { code: 'BK-00005', label: 'Hujan' }
        ]}
      />

      {/* MODAL PENCARIAN MANUAL ANGGOTA */}
      {isManualMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-base">
                Cari Anggota Siswa Manual
              </h3>
              <button
                onClick={() => setIsManualMemberModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                Tutup
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={memberSearchQuery}
                onChange={e => setMemberSearchQuery(e.target.value)}
                placeholder="Ketik Nama, NIS, atau Kode Anggota..."
                autoFocus
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2">
              {membersList.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">Tidak ada anggota yang cocok.</p>
              ) : (
                membersList.map(m => (
                  <div
                    key={m.id}
                    onClick={() => {
                      handleSelectMember(m);
                      setIsManualMemberModalOpen(false);
                    }}
                    className="flex items-center justify-between p-3 rounded-2xl hover:bg-blue-50 border border-slate-100 hover:border-blue-200 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                        {m.foto && m.foto.trim() !== '' ? (
                          <img
                            src={m.foto}
                            alt={m.nama}
                            className="w-full h-full object-cover"
                            onError={e => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <Users className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{m.nama}</h4>
                        <p className="text-[11px] text-slate-500">
                          NIS: {m.nis} • Kelas: {m.kelas}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-blue-700 bg-white px-2 py-1 rounded-lg border border-slate-200">
                      {m.kode_anggota}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* PRINT BUKTI MODAL */}
      {isPrintModalOpen && completedTransaction && (
        <PrintBuktiPeminjaman
          transaction={completedTransaction}
          settings={settings}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}
    </div>
  );
};
