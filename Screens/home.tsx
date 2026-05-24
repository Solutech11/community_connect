import { Text, View } from 'react-native';

import { colors } from './Components/theme';

export default function HomeScreen() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.forest,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <Text
        selectable
        style={{
          color: '#eafff1',
          fontSize: 28,
          fontWeight: '800',
          textAlign: 'center',
        }}
      >
        Community Connect
      </Text>
      <Text
        selectable
        style={{
          color: colors.mint,
          fontSize: 16,
          lineHeight: 24,
          marginTop: 10,
          textAlign: 'center',
        }}
      >
        Your event experience starts here.
      </Text>
      <Text
        selectable
        style={{
          color: 'rgba(234, 255, 241, 0.72)',
          fontSize: 14,
          lineHeight: 21,
          marginTop: 14,
          textAlign: 'center',
        }}
      >
        Auth, verification, and personalization screens are wired into the app flow.
      </Text>
    </View>
  );
}
