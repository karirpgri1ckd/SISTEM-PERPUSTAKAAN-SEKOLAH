import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { db } from '../database/db';
import { TransactionWithDetails, Member, Book, Settings } from '../types';

export class PdfService {
  private getSettings(): Settings {
    return db.getSettings();
  }

  /**
   * Helper to safely convert an image source (data URL or external URL) to a format jsPDF can render
   */
  private async getImageDataUrl(src?: string): Promise<string | null> {
    if (!src || typeof src !== 'string' || src.trim() === '') return null;
    if (src.startsWith('data:image/')) return src;

    return new Promise(resolve => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const timer = setTimeout(() => resolve(null), 2000);

      img.onload = () => {
        clearTimeout(timer);
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || 120;
          canvas.height = img.naturalHeight || 160;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/jpeg', 0.85));
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      };

      img.onerror = () => {
        clearTimeout(timer);
        resolve(null);
      };

      img.src = src;
    });
  }

  /**
   * Helper to draw official school letterhead (Kop Surat) on PDF documents
   */
  private drawHeader(doc: jsPDF, title: string, subtitle?: string) {
    const settings = this.getSettings();
    const pageWidth = doc.internal.pageSize.getWidth();

    // School Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(settings.nama_sekolah.toUpperCase(), pageWidth / 2, 14, { align: 'center' });

    // Library Name
    doc.setFontSize(11);
    doc.setTextColor(30, 64, 175); // blue-800
    doc.text(settings.nama_perpustakaan.toUpperCase(), pageWidth / 2, 20, { align: 'center' });

    // Address & Contact
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`${settings.alamat} • Telp: ${settings.telepon} • Email: ${settings.email}`, pageWidth / 2, 25, {
      align: 'center'
    });

    // Double dividing lines
    doc.setDrawColor(30, 41, 59); // slate-800
    doc.setLineWidth(0.8);
    doc.line(14, 28, pageWidth - 14, 28);
    doc.setLineWidth(0.2);
    doc.line(14, 29.2, pageWidth - 14, 29.2);

    // Document Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(title.toUpperCase(), pageWidth / 2, 36, { align: 'center' });

    if (subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(subtitle, pageWidth / 2, 41, { align: 'center' });
    }
  }

  /**
   * Helper to draw official signature block at the bottom
   */
  private drawSignatures(doc: jsPDF, startY: number) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Check if we need a new page for signatures
    if (startY + 45 > pageHeight - 15) {
      doc.addPage();
      startY = 20;
    }

    const settings = this.getSettings();
    const todayStr = new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date());

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);

    // Left signature: Kepala Sekolah
    const leftX = 35;
    doc.text('Mengetahui,', leftX, startY, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text('Kepala Sekolah', leftX, startY + 5, { align: 'center' });

    const namaKepsek = settings.nama_kepala_sekolah || 'Drs. H. Mulyadi, M.Pd';
    const nipKepsek = settings.nip_kepala_sekolah ? `NUPTK. ${settings.nip_kepala_sekolah}` : '-';
    doc.text(namaKepsek, leftX, startY + 28, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(nipKepsek, leftX, startY + 32, { align: 'center' });

    // Right signature: Kepala Perpustakaan / Petugas
    const rightX = pageWidth - 45;
    doc.setFontSize(8.5);
    doc.text(todayStr, rightX, startY, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text('Kepala Perpustakaan', rightX, startY + 5, { align: 'center' });

    const namaPetugas = settings.nama_petugas || 'Bambang Sudarsono, S.Pd';
    const nipPetugas = settings.nip_petugas ? `NUPTK. ${settings.nip_petugas}` : '-';
    doc.text(namaPetugas, rightX, startY + 28, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(nipPetugas, rightX, startY + 32, { align: 'center' });
  }

  /**
   * Universal Table Export to PDF
   */
  exportTable({
    title,
    subtitle,
    headers,
    data,
    filename,
    orientation = 'portrait',
    includeSignatures = true
  }: {
    title: string;
    subtitle?: string;
    headers: string[];
    data: (string | number)[][];
    filename: string;
    orientation?: 'portrait' | 'landscape';
    includeSignatures?: boolean;
  }) {
    const doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4'
    });

    this.drawHeader(doc, title, subtitle);

    const startY = subtitle ? 45 : 40;

    autoTable(doc, {
      head: [headers],
      body: data,
      startY,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 64, 175], // blue-800
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'left'
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [30, 41, 59],
        cellPadding: 2
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // slate-50
      },
      margin: { left: 14, right: 14 },
      didDrawPage: dataArg => {
        // Footer page numbering
        const pageCount = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Dokumen dicetak otomatis oleh Sistem Perpustakaan Sekolah pada ${new Date().toLocaleString('id-ID')}`,
          14,
          pageHeight - 6
        );
        doc.text(`Halaman ${dataArg.pageNumber} dari ${pageCount}`, pageWidth - 14, pageHeight - 6, {
          align: 'right'
        });
      }
    });

    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || startY + 40;

    if (includeSignatures) {
      this.drawSignatures(doc, finalY + 10);
    }

    doc.save(`${filename}.pdf`);
  }

  /**
   * Export Bukti Peminjaman (Receipt / Struk Peminjaman) to PDF
   */
  async exportBuktiPeminjaman(transaction: TransactionWithDetails) {
    const settings = this.getSettings();
    // A6 size receipt slip (105mm x 148mm)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [105, 170]
    });

    const pageWidth = 105;

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(settings.nama_sekolah.toUpperCase(), pageWidth / 2, 10, { align: 'center' });

    doc.setFontSize(8.5);
    doc.setTextColor(30, 64, 175);
    doc.text(settings.nama_perpustakaan.toUpperCase(), pageWidth / 2, 14, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(settings.alamat, pageWidth / 2, 18, { align: 'center' });

    // Dashed divider
    doc.setDrawColor(148, 163, 184);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(8, 21, pageWidth - 8, 21);
    doc.setLineDashPattern([], 0); // reset

    // Badge
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(pageWidth / 2 - 25, 23, 50, 6, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text('BUKTI PEMINJAMAN BUKU', pageWidth / 2, 27.2, { align: 'center' });

    // Meta details
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);

    let y = 35;
    const drawRow = (label: string, value: string, isBoldVal = false, valColor?: number[]) => {
      doc.text(label, 8, y);
      doc.text(':', 30, y);
      if (isBoldVal) doc.setFont('helvetica', 'bold');
      if (valColor) doc.setTextColor(valColor[0], valColor[1], valColor[2]);
      doc.text(value, 33, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      y += 4.5;
    };

    drawRow('Kode Transaksi', transaction.kode_transaksi, true, [30, 64, 175]);
    drawRow('Nama Siswa', transaction.anggota?.nama || '-', true);
    drawRow('NIS / Kelas', `${transaction.anggota?.nis || '-'} / ${transaction.anggota?.kelas || '-'}`);
    drawRow('Tgl Pinjam', transaction.tanggal_pinjam);
    drawRow('Jatuh Tempo', transaction.tanggal_jatuh_tempo, true, [225, 29, 72]); // rose-600
    drawRow('Petugas', transaction.petugas?.nama || 'Petugas');

    // Table of books
    const bookHeaders = ['No', 'Kode', 'Judul Buku', 'Rak'];
    const bookRows = transaction.details.map((d, index) => [
      index + 1,
      d.buku?.kode_buku || '-',
      d.buku?.judul || '-',
      d.buku?.rak || '-'
    ]);

    autoTable(doc, {
      head: [bookHeaders],
      body: bookRows,
      startY: y + 2,
      margin: { left: 8, right: 8 },
      theme: 'grid',
      headStyles: {
        fillColor: [30, 64, 175],
        textColor: 255,
        fontSize: 6.5,
        fontStyle: 'bold',
        cellPadding: 1.5
      },
      bodyStyles: {
        fontSize: 6.5,
        textColor: [30, 41, 59],
        cellPadding: 1.5
      }
    });

    const afterTableY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || y + 25;

    // Generate QR code as data URL
    try {
      const qrDataUrl = await QRCode.toDataURL(transaction.kode_transaksi, {
        margin: 1,
        width: 120
      });
      doc.addImage(qrDataUrl, 'PNG', pageWidth / 2 - 12, afterTableY + 4, 24, 24);
    } catch {
      // Ignore image error fallback
    }

    // Message
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'Harap merawat buku dan mengembalikannya tepat waktu.',
      pageWidth / 2,
      afterTableY + 32,
      { align: 'center' }
    );
    doc.text(
      `Denda keterlambatan: Rp ${settings.denda_per_hari.toLocaleString('id-ID')}/hari/buku.`,
      pageWidth / 2,
      afterTableY + 35.5,
      { align: 'center' }
    );

    doc.save(`bukti_pinjam_${transaction.kode_transaksi}.pdf`);
  }

  /**
   * Export Kartu Anggota Siswa to PDF (CR80 standard ratio or printable card page)
   */
  async exportKartuAnggota(member: Member) {
    const settings = this.getSettings();
    // Card size: 85.6mm x 54mm (CR80 Standard ID Card)
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [54, 85.6]
    });

    const cardW = 85.6;
    const cardH = 54;

    // Background & Border
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(0, 0, cardW, cardH, 2, 2, 'F');
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.4);
    doc.roundedRect(0.2, 0.2, cardW - 0.4, cardH - 0.4, 2, 2, 'S');

    // Header gradient stripe
    doc.setFillColor(30, 64, 175); // blue-800
    doc.rect(0.2, 0.2, cardW - 0.4, 2.5, 'F');

    // Header title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(30, 64, 175);
    doc.text(settings.nama_sekolah.toUpperCase(), cardW / 2, 6.2, { align: 'center' });

    doc.setFontSize(5.2);
    doc.setTextColor(30, 41, 59);
    doc.text(settings.nama_perpustakaan.toUpperCase(), cardW / 2, 9, { align: 'center' });

    doc.setFontSize(4.8);
    doc.setTextColor(59, 130, 246);
    doc.text('KARTU ANGGOTA PERPUSTAKAAN', cardW / 2, 11.5, { align: 'center' });

    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.2);
    doc.line(3.5, 13, cardW - 3.5, 13);

    // Photo placeholder / image
    const photoX = 4.5;
    const photoY = 15;
    const photoW = 16;
    const photoH = 22;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.2);
    doc.roundedRect(photoX, photoY, photoW, photoH, 1, 1, 'FD');

    let photoRendered = false;
    if (member.foto && member.foto.trim() !== '') {
      try {
        const fotoData = await this.getImageDataUrl(member.foto);
        if (fotoData) {
          doc.addImage(fotoData, 'JPEG', photoX + 0.3, photoY + 0.3, photoW - 0.6, photoH - 0.6);
          photoRendered = true;
        }
      } catch {
        photoRendered = false;
      }
    }

    if (!photoRendered) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5);
      doc.setTextColor(148, 163, 184);
      doc.text('FOTO', photoX + photoW / 2, photoY + photoH / 2, { align: 'center' });
      doc.setFontSize(3.8);
      doc.text('3 x 4', photoX + photoW / 2, photoY + photoH / 2 + 3.5, { align: 'center' });
    }

    // Member Details
    const textX = 23;
    const colonX = textX + 9;
    const valX = textX + 11;
    let detailY = 17.5;

    const printField = (label: string, val: string, isBold = false, isMono = false) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5);
      doc.setTextColor(100, 116, 139);
      doc.text(label, textX, detailY);
      doc.text(':', colonX, detailY);

      if (isMono) {
        doc.setFont('courier', 'bold');
        doc.setFontSize(5.5);
        doc.setTextColor(30, 64, 175);
      } else if (isBold) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5.2);
        doc.setTextColor(15, 23, 42);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5);
        doc.setTextColor(30, 41, 59);
      }

      doc.text(val, valX, detailY);
      detailY += 4.5;
    };

    const displayName = member.nama.length > 20 ? member.nama.substring(0, 19) + '...' : member.nama;
    printField('Nama', displayName, true);
    printField('NIS', member.nis);
    printField('Kelas', member.kelas);
    printField('Kode', member.kode_anggota, true, true);
    printField('Status', member.status || 'Aktif');

    // QR Code
    try {
      const qrDataUrl = await QRCode.toDataURL(member.qr_token || member.kode_anggota, {
        margin: 1,
        width: 100
      });
      const qrSize = 17;
      const qrX = cardW - qrSize - 4.5;
      const qrY = 15;
      doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
      doc.setFont('courier', 'bold');
      doc.setFontSize(4);
      doc.setTextColor(100, 116, 139);
      doc.text('SCAN QR', qrX + qrSize / 2, qrY + qrSize + 3, { align: 'center' });
    } catch {
      // fallback
    }

    // Card Footer
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(3.5, 46.5, cardW - 3.5, 46.5);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(4);
    doc.setTextColor(148, 163, 184);
    doc.text('* Wajib dibawa saat meminjam buku', 4.5, 50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(4);
    doc.setTextColor(30, 64, 175);
    doc.text('Berlaku Selama Menjadi Siswa', cardW - 4.5, 50, { align: 'right' });

    doc.save(`kartu_anggota_${member.kode_anggota}.pdf`);
  }

  /**
   * Export Label Buku to PDF (standard spine/pocket sticker format)
   */
  async exportLabelBuku(book: Book) {
    const settings = this.getSettings();
    // 70mm x 50mm sticker size
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [50, 70]
    });

    const w = 70;
    const h = 50;

    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(2, 2, w - 4, h - 4, 2, 2);

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(30, 64, 175);
    doc.text(settings.nama_perpustakaan.toUpperCase(), w / 2, 7, { align: 'center' });

    doc.setFontSize(5);
    doc.setTextColor(100, 116, 139);
    doc.text(settings.nama_sekolah.toUpperCase(), w / 2, 10, { align: 'center' });

    doc.setLineDashPattern([1, 1], 0);
    doc.line(5, 12, w - 5, 12);
    doc.setLineDashPattern([], 0);

    // QR Code
    try {
      const qrDataUrl = await QRCode.toDataURL(book.qr_token || book.kode_buku, {
        margin: 1,
        width: 90
      });
      doc.addImage(qrDataUrl, 'PNG', w / 2 - 10, 14, 20, 20);
    } catch {
      // ignore
    }

    doc.setFont('courier', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(book.kode_buku, w / 2, 38, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.text(book.judul.length > 28 ? book.judul.substring(0, 26) + '...' : book.judul, w / 2, 42, {
      align: 'center'
    });

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(w / 2 - 16, 44, 32, 4, 1, 1, 'F');
    doc.setFont('courier', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(30, 64, 175);
    doc.text(`RAK: ${book.rak}`, w / 2, 47, { align: 'center' });

    doc.save(`label_buku_${book.kode_buku}.pdf`);
  }

  /**
   * Export Bukti Pengembalian Buku to PDF
   */
  async exportBuktiPengembalian(receipt: {
    member: Member;
    petugasName: string;
    items: {
      buku: Book;
      kodeTransaksi: string;
      tanggalPinjam: string;
      tanggalKembali: string;
      kondisi: string;
      denda: number;
    }[];
    totalDenda: number;
    tanggalKembali: string;
  }) {
    const settings = this.getSettings();
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [105, 175]
    });

    const pageWidth = 105;
    const returnCode = `KMB-${Date.now().toString().slice(-6)}`;

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(settings.nama_sekolah.toUpperCase(), pageWidth / 2, 10, { align: 'center' });

    doc.setFontSize(8.5);
    doc.setTextColor(30, 64, 175);
    doc.text(settings.nama_perpustakaan.toUpperCase(), pageWidth / 2, 14, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(settings.alamat, pageWidth / 2, 18, { align: 'center' });

    // Dashed divider
    doc.setDrawColor(148, 163, 184);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(8, 21, pageWidth - 8, 21);
    doc.setLineDashPattern([], 0);

    // Badge
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(pageWidth / 2 - 28, 23, 56, 6, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(6, 95, 70);
    doc.text('BUKTI PENGEMBALIAN BUKU', pageWidth / 2, 27.2, { align: 'center' });

    let y = 35;
    const drawRow = (label: string, value: string, isBold = false) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text(label, 8, y);
      doc.text(':', 30, y);
      if (isBold) doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(value, 33, y);
      y += 4.5;
    };

    drawRow('No. Bukti Kembali', returnCode, true);
    drawRow('Nama Siswa', receipt.member.nama, true);
    drawRow('NIS / Kelas', `${receipt.member.nis} / ${receipt.member.kelas}`);
    drawRow('Tgl Kembali', receipt.tanggalKembali);
    drawRow('Petugas', receipt.petugasName);

    const headers = ['No', 'Judul Buku', 'Kondisi', 'Denda'];
    const rows = receipt.items.map((it, idx) => [
      idx + 1,
      it.buku.judul.length > 22 ? it.buku.judul.substring(0, 20) + '...' : it.buku.judul,
      it.kondisi,
      it.denda > 0 ? `Rp ${it.denda.toLocaleString('id-ID')}` : 'Rp 0'
    ]);

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: y + 2,
      margin: { left: 8, right: 8 },
      theme: 'grid',
      headStyles: {
        fillColor: [5, 150, 105], // emerald-600
        textColor: 255,
        fontSize: 6.5,
        fontStyle: 'bold',
        cellPadding: 1.5
      },
      bodyStyles: {
        fontSize: 6.5,
        textColor: [30, 41, 59],
        cellPadding: 1.5
      }
    });

    const afterTableY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || y + 25;

    // Total denda box
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Total Denda:', 8, afterTableY + 5);
    const dendaText = receipt.totalDenda > 0 ? `Rp ${receipt.totalDenda.toLocaleString('id-ID')}` : 'Rp 0 (Lunas)';
    doc.setTextColor(receipt.totalDenda > 0 ? 225 : 5, receipt.totalDenda > 0 ? 29 : 150, receipt.totalDenda > 0 ? 72 : 105);
    doc.text(dendaText, pageWidth - 8, afterTableY + 5, { align: 'right' });

    try {
      const qrDataUrl = await QRCode.toDataURL(returnCode, { margin: 1, width: 100 });
      doc.addImage(qrDataUrl, 'PNG', pageWidth / 2 - 11, afterTableY + 8, 22, 22);
    } catch {
      // ignore
    }

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text('Buku telah dikembalikan dan diverifikasi oleh petugas.', pageWidth / 2, afterTableY + 34, { align: 'center' });
    doc.text(`Dicetak pada ${new Date().toLocaleString('id-ID')}`, pageWidth / 2, afterTableY + 38, { align: 'center' });

    doc.save(`bukti_kembali_${returnCode}.pdf`);
  }

  /**
   * Export Sheet of Multiple Book Labels (e.g. 8 labels per A4 page)
   */
  async exportBatchLabels(books: Book[]) {
    const settings = this.getSettings();
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const cols = 2;
    const rows = 4;
    const labelW = 90;
    const labelH = 62;
    const startX = 12;
    const startY = 12;
    const gapX = 6;
    const gapY = 6;

    let index = 0;
    for (const book of books) {
      if (index > 0 && index % (cols * rows) === 0) {
        doc.addPage();
      }
      const pageIndex = index % (cols * rows);
      const col = pageIndex % cols;
      const row = Math.floor(pageIndex / cols);

      const x = startX + col * (labelW + gapX);
      const y = startY + row * (labelH + gapY);

      // Label border
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(x, y, labelW, labelH, 2, 2);

      // Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(30, 64, 175);
      doc.text(settings.nama_perpustakaan.toUpperCase(), x + labelW / 2, y + 5.5, { align: 'center' });

      doc.setFontSize(5);
      doc.setTextColor(100, 116, 139);
      doc.text(settings.nama_sekolah.toUpperCase(), x + labelW / 2, y + 8.5, { align: 'center' });

      // QR Code
      try {
        const qr = await QRCode.toDataURL(book.qr_token || book.kode_buku, { margin: 1, width: 80 });
        doc.addImage(qr, 'PNG', x + labelW / 2 - 11, y + 11, 22, 22);
      } catch {
        // ignore
      }

      // Code
      doc.setFont('courier', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(book.kode_buku, x + labelW / 2, y + 37.5, { align: 'center' });

      // Title & Rack
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.text(book.judul.length > 34 ? book.judul.substring(0, 32) + '...' : book.judul, x + labelW / 2, y + 42, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.setTextColor(100, 116, 139);
      doc.text(book.penulis.length > 34 ? book.penulis.substring(0, 32) + '...' : book.penulis, x + labelW / 2, y + 45.5, { align: 'center' });

      doc.setFillColor(241, 245, 249);
      doc.roundedRect(x + labelW / 2 - 18, y + 48, 36, 4.5, 1, 1, 'F');
      doc.setFont('courier', 'bold');
      doc.setFontSize(5.5);
      doc.setTextColor(30, 64, 175);
      doc.text(`RAK: ${book.rak}`, x + labelW / 2, y + 51.5, { align: 'center' });

      index++;
    }

    doc.save(`koleksi_label_buku_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  /**
   * Export Sheet of Multiple Student Cards (8 cards per A4 page)
   */
  async exportBatchKartuAnggota(members: Member[]) {
    const settings = this.getSettings();
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const cardW = 86;
    const cardH = 54;
    const startX = 13;
    const startY = 14;
    const gapX = 12;
    const gapY = 12;
    const cols = 2;
    const rows = 4; // 8 cards per A4

    let index = 0;
    for (const member of members) {
      if (index > 0 && index % (cols * rows) === 0) {
        doc.addPage();
      }
      const pageIndex = index % (cols * rows);
      const col = pageIndex % cols;
      const row = Math.floor(pageIndex / cols);

      const x = startX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY);

      // Card background & border
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(x, y, cardW, cardH, 2, 2, 'F');
      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(0.35);
      doc.roundedRect(x, y, cardW, cardH, 2, 2, 'S');

      // Top color stripe
      doc.setFillColor(30, 64, 175);
      doc.rect(x + 0.2, y + 0.2, cardW - 0.4, 2.2, 'F');

      // Header text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.2);
      doc.setTextColor(30, 64, 175);
      doc.text(settings.nama_sekolah.toUpperCase(), x + cardW / 2, y + 5.8, { align: 'center' });

      doc.setFontSize(5);
      doc.setTextColor(30, 41, 59);
      doc.text(settings.nama_perpustakaan.toUpperCase(), x + cardW / 2, y + 8.5, { align: 'center' });

      doc.setFontSize(4.5);
      doc.setTextColor(59, 130, 246);
      doc.text('KARTU ANGGOTA PERPUSTAKAAN', x + cardW / 2, y + 11.2, { align: 'center' });

      // Line
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.2);
      doc.line(x + 3.5, y + 12.8, x + cardW - 3.5, y + 12.8);

      // Photo frame
      const photoX = x + 4.5;
      const photoY = y + 14.5;
      const photoW = 16;
      const photoH = 21;

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.2);
      doc.roundedRect(photoX, photoY, photoW, photoH, 1, 1, 'FD');

      let photoDrawn = false;
      if (member.foto && member.foto.trim() !== '') {
        try {
          const fotoData = await this.getImageDataUrl(member.foto);
          if (fotoData) {
            doc.addImage(fotoData, 'JPEG', photoX + 0.3, photoY + 0.3, photoW - 0.6, photoH - 0.6);
            photoDrawn = true;
          }
        } catch {
          photoDrawn = false;
        }
      }

      if (!photoDrawn) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5);
        doc.setTextColor(148, 163, 184);
        doc.text('FOTO', photoX + photoW / 2, photoY + photoH / 2, { align: 'center' });
        doc.setFontSize(3.8);
        doc.text('3 x 4', photoX + photoW / 2, photoY + photoH / 2 + 3.5, { align: 'center' });
      }

      // Info
      const infoX = x + 22.5;
      const colonX = infoX + 8.5;
      const valX = infoX + 10.5;
      let curY = y + 17.5; // Strictly relative to y of the current card!

      const drawInfo = (lbl: string, val: string, isBold = false, isMono = false) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5);
        doc.setTextColor(100, 116, 139);
        doc.text(lbl, infoX, curY);
        doc.text(':', colonX, curY);

        if (isMono) {
          doc.setFont('courier', 'bold');
          doc.setFontSize(5.5);
          doc.setTextColor(30, 64, 175);
        } else if (isBold) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(5.2);
          doc.setTextColor(15, 23, 42);
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(5);
          doc.setTextColor(30, 41, 59);
        }

        doc.text(val, valX, curY);
        curY += 4.2;
      };

      const displayName = member.nama.length > 17 ? member.nama.substring(0, 16) + '...' : member.nama;
      drawInfo('Nama', displayName, true);
      drawInfo('NIS', member.nis);
      drawInfo('Kelas', member.kelas);
      drawInfo('Kode', member.kode_anggota, true, true);
      drawInfo('Status', member.status || 'Aktif');

      // QR Code
      const qrSize = 16;
      const qrX = x + cardW - qrSize - 4;
      const qrY = y + 14.5;
      try {
        const qr = await QRCode.toDataURL(member.qr_token || member.kode_anggota, { margin: 1, width: 90 });
        doc.addImage(qr, 'PNG', qrX, qrY, qrSize, qrSize);
        doc.setFont('courier', 'bold');
        doc.setFontSize(4);
        doc.setTextColor(100, 116, 139);
        doc.text('SCAN QR', qrX + qrSize / 2, qrY + qrSize + 2.5, { align: 'center' });
      } catch {
        // ignore
      }

      // Footer
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(x + 3.5, y + 46.5, x + cardW - 3.5, y + 46.5);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(4);
      doc.setTextColor(148, 163, 184);
      doc.text('* Wajib dibawa saat meminjam buku', x + 4, y + 50.5);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(4);
      doc.setTextColor(30, 64, 175);
      doc.text('Berlaku Selama Menjadi Siswa', x + cardW - 4, y + 50.5, { align: 'right' });

      index++;
    }

    doc.save(`koleksi_kartu_anggota_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  /**
   * Export Comprehensive Official User Manual / Guide Book to PDF
   */
  async exportBukuPanduan(customSettings?: Settings) {
    const settings = customSettings || this.getSettings();
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    let y = 20;

    const checkPageBreak = (neededHeight: number) => {
      if (y + neededHeight > pageHeight - 22) {
        doc.addPage();
        y = 24;
      }
    };

    const drawSectionTitle = (title: string, badge?: string) => {
      checkPageBreak(16);
      doc.setFillColor(30, 41, 59); // slate-800
      doc.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(255, 255, 255);
      doc.text(title, margin + 4, y + 5.5);

      if (badge) {
        doc.setFontSize(7.5);
        doc.setFillColor(59, 130, 246); // blue-500
        const badgeW = doc.getTextWidth(badge) + 6;
        doc.roundedRect(margin + contentWidth - badgeW - 3, y + 1.8, badgeW, 4.4, 1, 1, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text(badge, margin + contentWidth - badgeW - 3 + badgeW / 2, y + 4.9, { align: 'center' });
      }

      y += 12;
    };

    const drawParagraph = (text: string, isBold: boolean = false, fontSize: number = 8.5) => {
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setFontSize(fontSize);
      doc.setTextColor(51, 65, 85);
      const splitText = doc.splitTextToSize(text, contentWidth);
      checkPageBreak(splitText.length * 4.2 + 2);
      doc.text(splitText, margin, y);
      y += splitText.length * 4.2 + 2;
    };

    const drawInfoBox = (title: string, items: { label: string; desc: string }[], bgType: 'blue' | 'slate' | 'amber' = 'slate') => {
      const boxHeight = 8 + items.length * 6.5;
      checkPageBreak(boxHeight + 4);

      if (bgType === 'blue') {
        doc.setFillColor(239, 246, 255);
        doc.setDrawColor(191, 219, 254);
      } else if (bgType === 'amber') {
        doc.setFillColor(254, 243, 199);
        doc.setDrawColor(253, 230, 138);
      } else {
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
      }

      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(title, margin + 4, y + 5.5);

      let itemY = y + 10;
      items.forEach(item => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        doc.text(`• ${item.label}:`, margin + 6, itemY);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 41, 59);
        const descText = doc.splitTextToSize(item.desc, contentWidth - 45);
        doc.text(descText, margin + 42, itemY);
        itemY += 5.5;
      });

      y += boxHeight + 4;
    };

    // ==========================================
    // COVER / HEADER PAGE
    // ==========================================
    // Decorative Top Bar
    doc.setFillColor(37, 99, 235); // Blue 600
    doc.rect(margin, y, contentWidth, 4, 'F');
    y += 9;

    // School Name & App Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text('BUKU PANDUAN PENGGUNAAN SISTEM INFORMASI PERPUSTAKAAN', margin, y);
    y += 6;

    doc.setFontSize(11);
    doc.setTextColor(37, 99, 235);
    doc.text(settings.nama_sekolah.toUpperCase(), margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Unit: ${settings.nama_perpustakaan} | Alamat: ${settings.alamat || '-'} | Kontak: ${settings.telepon || settings.email || '-'}`, margin, y);
    y += 4;

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.line(margin, y, margin + contentWidth, y);
    y += 6;

    // Meta Box: Penanggung Jawab & Pejabat Sekolah (with NUPTK)
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('PENANGGUNG JAWAB & PEJABAT PENGESAH PERPUSTAKAAN:', margin + 4, y + 5);

    const halfW = contentWidth / 2;
    // Kepala Sekolah
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`Kepala Sekolah: ${settings.nama_kepala_sekolah || 'Drs. H. Mulyadi, M.Pd'}`, margin + 4, y + 11);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`NUPTK: ${settings.nip_kepala_sekolah || '-'}`, margin + 4, y + 16);

    // Petugas Perpustakaan
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`Petugas / Kepala Perpustakaan: ${settings.nama_petugas || 'Bambang Sudarsono, S.Pd'}`, margin + halfW, y + 11);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`NUPTK: ${settings.nip_petugas || '-'}`, margin + halfW, y + 16);

    y += 27;

    // ==========================================
    // BAB 1: PENGENALAN SISTEM & AKUN MASUK
    // ==========================================
    drawSectionTitle('BAB I: PENGENALAN SISTEM & HAK AKSES PENGGUNA', 'PENTING');
    drawParagraph(
      'Sistem Informasi Perpustakaan Sekolah ini dirancang khusus untuk mempermudah operasional harian perpustakaan sekolah secara modern, cepat, dan presisi. Sistem mendukung pemindaian Barcode/QR Code menggunakan alat pemindai (scanner) fisik maupun kamera perangkat, mencetak kartu anggota standar CR80, pelunasan denda otomatis, serta ekspor laporan resmi ber-NUPTK.'
    );

    drawInfoBox(
      'Tingkat Hak Akses (Role) Pengguna Sistem:',
      [
        {
          label: 'Administrator (Admin)',
          desc: 'Memiliki kewenangan penuh meliputi pengelolaan identitas lembaga, pengaturan pejabat & NUPTK, aturan sirkulasi & denda, manajemen akun pengguna, hingga backup & restore database.'
        },
        {
          label: 'Petugas Perpustakaan',
          desc: 'Bertanggung jawab pada operasional sirkulasi harian: pelayanan peminjaman buku, penerimaan pengembalian, pengecekan denda keterlambatan, serta pencatatan katalog buku dan anggota.'
        }
      ],
      'blue'
    );

    drawInfoBox(
      'Akun Bawaan (Default Login) Sistem:',
      [
        { label: 'Admin', desc: 'Username: admin  |  Password: admin123  (Hak akses penuh ke seluruh menu)' },
        { label: 'Petugas', desc: 'Username: petugas  |  Password: petugas123  (Fokus pada pelayanan sirkulasi)' }
      ],
      'amber'
    );

    // ==========================================
    // BAB 2: PENGATURAN IDENTITAS SEKOLAH & NUPTK
    // ==========================================
    drawSectionTitle('BAB II: PENGATURAN IDENTITAS SEKOLAH & NUPTK PEJABAT', 'ADMIN');
    drawParagraph(
      'Pengaturan sistem berada pada menu "Pengaturan" (khusus Administrator). Data yang dimasukkan pada menu ini akan secara otomatis terhubung dan tercetak pada seluruh dokumen keluaran sistem (Kartu Anggota Siswa, Struk Bukti Peminjaman/Pengembalian, dan Dokumen Laporan PDF Resmi):'
    );

    drawInfoBox(
      'Parameter Pengaturan Utama:',
      [
        { label: 'Identitas Sekolah', desc: 'Nama Sekolah, Nama Perpustakaan, Alamat Lengkap, No. Telepon, dan Email resmi.' },
        {
          label: 'Pejabat & NUPTK',
          desc: 'Nama Kepala Sekolah & NUPTK Kepala Sekolah, serta Nama Petugas & NUPTK Petugas/Kepala Perpustakaan. Data ini otomatis mengisi blok tanda tangan pengesahan laporan.'
        },
        {
          label: 'Aturan Sirkulasi',
          desc: `Maksimal Peminjaman (${settings.maksimal_peminjaman || 3} buku), Lama Pinjam (${settings.lama_peminjaman || 7} hari), dan Tarif Denda Keterlambatan (Rp ${(settings.denda_per_hari || 1000).toLocaleString('id-ID')} / hari per buku).`
        },
        { label: 'Logo Lembaga', desc: 'Unggah atau tempel tautan logo sekolah/perpustakaan untuk dicetak di kartu dan kop surat.' }
      ],
      'slate'
    );

    // ==========================================
    // BAB 3: DASHBOARD & PINTASAN CEPAT
    // ==========================================
    drawSectionTitle('BAB III: DASHBOARD SISTEM & PINTASAN CEPAT (QUICK SCAN)', 'NAVIGASI');
    drawParagraph(
      'Halaman Dashboard adalah pusat kendali real-time bagi petugas perpustakaan begitu berhasil masuk ke dalam sistem:'
    );

    drawInfoBox(
      'Fitur & Indikator Dashboard:',
      [
        { label: '7 Kartu Statistik Kunci', desc: 'Total Koleksi Buku, Buku Sedang Dipinjam, Buku Tersedia di Rak, Anggota Aktif, Transaksi Hari Ini, Buku Jatuh Tempo, dan Kas Total Denda Terkumpul.' },
        { label: 'Grafik Tren Sirkulasi', desc: 'Diagram visual tren peminjaman buku selama 7 hari terakhir untuk memantau keaktifan siswa.' },
        { label: 'Tombol Peminjaman Baru', desc: 'Pintasan instan untuk langsung membuka formulir transaksi peminjaman siswa.' },
        { label: 'Tombol Pengembalian', desc: 'Pintasan instan untuk langsung memproses buku yang dikembalikan dan cek denda.' },
        { label: 'Quick Scan Barcode', desc: 'Tombol scan barcode cepat di bilah navigasi atas (Navbar) untuk verifikasi instan buku/anggota.' }
      ],
      'blue'
    );

    // ==========================================
    // BAB 4: MANAJEMEN KOLEKSI BUKU & KATEGORI
    // ==========================================
    drawSectionTitle('BAB IV: MANAJEMEN DATA KOLEKSI BUKU & KATEGORI', 'KOLEKSI');
    drawParagraph(
      'Menu "Data Buku" dan "Kategori Buku" digunakan untuk menginventarisasi seluruh koleksi buku secara sistematis:'
    );

    drawInfoBox(
      'Panduan Pengelolaan Buku:',
      [
        {
          label: '1. Input Buku Baru',
          desc: 'Klik "Tambah Buku". Lengkapi Kode Buku (unik, misal: BK-001), Judul, Pengarang, Penerbit, Tahun Terbit, Kategori, Letak Rak (misal: Rak A-02), dan Jumlah Stok eksemplar.'
        },
        {
          label: '2. Import Excel Massal',
          desc: 'Klik "Import Excel". Gunakan template file yang disediakan sistem untuk mengunggah ratusan koleksi buku sekaligus dari file spreadsheet Microsoft Excel.'
        },
        {
          label: '3. Cetak Barcode/QR Buku',
          desc: 'Setiap buku memiliki QR Code / Barcode yang dapat dicetak langsung. Tempelkan label ini pada punggung atau sampul buku untuk mempercepat proses peminjaman.'
        },
        {
          label: '4. Ekspor Data Koleksi',
          desc: 'Katalog buku dapat diunduh kapan saja ke dalam format Excel (.xlsx) atau Dokumen PDF Resmi ber-kop perpustakaan.'
        }
      ],
      'slate'
    );

    // ==========================================
    // BAB 5: MANAJEMEN DATA ANGGOTA & CETAK KARTU
    // ==========================================
    drawSectionTitle('BAB V: DATA ANGGOTA & CETAK KARTU ANGGOTA (8 KARTU/A4)', 'ANGGOTA');
    drawParagraph(
      'Menu "Data Anggota" mengelola informasi siswa dan guru yang terdaftar sebagai pemustaka. Sistem dilengkapi modul pencetakan kartu anggota berstandar industri percetakan (CR80):'
    );

    drawInfoBox(
      'Fitur Unggulan Kartu Anggota:',
      [
        {
          label: 'Cetak Massal (8 Kartu / A4)',
          desc: 'Klik tombol "Cetak Semua Kartu (PDF)" di atas tabel. Sistem akan menata otomatis 8 kartu per halaman kertas A4 dengan garis potong presisi, kop biru resmi, pasfoto siswa, dan QR Code pemindai cepat.'
        },
        {
          label: 'Cetak Satuan (CR80)',
          desc: 'Klik tombol "Cetak Kartu" pada baris siswa terkait untuk melihat pratinjau kartu tunggal, cetak langsung ke printer kartu (ID Card Printer), atau unduh berkas PDF satuan.'
        },
        {
          label: 'Import Anggota via Excel',
          desc: 'Mendukung impor data siswa per kelas secara massal dari Excel (NIS, Nama Lengkap, Kelas, Nomor Telepon/WhatsApp, dan Alamat).'
        }
      ],
      'amber'
    );

    // ==========================================
    // BAB 6: SIRKULASI PEMINJAMAN BUKU
    // ==========================================
    drawSectionTitle('BAB VI: TATA CARA TRANSAKSI PEMINJAMAN BUKU', 'SIRKULASI');
    drawParagraph(
      'Proses peminjaman buku dirancang sangat efisien menggunakan alat pemindai barcode / kamera scanner:'
    );

    drawInfoBox(
      'Langkah Demi Langkah Peminjaman:',
      [
        {
          label: 'Langkah 1: Identifikasi Anggota',
          desc: 'Buka menu "Peminjaman". Arahkan scanner ke QR Code pada kartu anggota siswa, atau ketik nama/NIS siswa di kolom pencarian. Sistem memvalidasi apakah siswa berstatus aktif dan kuota pinjam masih mencukupi.'
        },
        {
          label: 'Langkah 2: Pindai Buku Pinjaman',
          desc: 'Scan barcode buku fisik atau cari judul buku. Buku akan otomatis masuk ke keranjang peminjaman. Sistem dapat memproses beberapa buku sekaligus hingga batas kuota maksimal peminjaman.'
        },
        {
          label: 'Langkah 3: Konfirmasi & Simpan',
          desc: 'Periksa tanggal pinjam dan tanggal jatuh tempo yang dihitung otomatis oleh sistem. Klik tombol "Simpan Transaksi Peminjaman".'
        },
        {
          label: 'Langkah 4: Cetak Bukti Peminjaman',
          desc: 'Klik tombol "Cetak Bukti" untuk memberikan struk tanda bukti peminjaman kepada siswa yang berisi daftar buku, tanggal jatuh tempo, dan nama petugas.'
        }
      ],
      'blue'
    );

    // ==========================================
    // BAB 7: SIRKULASI PENGEMBALIAN & PERHITUNGAN DENDA
    // ==========================================
    drawSectionTitle('BAB VII: TATA CARA PENGEMBALIAN & PELUNASAN DENDA', 'SIRKULASI');
    drawParagraph(
      'Menu "Pengembalian" menangani pengembalian buku dan menghitung denda keterlambatan secara otomatis tanpa perlu kalkulasi manual:'
    );

    drawInfoBox(
      'Alur Pengembalian & Denda:',
      [
        {
          label: '1. Cari Transaksi Peminjaman',
          desc: 'Scan QR Code pada struk bukti peminjaman siswa, atau ketik nama siswa / kode transaksi pada kolom pencarian.'
        },
        {
          label: '2. Perhitungan Denda Otomatis',
          desc: 'Jika pengembalian melewati batas tanggal jatuh tempo, sistem otomatis menghitung: Hari Terlambat x Tarif Denda per Hari x Jumlah Buku Terlambat.'
        },
        {
          label: '3. Checklist Pengembalian',
          desc: 'Beri centang pada buku yang dikembalikan (mendukung pengembalian bertahap jika belum semua buku dikembalikan).'
        },
        {
          label: '4. Pelunasan Denda & Cetak Struk',
          desc: 'Pilih status pelunasan denda (Lunas / Belum Lunas). Klik "Proses Pengembalian". Stok buku otomatis kembali ke rak dan petugas dapat mencetak Struk Bukti Pengembalian / Kuitansi Denda.'
        }
      ],
      'slate'
    );

    // ==========================================
    // BAB 8: SEMUA RIWAYAT TRANSAKSI
    // ==========================================
    drawSectionTitle('BAB VIII: MONITORING RIWAYAT SEMUA TRANSAKSI', 'AUDIT');
    drawParagraph(
      'Menu "Semua Transaksi" merekam seluruh pergerakan sirkulasi buku dari waktu ke waktu secara permanen:'
    );

    drawInfoBox(
      'Fitur Halaman Transaksi:',
      [
        { label: 'Filter Status Peminjaman', desc: 'Saring transaksi berdasarkan status: Sedang Dipinjam, Selesai (Kembali Penuh), Kembali Sebagian, atau Terlambat.' },
        { label: 'Filter Rentang Tanggal', desc: 'Pilih periode tanggal transaksi untuk audit operasional mingguan atau bulanan.' },
        { label: 'Cetak Ulang Struk', desc: 'Petugas dapat mencetak ulang Struk Bukti Peminjaman maupun Bukti Pengembalian kapan saja jika bukti fisik siswa hilang.' }
      ],
      'blue'
    );

    // ==========================================
    // BAB 9: LAPORAN PERPUSTAKAAN & PENGESAHAN NUPTK
    // ==========================================
    drawSectionTitle('BAB IX: LAPORAN PERPUSTAKAAN & PENGESAHAN DOKUMEN BER-NUPTK', 'PENTING');
    drawParagraph(
      'Menu "Laporan" digunakan untuk menghasilkan laporan pertanggungjawaban berkala kepada pimpinan sekolah:'
    );

    drawInfoBox(
      'Jenis Laporan Tersedia:',
      [
        { label: 'Laporan Inventaris Buku', desc: 'Daftar lengkap koleksi buku, pengarang, penerbit, kategori, nomor rak, stok, dan total eksemplar.' },
        { label: 'Laporan Data Anggota', desc: 'Rekapitulasi seluruh pemustaka terdaftar aktif berdasarkan kelas/tingkatan.' },
        { label: 'Laporan Peminjaman', desc: 'Rincian transaksi peminjaman dalam kurun waktu tertentu beserta statusnya.' },
        { label: 'Laporan Pengembalian', desc: 'Rincian buku yang telah kembali beserta tanggal pengembalian dan petugas penerima.' },
        { label: 'Laporan Denda Keterlambatan', desc: 'Rekap buku yang telat kembali serta rincian pemasukan kas denda perpustakaan.' }
      ],
      'slate'
    );

    drawInfoBox(
      'Fitur Format Ekspor & Tanda Tangan Pengesahan NUPTK:',
      [
        { label: 'Ekspor Excel (.xlsx)', desc: 'Menghasilkan file spreadsheet Microsoft Excel yang siap diolah lebih lanjut.' },
        {
          label: 'Ekspor PDF Resmi',
          desc: `Menghasilkan berkas PDF siap cetak dengan kop sekolah resmi, tabel data rapi, serta blok tanda tangan pengesahan di bawah dokumen: Kepala Sekolah (${settings.nama_kepala_sekolah || 'Drs. H. Mulyadi, M.Pd'} - NUPTK: ${settings.nip_kepala_sekolah || '-'}) dan Petugas Perpustakaan (${settings.nama_petugas || 'Bambang Sudarsono, S.Pd'} - NUPTK: ${settings.nip_petugas || '-'}).`
        }
      ],
      'amber'
    );

    // ==========================================
    // BAB 10: MANAJEMEN PENGGUNA (USER MANAGEMENT)
    // ==========================================
    drawSectionTitle('BAB X: MANAJEMEN AKUN PENGGUNA (USER MANAGEMENT)', 'ADMIN');
    drawParagraph(
      'Menu "Pengguna" (khusus Administrator) berfungsi untuk mengelola akun petugas perpustakaan:'
    );

    drawInfoBox(
      'Panduan Pengelolaan Akun:',
      [
        { label: 'Tambah Pengguna Baru', desc: 'Daftarkan nama petugas, username unik, password awal, dan tentukan peran (ADMIN atau PETUGAS).' },
        { label: 'Reset Password', desc: 'Ganti kata sandi petugas jika lupa password atau untuk pembaruan sandi berkala.' },
        { label: 'Non-aktifkan Akun', desc: 'Petugas yang sudah mutasi atau tidak lagi bertugas dapat dinonaktifkan tanpa menghapus riwayat transaksi lama.' }
      ],
      'slate'
    );

    // ==========================================
    // BAB 11: CADANGAN DATA (BACKUP & RESTORE DATABASE)
    // ==========================================
    drawSectionTitle('BAB XI: PEMELIHARAAN & CADANGAN DATA (BACKUP & RESTORE)', 'KEAMANAN');
    drawParagraph(
      'Data perpustakaan tersimpan secara lokal dan aman di browser komputer petugas. Untuk mengantisipasi kerusakan komputer atau jika ingin memindahkan sistem ke komputer lain, gunakan fitur Backup & Restore di menu Pengaturan:'
    );

    drawInfoBox(
      'Prosedur Cadangan Data:',
      [
        {
          label: 'Mengunduh Backup Database',
          desc: 'Masuk ke menu Pengaturan > gulir ke bagian "Cadangan Data" > klik "Unduh Backup Database". Simpan berkas cadangan (.json) tersebut di flashdisk atau Google Drive sekolah secara rutin (misal tiap Jumat sore).'
        },
        {
          label: 'Memulihkan Data (Restore)',
          desc: 'Pada komputer baru, buka menu Pengaturan > klik "Pilih File Backup" > pilih berkas .json cadangan > klik "Pulihkan Data (Restore)". Seluruh koleksi buku, anggota, dan riwayat sirkulasi akan pulih sempurna.'
        }
      ],
      'blue'
    );

    // ==========================================
    // BAB 12: TIPS PENGGUNAAN SCANNER & FAQ
    // ==========================================
    drawSectionTitle('BAB XII: PANDUAN SCANNER BARCODE & TANYA JAWAB (FAQ)', 'BANTUAN');
    drawParagraph(
      'Tips penggunaan perangkat keras dan pemecahan kendala teknis operasional perpustakaan:'
    );

    drawInfoBox(
      'Tips Perangkat Keras & Scanner:',
      [
        {
          label: 'Scanner Barcode USB / Bluetooth',
          desc: 'Semua barcode scanner tipe HID (Human Interface Device / Keyboard Emulation) didukung penuh secara otomatis (Plug & Play) tanpa perlu install driver tambahan.'
        },
        {
          label: 'Scanner Kamera Laptop / HP',
          desc: 'Gunakan tombol ikon kamera di samping kolom input untuk mengaktifkan pemindaian barcode menggunakan kamera laptop atau webcam USB.'
        },
        {
          label: 'Pengaturan Cetak Kartu & Laporan',
          desc: 'Pada jendela print peramban (browser print dialog), pastikan Margins diatur ke "None" atau "Default", dan centang opsi "Background graphics" (Grafik Latar Belakang) agar warna kartu dan kop tercetak tajam.'
        },
        {
          label: 'Kertas Rekomendasi Cetak Kartu',
          desc: 'Gunakan kertas Matte Photo Paper atau Brief Card (180-230 gsm) untuk mencetak batch 8 kartu per A4, kemudian potong dan masukkan ke dalam plastik card holder.'
        }
      ],
      'slate'
    );

    // ==========================================
    // STAMP HEADER, FOOTER, & PAGE NUMBERS
    // ==========================================
    const totalPages = doc.getNumberOfPages();
    const todayStr = new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date());

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      // Running Header (except first page)
      if (i > 1) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text('BUKU PANDUAN PENGGUNAAN SISTEM INFORMASI PERPUSTAKAAN', margin, 12);
        doc.text(settings.nama_sekolah, pageWidth - margin, 12, { align: 'right' });

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.2);
        doc.line(margin, 14, pageWidth - margin, 14);
      }

      // Running Footer
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Dokumen Resmi Panduan Operasional Perpustakaan • Dicetak: ${todayStr}`,
        margin,
        pageHeight - 9
      );

      doc.setFont('helvetica', 'bold');
      doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth - margin, pageHeight - 9, { align: 'right' });
    }

    const safeSchoolName = settings.nama_sekolah.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    doc.save(`buku_panduan_perpustakaan_${safeSchoolName}.pdf`);
  }
}

export const pdfService = new PdfService();

