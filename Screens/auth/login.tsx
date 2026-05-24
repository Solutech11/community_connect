import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import AppIcon from '../Components/app-icon';
import FormField from '../Components/form-field';
import IconBubble from '../Components/icon-bubble';
import LinkText from '../Components/link-text';
import PrimaryButton from '../Components/primary-button';
import ScreenShell from '../Components/screen-shell';
import { colors } from '../Components/theme';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

function Divider() {
  return (
    <View style={{ position: 'relative', justifyContent: 'center', marginVertical: 14 }}>
      <View style={{ height: 1, backgroundColor: colors.line }} />
      <View
        style={{
          position: 'absolute',
          alignSelf: 'center',
          backgroundColor: colors.paper,
          paddingHorizontal: 12,
        }}
      >
        <Text selectable style={{ color: colors.muted, fontSize: 16 }}>
          or continue with
        </Text>
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
          accessibilityLabel={item.label}
          accessibilityRole="button"
          key={item.label}
          style={({ pressed }) => ({
            height: 58,
            width: 58,
            borderRadius: 15,
            backgroundColor: colors.white,
            borderWidth: 1,
            borderColor: colors.line,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.75 : 1,
            boxShadow: '0 4px 14px rgba(15, 35, 52, 0.08)',
          })}
        >
          <AppIcon name={item.name} color="#40516a" size={25} />
        </Pressable>
      ))}
    </View>
  );
}

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <ScreenShell>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -58,
          right: -46,
          height: 220,
          width: 220,
          borderRadius: 110,
          backgroundColor: 'rgba(20, 232, 111, 0.1)',
          boxShadow: '0 0 80px rgba(20, 232, 111, 0.28)',
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: -78,
          bottom: 208,
          height: 180,
          width: 180,
          borderRadius: 90,
          backgroundColor: 'rgba(20, 232, 111, 0.07)',
          boxShadow: '0 0 70px rgba(20, 232, 111, 0.22)',
        }}
      />

      <View style={{ flex: 1, justifyContent: 'space-between', paddingTop: 24, gap: 16 }}>
        <View style={{ gap: 22 }}>
          <View style={{ alignItems: 'center', gap: 12 }}>
            <IconBubble name="people" size={64} />
            <View style={{ alignItems: 'center', gap: 6 }}>
              <Text
                selectable
                style={{
                  color: colors.ink,
                  fontSize: 30,
                  lineHeight: 36,
                  fontWeight: '900',
                  textAlign: 'center',
                }}
              >
                Welcome Back
              </Text>
              <Text
                selectable
                style={{
                  color: colors.muted,
                  fontSize: 15,
                  lineHeight: 22,
                  textAlign: 'center',
                  fontWeight: '600',
                }}
              >
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
                <Text selectable style={{ color: '#34445c', fontSize: 14, fontWeight: '800' }}>
                  Forgot Password?
                </Text>
              </Pressable>
            </View>
            <PrimaryButton
              label="Sign In"
              showArrow={false}
              height={56}
              onPress={() => navigation.navigate('VerifyEmail')}
            />
          </View>

          <View style={{ gap: 14 }}>
            <Divider />
            <BiometricButtons />
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            paddingBottom: 10,
          }}
        >
          <Text selectable style={{ color: '#40516a', fontSize: 14 }}>
            Don't have an account?
          </Text>
          <LinkText label="Sign Up" onPress={() => navigation.navigate('Register')} />
        </View>
      </View>
    </ScreenShell>
  );
}
