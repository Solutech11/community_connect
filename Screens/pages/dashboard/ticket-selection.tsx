import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getEventById } from '../../data/events';
import { getTicketsForEventId, type TicketOption } from '../../data/tickets';
import { colors, fonts } from '../../styles/theme';
import type { CheckoutTicketSelection, RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'TicketSelection'>;
type TicketState = TicketOption & { quantity: number };

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

export default function TicketSelectionScreen({ navigation, route }: Props) {
  const event = getEventById(route.params.eventId);
  const [tickets, setTickets] = useState<TicketState[]>(() =>
    getTicketsForEventId(route.params.eventId).map((ticket) => ({
      ...ticket,
      quantity: ticket.initialQuantity ?? 0,
    }))
  );

  const quantity = useMemo(() => tickets.reduce((sum, ticket) => sum + ticket.quantity, 0), [tickets]);
  const subtotal = useMemo(() => tickets.reduce((sum, ticket) => sum + ticket.price * ticket.quantity, 0), [tickets]);
  const serviceFee = useMemo(() => (quantity > 0 ? 6 : 0), [quantity]);
  const total = subtotal;

  const selectedTickets = useMemo<CheckoutTicketSelection[]>(
    () =>
      tickets
        .filter((ticket) => ticket.quantity > 0)
        .map((ticket) => ({
          id: ticket.id,
          title: ticket.title,
          quantity: ticket.quantity,
          unitPrice: ticket.price,
        })),
    [tickets]
  );

  const updateQuantity = (ticketId: string, delta: number) => {
    setTickets((current) =>
      current.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, quantity: Math.max(0, ticket.quantity + delta) } : ticket
      )
    );
  };

  if (!event) {
    return <View style={styles.overlay} />;
  }

  return (
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFillObject} onPress={() => navigation.goBack()} />

      <SafeAreaView style={styles.safeArea} edges={[]}>
        <View style={styles.sheetWrap}>
          <View style={styles.sheet}>
            <View style={styles.handle} />

            <View style={styles.headerRow}>
              <Text style={styles.headerTitle}>Select Tickets</Text>
              <Pressable onPress={() => navigation.goBack()} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#64748b" />
              </Pressable>
            </View>

            <View style={styles.headerDivider} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.ticketList}>
              {tickets.map((ticket) => {
                const featured = ticket.accent === 'featured';

                return (
                  <View key={ticket.id} style={[styles.ticketCard, featured && styles.ticketCardFeatured]}>
                    {featured ? <View style={styles.ticketAccentBar} /> : null}

                    <View style={styles.ticketContent}>
                      <View style={styles.ticketTopRow}>
                        <View style={styles.ticketTitleWrap}>
                          <View style={styles.ticketTitleRow}>
                            <Text style={styles.ticketTitle}>{ticket.title}</Text>
                            {ticket.badge ? <Text style={styles.badge}>{ticket.badge}</Text> : null}
                            {ticket.star ? <Ionicons name="star" size={15} color="#efb100" /> : null}
                          </View>
                          <Text style={styles.ticketDescription}>{ticket.description}</Text>
                        </View>

                        <View style={styles.ticketPriceWrap}>
                          <Text style={styles.ticketPrice}>${ticket.price}</Text>
                          {ticket.originalPrice ? <Text style={styles.ticketOldPrice}>${ticket.originalPrice}</Text> : null}
                        </View>
                      </View>

                      <View style={styles.ticketDivider} />

                      <View style={styles.ticketBottomRow}>
                        <Text style={styles.ticketNote}>{ticket.note ?? 'Available now'}</Text>

                        <View style={styles.stepper}>
                          <Pressable onPress={() => updateQuantity(ticket.id, -1)} style={styles.stepperButtonSoft}>
                            <Ionicons name="remove" size={22} color="#94a3b8" />
                          </Pressable>
                          <Text style={styles.stepperValue}>{ticket.quantity}</Text>
                          <Pressable onPress={() => updateQuantity(ticket.id, 1)} style={styles.stepperButtonBright}>
                            <Ionicons name="add" size={19} color={colors.ink} />
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
                <Text style={styles.footerValue}>{quantity} Tickets</Text>
              </View>

              <View style={styles.footerRight}>
                <Text style={styles.footerLabel}>Subtotal</Text>
                <Text style={styles.footerPrice}>{formatCurrency(subtotal)}</Text>
              </View>
            </View>

            <Pressable
              disabled={quantity === 0}
              onPress={() =>
                navigation.replace('Checkout', {
                  eventId: event.id,
                  quantity,
                  subtotal,
                  serviceFee,
                  total,
                  tickets: selectedTickets,
                })
              }
              style={[styles.checkoutButton, quantity === 0 && styles.checkoutButtonDisabled]}
            >
              <Text style={styles.checkoutText}>Proceed to Checkout</Text>
              <Ionicons name="arrow-forward" size={24} color={colors.ink} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(5, 10, 8, 0.62)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    height: '56%',
    minHeight: 430,
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: '#cfd5dc',
    borderRadius: 999,
    height: 7,
    width: 82,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 14,
  },
  headerTitle: {
    color: '#0f1734',
    fontFamily: fonts.extraBold,
    fontSize: 24,
    letterSpacing: -0.6,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: '#f4f7fa',
    borderRadius: 20,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  headerDivider: {
    backgroundColor: '#edf1f4',
    height: 1,
    marginHorizontal: 22,
    marginTop: 12,
  },
  ticketList: {
    gap: 14,
    paddingBottom: 14,
    paddingHorizontal: 22,
    paddingTop: 18,
  },
  ticketCard: {
    backgroundColor: '#f5f7f8',
    borderColor: '#eff3f5',
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
  },
  ticketCardFeatured: {
    backgroundColor: colors.white,
    borderColor: '#bff8d4',
    borderWidth: 2,
  },
  ticketAccentBar: {
    backgroundColor: colors.lime,
    borderBottomLeftRadius: 18,
    borderTopLeftRadius: 18,
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 8,
  },
  ticketContent: {
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  ticketTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ticketTitleWrap: {
    flex: 1,
    paddingRight: 14,
  },
  ticketTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ticketTitle: {
    color: '#0f1734',
    fontFamily: fonts.extraBold,
    fontSize: 19,
    letterSpacing: -0.4,
  },
  badge: {
    backgroundColor: colors.lime,
    borderRadius: 999,
    color: '#062112',
    fontFamily: fonts.extraBold,
    fontSize: 11,
    overflow: 'hidden',
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  ticketDescription: {
    color: '#60708c',
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 18,
    marginTop: 10,
  },
  ticketPriceWrap: {
    alignItems: 'flex-end',
  },
  ticketPrice: {
    color: '#0f1734',
    fontFamily: fonts.extraBold,
    fontSize: 22,
  },
  ticketOldPrice: {
    color: '#9ba9bf',
    fontFamily: fonts.medium,
    fontSize: 13,
    marginTop: 4,
    textDecorationLine: 'line-through',
  },
  ticketDivider: {
    backgroundColor: '#e8edf1',
    height: 1,
    marginTop: 16,
  },
  ticketBottomRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  ticketNote: {
    color: '#93a3bd',
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  stepper: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 999,
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingVertical: 5,
    shadowColor: '#dbe4ea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  stepperButtonSoft: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  stepperButtonBright: {
    alignItems: 'center',
    backgroundColor: colors.lime,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  stepperValue: {
    color: '#0f1734',
    fontFamily: fonts.extraBold,
    fontSize: 18,
    minWidth: 28,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'flex-end',
    borderTopColor: '#eef2f5',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 16,
  },
  footerLabel: {
    color: '#64748b',
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  footerValue: {
    color: '#0f1734',
    fontFamily: fonts.extraBold,
    fontSize: 17,
    marginTop: 4,
  },
  footerRight: {
    alignItems: 'flex-end',
  },
  footerPrice: {
    color: '#0f1734',
    fontFamily: fonts.extraBold,
    fontSize: 22,
    marginTop: 3,
  },
  checkoutButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.lime,
    borderRadius: 26,
    flexDirection: 'row',
    height: 72,
    justifyContent: 'center',
    marginBottom: 16,
    marginTop: 16,
    paddingHorizontal: 20,
    width: '90%',
  },
  checkoutButtonDisabled: {
    opacity: 0.45,
  },
  checkoutText: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 18,
    marginRight: 10,
  },
});