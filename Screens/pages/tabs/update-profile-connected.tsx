import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppAlertModal from '../../components/ui/app-alert-modal';
import ProfilePageHeader from '../../components/ui/profile-page-header';
import { useAuth } from '../../hooks/use-auth';
import { ApiError } from '../../services/api/client';
import { uploadsApi } from '../../services/api/uploads.api';
import { usersApi } from '../../services/api/users.api';
import { colors, fonts } from '../../styles/theme';
import type { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'UpdateProfile'>;
type AlertState = { title: string; message: string } | null;

function Field({ label, value, onChangeText, multiline = false, keyboardType = 'default', editable = true }: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  editable?: boolean;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        editable={editable}
        multiline={multiline}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        style={[styles.input, multiline && styles.bio, !editable && styles.disabledInput]}
        value={value}
      />
    </View>
  );
}

export default function UpdateProfileScreen({ navigation }: Props) {
  const { user, refreshProfile } = useAuth();
  const [photo, setPhoto] = useState(user?.avatarUrl ?? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=440&q=85');
  const [pendingPhoto, setPendingPhoto] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [email] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<AlertState>(null);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setBio(user.bio ?? '');
    setPhone(user.phone ?? '');
    if (user.avatarUrl) setPhoto(user.avatarUrl);
  }, [user]);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (result.canceled) return;
    const asset = result.assets[0];
    setPhoto(asset.uri);
    setPendingPhoto({ uri: asset.uri, name: asset.fileName ?? `avatar-${Date.now()}.jpg`, type: asset.mimeType ?? 'image/jpeg' });
  };

  const save = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setAlert({ title: 'Profile', message: 'First name and last name are required.' });
      return;
    }
    setSubmitting(true);
    try {
      let avatarUrl = user?.avatarUrl;
      if (pendingPhoto) {
        const upload = await uploadsApi.image(pendingPhoto, 'avatars');
        avatarUrl = upload.data.url;
      }
      await usersApi.updateMe({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        bio: bio.trim(),
        phone: phone.trim(),
        ...(avatarUrl ? { avatarUrl } : {}),
      });
      await refreshProfile();
      setPendingPhoto(null);
      setAlert({ title: 'Profile Updated', message: 'Your profile changes have been saved.' });
    } catch (error) {
      setAlert({ title: 'Update unsuccessful', message: error instanceof ApiError ? error.message : 'Unable to update your profile.' });
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
              <Pressable disabled={submitting} onPress={pickPhoto} style={styles.photoAction}>
                <Ionicons name="pencil" size={19} color={colors.lime} />
                <Text style={styles.photoText}>Edit Photo</Text>
              </Pressable>
            </View>
            <Field label="First Name" value={firstName} onChangeText={setFirstName} />
            <Field label="Last Name" value={lastName} onChangeText={setLastName} />
            <Field label="Bio" value={bio} onChangeText={setBio} multiline />
            <Field label="Email Address" value={email} onChangeText={() => undefined} keyboardType="email-address" editable={false} />
            <Field label="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Pressable disabled={submitting} onPress={save} style={[styles.save, submitting && styles.saveDisabled]}>
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
  save: { alignItems: 'center', backgroundColor: '#08b657', borderRadius: 28, elevation: 3, height: 56, justifyContent: 'center', marginTop: 26 },
  saveDisabled: { opacity: 0.6 },
  saveText: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 18 },
});

