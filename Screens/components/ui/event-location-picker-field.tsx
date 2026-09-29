import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppLoader from "./app-loader";
import {
  locationsApi,
  type LocationSearchResult,
} from "../../services/api/locations.api";
import { ApiError } from "../../services/api/client";
import { colors, fonts } from "../../styles/theme";
import type { GetLocationsSearchQuery } from "../../types/api.generated";
import EventLocationMap, { type MapCoordinate } from "./event-location-map";

type Props = {
  country: string;
  latitude: string;
  longitude: string;
  onCoordinateChange: (latitude: string, longitude: string) => void;
  onLocationSelect: (result: LocationSearchResult) => void;
};

type SearchState = "idle" | "loading" | "success" | "empty" | "error";

const COUNTRY_CODES: Record<string, string> = {
  Nigeria: "NG",
  Ghana: "GH",
  Kenya: "KE",
};

function parseCoordinate(latitude: string, longitude: string) {
  if (!latitude.trim() || !longitude.trim()) return null;
  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);

  if (
    !Number.isFinite(parsedLatitude) ||
    parsedLatitude < -90 ||
    parsedLatitude > 90 ||
    !Number.isFinite(parsedLongitude) ||
    parsedLongitude < -180 ||
    parsedLongitude > 180
  ) {
    return null;
  }

  return {
    latitude: parsedLatitude,
    longitude: parsedLongitude,
  } satisfies MapCoordinate;
}

function formatCoordinate(value: number) {
  return value.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
}

