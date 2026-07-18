import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppAlertModal from "../../components/ui/app-alert-modal";
import ProfilePageHeader from "../../components/ui/profile-page-header";
import { useAuth } from "../../hooks/use-auth";
import { ApiError } from "../../services/api/client";
import { disputesApi } from "../../services/api/disputes.api";
import { colors, fonts } from "../../styles/theme";
import type { GetDisputesResponse } from "../../types/api.generated";
import type { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "DisputeManagement">;
type Dispute = GetDisputesResponse["data"]["disputes"][number];
type DisputeStatus = "open" | "under_review" | "awaiting_user" | "resolved" | "closed";
const STATUSES: DisputeStatus[] = ["open", "under_review", "awaiting_user", "resolved", "closed"];

export default function DisputeManagementScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [selected, setSelected] = useState<Dispute | null>(null);
  const [status, setStatus] = useState<DisputeStatus>("under_review");
  const [resolution, setResolution] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null);
  const privileged = user?.role === "admin" || user?.role === "moderator";

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const response = await disputesApi.list();
      setDisputes(response.data.disputes);
    } catch (error) {
      setNotice({ title: "Disputes unavailable", message: error instanceof ApiError ? error.message : "Unable to load disputes." });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (privileged) void load();
    else setLoading(false);
  }, [load, privileged]);

  const choose = (dispute: Dispute) => {
    setSelected(dispute);
    setStatus(STATUSES.includes(dispute.status as DisputeStatus) ? dispute.status as DisputeStatus : "under_review");
    setResolution("");
  };

  const update = async () => {
    if (!selected || submitting) return;
    if ((status === "resolved" || status === "closed") && resolution.trim().length < 5) {
      setNotice({ title: "Add a resolution", message: "Resolved or closed disputes require a short resolution note." });
      return;
    }
    setSubmitting(true);
    try {
      await disputesApi.updateStatus(selected._id, { status, resolution: resolution.trim() || undefined });
      setNotice({ title: "Dispute updated", message: `Status changed to ${status.replace(/_/g, " ")}.` });
      setSelected(null);
      await load(true);
    } catch (error) {
      setNotice({ title: "Update failed", message: error instanceof ApiError ? error.message : "Unable to update this dispute." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SafeAreaView edges={[]} style={styles.safe}>
        <ProfilePageHeader title="Manage Disputes" onBack={navigation.goBack} />
        {!privileged ? (
          <View style={styles.forbidden}>
            <Ionicons color="#a34b4b" name="lock-closed-outline" size={42} />
            <Text style={styles.forbiddenTitle}>Privileged access required</Text>
            <Text style={styles.meta}>Only backend-authorized administrators or moderators can change dispute statuses.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}>
            {loading ? <ActivityIndicator color="#08b657" /> : null}
            {!loading && !disputes.length ? <Text style={styles.empty}>No disputes are currently available.</Text> : null}
            {disputes.map((dispute) => (
              <Pressable key={dispute._id} onPress={() => choose(dispute)} style={[styles.dispute, selected?._id === dispute._id && styles.disputeActive]}>
                <View style={styles.copy}><Text style={styles.subject}>{dispute.subject}</Text><Text numberOfLines={2} style={styles.meta}>{dispute.description}</Text></View>
                <Text style={styles.status}>{dispute.status.replace(/_/g, " ")}</Text>
              </Pressable>
            ))}
            {selected ? (
              <View style={styles.editor}>
                <Text style={styles.heading}>Update: {selected.subject}</Text>
                <View style={styles.statuses}>
                  {STATUSES.map((item) => (
                    <Pressable key={item} onPress={() => setStatus(item)} style={[styles.chip, status === item && styles.chipActive]}>
                      <Text style={styles.chipText}>{item.replace(/_/g, " ")}</Text>
                    </Pressable>
                  ))}
                </View>
                <TextInput multiline onChangeText={setResolution} placeholder="Resolution or internal outcome for the user" placeholderTextColor="#718078" style={styles.input} textAlignVertical="top" value={resolution} />
                <Pressable disabled={submitting} onPress={() => void update()} style={[styles.primary, submitting && styles.disabled]}>
                  {submitting ? <ActivityIndicator color={colors.ink} /> : <Text style={styles.primaryText}>Update status</Text>}
                </Pressable>
              </View>
            ) : null}
          </ScrollView>
        )}
      </SafeAreaView>
      <AppAlertModal message={notice?.message ?? ""} onClose={() => setNotice(null)} title={notice?.title ?? ""} visible={Boolean(notice)} />
    </>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.paper, flex: 1 }, content: { padding: 22, paddingBottom: 70 }, dispute: { alignItems: "center", backgroundColor: colors.white, borderColor: "transparent", borderRadius: 20, borderWidth: 1, flexDirection: "row", marginBottom: 9, padding: 14 }, disputeActive: { borderColor: "#08b657" }, copy: { flex: 1 }, subject: { color: colors.ink, fontFamily: fonts.bold, fontSize: 13 }, meta: { color: "#718078", fontFamily: fonts.medium, fontSize: 10, lineHeight: 15, marginTop: 4, textAlign: "center" }, status: { color: "#078d45", fontFamily: fonts.bold, fontSize: 9, marginLeft: 10, textTransform: "capitalize" }, empty: { color: "#718078", fontFamily: fonts.medium, textAlign: "center" },
  editor: { backgroundColor: "#e9f8f0", borderRadius: 23, marginTop: 15, padding: 16 }, heading: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 15 }, statuses: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 12 }, chip: { backgroundColor: colors.white, borderColor: "transparent", borderRadius: 16, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 8 }, chipActive: { borderColor: "#08b657" }, chipText: { color: colors.ink, fontFamily: fonts.bold, fontSize: 9, textTransform: "capitalize" }, input: { backgroundColor: colors.white, borderRadius: 18, color: colors.ink, fontFamily: fonts.medium, marginTop: 13, minHeight: 95, padding: 13 }, primary: { alignItems: "center", backgroundColor: colors.lime, borderRadius: 21, height: 48, justifyContent: "center", marginTop: 12 }, primaryText: { color: colors.ink, fontFamily: fonts.bold }, disabled: { opacity: 0.55 },
  forbidden: { alignItems: "center", flex: 1, justifyContent: "center", padding: 30 }, forbiddenTitle: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 19, marginTop: 13 },
});
