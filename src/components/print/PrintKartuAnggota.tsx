import React from 'react';
import { Member, Settings } from '../../types';
import { QrCodeViewer } from '../common/QrCodeViewer';
import { Printer, FileDown, X, BookOpen, User } from 'lucide-react';
import { pdfService } from '../../services/pdfService';

interface PrintKartuAnggotaProps {
  member: Member;
  settings: Settings;
  onClose: () => void;
}

export const PrintKartuAnggota: React.FC<PrintKartuAnggotaProps> = ({
  member,
  settings,
  onClose
}) => {
  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = () => {
    pdfService.exportKartuAnggota(member);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Modal Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 no-print">
          <div>
            <h3 className="text-base font-bold text-slate-800">Cetak Kartu Anggota</h3>
            <p className="text-xs text-slate-500">Pratinjau kartu anggota siswa</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPdf}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              title="Unduh Kartu sebagai PDF"
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

        {/* Printable Card Area */}
        <div className="p-6 bg-slate-100/70 flex justify-center">
          <div
            id="print-area"
            className="w-[340px] h-[215px] bg-white rounded-xl shadow-md border-2 border-blue-600 relative overflow-hidden flex flex-col justify-between p-3.5"
            style={{
              boxSizing: 'border-box'
            }}
          >
            {/* Top decorative stripe */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-700 via-blue-500 to-indigo-600" />

            {/* School / Library Header */}
            <div className="flex items-center gap-2 border-b border-blue-100 pb-2 mt-1">
              <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 overflow-hidden">
                {settings.logo && settings.logo.trim() !== '' ? (
                  <img
                    src={settings.logo}
                    alt="Logo"
                    className="w-full h-full object-cover"
                    onError={e => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <BookOpen className="w-4 h-4 text-blue-700" />
                )}
              </div>
              <div className="leading-tight flex-1">
                <h4 className="text-[11px] font-extrabold text-blue-900 tracking-wide uppercase">
                  {settings.nama_sekolah}
                </h4>
                <p className="text-[9px] font-semibold text-slate-600 uppercase">
                  {settings.nama_perpustakaan}
                </p>
                <div className="text-[8px] tracking-widest font-bold text-blue-600 uppercase">
                  KARTU ANGGOTA PERPUSTAKAAN
                </div>
              </div>
            </div>

            {/* Body: Photo, Info, and QR Code */}
            <div className="flex items-center gap-3 my-auto py-1">
              {/* Photo */}
              <div className="w-16 h-20 bg-slate-100 rounded-md border border-slate-300 overflow-hidden shrink-0 shadow-2xs flex items-center justify-center">
                {member.foto && member.foto.trim() !== '' ? (
                  <img
                    src={member.foto}
                    alt={member.nama}
                    className="w-full h-full object-cover"
                    onError={e => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <User className="w-8 h-8 text-slate-400" />
                )}
              </div>

              {/* Info details */}
              <div className="flex-1 text-[10px] space-y-0.5 text-slate-800">
                <div className="flex">
                  <span className="w-12 text-slate-500 font-medium">Nama</span>
                  <span className="font-bold text-slate-900 truncate flex-1">: {member.nama}</span>
                </div>
                <div className="flex">
                  <span className="w-12 text-slate-500 font-medium">NIS</span>
                  <span className="font-semibold">: {member.nis}</span>
                </div>
                <div className="flex">
                  <span className="w-12 text-slate-500 font-medium">Kelas</span>
                  <span className="font-semibold">: {member.kelas}</span>
                </div>
                <div className="flex">
                  <span className="w-12 text-slate-500 font-medium">Kode</span>
                  <span className="font-mono font-bold text-blue-700">: {member.kode_anggota}</span>
                </div>
                <div className="flex">
                  <span className="w-12 text-slate-500 font-medium">Status</span>
                  <span className="font-semibold text-emerald-700">: {member.status}</span>
                </div>
              </div>

              {/* QR Code */}
              <div className="shrink-0 flex flex-col items-center">
                <QrCodeViewer value={member.qr_token || member.kode_anggota} size={62} />
                <span className="text-[7px] font-mono text-slate-400 mt-0.5">SCAN ME</span>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 pt-1 flex items-center justify-between text-[7.5px] text-slate-500">
              <span>Kartu wajib dibawa setiap peminjaman</span>
              <span className="font-semibold text-blue-800">Berlaku Selama Menjadi Siswa</span>
            </div>
          </div>
        </div>

        {/* Modal Info Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-center no-print">
          <span>Gunakan printer standar atau PVC card printer.</span>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 font-medium"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
