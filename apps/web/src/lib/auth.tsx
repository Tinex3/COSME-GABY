import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import api from './api';
import { User } from './types';

interface AuthCtx {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; nombre: string; roles: string[] }) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  isRole: (role: string) => boolean;
}

const Ctx = createContext<AuthCtx>(null as any);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('cosmetia_token'));

  const refresh = async () => {
    const t = localStorage.getItem('cosmetia_token');
    if (!t) return;
    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
    } catch {
      localStorage.removeItem('cosmetia_token');
      setToken(null);
      setUser(null);
    }
  };

  useEffect(() => {
    if (token) refresh();
  }, [token]);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('cosmetia_token', data.accessToken);
    setToken(data.accessToken);
    setUser(data.user);
    await refresh();
  };

  const register = async (payload: { email: string; password: string; nombre: string; roles: string[] }) => {
    const { data } = await api.post('/auth/register', payload);
    localStorage.setItem('cosmetia_token', data.accessToken);
    setToken(data.accessToken);
    setUser(data.user);
    await refresh();
  };

  const logout = () => {
    localStorage.removeItem('cosmetia_token');
    setToken(null);
    setUser(null);
  };

  const isRole = (role: string) => !!user?.roles?.includes(role);

  return (
    <Ctx.Provider value={{ user, token, login, register, logout, refresh, isRole }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
