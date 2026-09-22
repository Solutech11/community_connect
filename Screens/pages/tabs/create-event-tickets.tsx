import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import AppAlertModal from "../../components/ui/app-alert-modal";
import {
  BottomActions,
  CreateEventHeader,
  StepProgress,
} from "../../components/ui/create-event-ui";
import { createEventDraftStorage } from "../../services/storage/create-event-draft.storage";
import { colors, fonts } from "../../styles/theme";
import type {
  CreateEventTicket,
  RootStackParamList,
} from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "CreateEventTickets">;

const TICKET_IMAGE =
  "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=400&q=80";

function createInitialTicket(capacity: string): CreateEventTicket {
  return {
    capacity: capacity || "100",
    id: "ticket-1",
    price: "25",
    title: "General Admission",
  };
}

export default function CreateEventTicketsScreen({ navigation, route }: Props) {
  const totalCapacity = Number.parseInt(route.params.draft.capacity, 10);
  const [tickets, setTickets] = useState<CreateEventTicket[]>(() =>
    route.params.draft.tickets.length
      ? route.params.draft.tickets
      : [createInitialTicket(route.params.draft.capacity)],
  );
  const [alert, setAlert] = useState("");

  useEffect(() => {
    void createEventDraftStorage.save({
      ...route.params.draft,
      tickets,
    });
  }, [route.params.draft, tickets]);

  const hasUnlimitedTier = tickets.some(
    (ticket) => ticket.capacity.trim().toLowerCase() === "unlimited",
  );
  const allocatedCapacity = tickets.reduce((total, ticket) => {
    const capacity = Number(ticket.capacity);
    return Number.isInteger(capacity) && capacity > 0
      ? total + capacity
      : total;
  }, 0);
  const remainingCapacity = Number.isFinite(totalCapacity)
    ? totalCapacity - allocatedCapacity
    : null;
  const capacityComplete =
    Number.isFinite(totalCapacity) &&
    !hasUnlimitedTier &&
    allocatedCapacity === totalCapacity;

  const updateTicket = (
    id: string,
    key: keyof Omit<CreateEventTicket, "id">,
    value: string,
  ) => {
    setTickets((current) => {
      let nextValue = value;
      const numericInput = /^\d+$/.test(value.trim());
      if (
        key === "capacity" &&
        numericInput &&
        Number.isFinite(totalCapacity)
      ) {
        const otherCapacity = current.reduce((total, ticket) => {
          if (ticket.id === id) return total;
          const capacity = Number(ticket.capacity);
          return Number.isInteger(capacity) && capacity > 0
            ? total + capacity
            : total;
        }, 0);
        const maximumForTicket = Math.max(0, totalCapacity - otherCapacity);
        nextValue = String(Math.min(Number(value), maximumForTicket));
      }

      return current.map((ticket) =>
        ticket.id === id ? { ...ticket, [key]: nextValue } : ticket,
      );
    });
  };

  const addTicket = () => {
    if (tickets.length >= 10) {
      setAlert("You can add up to 10 ticket types.");
      return;
    }
    setTickets((current) => [
      ...current,
      {
        capacity: "",
        id: "ticket-" + Date.now(),
        price: "",
        title: "",
      },
    ]);
  };

  const goNext = () => {
    const hasInvalidCapacity = tickets.some((ticket) => {
      const value = ticket.capacity.trim().toLowerCase();
      return (
        value !== "unlimited" &&
        (!value || !Number.isInteger(Number(value)) || Number(value) <= 0)
      );
    });
    if (hasInvalidCapacity) {
      setAlert(
        "Enter a positive whole-number capacity for every ticket, or type Unlimited.",
      );
      return;
    }
    if (
      !hasUnlimitedTier &&
      Number.isFinite(totalCapacity) &&
      allocatedCapacity > totalCapacity
    ) {
      setAlert(
        `Ticket capacities total ${allocatedCapacity}, but the event capacity is ${totalCapacity}. Reduce the ticket capacities before continuing.`,
      );
      return;
    }
    if (!capacityComplete) {
      setAlert(
        hasUnlimitedTier
          ? "Replace Unlimited with numeric ticket capacities so all tickets can add up to the event capacity."
          : `Allocate all ${totalCapacity} seats across the ticket tiers before continuing. ${remainingCapacity} seats remain.`,
      );
      return;
    }
    if (
      tickets.some(
        (ticket) =>
          !ticket.title.trim() ||
          !ticket.price.trim() ||
          !ticket.capacity.trim(),
      )
    ) {
      setAlert("Complete the title, price, and capacity for every ticket.");
      return;
    }
    const draft = { ...route.params.draft, tickets };
    void createEventDraftStorage.save(draft);
    navigation.navigate("CreateEventReview", { draft });
  };

  return (
    <View style={styles.safe}>
      <CreateEventHeader
        closeIcon
        onBack={navigation.goBack}
        rightText="Draft Saved"
        title="CommunityConnect"
      />
      <StepProgress label="Tickets & Pricing" step={3} />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Configure your tickets</Text>
        <Text style={styles.subtitle}>
          Create different tiers for your attendees. You can add up to 10 unique
          ticket types.
        </Text>
        <View style={styles.capacityCard}>
          <View style={styles.capacityIcon}>
            <Ionicons color="#08ad54" name="people-outline" size={21} />
          </View>
          <View style={styles.capacityCopy}>
            <Text style={styles.capacityLabel}>TOTAL EVENT CAPACITY</Text>
            <Text style={styles.capacityHint}>
              {hasUnlimitedTier
                ? "Use numeric tiers to reach the event capacity"
                : allocatedCapacity === totalCapacity
                  ? "All seats allocated across ticket tiers"
                  : `${allocatedCapacity} of ${Number.isFinite(totalCapacity) ? totalCapacity : "-"} seats assigned`}
            </Text>
          </View>
          <Text
            style={[
              styles.capacityValue,
              remainingCapacity !== null && remainingCapacity < 0
                ? styles.capacityValueOver
                : null,
            ]}
          >
            {hasUnlimitedTier ? "∞" : (remainingCapacity ?? "-")}
          </Text>
        </View>

        {tickets.map((ticket, index) => (
          <TicketCard
            index={index}
            key={ticket.id}
            onDelete={
              tickets.length > 1
                ? () =>
                    setTickets((current) =>
                      current.filter((item) => item.id !== ticket.id),
                    )
                : undefined
            }
            onUpdate={(key, value) => updateTicket(ticket.id, key, value)}
            ticket={ticket}
          />
        ))}

        <Pressable onPress={addTicket} style={styles.addTicket}>
          <Ionicons color="#08ad54" name="add-circle-outline" size={28} />
          <View>
            <Text style={styles.addTitle}>Add Another Ticket</Text>
            <Text style={styles.addHint}>Max 10 tickets allowed</Text>
          </View>
        </Pressable>

        <View style={styles.promoRow}>
          <View style={styles.promo}>
            <Text style={styles.promoTitle}>Revenue Growth</Text>
            <Text style={styles.promoCopy}>
              Maximize your event potential with tiered pricing strategies.
            </Text>
          </View>
          <ImageBackground
            imageStyle={styles.promoImage}
            source={{ uri: TICKET_IMAGE }}
            style={styles.ticketVisual}
          >
            <Ionicons color={colors.white} name="ticket-outline" size={28} />
          </ImageBackground>
        </View>
      </ScrollView>
      <BottomActions
        nextDisabled={Number.isFinite(totalCapacity) && !capacityComplete}
        onBack={navigation.goBack}
        onNext={goNext}
      />
      <AppAlertModal
        message={alert}
        onClose={() => setAlert("")}
        title="Check ticket details"
        visible={!!alert}
      />
    </View>
  );
}

