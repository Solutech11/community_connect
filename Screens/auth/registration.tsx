import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import AppIcon from '../Components/app-icon';
import FormField from '../Components/form-field';
import LinkText from '../Components/link-text';
import PrimaryButton from '../Components/primary-button';
import SelectField from '../Components/select-field';
import { colors } from '../Components/theme';
import SetupLayout from '../Layouts/setup-layout';
import type { RootStackParamList } from '../navigation';
import { setupSteps } from '../setup-flow';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export default function RegistrationScreen({ navigation }: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  return (
    <SetupLayout step={setupSteps.register} onBack={() => navigation.goBack()}>
      <View style={{ gap: 14 }}>
        <View style={{ gap: 6 }}>
          <Text selectable style={{ color: colors.ink, fontSize: 26, lineHeight: 30, fontWeight: '900' }}>
            Join{'\n'}CommunityConnect
          </Text>
          <Text selectable style={{ color: colors.muted, fontSize: 13, lineHeight: 19 }}>
            Sign up to start connecting with your local community and discover events near you.
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
        <FormField label="Username" placeholder="janedoe123" icon="at" value={username} onChangeText={setUsername} />
        <FormField
          label="Email Address"
          placeholder="jane@example.com"
          icon="mail"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <FormField
          label="Password"
          placeholder="********"
          icon="lock-closed"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <SelectField
          label="Gender"
          placeholder="Select your gender"
          icon="male-female"
          value={gender}
          onChange={setGender}
          options={['Female', 'Male']}
        />

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: acceptedTerms }}
          onPress={() => setAcceptedTerms((current) => !current)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}
        >
          <View
            style={{
              height: 18,
              width: 18,
              borderRadius: 9,
              borderWidth: 1,
              borderColor: acceptedTerms ? colors.lime : colors.line,
              backgroundColor: acceptedTerms ? colors.lime : colors.white,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {acceptedTerms ? <AppIcon name="checkmark" color={colors.ink} size={13} /> : null}
          </View>
          <Text selectable style={{ flex: 1, color: colors.muted, fontSize: 12 }}>
            I agree to the Terms and Privacy Policy
          </Text>
        </Pressable>

        <PrimaryButton
          label="Create Account"
          disabled={!acceptedTerms}
          onPress={() => navigation.navigate('VerifyEmail')}
        />
        {!acceptedTerms ? (
          <Text selectable style={{ color: colors.muted, fontSize: 12, textAlign: 'center' }}>
            Accept the terms and privacy policy to continue.
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
          <Text selectable style={{ color: colors.muted, fontSize: 12 }}>
            Already a member?
          </Text>
          <LinkText label="Login" onPress={() => navigation.navigate('Login')} />
        </View>
      </View>
    </SetupLayout>
  );
}
