import { Ionicons } from "@expo/vector-icons";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "../../styles/theme";
export type PurchasedTicket = {
  name: string;
  ticket: string;
  status: string;
  avatar: string;
};
export default function TicketPurchaseDetailsSheet({
  visible,
  ticket,
  onClose,
}: {
  visible: boolean;
  ticket: PurchasedTicket | null;
  onClose: () => void;
}) {
  if (!ticket) return null;
  const checked = ticket.status === "Checked In";
  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={s.sheet}>
          <View style={s.handle} />
          <Image source={{ uri: ticket.avatar }} style={s.avatar} />
          <Text style={s.name}>{ticket.name}</Text>
          <Text style={s.email}>
            {ticket.name.toLowerCase().replace(" ", ".")}@example.com
          </Text>
          <View style={s.ticketCard}>
            <View style={s.ticketHead}>
              <View style={s.ticketIcon}>
                <Ionicons name="ticket" size={25} color="#08b657" />
              </View>
              <View>
                <Text style={s.event}>Urban Echo: Neon Garden Festival</Text>
                <Text style={s.type}>{ticket.ticket}</Text>
              </View>
            </View>
            <View style={s.line} />
            <View style={s.grid}>
              <View>
                <Text style={s.label}>TICKET ID</Text>
                <Text style={s.value}>CC-{ticket.name.length}4920</Text>
              </View>
              <View>
                <Text style={s.label}>QUANTITY</Text>
                <Text style={s.value}>1 Ticket</Text>
              </View>
              <View>
                <Text style={s.label}>PURCHASED</Text>
                <Text style={s.value}>Oct 20, 2023</Text>
              </View>
              <View>
                <Text style={s.label}>AMOUNT</Text>
                <Text style={s.value}>
                  {ticket.ticket === "VIP Access" ? "$75.00" : "$35.00"}
                </Text>
              </View>
            </View>
          </View>
          <View style={[s.status, checked ? s.checked : s.pending]}>
            <Ionicons
              name={checked ? "checkmark-circle" : "time-outline"}
              size={20}
              color={checked ? "#08b657" : "#718198"}
            />
            <Text style={[s.statusText, checked && s.green]}>
              {checked
                ? "Ticket checked in successfully"
                : "Ticket awaiting check-in"}
            </Text>
          </View>
          <Pressable onPress={onClose} style={s.done}>
            <Text style={s.doneText}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
const s = StyleSheet.create({
  overlay: {
    backgroundColor: "rgba(3,14,9,.45)",
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderTopLeftRadius: 38,
    borderTopRightRadius: 38,
    padding: 22,
    paddingBottom: 25,
  },
  handle: { backgroundColor: "#d6e0db", borderRadius: 6, height: 6, width: 72 },
  avatar: {
    borderColor: "#e4f5eb",
    borderRadius: 39,
    borderWidth: 4,
    height: 78,
    marginTop: 20,
    width: 78,
  },
  name: { fontFamily: fonts.extraBold, fontSize: 22, marginTop: 10 },
  email: {
    color: "#6a8075",
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 3,
  },
  ticketCard: {
    backgroundColor: "#f5faf7",
    borderRadius: 28,
    marginTop: 20,
    padding: 18,
    width: "100%",
  },
  ticketHead: { alignItems: "center", flexDirection: "row", gap: 13 },
  ticketIcon: {
    alignItems: "center",
    backgroundColor: "#e1f8eb",
    borderRadius: 23,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  event: { fontFamily: fonts.bold, fontSize: 14 },
  type: {
    color: "#29965a",
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 3,
  },
  line: { backgroundColor: "#dfeae4", height: 1, marginVertical: 17 },
  grid: { flexDirection: "row", flexWrap: "wrap", rowGap: 18 },
  label: {
    color: "#7c9086",
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  value: { fontFamily: fonts.bold, fontSize: 12, marginTop: 4 },
  status: {
    alignItems: "center",
    borderRadius: 20,
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
    padding: 13,
    width: "100%",
  },
  checked: { backgroundColor: "#e7f9ef" },
  pending: { backgroundColor: "#f1f4f8" },
  statusText: { color: "#718198", fontFamily: fonts.bold, fontSize: 12 },
  green: { color: "#199953" },
  done: {
    alignItems: "center",
    backgroundColor: "#08b657",
    borderRadius: 27,
    height: 55,
    justifyContent: "center",
    marginTop: 18,
    width: "100%",
  },
  doneText: { color: "#fff", fontFamily: fonts.extraBold, fontSize: 16 },
});
