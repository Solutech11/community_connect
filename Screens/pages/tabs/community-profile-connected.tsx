import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppAlertModal from '../../components/ui/app-alert-modal';
import AppReportSheet from '../../components/ui/app-report-sheet';
import {
  communityImage,
  DEFAULT_COMMUNITY_GUIDELINES,
  initials,
} from '../../data/community-presentation';
import { useAuth } from '../../hooks/use-auth';
import { ApiError, createIdempotencyKey } from '../../services/api/client';
import { communitiesApi } from '../../services/api/communities.api';
import { colors, fonts } from '../../styles/theme';
import type {
  GetCommunitiesIdAnnouncementsResponse,
  GetCommunitiesIdMembersResponse,
  GetCommunitiesIdResponse,
  GetCommunitiesIdRulesResponse,
  GetUsersMeCommunitiesResponse,
} from '../../types/api.generated';
import type { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'CommunityProfile'>;
type Community = GetCommunitiesIdResponse['data']['community'];
type Member = GetCommunitiesIdMembersResponse['data']['members'][number];
type Announcement = GetCommunitiesIdAnnouncementsResponse['data']['announcements'][number];
type CommunityRules = GetCommunitiesIdRulesResponse['data']['rules'];
type ViewerMembership = GetUsersMeCommunitiesResponse['data']['communities'][number]['viewerMembership'];
type ProfileTab = 'About' | 'Members' | 'Rules';

function readableDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

function normalizeReportReason(reason: string) {
  return reason.toLowerCase().replace(/\s+/g, '-');
}

export default function CommunityProfileScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const communityId = route.params.communityId;
  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [communityRules, setCommunityRules] = useState<CommunityRules | null>(null);
  const [viewerMembership, setViewerMembership] = useState<ViewerMembership | null>(null);
  const [messagePermission, setMessagePermission] = useState('everyone');
  const [activeTab, setActiveTab] = useState<ProfileTab>('About');
  const [memberSearch, setMemberSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [joinRequestPending, setJoinRequestPending] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [leaveConfirmVisible, setLeaveConfirmVisible] = useState(false);
  const [alert, setAlert] = useState<{ title: string; message: string } | null>(null);
  const paymentKey = useRef(createIdempotencyKey());

  const load = useCallback(async (signal?: AbortSignal) => {
    const [detailResponse, memberResponse, rulesResponse, mineResponse] = await Promise.all([
      communitiesApi.get(communityId, signal),
      communitiesApi.members(communityId, { page: 1, limit: 100 }, signal),
      communitiesApi.rules(communityId, signal),
      communitiesApi.myCommunities({ page: 1, limit: 50 }, signal),
    ]);
    const nextCommunity = detailResponse.data.community;
    const membership = mineResponse.data.communities.find((item) => item._id === communityId)?.viewerMembership ?? null;
    setCommunity(nextCommunity);
    setMembers(memberResponse.data.members);
    setCommunityRules(rulesResponse.data.rules);
    setViewerMembership(membership);

    if (membership?.status === 'active') {
      const [announcementResponse, settingsResponse] = await Promise.all([
        communitiesApi.announcements(communityId, { page: 1, limit: 5 }, signal),
        communitiesApi.settings(communityId, signal),
      ]);
      setAnnouncements(announcementResponse.data.announcements);
      setMessagePermission(settingsResponse.data.settings.messagePermission);
    } else {
      setAnnouncements([]);
      setMessagePermission('everyone');
    }
  }, [communityId]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    load(controller.signal)
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.code === 'REQUEST_CANCELLED') return;
        setAlert({
          title: 'Community unavailable',
          message: error instanceof ApiError ? error.message : 'Unable to load this community.',
        });
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [load]);

  const joined = viewerMembership?.status === 'active';
  const isOwner = viewerMembership?.role === 'owner' || Boolean(user && community?.ownerId === user._id);
  const activeRules = communityRules?.rules?.length ? communityRules.rules : DEFAULT_COMMUNITY_GUIDELINES;
  const filteredMembers = useMemo(() => {
    const search = memberSearch.trim().toLowerCase();
    if (!search) return members;
    return members.filter((member) => `${member.firstName} ${member.lastName}`.toLowerCase().includes(search));
  }, [memberSearch, members]);

  const joinOrVerify = async () => {
    if (!community || submitting) return;
    setSubmitting(true);
    try {
      if (orderNumber) {
        const verification = await communitiesApi.verifyMembershipOrder(orderNumber);
        if (verification.data.order.status !== 'paid') {
          setAlert({ title: 'Payment pending', message: 'Complete your Paystack payment, then tap verify again.' });
          return;
        }
        await load();
        setOrderNumber(null);
        paymentKey.current = createIdempotencyKey();
        setAlert({ title: 'Welcome!', message: `You are now a member of ${community.name}.` });
      } else if (community.visibility === 'private') {
        const response = await communitiesApi.createJoinRequest(community._id, {});
        setJoinRequestPending(true);
        setAlert({ title: 'Request sent', message: response.message });
      } else if (community.membershipType === 'free') {
        const response = await communitiesApi.join(community._id);
        await load();
        setAlert({ title: 'Joined community', message: response.message });
      } else {
        const response = await communitiesApi.createMembershipOrder(community._id, paymentKey.current);
        setOrderNumber(response.data.order.orderNumber);
        await Linking.openURL(response.data.checkoutUrl);
      }
    } catch (error) {
      setAlert({ title: 'Unable to join', message: error instanceof ApiError ? error.message : 'Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const leave = async () => {
    if (!community || submitting) return;
    setLeaveConfirmVisible(false);
    setSubmitting(true);
    try {
      await communitiesApi.leave(community._id);
      await load();
      setAlert({ title: 'Community left', message: `You have left ${community.name}.` });
    } catch (error) {
      setAlert({ title: 'Unable to leave', message: error instanceof ApiError ? error.message : 'Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const submitReport = async (reason: string, details: string) => {
    try {
      const response = await communitiesApi.report(communityId, {
        reason: normalizeReportReason(reason),
        ...(details ? { details } : {}),
      });
      setAlert({ title: 'Report submitted', message: response.message });
    } catch (error) {
      setAlert({ title: 'Unable to report', message: error instanceof ApiError ? error.message : 'Please try again.' });
    }
  };

  if (loading && !community) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingState}><ActivityIndicator color="#08b657" size="large" /><Text style={styles.stateText}>Loading community...</Text></View>
      </SafeAreaView>
    );
  }

  if (!community) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingState}><Ionicons name="cloud-offline-outline" color="#5c8d70" size={38} /><Text style={styles.stateText}>This community could not be loaded.</Text><Pressable onPress={() => navigation.goBack()} style={styles.smallButton}><Text style={styles.smallButtonText}>Go back</Text></Pressable></View>
        <AppAlertModal visible={Boolean(alert)} title={alert?.title ?? ''} message={alert?.message ?? ''} onClose={() => setAlert(null)} />
      </SafeAreaView>
    );
  }

  const communityImages = community as Community & { coverImageUrl?: string; avatarImageUrl?: string };
  const cover = communityImage(communityImages.coverImageUrl || community.imageUrl, community.name.length);
  const avatar = communityImage(communityImages.avatarImageUrl || community.imageUrl, community.name.length);

  return (
    <>
      <SafeAreaView style={styles.safe} edges={[]}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ImageBackground source={{ uri: cover }} style={styles.hero}>
            <View style={styles.heroShade} />
            <Pressable onPress={() => navigation.goBack()} style={styles.heroAction}>
              <Ionicons name="chevron-back" size={29} color={colors.white} />
            </Pressable>
            <Pressable onPress={() => setMenuVisible((value) => !value)} style={[styles.heroAction, styles.menuButton]}>
              <Ionicons name="ellipsis-vertical" size={25} color={colors.white} />
            </Pressable>
            {menuVisible ? (
              <View style={styles.menu}>
                {isOwner ? (
                  <Pressable onPress={() => { setMenuVisible(false); navigation.navigate('EditCommunity', { communityId }); }} style={styles.menuItem}>
                    <Ionicons name="create-outline" size={19} color={colors.ink} /><Text style={styles.menuText}>Edit community</Text>
                  </Pressable>
                ) : null}
                {!isOwner ? (
                  <Pressable onPress={() => { setMenuVisible(false); setReportVisible(true); }} style={styles.menuItem}>
                    <Ionicons name="flag-outline" size={19} color="#d63737" /><Text style={styles.menuDanger}>Report community</Text>
                  </Pressable>
                ) : null}
                {joined && !isOwner ? (
                  <Pressable onPress={() => { setMenuVisible(false); setLeaveConfirmVisible(true); }} style={styles.menuItem}>
                    <Ionicons name="exit-outline" size={19} color="#d63737" /><Text style={styles.menuDanger}>Leave community</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </ImageBackground>

          <View style={styles.identity}>
            <Image source={{ uri: avatar }} style={styles.communityAvatar} />
            <Text style={styles.name}>{community.name}</Text>
            <Text style={styles.memberMeta}>{members.length.toLocaleString()} Members - {community.visibility === 'private' ? 'Private Group' : 'Public Group'}</Text>

            {joined ? (
              <Pressable disabled={submitting} onPress={() => navigation.navigate('CommunityRoom', { communityId })} style={styles.joinedButton}>
                <Ionicons name="checkmark" size={23} color="#04ca5a" />
                <Text style={styles.joinedText}>Joined - Open Chat</Text>
              </Pressable>
            ) : (
              <Pressable disabled={submitting || joinRequestPending} onPress={joinOrVerify} style={[styles.joinButton, (submitting || joinRequestPending) && styles.disabled]}>
                {submitting ? <ActivityIndicator color={colors.ink} /> : <Ionicons name="add-circle" size={21} color={colors.ink} />}
                <Text style={styles.joinText}>{orderNumber ? 'Verify Membership Payment' : joinRequestPending ? 'Request Pending' : community.visibility === 'private' ? 'Request to Join' : community.membershipType === 'free' ? 'Join Community' : `Join for NGN ${Math.round(community.membershipPriceKobo / 100).toLocaleString()}`}</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.tabs}>
            {(['About', 'Members', 'Rules'] as ProfileTab[]).map((tab) => (
              <Pressable key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.activeTab]}>
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.tabBody}>
            {activeTab === 'About' ? (
              <>
                <Text style={styles.bodyHeading}>About Us</Text>
                <Text style={styles.aboutText}>{community.description}</Text>
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}><Ionicons name="pricetag-outline" size={18} color="#05b954" /></View>
                  <View><Text style={styles.infoLabel}>Category</Text><Text style={styles.infoValue}>{community.category}</Text></View>
                </View>
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}><Ionicons name="location-outline" size={19} color="#05b954" /></View>
                  <View><Text style={styles.infoLabel}>Location</Text><Text style={styles.infoValue}>{[community.lga, community.state].filter(Boolean).join(', ') || 'Online'}</Text></View>
                </View>
                {joined && announcements.length > 0 ? (
                  <View style={styles.announcementCard}>
                    <View style={styles.cardTitleRow}><Ionicons name="megaphone" size={20} color="#05b954" /><Text style={styles.rulesTitle}>Latest announcements</Text></View>
                    {announcements.slice(-2).reverse().map((item) => (
                      <View key={item._id} style={styles.announcement}>
                        <Text style={styles.announcementText}>{item.text}</Text>
                        <Text style={styles.announcementDate}>{readableDate(item.createdAt)}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
                <Pressable onPress={() => navigation.navigate('CommunityRules', { communityId })} style={styles.rulesPreview}>
                  <View style={styles.cardTitleRow}><Ionicons name="hammer" size={22} color="#05c65b" /><Text style={styles.rulesTitle}>Community Rules</Text><Ionicons name="chevron-forward" size={20} color="#779086" /></View>
                  {activeRules.slice(0, 2).map((rule, index) => (
                    <View key={rule.title} style={styles.previewRule}><Text style={styles.previewNumber}>{index + 1}</Text><Text style={styles.previewText}>{rule.title}</Text></View>
                  ))}
                  <Text style={styles.defaultNote}>{communityRules?.introduction ?? 'Community guidelines are being prepared.'}</Text>
                </Pressable>
              </>
            ) : null}

            {activeTab === 'Members' ? (
              <>
                <View style={styles.memberSearch}>
                  <Ionicons name="search-outline" size={23} color="#8ca0bc" />
                  <TextInput onChangeText={setMemberSearch} placeholder="Search members..." placeholderTextColor="#96a8c1" style={styles.memberSearchInput} value={memberSearch} />
                </View>
                <View style={styles.memberList}>
                  {filteredMembers.map((member) => {
                    const owner = member._id === community.ownerId;
                    return (
                      <View key={member._id} style={styles.memberRow}>
                        {member.avatarUrl ? <Image source={{ uri: member.avatarUrl }} style={styles.memberAvatar} /> : <View style={styles.memberAvatarFallback}><Text style={styles.initials}>{initials(member.firstName, member.lastName)}</Text></View>}
                        <View style={styles.memberCopy}><View style={styles.memberNameRow}><Text style={styles.memberName}>{member.firstName} {member.lastName}</Text>{owner ? <Text style={styles.adminBadge}>OWNER</Text> : null}</View><Text style={styles.memberSub}>{owner ? 'Community organizer' : [member.lga, member.state].filter(Boolean).join(', ') || 'Community member'}</Text></View>
                      </View>
                    );
                  })}
                  {filteredMembers.length === 0 ? <Text style={styles.noMembers}>No members match your search.</Text> : null}
                </View>
              </>
            ) : null}

            {activeTab === 'Rules' ? (
              <>
                <View style={styles.rulesHeader}>
                  <View style={styles.rulesIcon}><Ionicons name="hammer" size={28} color="#00b955" /></View>
                  <Text style={styles.rulesHeaderTitle}>Community Guidelines</Text>
                  <Text style={styles.rulesHeaderText}>{communityRules?.introduction ?? 'Community guidelines help keep every gathering safe and welcoming.'}</Text>
                </View>
                {activeRules.map((rule, index) => (
                  <View key={rule.title} style={styles.ruleCard}>
                    <Text style={styles.ruleNumber}>{index + 1}</Text>
                    <View style={styles.ruleCopy}><Text style={styles.ruleTitle}>{rule.title}</Text><Text style={styles.ruleDescription}>{rule.description}</Text></View>
                  </View>
                ))}
                <Pressable onPress={() => navigation.navigate('CommunityRules', { communityId })} style={styles.fullRulesButton}><Text style={styles.fullRulesText}>View full guidelines</Text><Ionicons name="arrow-forward" size={19} color={colors.ink} /></Pressable>
              </>
            ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>

      <AppReportSheet
        visible={reportVisible}
        title="Report Community"
        description="Tell us why this community should be reviewed. Your report is confidential."
        onClose={() => setReportVisible(false)}
        onSubmit={(reason, details) => { void submitReport(reason, details); }}
      />
      <AppAlertModal visible={leaveConfirmVisible} title="Leave community?" message="You will lose access to this community room until you join again." confirmText="Leave" onConfirm={() => { void leave(); }} onClose={() => setLeaveConfirmVisible(false)} />
      <AppAlertModal visible={Boolean(alert)} title={alert?.title ?? ''} message={alert?.message ?? ''} onClose={() => setAlert(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.paper, flex: 1 }, content: { paddingBottom: 74 },
  hero: { height: 280, justifyContent: 'space-between', paddingHorizontal: 25, paddingTop: 54 }, heroShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(4,24,15,0.28)' },
  heroAction: { alignItems: 'center', backgroundColor: 'rgba(9,35,25,0.58)', borderRadius: 30, height: 56, justifyContent: 'center', width: 56 }, menuButton: { position: 'absolute', right: 25, top: 54 },
  menu: { backgroundColor: colors.white, borderRadius: 18, padding: 7, position: 'absolute', right: 24, shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 15, top: 112, width: 190, zIndex: 20 }, menuItem: { alignItems: 'center', flexDirection: 'row', gap: 9, padding: 12 }, menuText: { color: colors.ink, fontFamily: fonts.semiBold, fontSize: 12 }, menuDanger: { color: '#c73737', fontFamily: fonts.semiBold, fontSize: 12 },
  identity: { alignItems: 'center', backgroundColor: colors.white, paddingBottom: 24, paddingHorizontal: 24 }, communityAvatar: { borderColor: colors.white, borderRadius: 65, borderWidth: 7, height: 130, marginTop: -65, width: 130 }, name: { color: '#081126', fontFamily: fonts.extraBold, fontSize: 29, marginTop: 13, textAlign: 'center' }, memberMeta: { color: '#61728f', fontFamily: fonts.medium, fontSize: 15, marginTop: 5 },
  joinedButton: { alignItems: 'center', backgroundColor: '#e8fbef', borderColor: '#a9f4c8', borderRadius: 29, borderWidth: 1.5, flexDirection: 'row', gap: 10, height: 58, justifyContent: 'center', marginTop: 21, width: '100%' }, joinedText: { color: '#00c85a', fontFamily: fonts.bold, fontSize: 16 },
  joinButton: { alignItems: 'center', backgroundColor: colors.lime, borderRadius: 29, flexDirection: 'row', gap: 9, height: 58, justifyContent: 'center', marginTop: 21, width: '100%' }, joinText: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 15 }, disabled: { opacity: 0.55 },
  tabs: { backgroundColor: colors.white, borderBottomColor: '#e9edef', borderBottomWidth: 1, flexDirection: 'row', paddingHorizontal: 34 }, tab: { alignItems: 'center', flex: 1, paddingVertical: 18 }, activeTab: { borderBottomColor: colors.lime, borderBottomWidth: 3 }, tabText: { color: '#61728f', fontFamily: fonts.medium, fontSize: 15 }, activeTabText: { color: '#00c95a', fontFamily: fonts.bold },
  tabBody: { paddingHorizontal: 24, paddingTop: 27 }, bodyHeading: { color: '#0a1328', fontFamily: fonts.extraBold, fontSize: 22 }, aboutText: { color: '#425673', fontFamily: fonts.medium, fontSize: 15, lineHeight: 25, marginTop: 14 },
  infoRow: { alignItems: 'center', backgroundColor: colors.white, borderRadius: 20, flexDirection: 'row', marginTop: 12, padding: 14 }, infoIcon: { alignItems: 'center', backgroundColor: '#e7faef', borderRadius: 18, height: 38, justifyContent: 'center', marginRight: 12, width: 38 }, infoLabel: { color: '#839287', fontFamily: fonts.medium, fontSize: 10 }, infoValue: { color: colors.ink, fontFamily: fonts.bold, fontSize: 13, marginTop: 2 },
  announcementCard: { backgroundColor: colors.white, borderRadius: 25, marginTop: 18, padding: 18 }, cardTitleRow: { alignItems: 'center', flexDirection: 'row', gap: 10 }, rulesTitle: { color: '#0a1328', flex: 1, fontFamily: fonts.extraBold, fontSize: 17 }, announcement: { borderTopColor: '#edf2ef', borderTopWidth: 1, marginTop: 12, paddingTop: 12 }, announcementText: { color: '#3f5c4c', fontFamily: fonts.medium, fontSize: 12, lineHeight: 18 }, announcementDate: { color: '#91a09a', fontFamily: fonts.medium, fontSize: 9, marginTop: 5 },
  rulesPreview: { backgroundColor: colors.white, borderRadius: 25, marginTop: 18, padding: 18 }, previewRule: { alignItems: 'center', flexDirection: 'row', marginTop: 14 }, previewNumber: { backgroundColor: '#eef3f6', borderRadius: 16, color: '#60718e', fontFamily: fonts.bold, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 6 }, previewText: { color: '#3f506c', fontFamily: fonts.medium, fontSize: 13, marginLeft: 12 }, defaultNote: { color: '#84958c', fontFamily: fonts.medium, fontSize: 10, lineHeight: 16, marginTop: 14 },
  memberSearch: { alignItems: 'center', backgroundColor: colors.white, borderRadius: 28, flexDirection: 'row', height: 58, paddingHorizontal: 18 }, memberSearchInput: { color: colors.ink, flex: 1, fontFamily: fonts.medium, fontSize: 14, marginLeft: 10 }, memberList: { backgroundColor: colors.white, borderRadius: 26, marginTop: 18, overflow: 'hidden' }, memberRow: { alignItems: 'center', borderBottomColor: '#edf1f4', borderBottomWidth: 1, flexDirection: 'row', padding: 17 }, memberAvatar: { borderRadius: 28, height: 54, width: 54 }, memberAvatarFallback: { alignItems: 'center', backgroundColor: '#e4f7eb', borderRadius: 28, height: 54, justifyContent: 'center', width: 54 }, initials: { color: '#087d43', fontFamily: fonts.extraBold, fontSize: 14 }, memberCopy: { flex: 1, marginLeft: 13 }, memberNameRow: { alignItems: 'center', flexDirection: 'row' }, memberName: { color: '#081126', fontFamily: fonts.bold, fontSize: 15 }, adminBadge: { backgroundColor: '#e9fff1', borderColor: '#a7f1c4', borderRadius: 12, borderWidth: 1, color: '#00c85a', fontFamily: fonts.bold, fontSize: 8, marginLeft: 8, paddingHorizontal: 7, paddingVertical: 4 }, memberSub: { color: '#718198', fontFamily: fonts.medium, fontSize: 11, marginTop: 3 }, noMembers: { color: colors.muted, fontFamily: fonts.medium, padding: 28, textAlign: 'center' },
  rulesHeader: { alignItems: 'center', backgroundColor: colors.white, borderRadius: 28, padding: 24 }, rulesIcon: { alignItems: 'center', backgroundColor: '#e1f8eb', borderRadius: 18, height: 56, justifyContent: 'center', width: 56 }, rulesHeaderTitle: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 20, marginTop: 15 }, rulesHeaderText: { color: '#348b5d', fontFamily: fonts.medium, fontSize: 12, lineHeight: 19, marginTop: 7, textAlign: 'center' }, ruleCard: { alignItems: 'flex-start', backgroundColor: colors.white, borderRadius: 25, flexDirection: 'row', marginTop: 13, padding: 19 }, ruleNumber: { backgroundColor: '#e5f8ed', borderRadius: 20, color: '#00ae50', fontFamily: fonts.bold, overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 8 }, ruleCopy: { flex: 1, marginLeft: 14 }, ruleTitle: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 15 }, ruleDescription: { color: '#348b5d', fontFamily: fonts.medium, fontSize: 11, lineHeight: 18, marginTop: 5 }, fullRulesButton: { alignItems: 'center', backgroundColor: colors.lime, borderRadius: 24, flexDirection: 'row', gap: 9, height: 54, justifyContent: 'center', marginTop: 17 }, fullRulesText: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 13 },
  loadingState: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 30 }, stateText: { color: colors.muted, fontFamily: fonts.medium, fontSize: 13, marginTop: 12, textAlign: 'center' }, smallButton: { backgroundColor: colors.lime, borderRadius: 20, marginTop: 20, paddingHorizontal: 22, paddingVertical: 12 }, smallButtonText: { color: colors.ink, fontFamily: fonts.bold, fontSize: 12 },
});
