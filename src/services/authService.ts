import { db } from '../database/db';
import { User } from '../types';
import { verifyPassword } from '../utils/crypto';

export class AuthService {
  async login(username: string, rawPassword: string): Promise<{ success: boolean; user?: User; error?: string }> {
    const users = db.getUsers();
    const user = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());

    if (!user) {
      return { success: false, error: 'Username tidak ditemukan.' };
    }

    if (user.status !== 'Aktif') {
      return { success: false, error: 'Akun Anda sedang dinonaktifkan. Hubungi Administrator.' };
    }

    const isMatch = await verifyPassword(rawPassword, user.password);
    if (!isMatch) {
      return { success: false, error: 'Password yang Anda masukkan salah.' };
    }

    db.setCurrentUser(user);
    return { success: true, user };
  }

  logout(): void {
    db.setCurrentUser(null);
  }

  getCurrentUser(): User | null {
    return db.getCurrentUser();
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'ADMIN';
  }
}

export const authService = new AuthService();
