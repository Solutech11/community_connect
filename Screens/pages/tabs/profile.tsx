import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppAlertModal from "../../components/ui/app-alert-modal";
import { lightTap as tapFeedback } from "../../hooks/haptics";
import { colors, fonts } from "../../styles/theme";
import type { RootStackNavigationProp } from "../../types/navigation";
type AlertState = {
  title: string;
  message: string;
} | null;
type Action = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
};
function Row({
  action,
  onNotice,
}: {
  action: Action;
  onNotice: (label: string) => void;
}) {
  return (
    <Pressable
      onPress={() => {
        tapFeedback();
        if (action.onPress) {
          action.onPress();
        } else {
          onNotice(action.label);
        }
      }}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.rowIcon}>
        <Ionicons name={action.icon} size={21} color="#08b657" />
      </View>
      <Text style={styles.rowLabel}>{action.label}</Text>
      <Ionicons name="chevron-forward" size={20} color="#26955a" />
    </Pressable>
  );
}
function Section({
  title,
  actions,
  onNotice,
}: {
  title: string;
  actions: Action[];
  onNotice: (label: string) => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actions.map((action, index) => (
        <View key={action.label}>
          <Row action={action} onNotice={onNotice} />
          {index < actions.length - 1 ? <View style={styles.divider} /> : null}
        </View>
      ))}
    </View>
  );
}
export default function ProfileScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();
  const [alert, setAlert] = useState<AlertState>(null);
  const showNotice = (label: string) =>
    setAlert({
      title: label,
      message: label + " will be available here soon.",
    });
  return (
    <>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.header}>
            <View style={styles.avatarWrap}>
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=360&q=85",
                }}
                style={styles.avatar}
              />
              <Pressable
                onPress={() => showNotice("Update Profile")}
                style={styles.edit}
              >
                <Ionicons name="pencil" size={17} color={colors.white} />
              </Pressable>
            </View>
            <Text style={styles.name}>Alex Rivera</Text>
            <Text style={styles.handle}>@arivera_connect</Text>
            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>142</Text>
                <Text style={styles.statLabel}>Connections</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>28</Text>
                <Text style={styles.statLabel}>Events</Text>
              </View>
            </View>
          </View>
          <Section
            title="ACCOUNT"
            onNotice={showNotice}
            actions={[
              {
                icon: "person-outline",
                label: "Update Profile",
                onPress: () => navigation.navigate("UpdateProfile"),
              },
              { icon: "notifications-outline", label: "Notification" },
              { icon: "people-outline", label: "Friends" },
            ]}
          />
          <Section
            title="ACTIVITY"
            onNotice={showNotice}
            actions={[
              {
                icon: "calendar-outline",
                label: "My Created Events",
                onPress: () => navigation.navigate("MyCreatedEvents"),
              },
              {
                icon: "ticket-outline",
                label: "My Tickets",
                onPress: () => navigation.navigate("MyEvents"),
              },
              { icon: "chatbox-outline", label: "Chat" },
            ]}
          />
          <Section
            title="FINANCIAL"
            onNotice={showNotice}
            actions={[
              {
                icon: "wallet-outline",
                label: "Wallet",
                onPress: () => navigation.navigate("Wallet"),
              },
              {
                icon: "receipt-outline",
                label: "Transactions",
                onPress: () => navigation.navigate("Transactions"),
              },
            ]}
          />
          <Section
            title="SUPPORT & SETTINGS"
            onNotice={showNotice}
            actions={[
              {
                icon: "settings-outline",
                label: "Settings",
                onPress: () => navigation.navigate("Settings"),
              },
              { icon: "warning-outline", label: "Dispute" },
            ]}
          />
          <Pressable
            onPress={() =>
              setAlert({
                title: "Logout",
                message: "You have been logged out of this demo account.",
              })
            }
            style={styles.logout}
          >
            <Ionicons name="log-out-outline" size={23} color="#df1111" />
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
      <AppAlertModal
        visible={Boolean(alert)}
        title={alert?.title ?? ""}
        message={alert?.message ?? ""}
        onClose={() => setAlert(null)}
      />
    </>
  );
}
const android = Platform.OS === "android";
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f7fbf9" },
  content: { paddingBottom: 132 },
  header: { alignItems: "center", paddingTop: 22 },
  avatarWrap: { height: 118, position: "relative", width: 118 },
  avatar: {
    borderColor: colors.white,
    borderRadius: 59,
    borderWidth: 4,
    elevation: android ? 4 : 0,
    height: 112,
    width: 112,
  },
  edit: {
    alignItems: "center",
    backgroundColor: "#08b657",
    borderColor: colors.white,
    borderRadius: 22,
    borderWidth: 2,
    bottom: 0,
    elevation: android ? 4 : 0,
    height: 44,
    justifyContent: "center",
    position: "absolute",
    right: 0,
    width: 44,
  },
  name: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 21,
    marginTop: 12,
  },
  handle: {
    color: "#168d50",
    fontFamily: fonts.medium,
    fontSize: 15,
    marginTop: 3,
  },
  stats: { flexDirection: "row", gap: 16, marginTop: 26 },
  stat: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 34,
    elevation: android ? 2 : 0,
    minWidth: 132,
    paddingHorizontal: 28,
    paddingVertical: 13,
  },
  statValue: { color: "#08af55", fontFamily: fonts.extraBold, fontSize: 20 },
  statLabel: {
    color: "#078d45",
    fontFamily: fonts.medium,
    fontSize: 13,
    marginTop: 1,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: 26,
    elevation: android ? 1 : 0,
    marginHorizontal: 24,
    marginTop: 32,
    paddingHorizontal: 26,
    paddingVertical: 18,
  },
  sectionTitle: {
    color: "#078d45",
    fontFamily: fonts.bold,
    fontSize: 13,
    letterSpacing: 0.8,
    marginBottom: 13,
  },
  row: { alignItems: "center", flexDirection: "row", minHeight: 76 },
  rowIcon: {
    alignItems: "center",
    backgroundColor: "#e8faf0",
    borderRadius: 21,
    height: 42,
    justifyContent: "center",
    marginRight: 16,
    width: 42,
  },
  rowLabel: {
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 16,
  },
  divider: { backgroundColor: "#edf2ef", height: 1, marginLeft: 58 },
  logout: {
    alignItems: "center",
    backgroundColor: "#fff4f4",
    borderColor: "#ffd5d5",
    borderRadius: 30,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    height: 62,
    justifyContent: "center",
    marginHorizontal: 24,
    marginTop: 40,
  },
  logoutText: { color: "#df1111", fontFamily: fonts.extraBold, fontSize: 17 },
  pressed: { opacity: 0.76 },
});
