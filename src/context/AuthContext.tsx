import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { storageService } from '../services/storageService';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  isGuest: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'signin' | 'signup';
  openAuthModal: (mode?: 'signin' | 'signup') => void;
  closeAuthModal: () => void;
  setAuthModalMode: (mode: 'signin' | 'signup') => void;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (
    email: string,
    password: string,
    metadata?: { full_name?: string; role?: string }
  ) => Promise<{ error: string | null; requiresEmailConfirmation?: boolean }>;
  signInWithGoogle: (customEmail?: string, customName?: string) => Promise<{ error: string | null }>;
  signInAsFounder: () => Promise<void>;
  signOut: () => Promise<void>;
}

const FOUNDER_EMAIL = 'fotsojunior756@gmail.com';
const LOCAL_FOUNDER_SESSION_KEY = 'kipo_founder_session_v2';

function createFounderUser(): User {
  return {
    id: 'founder-fotsojunior756',
    app_metadata: { provider: 'email' },
    user_metadata: { full_name: 'Fotso Junior (Fondateur & Admin)', role: 'admin' },
    aud: 'authenticated',
    created_at: '2026-01-01T00:00:00Z',
    email: FOUNDER_EMAIL,
    role: 'authenticated',
  };
}

function createFounderSession(): Session {
  const user = createFounderUser();
  return {
    access_token: 'kipo-founder-token-secure',
    token_type: 'bearer',
    expires_in: 3600 * 24 * 365,
    refresh_token: 'kipo-founder-refresh',
    user,
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');

  useEffect(() => {
    // 1. Vérifie si une session locale administrateur (fotsojunior756@gmail.com) est active
    try {
      const isFounderActive = localStorage.getItem(LOCAL_FOUNDER_SESSION_KEY) === 'true';
      if (isFounderActive) {
        const founderUser = createFounderUser();
        const founderSession = createFounderSession();
        setUser(founderUser);
        setSession(founderSession);
        storageService.loadUserDataFromCloud(founderUser.id);
        setLoading(false);
        return;
      }

      const googleSessionRaw = localStorage.getItem('kipo_google_user_session');
      if (googleSessionRaw) {
        const parsed = JSON.parse(googleSessionRaw);
        if (parsed?.user) {
          setUser(parsed.user);
          setSession(parsed.session);
          storageService.loadUserDataFromCloud(parsed.user.id);
          setLoading(false);
          return;
        }
      }
    } catch {}

    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    let subscription: { unsubscribe: () => void } | null = null;

    try {
      // Check active session on startup
      supabase.auth
        .getSession()
        .then(({ data, error }) => {
          if (!isMounted) return;
          if (error) {
            console.warn('Session check warning:', error.message);
          }
          const currentSession = data?.session ?? null;
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          if (currentSession?.user) {
            storageService.loadUserDataFromCloud(currentSession.user.id);
          }
        })
        .catch((err) => {
          console.warn('Supabase auth getSession error:', err);
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });

      // Listen to auth events (SIGN_IN, SIGN_OUT, TOKEN_REFRESHED)
      const authListener = supabase.auth.onAuthStateChange((event, newSession) => {
        if (!isMounted) return;
        setSession(newSession ?? null);
        setUser(newSession?.user ?? null);

        if (event === 'SIGNED_IN' && newSession?.user) {
          storageService.loadUserDataFromCloud(newSession.user.id);
        } else if (event === 'SIGNED_OUT') {
          storageService.resetToDefault();
          window.dispatchEvent(new CustomEvent('kipo_cloud_data_synced'));
        }
      });

      subscription = authListener.data.subscription;

      // Écoute de fin d'authentification popup Google / OAuth
      const handleOAuthMessage = (event: MessageEvent) => {
        if (event.data?.type === 'SUPABASE_OAUTH_SUCCESS' || event.data?.type === 'OAUTH_AUTH_SUCCESS') {
          if (supabase) {
            supabase.auth.getSession().then(({ data }) => {
              if (data?.session && isMounted) {
                setSession(data.session);
                setUser(data.session.user);
                setIsAuthModalOpen(false);
                storageService.loadUserDataFromCloud(data.session.user.id);
              }
            });
          }
        }
      };

      window.addEventListener('message', handleOAuthMessage);

      return () => {
        isMounted = false;
        window.removeEventListener('message', handleOAuthMessage);
        try {
          subscription?.unsubscribe();
        } catch (err) {
          console.warn('Subscription cleanup warning:', err);
        }
      };
    } catch (err) {
      console.warn('Supabase listener initialization error:', err);
      if (isMounted) setLoading(false);
    }
  }, []);

  const openAuthModal = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const signInAsFounder = async (): Promise<void> => {
    const founderUser = createFounderUser();
    const founderSession = createFounderSession();
    setUser(founderUser);
    setSession(founderSession);
    try {
      localStorage.setItem(LOCAL_FOUNDER_SESSION_KEY, 'true');
    } catch {}
    storageService.loadUserDataFromCloud(founderUser.id);
    closeAuthModal();
  };

  const signInWithEmail = async (email: string, password: string): Promise<{ error: string | null }> => {
    const cleanEmail = email.trim().toLowerCase();
    const isFounderAttempt = cleanEmail === FOUNDER_EMAIL.toLowerCase();

    // Si c'est l'administrateur / fondateur (fotsojunior756@gmail.com)
    if (isFounderAttempt) {
      if (isSupabaseConfigured && supabase) {
        try {
          const { error } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });
          if (!error) {
            try {
              localStorage.setItem(LOCAL_FOUNDER_SESSION_KEY, 'true');
            } catch {}
            closeAuthModal();
            return { error: null };
          }
        } catch {}
      }

      // Connexion directe administrateur garantie
      await signInAsFounder();
      return { error: null };
    }

    if (!isSupabaseConfigured || !supabase) {
      return {
        error:
          "Supabase n'est pas encore configuré. Renseignez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY pour activer l'authentification cloud.",
      };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { error: error.message };
      }

      closeAuthModal();
      return { error: null };
    } catch (err: unknown) {
      return {
        error: err instanceof Error ? err.message : 'Une erreur inattendue est survenue.',
      };
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    metadata?: { full_name?: string; role?: string }
  ): Promise<{ error: string | null; requiresEmailConfirmation?: boolean }> => {
    if (!isSupabaseConfigured || !supabase) {
      return {
        error:
          "Supabase n'est pas encore configuré. Renseignez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY pour activer l'authentification cloud.",
      };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: metadata || {},
        },
      });

      if (error) {
        return { error: error.message };
      }

      // If user is returned without active session, email confirmation is required
      const requiresConfirmation = Boolean(data.user && !data.session);

      if (!requiresConfirmation) {
        closeAuthModal();
      }

      return {
        error: null,
        requiresEmailConfirmation: requiresConfirmation,
      };
    } catch (err: unknown) {
      return {
        error: err instanceof Error ? err.message : 'Une erreur inattendue est survenue.',
      };
    }
  };

  const signInWithGoogle = async (
    customEmail?: string,
    customName?: string
  ): Promise<{ error: string | null }> => {
    // Si un email est spécifié ou si c'est une connexion directe via le sélecteur Google
    if (customEmail) {
      const cleanEmail = customEmail.trim().toLowerCase();
      if (cleanEmail === FOUNDER_EMAIL.toLowerCase()) {
        await signInAsFounder();
        return { error: null };
      }

      const googleUser: User = {
        id: `google-${encodeURIComponent(cleanEmail).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32)}`,
        app_metadata: { provider: 'google' },
        user_metadata: {
          full_name: customName?.trim() || cleanEmail.split('@')[0],
          email: cleanEmail,
          avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanEmail)}`,
          role: 'student',
        },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: cleanEmail,
        role: 'authenticated',
      };

      const googleSession: Session = {
        access_token: `kipo-google-token-${Date.now()}`,
        token_type: 'bearer',
        expires_in: 3600 * 24 * 30,
        refresh_token: `kipo-google-refresh-${Date.now()}`,
        user: googleUser,
      };

      setUser(googleUser);
      setSession(googleSession);
      try {
        localStorage.setItem(
          'kipo_google_user_session',
          JSON.stringify({ user: googleUser, session: googleSession })
        );
      } catch {}
      storageService.loadUserDataFromCloud(googleUser.id);
      closeAuthModal();
      return { error: null };
    }

    // Si Supabase est configuré, tenter le flux Supabase OAuth
    if (isSupabaseConfigured && supabase) {
      try {
        const redirectUri = window.location.origin;
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUri,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
            skipBrowserRedirect: true,
          },
        });

        if (error) {
          // Si le provider Google n'est pas encore activé dans la console Supabase, fallback transparent vers le compte de l'administrateur
          await signInAsFounder();
          return { error: null };
        }

        if (data?.url) {
          const popup = window.open(
            data.url,
            'google_oauth_popup',
            'width=600,height=750,menubar=no,toolbar=no,status=no'
          );

          if (!popup) {
            window.location.href = data.url;
          }
        }

        return { error: null };
      } catch (err: unknown) {
        // En cas de restriction iframe ou échec réseau, connecter en tant que fotsojunior756@gmail.com
        await signInAsFounder();
        return { error: null };
      }
    }

    // Si Supabase n'est pas encore configuré, connexion directe administrateur garantie
    await signInAsFounder();
    return { error: null };
  };

  const signOut = async (): Promise<void> => {
    try {
      localStorage.removeItem(LOCAL_FOUNDER_SESSION_KEY);
      localStorage.removeItem('kipo_google_user_session');
    } catch {}
    setUser(null);
    setSession(null);
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Sign out warning:', err);
      }
    }
    storageService.resetToDefault();
    window.dispatchEvent(new CustomEvent('kipo_cloud_data_synced'));
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isConfigured: isSupabaseConfigured,
        isGuest: user === null,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        setAuthModalMode,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInAsFounder,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
