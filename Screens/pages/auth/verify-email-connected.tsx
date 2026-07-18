import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import AppAlertModal from '../../components/ui/app-alert-modal';
import FormField from '../../components/ui/form-field';
import IconBubble from '../../components/ui/icon-bubble';
import LinkText from '../../components/ui/link-text';
import PrimaryButton from '../../components/ui/primary-button';
import { useAuth } from '../../hooks/use-auth';
import SetupLayout from '../../layouts/setup-layout';
import { authApi } from '../../services/api/auth.api';
import { ApiError } from '../../services/api/client';
import { colors, fonts } from '../../styles/theme';
import type { RootStackParamList } from '../../types/navigation';
import { setupSteps } from '../../types/setup-flow';

type Props = NativeStackScreenProps<RootStackParamList, 'VerifyEmail'>;

export default function VerifyEmailScreen({ navigation, route }: Props) {
  const { completeEmailVerification } = useAuth();
  const { email, purpose } = route.params;
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const inputs = useRef<Array<TextInput | null>>([]);

  const updateDigit = (value: string, index: number) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    setCode((current) => current.map((item, itemIndex) => (itemIndex === index ? digit : item)));
    if (digit && index < code.length - 1) inputs.current[index + 1]?.focus();
  };

  const handleSubmit = async () => {
    const otp = code.join('');
    if (otp.length !== 6) {
      setMessage('Enter the complete six-digit code.');
      return;
    }
    if (purpose === 'reset-password' && !newPassword) {
      setMessage('Enter your new password.');
      return;
    }
    setSubmitting(true);
    try {
      if (purpose === 'verify-email') {
        await completeEmailVerification({ email, otp });
        navigation.navigate('PersonalizationForm');
      } else {
        await authApi.resetPassword({ email, otp, newPassword });
        setMessage('Password reset successfully. Sign in with your new password.');
        navigation.navigate('Login');
      }
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : 'Unable to verify the code.');
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      const response = purpose === 'verify-email'
        ? await authApi.resendVerification({ email })
        : await authApi.forgotPassword({ email });
      setMessage(response.message);
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : 'Unable to resend the code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <SetupLayout step={setupSteps.verifyEmail} onBack={() => navigation.goBack()}>
        <View style={{ flex: 1, gap: 22 }}>
          <View style={{ alignItems: 'center', gap: 18, paddingTop: 28 }}>
            <IconBubble name="mail-unread" size={118} />
            <Text style={{ color: colors.ink, fontSize: 25, fontFamily: fonts.extraBold }}>
              Check your inbox
            </Text>
            <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 22, textAlign: 'center' }}>
              We sent a six-digit code to{' '}
              <Text style={{ color: colors.ink, fontFamily: fonts.extraBold }}>{email}</Text>.
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 7, justifyContent: 'center' }}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(node) => { inputs.current[index] = node; }}
                value={digit}
                onChangeText={(value) => updateDigit(value, index)}
                keyboardType="number-pad"
                maxLength={1}
                placeholder="-"
                placeholderTextColor="#b4c0cc"
                style={{
                  height: 51,
                  width: 45,
                  borderRadius: 23,
                  backgroundColor: digit ? colors.white : '#f1f5f6',
                  borderWidth: digit ? 2 : 0,
                  borderColor: colors.lime,
                  color: colors.ink,
                  textAlign: 'center',
                  fontSize: 19,
                  fontFamily: fonts.extraBold,
                }}
              />
            ))}
          </View>

          {purpose === 'reset-password' ? (
            <FormField
              label="New Password"
              placeholder="Enter your new password"
              icon="lock-closed"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
          ) : null}

          <View style={{ alignItems: 'center', gap: 4 }}>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              <Text style={{ color: colors.muted, fontSize: 12 }}>Didn't receive the code?</Text>
              <LinkText label={resending ? 'Sending...' : 'Resend Code'} onPress={resending ? () => undefined : resend} />
            </View>
          </View>

          <View style={{ flex: 1 }} />
          <PrimaryButton
            label={submitting ? 'Please wait...' : purpose === 'verify-email' ? 'Verify Email' : 'Reset Password'}
            disabled={submitting}
            onPress={handleSubmit}
          />
        </View>
      </SetupLayout>
      <AppAlertModal visible={Boolean(message)} title="Community Connect" message={message ?? ''} onClose={() => setMessage(null)} />
    </>
  );
}

