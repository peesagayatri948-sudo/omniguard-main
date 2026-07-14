import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { seedDatabaseIfEmpty } from '../lib/seeding';

export type UserRole = 'developer' | 'manager' | 'ciso';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  orgId?: string;
  orgStatus: 'active' | 'pending' | 'none' | 'declined';
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshUserOrg: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const MOCK_SESSION_KEY = 'omniguard_mock_session';

function emailToUuid(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0') +
              Math.abs(hash * 31).toString(16).padStart(8, '0') +
              Math.abs(hash * 37).toString(16).padStart(8, '0') +
              Math.abs(hash * 41).toString(16).padStart(8, '0');

  const padded = hex.slice(0, 32).padEnd(32, 'f');
  return `${padded.slice(0,8)}-${padded.slice(8,12)}-${padded.slice(12,16)}-${padded.slice(16,20)}-${padded.slice(20,32)}`;
}

function getMockSession(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(MOCK_SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function setMockSession(user: AuthUser | null) {
  if (user) {
    sessionStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(user));
  } else {
    sessionStorage.removeItem(MOCK_SESSION_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const resolveOrgStatus = async (userId: string): Promise<{ orgId?: string, role: UserRole, status: AuthUser['orgStatus'] }> => {
    if (!isSupabaseConfigured || !supabase) {
      return { role: 'developer', status: 'none' };
    }
    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select('organization_id, role, status')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('resolveOrgStatus query error:', error.message);
        return { role: 'developer', status: 'none' };
      }

      if (data) {
        let status: AuthUser['orgStatus'] = 'none';
        if (data.status === 'active') status = 'active';
        else if (data.status === 'pending' || data.status === 'invited') status = 'pending';
        else if (data.status === 'declined') status = 'declined';

        let role: UserRole = 'developer';
        if (data.role === 'owner') role = 'ciso';
        else if (data.role === 'admin' || data.role === 'manager') role = 'manager';

        return { orgId: data.organization_id, role, status };
      }

      return { role: 'developer', status: 'none' };
    } catch (err) {
      console.error('resolveOrgStatus failed:', err);
      return { role: 'developer', status: 'none' };
    }
  };

  const loadSession = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('getSession error:', error.message);
          setLoading(false);
          return;
        }
        if (data.session) {
          const meta = data.session.user.user_metadata;
          const orgInfo = await resolveOrgStatus(data.session.user.id);
          const u: AuthUser = {
            id: data.session.user.id,
            email: data.session.user.email ?? '',
            name: meta?.name ?? data.session.user.email?.split('@')[0] ?? 'User',
            role: orgInfo.role,
            orgId: orgInfo.orgId,
            orgStatus: orgInfo.status,
          };
          setUser(u);
          if (orgInfo.status === 'active') {
            seedDatabaseIfEmpty(supabase, u.id).catch((e) => console.error('Seeding failed:', e));
          }
        }
      } catch (err) {
        console.error('loadSession failed:', err);
      } finally {
        setLoading(false);
      }
    } else {
      setUser(getMockSession());
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    loadSession();

    if (isSupabaseConfigured && supabase) {
      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!mounted) return;
        // Do NOT await inside onAuthStateChange — it can deadlock.
        // Fire-and-forget; state updates when the promise resolves.
        if (session) {
          const meta = session.user.user_metadata;
          resolveOrgStatus(session.user.id).then((orgInfo) => {
            if (!mounted) return;
            const u: AuthUser = {
              id: session.user.id,
              email: session.user.email ?? '',
              name: meta?.name ?? session.user.email?.split('@')[0] ?? 'User',
              role: orgInfo.role,
              orgId: orgInfo.orgId,
              orgStatus: orgInfo.status,
            };
            setUser(u);
            if (orgInfo.status === 'active') {
              seedDatabaseIfEmpty(supabase, u.id).catch((e) => console.error('Seeding failed:', e));
            }
          }).catch((err) => {
            console.error('onAuthStateChange resolveOrgStatus failed:', err);
            if (mounted) setLoading(false);
          });
        } else {
          setUser(null);
          if (mounted) setLoading(false);
        }
      });
      return () => {
        mounted = false;
        listener.subscription.unsubscribe();
      };
    }
  }, []);

  const refreshUserOrg = async () => {
    if (user) {
      const orgInfo = await resolveOrgStatus(user.id);
      setUser((prev) => prev ? {
        ...prev,
        orgId: orgInfo.orgId,
        role: orgInfo.role,
        orgStatus: orgInfo.status
      } : null);
    }
  };

  const signIn: AuthContextValue['signIn'] = async (email, password) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        const meta = data.user?.user_metadata;
        const orgInfo = await resolveOrgStatus(data.user?.id);
        const u: AuthUser = {
          id: data.user?.id,
          email,
          name: meta?.name ?? email.split('@')[0],
          role: orgInfo.role,
          orgId: orgInfo.orgId,
          orgStatus: orgInfo.status,
        };
        setUser(u);
        return { error: null };
      } catch (err: any) {
        return { error: err.message || 'Sign in failed. Please check your credentials.' };
      }
    }
    return { error: 'Authentication is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' };
  };

  const signUp: AuthContextValue['signUp'] = async (email, password, name) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        });
        if (error) throw error;

        const u: AuthUser = {
          id: data.user?.id || emailToUuid(email),
          email,
          name,
          role: 'developer',
          orgStatus: 'none',
        };
        setUser(u);
        return { error: null };
      } catch (err: any) {
        return { error: err.message || 'Sign up failed. Please try again.' };
      }
    }
    return { error: 'Authentication is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' };
  };

  const signOut: AuthContextValue['signOut'] = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    } else {
      setMockSession(null);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, refreshUserOrg }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