function TicketCard({
  ticket,
  index,
  onUpdate,
  onDelete,
}: {
  ticket: CreateEventTicket;
  index: number;
  onUpdate: (key: keyof Omit<CreateEventTicket, "id">, value: string) => void;
  onDelete?: () => void;
}) {
  return (
    <View style={styles.ticketCard}>
      <View style={styles.ticketHeading}>
        <Text style={styles.ticketBadge}>Ticket #{index + 1}</Text>
        {onDelete ? (
          <Pressable hitSlop={10} onPress={onDelete}>
            <Ionicons color="#198e4d" name="trash-outline" size={22} />
          </Pressable>
        ) : null}
      </View>
      <TicketInput
        label="TICKET TITLE"
        onChangeText={(value) => onUpdate("title", value)}
        placeholder="e.g. VIP Backstage"
        value={ticket.title}
      />
      <TicketInput
        keyboardType="decimal-pad"
        label="PRICE (NGN)"
        onChangeText={(value) => onUpdate("price", value)}
        placeholder="0.00"
        prefix="₦"
        value={ticket.price}
      />
      <TicketInput
        keyboardType="number-pad"
        label="CAPACITY"
        onChangeText={(value) => onUpdate("capacity", value)}
        placeholder="Unlimited"
        value={ticket.capacity}
      />
    </View>
  );
}

