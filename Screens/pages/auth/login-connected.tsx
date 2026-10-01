import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import AppIcon from "../../components/ui/app-icon";
import BiometricPreference from "../../components/ui/biometric-preference";
import { useNotifier } from "../../components/ui/app-notifier";
import FormField from "../../components/ui/form-field";
import IconBubble from "../../components/ui/icon-bubble";
import LinkText from "../../components/ui/link-text";
import PrimaryButton from "../../components/ui/primary-button";
import ScreenShell from "../../components/ui/screen-shell";
import { useAuth } from "../../hooks/use-auth";
import { ApiError } from "../../services/api/client";
import {
  BiometricCredentialError,
  biometricCredentialStorage,
  type BiometricKind,
} from "../../services/storage/biometric-credentials.storage";
import { colors, fonts } from "../../styles/theme";
import type { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

function Divider() {
  return (
    <View style={styles.divider}>
      <View style={styles.dividerLine} />
      <View style={styles.dividerLabelWrap}>
        <Text style={styles.dividerLabel}>or sign in with</Text>
      </View>
    </View>
  );
}

function BiometricButton({
  busy,
  configured,
  kind,
  onPress,
}: {
  busy: boolean;
  configured: boolean;
  kind: BiometricKind;
  onPress: () => void;
}) {
  const label = kind === "face" ? "Face ID" : "Fingerprint";
  const icon = kind === "face" ? "scan-outline" : "finger-print";

  return (
    <View style={styles.biometricButtonBlock}>
      <Pressable
        accessibilityLabel={`Sign in with ${label}`}
        accessibilityRole="button"
        disabled={busy}
        onPress={onPress}
        style={({ pressed }) => [
          styles.biometricButton,
          !configured && styles.biometricButtonUnconfigured,
          pressed && styles.biometricButtonPressed,
        ]}
      >
        <AppIcon name={icon} color="#40516a" size={28} />
      </Pressable>
      <Text style={styles.biometricButtonLabel}>
        {busy ? "Authenticating..." : label}
      </Text>
    </View>
  );
}

export default function LoginScreen({ navigation }: Props) {
  const { signIn, signInWithBiometrics } = useAuth();
  const { notify } = useNotifier();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [biometricSubmitting, setBiometricSubmitting] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [rememberBiometrics, setRememberBiometrics] = useState(false);
  const biometricKind = biometricCredentialStorage.getKind();
  const biometricLabel = biometricKind === "face" ? "Face ID" : "Fingerprint";

  useEffect(() => {
    let active = true;

    const loadBiometricState = async () => {
      const available = biometricCredentialStorage.isAvailable();
      const enabled = available
        ? await biometricCredentialStorage.isEnabled()
        : false;
      if (!active) return;

      setBiometricAvailable(available);
      setBiometricEnabled(enabled);
      setRememberBiometrics(enabled);
    };

    void loadBiometricState();
    return () => {
      active = false;
    };
  }, []);

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      notify({
        title: "Enter your login details",
        message: "Enter your email address and password to continue.",
        tone: "error",
      });
      return;
    }

    setSubmitting(true);
    try {
      await signIn(
        { email: email.trim().toLowerCase(), password },
        {
          enableBiometricLogin: biometricAvailable
            ? rememberBiometrics
            : undefined,
        },
      );
    } catch (error) {
      notify({
        title: "Sign-in unsuccessful",
        message:
          error instanceof ApiError
            ? error.message
            : "Unable to sign in. Please try again.",
        tone: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBiometricSignIn = async () => {
    if (!biometricEnabled) {
      notify({
        title: `${biometricLabel} is not set up`,
        message: `Sign in with your email and password once, then enable ${biometricLabel} for future sign-ins.`,
        tone: "info",
      });
      return;
    }

    setBiometricSubmitting(true);
    try {
      await signInWithBiometrics();
    } catch (error) {
      if (
        error instanceof BiometricCredentialError &&
        (error.code === "CREDENTIAL_INVALIDATED" ||
          error.code === "NOT_CONFIGURED")
      ) {
        setBiometricEnabled(false);
        setRememberBiometrics(false);
      }

      notify({
        title: `${biometricLabel} sign-in unsuccessful`,
        message:
          error instanceof ApiError || error instanceof BiometricCredentialError
            ? error.message
            : `Unable to sign in with ${biometricLabel}.`,
        tone: "error",
      });
    } finally {
      setBiometricSubmitting(false);
    }
  };

  const busy = submitting || biometricSubmitting;

  return (
    <ScreenShell>
      <View style={styles.screenContent}>
        <View style={styles.mainContent}>
          <View style={styles.hero}>
            <IconBubble name="people" size={64} />
            <View style={styles.heroCopy}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>
                Sign in to connect with your community.
              </Text>
            </View>
          </View>

          <View style={styles.form}>
            <FormField
              label="Email Address"
              placeholder="hello@example.com"
              autoComplete="email"
              autoCapitalize="none"
              icon="mail"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              fieldHeight={54}
            />
            <FormField
              label="Password"
              placeholder="Enter your password"
              autoComplete="password"
              autoCapitalize="none"
              icon="lock-closed"
              rightIcon={passwordVisible ? "eye" : "eye-off"}
              onRightIconPress={() => setPasswordVisible((visible) => !visible)}
              secureTextEntry={!passwordVisible}
              value={password}
              onChangeText={setPassword}
              fieldHeight={54}
            />
            <View style={styles.forgotPasswordRow}>
              <Pressable onPress={() => navigation.navigate("ForgotPassword")}>
                <Text style={styles.forgotPassword}>Forgot Password?</Text>
              </Pressable>
            </View>

            {biometricAvailable ? (
              <BiometricPreference
                checked={rememberBiometrics}
                kind={biometricKind}
                onPress={() => setRememberBiometrics((current) => !current)}
              />
            ) : null}

            <PrimaryButton
              label={submitting ? "Signing In..." : "Sign In"}
              showArrow={false}
              height={56}
              disabled={busy}
              onPress={handleSignIn}
            />
          </View>

          {biometricAvailable ? (
            <View style={styles.biometricSection}>
              <Divider />
              <BiometricButton
                busy={biometricSubmitting}
                configured={biometricEnabled}
                kind={biometricKind}
                onPress={() => void handleBiometricSignIn()}
              />
            </View>
          ) : null}
        </View>

        <View style={styles.signUpRow}>
          <Text style={styles.signUpCopy}>Don't have an account?</Text>
          <LinkText
            label="Sign Up"
            onPress={() => navigation.navigate("Register")}
          />
        </View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
    gap: 16,
    justifyContent: "space-between",
    paddingTop: 24,
  },
  mainContent: { gap: 22 },
  hero: { alignItems: "center", gap: 12 },
  heroCopy: { alignItems: "center", gap: 6 },
  title: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 30,
    lineHeight: 36,
  },
  subtitle: {
    color: colors.muted,
    fontFamily: fonts.semiBold,
    fontSize: 15,
  },
  form: { gap: 13 },
  forgotPasswordRow: { alignItems: "flex-end", marginTop: -4 },
  forgotPassword: {
    color: "#34445c",
    fontFamily: fonts.extraBold,
    fontSize: 14,
  },
  biometricSection: { gap: 10 },
  divider: {
    justifyContent: "center",
    marginVertical: 4,
    position: "relative",
  },
  dividerLine: { backgroundColor: colors.line, height: 1 },
  dividerLabelWrap: {
    alignSelf: "center",
    backgroundColor: colors.paper,
    paddingHorizontal: 12,
    position: "absolute",
  },
  dividerLabel: { color: colors.muted, fontSize: 13 },
  biometricButtonBlock: { alignItems: "center", gap: 6 },
  biometricButton: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: colors.lime,
    borderRadius: 18,
    borderWidth: 1.5,
    height: 58,
    justifyContent: "center",
    width: 58,
  },
  biometricButtonUnconfigured: { borderColor: colors.line, opacity: 0.58 },
  biometricButtonPressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  biometricButtonLabel: {
    color: colors.muted,
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  signUpRow: {
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
    paddingBottom: 10,
  },
  signUpCopy: { color: "#40516a", fontSize: 14 },
});
