import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Text, View } from 'react-native';

import AppAlertModal from '../../components/ui/app-alert-modal';
import FormField from '../../components/ui/form-field';
import IconBubble from '../../components/ui/icon-bubble';
import LinkText from '../../components/ui/link-text';
import PrimaryButton from '../../components/ui/primary-button';
import ScreenShell from '../../components/ui/screen-shell';
import TopBar from '../../components/ui/top-bar';
import { authApi } from '../../services/api/auth.api';
import { ApiError } from '../../services/api/client';
import { colors, fonts } from '../../styles/theme';
import type { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const submit = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setErrorMessage('Enter the email address associated with your account.');
      return;
    }
    setSubmitting(true);
    try {
      await authApi.forgotPassword({ email: normalizedEmail });
      navigation.navigate('VerifyEmail', { email: normalizedEmail, purpose: 'reset-password' });
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Unable to request a password reset.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <ScreenShell>
        <View style={{ flex: 1, gap: 22 }}>
          <TopBar onBack={() => navigation.goBack()} />
          <View style={{ alignItems: 'center', gap: 18, paddingTop: 38 }}>
            <IconBubble name="refresh-circle" size={112} />
            <Text style={{ color: colors.ink, fontSize: 25, fontFamily: fonts.extraBold }}>
              Forgot Password?
            </Text>
            <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 22, textAlign: 'center' }}>
              Enter the email associated with your account and we will send a reset code.
            </Text>
          </View>
          <FormField label="Email Address" placeholder="hello@example.com" icon="mail" keyboardType="email-address" value={email} onChangeText={setEmail} />
          <PrimaryButton label={submitting ? 'Sending...' : 'Send Reset Code'} disabled={submitting} onPress={submit} />
          <LinkText label="Remember password? Sign In" onPress={() => navigation.navigate('Login')} />
        </View>
      </ScreenShell>
      <AppAlertModal visible={Boolean(errorMessage)} title="Password reset" message={errorMessage ?? ''} onClose={() => setErrorMessage(null)} />
    </>
  );
}

