
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { supabase } from '../lib/supabaseClient.js';
import { validateRegistration } from '../utils/censorship.js';

const AuthCtx = createContext(null);

export const useAuth = () => useContext(AuthCtx);

// Normalize Supabase user data
function normalizeUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name:
      user.user_metadata?.full_name ||
      user.email?.split('@')[0] ||
      'Member',
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // CHECK EXISTING SESSION
  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!mounted) return;

        setSession(nextSession);
        setUser(normalizeUser(nextSession?.user ?? null));
        setLoading(false);
      }
    );

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!mounted) return;

        if (error) {
          setSession(null);
          setUser(null);
        } else {
          setSession(data.session);
          setUser(
            normalizeUser(data.session?.user ?? null)
          );
        }

        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;

        setSession(null);
        setUser(null);
        setLoading(false);
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // LOGIN
  const signIn = useCallback(async (email, password) => {
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      throw error;
    }

    return normalizeUser(data.user);
  }, []);

  // SIGN UP WITH CENSORSHIP
  const signUp = useCallback(
    async (name, email, password) => {
      // Check for inappropriate words
      // in name, email, and password
      validateRegistration(name, email, password);

      // Proceed only if validation passes
      const { data, error } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            },
          },
        });

      if (error) {
        throw error;
      }

      return {
        user: normalizeUser(data.user),
        needsEmailConfirmation: !data.session,
      };
    },
    []
  );

  // LOGOUT
  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  }, []);

  // AUTH CONTEXT VALUES
  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      signIn,
      signUp,
      signOut,
    }),
    [
      user,
      session,
      loading,
      signIn,
      signUp,
      signOut,
    ]
  );

  return (
    <AuthCtx.Provider value={value}>
      {children}
    </AuthCtx.Provider>
  );
}
