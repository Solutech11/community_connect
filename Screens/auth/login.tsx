import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import FormField from '../Components/form-field';
import IconBubble from '../Components/icon-bubble';
import LinkText from '../Components/link-text';
import PrimaryButton from '../Components/primary-button';
import ScreenShell from '../Components/screen-shell';
import SocialRow from '../Components/social-row';
import { colors } from '../Components/theme';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <ScreenShell>
      <View style={{ flex: 1, justifyContent: 'center', gap: 28 }}>
        <View style={{ alignItems: 'center', gap: 14 }}>
          <IconBubble name="people" size={70} />
          <Text selectable style={{ color: colors.ink, fontSize: 28, fontWeight: '900' }}>
            Welcome Back
          </Text>
          <Text selectable style={{ color: colors.muted, fontSize: 14, textAlign: 'center' }}>
            Sign in to connect with your community.
          </Text>
        </View>

        <View style={{ gap: 16 }}>
          <FormField
            label="Email Address"
            placeholder="hello@example.com"
            icon="mail"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <FormField
            label="Password"
            placeholder="Enter your password"
            icon="lock-closed"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <View style={{ alignItems: 'flex-end' }}>
            <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
              <Text selectable style={{ color: colors.ink, fontSize: 12, fontWeight: '700' }}>
                Forgot Password?
              </Text>
            </Pressable>
          </View>
          <PrimaryButton label="Sign In" onPress={() => navigation.navigate('VerifyEmail')} />
        </View>

        <SocialRow />

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <Text selectable style={{ color: colors.muted, fontSize: 13 }}>
            Don't have an account?
          </Text>
          <LinkText label="Sign Up" onPress={() => navigation.navigate('Register')} />
        </View>
      </View>
    </ScreenShell>
  );
}
