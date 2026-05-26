import { Pressable, Text } from 'react-native';

import { colors } from '../../styles/theme';

type Props = {
  label: string;
  onPress: () => void;
};

export default function LinkText({ label, onPress }: Props) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={{ alignSelf: 'center' }}>
      <Text selectable style={{ color: colors.ink, fontSize: 14, fontWeight: '800' }}>
        {label}
      </Text>
    </Pressable>
  );
}
