import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import * as Crypto from "expo-crypto";
import { useMemo, useState } from "react";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppAlertModal from "../../components/ui/app-alert-modal";
import AppSelectSheet from "../../components/ui/app-select-sheet";
import ProfilePageHeader from "../../components/ui/profile-page-header";
import { getNigerianLgas, NIGERIAN_STATES } from "../../data/nigeria-locations";
import { ApiError } from "../../services/api/client";
import { communitiesApi } from "../../services/api/communities.api";
import { uploadsApi } from "../../services/api/uploads.api";
import { colors, fonts } from "../../styles/theme";
import type { PostCommunitiesBody } from "../../types/api.generated";
import type { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "CreateCommunity">;
type LocationDropdown = "state" | "lga" | null;
type CommunityVisibility = NonNullable<PostCommunitiesBody["visibility"]>;
type CommunityMembershipType = NonNullable<
  PostCommunitiesBody["membershipType"]
>;

type Notice = {
  title: string;
  message: string;
  createdId?: string;
};

function generateAccessCode() {
  return Crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
}

export default function CreateCommunityConnectedScreen({ navigation }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [state, setState] = useState("");
  const [lga, setLga] = useState("");
  const [locationDropdown, setLocationDropdown] =
    useState<LocationDropdown>(null);
  const [visibility, setVisibility] = useState<CommunityVisibility>("public");
  const [membershipType, setMembershipType] =
    useState<CommunityMembershipType>("free");
  const [price, setPrice] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [accessCode, setAccessCode] = useState(generateAccessCode);
  const [codeModalVisible, setCodeModalVisible] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const lgaOptions = useMemo(() => [...getNigerianLgas(state)], [state]);

  const pickImage = async (kind: "cover" | "avatar") => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setNotice({
        title: "Photo permission",
        message: "Allow photo access to add a community image.",
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

  const selectLocation = (value: string) => {
    if (locationDropdown === "state") {
      setState(value);
      setLga("");
      return;
    }

    if (locationDropdown === "lga") {
      setLga(value);
    }
  };

  const submit = () => {
    const priceNaira = Number(price || 0);
    if (
      name.trim().length < 3 ||
      description.trim().length < 20 ||
      category.trim().length < 2 ||
      !state ||
      !lga
    ) {
      setNotice({
        title: "Complete the form",
        message:
          "Enter a name (3+ characters), category (2+), state, LGA, and description (20+).",
      });
      return;
    }
    if (
      membershipType === "premium" &&
      (!Number.isFinite(priceNaira) || priceNaira <= 0)
    ) {
      setNotice({
        title: "Enter a price",
        message: "Paid communities require a valid membership price.",
      });
      return;
    }
    if (visibility === "private" && membershipType === "premium") {
      setNotice({
        title: "Paid private communities unavailable",
        message:
          "Paid communities must be public with open joining. Choose free or public.",
      });
      return;
    }
    if (submitting) return;

    if (visibility === "private") {
      setCodeModalVisible(true);
      return;
    }
    void createCommunity();
  };

  const createCommunity = async () => {
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

      const response = await communitiesApi.create({
        name: name.trim(),
        description: description.trim(),
        category: category.trim(),
        imageUrl,
        coverImageUrl: imageUrl,
        avatarImageUrl,
        ...(visibility === "private" ? { accessCode } : {}),
        joinPolicy: visibility === "private" ? "access_code" : "open",
        state,
        lga,
        visibility,
        membershipType,
        membershipPriceKobo:
          membershipType === "premium" ? Math.round(priceNaira * 100) : 0,
      });
      if (visibility === "private") {
        setCreatedId(response.data.community._id);
        return;
      }
      setNotice({
        title: "Community created",
        message: "Your community is ready.",
        createdId: response.data.community._id,
      });
    } catch (error) {
      setNotice({
        title: "Creation failed",
        message:
          error instanceof ApiError
            ? error.message
            : "Unable to create this community.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const closeNotice = () => {
    const id = notice?.createdId;
    setNotice(null);
    if (id) {
      navigation.replace("CommunityProfile", { communityId: id });
    }
  };

  const dropdownOptions =
    locationDropdown === "state" ? NIGERIAN_STATES : lgaOptions;
  const dropdownValue = locationDropdown === "state" ? state : lga;

  return (
    <>
      <SafeAreaView edges={[]} style={styles.safe}>
        <ProfilePageHeader
          title="Create Community"
          onBack={navigation.goBack}
        />
        <KeyboardAwareScrollView
          enableOnAndroid
          extraScrollHeight={20}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          style={styles.formScroll}
        >
          <Pressable
            onPress={() => void pickImage("cover")}
            style={styles.imagePicker}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.image} />
            ) : (
              <>
                <Ionicons color="#078d45" name="image-outline" size={32} />
                <Text style={styles.imageText}>Add cover image</Text>
              </>
            )}
          </Pressable>
          <Pressable
            onPress={() => void pickImage("avatar")}
            style={styles.avatarPicker}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <Ionicons
                color="#078d45"
                name="person-circle-outline"
                size={34}
              />
            )}
            <Text style={styles.avatarText}>Add community avatar</Text>
          </Pressable>

          <Field
            label="Community name"
            value={name}
            onChangeText={setName}
            placeholder="Lagos Tech Circle"
          />
          <Field
            label="Category"
            value={category}
            onChangeText={setCategory}
            placeholder="Technology"
          />
          <Field
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="What brings this community together?"
            multiline
          />

          <LocationSelect
            label="State"
            value={state}
            placeholder="Select a state"
            onPress={() => setLocationDropdown("state")}
          />
          <LocationSelect
            disabled={!state}
            label="LGA"
            value={lga}
            placeholder={state ? "Select an LGA" : "Select a state first"}
            onPress={() => setLocationDropdown("lga")}
          />

          <Text style={styles.label}>Visibility</Text>
          <View style={styles.options}>
            {(["public", "private"] as const).map((item) => (
              <Option
                key={item}
                active={visibility === item}
                label={item}
                onPress={() => setVisibility(item)}
              />
            ))}
          </View>

          <Text style={styles.label}>Membership</Text>
          <View style={styles.options}>
            {(["free", "premium"] as const).map((item) => (
              <Option
                key={item}
                active={membershipType === item}
                label={item === "free" ? "Free" : "Paid"}
                onPress={() => setMembershipType(item)}
              />
            ))}
          </View>

          {membershipType === "premium" ? (
            <Field
              label="Membership price (NGN)"
              value={price}
              onChangeText={setPrice}
              placeholder="5000"
              keyboardType="decimal-pad"
            />
          ) : null}

          {visibility === "private" ? (
            <View style={styles.codePreview}>
              <Text style={styles.codeTitle}>Private access code</Text>
              <Text style={styles.codeValue}>{accessCode}</Text>
              <Text style={styles.codeHelp}>
                Save this code. It cannot be retrieved after creation.
              </Text>
              <Pressable onPress={() => setAccessCode(generateAccessCode())}>
                <Text style={styles.regenerate}>Generate another code</Text>
              </Pressable>
            </View>
          ) : null}

          <Pressable
            disabled={submitting}
            onPress={submit}
            style={[styles.primary, submitting && styles.disabled]}
          >
            {submitting ? (
              <ActivityIndicator color={colors.ink} />
            ) : (
              <Text style={styles.primaryText}>Create community</Text>
            )}
          </Pressable>
        </KeyboardAwareScrollView>
      </SafeAreaView>

      <Modal
        animationType="fade"
        transparent
        visible={codeModalVisible}
        onRequestClose={() => {
          if (!submitting && !createdId) setCodeModalVisible(false);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {createdId
                ? "Private community created"
                : "Save your access code"}
            </Text>
            <Text style={styles.modalText}>
              {createdId
                ? "Share this code with people you want to invite. The code will not appear again."
                : "People can use this code to find and join your private community. Save it before creating the community."}
            </Text>
            {createdId ? (
              <Text selectable style={styles.modalId}>
                Community ID: {createdId}
              </Text>
            ) : null}
            <Text selectable style={styles.modalCode}>
              {accessCode}
            </Text>
            <Pressable
              disabled={submitting}
              onPress={() => {
                if (createdId) {
                  setCodeModalVisible(false);
                  navigation.replace("CommunityProfile", {
                    communityId: createdId,
                  });
                } else {
                  void createCommunity();
                }
              }}
              style={[styles.primary, submitting && styles.disabled]}
            >
              <Text style={styles.primaryText}>
                {submitting
                  ? "Creating..."
                  : createdId
                    ? "Done"
                    : "Create community"}
              </Text>
            </Pressable>
            {!createdId && !submitting ? (
              <Pressable
                onPress={() => setCodeModalVisible(false)}
                style={styles.modalCancel}
              >
                <Text style={styles.regenerate}>Back to form</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </Modal>

      <AppSelectSheet
        visible={locationDropdown !== null}
        title={
          locationDropdown === "state"
            ? "Select state"
            : `Select LGA in ${state}`
        }
        options={[...dropdownOptions]}
        value={dropdownValue}
        onSelect={selectLocation}
        onClose={() => setLocationDropdown(null)}
      />
      <AppAlertModal
        visible={Boolean(notice)}
        title={notice?.title ?? ""}
        message={notice?.message ?? ""}
        onClose={closeNotice}
      />
    </>
  );
}

function Field({
  label,
  multiline,
  ...props
}: { label: string; multiline?: boolean } & React.ComponentProps<
  typeof TextInput
>) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor="#718078"
        style={[styles.input, multiline && styles.multiline]}
      />
    </View>
  );
}

function LocationSelect({
  disabled = false,
  label,
  onPress,
  placeholder,
  value,
}: {
  disabled?: boolean;
  label: string;
  onPress: () => void;
  placeholder: string;
  value: string;
}) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        style={[styles.select, disabled && styles.selectDisabled]}
      >
        <Text
          numberOfLines={1}
          style={[styles.selectText, !value && styles.selectPlaceholder]}
        >
          {value || placeholder}
        </Text>
        <Ionicons color="#718078" name="chevron-down" size={18} />
      </Pressable>
    </View>
  );
}

