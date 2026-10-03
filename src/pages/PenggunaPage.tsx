import React, { useState } from 'react';
import {
  UserCog,
  Plus,
  Edit2,
  Trash2,
  ShieldCheck,
  UserCheck,
  Lock,
  User as UserIcon
} from 'lucide-react';
import { User, Role, UserStatus } from '../types';
import { db } from '../database/db';
import { hashPassword } from '../utils/crypto';
import { Modal } from '../components/common/Modal';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';
import { Badge } from '../components/common/Badge';
import { useToast } from '../components/common/Toast';

interface PenggunaPageProps {
  currentUserId: string;
}

export const PenggunaPage: React.FC<PenggunaPageProps> = ({ currentUserId }) => {
  const [users, setUsers] = useState<User[]>(() => db.getUsers());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState<{
    nama: string;
    username: string;
    password?: string;
    role: Role;
    status: UserStatus;
  }>({
    nama: '',
    username: '',
    password: '',
    role: 'PETUGAS',
    status: 'Aktif'
  });

  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const toast = useToast();

  const refreshData = () => {
    setUsers(db.getUsers());
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      nama: '',
      username: '',
      password: '',
      role: 'PETUGAS',
      status: 'Aktif'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setFormData({
      nama: u.nama,
      username: u.username,
      password: '', // Leave blank if not changing
      role: u.role,
      status: u.status
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim() || !formData.username.trim()) {
      toast.warning('Nama dan username wajib diisi.');
      return;
    }

    if (!editingUser && !formData.password) {
      toast.warning('Password baru wajib diisi untuk pengguna baru.');
      return;
    }

    // Check duplicate username
    const existing = users.find(
      u => u.username.toLowerCase() === formData.username.trim().toLowerCase() && u.id !== editingUser?.id
    );
    if (existing) {
      toast.error(`Username "${formData.username}" sudah digunakan.`);
      return;
    }

    let hashedPassword = editingUser?.password || '';
    if (formData.password && formData.password.trim()) {
      hashedPassword = await hashPassword(formData.password.trim());
    }

    const updatedUser: User = {
      id: editingUser ? editingUser.id : `usr-${Date.now()}`,
      nama: formData.nama.trim(),
      username: formData.username.trim().toLowerCase(),
      password: hashedPassword,
      role: formData.role,
      status: formData.status,
      created_at: editingUser ? editingUser.created_at : new Date().toISOString()
    };

    db.saveUser(updatedUser);
    toast.success(editingUser ? 'Data pengguna berhasil diperbarui!' : 'Pengguna baru berhasil ditambahkan!');
    setIsModalOpen(false);
    refreshData();
  };

  const handleDelete = () => {
    if (!userToDelete) return;

    if (userToDelete.id === currentUserId) {
      toast.error('Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif digunakan.');
      setUserToDelete(null);
      return;
    }

    db.deleteUser(userToDelete.id);
    toast.success(`Pengguna ${userToDelete.nama} berhasil dihapus.`);
    setUserToDelete(null);
    refreshData();
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <UserCog className="w-4 h-4" />
            </span>
            <span>Pengguna &amp; Hak Akses Sistem</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Kelola petugas perpustakaan dan administrator dengan enkripsi sandi aman (SHA-256)
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pengguna Baru</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Nama Lengkap</th>
                <th className="py-3.5 px-4">Username</th>
                <th className="py-3.5 px-4">Role Akses</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {users.map((u, i) => (
                <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 text-center font-semibold text-slate-400">
                    {i + 1}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <span>{u.nama}</span>
                      {u.id === currentUserId && (
                        <span className="text-[10px] bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                          Anda
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-600">
                    @{u.username}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 font-bold">
                      {u.role === 'ADMIN' ? (
                        <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <UserCheck className="w-4 h-4 text-blue-600" />
                      )}
                      <span>{u.role}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Badge status={u.status} />
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Pengguna"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {u.id !== currentUserId && (
                        <button
                          onClick={() => setUserToDelete(u)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Pengguna"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Edit Pengguna Sistem' : 'Tambah Pengguna Sistem'}
        subtitle="Akun petugas perpustakaan atau administrator"
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              value={formData.nama}
              onChange={e => setFormData({ ...formData, nama: e.target.value })}
              required
              placeholder="Contoh: Sri Wahyuni, A.Md"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Username
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
              required
              placeholder="username (huruf kecil)..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {editingUser ? 'Password Baru (Kosongkan jika tidak diubah)' : 'Password'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              placeholder={editingUser ? '••••••••' : 'Password aman minimal 6 karakter...'}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Hak Akses (Role)
              </label>
              <select
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value as Role })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="PETUGAS">PETUGAS</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Status Akun
              </label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as UserStatus })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Aktif">Aktif</option>
                <option value="Tidak Aktif">Tidak Aktif</option>
              </select>
            </div>
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
              Simpan Pengguna
            </button>
          </div>
        </form>
      </Modal>

      {/* CONFIRMATION DELETE */}
      <ConfirmationDialog
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDelete}
        title="Hapus Akun Pengguna"
        message={`Apakah Anda yakin ingin menghapus akun ${userToDelete?.nama} (@${userToDelete?.username})?`}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
      />
    </div>
  );
};
