import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
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
import type { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "CreateCommunity">;
type LocationDropdown = "state" | "lga" | null;

type Notice = {
  title: string;
  message: string;
  createdId?: string;
};

export default function CreateCommunityConnectedScreen({ navigation }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [state, setState] = useState("");
  const [lga, setLga] = useState("");
  const [locationDropdown, setLocationDropdown] =
    useState<LocationDropdown>(null);
  const [visibility, setVisibility] = useState("public");
  const [membershipType, setMembershipType] = useState("free");
  const [price, setPrice] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const lgaOptions = useMemo(() => [...getNigerianLgas(state)], [state]);

  const pickImage = async () => {
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
      aspect: [16, 9],
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
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

  const submit = async () => {
    const priceNaira = Number(price || 0);
    if (
      !name.trim() ||
      description.trim().length < 10 ||
      !category.trim() ||
      !state ||
      !lga
    ) {
      setNotice({
        title: "Complete the form",
        message:
          "Name, category, state, LGA, and a description of at least 10 characters are required.",
      });
      return;
    }
    if (
      membershipType === "paid" &&
      (!Number.isFinite(priceNaira) || priceNaira <= 0)
    ) {
      setNotice({
        title: "Enter a price",
        message: "Paid communities require a valid membership price.",
      });
      return;
    }
    if (submitting) return;

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

      const response = await communitiesApi.create({
        name: name.trim(),
        description: description.trim(),
        category: category.trim(),
        imageUrl,
        state,
        lga,
        visibility,
        membershipType,
        membershipPriceKobo:
          membershipType === "paid" ? Math.round(priceNaira * 100) : 0,
      });
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
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            onPress={() => void pickImage()}
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
            {["public", "private"].map((item) => (
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
            {["free", "paid"].map((item) => (
              <Option
                key={item}
                active={membershipType === item}
                label={item}
                onPress={() => setMembershipType(item)}
              />
            ))}
          </View>

          {membershipType === "paid" ? (
            <Field
              label="Membership price (NGN)"
              value={price}
              onChangeText={setPrice}
              placeholder="5000"
              keyboardType="decimal-pad"
            />
          ) : null}

          <Pressable
            disabled={submitting}
            onPress={() => void submit()}
            style={[styles.primary, submitting && styles.disabled]}
          >
            {submitting ? (
              <ActivityIndicator color={colors.ink} />
            ) : (
              <Text style={styles.primaryText}>Create community</Text>
            )}
          </Pressable>
        </ScrollView>
      </SafeAreaView>

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
});
