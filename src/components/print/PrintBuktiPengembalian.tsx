import React from 'react';
import { Member, Book, Settings, ReturnCondition } from '../../types';
import { QrCodeViewer } from '../common/QrCodeViewer';
import { Printer, FileDown, X, CheckCircle2 } from 'lucide-react';
import { pdfService } from '../../services/pdfService';

export interface ReturnReceiptData {
  member: Member;
  petugasName: string;
  items: {
    buku: Book;
    kodeTransaksi: string;
    tanggalPinjam: string;
    tanggalKembali: string;
    kondisi: ReturnCondition;
    denda: number;
    catatan?: string;
  }[];
  totalDenda: number;
  tanggalKembali: string;
}

interface PrintBuktiPengembalianProps {
  receipt: ReturnReceiptData;
  settings: Settings;
  onClose: () => void;
}

export const PrintBuktiPengembalian: React.FC<PrintBuktiPengembalianProps> = ({
  receipt,
  settings,
  onClose
}) => {
  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = () => {
    pdfService.exportBuktiPengembalian(receipt);
  };

  const returnCode = `KMB-${Date.now().toString().slice(-6)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Modal Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 no-print">
          <div>
            <h3 className="text-base font-bold text-slate-800">Cetak Bukti Pengembalian</h3>
            <p className="text-xs text-slate-500">Struk pengembalian dan penyelesaian denda buku</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPdf}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              title="Unduh Struk sebagai PDF"
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

        {/* Printable Struk Area */}
        <div className="p-6 bg-slate-100/70 flex justify-center max-h-[80vh] overflow-y-auto">
          <div
            id="print-area"
            className="w-[360px] bg-white rounded-xl shadow border border-slate-300 p-5 text-slate-800 font-sans space-y-4 text-xs"
          >
            {/* Header */}
            <div className="text-center border-b border-dashed border-slate-300 pb-3">
              <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
                {settings.nama_sekolah}
              </h4>
              <p className="text-xs font-bold text-blue-800 uppercase mt-0.5">
                {settings.nama_perpustakaan}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                {settings.alamat} • Telp: {settings.telepon}
              </p>

              <div className="mt-3 inline-block px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-bold text-[11px] uppercase tracking-wider">
                Bukti Pengembalian Buku
              </div>
            </div>

            {/* Identitas Siswa & Transaksi */}
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">No. Bukti Kembali:</span>
                <span className="font-mono font-bold text-slate-900">{returnCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Siswa:</span>
                <span className="font-bold text-slate-900">{receipt.member.nama}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">NIS / Kelas:</span>
                <span className="font-semibold text-slate-800">
                  {receipt.member.nis} / {receipt.member.kelas}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tanggal Kembali:</span>
                <span className="font-semibold text-slate-800">{receipt.tanggalKembali}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Petugas:</span>
                <span className="font-semibold text-slate-800">{receipt.petugasName}</span>
              </div>
            </div>

            {/* Daftar Buku */}
            <div className="border-t border-b border-dashed border-slate-300 py-3 space-y-2">
              <div className="font-bold text-[10px] text-slate-500 uppercase tracking-wider">
                Buku yang Dikembalikan ({receipt.items.length})
              </div>
              {receipt.items.map((item, idx) => (
                <div key={idx} className="bg-slate-50 p-2 rounded-lg border border-slate-200/80 text-[10px]">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span className="truncate flex-1">{item.buku.judul}</span>
                    <span className="font-mono ml-2 shrink-0">{item.buku.kode_buku}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 mt-1">
                    <span>Kondisi: <strong className={item.kondisi === 'Baik' ? 'text-emerald-700' : 'text-amber-700'}>{item.kondisi}</strong></span>
                    {item.denda > 0 ? (
                      <span className="text-rose-600 font-bold">Denda: Rp {item.denda.toLocaleString('id-ID')}</span>
                    ) : (
                      <span className="text-emerald-600 font-semibold">Bebas Denda</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Total Denda */}
            <div className="flex justify-between items-center text-xs font-bold pt-1">
              <span>Total Denda:</span>
              <span className={receipt.totalDenda > 0 ? 'text-rose-600 text-sm' : 'text-emerald-600'}>
                {receipt.totalDenda > 0 ? `Rp ${receipt.totalDenda.toLocaleString('id-ID')}` : 'Rp 0 (Lunas)'}
              </span>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center pt-2">
              <QrCodeViewer value={returnCode} size={70} />
              <span className="text-[9px] font-mono text-slate-400 mt-1">VALIDATED BY SYSTEM</span>
            </div>

            {/* Footer message */}
            <div className="text-center text-[9px] text-slate-400 border-t border-slate-100 pt-2">
              <p>Terima kasih telah mengembalikan buku perpustakaan tepat waktu.</p>
              <p className="mt-0.5 font-mono">{new Date().toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-center no-print">
          <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Buku telah dikembalikan ke stok perpustakaan
          </span>
          <button onClick={onClose} className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium cursor-pointer">
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
