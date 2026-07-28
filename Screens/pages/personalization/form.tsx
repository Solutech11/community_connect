import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import AppAlertModal from '../../components/ui/app-alert-modal';
import AppIcon from '../../components/ui/app-icon';
import PrimaryButton from '../../components/ui/primary-button';
import { interestOptions } from '../../data/personalization';
import { useAuth } from '../../hooks/use-auth';
import { usePersonalization } from '../../hooks/use-personalization';
import SetupLayout from '../../layouts/setup-layout';
import { ApiError } from '../../services/api/client';
import { MAX_PROFILE_TAGS, normalizeProfileTags } from '../../services/api/user-profile.mapper';
import { usersApi } from '../../services/api/users.api';
import { colors, fonts } from '../../styles/theme';
import type { RootStackParamList } from '../../types/navigation';
import { setupSteps } from '../../types/setup-flow';

type Props = NativeStackScreenProps<RootStackParamList, 'PersonalizationForm'>;

export default function PersonalizationFormScreen({ navigation }: Props) {
  const { refreshProfile } = useAuth();
  const { draft, setActivities } = usePersonalization();
  const [selectedItems, setSelectedItems] = useState(new Set(draft.activities));
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggle = (label: string) => {
    if (!selectedItems.has(label) && selectedItems.size >= MAX_PROFILE_TAGS) {
      setErrorMessage(`You can select up to ${MAX_PROFILE_TAGS} interests.`);
      return;
    }

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

  const continueSetup = async () => {
    if (submitting) return;

    const activities = normalizeProfileTags(Array.from(selectedItems));
    setSubmitting(true);
    try {
      await usersApi.updateMe({ interests: activities });
      setActivities(Array.from(selectedItems));
      await refreshProfile();
      navigation.navigate('InterestsSelection');
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : 'Your interests could not be saved. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SetupLayout
        step={setupSteps.personalizationForm}
        onBack={() => navigation.goBack()}
        onSkip={() => navigation.navigate('Home')}
      >
        <View style={{ flex: 1, gap: 18 }}>
          <View style={{ gap: 8 }}>
            <Text selectable style={{ color: colors.ink, fontSize: 30, lineHeight: 34, fontFamily: fonts.extraBold }}>
              What are you{'\n'}interested in?
            </Text>
            <Text selectable style={{ color: colors.muted, fontSize: 14, lineHeight: 21 }}>
              Select all that apply to help us curate your personal community feed.
            </Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
            {interestOptions.map(({ label, icon }) => {
              const selected = selectedItems.has(label);
              return (
                <Pressable
                  key={label}
                  accessibilityRole="button"
                  disabled={submitting}
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
                    opacity: submitting ? 0.6 : 1,
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
                    <AppIcon name={icon} color={colors.ink} size={18} />
                  </View>
                  <Text selectable style={{ color: colors.ink, fontSize: 14, fontFamily: fonts.extraBold }}>
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
          <PrimaryButton
            label={submitting ? 'Saving...' : 'Continue'}
            disabled={submitting}
            onPress={() => void continueSetup()}
          />
        </View>
      </SetupLayout>
      <AppAlertModal
        visible={Boolean(errorMessage)}
        title="Unable to save interests"
        message={errorMessage ?? ''}
        onClose={() => setErrorMessage(null)}
      />
    </>
  );
}
