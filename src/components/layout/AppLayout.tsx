import React, { useState } from 'react';
import { Sidebar, NavTab } from './Sidebar';
import { Navbar } from './Navbar';
import { User, Settings } from '../../types';
import { QrScannerModal } from '../common/QrScannerModal';
import { memberService } from '../../services/memberService';
import { bookService } from '../../services/bookService';
import { useToast } from '../common/Toast';

interface AppLayoutProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentUser: User | null;
  settings: Settings;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  settings,
  onLogout,
  children
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isQuickScanOpen, setIsQuickScanOpen] = useState(false);
  const toast = useToast();

  const handleQuickScanResult = (code: string) => {
    // Check if it matches a member
    const member = memberService.getByCodeOrQr(code);
    if (member) {
      toast.success(`Anggota ditemukan: ${member.nama} (${member.kode_anggota})`);
      onSelectTab('peminjaman');
      return;
    }

    // Check if it matches a book
    const book = bookService.getByCodeOrQr(code);
    if (book) {
      toast.success(`Buku ditemukan: ${book.judul} (${book.kode_buku})`);
      onSelectTab('buku');
      return;
    }

    toast.warning(`Kode "${code}" tidak cocok dengan data anggota atau buku.`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        currentUser={currentUser}
        settings={settings}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={onLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <Navbar
          currentUser={currentUser}
          settings={settings}
          onLogout={onLogout}
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
          onQuickScan={() => setIsQuickScanOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Global Quick Scan Modal */}
      <QrScannerModal
        isOpen={isQuickScanOpen}
        onClose={() => setIsQuickScanOpen(false)}
        onScan={handleQuickScanResult}
        title="Scan QR / Barcode Cepat"
        subtitle="Arahkan ke Kartu Siswa atau Label Buku"
        sampleCodes={[
          { code: 'AGT-00001', label: 'Ahmad Fauzan' },
          { code: 'AGT-00002', label: 'Siti Aisyah' },
          { code: 'BK-00001', label: 'Laskar Pelangi' },
          { code: 'BK-00002', label: 'Bumi' }
        ]}
      />
    </div>
  );
};
