import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import { ImageBackground, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppAlertModal from '../../components/ui/app-alert-modal';
import { useAuth } from '../../hooks/use-auth';
import { ApiError, createIdempotencyKey } from '../../services/api/client';
import { communitiesApi } from '../../services/api/communities.api';
import { colors, fonts } from '../../styles/theme';
import type { GetCommunitiesIdResponse, GetCommunitiesIdMembersResponse } from '../../types/api.generated';
import type { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'CommunityProfile'>;
type Community = GetCommunitiesIdResponse['data']['community'];
type Member = GetCommunitiesIdMembersResponse['data']['members'][number];
const hero = 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1400&q=88';

export default function CommunityProfileScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ title: string; message: string } | null>(null);
  const idempotencyKey = useRef(createIdempotencyKey()).current;

  const load = async () => {
    const [detailResponse, memberResponse] = await Promise.all([
      communitiesApi.get(route.params.communityId),
      communitiesApi.members(route.params.communityId),
    ]);
    setCommunity(detailResponse.data.community);
    setMembers(memberResponse.data.members);
  };

  useEffect(() => {
    load().catch((error: unknown) => setAlert({ title: 'Community unavailable', message: error instanceof ApiError ? error.message : 'Unable to load this community.' }));
  }, [route.params.communityId]);

  const joined = Boolean(user && community?.members.includes(user._id));
  const isOwner = Boolean(user && community?.ownerId === user._id);
  const joinOrVerify = async () => {
    if (!community || submitting) return;
    setSubmitting(true);
    try {
      if (orderNumber) {
        const verification = await communitiesApi.verifyMembershipOrder(orderNumber);
        if (verification.data.order.status !== 'paid') {
          setAlert({ title: 'Payment not confirmed', message: 'Complete payment in Paystack, then verify again.' });
          return;
        }
        await load();
        setOrderNumber(null);
        setAlert({ title: 'Welcome!', message: `You are now a member of ${community.name}.` });
      } else if (community.membershipType === 'free') {
        const response = await communitiesApi.join(community._id);
        await load();
        setAlert({ title: 'Joined community', message: response.message });
      } else {
        const response = await communitiesApi.createMembershipOrder(community._id, idempotencyKey);
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
    if (!community) return;
    setSubmitting(true);
    try {
      await communitiesApi.leave(community._id);
      await load();
    } catch (error) {
      setAlert({ title: 'Unable to leave', message: error instanceof ApiError ? error.message : 'Please try again.' });
    } finally { setSubmitting(false); }
  };

  if (!community) return <SafeAreaView style={styles.safe}><Text style={styles.state}>Loading community...</Text><AppAlertModal visible={Boolean(alert)} title={alert?.title ?? ''} message={alert?.message ?? ''} onClose={() => setAlert(null)} /></SafeAreaView>;
  return (
    <>
      <SafeAreaView style={styles.safe} edges={[]}>
        <ScrollView contentContainerStyle={styles.content}>
          <ImageBackground source={{ uri: hero }} style={styles.hero} imageStyle={styles.heroImage}>
            <Pressable onPress={() => navigation.goBack()} style={styles.back}><Ionicons name="arrow-back" size={24} color={colors.ink} /></Pressable>
          </ImageBackground>
          <Text style={styles.name}>{community.name}</Text>
          <Text style={styles.category}>{community.category} - {community.lga}, {community.state}</Text>
          <Text style={styles.description}>{community.description}</Text>
          {isOwner ? <Pressable onPress={() => navigation.navigate("EditCommunity", { communityId: community._id })} style={styles.editCommunity}><Ionicons color="#078d45" name="create-outline" size={18} /><Text style={styles.editCommunityText}>Edit community</Text></Pressable> : null}
          <View style={styles.stat}><Text style={styles.statValue}>{members.length}</Text><Text style={styles.statLabel}>Members</Text><Text style={styles.statValue}>{community.membershipType === 'free' ? 'Free' : `NGN ${Math.round(community.membershipPriceKobo / 100).toLocaleString()}`}</Text><Text style={styles.statLabel}>Membership</Text></View>
          <Text style={styles.heading}>Recent members</Text>
          {members.slice(0, 8).map((member) => <View key={member._id} style={styles.member}><View style={styles.avatar}><Text style={styles.initials}>{member.firstName[0]}{member.lastName[0]}</Text></View><View><Text style={styles.memberName}>{member.firstName} {member.lastName}</Text><Text style={styles.memberMeta}>{member.state}</Text></View></View>)}
          <Pressable disabled={submitting} onPress={joined ? leave : joinOrVerify} style={[styles.join, joined && styles.leave, submitting && styles.disabled]}><Text style={styles.joinText}>{submitting ? 'Please wait...' : joined ? 'Leave Community' : orderNumber ? 'Verify Membership Payment' : 'Join Community'}</Text></Pressable>
        </ScrollView>
      </SafeAreaView>
      <AppAlertModal visible={Boolean(alert)} title={alert?.title ?? ''} message={alert?.message ?? ''} onClose={() => setAlert(null)} />
    </>
  );
}

const styles = StyleSheet.create({ safe: { backgroundColor: colors.paper, flex: 1 }, content: { paddingBottom: 50, paddingHorizontal: 24 }, hero: { height: 270, marginHorizontal: -24, padding: 24 }, heroImage: { borderBottomLeftRadius: 36, borderBottomRightRadius: 36 }, back: { alignItems: 'center', backgroundColor: colors.white, borderRadius: 24, height: 48, justifyContent: 'center', width: 48 }, name: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 30, marginTop: 24 }, category: { color: '#399760', fontFamily: fonts.bold, fontSize: 14, marginTop: 7 }, description: { color: colors.muted, fontFamily: fonts.medium, fontSize: 15, lineHeight: 24, marginTop: 18 }, editCommunity: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#e9f8f0', borderRadius: 18, flexDirection: 'row', gap: 7, marginTop: 14, paddingHorizontal: 14, paddingVertical: 10 }, editCommunityText: { color: '#078d45', fontFamily: fonts.bold, fontSize: 11 }, stat: { alignItems: 'center', backgroundColor: colors.white, borderRadius: 28, flexDirection: 'row', gap: 12, marginTop: 24, padding: 20 }, statValue: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 18 }, statLabel: { color: '#399760', flex: 1, fontFamily: fonts.medium, fontSize: 12 }, heading: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 20, marginTop: 28 }, member: { alignItems: 'center', backgroundColor: colors.white, borderRadius: 22, flexDirection: 'row', marginTop: 12, padding: 14 }, avatar: { alignItems: 'center', backgroundColor: '#e7faef', borderRadius: 23, height: 46, justifyContent: 'center', marginRight: 12, width: 46 }, initials: { color: '#08a951', fontFamily: fonts.extraBold }, memberName: { color: colors.ink, fontFamily: fonts.bold, fontSize: 15 }, memberMeta: { color: colors.muted, fontFamily: fonts.medium, fontSize: 12, marginTop: 3 }, join: { alignItems: 'center', backgroundColor: colors.lime, borderRadius: 30, height: 62, justifyContent: 'center', marginTop: 30 }, leave: { backgroundColor: '#ffe4e4' }, disabled: { opacity: 0.6 }, joinText: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 17 }, state: { color: colors.muted, fontFamily: fonts.medium, marginTop: 80, textAlign: 'center' } });

