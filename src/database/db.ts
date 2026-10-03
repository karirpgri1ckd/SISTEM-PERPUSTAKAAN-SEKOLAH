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
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { firestore } from './firebase';
import { handleFirestoreError, OperationType } from './firestoreErrors';

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
  INITIALIZED: `${STORAGE_PREFIX}initialized_clean_v3`
};

export class Database {
  private static instance: Database;
  private changeListeners: (() => void)[] = [];
  private isFirestoreInitialized = false;

  private constructor() {
    this.initDatabase();
    this.initFirestoreSync();
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

  /**
   * Initialize Local Storage Cache with Defaults
   */
  public async initDatabase(forceReset = false) {
    if (typeof window === 'undefined') return;

    const initialized = localStorage.getItem(KEYS.INITIALIZED);
    if (!initialized || forceReset) {
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

      // If existing local settings exist from previous version, preserve them!
      const oldSettings = localStorage.getItem(`${STORAGE_PREFIX}settings`);
      const initialSettings = oldSettings ? JSON.parse(oldSettings) : SEED_SETTINGS;

      localStorage.setItem(KEYS.USERS, JSON.stringify(usersWithHashedPw));
      localStorage.setItem(KEYS.MEMBERS, localStorage.getItem(`${STORAGE_PREFIX}members`) || JSON.stringify(SEED_MEMBERS));
      localStorage.setItem(KEYS.BOOKS, localStorage.getItem(`${STORAGE_PREFIX}books`) || JSON.stringify(SEED_BOOKS));
      localStorage.setItem(KEYS.CATEGORIES, localStorage.getItem(`${STORAGE_PREFIX}categories`) || JSON.stringify(SEED_CATEGORIES));
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(initialSettings));
      localStorage.setItem(KEYS.TRANSACTIONS, localStorage.getItem(`${STORAGE_PREFIX}transactions`) || JSON.stringify(SEED_TRANSACTIONS));
      localStorage.setItem(KEYS.DETAILS, localStorage.getItem(`${STORAGE_PREFIX}transaction_details`) || JSON.stringify(SEED_TRANSACTION_DETAILS));
      localStorage.setItem(KEYS.INITIALIZED, 'true');

      this.notify();
    }
  }

  /**
   * Real-time Synchronization with Firebase Firestore
   */
  private initFirestoreSync() {
    if (typeof window === 'undefined' || !firestore) return;
    if (this.isFirestoreInitialized) return;
    this.isFirestoreInitialized = true;

    // 1. Settings listener
    try {
      const settingsRef = doc(firestore, 'settings', 'config');
      onSnapshot(
        settingsRef,
        snapshot => {
          if (snapshot.exists()) {
            const data = snapshot.data() as Settings;
            localStorage.setItem(KEYS.SETTINGS, JSON.stringify(data));
            this.notify();
          } else {
            // First time cloud upload if local settings exist
            const localSettings = this.getSettings();
            if (localSettings) {
              setDoc(settingsRef, localSettings).catch(err => {
                console.warn('Initial cloud settings upload failed:', err);
              });
            }
          }
        },
        error => {
          handleFirestoreError(error, OperationType.GET, 'settings/config');
        }
      );
    } catch (e) {
      console.warn('Settings listener init error:', e);
    }

    // 2. Members listener
    try {
      const membersRef = collection(firestore, 'members');
      onSnapshot(
        membersRef,
        snapshot => {
          if (!snapshot.empty) {
            const cloudMembers = snapshot.docs.map(d => d.data() as Member);
            localStorage.setItem(KEYS.MEMBERS, JSON.stringify(cloudMembers));
            this.notify();
          } else {
            // If cloud is empty but local has members, sync to cloud
            const localMembers = this.getMembers();
            if (localMembers.length > 0) {
              localMembers.forEach(m => {
                setDoc(doc(firestore, 'members', m.id), m).catch(() => {});
              });
            }
          }
        },
        error => {
          handleFirestoreError(error, OperationType.GET, 'members');
        }
      );
    } catch (e) {
      console.warn('Members listener init error:', e);
    }

    // 3. Books listener
    try {
      const booksRef = collection(firestore, 'books');
      onSnapshot(
        booksRef,
        snapshot => {
          if (!snapshot.empty) {
            const cloudBooks = snapshot.docs.map(d => d.data() as Book);
            localStorage.setItem(KEYS.BOOKS, JSON.stringify(cloudBooks));
            this.notify();
          } else {
            const localBooks = this.getBooks();
            if (localBooks.length > 0) {
              localBooks.forEach(b => {
                setDoc(doc(firestore, 'books', b.id), b).catch(() => {});
              });
            }
          }
        },
        error => {
          handleFirestoreError(error, OperationType.GET, 'books');
        }
      );
    } catch (e) {
      console.warn('Books listener init error:', e);
    }

    // 4. Categories listener
    try {
      const catRef = collection(firestore, 'categories');
      onSnapshot(
        catRef,
        snapshot => {
          if (!snapshot.empty) {
            const cloudCats = snapshot.docs.map(d => d.data() as Category);
            localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(cloudCats));
            this.notify();
          } else {
            const localCats = this.getCategories();
            if (localCats.length > 0) {
              localCats.forEach(c => {
                setDoc(doc(firestore, 'categories', c.id), c).catch(() => {});
              });
            }
          }
        },
        error => {
          handleFirestoreError(error, OperationType.GET, 'categories');
        }
      );
    } catch (e) {
      console.warn('Categories listener init error:', e);
    }

