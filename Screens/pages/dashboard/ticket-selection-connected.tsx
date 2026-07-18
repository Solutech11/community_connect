import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppAlertModal from '../../components/ui/app-alert-modal';
import { ApiError } from '../../services/api/client';
import { eventsApi } from '../../services/api/events.api';
import { colors, fonts } from '../../styles/theme';
import type { GetEventsIdResponse } from '../../types/api.generated';
import type { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'TicketSelection'>;
type TicketType = GetEventsIdResponse['data']['ticketTypes'][number];

function formatMoney(kobo: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(kobo / 100);
}

export default function TicketSelectionScreen({ navigation, route }: Props) {
  const [title, setTitle] = useState('Event');
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    eventsApi.get(route.params.eventId, controller.signal)
      .then((response) => {
        setTitle(response.data.event.title);
        const available = response.data.ticketTypes.filter((item) => item.active && item.sold + item.reserved < item.capacity);
        setTickets(available);
        setSelectedId(available[0]?._id ?? null);
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.code === 'REQUEST_CANCELLED') return;
        setErrorMessage(error instanceof ApiError ? error.message : 'Unable to load ticket types.');
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [route.params.eventId]);

  const selected = tickets.find((item) => item._id === selectedId) ?? null;
  const remaining = selected ? selected.capacity - selected.sold - selected.reserved : 0;
  const subtotalKobo = useMemo(() => (selected?.priceKobo ?? 0) * quantity, [quantity, selected]);

  return (
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFillObject} onPress={() => navigation.goBack()} />
      <SafeAreaView style={styles.safeArea} edges={[]}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}><Text style={styles.headerTitle}>Select Tickets</Text><Text style={styles.eventTitle} numberOfLines={1}>{title}</Text></View>
            <Pressable onPress={() => navigation.goBack()} style={styles.closeButton}><Ionicons name="close" size={24} color="#64748b" /></Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.ticketList}>
            {loading ? <Text style={styles.stateText}>Loading ticket types...</Text> : null}
            {!loading && tickets.length === 0 ? <Text style={styles.stateText}>No ticket types are currently available.</Text> : null}
            {tickets.map((ticket) => {
              const active = selectedId === ticket._id;
              const available = ticket.capacity - ticket.sold - ticket.reserved;
              return (
                <Pressable key={ticket._id} onPress={() => { setSelectedId(ticket._id); setQuantity(1); }} style={[styles.ticketCard, active && styles.ticketCardActive]}>
                  <View style={styles.ticketCopy}>
                    <Text style={styles.ticketTitle}>{ticket.title}</Text>
                    <Text style={styles.ticketDescription}>{ticket.description}</Text>
                    <Text style={styles.ticketNote}>{available} remaining</Text>
                  </View>
                  <Text style={styles.ticketPrice}>{formatMoney(ticket.priceKobo)}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {selected ? (
            <View style={styles.footer}>
              <View style={styles.stepper}>
                <Pressable onPress={() => setQuantity((value) => Math.max(1, value - 1))} style={styles.stepperButton}><Ionicons name="remove" size={22} color={colors.ink} /></Pressable>
                <Text style={styles.stepperValue}>{quantity}</Text>
                <Pressable onPress={() => setQuantity((value) => Math.min(remaining, value + 1))} style={styles.stepperButton}><Ionicons name="add" size={22} color={colors.ink} /></Pressable>
              </View>
              <View style={{ alignItems: 'flex-end' }}><Text style={styles.footerLabel}>Subtotal</Text><Text style={styles.footerPrice}>{formatMoney(subtotalKobo)}</Text></View>
            </View>
          ) : null}

          <Pressable
            disabled={!selected}
            onPress={() => selected && navigation.replace('Checkout', {
              eventId: route.params.eventId,
              quantity,
              subtotal: subtotalKobo,
              serviceFee: 0,
              total: subtotalKobo,
              tickets: [{ id: selected._id, title: selected.title, quantity, unitPrice: selected.priceKobo }],
            })}
            style={[styles.checkoutButton, !selected && styles.disabled]}
          >
            <Text style={styles.checkoutText}>Proceed to Checkout</Text><Ionicons name="arrow-forward" size={24} color={colors.ink} />
          </Pressable>
        </View>
      </SafeAreaView>
      <AppAlertModal visible={Boolean(errorMessage)} title="Tickets unavailable" message={errorMessage ?? ''} onClose={() => setErrorMessage(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { backgroundColor: 'rgba(5,10,8,0.62)', flex: 1, justifyContent: 'flex-end' }, safeArea: { flex: 1, justifyContent: 'flex-end' }, sheet: { backgroundColor: colors.white, borderTopLeftRadius: 34, borderTopRightRadius: 34, maxHeight: '80%', minHeight: 500, paddingBottom: 16, paddingTop: 10 }, handle: { alignSelf: 'center', backgroundColor: '#cfd5dc', borderRadius: 99, height: 7, width: 82 }, headerRow: { alignItems: 'center', flexDirection: 'row', padding: 22 }, headerTitle: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 24 }, eventTitle: { color: '#60708c', fontFamily: fonts.medium, fontSize: 13, marginTop: 4 }, closeButton: { alignItems: 'center', backgroundColor: '#f4f7fa', borderRadius: 20, height: 42, justifyContent: 'center', width: 42 }, ticketList: { gap: 14, paddingHorizontal: 22 }, ticketCard: { backgroundColor: '#f5f7f8', borderColor: '#eff3f5', borderRadius: 24, borderWidth: 1, flexDirection: 'row', padding: 18 }, ticketCardActive: { backgroundColor: '#f2fff7', borderColor: colors.lime, borderWidth: 2 }, ticketCopy: { flex: 1, paddingRight: 12 }, ticketTitle: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 18 }, ticketDescription: { color: '#60708c', fontFamily: fonts.medium, fontSize: 13, marginTop: 6 }, ticketNote: { color: '#08a951', fontFamily: fonts.bold, fontSize: 11, marginTop: 9 }, ticketPrice: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 18 }, stateText: { color: colors.muted, fontFamily: fonts.medium, paddingVertical: 30, textAlign: 'center' }, footer: { alignItems: 'center', borderTopColor: '#eef2f5', borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingHorizontal: 22, paddingTop: 14 }, stepper: { alignItems: 'center', flexDirection: 'row', gap: 12 }, stepperButton: { alignItems: 'center', backgroundColor: colors.lime, borderRadius: 20, height: 40, justifyContent: 'center', width: 40 }, stepperValue: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 18 }, footerLabel: { color: '#64748b', fontFamily: fonts.medium, fontSize: 12 }, footerPrice: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 20, marginTop: 3 }, checkoutButton: { alignItems: 'center', alignSelf: 'center', backgroundColor: colors.lime, borderRadius: 26, flexDirection: 'row', height: 66, justifyContent: 'center', marginTop: 16, width: '90%' }, disabled: { opacity: 0.45 }, checkoutText: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 17, marginRight: 10 },
});

