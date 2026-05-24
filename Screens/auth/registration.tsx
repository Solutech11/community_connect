import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Text, View } from 'react-native';

import FormField from '../Components/form-field';
import PrimaryButton from '../Components/primary-button';
import SelectField from '../Components/select-field';
import SocialRow from '../Components/social-row';
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
          options={['Female', 'Male', 'Non-binary', 'Prefer not to say']}
        />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
          <View
            style={{
              height: 18,
              width: 18,
              borderRadius: 9,
              borderWidth: 1,
              borderColor: colors.line,
              backgroundColor: colors.white,
            }}
          />
          <Text selectable style={{ flex: 1, color: colors.muted, fontSize: 12 }}>
            I agree to the Terms and Privacy Policy
          </Text>
        </View>

        <PrimaryButton label="Create Account" onPress={() => navigation.navigate('VerifyEmail')} />
        <SocialRow />
        <Text selectable style={{ color: colors.muted, fontSize: 12, textAlign: 'center' }}>
          Already a member? Login
        </Text>
      </View>
    </SetupLayout>
  );
}
