import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  RotateCcw,
  Download,
  Upload,
  AlertTriangle,
  Building,
  Sliders,
  Database
} from 'lucide-react';
import { Settings } from '../types';
import { db } from '../database/db';
import { useToast } from '../components/common/Toast';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';
import { ImageUploadCapture } from '../components/common/ImageUploadCapture';

interface PengaturanPageProps {
  settings: Settings;
  onUpdateSettings: (newSettings: Settings) => void;
}

export const PengaturanPage: React.FC<PengaturanPageProps> = ({
  settings,
  onUpdateSettings
}) => {
  const [formData, setFormData] = useState<Settings>({ ...settings });
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const toast = useToast();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    db.saveSettings(formData);
    onUpdateSettings(formData);
    toast.success('Pengaturan sistem perpustakaan berhasil diperbarui!');
  };

  const handleExportBackup = () => {
    const jsonStr = db.exportDatabaseJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `backup_perpustakaan_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('File cadangan database berhasil diunduh.');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const content = evt.target?.result as string;
      const success = db.importDatabaseJson(content);
      if (success) {
        toast.success('Database berhasil dipulihkan dari cadangan!');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error('Format berkas cadangan JSON tidak valid.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetDatabase = async () => {
    await db.initDatabase(true);
    toast.success('Database berhasil dikosongkan ke kondisi awal!');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <SettingsIcon className="w-4 h-4" />
          </span>
          <span>Pengaturan Sistem Perpustakaan</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Konfigurasi identitas instansi sekolah, batas aturan peminjaman, serta manajemen cadangan data
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Identitas Sekolah */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building className="w-5 h-5 text-blue-600" />
            <span>Identitas Sekolah &amp; Perpustakaan</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nama Sekolah
              </label>
              <input
                type="text"
                value={formData.nama_sekolah}
                onChange={e => setFormData({ ...formData, nama_sekolah: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nama Perpustakaan
              </label>
              <input
                type="text"
                value={formData.nama_perpustakaan}
                onChange={e => setFormData({ ...formData, nama_perpustakaan: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nomor Telepon
              </label>
              <input
                type="text"
                value={formData.telepon}
                onChange={e => setFormData({ ...formData, telepon: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Perpustakaan
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Alamat Lengkap Sekolah
              </label>
              <input
                type="text"
                value={formData.alamat}
                onChange={e => setFormData({ ...formData, alamat: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <ImageUploadCapture
                label="Logo Sekolah / Perpustakaan"
                value={formData.logo}
                onChange={val => setFormData({ ...formData, logo: val })}
                aspectRatio="square"
                placeholderType="logo"
                helpText="Unggah file foto logo sekolah atau foto langsung dari kamera. Logo ini akan otomatis dicetak pada kartu anggota siswa, label barcode buku, dan struk bukti peminjaman/pengembalian."
              />
            </div>
          </div>
        </div>

        {/* Pengaturan Peminjaman & Denda */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sliders className="w-5 h-5 text-indigo-600" />
            <span>Ketentuan Sirkulasi &amp; Peminjaman</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Maksimal Buku Dipinjam
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.maksimal_peminjaman}
                  onChange={e =>
                    setFormData({ ...formData, maksimal_peminjaman: parseInt(e.target.value, 10) || 1 })
                  }
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-semibold">
                  buku
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Batas maksimal per siswa</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Durasi Lama Peminjaman
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={formData.lama_peminjaman}
                  onChange={e =>
                    setFormData({ ...formData, lama_peminjaman: parseInt(e.target.value, 10) || 1 })
                  }
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-semibold">
                  hari
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Masa pinjam sebelum jatuh tempo</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Denda Keterlambatan
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs text-slate-500 font-bold">
                  Rp
                </span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={formData.denda_per_hari}
                  onChange={e =>
                    setFormData({ ...formData, denda_per_hari: parseInt(e.target.value, 10) || 0 })
                  }
                  required
                  className="w-full pl-10 pr-12 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute right-3.5 top-2.5 text-[11px] text-slate-400">
                  /hari
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Dihitung per buku per hari</p>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Perubahan Pengaturan</span>
          </button>
        </div>
      </form>

      {/* Database Management & Backup */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2 pb-3 border-b border-slate-100">
          <Database className="w-5 h-5 text-emerald-600" />
          <span>Cadangan &amp; Pemulihan Data (Backup &amp; Restore)</span>
        </h3>

        <p className="text-xs text-slate-600 leading-relaxed">
          Simpan seluruh database perpustakaan (buku, anggota, transaksi, kategori, pengaturan) ke berkas JSON lokal untuk keamanan atau cadangan berkala.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleExportBackup}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Cadangan JSON</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-slate-200">
            <Upload className="w-4 h-4" />
            <span>Pulihkan dari File JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-rose-200 ml-auto"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Kosongkan Database (Mulai Baru)</span>
          </button>
        </div>
      </div>

      {/* CONFIRMATION RESET */}
      <ConfirmationDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetDatabase}
        title="Kosongkan Seluruh Data Database"
        message="Tindakan ini akan mengosongkan seluruh riwayat transaksi, koleksi buku, dan anggota kembali ke kondisi awal baru. Akun administrator default akan tetap tersimpan. Apakah Anda yakin?"
        confirmLabel="Ya, Kosongkan Data"
        cancelLabel="Batal"
        variant="danger"
      />
    </div>
  );
};
