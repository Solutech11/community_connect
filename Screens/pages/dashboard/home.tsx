import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import {
  Image,
  ImageBackground,
  Pressable,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { lightTap as tapFeedback } from '../../hooks/haptics';
import { colors, fonts } from '../../styles/theme';
import type { RootStackParamList } from '../../types/navigation';

type EventCategory = 'All' | 'Fitness' | 'Arts' | 'Tech' | 'Community';

type EventCard = {
  title: string;
  location: string;
  image: number;
  category: Exclude<EventCategory, 'All'>;
  description: string;
  time?: string;
  date?: string;
  eventId?: string;
};

const categories: EventCategory[] = ['All', 'Fitness', 'Arts', 'Tech', 'Community'];

const myEvents: EventCard[] = [
  {
    title: 'Morning Yoga Park',
    location: 'Central Park, North Lawn',
    time: '08:00 AM',
    category: 'Fitness',
    description: 'Start the day with guided sunrise yoga and wellness networking.',
    eventId: 'sunset-yoga',
    image: require('../../../assets/dashboard-yoga-real.jpg'),
  },
  {
    title: 'Code Mixer',
    location: 'Tech Hub, Downtown',
    time: '06:30 PM',
    category: 'Tech',
    description: 'Meet builders, founders, and designers for an evening of demos.',
    eventId: 'creative-tech',
    image: require('../../../assets/dashboard-tech-real.jpg'),
  },
];

const upcomingEvents: EventCard[] = [
  {
    title: 'Sunset Yoga',
    location: 'Central Park, New York',
    date: 'Oct 12',
    category: 'Fitness',
    description: 'Join a relaxing golden-hour yoga session with community wellness vibes.',
    image: require('../../../assets/dashboard-marathon-real.jpg'),
    eventId: 'sunset-yoga',
  },
  {
    title: 'Abstract Art Gala',
    location: 'Main Gallery, Downtown',
    date: 'Sept 14',
    category: 'Arts',
    description: 'A modern art evening featuring installations, music, and creators.',
    image: require('../../../assets/dashboard-art-real.jpg'),
    eventId: 'creative-tech',
  },
  {
    title: 'Neighbourhood Food Fair',
    location: 'Riverside Square',
    date: 'Sept 16',
    category: 'Community',
    description: 'Local chefs, tasting booths, and live acoustic performances.',
    image: require('../../../assets/dashboard-community-real.jpg'),
    eventId: 'sunset-yoga',
  },
  {
    title: 'Startup Demo Night',
    location: 'Innovation Loft',
    date: 'Sept 20',
    category: 'Tech',
    description: 'Pitch showcases, product demos, and investor networking.',
    image: require('../../../assets/dashboard-tech-real.jpg'),
    eventId: 'creative-tech',
  },
];

function CategoryChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      style={({ pressed }) => [
        styles.categoryChip,
        selected && styles.categoryChipActive,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.categoryText, selected && styles.categoryTextActive]}>{label}</Text>
    </Pressable>
  );
}

function MyEventCard({ event }: { event: EventCard }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        tapFeedback();
        if (event.eventId) {
          navigation.navigate('MyEventDetails', { eventId: event.eventId });
        }
      }}
      style={({ pressed }) => [styles.myEventCard, pressed && styles.pressed]}
    >
      <ImageBackground source={event.image} style={styles.myEventImage} imageStyle={styles.myEventImageRadius}>
        <View style={styles.imageShade} />
        <View style={styles.timePill}>
          <Ionicons name="time" size={14} color={colors.lime} />
          <Text style={styles.timeText}>{event.time}</Text>
        </View>
        <View style={styles.myEventCopy}>
          <Text style={styles.myEventTitle} numberOfLines={1}>
            {event.title}
          </Text>
          <Text style={styles.myEventLocation} numberOfLines={1}>
            {event.location}
          </Text>
        </View>
      </ImageBackground>
    </Pressable>
  );
}

