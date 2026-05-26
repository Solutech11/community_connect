import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../../styles/theme';

export default function PendingScreen({ title }: { title: string }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="construct" size={30} color={colors.lime} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Pending. We will build this screen next.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 28,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: '#dcffe8',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  title: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: '900',
    marginTop: 18,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    textAlign: 'center',
  },
});
