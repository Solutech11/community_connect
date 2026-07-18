import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppAlertModal from '../../components/ui/app-alert-modal';
import { ApiError, createIdempotencyKey } from '../../services/api/client';
import { eventsApi } from '../../services/api/events.api';
import { ticketsApi } from '../../services/api/tickets.api';
import { colors, fonts } from '../../styles/theme';
import type { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Checkout'>;

function formatMoney(kobo: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(kobo / 100);
}

export default function CheckoutScreen({ navigation, route }: Props) {
  const { quantity, subtotal, serviceFee, total, tickets } = route.params;
  const selectedTicket = tickets[0];
  const idempotencyKey = useRef(createIdempotencyKey()).current;
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [authorizationUrl, setAuthorizationUrl] = useState<string | null>(null);
  const [serverTotalKobo, setServerTotalKobo] = useState(total);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ title: string; message: string } | null>(null);

  const initializePayment = async () => {
    if (!selectedTicket) return;
    setSubmitting(true);
    try {
      const response = await eventsApi.createOrder(
        route.params.eventId,
        { ticketTypeId: selectedTicket.id, quantity },
        idempotencyKey,
      );
      setOrderNumber(response.data.order.orderNumber);
      setAuthorizationUrl(response.data.checkoutUrl);
      setServerTotalKobo(response.data.charge.totalPayableKobo);
      await Linking.openURL(response.data.checkoutUrl);
    } catch (error) {
      setAlert({ title: 'Payment initialization failed', message: error instanceof ApiError ? error.message : 'Unable to initialize payment.' });
    } finally {
      setSubmitting(false);
    }
  };

  const verifyPayment = async () => {
    if (!orderNumber) return;
    setSubmitting(true);
    try {
      const response = await ticketsApi.verifyPayment(orderNumber);
      if (response.data.order.status !== 'paid') {
        setAlert({ title: 'Payment not confirmed', message: 'The backend has not confirmed this payment yet. Complete payment in Paystack, then try verification again.' });
        return;
      }
      navigation.replace('PaymentSuccess', { eventId: route.params.eventId, quantity, total: response.data.order.totalKobo });
    } catch (error) {
      setAlert({ title: 'Verification failed', message: error instanceof ApiError ? error.message : 'Unable to verify payment.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}><Ionicons name="arrow-back" size={24} color="#6b7b91" /></Pressable>
          <Text style={styles.headerTitle}>Checkout</Text><View style={{ width: 44 }} />
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.invoiceCard}>
            <Text style={styles.invoiceLabel}>INVOICE DETAILS</Text>
            {tickets.map((ticket) => (
              <View key={ticket.id} style={styles.ticketRow}>
                <View><Text style={styles.ticketTitle}>{ticket.title}</Text><Text style={styles.ticketMeta}>{ticket.quantity} x {formatMoney(ticket.unitPrice)}</Text></View>
                <Text style={styles.invoiceValue}>{formatMoney(ticket.quantity * ticket.unitPrice)}</Text>
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.invoiceRow}><Text style={styles.invoiceKey}>Ticket subtotal</Text><Text style={styles.invoiceValue}>{formatMoney(subtotal)}</Text></View>
            <View style={styles.invoiceRow}><Text style={styles.invoiceKey}>Platform fee</Text><Text style={styles.invoiceValue}>{formatMoney(orderNumber ? serverTotalKobo - subtotal : serviceFee)}</Text></View>
            <View style={[styles.invoiceRow, styles.totalRow]}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>{formatMoney(orderNumber ? serverTotalKobo : total)}</Text></View>
          </View>

          <Text style={styles.paymentTitle}>Payment Method</Text>
          <View style={styles.paystackCard}>
            <Ionicons name="shield-checkmark" size={28} color="#08b657" />
            <View style={{ flex: 1, marginLeft: 14 }}><Text style={styles.paystackTitle}>Pay with Paystack</Text><Text style={styles.paystackSubtitle}>Cards, bank transfer, USSD and more</Text></View>
          </View>
          {orderNumber ? (
            <View style={styles.orderCard}>
              <Text style={styles.orderLabel}>ORDER NUMBER</Text><Text style={styles.orderNumber}>{orderNumber}</Text>
              {authorizationUrl ? <Pressable onPress={() => Linking.openURL(authorizationUrl)}><Text style={styles.reopen}>Reopen Paystack checkout</Text></Pressable> : null}
            </View>
          ) : null}
          <View style={styles.secureRow}><Ionicons name="lock-closed-outline" size={16} color="#a6b4c8" /><Text style={styles.secureText}>Success is shown only after backend verification</Text></View>
        </ScrollView>
        <View style={styles.bottomBar}>
          <Pressable disabled={submitting || !selectedTicket} onPress={orderNumber ? verifyPayment : initializePayment} style={[styles.payButton, submitting && styles.disabled]}>
            <Text style={styles.payButtonText}>{submitting ? 'Please wait...' : orderNumber ? 'Verify Payment' : `Pay Now ${formatMoney(total)}`}</Text>
            <Ionicons name={orderNumber ? 'checkmark-circle-outline' : 'lock-closed-outline'} size={22} color={colors.ink} />
          </Pressable>
        </View>
      </SafeAreaView>
      <AppAlertModal visible={Boolean(alert)} title={alert?.title ?? ''} message={alert?.message ?? ''} onClose={() => setAlert(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.paper, flex: 1 }, header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', padding: 22 }, backButton: { alignItems: 'center', backgroundColor: '#f3f6f9', borderRadius: 22, height: 44, justifyContent: 'center', width: 44 }, headerTitle: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 24 }, content: { paddingBottom: 30, paddingHorizontal: 22 }, invoiceCard: { backgroundColor: '#f5f7f8', borderRadius: 30, padding: 22 }, invoiceLabel: { color: '#08b657', fontFamily: fonts.bold, fontSize: 12 }, ticketRow: { alignItems: 'center', backgroundColor: colors.white, borderRadius: 18, flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, padding: 14 }, ticketTitle: { color: colors.ink, fontFamily: fonts.bold, fontSize: 15 }, ticketMeta: { color: '#66758c', fontFamily: fonts.medium, fontSize: 12, marginTop: 4 }, divider: { backgroundColor: '#e3e9ee', height: 1, marginTop: 20 }, invoiceRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }, invoiceKey: { color: '#66758c', fontFamily: fonts.medium, fontSize: 15 }, invoiceValue: { color: colors.ink, fontFamily: fonts.bold, fontSize: 15 }, totalRow: { marginTop: 24 }, totalLabel: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 17 }, totalValue: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 25 }, paymentTitle: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 18, marginTop: 28 }, paystackCard: { alignItems: 'center', backgroundColor: colors.white, borderColor: colors.lime, borderRadius: 26, borderWidth: 2, flexDirection: 'row', marginTop: 14, padding: 18 }, paystackTitle: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 17 }, paystackSubtitle: { color: '#66758c', fontFamily: fonts.medium, fontSize: 13, marginTop: 4 }, orderCard: { backgroundColor: '#eafff1', borderRadius: 22, marginTop: 18, padding: 18 }, orderLabel: { color: '#399760', fontFamily: fonts.bold, fontSize: 11 }, orderNumber: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 15, marginTop: 6 }, reopen: { color: '#08a951', fontFamily: fonts.bold, fontSize: 13, marginTop: 12 }, secureRow: { alignItems: 'center', alignSelf: 'center', flexDirection: 'row', gap: 8, marginTop: 30 }, secureText: { color: '#9aa9bf', fontFamily: fonts.medium, fontSize: 12 }, bottomBar: { borderTopColor: '#eff3f6', borderTopWidth: 1, padding: 18 }, payButton: { alignItems: 'center', backgroundColor: colors.lime, borderRadius: 28, flexDirection: 'row', height: 70, justifyContent: 'center' }, payButtonText: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 18, marginRight: 10 }, disabled: { opacity: 0.6 },
});

