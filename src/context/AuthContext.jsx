
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

function isVerified(user) {
  return Boolean(user?.email_confirmed_at);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // CHECK EXISTING SUPABASE SESSION
  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const { data, error } =
          await supabase.auth.getUser();

        if (error && error.name !== 'AuthSessionMissingError') {
          console.error('Authentication error:', error);
        }

        if (!active) return;

        if (!isVerified(data?.user)) {
          setUser(null);
          setSession(null);
          return;
        }

        const { data: sessionData } =
          await supabase.auth.getSession();

        if (!active) return;

        setSession(sessionData.session);
        setUser(normalizeUser(data.user));
      } catch (error) {
        console.error('Session check failed:', error);

        if (active) {
          setUser(null);
          setSession(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    checkSession();

    const { data: listener } =
      supabase.auth.onAuthStateChange(
        (_event, newSession) => {
          if (!active) return;

          if (
            newSession?.user &&
            isVerified(newSession.user)
          ) {
            setSession(newSession);
            setUser(normalizeUser(newSession.user));
          } else {
            setSession(null);
            setUser(null);
          }
        }
      );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // LOGIN WITH EMAIL VERIFICATION CHECK
  const signIn = useCallback(async (email, password) => {
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    if (error) {
      if (
        error.message?.toLowerCase().includes(
          'email not confirmed'
        )
      ) {
        throw new Error(
          'Please verify your email before logging in.'
        );
      }

      throw error;
    }

    if (!isVerified(data.user)) {
      await supabase.auth.signOut();

      setUser(null);
      setSession(null);

      throw new Error(
        'Please verify your email before logging in.'
      );
    }

    const loggedInUser = normalizeUser(data.user);

    setSession(data.session);
    setUser(loggedInUser);

    return loggedInUser;
  }, []);

  // REGISTER WITH CENSORSHIP AND EMAIL VERIFICATION
  const signUp = useCallback(
    async (name, email, password) => {
      validateRegistration(name, email, password);

      const { data, error } =
        await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: name.trim(),
            },
            emailRedirectTo:
              `${window.location.origin}/login`,
          },
        });

      if (error) throw error;

      // Do not automatically log in after registration
      if (data.session) {
        await supabase.auth.signOut();
      }

      setUser(null);
      setSession(null);

      return {
        user: normalizeUser(data.user),
        needsEmailConfirmation: true,
        message:
          'Registration submitted! Please check your email and verify your account before logging in.',
      };
    },
    []
  );

  // LOGOUT
  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    setUser(null);
    setSession(null);
  }, []);

  // AUTH CONTEXT
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
