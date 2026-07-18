import * as Notifications from 'expo-notifications';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import type { PostAuthLoginBody, PostAuthVerifyEmailBody } from '../types/api.generated';
import { apiClient } from '../services/api/client';
import { authApi } from '../services/api/auth.api';
import { usersApi } from '../services/api/users.api';
import { chatSocket } from '../services/socket/chat-socket';

export type AuthUser = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
  country?: string;
  state?: string;
  lga?: string;
  interests?: string[];
  createdAt?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isRestoring: boolean;
  signIn: (body: PostAuthLoginBody) => Promise<void>;
  completeEmailVerification: (body: PostAuthVerifyEmailBody) => Promise<void>;
  refreshProfile: () => Promise<AuthUser>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function registerPushNotifications() {
  if (Platform.OS === 'web') return null;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Community Connect',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  const permission = current.granted ? current : await Notifications.requestPermissionsAsync();
  if (!permission.granted) return null;
  const result = await Notifications.getExpoPushTokenAsync();
  await usersApi.registerPushToken(result.data);
  return result.data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [pushToken, setPushToken] = useState<string | null>(null);

  const establishAuthenticatedSession = useCallback(async (nextUser: AuthUser) => {
    setUser(nextUser);
    const token = apiClient.getAccessToken();
    if (token) chatSocket.connect(token);
    try {
      setPushToken(await registerPushNotifications());
    } catch {
      // Push registration must not block an otherwise valid authenticated session.
    }
  }, []);

  const clearSessionState = useCallback(() => {
    chatSocket.disconnect();
    setPushToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const unsubscribeUnauthorized = apiClient.onUnauthorized(clearSessionState);
    const unsubscribeToken = apiClient.onAccessTokenChanged((token) => {
      if (token && user) chatSocket.connect(token);
      if (!token) chatSocket.disconnect();
    });
    return () => {
      unsubscribeUnauthorized();
      unsubscribeToken();
    };
  }, [clearSessionState, user]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await authApi.restoreSession();
        const response = await usersApi.me();
        if (active) await establishAuthenticatedSession(response.data.user);
      } catch {
        await authApi.clearLocalSession();
        if (active) clearSessionState();
      } finally {
        if (active) setIsRestoring(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [clearSessionState, establishAuthenticatedSession]);

  const signIn = useCallback(async (body: PostAuthLoginBody) => {
    const response = await authApi.login(body);
    await establishAuthenticatedSession(response.data.user);
  }, [establishAuthenticatedSession]);

  const completeEmailVerification = useCallback(async (body: PostAuthVerifyEmailBody) => {
    const response = await authApi.verifyEmail(body);
    await establishAuthenticatedSession(response.data.user);
  }, [establishAuthenticatedSession]);

  const refreshProfile = useCallback(async () => {
    const response = await usersApi.me();
    setUser(response.data.user);
    return response.data.user;
  }, []);

  const signOut = useCallback(async () => {
    try {
      if (pushToken) await usersApi.removePushToken(pushToken);
    } catch {
      // Local credential cleanup is mandatory even when push-token removal fails.
    }
    try {
      await authApi.logout();
    } finally {
      clearSessionState();
    }
  }, [clearSessionState, pushToken]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: Boolean(user),
    isRestoring,
    signIn,
    completeEmailVerification,
    refreshProfile,
    signOut,
  }), [completeEmailVerification, isRestoring, refreshProfile, signIn, signOut, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}

