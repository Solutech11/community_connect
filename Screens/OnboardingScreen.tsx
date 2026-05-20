import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
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

import type { RootStackParamList } from '../App';

type Props = NativeStackScreenProps<RootStackParamList> & {
  activeIndex: number;
  backgroundImage: ImageSourcePropType;
  eyebrow: string;
  title: string;
  body: string;
  ctaLabel: string;
  nextRoute: keyof RootStackParamList;
};

const totalSlides = 3;

export default function OnboardingScreen({
  activeIndex,
  backgroundImage,
  eyebrow,
  title,
  body,
  ctaLabel,
  nextRoute,
  navigation,
}: Props) {
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const imageScale = useRef(new Animated.Value(1.04)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentOffset = useRef(new Animated.Value(28)).current;
  const ctaScale = useRef(new Animated.Value(0.96)).current;

  const compact = height < 740;
  const contentWidth = Math.min(width - 40, 430);

  useEffect(() => {
    imageScale.setValue(1.04);
    contentOpacity.setValue(0);
    contentOffset.setValue(28);
    ctaScale.setValue(0.96);

    Animated.parallel([
      Animated.timing(imageScale, {
        toValue: 1.12,
        duration: 6500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(contentOffset, {
        toValue: 0,
        duration: 560,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(ctaScale, {
        toValue: 1,
        friction: 6,
        tension: 70,
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeIndex, contentOffset, contentOpacity, ctaScale, imageScale]);

  const goNext = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics can be unavailable on some simulator/device combinations.
    }

    navigation.navigate(nextRoute);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#071f17' }}>
      <Animated.View style={{ flex: 1, transform: [{ scale: imageScale }] }}>
        <ImageBackground
          source={backgroundImage}
          resizeMode="cover"
          style={{ flex: 1 }}
          imageStyle={{ opacity: 0.9 }}
        />
      </Animated.View>

      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(2, 20, 13, 0.34)',
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '62%',
          backgroundColor: 'rgba(2, 20, 13, 0.72)',
        }}
      />

      <View
        style={{
          position: 'absolute',
          inset: 0,
          paddingHorizontal: 20,
          paddingTop: insets.top + 18,
          paddingBottom: insets.bottom + 24,
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: contentWidth,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View
            style={{
              height: 44,
              width: 44,
              borderRadius: 22,
              backgroundColor: '#14ef72',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              selectable
              style={{
                color: '#062116',
                fontSize: 20,
                fontWeight: '900',
              }}
            >
              C
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('Home')}
            style={({ pressed }) => ({
              opacity: pressed ? 0.65 : 1,
              paddingHorizontal: 18,
              paddingVertical: 10,
              borderRadius: 999,
              backgroundColor: 'rgba(255, 255, 255, 0.14)',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              borderWidth: 1,
            })}
          >
            <Text
              selectable
              style={{
                color: '#f4fff7',
                fontSize: 14,
                fontWeight: '700',
              }}
            >
              Skip
            </Text>
          </Pressable>
        </View>

        <Animated.View
          style={{
            width: contentWidth,
            opacity: contentOpacity,
            transform: [{ translateY: contentOffset }],
            gap: compact ? 18 : 22,
          }}
        >
          <View style={{ gap: compact ? 10 : 14 }}>
            <Text
              selectable
              style={{
                color: '#a7f7c6',
                fontSize: 13,
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: 0,
              }}
            >
              {eyebrow}
            </Text>
            <Text
              selectable
              style={{
                color: '#f7fff9',
                fontSize: compact ? 34 : 42,
                lineHeight: compact ? 40 : 48,
                fontWeight: '900',
              }}
            >
              {title}
            </Text>
            <Text
              selectable
              style={{
                color: 'rgba(244, 255, 247, 0.82)',
                fontSize: compact ? 15 : 16,
                lineHeight: compact ? 23 : 25,
                fontWeight: '500',
              }}
            >
              {body}
            </Text>
          </View>

          <View style={{ gap: 18 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {Array.from({ length: totalSlides }).map((_, index) => (
                <View
                  key={index}
                  style={{
                    height: 8,
                    width: index === activeIndex ? 30 : 8,
                    borderRadius: 99,
                    backgroundColor:
                      index === activeIndex ? '#14ef72' : 'rgba(255,255,255,0.34)',
                  }}
                />
              ))}
            </View>

            <Animated.View style={{ transform: [{ scale: ctaScale }] }}>
              <Pressable
                accessibilityRole="button"
                onPress={goNext}
                style={({ pressed }) => ({
                  minHeight: 58,
                  borderRadius: 999,
                  backgroundColor: pressed ? '#0edb64' : '#14ef72',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 24,
                })}
              >
                <Text
                  selectable
                  style={{
                    color: '#062116',
                    fontSize: 16,
                    fontWeight: '900',
                  }}
                >
                  {ctaLabel}
                </Text>
              </Pressable>
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}
