import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Crypto from "expo-crypto";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AppLoader from "../../components/ui/app-loader";
import { SafeAreaView } from "react-native-safe-area-context";

import AppAlertModal from "../../components/ui/app-alert-modal";
import ProfilePageHeader from "../../components/ui/profile-page-header";
import { ApiError } from "../../services/api/client";
import { communitiesApi } from "../../services/api/communities.api";
import { uploadsApi } from "../../services/api/uploads.api";
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
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [state, setState] = useState("");
  const [lga, setLga] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [newAccessCode, setNewAccessCode] = useState<string | null>(null);
  const [codeModalVisible, setCodeModalVisible] = useState(false);
  const [codeSaved, setCodeSaved] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [membershipType, setMembershipType] =
    useState<CommunityMembershipType>("free");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{
    title: string;
    message: string;
    success?: boolean;
  } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    communitiesApi
      .get(route.params.communityId, controller.signal)
      .then((response) => {
        const item = response.data.community;
        setCommunity(item);
        setName(item.name);
        setDescription(item.description);
        setCategory(item.category);
        setState(item.state);
        setLga(item.lga);
        setVisibility(item.visibility === "private" ? "private" : "public");
        setMembershipType(parseMembershipType(item.membershipType));
        setPrice(
          item.membershipPriceKobo
            ? String(item.membershipPriceKobo / 100)
            : "",
        );
      })
      .catch((error) => {
        if (error instanceof ApiError && error.code === "REQUEST_CANCELLED")
          return;
        setNotice({
          title: "Community unavailable",
          message:
            error instanceof ApiError
              ? error.message
              : "Unable to load this community.",
        });
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [route.params.communityId]);

  const generateCode = () =>
    Crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();

  const pickImage = async (kind: "cover" | "avatar") => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setNotice({
        title: "Photo permission",
        message: "Allow photo access to update the cover image.",
      });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.82,
      allowsEditing: true,
      aspect: kind === "cover" ? [16, 9] : [1, 1],
    });
    if (!result.canceled) {
      if (kind === "cover") setImageUri(result.assets[0].uri);
      else setAvatarUri(result.assets[0].uri);
    }
  };

  const save = () => {
    const priceNaira = Number(price || 0);
    if (
      name.trim().length < 3 ||
      description.trim().length < 20 ||
      category.trim().length < 2
    ) {
      setNotice({
        title: "Complete the details",
        message:
          "Name must be 3+ characters, category 2+, and description 20+.",
      });
      return;
    }
    if (
      membershipType === "premium" &&
      (!Number.isFinite(priceNaira) || priceNaira <= 0)
    ) {
      setNotice({
        title: "Enter a price",
        message: "Paid membership requires a positive naira amount.",
      });
      return;
    }
    if (visibility === "private" && membershipType === "premium") {
      setNotice({
        title: "Paid private communities unavailable",
        message: "Paid communities must be public with open joining.",
      });
      return;
    }
    if (membershipType === "premium" && community?.joinPolicy !== "open") {
      setNotice({
        title: "Update joining policy",
        message:
          "Set joining to open in community management before enabling paid membership.",
      });
      return;
    }
    if (submitting) return;
    if (visibility === "private" && community?.visibility !== "private") {
      if (!newAccessCode) setNewAccessCode(generateCode());
      setCodeModalVisible(true);
      return;
    }
    if (newAccessCode) {
      setCodeModalVisible(true);
      return;
    }
    void performSave();
  };

  const performSave = async () => {
    const priceNaira = Number(price || 0);
    setSubmitting(true);
    try {
      let imageUrl: string | undefined;
      if (imageUri) {
        const upload = await uploadsApi.image(
          {
            uri: imageUri,
            name: `community-cover-${Date.now()}.jpg`,
            type: "image/jpeg",
          },
          "communities",
        );
        imageUrl = upload.data.url;
      }
      let avatarImageUrl: string | undefined;
      if (avatarUri) {
        const upload = await uploadsApi.image(
          {
            uri: avatarUri,
            name: `community-avatar-${Date.now()}.jpg`,
            type: "image/jpeg",
          },
          "communities",
        );
        avatarImageUrl = upload.data.url;
      }
      await communitiesApi.update(route.params.communityId, {
        name: name.trim(),
        description: description.trim(),
        category: category.trim(),
        state: state.trim(),
        lga: lga.trim(),
        visibility,
        ...(imageUrl ? { imageUrl, coverImageUrl: imageUrl } : {}),
        ...(avatarImageUrl ? { avatarImageUrl } : {}),
        ...(newAccessCode ? { accessCode: newAccessCode } : {}),
        membershipType,
        membershipPriceKobo:
          membershipType === "premium" ? Math.round(priceNaira * 100) : 0,
      });
      if (visibility === "private" && community?.visibility !== "private") {
        await communitiesApi.updateSettings(route.params.communityId, {
          joinPolicy: "access_code",
        });
      }
      if (newAccessCode) {
        setCodeSaved(true);
        setCodeModalVisible(true);
        return;
      }
      setNotice({
        title: "Community updated",
        message: "Your changes were saved successfully.",
        success: true,
      });
    } catch (error) {
      setNotice({
        title: "Update failed",
        message:
          error instanceof ApiError
            ? error.message
            : "Unable to update this community.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SafeAreaView edges={[]} style={styles.safe}>
        <ProfilePageHeader title="Edit Community" onBack={navigation.goBack} />
        {loading ? (
          <View style={styles.loading}>
            <AppLoader color="#08b657" />
          </View>
        ) : community ? (
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.summary}>
              <View style={styles.icon}>
                <Ionicons color={colors.ink} name="people" size={24} />
              </View>
              <View style={styles.copy}>
                <Text style={styles.name}>{community.name}</Text>
                <Text style={styles.meta}>
                  {community.category} - {community.lga}, {community.state}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => void pickImage("cover")}
              style={styles.coverPicker}
            >
              {imageUri || community.coverImageUrl || community.imageUrl ? (
                <Image
                  source={{
                    uri:
                      imageUri || community.coverImageUrl || community.imageUrl,
                  }}
                  style={styles.coverImage}
                />
              ) : (
                <Ionicons color="#078d45" name="image-outline" size={28} />
              )}
              <Text style={styles.coverText}>Change cover image</Text>
            </Pressable>
            <Pressable
              onPress={() => void pickImage("avatar")}
              style={styles.avatarPicker}
            >
              {avatarUri || community.avatarImageUrl ? (
                <Image
                  source={{ uri: avatarUri || community.avatarImageUrl }}
                  style={styles.avatarImage}
                />
              ) : (
                <Ionicons
                  color="#078d45"
                  name="person-circle-outline"
                  size={32}
                />
              )}
              <Text style={styles.rotateText}>Change community avatar</Text>
            </Pressable>
            <Text style={styles.label}>Name</Text>
            <TextInput
              onChangeText={setName}
              style={styles.input}
              value={name}
            />
            <Text style={styles.label}>Category</Text>
            <TextInput
              onChangeText={setCategory}
              style={styles.input}
              value={category}
            />
            <Text style={styles.label}>Description</Text>
            <TextInput
              multiline
              onChangeText={setDescription}
              style={[styles.input, styles.multiline]}
              textAlignVertical="top"
              value={description}
            />
            <Text style={styles.label}>State</Text>
            <TextInput
              onChangeText={setState}
              style={styles.input}
              value={state}
            />
            <Text style={styles.label}>LGA</Text>
            <TextInput onChangeText={setLga} style={styles.input} value={lga} />
            <Text style={styles.label}>Visibility</Text>
            <View style={styles.options}>
              {(["public", "private"] as const).map((item) => (
                <Pressable
                  key={item}
                  onPress={() => {
                    setVisibility(item);
                    if (item === "public") setNewAccessCode(null);
                  }}
                  style={[
                    styles.option,
                    visibility === item && styles.optionActive,
                  ]}
                >
                  <Text style={styles.optionText}>{item}</Text>
                </Pressable>
              ))}
            </View>
            {visibility === "private" &&
            community.visibility === "private" &&
            community.joinPolicy === "access_code" ? (
              <Pressable
                onPress={() => setNewAccessCode(generateCode())}
                style={styles.rotateButton}
              >
                <Text style={styles.rotateText}>
                  {newAccessCode
                    ? "Generate another code"
                    : "Replace private access code"}
                </Text>
              </Pressable>
            ) : null}
            {newAccessCode ? (
              <Text selectable style={styles.codePreview}>
                New code: {newAccessCode}
              </Text>
            ) : null}
            <Text style={styles.label}>Membership type</Text>
            <View style={styles.options}>
              {(["free", "premium"] as const).map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setMembershipType(item)}
                  style={[
                    styles.option,
                    membershipType === item && styles.optionActive,
                  ]}
                >
                  <Text style={styles.optionText}>
                    {item === "free" ? "Free" : "Paid"}
                  </Text>
                </Pressable>
              ))}
            </View>
            {membershipType === "premium" ? (
              <>
                <Text style={styles.label}>Membership price (NGN)</Text>
                <TextInput
                  keyboardType="decimal-pad"
                  onChangeText={setPrice}
                  placeholder="5000"
                  placeholderTextColor="#718078"
                  style={styles.input}
                  value={price}
                />
              </>
            ) : null}
            <Pressable
              disabled={submitting}
              onPress={() => void save()}
              style={[styles.primary, submitting && styles.disabled]}
            >
              {submitting ? (
                <AppLoader color={colors.ink} />
              ) : (
                <Text style={styles.primaryText}>Save changes</Text>
              )}
            </Pressable>
          </ScrollView>
        ) : null}
      </SafeAreaView>
      <Modal
        transparent
        visible={codeModalVisible}
        animationType="fade"
        onRequestClose={() => {
          if (!submitting) setCodeModalVisible(false);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {codeSaved ? "Community updated" : "Save the new access code"}
            </Text>
            <Text style={styles.modalHelp}>
              {codeSaved
                ? "Share this code with new members. It cannot be retrieved later."
                : "This code will be write only after saving. Share it with new members along with the community ID."}
            </Text>
            <Text selectable style={styles.modalCode}>
              {newAccessCode}
            </Text>
            <Text selectable style={styles.modalId}>
              Community ID: {route.params.communityId}
            </Text>
            <Pressable
              disabled={submitting}
              onPress={() => {
                if (codeSaved) navigation.goBack();
                else void performSave();
              }}
              style={[styles.primary, submitting && styles.disabled]}
            >
              <Text style={styles.primaryText}>
                {submitting ? "Saving..." : codeSaved ? "Done" : "Save changes"}
              </Text>
            </Pressable>
            {!codeSaved ? (
              <Pressable
                disabled={submitting}
                onPress={() => setCodeModalVisible(false)}
                style={styles.modalCancel}
              >
                <Text style={styles.rotateText}>Back to form</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </Modal>
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
  safe: { backgroundColor: colors.paper, flex: 1 },
  loading: { alignItems: "center", flex: 1, justifyContent: "center" },
  content: { padding: 22, paddingBottom: 70 },
  summary: {
    alignItems: "center",
    backgroundColor: "#e9f8f0",
    borderRadius: 22,
    flexDirection: "row",
    padding: 15,
  },
  icon: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  copy: { flex: 1, marginLeft: 11 },
  name: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 16 },
  meta: {
    color: "#4e7861",
    fontFamily: fonts.medium,
    fontSize: 10,
    marginTop: 4,
  },
  label: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 12,
    marginBottom: 7,
    marginTop: 18,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 19,
    color: colors.ink,
    fontFamily: fonts.medium,
    minHeight: 52,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  multiline: { minHeight: 130 },
  options: { flexDirection: "row", gap: 9 },
  option: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: "transparent",
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    padding: 13,
  },
  optionActive: { backgroundColor: "#e9f8f0", borderColor: "#08b657" },
  optionText: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 11,
    textTransform: "capitalize",
  },
  primary: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: 24,
    height: 52,
    justifyContent: "center",
    marginTop: 25,
  },
  primaryText: { color: colors.ink, fontFamily: fonts.bold },
  disabled: { opacity: 0.55 },
  coverPicker: {
    alignItems: "center",
    backgroundColor: "#e9f8f0",
    borderRadius: 18,
    height: 140,
    justifyContent: "center",
    marginTop: 18,
    overflow: "hidden",
  },
  coverImage: { height: "100%", width: "100%" },
  coverText: {
    backgroundColor: "#e9f8f0",
    borderRadius: 12,
    bottom: 8,
    color: "#087b42",
    fontFamily: fonts.bold,
    fontSize: 11,
    padding: 5,
    position: "absolute",
  },
  avatarPicker: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  avatarImage: { borderRadius: 22, height: 44, width: 44 },
  rotateButton: { alignSelf: "flex-start", marginTop: 14 },
  rotateText: { color: "#087b42", fontFamily: fonts.bold, fontSize: 13 },
  codePreview: {
    color: "#087b42",
    fontFamily: fonts.extraBold,
    fontSize: 20,
    letterSpacing: 2,
    marginTop: 12,
  },
  modalBackdrop: {
    alignItems: "center",
    backgroundColor: "#0008",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    width: "100%",
  },
  modalTitle: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 20 },
  modalHelp: {
    color: "#53665a",
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
  },
  modalCode: {
    color: "#087b42",
    fontFamily: fonts.extraBold,
    fontSize: 27,
    letterSpacing: 3,
    marginTop: 15,
  },
  modalId: {
    color: colors.ink,
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 12,
  },
  modalCancel: { alignItems: "center", padding: 10 },
});
