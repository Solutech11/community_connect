import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getEventById } from '../../data/events';
import { lightTap as tapFeedback } from '../../hooks/haptics';
import { colors, fonts } from '../../styles/theme';
import type { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'EventDetails'>;

function DetailPill({
  icon,
  label,
  value,
  wide = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <View style={[styles.detailCard, wide && styles.detailCardWide]}>
      <View style={styles.detailIconWrap}>
        <Ionicons name={icon} size={18} color={colors.lime} />
      </View>
      <View style={styles.detailTextWrap}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function EventDetailsScreen({ navigation, route }: Props) {
  const event = getEventById(route.params.eventId);

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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <ImageBackground source={{ uri: event.image }} style={styles.heroImage}>
            <View style={styles.heroButtons}>
              <Pressable onPress={() => navigation.goBack()} style={styles.topIconButton}>
                <Ionicons name="arrow-back" size={28} color={colors.ink} />
              </Pressable>

              <View style={styles.topActions}>
                <Pressable onPress={tapFeedback} style={styles.topIconButton}>
                  <Ionicons name="share-social-outline" size={24} color={colors.ink} />
                </Pressable>
                <Pressable onPress={tapFeedback} style={styles.topIconButton}>
                  <Ionicons name="flag-outline" size={22} color={colors.ink} />
                </Pressable>
              </View>
            </View>
          </ImageBackground>
        </View>

        <View style={styles.sheet}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{event.title}</Text>
            <Text style={styles.price}>{event.price ?? '$0.00'}</Text>
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location" size={18} color="#4aa26f" />
            <Text style={styles.locationText}>{event.location}</Text>
          </View>

          <Text style={styles.sectionTitle}>About Event</Text>
          <Text style={styles.aboutText}>{event.about}</Text>

          <View style={styles.scheduleCard}>
            <View style={styles.scheduleHead}>
              <View style={styles.scheduleIcon}>
                <Ionicons name="calendar-outline" size={22} color={colors.ink} />
              </View>
              <View>
                <Text style={styles.scheduleLabel}>SCHEDULE</Text>
                <Text style={styles.scheduleValue}>{event.schedule}</Text>
              </View>
            </View>

            <View style={styles.scheduleDivider} />

            <View style={styles.timeRow}>
              <View>
                <Text style={styles.timeLabel}>Start Time</Text>
                <Text style={styles.timeValue}>{event.startTime}</Text>
              </View>
              <View style={styles.timeDivider} />
              <View style={styles.timeRight}>
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
        <Pressable onPress={tapFeedback} style={styles.ctaButton}>
          <Text style={styles.ctaText}>Select Ticket</Text>
          <View style={styles.ctaIconWrap}>
            <Ionicons name="arrow-forward" size={22} color={colors.ink} />
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  content: {
    paddingBottom: 150,
  },
  hero: {
    backgroundColor: colors.paper,
  },
  heroImage: {
    height: 360,
    justifyContent: 'space-between',
  },
  heroButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  topActions: {
    flexDirection: 'row',
    gap: 14,
  },
  topIconButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  sheet: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -26,
    paddingHorizontal: 24,
    paddingTop: 22,
  },
  titleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.extraBold,
    fontSize: 30,
    paddingRight: 16,
  },
  price: {
    color: colors.lime,
    fontFamily: fonts.extraBold,
    fontSize: 24,
    marginTop: 5,
  },
  locationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  locationText: {
    color: '#4aa26f',
    fontFamily: fonts.medium,
    fontSize: 15,
  },
  sectionTitle: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 18,
    marginTop: 28,
  },
  aboutText: {
    color: '#40505f',
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 29,
    marginTop: 16,
  },
  scheduleCard: {
    backgroundColor: '#13261c',
    borderRadius: 32,
    marginTop: 26,
    paddingHorizontal: 18,
    paddingVertical: 18,
    shadowColor: '#0d2218',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
  },
  scheduleHead: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  scheduleIcon: {
    alignItems: 'center',
    backgroundColor: colors.lime,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  scheduleLabel: {
    color: colors.lime,
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  scheduleValue: {
    color: colors.white,
    fontFamily: fonts.extraBold,
    fontSize: 16,
    marginTop: 5,
  },
  scheduleDivider: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    height: 1,
    marginVertical: 18,
  },
  timeRow: {
    flexDirection: 'row',
  },
  timeLabel: {
    color: 'rgba(255,255,255,0.78)',
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  timeValue: {
    color: colors.white,
    fontFamily: fonts.extraBold,
    fontSize: 18,
    marginTop: 6,
  },
  timeDivider: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    height: 44,
    marginHorizontal: 22,
    width: 1,
  },
  timeRight: {
    flex: 1,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 18,
  },
  detailCard: {
    backgroundColor: colors.white,
    borderRadius: 28,
    minHeight: 108,
    paddingHorizontal: 18,
    paddingVertical: 18,
    width: '47.8%',
  },
  detailCardWide: {
    flexDirection: 'row',
    width: '100%',
  },
  detailIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.paleGreen,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  detailTextWrap: {
    flex: 1,
    marginTop: 14,
  },
  detailLabel: {
    color: '#2f9d5f',
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  detailValue: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 24,
    marginTop: 6,
  },
  bottomBar: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    bottom: 0,
    left: 0,
    paddingBottom: 26,
    paddingHorizontal: 24,
    paddingTop: 16,
    position: 'absolute',
    right: 0,
  },
  ctaButton: {
    alignItems: 'center',
    backgroundColor: colors.lime,
    borderRadius: 32,
    flexDirection: 'row',
    height: 82,
    justifyContent: 'space-between',
    paddingLeft: 22,
    paddingRight: 18,
  },
  ctaText: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 18,
  },
  ctaIconWrap: {
    alignItems: 'center',
    backgroundColor: '#12d761',
    borderRadius: 24,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  fallbackSafeArea: {
    backgroundColor: colors.paper,
    flex: 1,
  },
  fallbackBody: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  fallbackTitle: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 24,
  },
  fallbackButton: {
    backgroundColor: colors.lime,
    borderRadius: 18,
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  fallbackButtonText: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 15,
  },
});
