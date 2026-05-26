import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BrandMark from '../components/ui/brand-mark';
import { colors } from '../styles/theme';

type Props = {
  children: React.ReactNode;
  image?: ImageSourcePropType;
  eyebrow: string;
  title: string;
  body: string;
};

function useEntrance() {
  const opacity = useRef(new Animated.Value(0)).current;
  const offset = useRef(new Animated.Value(24)).current;
  const scale = useRef(new Animated.Value(0.98)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(offset, {
        toValue: 0,
        duration: 460,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 7,
        tension: 70,
        useNativeDriver: true,
      }),
    ]).start();
  }, [offset, opacity, scale]);

  return {
    opacity,
    transform: [{ translateY: offset }, { scale }],
  };
}

export default function AuthLayout({ children, image, eyebrow, title, body }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const animatedStyle = useEntrance();
  const cardWidth = Math.min(width - 32, 430);
  const compact = height < 760;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      style={{ flex: 1, backgroundColor: colors.forest }}
      contentContainerStyle={{
        minHeight: height,
        paddingTop: insets.top + 18,
        paddingBottom: insets.bottom + 26,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: compact ? 18 : 26,
      }}
    >
      <View style={{ width: cardWidth, gap: 18 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <BrandMark />
          <View
            style={{
              height: 10,
              width: 76,
              borderRadius: 999,
              backgroundColor: 'rgba(20, 239, 114, 0.22)',
            }}
          />
        </View>

        {image ? (
          <View
            style={{
              height: compact ? 148 : 182,
              borderRadius: 28,
              overflow: 'hidden',
              backgroundColor: colors.moss,
            }}
          >
            <Image source={image} resizeMode="cover" style={{ height: '100%', width: '100%' }} />
            <View
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(2, 20, 13, 0.18)',
              }}
            />
          </View>
        ) : null}

        <View style={{ gap: 10 }}>
          <Text
            selectable
            style={{
              color: colors.mint,
              fontSize: 13,
              fontWeight: '800',
              letterSpacing: 0,
              textTransform: 'uppercase',
            }}
          >
            {eyebrow}
          </Text>
          <Text
            selectable
            style={{
              color: colors.paper,
              fontSize: compact ? 32 : 38,
              lineHeight: compact ? 38 : 44,
              fontWeight: '900',
            }}
          >
            {title}
          </Text>
          <Text
            selectable
            style={{
              color: colors.softWhite,
              fontSize: 15,
              lineHeight: 23,
              fontWeight: '500',
            }}
          >
            {body}
          </Text>
        </View>
      </View>

      <Animated.View
        style={[
          {
            width: cardWidth,
            borderRadius: 30,
            backgroundColor: colors.paper,
            padding: compact ? 18 : 22,
            gap: 16,
          },
          animatedStyle,
        ]}
      >
        {children}
      </Animated.View>
    </ScrollView>
  );
}
