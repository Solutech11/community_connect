import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppAlertModal from "../../components/ui/app-alert-modal";
import EventLocationMap, {
  type MapCoordinate,
} from "../../components/ui/event-location-map";
import {
  locationsApi,
  type LocationSearchResult,
} from "../../services/api/locations.api";
import { ApiError } from "../../services/api/client";
import { getRegistrationLocation } from "../../services/location/registration-location.service";
import { createEventDraftStorage } from "../../services/storage/create-event-draft.storage";
import { colors, fonts } from "../../styles/theme";
import type { GetLocationsSearchQuery } from "../../types/api.generated";
import type { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<
  RootStackParamList,
  "CreateEventLocationPicker"
>;
type SearchState = "idle" | "loading" | "success" | "empty" | "error";

const COUNTRY_CODES: Record<string, string> = {
  Nigeria: "NG",
  Ghana: "GH",
  Kenya: "KE",
};

function parseCoordinate(latitude: string, longitude: string) {
  if (!latitude.trim() || !longitude.trim()) return null;
  const lat = Number(latitude);
  const lon = Number(longitude);
  if (
    !Number.isFinite(lat) ||
    lat < -90 ||
    lat > 90 ||
    !Number.isFinite(lon) ||
    lon < -180 ||
    lon > 180
  ) {
    return null;
  }
  return { latitude: lat, longitude: lon } satisfies MapCoordinate;
}

function formatCoordinate(value: number) {
  return value.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
}

export default function CreateEventLocationPickerScreen({
  navigation,
  route,
}: Props) {
  const { draft } = route.params;
  const country = draft.country ?? "Nigeria";
  const [coordinate, setCoordinate] = useState<MapCoordinate | null>(() =>
    parseCoordinate(draft.latitude ?? "", draft.longitude ?? ""),
  );
  const [query, setQuery] = useState(
    draft.venueName?.trim() || draft.address?.trim() || "",
  );
  const [results, setResults] = useState<LocationSearchResult[]>([]);
  const [attribution, setAttribution] = useState("");
  const [searchState, setSearchState] = useState<SearchState>("idle");
  const [searchError, setSearchError] = useState("");
  const [searchAttempt, setSearchAttempt] = useState(0);
  const [selectedSearchResult, setSelectedSearchResult] =
    useState<LocationSearchResult | null>(null);
  const [locating, setLocating] = useState(false);
  const [alert, setAlert] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const searchText = query.trim();
    if (searchText.length < 2) {
      setResults([]);
      setAttribution("");
      setSearchError("");
      setSearchState("idle");
      return;
    }

    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setSearchState("loading");
      setSearchError("");

      const searchQuery: GetLocationsSearchQuery = {
        q: searchText,
        countryCode: COUNTRY_CODES[country],
        limit: 8,
      };
      if (coordinate) {
        searchQuery.latitude = coordinate.latitude;
        searchQuery.longitude = coordinate.longitude;
      }

      void locationsApi
        .search(searchQuery, controller.signal)
        .then((response) => {
          if (!active) return;
          setResults(response.data.results);
          setAttribution(response.data.attribution);
          setSearchState(
            response.data.results.length > 0 ? "success" : "empty",
          );
        })
        .catch((error: unknown) => {
          if (!active || controller.signal.aborted) return;
          setResults([]);
          setSearchState("error");
          setSearchError(
            error instanceof ApiError
              ? error.message
              : "Location search failed. Check your connection and try again.",
          );
        });
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [country, query, searchAttempt]);

  const setMapCoordinate = (longitude: number, latitude: number) => {
    if (
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90 ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      return;
    }
    setCoordinate({ latitude, longitude });
    setSelectedSearchResult(null);
  };

  const useCurrentLocation = async () => {
    if (locating) return;
    setLocating(true);
    try {
      const location = await getRegistrationLocation();
      if (!location) {
        setAlert(
          "Location permission was not granted or location services are off. Search for a place or tap the map to set the venue.",
        );
        return;
      }

      const longitude = location.coordinates?.[0];
      const latitude = location.coordinates?.[1];
      if (
        typeof longitude !== "number" ||
        typeof latitude !== "number" ||
        !Number.isFinite(longitude) ||
        !Number.isFinite(latitude)
      ) {
        setAlert(
          "Could not read valid coordinates. Tap the map to choose the venue location.",
        );
        return;
      }
      setMapCoordinate(longitude, latitude);
    } catch {
      setAlert(
        "Could not read your location. Search for a place or tap the map to set the venue.",
      );
    } finally {
      setLocating(false);
    }
  };

  const selectSearchResult = (result: LocationSearchResult) => {
    Keyboard.dismiss();
    setResults([]);
    setSearchState("idle");
    setSelectedSearchResult(result);
    setCoordinate({
      latitude: result.latitude,
      longitude: result.longitude,
    });
  };

  const confirmLocation = async () => {
    if (saving || !coordinate) {
      if (!coordinate) {
        setAlert(
          "Search for a place, use your current location, or tap the map to place a pin.",
        );
      }
      return;
    }

    const updatedDraft = {
      ...draft,
      latitude: formatCoordinate(coordinate.latitude),
      longitude: formatCoordinate(coordinate.longitude),
      ...(selectedSearchResult
        ? {
            venueName: selectedSearchResult.name || draft.venueName,
            address:
              selectedSearchResult.address ||
              selectedSearchResult.label ||
              draft.address,
            state: selectedSearchResult.state ?? draft.state,
            lga: selectedSearchResult.localArea ?? draft.lga,
          }
        : {}),
    };

    setSaving(true);
    try {
      await createEventDraftStorage.save(updatedDraft);
      navigation.navigate("CreateEventDetails", { draft: updatedDraft });
    } finally {
      setSaving(false);
    }
  };

  const attributionLabel = attribution.replace(/^Powered by\s+/i, "");

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.avoiding}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Back to event details"
            hitSlop={10}
            onPress={navigation.goBack}
            style={styles.backButton}
          >
            <Ionicons color={colors.ink} name="arrow-back" size={22} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Choose event location</Text>
            <Text style={styles.subtitle}>
              Search for a place or move the pin
            </Text>
          </View>
        </View>

        <View style={styles.searchSection}>
          <View style={styles.searchInputWrap}>
            <Ionicons color="#6c8978" name="search-outline" size={19} />
            <TextInput
              autoCorrect={false}
              onChangeText={(value) => {
                setQuery(value);
                setSelectedSearchResult(null);
              }}
              placeholder="Search a venue, street, or landmark"
              placeholderTextColor="#829a8c"
              returnKeyType="search"
              style={styles.searchInput}
              value={query}
            />
            {query.length > 0 ? (
              <Pressable
                accessibilityLabel="Clear location search"
                hitSlop={8}
                onPress={() => setQuery("")}
              >
                <Ionicons color="#829a8c" name="close-circle" size={19} />
              </Pressable>
            ) : null}
          </View>

          {searchState === "loading" ? (
            <View style={styles.searchFeedback}>
              <ActivityIndicator color="#078d45" size="small" />
              <Text style={styles.feedbackText}>Searching places...</Text>
            </View>
          ) : null}
          {searchState === "empty" ? (
            <View style={styles.searchFeedback}>
              <Text style={styles.feedbackText}>
                No places found. Try a nearby street or landmark.
              </Text>
            </View>
          ) : null}
          {searchState === "error" ? (
            <View style={styles.errorRow}>
              <Text style={styles.errorText}>{searchError}</Text>
              <Pressable onPress={() => setSearchAttempt((value) => value + 1)}>
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            </View>
          ) : null}

          {results.length > 0 ? (
            <FlatList
              data={results}
              keyboardShouldPersistTaps="handled"
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => selectSearchResult(item)}
                  style={styles.resultRow}
                >
                  <View style={styles.resultIcon}>
                    <Ionicons
                      color="#078d45"
                      name="location-outline"
                      size={18}
                    />
                  </View>
                  <View style={styles.resultCopy}>
                    <Text numberOfLines={1} style={styles.resultTitle}>
                      {item.name}
                    </Text>
                    <Text numberOfLines={1} style={styles.resultSubtitle}>
                      {item.label}
                    </Text>
                    {item.state || item.localArea ? (
                      <Text numberOfLines={1} style={styles.resultMeta}>
                        {[item.localArea, item.state]
                          .filter(Boolean)
                          .join(", ")}
                      </Text>
                    ) : null}
                  </View>
                  <Ionicons color="#799284" name="arrow-forward" size={16} />
                </Pressable>
              )}
              style={styles.resultsList}
            />
          ) : null}
          {attributionLabel ? (
            <Text style={styles.attribution}>
              Search data: {attributionLabel}
            </Text>
          ) : null}
        </View>

        <View style={styles.mapSection}>
          <EventLocationMap
            coordinate={coordinate}
            country={country}
            onCoordinateChange={setMapCoordinate}
          />
          <View pointerEvents="none" style={styles.mapHint}>
            <Ionicons color="#078d45" name="hand-left-outline" size={15} />
            <Text style={styles.mapHintText}>Tap the map or drag the pin</Text>
          </View>
        </View>

        <View style={styles.bottomArea}>
          <View style={styles.bottomTopRow}>
            <View style={styles.coordinateReadout}>
              <Ionicons color="#078d45" name="navigate-outline" size={16} />
              <Text numberOfLines={1} style={styles.coordinateText}>
                {coordinate
                  ? `${formatCoordinate(coordinate.latitude)}, ${formatCoordinate(coordinate.longitude)}`
                  : "No pin selected"}
              </Text>
            </View>
            <Pressable
              disabled={locating}
              onPress={() => void useCurrentLocation()}
              style={[
                styles.currentLocationButton,
                locating && styles.disabled,
              ]}
            >
              {locating ? (
                <ActivityIndicator color="#078d45" size="small" />
              ) : (
                <Ionicons color="#078d45" name="locate-outline" size={17} />
              )}
              <Text style={styles.currentLocationText}>
                {locating ? "Locating" : "My location"}
              </Text>
            </Pressable>
          </View>
          <Pressable
            disabled={!coordinate || saving}
            onPress={() => void confirmLocation()}
            style={[
              styles.confirmButton,
              (!coordinate || saving) && styles.confirmDisabled,
            ]}
          >
            <Text style={styles.confirmText}>
              {saving ? "Saving location..." : "Use this location"}
            </Text>
            <Ionicons color={colors.white} name="arrow-forward" size={18} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <AppAlertModal
        message={alert}
        onClose={() => setAlert("")}
        title="Location unavailable"
        visible={!!alert}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.paper, flex: 1 },
  avoiding: { flex: 1 },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 13,
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 14,
  },
  backButton: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: "#e3efe8",
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  headerCopy: { flex: 1, gap: 2 },
  title: { color: colors.ink, fontFamily: fonts.bold, fontSize: 18 },
  subtitle: { color: "#698474", fontFamily: fonts.medium, fontSize: 11 },
  searchSection: { gap: 8, paddingHorizontal: 18, paddingBottom: 10 },
  searchInputWrap: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: "#dbece1",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 50,
    paddingHorizontal: 14,
  },
  searchInput: {
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 13,
    minHeight: 48,
    paddingVertical: 0,
  },
  searchFeedback: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  feedbackText: { color: "#64806f", fontFamily: fonts.medium, fontSize: 11 },
  errorRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 6,
  },
  errorText: {
    color: "#a83232",
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  retryText: { color: "#078d45", fontFamily: fonts.bold, fontSize: 11 },
  resultsList: {
    backgroundColor: colors.white,
    borderColor: "#e1eee6",
    borderRadius: 17,
    borderWidth: 1,
    maxHeight: 190,
  },
  resultRow: {
    alignItems: "center",
    borderBottomColor: "#edf3ef",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 10,
    minHeight: 59,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  resultIcon: {
    alignItems: "center",
    backgroundColor: "#e8f7ee",
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  resultCopy: { flex: 1, gap: 2 },
  resultTitle: { color: colors.ink, fontFamily: fonts.bold, fontSize: 12 },
  resultSubtitle: { color: "#587362", fontFamily: fonts.medium, fontSize: 10 },
  resultMeta: { color: "#819487", fontFamily: fonts.medium, fontSize: 9 },
  attribution: {
    color: "#7c9082",
    fontFamily: fonts.medium,
    fontSize: 9,
    paddingHorizontal: 6,
  },
  mapSection: {
    borderRadius: 24,
    flex: 1,
    marginHorizontal: 14,
    minHeight: 190,
    overflow: "hidden",
    position: "relative",
  },
  mapHint: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#ffffffee",
    borderRadius: 18,
    bottom: 12,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: "absolute",
  },
  mapHintText: { color: "#365b45", fontFamily: fonts.bold, fontSize: 10 },
  bottomArea: {
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 13,
    paddingBottom: 8,
  },
  bottomTopRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  coordinateReadout: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 7,
  },
  coordinateText: {
    color: "#466653",
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 10,
  },
  currentLocationButton: {
    alignItems: "center",
    backgroundColor: "#e8f7ee",
    borderRadius: 17,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  currentLocationText: {
    color: "#078d45",
    fontFamily: fonts.bold,
    fontSize: 10,
  },
  disabled: { opacity: 0.6 },
  confirmButton: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: 24,
    flexDirection: "row",
    height: 50,
    justifyContent: "center",
    gap: 9,
  },
  confirmDisabled: { opacity: 0.5 },
  confirmText: { color: colors.white, fontFamily: fonts.bold, fontSize: 14 },
});
