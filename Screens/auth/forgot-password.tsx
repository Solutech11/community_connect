import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Text, View } from 'react-native';

import FormField from '../Components/form-field';
import IconBubble from '../Components/icon-bubble';
import LinkText from '../Components/link-text';
import PrimaryButton from '../Components/primary-button';
import ScreenShell from '../Components/screen-shell';
import { colors } from '../Components/theme';
import TopBar from '../Components/top-bar';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');

  return (
    <ScreenShell>
      <View style={{ flex: 1, gap: 22 }}>
        <TopBar onBack={() => navigation.goBack()} />
        <View style={{ alignItems: 'center', gap: 18, paddingTop: 38 }}>
          <IconBubble name="refresh-circle" size={112} />
          <Text selectable style={{ color: colors.ink, fontSize: 25, fontWeight: '900' }}>
            Forgot Password?
          </Text>
          <Text selectable style={{ color: colors.muted, fontSize: 14, lineHeight: 22, textAlign: 'center' }}>
            Don't worry. It happens. Enter the email associated with your account.
          </Text>
        </View>
        <FormField
          label="Email Address"
          placeholder="hello@example.com"
          icon="mail"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <PrimaryButton label="Send Reset Link" onPress={() => navigation.navigate('VerifyEmail')} />
        <LinkText label="Remember password? Sign In" onPress={() => navigation.navigate('Login')} />
      </View>
    </ScreenShell>
  );
}
