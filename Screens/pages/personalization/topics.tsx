import { CommonActions } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import AppIcon from '../../components/ui/app-icon';
import { useNotifier } from '../../components/ui/app-notifier';
import Chip from '../../components/ui/chip';
import PrimaryButton from '../../components/ui/primary-button';
import { hobbyTopics } from '../../data/personalization';
import { useAuth } from '../../hooks/use-auth';
import { usePersonalization } from '../../hooks/use-personalization';
import SetupLayout from '../../Layouts/setup-layout';
import { ApiError } from '../../services/api/client';
import { MAX_PROFILE_TAGS, normalizeProfileTags } from '../../services/api/user-profile.mapper';
import { usersApi } from '../../services/api/users.api';
import { colors, fonts } from '../../styles/theme';
import type { RootStackParamList } from '../../types/navigation';
import { setupSteps } from '../../types/setup-flow';

type Props = NativeStackScreenProps<RootStackParamList, 'PersonalizationTopics'>;

export default function PersonalizationTopicsScreen({ navigation }: Props) {
  const { refreshProfile } = useAuth();
  const { notify } = useNotifier();
  const { draft, reset, setTopics } = usePersonalization();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(new Set(draft.topics));
  const [submitting, setSubmitting] = useState(false);
  const visibleChips = hobbyTopics.filter((chip) => chip.toLowerCase().includes(query.toLowerCase()));

  const toggle = (chip: string) => {
    if (!selected.has(chip) && selected.size >= MAX_PROFILE_TAGS) {
      notify({
        title: `Choose up to ${MAX_PROFILE_TAGS} hobbies`,
        message: `The profile service supports a maximum of ${MAX_PROFILE_TAGS} hobbies.`,
        tone: 'error',
      });
      return;
    }

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

  const finishSetup = async (topicValues = Array.from(selected)) => {
    if (submitting) return;

    const hobbies = normalizeProfileTags(topicValues);
    setSubmitting(true);
    try {
      await usersApi.updateMe({ hobbies });
      setTopics(topicValues);
      await refreshProfile();
      reset();
      notify({
        title: 'Profile personalized',
        message: 'Your hobbies and preferences have been saved.',
        tone: 'success',
      });
      navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Home' }] }));
    } catch (error) {
      notify({
        title: 'Unable to finish setup',
        message: error instanceof ApiError ? error.message : 'Your hobbies could not be saved.',
        tone: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SetupLayout
      step={setupSteps.topics}
      onBack={() => navigation.goBack()}
      onSkip={() => void finishSetup([])}
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
            editable={!submitting}
            value={query}
            onChangeText={setQuery}
            placeholder="Search hobbies..."
            placeholderTextColor={colors.softMuted}
            style={{ flex: 1, color: colors.ink, fontSize: 14 }}
          />
        </View>

        <Text selectable style={{ color: colors.softMuted, fontSize: 11, fontFamily: fonts.extraBold }}>
          POPULAR HOBBIES
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {visibleChips.map((chip) => (
            <Chip key={chip} label={chip} selected={selected.has(chip)} onPress={() => toggle(chip)} />
          ))}
        </View>

        <View style={{ flex: 1 }} />
        <PrimaryButton
          label={submitting ? 'Saving...' : 'Finish'}
          disabled={submitting}
          onPress={() => void finishSetup()}
        />
        <Text selectable style={{ color: colors.softMuted, fontSize: 11, textAlign: 'center' }}>
          You can always change these later in settings
        </Text>
      </View>
    </SetupLayout>
  );
}
