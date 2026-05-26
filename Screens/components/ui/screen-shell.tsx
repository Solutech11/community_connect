import React from 'react';
import { KeyboardAvoidingView, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../../styles/theme';

type Props = {
  children: React.ReactNode;
  paddedBottom?: number;
};

export default function ScreenShell({ children, paddedBottom = 24 }: Props) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  return (
    <KeyboardAvoidingView
      behavior={process.env.EXPO_OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: colors.paper }}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        style={{ flex: 1, backgroundColor: colors.paper }}
        contentContainerStyle={{
          minHeight: height,
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + paddedBottom,
          paddingHorizontal: 22,
        }}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
