import React, { createContext, useEffect, useMemo, useState } from 'react';
import api, { setUnauthorizedHandler } from '../api/api';
import { getItem, setItem, removeItem, TOKEN_KEY, USER_KEY } from '../storage/token';

type AuthCtx = {
  user: any;
  token: string | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  setUser: (u: any) => void;
  setToken: (t: string | null) => void;
};

function normalizeUser(u: any) {
  if (!u) return u;

  const raw =
    u.faceEnrolled ??
    u.face_enrolled ??
    u.faceEnroll ??
    u.face_enroll ??
    u.isFaceEnrolled ??
    u.is_face_enrolled;

  const faceEnrolled = raw === true || raw === 'true' || raw === 1 || raw === '1';
  return { ...u, faceEnrolled };
}

export const AuthContext = createContext<AuthCtx>({} as AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const logout = async () => {
    setUser(null);
    setToken(null);
    await removeItem(TOKEN_KEY);
    await removeItem(USER_KEY);
  };

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
    });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const t = await getItem(TOKEN_KEY);
        const uStr = await getItem(USER_KEY);

        if (t) setToken(t);

        if (uStr) {
          try {
            setUser(normalizeUser(JSON.parse(uStr)));
          } catch {
            await removeItem(USER_KEY);
          }
        }
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const data = res.data?.data ?? res.data;

    const t = data?.token;
    const u = normalizeUser(data?.user);

    if (!t || !u) throw new Error('Invalid login response');

    setToken(t);
    setUser(u);

    await setItem(TOKEN_KEY, t);
    await setItem(USER_KEY, JSON.stringify(u));

    return u;
  };

  const value = useMemo(
    () => ({ user, token, ready, login, logout, setUser, setToken }),
    [user, token, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}