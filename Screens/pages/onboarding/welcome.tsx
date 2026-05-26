import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';

import OnboardingLayout from '../../layouts/onboarding-layout';
import type { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingWelcome'>;

const slides = [
  {
    image: require('../../../assets/onboarding-demo.png'),
    title: 'CommunityConnect',
    eyebrow: 'Connect with Your Local Community',
    body: 'Discover local events, join passionate groups, and build meaningful connections in your neighborhood.',
    ctaLabel: 'Get Started',
  },
  {
    image: require('../../../assets/onboarding-demo.png'),
    title: 'Find Local Events',
    eyebrow: 'Discover events that feel close to you',
    body: 'Browse workshops, meetups, fitness sessions, and creative moments happening around your community.',
    ctaLabel: 'Next Step',
  },
  {
    image: require('../../../assets/onboarding-demo.png'),
    title: 'Stay Connected',
    eyebrow: 'Keep your community plans organized',
    body: 'Save events, follow updates, and move from discovery to attendance without losing your momentum.',
    ctaLabel: 'Get Started',
  },
];

export default function OnboardingWelcomeScreen({ navigation }: Props) {
  const [index, setIndex] = useState(0);
  const activeSlide = slides[index];

  const next = () => {
    if (index < slides.length - 1) {
      setIndex((current) => current + 1);
      return;
    }
    navigation.navigate('Login');
  };

  return (
    <OnboardingLayout
      activeIndex={index}
      backgroundImage={activeSlide.image}
      eyebrow={activeSlide.eyebrow}
      title={activeSlide.title}
      body={activeSlide.body}
      ctaLabel={activeSlide.ctaLabel}
      onNext={next}
      onSkip={() => navigation.navigate('Login')}
    />
  );
}
