import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppAlertModal from '../../components/ui/app-alert-modal';
import ProfilePageHeader from '../../components/ui/profile-page-header';
import { lightTap } from '../../hooks/haptics';
import { ApiError } from '../../services/api/client';
import { notificationsApi } from '../../services/api/notifications.api';
import { colors, fonts } from '../../styles/theme';
import type { GetNotificationsResponse } from '../../types/api.generated';
import type { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;
type NotificationDto = GetNotificationsResponse['data']['notifications'][number];
type NotificationFilter = 'All' | 'Events' | 'Communities' | 'Friends';

function categoryFor(type: string): Exclude<NotificationFilter, 'All'> {
  if (/friend|connection|request/i.test(type)) return 'Friends';
  if (/community|group|member/i.test(type)) return 'Communities';
  return 'Events';
}

function wasRead(item: NotificationDto) {
  const record = item as object & { readAt?: unknown };
  return typeof record.readAt === 'string';
}

export default function NotificationsScreen({ navigation }: Props) {
  const [filter, setFilter] = useState<NotificationFilter>('All');
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const response = await notificationsApi.list({ page: 1, limit: 100 });
      setNotifications(response.data.notifications);
    } catch (error) {
      setNotice({ title: 'Notifications unavailable', message: error instanceof ApiError ? error.message : 'Unable to load notifications.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    notificationsApi.list({ page: 1, limit: 100 }, controller.signal)
      .then((response) => setNotifications(response.data.notifications))
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.code === 'REQUEST_CANCELLED') return;
        setNotice({ title: 'Notifications unavailable', message: error instanceof ApiError ? error.message : 'Unable to load notifications.' });
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const visible = useMemo(
    () => notifications.filter((item) => filter === 'All' || categoryFor(item.type) === filter),
    [filter, notifications],
  );

  const markAllRead = async () => {
    lightTap();
    try {
      await notificationsApi.markAllRead();
      await load();
    } catch (error) {
      setNotice({ title: 'Unable to update', message: error instanceof ApiError ? error.message : 'Please try again.' });
    }
  };

  const openNotification = async (item: NotificationDto) => {
    lightTap();
    try {
      if (!wasRead(item)) await notificationsApi.markRead(item._id);
      setNotice({ title: item.title, message: item.body });
      await load();
    } catch (error) {
      setNotice({ title: item.title, message: error instanceof ApiError ? error.message : item.body });
    }
  };

  return (
    <>
      <SafeAreaView edges={[]} style={styles.safeArea}>
        <ProfilePageHeader
          onBack={navigation.goBack}
          onRightPress={markAllRead}
          rightAccessibilityLabel="Mark all notifications as read"
          rightIcon="checkmark-done"
          title="Notifications"
        />
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.lime} />}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.filters}>
            {(['All', 'Events', 'Communities', 'Friends'] as NotificationFilter[]).map((item) => (
              <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.filterActive]}>
                <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.list}>
            {loading ? <Text style={styles.stateText}>Loading notifications...</Text> : null}
            {!loading && visible.length === 0 ? <Text style={styles.stateText}>You have no notifications in this category.</Text> : null}
            {visible.map((item) => (
              <Pressable key={item._id} onPress={() => openNotification(item)} style={[styles.card, !wasRead(item) && styles.cardUnread]}>
                <View style={styles.iconWrap}>
                  <Ionicons color="#08b657" name={categoryFor(item.type) === 'Friends' ? 'person-add' : categoryFor(item.type) === 'Communities' ? 'people' : 'calendar'} size={22} />
                </View>
                <View style={styles.copy}>
                  <Text style={styles.messageStrong}>{item.title}</Text>
                  <Text style={styles.message} numberOfLines={3}>{item.body}</Text>
                  <Text style={styles.time}>{new Date(item.createdAt).toLocaleString()}</Text>
                </View>
                {!wasRead(item) ? <View style={styles.unreadDot} /> : null}
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
      <AppAlertModal visible={Boolean(notice)} title={notice?.title ?? ''} message={notice?.message ?? ''} onClose={() => setNotice(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.paper, flex: 1 },
  content: { paddingBottom: 48, paddingHorizontal: 24 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 18 },
  filter: { alignItems: 'center', backgroundColor: colors.white, borderColor: '#e5eee9', borderRadius: 22, borderWidth: 1, paddingHorizontal: 18, paddingVertical: 9 },
  filterActive: { backgroundColor: '#08b657', borderColor: '#08b657' },
  filterText: { color: '#38945f', fontFamily: fonts.bold, fontSize: 13 },
  filterTextActive: { color: colors.white },
  list: { gap: 16, marginTop: 30 },
  card: { alignItems: 'flex-start', backgroundColor: colors.white, borderRadius: 20, flexDirection: 'row', minHeight: 92, padding: 14 },
  cardUnread: { backgroundColor: '#ddf4e7' },
  iconWrap: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 26, height: 50, justifyContent: 'center', marginRight: 13, width: 50 },
  copy: { flex: 1, paddingRight: 8 },
  message: { color: colors.ink, fontFamily: fonts.medium, fontSize: 13, lineHeight: 19, marginTop: 3 },
  messageStrong: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 14 },
  time: { color: '#3d9c65', fontFamily: fonts.bold, fontSize: 11, marginTop: 6 },
  unreadDot: { backgroundColor: '#0cb75a', borderRadius: 5, height: 8, marginTop: 3, width: 8 },
  stateText: { color: colors.muted, fontFamily: fonts.medium, fontSize: 14, paddingVertical: 30, textAlign: 'center' },
});

