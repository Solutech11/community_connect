import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import AppIcon from "../../components/ui/app-icon";
import BiometricPreference from "../../components/ui/biometric-preference";
import { useNotifier } from "../../components/ui/app-notifier";
import FormField from "../../components/ui/form-field";
import LinkText from "../../components/ui/link-text";
import PrimaryButton from "../../components/ui/primary-button";
import SetupLayout from "../../Layouts/setup-layout";
import { authApi } from "../../services/api/auth.api";
import { ApiError } from "../../services/api/client";
import { getRegistrationLocation } from "../../services/location/registration-location.service";
import { biometricCredentialStorage } from "../../services/storage/biometric-credentials.storage";
import { colors, fonts } from "../../styles/theme";
import type { RootStackParamList } from "../../types/navigation";
import { setupSteps } from "../../types/setup-flow";

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

export default function RegistrationScreen({ navigation }: Props) {
  const { notify } = useNotifier();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [shareLocation, setShareLocation] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [rememberBiometrics, setRememberBiometrics] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setBiometricAvailable(biometricCredentialStorage.isAvailable());
  }, []);

  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      notify({
        title: "Complete your details",
        message: "Enter your name, email address, and password to continue.",
        tone: "error",
      });
      return;
    }

    setSubmitting(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const location = shareLocation ? await getRegistrationLocation() : null;

      if (shareLocation && !location) {
        notify({
          title: "Location not added",
          message:
            "Your account can still be created. You can enable location later for nearby events.",
          tone: "warning",
        });
      }

      await authApi.register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: normalizedEmail,
        password,
        ...(phone.trim() ? { phone: phone.trim() } : {}),
        ...(location ? { location } : {}),
      });
      if (biometricAvailable && rememberBiometrics) {
        biometricCredentialStorage.stageRegistration({
          email: normalizedEmail,
          password,
        });
      } else {
        biometricCredentialStorage.clearStagedRegistration();
      }

      navigation.navigate("VerifyEmail", {
        email: normalizedEmail,
        purpose: "verify-email",
      });
    } catch (error) {
      notify({
        title: "Registration unsuccessful",
        message:
          error instanceof ApiError
            ? error.message
            : "Unable to create your account.",
        tone: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SetupLayout step={setupSteps.register} onBack={() => navigation.goBack()}>
      <View style={{ gap: 14 }}>
        <View style={{ gap: 6 }}>
          <Text
            style={{
              color: colors.ink,
              fontSize: 26,
              lineHeight: 30,
              fontFamily: fonts.extraBold,
            }}
          >
            Join{"\n"}CommunityConnect
          </Text>
          <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 19 }}>
            Sign up to connect with your local community and discover nearby
            events.
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <FormField
              label="First Name"
              placeholder="Jane"
              autoComplete="given-name"
              icon="person"
              value={firstName}
              onChangeText={setFirstName}
            />
          </View>
          <View style={{ flex: 1 }}>
            <FormField
              label="Last Name"
              placeholder="Doe"
              autoComplete="family-name"
              icon="person"
              value={lastName}
              onChangeText={setLastName}
            />
          </View>
        </View>
        <FormField
          label="Email Address"
          placeholder="jane@example.com"
          autoComplete="email"
          autoCapitalize="none"
          icon="mail"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <FormField
          label="Phone (optional)"
          placeholder="+2348012345678"
          autoComplete="tel"
          icon="call"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <FormField
          label="Password"
          placeholder="Enter a strong password"
          autoComplete="new-password"
          autoCapitalize="none"
          icon="lock-closed"
          rightIcon={passwordVisible ? "eye" : "eye-off"}
          onRightIconPress={() => setPasswordVisible((visible) => !visible)}
          secureTextEntry={!passwordVisible}
          value={password}
          onChangeText={setPassword}
        />

        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: shareLocation }}
          onPress={() => setShareLocation((current) => !current)}
          style={{ alignItems: "center", flexDirection: "row", gap: 10 }}
        >
          <View
            style={{
              alignItems: "center",
              backgroundColor: shareLocation ? "#e5f8d9" : colors.white,
              borderColor: shareLocation ? colors.lime : colors.line,
              borderRadius: 18,
              borderWidth: 1,
              height: 36,
              justifyContent: "center",
              width: 36,
            }}
          >
            <AppIcon
              name="location"
              color={shareLocation ? colors.ink : colors.muted}
              size={18}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: colors.ink,
                fontFamily: fonts.bold,
                fontSize: 12,
              }}
            >
              Personalize nearby events
            </Text>
            <Text style={{ color: colors.muted, fontSize: 11, lineHeight: 16 }}>
              Use your current location during sign-up. You can change this
              later.
            </Text>
          </View>
          <View
            style={{
              backgroundColor: shareLocation ? colors.lime : colors.line,
              borderRadius: 14,
              height: 27,
              justifyContent: "center",
              paddingHorizontal: 3,
              width: 46,
            }}
          >
            <View
              style={{
                alignSelf: shareLocation ? "flex-end" : "flex-start",
                backgroundColor: colors.white,
                borderRadius: 11,
                height: 21,
                width: 21,
              }}
            />
          </View>
        </Pressable>

        {biometricAvailable ? (
          <BiometricPreference
            checked={rememberBiometrics}
            kind={biometricCredentialStorage.getKind()}
            onPress={() => setRememberBiometrics((current) => !current)}
            description="After OTP verification, your login will be encrypted and protected by this device."
          />
        ) : null}

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: acceptedTerms }}
          onPress={() => setAcceptedTerms((current) => !current)}
          style={{ flexDirection: "row", alignItems: "center", gap: 9 }}
        >
          <View
            style={{
              height: 18,
              width: 18,
              borderRadius: 9,
              borderWidth: 1,
              borderColor: acceptedTerms ? colors.lime : colors.line,
              backgroundColor: acceptedTerms ? colors.lime : colors.white,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {acceptedTerms ? (
              <AppIcon name="checkmark" color={colors.ink} size={13} />
            ) : null}
          </View>
          <Text style={{ flex: 1, color: colors.muted, fontSize: 12 }}>
            I agree to the Terms and Privacy Policy
          </Text>
        </Pressable>

        <PrimaryButton
          label={submitting ? "Creating Account..." : "Create Account"}
          disabled={!acceptedTerms || submitting}
          onPress={handleRegister}
        />
        <View
          style={{ flexDirection: "row", justifyContent: "center", gap: 4 }}
        >
          <Text style={{ color: colors.muted, fontSize: 12 }}>
            Already a member?
          </Text>
          <LinkText
            label="Login"
            onPress={() => navigation.navigate("Login")}
          />
        </View>
      </View>
    </SetupLayout>
  );
}
