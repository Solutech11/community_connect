import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import AppAlertModal from '../../components/ui/app-alert-modal';
import AppIcon from '../../components/ui/app-icon';
import PrimaryButton from '../../components/ui/primary-button';
import { useAuth } from '../../hooks/use-auth';
import { usePersonalization } from '../../hooks/use-personalization';
import SetupLayout from '../../Layouts/setup-layout';
import { ApiError } from '../../services/api/client';
import { mapOnboardingPreferences } from '../../services/api/user-profile.mapper';
import { usersApi } from '../../services/api/users.api';
import { colors, fonts } from '../../styles/theme';
import type { RootStackParamList } from '../../types/navigation';
import { setupSteps } from '../../types/setup-flow';

type Props = NativeStackScreenProps<RootStackParamList, 'Preferences'>;
type Venue = 'Indoor' | 'Outdoor';
type GroupSize = 'Small (1-5)' | 'Medium (5-20)' | 'Large (20+)';
type ParticipationRole = 'Participant' | 'Organizer';

const groupSizes: GroupSize[] = ['Small (1-5)', 'Medium (5-20)', 'Large (20+)'];

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('234')) return '+' + digits;
  if (digits.startsWith('0')) return '+234' + digits.slice(1);
  return '+234' + digits;
}

export default function PreferencesScreen({ navigation }: Props) {
  const { user, refreshProfile } = useAuth();
  const { draft, setPhone: setDraftPhone } = usePersonalization();
  const [phone, setPhone] = useState(draft.phone.replace(/^\+234/, ''));
  const [venue, setVenue] = useState<Venue>('Indoor');
  const [groupSize, setGroupSize] = useState<GroupSize>('Medium (5-20)');
  const [role, setRole] = useState<ParticipationRole>('Participant');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const continueSetup = async () => {
    if (submitting) return;

    const normalizedPhone = normalizePhone(phone);
    setSubmitting(true);
    try {
      await usersApi.updateMe(
        mapOnboardingPreferences({
          ...(normalizedPhone ? { phone: normalizedPhone } : {}),
          venue,
          groupSize,
          role,
        }),
      );
      setDraftPhone(normalizedPhone);
      await refreshProfile();
      navigation.navigate('PersonalizationTopics');
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : 'Your preferences could not be saved. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SetupLayout step={setupSteps.preferences} onBack={() => navigation.goBack()}>
        <View style={{ flex: 1, gap: 18 }}>
          <View style={{ gap: 7 }}>
            <Text selectable style={{ color: colors.ink, fontSize: 29, fontFamily: fonts.extraBold }}>
              Preferences
            </Text>
            <Text selectable style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
              Help us personalize your community experience.
            </Text>
          </View>

          <Text selectable style={{ color: colors.ink, fontSize: 14, fontFamily: fonts.extraBold }}>
            Do you prefer?
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {(['Indoor', 'Outdoor'] as Venue[]).map((item) => {
              const selected = venue === item;
              return (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  disabled={submitting}
                  onPress={() => setVenue(item)}
                  style={{
                    flex: 1,
                    height: 82,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: selected ? colors.lime : colors.line,
                    backgroundColor: selected ? colors.paleGreen : colors.white,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    opacity: submitting ? 0.6 : 1,
                  }}
                >
                  <AppIcon name={item === 'Indoor' ? 'home' : 'trail-sign'} color={colors.ink} size={20} />
                  <Text selectable style={{ color: colors.ink, fontSize: 13, fontFamily: fonts.extraBold }}>
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text selectable style={{ color: colors.ink, fontSize: 14, fontFamily: fonts.extraBold }}>
            Preferred Group Size
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {groupSizes.map((item) => {
              const selected = groupSize === item;
              return (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  disabled={submitting}
                  onPress={() => setGroupSize(item)}
                  style={{
                    flex: 1,
                    minHeight: 44,
                    borderRadius: 22,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: selected ? colors.lime : colors.white,
                    borderWidth: 1,
                    borderColor: selected ? colors.lime : colors.line,
                    paddingHorizontal: 8,
                    opacity: submitting ? 0.6 : 1,
                  }}
                >
                  <Text selectable style={{ color: colors.ink, fontSize: 11, fontFamily: fonts.extraBold, textAlign: 'center' }}>
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text selectable style={{ color: colors.ink, fontSize: 14, fontFamily: fonts.extraBold }}>
            I want to be an:
          </Text>
          <View
            style={{
              minHeight: 46,
              borderRadius: 23,
              backgroundColor: '#eef4f6',
              padding: 4,
              flexDirection: 'row',
            }}
          >
            <Pressable
              accessibilityRole="button"
              disabled={submitting}
              onPress={() => setRole('Participant')}
              style={{
                flex: 1,
                borderRadius: 20,
                backgroundColor: role === 'Participant' ? colors.white : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: submitting ? 0.6 : 1,
              }}
            >
              <Text selectable style={{ color: colors.ink, fontSize: 12, fontFamily: fonts.extraBold }}>
                Participant
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={submitting}
              onPress={() => setRole('Organizer')}
              style={{
                flex: 1,
                borderRadius: 20,
                backgroundColor: role === 'Organizer' ? colors.white : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: submitting ? 0.6 : 1,
              }}
            >
              <Text selectable style={{ color: colors.muted, fontSize: 12, fontFamily: fonts.extraBold }}>
                Organizer
              </Text>
            </Pressable>
          </View>

          <View style={{ gap: 8 }}>
            <Text selectable style={{ color: colors.ink, fontSize: 13, fontFamily: fonts.extraBold }}>
              Phone Number
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View
                style={{
                  minHeight: 54,
                  borderRadius: 17,
                  borderWidth: 1,
                  borderColor: colors.line,
                  backgroundColor: colors.white,
                  paddingHorizontal: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Text selectable style={{ color: colors.ink, fontSize: 14, fontFamily: fonts.extraBold }}>
                  NG
                </Text>
                <Text selectable style={{ color: colors.muted, fontSize: 14, fontFamily: fonts.bold }}>
                  +234
                </Text>
              </View>
              <View
                style={{
                  flex: 1,
                  minHeight: 54,
                  borderRadius: 17,
                  borderWidth: 1,
                  borderColor: colors.line,
                  backgroundColor: colors.white,
                  paddingHorizontal: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <AppIcon name="call" color={colors.softMuted} size={18} />
                <TextInput
                  editable={!submitting}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder="801 234 5678"
                  placeholderTextColor="#9aa8b7"
                  style={{ flex: 1, color: colors.ink, fontSize: 15, fontFamily: fonts.semiBold }}
                />
              </View>
            </View>
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
        title="Unable to save preferences"
        message={errorMessage ?? ''}
        onClose={() => setErrorMessage(null)}
      />
    </>
  );
}
