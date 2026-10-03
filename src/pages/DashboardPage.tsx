import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  CheckCircle,
  Clock,
  Users,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  TrendingUp,
  Bookmark,
  ChevronRight,
  Sparkles,
  QrCode
} from 'lucide-react';
import { transactionService } from '../services/transactionService';
import { NavTab } from '../components/layout/Sidebar';
import { BookCover } from '../components/common/BookCover';
import { db } from '../database/db';

interface DashboardPageProps {
  onNavigate: (tab: NavTab) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    // Live subscriber: updates immediately when new transaction/return occurs
    const unsub = db.subscribe(() => {
      setRefreshTick(t => t + 1);
    });
    return () => unsub();
  }, []);

  const stats = useMemo(() => {
    return transactionService.getDashboardStats();
  }, [refreshTick]);

  const trendData = stats.trendDays;
  const maxTrend = Math.max(...trendData.map(d => d.count), 4);

  return (
    <div className="space-y-6">
      {/* Welcome Banner & Quick Action Buttons */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-900/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold mb-3 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Sistem Operasional Perpustakaan Aktif</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Selamat Datang di Portal Petugas
          </h2>
          <p className="text-blue-100 text-sm mt-1.5 leading-relaxed">
            Lakukan peminjaman dan pengembalian buku dengan cepat cukup dengan memindai QR Code kartu siswa dan buku.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 relative z-10">
          <button
            onClick={() => onNavigate('peminjaman')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 bg-white text-blue-700 hover:bg-blue-50 font-bold text-sm rounded-2xl shadow-lg transition-transform active:scale-95 cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            <span>Peminjaman Baru</span>
          </button>
          <button
            onClick={() => onNavigate('pengembalian')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 bg-blue-800/80 hover:bg-blue-800 text-white font-bold text-sm rounded-2xl border border-white/20 transition-transform active:scale-95 cursor-pointer"
          >
            <ArrowDownLeft className="w-4 h-4 text-amber-300" />
            <span>Pengembalian</span>
          </button>
        </div>
      </div>

      {/* 7 Key Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
        {/* Total Buku */}
        <div
          onClick={() => onNavigate('buku')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Buku</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-800">{stats.totalBuku}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Total eksemplar</div>
        </div>

        {/* Buku Tersedia */}
        <div
          onClick={() => onNavigate('buku')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tersedia</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-700">{stats.bukuTersedia}</div>
          <div className="text-[11px] text-emerald-600/80 mt-0.5" title={`Tersedia: ${stats.totalBuku} - ${stats.sedangDipinjam} = ${stats.bukuTersedia}`}>
            Siap di rak ({stats.totalBuku} - {stats.sedangDipinjam})
          </div>
        </div>

        {/* Sedang Dipinjam */}
        <div
          onClick={() => onNavigate('transaksi')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Dipinjam</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-700">{stats.sedangDipinjam}</div>
          <div className="text-[11px] text-amber-600/80 mt-0.5">Pada siswa aktif</div>
        </div>

        {/* Total Anggota */}
        <div
          onClick={() => onNavigate('anggota')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Anggota</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-indigo-700">{stats.totalAnggota}</div>
          <div className="text-[11px] text-indigo-600/80 mt-0.5">Siswa terdaftar</div>
        </div>

        {/* Peminjaman Hari Ini */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pinjam Hari Ini</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-800">{stats.peminjamanHariIni}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Transaksi baru</div>
        </div>

        {/* Pengembalian Hari Ini */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kembali Hari Ini</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-800">{stats.pengembalianHariIni}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Buku diterima</div>
        </div>

        {/* Buku Terlambat */}
        <div
          onClick={() => onNavigate('laporan')}
          className="col-span-2 md:col-span-1 bg-white p-4 rounded-2xl border border-rose-200 shadow-2xs hover:border-rose-400 hover:shadow-md transition-all cursor-pointer group bg-rose-50/20"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Terlambat</span>
            <div className="p-2 rounded-xl bg-rose-100 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-700">{stats.bukuTerlambat}</div>
          <div className="text-[11px] text-rose-600 font-medium mt-0.5">Perlu tindak lanjut</div>
        </div>
      </div>

      {/* Charts & Popular Books */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tren Peminjaman (Interactive SVG Chart) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span>Statistik Tren Peminjaman (7 Hari Terakhir)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Jumlah transaksi peminjaman buku harian oleh siswa
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
              Minggu Ini
            </span>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-52 flex items-end justify-between gap-2 pt-6 px-1">
            {trendData.map(d => {
              const heightPct = d.count === 0 ? 6 : Math.max(16, (d.count / maxTrend) * 100);

              return (
                <div
                  key={d.dateStr}
                  title={`${d.dayName} (${d.dateFormatted}): ${d.count} buku dipinjam`}
                  className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group cursor-pointer"
                >
                  <span className={`text-[11px] font-extrabold ${d.count > 0 ? 'text-blue-700' : 'text-slate-400'}`}>
                    {d.count}
                  </span>
                  <div className="w-full max-w-[42px] bg-slate-100 rounded-t-xl overflow-hidden h-full flex items-end border-b-2 border-slate-300">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-xl transition-all duration-500 ${
                        d.isToday
                          ? 'bg-gradient-to-t from-blue-700 to-blue-500 shadow-md shadow-blue-500/30 ring-2 ring-blue-400'
                          : d.count > 0
                          ? 'bg-gradient-to-t from-indigo-600 to-blue-400 group-hover:from-blue-600 group-hover:to-blue-500'
                          : 'bg-slate-300/70 group-hover:bg-slate-400/70'
                      }`}
                    />
                  </div>
                  <div className="text-center w-full">
                    <span className={`block text-[11px] leading-tight ${d.isToday ? 'font-extrabold text-blue-700' : 'font-bold text-slate-700'}`}>
                      {d.dayName}
                      {d.isToday && <span className="block text-[8px] text-blue-600 font-semibold uppercase tracking-tight">Hari Ini</span>}
                    </span>
                    <span className="block text-[9px] text-slate-400 font-mono">
                      {d.dateFormatted}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Buku Terpopuler */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-indigo-600" />
              <span>Buku Terpopuler</span>
            </h3>
            <button
              onClick={() => onNavigate('buku')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
            >
              Lihat Semua
            </button>
          </div>

          <div className="space-y-3 flex-1">
            {stats.popularBooks.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">Belum ada data peminjaman buku.</p>
            ) : (
              stats.popularBooks.map((item, index) => (
                <div
                  key={item.book?.id || index}
                  className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                >
                  <span
                    className={`w-6 h-6 rounded-lg text-xs font-extrabold flex items-center justify-center shrink-0 ${
                      index === 0
                        ? 'bg-amber-100 text-amber-800'
                        : index === 1
                        ? 'bg-slate-200 text-slate-700'
                        : index === 2
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    #{index + 1}
                  </span>
                  <div className="w-10 h-14 shrink-0 rounded-md overflow-hidden shadow-2xs border border-slate-200/70">
                    <BookCover
                      src={item.book?.cover}
                      title={item.book?.judul || 'Buku'}
                      className="w-full h-full"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-800 truncate">
                      {item.book?.judul}
                    </h4>
                    <p className="text-[10px] text-slate-500 truncate">
                      {item.book?.penulis}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-extrabold text-blue-700">
                      {item.count}x
                    </span>
                    <span className="block text-[9px] text-slate-400">dipinjam</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Aktivitas Terbaru & Quick Shortcut Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Aktivitas Terbaru Timeline */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-slate-800 text-base">
              Aktivitas Transaksi Terbaru
            </h3>
            <button
              onClick={() => onNavigate('transaksi')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
            >
              <span>Riwayat Lengkap</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {stats.activities.map((act, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50/60 border border-slate-100"
              >
                <div
                  className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                    act.type === 'pinjam'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {act.type === 'pinjam' ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownLeft className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 text-xs">
                  <div className="font-bold text-slate-800 leading-snug">{act.text}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{act.date}</div>
                </div>
                <span className="text-[11px] font-mono font-medium text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  {act.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Petunjuk Alur Petugas */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50/40 rounded-3xl p-6 border border-blue-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-blue-800 font-bold text-sm mb-2">
              <QrCode className="w-4 h-4 text-blue-600" />
              <span>Petunjuk Alur Cepat</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Sistem telah dioptimalkan agar Anda tidak perlu mengetik nama siswa atau kode buku secara manual.
            </p>

            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-blue-100/80 shadow-2xs">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                  1
                </span>
                <span><strong>Peminjaman:</strong> Buka menu Peminjaman &gt; Scan QR kartu siswa &gt; Scan QR/Barcode buku &gt; Simpan &amp; Cetak Bukti.</span>
              </div>
              <div className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-blue-100/80 shadow-2xs">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                  2
                </span>
                <span><strong>Pengembalian:</strong> Buka menu Pengembalian &gt; Scan QR siswa &gt; Scan buku &gt; Pilih kondisi buku &gt; Konfirmasi.</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-blue-200/50 flex justify-between items-center text-[11px] text-slate-500">
            <span>Dukungan: Kamera Web &amp; Barcode Scanner USB</span>
          </div>
        </div>
      </div>
    </div>
  );
};
