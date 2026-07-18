import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppAlertModal from "../../components/ui/app-alert-modal";
import ProfilePageHeader from "../../components/ui/profile-page-header";
import { aiApi } from "../../services/api/ai.api";
import { ApiError } from "../../services/api/client";
import { colors, fonts } from "../../styles/theme";
import type { GetAiSessionsResponse } from "../../types/api.generated";
import type { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "AISessions">;
type Session = GetAiSessionsResponse["data"]["sessions"][number];

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-NG");
}

export default function AiSessionsScreen({ navigation }: Props) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmSession, setConfirmSession] = useState<Session | null>(null);
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const response = await aiApi.sessions();
      setSessions(response.data.sessions);
    } catch (error) {
      setNotice({
        title: "AI history unavailable",
        message: error instanceof ApiError ? error.message : "Unable to load AI sessions.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const remove = async (session: Session) => {
    if (deletingId) return;
    setDeletingId(session._id);
    try {
      await aiApi.removeSession(session._id);
      setSessions((current) => current.filter((item) => item._id !== session._id));
    } catch (error) {
      setNotice({
        title: "Session not deleted",
        message: error instanceof ApiError ? error.message : "Unable to delete this AI session.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <SafeAreaView edges={[]} style={styles.safe}>
        <ProfilePageHeader title="AI History" onBack={navigation.goBack} />
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
        >
          <View style={styles.info}>
            <Ionicons color="#078d45" name="sparkles" size={22} />
            <Text style={styles.infoText}>
              Continue an AI context or remove sessions you no longer need.
            </Text>
          </View>

          {loading ? <ActivityIndicator color="#08b657" style={styles.loader} /> : null}
          {!loading && !sessions.length ? (
            <View style={styles.empty}>
              <Ionicons color="#70a888" name="time-outline" size={40} />
              <Text style={styles.emptyTitle}>No AI sessions yet</Text>
              <Pressable onPress={() => navigation.navigate("AIChat", {})} style={styles.primary}>
                <Text style={styles.primaryText}>Start a conversation</Text>
              </Pressable>
            </View>
          ) : null}

          {sessions.map((session) => (
            <View key={session._id} style={styles.session}>
              <Pressable
                onPress={() => navigation.navigate("AIChat", { sessionId: session._id })}
                style={styles.sessionMain}
              >
                <View style={styles.icon}>
                  <Ionicons color={colors.ink} name="sparkles" size={20} />
                </View>
                <View style={styles.copy}>
                  <Text style={styles.purpose}>{session.purpose.replace(/_/g, " ")}</Text>
                  <Text style={styles.date}>{formatDate(session.lastUsedAt)}</Text>
                </View>
                <Ionicons color="#56806a" name="chevron-forward" size={20} />
              </Pressable>
              <Pressable
                accessibilityLabel="Delete AI session"
                disabled={Boolean(deletingId)}
                onPress={() => setConfirmSession(session)}
                style={styles.delete}
              >
                {deletingId === session._id ? (
                  <ActivityIndicator color="#a34b4b" />
                ) : (
                  <Ionicons color="#a34b4b" name="trash-outline" size={20} />
                )}
              </Pressable>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>

      <AppAlertModal
        cancelText="Keep session"
        confirmText="Delete"
        message="This removes the server-side AI session and cannot be undone."
        onClose={() => setConfirmSession(null)}
        onConfirm={() => {
          const session = confirmSession;
          setConfirmSession(null);
          if (session) void remove(session);
        }}
        title="Delete AI session?"
        visible={Boolean(confirmSession)}
      />
      <AppAlertModal
        message={notice?.message ?? ""}
        onClose={() => setNotice(null)}
        title={notice?.title ?? ""}
        visible={Boolean(notice)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.paper, flex: 1 },
  content: { padding: 22, paddingBottom: 70 },
  info: { alignItems: "center", backgroundColor: "#e9f8f0", borderRadius: 20, flexDirection: "row", gap: 10, padding: 15 },
  infoText: { color: "#3d7859", flex: 1, fontFamily: fonts.medium, fontSize: 11, lineHeight: 17 },
  loader: { marginTop: 36 },
  session: { alignItems: "center", backgroundColor: colors.white, borderRadius: 21, flexDirection: "row", marginTop: 11, padding: 10 },
  sessionMain: { alignItems: "center", flex: 1, flexDirection: "row" },
  icon: { alignItems: "center", backgroundColor: colors.lime, borderRadius: 20, height: 40, justifyContent: "center", width: 40 },
  copy: { flex: 1, marginLeft: 11 },
  purpose: { color: colors.ink, fontFamily: fonts.bold, fontSize: 13, textTransform: "capitalize" },
  date: { color: "#718078", fontFamily: fonts.medium, fontSize: 10, marginTop: 4 },
  delete: { alignItems: "center", backgroundColor: "#f9eeee", borderRadius: 19, height: 38, justifyContent: "center", marginLeft: 8, width: 38 },
  empty: { alignItems: "center", backgroundColor: colors.white, borderRadius: 24, marginTop: 18, padding: 30 },
  emptyTitle: { color: colors.ink, fontFamily: fonts.bold, fontSize: 16, marginTop: 10 },
  primary: { backgroundColor: colors.lime, borderRadius: 19, marginTop: 15, paddingHorizontal: 17, paddingVertical: 11 },
  primaryText: { color: colors.ink, fontFamily: fonts.bold, fontSize: 11 },
});
