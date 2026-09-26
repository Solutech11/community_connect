import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useRef, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import AppAlertModal from "../../components/ui/app-alert-modal";
import AppSelectSheet from "../../components/ui/app-select-sheet";
import EventLocationPickerField from "../../components/ui/event-location-picker-field";
import KeyboardAwareScrollView from "../../components/ui/keyboard-aware-scroll-view";
import {
  BottomActions,
  CreateEventHeader,
  EventField,
  SelectField,
  StepProgress,
} from "../../components/ui/create-event-ui";
import {
  EVENT_ACTIVITY_TYPES,
  EVENT_AUDIENCES,
  EVENT_COUNTRIES,
  LOCAL_AREAS_BY_REGION,
  REGIONS_BY_COUNTRY,
} from "../../data/event-locations";
import { aiApi } from "../../services/api/ai.api";
import { ApiError } from "../../services/api/client";
import type { LocationSearchResult } from "../../services/api/locations.api";
import { getRegistrationLocation } from "../../services/location/registration-location.service";
import { createEventDraftStorage } from "../../services/storage/create-event-draft.storage";
import { colors, fonts } from "../../styles/theme";
import {
  EVENT_SETTING_VALUES,
  normalizeEventSetting,
  type EventSetting,
} from "../../types/events";
import type {
  CreateEventDraft,
  RootStackParamList,
} from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "CreateEventDetails">;
type DropdownName = "country" | "state" | "lga" | "activityType" | "audience";

const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1400&q=88";

