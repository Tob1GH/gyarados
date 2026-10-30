
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
<<<<<<< Updated upstream
import { supabase } from '../lib/supabaseClient.js';
=======

import {
  api,
  setUnauthorizedHandler,
  tokenStore,
} from '../api/client.js';

import { validateRegistration } from '../utils/censorship.js';
>>>>>>> Stashed changes

const AuthCtx = createContext(null);

export const useAuth = () => useContext(AuthCtx);

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
<<<<<<< Updated upstream
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;

      setSession(nextSession);
      setUser(normalizeUser(nextSession?.user ?? null));
      setLoading(false);
    });

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!mounted) return;

        if (error) {
          setSession(null);
          setUser(null);
        } else {
          setSession(data.session);
          setUser(normalizeUser(data.session?.user ?? null));
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

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return normalizeUser(data.user);
  }, []);

  const signUp = useCallback(async (name, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });

    if (error) throw error;

    return {
      user: normalizeUser(data.user),
      needsEmailConfirmation: !data.session,
    };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      signIn,
      signUp,
      signOut,
    }),
    [user, session, loading, signIn, signUp, signOut]
=======

  // Check existing login session
  const [loading, setLoading] = useState(
    Boolean(tokenStore.get())
  );

  const clearSession = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(clearSession);

    if (!tokenStore.get()) return;

    api.me()
      .then(setUser)
      .catch(clearSession)
      .finally(() => setLoading(false));
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user,
      loading,

      // LOGIN
      async signIn(email, password) {
        const res = await api.login({
          email,
          password,
        });

        tokenStore.set(res.token);
        setUser(res.user);
      },

      // SIGN UP WITH CENSORSHIP
      async signUp(name, email, password) {
        // Check inappropriate words before registration
        validateRegistration(name, email, password);

        // Only register if validation passes
        const res = await api.register({
          name,
          email,
          password,
        });

        tokenStore.set(res.token);
        setUser(res.user);
      },

      // LOGOUT
      signOut() {
        api.logout().catch(() => {});

        clearSession();
      },
    }),
    [user, loading, clearSession]
>>>>>>> Stashed changes
  );

  return (
    <AuthCtx.Provider value={value}>
      {children}
    </AuthCtx.Provider>
  );
}
