import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ProgressBar from '../components/ui/progress-bar';
import TopBar from '../components/ui/top-bar';
import { colors } from '../styles/theme';
import { setupStepTotal } from '../types/setup-flow';

type Props = {
  children: React.ReactNode;
  step: number;
  onBack: () => void;
  onSkip?: () => void;
};

export default function SetupLayout({ children, step, onBack, onSkip }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const translateX = useRef(new Animated.Value(width * 0.16)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    translateX.setValue(width * 0.16);
    opacity.setValue(0);
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, step, translateX, width]);

  return (
    <KeyboardAvoidingView
      behavior={process.env.EXPO_OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: colors.paper }}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: colors.paper,
          paddingTop: insets.top + 12,
          paddingHorizontal: 22,
        }}
      >
        <View style={{ gap: 14, paddingBottom: 14 }}>
          <TopBar
            onBack={onBack}
            center={`Step ${step} of ${setupStepTotal}`}
            actionLabel={onSkip ? 'Skip' : undefined}
            onAction={onSkip}
          />
          <ProgressBar step={step} total={setupStepTotal} />
        </View>

        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: insets.bottom + 24,
          }}
        >
          <Animated.View
            style={{
              flex: 1,
              opacity,
              transform: [{ translateX }],
            }}
          >
            {children}
          </Animated.View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
