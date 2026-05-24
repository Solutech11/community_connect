import { Pressable, Text } from 'react-native';

import AppIcon from './app-icon';
import { lightTap } from './haptics';
import { colors } from './theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
};

export default function PrimaryButton({ label, onPress, variant = 'primary' }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={async () => {
        await lightTap();
        onPress();
      }}
      style={({ pressed }) => ({
        minHeight: 56,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 20,
        backgroundColor:
          variant === 'primary' ? (pressed ? '#0edb64' : colors.lime) : 'transparent',
        borderWidth: variant === 'ghost' ? 1 : 0,
        borderColor: colors.line,
        boxShadow:
          variant === 'primary' ? '0 12px 22px rgba(20, 232, 111, 0.28)' : undefined,
      })}
    >
      <Text selectable style={{ color: colors.ink, fontSize: 15, fontWeight: '900' }}>
        {label}
      </Text>
      {variant === 'primary' ? <AppIcon name="arrow-forward" color={colors.ink} size={18} /> : null}
    </Pressable>
  );
}
