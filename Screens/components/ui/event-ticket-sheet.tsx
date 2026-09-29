import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppLoader from "./app-loader";
import { colors, fonts } from "../../styles/theme";
import type { GetEventsIdResponse } from "../../types/api.generated";
import type { RootStackParamList } from "../../types/navigation";

export type EventTicketType = Omit<
  GetEventsIdResponse["data"]["ticketTypes"][number],
  "capacity" | "description" | "reserved"
> & {
  capacity?: number;
  description?: string;
  reserved?: number;
};

type EventTicketSheetProps = {
  visible: boolean;
  eventId: string;
  title: string;
  ticketTypes: EventTicketType[];
  loading?: boolean;
  onClose: () => void;
  onCheckout: (selection: RootStackParamList["Checkout"]) => void;
};

// POST /events/{id}/orders accepts at most 20 tickets of one ticket type.
const MAX_ORDER_QUANTITY = 20;

function formatMoney(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(kobo / 100);
}

function maxQuantity(ticket: EventTicketType) {
  if (ticket.capacity == null) return MAX_ORDER_QUANTITY;
  return Math.min(
    MAX_ORDER_QUANTITY,
    Math.max(0, ticket.capacity - ticket.sold - (ticket.reserved ?? 0)),
  );
}

export default function EventTicketSheet({
  visible,
  eventId,
  title,
  ticketTypes,
  loading = false,
  onClose,
  onCheckout,
}: EventTicketSheetProps) {
  const activeTickets = useMemo(
    () => ticketTypes.filter((ticket) => ticket.active),
    [ticketTypes],
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const firstAvailable = activeTickets.find((ticket) => maxQuantity(ticket) > 0);
    setSelectedId(firstAvailable?._id ?? null);
    setQuantity(firstAvailable ? 1 : 0);
  }, [activeTickets, visible]);

  const selected = activeTickets.find((ticket) => ticket._id === selectedId);
  const subtotalKobo = (selected?.priceKobo ?? 0) * quantity;

  const selectTicket = (ticket: EventTicketType) => {
    if (maxQuantity(ticket) === 0) return;
    setSelectedId(ticket._id);
    setQuantity(1);
  };

  const changeQuantity = (ticket: EventTicketType, delta: number) => {
    const maximum = maxQuantity(ticket);
    if (maximum === 0) return;
    if (ticket._id !== selectedId) {
      if (delta > 0) selectTicket(ticket);
      return;
    }
    setQuantity((current) => Math.max(0, Math.min(maximum, current + delta)));
  };

  const checkout = () => {
    if (!selected || quantity === 0) return;
    onCheckout({
      eventId,
      quantity,
      subtotal: subtotalKobo,
      serviceFee: 0,
      total: subtotalKobo,
      tickets: [
        {
          id: selected._id,
          title: selected.title,
          quantity,
          unitPrice: selected.priceKobo,
        },
      ],
    });
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel="Close ticket selection"
          onPress={onClose}
          style={StyleSheet.absoluteFillObject}
        />
        <SafeAreaView edges={["bottom"]} style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <View style={styles.headerCopy}>
              <Text style={styles.headerTitle}>Select Tickets</Text>
              <Text numberOfLines={1} style={styles.eventTitle}>
                {title}
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Close ticket selection"
              accessibilityRole="button"
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons color="#64748b" name="close" size={24} />
            </Pressable>
          </View>
          <View style={styles.headerDivider} />

          <ScrollView
            contentContainerStyle={styles.ticketList}
            showsVerticalScrollIndicator={false}
            style={styles.ticketScroll}
          >
            {loading ? (
              <View style={styles.state}>
                <AppLoader color="#08b657" />
                <Text style={styles.stateText}>Loading tickets...</Text>
              </View>
            ) : null}
            {!loading && activeTickets.length === 0 ? (
              <Text style={styles.stateText}>
                No ticket types are currently available.
              </Text>
            ) : null}
            {activeTickets.map((ticket) => {
              const maximum = maxQuantity(ticket);
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
                      style={styles.ticketTopRow}
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
                      <Text style={styles.ticketPrice}>
                        {formatMoney(ticket.priceKobo)}
                      </Text>
                    </Pressable>
                    <View style={styles.ticketDivider} />
                    <View style={styles.ticketBottomRow}>
                      <Text
                        style={[
                          styles.ticketNote,
                          soldOut && styles.ticketNoteSoldOut,
                        ]}
                      >
                        {stockLabel}
                      </Text>
                      <View style={styles.stepper}>
                        <Pressable
                          accessibilityLabel={`Remove one ${ticket.title} ticket`}
                          accessibilityRole="button"
                          accessibilityState={{
                            disabled: !isSelected || quantity === 0,
                          }}
                          disabled={!isSelected || quantity === 0}
                          onPress={() => changeQuantity(ticket, -1)}
                          style={[
                            styles.stepperButton,
                            (!isSelected || quantity === 0) &&
                              styles.stepperDisabled,
                          ]}
                        >
                          <Ionicons color={colors.ink} name="remove" size={21} />
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
                          onPress={() => changeQuantity(ticket, 1)}
                          style={[
                            styles.stepperButtonBright,
                            (soldOut || (isSelected && quantity >= maximum)) &&
                              styles.stepperDisabled,
                          ]}
                        >
                          <Ionicons color={colors.ink} name="add" size={19} />
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
            accessibilityState={{ disabled: !selected || quantity === 0 }}
            disabled={!selected || quantity === 0}
            onPress={checkout}
            style={[
              styles.checkoutButton,
              (!selected || quantity === 0) && styles.checkoutButtonDisabled,
            ]}
          >
            <Text style={styles.checkoutText}>Proceed to Checkout</Text>
            <Ionicons color={colors.ink} name="arrow-forward" size={24} />
          </Pressable>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: "rgba(5, 10, 8, 0.48)",
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    height: "62%",
    maxHeight: "82%",
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
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 24,
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
  state: { alignItems: "center", gap: 10, paddingVertical: 30 },
  stateText: {
    color: colors.muted,
    fontFamily: fonts.medium,
    textAlign: "center",
  },
  ticketCard: {
    backgroundColor: "#f5f7f8",
    borderColor: "#eff3f5",
    borderRadius: 28,
    borderWidth: 1,
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
  ticketTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  ticketTitle: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 19,
  },
  ticketDescription: {
    color: "#60708c",
    fontFamily: fonts.medium,
    fontSize: 14,
    marginTop: 8,
  },
  ticketPrice: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 20,
  },
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
  stepperDisabled: { opacity: 0.45 },
  stepperValue: {
    color: colors.ink,
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
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 17,
    marginTop: 4,
  },
  footerRight: { alignItems: "flex-end" },
  footerPrice: {
    color: colors.ink,
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
});
