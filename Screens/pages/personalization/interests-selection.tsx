import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import AppIcon, { AppIconName } from '../../components/ui/app-icon';
import PrimaryButton from '../../components/ui/primary-button';
import { colors, fonts } from '../../styles/theme';
import SetupLayout from '../../layouts/setup-layout';
import type { RootStackParamList } from '../../types/navigation';
import { setupSteps } from '../../types/setup-flow';

type Props = NativeStackScreenProps<RootStackParamList, 'InterestsSelection'>;

const cards = [
  ['school', 'Workshops', 'Skill building'],
  ['people', 'Social', 'Meetups and fun'],
  ['barbell', 'Fitness', 'Sports and health'],
  ['color-palette', 'Arts', 'Creative events'],
  ['heart', 'Volunteer', 'Give back'],
  ['laptop', 'Tech', 'Digital trends'],
] as const;

export default function InterestsSelectionScreen({ navigation }: Props) {
  const [selectedCards, setSelectedCards] = useState(new Set(['Workshops', 'Arts']));

  const toggle = (title: string) => {
    setSelectedCards((current) => {
      const next = new Set(current);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  return (
    <SetupLayout
      step={setupSteps.interestsSelection}
      onBack={() => navigation.goBack()}
      onSkip={() => navigation.navigate('Home')}
    >
      <View style={{ flex: 1, gap: 16 }}>
        <View style={{ gap: 8 }}>
          <Text selectable style={{ color: colors.ink, fontSize: 30, lineHeight: 34, fontFamily: fonts.extraBold }}>
            What are you looking{'\n'}for?
          </Text>
          <Text selectable style={{ color: colors.muted, fontSize: 14, lineHeight: 21 }}>
            Select a few interests to help us personalize your community feed.
          </Text>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {cards.map(([icon, title, subtitle]) => {
            const selected = selectedCards.has(title);
            return (
            <Pressable
              key={title}
              accessibilityRole="button"
              onPress={() => toggle(title)}
              style={{
                width: '48%',
                minHeight: 124,
                borderRadius: 14,
                backgroundColor: selected ? colors.paleGreen : colors.white,
                borderWidth: 1.5,
                borderColor: selected ? colors.lime : colors.line,
                padding: 16,
                gap: 9,
              }}
            >
              <View
                style={{
                  height: 32,
                  width: 32,
                  borderRadius: 16,
                  backgroundColor: selected ? colors.white : '#f1f5f6',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AppIcon name={icon as AppIconName} color={colors.ink} size={17} />
              </View>
              <Text selectable style={{ color: colors.ink, fontSize: 15, fontFamily: fonts.extraBold }}>
                {title}
              </Text>
              <Text selectable style={{ color: colors.muted, fontSize: 11 }}>
                {subtitle}
              </Text>
              {selected ? (
                <View style={{ position: 'absolute', top: 10, right: 10 }}>
                  <AppIcon name="checkmark-circle" color={colors.lime} size={20} />
                </View>
              ) : null}
            </Pressable>
            );
          })}
        </View>
        <View style={{ flex: 1 }} />
        <PrimaryButton label="Next Step" onPress={() => navigation.navigate('Preferences')} />
      </View>
    </SetupLayout>
  );
}
