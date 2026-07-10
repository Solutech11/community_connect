import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { ImageBackground, Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppAlertModal from '../../components/ui/app-alert-modal';
import AppReportSheet from '../../components/ui/app-report-sheet';
import AppShareSheet from '../../components/ui/app-share-sheet';
import { getEventById } from '../../data/events';
import { lightTap as tapFeedback } from '../../hooks/haptics';
import { colors, fonts } from '../../styles/theme';
import type { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'EventDetails'>;

type AlertState = {
  title: string;
  message: string;
};

function DetailPill({ icon, label, value, wide = false }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; wide?: boolean }) {
  return (
    <View style={[styles.detailCard, wide && styles.detailCardWide]}>
      <View style={styles.detailIconWrap}>
        <Ionicons name={icon} size={wide ? 20 : 16} color={colors.lime} />
      </View>
      <View style={[styles.detailTextWrap, wide && styles.detailTextWrapWide]}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function EventDetailsScreen({ navigation, route }: Props) {
  const event = getEventById(route.params.eventId);
  const [shareVisible, setShareVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [alertState, setAlertState] = useState<AlertState | null>(null);

  if (!event) {
    return (
      <SafeAreaView style={styles.fallbackSafeArea}>
        <View style={styles.fallbackBody}>
          <Text style={styles.fallbackTitle}>Event not found</Text>
          <Pressable onPress={() => navigation.goBack()} style={styles.fallbackButton}>
            <Text style={styles.fallbackButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const eventLink = `https://communityconnect.app/events/${event.id}`;
  const shareMessage = `Check out ${event.title} on Community Connect: ${eventLink}`;

  const showAlert = (title: string, message: string) => {
    setAlertState({ title, message });
  };

  const handleShareTo = async (channel: 'whatsapp' | 'instagram' | 'facebook' | 'twitter') => {
    tapFeedback();

    const encodedMessage = encodeURIComponent(shareMessage);
    const encodedLink = encodeURIComponent(eventLink);

    const urlMap = {
      whatsapp: `whatsapp://send?text=${encodedMessage}`,
      instagram: '',
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedMessage}`,
    } as const;

    try {
      if (channel === 'instagram') {
        await Share.share({ message: shareMessage });
        return;
      }

      const url = urlMap[channel];
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
        return;
      }

      await Share.share({ message: shareMessage });
    } catch {
      showAlert('Unable to share', 'Please try again in a moment.');
    }
  };

  return (
    <>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.heroWrap}>
            <ImageBackground source={{ uri: event.image }} style={styles.heroImage}>
              <View style={styles.heroButtons}>
                <Pressable onPress={() => navigation.goBack()} style={styles.topIconButton}>
                  <Ionicons name="arrow-back" size={27} color={colors.ink} />
                </Pressable>

                <View style={styles.topActions}>
                  <Pressable onPress={() => setShareVisible(true)} style={styles.topIconButton}>
                    <Ionicons name="share-social-outline" size={23} color={colors.ink} />
                  </Pressable>
                  <Pressable onPress={() => setReportVisible(true)} style={styles.topIconButton}>
                    <Ionicons name="flag" size={20} color={colors.ink} />
                  </Pressable>
                </View>
              </View>

              <LinearGradient
                colors={['rgba(247,251,249,0)', 'rgba(247,251,249,0.32)', 'rgba(247,251,249,0.88)', '#f7fbf9']}
                locations={[0, 0.56, 0.82, 1]}
                style={styles.heroFade}
              />
            </ImageBackground>
          </View>

          <View style={styles.body}>
            <View style={styles.heroInfo}>
              <View style={styles.titleRow}>
                <Text style={styles.title}>{event.title}</Text>
                <Text style={styles.price}>{event.price ?? '$0.00'}</Text>
              </View>

              <View style={styles.locationRow}>
                <Ionicons name="location" size={18} color="#4ca36d" />
                <Text style={styles.locationText}>{event.location}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>About Event</Text>
            <Text style={styles.aboutText}>{event.about}</Text>

            <View style={styles.scheduleCard}>
              <View style={styles.scheduleHead}>
                <View style={styles.scheduleIcon}>
                  <Ionicons name="calendar-outline" size={22} color={colors.ink} />
                </View>

                <View style={styles.scheduleCopy}>
                  <Text style={styles.scheduleLabel}>SCHEDULE</Text>
                  <Text style={styles.scheduleValue}>{event.schedule}</Text>
                </View>
              </View>

              <View style={styles.scheduleDivider} />

              <View style={styles.timeRow}>
                <View style={styles.timeBlock}>
                  <Text style={styles.timeLabel}>Start Time</Text>
                  <Text style={styles.timeValue}>{event.startTime}</Text>
                </View>

                <View style={styles.timeDivider} />

                <View style={[styles.timeBlock, styles.timeBlockRight]}>
                  <Text style={styles.timeLabel}>End Time</Text>
                  <Text style={styles.timeValue}>{event.endTime}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Event Details</Text>

            <View style={styles.detailsGrid}>
              <DetailPill icon="location" label="LOCATION" value={`${event.venueTitle}\n${event.venueSubtitle}`} wide />
              <DetailPill icon="shuffle-outline" label="ACTIVITY TYPE" value={event.activityType ?? '-'} />
              <DetailPill icon="people-outline" label="EVENT FOR" value={event.eventFor ?? '-'} />
              <DetailPill icon="body-outline" label="POSITION" value={event.position ?? '-'} />
              <DetailPill icon="people" label="MAX PEOPLE" value={event.maxPeople ?? '-'} />
              <DetailPill icon="business-outline" label="LGA" value={event.lga ?? '-'} />
              <DetailPill icon="map-outline" label="STATE" value={event.state ?? '-'} />
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <Pressable onPress={() => navigation.navigate('TicketSelection', { eventId: event.id })} style={styles.ctaButton}>
            <Text style={styles.ctaText}>Select Ticket</Text>
            <View style={styles.ctaIconWrap}>
              <Ionicons name="arrow-forward" size={21} color={colors.ink} />
            </View>
          </Pressable>
        </View>
      </SafeAreaView>

      <AppShareSheet
        visible={shareVisible}
        description={`Let your friends know about "${event.title}"`}
        onClose={() => setShareVisible(false)}
        onCopyLink={() => showAlert('Copy Link', eventLink)}
        onInvite={() => showAlert('Invite Friends', 'In-app invites can be connected here next.')}
        onShareTo={handleShareTo}
      />

      <AppReportSheet
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        onSubmit={(reason, details) => {
          showAlert('Report Submitted', details ? `${reason}\n\n${details}` : reason);
        }}
      />

      <AppAlertModal
        visible={Boolean(alertState)}
        title={alertState?.title ?? ''}
        message={alertState?.message ?? ''}
        onClose={() => setAlertState(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  content: { paddingBottom: 156 },
  heroWrap: { backgroundColor: colors.paper },
  heroImage: { height: 402, justifyContent: 'space-between' },
  heroButtons: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 30, paddingTop: 26, zIndex: 3 },
  topActions: { flexDirection: 'row', gap: 14 },
  topIconButton: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: 24, height: 50, justifyContent: 'center', width: 50 },
  heroFade: { bottom: 0, height: 190, left: 0, position: 'absolute', right: 0 },
  body: { paddingHorizontal: 30, paddingTop: 0 },
  heroInfo: { marginTop: -18, paddingBottom: 6 },
  titleRow: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between' },
  title: { color: colors.ink, flex: 1, fontFamily: fonts.extraBold, fontSize: 32, letterSpacing: -0.8, lineHeight: 36, paddingRight: 16 },
  price: { color: colors.lime, fontFamily: fonts.extraBold, fontSize: 25, letterSpacing: -0.4 },
  locationRow: { alignItems: 'center', flexDirection: 'row', gap: 7, marginTop: 14 },
  locationText: { color: '#419a66', fontFamily: fonts.medium, fontSize: 15 },
  sectionTitle: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 18, letterSpacing: -0.2, marginTop: 18 },
  aboutText: { color: '#465666', fontFamily: fonts.medium, fontSize: 16, lineHeight: 30, marginTop: 18 },
  scheduleCard: { backgroundColor: '#13291d', borderRadius: 33, marginTop: 28, paddingHorizontal: 24, paddingVertical: 22, shadowColor: '#0c2117', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 18 },
  scheduleHead: { alignItems: 'center', flexDirection: 'row' },
  scheduleIcon: { alignItems: 'center', backgroundColor: colors.lime, borderRadius: 26, height: 52, justifyContent: 'center', width: 52 },
  scheduleCopy: { flex: 1, marginLeft: 14 },
  scheduleLabel: { color: colors.lime, fontFamily: fonts.bold, fontSize: 13 },
  scheduleValue: { color: colors.white, fontFamily: fonts.extraBold, fontSize: 17, lineHeight: 24, marginTop: 4 },
  scheduleDivider: { backgroundColor: 'rgba(255,255,255,0.12)', height: 1, marginTop: 18 },
  timeRow: { flexDirection: 'row', marginTop: 18 },
  timeBlock: { flex: 1 },
  timeBlockRight: { alignItems: 'flex-end' },
  timeLabel: { color: 'rgba(255,255,255,0.72)', fontFamily: fonts.medium, fontSize: 13 },
  timeValue: { color: colors.white, fontFamily: fonts.extraBold, fontSize: 19, marginTop: 6 },
  timeDivider: { backgroundColor: 'rgba(255,255,255,0.12)', height: 44, marginHorizontal: 24, width: 1 },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 18 },
  detailCard: { backgroundColor: colors.white, borderRadius: 28, minHeight: 98, paddingHorizontal: 18, paddingVertical: 18, width: '47.9%' },
  detailCardWide: { alignItems: 'center', flexDirection: 'row', minHeight: 110, width: '100%' },
  detailIconWrap: { alignItems: 'center', backgroundColor: '#ebfff1', borderRadius: 24, height: 48, justifyContent: 'center', width: 48 },
  detailTextWrap: { marginTop: 14 },
  detailTextWrapWide: { flex: 1, marginLeft: 14, marginTop: 0 },
  detailLabel: { color: '#2aa25f', fontFamily: fonts.medium, fontSize: 12 },
  detailValue: { color: colors.ink, fontFamily: fonts.bold, fontSize: 15, lineHeight: 23, marginTop: 6 },
  bottomBar: { backgroundColor: 'rgba(255,255,255,0.98)', bottom: 0, left: 0, paddingBottom: 24, paddingHorizontal: 30, paddingTop: 14, position: 'absolute', right: 0 },
  ctaButton: { alignItems: 'center', backgroundColor: colors.lime, borderRadius: 34, flexDirection: 'row', height: 82, justifyContent: 'space-between', paddingLeft: 22, paddingRight: 16 },
  ctaText: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 18 },
  ctaIconWrap: { alignItems: 'center', backgroundColor: '#12db62', borderRadius: 24, height: 46, justifyContent: 'center', width: 46 },
  fallbackSafeArea: { backgroundColor: colors.paper, flex: 1 },
  fallbackBody: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  fallbackTitle: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 24 },
  fallbackButton: { backgroundColor: colors.lime, borderRadius: 18, marginTop: 18, paddingHorizontal: 20, paddingVertical: 14 },
  fallbackButtonText: { color: colors.ink, fontFamily: fonts.bold, fontSize: 15 },
});