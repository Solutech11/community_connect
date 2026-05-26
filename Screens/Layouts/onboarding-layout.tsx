import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  ImageBackground,
  ImageSourcePropType,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BrandMark from '../components/ui/brand-mark';
import PrimaryButton from '../components/ui/primary-button';
import { colors } from '../styles/theme';

type Props = {
  activeIndex: number;
  backgroundImage: ImageSourcePropType;
  eyebrow: string;
  title: string;
  body: string;
  ctaLabel: string;
  onNext: () => void;
  onSkip: () => void;
};

const totalSlides = 3;

export default function OnboardingLayout({
  activeIndex,
  backgroundImage,
  eyebrow,
  title,
  body,
  ctaLabel,
  onNext,
  onSkip,
}: Props) {
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const imageScale = useRef(new Animated.Value(1.06)).current;
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentOffset = useRef(new Animated.Value(36)).current;
  const buttonScale = useRef(new Animated.Value(0.94)).current;
  const dotProgress = useRef(new Animated.Value(activeIndex)).current;

  const contentWidth = Math.min(width - 28, 430);
  const imageHeight = Math.max(height * 0.44, 320);

  useEffect(() => {
    imageScale.setValue(1.06);
    logoScale.setValue(0.7);
    contentOpacity.setValue(0);
    contentOffset.setValue(36);
    buttonScale.setValue(0.94);
    Animated.timing(dotProgress, {
      toValue: activeIndex,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    Animated.sequence([
      Animated.parallel([
        Animated.timing(imageScale, {
          toValue: 1,
          duration: 620,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 5,
          tension: 90,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(contentOffset, {
          toValue: 0,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(buttonScale, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [activeIndex, buttonScale, contentOffset, contentOpacity, dotProgress, imageScale, logoScale]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <View style={{ height: imageHeight, overflow: 'hidden', backgroundColor: colors.forest }}>
        <Animated.View style={{ flex: 1, transform: [{ scale: imageScale }] }}>
          <ImageBackground source={backgroundImage} resizeMode="cover" style={{ flex: 1 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: 'rgba(6, 33, 22, 0.48)',
                justifyContent: 'flex-end',
                alignItems: 'center',
                paddingBottom: 48,
              }}
            >
              <Animated.View style={{ transform: [{ scale: logoScale }] }}>
                <BrandMark />
              </Animated.View>
            </View>
          </ImageBackground>
        </Animated.View>
      </View>

      <Animated.View
        style={{
          flex: 1,
          alignItems: 'center',
          paddingHorizontal: 14,
          paddingTop: 18,
          paddingBottom: insets.bottom + 20,
          opacity: contentOpacity,
          transform: [{ translateX: contentOffset }],
        }}
      >
        <View style={{ width: contentWidth, alignItems: 'center', gap: 12 }}>
          <Text selectable style={{ color: colors.ink, fontSize: 24, fontWeight: '900', textAlign: 'center' }}>
            {title}
          </Text>
          <Text selectable style={{ color: colors.ink, fontSize: 16, lineHeight: 23, fontWeight: '700', textAlign: 'center' }}>
            {eyebrow}
          </Text>
          <Text selectable style={{ color: colors.muted, fontSize: 14, lineHeight: 22, textAlign: 'center' }}>
            {body}
          </Text>
        </View>

        <View style={{ flex: 1 }} />
        <Animated.View style={{ width: contentWidth, transform: [{ scale: buttonScale }] }}>
          <PrimaryButton label={ctaLabel} onPress={onNext} />
        </Animated.View>
        <Pressable accessibilityRole="button" onPress={onSkip} style={{ paddingVertical: 18 }}>
          <Text selectable style={{ color: '#1f9f61', fontSize: 14 }}>
            Already have an account? Log In
          </Text>
        </Pressable>
        <View style={{ flexDirection: 'row', gap: 7 }}>
          {Array.from({ length: totalSlides }).map((_, index) => {
            const width = dotProgress.interpolate({
              inputRange: [index - 1, index, index + 1],
              outputRange: [8, 34, 8],
              extrapolate: 'clamp',
            });
            const opacity = dotProgress.interpolate({
              inputRange: [index - 1, index, index + 1],
              outputRange: [0.45, 1, 0.45],
              extrapolate: 'clamp',
            });
            return (
            <Animated.View
              key={index}
              style={{
                height: 5,
                width,
                opacity,
                borderRadius: 99,
                backgroundColor: index === activeIndex ? '#0bbf68' : '#cfe4dc',
              }}
            />
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
}
