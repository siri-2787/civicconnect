// contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

/* ---------------- TYPES ---------------- */

type Profile = {
  id: string;
  full_name: string | null;
  role: 'citizen' | 'officer' | 'admin' | null;
  department: string | null;
  created_at: string | null;
};

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role: 'citizen' | 'officer',
    department?: string
  ) => Promise<{ error: AuthError | null }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

/* ---------------- CONTEXT ---------------- */

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ---------------- PROVIDER ---------------- */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  /* -------- FETCH PROFILE -------- */
  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setProfile(data);
    } else {
      console.error('Profile fetch error:', error);
      setProfile(null);
    }
  };

  /* -------- REFRESH PROFILE -------- */
  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  /* -------- INIT AUTH -------- */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user ?? null;
      setUser(sessionUser);

      if (sessionUser) fetchProfile(sessionUser.id);

      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);

      if (sessionUser) {
        fetchProfile(sessionUser.id);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  /* -------- SIGN UP -------- */
  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: 'citizen' | 'officer',
    department?: string
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role, department: role === 'officer' ? department : null },
      },
    });

    if (!error && data.user) {
      // Insert a row into profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,            // Must match auth.users.id
          full_name: fullName,
          role,
          department: role === 'officer' ? department : null,
        });

      if (profileError) console.error('Profile insert error:', profileError);

      // Auto-login after signup
      await supabase.auth.signInWithPassword({ email, password });
      await fetchProfile(data.user.id);
    }

    return { error };
  };

  /* -------- SIGN IN -------- */
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  /* -------- SIGN OUT -------- */
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ---------------- HOOK ---------------- */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
