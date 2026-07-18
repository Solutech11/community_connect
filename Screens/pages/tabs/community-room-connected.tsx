import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppAlertModal from "../../components/ui/app-alert-modal";
import { ApiError } from "../../services/api/client";
import { communitiesApi } from "../../services/api/communities.api";
import { colors, fonts } from "../../styles/theme";
import type { GetCommunitiesIdMembersResponse, GetCommunitiesIdResponse } from "../../types/api.generated";
import type { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "CommunityRoom">;
type Community = GetCommunitiesIdResponse["data"]["community"];
type Member = GetCommunitiesIdMembersResponse["data"]["members"][number];

export default function CommunityRoomConnectedScreen({ navigation, route }: Props) {
  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([communitiesApi.get(route.params.communityId, controller.signal), communitiesApi.members(route.params.communityId, controller.signal)])
      .then(([detail, memberList]) => { setCommunity(detail.data.community); setMembers(memberList.data.members); })
      .catch((requestError) => { if (requestError instanceof ApiError && requestError.code === "REQUEST_CANCELLED") return; setError(requestError instanceof ApiError ? requestError.message : "Unable to load this community room."); });
    return () => controller.abort();
  }, [route.params.communityId]);
  return <>
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}><Pressable onPress={navigation.goBack}><Ionicons color={colors.ink} name="arrow-back" size={26} /></Pressable><Text style={styles.title}>{community?.name ?? "Community Room"}</Text><View style={{ width: 26 }} /></View>
      {!community ? <View style={styles.state}><ActivityIndicator color="#08b657" /></View> : <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.notice}><Ionicons color="#078d45" name="information-circle-outline" size={23} /><Text style={styles.noticeText}>Community posts and room messaging are not exposed by the current backend contract. Member data below is live.</Text></View>
        <Text style={styles.heading}>Members ({members.length})</Text>
        {members.map((member) => <View key={member._id} style={styles.member}><View style={styles.avatar}><Text style={styles.initials}>{member.firstName[0]}{member.lastName[0]}</Text></View><View><Text style={styles.name}>{member.firstName} {member.lastName}</Text><Text style={styles.meta}>{member.lga}, {member.state}</Text></View></View>)}
      </ScrollView>}
    </SafeAreaView>
    <AppAlertModal visible={Boolean(error)} title="Community room" message={error ?? ""} onClose={() => { setError(null); navigation.goBack(); }} />
  </>;
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.paper, flex: 1 }, header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", padding: 20 }, title: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 19 }, state: { alignItems: "center", flex: 1, justifyContent: "center" }, content: { padding: 22 },
  notice: { alignItems: "flex-start", backgroundColor: "#e9f8f0", borderRadius: 20, flexDirection: "row", gap: 10, padding: 15 }, noticeText: { color: "#3d7859", flex: 1, fontFamily: fonts.medium, fontSize: 11, lineHeight: 17 }, heading: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 18, marginBottom: 10, marginTop: 22 },
  member: { alignItems: "center", backgroundColor: colors.white, borderRadius: 19, flexDirection: "row", marginBottom: 9, padding: 13 }, avatar: { alignItems: "center", backgroundColor: "#e7faef", borderRadius: 22, height: 44, justifyContent: "center", marginRight: 11, width: 44 }, initials: { color: "#08a951", fontFamily: fonts.extraBold }, name: { color: colors.ink, fontFamily: fonts.bold, fontSize: 13 }, meta: { color: "#718078", fontFamily: fonts.medium, fontSize: 10, marginTop: 3 },
});
