import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
  BarChart3,
  Tags,
  Settings,
  UserCog,
  LogOut,
  X
} from 'lucide-react';
import { User, Settings as SettingsType } from '../../types';

export type NavTab =
  | 'dashboard'
  | 'buku'
  | 'anggota'
  | 'peminjaman'
  | 'pengembalian'
  | 'transaksi'
  | 'laporan'
  | 'kategori'
  | 'pengaturan'
  | 'pengguna';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentUser: User | null;
  settings: SettingsType;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  settings,
  isOpen,
  onClose,
  onLogout
}) => {
  const isAdmin = currentUser?.role === 'ADMIN';

  const navItems: {
    id: NavTab;
    label: string;
    icon: React.ReactNode;
    adminOnly?: boolean;
    badge?: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />
    },
    {
      id: 'peminjaman',
      label: 'Peminjaman',
      icon: <ArrowUpRight className="w-5 h-5 text-emerald-500" />,
      badge: 'Scan'
    },
    {
      id: 'pengembalian',
      label: 'Pengembalian',
      icon: <ArrowDownLeft className="w-5 h-5 text-blue-500" />
    },
    {
      id: 'buku',
      label: 'Data Buku',
      icon: <BookOpen className="w-5 h-5" />
    },
    {
      id: 'anggota',
      label: 'Data Anggota',
      icon: <Users className="w-5 h-5" />
    },
    {
      id: 'transaksi',
      label: 'Semua Transaksi',
      icon: <Receipt className="w-5 h-5" />
    },
    {
      id: 'laporan',
      label: 'Laporan',
      icon: <BarChart3 className="w-5 h-5" />
    },
    {
      id: 'kategori',
      label: 'Kategori Buku',
      icon: <Tags className="w-5 h-5" />
    },
    {
      id: 'pengaturan',
      label: 'Pengaturan',
      icon: <Settings className="w-5 h-5" />,
      adminOnly: true
    },
    {
      id: 'pengguna',
      label: 'Pengguna',
      icon: <UserCog className="w-5 h-5" />,
      adminOnly: true
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden no-print"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 no-print ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header: School Logo & System Title */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md overflow-hidden shrink-0">
              {settings.logo && settings.logo.trim() !== '' ? (
                <img
                  src={settings.logo}
                  alt="Logo"
                  className="w-full h-full object-cover"
                  onError={e => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <BookOpen className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="overflow-hidden">
              <h2 className="font-extrabold text-white text-sm tracking-wide leading-tight truncate">
                PERPUSTAKAAN
              </h2>
              <p className="text-[11px] text-slate-400 truncate">
                {settings.nama_sekolah}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Menu Utama
          </div>

          {navItems.map(item => {
            if (item.adminOnly && !isAdmin) return null;

            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                      isActive
                        ? 'bg-blue-500 text-white'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* User Card & Logout Bottom */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 border border-slate-750">
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">
                {currentUser?.nama || 'Petugas'}
              </p>
              <p className="text-[10px] text-slate-400 font-mono">
                @{currentUser?.username} ({currentUser?.role})
              </p>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
