import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setUnauthorizedHandler, tokenStore } from '../api/client.js';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // If a saved token exists, wait for the server to confirm it before deciding what to show
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));

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

  const value = useMemo(() => ({
    user,
    loading,
    async signIn(email, password) {
      const res = await api.login({ email, password });
      tokenStore.set(res.token);
      setUser(res.user);
    },
    async signUp(name, email, password) {
      const res = await api.register({ name, email, password });
      tokenStore.set(res.token);
      setUser(res.user);
    },
    signOut() {
      api.logout().catch(() => {}); // best effort; the local session ends either way
      clearSession();
    },
  }), [user, loading, clearSession]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
