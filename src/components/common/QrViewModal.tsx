import React from 'react';
import { Modal } from './Modal';
import { QrCodeViewer } from './QrCodeViewer';
import { Download, Printer, QrCode, ShieldCheck } from 'lucide-react';
import QRCode from 'qrcode';

interface QrViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  code: string;
  name: string;
  type: 'anggota' | 'buku';
  subInfo?: { label: string; value: string }[];
}

export const QrViewModal: React.FC<QrViewModalProps> = ({
  isOpen,
  onClose,
  title,
  code,
  name,
  type,
  subInfo = []
}) => {
  if (!isOpen) return null;

  const handleDownloadQr = async () => {
    try {
      const url = await QRCode.toDataURL(code, {
        width: 400,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      });
      const link = document.createElement('a');
      link.href = url;
      link.download = `qrcode_${code}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} subtitle={code} maxWidth="md">
      <div className="flex flex-col items-center text-center space-y-4 py-2">
        {/* Printable Section */}
        <div id="print-area" className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 mb-2">
            <QrCodeViewer value={code} size={160} />
          </div>

          <span className="font-mono text-base font-extrabold text-blue-700 tracking-wider">
            {code}
          </span>
          <h4 className="font-bold text-sm text-slate-800 mt-1 max-w-[240px] truncate">
            {name}
          </h4>

          {subInfo.length > 0 && (
            <div className="mt-3 pt-2 border-t border-slate-100 w-full space-y-1 text-xs text-slate-600">
              {subInfo.map((item, idx) => (
                <div key={idx} className="flex justify-between px-2">
                  <span className="text-slate-400">{item.label}:</span>
                  <span className="font-semibold text-slate-800">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 text-blue-800">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>QR hanya menyimpan token unik ({code}) untuk keamanan data.</span>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 w-full pt-2 no-print">
          <button
            type="button"
            onClick={handleDownloadQr}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Gambar QR</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak QR</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
