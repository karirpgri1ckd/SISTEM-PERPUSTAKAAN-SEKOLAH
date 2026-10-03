import { db } from '../database/db';
import { Member, ActiveLoanItem } from '../types';

export class MemberService {
  getAll(): Member[] {
    return db.getMembers();
  }

  getById(id: string): Member | undefined {
    return db.getMemberById(id);
  }

  search(query: string, kelasFilter?: string): Member[] {
    let list = this.getAll();
    if (kelasFilter && kelasFilter !== 'all') {
      list = list.filter(m => m.kelas.toLowerCase() === kelasFilter.toLowerCase());
    }

    if (!query.trim()) return list;

    const q = query.trim().toLowerCase();
    return list.filter(
      m => m.nama.toLowerCase().includes(q) ||
           m.nis.toLowerCase().includes(q) ||
           m.kode_anggota.toLowerCase().includes(q) ||
           m.nisn.toLowerCase().includes(q)
    );
  }

  getByCodeOrQr(code: string): Member | undefined {
    return db.getMemberByCodeOrQr(code);
  }

  save(member: Partial<Member>): { success: boolean; member?: Member; error?: string } {
    const members = db.getMembers();

    // Validate NIS uniqueness
    if (member.nis) {
      const duplicateNis = members.find(m => m.nis === member.nis && m.id !== member.id);
      if (duplicateNis) {
        return { success: false, error: `NIS ${member.nis} sudah digunakan oleh ${duplicateNis.nama}` };
      }
    }

    const id = member.id || `mem-${Date.now()}`;
    const kode_anggota = member.kode_anggota || db.generateNextMemberCode();

    const fullMember: Member = {
      id,
      kode_anggota,
      qr_token: member.qr_token || kode_anggota,
      nis: member.nis || '',
      nisn: member.nisn || '',
      nama: member.nama || '',
      kelas: member.kelas || '',
      jenis_kelamin: member.jenis_kelamin || 'L',
      no_hp: member.no_hp || '',
      alamat: member.alamat || '',
      foto: member.foto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      status: member.status || 'Aktif',
      created_at: member.created_at || new Date().toISOString()
    };

    db.saveMember(fullMember);
    return { success: true, member: fullMember };
  }

  delete(id: string): { success: boolean; error?: string } {
    const activeLoans = this.getActiveLoans(id);
    if (activeLoans.length > 0) {
      return {
        success: false,
        error: `Tidak dapat menghapus anggota ini karena masih memiliki ${activeLoans.length} buku yang dipinjam.`
      };
    }
    db.deleteMember(id);
    return { success: true };
  }

  getActiveLoans(memberId: string): ActiveLoanItem[] {
    const transactions = db.getTransactions().filter(t => t.anggota_id === memberId);
    const details = db.getTransactionDetails();
    const books = db.getBooks();
    const settings = db.getSettings();

    const activeList: ActiveLoanItem[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const trx of transactions) {
      const trxDetails = details.filter(d => d.transaksi_id === trx.id && d.status === 'Dipinjam');
      for (const d of trxDetails) {
        const book = books.find(b => b.id === d.buku_id);
        if (book) {
          const dueDate = new Date(trx.tanggal_jatuh_tempo);
          dueDate.setHours(0, 0, 0, 0);
          
          const diffTime = today.getTime() - dueDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const isTerlambat = diffDays > 0;
          const hariTerlambat = isTerlambat ? diffDays : 0;
          const estimasiDenda = hariTerlambat * (settings.denda_per_hari || 1000);

          activeList.push({
            detailId: d.id,
            transaksiId: trx.id,
            kodeTransaksi: trx.kode_transaksi,
            buku: book,
            tanggalPinjam: trx.tanggal_pinjam,
            tanggalJatuhTempo: trx.tanggal_jatuh_tempo,
            isTerlambat,
            hariTerlambat,
            estimasiDenda
          });
        }
      }
    }

    return activeList;
  }

  getLoanHistory(memberId: string) {
    const transactions = db.getTransactions().filter(t => t.anggota_id === memberId);
    const details = db.getTransactionDetails();
    const books = db.getBooks();

    return transactions.map(trx => {
      const items = details.filter(d => d.transaksi_id === trx.id).map(d => ({
        ...d,
        buku: books.find(b => b.id === d.buku_id)
      }));
      return {
        ...trx,
        items
      };
    });
  }
}

export const memberService = new MemberService();
