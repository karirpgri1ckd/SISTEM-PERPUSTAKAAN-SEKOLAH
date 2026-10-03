import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  Filter,
  Eye,
  Printer,
  FileDown,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { TransactionWithDetails, Settings } from '../types';
import { transactionService } from '../services/transactionService';
import { reportService } from '../services/reportService';
import { pdfService } from '../services/pdfService';
import { Badge } from '../components/common/Badge';
import { Pagination } from '../components/common/Pagination';
import { Modal } from '../components/common/Modal';
import { PrintBuktiPeminjaman } from '../components/print/PrintBuktiPeminjaman';
import { useToast } from '../components/common/Toast';

interface TransaksiPageProps {
  settings: Settings;
}

export const TransaksiPage: React.FC<TransaksiPageProps> = ({ settings }) => {
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>(() =>
    transactionService.getAllWithDetails()
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals
  const [selectedTrxForDetail, setSelectedTrxForDetail] = useState<TransactionWithDetails | null>(null);
  const [selectedTrxForPrint, setSelectedTrxForPrint] = useState<TransactionWithDetails | null>(null);

  const toast = useToast();

  const refreshData = () => {
    setTransactions(transactionService.getAllWithDetails());
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'Dipinjam' && t.status !== 'Dipinjam') return false;
        if (statusFilter === 'Dikembalikan' && t.status !== 'Dikembalikan') return false;
        if (statusFilter === 'Terlambat' && t.status !== 'Terlambat') return false;
      }

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const matchKode = t.kode_transaksi.toLowerCase().includes(q);
      const matchNama = t.anggota?.nama.toLowerCase().includes(q);
      const matchNis = t.anggota?.nis.toLowerCase().includes(q);
      const matchBuku = t.details.some(d => d.buku?.judul.toLowerCase().includes(q));

      return matchKode || matchNama || matchNis || matchBuku;
    });
  }, [transactions, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  const handleExportCSV = () => {
    const headers = [
      'Kode Transaksi',
      'Nama Siswa',
      'NIS',
      'Kelas',
      'Daftar Buku',
      'Tanggal Pinjam',
      'Jatuh Tempo',
      'Tanggal Kembali',
      'Status',
      'Petugas'
    ];

    const rows = filteredTransactions.map(t => [
      t.kode_transaksi,
      t.anggota?.nama || '-',
      t.anggota?.nis || '-',
      t.anggota?.kelas || '-',
      t.details.map(d => `${d.buku?.judul} (${d.buku?.kode_buku})`).join('; '),
      t.tanggal_pinjam,
      t.tanggal_jatuh_tempo,
      t.tanggal_kembali || '-',
      t.status,
      t.petugas?.nama || '-'
    ]);

    reportService.exportCSV('transaksi_perpustakaan', headers, rows);
    toast.success('File data transaksi berhasil diunduh (CSV).');
  };

  const handleExportPdf = () => {
    const headers = [
      'No',
      'Kode Trx',
      'Siswa Peminjam',
      'NIS',
      'Kelas',
      'Daftar Buku',
      'Tgl Pinjam',
      'Jatuh Tempo',
      'Tgl Kembali',
      'Status',
      'Petugas'
    ];

    const data = filteredTransactions.map((t, i) => [
      i + 1,
      t.kode_transaksi,
      t.anggota?.nama || '-',
      t.anggota?.nis || '-',
      t.anggota?.kelas || '-',
      t.details.map(d => `${d.buku?.judul} (${d.buku?.kode_buku})`).join(', '),
      t.tanggal_pinjam,
      t.tanggal_jatuh_tempo,
      t.tanggal_kembali || '-',
      t.status,
      t.petugas?.nama || '-'
    ]);

    pdfService.exportTable({
      title: 'Daftar Seluruh Transaksi Peminjaman & Pengembalian',
      subtitle: `Total Transaksi Terfilter: ${filteredTransactions.length} Data`,
      headers,
      data,
      filename: `transaksi_perpustakaan_${new Date().toISOString().split('T')[0]}`,
      orientation: 'landscape'
    });
    toast.success('Data transaksi berhasil diekspor ke PDF.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </span>
            <span>Riwayat &amp; Data Seluruh Transaksi</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Data peminjaman dan pengembalian buku, status jatuh tempo, dan cetak ulang bukti
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportPdf}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            title="Export Daftar Transaksi ke PDF"
          >
            <FileText className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            <span>Export Excel / CSV</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari kode transaksi, siswa, judul buku..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer text-xs"
            >
              <option value="all">Semua Status Transaksi</option>
              <option value="Dipinjam">Aktif Dipinjam</option>
              <option value="Dikembalikan">Selesai Dikembalikan</option>
              <option value="Terlambat">Terlambat</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Kode Transaksi</th>
                <th className="py-3.5 px-4 min-w-[140px]">Siswa Peminjam</th>
                <th className="py-3.5 px-4">Kelas</th>
                <th className="py-3.5 px-4 min-w-[200px]">Buku yang Dipinjam</th>
                <th className="py-3.5 px-4">Tgl Pinjam</th>
                <th className="py-3.5 px-4">Jatuh Tempo</th>
                <th className="py-3.5 px-4">Tgl Kembali</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Tidak ada transaksi yang cocok.
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">
                      {tx.kode_transaksi}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{tx.anggota?.nama || '-'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        NIS: {tx.anggota?.nis || '-'}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {tx.anggota?.kelas || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        {tx.details.map((d, i) => (
                          <div key={d.id} className="line-clamp-1 font-medium text-slate-800">
                            • {d.buku?.judul || 'Buku'}{' '}
                            <span className="text-[10px] font-mono text-slate-400">
                              ({d.buku?.kode_buku})
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                      {tx.tanggal_pinjam}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] font-semibold text-rose-700">
                      {tx.tanggal_jatuh_tempo}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                      {tx.tanggal_kembali || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge status={tx.status} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedTrxForDetail(tx)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Detail Transaksi"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedTrxForPrint(tx)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Cetak Bukti Peminjaman"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredTransactions.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* DETAIL MODAL */}
      {selectedTrxForDetail && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedTrxForDetail(null)}
          title="Detail Transaksi Perpustakaan"
          subtitle={selectedTrxForDetail.kode_transaksi}
          maxWidth="2xl"
        >
          <div className="space-y-5 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-bold">
                  Status Transaksi
                </span>
                <Badge status={selectedTrxForDetail.status} />
              </div>
              <div className="text-right">
                <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-bold">
                  Petugas
                </span>
                <span className="font-bold text-slate-800">
                  {selectedTrxForDetail.petugas?.nama || 'Admin'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/70">
              <div>
                <span className="text-slate-400 block">Siswa:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {selectedTrxForDetail.anggota?.nama}
                </span>
                <span className="text-slate-500 block">
                  NIS: {selectedTrxForDetail.anggota?.nis} • Kelas: {selectedTrxForDetail.anggota?.kelas}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Periode Pinjam:</span>
                <span className="font-semibold block">
                  Pinjam: {selectedTrxForDetail.tanggal_pinjam}
                </span>
                <span className="font-bold text-rose-600 block">
                  Jatuh Tempo: {selectedTrxForDetail.tanggal_jatuh_tempo}
                </span>
                {selectedTrxForDetail.tanggal_kembali && (
                  <span className="text-emerald-700 font-semibold block">
                    Kembali: {selectedTrxForDetail.tanggal_kembali}
                  </span>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-2">
                Daftar Buku ({selectedTrxForDetail.details.length})
              </h4>
              <div className="space-y-2">
                {selectedTrxForDetail.details.map((d, index) => (
                  <div
                    key={d.id}
                    className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                        {index + 1}
                      </span>
                      <div>
                        <div className="font-bold text-slate-900">{d.buku?.judul}</div>
                        <div className="text-[11px] text-slate-500">
                          Kode: {d.buku?.kode_buku} • Rak: {d.buku?.rak}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge status={d.status} size="sm" />
                      {d.kondisi_kembali && (
                        <span className="block text-[10px] text-slate-500 mt-0.5">
                          Kondisi: {d.kondisi_kembali}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedTrxForDetail.catatan && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600">
                <span className="font-semibold block text-slate-700">Catatan:</span>
                {selectedTrxForDetail.catatan}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  pdfService.exportBuktiPeminjaman(selectedTrxForDetail);
                  toast.success('Bukti transaksi berhasil diunduh (PDF).');
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-xs cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                <span>Unduh Bukti PDF</span>
              </button>
              <button
                onClick={() => {
                  setSelectedTrxForPrint(selectedTrxForDetail);
                  setSelectedTrxForDetail(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Bukti Transaksi</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* PRINT RECEIPT MODAL */}
      {selectedTrxForPrint && (
        <PrintBuktiPeminjaman
          transaction={selectedTrxForPrint}
          settings={settings}
          onClose={() => setSelectedTrxForPrint(null)}
        />
      )}
    </div>
  );
};
