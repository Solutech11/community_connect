import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getEventById } from '../../data/events';
import { colors, fonts } from '../../styles/theme';
import type { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'PaymentSuccess'>;

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

export default function PaymentSuccessScreen({ navigation, route }: Props) {
  const event = getEventById(route.params.eventId);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.ornamentOne} />
        <View style={styles.ornamentTwo} />
        <View style={styles.ornamentThree} />

        <View style={styles.badgeOuter}>
          <View style={styles.badgeInner}>
            <Ionicons name="checkmark" size={44} color={colors.ink} />
          </View>
        </View>

        <Text style={styles.title}>Congratulations!</Text>
        <Text style={styles.subtitle}>Your tickets have been successfully reserved and your payment is confirmed.</Text>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>EVENT</Text>
          <Text style={styles.summaryTitle}>{event?.title ?? 'Selected Event'}</Text>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Tickets</Text>
            <Text style={styles.summaryValue}>{route.params.quantity}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Amount Paid</Text>
            <Text style={styles.summaryValue}>{formatCurrency(route.params.total)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Status</Text>
            <Text style={styles.summaryValueSuccess}>Confirmed</Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomActions}>
        <Pressable onPress={() => navigation.navigate('Home')} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Back to Home</Text>
        </Pressable>
        <Pressable onPress={() => navigation.popToTop()} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Done</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.paper,
    flex: 1,
  },
  container: {
    alignItems: 'center',
    flex: 1,
    overflow: 'hidden',
    paddingHorizontal: 28,
    paddingTop: 52,
  },
  ornamentOne: {
    backgroundColor: '#dfffea',
    borderRadius: 999,
    height: 180,
    position: 'absolute',
    right: -60,
    top: -10,
    width: 180,
  },
  ornamentTwo: {
    backgroundColor: '#eefaf3',
    borderRadius: 999,
    height: 120,
    left: -35,
    position: 'absolute',
    top: 220,
    width: 120,
  },
  ornamentThree: {
    backgroundColor: '#f3fff7',
    borderRadius: 999,
    bottom: 120,
    height: 220,
    position: 'absolute',
    right: -90,
    width: 220,
  },
  badgeOuter: {
    alignItems: 'center',
    backgroundColor: '#dbffea',
    borderRadius: 999,
    height: 130,
    justifyContent: 'center',
    width: 130,
  },
  badgeInner: {
    alignItems: 'center',
    backgroundColor: colors.lime,
    borderRadius: 999,
    height: 92,
    justifyContent: 'center',
    width: 92,
  },
  title: {
    color: '#0f1734',
    fontFamily: fonts.extraBold,
    fontSize: 34,
    letterSpacing: -0.9,
    marginTop: 28,
  },
  subtitle: {
    color: '#66758c',
    fontFamily: fonts.medium,
    fontSize: 17,
    lineHeight: 26,
    marginTop: 14,
    paddingHorizontal: 18,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: 34,
    marginTop: 36,
    paddingHorizontal: 24,
    paddingVertical: 24,
    width: '100%',
  },
  summaryLabel: {
    color: colors.lime,
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  summaryTitle: {
    color: '#0f1734',
    fontFamily: fonts.extraBold,
    fontSize: 24,
    marginTop: 10,
  },
  summaryDivider: {
    backgroundColor: '#edf1f5',
    height: 1,
    marginVertical: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  summaryKey: {
    color: '#66758c',
    fontFamily: fonts.medium,
    fontSize: 16,
  },
  summaryValue: {
    color: '#0f1734',
    fontFamily: fonts.extraBold,
    fontSize: 17,
  },
  summaryValueSuccess: {
    color: '#18c964',
    fontFamily: fonts.extraBold,
    fontSize: 17,
  },
  bottomActions: {
    paddingBottom: 26,
    paddingHorizontal: 28,
    paddingTop: 12,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.lime,
    borderRadius: 30,
    height: 72,
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 20,
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: '#65758c',
    fontFamily: fonts.bold,
    fontSize: 16,
  },
});