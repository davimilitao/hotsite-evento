'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppUser, UserRole } from '@/types';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { getEventConfig } from '@/lib/db';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

const STORAGE_KEY = 'festa_auth_session_v1';
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000; // 24 Horas em ms

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  sessionTimeLeft: string;
  loginWithGoogle: (role?: UserRole, inputToken?: string) => Promise<void>;
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

  const loginWithGoogle = async (selectedRole: UserRole = 'admin', inputToken: string = '') => {
    setLoading(true);
    const now = Date.now();
    const expiresAt = now + TWENTY_FOUR_HOURS_MS;

    try {
      // 1. Busca as configurações oficiais do evento para obter o Token de Acesso e a Whitelist de E-mails
      const eventConfig = await getEventConfig();
      const validToken = (eventConfig.access_token || 'FERNANDA40').trim().toUpperCase();
      const allowedEmails = (eventConfig.allowed_emails || []).map((e) => e.trim().toLowerCase());
      const cleanInputToken = inputToken.trim().toUpperCase();

      if (isFirebaseConfigured) {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        const result = await signInWithPopup(auth, provider);
        const fbUser = result.user;
        const userEmail = (fbUser.email || '').toLowerCase();

        // 2. Validação: O Token deve ser válido OU o e-mail deve estar na Whitelist autorizada
        const isEmailAllowed = userEmail && allowedEmails.includes(userEmail);
        const isTokenValid = cleanInputToken === validToken;

        if (!isTokenValid && !isEmailAllowed) {
          // Desconecta o usuário do Firebase se a trava falhar
          await signOut(auth).catch(() => {});
          throw new Error('Código Token de Acesso do Evento incorreto. Insira o token válido ou solicite ao anfitrião.');
        }

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
        // Modo Fallback de Desenvolvimento (valida o Token inserido)
        const isTokenValid = cleanInputToken === validToken || cleanInputToken === 'FERNANDA40' || cleanInputToken === 'ADMIN';

        if (!isTokenValid) {
          throw new Error(`Código Token incorreto. Dica de Teste: ${validToken}`);
        }

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
        throw new Error('Login com o Google cancelado pelo usuário.');
      }
      throw err;
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
