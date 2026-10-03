import React, { useState } from 'react';
import {
  QrCode,
  Search,
  BookOpen,
  User,
  Users,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowDownLeft,
  Calendar,
  Clock,
  Check,
  ShieldAlert,
  Printer,
  FileDown
} from 'lucide-react';
import { Member, ActiveLoanItem, ReturnCondition, Settings } from '../types';
import { memberService } from '../services/memberService';
import { bookService } from '../services/bookService';
import { transactionService } from '../services/transactionService';
import { pdfService } from '../services/pdfService';
import { soundService } from '../services/soundService';
import { useToast } from '../components/common/Toast';
import { QrScannerModal } from '../components/common/QrScannerModal';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import { PrintBuktiPengembalian, ReturnReceiptData } from '../components/print/PrintBuktiPengembalian';
import { BookCover } from '../components/common/BookCover';
import { db } from '../database/db';

interface ReturnCartItem {
  activeLoan: ActiveLoanItem;
  kondisi: ReturnCondition;
  catatan: string;
}

interface PengembalianPageProps {
  currentUserId: string;
  settings: Settings;
}

export const PengembalianPage: React.FC<PengembalianPageProps> = ({ currentUserId, settings }) => {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [activeLoans, setActiveLoans] = useState<ActiveLoanItem[]>([]);
  const [returnItems, setReturnItems] = useState<ReturnCartItem[]>([]);

  // Scanner modals
  const [isMemberScannerOpen, setIsMemberScannerOpen] = useState(false);
  const [isBookScannerOpen, setIsBookScannerOpen] = useState(false);

  // Manual fallback search
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [isManualMemberModalOpen, setIsManualMemberModalOpen] = useState(false);
  const [manualBookCode, setManualBookCode] = useState('');

  // Result & Receipt state
  const [lastReturnedCount, setLastReturnedCount] = useState<number | null>(null);
  const [lastReceiptData, setLastReceiptData] = useState<ReturnReceiptData | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const toast = useToast();

  // Listen to USB Barcode Scanner globally on this page
  useBarcodeScanner({
    enabled: !isPrintModalOpen,
    onScan: scannedCode => {
      handleGlobalBarcodeScan(scannedCode);
    }
  });

  const handleGlobalBarcodeScan = (code: string) => {
    const trimmed = code.trim().toUpperCase();

    // 1. If no member selected yet, check if code matches member
    if (!selectedMember) {
      const member = memberService.getByCodeOrQr(trimmed);
      if (member) {
        handleSelectMember(member);
        return;
      }

      // If not a member, check if code matches ANY book currently borrowed by someone
      const book = bookService.getByCodeOrQr(trimmed);
      if (book) {
        const details = db.getTransactionDetails();
        const activeDetail = details.find(d => d.buku_id === book.id && d.status === 'Dipinjam');
        if (activeDetail) {
          const parentTx = db.getTransactionById(activeDetail.transaksi_id);
          if (parentTx) {
            const borrower = memberService.getById(parentTx.anggota_id);
            if (borrower) {
              setSelectedMember(borrower);
              const loans = memberService.getActiveLoans(borrower.id);
              setActiveLoans(loans);
              const matchedLoan = loans.find(l => l.detailId === activeDetail.id);
              if (matchedLoan) {
                setReturnItems([{ activeLoan: matchedLoan, kondisi: 'Baik', catatan: '' }]);
              }
              soundService.playSuccessBeep();
              toast.success(`Buku "${book.judul}" terdeteksi dipinjam oleh ${borrower.nama} (${borrower.kelas}) dan langsung dipilih!`);
              return;
            }
          }
        } else {
          toast.warning(`Buku "${book.judul}" saat ini tidak sedang dipinjam (stok tersedia di rak).`);
          soundService.playErrorBeep();
          return;
        }
      }
    }

    // 2. If member is already selected, attempt to match their active borrowed books
    if (selectedMember) {
      const matched = activeLoans.find(
        l => l.buku.kode_buku.toUpperCase() === trimmed ||
             l.buku.qr_token.toUpperCase() === trimmed ||
             l.buku.isbn.replace(/-/g, '') === trimmed.replace(/-/g, '')
      );

      if (matched) {
        handleToggleReturnItem(matched);
        return;
      }

      // Or check if another member card was scanned to switch student
      const switchMember = memberService.getByCodeOrQr(trimmed);
      if (switchMember && switchMember.id !== selectedMember.id) {
        handleSelectMember(switchMember);
        return;
      }
    }

    toast.warning(`Kode "${code}" tidak cocok dengan data pinjaman aktif siswa.`);
    soundService.playErrorBeep();
  };

  const handleSelectMember = (member: Member) => {
    setSelectedMember(member);
    const loans = memberService.getActiveLoans(member.id);
    setActiveLoans(loans);
    setReturnItems([]);
    setLastReturnedCount(null);
    setLastReceiptData(null);
    soundService.playSuccessBeep();

    if (loans.length === 0) {
      toast.info(`Siswa ${member.nama} tidak memiliki buku yang sedang dipinjam.`);
    } else {
      toast.success(`${member.nama} memiliki ${loans.length} buku yang sedang dipinjam.`);
    }
  };

  const handleSelectAllLoans = () => {
    if (activeLoans.length === 0) return;
    const all = activeLoans.map(loan => ({
      activeLoan: loan,
      kondisi: 'Baik' as ReturnCondition,
      catatan: ''
    }));
    setReturnItems(all);
    soundService.playSuccessBeep();
    toast.success(`Seluruh (${activeLoans.length}) buku dipilih untuk dikembalikan.`);
  };

  const handleToggleReturnItem = (loan: ActiveLoanItem) => {
    const exists = returnItems.find(r => r.activeLoan.detailId === loan.detailId);
    if (exists) {
      // Remove
      setReturnItems(prev => prev.filter(r => r.activeLoan.detailId !== loan.detailId));
    } else {
      // Add with default 'Baik' condition
      setReturnItems(prev => [
        ...prev,
        {
          activeLoan: loan,
          kondisi: 'Baik',
          catatan: ''
        }
      ]);
      soundService.playSuccessBeep();
      toast.success(`Buku "${loan.buku.judul}" dipilih untuk dikembalikan.`);
    }
  };

  const handleUpdateCondition = (detailId: string, kondisi: ReturnCondition) => {
    setReturnItems(prev =>
      prev.map(item => (item.activeLoan.detailId === detailId ? { ...item, kondisi } : item))
    );
  };

  const handleUpdateNotes = (detailId: string, catatan: string) => {
    setReturnItems(prev =>
      prev.map(item => (item.activeLoan.detailId === detailId ? { ...item, catatan } : item))
    );
  };

  const handleConfirmReturns = () => {
    if (returnItems.length === 0) {
      toast.warning('Pilih minimal 1 buku yang akan dikembalikan.');
      return;
    }

    const payload = returnItems.map(item => ({
      detailId: item.activeLoan.detailId,
      kondisi: item.kondisi,
      catatan: item.catatan
    }));

    const res = transactionService.executeReturn({
      returns: payload,
      userId: currentUserId
    });

    if (res.success && selectedMember) {
      soundService.playSuccessBeep();
      toast.success(`Berhasil mengembalikan ${res.returnedCount} buku.`);
      setLastReturnedCount(res.returnedCount);

      // Create return receipt data for printing and PDF
      const receipt: ReturnReceiptData = {
        member: selectedMember,
        petugasName: db.getCurrentUser()?.nama || settings.nama_petugas || 'Petugas Perpustakaan',
        items: returnItems.map(item => ({
          buku: item.activeLoan.buku,
          kodeTransaksi: item.activeLoan.kodeTransaksi,
          tanggalPinjam: item.activeLoan.tanggalPinjam,
          tanggalKembali: new Date().toISOString().split('T')[0],
          kondisi: item.kondisi,
          denda: item.activeLoan.estimasiDenda,
          catatan: item.catatan
        })),
        totalDenda: totalFine,
        tanggalKembali: new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date())
      };
      setLastReceiptData(receipt);

      // Refresh remaining active loans
      const remaining = memberService.getActiveLoans(selectedMember.id);
      setActiveLoans(remaining);
      setReturnItems([]);
    } else {
      toast.error(res.error || 'Gagal memproses pengembalian buku.');
      soundService.playErrorBeep();
    }
  };

  const handleReset = () => {
    setSelectedMember(null);
    setActiveLoans([]);
    setReturnItems([]);
    setLastReturnedCount(null);
    setLastReceiptData(null);
    setIsPrintModalOpen(false);
  };

  const membersList = memberService.search(memberSearchQuery);

  // Total fine calculation for returnItems
  const totalFine = returnItems.reduce((acc, curr) => acc + curr.activeLoan.estimasiDenda, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </span>
            <span>Pengembalian Buku</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Alur cepat: Scan kartu siswa &rarr; Lihat buku aktif &rarr; Scan buku &rarr; Pilih kondisi &rarr; Konfirmasi
          </p>
        </div>

        {selectedMember && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Ganti Siswa</span>
          </button>
        )}
      </div>

      {/* SUCCESS NOTICE & RECEIPT OPTIONS */}
      {lastReturnedCount !== null && (
        <div className="p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 rounded-3xl shadow-sm space-y-3 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-inner">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-emerald-950">
                  Pengembalian {lastReturnedCount} Buku Berhasil Diproses!
                </h4>
                <p className="text-xs text-emerald-800/80">
                  Stok perpustakaan telah otomatis diperbarui dan transaksi telah diselesaikan.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {lastReceiptData && (
                <>
                  <button
                    onClick={() => {
                      pdfService.exportBuktiPengembalian(lastReceiptData);
                      toast.success('Bukti pengembalian berhasil diunduh (PDF).');
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Unduh Bukti PDF</span>
                  </button>
                  <button
                    onClick={() => setIsPrintModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Struk Kembali</span>
                  </button>
                </>
              )}
              <button
                onClick={() => setLastReturnedCount(null)}
                className="px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100/60 rounded-xl transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: IDENTITAS SISWA (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {!selectedMember ? (
            /* MEMBER SCANNER PROMPT */
            <div className="bg-white rounded-3xl p-6 border-2 border-dashed border-blue-200 hover:border-blue-400 transition-all shadow-xs space-y-5">
              <div className="text-center">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-3">
                  <User className="w-7 h-7" />
                </div>
                <h3 className="font-extrabold text-slate-800 text-base">
                  Identifikasi Siswa Peminjam
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Scan QR kartu siswa untuk melihat buku yang sedang dipinjam
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setIsMemberScannerOpen(true)}
                  className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                >
                  <QrCode className="w-5 h-5" />
                  <span>Scan Kartu Siswa (Kamera)</span>
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
            /* SELECTED MEMBER INFO */
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Identitas Siswa
                </span>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 font-mono">
                  {selectedMember.kode_anggota}
                </span>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-18 h-22 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200 shadow-2xs flex items-center justify-center">
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
                <div className="space-y-1">
                  <h3 className="font-extrabold text-slate-900 text-base leading-snug">
                    {selectedMember.nama}
                  </h3>
                  <div className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-800">NIS:</span> {selectedMember.nis}
                  </div>
                  <div className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-800">Kelas:</span> {selectedMember.kelas}
                  </div>
                  <div className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-800">Status Pinjaman:</span>{' '}
                    <span className="font-bold text-blue-700">{activeLoans.length} buku aktif</span>
                  </div>
                </div>
              </div>

              {/* Status Alert if Overdue */}
              {activeLoans.some(l => l.isTerlambat) && (
                <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Terlambat Mengembalikan Buku!</strong>
                    <span>
                      Ada buku yang telah melewati batas jatuh tempo. Dikenakan denda keterlambatan Rp {settings.denda_per_hari.toLocaleString('id-ID')}/hari per buku.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* RETURN SUMMARY CARD */}
          {returnItems.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">
                Ringkasan Pengembalian
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Jumlah Buku Dikembalikan:</span>
                  <span className="font-bold text-slate-800">{returnItems.length} Buku</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Denda Keterlambatan:</span>
                  <span className={`font-extrabold ${totalFine > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    Rp {totalFine.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <button
                onClick={handleConfirmReturns}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>KONFIRMASI PENGEMBALIAN ({returnItems.length})</span>
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: DAFTAR BUKU PINJAMAN & SCANNER BUKU (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">
                  Buku yang Sedang Dipinjam
                </h3>
                <p className="text-xs text-slate-500">
                  Scan barcode buku fisik atau klik tombol di sebelah kanan buku yang dikembalikan
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {selectedMember && activeLoans.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAllLoans}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 transition-all cursor-pointer"
                    title="Pilih seluruh buku yang dipinjam untuk dikembalikan sekaligus"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Kembalikan Semua ({activeLoans.length})</span>
                  </button>
                )}
                <button
                  disabled={!selectedMember || activeLoans.length === 0}
                  onClick={() => setIsBookScannerOpen(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Scan Barcode Buku</span>
                </button>
              </div>
            </div>

            {/* Quick manual barcode input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={manualBookCode}
                onChange={e => setManualBookCode(e.target.value.toUpperCase())}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const matched = activeLoans.find(
                      l => l.buku.kode_buku.toUpperCase() === manualBookCode.trim().toUpperCase()
                    );
                    if (matched) {
                      handleToggleReturnItem(matched);
                      setManualBookCode('');
                    } else {
                      toast.error(`Kode "${manualBookCode}" bukan buku yang sedang dipinjam siswa.`);
                    }
                  }
                }}
                placeholder="Input / Scan Barcode Buku yang dikembalikan..."
                disabled={!selectedMember}
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs uppercase font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white disabled:opacity-50"
              />
              <button
                type="button"
                disabled={!selectedMember || !manualBookCode.trim()}
                onClick={() => {
                  const matched = activeLoans.find(
                    l => l.buku.kode_buku.toUpperCase() === manualBookCode.trim().toUpperCase()
                  );
                  if (matched) {
                    handleToggleReturnItem(matched);
                    setManualBookCode('');
                  } else {
                    toast.error(`Kode "${manualBookCode}" bukan buku yang sedang dipinjam siswa.`);
                  }
                }}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cocokkan
              </button>
            </div>

            {/* LIST OF BORROWED BOOKS */}
            {!selectedMember ? (
              <div className="p-10 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2">
                <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">
                  Scan atau pilih siswa terlebih dahulu di sisi kiri.
                </p>
              </div>
            ) : activeLoans.length === 0 ? (
              <div className="p-10 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-sm font-bold text-slate-800">
                  Tidak Ada Pinjaman Aktif
                </p>
                <p className="text-xs text-slate-500">
                  Semua buku yang dipinjam oleh siswa ini sudah dikembalikan.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeLoans.map(loan => {
                  const selectedCart = returnItems.find(r => r.activeLoan.detailId === loan.detailId);
                  const isSelected = !!selectedCart;

                  return (
                    <div
                      key={loan.detailId}
                      className={`p-4 rounded-2xl border transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/30 shadow-xs ring-1 ring-blue-500'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-16 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200 shadow-2xs">
                            <BookCover
                              src={loan.buku.cover}
                              title={loan.buku.judul}
                              className="w-full h-full"
                            />
                          </div>

                          <div className="space-y-1">
                            <h4 className="text-sm font-bold text-slate-800 leading-snug">
                              {loan.buku.judul}
                            </h4>
                            <p className="text-xs text-slate-500">{loan.buku.penulis}</p>
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                {loan.buku.kode_buku}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                Pinjam: {loan.tanggalPinjam}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                Jatuh tempo: {loan.tanggalJatuhTempo}
                              </span>
                            </div>

                            {/* Status Tepat Waktu or Terlambat */}
                            <div className="pt-1">
                              {loan.isTerlambat ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  <span>TERLAMBAT {loan.hariTerlambat} HARI (Denda: Rp {loan.estimasiDenda.toLocaleString('id-ID')})</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  <Check className="w-3 h-3" />
                                  <span>Tepat Waktu (Tidak Ada Denda)</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* SELECT BUTTON */}
                        <button
                          onClick={() => handleToggleReturnItem(loan)}
                          className={`self-start px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200'
                              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                          }`}
                        >
                          {isSelected ? 'Batal Kembali' : 'Kembalikan Buku'}
                        </button>
                      </div>

                      {/* CONDITION PICKER IF SELECTED */}
                      {isSelected && (
                        <div className="mt-4 pt-3 border-t border-blue-100 space-y-3 bg-white p-3.5 rounded-xl border border-blue-200/80">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                              Pilih Kondisi Buku Saat Dikembalikan:
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {(['Baik', 'Rusak Ringan', 'Rusak Berat', 'Hilang'] as ReturnCondition[]).map(cond => (
                                <button
                                  key={cond}
                                  type="button"
                                  onClick={() => handleUpdateCondition(loan.detailId, cond)}
                                  className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                                    selectedCart.kondisi === cond
                                      ? cond === 'Baik'
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                        : cond === 'Rusak Ringan'
                                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                                        : 'bg-rose-600 text-white border-rose-600 shadow-sm'
                                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                                  }`}
                                >
                                  {cond}
                                </button>
                              ))}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1.5">
                              {selectedCart.kondisi === 'Baik' && '✓ Stok bertambah kembali ke rak perpustakaan.'}
                              {selectedCart.kondisi === 'Rusak Ringan' && '⚠ Buku perlu perbaikan, tetap dicatat kembali.'}
                              {selectedCart.kondisi === 'Rusak Berat' && '✕ Buku rusak berat, stok tidak otomatis bertambah.'}
                              {selectedCart.kondisi === 'Hilang' && '✕ Ditandai hilang, tidak dikembalikan ke stok tersedia.'}
                            </p>
                          </div>

                          <div>
                            <input
                              type="text"
                              value={selectedCart.catatan}
                              onChange={e => handleUpdateNotes(loan.detailId, e.target.value)}
                              placeholder="Catatan kondisi buku (opsional, misal: halaman 12 terlipat)..."
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SCANNER MODAL - KARTU ANGGOTA */}
      <QrScannerModal
        isOpen={isMemberScannerOpen}
        onClose={() => setIsMemberScannerOpen(false)}
        onScan={code => {
          const m = memberService.getByCodeOrQr(code);
          if (m) {
            handleSelectMember(m);
          } else {
            toast.error(`Anggota dengan kode "${code}" tidak ditemukan.`);
            soundService.playErrorBeep();
          }
        }}
        title="Scan Kartu Siswa"
        subtitle="Arahkan kamera ke QR kartu perpustakaan siswa"
        expectedPrefix="AGT"
        sampleCodes={[
          { code: 'AGT-00001', label: 'Ahmad Fauzan (2 buku)' },
          { code: 'AGT-00002', label: 'Siti Aisyah (1 terlambat)' },
          { code: 'AGT-00005', label: 'Rizky Pratama (1 buku)' }
        ]}
      />

      {/* SCANNER MODAL - BUKU */}
      <QrScannerModal
        isOpen={isBookScannerOpen}
        onClose={() => setIsBookScannerOpen(false)}
        onScan={code => {
          const matched = activeLoans.find(
            l => l.buku.kode_buku.toUpperCase() === code.trim().toUpperCase() ||
                 l.buku.qr_token.toUpperCase() === code.trim().toUpperCase()
          );
          if (matched) {
            handleToggleReturnItem(matched);
          } else {
            toast.error(`Buku dengan kode "${code}" bukan buku yang sedang dipinjam siswa ini.`);
            soundService.playErrorBeep();
          }
        }}
        title="Scan Buku yang Dikembalikan"
        subtitle="Arahkan ke barcode atau QR pada buku"
        expectedPrefix="BK"
        sampleCodes={activeLoans.map(l => ({
          code: l.buku.kode_buku,
          label: l.buku.judul
        }))}
      />

      {/* MODAL MANUAL SEARCH SISWA */}
      {isManualMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-base">
                Cari Siswa Manual
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

      {/* PRINT RECEIPT MODAL */}
      {isPrintModalOpen && lastReceiptData && (
        <PrintBuktiPengembalian
          receipt={lastReceiptData}
          settings={settings}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}
    </div>
  );
};
