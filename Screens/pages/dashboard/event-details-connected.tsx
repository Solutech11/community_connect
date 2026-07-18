import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useState } from 'react';
import { ImageBackground, Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppAlertModal from '../../components/ui/app-alert-modal';
import AppReportSheet from '../../components/ui/app-report-sheet';
import AppShareSheet from '../../components/ui/app-share-sheet';
import { ApiError } from '../../services/api/client';
import { eventsApi } from '../../services/api/events.api';
import { colors, fonts } from '../../styles/theme';
import type { GetEventsIdResponse } from '../../types/api.generated';
import type { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'EventDetails'>;
type EventDetails = GetEventsIdResponse['data'];
const fallbackImage = 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=1400&q=88';

function formatMoney(kobo: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(kobo / 100);
}

function DetailPill({ icon, label, value, wide = false }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; wide?: boolean }) {
  return (
    <View style={[styles.detailCard, wide && styles.detailCardWide]}>
      <View style={styles.detailIconWrap}><Ionicons name={icon} size={20} color={colors.lime} /></View>
      <View style={[styles.detailTextWrap, wide && styles.detailTextWrapWide]}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function EventDetailsScreen({ navigation, route }: Props) {
  const [details, setDetails] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareVisible, setShareVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [alert, setAlert] = useState<{ title: string; message: string } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    eventsApi.get(route.params.eventId, controller.signal)
      .then((response) => setDetails(response.data))
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.code === 'REQUEST_CANCELLED') return;
        setAlert({ title: 'Event unavailable', message: error instanceof ApiError ? error.message : 'Unable to load this event.' });
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [route.params.eventId]);

  const startingPrice = useMemo(() => {
    const prices = details?.ticketTypes.filter((item) => item.active).map((item) => item.priceKobo) ?? [];
    return prices.length ? formatMoney(Math.min(...prices)) : 'Free';
  }, [details]);

  if (loading) {
    return <SafeAreaView style={styles.fallbackSafeArea}><View style={styles.fallbackBody}><Text style={styles.fallbackTitle}>Loading event...</Text></View></SafeAreaView>;
  }
  if (!details) {
    return (
      <SafeAreaView style={styles.fallbackSafeArea}>
        <View style={styles.fallbackBody}>
          <Text style={styles.fallbackTitle}>Event not found</Text>
          <Pressable onPress={() => navigation.goBack()} style={styles.fallbackButton}><Text style={styles.fallbackButtonText}>Go Back</Text></Pressable>
        </View>
        <AppAlertModal visible={Boolean(alert)} title={alert?.title ?? ''} message={alert?.message ?? ''} onClose={() => setAlert(null)} />
      </SafeAreaView>
    );
  }

  const { event } = details;
  const startsAt = new Date(event.startsAt);
  const endsAt = new Date(event.endsAt);
  const eventLink = `https://communityconnect.app/events/${event.slug}`;
  const shareMessage = `Check out ${event.title} on Community Connect: ${eventLink}`;

  const shareTo = async (channel: 'whatsapp' | 'instagram' | 'facebook' | 'twitter') => {
    const encodedMessage = encodeURIComponent(shareMessage);
    const encodedLink = encodeURIComponent(eventLink);
    const url = channel === 'whatsapp'
      ? `whatsapp://send?text=${encodedMessage}`
      : channel === 'facebook'
        ? `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}`
        : channel === 'twitter'
          ? `https://twitter.com/intent/tweet?text=${encodedMessage}`
          : '';
    try {
      if (url && await Linking.canOpenURL(url)) await Linking.openURL(url);
      else await Share.share({ message: shareMessage });
    } catch {
      setAlert({ title: 'Unable to share', message: 'Please try again in a moment.' });
    }
  };

  return (
    <>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <ImageBackground source={{ uri: fallbackImage }} style={styles.heroImage}>
            <View style={styles.heroButtons}>
              <Pressable onPress={() => navigation.goBack()} style={styles.topIconButton}><Ionicons name="arrow-back" size={27} color={colors.ink} /></Pressable>
              <View style={styles.topActions}>
                <Pressable onPress={() => setShareVisible(true)} style={styles.topIconButton}><Ionicons name="share-social-outline" size={23} color={colors.ink} /></Pressable>
                <Pressable onPress={() => setReportVisible(true)} style={styles.topIconButton}><Ionicons name="flag" size={20} color={colors.ink} /></Pressable>
              </View>
            </View>
            <LinearGradient colors={['rgba(247,251,249,0)', '#f7fbf9']} style={styles.heroFade} />
          </ImageBackground>

          <View style={styles.body}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{event.title}</Text>
              <Text style={styles.price}>{startingPrice}</Text>
            </View>
            <View style={styles.locationRow}><Ionicons name="location" size={18} color="#4ca36d" /><Text style={styles.locationText}>{event.venueName}, {event.address}</Text></View>
            <Text style={styles.sectionTitle}>About Event</Text>
            <Text style={styles.aboutText}>{event.description}</Text>

            <View style={styles.scheduleCard}>
              <Text style={styles.scheduleLabel}>SCHEDULE</Text>
              <Text style={styles.scheduleValue}>{startsAt.toLocaleDateString()} - {event.timezone}</Text>
              <View style={styles.timeRow}>
                <View><Text style={styles.timeLabel}>Start Time</Text><Text style={styles.timeValue}>{startsAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text></View>
                <View><Text style={styles.timeLabel}>End Time</Text><Text style={styles.timeValue}>{endsAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text></View>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Event Details</Text>
            <View style={styles.detailsGrid}>
              <DetailPill icon="location" label="LOCATION" value={`${event.venueName}\n${event.address}`} wide />
              <DetailPill icon="shuffle-outline" label="ACTIVITY TYPE" value={event.activityType} />
              <DetailPill icon="people" label="MAX PEOPLE" value={String(event.maxCapacity)} />
              <DetailPill icon="business-outline" label="LGA" value={event.lga} />
              <DetailPill icon="map-outline" label="STATE" value={event.state} />
            </View>
          </View>
        </ScrollView>
        <View style={styles.bottomBar}>
          <Pressable disabled={!details.ticketTypes.some((item) => item.active)} onPress={() => navigation.navigate('TicketSelection', { eventId: event._id })} style={styles.ctaButton}>
            <Text style={styles.ctaText}>{details.ticketTypes.length ? 'Select Ticket' : 'Tickets unavailable'}</Text>
            <Ionicons name="arrow-forward" size={21} color={colors.ink} />
          </Pressable>
        </View>
      </SafeAreaView>
      <AppShareSheet visible={shareVisible} description={`Share "${event.title}"`} onClose={() => setShareVisible(false)} onCopyLink={() => setAlert({ title: 'Event link', message: eventLink })} onInvite={() => setAlert({ title: 'Invite friends', message: 'Choose a friend from the Friends screen.' })} onShareTo={shareTo} />
      <AppReportSheet visible={reportVisible} onClose={() => setReportVisible(false)} onSubmit={() => setAlert({ title: 'Report unavailable', message: 'The current backend contract does not expose an event-report endpoint.' })} />
      <AppAlertModal visible={Boolean(alert)} title={alert?.title ?? ''} message={alert?.message ?? ''} onClose={() => setAlert(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper }, content: { paddingBottom: 150 },
  heroImage: { height: 402, justifyContent: 'space-between' }, heroButtons: { flexDirection: 'row', justifyContent: 'space-between', padding: 28, zIndex: 2 }, topActions: { flexDirection: 'row', gap: 14 }, topIconButton: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: 24, height: 50, justifyContent: 'center', width: 50 }, heroFade: { bottom: 0, height: 190, left: 0, position: 'absolute', right: 0 },
  body: { paddingHorizontal: 30 }, titleRow: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between' }, title: { color: colors.ink, flex: 1, fontFamily: fonts.extraBold, fontSize: 30, paddingRight: 14 }, price: { color: '#08b657', fontFamily: fonts.extraBold, fontSize: 19 }, locationRow: { alignItems: 'center', flexDirection: 'row', gap: 7, marginTop: 14 }, locationText: { color: '#419a66', flex: 1, fontFamily: fonts.medium, fontSize: 15 }, sectionTitle: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 18, marginTop: 24 }, aboutText: { color: '#465666', fontFamily: fonts.medium, fontSize: 16, lineHeight: 28, marginTop: 14 },
  scheduleCard: { backgroundColor: '#13291d', borderRadius: 30, marginTop: 28, padding: 24 }, scheduleLabel: { color: colors.lime, fontFamily: fonts.bold, fontSize: 13 }, scheduleValue: { color: colors.white, fontFamily: fonts.extraBold, fontSize: 17, marginTop: 6 }, timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }, timeLabel: { color: 'rgba(255,255,255,0.72)', fontFamily: fonts.medium, fontSize: 13 }, timeValue: { color: colors.white, fontFamily: fonts.extraBold, fontSize: 18, marginTop: 6 },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 18 }, detailCard: { backgroundColor: colors.white, borderRadius: 28, minHeight: 98, padding: 18, width: '47.9%' }, detailCardWide: { alignItems: 'center', flexDirection: 'row', width: '100%' }, detailIconWrap: { alignItems: 'center', backgroundColor: '#ebfff1', borderRadius: 24, height: 48, justifyContent: 'center', width: 48 }, detailTextWrap: { marginTop: 14 }, detailTextWrapWide: { flex: 1, marginLeft: 14, marginTop: 0 }, detailLabel: { color: '#2aa25f', fontFamily: fonts.medium, fontSize: 12 }, detailValue: { color: colors.ink, fontFamily: fonts.bold, fontSize: 15, lineHeight: 22, marginTop: 6 },
  bottomBar: { backgroundColor: colors.white, bottom: 0, left: 0, padding: 20, position: 'absolute', right: 0 }, ctaButton: { alignItems: 'center', backgroundColor: colors.lime, borderRadius: 32, flexDirection: 'row', height: 70, justifyContent: 'space-between', paddingHorizontal: 24 }, ctaText: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 18 }, fallbackSafeArea: { backgroundColor: colors.paper, flex: 1 }, fallbackBody: { alignItems: 'center', flex: 1, justifyContent: 'center' }, fallbackTitle: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 22 }, fallbackButton: { backgroundColor: colors.lime, borderRadius: 20, marginTop: 18, padding: 16 }, fallbackButtonText: { color: colors.ink, fontFamily: fonts.bold },
});

