import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppAlertModal from "../../components/ui/app-alert-modal";
import ProfilePageHeader from "../../components/ui/profile-page-header";
import { ApiError } from "../../services/api/client";
import { communitiesApi } from "../../services/api/communities.api";
import { colors, fonts } from "../../styles/theme";
import type {
  GetCommunitiesIdResponse,
  PatchCommunitiesIdBody,
} from "../../types/api.generated";
import type { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "EditCommunity">;
type Community = GetCommunitiesIdResponse["data"]["community"];
type CommunityMembershipType = NonNullable<
  PatchCommunitiesIdBody["membershipType"]
>;

function parseMembershipType(value: string): CommunityMembershipType {
  return value === "premium" ? "premium" : "free";
}

export default function EditCommunityScreen({ navigation, route }: Props) {
  const [community, setCommunity] = useState<Community | null>(null);
  const [description, setDescription] = useState("");
  const [membershipType, setMembershipType] =
    useState<CommunityMembershipType>("free");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ title: string; message: string; success?: boolean } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    communitiesApi
      .get(route.params.communityId, controller.signal)
      .then((response) => {
        const item = response.data.community;
        setCommunity(item);
        setDescription(item.description);
        setMembershipType(parseMembershipType(item.membershipType));
        setPrice(item.membershipPriceKobo ? String(item.membershipPriceKobo / 100) : "");
      })
      .catch((error) => {
        if (error instanceof ApiError && error.code === "REQUEST_CANCELLED") return;
        setNotice({ title: "Community unavailable", message: error instanceof ApiError ? error.message : "Unable to load this community." });
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [route.params.communityId]);

  const save = async () => {
    const priceNaira = Number(price || 0);
    if (description.trim().length < 10) {
      setNotice({ title: "Add more detail", message: "The community description must contain at least 10 characters." });
      return;
    }
    if (membershipType === "premium" && (!Number.isFinite(priceNaira) || priceNaira <= 0)) {
      setNotice({ title: "Enter a price", message: "Paid membership requires a positive naira amount." });
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      await communitiesApi.update(route.params.communityId, {
        description: description.trim(),
        membershipType,
        membershipPriceKobo: membershipType === "premium" ? Math.round(priceNaira * 100) : 0,
      });
      setNotice({ title: "Community updated", message: "Your changes were saved successfully.", success: true });
    } catch (error) {
      setNotice({ title: "Update failed", message: error instanceof ApiError ? error.message : "Unable to update this community." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SafeAreaView edges={[]} style={styles.safe}>
        <ProfilePageHeader title="Edit Community" onBack={navigation.goBack} />
        {loading ? (
          <View style={styles.loading}><ActivityIndicator color="#08b657" /></View>
        ) : community ? (
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.summary}>
              <View style={styles.icon}><Ionicons color={colors.ink} name="people" size={24} /></View>
              <View style={styles.copy}><Text style={styles.name}>{community.name}</Text><Text style={styles.meta}>{community.category} - {community.lga}, {community.state}</Text></View>
            </View>
            <Text style={styles.label}>Description</Text>
            <TextInput multiline onChangeText={setDescription} style={[styles.input, styles.multiline]} textAlignVertical="top" value={description} />
            <Text style={styles.label}>Membership type</Text>
            <View style={styles.options}>
              {(["free", "premium"] as const).map((item) => (
                <Pressable key={item} onPress={() => setMembershipType(item)} style={[styles.option, membershipType === item && styles.optionActive]}>
                  <Text style={styles.optionText}>{item === "free" ? "Free" : "Paid"}</Text>
                </Pressable>
              ))}
            </View>
            {membershipType === "premium" ? <><Text style={styles.label}>Membership price (NGN)</Text><TextInput keyboardType="decimal-pad" onChangeText={setPrice} placeholder="5000" placeholderTextColor="#718078" style={styles.input} value={price} /></> : null}
            <Pressable disabled={submitting} onPress={() => void save()} style={[styles.primary, submitting && styles.disabled]}>
              {submitting ? <ActivityIndicator color={colors.ink} /> : <Text style={styles.primaryText}>Save changes</Text>}
            </Pressable>
          </ScrollView>
        ) : null}
      </SafeAreaView>
      <AppAlertModal
        message={notice?.message ?? ""}
        onClose={() => {
          const success = notice?.success;
          setNotice(null);
          if (success) navigation.goBack();
        }}
        title={notice?.title ?? ""}
        visible={Boolean(notice)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.paper, flex: 1 }, loading: { alignItems: "center", flex: 1, justifyContent: "center" }, content: { padding: 22, paddingBottom: 70 },
  summary: { alignItems: "center", backgroundColor: "#e9f8f0", borderRadius: 22, flexDirection: "row", padding: 15 }, icon: { alignItems: "center", backgroundColor: colors.lime, borderRadius: 22, height: 44, justifyContent: "center", width: 44 }, copy: { flex: 1, marginLeft: 11 }, name: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 16 }, meta: { color: "#4e7861", fontFamily: fonts.medium, fontSize: 10, marginTop: 4 },
  label: { color: colors.ink, fontFamily: fonts.bold, fontSize: 12, marginBottom: 7, marginTop: 18 }, input: { backgroundColor: colors.white, borderRadius: 19, color: colors.ink, fontFamily: fonts.medium, minHeight: 52, paddingHorizontal: 15, paddingVertical: 12 }, multiline: { minHeight: 130 }, options: { flexDirection: "row", gap: 9 }, option: { alignItems: "center", backgroundColor: colors.white, borderColor: "transparent", borderRadius: 18, borderWidth: 1, flex: 1, padding: 13 }, optionActive: { backgroundColor: "#e9f8f0", borderColor: "#08b657" }, optionText: { color: colors.ink, fontFamily: fonts.bold, fontSize: 11, textTransform: "capitalize" },
  primary: { alignItems: "center", backgroundColor: colors.lime, borderRadius: 24, height: 52, justifyContent: "center", marginTop: 25 }, primaryText: { color: colors.ink, fontFamily: fonts.bold }, disabled: { opacity: 0.55 },
});
