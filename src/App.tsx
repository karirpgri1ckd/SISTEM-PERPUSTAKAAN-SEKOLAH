import React, { useState, useEffect } from 'react';
import { User, Settings } from './types';
import { db } from './database/db';
import { authService } from './services/authService';
import { AppLayout } from './components/layout/AppLayout';
import { NavTab } from './components/layout/Sidebar';
import { ToastProvider, useToast } from './components/common/Toast';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { BukuPage } from './pages/BukuPage';
import { AnggotaPage } from './pages/AnggotaPage';
import { PeminjamanPage } from './pages/PeminjamanPage';
import { PengembalianPage } from './pages/PengembalianPage';
import { TransaksiPage } from './pages/TransaksiPage';
import { KategoriPage } from './pages/KategoriPage';
import { LaporanPage } from './pages/LaporanPage';
import { PengaturanPage } from './pages/PengaturanPage';
import { PenggunaPage } from './pages/PenggunaPage';

const AppContent: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => authService.getCurrentUser());
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [settings, setSettings] = useState<Settings>(() => db.getSettings());
  const toast = useToast();

  useEffect(() => {
    // Subscribe to DB changes
    const unsubscribe = db.subscribe(() => {
      setSettings(db.getSettings());
      setCurrentUser(authService.getCurrentUser());
    });
    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentTab('dashboard');
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setCurrentTab('dashboard');
    toast.info('Anda telah keluar dari sistem perpustakaan.');
  };

  const handleSelectTab = (tab: NavTab) => {
    // Role protection
    if ((tab === 'pengaturan' || tab === 'pengguna') && currentUser?.role !== 'ADMIN') {
      toast.warning('Akses ditolak: Menu ini hanya dapat diakses oleh Administrator.');
      return;
    }
    setCurrentTab(tab);
  };

  // Not logged in -> Show Login Page
  if (!currentUser) {
    return <LoginPage settings={settings} onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <AppLayout
      currentTab={currentTab}
      onSelectTab={handleSelectTab}
      currentUser={currentUser}
      settings={settings}
      onLogout={handleLogout}
    >
      {currentTab === 'dashboard' && <DashboardPage onNavigate={handleSelectTab} />}
      {currentTab === 'peminjaman' && (
        <PeminjamanPage currentUserId={currentUser.id} settings={settings} />
      )}
      {currentTab === 'pengembalian' && (
        <PengembalianPage currentUserId={currentUser.id} settings={settings} />
      )}
      {currentTab === 'buku' && <BukuPage settings={settings} />}
      {currentTab === 'anggota' && <AnggotaPage settings={settings} />}
      {currentTab === 'transaksi' && <TransaksiPage settings={settings} />}
      {currentTab === 'laporan' && <LaporanPage settings={settings} />}
      {currentTab === 'kategori' && <KategoriPage />}
      {currentTab === 'pengaturan' && (
        <PengaturanPage settings={settings} onUpdateSettings={setSettings} />
      )}
      {currentTab === 'pengguna' && <PenggunaPage currentUserId={currentUser.id} />}
    </AppLayout>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
