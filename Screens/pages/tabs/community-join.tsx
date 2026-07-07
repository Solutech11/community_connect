import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getCommunityById } from '../../data/community';
import { lightTap as tapFeedback } from '../../hooks/haptics';
import { colors, fonts } from '../../styles/theme';
import type { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'CommunityJoin'>;

function StatCard({ icon, value, label }: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIconWrap}>
        <Ionicons name={icon} size={24} color="#12bc61" />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function GuidelineCard({ icon, title, body }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }) {
  return (
    <View style={styles.guidelineCard}>
      <View style={styles.guidelineIconWrap}>
        <Ionicons name={icon} size={24} color="#12bc61" />
      </View>
      <View style={styles.guidelineCopy}>
        <Text style={styles.guidelineTitle}>{title}</Text>
        <Text style={styles.guidelineBody}>{body}</Text>
      </View>
    </View>
  );
}

export default function CommunityJoinScreen({ navigation, route }: Props) {
  const community = getCommunityById(route.params.communityId);

  if (!community) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.missingWrap}>
          <Text style={styles.missingTitle}>Community not found</Text>
          <Pressable onPress={() => navigation.goBack()} style={styles.primaryAction}>
            <Text style={styles.primaryActionText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isPaid = community.accessType === 'paid';
  const isAccessKey = community.accessType === 'access_key';
  const actionLabel = isPaid ? `Pay ${community.accessFee} to Join` : 'Join Group';
  const actionIcon = isPaid ? 'card-outline' : 'person-add-outline';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" hitSlop={10} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#12bc61" />
        </Pressable>
        <Text style={styles.headerTitle}>{community.name}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <ImageBackground source={{ uri: community.image }} style={styles.hero} imageStyle={styles.heroRadius}>
          <View style={styles.heroShade} />
          <View style={styles.heroCopy}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>{community.badgeLabel}</Text>
            </View>
            <Text style={styles.heroTitle}>{community.name}</Text>
          </View>
        </ImageBackground>

        <Text style={styles.description}>{community.description}</Text>

        <View style={styles.statsRow}>
          <StatCard icon="people-outline" value={community.membersLabel} label="Active Members" />
          <StatCard icon="calendar-outline" value={community.eventsLabel} label="Upcoming Events" />
        </View>

        {isAccessKey ? (
          <View style={styles.codeSection}>
            <Text style={styles.codeLabel}>JOINING CODE</Text>
            <View style={styles.codeInputWrap}>
              <Ionicons name="key-outline" size={20} color="#44a46d" />
              <TextInput placeholder="Enter Code" placeholderTextColor="#64a17f" style={styles.codeInput} />
            </View>
            <Pressable onPress={tapFeedback}>
              <Text style={styles.requestAccessText}>{community.accessPrompt}</Text>
            </Pressable>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Community Guidelines</Text>

        <View style={styles.guidelineList}>
          {community.guidelines.map((rule) => (
            <GuidelineCard key={rule.id} icon={rule.icon} title={rule.title} body={rule.body} />
          ))}
        </View>

        <Pressable onPress={tapFeedback}>
          <Text style={styles.fullRulesText}>View Full Rules</Text>
        </Pressable>

        {isPaid ? (
          <View style={styles.feeCard}>
            <View style={styles.feeIconWrap}>
              <Ionicons name="card-outline" size={24} color={colors.white} />
            </View>
            <View style={styles.feeCopy}>
              <Text style={styles.feeTitle}>MEMBERSHIP FEE</Text>
              <Text style={styles.feeNote}>{community.accessFeeNote}</Text>
            </View>
            <Text style={styles.feeAmount}>{community.accessFee}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.stickyActionWrap}>
        <Pressable
          accessibilityRole="button"
          onPress={tapFeedback}
          style={({ pressed }) => [styles.primaryAction, styles.stickyAction, pressed && styles.pressed]}
        >
          <Ionicons name={actionIcon} size={24} color={colors.white} />
          <Text style={styles.primaryActionText}>{actionLabel}</Text>
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
  header: {
    alignItems: 'center',
    backgroundColor: colors.paper,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 24,
  },
  headerSpacer: {
    width: 28,
  },
  content: {
    paddingBottom: 168,
  },
  hero: {
    height: 420,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  heroRadius: {
    borderBottomLeftRadius: 52,
    borderBottomRightRadius: 52,
  },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.16)',
  },
  heroCopy: {
    paddingBottom: 26,
    paddingHorizontal: 30,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  heroBadgeText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  heroTitle: {
    color: colors.white,
    fontFamily: fonts.extraBold,
    fontSize: 28,
    marginTop: 10,
  },
  description: {
    color: colors.ink,
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 28,
    paddingHorizontal: 30,
    paddingTop: 30,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 18,
    paddingHorizontal: 30,
    paddingTop: 28,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: colors.white,
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 18,
  },
  statIconWrap: {
    alignItems: 'center',
    backgroundColor: '#e8f8ef',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  statValue: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 20,
    marginTop: 14,
  },
  statLabel: {
    color: '#36a061',
    fontFamily: fonts.bold,
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  codeSection: {
    paddingHorizontal: 30,
    paddingTop: 26,
  },
  codeLabel: {
    color: '#33a05f',
    fontFamily: fonts.bold,
    fontSize: 15,
    marginBottom: 12,
  },
  codeInputWrap: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: '#e4ece7',
    borderRadius: 30,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    height: 70,
    paddingHorizontal: 22,
  },
  codeInput: {
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 16,
  },
  requestAccessText: {
    color: '#06be55',
    fontFamily: fonts.bold,
    fontSize: 14,
    marginTop: 18,
    textAlign: 'center',
  },
  sectionTitle: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 22,
    paddingHorizontal: 30,
    paddingTop: 30,
  },
  primaryAction: {
    alignItems: 'center',
    backgroundColor: '#14bd53',
    borderRadius: 30,
    flexDirection: 'row',
    gap: 10,
    height: 70,
    justifyContent: 'center',
    marginHorizontal: 30,
    marginTop: 10,
  },
  stickyActionWrap: {
    backgroundColor: 'rgba(247, 251, 249, 0.96)',
    borderTopColor: '#e4ece7',
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    paddingBottom: 18,
    paddingTop: 10,
    position: 'absolute',
    right: 0,
  },
  stickyAction: {
    marginTop: 0,
    shadowColor: '#83f3ad',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
  },
  primaryActionText: {
    color: colors.white,
    fontFamily: fonts.extraBold,
    fontSize: 18,
  },
  guidelineList: {
    gap: 18,
    paddingHorizontal: 30,
    paddingTop: 18,
  },
  guidelineCard: {
    backgroundColor: colors.white,
    flexDirection: 'row',
    gap: 18,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  guidelineIconWrap: {
    alignItems: 'center',
    borderColor: '#d4e6da',
    borderRadius: 24,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  guidelineCopy: {
    flex: 1,
  },
  guidelineTitle: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 14,
    marginBottom: 4,
  },
  guidelineBody: {
    color: '#2f9658',
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 24,
  },
  fullRulesText: {
    color: '#06be55',
    fontFamily: fonts.bold,
    fontSize: 14,
    paddingTop: 24,
    textAlign: 'center',
  },
  feeCard: {
    alignItems: 'center',
    borderColor: '#b8e6ca',
    borderWidth: 1,
    flexDirection: 'row',
    marginHorizontal: 28,
    marginTop: 28,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  feeIconWrap: {
    alignItems: 'center',
    backgroundColor: '#14bd53',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  feeCopy: {
    flex: 1,
    paddingHorizontal: 14,
  },
  feeTitle: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 14,
  },
  feeNote: {
    color: '#34a160',
    fontFamily: fonts.medium,
    fontSize: 14,
    marginTop: 2,
  },
  feeAmount: {
    color: '#14bd53',
    fontFamily: fonts.extraBold,
    fontSize: 22,
  },
  missingWrap: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  missingTitle: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 22,
    marginBottom: 20,
  },
  pressed: {
    opacity: 0.86,
  },
});
