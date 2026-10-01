import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { PanResponder, StyleSheet, Text, View } from "react-native";
import {
  RoommateShell,
  RoommateButton,
  RoommateCard,
  RoommateHero,
  RoommateState,
  roommateStyles as styles,
} from "../../components/ui/roommate-ui";
import { roommatesApi } from "../../services/api/roommates.api";
import { ApiError } from "../../services/api/client";
import { useNotifier } from "../../components/ui/app-notifier";
import { useRoommateTask } from "../../hooks/use-roommate-task";
import type { RootStackParamList } from "../../types/navigation";
import type { RoommateCandidate, RoommateProfile } from "../../types/roommates";

export default function RoommateDiscover({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "RoommateDiscover">) {
  const [profile, setProfile] = useState<RoommateProfile | null>(null);
  const [candidate, setCandidate] = useState<RoommateCandidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const { notify } = useNotifier();
  const { busy, run } = useRoommateTask();
  const currentSignal = useRef<AbortSignal | undefined>(undefined);
  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    setCandidate(null);
    try {
      const response = await roommatesApi.profile(signal);
      if (signal?.aborted) return;
      setProfile(response.data.profile);
      if (response.data.profile?.visibility === "discoverable") {
        const matches = await roommatesApi.candidates(signal);
        if (!signal?.aborted) setCandidate(matches.data.candidates[0] || null);
      }
    } catch (err) {
      if (!signal?.aborted)
        setError(
          err instanceof ApiError
            ? err.message
            : "Check your connection and try again.",
        );
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      currentSignal.current = controller.signal;
      void load(controller.signal);
      return () => {
        controller.abort();
        currentSignal.current = undefined;
        setCandidate(null);
      };
    }, [load, retry]),
  );
  const decide = (action: "like" | "pass") => {
    if (!candidate || busy || loading) return;
    const userId = candidate.user._id;
    void run(async () => {
      const result = await roommatesApi.decide(userId, action);
      if (result.data.matched)
        notify({
          title: "It's a connect!",
          message: "You both liked each other. Open your connects to chat.",
          tone: "success",
        });
      await load(currentSignal.current);
    });
  };
  const responder = PanResponder.create({
    onMoveShouldSetPanResponder: (_event, gesture) =>
      !busy &&
      Math.abs(gesture.dx) > 25 &&
      Math.abs(gesture.dx) > Math.abs(gesture.dy) * 2,
    onPanResponderRelease: (_event, gesture) => {
      if (Math.abs(gesture.dx) > 80) decide(gesture.dx > 0 ? "like" : "pass");
    },
  });
  return (
    <RoommateShell
      title="Find your roomie"
      subtitle="Discover people whose housing plans and living habits fit yours."
      loading={loading}
      error={error}
      retry={() => setRetry((value) => value + 1)}
    >
      <View style={design.tools}>
        <View style={styles.flex}>
          <RoommateButton
            label="My connects"
            icon="chatbubbles-outline"
            secondary
            disabled={busy}
            onPress={() => navigation.navigate("RoommateConnections")}
          />
        </View>
        <View style={styles.flex}>
          <RoommateButton
            label="My profile"
            icon="options-outline"
            secondary
            disabled={busy}
            onPress={() => navigation.navigate("RoommateSetup")}
          />
        </View>
      </View>
      {!loading && !error ? (
        <>
          {!profile || profile.visibility === "draft" ? (
            <>
              <RoommateHero />
              <RoommateState
                icon="people-outline"
                title="Find someone on your wavelength"
                description="A few details about your space and lifestyle help you discover people with compatible plans."
              >
                <RoommateButton
                  label="Set up my roomie profile"
                  icon="arrow-forward"
                  onPress={() => navigation.navigate("RoommateSetup")}
                />
                <RoommateButton
                  label="How Roomie works"
                  secondary
                  onPress={() => navigation.navigate("RoommateIntro")}
                />
                <Text style={[styles.body, styles.center]}>
                  Your search is optional. Your contacts stay in your control.
                </Text>
              </RoommateState>
            </>
          ) : profile.visibility === "paired" ? (
            <RoommateState
              icon="home-outline"
              title="You've found your roomie"
              description="Your profile is private. Manage your pairing from your connects."
            >
              {profile.activeConnectionId ? (
                <RoommateButton
                  label="View my roommate"
                  onPress={() =>
                    navigation.navigate("RoommateConnection", {
                      connectionId: profile.activeConnectionId!,
                    })
                  }
                />
              ) : null}
            </RoommateState>
          ) : profile.visibility === "paused" ? (
            <RoommateState
              icon="pause-outline"
              title="A little pause"
              description="Your profile is hidden from discovery. Your existing connects are still here when you need them."
            >
              <RoommateButton
                label="Resume matching"
                disabled={busy}
                onPress={() =>
                  void run(async () => {
                    await roommatesApi.visibility("discoverable");
                    await load(currentSignal.current);
                  })
                }
              />
            </RoommateState>
          ) : (
            <>
              <View style={design.section}>
                <Text style={styles.heading}>Your next connection</Text>
                <Text style={styles.fieldLabel}>
                  CURATED FOR YOUR LIFESTYLE
                </Text>
              </View>
              {candidate ? (
                <View {...responder.panHandlers}>
                  <RoommateCard
                    key={candidate.user._id}
                    candidate={candidate}
                    onDetails={() =>
                      navigation.navigate("RoommateCandidate", { candidate })
                    }
                  />
                  <Text
                    style={[
                      styles.body,
                      { textAlign: "center", marginVertical: 12 },
                    ]}
                  >
                    Swipe left to pass, right to like
                  </Text>
                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <RoommateButton
                        label="Pass"
                        icon="close-outline"
                        secondary
                        disabled={busy}
                        onPress={() => decide("pass")}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <RoommateButton
                        icon="heart-outline"
                        label={busy ? "Saving..." : "Like"}
                        disabled={busy}
                        onPress={() => decide("like")}
                      />
                    </View>
                  </View>
                </View>
              ) : (
                <RoommateState
                  icon="search-outline"
                  title="Your people are still out there"
                  description="No compatible profiles just yet. Try a wider area, budget, or move-in window, or come back later."
                >
                  <RoommateButton
                    label="Refresh"
                    secondary
                    onPress={() => setRetry((value) => value + 1)}
                  />
                  <RoommateButton
                    label="Adjust preferences"
                    secondary
                    onPress={() => navigation.navigate("RoommateSetup")}
                  />
                </RoommateState>
              )}
              <RoommateButton
                label="Pause my search"
                secondary
                disabled={busy}
                onPress={() =>
                  void run(async () => {
                    await roommatesApi.visibility("paused");
                    await load(currentSignal.current);
                  })
                }
              />
            </>
          )}
        </>
      ) : null}
    </RoommateShell>
  );
}

const design = StyleSheet.create({
  tools: { flexDirection: "row", gap: 10 },
  section: { gap: 5, paddingTop: 4 },
});
