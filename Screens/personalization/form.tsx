import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import AppIcon, { AppIconName } from '../Components/app-icon';
import PrimaryButton from '../Components/primary-button';
import { colors } from '../Components/theme';
import SetupLayout from '../Layouts/setup-layout';
import type { RootStackParamList } from '../navigation';
import { setupSteps } from '../setup-flow';

type Props = NativeStackScreenProps<RootStackParamList, 'PersonalizationForm'>;

const items = [
  ['Hiking', 'walk'],
  ['Cooking', 'restaurant'],
  ['Yoga', 'body'],
  ['Tech', 'hardware-chip'],
  ['Music', 'musical-notes'],
  ['Arts', 'color-palette'],
  ['Gaming', 'game-controller'],
  ['Travel', 'airplane'],
] as const;

export default function PersonalizationFormScreen({ navigation }: Props) {
  const [selectedItems, setSelectedItems] = useState(new Set(['Hiking', 'Yoga']));

  const toggle = (label: string) => {
    setSelectedItems((current) => {
      const next = new Set(current);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  return (
    <SetupLayout
      step={setupSteps.personalizationForm}
      onBack={() => navigation.goBack()}
      onSkip={() => navigation.navigate('Home')}
    >
      <View style={{ flex: 1, gap: 18 }}>
        <View style={{ gap: 8 }}>
          <Text selectable style={{ color: colors.ink, fontSize: 30, lineHeight: 34, fontWeight: '900' }}>
            What are you{'\n'}interested in?
          </Text>
          <Text selectable style={{ color: colors.muted, fontSize: 14, lineHeight: 21 }}>
            Select all that apply to help us curate your personal community feed.
          </Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
          {items.map(([label, icon]) => {
            const selected = selectedItems.has(label);
            return (
            <Pressable
              key={label}
              accessibilityRole="button"
              onPress={() => toggle(label)}
              style={{
                width: '47%',
                minHeight: 105,
                borderRadius: 28,
                backgroundColor: selected ? colors.lime : colors.white,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                borderWidth: 1,
                borderColor: selected ? colors.lime : colors.line,
              }}
            >
              <View
                style={{
                  height: 36,
                  width: 36,
                  borderRadius: 18,
                  backgroundColor: selected ? 'rgba(255,255,255,0.24)' : '#f2f6f7',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AppIcon name={icon as AppIconName} color={colors.ink} size={18} />
              </View>
              <Text selectable style={{ color: colors.ink, fontSize: 14, fontWeight: '900' }}>
                {label}
              </Text>
              {selected ? (
                <View style={{ position: 'absolute', top: 13, right: 13 }}>
                  <AppIcon name="checkmark-circle" color={colors.ink} size={18} />
                </View>
              ) : null}
            </Pressable>
            );
          })}
        </View>
        <View style={{ flex: 1 }} />
        <PrimaryButton label="Continue" onPress={() => navigation.navigate('InterestsSelection')} />
      </View>
    </SetupLayout>
  );
}
