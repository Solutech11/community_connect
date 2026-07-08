import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getEventById } from '../../data/events';
import { colors, fonts } from '../../styles/theme';
import type { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Checkout'>;

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

export default function CheckoutScreen({ navigation, route }: Props) {
  const event = getEventById(route.params.eventId);
  const { quantity, subtotal, serviceFee, total, tickets } = route.params;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#6b7b91" />
        </Pressable>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.invoiceCard}>
          <Text style={styles.invoiceLabel}>INVOICE DETAILS</Text>
          <Text style={styles.eventTitle}>{event?.title ?? 'Selected Event'}</Text>

          <View style={styles.breakdownWrap}>
            {tickets.map((ticket) => (
              <View key={ticket.id} style={styles.ticketBreakdownRow}>
                <View style={styles.ticketBreakdownCopy}>
                  <Text style={styles.ticketBreakdownTitle}>{ticket.title}</Text>
                  <Text style={styles.ticketBreakdownMeta}>
                    {ticket.quantity} x {formatCurrency(ticket.unitPrice)}
                  </Text>
                </View>
                <Text style={styles.ticketBreakdownAmount}>
                  {formatCurrency(ticket.quantity * ticket.unitPrice)}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.invoiceDivider} />

          <View style={styles.invoiceRow}>
            <Text style={styles.invoiceKey}>Ticket Price ({quantity} Tickets)</Text>
            <Text style={styles.invoiceValue}>{formatCurrency(Math.max(subtotal - serviceFee, 0))}</Text>
          </View>

          <View style={styles.invoiceRow}>
            <Text style={styles.invoiceKey}>Service Fee</Text>
            <Text style={styles.invoiceValue}>{formatCurrency(serviceFee)}</Text>
          </View>

          <View style={styles.invoiceDivider} />

          <View style={styles.invoiceRow}>
            <Text style={styles.invoiceKey}>Subtotal</Text>
            <Text style={styles.invoiceValue}>{formatCurrency(subtotal)}</Text>
          </View>

          <View style={[styles.invoiceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
          </View>
        </View>

        <Text style={styles.paymentTitle}>Payment Method</Text>

        <Pressable style={styles.paystackCard}>
          <View style={styles.paystackLeft}>
            <View style={styles.radioOuter}>
              <View style={styles.radioInner} />
            </View>
            <View style={styles.paystackCopy}>
              <Text style={styles.paystackTitle}>Pay with Paystack</Text>
              <Text style={styles.paystackSubtitle}>Cards, Bank Transfer, USSD & more</Text>
            </View>
          </View>

          <View style={styles.paystackBadge}>
            <Text style={styles.paystackBadgeText}>PAYSTACK</Text>
          </View>
        </Pressable>

        <View style={styles.secureRow}>
          <Ionicons name="lock-closed-outline" size={16} color="#a6b4c8" />
          <Text style={styles.secureText}>Payments are secure and encrypted</Text>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable
          onPress={() =>
            navigation.replace('PaymentSuccess', {
              eventId: route.params.eventId,
              quantity,
              total,
            })
          }
          style={styles.payButton}
        >
          <Text style={styles.payButtonText}>Pay Now {formatCurrency(total)}</Text>
          <Ionicons name="lock-closed-outline" size={22} color={colors.ink} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.paper,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 12,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: '#f3f6f9',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  headerTitle: {
    color: '#0f1734',
    fontFamily: fonts.extraBold,
    fontSize: 24,
    letterSpacing: -0.6,
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    paddingBottom: 28,
    paddingHorizontal: 22,
    paddingTop: 24,
  },
  invoiceCard: {
    backgroundColor: '#f5f7f8',
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 22,
  },
  invoiceLabel: {
    color: colors.lime,
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  eventTitle: {
    color: '#0f1734',
    fontFamily: fonts.extraBold,
    fontSize: 22,
    marginTop: 10,
  },
  breakdownWrap: {
    gap: 12,
    marginTop: 18,
  },
  ticketBreakdownRow: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  ticketBreakdownCopy: {
    flex: 1,
    paddingRight: 12,
  },
  ticketBreakdownTitle: {
    color: '#0f1734',
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  ticketBreakdownMeta: {
    color: '#66758c',
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 4,
  },
  ticketBreakdownAmount: {
    color: '#0f1734',
    fontFamily: fonts.extraBold,
    fontSize: 14,
  },
  invoiceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  invoiceKey: {
    color: '#66758c',
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 16,
    paddingRight: 12,
  },
  invoiceValue: {
    color: '#0f1734',
    fontFamily: fonts.semiBold,
    fontSize: 16,
  },
  invoiceDivider: {
    backgroundColor: '#e3e9ee',
    height: 1,
    marginTop: 20,
  },
  totalRow: {
    marginTop: 22,
  },
  totalLabel: {
    color: '#0f1734',
    fontFamily: fonts.extraBold,
    fontSize: 17,
  },
  totalValue: {
    color: '#0f1734',
    fontFamily: fonts.extraBold,
    fontSize: 26,
    letterSpacing: -0.6,
  },
  paymentTitle: {
    color: '#0f1734',
    fontFamily: fonts.extraBold,
    fontSize: 18,
    marginTop: 32,
  },
  paystackCard: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.lime,
    borderRadius: 26,
    borderWidth: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  paystackLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
  },
  radioOuter: {
    alignItems: 'center',
    borderColor: colors.lime,
    borderRadius: 999,
    borderWidth: 2,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  radioInner: {
    backgroundColor: colors.lime,
    borderRadius: 999,
    height: 12,
    width: 12,
  },
  paystackCopy: {
    flex: 1,
    marginLeft: 14,
    paddingRight: 10,
  },
  paystackTitle: {
    color: '#0f1734',
    fontFamily: fonts.extraBold,
    fontSize: 17,
  },
  paystackSubtitle: {
    color: '#66758c',
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  paystackBadge: {
    backgroundColor: '#eef4fb',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  paystackBadgeText: {
    color: '#205ce8',
    fontFamily: fonts.extraBold,
    fontSize: 12,
  },
  secureRow: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 56,
  },
  secureText: {
    color: '#9aa9bf',
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  bottomBar: {
    borderTopColor: '#eff3f6',
    borderTopWidth: 1,
    paddingBottom: 18,
    paddingHorizontal: 22,
    paddingTop: 14,
  },
  payButton: {
    alignItems: 'center',
    backgroundColor: colors.lime,
    borderRadius: 28,
    flexDirection: 'row',
    height: 72,
    justifyContent: 'center',
  },
  payButtonText: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 20,
    marginRight: 10,
  },
});