import { createContext, useContext, useEffect, useState } from 'react';
import { fetchAuthSession, getCurrentUser, signOut } from 'aws-amplify/auth';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  async function refresh() {
    try {
      const [current, session] = await Promise.all([getCurrentUser(), fetchAuthSession()]);
      setUser({ ...current, email: session.tokens?.idToken?.payload?.email || '' });
    } catch { setUser(null); } finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, []);
  async function logout() { await signOut(); setUser(null); }
  return <AuthContext.Provider value={{ user, loading, refresh, logout }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);

