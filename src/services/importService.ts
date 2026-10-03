import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { Member, Book, Gender, MemberStatus, BookStatus } from '../types';
import { db } from '../database/db';

export interface ParsedMemberRow {
  rowNumber: number;
  kode_anggota: string;
  nis: string;
  nisn: string;
  nama: string;
  kelas: string;
  jenis_kelamin: Gender;
  no_hp: string;
  alamat: string;
  status: MemberStatus;
  foto_filename?: string;
  photoDataUrl?: string;
  photoMatchedFromZip: boolean;
  isExisting: boolean;
  isValid: boolean;
  errors: string[];
}

export interface ParsedBookRow {
  rowNumber: number;
  kode_buku: string;
  isbn: string;
  judul: string;
  penulis: string;
  penerbit: string;
  tahun: number;
  kategori_nama: string;
  rak: string;
  stok: number;
  status: BookStatus;
  deskripsi: string;
  cover_filename?: string;
  coverDataUrl?: string;
  coverMatchedFromZip: boolean;
  isExisting: boolean;
  isValid: boolean;
  errors: string[];
}

class ImportService {
  /**
   * Helper to clean strings for key matching (e.g. "AGT-00001.JPG" -> "agt-00001")
   */
  private cleanKey(str: string): string {
    return str
      .trim()
      .toLowerCase()
      .replace(/\.[a-z0-9]+$/i, '') // strip extension if any
      .replace(/[^a-z0-9_-]/g, ''); // keep alphanumeric, dash, underscore
  }

