import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import Chip from '../../components/ui/chip';
import PrimaryButton from '../../components/ui/primary-button';
import AppIcon from '../../components/ui/app-icon';
import { colors, fonts } from '../../styles/theme';
import SetupLayout from '../../layouts/setup-layout';
import type { RootStackParamList } from '../../types/navigation';
import { setupSteps } from '../../types/setup-flow';

type Props = NativeStackScreenProps<RootStackParamList, 'PersonalizationTopics'>;

const chips = [
  '#Photography',
  '#BoardGames',
  '#Hiking',
  '#Cooking',
  '#Gardening',
  '#Travel',
  '#Reading',
  '#Technology',
  '#Art',
  '#Fitness',
  '#Music',
  '#Yoga',
];

export default function PersonalizationTopicsScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(new Set(['#Photography', '#Cooking']));
  const visibleChips = chips.filter((chip) => chip.toLowerCase().includes(query.toLowerCase()));

  const toggle = (chip: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(chip)) {
        next.delete(chip);
      } else {
        next.add(chip);
      }
      return next;
    });
  };

  return (
    <SetupLayout
      step={setupSteps.topics}
      onBack={() => navigation.goBack()}
      onSkip={() => navigation.navigate('Home')}
    >
      <View style={{ flex: 1, gap: 20 }}>
        <View style={{ gap: 8 }}>
          <Text selectable style={{ color: colors.ink, fontSize: 30, lineHeight: 34, fontFamily: fonts.extraBold }}>
            Tell us about your{'\n'}hobbies
          </Text>
          <Text selectable style={{ color: colors.muted, fontSize: 14, lineHeight: 21 }}>
            Select topics you are interested in to personalize your feed.
          </Text>
        </View>

        <View
          style={{
            minHeight: 50,
            borderRadius: 25,
            backgroundColor: colors.white,
            borderWidth: 1,
            borderColor: colors.line,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <AppIcon name="search" color={colors.softMuted} size={18} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search or add custom tag..."
            placeholderTextColor={colors.softMuted}
            style={{ flex: 1, color: colors.ink, fontSize: 14 }}
          />
        </View>

        <Text selectable style={{ color: colors.softMuted, fontSize: 11, fontFamily: fonts.extraBold }}>
          POPULAR INTERESTS
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {visibleChips.map((chip) => (
            <Chip key={chip} label={chip} selected={selected.has(chip)} onPress={() => toggle(chip)} />
          ))}
        </View>

        <View style={{ flex: 1 }} />
        <PrimaryButton label="Finish" onPress={() => navigation.navigate('Home')} />
        <Text selectable style={{ color: colors.softMuted, fontSize: 11, textAlign: 'center' }}>
          You can always change these later in settings
        </Text>
      </View>
    </SetupLayout>
  );
}
