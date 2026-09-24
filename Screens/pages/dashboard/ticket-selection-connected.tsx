import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppAlertModal from "../../components/ui/app-alert-modal";
import { ApiError } from "../../services/api/client";
import { eventsApi } from "../../services/api/events.api";
import { colors, fonts } from "../../styles/theme";
import type { GetEventsIdResponse } from "../../types/api.generated";
import type {
  CheckoutTicketSelection,
  RootStackParamList,
} from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "TicketSelection">;
type TicketType = Omit<
  GetEventsIdResponse["data"]["ticketTypes"][number],
  "capacity" | "description" | "reserved"
> & {
  capacity?: number;
  description?: string;
  reserved?: number;
};
const MAX_ORDER_QUANTITY = 20;

function formatMoney(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(kobo / 100);
}

function getMaxOrderQuantity(ticket: TicketType) {
  if (ticket.capacity == null) return MAX_ORDER_QUANTITY;
  return Math.min(
    MAX_ORDER_QUANTITY,
    Math.max(0, ticket.capacity - ticket.sold - (ticket.reserved ?? 0)),
  );
}

export default function TicketSelectionScreen({ navigation, route }: Props) {
  const [title, setTitle] = useState("Event");
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setErrorMessage(null);
    setTickets([]);
    setSelectedId(null);
    setQuantity(0);

    eventsApi
      .get(route.params.eventId, controller.signal)
      .then((response) => {
        setTitle(response.data.event.title);
        const activeTickets = response.data.ticketTypes.filter(
          (ticket) => ticket.active,
        );
        setTickets(activeTickets);
        const firstAvailable = activeTickets.find(
          (ticket) => getMaxOrderQuantity(ticket) > 0,
        );
        setSelectedId(firstAvailable?._id ?? null);
        setQuantity(firstAvailable ? 1 : 0);
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

  const selected = tickets.find((ticket) => ticket._id === selectedId) ?? null;
  const subtotalKobo = useMemo(
    () => (selected?.priceKobo ?? 0) * quantity,
    [quantity, selected],
  );
  const selectedTickets = useMemo<CheckoutTicketSelection[]>(
    () =>
      selected && quantity > 0
        ? [
            {
              id: selected._id,
              title: selected.title,
              quantity,
              unitPrice: selected.priceKobo,
            },
          ]
        : [],
    [quantity, selected],
  );

  const selectTicket = (ticket: TicketType) => {
    if (getMaxOrderQuantity(ticket) === 0) return;
    setSelectedId(ticket._id);
    setQuantity(1);
  };

  const updateQuantity = (ticketId: string, delta: number) => {
    const ticket = tickets.find((item) => item._id === ticketId);
    if (!ticket) return;
    const maximum = getMaxOrderQuantity(ticket);
    if (maximum === 0) return;
    if (ticketId !== selectedId) {
      if (delta > 0) {
        setSelectedId(ticketId);
        setQuantity(1);
      }
      return;
    }
    setQuantity((current) => Math.max(0, Math.min(maximum, current + delta)));
  };

  return (
    <View style={styles.overlay}>
      <Pressable
        accessibilityLabel="Close ticket selection"
        style={StyleSheet.absoluteFillObject}
        onPress={() => navigation.goBack()}
      />
      <SafeAreaView style={styles.safeArea} edges={[]}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <View style={styles.headerCopy}>
              <Text style={styles.headerTitle}>Select Tickets</Text>
              <Text style={styles.eventTitle} numberOfLines={1}>
                {title}
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Close ticket selection"
              accessibilityRole="button"
              onPress={() => navigation.goBack()}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="close" size={24} color="#64748b" />
            </Pressable>
          </View>

          <View style={styles.headerDivider} />

          <ScrollView
            contentContainerStyle={styles.ticketList}
            showsVerticalScrollIndicator={false}
            style={styles.ticketScroll}
          >
            {loading ? (
              <Text style={styles.stateText}>Loading ticket types...</Text>
            ) : null}
            {!loading && tickets.length === 0 ? (
              <Text style={styles.stateText}>
                No ticket types are currently available.
              </Text>
            ) : null}
            {tickets.map((ticket) => {
              const maximum = getMaxOrderQuantity(ticket);
              const soldOut = maximum === 0;
              const isSelected = selectedId === ticket._id;
              const stockLabel = soldOut
                ? "Sold out"
                : ticket.capacity == null || ticket.reserved == null
                  ? "Available"
                  : `${maximum} remaining`;

              return (
                <View
                  key={ticket._id}
                  style={[
                    styles.ticketCard,
                    isSelected && styles.ticketCardActive,
                    soldOut && styles.ticketCardSoldOut,
                  ]}
                >
                  <View style={styles.ticketContent}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected, disabled: soldOut }}
                      disabled={soldOut}
                      onPress={() => selectTicket(ticket)}
                      style={({ pressed }) => [
                        styles.ticketTopRow,
                        pressed && !soldOut && styles.pressed,
                      ]}
                    >
                      <View style={styles.ticketTitleWrap}>
                        <View style={styles.ticketTitleRow}>
                          <Text style={styles.ticketTitle}>{ticket.title}</Text>
                          {isSelected ? (
                            <Ionicons
                              color="#08a951"
                              name="checkmark-circle"
                              size={18}
                            />
                          ) : null}
                        </View>
                        <Text style={styles.ticketDescription}>
                          {ticket.description?.trim() || "General admission"}
                        </Text>
                      </View>
                      <View style={styles.ticketPriceWrap}>
                        <Text style={styles.ticketPrice}>
                          {formatMoney(ticket.priceKobo)}
                        </Text>
                      </View>
                    </Pressable>

                    <View style={styles.ticketDivider} />

                    <View style={styles.ticketBottomRow}>
                      <Text
                        style={[
                          styles.ticketNote,
                          soldOut ? styles.ticketNoteSoldOut : null,
                        ]}
                      >
                        {soldOut
                          ? "Sold out"
                          : stockLabel}
                      </Text>

                      <View style={styles.stepper}>
                        <Pressable
                          accessibilityLabel={`Remove one ${ticket.title} ticket`}
                          accessibilityRole="button"
                          accessibilityState={{
                            disabled: !isSelected || quantity === 0,
                          }}
                          disabled={!isSelected || quantity === 0}
                          onPress={() => updateQuantity(ticket._id, -1)}
                          style={({ pressed }) => [
                            styles.stepperButton,
                            (!isSelected || quantity === 0) &&
                              styles.stepperDisabled,
                            pressed && isSelected && quantity > 0 && styles.pressed,
                          ]}
                        >
                          <Ionicons
                            name="remove"
                            size={22}
                            color={
                              !isSelected || quantity === 0
                                ? "#b5c0c8"
                                : colors.ink
                            }
                          />
                        </Pressable>
                        <Text style={styles.stepperValue}>
                          {isSelected ? quantity : 0}
                        </Text>
                        <Pressable
                          accessibilityLabel={`Add one ${ticket.title} ticket`}
                          accessibilityRole="button"
                          accessibilityState={{
                            disabled:
                              soldOut || (isSelected && quantity >= maximum),
                          }}
                          disabled={
                            soldOut || (isSelected && quantity >= maximum)
                          }
                          onPress={() => updateQuantity(ticket._id, 1)}
                          style={({ pressed }) => [
                            styles.stepperButtonBright,
                            (soldOut || (isSelected && quantity >= maximum)) &&
                              styles.stepperDisabled,
                            pressed && !soldOut && styles.pressed,
                          ]}
                        >
                          <Ionicons
                            name="add"
                            size={19}
                            color={colors.ink}
                          />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.footer}>
            <View>
              <Text style={styles.footerLabel}>Total Quantity</Text>
              <Text style={styles.footerValue}>
                {quantity} {quantity === 1 ? "Ticket" : "Tickets"}
              </Text>
            </View>
            <View style={styles.footerRight}>
              <Text style={styles.footerLabel}>Subtotal</Text>
              <Text style={styles.footerPrice}>{formatMoney(subtotalKobo)}</Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: quantity === 0 }}
            disabled={quantity === 0}
            onPress={() =>
              navigation.replace("Checkout", {
                eventId: route.params.eventId,
                quantity,
                subtotal: subtotalKobo,
                serviceFee: 0,
                total: subtotalKobo,
                tickets: selectedTickets,
              })
            }
            style={({ pressed }) => [
              styles.checkoutButton,
              quantity === 0 && styles.checkoutButtonDisabled,
              pressed && quantity > 0 && styles.pressed,
            ]}
          >
            <Text style={styles.checkoutText}>Proceed to Checkout</Text>
            <Ionicons name="arrow-forward" size={24} color={colors.ink} />
          </Pressable>
        </View>
      </SafeAreaView>

      <AppAlertModal
        visible={Boolean(errorMessage)}
        title="Tickets unavailable"
        message={errorMessage ?? ""}
        onClose={() => setErrorMessage(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: "rgba(5, 10, 8, 0.62)",
    flex: 1,
    justifyContent: "flex-end",
  },
  safeArea: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    height: "56%",
    minHeight: 430,
    paddingTop: 10,
  },
  handle: {
    alignSelf: "center",
    backgroundColor: "#cfd5dc",
    borderRadius: 999,
    height: 7,
    width: 82,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingTop: 14,
  },
  headerCopy: { flex: 1, paddingRight: 12 },
  headerTitle: {
    color: "#0f1734",
    fontFamily: fonts.extraBold,
    fontSize: 24,
    letterSpacing: -0.6,
  },
  eventTitle: {
    color: "#60708c",
    fontFamily: fonts.medium,
    fontSize: 13,
    marginTop: 4,
  },
  closeButton: {
    alignItems: "center",
    backgroundColor: "#f4f7fa",
    borderRadius: 20,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  headerDivider: {
    backgroundColor: "#edf1f4",
    height: 1,
    marginHorizontal: 22,
    marginTop: 12,
  },
  ticketScroll: { flex: 1 },
  ticketList: {
    flexGrow: 1,
    gap: 14,
    paddingBottom: 14,
    paddingHorizontal: 22,
    paddingTop: 18,
  },
  ticketCard: {
    backgroundColor: "#f5f7f8",
    borderColor: "#eff3f5",
    borderRadius: 28,
    borderWidth: 1,
    overflow: "hidden",
  },
  ticketCardActive: {
    backgroundColor: "#f2fff7",
    borderColor: colors.lime,
    borderWidth: 2,
  },
  ticketCardSoldOut: { opacity: 0.68 },
  ticketContent: { paddingHorizontal: 20, paddingVertical: 18 },
  ticketTopRow: { flexDirection: "row", justifyContent: "space-between" },
  ticketTitleWrap: { flex: 1, paddingRight: 14 },
  ticketTitle: {
    color: "#0f1734",
    fontFamily: fonts.extraBold,
    fontSize: 19,
    letterSpacing: -0.4,
  },
  ticketTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  ticketDescription: {
    color: "#60708c",
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 18,
    marginTop: 8,
  },
  ticketPriceWrap: { alignItems: "flex-end" },
  ticketPrice: { color: "#0f1734", fontFamily: fonts.extraBold, fontSize: 22 },
  ticketDivider: {
    backgroundColor: "#e8edf1",
    height: 1,
    marginTop: 16,
  },
  ticketBottomRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },
  ticketNote: { color: "#08a951", fontFamily: fonts.bold, fontSize: 13 },
  ticketNoteSoldOut: { color: "#a34a53" },
  stepper: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 999,
    flexDirection: "row",
    paddingHorizontal: 6,
    paddingVertical: 5,
    shadowColor: "#dbe4ea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  stepperButton: {
    alignItems: "center",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  stepperButtonBright: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  stepperDisabled: { opacity: 0.55 },
  stepperValue: {
    color: "#0f1734",
    fontFamily: fonts.extraBold,
    fontSize: 18,
    minWidth: 28,
    textAlign: "center",
  },
  footer: {
    alignItems: "flex-end",
    borderTopColor: "#eef2f5",
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingTop: 16,
  },
  footerLabel: { color: "#64748b", fontFamily: fonts.medium, fontSize: 14 },
  footerValue: {
    color: "#0f1734",
    fontFamily: fonts.extraBold,
    fontSize: 17,
    marginTop: 4,
  },
  footerRight: { alignItems: "flex-end" },
  footerPrice: {
    color: "#0f1734",
    fontFamily: fonts.extraBold,
    fontSize: 22,
    marginTop: 3,
  },
  checkoutButton: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.lime,
    borderRadius: 26,
    flexDirection: "row",
    height: 72,
    justifyContent: "center",
    marginBottom: 16,
    marginTop: 16,
    paddingHorizontal: 20,
    width: "90%",
  },
  checkoutButtonDisabled: { opacity: 0.45 },
  checkoutText: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 18,
    marginRight: 10,
  },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  stateText: {
    alignSelf: "center",
    color: colors.muted,
    fontFamily: fonts.medium,
    paddingVertical: 30,
    textAlign: "center",
  },
});
