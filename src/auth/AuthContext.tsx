import React, { createContext, useEffect, useMemo, useState } from 'react';
import api, { setUnauthorizedHandler } from '../api/api';
import { getItem, setItem, removeItem, TOKEN_KEY, USER_KEY } from '../storage/token';

type AuthCtx = {
  user: any;
  token: string | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<any>;
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
  const [user, setUserState] = useState<any>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const persistUser = async (nextUser: any) => {
    const normalized = normalizeUser(nextUser);
    setUserState(normalized);

    if (normalized) {
      await setItem(USER_KEY, JSON.stringify(normalized));
    } else {
      await removeItem(USER_KEY);
    }

    return normalized;
  };

  const setUser = (u: any) => {
    const normalized = normalizeUser(u);
    setUserState(normalized);
    if (normalized) {
      void setItem(USER_KEY, JSON.stringify(normalized));
    } else {
      void removeItem(USER_KEY);
    }
  };

  const setToken = (t: string | null) => {
    setTokenState(t);
    if (t) {
      void setItem(TOKEN_KEY, t);
    } else {
      void removeItem(TOKEN_KEY);
    }
  };

  const logout = async () => {
    setUserState(null);
    setTokenState(null);
    await removeItem(TOKEN_KEY);
    await removeItem(USER_KEY);
  };

  const refreshUser = async () => {
    const res = await api.get('/auth/profile');
    const fresh = res.data?.data ?? res.data?.user ?? res.data;
    return persistUser(fresh);
  };

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void logout();
    });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const t = await getItem(TOKEN_KEY);
        const uStr = await getItem(USER_KEY);

        if (!t) return;

        setTokenState(t);

        if (uStr) {
          try {
            setUserState(normalizeUser(JSON.parse(uStr)));
          } catch {
            await removeItem(USER_KEY);
          }
        }

        // Always refresh the persisted user after app reopen. This prevents a
        // stale stored faceEnrolled value from unlocking the app incorrectly.
        try {
          await refreshUser();
        } catch {
          // Keep the cached user when the device is temporarily offline.
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

    setTokenState(t);
    await setItem(TOKEN_KEY, t);

    const savedUser = await persistUser(u);

    // Immediately refresh from /auth/profile so navigation uses server truth.
    try {
      return await refreshUser();
    } catch {
      return savedUser;
    }
  };

  const value = useMemo(
    () => ({ user, token, ready, login, logout, refreshUser, setUser, setToken }),
    [user, token, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
