import { create } from 'zustand';
import { Employee } from '@ponto/types';
import { authApi, tokens } from '../services/api';

interface AuthState {
  user:    Employee | null;
  loading: boolean;
  login:   (email: string, password: string) => Promise<void>;
  logout:  () => Promise<void>;
  restore: () => Promise<void>;
}

function decodeJwt(token: string): Record<string, unknown> {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return {};
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user:    null,
  loading: true,

  login: async (email, password) => {
    const data    = await authApi.login(email, password);
    const payload = decodeJwt(data.accessToken);
    // Optimistically set partial user, then fetch full profile
    set({
      user: {
        id:        String(payload.sub ?? ''),
        email:     String(payload.email ?? email),
        role:      payload.role as any,
        name:      '',
        active:    true,
        createdAt: '',
        updatedAt: '',
      },
    });
    try {
      const full = await authApi.me();
      set({ user: full });
      localStorage.setItem('pt_user', JSON.stringify(full));
    } catch {
      // partial user is fine for routing
    }
  },

  logout: async () => {
    await authApi.logout();
    localStorage.removeItem('pt_user');
    set({ user: null });
  },

  restore: async () => {
    const access = tokens.access;
    if (!access) { set({ loading: false }); return; }
    try {
      const payload = decodeJwt(access);
      const exp     = Number(payload.exp ?? 0);
      if (exp * 1000 < Date.now()) throw new Error('expired');

      const cached = localStorage.getItem('pt_user');
      if (cached) set({ user: JSON.parse(cached) });

      const fresh = await authApi.me();
      set({ user: fresh });
      localStorage.setItem('pt_user', JSON.stringify(fresh));
    } catch {
      tokens.clear();
      localStorage.removeItem('pt_user');
    } finally {
      set({ loading: false });
    }
  },
}));
