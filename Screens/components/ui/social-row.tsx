import { Pressable, Text, View } from 'react-native';

import AppIcon from './app-icon';
import { colors } from '../../styles/theme';

export default function SocialRow() {
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.line }} />
        <Text selectable style={{ color: colors.muted, fontSize: 12, fontWeight: '700' }}>
          or continue with
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.line }} />
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {[
          { label: 'Google', icon: 'logo-google' as const },
          { label: 'Apple', icon: 'logo-apple' as const },
        ].map((item) => (
          <Pressable
            accessibilityRole="button"
            key={item.label}
            style={{
              flex: 1,
              minHeight: 50,
              borderRadius: 16,
              backgroundColor: colors.white,
              borderWidth: 1,
              borderColor: colors.line,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
            }}
          >
            <AppIcon name={item.icon} color={colors.ink} size={16} />
            <Text selectable style={{ color: colors.ink, fontSize: 14, fontWeight: '800' }}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
