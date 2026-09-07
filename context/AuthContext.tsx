'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppUser, UserRole } from '@/types';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { generateOTP, sendOTPEmail, OTP_EXPIRATION_MS } from '@/lib/otp';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

const STORAGE_KEY = 'festa_auth_session_v1';
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000; // 24 Horas em ms

interface AuthContextType {
  user: AppUser | null;
  pendingUser: AppUser | null;
  pendingOtp: string | null;
  otpExpiresAt: number | null;
  loading: boolean;
  sessionTimeLeft: string;
  loginWithGoogle: (role?: UserRole) => Promise<void>;
  loginWithDemo: (role?: UserRole, customEmail?: string) => Promise<void>;
  verifyOTP: (inputCode: string) => Promise<boolean>;
  resendOTP: () => Promise<string>;
  cancelOTP: () => void;
  logout: () => void;
  switchRole: (newRole: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [pendingUser, setPendingUser] = useState<AppUser | null>(null);
  const [pendingOtp, setPendingOtp] = useState<string | null>(null);
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
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

  /**
   * Dispara o fluxo de OTP (One-Time Password) por e-mail para um usuário candidato
   */
  const initiateOTPVerification = async (candidateUser: AppUser) => {
    // Gera o Código OTP Único de 6 Dígitos
    const code = generateOTP();
    const codeExpires = Date.now() + OTP_EXPIRATION_MS;

    // Dispara o envio do e-mail com o OTP
    await sendOTPEmail(candidateUser.email, code);

    setPendingUser(candidateUser);
    setPendingOtp(code);
    setOtpExpiresAt(codeExpires);
  };

  /**
   * ETAPA 1: Login com o Google -> Gera o OTP de 6 dígitos e envia por E-mail
   */
  const loginWithGoogle = async (selectedRole: UserRole = 'admin') => {
    setLoading(true);
    const now = Date.now();
    const expiresAt = now + TWENTY_FOUR_HOURS_MS;

    try {
      let candidateUser: AppUser;

      if (isFirebaseConfigured) {
        try {
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: 'select_account' });
          const result = await signInWithPopup(auth, provider);
          const fbUser = result.user;

          candidateUser = {
            id: fbUser.uid,
            name: fbUser.displayName || 'Usuário Google',
            email: fbUser.email || 'admin@evento.com',
            role: selectedRole,
            avatar_url: fbUser.photoURL || undefined,
            authenticatedAt: now,
            expiresAt: expiresAt,
          };
        } catch (fbErr: any) {
          console.warn('Firebase Google Auth popup falhou/cancelou, ativando fallback para OTP:', fbErr);
          if (fbErr?.code === 'auth/popup-blocked') {
            throw new Error('O popup do Google foi bloqueado pelo seu navegador. Por favor, permita popups ou use o botão Acesso Rápido.');
          }
          if (fbErr?.code === 'auth/popup-closed-by-user') {
            throw new Error('Login com o Google cancelado: a janela popup foi fechada antes de concluir.');
          }
          // Fallback gracioso de login
          candidateUser = {
            id: 'google-user-fallback-123',
            name: 'Administrador (Google)',
            email: 'militao46@gmail.com',
            role: selectedRole,
            avatar_url: 'https://lh3.googleusercontent.com/a/default-user',
            authenticatedAt: now,
            expiresAt: expiresAt,
          };
        }
      } else {
        // Modo Fallback de Desenvolvimento
        candidateUser = {
          id: 'google-user-demo-123',
          name: 'Administrador Evento',
          email: 'militao46@gmail.com',
          role: selectedRole,
          avatar_url: 'https://lh3.googleusercontent.com/a/default-user',
          authenticatedAt: now,
          expiresAt: expiresAt,
        };
      }

      await initiateOTPVerification(candidateUser);
    } catch (err: any) {
      console.error('Erro no login com o Google:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login Rápido / Demo sem depender de popup do navegador
   */
  const loginWithDemo = async (selectedRole: UserRole = 'admin', customEmail?: string) => {
    setLoading(true);
    const now = Date.now();
    const expiresAt = now + TWENTY_FOUR_HOURS_MS;

    try {
      const emailToUse = customEmail && customEmail.includes('@') ? customEmail.trim() : 'militao46@gmail.com';
      const candidateUser: AppUser = {
        id: 'google-user-demo-999',
        name: 'Administrador Demo',
        email: emailToUse,
        role: selectedRole,
        avatar_url: 'https://lh3.googleusercontent.com/a/default-user',
        authenticatedAt: now,
        expiresAt: expiresAt,
      };

      await initiateOTPVerification(candidateUser);
    } catch (err: any) {
      console.error('Erro no login Demo:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * ETAPA 2: Valida o Código OTP de 6 Dígitos digitado pelo usuário
   */
  const verifyOTP = async (inputCode: string): Promise<boolean> => {
    if (!pendingUser || !pendingOtp || !otpExpiresAt) {
      throw new Error('Sessão de verificação não encontrada. Por favor, faça login com o Google novamente.');
    }

    if (Date.now() > otpExpiresAt) {
      throw new Error('O código de verificação expirou (validade de 10 minutos). Clique em "Reenviar Código".');
    }

    const cleanInput = inputCode.trim();
    if (cleanInput !== pendingOtp) {
      throw new Error('Código de verificação incorreto. Confira a caixa de entrada do seu e-mail.');
    }

    // OTP Válido! Salva a sessão no LocalStorage e autoriza a entrada de 24 horas
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingUser));
    setUser(pendingUser);
    setSessionTimeLeft(calculateTimeLeft(pendingUser.expiresAt || Date.now() + TWENTY_FOUR_HOURS_MS));

    // Limpa a pendência
    setPendingUser(null);
    setPendingOtp(null);
    setOtpExpiresAt(null);

    return true;
  };

  /**
   * Reenvia um novo Código OTP de 6 Dígitos para o e-mail do usuário
   */
  const resendOTP = async (): Promise<string> => {
    if (!pendingUser) {
      throw new Error('Nenhum login pendente para reenvio de e-mail.');
    }

    const newCode = generateOTP();
    const newExpires = Date.now() + OTP_EXPIRATION_MS;

    await sendOTPEmail(pendingUser.email, newCode);

    setPendingOtp(newCode);
    setOtpExpiresAt(newExpires);

    return newCode;
  };

  /**
   * Cancela a etapa do OTP e retorna para a tela de Login
   */
  const cancelOTP = () => {
    setPendingUser(null);
    setPendingOtp(null);
    setOtpExpiresAt(null);
    if (isFirebaseConfigured) {
      signOut(auth).catch(() => {});
    }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    if (isFirebaseConfigured) {
      signOut(auth).catch(() => {});
    }
    setUser(null);
    setPendingUser(null);
    setPendingOtp(null);
    setOtpExpiresAt(null);
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
        pendingUser,
        pendingOtp,
        otpExpiresAt,
        loading,
        sessionTimeLeft,
        loginWithGoogle,
        loginWithDemo,
        verifyOTP,
        resendOTP,
        cancelOTP,
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
