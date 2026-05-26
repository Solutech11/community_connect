import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../../styles/theme';
import { lightTap as tapFeedback } from '../../hooks/haptics';

const categories = ['All', 'Fitness', 'Arts', 'Tech'];

const myEvents = [
  {
    title: 'Morning Yoga Park',
    location: 'Central Park, North Lawn',
    time: '08:00 AM',
    image: require('../../../assets/dashboard-yoga.png'),
  },
  {
    title: 'Code Mixer',
    location: 'Tech Hub, Downtown',
    time: '06:30 PM',
    image: require('../../../assets/dashboard-code.png'),
  },
];

const upcomingEvents = [
  {
    title: 'City Marathon 2024',
    location: 'Central Park, NYC',
    date: 'Sept 12',
    image: require('../../../assets/dashboard-marathon.png'),
  },
  {
    title: 'Abstract Art Gala',
    location: 'Main Gallery, Downtown',
    date: 'Sept 14',
    image: require('../../../assets/dashboard-gala.png'),
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

function MyEventCard({ event }: { event: (typeof myEvents)[number] }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={tapFeedback}
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

function UpcomingEventCard({ event }: { event: (typeof upcomingEvents)[number] }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={tapFeedback}
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
  const [selectedCategory, setSelectedCategory] = useState('All');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        overScrollMode="never"
      >
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
            <Ionicons name="notifications" size={23} color={colors.ink} />
            <View style={styles.notificationDot} />
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="search"
          onPress={tapFeedback}
          style={({ pressed }) => [styles.searchBar, pressed && styles.pressed]}
        >
          <Ionicons name="search" size={25} color="#279d61" />
          <Text style={styles.searchText}>Find events near you...</Text>
        </Pressable>

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
          <Pressable onPress={tapFeedback} hitSlop={10}>
            <Text style={styles.seeAll}>See All</Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.myEventsList}>
          {myEvents.map((event) => (
            <MyEventCard key={event.title} event={event} />
          ))}
        </ScrollView>

        <Text style={[styles.sectionTitle, styles.upcomingHeading]}>Upcoming Events</Text>
        <View style={styles.upcomingList}>
          {upcomingEvents.map((event) => (
            <UpcomingEventCard key={event.title} event={event} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  content: {
    paddingBottom: 118,
    paddingTop: 34,
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
    fontWeight: '500',
  },
  name: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '900',
    marginTop: 5,
  },
  notificationButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    shadowColor: '#d9e4dd',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    width: 56,
  },
  notificationDot: {
    backgroundColor: colors.lime,
    borderColor: colors.white,
    borderRadius: 7,
    borderWidth: 2,
    height: 14,
    position: 'absolute',
    right: 15,
    top: 13,
    width: 14,
  },
  searchBar: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 31,
    flexDirection: 'row',
    gap: 13,
    height: 62,
    marginHorizontal: 29,
    marginTop: 34,
    paddingHorizontal: 22,
    shadowColor: '#e1ebe5',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  searchText: {
    color: '#299963',
    fontSize: 17,
    fontWeight: '500',
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
    fontWeight: '600',
  },
  categoryTextActive: {
    color: colors.ink,
    fontWeight: '800',
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
    fontWeight: '900',
  },
  seeAll: {
    color: '#00cf5a',
    fontSize: 16,
    fontWeight: '700',
  },
  myEventsList: {
    gap: 17,
    paddingHorizontal: 29,
    paddingTop: 23,
  },
  myEventCard: {
    borderRadius: 30,
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
    fontWeight: '800',
  },
  myEventCopy: {
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  myEventTitle: {
    color: colors.white,
    fontSize: 26,
    fontWeight: '900',
  },
  myEventLocation: {
    color: colors.white,
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
    fontWeight: '800',
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
    fontWeight: '900',
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
    fontWeight: '500',
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
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.74,
  },
});