  /**
   * Generates and triggers download of Excel template for Student Members
   */
  downloadMemberTemplate() {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Data Anggota
    const headers = [
      'Kode Anggota',
      'NIS',
      'NISN',
      'Nama Lengkap',
      'Kelas',
      'Jenis Kelamin (L/P)',
      'No HP',
      'Alamat',
      'Status (Aktif/Tidak Aktif)',
      'Nama File Foto di ZIP'
    ];

    const sampleRows = [
      [
        'AGT-00011',
        '10301',
        '0089123461',
        'Bintang Pratama',
        'X IPA 1',
        'L',
        '081234567891',
        'Jl. Teladan Mas No. 12',
        'Aktif',
        'AGT-00011.jpg'
      ],
      [
        'AGT-00012',
        '10302',
        '0089123462',
        'Clarissa Putri',
        'X IPA 2',
        'P',
        '081398765432',
        'Jl. Kenanga Blok B-4',
        'Aktif',
        '10302.png'
      ],
      [
        'AGT-00013',
        '10303',
        '0089123463',
        'Daffa Al-Ghifari',
        'XI IPS 1',
        'L',
        '085712345678',
        'Komplek Asri No. 8',
        'Aktif',
        ''
      ]
    ];

    const wsData = [headers, ...sampleRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Column widths
    ws['!cols'] = [
      { wch: 16 },
      { wch: 12 },
      { wch: 16 },
      { wch: 25 },
      { wch: 14 },
      { wch: 20 },
      { wch: 16 },
      { wch: 30 },
      { wch: 24 },
      { wch: 24 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Data_Anggota');

    // Sheet 2: Petunjuk Foto ZIP
    const instructions = [
      ['PANDUAN IMPORT DATA ANGGOTA & FOTO DARI ZIP'],
      [''],
      ['1. PENGISIAN EXCEL:'],
      ['   - Kolom "NIS" dan "Nama Lengkap" wajib diisi.'],
      ['   - Kode Anggota disarankan berformat AGT-00001, AGT-00002, dst (jika dikosongkan akan digenerate otomatis).'],
      ['   - Jenis Kelamin diisi "L" (Laki-laki) atau "P" (Perempuan).'],
      ['   - Status diisi "Aktif" atau "Tidak Aktif".'],
      [''],
      ['2. FOTO DENGAN ZIP (AGAR TIDAK GANDA & TEPAT SASARAN):'],
      ['   - Masukkan seluruh foto siswa ke dalam satu file .ZIP (misal: "foto_siswa.zip").'],
      ['   - Namai file foto di dalam ZIP menggunakan salah satu format berikut:'],
      ['     a. Nama file sesuai Kode Anggota: "AGT-00011.jpg", "AGT-00012.png", dsb.'],
      ['     b. Atau nama file sesuai NIS siswa: "10301.jpg", "10302.jpg", dsb.'],
      ['     c. Atau tentukan nama file kustom pada kolom "Nama File Foto di ZIP".'],
      ['   - Sistem otomatis mencocokkan foto dengan siswa sehingga tidak akan tertukar atau ganda!'],
      ['   - Jika siswa tidak memiliki foto di ZIP, sistem otomatis menggunakan foto avatar bawaan.']
    ];

    const wsPetunjuk = XLSX.utils.aoa_to_sheet(instructions);
    wsPetunjuk['!cols'] = [{ wch: 80 }];
    XLSX.utils.book_append_sheet(wb, wsPetunjuk, 'Petunjuk_Foto_ZIP');

    XLSX.writeFile(wb, 'Template_Import_Anggota_Perpustakaan.xlsx');
  }

  /**
   * Generates and triggers download of Excel template for Books
   */
  downloadBookTemplate() {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Data Buku
    const headers = [
      'Kode Buku',
      'ISBN',
      'Judul Buku',
      'Penulis',
      'Penerbit',
      'Tahun Terbit',
      'Kategori',
      'Lokasi Rak',
      'Jumlah Stok',
      'Status (Tersedia/Dipinjam/Perbaikan)',
      'Deskripsi / Sinopsis',
      'Nama File Cover di ZIP'
    ];

    const sampleRows = [
      [
        'BK-00021',
        '978-602-03-3450-1',
        'Fisika Modern untuk SMA',
        'Dr. Suparman, M.Sc',
        'Erlangga',
        2023,
        'Sains & Matematika',
        'R-01-A',
        5,
        'Tersedia',
        'Buku pegangan fisika modern dasar untuk kelas 10-12.',
        'BK-00021.jpg'
      ],
      [
        'BK-00022',
        '978-602-06-4550-2',
        'Dasar Algoritma dan Pemrograman',
        'Rian Wicaksono, M.Kom',
        'Informatika',
        2024,
        'Teknologi & Komputer',
        'R-02-B',
        4,
        'Tersedia',
        'Pengantar logika pemrograman komputer dan computational thinking.',
        '978-602-06-4550-2.png'
      ],
      [
        'BK-00023',
        '978-979-3062-79-2',
        'Sejarah Pergerakan Nasional',
        'Sartono Kartodirdjo',
        'Gramedia',
        2022,
        'Sejarah & Budaya',
        'R-03-C',
        3,
        'Tersedia',
        'Kajian komprehensif perjuangan kemerdekaan Indonesia.',
        ''
      ]
    ];

    const wsData = [headers, ...sampleRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws['!cols'] = [
      { wch: 14 },
      { wch: 20 },
      { wch: 32 },
      { wch: 24 },
      { wch: 18 },
      { wch: 14 },
      { wch: 22 },
      { wch: 14 },
      { wch: 14 },
      { wch: 26 },
      { wch: 35 },
      { wch: 24 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Data_Buku');

    // Sheet 2: Petunjuk Cover ZIP
    const instructions = [
      ['PANDUAN IMPORT DATA BUKU & COVER DARI ZIP'],
      [''],
      ['1. PENGISIAN EXCEL:'],
      ['   - Kolom "Judul Buku" dan "Penulis" wajib diisi.'],
      ['   - Kode Buku disarankan berformat BK-00001, BK-00002, dst (jika kosong akan digenerate otomatis).'],
      ['   - Jumlah Stok diisi bilangan bulat (misal: 3, 5, 10).'],
      ['   - Kategori jika belum ada di database, akan otomatis ditambahkan.'],
      [''],
      ['2. COVER DENGAN ZIP (AGAR TIDAK GANDA & TEPAT SASARAN):'],
      ['   - Masukkan seluruh gambar cover buku ke dalam satu file .ZIP (misal: "cover_buku.zip").'],
      ['   - Namai file cover di dalam ZIP menggunakan salah satu format berikut:'],
      ['     a. Nama file sesuai Kode Buku: "BK-00021.jpg", "BK-00022.png", dsb.'],
      ['     b. Atau nama file sesuai nomor ISBN (dengan/tanpa tanda hubung): "9786020334501.jpg".'],
      ['     c. Atau tentukan nama file pada kolom "Nama File Cover di ZIP".'],
      ['   - Sistem otomatis memetakan cover secara presisi sehingga tidak akan salah pasang cover.'],
      ['   - Jika tidak ada cover di ZIP, buku akan otomatis menggunakan BookCover bergradien estetik.']
    ];

    const wsPetunjuk = XLSX.utils.aoa_to_sheet(instructions);
    wsPetunjuk['!cols'] = [{ wch: 80 }];
    XLSX.utils.book_append_sheet(wb, wsPetunjuk, 'Petunjuk_Cover_ZIP');

    XLSX.writeFile(wb, 'Template_Import_Buku_Perpustakaan.xlsx');
  }

  /**
   * Unpacks a ZIP file and extracts image files into Base64 Data URLs mapped by filename keys
   */
  async extractImagesFromZip(file: File): Promise<Map<string, string>> {
    const imagesMap = new Map<string, string>();
    try {
      const zip = new JSZip();
      const content = await zip.loadAsync(file);

      const supportedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];

      const promises: Promise<void>[] = [];

      content.forEach((relativePath, zipEntry) => {
        // Skip directories and MacOS metadata
        if (zipEntry.dir || relativePath.includes('__MACOSX') || relativePath.startsWith('.')) {
          return;
        }

        const lowerPath = relativePath.toLowerCase();
        const hasValidExt = supportedExts.some(ext => lowerPath.endsWith(ext));
        if (!hasValidExt) return;

        // Clean filename (extract just basename without directories)
        const filename = relativePath.split('/').pop() || relativePath;
        const cleanBaseKey = this.cleanKey(filename);

        const promise = zipEntry.async('base64').then(base64 => {
          let mime = 'image/jpeg';
          if (lowerPath.endsWith('.png')) mime = 'image/png';
          else if (lowerPath.endsWith('.webp')) mime = 'image/webp';
          else if (lowerPath.endsWith('.svg')) mime = 'image/svg+xml';
          else if (lowerPath.endsWith('.gif')) mime = 'image/gif';

          const dataUrl = `data:${mime};base64,${base64}`;

          // Map by full lowercase filename (e.g. "agt-00011.jpg")
          imagesMap.set(filename.toLowerCase(), dataUrl);
          // Map by clean base key (e.g. "agt-00011" or "10301")
          if (cleanBaseKey) {
            imagesMap.set(cleanBaseKey, dataUrl);
          }
        });

        promises.push(promise);
      });

      await Promise.all(promises);
    } catch (err) {
      console.error('Error unpacking zip archive:', err);
      throw new Error('Gagal mengekstrak file ZIP. Pastikan file berformat ZIP yang valid.');
    }

    return imagesMap;
  }

  /**
   * Parses Excel file into JSON raw rows
   */
  async readExcelToJson(file: File): Promise<Record<string, unknown>[]> {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    if (!worksheet) return [];

    return XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      defval: ''
    });
  }

  /**
   * Parse and validate Member Excel rows, matching photos from ZIP map
   */
  parseMembersData(
    rawRows: Record<string, unknown>[],
    zipImagesMap: Map<string, string>
  ): ParsedMemberRow[] {
    const existingMembers = db.getMembers();
    const existingCodeSet = new Set(existingMembers.map(m => m.kode_anggota.toUpperCase()));
    const existingNisSet = new Set(existingMembers.map(m => m.nis.toUpperCase()));

    let nextAutoCodeNumber = 1;
    for (const m of existingMembers) {
      const match = m.kode_anggota.match(/AGT-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num >= nextAutoCodeNumber) nextAutoCodeNumber = num + 1;
      }
    }

    const parsed: ParsedMemberRow[] = [];

    rawRows.forEach((row, idx) => {
      const rowNumber = idx + 2; // header is row 1

      // Flexible column getter
      const getVal = (...keys: string[]): string => {
        for (const k of keys) {
          for (const rowKey of Object.keys(row)) {
            if (rowKey.trim().toLowerCase() === k.trim().toLowerCase()) {
              const v = row[rowKey];
              return v !== undefined && v !== null ? String(v).trim() : '';
            }
          }
        }
        return '';
      };

      let kode = getVal('Kode Anggota', 'kode_anggota', 'kode', 'Kode').toUpperCase();
      const nis = getVal('NIS', 'nis', 'Nomor Induk Siswa', 'No Induk');
      const nisn = getVal('NISN', 'nisn');
      const nama = getVal('Nama Lengkap', 'Nama', 'nama_lengkap', 'nama');
      const kelas = getVal('Kelas', 'kelas') || 'X';
      const jkRaw = getVal('Jenis Kelamin (L/P)', 'Jenis Kelamin', 'jk', 'gender').toUpperCase();
      const no_hp = getVal('No HP', 'No. HP', 'Nomor HP', 'Telepon', 'no_hp');
      const alamat = getVal('Alamat', 'alamat');
      const statusRaw = getVal('Status (Aktif/Tidak Aktif)', 'Status', 'status');
      const fotoFilename = getVal('Nama File Foto di ZIP', 'Foto', 'Nama File Foto', 'foto');

      const errors: string[] = [];

      if (!nama) errors.push('Nama siswa wajib diisi');
      if (!nis) errors.push('NIS siswa wajib diisi');

      if (!kode) {
        kode = `AGT-${String(nextAutoCodeNumber++).padStart(5, '0')}`;
      }

      const jenis_kelamin: Gender = jkRaw.startsWith('P') ? 'P' : 'L';
      const status: MemberStatus = statusRaw.toLowerCase().includes('tidak') ? 'Tidak Aktif' : 'Aktif';

      // Photo matching logic from ZIP
      let photoDataUrl: string | undefined = undefined;
      let photoMatchedFromZip = false;

      if (zipImagesMap.size > 0) {
        // Priority 1: explicitly specified filename in Excel
        if (fotoFilename) {
          const directMatch = zipImagesMap.get(fotoFilename.toLowerCase()) || zipImagesMap.get(this.cleanKey(fotoFilename));
          if (directMatch) {
            photoDataUrl = directMatch;
            photoMatchedFromZip = true;
          }
        }

        // Priority 2: match by Member Code (e.g. "agt-00011")
        if (!photoDataUrl && kode) {
          const codeKey = this.cleanKey(kode);
          const match = zipImagesMap.get(codeKey) || zipImagesMap.get(`${codeKey}.jpg`) || zipImagesMap.get(`${codeKey}.png`);
          if (match) {
            photoDataUrl = match;
            photoMatchedFromZip = true;
          }
        }

        // Priority 3: match by NIS (e.g. "10301")
        if (!photoDataUrl && nis) {
          const nisKey = this.cleanKey(nis);
          const match = zipImagesMap.get(nisKey) || zipImagesMap.get(`${nisKey}.jpg`) || zipImagesMap.get(`${nisKey}.png`);
          if (match) {
            photoDataUrl = match;
            photoMatchedFromZip = true;
          }
        }
      }

      // Fallback default avatar if not matched
      if (!photoDataUrl) {
        photoDataUrl = jenis_kelamin === 'P'
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80';
      }

      const isExisting = existingCodeSet.has(kode) || existingNisSet.has(nis.toUpperCase());

      parsed.push({
        rowNumber,
        kode_anggota: kode,
        nis,
        nisn,
        nama,
        kelas,
        jenis_kelamin,
        no_hp,
        alamat,
        status,
        foto_filename: fotoFilename,
        photoDataUrl,
        photoMatchedFromZip,
        isExisting,
        isValid: errors.length === 0,
        errors
      });
    });

    return parsed;
  }

  /**
   * Parse and validate Book Excel rows, matching covers from ZIP map
   */
  parseBooksData(
    rawRows: Record<string, unknown>[],
    zipImagesMap: Map<string, string>
  ): ParsedBookRow[] {
    const existingBooks = db.getBooks();
    const existingCodeSet = new Set(existingBooks.map(b => b.kode_buku.toUpperCase()));
    const existingIsbnSet = new Set(existingBooks.map(b => b.isbn.replace(/-/g, '').toUpperCase()));

    let nextAutoBookNumber = 1;
    for (const b of existingBooks) {
      const match = b.kode_buku.match(/BK-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num >= nextAutoBookNumber) nextAutoBookNumber = num + 1;
      }
    }

    const parsed: ParsedBookRow[] = [];

    rawRows.forEach((row, idx) => {
      const rowNumber = idx + 2;

      const getVal = (...keys: string[]): string => {
        for (const k of keys) {
          for (const rowKey of Object.keys(row)) {
            if (rowKey.trim().toLowerCase() === k.trim().toLowerCase()) {
              const v = row[rowKey];
              return v !== undefined && v !== null ? String(v).trim() : '';
            }
          }
        }
        return '';
      };

      let kode = getVal('Kode Buku', 'kode_buku', 'kode', 'Kode').toUpperCase();
      const isbn = getVal('ISBN', 'isbn');
      const judul = getVal('Judul Buku', 'Judul', 'judul_buku', 'judul');
      const penulis = getVal('Penulis', 'penulis', 'Pengarang');
      const penerbit = getVal('Penerbit', 'penerbit');
      const tahunStr = getVal('Tahun Terbit', 'Tahun', 'tahun');
      const kategori = getVal('Kategori', 'kategori_nama', 'kategori') || 'Umum';
      const rak = getVal('Lokasi Rak', 'Rak', 'rak', 'nomor_rak') || 'R-01-A';
      const stokStr = getVal('Jumlah Stok', 'Stok', 'stok');
      const statusRaw = getVal('Status (Tersedia/Dipinjam/Perbaikan)', 'Status', 'status');
      const deskripsi = getVal('Deskripsi / Sinopsis', 'Deskripsi', 'deskripsi', 'sinopsis');
      const coverFilename = getVal('Nama File Cover di ZIP', 'Cover', 'cover');

      const errors: string[] = [];

      if (!judul) errors.push('Judul buku wajib diisi');
      if (!penulis) errors.push('Penulis buku wajib diisi');

      if (!kode) {
        kode = `BK-${String(nextAutoBookNumber++).padStart(5, '0')}`;
      }

      const tahun = parseInt(tahunStr, 10) || new Date().getFullYear();
      const stok = Math.max(1, parseInt(stokStr, 10) || 1);

      let status: BookStatus = 'Tersedia';
      if (statusRaw.toLowerCase().includes('pinjam')) status = 'Dipinjam';
      else if (statusRaw.toLowerCase().includes('rusak') || statusRaw.toLowerCase().includes('perbaikan')) status = 'Perbaikan';

      // Cover matching logic from ZIP
      let coverDataUrl: string | undefined = undefined;
      let coverMatchedFromZip = false;

      if (zipImagesMap.size > 0) {
        // Priority 1: filename in Excel
        if (coverFilename) {
          const directMatch = zipImagesMap.get(coverFilename.toLowerCase()) || zipImagesMap.get(this.cleanKey(coverFilename));
          if (directMatch) {
            coverDataUrl = directMatch;
            coverMatchedFromZip = true;
          }
        }

        // Priority 2: match by Book Code (e.g. "bk-00021")
        if (!coverDataUrl && kode) {
          const codeKey = this.cleanKey(kode);
          const match = zipImagesMap.get(codeKey) || zipImagesMap.get(`${codeKey}.jpg`) || zipImagesMap.get(`${codeKey}.png`);
          if (match) {
            coverDataUrl = match;
            coverMatchedFromZip = true;
          }
        }

        // Priority 3: match by ISBN
        if (!coverDataUrl && isbn) {
          const isbnKey = this.cleanKey(isbn);
          const match = zipImagesMap.get(isbnKey) || zipImagesMap.get(`${isbnKey}.jpg`) || zipImagesMap.get(`${isbnKey}.png`);
          if (match) {
            coverDataUrl = match;
            coverMatchedFromZip = true;
          }
        }
      }

      // Fallback: empty string (will gracefully use BookCover placeholder)
      if (!coverDataUrl) {
        coverDataUrl = '';
      }

      const cleanIsbn = isbn.replace(/-/g, '').toUpperCase();
      const isExisting = existingCodeSet.has(kode) || (cleanIsbn !== '' && existingIsbnSet.has(cleanIsbn));

      parsed.push({
        rowNumber,
        kode_buku: kode,
        isbn,
        judul,
        penulis,
        penerbit,
        tahun,
        kategori_nama: kategori,
        rak,
        stok,
        status,
        deskripsi,
        cover_filename: coverFilename,
        coverDataUrl,
        coverMatchedFromZip,
        isExisting,
        isValid: errors.length === 0,
        errors
      });
    });

    return parsed;
  }

  /**
   * Commit parsed members into database
   */
  commitMembers(
    rows: ParsedMemberRow[],
    updateExisting: boolean
  ): { importedCount: number; updatedCount: number; skippedCount: number } {
    const existing = db.getMembers();
    let imported = 0;
    let updated = 0;
    let skipped = 0;

    for (const r of rows) {
      if (!r.isValid) {
        skipped++;
        continue;
      }

      const matchIdx = existing.findIndex(
        m => m.kode_anggota.toUpperCase() === r.kode_anggota.toUpperCase() ||
             m.nis.toUpperCase() === r.nis.toUpperCase()
      );

      if (matchIdx >= 0) {
        if (updateExisting) {
          const old = existing[matchIdx];
          const updatedMember: Member = {
            ...old,
            nis: r.nis,
            nisn: r.nisn || old.nisn,
            nama: r.nama,
            kelas: r.kelas,
            jenis_kelamin: r.jenis_kelamin,
            no_hp: r.no_hp || old.no_hp,
            alamat: r.alamat || old.alamat,
            status: r.status,
            foto: r.photoMatchedFromZip ? (r.photoDataUrl || old.foto) : old.foto
          };
          db.saveMember(updatedMember);
          updated++;
        } else {
          skipped++;
        }
      } else {
        const newMember: Member = {
          id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          kode_anggota: r.kode_anggota,
          qr_token: r.kode_anggota,
          nis: r.nis,
          nisn: r.nisn,
          nama: r.nama,
          kelas: r.kelas,
          jenis_kelamin: r.jenis_kelamin,
          no_hp: r.no_hp,
          alamat: r.alamat,
          status: r.status,
          foto: r.photoDataUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
          created_at: new Date().toISOString()
        };
        db.saveMember(newMember);
        imported++;
      }
    }

    return { importedCount: imported, updatedCount: updated, skippedCount: skipped };
  }

  /**
   * Commit parsed books into database, auto-creating categories if needed
   */
  commitBooks(
    rows: ParsedBookRow[],
    updateExisting: boolean
  ): { importedCount: number; updatedCount: number; skippedCount: number } {
    const existingBooks = db.getBooks();
    const categories = db.getCategories();
    let imported = 0;
    let updated = 0;
    let skipped = 0;

    // Helper to find or create category
    const getOrCreateCategoryId = (catName: string): string => {
      const trimmed = (catName || 'Umum').trim();
      const found = categories.find(c => c.nama.toLowerCase() === trimmed.toLowerCase());
      if (found) return found.id;

      const newCatId = `cat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const newCat = {
        id: newCatId,
        nama: trimmed,
        created_at: new Date().toISOString()
      };
      db.saveCategory(newCat);
      categories.push(newCat);
      return newCatId;
    };

    for (const r of rows) {
      if (!r.isValid) {
        skipped++;
        continue;
      }

      const cleanIsbn = r.isbn.replace(/-/g, '').toUpperCase();
      const matchIdx = existingBooks.findIndex(
        b => b.kode_buku.toUpperCase() === r.kode_buku.toUpperCase() ||
             (cleanIsbn !== '' && b.isbn.replace(/-/g, '').toUpperCase() === cleanIsbn)
      );

      const catId = getOrCreateCategoryId(r.kategori_nama);

      if (matchIdx >= 0) {
        if (updateExisting) {
          const old = existingBooks[matchIdx];
          const updatedBook: Book = {
            ...old,
            isbn: r.isbn || old.isbn,
            judul: r.judul,
            penulis: r.penulis,
            penerbit: r.penerbit || old.penerbit,
            tahun: r.tahun || old.tahun,
            kategori_id: catId,
            rak: r.rak || old.rak,
            stok: r.stok,
            status: r.status,
            deskripsi: r.deskripsi || old.deskripsi,
            cover: r.coverMatchedFromZip ? (r.coverDataUrl || old.cover) : old.cover
          };
          db.saveBook(updatedBook);
          updated++;
        } else {
          skipped++;
        }
      } else {
        const newBook: Book = {
          id: `bk-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          kode_buku: r.kode_buku,
          qr_token: r.kode_buku,
          isbn: r.isbn,
          judul: r.judul,
          penulis: r.penulis,
          penerbit: r.penerbit,
          tahun: r.tahun,
          kategori_id: catId,
          rak: r.rak,
          stok: r.stok,
          status: r.status,
          deskripsi: r.deskripsi,
          cover: r.coverDataUrl || '',
          created_at: new Date().toISOString()
        };
        db.saveBook(newBook);
        imported++;
      }
    }

    return { importedCount: imported, updatedCount: updated, skippedCount: skipped };
  }
}

export const importService = new ImportService();
