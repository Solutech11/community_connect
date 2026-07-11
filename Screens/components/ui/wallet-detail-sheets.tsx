import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "../../styles/theme";

type BaseProps = { visible: boolean; onClose: () => void };
function Shell({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
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
          {children}
          <Pressable onPress={onClose} style={s.close}>
            <Text style={s.closeText}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
function Detail({
  label,
  value,
  green = false,
}: {
  label: string;
  value: string;
  green?: boolean;
}) {
  return (
    <View style={s.detail}>
      <Text style={s.detailLabel}>{label}</Text>
      <Text style={[s.detailValue, green && s.green]}>{value}</Text>
    </View>
  );
}
export function WalletAccountDetailsSheet({ visible, onClose }: BaseProps) {
  return (
    <Shell visible={visible} onClose={onClose}>
      <View style={s.heroIcon}>
        <Ionicons name="wallet" size={29} color="#08b657" />
      </View>
      <Text style={s.title}>Wallet Details</Text>
      <Text style={s.subtitle}>Your CommunityConnect wallet account</Text>
      <View style={s.balanceCard}>
        <Text style={s.balanceLabel}>AVAILABLE BALANCE</Text>
        <Text style={s.balance}>$2,840.50</Text>
        <View style={s.status}>
          <View style={s.dot} />
          <Text style={s.statusText}>Active account</Text>
        </View>
      </View>
      <View style={s.details}>
        <Detail label="Account holder" value="Alex Rivera" />
        <Detail label="Wallet ID" value="CC-4920-2840" />
        <Detail label="Default currency" value="USD ($)" />
        <Detail label="Account type" value="Personal Wallet" />
      </View>
      <View style={s.secure}>
        <Ionicons name="shield-checkmark" size={19} color="#08b657" />
        <Text style={s.secureText}>
          Your wallet is protected and securely encrypted.
        </Text>
      </View>
    </Shell>
  );
}
export type TransactionDetail = { title: string; date: string; amount: string };
export function TransactionDetailsSheet({
  visible,
  onClose,
  transaction,
}: {
  visible: boolean;
  onClose: () => void;
  transaction: TransactionDetail | null;
}) {
  if (!transaction) return null;
  const credit = transaction.amount.startsWith("+");
  return (
    <Shell visible={visible} onClose={onClose}>
      <View style={[s.heroIcon, credit && s.creditIcon]}>
        <Ionicons
          name={credit ? "arrow-down" : "arrow-up"}
          size={29}
          color="#08b657"
        />
      </View>
      <Text style={s.title}>
        {credit ? "Money Received" : "Payment Complete"}
      </Text>
      <Text style={[s.txAmount, credit && s.green]}>{transaction.amount}</Text>
      <Text style={s.subtitle}>{transaction.title}</Text>
      <View style={s.details}>
        <Detail label="Status" value="Successful" green />
        <Detail label="Date & time" value={transaction.date} />
        <Detail
          label="Payment method"
          value={credit ? "Wallet top-up" : "CommunityConnect Wallet"}
        />
        <Detail
          label="Transaction ID"
          value={"CC-" + (credit ? "492084" : "731925")}
        />
      </View>
      <View style={s.secure}>
        <Ionicons name="checkmark-circle" size={19} color="#08b657" />
        <Text style={s.secureText}>
          This transaction was completed successfully.
        </Text>
      </View>
    </Shell>
  );
}
const s = StyleSheet.create({
  overlay: {
    backgroundColor: "rgba(4,15,10,.45)",
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 38,
    borderTopRightRadius: 38,
    padding: 22,
    paddingBottom: 24,
  },
  handle: {
    alignSelf: "center",
    backgroundColor: "#d7e1dc",
    borderRadius: 8,
    height: 6,
    width: 72,
  },
  heroIcon: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#e8f9ef",
    borderRadius: 34,
    height: 64,
    justifyContent: "center",
    marginTop: 22,
    width: 64,
  },
  creditIcon: { backgroundColor: "#ddf8e8" },
  title: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 23,
    marginTop: 14,
    textAlign: "center",
  },
  subtitle: {
    color: "#658075",
    fontFamily: fonts.medium,
    fontSize: 13,
    marginTop: 5,
    textAlign: "center",
  },
  txAmount: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 30,
    marginTop: 9,
    textAlign: "center",
  },
  balanceCard: {
    backgroundColor: "#083120",
    borderRadius: 28,
    marginTop: 22,
    padding: 20,
  },
  balanceLabel: {
    color: "#a9c1b6",
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 0.7,
  },
  balance: {
    color: "#fff",
    fontFamily: fonts.extraBold,
    fontSize: 28,
    marginTop: 4,
  },
  status: { alignItems: "center", flexDirection: "row", marginTop: 12 },
  dot: {
    backgroundColor: "#12d86a",
    borderRadius: 5,
    height: 8,
    marginRight: 7,
    width: 8,
  },
  statusText: { color: "#bce4ce", fontFamily: fonts.bold, fontSize: 12 },
  details: {
    backgroundColor: "#f6faf8",
    borderRadius: 26,
    marginTop: 20,
    paddingHorizontal: 18,
  },
  detail: {
    alignItems: "center",
    borderBottomColor: "#e4eee8",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    minHeight: 53,
  },
  detailLabel: {
    color: "#6b8177",
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  detailValue: { color: colors.ink, fontFamily: fonts.bold, fontSize: 13 },
  green: { color: "#08b657" },
  secure: {
    alignItems: "center",
    backgroundColor: "#eaf9f0",
    borderRadius: 18,
    flexDirection: "row",
    gap: 9,
    marginTop: 16,
    padding: 13,
  },
  secureText: {
    color: "#31875a",
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  close: {
    alignItems: "center",
    backgroundColor: "#08b657",
    borderRadius: 28,
    height: 55,
    justifyContent: "center",
    marginTop: 18,
  },
  closeText: { color: "#fff", fontFamily: fonts.extraBold, fontSize: 16 },
});
