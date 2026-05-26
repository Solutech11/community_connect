import { Pressable, Text } from 'react-native';

import { colors } from '../../styles/theme';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export default function Chip({ label, selected, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        borderRadius: 999,
        paddingHorizontal: 15,
        paddingVertical: 11,
        backgroundColor: selected ? colors.lime : colors.white,
        borderWidth: 1,
        borderColor: selected ? colors.lime : colors.line,
      }}
    >
      <Text
        selectable
        style={{
          color: colors.ink,
          fontSize: 14,
          fontWeight: '800',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
