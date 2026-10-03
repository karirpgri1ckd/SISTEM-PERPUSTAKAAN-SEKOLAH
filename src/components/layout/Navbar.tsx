import React from 'react';
import { Menu, BookOpen, User, LogOut, ShieldCheck, UserCheck, QrCode } from 'lucide-react';
import { User as UserType, Settings } from '../../types';

interface NavbarProps {
  currentUser: UserType | null;
  settings: Settings;
  onLogout: () => void;
  onToggleSidebar: () => void;
  onQuickScan: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  settings,
  onLogout,
  onToggleSidebar,
  onQuickScan
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 no-print">
      <div className="flex items-center justify-between">
        {/* Left: Hamburger & Brand Title for small screens */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg lg:hidden transition-colors"
            aria-label="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-tight">Perpustakaan</h1>
              <p className="text-[10px] text-slate-500">{settings.nama_sekolah}</p>
            </div>
          </div>

          <div className="hidden lg:block">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
              {settings.nama_perpustakaan}
            </span>
            <span className="ml-2 text-xs text-slate-500 font-medium">
              • {settings.nama_sekolah}
            </span>
          </div>
        </div>

        {/* Right: Quick Scan Button + User Profile + Logout */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={onQuickScan}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 rounded-lg text-xs font-semibold transition-all shadow-2xs cursor-pointer"
            title="Scan QR / Barcode Cepat"
          >
            <QrCode className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">Scan Cepat</span>
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
              {currentUser?.role === 'ADMIN' ? (
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
              ) : (
                <UserCheck className="w-4 h-4 text-blue-600" />
              )}
            </div>

            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-slate-800 leading-tight">
                {currentUser?.nama || 'Petugas'}
              </div>
              <div className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${currentUser?.role === 'ADMIN' ? 'bg-indigo-500' : 'bg-blue-500'}`} />
                {currentUser?.role}
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1 cursor-pointer"
              title="Keluar / Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
