import { Ionicons } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ImageBackground, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppAlertModal from '../../components/ui/app-alert-modal';
import ProfilePageHeader from '../../components/ui/profile-page-header';
import { useAuth } from '../../hooks/use-auth';
import { ApiError } from '../../services/api/client';
import { usersApi } from '../../services/api/users.api';
import { colors, fonts } from '../../styles/theme';
import type { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'DeleteAccount'>;

export default function DeleteAccountScreen({ navigation }: Props) {
  const { signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const deleteAccount = async () => {
    if (!password) {
      setMessage('Enter your current password to confirm account deletion.');
      return;
    }
    setSubmitting(true);
    try {
      await usersApi.deleteMe({ password });
      await signOut();
      navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : 'Unable to delete your account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SafeAreaView style={styles.safeArea} edges={[]}>
        <ProfilePageHeader title="Delete Account" onBack={() => navigation.goBack()} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <ImageBackground
              source={{ uri: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1100&q=90' }}
              style={styles.hero}
              imageStyle={styles.heroImage}
            >
              <View style={styles.criticalPill}><Text style={styles.criticalText}>CRITICAL ACTION</Text></View>
            </ImageBackground>

            <View style={styles.warningCard}>
              <View style={styles.warningTitleRow}>
                <Ionicons name="warning-outline" size={30} color="#ff4141" />
                <Text style={styles.warningTitle}>This action is permanent</Text>
              </View>
              <Text style={styles.warningBody}>
                Deleting your account permanently removes your hosted events, community connections, and access to your wallet. This cannot be undone.
              </Text>
            </View>

            <Text style={styles.label}>CONFIRM PASSWORD</Text>
            <View style={styles.passwordField}>
              <Ionicons name="lock-closed-outline" size={25} color="#399760" />
              <TextInput placeholder="Enter your current password" placeholderTextColor="#778095" secureTextEntry style={styles.passwordInput} value={password} onChangeText={setPassword} />
            </View>

            <Pressable disabled={submitting} onPress={deleteAccount} style={[styles.deleteButton, submitting && styles.disabled]}>
              <Text style={styles.deleteText}>{submitting ? 'Deleting...' : 'Delete My Account'}</Text>
            </Pressable>
            <Pressable disabled={submitting} onPress={() => navigation.goBack()} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel and Go Back</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <AppAlertModal visible={Boolean(message)} title="Delete Account" message={message ?? ''} onClose={() => setMessage(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.paper, flex: 1 },
  content: { paddingBottom: 34, paddingHorizontal: 38, paddingTop: 30 },
  hero: { height: 250, justifyContent: 'flex-end', overflow: 'hidden' },
  heroImage: { borderRadius: 38 },
  criticalPill: { alignSelf: 'flex-start', backgroundColor: '#ff4444', borderRadius: 18, margin: 18, paddingHorizontal: 15, paddingVertical: 7 },
  criticalText: { color: colors.white, fontFamily: fonts.extraBold, fontSize: 15 },
  warningCard: { backgroundColor: colors.white, borderRadius: 34, elevation: 2, marginTop: 28, padding: 28 },
  warningTitleRow: { alignItems: 'center', flexDirection: 'row', gap: 16 },
  warningTitle: { color: colors.ink, flex: 1, fontFamily: fonts.extraBold, fontSize: 24 },
  warningBody: { color: '#31885a', fontFamily: fonts.medium, fontSize: 16, lineHeight: 28, marginTop: 18 },
  label: { color: '#399760', fontFamily: fonts.bold, fontSize: 15, letterSpacing: 0.4, marginTop: 34 },
  passwordField: { alignItems: 'center', backgroundColor: colors.white, borderRadius: 30, elevation: 2, flexDirection: 'row', height: 72, marginTop: 14, paddingHorizontal: 27 },
  passwordInput: { color: colors.ink, flex: 1, fontFamily: fonts.medium, fontSize: 17, marginLeft: 16 },
  deleteButton: { alignItems: 'center', backgroundColor: '#fb4141', borderRadius: 34, elevation: 4, height: 72, justifyContent: 'center', marginTop: 44 },
  disabled: { opacity: 0.6 },
  deleteText: { color: colors.white, fontFamily: fonts.extraBold, fontSize: 20 },
  cancelButton: { alignItems: 'center', backgroundColor: colors.white, borderColor: '#dce7e1', borderRadius: 34, borderWidth: 1, height: 66, justifyContent: 'center', marginTop: 16 },
  cancelText: { color: '#399760', fontFamily: fonts.bold, fontSize: 17 },
});