function TicketInput({
  label,
  prefix,
  ...props
}: {
  label: string;
  prefix?: string;
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.ticketField}>
      <Text style={styles.ticketLabel}>{label}</Text>
      <View style={styles.ticketInputShell}>
        {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
        <TextInput
          placeholderTextColor="#6c7688"
          style={styles.ticketInput}
          {...props}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.paper, flex: 1 },
  content: { padding: 24, paddingBottom: 38 },
  title: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 27,
    marginTop: 26,
  },
  subtitle: {
    color: "#32965d",
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 22,
    marginTop: 7,
  },
  capacityCard: {
    alignItems: "center",
    backgroundColor: "#e8f8ef",
    borderRadius: 20,
    flexDirection: "row",
    marginBottom: 22,
    padding: 13,
  },
  capacityIcon: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  capacityCopy: { flex: 1, marginLeft: 10 },
  capacityLabel: {
    color: "#238c50",
    fontFamily: fonts.bold,
    fontSize: 10,
  },
  capacityHint: {
    color: "#3b8e5d",
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 3,
  },
  capacityValue: {
    color: "#078d45",
    fontFamily: fonts.extraBold,
    fontSize: 22,
  },
  capacityValueOver: { color: "#b34b4b" },
  ticketCard: {
    backgroundColor: colors.white,
    borderLeftColor: "#08bd58",
    borderLeftWidth: 4,
    borderRadius: 28,
    gap: 18,
    marginBottom: 20,
    padding: 24,
  },
  ticketHeading: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  ticketBadge: {
    backgroundColor: "#e3f7ec",
    borderRadius: 15,
    color: "#08ad54",
    fontFamily: fonts.bold,
    fontSize: 13,
    overflow: "hidden",
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  ticketField: { gap: 8 },
  ticketLabel: {
    color: "#258f54",
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  ticketInputShell: {
    alignItems: "center",
    backgroundColor: "#f8fcfa",
    borderColor: "#bde8d0",
    borderRadius: 27,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 56,
    paddingHorizontal: 18,
  },
  prefix: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 18,
    marginRight: 8,
  },
  ticketInput: {
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 16,
    paddingVertical: 14,
  },
  addTicket: {
    alignItems: "center",
    borderColor: "#91dfb4",
    borderRadius: 28,
    borderStyle: "dashed",
    borderWidth: 2,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    minHeight: 88,
  },
  addTitle: {
    color: "#08ad54",
    fontFamily: fonts.bold,
    fontSize: 18,
  },
  addHint: {
    color: "#2b8e54",
    fontFamily: fonts.bold,
    fontSize: 12,
    textAlign: "center",
  },
  promoRow: { flexDirection: "row", gap: 16, marginTop: 28 },
  promo: {
    backgroundColor: "#08bd58",
    borderRadius: 28,
    flex: 1,
    justifyContent: "center",
    padding: 22,
  },
  promoTitle: {
    color: colors.white,
    fontFamily: fonts.extraBold,
    fontSize: 18,
  },
  promoCopy: {
    color: colors.white,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
  },
  ticketVisual: {
    alignItems: "center",
    height: 132,
    justifyContent: "center",
    width: 112,
  },
  promoImage: { borderRadius: 28 },
});
