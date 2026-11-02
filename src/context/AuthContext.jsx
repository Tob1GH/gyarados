
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  api,
  tokenStore,
  setUnauthorizedHandler,
} from '../api/client.js';

import { validateRegistration } from '../utils/censorship.js';

const AuthCtx = createContext(null);

export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // CHECK EXISTING BACKEND SESSION
  useEffect(() => {
    let active = true;

    setUnauthorizedHandler(() => {
      tokenStore.clear();
      if (active) setUser(null);
    });

    async function checkSession() {
      try {
        if (!tokenStore.get()) {
          if (active) setUser(null);
          return;
        }

        const data = await api.me();

        if (active) {
          setUser(data.user ?? data);
        }
      } catch (error) {
        console.error('Session check failed:', error);
        tokenStore.clear();

        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    checkSession();

    return () => {
      active = false;
      setUnauthorizedHandler(null);
    };
  }, []);

  // LOGIN USING BACKEND API
  const signIn = useCallback(async (email, password) => {
    const data = await api.login({
      email,
      password,
    });

    if (!data.token) {
      throw new Error('Login failed: No token received.');
    }

    tokenStore.set(data.token);

    try {
      const profile = await api.me();
      const loggedInUser = profile.user ?? profile;

      setUser(loggedInUser);
      return loggedInUser;
    } catch (error) {
      tokenStore.clear();
      setUser(null);
      throw error;
    }
  }, []);

  // SIGN UP WITH CENSORSHIP
  const signUp = useCallback(async (name, email, password) => {
    validateRegistration(name, email, password);

    const data = await api.register({
      name,
      email,
      password,
    });

    if (data.token) {
      tokenStore.set(data.token);

      try {
        const profile = await api.me();
        const registeredUser = profile.user ?? profile;

        setUser(registeredUser);

        return {
          user: registeredUser,
          needsEmailConfirmation: false,
        };
      } catch (error) {
        tokenStore.clear();
        setUser(null);
        throw error;
      }
    }

    return {
      user: data.user ?? null,
      needsEmailConfirmation:
        data.needsEmailConfirmation ?? false,
    };
  }, []);

  // LOGOUT
  const signOut = useCallback(async () => {
    try {
      if (tokenStore.get()) {
        await api.logout();
      }
    } catch (error) {
      console.warn('Backend logout failed:', error);
    } finally {
      tokenStore.clear();
      setUser(null);
    }
  }, []);

  // AUTH CONTEXT
  const value = useMemo(
    () => ({
      user,
      session: null,
      loading,
      signIn,
      signUp,
      signOut,
    }),
    [user, loading, signIn, signUp, signOut]
  );

  return (
    <AuthCtx.Provider value={value}>
      {children}
    </AuthCtx.Provider>
  );
}
