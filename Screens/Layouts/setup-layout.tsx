import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View, useWindowDimensions } from 'react-native';

import ProgressBar from '../Components/progress-bar';
import ScreenShell from '../Components/screen-shell';
import TopBar from '../Components/top-bar';
import { setupStepTotal } from '../setup-flow';

type Props = {
  children: React.ReactNode;
  step: number;
  onBack: () => void;
  onSkip?: () => void;
};

export default function SetupLayout({ children, step, onBack, onSkip }: Props) {
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
    <ScreenShell>
      <View style={{ flex: 1, gap: 14 }}>
        <TopBar
          onBack={onBack}
          center={`Step ${step} of ${setupStepTotal}`}
          actionLabel={onSkip ? 'Skip' : undefined}
          onAction={onSkip}
        />
        <ProgressBar step={step} total={setupStepTotal} />
        <Animated.View
          style={{
            flex: 1,
            opacity,
            transform: [{ translateX }],
          }}
        >
          {children}
        </Animated.View>
      </View>
    </ScreenShell>
  );
}
