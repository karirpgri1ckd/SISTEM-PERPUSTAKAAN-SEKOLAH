import React from 'react';
import { Book, Settings } from '../../types';
import { QrCodeViewer } from '../common/QrCodeViewer';
import { Printer, FileDown, X } from 'lucide-react';
import { pdfService } from '../../services/pdfService';

interface PrintLabelBukuProps {
  book: Book;
  settings: Settings;
  onClose: () => void;
}

export const PrintLabelBuku: React.FC<PrintLabelBukuProps> = ({
  book,
  settings,
  onClose
}) => {
  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = () => {
    pdfService.exportLabelBuku(book);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 no-print">
          <div>
            <h3 className="text-base font-bold text-slate-800">Cetak Label Buku</h3>
            <p className="text-xs text-slate-500">Label barcode & QR untuk punggung / sampul buku</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPdf}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              title="Unduh Label sebagai PDF"
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

        {/* Printable Label Area */}
        <div className="p-8 bg-slate-100 flex justify-center">
          <div
            id="print-area"
            className="w-[280px] bg-white rounded-lg shadow border border-slate-400 p-3 flex flex-col items-center text-center font-sans"
          >
            {/* Header */}
            <div className="w-full border-b border-dashed border-slate-300 pb-1.5 mb-2">
              <p className="text-[10px] font-bold text-slate-900 uppercase tracking-wide">
                {settings.nama_perpustakaan}
              </p>
              <p className="text-[8px] text-slate-600 uppercase font-semibold">
                {settings.nama_sekolah}
              </p>
            </div>

            {/* QR Code */}
            <div className="my-1">
              <QrCodeViewer value={book.qr_token || book.kode_buku} size={90} />
            </div>

            {/* Code */}
            <div className="mt-1 font-mono font-bold text-sm text-slate-900 tracking-wider">
              {book.kode_buku}
            </div>

            {/* Book Title & Shelf */}
            <div className="w-full mt-2 pt-1.5 border-t border-dashed border-slate-300 text-slate-800">
              <p className="text-xs font-bold line-clamp-1">{book.judul}</p>
              <p className="text-[10px] text-slate-600 line-clamp-1">Karya: {book.penulis}</p>
              <div className="mt-1.5 inline-block bg-slate-100 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-blue-900 border border-slate-200">
                LOKASI RAK: {book.rak}
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-center no-print">
          <span>Dapat dicetak menggunakan kertas stiker label.</span>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-900 font-medium">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
