import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import IconBubble from '../../components/ui/icon-bubble';
import LinkText from '../../components/ui/link-text';
import PrimaryButton from '../../components/ui/primary-button';
import { colors, fonts } from '../../styles/theme';
import SetupLayout from '../../layouts/setup-layout';
import type { RootStackParamList } from '../../types/navigation';
import { setupSteps } from '../../types/setup-flow';

type Props = NativeStackScreenProps<RootStackParamList, 'VerifyEmail'>;

export default function VerifyEmailScreen({ navigation }: Props) {
  const [code, setCode] = useState(['', '', '', '']);
  const inputs = useRef<Array<TextInput | null>>([]);

  const updateDigit = (value: string, index: number) => {
    const digit = value.slice(-1);
    setCode((current) => current.map((item, itemIndex) => (itemIndex === index ? digit : item)));
    if (digit && index < 3) {
      inputs.current[index + 1]?.focus();
    }
  };

  return (
    <SetupLayout step={setupSteps.verifyEmail} onBack={() => navigation.goBack()}>
      <View style={{ flex: 1, gap: 22 }}>
        <View style={{ alignItems: 'center', gap: 18, paddingTop: 28 }}>
          <IconBubble name="mail-unread" size={118} />
          <Text selectable style={{ color: colors.ink, fontSize: 25, fontFamily: fonts.extraBold }}>
            Check your inbox
          </Text>
          <Text selectable style={{ color: colors.muted, fontSize: 14, lineHeight: 22, textAlign: 'center' }}>
            We have sent a 4-digit code to{' '}
            <Text style={{ color: colors.ink, fontFamily: fonts.extraBold }}>alex@email.com</Text>. Please enter it
            below to verify your account.
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 13, justifyContent: 'center' }}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(node) => {
                inputs.current[index] = node;
              }}
              value={digit}
              onChangeText={(value) => updateDigit(value, index)}
              keyboardType="number-pad"
              maxLength={1}
              placeholder="-"
              placeholderTextColor="#b4c0cc"
              style={{
                height: 56,
                width: 56,
                borderRadius: 28,
                backgroundColor: index === 0 || digit ? colors.white : '#f1f5f6',
                borderWidth: index === 0 || digit ? 2 : 0,
                borderColor: colors.lime,
                color: colors.ink,
                textAlign: 'center',
                fontSize: 20,
                fontFamily: fonts.extraBold,
              }}
            />
          ))}
        </View>

        <View style={{ alignItems: 'center', gap: 4 }}>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <Text selectable style={{ color: colors.muted, fontSize: 12 }}>
              Didn't receive code?
            </Text>
            <LinkText label="Resend Code" onPress={() => undefined} />
          </View>
          <Text selectable style={{ color: colors.softMuted, fontSize: 11 }}>
            Resend code in 00:30
          </Text>
        </View>

        <View style={{ flex: 1 }} />
      <PrimaryButton label="Verify Email" onPress={() => navigation.navigate('PersonalizationForm')} />
      </View>
    </SetupLayout>
  );
}
