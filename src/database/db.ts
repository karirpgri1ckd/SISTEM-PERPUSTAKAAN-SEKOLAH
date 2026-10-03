import {
  User,
  Member,
  Book,
  Category,
  Transaction,
  TransactionDetail,
  Settings
} from '../types';
import {
  SEED_CATEGORIES,
  SEED_SETTINGS,
  SEED_MEMBERS,
  SEED_BOOKS,
  SEED_USERS_RAW,
  SEED_TRANSACTIONS,
  SEED_TRANSACTION_DETAILS
} from './seedData';
import { hashPassword } from '../utils/crypto';

const STORAGE_PREFIX = 'perpustakaan_';
const KEYS = {
  USERS: `${STORAGE_PREFIX}users`,
  MEMBERS: `${STORAGE_PREFIX}members`,
  BOOKS: `${STORAGE_PREFIX}books`,
  CATEGORIES: `${STORAGE_PREFIX}categories`,
  TRANSACTIONS: `${STORAGE_PREFIX}transactions`,
  DETAILS: `${STORAGE_PREFIX}transaction_details`,
  SETTINGS: `${STORAGE_PREFIX}settings`,
  CURRENT_USER: `${STORAGE_PREFIX}current_user`,
  INITIALIZED: `${STORAGE_PREFIX}initialized_clean_v2`
};

export class Database {
  private static instance: Database;
  private changeListeners: (() => void)[] = [];

