import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, ImageBackground, Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppAlertModal from '../../components/ui/app-alert-modal';
import AppReportSheet from '../../components/ui/app-report-sheet';
import AppShareSheet from '../../components/ui/app-share-sheet';
import { getEventById } from '../../data/events';
import { colors, fonts } from '../../styles/theme';
import type { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'MyEventDetails'>;
type AlertState = { title: string; message: string } | null;

function DetailCard({ icon, label, value, wide = false }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; wide?: boolean }) {
  return (
    <View style={[styles.detailCard, wide && styles.detailCardWide]}>
      <View style={styles.detailIcon}><Ionicons name={icon} size={wide ? 20 : 16} color={colors.lime} /></View>
      <View style={[styles.detailCopy, wide && styles.detailCopyWide]}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function MyEventDetailsScreen({ navigation, route }: Props) {
  const event = getEventById(route.params.eventId);
  const [shareVisible, setShareVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [alert, setAlert] = useState<AlertState>(null);

  if (!event) {
    return <SafeAreaView style={styles.safeArea}><View style={styles.fallback}><Text style={styles.fallbackTitle}>Ticket not found</Text></View></SafeAreaView>;
  }

  const ticketCode = `${event.id.toUpperCase()}-9482-ADF`;
  const ticketLink = `https://communityconnect.app/tickets/${ticketCode}`;
  const qrSource = { uri: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=0&data=${encodeURIComponent(ticketLink)}` };
  const shareTicket = async () => {
    try { await Share.share({ message: `My ticket for ${event.title}: ${ticketLink}` }); }
    catch { setAlert({ title: 'Unable to share', message: 'Please try again in a moment.' }); }
  };

  return (
    <>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <ImageBackground source={{ uri: event.image }} style={styles.hero}>
            <View style={styles.heroShade} />
            <View style={styles.heroActions}>
              <Pressable onPress={() => navigation.goBack()} style={styles.heroButton}><Ionicons name="arrow-back" size={24} color={colors.ink} /></Pressable>
              <View style={styles.actionGroup}>
                <Pressable onPress={() => setShareVisible(true)} style={styles.heroButton}><Ionicons name="share-social-outline" size={22} color={colors.ink} /></Pressable>
                <Pressable onPress={() => setReportVisible(true)} style={styles.heroButton}><Ionicons name="flag-outline" size={21} color={colors.ink} /></Pressable>
              </View>
            </View>
          </ImageBackground>

          <View style={styles.ticketCard}>
            <View style={styles.statusPill}><View style={styles.statusDot} /><Text style={styles.statusText}>READY FOR CHECK-IN</Text></View>
            <Text style={styles.title}>{event.title}</Text>
            <Text style={styles.ticketNumber}>Ticket #{ticketCode}</Text>
            <View style={styles.qrFrame}><Image source={qrSource} style={styles.qrImage} /></View>
            <Text style={styles.qrHint}>Scan this QR code at the entrance</Text>
            <View style={styles.dashedDivider} />
            <View style={styles.dateTimeRow}>
              <View><Text style={styles.dateTimeLabel}>DATE</Text><Text style={styles.dateTimeValue}>{event.dateMonth} {event.dateDay}, 2024</Text></View>
              <View style={styles.dateTimeRight}><Text style={styles.dateTimeLabel}>TIME</Text><Text style={styles.dateTimeValue}>{event.startTime ?? event.time}</Text></View>
            </View>
          </View>

          <View style={styles.body}>
            <Text style={styles.sectionTitle}>About Event</Text>
            <Text style={styles.about}>{event.about ?? 'Event details will be available shortly.'}</Text>
            <Text style={styles.sectionTitle}>Event Details</Text>
            <View style={styles.detailsGrid}>
              <DetailCard wide icon="location-outline" label="LOCATION" value={`${event.venueTitle ?? event.location}\n${event.venueSubtitle ?? ''}`} />
              <DetailCard icon="fitness-outline" label="ACTIVITY TYPE" value={event.activityType ?? '-'} />
              <DetailCard icon="people-outline" label="EVENT FOR" value={event.eventFor ?? '-'} />
              <DetailCard icon="leaf-outline" label="POSITION" value={event.position ?? '-'} />
              <DetailCard icon="people" label="MAX PEOPLE" value={event.maxPeople ?? '-'} />
              <DetailCard icon="business-outline" label="LGA" value={event.lga ?? '-'} />
              <DetailCard icon="map-outline" label="STATE" value={event.state ?? '-'} />
            </View>
            <View style={styles.scheduleCard}>
              <View style={styles.scheduleHeader}><View style={styles.scheduleIcon}><Ionicons name="calendar-outline" size={21} color={colors.ink} /></View><View style={styles.scheduleCopy}><Text style={styles.scheduleLabel}>SCHEDULE</Text><Text style={styles.scheduleValue}>{event.schedule ?? event.time}</Text></View></View>
              <View style={styles.scheduleDivider} />
              <View style={styles.scheduleTimes}><View><Text style={styles.scheduleTimeLabel}>Start Time</Text><Text style={styles.scheduleTimeValue}>{event.startTime ?? '-'}</Text></View><View style={styles.dateTimeRight}><Text style={styles.scheduleTimeLabel}>End Time</Text><Text style={styles.scheduleTimeValue}>{event.endTime ?? '-'}</Text></View></View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
      <AppShareSheet visible={shareVisible} description={`Share your ticket for ${event.title}`} onClose={() => setShareVisible(false)} onCopyLink={() => setAlert({ title: 'Copy Link', message: ticketLink })} onInvite={shareTicket} onShareTo={shareTicket} />
      <AppReportSheet visible={reportVisible} onClose={() => setReportVisible(false)} onSubmit={(reason, details) => setAlert({ title: 'Report Submitted', message: details ? `${reason}\n\n${details}` : reason })} />
      <AppAlertModal visible={Boolean(alert)} title={alert?.title ?? ''} message={alert?.message ?? ''} onClose={() => setAlert(null)} />
    </>
  );
}

const android = Platform.OS === 'android';
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper }, content: { paddingBottom: 32 }, hero: { height: android ? 250 : 300 }, heroShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(6,27,15,0.18)' }, heroActions: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16 }, actionGroup: { flexDirection: 'row', gap: 12 }, heroButton: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 23, elevation: android ? 3 : 0, height: 46, justifyContent: 'center', width: 46 },
  ticketCard: { backgroundColor: colors.white, borderRadius: 32, elevation: android ? 3 : 0, marginHorizontal: 22, marginTop: -24, overflow: 'hidden', paddingHorizontal: 24, paddingTop: 24 }, statusPill: { alignItems: 'center', alignSelf: 'center', backgroundColor: '#e7fff0', borderRadius: 16, flexDirection: 'row', gap: 7, paddingHorizontal: 14, paddingVertical: 7 }, statusDot: { backgroundColor: colors.lime, borderRadius: 4, height: 8, width: 8 }, statusText: { color: '#08a850', fontFamily: fonts.bold, fontSize: 11, letterSpacing: 0.7 }, title: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: android ? 25 : 30, marginTop: 18, textAlign: 'center' }, ticketNumber: { color: '#269b5b', fontFamily: fonts.medium, fontSize: 14, marginTop: 5, textAlign: 'center' }, qrFrame: { alignItems: 'center', alignSelf: 'center', backgroundColor: '#fbfdfc', borderColor: '#eef3f0', borderRadius: 28, borderWidth: 1, elevation: android ? 2 : 0, height: android ? 166 : 184, justifyContent: 'center', marginTop: 24, width: android ? 166 : 184 }, qrImage: { height: android ? 112 : 126, width: android ? 112 : 126 }, qrHint: { color: '#90a2bc', fontFamily: fonts.medium, fontSize: 12, marginTop: 18, textAlign: 'center' }, dashedDivider: { borderTopColor: '#e2ebea', borderTopWidth: 1, borderStyle: 'dashed', marginHorizontal: -24, marginTop: 30 }, dateTimeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 18, paddingTop: 18 }, dateTimeLabel: { color: '#17a354', fontFamily: fonts.bold, fontSize: 10 }, dateTimeValue: { color: colors.ink, fontFamily: fonts.bold, fontSize: 14, marginTop: 4 }, dateTimeRight: { alignItems: 'flex-end' },
  body: { paddingHorizontal: 24 }, sectionTitle: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 18, marginTop: 28 }, about: { color: '#465666', fontFamily: fonts.medium, fontSize: 14, lineHeight: 23, marginTop: 13 }, detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 16 }, detailCard: { backgroundColor: colors.white, borderRadius: 24, elevation: android ? 2 : 0, minHeight: 84, padding: 15, width: '47.8%' }, detailCardWide: { alignItems: 'center', flexDirection: 'row', minHeight: 80, width: '100%' }, detailIcon: { alignItems: 'center', backgroundColor: '#eafff1', borderRadius: 20, height: 40, justifyContent: 'center', width: 40 }, detailCopy: { marginTop: 10 }, detailCopyWide: { flex: 1, marginLeft: 12, marginTop: 0 }, detailLabel: { color: '#159b51', fontFamily: fonts.bold, fontSize: 10 }, detailValue: { color: colors.ink, fontFamily: fonts.medium, fontSize: 13, lineHeight: 19, marginTop: 5 },
  scheduleCard: { backgroundColor: '#132d20', borderRadius: 30, elevation: android ? 4 : 0, marginTop: 28, padding: 20 }, scheduleHeader: { alignItems: 'center', flexDirection: 'row' }, scheduleIcon: { alignItems: 'center', backgroundColor: colors.lime, borderRadius: 21, height: 42, justifyContent: 'center', width: 42 }, scheduleCopy: { flex: 1, marginLeft: 12 }, scheduleLabel: { color: colors.lime, fontFamily: fonts.bold, fontSize: 11 }, scheduleValue: { color: colors.white, fontFamily: fonts.extraBold, fontSize: 16, marginTop: 4 }, scheduleDivider: { backgroundColor: 'rgba(255,255,255,0.15)', height: 1, marginTop: 17 }, scheduleTimes: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 }, scheduleTimeLabel: { color: 'rgba(255,255,255,0.72)', fontFamily: fonts.medium, fontSize: 11 }, scheduleTimeValue: { color: colors.white, fontFamily: fonts.extraBold, fontSize: 17, marginTop: 4 },
  fallback: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 }, fallbackTitle: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 22 },
});
