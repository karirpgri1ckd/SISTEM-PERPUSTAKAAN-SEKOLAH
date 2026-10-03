import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  Edit2,
  Trash2,
  Printer,
  Eye,
  Filter,
  Layers,
  Sparkles,
  QrCode,
  FileDown,
  FileText,
  Upload
} from 'lucide-react';
import { Book, Category, Settings } from '../types';
import { bookService } from '../services/bookService';
import { pdfService } from '../services/pdfService';
import { db } from '../database/db';
import { Modal } from '../components/common/Modal';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';
import { Badge } from '../components/common/Badge';
import { Pagination } from '../components/common/Pagination';
import { PrintLabelBuku } from '../components/print/PrintLabelBuku';
import { QrCodeViewer } from '../components/common/QrCodeViewer';
import { BookCover } from '../components/common/BookCover';
import { ImportModal } from '../components/common/ImportModal';
import { ImageUploadCapture } from '../components/common/ImageUploadCapture';
import { useToast } from '../components/common/Toast';

interface BukuPageProps {
  settings: Settings;
}

export const BukuPage: React.FC<BukuPageProps> = ({ settings }) => {
  const [books, setBooks] = useState<Book[]>(() => bookService.getAll());
  const [categories, setCategories] = useState<Category[]>(() => db.getCategories());

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Form modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [formData, setFormData] = useState<Partial<Book>>({});

  // Detail modal
  const [selectedBookForDetail, setSelectedBookForDetail] = useState<Book | null>(null);
  const [selectedBookForQr, setSelectedBookForQr] = useState<Book | null>(null);

  // Label print modal
  const [selectedBookForLabel, setSelectedBookForLabel] = useState<Book | null>(null);

  // Delete dialog
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);

  const toast = useToast();

  const refreshData = () => {
    setBooks(bookService.getAll());
    setCategories(db.getCategories());
  };

  const handleExportAllLabels = async () => {
    if (filteredBooks.length === 0) {
      toast.warning('Tidak ada data buku untuk dicetak.');
      return;
    }
    toast.info('Sedang membuat file PDF label buku...');
    await pdfService.exportBatchLabels(filteredBooks);
    toast.success(`Berhasil mencetak ${filteredBooks.length} label buku ke PDF.`);
  };

  const filteredBooks = useMemo(() => {
    return bookService.search(searchQuery, selectedCategory, selectedStatus);
  }, [books, searchQuery, selectedCategory, selectedStatus]);

  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);
  const paginatedBooks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBooks.slice(start, start + itemsPerPage);
  }, [filteredBooks, currentPage, itemsPerPage]);

  const handleOpenAdd = () => {
    setEditingBook(null);
    setFormData({
      kode_buku: db.generateNextBookCode(),
      isbn: '',
      judul: '',
      penulis: '',
      penerbit: '',
      tahun: new Date().getFullYear(),
      kategori_id: categories[0]?.id || 'cat-1',
      rak: 'R-01-A',
      stok: 1,
      cover: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&auto=format&fit=crop&q=80',
      deskripsi: '',
      status: 'Tersedia'
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (b: Book) => {
    setEditingBook(b);
    setFormData({ ...b });
    setIsFormOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.judul?.trim()) {
      toast.warning('Judul buku wajib diisi');
      return;
    }

    const res = bookService.save({
      ...formData,
      id: editingBook ? editingBook.id : undefined
    });

    if (res.success) {
      toast.success(editingBook ? 'Data buku berhasil diperbarui!' : 'Buku baru berhasil ditambahkan!');
      setIsFormOpen(false);
      refreshData();
    } else {
      toast.error(res.error || 'Gagal menyimpan buku.');
    }
  };

  const handleDelete = () => {
    if (!bookToDelete) return;
    const res = bookService.delete(bookToDelete.id);
    if (res.success) {
      toast.success(`Buku "${bookToDelete.judul}" berhasil dihapus.`);
      setBookToDelete(null);
      refreshData();
    } else {
      toast.error(res.error || 'Gagal menghapus buku.');
    }
  };

  const getCategoryName = (catId: string) => {
    return categories.find(c => c.id === catId)?.nama || '-';
  };

  const handleExportPdf = () => {
    const headers = ['No', 'Kode Buku', 'ISBN', 'Judul Buku', 'Penulis', 'Penerbit', 'Tahun', 'Kategori', 'Rak', 'Stok', 'Status'];
    const data = filteredBooks.map((b, i) => [
      i + 1,
      b.kode_buku,
      b.isbn || '-',
      b.judul,
      b.penulis,
      b.penerbit,
      b.tahun,
      getCategoryName(b.kategori_id),
      b.rak,
      b.stok,
      b.status
    ]);

    pdfService.exportTable({
      title: 'Katalog Koleksi Buku Perpustakaan',
      subtitle: `Total Koleksi Terfilter: ${filteredBooks.length} Buku`,
      headers,
      data,
      filename: `katalog_buku_${new Date().toISOString().split('T')[0]}`,
      orientation: 'landscape'
    });
    toast.success('Katalog buku berhasil diekspor ke PDF.');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </span>
            <span>Katalog &amp; Data Buku Perpustakaan</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Kelola data koleksi buku, nomor rak, stok tersedia, dan cetak label barcode
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsImportOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 transition-all cursor-pointer shadow-2xs"
            title="Import data koleksi buku dari file Excel dan cover dari file ZIP"
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>Import Excel &amp; Foto</span>
          </button>
          <button
            onClick={handleExportAllLabels}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-all cursor-pointer"
            title="Cetak Seluruh Label Buku ke format lembar PDF"
          >
            <Printer className="w-4 h-4 text-indigo-600" />
            <span>Cetak Semua Label (PDF)</span>
          </button>
          <button
            onClick={handleExportPdf}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            title="Export Daftar Buku ke PDF"
          >
            <FileDown className="w-4 h-4" />
            <span>Export Tabel PDF</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Buku Baru</span>
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
            placeholder="Cari judul, ISBN, kode, penulis..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={e => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer text-xs"
            >
              <option value="all">Semua Kategori</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <select
              value={selectedStatus}
              onChange={e => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer text-xs"
            >
              <option value="all">Semua Status</option>
              <option value="Tersedia">Tersedia</option>
              <option value="Dipinjam">Dipinjam</option>
              <option value="Perbaikan">Perbaikan</option>
              <option value="Hilang">Hilang</option>
            </select>
          </div>
        </div>
      </div>

      {/* Books Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4 w-16">Cover</th>
                <th className="py-3.5 px-4">Kode / ISBN</th>
                <th className="py-3.5 px-4 min-w-[200px]">Judul Buku</th>
                <th className="py-3.5 px-4">Penulis &amp; Penerbit</th>
                <th className="py-3.5 px-4">Kategori &amp; Rak</th>
                <th className="py-3.5 px-4 text-center">Stok</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedBooks.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Tidak ada buku yang sesuai dengan pencarian.
                  </td>
                </tr>
              ) : (
                paginatedBooks.map((book, index) => {
                  const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;
                  return (
                    <tr key={book.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-center font-semibold text-slate-400">
                        {rowNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-10 h-14 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shadow-2xs">
                          <BookCover
                            src={book.cover}
                            title={book.judul}
                            className="w-full h-full"
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-blue-700 block">
                          {book.kode_buku}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {book.isbn || 'ISBN: -'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 line-clamp-1">{book.judul}</div>
                        <div className="text-[11px] text-slate-500">Tahun: {book.tahun}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 line-clamp-1">{book.penulis}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">{book.penerbit}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">
                          {getCategoryName(book.kategori_id)}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded inline-block mt-0.5 border border-slate-200">
                          {book.rak}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-extrabold text-sm text-slate-900">{book.stok}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge status={book.status} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedBookForQr(book)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Lihat QR Code Buku"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSelectedBookForLabel(book)}
                            className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Cetak Label Buku"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSelectedBookForDetail(book)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Detail Buku & Riwayat"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(book)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Data Buku"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setBookToDelete(book)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Buku"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredBooks.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* FORM MODAL (ADD / EDIT) */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingBook ? 'Edit Data Buku' : 'Tambah Buku Baru'}
        subtitle="Lengkapi informasi buku koleksi perpustakaan"
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveForm} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Kode Buku (Unik)
              </label>
              <input
                type="text"
                value={formData.kode_buku || ''}
                onChange={e => setFormData({ ...formData, kode_buku: e.target.value.toUpperCase() })}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-blue-700 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                ISBN
              </label>
              <input
                type="text"
                value={formData.isbn || ''}
                onChange={e => setFormData({ ...formData, isbn: e.target.value })}
                placeholder="978-602-..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Judul Buku
              </label>
              <input
                type="text"
                value={formData.judul || ''}
                onChange={e => setFormData({ ...formData, judul: e.target.value })}
                required
                placeholder="Masukkan judul buku..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Penulis / Pengarang
              </label>
              <input
                type="text"
                value={formData.penulis || ''}
                onChange={e => setFormData({ ...formData, penulis: e.target.value })}
                required
                placeholder="Nama penulis..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Penerbit
              </label>
              <input
                type="text"
                value={formData.penerbit || ''}
                onChange={e => setFormData({ ...formData, penerbit: e.target.value })}
                placeholder="Nama penerbit..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tahun Terbit
              </label>
              <input
                type="number"
                value={formData.tahun || 2024}
                onChange={e => setFormData({ ...formData, tahun: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Kategori
              </label>
              <select
                value={formData.kategori_id || ''}
                onChange={e => setFormData({ ...formData, kategori_id: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nama}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Lokasi Rak
              </label>
              <input
                type="text"
                value={formData.rak || ''}
                onChange={e => setFormData({ ...formData, rak: e.target.value.toUpperCase() })}
                placeholder="Contoh: R-01-A"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs uppercase font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Jumlah Stok
              </label>
              <input
                type="number"
                min="0"
                value={formData.stok ?? 1}
                onChange={e => setFormData({ ...formData, stok: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <ImageUploadCapture
                label="Cover Buku"
                value={formData.cover}
                onChange={val => setFormData({ ...formData, cover: val })}
                aspectRatio="portrait"
                placeholderType="book"
                helpText="Unggah berkas sampul buku atau jepret langsung fisik buku menggunakan kamera perangkat/webcam. Foto ini akan muncul di katalog dan label buku."
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Deskripsi / Sinopsis
              </label>
              <textarea
                value={formData.deskripsi || ''}
                onChange={e => setFormData({ ...formData, deskripsi: e.target.value })}
                rows={3}
                placeholder="Ringkasan atau sinopsis buku..."
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
              {editingBook ? 'Simpan Perubahan' : 'Tambah Buku'}
            </button>
          </div>
        </form>
      </Modal>

      {/* DETAIL MODAL WITH QR & BORROW HISTORY */}
      {selectedBookForDetail && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedBookForDetail(null)}
          title="Detail Koleksi Buku"
          subtitle={selectedBookForDetail.kode_buku}
          maxWidth="2xl"
        >
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="w-32 h-44 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200 shadow-sm mx-auto sm:mx-0">
                <BookCover
                  src={selectedBookForDetail.cover}
                  title={selectedBookForDetail.judul}
                  className="w-full h-full"
                />
              </div>

              <div className="flex-1 space-y-2 text-xs">
                <h3 className="text-lg font-bold text-slate-900">{selectedBookForDetail.judul}</h3>
                <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
                  <div>
                    <span className="text-slate-400 block">Kode Buku:</span>
                    <span className="font-mono font-bold text-blue-700">{selectedBookForDetail.kode_buku}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">ISBN:</span>
                    <span className="font-mono">{selectedBookForDetail.isbn || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Penulis:</span>
                    <span className="font-semibold text-slate-800">{selectedBookForDetail.penulis}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Penerbit:</span>
                    <span>{selectedBookForDetail.penerbit} ({selectedBookForDetail.tahun})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Kategori:</span>
                    <span>{getCategoryName(selectedBookForDetail.kategori_id)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Lokasi Rak:</span>
                    <span className="font-bold text-slate-800">{selectedBookForDetail.rak}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Stok Tersedia:</span>
                    <span className="font-bold text-emerald-700 text-sm">{selectedBookForDetail.stok} eksemplar</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Status:</span>
                    <Badge status={selectedBookForDetail.status} />
                  </div>
                </div>
              </div>

              {/* QR Code */}
              <div className="shrink-0 flex flex-col items-center justify-center p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <QrCodeViewer value={selectedBookForDetail.qr_token || selectedBookForDetail.kode_buku} size={90} />
                <span className="text-[10px] font-mono text-slate-500 mt-1 font-bold">
                  {selectedBookForDetail.kode_buku}
                </span>
              </div>
            </div>

            {selectedBookForDetail.deskripsi && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 text-xs">
                <span className="font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Sinopsis / Deskripsi:
                </span>
                <p className="text-slate-600 leading-relaxed">{selectedBookForDetail.deskripsi}</p>
              </div>
            )}

            {/* Riwayat Peminjaman Buku ini */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Riwayat Peminjaman Buku Ini
              </h4>
              {(() => {
                const history = bookService.getBorrowHistory(selectedBookForDetail.id);
                if (history.length === 0) {
                  return <p className="text-xs text-slate-400 italic">Belum ada riwayat peminjaman untuk buku ini.</p>;
                }
                return (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {history.map((h, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs border border-slate-100"
                      >
                        <div>
                          <div className="font-bold text-slate-800">{h.anggota?.nama || 'Siswa'}</div>
                          <div className="text-[10px] text-slate-500">
                            Kelas: {h.anggota?.kelas} • Tgl Pinjam: {h.transaksi?.tanggal_pinjam}
                          </div>
                        </div>
                        <Badge status={h.detail.status} size="sm" />
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
                  pdfService.exportLabelBuku(selectedBookForDetail);
                  toast.success('Label buku berhasil diunduh (PDF).');
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                <span>Unduh Label PDF</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedBookForLabel(selectedBookForDetail);
                  setSelectedBookForDetail(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Label Buku</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* LIHAT QR BUKU MODAL */}
      {selectedBookForQr && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedBookForQr(null)}
          title="QR Code & Label Buku"
          subtitle={selectedBookForQr.judul}
          maxWidth="sm"
        >
          <div className="flex flex-col items-center text-center p-2 space-y-4">
            <div className="p-4 bg-white rounded-2xl border-2 border-blue-200 shadow-sm flex flex-col items-center">
              <QrCodeViewer value={selectedBookForQr.qr_token || selectedBookForQr.kode_buku} size={180} />
              <span className="font-mono font-extrabold text-sm text-blue-700 mt-2 block">
                {selectedBookForQr.kode_buku}
              </span>
            </div>

            <div className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5 text-left">
              <div className="flex justify-between">
                <span className="text-slate-500">Judul Buku:</span>
                <span className="font-bold text-slate-800 line-clamp-1 flex-1 text-right ml-2">{selectedBookForQr.judul}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Penulis:</span>
                <span className="font-semibold text-slate-800">{selectedBookForQr.penulis}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Lokasi Rak:</span>
                <span className="font-mono font-bold text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">{selectedBookForQr.rak}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Stok di Rak:</span>
                <span className="font-bold text-slate-800">{selectedBookForQr.stok} Eksemplar</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <Badge status={selectedBookForQr.status} size="sm" />
              </div>
            </div>

            <div className="w-full flex gap-2 pt-2">
              <button
                onClick={() => {
                  const b = selectedBookForQr;
                  setSelectedBookForQr(null);
                  setSelectedBookForLabel(b);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Label</span>
              </button>
              <button
                onClick={() => {
                  pdfService.exportLabelBuku(selectedBookForQr);
                  toast.success('Label buku berhasil diunduh (PDF).');
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

      {/* PRINT LABEL MODAL */}
      {selectedBookForLabel && (
        <PrintLabelBuku
          book={selectedBookForLabel}
          settings={settings}
          onClose={() => setSelectedBookForLabel(null)}
        />
      )}

      {/* DELETE CONFIRMATION */}
      <ConfirmationDialog
        isOpen={!!bookToDelete}
        onClose={() => setBookToDelete(null)}
        onConfirm={handleDelete}
        title="Hapus Koleksi Buku"
        message={`Apakah Anda yakin ingin menghapus buku "${bookToDelete?.judul}" (${bookToDelete?.kode_buku})? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
      />

      {/* IMPORT EXCEL & ZIP MODAL */}
      <ImportModal
        isOpen={isImportOpen}
        type="buku"
        onClose={() => setIsImportOpen(false)}
        onSuccess={() => {
          refreshData();
          toast.success('Data buku dan cover berhasil diimport!');
        }}
      />
    </div>
  );
};
