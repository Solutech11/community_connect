import { Pressable, Text } from 'react-native';

import AppIcon from './app-icon';
import { lightTap } from '../../hooks/haptics';
import { colors } from '../../styles/theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
  showArrow?: boolean;
  height?: number;
  disabled?: boolean;
};

export default function PrimaryButton({
  label,
  onPress,
  variant = 'primary',
  showArrow = true,
  height = 56,
  disabled = false,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={async () => {
        if (disabled) {
          return;
        }
        await lightTap();
        onPress();
      }}
      style={({ pressed }) => ({
        minHeight: height,
        borderRadius: height / 2,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 20,
        backgroundColor:
          variant === 'primary'
            ? disabled
              ? '#b9eacb'
              : pressed
                ? '#0edb64'
                : colors.lime
            : 'transparent',
        borderWidth: variant === 'ghost' ? 1 : 0,
        borderColor: colors.line,
        boxShadow:
          variant === 'primary' && !disabled ? '0 12px 22px rgba(20, 232, 111, 0.28)' : undefined,
        opacity: disabled ? 0.72 : 1,
      })}
    >
      <Text selectable style={{ color: colors.ink, fontSize: 15, fontWeight: '900' }}>
        {label}
      </Text>
      {variant === 'primary' && showArrow ? (
        <AppIcon name="arrow-forward" color={colors.ink} size={18} />
      ) : null}
    </Pressable>
  );
}
