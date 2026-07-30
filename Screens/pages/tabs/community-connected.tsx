import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppAlertModal from '../../components/ui/app-alert-modal';
import { communityImage } from '../../data/community-presentation';
import { ApiError } from '../../services/api/client';
import { communitiesApi } from '../../services/api/communities.api';
import { colors, fonts } from '../../styles/theme';
import type { GetCommunitiesResponse, GetUsersMeCommunitiesResponse } from '../../types/api.generated';
import type { RootStackParamList } from '../../types/navigation';

type Community = GetCommunitiesResponse['data']['communities'][number];
type MyCommunity = GetUsersMeCommunitiesResponse['data']['communities'][number];

function money(kobo: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(kobo / 100);
}

function hash(value: string) {
  return [...value].reduce((total, character) => total + character.charCodeAt(0), 0);
}

export default function CommunityScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [items, setItems] = useState<Community[]>([]);
  const [myCommunities, setMyCommunities] = useState<MyCommunity[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('For You');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const requestCommunities = useCallback(async (signal?: AbortSignal) => {
    const [response, mine] = await Promise.all([
      communitiesApi.list({
        page: 1,
        limit: 50,
        ...(query.trim() ? { search: query.trim() } : {}),
        ...(category !== 'For You' ? { category } : {}),
      }, signal),
      communitiesApi.myCommunities({ page: 1, limit: 30 }, signal),
    ]);
    setItems(response.data.communities);
    setMyCommunities(mine.data.communities);
    setAvailableCategories((current) => Array.from(new Set([
      ...current,
      ...response.data.communities.map((item) => item.category).filter(Boolean),
    ])));
  }, [category, query]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      requestCommunities(controller.signal)
        .catch((error: unknown) => {
          if (error instanceof ApiError && error.code === 'REQUEST_CANCELLED') return;
          setErrorMessage(error instanceof ApiError ? error.message : 'Unable to load communities.');
        })
        .finally(() => setLoading(false));
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [requestCommunities]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await requestCommunities();
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Unable to refresh communities.');
    } finally {
      setRefreshing(false);
    }
  };

  const myCommunityIds = useMemo(
    () => new Set(myCommunities.map((community) => community._id)),
    [myCommunities],
  );
  const categories = useMemo(
    () => ['For You', ...availableCategories.slice(0, 8)],
    [availableCategories],
  );

  return (
    <>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.lime} />}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Communities</Text>
            <Pressable accessibilityLabel="Open notifications" onPress={() => navigation.navigate('Notifications')} style={styles.notificationButton}>
              <Ionicons name="notifications" size={21} color={colors.ink} />
              <View style={styles.notificationDot} />
            </Pressable>
          </View>

          <Pressable onPress={() => navigation.navigate('CreateCommunity')} style={styles.createButton}>
            <View style={styles.createIcon}><Ionicons name="add" size={19} color={colors.white} /></View>
            <Text style={styles.createText}>Create Community</Text>
          </Pressable>

          <View style={styles.search}>
            <Ionicons name="search-outline" size={23} color="#329a61" />
            <TextInput
              autoCapitalize="none"
              onChangeText={setQuery}
              placeholder="Search for groups..."
              placeholderTextColor="#438a64"
              returnKeyType="search"
              style={styles.input}
              value={query}
            />
          </View>

          {myCommunities.length > 0 ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>My Communities</Text>
                <Text style={styles.viewAll}>{myCommunities.length} joined</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.myList}>
                {myCommunities.map((item) => (
                  <Pressable key={item._id} onPress={() => navigation.navigate('CommunityProfile', { communityId: item._id })} style={styles.myItem}>
                    <View style={styles.myImageRing}>
                      <Image source={{ uri: communityImage(item.avatarImageUrl || item.imageUrl, hash(item._id)) }} style={styles.myImage} />
                    </View>
                    <Text numberOfLines={1} style={styles.myName}>{item.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {categories.map((item) => {
              const active = item === category;
              return (
                <Pressable key={item} onPress={() => setCategory(item)} style={[styles.chip, active && styles.activeChip]}>
                  <Text style={[styles.chipText, active && styles.activeChipText]}>{item === 'For You' ? item : `#${item}`}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.discoverTitle}>{query ? 'Search Results' : 'Discover Communities'}</Text>
          {loading ? (
            <View style={styles.stateCard}>
              <ActivityIndicator color="#08b657" />
              <Text style={styles.stateText}>Finding communities near you...</Text>
            </View>
          ) : null}
          {!loading && items.length === 0 ? (
            <View style={styles.stateCard}>
              <Ionicons name="people-outline" size={34} color="#69ad86" />
              <Text style={styles.emptyTitle}>No communities found</Text>
              <Text style={styles.stateText}>Try another search or create the first community for this interest.</Text>
            </View>
          ) : null}

          <View style={styles.list}>
            {!loading && items.map((item) => {
              const joined = myCommunityIds.has(item._id);
              return (
                <Pressable key={item._id} onPress={() => navigation.navigate('CommunityProfile', { communityId: item._id })} style={styles.card}>
                  <Image source={{ uri: communityImage(item.imageUrl, hash(item._id)) }} style={styles.cardImage} />
                  <View style={styles.categoryTag}><Text style={styles.categoryTagText}>#{item.category.toUpperCase()}</Text></View>
                  <View style={styles.cardBody}>
                    <View style={styles.cardHeading}>
                      <Text numberOfLines={1} style={styles.cardTitle}>{item.name}</Text>
                      <View style={styles.memberPill}>
                        <Ionicons name="people" size={14} color="#319363" />
                        <Text style={styles.memberCount}>{item.members.length.toLocaleString()}</Text>
                      </View>
                    </View>
                    <Text numberOfLines={2} style={styles.description}>{item.description}</Text>
                    <View style={styles.cardMeta}>
                      <Ionicons name="location-outline" size={15} color="#319363" />
                      <Text numberOfLines={1} style={styles.location}>{[item.lga, item.state].filter(Boolean).join(', ') || 'Online community'}</Text>
                      <Text style={styles.price}>{item.membershipType === 'free' ? 'Free' : money(item.membershipPriceKobo)}</Text>
                    </View>
                    <View style={styles.openButton}>
                      <Text style={styles.openButtonText}>{joined ? 'Open Group' : 'Join Group'}</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
      <AppAlertModal
        visible={Boolean(errorMessage)}
        title="Communities unavailable"
        message={errorMessage ?? ''}
        onClose={() => setErrorMessage(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.paper, flex: 1 },
  content: { paddingBottom: 124, paddingHorizontal: 24 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 20, paddingTop: 12 },
  title: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 27 },
  notificationButton: { alignItems: 'center', backgroundColor: colors.white, borderColor: '#edf2ef', borderRadius: 24, borderWidth: 1, height: 46, justifyContent: 'center', width: 46 },
  notificationDot: { backgroundColor: colors.lime, borderColor: colors.white, borderRadius: 5, borderWidth: 2, height: 9, position: 'absolute', right: 10, top: 9, width: 9 },
  createButton: { alignItems: 'center', backgroundColor: colors.lime, borderRadius: 30, flexDirection: 'row', height: 60, justifyContent: 'center' },
  createIcon: { alignItems: 'center', backgroundColor: '#073a20', borderRadius: 13, height: 25, justifyContent: 'center', marginRight: 10, width: 25 },
  createText: { color: colors.ink, fontFamily: fonts.bold, fontSize: 17 },
  search: { alignItems: 'center', backgroundColor: colors.white, borderRadius: 30, flexDirection: 'row', height: 58, marginTop: 16, paddingHorizontal: 18, shadowColor: '#10291d', shadowOpacity: 0.03, shadowRadius: 12 },
  input: { color: colors.ink, flex: 1, fontFamily: fonts.medium, fontSize: 14, marginLeft: 10 },
  section: { marginTop: 30 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  sectionTitle: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 18 },
  viewAll: { color: '#00b951', fontFamily: fonts.semiBold, fontSize: 13 },
  myList: { gap: 15, paddingTop: 16 },
  myItem: { alignItems: 'center', width: 74 },
  myImageRing: { borderColor: colors.lime, borderRadius: 34, borderWidth: 2, padding: 2 },
  myImage: { borderRadius: 28, height: 56, width: 56 },
  myName: { color: colors.ink, fontFamily: fonts.medium, fontSize: 11, marginTop: 7, maxWidth: 72 },
  chips: { gap: 10, paddingBottom: 4, paddingTop: 25 },
  chip: { backgroundColor: colors.white, borderColor: '#e8efeb', borderRadius: 21, borderWidth: 1, paddingHorizontal: 18, paddingVertical: 10 },
  activeChip: { backgroundColor: '#09152c', borderColor: '#09152c' },
  chipText: { color: '#17894f', fontFamily: fonts.medium, fontSize: 12 },
  activeChipText: { color: colors.white, fontFamily: fonts.bold },
  discoverTitle: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 20, marginTop: 27 },
  list: { gap: 20, marginTop: 16 },
  card: { backgroundColor: colors.white, borderRadius: 30, overflow: 'hidden', shadowColor: '#0a2418', shadowOffset: { height: 5, width: 0 }, shadowOpacity: 0.07, shadowRadius: 12 },
  cardImage: { height: 154, width: '100%' },
  categoryTag: { bottom: 165, left: 16, position: 'absolute' },
  categoryTagText: { color: colors.lime, fontFamily: fonts.extraBold, fontSize: 10 },
  cardBody: { padding: 17 },
  cardHeading: { alignItems: 'center', flexDirection: 'row' },
  cardTitle: { color: colors.ink, flex: 1, fontFamily: fonts.extraBold, fontSize: 19 },
  memberPill: { alignItems: 'center', backgroundColor: '#f1f8f4', borderRadius: 16, flexDirection: 'row', gap: 5, paddingHorizontal: 9, paddingVertical: 6 },
  memberCount: { color: '#319363', fontFamily: fonts.medium, fontSize: 11 },
  description: { color: '#348b5d', fontFamily: fonts.medium, fontSize: 12, lineHeight: 19, marginTop: 7 },
  cardMeta: { alignItems: 'center', flexDirection: 'row', marginTop: 10 },
  location: { color: '#45896a', flex: 1, fontFamily: fonts.medium, fontSize: 10, marginLeft: 4 },
  price: { color: '#078d45', fontFamily: fonts.bold, fontSize: 11 },
  openButton: { alignItems: 'center', backgroundColor: '#09152c', borderRadius: 27, height: 50, justifyContent: 'center', marginTop: 14 },
  openButtonText: { color: colors.white, fontFamily: fonts.extraBold, fontSize: 14 },
  stateCard: { alignItems: 'center', backgroundColor: colors.white, borderRadius: 24, marginTop: 16, padding: 28 },
  stateText: { color: colors.muted, fontFamily: fonts.medium, fontSize: 12, lineHeight: 19, marginTop: 10, textAlign: 'center' },
  emptyTitle: { color: colors.ink, fontFamily: fonts.bold, fontSize: 16, marginTop: 10 },
});