function Option({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.option, active && styles.optionActive]}
    >
      <Text style={styles.optionText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.paper, flex: 1 },
  formScroll: { flex: 1 },
  content: { padding: 22, paddingBottom: 70 },
  imagePicker: {
    alignItems: "center",
    backgroundColor: "#e7f6ee",
    borderRadius: 24,
    height: 150,
    justifyContent: "center",
    overflow: "hidden",
  },
  image: { height: "100%", width: "100%" },
  imageText: {
    color: "#078d45",
    fontFamily: fonts.bold,
    fontSize: 12,
    marginTop: 8,
  },
  avatarPicker: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 10,
    marginTop: 15,
  },
  avatarImage: { borderRadius: 22, height: 44, width: 44 },
  avatarText: { color: "#078d45", fontFamily: fonts.bold, fontSize: 12 },
  label: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 11,
    marginBottom: 7,
    marginTop: 16,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 18,
    color: colors.ink,
    fontFamily: fonts.medium,
    minHeight: 50,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  multiline: { minHeight: 105, textAlignVertical: "top" },
  select: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: "#dbece3",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 52,
    paddingHorizontal: 15,
  },
  selectDisabled: { opacity: 0.55 },
  selectText: {
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  selectPlaceholder: { color: "#718078" },
  options: { flexDirection: "row", gap: 9 },
  option: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: "transparent",
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    padding: 12,
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
    marginTop: 24,
  },
  primaryText: { color: colors.ink, fontFamily: fonts.bold },
  disabled: { opacity: 0.55 },
  codePreview: {
    backgroundColor: "#e9f8f0",
    borderRadius: 18,
    marginTop: 20,
    padding: 17,
  },
  codeTitle: { color: colors.ink, fontFamily: fonts.bold, fontSize: 14 },
  codeValue: {
    color: "#087b42",
    fontFamily: fonts.extraBold,
    fontSize: 26,
    letterSpacing: 3,
    marginTop: 8,
  },
  codeHelp: {
    color: "#53665a",
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 5,
  },
  regenerate: {
    color: "#087b42",
    fontFamily: fonts.bold,
    fontSize: 13,
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
  modalText: {
    color: "#53665a",
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },
  modalId: {
    color: colors.ink,
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 18,
  },
  modalCode: {
    color: "#087b42",
    fontFamily: fonts.extraBold,
    fontSize: 29,
    letterSpacing: 3,
    marginTop: 12,
  },
  modalCancel: { alignItems: "center", padding: 8 },
});
