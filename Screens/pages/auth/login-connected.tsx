import { CommonActions } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import AppAlertModal from '../../components/ui/app-alert-modal';
import AppIcon from '../../components/ui/app-icon';
import FormField from '../../components/ui/form-field';
import IconBubble from '../../components/ui/icon-bubble';
import LinkText from '../../components/ui/link-text';
import PrimaryButton from '../../components/ui/primary-button';
import ScreenShell from '../../components/ui/screen-shell';
import { useAuth } from '../../hooks/use-auth';
import { ApiError } from '../../services/api/client';
import { colors, fonts } from '../../styles/theme';
import type { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

function Divider() {
  return (
    <View style={{ position: 'relative', justifyContent: 'center', marginVertical: 14 }}>
      <View style={{ height: 1, backgroundColor: colors.line }} />
      <View style={{ position: 'absolute', alignSelf: 'center', backgroundColor: colors.paper, paddingHorizontal: 12 }}>
        <Text style={{ color: colors.muted, fontSize: 16 }}>or continue with</Text>
      </View>
    </View>
  );
}

function BiometricButtons() {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 18 }}>
      {[
        { name: 'happy-outline' as const, label: 'Face ID' },
        { name: 'finger-print' as const, label: 'Fingerprint' },
      ].map((item) => (
        <Pressable
          accessibilityLabel={`${item.label} sign-in is not configured yet`}
          accessibilityRole="button"
          disabled
          key={item.label}
          style={{
            height: 58,
            width: 58,
            borderRadius: 15,
            backgroundColor: colors.white,
            borderWidth: 1,
            borderColor: colors.line,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.55,
          }}
        >
          <AppIcon name={item.name} color="#40516a" size={25} />
        </Pressable>
      ))}
    </View>
  );
}

export default function LoginScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setErrorMessage('Enter your email address and password to continue.');
      return;
    }
    setSubmitting(true);
    try {
      await signIn({ email: email.trim().toLowerCase(), password });
      navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Home' }] }));
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <ScreenShell>
        <View style={{ flex: 1, justifyContent: 'space-between', paddingTop: 24, gap: 16 }}>
          <View style={{ gap: 22 }}>
            <View style={{ alignItems: 'center', gap: 12 }}>
              <IconBubble name="people" size={64} />
              <View style={{ alignItems: 'center', gap: 6 }}>
                <Text style={{ color: colors.ink, fontSize: 30, lineHeight: 36, fontFamily: fonts.extraBold }}>
                  Welcome Back
                </Text>
                <Text style={{ color: colors.muted, fontSize: 15, fontFamily: fonts.semiBold }}>
                  Sign in to connect with your community.
                </Text>
              </View>
            </View>

            <View style={{ gap: 13 }}>
              <FormField
                label="Email Address"
                placeholder="hello@example.com"
                icon="mail"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                fieldHeight={54}
              />
              <FormField
                label="Password"
                placeholder="Enter your password"
                icon="lock-closed"
                rightIcon={passwordVisible ? 'eye' : 'eye-off'}
                onRightIconPress={() => setPasswordVisible((visible) => !visible)}
                secureTextEntry={!passwordVisible}
                value={password}
                onChangeText={setPassword}
                fieldHeight={54}
              />
              <View style={{ alignItems: 'flex-end', marginTop: -4 }}>
                <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
                  <Text style={{ color: '#34445c', fontSize: 14, fontFamily: fonts.extraBold }}>
                    Forgot Password?
                  </Text>
                </Pressable>
              </View>
              <PrimaryButton
                label={submitting ? 'Signing In...' : 'Sign In'}
                showArrow={false}
                height={56}
                disabled={submitting}
                onPress={handleSignIn}
              />
            </View>

            <View style={{ gap: 14 }}>
              <Divider />
              <BiometricButtons />
            </View>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 5, paddingBottom: 10 }}>
            <Text style={{ color: '#40516a', fontSize: 14 }}>Don't have an account?</Text>
            <LinkText label="Sign Up" onPress={() => navigation.navigate('Register')} />
          </View>
        </View>
      </ScreenShell>
      <AppAlertModal
        visible={Boolean(errorMessage)}
        title="Sign-in unsuccessful"
        message={errorMessage ?? ''}
        onClose={() => setErrorMessage(null)}
      />
    </>
  );
}

