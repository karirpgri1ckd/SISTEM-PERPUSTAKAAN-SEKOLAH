import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  FileDown,
  Printer,
  BookOpen,
  Users,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { reportService } from '../services/reportService';
import { pdfService } from '../services/pdfService';
import { db } from '../database/db';
import { Settings } from '../types';
import { useToast } from '../components/common/Toast';

type ReportTab = 'peminjaman' | 'pengembalian' | 'buku' | 'anggota' | 'keterlambatan';

interface LaporanPageProps {
  settings: Settings;
}

export const LaporanPage: React.FC<LaporanPageProps> = ({ settings }) => {
  const [activeTab, setActiveTab] = useState<ReportTab>('peminjaman');

  // Date filters
  const todayStr = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(todayStr);

  const toast = useToast();

  const handlePrint = () => {
    window.print();
  };

  // Data queries
  const loanReportData = useMemo(() => {
    return reportService.getLoanReport(startDate, endDate);
  }, [startDate, endDate]);

  const returnReportData = useMemo(() => {
    return reportService.getReturnReport(startDate, endDate);
  }, [startDate, endDate]);

  const overdueReportData = useMemo(() => {
    return reportService.getOverdueReport();
  }, []);

  const booksSummary = useMemo(() => {
    const books = db.getBooks();
    const details = db.getTransactionDetails();

    const totalKoleksi = books.reduce((acc, b) => acc + (b.stok || 0), 0);
    const dipinjamCount = details.filter(d => d.status === 'Dipinjam').length;
    const rusakCount = books.filter(b => b.status === 'Perbaikan').reduce((acc, b) => acc + (b.stok || 0), 0);
    const hilangCount = books.filter(b => b.status === 'Hilang').length;
    const tersediaCount = books.filter(b => b.status === 'Tersedia').reduce((acc, b) => acc + (b.stok || 0), 0);

    return {
      totalKoleksi,
      tersediaCount,
      dipinjamCount,
      rusakCount,
      hilangCount,
      booksList: books
    };
  }, []);

  const membersSummary = useMemo(() => {
    const members = db.getMembers();
    const transactions = db.getTransactions();
    const details = db.getTransactionDetails();

    // Borrow count per member
    const counts = new Map<string, number>();
    for (const t of transactions) {
      const bCount = details.filter(d => d.transaksi_id === t.id).length;
      counts.set(t.anggota_id, (counts.get(t.anggota_id) || 0) + bCount);
    }

    const membersWithStats = members.map(m => {
      const activeBorrowed = details.filter(
        d => d.status === 'Dipinjam' && transactions.find(t => t.id === d.transaksi_id)?.anggota_id === m.id
      ).length;

      return {
        member: m,
        totalPinjaman: counts.get(m.id) || 0,
        sedangDipinjam: activeBorrowed
      };
    });

    return membersWithStats.sort((a, b) => b.totalPinjaman - a.totalPinjaman);
  }, []);

  // Export handlers
  const handleExportCSV = () => {
    if (activeTab === 'peminjaman') {
      const headers = ['Kode Transaksi', 'Nama Siswa', 'NIS', 'Kelas', 'Tgl Pinjam', 'Jatuh Tempo', 'Jumlah Buku', 'Daftar Judul', 'Status'];
      const rows = loanReportData.map(d => [d.kode, d.anggota, d.nis, d.kelas, d.tanggal_pinjam, d.tanggal_jatuh_tempo, d.jumlah_buku, d.daftar_buku, d.status]);
      reportService.exportCSV(`laporan_peminjaman_${startDate}_sd_${endDate}`, headers, rows);
    } else if (activeTab === 'pengembalian') {
      const headers = ['Kode Trx', 'Nama Siswa', 'Kelas', 'Kode Buku', 'Judul Buku', 'Tgl Kembali', 'Kondisi', 'Catatan', 'Denda'];
      const rows = returnReportData.map(d => [d.kode_trx, d.anggota, d.kelas, d.kode_buku, d.judul_buku, d.tanggal_kembali, d.kondisi, d.catatan, d.denda]);
      reportService.exportCSV(`laporan_pengembalian_${startDate}_sd_${endDate}`, headers, rows);
    } else if (activeTab === 'keterlambatan') {
      const headers = ['Kode Trx', 'Nama Siswa', 'NIS', 'Kelas', 'No HP', 'Judul Buku', 'Kode Buku', 'Tgl Pinjam', 'Jatuh Tempo', 'Hari Terlambat', 'Denda'];
      const rows = overdueReportData.map(d => [d.kode_transaksi, d.nama, d.nis, d.kelas, d.no_hp, d.judul_buku, d.kode_buku, d.tanggal_pinjam, d.tanggal_jatuh_tempo, d.hari_terlambat, d.estimasi_denda]);
      reportService.exportCSV('laporan_keterlambatan_buku', headers, rows);
    } else if (activeTab === 'buku') {
      const headers = ['Kode Buku', 'ISBN', 'Judul Buku', 'Penulis', 'Penerbit', 'Tahun', 'Rak', 'Stok', 'Status'];
      const rows = booksSummary.booksList.map(b => [b.kode_buku, b.isbn, b.judul, b.penulis, b.penerbit, b.tahun, b.rak, b.stok, b.status]);
      reportService.exportCSV('laporan_koleksi_buku', headers, rows);
    } else if (activeTab === 'anggota') {
      const headers = ['Kode Anggota', 'Nama Siswa', 'NIS', 'Kelas', 'Total Buku Dipinjam', 'Sedang Dipinjam', 'Status'];
      const rows = membersSummary.map(m => [m.member.kode_anggota, m.member.nama, m.member.nis, m.member.kelas, m.totalPinjaman, m.sedangDipinjam, m.member.status]);
      reportService.exportCSV('laporan_aktivitas_anggota', headers, rows);
    }
    toast.success('Laporan berhasil diexport ke format CSV / Excel.');
  };

  const handleExportPDF = () => {
    if (activeTab === 'peminjaman') {
      const headers = ['No', 'Kode Trx', 'Nama Siswa', 'NIS', 'Kelas', 'Tgl Pinjam', 'Jatuh Tempo', 'Buku', 'Status'];
      const data = loanReportData.map((d, i) => [
        i + 1,
        d.kode,
        d.anggota,
        d.nis,
        d.kelas,
        d.tanggal_pinjam,
        d.tanggal_jatuh_tempo,
        `${d.jumlah_buku} Buku (${d.daftar_buku})`,
        d.status
      ]);
      pdfService.exportTable({
        title: 'Laporan Transaksi Peminjaman Buku',
        subtitle: `Periode: ${startDate} s/d ${endDate}`,
        headers,
        data,
        filename: `laporan_peminjaman_${startDate}_sd_${endDate}`,
        orientation: 'landscape'
      });
    } else if (activeTab === 'pengembalian') {
      const headers = ['No', 'Kode Trx', 'Nama Siswa', 'Kelas', 'Kode Buku', 'Judul Buku', 'Tgl Kembali', 'Kondisi', 'Denda'];
      const data = returnReportData.map((d, i) => [
        i + 1,
        d.kode_trx,
        d.anggota,
        d.kelas,
        d.kode_buku,
        d.judul_buku,
        d.tanggal_kembali,
        d.kondisi,
        d.denda > 0 ? `Rp ${d.denda.toLocaleString('id-ID')}` : '-'
      ]);
      pdfService.exportTable({
        title: 'Laporan Pengembalian Buku Perpustakaan',
        subtitle: `Periode: ${startDate} s/d ${endDate}`,
        headers,
        data,
        filename: `laporan_pengembalian_${startDate}_sd_${endDate}`,
        orientation: 'landscape'
      });
    } else if (activeTab === 'keterlambatan') {
      const headers = ['No', 'Nama Siswa', 'NIS', 'Kelas', 'No WhatsApp', 'Judul Buku', 'Kode', 'Jatuh Tempo', 'Terlambat', 'Denda'];
      const data = overdueReportData.map((d, i) => [
        i + 1,
        d.nama,
        d.nis,
        d.kelas,
        d.no_hp,
        d.judul_buku,
        d.kode_buku,
        d.tanggal_jatuh_tempo,
        `${d.hari_terlambat} Hari`,
        `Rp ${d.estimasi_denda.toLocaleString('id-ID')}`
      ]);
      pdfService.exportTable({
        title: 'Laporan Rekapitulasi Siswa Terlambat & Denda',
        subtitle: `Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`,
        headers,
        data,
        filename: `laporan_keterlambatan_buku`,
        orientation: 'landscape'
      });
    } else if (activeTab === 'buku') {
      const headers = ['No', 'Kode Buku', 'ISBN', 'Judul Buku', 'Penulis', 'Penerbit', 'Tahun', 'Rak', 'Stok', 'Status'];
      const data = booksSummary.booksList.map((b, i) => [
        i + 1,
        b.kode_buku,
        b.isbn || '-',
        b.judul,
        b.penulis,
        b.penerbit,
        b.tahun,
        b.rak,
        b.stok,
        b.status
      ]);
      pdfService.exportTable({
        title: 'Laporan Inventaris Koleksi Buku Perpustakaan',
        subtitle: `Total Koleksi: ${booksSummary.totalKoleksi} Buku | Tersedia: ${booksSummary.tersediaCount}`,
        headers,
        data,
        filename: `laporan_koleksi_buku`,
        orientation: 'landscape'
      });
    } else if (activeTab === 'anggota') {
      const headers = ['No', 'Kode Anggota', 'Nama Siswa', 'NIS', 'Kelas', 'Total Dipinjam', 'Sedang Dipinjam', 'Status'];
      const data = membersSummary.map((m, i) => [
        i + 1,
        m.member.kode_anggota,
        m.member.nama,
        m.member.nis,
        m.member.kelas,
        `${m.totalPinjaman} Buku`,
        `${m.sedangDipinjam} Buku`,
        m.member.status
      ]);
      pdfService.exportTable({
        title: 'Laporan Aktivitas & Keanggotaan Siswa',
        subtitle: `Total Terdaftar: ${membersSummary.length} Anggota`,
        headers,
        data,
        filename: `laporan_aktivitas_anggota`,
        orientation: 'portrait'
      });
    }
    toast.success('Laporan berhasil diekspor ke berkas PDF.');
  };

  return (
    <div className="space-y-6">
      {/* Header controls (No print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs no-print">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </span>
            <span>Pusat Laporan &amp; Rekapitulasi Perpustakaan</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Ekspor rekapitulasi data sirkulasi, keterlambatan, dan inventaris buku
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Laporan</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation (No print) */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl no-print text-xs">
        {[
          { id: 'peminjaman', label: 'Laporan Peminjaman', icon: <ArrowUpRight className="w-3.5 h-3.5" /> },
          { id: 'pengembalian', label: 'Laporan Pengembalian', icon: <ArrowDownLeft className="w-3.5 h-3.5" /> },
          { id: 'keterlambatan', label: 'Laporan Keterlambatan', icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> },
          { id: 'buku', label: 'Rekap Koleksi Buku', icon: <BookOpen className="w-3.5 h-3.5" /> },
          { id: 'anggota', label: 'Aktivitas Anggota', icon: <Users className="w-3.5 h-3.5" /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ReportTab)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Date Filter Bar for Loan & Return tabs (No print) */}
      {(activeTab === 'peminjaman' || activeTab === 'pengembalian') && (
        <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 text-xs no-print">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Periode Dari:</span>
            </span>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Sampai:</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* REPORT CONTENT WRAPPER WITH PRINTABLE STYLES */}
      <div id="print-area" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        {/* Printable Official School Header (KOP SURAT) */}
        <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
          <h1 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-900">
            {settings.nama_sekolah}
          </h1>
          <h2 className="text-sm font-extrabold text-blue-900 uppercase">
            {settings.nama_perpustakaan}
          </h2>
          <p className="text-xs text-slate-600 mt-1 font-sans">
            {settings.alamat} • Telp: {settings.telepon} • Email: {settings.email}
          </p>
          <div className="mt-3 inline-block px-4 py-1 bg-slate-100 rounded-full text-xs font-bold uppercase tracking-widest text-slate-800 border border-slate-300">
            {activeTab === 'peminjaman' && `LAPORAN TRANSAKSI PEMINJAMAN (${startDate} s/d ${endDate})`}
            {activeTab === 'pengembalian' && `LAPORAN PENGEMBALIAN BUKU (${startDate} s/d ${endDate})`}
            {activeTab === 'keterlambatan' && 'LAPORAN REKAPITULASI KETERLAMBATAN & DENDA'}
            {activeTab === 'buku' && 'LAPORAN INVENTARIS & STATISTIK KOLEKSI BUKU'}
            {activeTab === 'anggota' && 'LAPORAN AKTIVITAS ANGGOTA PERPUSTAKAAN'}
          </div>
        </div>

        {/* 1. LAPORAN PEMINJAMAN */}
        {activeTab === 'peminjaman' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px] border-b border-slate-300">
                <tr>
                  <th className="p-2.5 border-r border-slate-200 w-10 text-center">No</th>
                  <th className="p-2.5 border-r border-slate-200">Kode Trx</th>
                  <th className="p-2.5 border-r border-slate-200">Nama Siswa</th>
                  <th className="p-2.5 border-r border-slate-200">Kelas</th>
                  <th className="p-2.5 border-r border-slate-200">Tgl Pinjam</th>
                  <th className="p-2.5 border-r border-slate-200">Jatuh Tempo</th>
                  <th className="p-2.5 border-r border-slate-200 text-center">Jml Buku</th>
                  <th className="p-2.5 border-r border-slate-200">Judul Buku</th>
                  <th className="p-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {loanReportData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      Tidak ada transaksi peminjaman pada rentang tanggal ini.
                    </td>
                  </tr>
                ) : (
                  loanReportData.map((d, i) => (
                    <tr key={d.kode} className="hover:bg-slate-50">
                      <td className="p-2 border-r border-slate-200 text-center font-semibold">{i + 1}</td>
                      <td className="p-2 border-r border-slate-200 font-mono font-bold text-blue-800">{d.kode}</td>
                      <td className="p-2 border-r border-slate-200 font-bold">{d.anggota}</td>
                      <td className="p-2 border-r border-slate-200">{d.kelas}</td>
                      <td className="p-2 border-r border-slate-200 font-mono">{d.tanggal_pinjam}</td>
                      <td className="p-2 border-r border-slate-200 font-mono font-semibold text-rose-700">{d.tanggal_jatuh_tempo}</td>
                      <td className="p-2 border-r border-slate-200 text-center font-bold">{d.jumlah_buku}</td>
                      <td className="p-2 border-r border-slate-200 text-[11px]">{d.daftar_buku}</td>
                      <td className="p-2 text-center font-semibold">{d.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. LAPORAN PENGEMBALIAN */}
        {activeTab === 'pengembalian' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px] border-b border-slate-300">
                <tr>
                  <th className="p-2.5 border-r border-slate-200 w-10 text-center">No</th>
                  <th className="p-2.5 border-r border-slate-200">Kode Trx</th>
                  <th className="p-2.5 border-r border-slate-200">Siswa</th>
                  <th className="p-2.5 border-r border-slate-200">Kelas</th>
                  <th className="p-2.5 border-r border-slate-200">Buku &amp; Kode</th>
                  <th className="p-2.5 border-r border-slate-200">Tgl Kembali</th>
                  <th className="p-2.5 border-r border-slate-200">Kondisi</th>
                  <th className="p-2.5 text-right">Denda (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {returnReportData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      Tidak ada data pengembalian pada rentang tanggal ini.
                    </td>
                  </tr>
                ) : (
                  returnReportData.map((d, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-2 border-r border-slate-200 text-center font-semibold">{i + 1}</td>
                      <td className="p-2 border-r border-slate-200 font-mono font-bold">{d.kode_trx}</td>
                      <td className="p-2 border-r border-slate-200 font-bold">{d.anggota}</td>
                      <td className="p-2 border-r border-slate-200">{d.kelas}</td>
                      <td className="p-2 border-r border-slate-200">
                        {d.judul_buku} <span className="font-mono text-slate-400">({d.kode_buku})</span>
                      </td>
                      <td className="p-2 border-r border-slate-200 font-mono">{d.tanggal_kembali}</td>
                      <td className="p-2 border-r border-slate-200 font-semibold">{d.kondisi}</td>
                      <td className="p-2 text-right font-mono font-bold text-rose-700">
                        {d.denda > 0 ? d.denda.toLocaleString('id-ID') : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. LAPORAN KETERLAMBATAN */}
        {activeTab === 'keterlambatan' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px] border-b border-slate-300">
                <tr>
                  <th className="p-2.5 border-r border-slate-200 w-10 text-center">No</th>
                  <th className="p-2.5 border-r border-slate-200">Siswa</th>
                  <th className="p-2.5 border-r border-slate-200">NIS / Kelas</th>
                  <th className="p-2.5 border-r border-slate-200">No. WhatsApp</th>
                  <th className="p-2.5 border-r border-slate-200">Judul Buku (Kode)</th>
                  <th className="p-2.5 border-r border-slate-200">Jatuh Tempo</th>
                  <th className="p-2.5 border-r border-slate-200 text-center">Hari Terlambat</th>
                  <th className="p-2.5 text-right">Estimasi Denda</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {overdueReportData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-emerald-600 font-bold">
                      ✓ Tidak ada siswa yang terlambat mengembalikan buku. Semua tepat waktu!
                    </td>
                  </tr>
                ) : (
                  overdueReportData.map((d, i) => (
                    <tr key={i} className="hover:bg-rose-50/40">
                      <td className="p-2 border-r border-slate-200 text-center font-semibold">{i + 1}</td>
                      <td className="p-2 border-r border-slate-200 font-bold text-slate-900">{d.nama}</td>
                      <td className="p-2 border-r border-slate-200">
                        {d.nis} ({d.kelas})
                      </td>
                      <td className="p-2 border-r border-slate-200 font-mono text-[11px]">{d.no_hp}</td>
                      <td className="p-2 border-r border-slate-200">
                        {d.judul_buku} <span className="font-mono text-slate-400">({d.kode_buku})</span>
                      </td>
                      <td className="p-2 border-r border-slate-200 font-mono font-bold text-rose-700">{d.tanggal_jatuh_tempo}</td>
                      <td className="p-2 border-r border-slate-200 text-center font-extrabold text-rose-700">
                        {d.hari_terlambat} Hari
                      </td>
                      <td className="p-2 text-right font-mono font-extrabold text-rose-700">
                        Rp {d.estimasi_denda.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. LAPORAN BUKU */}
        {activeTab === 'buku' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Koleksi</span>
                <span className="text-xl font-black text-slate-900">{booksSummary.totalKoleksi}</span>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                <span className="text-[10px] text-emerald-700 uppercase font-bold block">Tersedia</span>
                <span className="text-xl font-black text-emerald-800">{booksSummary.tersediaCount}</span>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-center">
                <span className="text-[10px] text-blue-700 uppercase font-bold block">Dipinjam</span>
                <span className="text-xl font-black text-blue-800">{booksSummary.dipinjamCount}</span>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                <span className="text-[10px] text-amber-700 uppercase font-bold block">Rusak / Perbaikan</span>
                <span className="text-xl font-black text-amber-800">{booksSummary.rusakCount}</span>
              </div>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center">
                <span className="text-[10px] text-rose-700 uppercase font-bold block">Hilang</span>
                <span className="text-xl font-black text-rose-800">{booksSummary.hilangCount}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px] border-b border-slate-300">
                  <tr>
                    <th className="p-2.5 border-r border-slate-200 w-10 text-center">No</th>
                    <th className="p-2.5 border-r border-slate-200">Kode Buku</th>
                    <th className="p-2.5 border-r border-slate-200">Judul Buku</th>
                    <th className="p-2.5 border-r border-slate-200">Penulis</th>
                    <th className="p-2.5 border-r border-slate-200">Penerbit</th>
                    <th className="p-2.5 border-r border-slate-200">Rak</th>
                    <th className="p-2.5 border-r border-slate-200 text-center">Stok</th>
                    <th className="p-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {booksSummary.booksList.map((b, i) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="p-2 border-r border-slate-200 text-center">{i + 1}</td>
                      <td className="p-2 border-r border-slate-200 font-mono font-bold text-blue-800">{b.kode_buku}</td>
                      <td className="p-2 border-r border-slate-200 font-bold">{b.judul}</td>
                      <td className="p-2 border-r border-slate-200">{b.penulis}</td>
                      <td className="p-2 border-r border-slate-200">{b.penerbit}</td>
                      <td className="p-2 border-r border-slate-200 font-mono">{b.rak}</td>
                      <td className="p-2 border-r border-slate-200 text-center font-bold">{b.stok}</td>
                      <td className="p-2 text-center font-semibold">{b.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. LAPORAN ANGGOTA */}
        {activeTab === 'anggota' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px] border-b border-slate-300">
                <tr>
                  <th className="p-2.5 border-r border-slate-200 w-10 text-center">No</th>
                  <th className="p-2.5 border-r border-slate-200">Kode</th>
                  <th className="p-2.5 border-r border-slate-200">Nama Siswa</th>
                  <th className="p-2.5 border-r border-slate-200">NIS</th>
                  <th className="p-2.5 border-r border-slate-200">Kelas</th>
                  <th className="p-2.5 border-r border-slate-200 text-center">Total Pernah Dipinjam</th>
                  <th className="p-2.5 border-r border-slate-200 text-center">Sedang Dipinjam</th>
                  <th className="p-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {membersSummary.map((item, i) => (
                  <tr key={item.member.id} className="hover:bg-slate-50">
                    <td className="p-2 border-r border-slate-200 text-center">{i + 1}</td>
                    <td className="p-2 border-r border-slate-200 font-mono font-bold text-blue-800">{item.member.kode_anggota}</td>
                    <td className="p-2 border-r border-slate-200 font-bold">{item.member.nama}</td>
                    <td className="p-2 border-r border-slate-200 font-mono">{item.member.nis}</td>
                    <td className="p-2 border-r border-slate-200">{item.member.kelas}</td>
                    <td className="p-2 border-r border-slate-200 text-center font-extrabold text-blue-700">{item.totalPinjaman} Buku</td>
                    <td className="p-2 border-r border-slate-200 text-center font-bold text-amber-700">{item.sedangDipinjam} Buku</td>
                    <td className="p-2 text-center font-semibold">{item.member.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tanda Tangan Resmi Pengesahan (Hanya muncul saat print atau di bagian bawah) */}
        <div className="mt-12 pt-6 border-t border-slate-300 flex justify-between text-xs text-slate-700">
          <div className="text-center w-56">
            <p>Mengetahui,</p>
            <p className="font-bold">Kepala Sekolah</p>
            <div className="h-16" />
            <p className="font-bold border-b border-slate-600 inline-block px-4">
              {settings.nama_kepala_sekolah || 'Drs. H. Mulyadi, M.Pd'}
            </p>
            <p className="text-[10px] text-slate-500">
              {settings.nip_kepala_sekolah ? `NUPTK. ${settings.nip_kepala_sekolah}` : '-'}
            </p>
          </div>

          <div className="text-center w-56">
            <p>{new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date())}</p>
            <p className="font-bold">Kepala Perpustakaan</p>
            <div className="h-16" />
            <p className="font-bold border-b border-slate-600 inline-block px-4">
              {settings.nama_petugas || 'Bambang Sudarsono, S.Pd'}
            </p>
            <p className="text-[10px] text-slate-500">
              {settings.nip_petugas ? `NUPTK. ${settings.nip_petugas}` : '-'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
