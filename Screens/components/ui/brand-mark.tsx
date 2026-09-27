import { Image, StyleSheet, View } from 'react-native';

import { colors } from '../../styles/theme';

type BrandMarkProps = {
  size?: number;
};

const logo = require('../../../assets/community-connect-logo.png');

export default function BrandMark({ size = 48 }: BrandMarkProps) {
  const radius = size / 2;

  return (
    <View
      style={{
        height: size,
        width: size,
        borderRadius: radius,
        backgroundColor: colors.lime,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <Image
        accessibilityLabel="Community Connect logo"
        resizeMode="contain"
        source={logo}
        style={[styles.logo, { height: size * 0.96, width: size * 0.96 }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  logo: {
    marginTop: 1,
  },
});
