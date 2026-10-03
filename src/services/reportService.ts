import { db } from '../database/db';

export class ReportService {
  exportCSV(filename: string, headers: string[], rows: (string | number)[][]) {
    const csvContent = [
      headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','),
      ...rows.map(row => row.map(col => `"${String(col ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\r\n');

    // Add BOM for Indonesian Windows Excel UTF-8 support
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  getLoanReport(startDate?: string, endDate?: string) {
    const transactions = db.getTransactions();
    const members = db.getMembers();
    const details = db.getTransactionDetails();
    const books = db.getBooks();

    return transactions
      .filter(t => {
        if (startDate && t.tanggal_pinjam < startDate) return false;
        if (endDate && t.tanggal_pinjam > endDate) return false;
        return true;
      })
      .map(t => {
        const member = members.find(m => m.id === t.anggota_id);
        const trxDetails = details.filter(d => d.transaksi_id === t.id);
        const bookTitles = trxDetails
          .map(d => books.find(b => b.id === d.buku_id)?.judul || '-')
          .join('; ');

        return {
          kode: t.kode_transaksi,
          anggota: member?.nama || '-',
          nis: member?.nis || '-',
          kelas: member?.kelas || '-',
          tanggal_pinjam: t.tanggal_pinjam,
          tanggal_jatuh_tempo: t.tanggal_jatuh_tempo,
          jumlah_buku: trxDetails.length,
          daftar_buku: bookTitles,
          status: t.status
        };
      });
  }

  getReturnReport(startDate?: string, endDate?: string) {
    const details = db.getTransactionDetails().filter(d => d.status !== 'Dipinjam' && d.tanggal_kembali);
    const transactions = db.getTransactions();
    const members = db.getMembers();
    const books = db.getBooks();

    return details
      .filter(d => {
        if (!d.tanggal_kembali) return false;
        if (startDate && d.tanggal_kembali < startDate) return false;
        if (endDate && d.tanggal_kembali > endDate) return false;
        return true;
      })
      .map(d => {
        const trx = transactions.find(t => t.id === d.transaksi_id);
        const member = trx ? members.find(m => m.id === trx.anggota_id) : undefined;
        const book = books.find(b => b.id === d.buku_id);

        return {
          kode_trx: trx?.kode_transaksi || '-',
          anggota: member?.nama || '-',
          kelas: member?.kelas || '-',
          kode_buku: book?.kode_buku || '-',
          judul_buku: book?.judul || '-',
          tanggal_kembali: d.tanggal_kembali || '-',
          kondisi: d.kondisi_kembali || 'Baik',
          catatan: d.catatan_kondisi || '-',
          denda: d.denda || 0
        };
      });
  }

  getOverdueReport() {
    const transactions = db.getTransactions();
    const details = db.getTransactionDetails();
    const members = db.getMembers();
    const books = db.getBooks();
    const settings = db.getSettings();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdues: {
      kode_transaksi: string;
      nama: string;
      nis: string;
      kelas: string;
      no_hp: string;
      judul_buku: string;
      kode_buku: string;
      tanggal_pinjam: string;
      tanggal_jatuh_tempo: string;
      hari_terlambat: number;
      estimasi_denda: number;
    }[] = [];

    for (const trx of transactions) {
      const activeDetails = details.filter(d => d.transaksi_id === trx.id && d.status === 'Dipinjam');
      if (activeDetails.length === 0) continue;

      const dueDate = new Date(trx.tanggal_jatuh_tempo);
      dueDate.setHours(0, 0, 0, 0);

      const diffTime = today.getTime() - dueDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 0) {
        const member = members.find(m => m.id === trx.anggota_id);
        for (const d of activeDetails) {
          const book = books.find(b => b.id === d.buku_id);
          overdues.push({
            kode_transaksi: trx.kode_transaksi,
            nama: member?.nama || '-',
            nis: member?.nis || '-',
            kelas: member?.kelas || '-',
            no_hp: member?.no_hp || '-',
            judul_buku: book?.judul || '-',
            kode_buku: book?.kode_buku || '-',
            tanggal_pinjam: trx.tanggal_pinjam,
            tanggal_jatuh_tempo: trx.tanggal_jatuh_tempo,
            hari_terlambat: diffDays,
            estimasi_denda: diffDays * (settings.denda_per_hari || 1000)
          });
        }
      }
    }

    return overdues;
  }
}

export const reportService = new ReportService();
