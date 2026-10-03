import React, { useState } from 'react';
import { BookOpen, Lock, User, ArrowRight } from 'lucide-react';
import { authService } from '../services/authService';
import { Settings, User as UserType } from '../types';
import { useToast } from '../components/common/Toast';

interface LoginPageProps {
  settings: Settings;
  onLoginSuccess: (user: UserType) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ settings, onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.warning('Silakan isi username dan password');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.login(username, password);
      if (res.success && res.user) {
        toast.success(`Selamat datang kembali, ${res.user.nama}!`);
        onLoginSuccess(res.user);
      } else {
        toast.error(res.error || 'Login gagal.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-indigo-950 flex items-center justify-center p-4">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 right-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 sm:p-10 border border-slate-100">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4 overflow-hidden">
            {settings.logo && settings.logo.trim() !== '' ? (
              <img
                src={settings.logo}
                alt="Logo Sekolah"
                className="w-full h-full object-cover"
                onError={e => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <BookOpen className="w-8 h-8 text-white" />
            )}
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {settings.nama_sekolah}
          </h1>
          <p className="text-sm font-semibold text-blue-600 mt-1">
            {settings.nama_perpustakaan}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Sistem Informasi Manajemen Perpustakaan Sekolah
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Masukkan username"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Masukkan password"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span>Memverifikasi...</span>
            ) : (
              <>
                <span>Masuk ke Sistem</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Login Security Info */}
        <div className="mt-8 pt-5 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500 font-medium">
            Silakan masuk menggunakan akun petugas perpustakaan yang terdaftar.
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            Default Admin: <span className="font-semibold text-slate-600">admin</span> / <span className="font-semibold text-slate-600">admin</span>
          </p>
        </div>
      </div>
    </div>
  );
};
