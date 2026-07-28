import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppAlertModal from "../../components/ui/app-alert-modal";
import ProfilePageHeader from "../../components/ui/profile-page-header";
import { useAuth } from "../../hooks/use-auth";
import { colors, fonts } from "../../styles/theme";
import type { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

type ItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  danger?: boolean;
  onPress: () => void;
};

function Item({ icon, label, danger = false, onPress }: ItemProps) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={[styles.iconWrap, danger && styles.iconDanger]}>
        <Ionicons
          name={icon}
          size={23}
          color={danger ? "#ff3737" : colors.lime}
        />
      </View>
      <Text style={[styles.rowText, danger && styles.dangerText]}>{label}</Text>
      <Ionicons name="chevron-forward" size={23} color="#bfd0df" />
    </Pressable>
  );
}

export default function SettingsScreen({ navigation }: Props) {
  const { signOut, user } = useAuth();
  const [push, setPush] = useState(true);
  const [logoutConfirmationVisible, setLogoutConfirmationVisible] =
    useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleLogout = async () => {
    if (signingOut) return;

    setLogoutConfirmationVisible(false);
    setSigningOut(true);
    try {
      await signOut();
    } catch {
      // signOut always clears local credentials before propagating a network error.
    } finally {
      setSigningOut(false);
    }
  };

  const displayName = user
    ? `${user.firstName} ${user.lastName}`.trim()
    : "Community Member";

  return (
    <>
      <SafeAreaView style={styles.safeArea} edges={[]}>
        <ProfilePageHeader
          title="Settings"
          onBack={() => navigation.goBack()}
        />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.userCard}>
            <Image
              source={{
                uri:
                  user?.avatarUrl ||
                  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=85",
              }}
              style={styles.avatar}
            />
            <View>
              <Text style={styles.name}>{displayName}</Text>
              <Text style={styles.role}>Community Member</Text>
            </View>
          </View>

          <Text style={styles.heading}>NOTIFICATIONS</Text>
          <View style={styles.singleCard}>
            <View style={styles.row}>
              <View style={styles.iconWrap}>
                <Ionicons
                  name="notifications-outline"
                  size={23}
                  color={colors.lime}
                />
              </View>
              <Text style={styles.rowText}>Push Notifications</Text>
              <View style={styles.switchWrap}>
                <Switch
                  value={push}
                  onValueChange={setPush}
                  trackColor={{ false: "#dbe7df", true: "#08b657" }}
                  thumbColor={colors.white}
                />
              </View>
            </View>
          </View>

          <Text style={styles.heading}>ACCOUNT & SECURITY</Text>
          <View style={styles.group}>
            <Item
              icon="lock-closed-outline"
              label="Change Password"
              onPress={() => navigation.navigate("ChangePassword")}
            />
            <View style={styles.divider} />
            <Item
              icon="close-circle-outline"
              label="Delete Account"
              danger
              onPress={() => navigation.navigate("DeleteAccount")}
            />
          </View>

          <Text style={styles.heading}>LEGAL & INFORMATION</Text>
          <View style={styles.group}>
            <Item
              icon="shield-checkmark-outline"
              label="Privacy Policy"
              onPress={() => navigation.navigate("PrivacyPolicy")}
            />
            <View style={styles.divider} />
            <Item
              icon="document-text-outline"
              label="Terms and Conditions"
              onPress={() => navigation.navigate("TermsConditions")}
            />
          </View>

          <Pressable
            disabled={signingOut}
            onPress={() => setLogoutConfirmationVisible(true)}
            style={[styles.logout, signingOut && styles.logoutDisabled]}
          >
            <Text style={styles.logoutText}>
              {signingOut ? "Logging Out..." : "Log Out"}
            </Text>
          </Pressable>
          <Text style={styles.version}>CommunityConnect v2.4.0</Text>
        </ScrollView>
      </SafeAreaView>
      <AppAlertModal
        visible={logoutConfirmationVisible}
        title="Log out?"
        message="You will need to sign in again to access your account."
        confirmText="Log Out"
        cancelText="Stay Signed In"
        tone="warning"
        onConfirm={() => void handleLogout()}
        onClose={() => setLogoutConfirmationVisible(false)}
      />
    </>
  );
}

const android = Platform.OS === "android";

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  content: { paddingBottom: 42, paddingHorizontal: 20 },
  userCard: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 30,
    elevation: android ? 2 : 0,
    flexDirection: "row",
    gap: 20,
    marginTop: 20,
    padding: 18,
  },
  avatar: { borderRadius: 55, height: 76, width: 76 },
  name: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 20,
  },
  role: {
    color: "#399760",
    fontFamily: fonts.medium,
    fontSize: 14,
    marginTop: 6,
  },
  heading: {
    color: "#399760",
    fontFamily: fonts.bold,
    fontSize: 16,
    letterSpacing: 0.6,
    marginLeft: 14,
    marginTop: 26,
  },
  singleCard: {
    backgroundColor: colors.white,
    borderRadius: 30,
    elevation: android ? 2 : 0,
    marginTop: 12,
    paddingHorizontal: 18,
  },
  group: {
    backgroundColor: colors.white,
    borderRadius: 30,
    elevation: android ? 2 : 0,
    marginTop: 12,
    paddingHorizontal: 18,
  },
  row: { alignItems: "center", flexDirection: "row", minHeight: 68 },
  iconWrap: {
    alignItems: "center",
    backgroundColor: "#eafff0",
    borderRadius: 22,
    height: 38,
    justifyContent: "center",
    marginRight: 18,
    width: 38,
  },
  iconDanger: { backgroundColor: "#fff1f1" },
  rowText: {
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 16,
  },
  dangerText: { color: "#ff3737" },
  switchWrap: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    width: 52,
  },
  divider: { backgroundColor: "#edf2ef", height: 1, marginLeft: 62 },
  logout: {
    alignItems: "center",
    backgroundColor: "#f0f4f8",
    borderRadius: 30,
    height: 54,
    justifyContent: "center",
    marginTop: 26,
  },
  logoutDisabled: { opacity: 0.65 },
  logoutText: {
    color: "#399760",
    fontFamily: fonts.bold,
    fontSize: 21,
  },
  version: {
    color: "#c5d2e1",
    fontFamily: fonts.bold,
    fontSize: 15,
    marginTop: 24,
    textAlign: "center",
  },
});
