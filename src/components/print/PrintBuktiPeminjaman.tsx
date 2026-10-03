import React from 'react';
import { TransactionWithDetails, Settings } from '../../types';
import { QrCodeViewer } from '../common/QrCodeViewer';
import { Printer, FileDown, X } from 'lucide-react';
import { pdfService } from '../../services/pdfService';

interface PrintBuktiPeminjamanProps {
  transaction: TransactionWithDetails;
  settings: Settings;
  onClose: () => void;
}

export const PrintBuktiPeminjaman: React.FC<PrintBuktiPeminjamanProps> = ({
  transaction,
  settings,
  onClose
}) => {
  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = () => {
    pdfService.exportBuktiPeminjaman(transaction);
  };

  const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        {/* Modal Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 no-print">
          <div>
            <h3 className="text-base font-bold text-slate-800">Bukti Peminjaman Buku</h3>
            <p className="text-xs text-slate-500">Struk / Bukti resmi transaksi peminjaman</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPdf}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              title="Unduh berkas PDF"
            >
              <FileDown className="w-4 h-4" />
              <span>PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Area */}
        <div className="p-6 bg-slate-100 flex justify-center max-h-[75vh] overflow-y-auto">
          <div
            id="print-area"
            className="w-[320px] bg-white rounded-lg shadow-md border border-slate-300 p-5 font-mono text-xs text-slate-900"
          >
            {/* Header */}
            <div className="text-center border-b-2 border-dashed border-slate-300 pb-3 mb-3">
              <h2 className="text-sm font-bold tracking-wider">{settings.nama_sekolah}</h2>
              <h3 className="text-xs font-semibold text-slate-700">{settings.nama_perpustakaan}</h3>
              <p className="text-[10px] text-slate-500 font-sans mt-0.5">{settings.alamat}</p>
              <div className="mt-2 inline-block px-2 py-0.5 bg-slate-100 rounded text-[11px] font-bold tracking-widest border border-slate-300">
                BUKTI PEMINJAMAN
              </div>
            </div>

            {/* Transaction Info */}
            <div className="space-y-1 pb-3 border-b border-dashed border-slate-300 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-600">Kode Trx:</span>
                <span className="font-bold">{transaction.kode_transaksi}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Nama:</span>
                <span className="font-bold truncate max-w-[180px]">{transaction.anggota?.nama}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">NIS:</span>
                <span>{transaction.anggota?.nis}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Kelas:</span>
                <span>{transaction.anggota?.kelas}</span>
              </div>
            </div>

            {/* Book List */}
            <div className="py-3 border-b border-dashed border-slate-300">
              <div className="font-bold mb-2 tracking-wider text-[11px]">DAFTAR BUKU:</div>
              <div className="space-y-2">
                {transaction.details.map((d, index) => (
                  <div key={d.id} className="text-[11px]">
                    <div className="font-semibold flex justify-between">
                      <span>{index + 1}. {d.buku?.judul || 'Buku'}</span>
                    </div>
                    <div className="text-[10px] text-slate-600 pl-4">
                      Kode: {d.buku?.kode_buku} (Rak: {d.buku?.rak})
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dates & Officer */}
            <div className="py-3 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-600">Tgl Pinjam:</span>
                <span>{formatDateIndo(transaction.tanggal_pinjam)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Jatuh Tempo:</span>
                <span className="font-bold text-rose-700">{formatDateIndo(transaction.tanggal_jatuh_tempo)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Petugas:</span>
                <span>{transaction.petugas?.nama || settings.nama_petugas || 'Petugas Perpustakaan'}</span>
              </div>
            </div>

            {/* QR & Message */}
            <div className="pt-4 flex flex-col items-center text-center">
              <QrCodeViewer value={transaction.kode_transaksi} size={85} />
              <p className="mt-2 text-[10px] text-slate-600 font-sans italic max-w-[240px]">
                "Harap merawat dan mengembalikan buku tepat waktu. Denda keterlambatan: Rp {settings.denda_per_hari.toLocaleString('id-ID')}/hari."
              </p>
              <p className="mt-2 text-[9px] text-slate-400 font-sans">
                Terima kasih telah berkunjung ke perpustakaan.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500 no-print">
          <span>Dapat dicetak pada printer thermal 80mm atau printer biasa.</span>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-900 font-medium">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