  private constructor() {
    this.initDatabase();
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public subscribe(listener: () => void): () => void {
    this.changeListeners.push(listener);
    return () => {
      this.changeListeners = this.changeListeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.changeListeners.forEach(l => {
      try {
        l();
      } catch (e) {
        console.error('Error in change listener', e);
      }
    });
  }

  public async initDatabase(forceReset = false) {
    if (typeof window === 'undefined') return;

    const initialized = localStorage.getItem(KEYS.INITIALIZED);
    if (!initialized || forceReset) {
      // Prepare users with hashed passwords
      const usersWithHashedPw: User[] = [];
      for (const u of SEED_USERS_RAW) {
        const hashed = await hashPassword(u.rawPassword);
        usersWithHashedPw.push({
          id: u.id,
          username: u.username,
          password: hashed,
          nama: u.nama,
          role: u.role,
          status: u.status,
          created_at: u.created_at
        });
      }

      localStorage.setItem(KEYS.USERS, JSON.stringify(usersWithHashedPw));
      localStorage.setItem(KEYS.MEMBERS, JSON.stringify(SEED_MEMBERS));
      localStorage.setItem(KEYS.BOOKS, JSON.stringify(SEED_BOOKS));
      localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(SEED_CATEGORIES));
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(SEED_SETTINGS));
      localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(SEED_TRANSACTIONS));
      localStorage.setItem(KEYS.DETAILS, JSON.stringify(SEED_TRANSACTION_DETAILS));
      localStorage.setItem(KEYS.INITIALIZED, 'true');

      this.notify();
    }
  }

  // --- Generic Storage Helpers ---
  private get<T>(key: string, defaultVal: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultVal;
    } catch {
      return defaultVal;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      this.notify();
    } catch (e) {
      console.error('Failed to set localStorage', e);
    }
  }

  // --- Users ---
  public getUsers(): User[] {
    return this.get<User[]>(KEYS.USERS, []);
  }

  public saveUser(user: User): void {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      users[idx] = user;
    } else {
      users.push(user);
    }
    this.set(KEYS.USERS, users);
  }

  public deleteUser(id: string): void {
    const users = this.getUsers().filter(u => u.id !== id);
    this.set(KEYS.USERS, users);
  }

  // --- Members ---
  public getMembers(): Member[] {
    return this.get<Member[]>(KEYS.MEMBERS, []);
  }

  public getMemberById(id: string): Member | undefined {
    return this.getMembers().find(m => m.id === id);
  }

  public getMemberByCodeOrQr(query: string): Member | undefined {
    const trimmed = query.trim().toUpperCase();
    return this.getMembers().find(
      m => m.kode_anggota.toUpperCase() === trimmed ||
           m.qr_token.toUpperCase() === trimmed ||
           m.nis.toUpperCase() === trimmed
    );
  }

  public saveMember(member: Member): void {
    const members = this.getMembers();
    const idx = members.findIndex(m => m.id === member.id);
    if (idx >= 0) {
      members[idx] = member;
    } else {
      members.unshift(member);
    }
    this.set(KEYS.MEMBERS, members);
  }

  public deleteMember(id: string): void {
    const members = this.getMembers().filter(m => m.id !== id);
    this.set(KEYS.MEMBERS, members);
  }

  public generateNextMemberCode(): string {
    const members = this.getMembers();
    let maxNum = 0;
    for (const m of members) {
      const match = m.kode_anggota.match(/AGT-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    return `AGT-${String(maxNum + 1).padStart(5, '0')}`;
  }

  // --- Books ---
  public getBooks(): Book[] {
    return this.get<Book[]>(KEYS.BOOKS, []);
  }

  public getBookById(id: string): Book | undefined {
    return this.getBooks().find(b => b.id === id);
  }

  public getBookByCodeOrQr(query: string): Book | undefined {
    const trimmed = query.trim().toUpperCase();
    return this.getBooks().find(
      b => b.kode_buku.toUpperCase() === trimmed ||
           b.qr_token.toUpperCase() === trimmed ||
           b.isbn.replace(/-/g, '') === trimmed.replace(/-/g, '')
    );
  }

  public saveBook(book: Book): void {
    const books = this.getBooks();
    const idx = books.findIndex(b => b.id === book.id);
    if (idx >= 0) {
      books[idx] = book;
    } else {
      books.unshift(book);
    }
    this.set(KEYS.BOOKS, books);
  }

  public saveMultipleBooks(booksToUpdate: Book[]): void {
    const books = this.getBooks();
    const map = new Map<string, Book>();
    books.forEach(b => map.set(b.id, b));
    booksToUpdate.forEach(b => map.set(b.id, b));
    this.set(KEYS.BOOKS, Array.from(map.values()));
  }

  public deleteBook(id: string): void {
    const books = this.getBooks().filter(b => b.id !== id);
    this.set(KEYS.BOOKS, books);
  }

  public generateNextBookCode(): string {
    const books = this.getBooks();
    let maxNum = 0;
    for (const b of books) {
      const match = b.kode_buku.match(/BK-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    return `BK-${String(maxNum + 1).padStart(5, '0')}`;
  }

  // --- Categories ---
  public getCategories(): Category[] {
    return this.get<Category[]>(KEYS.CATEGORIES, []);
  }

  public saveCategory(category: Category): void {
    const cats = this.getCategories();
    const idx = cats.findIndex(c => c.id === category.id);
    if (idx >= 0) {
      cats[idx] = category;
    } else {
      cats.push(category);
    }
    this.set(KEYS.CATEGORIES, cats);
  }

  public deleteCategory(id: string): void {
    const cats = this.getCategories().filter(c => c.id !== id);
    this.set(KEYS.CATEGORIES, cats);
  }

  // --- Transactions & Details ---
  public getTransactions(): Transaction[] {
    return this.get<Transaction[]>(KEYS.TRANSACTIONS, []);
  }

  public getTransactionById(id: string): Transaction | undefined {
    return this.getTransactions().find(t => t.id === id);
  }

  public saveTransaction(tx: Transaction): void {
    const list = this.getTransactions();
    const idx = list.findIndex(t => t.id === tx.id);
    if (idx >= 0) {
      list[idx] = tx;
    } else {
      list.unshift(tx);
    }
    this.set(KEYS.TRANSACTIONS, list);
  }

  public getTransactionDetails(): TransactionDetail[] {
    return this.get<TransactionDetail[]>(KEYS.DETAILS, []);
  }

  public saveTransactionDetails(details: TransactionDetail[]): void {
    const existing = this.getTransactionDetails();
    const map = new Map<string, TransactionDetail>();
    existing.forEach(d => map.set(d.id, d));
    details.forEach(d => map.set(d.id, d));
    this.set(KEYS.DETAILS, Array.from(map.values()));
  }

  public saveSingleTransactionDetail(detail: TransactionDetail): void {
    const details = this.getTransactionDetails();
    const idx = details.findIndex(d => d.id === detail.id);
    if (idx >= 0) {
      details[idx] = detail;
    } else {
      details.push(detail);
    }
    this.set(KEYS.DETAILS, details);
  }

  public generateNextTransactionCode(): string {
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const prefix = `PJM-${dateStr}-`;
    const txs = this.getTransactions().filter(t => t.kode_transaksi.startsWith(prefix));
    let max = 0;
    for (const t of txs) {
      const parts = t.kode_transaksi.split('-');
      if (parts.length >= 3) {
        const num = parseInt(parts[2], 10);
        if (!isNaN(num) && num > max) max = num;
      }
    }
    return `${prefix}${String(max + 1).padStart(4, '0')}`;
  }

  // --- Settings ---
  public getSettings(): Settings {
    return this.get<Settings>(KEYS.SETTINGS, SEED_SETTINGS);
  }

  public saveSettings(settings: Settings): void {
    this.set(KEYS.SETTINGS, settings);
  }

  // --- Current Logged In User ---
  public getCurrentUser(): User | null {
    return this.get<User | null>(KEYS.CURRENT_USER, null);
  }

  public setCurrentUser(user: User | null): void {
    this.set(KEYS.CURRENT_USER, user);
  }

  // --- Export & Import Backup ---
  public exportDatabaseJson(): string {
    const backup = {
      users: this.getUsers(),
      members: this.getMembers(),
      books: this.getBooks(),
      categories: this.getCategories(),
      transactions: this.getTransactions(),
      details: this.getTransactionDetails(),
      settings: this.getSettings(),
      exported_at: new Date().toISOString()
    };
    return JSON.stringify(backup, null, 2);
  }

  public importDatabaseJson(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.users && data.members && data.books && data.settings) {
        this.set(KEYS.USERS, data.users);
        this.set(KEYS.MEMBERS, data.members);
        this.set(KEYS.BOOKS, data.books);
        this.set(KEYS.CATEGORIES, data.categories || []);
        this.set(KEYS.TRANSACTIONS, data.transactions || []);
        this.set(KEYS.DETAILS, data.details || []);
        this.set(KEYS.SETTINGS, data.settings);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

export const db = Database.getInstance();
