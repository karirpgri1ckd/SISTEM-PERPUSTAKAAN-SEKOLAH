import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Printer,
  Eye,
  Filter,
  UserCheck,
  CreditCard,
  BookOpen,
  FileDown,
  QrCode,
  Upload
} from 'lucide-react';
import { Member, Settings } from '../types';
import { memberService } from '../services/memberService';
import { pdfService } from '../services/pdfService';
import { db } from '../database/db';
import { Modal } from '../components/common/Modal';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';
import { Badge } from '../components/common/Badge';
import { Pagination } from '../components/common/Pagination';
import { PrintKartuAnggota } from '../components/print/PrintKartuAnggota';
import { QrCodeViewer } from '../components/common/QrCodeViewer';
import { ImportModal } from '../components/common/ImportModal';
import { ImageUploadCapture } from '../components/common/ImageUploadCapture';
import { useToast } from '../components/common/Toast';

interface AnggotaPageProps {
  settings: Settings;
}

export const AnggotaPage: React.FC<AnggotaPageProps> = ({ settings }) => {
  const [members, setMembers] = useState<Member[]>(() => memberService.getAll());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState<Partial<Member>>({});

  // Detail, QR & Print
  const [selectedMemberForDetail, setSelectedMemberForDetail] = useState<Member | null>(null);
  const [selectedMemberForQr, setSelectedMemberForQr] = useState<Member | null>(null);
  const [selectedMemberForCard, setSelectedMemberForCard] = useState<Member | null>(null);

  // Delete
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);

  const toast = useToast();

  const refreshData = () => {
    setMembers(memberService.getAll());
  };

  const handleExportAllCards = async () => {
    if (filteredMembers.length === 0) {
      toast.warning('Tidak ada data anggota untuk dicetak.');
      return;
    }
    toast.info('Sedang membuat file PDF kartu anggota...');
    await pdfService.exportBatchKartuAnggota(filteredMembers);
    toast.success(`Berhasil mencetak ${filteredMembers.length} kartu anggota ke PDF.`);
  };

  // Distinct classes list
  const classList = useMemo(() => {
    const set = new Set<string>();
    members.forEach(m => {
      if (m.kelas) set.add(m.kelas);
    });
    return Array.from(set).sort();
  }, [members]);

  const filteredMembers = useMemo(() => {
    return memberService.search(searchQuery, selectedClass);
  }, [members, searchQuery, selectedClass]);

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMembers.slice(start, start + itemsPerPage);
  }, [filteredMembers, currentPage, itemsPerPage]);

  const handleOpenAdd = () => {
    setEditingMember(null);
    setFormData({
      kode_anggota: db.generateNextMemberCode(),
      nis: '',
      nisn: '',
      nama: '',
      kelas: 'X IPA 1',
      jenis_kelamin: 'L',
      no_hp: '',
      alamat: '',
      foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      status: 'Aktif'
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (m: Member) => {
    setEditingMember(m);
    setFormData({ ...m });
    setIsFormOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama?.trim() || !formData.nis?.trim()) {
      toast.warning('Nama siswa dan NIS wajib diisi.');
      return;
    }

    const res = memberService.save({
      ...formData,
      id: editingMember ? editingMember.id : undefined
    });

    if (res.success) {
      toast.success(editingMember ? 'Data siswa berhasil diperbarui!' : 'Anggota siswa baru berhasil ditambahkan!');
      setIsFormOpen(false);
      refreshData();
    } else {
      toast.error(res.error || 'Gagal menyimpan anggota.');
    }
  };

  const handleDelete = () => {
    if (!memberToDelete) return;
    const res = memberService.delete(memberToDelete.id);
    if (res.success) {
      toast.success(`Anggota "${memberToDelete.nama}" berhasil dihapus.`);
      setMemberToDelete(null);
      refreshData();
    } else {
      toast.error(res.error || 'Gagal menghapus anggota.');
    }
  };

  const handleExportPdf = () => {
    const headers = ['No', 'Kode Anggota', 'Nama Siswa', 'NIS', 'NISN', 'Kelas', 'JK', 'No. HP', 'Status'];
    const data = filteredMembers.map((m, i) => [
      i + 1,
      m.kode_anggota,
      m.nama,
      m.nis,
      m.nisn || '-',
      m.kelas,
      m.jenis_kelamin,
      m.no_hp || '-',
      m.status
    ]);

    pdfService.exportTable({
      title: 'Daftar Anggota Siswa Perpustakaan',
      subtitle: `Total Terdaftar: ${filteredMembers.length} Siswa`,
      headers,
      data,
      filename: `daftar_anggota_${new Date().toISOString().split('T')[0]}`,
      orientation: 'landscape'
    });
    toast.success('Daftar anggota berhasil diekspor ke PDF.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </span>
            <span>Data Siswa &amp; Anggota Perpustakaan</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Kelola data siswa, kode anggota unik, cetak kartu ber-QR Code untuk peminjaman cepat
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsImportOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 transition-all cursor-pointer shadow-2xs"
            title="Import data siswa dari file Excel dan foto dari file ZIP"
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>Import Excel &amp; Foto</span>
          </button>
          <button
            onClick={handleExportAllCards}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-all cursor-pointer"
            title="Cetak Seluruh Kartu Anggota ke format lembar PDF"
          >
            <CreditCard className="w-4 h-4 text-indigo-600" />
            <span>Cetak Semua Kartu (PDF)</span>
          </button>
          <button
            onClick={handleExportPdf}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            title="Export Daftar Siswa ke PDF"
          >
            <FileDown className="w-4 h-4" />
            <span>Export Tabel PDF</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Anggota Baru</span>
          </button>
        </div>
      </div>

      {/* Search & Class Filter */}
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
            placeholder="Cari nama, NIS, NISN, kode anggota..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedClass}
              onChange={e => {
                setSelectedClass(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer text-xs"
            >
              <option value="all">Semua Kelas</option>
              {classList.map(k => (
                <option key={k} value={k}>
                  Kelas {k}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Member Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">Foto</th>
                <th className="py-3.5 px-4">Kode Anggota</th>
                <th className="py-3.5 px-4">NIS / NISN</th>
                <th className="py-3.5 px-4 min-w-[180px]">Nama Siswa</th>
                <th className="py-3.5 px-4">Kelas</th>
                <th className="py-3.5 px-4 text-center">L/P</th>
                <th className="py-3.5 px-4">No. HP</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedMembers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Tidak ada data anggota yang cocok.
                  </td>
                </tr>
              ) : (
                paginatedMembers.map(member => (
                  <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="w-9 h-11 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shadow-2xs mx-auto flex items-center justify-center">
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
                          <Users className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-blue-700 block">
                        {member.kode_anggota}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <span className="font-semibold text-slate-900 block">{member.nis}</span>
                      <span className="text-slate-400 text-[10px]">{member.nisn || '-'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{member.nama}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                        {member.kelas}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold">
                      <span className={member.jenis_kelamin === 'L' ? 'text-blue-600' : 'text-pink-600'}>
                        {member.jenis_kelamin}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                      {member.no_hp || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge status={member.status} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedMemberForQr(member)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Lihat QR Code Anggota"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedMemberForCard(member)}
                          className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Cetak Kartu Siswa"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedMemberForDetail(member)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Detail Anggota & Riwayat"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(member)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Data Siswa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setMemberToDelete(member)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Anggota"
                        >
                          <Trash2 className="w-4 h-4" />
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
          totalItems={filteredMembers.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* FORM MODAL (ADD / EDIT) */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingMember ? 'Edit Data Anggota Siswa' : 'Tambah Anggota Siswa Baru'}
        subtitle="Identitas siswa untuk pembuatan kartu perpustakaan"
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveForm} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Kode Anggota (Unik)
              </label>
              <input
                type="text"
                value={formData.kode_anggota || ''}
                onChange={e => setFormData({ ...formData, kode_anggota: e.target.value.toUpperCase() })}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-blue-700 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Status Keanggotaan
              </label>
              <select
                value={formData.status || 'Aktif'}
                onChange={e => setFormData({ ...formData, status: e.target.value as 'Aktif' | 'Tidak Aktif' })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                <option value="Aktif">Aktif</option>
                <option value="Tidak Aktif">Tidak Aktif</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                NIS (Nomor Induk Siswa)
              </label>
              <input
                type="text"
                value={formData.nis || ''}
                onChange={e => setFormData({ ...formData, nis: e.target.value })}
                required
                placeholder="Contoh: 10291"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                NISN (Nasional)
              </label>
              <input
                type="text"
                value={formData.nisn || ''}
                onChange={e => setFormData({ ...formData, nisn: e.target.value })}
                placeholder="10 digit NISN..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nama Lengkap Siswa
              </label>
              <input
                type="text"
                value={formData.nama || ''}
                onChange={e => setFormData({ ...formData, nama: e.target.value })}
                required
                placeholder="Nama lengkap..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Kelas
              </label>
              <input
                type="text"
                value={formData.kelas || ''}
                onChange={e => setFormData({ ...formData, kelas: e.target.value })}
                placeholder="Contoh: X IPA 1, VIII B, dll"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Jenis Kelamin
              </label>
              <select
                value={formData.jenis_kelamin || 'L'}
                onChange={e => setFormData({ ...formData, jenis_kelamin: e.target.value as 'L' | 'P' })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="L">Laki-laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nomor HP / WhatsApp
              </label>
              <input
                type="tel"
                value={formData.no_hp || ''}
                onChange={e => setFormData({ ...formData, no_hp: e.target.value })}
                placeholder="08123456789..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <ImageUploadCapture
                label="Foto Siswa / Anggota"
                value={formData.foto}
                onChange={val => setFormData({ ...formData, foto: val })}
                aspectRatio="square"
                placeholderType="member"
                helpText="Unggah berkas foto siswa (pasfoto) atau ambil foto langsung menggunakan kamera. Foto akan dicetak pada kartu anggota dan tampil di detail siswa."
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Alamat Rumah
              </label>
              <textarea
                value={formData.alamat || ''}
                onChange={e => setFormData({ ...formData, alamat: e.target.value })}
                rows={2}
                placeholder="Alamat domisili siswa..."
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
            >
              {editingMember ? 'Simpan Perubahan' : 'Tambah Anggota'}
            </button>
          </div>
        </form>
      </Modal>

      {/* DETAIL MODAL WITH QR & ACTIVE LOANS & HISTORY */}
      {selectedMemberForDetail && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedMemberForDetail(null)}
          title="Detail Anggota Siswa"
          subtitle={selectedMemberForDetail.kode_anggota}
          maxWidth="3xl"
        >
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="w-28 h-36 bg-slate-100 rounded-2xl overflow-hidden shrink-0 border border-slate-200 shadow-sm mx-auto sm:mx-0 flex items-center justify-center">
                {selectedMemberForDetail.foto && selectedMemberForDetail.foto.trim() !== '' ? (
                  <img
                    src={selectedMemberForDetail.foto}
                    alt={selectedMemberForDetail.nama}
                    className="w-full h-full object-cover"
                    onError={e => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <Users className="w-10 h-10 text-slate-400" />
                )}
              </div>

              <div className="flex-1 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">{selectedMemberForDetail.nama}</h3>
                  <Badge status={selectedMemberForDetail.status} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
                  <div>
                    <span className="text-slate-400 block">Kode Anggota:</span>
                    <span className="font-mono font-bold text-blue-700">{selectedMemberForDetail.kode_anggota}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">NIS / NISN:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {selectedMemberForDetail.nis} / {selectedMemberForDetail.nisn || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Kelas:</span>
                    <span className="font-semibold text-slate-800">{selectedMemberForDetail.kelas}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Jenis Kelamin:</span>
                    <span>{selectedMemberForDetail.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">No. Telepon:</span>
                    <span className="font-mono">{selectedMemberForDetail.no_hp || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Alamat:</span>
                    <span className="line-clamp-2">{selectedMemberForDetail.alamat || '-'}</span>
                  </div>
                </div>
              </div>

              {/* QR Code */}
              <div className="shrink-0 flex flex-col items-center justify-center p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <QrCodeViewer value={selectedMemberForDetail.qr_token || selectedMemberForDetail.kode_anggota} size={80} />
                <span className="text-[10px] font-mono text-slate-500 mt-1 font-bold">
                  {selectedMemberForDetail.kode_anggota}
                </span>
              </div>
            </div>

            {/* Buku Sedang Dipinjam */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>Buku yang Sedang Dipinjam Saat Ini</span>
              </h4>
              {(() => {
                const activeLoans = memberService.getActiveLoans(selectedMemberForDetail.id);
                if (activeLoans.length === 0) {
                  return <p className="text-xs text-slate-400 italic">Tidak ada buku yang sedang dipinjam.</p>;
                }
                return (
                  <div className="space-y-2 mt-2">
                    {activeLoans.map(item => (
                      <div
                        key={item.detailId}
                        className="flex items-center justify-between p-2.5 bg-white rounded-xl text-xs border border-slate-200"
                      >
                        <div>
                          <div className="font-bold text-slate-800">{item.buku.judul}</div>
                          <div className="text-[11px] text-slate-500">
                            Jatuh tempo: {item.tanggalJatuhTempo}
                          </div>
                        </div>
                        {item.isTerlambat ? (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            Terlambat {item.hariTerlambat} hari
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Aktif Dipinjam
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Riwayat Seluruh Peminjaman */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Riwayat Transaksi Peminjaman
              </h4>
              {(() => {
                const history = memberService.getLoanHistory(selectedMemberForDetail.id);
                if (history.length === 0) {
                  return <p className="text-xs text-slate-400 italic">Belum ada riwayat transaksi.</p>;
                }
                return (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {history.map(tx => (
                      <div
                        key={tx.id}
                        className="p-2.5 bg-slate-50 rounded-xl text-xs border border-slate-100 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold font-mono text-slate-900">{tx.kode_transaksi}</div>
                          <div className="text-[11px] text-slate-500">
                            {tx.tanggal_pinjam} • {tx.items.length} Buku: {tx.items.map(i => i.buku?.judul).join(', ')}
                          </div>
                        </div>
                        <Badge status={tx.status} size="sm" />
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  pdfService.exportKartuAnggota(selectedMemberForDetail);
                  toast.success('Kartu anggota berhasil diunduh (PDF).');
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                <span>Unduh Kartu PDF</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedMemberForCard(selectedMemberForDetail);
                  setSelectedMemberForDetail(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>Cetak Kartu Siswa</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* LIHAT QR MODAL */}
      {selectedMemberForQr && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedMemberForQr(null)}
          title="QR Code Kartu Siswa"
          subtitle={selectedMemberForQr.nama}
          maxWidth="sm"
        >
          <div className="flex flex-col items-center text-center p-2 space-y-4">
            <div className="p-4 bg-white rounded-2xl border-2 border-blue-200 shadow-sm flex flex-col items-center">
              <QrCodeViewer value={selectedMemberForQr.qr_token || selectedMemberForQr.kode_anggota} size={180} />
              <span className="font-mono font-extrabold text-sm text-blue-700 mt-2 block">
                {selectedMemberForQr.kode_anggota}
              </span>
            </div>

            <div className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5 text-left">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Siswa:</span>
                <span className="font-bold text-slate-800">{selectedMemberForQr.nama}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">NIS:</span>
                <span className="font-semibold text-slate-800">{selectedMemberForQr.nis}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kelas:</span>
                <span className="font-semibold text-slate-800">{selectedMemberForQr.kelas}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <Badge status={selectedMemberForQr.status} size="sm" />
              </div>
            </div>

            <div className="w-full flex gap-2 pt-2">
              <button
                onClick={() => {
                  const m = selectedMemberForQr;
                  setSelectedMemberForQr(null);
                  setSelectedMemberForCard(m);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>Cetak Kartu</span>
              </button>
              <button
                onClick={() => {
                  pdfService.exportKartuAnggota(selectedMemberForQr);
                  toast.success('Kartu anggota berhasil diunduh (PDF).');
                }}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                <span>PDF</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* PRINT KARTU MODAL */}
      {selectedMemberForCard && (
        <PrintKartuAnggota
          member={selectedMemberForCard}
          settings={settings}
          onClose={() => setSelectedMemberForCard(null)}
        />
      )}

      {/* DELETE CONFIRMATION */}
      <ConfirmationDialog
        isOpen={!!memberToDelete}
        onClose={() => setMemberToDelete(null)}
        onConfirm={handleDelete}
        title="Hapus Data Anggota Siswa"
        message={`Apakah Anda yakin ingin menghapus anggota ${memberToDelete?.nama} (${memberToDelete?.kode_anggota})? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
      />

      {/* IMPORT EXCEL & ZIP MODAL */}
      <ImportModal
        isOpen={isImportOpen}
        type="anggota"
        onClose={() => setIsImportOpen(false)}
        onSuccess={() => {
          refreshData();
          toast.success('Data siswa dan foto berhasil diimport!');
        }}
      />
    </div>
  );
};
