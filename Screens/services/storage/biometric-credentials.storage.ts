import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import type { PostAuthLoginBody } from "../../types/api.generated";

const BIOMETRIC_CREDENTIALS_KEY =
  "community-connect.biometric-login.credentials.v1";
const BIOMETRIC_ENABLED_KEY = "community-connect.biometric-login.enabled.v1";

const protectedOptions: SecureStore.SecureStoreOptions = {
  authenticationPrompt: "Authenticate to sign in to Community Connect",
  keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
  requireAuthentication: true,
};

type StoredBiometricCredentials = {
  version: 1;
  accountHash: string;
  email: string;
  password: string;
};

export type BiometricKind = "face" | "fingerprint";

export class BiometricCredentialError extends Error {
  readonly code:
    | "NOT_AVAILABLE"
    | "NOT_CONFIGURED"
    | "CREDENTIAL_INVALIDATED"
    | "AUTHENTICATION_FAILED";

  constructor(code: BiometricCredentialError["code"], message: string) {
    super(message);
    this.name = "BiometricCredentialError";
    this.code = code;
  }
}

let stagedRegistrationCredentials: PostAuthLoginBody | null = null;

function isStoredCredentials(
  value: unknown,
): value is StoredBiometricCredentials {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<StoredBiometricCredentials>;
  return (
    candidate.version === 1 &&
    typeof candidate.accountHash === "string" &&
    typeof candidate.email === "string" &&
    typeof candidate.password === "string" &&
    candidate.email.length > 0 &&
    candidate.password.length > 0
  );
}

async function deleteSavedCredentials() {
  await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
  try {
    await SecureStore.deleteItemAsync(
      BIOMETRIC_CREDENTIALS_KEY,
      protectedOptions,
    );
  } catch {
    // The enabled marker is authoritative. An invalidated protected key can be
    // left for the operating system to discard without exposing credentials.
  }
}

export const biometricCredentialStorage = {
  getKind(): BiometricKind {
    return Platform.OS === "ios" ? "face" : "fingerprint";
  },

  isAvailable() {
    return Platform.OS !== "web" && SecureStore.canUseBiometricAuthentication();
  },

  async isEnabled() {
    if (Platform.OS === "web") return false;
    return (
      (await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY)) === "enabled"
    );
  },

  async save(credentials: PostAuthLoginBody) {
    if (!this.isAvailable()) {
      throw new BiometricCredentialError(
        "NOT_AVAILABLE",
        "Set up Face ID or fingerprint on this device before enabling biometric sign-in.",
      );
    }

    const email = credentials.email.trim().toLowerCase();
    const accountHash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      email,
    );

    // The password cannot be hashed because the existing login API requires
    // the original value. SecureStore encrypts it and gates reads with the
    // current biometric set instead of placing it in normal app storage.
    const value: StoredBiometricCredentials = {
      version: 1,
      accountHash,
      email,
      password: credentials.password,
    };

    await SecureStore.setItemAsync(
      BIOMETRIC_CREDENTIALS_KEY,
      JSON.stringify(value),
      protectedOptions,
    );
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, "enabled", {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },

  async get(): Promise<PostAuthLoginBody> {
    if (!this.isAvailable()) {
      throw new BiometricCredentialError(
        "NOT_AVAILABLE",
        "Face ID or fingerprint is not available or enrolled on this device.",
      );
    }
    if (!(await this.isEnabled())) {
      throw new BiometricCredentialError(
        "NOT_CONFIGURED",
        "Sign in with your password once and enable biometric sign-in first.",
      );
    }

    let raw: string | null;
    try {
      raw = await SecureStore.getItemAsync(
        BIOMETRIC_CREDENTIALS_KEY,
        protectedOptions,
      );
    } catch {
      throw new BiometricCredentialError(
        "AUTHENTICATION_FAILED",
        "Biometric authentication was cancelled or unsuccessful.",
      );
    }

    if (!raw) {
      await deleteSavedCredentials();
      throw new BiometricCredentialError(
        "CREDENTIAL_INVALIDATED",
        "Your saved biometric login expired after a biometric setting changed. Sign in with your password to enable it again.",
      );
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      if (!isStoredCredentials(parsed)) throw new Error("Invalid credentials");

      const expectedAccountHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        parsed.email.trim().toLowerCase(),
      );
      if (parsed.accountHash !== expectedAccountHash) {
        throw new Error("Credential account mismatch");
      }

      return { email: parsed.email, password: parsed.password };
    } catch {
      await deleteSavedCredentials();
      throw new BiometricCredentialError(
        "CREDENTIAL_INVALIDATED",
        "Your saved biometric login is no longer valid. Sign in with your password to enable it again.",
      );
    }
  },

  async disable() {
    await deleteSavedCredentials();
  },

  stageRegistration(credentials: PostAuthLoginBody) {
    stagedRegistrationCredentials = {
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
    };
  },

  clearStagedRegistration() {
    stagedRegistrationCredentials = null;
  },

  async commitStagedRegistration() {
    const credentials = stagedRegistrationCredentials;
    stagedRegistrationCredentials = null;
    if (!credentials) return false;

    await this.save(credentials);
    return true;
  },
};
