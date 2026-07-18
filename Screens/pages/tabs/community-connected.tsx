import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppAlertModal from '../../components/ui/app-alert-modal';
import { ApiError } from '../../services/api/client';
import { communitiesApi } from '../../services/api/communities.api';
import { colors, fonts } from '../../styles/theme';
import type { GetCommunitiesResponse } from '../../types/api.generated';
import type { RootStackParamList } from '../../types/navigation';

type Community = GetCommunitiesResponse['data']['communities'][number];
const images = [
  'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1000&q=86',
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1000&q=86',
];

function money(kobo: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(kobo / 100);
}

export default function CommunityScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [items, setItems] = useState<Community[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const response = await communitiesApi.list({ page: 1, limit: 50, ...(query.trim() ? { search: query.trim() } : {}) });
      setItems(response.data.communities);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Unable to load communities.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [query]);

  useEffect(() => {
    const timer = setTimeout(() => load(), 350);
    return () => clearTimeout(timer);
  }, [load]);

  return (
    <>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}><View><Text style={styles.eyebrow}>DISCOVER</Text><Text style={styles.title}>Communities</Text></View><Pressable onPress={() => navigation.navigate('CreateCommunity')} style={styles.add}><Ionicons name="add" size={28} color={colors.ink} /></Pressable></View>
        <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.lime} />}>
          <View style={styles.search}><Ionicons name="search" size={22} color="#399760" /><TextInput value={query} onChangeText={setQuery} placeholder="Search communities" placeholderTextColor="#789087" style={styles.input} /></View>
          {loading ? <Text style={styles.state}>Loading communities...</Text> : null}
          {!loading && items.length === 0 ? <Text style={styles.state}>No communities match your search.</Text> : null}
          <View style={styles.list}>
            {items.map((item, index) => (
              <Pressable key={item._id} onPress={() => navigation.navigate('CommunityProfile', { communityId: item._id })} style={styles.card}>
                <Image source={{ uri: images[index % images.length] }} style={styles.image} />
                <View style={styles.body}>
                  <View style={styles.row}><Text style={styles.name}>{item.name}</Text><Text style={styles.price}>{item.membershipType === 'free' ? 'Free' : money(item.membershipPriceKobo)}</Text></View>
                  <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
                  <View style={styles.meta}><Ionicons name="location-outline" size={16} color="#399760" /><Text style={styles.metaText}>{item.lga}, {item.state}</Text><Text style={styles.members}>{item.members.length} members</Text></View>
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
      <AppAlertModal visible={Boolean(errorMessage)} title="Communities unavailable" message={errorMessage ?? ''} onClose={() => setErrorMessage(null)} />
    </>
  );
}

const styles = StyleSheet.create({ safe: { backgroundColor: colors.paper, flex: 1 }, header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', padding: 24 }, eyebrow: { color: '#399760', fontFamily: fonts.bold, fontSize: 11 }, title: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 30 }, add: { alignItems: 'center', backgroundColor: colors.lime, borderRadius: 24, height: 48, justifyContent: 'center', width: 48 }, content: { paddingBottom: 130, paddingHorizontal: 24 }, search: { alignItems: 'center', backgroundColor: colors.white, borderRadius: 28, flexDirection: 'row', height: 58, paddingHorizontal: 18 }, input: { color: colors.ink, flex: 1, fontFamily: fonts.medium, fontSize: 15, marginLeft: 10 }, list: { gap: 20, marginTop: 24 }, card: { backgroundColor: colors.white, borderRadius: 28, overflow: 'hidden' }, image: { height: 180, width: '100%' }, body: { padding: 18 }, row: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, name: { color: colors.ink, flex: 1, fontFamily: fonts.extraBold, fontSize: 20 }, price: { color: '#08b657', fontFamily: fonts.extraBold, fontSize: 13 }, description: { color: colors.muted, fontFamily: fonts.medium, fontSize: 13, lineHeight: 20, marginTop: 8 }, meta: { alignItems: 'center', flexDirection: 'row', marginTop: 13 }, metaText: { color: '#399760', flex: 1, fontFamily: fonts.medium, fontSize: 12, marginLeft: 5 }, members: { color: '#399760', fontFamily: fonts.bold, fontSize: 11 }, state: { color: colors.muted, fontFamily: fonts.medium, paddingVertical: 40, textAlign: 'center' } });

