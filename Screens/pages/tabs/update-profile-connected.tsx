import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppAlertModal from '../../components/ui/app-alert-modal';
import ProfilePageHeader from '../../components/ui/profile-page-header';
import { defaultProfileAvatarUrl } from '../../data/profile';
import { useAuth } from '../../hooks/use-auth';
import { ApiError } from '../../services/api/client';
import { MAX_PROFILE_TAGS, normalizeProfileTags } from '../../services/api/user-profile.mapper';
import { usersApi } from '../../services/api/users.api';
import { colors, fonts } from '../../styles/theme';
import type { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'UpdateProfile'>;
type AlertState = { title: string; message: string } | null;
type PreferredSetting = 'indoor' | 'outdoor';
type PreferredGroupSize = 'small' | 'medium' | 'large';
type ParticipationRole = 'participant' | 'organizer';

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  editable?: boolean;
  placeholder?: string;
};

const fallbackPhoto = defaultProfileAvatarUrl;

function Field({
  label,
  value,
  onChangeText,
  multiline = false,
  keyboardType = 'default',
  editable = true,
  placeholder,
}: FieldProps) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        editable={editable}
        multiline={multiline}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.softMuted}
        style={[styles.input, multiline && styles.bio, !editable && styles.disabledInput]}
        value={value}
      />
    </View>
  );
}

function ChoiceGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled,
}: {
  label: string;
  options: readonly { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
  disabled: boolean;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.choiceGroup}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              disabled={disabled}
              onPress={() => onChange(option.value)}
              style={[styles.choice, selected && styles.choiceSelected, disabled && styles.choiceDisabled]}
            >
              <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function asPreferredSetting(value?: string): PreferredSetting {
  return value === 'outdoor' ? 'outdoor' : 'indoor';
}

function asPreferredGroupSize(value?: string): PreferredGroupSize {
  if (value === 'small' || value === 'large') return value;
  return 'medium';
}

function asParticipationRole(value?: string): ParticipationRole {
  return value === 'organizer' ? 'organizer' : 'participant';
}

export default function UpdateProfileScreen({ navigation }: Props) {
  const { user, refreshProfile } = useAuth();
  const [photo, setPhoto] = useState(user?.avatarUrl ?? fallbackPhoto);
  const [pendingPhoto, setPendingPhoto] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [email] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [country, setCountry] = useState(user?.country ?? 'Nigeria');
  const [state, setState] = useState(user?.state ?? '');
  const [lga, setLga] = useState(user?.lga ?? '');
  const [interestsInput, setInterestsInput] = useState(user?.interests?.join(', ') ?? '');
  const [hobbiesInput, setHobbiesInput] = useState(user?.hobbies?.join(', ') ?? '');
  const [preferredSetting, setPreferredSetting] = useState<PreferredSetting>(asPreferredSetting(user?.preferredSetting));
  const [preferredGroupSize, setPreferredGroupSize] = useState<PreferredGroupSize>(asPreferredGroupSize(user?.preferredGroupSize));
  const [participationRole, setParticipationRole] = useState<ParticipationRole>(asParticipationRole(user?.participationRole));
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<AlertState>(null);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setBio(user.bio ?? '');
    setPhone(user.phone ?? '');
    setCountry(user.country ?? 'Nigeria');
    setState(user.state ?? '');
    setLga(user.lga ?? '');
    setInterestsInput(user.interests?.join(', ') ?? '');
    setHobbiesInput(user.hobbies?.join(', ') ?? '');
    setPreferredSetting(asPreferredSetting(user.preferredSetting));
    setPreferredGroupSize(asPreferredGroupSize(user.preferredGroupSize));
    setParticipationRole(asParticipationRole(user.participationRole));
    if (user.avatarUrl) setPhoto(user.avatarUrl);
  }, [user]);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    const imageType = asset.mimeType ?? 'image/jpeg';
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(imageType)) {
      setAlert({ title: 'Unsupported photo', message: 'Choose a JPEG, PNG, or WebP profile photo.' });
      return;
    }

    setPhoto(asset.uri);
    setPendingPhoto({
      uri: asset.uri,
      name: asset.fileName ?? `avatar-${Date.now()}.jpg`,
      type: imageType,
    });
  };

  const save = async () => {
    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();
    const normalizedPhone = phone.trim();
    const interests = normalizeProfileTags(interestsInput.split(','));
    const hobbies = normalizeProfileTags(hobbiesInput.split(','));

    if (normalizedFirstName.length < 2 || normalizedLastName.length < 2) {
      setAlert({ title: 'Profile', message: 'First name and last name must each contain at least two characters.' });
      return;
    }
    if (normalizedPhone && normalizedPhone.length < 7) {
      setAlert({ title: 'Profile', message: 'Enter a valid phone number or leave the field empty.' });
      return;
    }
    if (bio.trim().length > 500) {
      setAlert({ title: 'Profile', message: 'Your bio cannot exceed 500 characters.' });
      return;
    }
    if (interests.length > MAX_PROFILE_TAGS || hobbies.length > MAX_PROFILE_TAGS) {
      setAlert({
        title: 'Too many selections',
        message: `You can save up to ${MAX_PROFILE_TAGS} interests and ${MAX_PROFILE_TAGS} hobbies.`,
      });
      return;
    }

    setSubmitting(true);
    try {
      await usersApi.updateMe({
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
        bio: bio.trim(),
        country: country.trim(),
        state: state.trim(),
        lga: lga.trim(),
        interests,
        hobbies,
        preferredSetting,
        preferredGroupSize,
        participationRole,
        ...(normalizedPhone ? { phone: normalizedPhone } : {}),
      });

      if (pendingPhoto) {
        const response = await usersApi.updateAvatar(pendingPhoto);
        setPhoto(response.data.user.avatarUrl || fallbackPhoto);
      }

      await refreshProfile();
      setPendingPhoto(null);
      setAlert({ title: 'Profile Updated', message: 'Your profile changes have been saved.' });
    } catch (error) {
      setAlert({
        title: 'Update unsuccessful',
        message: error instanceof ApiError ? error.message : 'Unable to update your profile.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SafeAreaView style={styles.safeArea} edges={[]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.safeArea}>
          <ProfilePageHeader title="Update Profile" onBack={() => navigation.goBack()} />
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.photoBlock}>
              <Image source={{ uri: photo }} style={styles.avatar} />
              <Pressable disabled={submitting} onPress={() => void pickPhoto()} style={[styles.photoAction, submitting && styles.choiceDisabled]}>
                <Ionicons name="pencil" size={19} color={colors.lime} />
                <Text style={styles.photoText}>Edit Photo</Text>
              </Pressable>
            </View>
            <Field label="First Name" value={firstName} onChangeText={setFirstName} editable={!submitting} />
            <Field label="Last Name" value={lastName} onChangeText={setLastName} editable={!submitting} />
            <Field label="Bio" value={bio} onChangeText={setBio} multiline editable={!submitting} />
            <Field label="Email Address" value={email} onChangeText={() => undefined} keyboardType="email-address" editable={false} />
            <Field label="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" editable={!submitting} />
            <Field label="Country" value={country} onChangeText={setCountry} editable={!submitting} />
            <Field label="State" value={state} onChangeText={setState} editable={!submitting} />
            <Field label="LGA" value={lga} onChangeText={setLga} editable={!submitting} />
            <Field
              label="Interests"
              value={interestsInput}
              onChangeText={setInterestsInput}
              editable={!submitting}
              placeholder="e.g. technology, music"
            />
            <Field
              label="Hobbies"
              value={hobbiesInput}
              onChangeText={setHobbiesInput}
              editable={!submitting}
              placeholder="e.g. photography, cooking"
            />
            <ChoiceGroup
              label="Preferred Setting"
              value={preferredSetting}
              onChange={setPreferredSetting}
              disabled={submitting}
              options={[
                { label: 'Indoor', value: 'indoor' },
                { label: 'Outdoor', value: 'outdoor' },
              ]}
            />
            <ChoiceGroup
              label="Preferred Group Size"
              value={preferredGroupSize}
              onChange={setPreferredGroupSize}
              disabled={submitting}
              options={[
                { label: 'Small', value: 'small' },
                { label: 'Medium', value: 'medium' },
                { label: 'Large', value: 'large' },
              ]}
            />
            <ChoiceGroup
              label="Participation Role"
              value={participationRole}
              onChange={setParticipationRole}
              disabled={submitting}
              options={[
                { label: 'Participant', value: 'participant' },
                { label: 'Organizer', value: 'organizer' },
              ]}
            />
            <Pressable disabled={submitting} onPress={() => void save()} style={[styles.save, submitting && styles.saveDisabled]}>
              <Text style={styles.saveText}>{submitting ? 'Saving...' : 'Save Changes'}</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <AppAlertModal visible={Boolean(alert)} title={alert?.title ?? ''} message={alert?.message ?? ''} onClose={() => setAlert(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  content: { paddingBottom: 34, paddingHorizontal: 20 },
  photoBlock: { alignItems: 'center', marginBottom: 28, marginTop: 14 },
  avatar: { borderColor: colors.white, borderRadius: 62, borderWidth: 5, height: 124, width: 124 },
  photoAction: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: 18 },
  photoText: { color: '#08ae55', fontFamily: fonts.bold, fontSize: 16 },
  fieldWrap: { marginTop: 16 },
  label: { color: '#399760', fontFamily: fonts.bold, fontSize: 15, marginBottom: 10, paddingLeft: 12 },
  input: { backgroundColor: colors.white, borderRadius: 22, color: colors.ink, elevation: 2, fontFamily: fonts.medium, fontSize: 17, height: 56, paddingHorizontal: 24 },
  disabledInput: { opacity: 0.6 },
  bio: { height: 112, paddingTop: 18, textAlignVertical: 'top' },
  choiceGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { alignItems: 'center', backgroundColor: colors.white, borderColor: colors.line, borderRadius: 20, borderWidth: 1, justifyContent: 'center', minHeight: 42, paddingHorizontal: 16 },
  choiceSelected: { backgroundColor: colors.lime, borderColor: colors.lime },
  choiceDisabled: { opacity: 0.55 },
  choiceText: { color: colors.ink, fontFamily: fonts.bold, fontSize: 13 },
  choiceTextSelected: { fontFamily: fonts.extraBold },
  save: { alignItems: 'center', backgroundColor: '#08b657', borderRadius: 28, elevation: 3, height: 56, justifyContent: 'center', marginTop: 30 },
  saveDisabled: { opacity: 0.6 },
  saveText: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 18 },
});
