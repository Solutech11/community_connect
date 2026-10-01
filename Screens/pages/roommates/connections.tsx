import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Text, View } from "react-native";
import {
  RoommateShell,
  RoommateButton,
  RoommatePerson,
  RoommateState,
  roommateStyles as styles,
} from "../../components/ui/roommate-ui";
import { roommatesApi } from "../../services/api/roommates.api";
import { ApiError } from "../../services/api/client";
import type { RootStackParamList } from "../../types/navigation";
import type { RoommateConnection } from "../../types/roommates";

export default function RoommateConnections({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "RoommateConnections">) {
  const [connections, setConnections] = useState<RoommateConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [retry, setRetry] = useState(0);
  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      setLoading(true);
      setError(null);
      setConnections([]);
      roommatesApi
        .connections(page, controller.signal)
        .then((response) => {
          if (controller.signal.aborted) return;
          setConnections(response.data.connections);
          setTotal(response.data.total);
        })
        .catch((err) => {
          if (!controller.signal.aborted)
            setError(
              err instanceof ApiError
                ? err.message
                : "Unable to load connects. Check your connection.",
            );
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
      return () => controller.abort();
    }, [page, retry]),
  );
  return (
    <RoommateShell
      title="Your connects"
      subtitle="Chat, get to know each other, and choose who you'd like to live with."
      loading={loading}
      error={error}
      retry={() => setRetry((value) => value + 1)}
    >
      <RoommateButton
        icon="shield-checkmark-outline"
        label="Blocked users"
        secondary
        onPress={() => navigation.navigate("RoommateBlocks")}
      />
      {!loading && !error && !connections.length ? (
        <RoommateState
          icon="chatbubbles-outline"
          title="Good conversations start here"
          description="When you both like each other, your connect appears here. Take your time getting to know them."
        >
          <RoommateButton
            label="Discover roomies"
            icon="arrow-forward"
            onPress={() => navigation.navigate("RoommateDiscover")}
          />
        </RoommateState>
      ) : null}
      {connections.map((connection) => (
        <View key={connection._id} style={styles.card}>
          <RoommatePerson
            {...connection.user}
            subtitle={
              connection.status === "paired"
                ? "Your roommate / profiles private"
                : connection.pairingRequest?.status === "pending"
                  ? "Roommate request pending"
                  : "You both liked each other"
            }
          />
          <RoommateButton
            icon="arrow-forward"
            label="View connect"
            onPress={() =>
              navigation.navigate("RoommateConnection", {
                connectionId: connection._id,
              })
            }
          />
        </View>
      ))}
      <View style={styles.row}>
        {page > 1 ? (
          <RoommateButton
            label="Previous"
            secondary
            disabled={loading}
            onPress={() => setPage(page - 1)}
          />
        ) : null}
        {page * 20 < total ? (
          <RoommateButton
            label="Next"
            secondary
            disabled={loading}
            onPress={() => setPage(page + 1)}
          />
        ) : null}
        <RoommateButton
          label="Refresh"
          secondary
          disabled={loading}
          onPress={() => setRetry((value) => value + 1)}
        />
      </View>
    </RoommateShell>
  );
}
