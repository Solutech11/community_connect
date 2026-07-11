import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppAlertModal from "../../components/ui/app-alert-modal";
import ProfilePageHeader from "../../components/ui/profile-page-header";
import { lightTap } from "../../hooks/haptics";
import { colors, fonts } from "../../styles/theme";
import type { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Notifications">;
type NotificationFilter = "All" | "Events" | "Groups";
type NotificationKind = Exclude<NotificationFilter, "All"> | "Connections";

type NotificationItem = {
  id: string;
  kind: NotificationKind;
  read: boolean;
  title: string;
  time: string;
  icon?: keyof typeof Ionicons.glyphMap;
  avatar?: string;
  action?: "connection";
};

const initialNotifications: NotificationItem[] = [
  {
    id: "summer-music",
    kind: "Events",
    read: false,
    title: "Summer Music Fest starts in 1 hour!",
    time: "Just now",
    icon: "calendar",
  },
  {
    id: "urban-hikers",
    kind: "Groups",
    read: false,
    title: 'New message in Urban Hikers: "Who is coming tomorrow?"',
    time: "15m ago",
    icon: "people",
  },
  {
    id: "connection-request",
    kind: "Connections",
    read: true,
    title: "Sarah Jenkins sent you a connection request.",
    time: "2h ago",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=180&q=85",
    action: "connection",
  },
  {
    id: "ticket-purchased",
    kind: "Events",
    read: true,
    title: "Your ticket for Tech Talk: Future AI was successfully purchased.",
    time: "Yesterday",
    icon: "checkmark-circle",
  },
];

const filters: NotificationFilter[] = ["All", "Events", "Groups"];

function NotificationMessage({ title }: { title: string }) {
  const emphasizedPhrases = [
    "Summer Music Fest",
    "Urban Hikers",
    "Sarah Jenkins",
    "Tech Talk: Future AI",
  ];
  const phrase = emphasizedPhrases.find((value) => title.includes(value));

  if (!phrase) {
    return <Text style={styles.message}>{title}</Text>;
  }

  const [before, after] = title.split(phrase);

  return (
    <Text style={styles.message}>
      {before}
      <Text style={styles.messageStrong}>{phrase}</Text>
      {after}
    </Text>
  );
}

export default function NotificationsScreen({ navigation }: Props) {
  const [filter, setFilter] = useState<NotificationFilter>("All");
  const [notifications, setNotifications] = useState(initialNotifications);
  const [connectionHandled, setConnectionHandled] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const visibleNotifications = useMemo(
    () =>
      notifications.filter(
        (notification) => filter === "All" || notification.kind === filter,
      ),
    [filter, notifications],
  );

  const markAllAsRead = () => {
    lightTap();
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, read: true })),
    );
  };

  const openNotification = (notification: NotificationItem) => {
    lightTap();
    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id ? { ...item, read: true } : item,
      ),
    );
    setNotice(notification.title);
  };

  const handleConnection = (accepted: boolean) => {
    lightTap();
    setConnectionHandled(true);
    setNotice(accepted ? "Connection Accepted" : "Request Declined");
  };

  return (
    <>
      <SafeAreaView edges={[]} style={styles.safeArea}>
        <ProfilePageHeader
          onBack={navigation.goBack}
          onRightPress={markAllAsRead}
          rightAccessibilityLabel="Mark all notifications as read"
          rightIcon="checkmark-done"
          title="Notifications"
        />

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.filters}>
            {filters.map((item) => (
              <Pressable
                key={item}
                onPress={() => {
                  lightTap();
                  setFilter(item);
                }}
                style={[styles.filter, filter === item && styles.filterActive]}
              >
                <Text
                  style={[
                    styles.filterText,
                    filter === item && styles.filterTextActive,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.list}>
            {visibleNotifications.map((notification) => (
              <Pressable
                key={notification.id}
                onPress={() => openNotification(notification)}
                style={[styles.card, !notification.read && styles.cardUnread]}
              >
                {notification.avatar ? (
                  <Image
                    source={{ uri: notification.avatar }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.iconWrap}>
                    <Ionicons
                      color="#08b657"
                      name={notification.icon ?? "notifications"}
                      size={22}
                    />
                  </View>
                )}

                <View style={styles.copy}>
                  <NotificationMessage title={notification.title} />
                  <Text style={styles.time}>{notification.time}</Text>

                  {notification.action === "connection" &&
                  !connectionHandled ? (
                    <View style={styles.actions}>
                      <Pressable
                        onPress={(event) => {
                          event.stopPropagation();
                          handleConnection(true);
                        }}
                        style={styles.acceptButton}
                      >
                        <Text style={styles.acceptText}>Accept</Text>
                      </Pressable>

                      <Pressable
                        onPress={(event) => {
                          event.stopPropagation();
                          handleConnection(false);
                        }}
                        style={styles.declineButton}
                      >
                        <Text style={styles.declineText}>Decline</Text>
                      </Pressable>
                    </View>
                  ) : null}

                  {notification.action === "connection" && connectionHandled ? (
                    <Text style={styles.handledText}>Request handled</Text>
                  ) : null}
                </View>

                {!notification.read ? <View style={styles.unreadDot} /> : null}
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>

      <AppAlertModal
        message={
          notice === "Connection Accepted"
            ? "Sarah Jenkins is now one of your connections."
            : notice === "Request Declined"
              ? "The connection request has been declined."
              : "Notification details will be available here."
        }
        onClose={() => setNotice(null)}
        title={notice ?? ""}
        visible={Boolean(notice)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.paper,
    flex: 1,
  },
  content: {
    paddingBottom: 48,
    paddingHorizontal: 24,
  },
  filters: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },
  filter: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: "#e5eee9",
    borderRadius: 22,
    borderWidth: 1,
    minWidth: 72,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  filterActive: {
    backgroundColor: "#08b657",
    borderColor: "#08b657",
  },
  filterText: {
    color: "#38945f",
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  filterTextActive: {
    color: colors.white,
  },
  list: {
    gap: 16,
    marginTop: 38,
  },
  card: {
    alignItems: "flex-start",
    backgroundColor: colors.white,
    flexDirection: "row",
    minHeight: 82,
    padding: 13,
  },
  cardUnread: {
    backgroundColor: "#ddf4e7",
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 26,
    height: 50,
    justifyContent: "center",
    marginRight: 13,
    width: 50,
  },
  avatar: {
    borderRadius: 25,
    height: 50,
    marginRight: 13,
    width: 50,
  },
  copy: {
    flex: 1,
    paddingRight: 8,
  },
  message: {
    color: colors.ink,
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  messageStrong: {
    fontFamily: fonts.extraBold,
  },
  time: {
    color: "#3d9c65",
    fontFamily: fonts.bold,
    fontSize: 11,
    marginTop: 4,
  },
  unreadDot: {
    backgroundColor: "#0cb75a",
    borderRadius: 5,
    height: 8,
    marginTop: 3,
    width: 8,
  },
  actions: {
    flexDirection: "row",
    gap: 9,
    marginTop: 10,
  },
  acceptButton: {
    alignItems: "center",
    backgroundColor: "#08b657",
    borderRadius: 20,
    flex: 1,
    paddingVertical: 8,
  },
  acceptText: {
    color: colors.white,
    fontFamily: fonts.extraBold,
    fontSize: 12,
  },
  declineButton: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: "#d9e4de",
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 8,
  },
  declineText: {
    color: "#3d9c65",
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  handledText: {
    color: "#3d9c65",
    fontFamily: fonts.bold,
    fontSize: 11,
    marginTop: 9,
  },
});