    // 5. Transactions listener
    try {
      const txRef = collection(firestore, 'transactions');
      onSnapshot(
        txRef,
        snapshot => {
          if (!snapshot.empty) {
            const cloudTx = snapshot.docs.map(d => d.data() as Transaction);
            localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(cloudTx));
            this.notify();
          }
        },
        error => {
          handleFirestoreError(error, OperationType.GET, 'transactions');
        }
      );
    } catch (e) {
      console.warn('Transactions listener init error:', e);
    }

    // 6. Transaction Details listener
    try {
      const detailsRef = collection(firestore, 'transaction_details');
      onSnapshot(
        detailsRef,
        snapshot => {
          if (!snapshot.empty) {
            const cloudDetails = snapshot.docs.map(d => d.data() as TransactionDetail);
            localStorage.setItem(KEYS.DETAILS, JSON.stringify(cloudDetails));
            this.notify();
          }
        },
        error => {
          handleFirestoreError(error, OperationType.GET, 'transaction_details');
        }
      );
    } catch (e) {
      console.warn('Transaction details listener init error:', e);
    }

    // 7. Users listener
    try {
      const usersRef = collection(firestore, 'users');
      onSnapshot(
        usersRef,
        snapshot => {
          if (!snapshot.empty) {
            const cloudUsers = snapshot.docs.map(d => d.data() as User);
            localStorage.setItem(KEYS.USERS, JSON.stringify(cloudUsers));
            this.notify();
          } else {
            const localUsers = this.getUsers();
            if (localUsers.length > 0) {
              localUsers.forEach(u => {
                setDoc(doc(firestore, 'users', u.id), u).catch(() => {});
              });
            }
          }
        },
        error => {
          handleFirestoreError(error, OperationType.GET, 'users');
        }
      );
    } catch (e) {
      console.warn('Users listener init error:', e);
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

    // Sync to Firestore
    try {
      setDoc(doc(firestore, 'users', user.id), user).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.id}`);
      });
    } catch (e) {
      console.warn('Failed to sync user to Firestore:', e);
    }
  }

  public deleteUser(id: string): void {
    const users = this.getUsers().filter(u => u.id !== id);
    this.set(KEYS.USERS, users);

    try {
      deleteDoc(doc(firestore, 'users', id)).catch(err => {
        handleFirestoreError(err, OperationType.DELETE, `users/${id}`);
      });
    } catch (e) {
      console.warn('Failed to delete user in Firestore:', e);
    }
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
           (m.qr_token && m.qr_token.toUpperCase() === trimmed) ||
           (m.nis && m.nis.toUpperCase() === trimmed)
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

    try {
      setDoc(doc(firestore, 'members', member.id), member).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, `members/${member.id}`);
      });
    } catch (e) {
      console.warn('Failed to sync member to Firestore:', e);
    }
  }

  public deleteMember(id: string): void {
    const members = this.getMembers().filter(m => m.id !== id);
    this.set(KEYS.MEMBERS, members);

    try {
      deleteDoc(doc(firestore, 'members', id)).catch(err => {
        handleFirestoreError(err, OperationType.DELETE, `members/${id}`);
      });
    } catch (e) {
      console.warn('Failed to delete member in Firestore:', e);
    }
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
           (b.qr_token && b.qr_token.toUpperCase() === trimmed) ||
           (b.isbn && b.isbn.replace(/-/g, '') === trimmed.replace(/-/g, ''))
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

    try {
      setDoc(doc(firestore, 'books', book.id), book).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, `books/${book.id}`);
      });
    } catch (e) {
      console.warn('Failed to sync book to Firestore:', e);
    }
  }

  public saveMultipleBooks(booksToUpdate: Book[]): void {
    const books = this.getBooks();
    const map = new Map<string, Book>();
    books.forEach(b => map.set(b.id, b));
    booksToUpdate.forEach(b => map.set(b.id, b));
    this.set(KEYS.BOOKS, Array.from(map.values()));

    try {
      booksToUpdate.forEach(book => {
        setDoc(doc(firestore, 'books', book.id), book).catch(err => {
          handleFirestoreError(err, OperationType.WRITE, `books/${book.id}`);
        });
      });
    } catch (e) {
      console.warn('Failed to sync multiple books to Firestore:', e);
    }
  }

  public deleteBook(id: string): void {
    const books = this.getBooks().filter(b => b.id !== id);
    this.set(KEYS.BOOKS, books);

    try {
      deleteDoc(doc(firestore, 'books', id)).catch(err => {
        handleFirestoreError(err, OperationType.DELETE, `books/${id}`);
      });
    } catch (e) {
      console.warn('Failed to delete book in Firestore:', e);
    }
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

    try {
      setDoc(doc(firestore, 'categories', category.id), category).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, `categories/${category.id}`);
      });
    } catch (e) {
      console.warn('Failed to sync category to Firestore:', e);
    }
  }

  public deleteCategory(id: string): void {
    const cats = this.getCategories().filter(c => c.id !== id);
    this.set(KEYS.CATEGORIES, cats);

    try {
      deleteDoc(doc(firestore, 'categories', id)).catch(err => {
        handleFirestoreError(err, OperationType.DELETE, `categories/${id}`);
      });
    } catch (e) {
      console.warn('Failed to delete category in Firestore:', e);
    }
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

    try {
      setDoc(doc(firestore, 'transactions', tx.id), tx).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, `transactions/${tx.id}`);
      });
    } catch (e) {
      console.warn('Failed to sync transaction to Firestore:', e);
    }
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

    try {
      details.forEach(detail => {
        setDoc(doc(firestore, 'transaction_details', detail.id), detail).catch(err => {
          handleFirestoreError(err, OperationType.WRITE, `transaction_details/${detail.id}`);
        });
      });
    } catch (e) {
      console.warn('Failed to sync transaction details to Firestore:', e);
    }
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

    try {
      setDoc(doc(firestore, 'transaction_details', detail.id), detail).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, `transaction_details/${detail.id}`);
      });
    } catch (e) {
      console.warn('Failed to sync detail to Firestore:', e);
    }
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
    const saved = this.get<Settings>(KEYS.SETTINGS, SEED_SETTINGS);
    return { ...SEED_SETTINGS, ...saved };
  }

  public saveSettings(settings: Settings): void {
    this.set(KEYS.SETTINGS, settings);

    try {
      setDoc(doc(firestore, 'settings', 'config'), settings).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, 'settings/config');
      });
    } catch (e) {
      console.warn('Failed to sync settings to Firestore:', e);
    }
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

        // Sync imported data to Firestore cloud
        this.saveSettings(data.settings);
        data.members.forEach((m: Member) => this.saveMember(m));
        data.books.forEach((b: Book) => this.saveBook(b));
        if (data.categories) data.categories.forEach((c: Category) => this.saveCategory(c));
        if (data.transactions) data.transactions.forEach((t: Transaction) => this.saveTransaction(t));
        if (data.details) this.saveTransactionDetails(data.details);

        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

export const db = Database.getInstance();
