import { Pressable, Text, View } from 'react-native';

import AppIcon from './app-icon';
import { colors, fonts } from '../../styles/theme';

type Props = {
  onBack?: () => void;
  center?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function TopBar({ onBack, center, actionLabel, onAction }: Props) {
  return (
    <View
      style={{
        minHeight: 38,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Pressable accessibilityRole="button" onPress={onBack} style={{ width: 60 }}>
        {onBack ? (
          <AppIcon name="chevron-back" color={colors.ink} size={24} />
        ) : null}
      </Pressable>
      <Text selectable style={{ color: colors.softMuted, fontSize: 11, fontFamily: fonts.extraBold }}>
        {center}
      </Text>
      <Pressable accessibilityRole="button" onPress={onAction} style={{ width: 60, alignItems: 'flex-end' }}>
        {actionLabel ? (
          <Text selectable style={{ color: colors.moss, fontSize: 12, fontFamily: fonts.bold }}>
            {actionLabel}
          </Text>
        ) : null}
      </Pressable>
    </View>
  );
}
