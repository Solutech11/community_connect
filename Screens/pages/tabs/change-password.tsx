import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import type { DimensionValue } from "react-native";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppAlertModal from "../../components/ui/app-alert-modal";
import { useAuth } from "../../hooks/use-auth";
import { ApiError } from "../../services/api/client";
import { usersApi } from "../../services/api/users.api";
import ProfilePageHeader from "../../components/ui/profile-page-header";
import { colors, fonts } from "../../styles/theme";
import type { RootStackParamList } from "../../types/navigation";
type Props = NativeStackScreenProps<RootStackParamList, "ChangePassword">;
type PasswordFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  visible: boolean;
  onChangeText: (value: string) => void;
  onToggleVisibility: () => void;
  onSubmitEditing?: () => void;
  returnKeyType?: "next" | "done";
};
function PasswordField({
  label,
  placeholder,
  value,
  visible,
  onChangeText,
  onToggleVisibility,
  onSubmitEditing,
  returnKeyType,
}: PasswordFieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputShell}>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          placeholder={placeholder}
          placeholderTextColor="#9aa9a2"
          returnKeyType={returnKeyType}
          secureTextEntry={!visible}
          style={styles.input}
          value={value}
        />
        <Pressable
          accessibilityLabel={visible ? "Hide password" : "Show password"}
          hitSlop={10}
          onPress={onToggleVisibility}
          style={styles.eyeButton}
        >
          <Ionicons
            name={visible ? "eye-outline" : "eye-off-outline"}
            size={21}
            color="#7ebf99"
          />
        </Pressable>
      </View>
    </View>
  );
}
function Requirement({ met, label }: { met: boolean; label: string }) {
  return (
    <View style={styles.requirement}>
      <Ionicons
        name={met ? "checkmark-circle" : "ellipse-outline"}
        size={16}
        color={met ? "#08b657" : "#abcabc"}
      />
      <Text style={[styles.requirementText, met && styles.requirementTextMet]}>
        {label}
      </Text>
    </View>
  );
}
export default function ChangePasswordScreen({ navigation }: Props) {
  const { signOut } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmedPassword, setConfirmedPassword] = useState("");
  const [currentVisible, setCurrentVisible] = useState(false);
  const [newVisible, setNewVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const requirements = useMemo(
    () => ({
      length: newPassword.length >= 8,
      number: /\d/.test(newPassword),
      symbol: /[^A-Za-z0-9]/.test(newPassword),
      uppercase: /[A-Z]/.test(newPassword),
    }),
    [newPassword],
  );
  const passedCount = Object.values(requirements).filter(Boolean).length;
  const passwordsMatch =
    confirmedPassword.length > 0 && newPassword === confirmedPassword;
  const canSubmit =
    currentPassword.length > 0 && passedCount === 4 && passwordsMatch;
  const strengthLabel =
    passedCount === 0
      ? "Awaiting input"
      : passedCount <= 2
        ? "Keep going"
        : passedCount === 3
          ? "Almost there"
          : "Strong";
  const strengthWidth: DimensionValue = `${Math.max(passedCount * 25, newPassword.length ? 12 : 0)}%`;
  const handleUpdate = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      await usersApi.changePassword({ currentPassword, newPassword });
      setSuccessVisible(true);
    } catch (error) {
      setNotice(error instanceof ApiError ? error.message : "Unable to change your password.");
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <>
      <SafeAreaView style={styles.safeArea} edges={[]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
          style={styles.safeArea}
        >
          <ProfilePageHeader
            title="Change Password"
            onBack={() => navigation.goBack()}
          />

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.securityVisual}>
              <View style={styles.lockRing}>
                <Ionicons name="lock-open-outline" size={37} color="#08b657" />
              </View>
              <View style={styles.shieldBubble}>
                <Ionicons name="shield-checkmark" size={23} color="#08b657" />
              </View>
            </View>

            <Text style={styles.title}>Secure your account</Text>
            <Text style={styles.description}>
              Your new password should be unique and at least 8 characters long
              to ensure maximum security.
            </Text>

            <PasswordField
              label="CURRENT PASSWORD"
              placeholder="Enter current password"
              value={currentPassword}
              visible={currentVisible}
              onChangeText={setCurrentPassword}
              onToggleVisibility={() => setCurrentVisible((value) => !value)}
              returnKeyType="next"
            />

            <Pressable
              hitSlop={8}
              onPress={() =>
                setNotice(
                  "A password reset link has been sent to your registered email address.",
                )
              }
              style={styles.forgotButton}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </Pressable>

            <View style={styles.sectionDivider} />

            <PasswordField
              label="NEW PASSWORD"
              placeholder="Min. 8 characters"
              value={newPassword}
              visible={newVisible}
              onChangeText={setNewPassword}
              onToggleVisibility={() => setNewVisible((value) => !value)}
              returnKeyType="next"
            />

            <PasswordField
              label="CONFIRM NEW PASSWORD"
              placeholder="Re-type new password"
              value={confirmedPassword}
              visible={confirmVisible}
              onChangeText={setConfirmedPassword}
              onToggleVisibility={() => setConfirmVisible((value) => !value)}
              onSubmitEditing={handleUpdate}
              returnKeyType="done"
            />

            {confirmedPassword.length > 0 && !passwordsMatch ? (
              <Text style={styles.matchError}>Passwords do not match.</Text>
            ) : null}

            <View style={styles.strengthCard}>
              <View style={styles.strengthHeader}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={18}
                  color="#08b657"
                />
                <Text style={styles.strengthTitle}>
                  Password Strength: {strengthLabel}
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: strengthWidth }]} />
              </View>
              <View style={styles.requirementsGrid}>
                <Requirement met={requirements.length} label="8+ Characters" />
                <Requirement met={requirements.number} label="One Number" />
                <Requirement met={requirements.symbol} label="One Symbol" />
                <Requirement
                  met={requirements.uppercase}
                  label="Uppercase Letter"
                />
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={!canSubmit || submitting}
              onPress={handleUpdate}
              style={({ pressed }) => [
                styles.updateButton,
                !canSubmit && styles.updateButtonDisabled,
                pressed && canSubmit && styles.updateButtonPressed,
              ]}
            >
              <Text style={styles.updateButtonText}>{submitting ? "Updating..." : "Update Password"}</Text>
              <Ionicons name="chevron-forward" size={22} color={colors.ink} />
            </Pressable>

            <Text style={styles.footerNote}>
              Updating your password will sign you out of all other active
              sessions on different devices.
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <AppAlertModal
        visible={successVisible}
        title="Password Updated"
        message="Your password has been updated successfully."
        onClose={async () => {
          setSuccessVisible(false);
          await signOut();
          navigation.navigate("Login");
        }}
      />
      <AppAlertModal
        visible={Boolean(notice)}
        title="Forgot Password"
        message={notice ?? ""}
        onClose={() => setNotice(null)}
      />
    </>
  );
}
const android = Platform.OS === "android";
const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.paper, flex: 1 },
  content: { paddingBottom: 38, paddingHorizontal: 20 },
  securityVisual: {
    alignSelf: "center",
    height: 112,
    marginTop: 18,
    position: "relative",
    width: 116,
  },
  lockRing: {
    alignItems: "center",
    backgroundColor: "#e8fff1",
    borderColor: "#bdf2d0",
    borderRadius: 42,
    borderWidth: 2,
    height: 70,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    top: 0,
    width: 70,
  },
  shieldBubble: {
    alignItems: "center",
    backgroundColor: "#c9f6d9",
    borderColor: colors.paper,
    borderRadius: 26,
    borderWidth: 5,
    bottom: 0,
    elevation: android ? 2 : 0,
    height: 52,
    justifyContent: "center",
    position: "absolute",
    right: 0,
    width: 52,
  },
  title: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 25,
    marginTop: 20,
  },
  description: {
    color: "#647970",
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
  },
  fieldGroup: { marginTop: 20 },
  fieldLabel: {
    color: "#399760",
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 0.35,
  },
  inputShell: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 27,
    elevation: android ? 2 : 0,
    flexDirection: "row",
    height: 56,
    marginTop: 10,
    paddingLeft: 21,
    paddingRight: 9,
  },
  input: {
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 15,
    paddingVertical: 0,
  },
  eyeButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  forgotButton: {
    alignSelf: "flex-end",
    paddingHorizontal: 2,
    paddingVertical: 11,
  },
  forgotText: { color: "#08a951", fontFamily: fonts.bold, fontSize: 12 },
  sectionDivider: { backgroundColor: "#eaf1ed", height: 1, marginTop: 4 },
  matchError: {
    color: "#e34c4c",
    fontFamily: fonts.medium,
    fontSize: 12,
    marginLeft: 4,
    marginTop: 8,
  },
  strengthCard: {
    backgroundColor: "#edfff4",
    borderRadius: 24,
    marginTop: 20,
    padding: 17,
  },
  strengthHeader: { alignItems: "center", flexDirection: "row", gap: 8 },
  strengthTitle: { color: "#32945d", fontFamily: fonts.bold, fontSize: 12 },
  progressTrack: {
    backgroundColor: "#d8eddf",
    borderRadius: 4,
    height: 5,
    marginTop: 14,
    overflow: "hidden",
  },
  progressFill: { backgroundColor: "#08b657", borderRadius: 4, height: 5 },
  requirementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 15,
    rowGap: 11,
  },
  requirement: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    width: "50%",
  },
  requirementText: { color: "#8ba097", fontFamily: fonts.medium, fontSize: 11 },
  requirementTextMet: { color: "#168c4d" },
  updateButton: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: 29,
    elevation: android ? 3 : 0,
    flexDirection: "row",
    height: 56,
    justifyContent: "center",
    marginTop: 26,
    position: "relative",
  },
  updateButtonDisabled: {
    backgroundColor: "#bcefcf",
    elevation: 0,
    opacity: 0.65,
  },
  updateButtonPressed: { opacity: 0.78 },
  updateButtonText: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 17,
    marginRight: 9,
  },
  footerNote: {
    color: "#89a197",
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 22,
    paddingHorizontal: 20,
    textAlign: "center",
  },
});
