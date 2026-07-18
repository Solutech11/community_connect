import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import AppAlertModal from '../../components/ui/app-alert-modal';
import AppIcon from '../../components/ui/app-icon';
import FormField from '../../components/ui/form-field';
import LinkText from '../../components/ui/link-text';
import PrimaryButton from '../../components/ui/primary-button';
import SetupLayout from '../../layouts/setup-layout';
import { authApi } from '../../services/api/auth.api';
import { ApiError } from '../../services/api/client';
import { colors, fonts } from '../../styles/theme';
import type { RootStackParamList } from '../../types/navigation';
import { setupSteps } from '../../types/setup-flow';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export default function RegistrationScreen({ navigation }: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      setErrorMessage('Complete your name, email address, and password.');
      return;
    }
    setSubmitting(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      await authApi.register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: normalizedEmail,
        password,
        ...(phone.trim() ? { phone: phone.trim() } : {}),
      });
      navigation.navigate('VerifyEmail', { email: normalizedEmail, purpose: 'verify-email' });
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Unable to create your account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SetupLayout step={setupSteps.register} onBack={() => navigation.goBack()}>
        <View style={{ gap: 14 }}>
          <View style={{ gap: 6 }}>
            <Text style={{ color: colors.ink, fontSize: 26, lineHeight: 30, fontFamily: fonts.extraBold }}>
              Join{'\n'}CommunityConnect
            </Text>
            <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 19 }}>
              Sign up to connect with your local community and discover nearby events.
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <FormField label="First Name" placeholder="Jane" icon="person" value={firstName} onChangeText={setFirstName} />
            </View>
            <View style={{ flex: 1 }}>
              <FormField label="Last Name" placeholder="Doe" icon="person" value={lastName} onChangeText={setLastName} />
            </View>
          </View>
          <FormField label="Email Address" placeholder="jane@example.com" icon="mail" keyboardType="email-address" value={email} onChangeText={setEmail} />
          <FormField label="Phone (optional)" placeholder="+2348012345678" icon="call" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
          <FormField label="Password" placeholder="Enter a strong password" icon="lock-closed" secureTextEntry value={password} onChangeText={setPassword} />

          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: acceptedTerms }}
            onPress={() => setAcceptedTerms((current) => !current)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}
          >
            <View style={{ height: 18, width: 18, borderRadius: 9, borderWidth: 1, borderColor: acceptedTerms ? colors.lime : colors.line, backgroundColor: acceptedTerms ? colors.lime : colors.white, alignItems: 'center', justifyContent: 'center' }}>
              {acceptedTerms ? <AppIcon name="checkmark" color={colors.ink} size={13} /> : null}
            </View>
            <Text style={{ flex: 1, color: colors.muted, fontSize: 12 }}>
              I agree to the Terms and Privacy Policy
            </Text>
          </Pressable>

          <PrimaryButton
            label={submitting ? 'Creating Account...' : 'Create Account'}
            disabled={!acceptedTerms || submitting}
            onPress={handleRegister}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
            <Text style={{ color: colors.muted, fontSize: 12 }}>Already a member?</Text>
            <LinkText label="Login" onPress={() => navigation.navigate('Login')} />
          </View>
        </View>
      </SetupLayout>
      <AppAlertModal visible={Boolean(errorMessage)} title="Registration unsuccessful" message={errorMessage ?? ''} onClose={() => setErrorMessage(null)} />
    </>
  );
}

