import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppAlertModal from '../../components/ui/app-alert-modal';
import { ApiError } from '../../services/api/client';
import { communitiesApi } from '../../services/api/communities.api';
import { colors, fonts } from '../../styles/theme';
import type { GetCommunitiesIdRulesResponse } from '../../types/api.generated';
import type { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'CommunityRules'>;
type CommunityRules = GetCommunitiesIdRulesResponse['data']['rules'];

export default function CommunityRulesScreen({ navigation, route }: Props) {
  const [communityName, setCommunityName] = useState('Community');
  const [rules, setRules] = useState<CommunityRules | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      communitiesApi.get(route.params.communityId, controller.signal),
      communitiesApi.rules(route.params.communityId, controller.signal),
    ])
      .then(([communityResponse, rulesResponse]) => {
        setCommunityName(communityResponse.data.community.name);
        setRules(rulesResponse.data.rules);
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof ApiError && requestError.code === 'REQUEST_CANCELLED') return;
        setError(requestError instanceof ApiError ? requestError.message : 'Unable to load the community rules.');
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [route.params.communityId]);

  return <>
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back}><Ionicons name="arrow-back" size={25} color={colors.ink} /></Pressable>
        <Text style={styles.headerTitle}>Community Rules</Text>
        <View style={styles.headerSpacer} />
      </View>
      {loading ? <View style={styles.loading}><ActivityIndicator color="#00b955" /></View> : rules ? <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introCard}>
          <View style={styles.introIcon}><Ionicons name="hammer" size={31} color="#00ad50" /></View>
          <Text style={styles.introTitle}>{communityName} Guidelines</Text>
          <Text style={styles.introText}>{rules.introduction}</Text>
        </View>
        {rules.rules.map((rule, index) => <View key={rule._id} style={styles.ruleCard}>
          <View style={styles.ruleNumber}><Text style={styles.ruleNumberText}>{index + 1}</Text></View>
          <View style={styles.ruleCopy}><Text style={styles.ruleTitle}>{rule.title}</Text><Text style={styles.ruleText}>{rule.description}</Text></View>
        </View>)}
        <View style={styles.consequences}>
          <View style={styles.consequenceHeader}><Ionicons name="warning-outline" size={25} color={colors.lime} /><Text style={styles.consequenceTitle}>Consequences</Text></View>
          <Text style={styles.consequenceIntro}>Not following these guidelines may result in:</Text>
          {rules.consequences.map((item) => <View key={item} style={styles.consequenceRow}><View style={styles.bullet}><Text style={styles.bulletText}>!</Text></View><Text style={styles.consequenceText}>{item}</Text></View>)}
        </View>
      </ScrollView> : <View style={styles.loading}><Text style={styles.unavailable}>Community rules are unavailable.</Text></View>}
    </SafeAreaView>
    <AppAlertModal visible={Boolean(error)} title="Rules unavailable" message={error ?? ''} onClose={() => setError(null)} />
  </>;
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.paper, flex: 1 }, header: { alignItems: 'center', backgroundColor: colors.white, flexDirection: 'row', height: 68, justifyContent: 'space-between', paddingHorizontal: 24 }, back: { alignItems: 'center', borderColor: '#eff3f0', borderRadius: 22, borderWidth: 1, height: 44, justifyContent: 'center', width: 44 }, headerTitle: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 21 }, headerSpacer: { width: 44 }, content: { gap: 16, padding: 25, paddingBottom: 55 }, loading: { alignItems: 'center', flex: 1, justifyContent: 'center' }, unavailable: { color: colors.muted, fontFamily: fonts.medium }, introCard: { alignItems: 'center', backgroundColor: colors.white, borderRadius: 34, padding: 26 }, introIcon: { alignItems: 'center', backgroundColor: '#e1f7e9', borderRadius: 20, height: 64, justifyContent: 'center', width: 64 }, introTitle: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 20, marginTop: 17, textAlign: 'center' }, introText: { color: '#318d5b', fontFamily: fonts.medium, fontSize: 13, lineHeight: 20, marginTop: 7, textAlign: 'center' }, ruleCard: { alignItems: 'flex-start', backgroundColor: colors.white, borderRadius: 30, flexDirection: 'row', padding: 24 }, ruleNumber: { alignItems: 'center', backgroundColor: '#e4f8ec', borderRadius: 21, height: 44, justifyContent: 'center', width: 44 }, ruleNumberText: { color: '#00ad50', fontFamily: fonts.bold, fontSize: 16 }, ruleCopy: { flex: 1, marginLeft: 16 }, ruleTitle: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 17 }, ruleText: { color: '#298b56', fontFamily: fonts.medium, fontSize: 12, lineHeight: 19, marginTop: 6 }, consequences: { backgroundColor: '#072b1d', borderRadius: 36, marginTop: 8, padding: 26 }, consequenceHeader: { alignItems: 'center', flexDirection: 'row', gap: 12 }, consequenceTitle: { color: colors.white, fontFamily: fonts.extraBold, fontSize: 18 }, consequenceIntro: { color: '#7e998c', fontFamily: fonts.medium, fontSize: 12, lineHeight: 18, marginTop: 19 }, consequenceRow: { alignItems: 'flex-start', flexDirection: 'row', marginTop: 17 }, bullet: { alignItems: 'center', backgroundColor: '#064d2c', borderRadius: 14, height: 26, justifyContent: 'center', width: 26 }, bulletText: { color: colors.lime, fontFamily: fonts.extraBold }, consequenceText: { color: colors.white, flex: 1, fontFamily: fonts.medium, fontSize: 12, lineHeight: 18, marginLeft: 12 },
});