function UpcomingEventCard({ event }: { event: EventCard }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        tapFeedback();
        if (event.eventId) {
          navigation.navigate('EventDetails', { eventId: event.eventId });
        }
      }}
      style={({ pressed }) => [styles.upcomingCard, pressed && styles.pressed]}
    >
      <View>
        <Image source={event.image} style={styles.upcomingImage} />
        <View style={styles.datePill}>
          <Text style={styles.dateText}>{event.date}</Text>
        </View>
      </View>
      <View style={styles.upcomingBody}>
        <View style={styles.upcomingTitleRow}>
          <View style={styles.upcomingCopy}>
            <Text style={styles.upcomingTitle} numberOfLines={1}>
              {event.title}
            </Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={18} color="#4ca36d" />
              <Text style={styles.upcomingLocation} numberOfLines={1}>
                {event.location}
              </Text>
            </View>
          </View>
          <Pressable accessibilityLabel={`Save ${event.title}`} onPress={tapFeedback} style={styles.bookmarkButton}>
            <Ionicons name="bookmark" size={24} color={colors.lime} />
          </Pressable>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={tapFeedback}
          style={({ pressed }) => [styles.interestedButton, pressed && styles.pressed]}
        >
          <Text style={styles.interestedText}>Interested</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedCategory, setSelectedCategory] = useState<EventCategory>('All');
  const [query, setQuery] = useState('');

  const normalizedQuery = query.trim().toLowerCase();

  const filteredMyEvents = useMemo(() => {
    return myEvents.filter((event) => {
      const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
      const haystack = [event.title, event.location, event.description, event.category].join(' ').toLowerCase();
      const matchesQuery = normalizedQuery.length === 0 || haystack.includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [normalizedQuery, selectedCategory]);

  const filteredUpcomingEvents = useMemo(() => {
    return upcomingEvents.filter((event) => {
      const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
      const haystack = [event.title, event.location, event.description, event.category].join(' ').toLowerCase();
      const matchesQuery = normalizedQuery.length === 0 || haystack.includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [normalizedQuery, selectedCategory]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.headerShell}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good Morning,</Text>
            <Text style={styles.name}>Hello, Alex!</Text>
          </View>
          <Pressable
            accessibilityLabel="Notifications"
            onPress={tapFeedback}
            style={({ pressed }) => [styles.notificationButton, pressed && styles.pressed]}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.ink} />
            <View style={styles.notificationDot} />
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} overScrollMode="never">
        <View style={styles.searchBar}>
          <Ionicons name="search" size={25} color="#279d61" />
          <TextInput
            accessibilityLabel="Search events"
            onChangeText={setQuery}
            placeholder="Find events near you..."
            placeholderTextColor="#7bb694"
            style={styles.searchInput}
            value={query}
          />
          {query.length > 0 ? (
            <Pressable accessibilityLabel="Clear search" hitSlop={10} onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={22} color="#5aa378" />
            </Pressable>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
          {categories.map((category) => (
            <CategoryChip
              key={category}
              label={category}
              selected={category === selectedCategory}
              onPress={() => setSelectedCategory(category)}
            />
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Events</Text>
          <Pressable onPress={() => navigation.navigate('MyEvents')} hitSlop={10}>
            <Text style={styles.seeAll}>See All</Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.myEventsList}>
          {filteredMyEvents.length > 0 ? (
            filteredMyEvents.map((event) => <MyEventCard key={event.title} event={event} />)
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No saved events found</Text>
              <Text style={styles.emptyBody}>Try another search or switch filters.</Text>
            </View>
          )}
        </ScrollView>

        <Text style={[styles.sectionTitle, styles.upcomingHeading]}>Upcoming Events</Text>
        <View style={styles.upcomingList}>
          {filteredUpcomingEvents.length > 0 ? (
            filteredUpcomingEvents.map((event) => <UpcomingEventCard key={event.title} event={event} />)
          ) : (
            <View style={styles.emptyUpcomingCard}>
              <Text style={styles.emptyTitle}>No upcoming events match</Text>
              <Text style={styles.emptyBody}>Adjust the category or search term to see more events.</Text>
            </View>
          )}
        </View>
      </ScrollView>
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
    paddingTop: 10,
  },
  content: {
    paddingBottom: 118,
    paddingTop: 8,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 29,
  },
  greeting: {
    color: '#129a56',
    fontSize: 16,
    fontFamily: fonts.medium,
  },
  name: {
    color: colors.ink,
    fontSize: 28,
    fontFamily: fonts.extraBold,
    marginTop: 5,
  },
  notificationButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    shadowColor: '#d7e5dd',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: android ? 3 : 0,
    width: 48,
  },
  notificationDot: {
    backgroundColor: colors.lime,
    borderColor: colors.white,
    borderRadius: 6,
    borderWidth: 2,
    height: 12,
    position: 'absolute',
    right: 12,
    top: 10,
    width: 12,
  },
  searchBar: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 31,
    flexDirection: 'row',
    gap: 13,
    height: 62,
    marginHorizontal: 29,
    marginTop: 16,
    paddingHorizontal: 22,
    shadowColor: '#e1ebe5',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: android ? 4 : 0,
  },
  searchInput: {
    color: '#299963',
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 17,
    paddingVertical: 0,
  },
  categories: {
    gap: 15,
    paddingHorizontal: 29,
    paddingTop: 20,
  },
  categoryChip: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: 24,
    borderWidth: 1,
    height: 49,
    justifyContent: 'center',
    minWidth: 85,
    paddingHorizontal: 24,
  },
  categoryChipActive: {
    backgroundColor: colors.lime,
    borderColor: colors.lime,
  },
  categoryText: {
    color: '#18854e',
    fontSize: 16,
    fontFamily: fonts.semiBold,
  },
  categoryTextActive: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 53,
    paddingHorizontal: 29,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 23,
    fontFamily: fonts.extraBold,
  },
  seeAll: {
    color: '#00cf5a',
    fontSize: 16,
    fontFamily: fonts.bold,
  },
  myEventsList: {
    gap: 17,
    paddingHorizontal: 29,
    paddingTop: 23,
  },
  myEventCard: {
    backgroundColor: colors.white,
    borderRadius: 30,
    elevation: android ? 3 : 0,
    height: 230,
    overflow: 'hidden',
    width: 344,
  },
  myEventImage: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  myEventImageRadius: {
    borderRadius: 30,
  },
  imageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.24)',
  },
  timePill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(20, 15, 10, 0.56)',
    borderRadius: 18,
    flexDirection: 'row',
    gap: 6,
    left: 39,
    paddingHorizontal: 10,
    paddingVertical: 6,
    position: 'absolute',
    top: 116,
  },
  timeText: {
    color: colors.white,
    fontSize: 15,
    fontFamily: fonts.extraBold,
  },
  myEventCopy: {
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  myEventTitle: {
    color: colors.white,
    fontSize: 26,
    fontFamily: fonts.extraBold,
  },
  myEventLocation: {
    color: colors.white,
    fontFamily: fonts.medium,
    fontSize: 16,
    marginTop: 5,
  },
  upcomingHeading: {
    marginTop: 51,
    paddingHorizontal: 29,
  },
  upcomingList: {
    gap: 25,
    marginTop: 23,
    paddingHorizontal: 29,
  },
  upcomingCard: {
    backgroundColor: colors.white,
    borderRadius: 32,
    padding: 15,
    shadowColor: '#e4ede8',
    shadowOffset: { width: 0, height: 13 },
    shadowOpacity: 0.32,
    shadowRadius: 24,
    elevation: android ? 3 : 0,
  },
  upcomingImage: {
    borderRadius: 22,
    height: 190,
    width: '100%',
  },
  datePill: {
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 7,
    position: 'absolute',
    right: 13,
    top: 14,
  },
  dateText: {
    color: colors.ink,
    fontSize: 14,
    fontFamily: fonts.extraBold,
  },
  upcomingBody: {
    paddingHorizontal: 10,
    paddingTop: 19,
  },
  upcomingTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  upcomingCopy: {
    flex: 1,
    paddingRight: 14,
  },
  upcomingTitle: {
    color: colors.ink,
    fontSize: 23,
    fontFamily: fonts.extraBold,
  },
  locationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  upcomingLocation: {
    color: '#329160',
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.medium,
  },
  bookmarkButton: {
    alignItems: 'center',
    backgroundColor: '#dcffe8',
    borderRadius: 25,
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
  interestedButton: {
    alignItems: 'center',
    backgroundColor: colors.lime,
    borderRadius: 25,
    height: 53,
    justifyContent: 'center',
    marginTop: 23,
  },
  interestedText: {
    color: colors.ink,
    fontSize: 16,
    fontFamily: fonts.extraBold,
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: 30,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 190,
    paddingHorizontal: 24,
    width: 344,
  },
  emptyUpcomingCard: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: 32,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 36,
  },
  emptyTitle: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 18,
    textAlign: 'center',
  },
  emptyBody: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.74,
  },
});
