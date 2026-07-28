import type { PatchUsersMeBody } from '../../types/api.generated';

export const MAX_PROFILE_TAGS = 20;

type PreferenceDraft = {
  phone?: string;
  venue: 'Indoor' | 'Outdoor';
  groupSize: 'Small (1-5)' | 'Medium (5-20)' | 'Large (20+)';
  role: 'Participant' | 'Organizer';
};

const groupSizeValues: Record<PreferenceDraft['groupSize'], NonNullable<PatchUsersMeBody['preferredGroupSize']>> = {
  'Small (1-5)': 'small',
  'Medium (5-20)': 'medium',
  'Large (20+)': 'large',
};

export function normalizeProfileTags(values: readonly string[]) {
  return Array.from(
    new Set(
      values
        .map((value) => value.replace(/^#/, '').trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

export function mapOnboardingPreferences({ phone, venue, groupSize, role }: PreferenceDraft): PatchUsersMeBody {
  return {
    ...(phone ? { phone } : {}),
    preferredSetting: venue === 'Indoor' ? 'indoor' : 'outdoor',
    preferredGroupSize: groupSizeValues[groupSize],
    participationRole: role === 'Participant' ? 'participant' : 'organizer',
  };
}
