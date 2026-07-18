import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useRef, useState } from "react";
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppAlertModal from "../../components/ui/app-alert-modal";
import ProfilePageHeader from "../../components/ui/profile-page-header";
import { ApiError, createIdempotencyKey } from "../../services/api/client";
import { walletApi } from "../../services/api/wallet.api";
import { colors, fonts } from "../../styles/theme";
import type { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "WalletTopUp">;

export default function WalletTopUpConnectedScreen({ navigation }: Props) {
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null);
  const idempotencyKey = useRef<string | null>(null);

  const initialize = async () => {
    const naira = Number(amount);
    if (!Number.isFinite(naira) || naira <= 0) {
      setNotice({ title: "Enter an amount", message: "Enter a valid amount greater than zero." });
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      idempotencyKey.current ??= createIdempotencyKey();
      const response = await walletApi.initializeTopUp(Math.round(naira * 100), idempotencyKey.current);
      setReference(response.data.reference);
      await Linking.openURL(response.data.authorizationUrl);
    } catch (error) {
      setNotice({ title: "Top-up unavailable", message: error instanceof ApiError ? error.message : "Unable to start the payment." });
    } finally {
      setSubmitting(false);
    }
  };

  const verify = async () => {
    if (!reference || verifying) return;
    setVerifying(true);
    try {
      const response = await walletApi.verifyTopUp(reference);
      if (response.data.transaction.status !== "successful") {
        setNotice({ title: "Payment pending", message: `The backend reports this top-up as ${response.data.transaction.status}.` });
        return;
      }
      setNotice({ title: "Wallet funded", message: "Your top-up was verified by the backend and credited successfully." });
      idempotencyKey.current = null;
    } catch (error) {
      setNotice({ title: "Verification failed", message: error instanceof ApiError ? error.message : "Unable to verify this payment." });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <>
      <SafeAreaView edges={[]} style={styles.safe}>
        <ProfilePageHeader title="Top Up Wallet" onBack={navigation.goBack} />
        <View style={styles.content}>
          <View style={styles.icon}><Ionicons color={colors.ink} name="wallet-outline" size={28} /></View>
          <Text style={styles.title}>Add money securely</Text>
          <Text style={styles.copy}>Enter an amount in naira. Payment is completed on Paystack and only credited after backend verification.</Text>
          <Text style={styles.label}>Amount (NGN)</Text>
          <TextInput
            keyboardType="decimal-pad"
            onChangeText={(value) => { setAmount(value); setReference(null); idempotencyKey.current = null; }}
            placeholder="1000"
            placeholderTextColor="#718078"
            style={styles.input}
            value={amount}
          />
          <Pressable disabled={submitting} onPress={() => void initialize()} style={[styles.primary, submitting && styles.disabled]}>
            {submitting ? <ActivityIndicator color={colors.ink} /> : <Text style={styles.primaryText}>Continue to Paystack</Text>}
          </Pressable>
          {reference ? <View style={styles.verifyCard}>
            <Text style={styles.verifyTitle}>Returned from Paystack?</Text>
            <Text numberOfLines={1} style={styles.reference}>{reference}</Text>
            <Pressable disabled={verifying} onPress={() => void verify()} style={styles.secondary}>
              {verifying ? <ActivityIndicator color="#078d45" /> : <Text style={styles.secondaryText}>Verify payment</Text>}
            </Pressable>
          </View> : null}
        </View>
      </SafeAreaView>
      <AppAlertModal visible={Boolean(notice)} title={notice?.title ?? ""} message={notice?.message ?? ""} onClose={() => setNotice(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.paper, flex: 1 }, content: { padding: 24 }, icon: { alignItems: "center", alignSelf: "center", backgroundColor: colors.lime, borderRadius: 30, height: 60, justifyContent: "center", marginTop: 30, width: 60 },
  title: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 23, marginTop: 18, textAlign: "center" }, copy: { color: "#65786f", fontFamily: fonts.medium, fontSize: 12, lineHeight: 19, marginTop: 8, textAlign: "center" },
  label: { color: colors.ink, fontFamily: fonts.bold, fontSize: 12, marginTop: 28 }, input: { backgroundColor: colors.white, borderRadius: 20, color: colors.ink, fontFamily: fonts.extraBold, fontSize: 20, height: 58, marginTop: 8, paddingHorizontal: 18 },
  primary: { alignItems: "center", backgroundColor: colors.lime, borderRadius: 24, height: 52, justifyContent: "center", marginTop: 18 }, primaryText: { color: colors.ink, fontFamily: fonts.bold }, disabled: { opacity: 0.55 },
  verifyCard: { backgroundColor: colors.white, borderRadius: 22, marginTop: 22, padding: 18 }, verifyTitle: { color: colors.ink, fontFamily: fonts.bold, fontSize: 14 }, reference: { color: "#718078", fontFamily: fonts.medium, fontSize: 10, marginTop: 6 }, secondary: { alignItems: "center", borderColor: "#08b657", borderRadius: 19, borderWidth: 1, marginTop: 14, padding: 11 }, secondaryText: { color: "#078d45", fontFamily: fonts.bold },
});
