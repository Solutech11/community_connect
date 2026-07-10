import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  LayoutChangeEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import TicketQrModal from '../../components/ui/ticket-qr-modal';
import { events, type EventItem } from '../../data/events';
import { lightTap as tapFeedback } from '../../hooks/haptics';
import { colors, fonts } from '../../styles/theme';
import type { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'MyEvents'>;
type EventTab = 'Upcoming' | 'Past';

function EventTabButton({
  label,
  selected,
  onPress,
  onLayout,
}: {
  label: EventTab;
  selected: boolean;
  onPress: () => void;
  onLayout: (event: LayoutChangeEvent) => void;
}) {
  return (
    <Pressable onLayout={onLayout} onPress={onPress} style={styles.segmentButton}>
      <Text style={[styles.segmentText, selected && styles.segmentTextActive]}>{label}</Text>
    </Pressable>
  );
}

function EventCard({ item, onShowQr, onViewTicket }: { item: EventItem; onShowQr: () => void; onViewTicket: () => void }) {
  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        <ImageBackground source={{ uri: item.image }} style={styles.cardImage} imageStyle={styles.cardImageRadius}>
          <View style={styles.imageShade} />
        </ImageBackground>
        <View style={styles.dateBadge}>
          <Text style={styles.dateMonth}>{item.dateMonth}</Text>
          <Text style={styles.dateDay}>{item.dateDay}</Text>
        </View>
        <Pressable
          accessibilityLabel={`Show QR code for ${item.title}`}
          onPress={() => {
            tapFeedback();
            onShowQr();
          }}
          style={styles.qrButton}
        >
          <Ionicons name="qr-code-outline" size={22} color={colors.white} />
        </Pressable>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{item.title}</Text>

        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={18} color="#4aa26f" />
          <Text style={styles.metaText}>{item.time}</Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={18} color="#4aa26f" />
          <Text style={styles.metaText}>{item.location}</Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.attendeesRow}>
            {item.attendeeAvatars.map((avatar, index) => (
              <Image
                key={`${item.id}-${index}`}
                source={{ uri: avatar }}
                style={[styles.avatar, index > 0 && styles.avatarOverlap]}
              />
            ))}
            {item.extraCount ? (
              <View style={[styles.extraBadge, item.attendeeAvatars.length > 0 && styles.extraBadgeOffset]}>
                <Text style={styles.extraBadgeText}>{item.extraCount}</Text>
              </View>
            ) : null}
          </View>

          <Pressable
            onPress={() => {
              tapFeedback();
              onViewTicket();
            }}
            style={styles.ticketButton}
          >
            <Text style={styles.ticketButtonText}>View Ticket</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function MyEventsScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<EventTab>('Upcoming');
  const [qrEvent, setQrEvent] = useState<EventItem | null>(null);
  const [tabLayouts, setTabLayouts] = useState<Record<EventTab, { x: number; width: number }>>({
    Upcoming: { x: 0, width: 0 },
    Past: { x: 0, width: 0 },
  });
  const indicatorX = useRef(new Animated.Value(0)).current;
  const indicatorWidth = useRef(new Animated.Value(0)).current;
  const indicatorOpacity = useRef(new Animated.Value(0)).current;

  const visibleEvents = useMemo(() => events.filter((item) => item.status === activeTab), [activeTab]);

  useEffect(() => {
    const layout = tabLayouts[activeTab];
    if (!layout.width) {
      return;
    }

    Animated.parallel([
      Animated.timing(indicatorX, {
        toValue: layout.x,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(indicatorWidth, {
        toValue: layout.width,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(indicatorOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();
  }, [activeTab, indicatorOpacity, indicatorWidth, indicatorX, tabLayouts]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.headerShell}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={30} color={colors.ink} />
          </Pressable>
          <Text style={styles.headerTitle}>My Events</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.segmentWrap}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.segmentIndicator,
              {
                opacity: indicatorOpacity,
                transform: [{ translateX: indicatorX }],
                width: indicatorWidth,
              },
            ]}
          />
          <EventTabButton
            label="Upcoming"
            selected={activeTab === 'Upcoming'}
            onPress={() => setActiveTab('Upcoming')}
            onLayout={(event) => {
              const { x, width } = event.nativeEvent.layout;
              setTabLayouts((current) => ({ ...current, Upcoming: { x, width } }));
            }}
          />
          <EventTabButton
            label="Past"
            selected={activeTab === 'Past'}
            onPress={() => setActiveTab('Past')}
            onLayout={(event) => {
              const { x, width } = event.nativeEvent.layout;
              setTabLayouts((current) => ({ ...current, Past: { x, width } }));
            }}
          />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.list}>
          {visibleEvents.map((item) => (
            <EventCard
              key={item.id}
              item={item}
              onShowQr={() => setQrEvent(item)}
              onViewTicket={() => navigation.navigate('MyEventDetails', { eventId: item.id })}
            />
          ))}
        </View>
      </ScrollView>
      <TicketQrModal
        eventId={qrEvent?.id ?? null}
        eventTitle={qrEvent?.title ?? ''}
        visible={Boolean(qrEvent)}
        onClose={() => setQrEvent(null)}
      />
    </SafeAreaView>
  );
}

const android = Platform.OS === 'android';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  headerShell: {
    backgroundColor: colors.paper,
    paddingBottom: 10,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    paddingVertical: 4,
    width: 34,
  },
  headerTitle: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 24,
  },
  headerSpacer: {
    width: 34,
  },
  segmentWrap: {
    backgroundColor: colors.white,
    borderRadius: 24,
    elevation: android ? 5 : 0,
    flexDirection: 'row',
    marginTop: 26,
    padding: 5,
    position: 'relative',
  },
  segmentIndicator: {
    backgroundColor: '#15bb59',
    borderRadius: 19,
    bottom: 5,
    left: 0,
    position: 'absolute',
    top: 5,
  },
  segmentButton: {
    alignItems: 'center',
    flex: 1,
    height: 44,
    justifyContent: 'center',
    zIndex: 1,
  },
  segmentText: {
    color: '#4aa26f',
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  segmentTextActive: {
    color: colors.white,
  },
  content: {
    paddingBottom: 36,
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  list: {
    gap: 22,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#dbe7df',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: android ? 3 : 0,
  },
  imageWrap: {
    position: 'relative',
  },
  cardImage: {
    height: 238,
    justifyContent: 'flex-end',
  },
  cardImageRadius: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  imageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 19, 13, 0.4)',
  },
  dateBadge: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 26,
    height: 64,
    justifyContent: 'center',
    left: 14,
    position: 'absolute',
    top: 14,
    width: 64,
  },
  dateMonth: {
    color: '#15bb59',
    fontFamily: fonts.extraBold,
    fontSize: 13,
  },
  dateDay: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 18,
    marginTop: 1,
  },
  qrButton: {
    alignItems: 'center',
    backgroundColor: '#15bb59',
    borderRadius: 30,
    bottom: -30,
    height: 60,
    justifyContent: 'center',
    position: 'absolute',
    right: 14,
    width: 60,
  },
  cardBody: {
    paddingBottom: 18,
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  cardTitle: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 20,
    paddingRight: 68,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  metaText: {
    color: '#4aa26f',
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  cardFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  attendeesRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  avatar: {
    borderColor: colors.white,
    borderRadius: 18,
    borderWidth: 2,
    height: 36,
    width: 36,
  },
  avatarOverlap: {
    marginLeft: -10,
  },
  extraBadge: {
    alignItems: 'center',
    backgroundColor: '#13261c',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    minWidth: 36,
    paddingHorizontal: 8,
  },
  extraBadgeOffset: {
    marginLeft: -8,
  },
  extraBadgeText: {
    color: colors.white,
    fontFamily: fonts.extraBold,
    fontSize: 14,
  },
  ticketButton: {
    alignItems: 'center',
    backgroundColor: '#14271b',
    borderRadius: 18,
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  ticketButtonText: {
    color: colors.white,
    fontFamily: fonts.extraBold,
    fontSize: 14,
  },
});
