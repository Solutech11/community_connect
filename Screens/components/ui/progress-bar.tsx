import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';

import { colors } from '../../styles/theme';

type Props = {
  step: number;
  total: number;
};

export default function ProgressBar({ step, total }: Props) {
  const progress = useRef(new Animated.Value(step)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: step,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, step]);

  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {Array.from({ length: total }).map((_, index) => {
        const active = progress.interpolate({
          inputRange: [index, index + 1],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        });

        return (
        <View
          key={index}
          style={{
            flex: 1,
            height: 5,
            borderRadius: 99,
            backgroundColor: '#e4ecef',
            overflow: 'hidden',
          }}
        >
          <Animated.View
            style={{
              height: '100%',
              width: active.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
              borderRadius: 99,
              backgroundColor: colors.lime,
            }}
          />
        </View>
        );
      })}
    </View>
  );
}