export default function CreateEventDetailsScreen({ navigation, route }: Props) {
  const seed = route.params?.draft;
  const latestDraft = useRef<Partial<CreateEventDraft>>(seed ?? {});
  const appliedRouteDraft = useRef<Partial<CreateEventDraft> | undefined>(
    undefined,
  );
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [title, setTitle] = useState(seed?.title ?? "");
  const [coverImage, setCoverImage] = useState(seed?.coverImage ?? "");
  const [description, setDescription] = useState(seed?.description ?? "");
  const [country, setCountry] = useState(seed?.country ?? "Nigeria");
  const [state, setState] = useState(seed?.state ?? "Lagos");
  const [lga, setLga] = useState(seed?.lga ?? "Ikeja");
  const [venueName, setVenueName] = useState(seed?.venueName ?? "");
  const [address, setAddress] = useState(seed?.address ?? "");
  const [latitude, setLatitude] = useState(seed?.latitude ?? "");
  const [longitude, setLongitude] = useState(seed?.longitude ?? "");
  const [phone, setPhone] = useState(seed?.phone ?? "");
  const [capacity, setCapacity] = useState(seed?.capacity ?? "");
  const [activityType, setActivityType] = useState(
    seed?.activityType ?? "Workshop",
  );
  const [audience, setAudience] = useState(seed?.audience ?? "All Ages");
  const [setting, setSetting] = useState<EventSetting>(() =>
    normalizeEventSetting(seed?.setting),
  );
  const [dropdown, setDropdown] = useState<DropdownName | null>(null);
  const [alert, setAlert] = useState("");
  const [improving, setImproving] = useState(false);
  const [locating, setLocating] = useState(false);

  const applyDraft = useCallback((draft: Partial<CreateEventDraft>) => {
    latestDraft.current = { ...latestDraft.current, ...draft };
    setTitle(draft.title ?? "");
    setCoverImage(draft.coverImage ?? "");
    setDescription(draft.description ?? "");
    setCountry(draft.country ?? "Nigeria");
    setState(draft.state ?? "Lagos");
    setLga(draft.lga ?? "Ikeja");
    setVenueName(draft.venueName ?? "");
    setAddress(draft.address ?? "");
    setLatitude(draft.latitude ?? "");
    setLongitude(draft.longitude ?? "");
    setPhone(draft.phone ?? "");
    setCapacity(draft.capacity ?? "");
    setActivityType(draft.activityType ?? "Workshop");
    setAudience(draft.audience ?? "All Ages");
    setSetting(normalizeEventSetting(draft.setting));
  }, []);

  useEffect(() => {
    let active = true;
    void createEventDraftStorage.get().then((storedDraft) => {
      if (!active) return;
      const initialDraft = seed ?? storedDraft;
      if (initialDraft) applyDraft(initialDraft);
      appliedRouteDraft.current = seed;
      setDraftHydrated(true);
    });

    return () => {
      active = false;
    };
  }, [applyDraft]);

  useEffect(() => {
    const nextDraft = route.params?.draft;
    if (
      !draftHydrated ||
      !nextDraft ||
      nextDraft === appliedRouteDraft.current
    ) {
      return;
    }
    appliedRouteDraft.current = nextDraft;
    applyDraft(nextDraft);
  }, [applyDraft, draftHydrated, route.params?.draft]);

  useEffect(() => {
    if (!draftHydrated) return;
    void createEventDraftStorage.save({
      ...latestDraft.current,
      title,
      coverImage,
      description,
      country,
      state,
      lga,
      venueName,
      address,
      latitude,
      longitude,
      phone,
      capacity,
      activityType,
      audience,
      setting,
      startDate: latestDraft.current.startDate ?? "",
      startTime: latestDraft.current.startTime ?? "",
      endDate: latestDraft.current.endDate ?? "",
      endTime: latestDraft.current.endTime ?? "",
      tickets: latestDraft.current.tickets ?? [],
    });
  }, [
    activityType,
    address,
    audience,
    capacity,
    country,
    coverImage,
    description,
    lga,
    latitude,
    longitude,
    phone,
    seed,
    setting,
    state,
    title,
    venueName,
  ]);

  const pickCover = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [16, 9],
      mediaTypes: ["images"],
      quality: 0.85,
    });
    if (!result.canceled) {
      setCoverImage(result.assets[0].uri);
    }
  };

  const buildDraft = (): CreateEventDraft => ({
    ...latestDraft.current,
    title,
    coverImage: coverImage || DEFAULT_COVER,
    description,
    country,
    state,
    lga,
    venueName,
    address,
    latitude,
    longitude,
    phone,
    capacity,
    activityType,
    audience,
    setting,
    startDate: latestDraft.current.startDate ?? "",
    startTime: latestDraft.current.startTime ?? "",
    endDate: latestDraft.current.endDate ?? "",
    endTime: latestDraft.current.endTime ?? "",
    tickets: latestDraft.current.tickets ?? [],
  });

  const useCurrentLocation = async () => {
    if (locating) return;
    setLocating(true);
    try {
      const location = await getRegistrationLocation();
      if (!location) {
        setAlert(
          "Location access is unavailable. Search for the venue or place the pin on the map.",
        );
        return;
      }

      const coordinates = location.coordinates;
      const currentLongitude = coordinates?.[0];
      const currentLatitude = coordinates?.[1];
      if (
        typeof currentLongitude !== "number" ||
        typeof currentLatitude !== "number" ||
        !Number.isFinite(currentLongitude) ||
        !Number.isFinite(currentLatitude)
      ) {
        setAlert(
          "Could not read a valid location. Search for the venue or place the pin on the map.",
        );
        return;
      }

      setLatitude(String(currentLatitude));
      setLongitude(String(currentLongitude));
    } catch {
      setAlert(
        "Could not get your current location. Search for the venue or place the pin on the map.",
      );
    } finally {
      setLocating(false);
    }
  };

  const selectMapLocation = (result: LocationSearchResult) => {
    setVenueName(result.name || venueName);
    setAddress(result.address || result.label || address);
    if (result.state) setState(result.state);
    if (result.localArea) setLga(result.localArea);
  };

  const dropdownOptions =
    dropdown === "country"
      ? EVENT_COUNTRIES
      : dropdown === "state"
        ? (REGIONS_BY_COUNTRY[country] ?? [])
        : dropdown === "lga"
          ? (LOCAL_AREAS_BY_REGION[state] ?? [])
          : dropdown === "activityType"
            ? EVENT_ACTIVITY_TYPES
            : EVENT_AUDIENCES;

  const dropdownValue =
    dropdown === "country"
      ? country
      : dropdown === "state"
        ? state
        : dropdown === "lga"
          ? lga
          : dropdown === "activityType"
            ? activityType
            : audience;

  const dropdownTitle =
    dropdown === "country"
      ? "Select country"
      : dropdown === "state"
        ? country === "Nigeria"
          ? "Select state"
          : "Select region"
        : dropdown === "lga"
          ? country === "Nigeria"
            ? "Select LGA"
            : "Select local area"
          : dropdown === "activityType"
            ? "Select activity type"
            : "Select target audience";

  const selectDropdownValue = (value: string) => {
    if (dropdown === "country") {
      setCountry(value);
      const nextState = REGIONS_BY_COUNTRY[value]?.[0] ?? "";
      setState(nextState);
      setLga(LOCAL_AREAS_BY_REGION[nextState]?.[0] ?? "");
    } else if (dropdown === "state") {
      setState(value);
      setLga(LOCAL_AREAS_BY_REGION[value]?.[0] ?? "");
    } else if (dropdown === "lga") {
      setLga(value);
    } else if (dropdown === "activityType") {
      setActivityType(value);
    } else if (dropdown === "audience") {
      setAudience(value);
    }
  };

  const improveDescriptionWithAi = async () => {
    if (!title.trim() || improving) {
      if (!title.trim())
        setAlert(
          "Add an event title first so Community AI can write relevant copy.",
        );
      return;
    }
    setImproving(true);
    try {
      const response = await aiApi.eventCopy({
        title: title.trim(),
        activityType,
        targetAudience: audience || undefined,
        setting: setting.toLowerCase(),
        details: description.trim() || undefined,
      });
      setDescription(response.data.message);
    } catch (error) {
      setAlert(
        error instanceof ApiError
          ? error.message
          : "Community AI could not improve the event copy.",
      );
    } finally {
      setImproving(false);
    }
  };

  const goNext = () => {
    const latitudeValue = Number(latitude);
    const longitudeValue = Number(longitude);
    const validCoordinates =
      latitude.trim() !== "" &&
      longitude.trim() !== "" &&
      Number.isFinite(latitudeValue) &&
      latitudeValue >= -90 &&
      latitudeValue <= 90 &&
      Number.isFinite(longitudeValue) &&
      longitudeValue >= -180 &&
      longitudeValue <= 180;

    if (
      !title.trim() ||
      !description.trim() ||
      !phone.trim() ||
      !state.trim() ||
      !lga.trim() ||
      !venueName.trim() ||
      !address.trim() ||
      !Number.isInteger(Number(capacity)) ||
      Number(capacity) <= 0
    ) {
      setAlert(
        "Add the venue, full address, and a positive whole-number capacity before continuing.",
      );
      return;
    }
    if (!validCoordinates) {
      setAlert(
        "Search for the venue, place the pin on the map, or use your current location before continuing.",
      );
      return;
    }

    const draft = buildDraft();
    draft.title = title.trim();
    draft.description = description.trim();
    draft.venueName = venueName.trim();
    draft.address = address.trim();
    draft.latitude = latitude.trim();
    draft.longitude = longitude.trim();
    draft.phone = phone.trim();
    draft.capacity = capacity.trim();
    void createEventDraftStorage.save(draft);
    navigation.navigate("CreateEventDateTime", { draft });
  };

  return (
    <View style={styles.safe}>
      <CreateEventHeader title="CommunityConnect" onBack={navigation.goBack} />
      <StepProgress label="Basic Info" step={1} />
      <KeyboardAwareScrollView
        contentContainerStyle={styles.content}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <EventField
          label="Event Title"
          onChangeText={setTitle}
          placeholder="Give your event a catchy name"
          value={title}
        />

        <View style={styles.block}>
          <Text style={styles.label}>Cover Image</Text>
          <Pressable onPress={pickCover} style={styles.upload}>
            {coverImage ? (
              <Image source={{ uri: coverImage }} style={styles.preview} />
            ) : (
              <>
                <Ionicons color="#08bd58" name="image-outline" size={35} />
                <Text style={styles.uploadTitle}>
                  Tap to upload high-quality cover photo
                </Text>
                <Text style={styles.uploadHint}>
                  RECOMMENDED: 1600 X 900 PX
                </Text>
              </>
            )}
          </Pressable>
        </View>

        <EventField
          label="Description"
          multiline
          onChangeText={setDescription}
          placeholder="Tell the community what makes this event special..."
          style={styles.description}
          textAlignVertical="top"
          value={description}
        />
        <Pressable
          disabled={improving}
          onPress={() => void improveDescriptionWithAi()}
          style={styles.aiWriter}
        >
          <View style={styles.aiWriterIcon}>
            <Ionicons color={colors.ink} name="sparkles" size={18} />
          </View>
          <View style={styles.aiWriterCopy}>
            <Text style={styles.aiWriterTitle}>
              {improving
                ? "Community AI is writing..."
                : "Improve with Community AI"}
            </Text>
            <Text style={styles.aiWriterText}>
              Generate clear, inviting event copy from your title.
            </Text>
          </View>
          <Ionicons color="#08ad54" name="arrow-forward" size={19} />
        </Pressable>

        <Text style={styles.sectionTitle}>Location Details</Text>
        <SelectField
          label="Country"
          onPress={() => setDropdown("country")}
          value={country}
        />
        <SelectField
          label={country === "Nigeria" ? "State" : "Region"}
          onPress={() => setDropdown("state")}
          value={state || "Select a region"}
        />
        <SelectField
          label={country === "Nigeria" ? "LGA" : "Local Area"}
          onPress={() => setDropdown("lga")}
          value={lga || "Select your local area"}
        />

        <EventField
          icon="business-outline"
          label="Venue Name"
          onChangeText={setVenueName}
          placeholder="e.g. Civic Centre"
          value={venueName}
        />
        <EventField
          icon="location-outline"
          label="Full Address"
          onChangeText={setAddress}
          placeholder="Street, landmark, and area"
          value={address}
        />

        <View style={styles.locationSection}>
          <View style={styles.coordinatesHeading}>
            <View style={styles.coordinatesCopy}>
              <Text style={styles.label}>Venue Location</Text>
              <Text style={styles.coordinatesHint}>
                Add the exact map location to help attendees find your event.
              </Text>
            </View>
            <Pressable
              disabled={locating}
              onPress={() => void useCurrentLocation()}
              style={[
                styles.locationButton,
                locating && styles.locationButtonDisabled,
              ]}
            >
              <Ionicons color="#078d45" name="navigate-outline" size={16} />
              <Text style={styles.locationButtonText}>
                {locating ? "Finding..." : "Use current location"}
              </Text>
            </Pressable>
          </View>
          <EventLocationPickerField
            country={country}
            latitude={latitude}
            longitude={longitude}
            onCoordinateChange={(nextLatitude, nextLongitude) => {
              setLatitude(nextLatitude);
              setLongitude(nextLongitude);
            }}
            onLocationSelect={selectMapLocation}
          />
        </View>

        <EventField
          icon="call-outline"
          keyboardType="phone-pad"
          label="Contact Phone"
          onChangeText={setPhone}
          placeholder="+234 000 000 0000"
          value={phone}
        />
        <EventField
          icon="people-outline"
          keyboardType="number-pad"
          label="Max Capacity"
          onChangeText={setCapacity}
          placeholder="e.g. 50"
          value={capacity}
        />
        <SelectField
          label="Activity Type"
          onPress={() => setDropdown("activityType")}
          value={activityType}
        />
        <SelectField
          label="Target Audience"
          onPress={() => setDropdown("audience")}
          value={audience}
        />

        <View style={styles.block}>
          <Text style={styles.label}>Event Setting</Text>
          <View style={styles.settingOptions}>
            {EVENT_SETTING_VALUES.map((item) => {
              const selected = setting === item;
              const label = item.charAt(0).toUpperCase() + item.slice(1);

              return (
                <Pressable
                  key={item}
                  onPress={() => setSetting(item)}
                  style={[
                    styles.settingOption,
                    selected && styles.toggleOptionOn,
                  ]}
                >
                  <Text
                    style={[styles.toggleText, selected && styles.toggleTextOn]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </KeyboardAwareScrollView>
      <BottomActions onNext={goNext} />
      <AppSelectSheet
        allowCustomValue={dropdown === "lga"}
        onClose={() => setDropdown(null)}
        onSelect={selectDropdownValue}
        options={dropdownOptions}
        title={dropdownTitle}
        value={dropdownValue}
        visible={dropdown !== null}
      />
      <AppAlertModal
        message={alert}
        onClose={() => setAlert("")}
        title="Complete event details"
        visible={!!alert}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.paper, flex: 1 },
  content: { gap: 28, padding: 24, paddingBottom: 100 },
  block: { gap: 12 },
  locationSection: { gap: 16 },
  coordinatesHeading: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  coordinatesCopy: { flex: 1, gap: 4 },
  coordinatesHint: {
    color: "#668071",
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  locationButton: {
    alignItems: "center",
    backgroundColor: "#e7f8ef",
    borderRadius: 18,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  locationButtonDisabled: { opacity: 0.55 },
  locationButtonText: {
    color: "#078d45",
    fontFamily: fonts.bold,
    fontSize: 10,
  },
  label: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  upload: {
    alignItems: "center",
    backgroundColor: "#eefaf4",
    borderColor: "#bde8d0",
    borderRadius: 28,
    borderStyle: "dashed",
    borderWidth: 1.5,
    height: 185,
    justifyContent: "center",
    overflow: "hidden",
  },
  preview: { height: "100%", width: "100%" },
  uploadTitle: {
    color: "#31975e",
    fontFamily: fonts.bold,
    fontSize: 12,
    marginTop: 10,
  },
  uploadHint: {
    color: "#9cc9af",
    fontFamily: fonts.medium,
    fontSize: 9,
    marginTop: 4,
  },
  description: { height: 92, paddingTop: 12 },
  aiWriter: {
    alignItems: "center",
    backgroundColor: "#e7f8ef",
    borderRadius: 23,
    flexDirection: "row",
    gap: 10,
    marginTop: -17,
    padding: 13,
  },
  aiWriterIcon: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  aiWriterCopy: { flex: 1 },
  aiWriterTitle: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  aiWriterText: {
    color: "#3d7c5d",
    fontFamily: fonts.medium,
    fontSize: 9,
    marginTop: 2,
  },
  sectionTitle: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 17,
    marginBottom: -8,
  },
  settingOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  settingOption: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: "#e1f0e8",
    borderRadius: 20,
    borderWidth: 1,
    flexBasis: "48%",
    justifyContent: "center",
    minHeight: 50,
    paddingHorizontal: 12,
  },
  toggleOptionOn: { backgroundColor: "#08bd58", borderColor: "#08bd58" },
  toggleText: {
    color: "#32965d",
    fontFamily: fonts.medium,
    fontSize: 15,
  },
  toggleTextOn: { color: colors.white, fontFamily: fonts.bold },
});
