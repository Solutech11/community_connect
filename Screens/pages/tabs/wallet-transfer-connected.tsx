import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AppLoader from "../../components/ui/app-loader";
import { SafeAreaView } from "react-native-safe-area-context";

import AppAlertModal from "../../components/ui/app-alert-modal";
import ProfilePageHeader from "../../components/ui/profile-page-header";
import { ApiError, createIdempotencyKey } from "../../services/api/client";
import { walletApi } from "../../services/api/wallet.api";
import { colors, fonts } from "../../styles/theme";
import type { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "WalletTransfer">;

export default function WalletTransferConnectedScreen({ navigation }: Props) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null);
  const keyRef = useRef<string | null>(null);

  const submit = async () => {
    const naira = Number(amount);
    if (!recipient.trim() || !Number.isFinite(naira) || naira <= 0) {
      setNotice({ title: "Check transfer", message: "Enter the recipient email and a valid amount." });
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      keyRef.current ??= createIdempotencyKey();
      const response = await walletApi.transfer({ recipient: recipient.trim(), amountKobo: Math.round(naira * 100), note: note.trim() || undefined }, keyRef.current);
      setNotice({ title: "Transfer complete", message: `Backend status: ${response.data.transaction.status}. Reference: ${response.data.transaction.reference}` });
      keyRef.current = null;
      setAmount("");
      setNote("");
    } catch (error) {
      setNotice({ title: "Transfer failed", message: error instanceof ApiError ? error.message : "Unable to complete this transfer." });
    } finally {
      setSubmitting(false);
    }
  };

  return <>
    <SafeAreaView edges={[]} style={styles.safe}>
      <ProfilePageHeader title="Transfer" onBack={navigation.goBack} />
      <View style={styles.content}>
        <View style={styles.icon}><Ionicons color={colors.ink} name="swap-horizontal" size={28} /></View>
        <Text style={styles.label}>Recipient email</Text>
        <TextInput autoCapitalize="none" keyboardType="email-address" onChangeText={(value) => { setRecipient(value); keyRef.current = null; }} placeholder="recipient@example.com" placeholderTextColor="#718078" style={styles.input} value={recipient} />
        <Text style={styles.label}>Amount (NGN)</Text>
        <TextInput keyboardType="decimal-pad" onChangeText={(value) => { setAmount(value); keyRef.current = null; }} placeholder="5000" placeholderTextColor="#718078" style={styles.input} value={amount} />
        <Text style={styles.label}>Note (optional)</Text>
        <TextInput onChangeText={(value) => { setNote(value); keyRef.current = null; }} placeholder="Shared event costs" placeholderTextColor="#718078" style={styles.input} value={note} />
        <Pressable disabled={submitting} onPress={() => void submit()} style={[styles.primary, submitting && styles.disabled]}>{submitting ? <AppLoader color={colors.ink} /> : <Text style={styles.primaryText}>Send transfer</Text>}</Pressable>
      </View>
    </SafeAreaView>
    <AppAlertModal visible={Boolean(notice)} title={notice?.title ?? ""} message={notice?.message ?? ""} onClose={() => setNotice(null)} />
  </>;
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.paper, flex: 1 }, content: { padding: 24 }, icon: { alignItems: "center", alignSelf: "center", backgroundColor: colors.lime, borderRadius: 30, height: 60, justifyContent: "center", marginBottom: 20, marginTop: 28, width: 60 },
  label: { color: colors.ink, fontFamily: fonts.bold, fontSize: 12, marginBottom: 7, marginTop: 15 }, input: { backgroundColor: colors.white, borderRadius: 19, color: colors.ink, fontFamily: fonts.medium, height: 52, paddingHorizontal: 16 },
  primary: { alignItems: "center", backgroundColor: colors.lime, borderRadius: 24, height: 52, justifyContent: "center", marginTop: 25 }, primaryText: { color: colors.ink, fontFamily: fonts.bold }, disabled: { opacity: 0.55 },
});
