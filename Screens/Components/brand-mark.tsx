import { View } from 'react-native';

import AppIcon from './app-icon';
import { colors } from './theme';

export default function BrandMark() {
  return (
    <View
      style={{
        height: 48,
        width: 48,
        borderRadius: 24,
        backgroundColor: colors.lime,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AppIcon name="people" color={colors.ink} size={24} />
    </View>
  );
}
