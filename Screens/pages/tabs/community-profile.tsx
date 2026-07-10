import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import {
  Image,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getJoinedCommunityById } from '../../data/community';
import { getCommunityProfileById, type CommunityMember } from '../../data/community-profile';
import { colors, fonts } from '../../styles/theme';
import type { RootStackNavigationProp, RootStackRouteProp } from '../../types/navigation';

type Tab = 'About' | 'Members' | 'Rules';

const tabs: Tab[] = ['About', 'Members', 'Rules'];

function Member({ member }: { member: CommunityMember }) {
  return (
    <View style={styles.member}>
      <Image source={{ uri: member.avatar }} style={styles.memberAvatar} />
      <View style={styles.memberCopy}>
        <View style={styles.memberNameRow}>
          <Text style={styles.memberName}>{member.name}</Text>
          {member.isAdmin ? <Text style={styles.adminLabel}>ADMIN</Text> : null}
        </View>
        <Text style={styles.memberSubtitle}>{member.subtitle}</Text>
      </View>
      <Ionicons name="ellipsis-horizontal" size={18} color={colors.softMuted} />
    </View>
  );
}

export default function CommunityProfileScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();
  const route = useRoute<RootStackRouteProp<'CommunityProfile'>>();
  const joined = getJoinedCommunityById(route.params.communityId);
  const profile = getCommunityProfileById(route.params.communityId);
  const [activeTab, setActiveTab] = useState<Tab>('About');
  const [query, setQuery] = useState('');

  const members = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();
    return (profile?.members ?? []).filter((member) =>
      !normalizedQuery || (member.name + ' ' + member.subtitle).toLowerCase().includes(normalizedQuery),
    );
  }, [profile?.members, query]);

  if (!joined || !profile) return null;

  const rules = profile.rules ?? profile.consequences.map((body, index) => ({
    title: `Community rule ${index + 1}`,
    body,
  }));

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <ImageBackground source={{ uri: profile.coverImage }} style={styles.hero}>
          <View style={styles.heroShade} />
          <Pressable accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={Platform.OS === 'android' ? 24 : 30} color={colors.white} />
          </Pressable>
        </ImageBackground>

        <View style={styles.identity}>
          <Image source={{ uri: profile.avatarImage }} style={styles.avatar} />
          <Text style={styles.title}>{joined.name}</Text>
          <Text style={styles.subtitle}>{joined.membersLabel} {'\u2022'} {profile.visibilityLabel}</Text>
          <View style={styles.joinedButton}>
            <Ionicons name="checkmark-circle" size={18} color="#0ba653" />
            <Text style={styles.joinedText}>{profile.joinedLabel}</Text>
          </View>
        </View>

        <View style={styles.tabs}>
          {tabs.map((tab) => (
            <Pressable key={tab} style={styles.tab} onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
              {activeTab === tab ? <View style={styles.activeLine} /> : null}
            </Pressable>
          ))}
        </View>

        <View style={styles.body}>
          {activeTab === 'About' ? (
            <>
              <Text style={styles.heading}>About Us</Text>
              <Text style={styles.about}>{profile.about}</Text>

              <Text style={styles.subheading}>What to expect</Text>
              <View style={styles.highlightList}>
                {(profile.aboutHighlights ?? [
                  { icon: 'calendar-outline' as const, title: 'Regular activities', body: 'Meetups, discussions, and member-led community sessions.' },
                  { icon: 'heart-outline' as const, title: 'Welcoming community', body: 'A supportive space to connect, contribute, and learn together.' },
                ]).map((item) => (
                  <View key={item.title} style={styles.highlightCard}>
                    <View style={styles.highlightIcon}>
                      <Ionicons name={item.icon} size={20} color="#0ba653" />
                    </View>
                    <View style={styles.highlightCopy}>
                      <Text style={styles.highlightTitle}>{item.title}</Text>
                      <Text style={styles.highlightBody}>{item.body}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          {activeTab === 'Members' ? (
            <>
              <View style={styles.membersHeader}>
                <Text style={styles.heading}>Members</Text>
                <Text style={styles.memberCount}>{profile.members.length} shown</Text>
              </View>
              <View style={styles.search}>
                <Ionicons name="search-outline" size={20} color={colors.softMuted} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search members..."
                  placeholderTextColor={colors.softMuted}
                  style={styles.input}
                />
              </View>
              <View style={styles.memberCard}>
                {members.length ? members.map((member) => <Member key={member.id} member={member} />) : (
                  <Text style={styles.empty}>No members found</Text>
                )}
              </View>
            </>
          ) : null}

          {activeTab === 'Rules' ? (
            <>
              <View style={styles.rulesIntro}>
                <View style={styles.rulesIcon}>
                  <Ionicons name="shield-checkmark-outline" size={23} color="#0ba653" />
                </View>
                <Text style={styles.ruleIntroTitle}>{profile.rulesIntroTitle}</Text>
                <Text style={styles.ruleIntroBody}>{profile.rulesIntroBody}</Text>
              </View>

              <View style={styles.ruleList}>
                {rules.map((rule, index) => (
                  <View style={styles.ruleCard} key={rule.title}>
                    <Text style={styles.ruleNumber}>{index + 1}</Text>
                    <View style={styles.ruleCopy}>
                      <Text style={styles.ruleTitle}>{rule.title}</Text>
                      <Text style={styles.ruleBody}>{rule.body}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.consequenceCard}>
                <Text style={styles.consequenceTitle}>If rules are broken</Text>
                {profile.consequences.map((item) => (
                  <View key={item} style={styles.consequenceRow}>
                    <View style={styles.bullet} />
                    <Text style={styles.consequenceText}>{item}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const android = Platform.OS === 'android';

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { backgroundColor: colors.paper, paddingBottom: 24 },
  hero: { height: android ? 218 : 300 },
  heroShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)' },
  backButton: { position: 'absolute', top: android ? 14 : 28, left: android ? 18 : 28, width: android ? 44 : 58, height: android ? 44 : 58, borderRadius: 30, backgroundColor: 'rgba(7,31,23,0.58)', alignItems: 'center', justifyContent: 'center' },
  identity: { alignItems: 'center', backgroundColor: colors.white, paddingBottom: android ? 16 : 20, elevation: android ? 2 : 0 },
  avatar: { width: android ? 104 : 150, height: android ? 104 : 150, borderRadius: 80, borderWidth: android ? 4 : 5, borderColor: colors.white, marginTop: android ? -52 : -76 },
  title: { fontFamily: fonts.extraBold, color: colors.ink, fontSize: android ? 25 : 32, marginTop: android ? 12 : 18 },
  subtitle: { fontFamily: fonts.medium, color: colors.muted, fontSize: android ? 14 : 19, marginTop: 4 },
  joinedButton: { height: android ? 46 : 56, width: '88%', marginTop: android ? 14 : 18, borderRadius: 28, backgroundColor: colors.paleGreen, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  joinedText: { fontFamily: fonts.bold, color: '#0b9f4d', fontSize: android ? 15 : 18 },
  tabs: { height: android ? 58 : 70, backgroundColor: colors.white, flexDirection: 'row', borderTopColor: colors.line, borderTopWidth: 1, elevation: android ? 4 : 0 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabText: { fontFamily: fonts.medium, color: colors.muted, fontSize: android ? 14 : 17 },
  activeTabText: { fontFamily: fonts.bold, color: '#0ba653' },
  activeLine: { position: 'absolute', bottom: 0, height: 3, width: '52%', backgroundColor: colors.lime },
  body: { padding: android ? 18 : 24 },
  heading: { fontFamily: fonts.extraBold, color: colors.ink, fontSize: android ? 21 : 25 },
  subheading: { fontFamily: fonts.extraBold, color: colors.ink, fontSize: android ? 18 : 21, marginTop: 26 },
  about: { fontFamily: fonts.medium, color: colors.muted, fontSize: android ? 14 : 16, lineHeight: android ? 23 : 27, marginTop: 12 },
  highlightList: { gap: 12, marginTop: 14 },
  highlightCard: { backgroundColor: colors.white, borderRadius: 20, padding: 16, flexDirection: 'row', borderColor: colors.line, borderWidth: 1, elevation: android ? 2 : 0 },
  highlightIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.paleGreen, alignItems: 'center', justifyContent: 'center' },
  highlightCopy: { flex: 1, marginLeft: 13 },
  highlightTitle: { fontFamily: fonts.bold, color: colors.ink, fontSize: 15 },
  highlightBody: { fontFamily: fonts.medium, color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 4 },
  membersHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  memberCount: { fontFamily: fonts.bold, color: '#329160', fontSize: 13 },
  search: { height: android ? 50 : 56, borderRadius: 28, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, marginBottom: 14, borderColor: colors.line, borderWidth: 1, elevation: android ? 3 : 0 },
  input: { flex: 1, marginLeft: 10, fontFamily: fonts.medium, color: colors.ink, fontSize: 14, paddingVertical: 0 },
  memberCard: { backgroundColor: colors.white, borderRadius: 22, overflow: 'hidden', elevation: android ? 2 : 0 },
  member: { minHeight: android ? 68 : 76, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.line },
  memberAvatar: { width: android ? 42 : 46, height: android ? 42 : 46, borderRadius: 24 },
  memberCopy: { flex: 1, marginLeft: 13 },
  memberNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  memberName: { fontFamily: fonts.bold, color: colors.ink, fontSize: android ? 14 : 16 },
  adminLabel: { fontFamily: fonts.extraBold, color: '#0b9f4d', fontSize: 9, backgroundColor: colors.paleGreen, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  memberSubtitle: { fontFamily: fonts.medium, color: colors.muted, fontSize: 12, marginTop: 3 },
  empty: { padding: 26, textAlign: 'center', fontFamily: fonts.medium, color: colors.muted },
  rulesIntro: { backgroundColor: colors.white, borderRadius: 22, padding: android ? 18 : 24, alignItems: 'center', borderColor: colors.line, borderWidth: 1, elevation: android ? 2 : 0 },
  rulesIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.paleGreen, alignItems: 'center', justifyContent: 'center' },
  ruleIntroTitle: { fontFamily: fonts.bold, color: colors.ink, fontSize: android ? 17 : 19, marginTop: 12, textAlign: 'center' },
  ruleIntroBody: { fontFamily: fonts.medium, color: colors.muted, fontSize: 13, lineHeight: 21, marginTop: 7, textAlign: 'center' },
  ruleList: { gap: 12, marginTop: 14 },
  ruleCard: { backgroundColor: colors.white, borderRadius: 20, padding: android ? 16 : 20, flexDirection: 'row', elevation: android ? 2 : 0 },
  ruleNumber: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.paleGreen, textAlign: 'center', paddingTop: 8, color: '#0b9f4d', fontFamily: fonts.bold, fontSize: 16, marginRight: 13 },
  ruleCopy: { flex: 1 },
  ruleTitle: { fontFamily: fonts.bold, color: colors.ink, fontSize: 14 },
  ruleBody: { fontFamily: fonts.medium, color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 4 },
  consequenceCard: { backgroundColor: '#edfff4', borderRadius: 20, padding: 18, marginTop: 18 },
  consequenceTitle: { fontFamily: fonts.extraBold, color: colors.ink, fontSize: 15, marginBottom: 10 },
  consequenceRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 7 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#0ba653', marginTop: 7, marginRight: 10 },
  consequenceText: { flex: 1, fontFamily: fonts.medium, color: '#277a4c', fontSize: 13, lineHeight: 20 },
});