export default function EventLocationPickerField({
  country,
  latitude,
  longitude,
  onCoordinateChange,
  onLocationSelect,
}: Props) {
  const coordinate = parseCoordinate(latitude, longitude);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationSearchResult[]>([]);
  const [attribution, setAttribution] = useState("");
  const [searchState, setSearchState] = useState<SearchState>("idle");
  const [searchError, setSearchError] = useState("");
  const [searchAttempt, setSearchAttempt] = useState(0);
  const [mapExpanded, setMapExpanded] = useState(false);

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
    // Coordinate changes should move the pin without repeating the current search.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, query, searchAttempt]);

  const setCoordinate = (nextLongitude: number, nextLatitude: number) => {
    if (
      !Number.isFinite(nextLatitude) ||
      nextLatitude < -90 ||
      nextLatitude > 90 ||
      !Number.isFinite(nextLongitude) ||
      nextLongitude < -180 ||
      nextLongitude > 180
    ) {
      return;
    }

    onCoordinateChange(
      formatCoordinate(nextLatitude),
      formatCoordinate(nextLongitude),
    );
  };

  const selectResult = (result: LocationSearchResult) => {
    Keyboard.dismiss();
    setResults([]);
    setSearchState("idle");
    onLocationSelect(result);
    setCoordinate(result.longitude, result.latitude);
  };

  const attributionLabel = attribution.replace(/^Powered by\s+/i, "");

  return (
    <View style={styles.container}>
      <View style={styles.headingRow}>
        <View style={styles.headingCopy}>
          <Text style={styles.label}>Find the venue on the map</Text>
          <Text style={styles.hint}>
            Search for a place, tap the map, or drag the pin.
          </Text>
        </View>
        {coordinate ? (
          <View style={styles.selectedBadge}>
            <Ionicons color="#078d45" name="checkmark-circle" size={15} />
            <Text style={styles.selectedText}>Pin set</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.searchInputWrap}>
        <Ionicons color="#6c8978" name="search-outline" size={19} />
        <TextInput
          autoCorrect={false}
          onChangeText={setQuery}
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
        <View style={styles.feedbackRow}>
          <AppLoader color="#078d45" size="small" />
          <Text style={styles.feedbackText}>Searching places...</Text>
        </View>
      ) : null}
      {searchState === "empty" ? (
        <Text style={styles.feedbackText}>
          No places found. Try a nearby street or landmark.
        </Text>
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
        <View style={styles.resultsList}>
          {results.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => selectResult(item)}
              style={styles.resultRow}
            >
              <View style={styles.resultIcon}>
                <Ionicons color="#078d45" name="location-outline" size={18} />
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
                    {[item.localArea, item.state].filter(Boolean).join(", ")}
                  </Text>
                ) : null}
              </View>
              <Ionicons color="#799284" name="arrow-forward" size={16} />
            </Pressable>
          ))}
        </View>
      ) : null}

      {attributionLabel ? (
        <Text style={styles.attribution}>Search data: {attributionLabel}</Text>
      ) : null}

      <View style={styles.mapBox}>
        {!mapExpanded ? (
          <EventLocationMap
            coordinate={coordinate}
            country={country}
            onCoordinateChange={setCoordinate}
          />
        ) : null}
        <Pressable
          accessibilityLabel="Expand map"
          hitSlop={6}
          onPress={() => setMapExpanded(true)}
          style={styles.expandButton}
        >
          <Ionicons color={colors.ink} name="expand-outline" size={18} />
          <Text style={styles.expandButtonText}>Expand</Text>
        </Pressable>
        <View pointerEvents="none" style={styles.mapHint}>
          <Ionicons color="#078d45" name="hand-left-outline" size={15} />
          <Text style={styles.mapHintText}>Tap the map or drag the pin</Text>
        </View>
      </View>

      <Modal
        animationType="slide"
        onRequestClose={() => setMapExpanded(false)}
        presentationStyle="fullScreen"
        statusBarTranslucent
        visible={mapExpanded}
      >
        <SafeAreaView edges={["top", "bottom"]} style={styles.fullscreenSafe}>
          <View style={styles.fullscreenHeader}>
            <View style={styles.fullscreenTitleWrap}>
              <Text style={styles.fullscreenTitle}>Choose venue location</Text>
              <Text style={styles.fullscreenSubtitle}>
                Tap the map or drag the pin to adjust it
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Close expanded map"
              hitSlop={8}
              onPress={() => setMapExpanded(false)}
              style={styles.closeButton}
            >
              <Ionicons color={colors.ink} name="close" size={23} />
            </Pressable>
          </View>
          <View style={styles.fullscreenMap}>
            <EventLocationMap
              coordinate={coordinate}
              country={country}
              onCoordinateChange={setCoordinate}
            />
            <View pointerEvents="none" style={styles.fullscreenHint}>
              <Ionicons color="#078d45" name="hand-left-outline" size={16} />
              <Text style={styles.fullscreenHintText}>
                Pan the map, tap a point, or drag the pin
              </Text>
            </View>
          </View>
          <View style={styles.fullscreenFooter}>
            <Pressable
              onPress={() => setMapExpanded(false)}
              style={styles.doneButton}
            >
              <Text style={styles.doneButtonText}>Done</Text>
              <Ionicons color={colors.white} name="checkmark" size={19} />
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  headingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  headingCopy: { flex: 1, gap: 3 },
  label: { color: colors.ink, fontFamily: fonts.bold, fontSize: 16 },
  hint: { color: "#668071", fontFamily: fonts.medium, fontSize: 11 },
  selectedBadge: {
    alignItems: "center",
    backgroundColor: "#e7f8ef",
    borderRadius: 16,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  selectedText: { color: "#078d45", fontFamily: fonts.bold, fontSize: 10 },
  searchInputWrap: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: "#dbece1",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 9,
    paddingHorizontal: 14,
  },
  searchInput: {
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 13,
    minHeight: 48,
  },
  feedbackRow: { alignItems: "center", flexDirection: "row", gap: 8 },
  feedbackText: { color: "#668071", fontFamily: fonts.medium, fontSize: 11 },
  errorRow: {
    alignItems: "center",
    backgroundColor: "#fff1ee",
    borderRadius: 12,
    flexDirection: "row",
    gap: 10,
    padding: 10,
  },
  errorText: {
    color: "#a74637",
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 10,
  },
  retryText: { color: "#078d45", fontFamily: fonts.bold, fontSize: 11 },
  resultsList: {
    backgroundColor: colors.white,
    borderColor: "#dbece1",
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  resultRow: {
    alignItems: "center",
    borderBottomColor: "#edf4ef",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 58,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  resultIcon: {
    alignItems: "center",
    backgroundColor: "#e7f8ef",
    borderRadius: 17,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  resultCopy: { flex: 1 },
  resultTitle: { color: colors.ink, fontFamily: fonts.bold, fontSize: 12 },
  resultSubtitle: { color: "#587362", fontFamily: fonts.medium, fontSize: 10 },
  resultMeta: { color: "#819487", fontFamily: fonts.medium, fontSize: 9 },
  attribution: { color: "#7c9082", fontFamily: fonts.medium, fontSize: 9 },
  mapBox: {
    borderColor: "#dbece1",
    borderRadius: 24,
    borderWidth: 1,
    height: 280,
    overflow: "hidden",
    position: "relative",
  },
  expandButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 16,
    elevation: 3,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 9,
    position: "absolute",
    right: 12,
    shadowColor: "#173d2c",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    top: 12,
  },
  expandButtonText: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 10,
  },
  mapHint: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: 15,
    bottom: 12,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    position: "absolute",
  },
  mapHintText: { color: "#335f48", fontFamily: fonts.bold, fontSize: 10 },
  fullscreenSafe: { backgroundColor: colors.paper, flex: 1 },
  fullscreenHeader: {
    alignItems: "center",
    backgroundColor: colors.paper,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  fullscreenTitleWrap: { flex: 1, gap: 2 },
  fullscreenTitle: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 17,
  },
  fullscreenSubtitle: {
    color: "#668071",
    fontFamily: fonts.medium,
    fontSize: 10,
  },
  closeButton: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: "#dbece1",
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  fullscreenMap: { flex: 1, position: "relative" },
  fullscreenHint: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 18,
    bottom: 18,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 9,
    position: "absolute",
  },
  fullscreenHintText: {
    color: "#335f48",
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  fullscreenFooter: {
    backgroundColor: colors.paper,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  doneButton: {
    alignItems: "center",
    backgroundColor: "#078d45",
    borderRadius: 24,
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    minHeight: 50,
  },
  doneButtonText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 14,
  },
});
