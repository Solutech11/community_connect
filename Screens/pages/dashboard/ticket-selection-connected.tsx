import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";

import AppAlertModal from "../../components/ui/app-alert-modal";
import EventTicketSheet from "../../components/ui/event-ticket-sheet";
import { ApiError } from "../../services/api/client";
import { eventsApi } from "../../services/api/events.api";
import type { GetEventsIdResponse } from "../../types/api.generated";
import type { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "TicketSelection">;
type TicketTypes = GetEventsIdResponse["data"]["ticketTypes"];

export default function TicketSelectionScreen({ navigation, route }: Props) {
  const [title, setTitle] = useState("Event");
  const [ticketTypes, setTicketTypes] = useState<TicketTypes>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setTicketTypes([]);

    eventsApi
      .get(route.params.eventId, controller.signal)
      .then((response) => {
        setTitle(response.data.event.title);
        setTicketTypes(response.data.ticketTypes);
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.code === "REQUEST_CANCELLED") {
          return;
        }
        setErrorMessage(
          error instanceof ApiError
            ? error.message
            : "Unable to load ticket types.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [route.params.eventId]);

  return (
    <>
      <EventTicketSheet
        eventId={route.params.eventId}
        loading={loading}
        onCheckout={(selection) => navigation.replace("Checkout", selection)}
        onClose={() => navigation.goBack()}
        ticketTypes={ticketTypes}
        title={title}
        visible
      />
      <AppAlertModal
        message={errorMessage ?? ""}
        onClose={() => setErrorMessage(null)}
        title="Tickets unavailable"
        visible={Boolean(errorMessage)}
      />
    </>
  );
}
