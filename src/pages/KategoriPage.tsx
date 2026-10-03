import React, { useState } from 'react';
import { Tags, Plus, Edit2, Trash2, BookOpen } from 'lucide-react';
import { Category } from '../types';
import { db } from '../database/db';
import { Modal } from '../components/common/Modal';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';
import { useToast } from '../components/common/Toast';

export const KategoriPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>(() => db.getCategories());
  const [books, setBooks] = useState(() => db.getBooks());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [namaKategori, setNamaKategori] = useState('');

  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const toast = useToast();

  const refreshData = () => {
    setCategories(db.getCategories());
    setBooks(db.getBooks());
  };

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setNamaKategori('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setNamaKategori(cat.nama);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaKategori.trim()) {
      toast.warning('Nama kategori tidak boleh kosong.');
      return;
    }

    const newCat: Category = {
      id: editingCategory ? editingCategory.id : `cat-${Date.now()}`,
      nama: namaKategori.trim(),
      created_at: editingCategory ? editingCategory.created_at : new Date().toISOString()
    };

    db.saveCategory(newCat);
    toast.success(editingCategory ? 'Kategori berhasil diperbarui!' : 'Kategori baru berhasil ditambahkan!');
    setIsModalOpen(false);
    refreshData();
  };

  const handleDelete = () => {
    if (!categoryToDelete) return;

    // Check if books are using this category
    const usedCount = books.filter(b => b.kategori_id === categoryToDelete.id).length;
    if (usedCount > 0) {
      toast.error(`Tidak dapat menghapus kategori ini karena sedang digunakan oleh ${usedCount} buku.`);
      setCategoryToDelete(null);
      return;
    }

    db.deleteCategory(categoryToDelete.id);
    toast.success(`Kategori "${categoryToDelete.nama}" berhasil dihapus.`);
    setCategoryToDelete(null);
    refreshData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Tags className="w-4 h-4" />
            </span>
            <span>Klasifikasi &amp; Kategori Buku</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Kelola kategori rak dan klasifikasi tema koleksi buku sekolah
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kategori</span>
        </button>
      </div>

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map(cat => {
          const bookCount = books.filter(b => b.kategori_id === cat.id).length;

          return (
            <div
              key={cat.id}
              className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl mb-3">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(cat)}
                      className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                      title="Edit Kategori"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCategoryToDelete(cat)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Hapus Kategori"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-extrabold text-slate-800 text-base leading-snug">
                  {cat.nama}
                </h3>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Jumlah Koleksi:</span>
                <span className="font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                  {bookCount} Judul
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL ADD / EDIT */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
        subtitle="Nama klasifikasi kategori buku perpustakaan"
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nama Kategori
            </label>
            <input
              type="text"
              value={namaKategori}
              onChange={e => setNamaKategori(e.target.value)}
              placeholder="Contoh: Sains & Teknologi, Komik, dll..."
              autoFocus
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
            >
              Simpan Kategori
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION */}
      <ConfirmationDialog
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleDelete}
        title="Hapus Kategori Buku"
        message={`Apakah Anda yakin ingin menghapus kategori "${categoryToDelete?.nama}"?`}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
      />
    </div>
  );
};
