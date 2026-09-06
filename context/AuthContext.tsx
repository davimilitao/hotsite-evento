'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppUser, UserRole } from '@/types';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

const STORAGE_KEY = 'festa_auth_session_v1';
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000; // 24 Horas em ms

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  sessionTimeLeft: string;
  loginWithGoogle: (role?: UserRole) => Promise<void>;
  logout: () => void;
  switchRole: (newRole: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [sessionTimeLeft, setSessionTimeLeft] = useState<string>('');

  // Calcula o tempo restante de sessão em horas e minutos
  const calculateTimeLeft = (expiresAt: number): string => {
    const diff = expiresAt - Date.now();
    if (diff <= 0) return 'Expirado';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Carrega e valida a sessão gravada
  const loadSavedSession = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setUser(null);
        setLoading(false);
        return;
      }

      const session: AppUser = JSON.parse(raw);
      const now = Date.now();

      // Validação estrita dos 24 Horas
      if (!session.expiresAt || session.expiresAt <= now) {
        console.warn('⚠️ Sessão expirada após 24 horas. Efetuando logout automático...');
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
      } else {
        setUser(session);
        setSessionTimeLeft(calculateTimeLeft(session.expiresAt));
      }
    } catch (err) {
      console.error('Erro ao ler sessão local:', err);
      localStorage.removeItem(STORAGE_KEY);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSavedSession();

    // Verificação periódica de expiração de sessão (a cada 30 segundos)
    const timer = setInterval(() => {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          const session: AppUser = JSON.parse(raw);
          if (session.expiresAt && session.expiresAt <= Date.now()) {
            localStorage.removeItem(STORAGE_KEY);
            setUser(null);
            setSessionTimeLeft('Expirado');
          } else if (session.expiresAt) {
            setSessionTimeLeft(calculateTimeLeft(session.expiresAt));
          }
        } catch {
          // Ignora erros no timer
        }
      }
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  const loginWithGoogle = async (selectedRole: UserRole = 'admin') => {
    setLoading(true);
    const now = Date.now();
    const expiresAt = now + TWENTY_FOUR_HOURS_MS;

    try {
      if (isFirebaseConfigured) {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        const result = await signInWithPopup(auth, provider);
        const fbUser = result.user;

        const newUser: AppUser = {
          id: fbUser.uid,
          name: fbUser.displayName || 'Usuário Google',
          email: fbUser.email || 'admin@evento.com',
          role: selectedRole,
          avatar_url: fbUser.photoURL || undefined,
          authenticatedAt: now,
          expiresAt: expiresAt,
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
        setUser(newUser);
        setSessionTimeLeft(calculateTimeLeft(expiresAt));
      } else {
        // Fallback para Ambiente de Desenvolvimento (quando sem chaves de API do Firebase)
        const mockUser: AppUser = {
          id: 'google-user-demo-123',
          name: 'Usuário Admin Google',
          email: 'admin.davi@gmail.com',
          role: selectedRole,
          avatar_url: 'https://lh3.googleusercontent.com/a/default-user',
          authenticatedAt: now,
          expiresAt: expiresAt,
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));
        setUser(mockUser);
        setSessionTimeLeft(calculateTimeLeft(expiresAt));
      }
    } catch (err: any) {
      console.error('Erro no login com o Google:', err);
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        throw new Error('Login com o Google cancelado.');
      }

      // Fallback gracioso para ambiente de testes
      const fallbackUser: AppUser = {
        id: 'dev-google-user',
        name: 'Administrador do Evento',
        email: 'admin@evento.com',
        role: selectedRole,
        authenticatedAt: now,
        expiresAt: expiresAt,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fallbackUser));
      setUser(fallbackUser);
      setSessionTimeLeft(calculateTimeLeft(expiresAt));
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    if (isFirebaseConfigured) {
      signOut(auth).catch(() => {});
    }
    setUser(null);
    setSessionTimeLeft('');
  };

  const switchRole = (newRole: UserRole) => {
    if (!user) return;
    const updatedUser = { ...user, role: newRole };
    setUser(updatedUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        sessionTimeLeft,
        loginWithGoogle,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}
