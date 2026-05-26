import { View } from 'react-native';

import AppIcon, { AppIconName } from './app-icon';
import { colors } from '../../styles/theme';

type Props = {
  name: AppIconName;
  size?: number;
};

export default function IconBubble({ name, size = 80 }: Props) {
  return (
    <View
      style={{
        height: size,
        width: size,
        borderRadius: size / 2,
        backgroundColor: colors.paleGreen,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#d6f8e3',
      }}
    >
      <AppIcon name={name} color={colors.lime} size={size * 0.36} />
    </View>
  );
}
