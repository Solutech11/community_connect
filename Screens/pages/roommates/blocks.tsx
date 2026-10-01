import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Text, View } from "react-native";
import {
  RoommateShell,
  RoommateButton,
  roommateStyles as styles,
} from "../../components/ui/roommate-ui";
import { roommatesApi } from "../../services/api/roommates.api";
import { ApiError } from "../../services/api/client";
import { useRoommateTask } from "../../hooks/use-roommate-task";

type Block = Awaited<
  ReturnType<typeof roommatesApi.blocks>
>["data"]["blocks"][number];
export default function RoommateBlocks() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [retry, setRetry] = useState(0);
  const { busy, run } = useRoommateTask();
  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      setLoading(true);
      setError(null);
      roommatesApi
        .blocks(page, controller.signal)
        .then((response) => {
          if (!controller.signal.aborted) {
            setBlocks(response.data.blocks);
            setTotal(response.data.total);
          }
        })
        .catch((err) => {
          if (!controller.signal.aborted)
            setError(
              err instanceof ApiError
                ? err.message
                : "Check your connection and try again.",
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
      title="Blocked users"
      subtitle="Unblocking allows direct contact again. It does not restore an ended roommate connect."
      loading={loading}
      error={error}
      retry={() => setRetry((value) => value + 1)}
    >
      {!loading && !error && !blocks.length ? (
        <Text style={styles.body}>You haven't blocked anyone.</Text>
      ) : null}
      {!error &&
        blocks.map((block) => {
          const targetId = block.targetId?._id;
          return (
            <View key={block._id} style={styles.card}>
              <Text style={styles.heading}>
                {block.targetId?.firstName || "Deleted"}{" "}
                {block.targetId?.lastName || "user"}
              </Text>
              {targetId ? (
                <RoommateButton
                  label="Unblock"
                  secondary
                  disabled={busy}
                  onPress={() =>
                    void run(async () => {
                      await roommatesApi.unblock(targetId);
                      setRetry((value) => value + 1);
                    })
                  }
                />
              ) : null}
            </View>
          );
        })}
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
      </View>
    </RoommateShell>
  );
}
