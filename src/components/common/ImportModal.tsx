import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  FileArchive,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  RefreshCw,
  Search,
  Check,
  Image as ImageIcon,
  FileText
} from 'lucide-react';
import {
  importService,
  ParsedMemberRow,
  ParsedBookRow
} from '../../services/importService';
import { BookCover } from './BookCover';
import { Badge } from './Badge';

interface ImportModalProps {
  isOpen: boolean;
  type: 'anggota' | 'buku';
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  type,
  onClose,
  onSuccess
}) => {
  const [step, setStep] = useState<'upload' | 'preview' | 'completed'>('upload');
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [updateExisting, setUpdateExisting] = useState(true);

  // Parsed data
  const [parsedMembers, setParsedMembers] = useState<ParsedMemberRow[]>([]);
  const [parsedBooks, setParsedBooks] = useState<ParsedBookRow[]>([]);
  const [extractedZipImagesCount, setExtractedZipImagesCount] = useState(0);

  // Filter in preview
  const [searchPreview, setSearchPreview] = useState('');

  // Result stats
  const [importResult, setImportResult] = useState<{
    imported: number;
    updated: number;
    skipped: number;
  } | null>(null);

  const excelInputRef = useRef<HTMLInputElement | null>(null);
  const zipInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const isMember = type === 'anggota';

  const handleDownloadTemplate = () => {
    if (isMember) {
      importService.downloadMemberTemplate();
    } else {
      importService.downloadBookTemplate();
    }
  };

  const handleProcessFiles = async () => {
    if (!excelFile) return;

    setIsProcessing(true);
    try {
      // 1. Extract ZIP images if provided
      let zipImagesMap = new Map<string, string>();
      if (zipFile) {
        zipImagesMap = await importService.extractImagesFromZip(zipFile);
        setExtractedZipImagesCount(zipImagesMap.size);
      } else {
        setExtractedZipImagesCount(0);
      }

      // 2. Parse Excel data
      const rawRows = await importService.readExcelToJson(excelFile);

      if (rawRows.length === 0) {
        alert('File Excel tidak memiliki baris data atau kosong.');
        setIsProcessing(false);
        return;
      }

      // 3. Map & Validate with ZIP images
      if (isMember) {
        const members = importService.parseMembersData(rawRows, zipImagesMap);
        setParsedMembers(members);
      } else {
        const books = importService.parseBooksData(rawRows, zipImagesMap);
        setParsedBooks(books);
      }

      setStep('preview');
    } catch (err: unknown) {
      console.error('Import processing error:', err);
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommitImport = () => {
    setIsProcessing(true);
    try {
      if (isMember) {
        const res = importService.commitMembers(parsedMembers, updateExisting);
        setImportResult({
          imported: res.importedCount,
          updated: res.updatedCount,
          skipped: res.skippedCount
        });
      } else {
        const res = importService.commitBooks(parsedBooks, updateExisting);
        setImportResult({
          imported: res.importedCount,
          updated: res.updatedCount,
          skipped: res.skippedCount
        });
      }
      setStep('completed');
    } catch (err) {
      console.error('Commit error:', err);
      alert('Gagal menyimpan data import ke database.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinish = () => {
    onSuccess();
    onClose();
  };

  // Preview filtering
  const filteredPreviewMembers = parsedMembers.filter(m => {
    if (!searchPreview) return true;
    const q = searchPreview.toLowerCase();
    return (
      m.nama.toLowerCase().includes(q) ||
      m.kode_anggota.toLowerCase().includes(q) ||
      m.nis.includes(q) ||
      m.kelas.toLowerCase().includes(q)
    );
  });

  const filteredPreviewBooks = parsedBooks.filter(b => {
    if (!searchPreview) return true;
    const q = searchPreview.toLowerCase();
    return (
      b.judul.toLowerCase().includes(q) ||
      b.kode_buku.toLowerCase().includes(q) ||
      b.penulis.toLowerCase().includes(q) ||
      b.isbn.includes(q)
    );
  });

  const validRowsCount = isMember
    ? parsedMembers.filter(m => m.isValid).length
    : parsedBooks.filter(b => b.isValid).length;

  const matchedPhotosCount = isMember
    ? parsedMembers.filter(m => m.photoMatchedFromZip).length
    : parsedBooks.filter(b => b.coverMatchedFromZip).length;

  const existingCount = isMember
    ? parsedMembers.filter(m => m.isExisting).length
    : parsedBooks.filter(b => b.isExisting).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-2xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800">
                Import Data {isMember ? 'Anggota Siswa' : 'Koleksi Buku'}
              </h3>
              <p className="text-xs text-slate-500">
                Gunakan template Excel resmi dan file ZIP foto dengan klasifikasi kode
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: UPLOAD STAGE */}
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Template Download Banner */}
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                      Langkah 1: Unduh Format Template Excel
                    </h4>
                    <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                      Download format tabel (.xlsx) yang telah dilengkapi contoh data dan petunjuk penamaan foto dalam ZIP.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Unduh Template Excel</span>
                </button>
              </div>

              {/* Upload Dropzones */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Excel File Input */}
                <div
                  onClick={() => excelInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                    excelFile
                      ? 'border-emerald-400 bg-emerald-50/30'
                      : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20'
                  }`}
                >
                  <input
                    ref={excelInputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setExcelFile(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-3">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    File Excel Data ({isMember ? 'Siswa' : 'Buku'})
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Format .xlsx, .xls, atau .csv (Wajib)
                  </p>

                  {excelFile ? (
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="truncate max-w-[200px]">{excelFile.name}</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-800"
                    >
                      Pilih File Excel...
                    </button>
                  )}
                </div>

                {/* ZIP Photos Input */}
                <div
                  onClick={() => zipInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                    zipFile
                      ? 'border-indigo-400 bg-indigo-50/30'
                      : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/20'
                  }`}
                >
                  <input
                    ref={zipInputRef}
                    type="file"
                    accept=".zip, .rar"
                    className="hidden"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setZipFile(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto mb-3">
                    <FileArchive className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    File ZIP Foto / Cover (Opsional)
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Arsip .zip berisi kumpulan foto gambar
                  </p>

                  {zipFile ? (
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-lg text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="truncate max-w-[200px]">{zipFile.name}</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      Pilih File ZIP Foto...
                    </button>
                  )}
                </div>
              </div>

              {/* Instructions Guide */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
                <h5 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                  <span>Petunjuk Klasifikasi Kode Foto (Mencegah Salah / Ganda):</span>
                </h5>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 leading-relaxed">
                  <li>
                    <strong>Otomatis lewat Kode:</strong> Namai foto di dalam file ZIP dengan kode identitas, misalnya{' '}
                    <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-blue-700">
                      {isMember ? 'AGT-00011.jpg' : 'BK-00021.jpg'}
                    </code>{' '}
                    atau{' '}
                    <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-blue-700">
                      {isMember ? '10301.png (NIS)' : '9786020334501.png (ISBN)'}
                    </code>.
                  </li>
                  <li>
                    <strong>Otomatis lewat Kolom Excel:</strong> Atau masukkan nama file gambar pada kolom{' '}
                    <em>"Nama File {isMember ? 'Foto' : 'Cover'} di ZIP"</em>.
                  </li>
                  <li>
                    Sistem mengekstrak dan mencocokkan secara presisi sehingga tidak akan terjadi foto tertukar atau terduplikasi.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* STEP 2: PREVIEW STAGE */}
          {step === 'preview' && (
            <div className="space-y-4">
              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Total Baris</span>
                  <div className="text-xl font-extrabold text-slate-800">
                    {isMember ? parsedMembers.length : parsedBooks.length}
                  </div>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase">Data Valid</span>
                  <div className="text-xl font-extrabold text-emerald-800">{validRowsCount}</div>
                </div>
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-indigo-700 uppercase">Foto dari ZIP</span>
                  <div className="text-xl font-extrabold text-indigo-800">
                    {matchedPhotosCount}
                    <span className="text-[10px] text-slate-400 font-normal ml-1">
                      ({extractedZipImagesCount} diekstrak)
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-amber-700 uppercase">Sudah Ada di DB</span>
                  <div className="text-xl font-extrabold text-amber-800">{existingCount}</div>
                </div>
              </div>

              {/* Options & Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={updateExisting}
                    onChange={e => setUpdateExisting(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                  <span>Perbarui data jika Kode / NIS sudah ada di database</span>
                </label>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchPreview}
                    onChange={e => setSearchPreview(e.target.value)}
                    placeholder="Saring pratinjau..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Table Preview */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-[46vh] overflow-y-auto">
                {isMember ? (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center">No</th>
                        <th className="py-2.5 px-3 w-14">Foto</th>
                        <th className="py-2.5 px-3">Kode Anggota</th>
                        <th className="py-2.5 px-3">Nama Siswa</th>
                        <th className="py-2.5 px-3">NIS / Kelas</th>
                        <th className="py-2.5 px-3">Status Foto</th>
                        <th className="py-2.5 px-3 text-center">Status DB</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPreviewMembers.map((m, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 text-center text-slate-400 font-mono">
                            {m.rowNumber}
                          </td>
                          <td className="py-2 px-3">
                            <div className="w-8 h-10 rounded bg-slate-100 overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center">
                              {m.photoDataUrl && m.photoDataUrl.trim() !== '' ? (
                                <img
                                  src={m.photoDataUrl}
                                  alt={m.nama}
                                  className="w-full h-full object-cover"
                                  onError={e => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <span className="text-[9px] text-slate-400">-</span>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-blue-700">
                            {m.kode_anggota}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-800">
                            {m.nama}
                          </td>
                          <td className="py-2 px-3 text-slate-600">
                            {m.nis} ({m.kelas})
                          </td>
                          <td className="py-2 px-3">
                            {m.photoMatchedFromZip ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Dari ZIP</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Avatar Bawaan</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {m.isExisting ? (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                Sudah Ada
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                Data Baru
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center">No</th>
                        <th className="py-2.5 px-3 w-14">Cover</th>
                        <th className="py-2.5 px-3">Kode Buku</th>
                        <th className="py-2.5 px-3">Judul Buku</th>
                        <th className="py-2.5 px-3">Penulis / Rak</th>
                        <th className="py-2.5 px-3 text-center">Stok</th>
                        <th className="py-2.5 px-3">Status Cover</th>
                        <th className="py-2.5 px-3 text-center">Status DB</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPreviewBooks.map((b, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 text-center text-slate-400 font-mono">
                            {b.rowNumber}
                          </td>
                          <td className="py-2 px-3">
                            <div className="w-8 h-11 rounded bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                              <BookCover src={b.coverDataUrl} title={b.judul} className="w-full h-full" />
                            </div>
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-blue-700">
                            {b.kode_buku}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-800 line-clamp-1">
                            {b.judul}
                          </td>
                          <td className="py-2 px-3 text-slate-600 text-[11px]">
                            {b.penulis} • Rak: {b.rak}
                          </td>
                          <td className="py-2 px-3 text-center font-bold text-slate-900">
                            {b.stok}
                          </td>
                          <td className="py-2 px-3">
                            {b.coverMatchedFromZip ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Cover ZIP</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Cover Standar</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {b.isExisting ? (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                Sudah Ada
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                Data Baru
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: COMPLETED STAGE */}
          {step === 'completed' && importResult && (
            <div className="py-8 text-center space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner animate-in zoom-in duration-300">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h4 className="text-xl font-extrabold text-slate-800">
                  Import Data Berhasil!
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Data {isMember ? 'anggota siswa' : 'koleksi buku'} dan foto cover telah tersimpan ke dalam sistem perpustakaan.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Ditambahkan</span>
                  <span className="text-lg font-extrabold text-emerald-600">{importResult.imported}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Diperbarui</span>
                  <span className="text-lg font-extrabold text-blue-600">{importResult.updated}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Dilewati</span>
                  <span className="text-lg font-extrabold text-slate-500">{importResult.skipped}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
          {step === 'upload' && (
            <>
              <span className="text-xs text-slate-500">
                Pilih file Excel dan file ZIP foto untuk memulai
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={!excelFile || isProcessing}
                  onClick={handleProcessFiles}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Mengekstrak Data...</span>
                    </>
                  ) : (
                    <>
                      <span>Pratinjau Data</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {step === 'preview' && (
            <>
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                &larr; Pilih File Lain
              </button>

              <button
                type="button"
                disabled={validRowsCount === 0 || isProcessing}
                onClick={handleCommitImport}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menyimpan ke Database...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Simpan &amp; Import ({validRowsCount} Data)</span>
                  </>
                )}
              </button>
            </>
          )}

          {step === 'completed' && (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={handleFinish}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer"
              >
                Selesai &amp; Lihat Data
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
