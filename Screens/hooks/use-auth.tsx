import * as Notifications from "expo-notifications";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Platform } from "react-native";

import type {
  PostAuthLoginBody,
  PostAuthVerifyEmailBody,
} from "../types/api.generated";
import { ApiError, apiClient } from "../services/api/client";
import { authApi } from "../services/api/auth.api";
import { usersApi } from "../services/api/users.api";
import { biometricCredentialStorage } from "../services/storage/biometric-credentials.storage";
import { chatSocket } from "../services/socket/chat-socket";

export type AuthenticatedStartRoute = "Home" | "PersonalizationForm";
export type UnauthenticatedStartRoute = "OnboardingWelcome" | "Login";

type SignInOptions = {
  enableBiometricLogin?: boolean;
};

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
  location?: {
    type: string;
    coordinates: number[];
  };
  preferredSetting?: string;
  preferredGroupSize?: string;
  participationRole?: string;
  hobbies?: string[];
  createdAt?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isRestoring: boolean;
  authenticatedStartRoute: AuthenticatedStartRoute;
  unauthenticatedStartRoute: UnauthenticatedStartRoute;
  signIn: (body: PostAuthLoginBody, options?: SignInOptions) => Promise<void>;
  signInWithBiometrics: () => Promise<void>;
  completeEmailVerification: (body: PostAuthVerifyEmailBody) => Promise<void>;
  refreshProfile: () => Promise<AuthUser>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function registerPushNotifications() {
  if (Platform.OS === "web") return null;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Community Connect",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  const permission = current.granted
    ? current
    : await Notifications.requestPermissionsAsync();
  if (!permission.granted) return null;
  const result = await Notifications.getExpoPushTokenAsync();
  await usersApi.registerPushToken(result.data);
  return result.data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [authenticatedStartRoute, setAuthenticatedStartRoute] =
    useState<AuthenticatedStartRoute>("Home");
  const [unauthenticatedStartRoute, setUnauthenticatedStartRoute] =
    useState<UnauthenticatedStartRoute>("OnboardingWelcome");
  const [pushToken, setPushToken] = useState<string | null>(null);
  const sessionVersion = useRef(0);

  const establishAuthenticatedSession = useCallback(
    async (
      nextUser: AuthUser,
      startRoute: AuthenticatedStartRoute = "Home",
    ) => {
      const version = ++sessionVersion.current;
      setAuthenticatedStartRoute(startRoute);
      setUser(nextUser);
      const token = apiClient.getAccessToken();
      if (token) chatSocket.connect(token);
      void registerPushNotifications()
        .then((registeredToken) => {
          if (sessionVersion.current === version) setPushToken(registeredToken);
        })
        .catch(() => {
          // Push registration must not block an otherwise valid authenticated session.
        });
    },
    [],
  );

  const clearSessionState = useCallback(
    (startRoute: UnauthenticatedStartRoute = "Login") => {
      setUnauthenticatedStartRoute(startRoute);
      sessionVersion.current += 1;
      chatSocket.disconnect();
      setPushToken(null);
      setUser(null);
    },
    [],
  );

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
        if (active) clearSessionState("OnboardingWelcome");
      } finally {
        if (active) setIsRestoring(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [clearSessionState, establishAuthenticatedSession]);

  const signIn = useCallback(
    async (body: PostAuthLoginBody, options?: SignInOptions) => {
      const response = await authApi.login(body);
      biometricCredentialStorage.clearStagedRegistration();

      if (options?.enableBiometricLogin === true) {
        try {
          await biometricCredentialStorage.save(body);
        } catch {
          // Biometric enrollment must never turn a valid password login into a failure.
        }
      } else if (options?.enableBiometricLogin === false) {
        await biometricCredentialStorage.disable();
      }

      await establishAuthenticatedSession(response.data.user);
    },
    [establishAuthenticatedSession],
  );

  const signInWithBiometrics = useCallback(async () => {
    const credentials = await biometricCredentialStorage.get();
    try {
      const response = await authApi.login(credentials);
      await establishAuthenticatedSession(response.data.user);
    } catch (error) {
      if (
        error instanceof ApiError &&
        (error.status === 401 || error.status === 403)
      ) {
        try {
          await biometricCredentialStorage.disable();
        } catch {
          // Preserve the API error even if local credential cleanup fails.
        }
      }
      throw error;
    }
  }, [establishAuthenticatedSession]);

  const completeEmailVerification = useCallback(
    async (body: PostAuthVerifyEmailBody) => {
      const response = await authApi.verifyEmail(body);
      try {
        await biometricCredentialStorage.commitStagedRegistration();
      } catch {
        // Account verification remains successful when biometric enrollment fails.
      }
      await establishAuthenticatedSession(
        response.data.user,
        "PersonalizationForm",
      );
    },
    [establishAuthenticatedSession],
  );

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
      clearSessionState("Login");
    }
  }, [clearSessionState, pushToken]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isRestoring,
      authenticatedStartRoute,
      unauthenticatedStartRoute,
      signIn,
      signInWithBiometrics,
      completeEmailVerification,
      refreshProfile,
      signOut,
    }),
    [
      authenticatedStartRoute,
      completeEmailVerification,
      isRestoring,
      refreshProfile,
      signIn,
      signInWithBiometrics,
      signOut,
      unauthenticatedStartRoute,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}

