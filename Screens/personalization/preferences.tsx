import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import AppIcon from '../Components/app-icon';
import PrimaryButton from '../Components/primary-button';
import { colors } from '../Components/theme';
import SetupLayout from '../Layouts/setup-layout';
import type { RootStackParamList } from '../navigation';
import { setupSteps } from '../setup-flow';

type Props = NativeStackScreenProps<RootStackParamList, 'Preferences'>;

export default function PreferencesScreen({ navigation }: Props) {
  const [phone, setPhone] = useState('');
  const [venue, setVenue] = useState<'Indoor' | 'Outdoor'>('Indoor');
  const [groupSize, setGroupSize] = useState('Medium (5-20)');
  const [role, setRole] = useState<'Participant' | 'Organizer'>('Participant');

  return (
    <SetupLayout step={setupSteps.preferences} onBack={() => navigation.goBack()}>
      <View style={{ flex: 1, gap: 18 }}>
        <View style={{ gap: 7 }}>
          <Text selectable style={{ color: colors.ink, fontSize: 29, fontWeight: '900' }}>
            Preferences
          </Text>
          <Text selectable style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
            Help us personalize your community experience.
          </Text>
        </View>

        <Text selectable style={{ color: colors.ink, fontSize: 14, fontWeight: '900' }}>
          Do you prefer?
        </Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {['Indoor', 'Outdoor'].map((item) => {
            const selected = venue === item;
            return (
            <Pressable
              key={item}
              accessibilityRole="button"
              onPress={() => setVenue(item as 'Indoor' | 'Outdoor')}
              style={{
                flex: 1,
                height: 82,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: selected ? colors.lime : colors.line,
                backgroundColor: selected ? colors.paleGreen : colors.white,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <AppIcon name={item === 'Indoor' ? 'home' : 'trail-sign'} color={colors.ink} size={20} />
              <Text selectable style={{ color: colors.ink, fontSize: 13, fontWeight: '800' }}>
                {item}
              </Text>
            </Pressable>
            );
          })}
        </View>

        <Text selectable style={{ color: colors.ink, fontSize: 14, fontWeight: '900' }}>
          Preferred Group Size
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {['Small (1-5)', 'Medium (5-20)', 'Large (20+)'].map((item) => {
            const selected = groupSize === item;
            return (
            <Pressable
              key={item}
              accessibilityRole="button"
              onPress={() => setGroupSize(item)}
              style={{
                flex: 1,
                minHeight: 44,
                borderRadius: 22,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: selected ? colors.lime : colors.white,
                borderWidth: 1,
                borderColor: selected ? colors.lime : colors.line,
                paddingHorizontal: 8,
              }}
            >
              <Text selectable style={{ color: colors.ink, fontSize: 11, fontWeight: '800', textAlign: 'center' }}>
                {item}
              </Text>
            </Pressable>
            );
          })}
        </View>

        <Text selectable style={{ color: colors.ink, fontSize: 14, fontWeight: '900' }}>
          I want to be an:
        </Text>
        <View
          style={{
            minHeight: 46,
            borderRadius: 23,
            backgroundColor: '#eef4f6',
            padding: 4,
            flexDirection: 'row',
          }}
        >
          <Pressable
            accessibilityRole="button"
            onPress={() => setRole('Participant')}
            style={{
              flex: 1,
              borderRadius: 20,
              backgroundColor: role === 'Participant' ? colors.white : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text selectable style={{ color: colors.ink, fontSize: 12, fontWeight: '800' }}>
              Participant
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setRole('Organizer')}
            style={{
              flex: 1,
              borderRadius: 20,
              backgroundColor: role === 'Organizer' ? colors.white : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text selectable style={{ color: colors.muted, fontSize: 12, fontWeight: '800' }}>
              Organizer
            </Text>
          </Pressable>
        </View>

        <View style={{ gap: 8 }}>
          <Text selectable style={{ color: colors.ink, fontSize: 13, fontWeight: '800' }}>
            Phone Number
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View
              style={{
                minHeight: 54,
                borderRadius: 17,
                borderWidth: 1,
                borderColor: colors.line,
                backgroundColor: colors.white,
                paddingHorizontal: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Text selectable style={{ color: colors.ink, fontSize: 14, fontWeight: '800' }}>
                NG
              </Text>
              <Text selectable style={{ color: colors.muted, fontSize: 14, fontWeight: '700' }}>
                +234
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                minHeight: 54,
                borderRadius: 17,
                borderWidth: 1,
                borderColor: colors.line,
                backgroundColor: colors.white,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <AppIcon name="call" color={colors.softMuted} size={18} />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="801 234 5678"
                placeholderTextColor="#9aa8b7"
                style={{ flex: 1, color: colors.ink, fontSize: 15, fontWeight: '600' }}
              />
            </View>
          </View>
        </View>
        <View style={{ flex: 1 }} />
        <PrimaryButton label="Continue" onPress={() => navigation.navigate('PersonalizationTopics')} />
      </View>
    </SetupLayout>
  );
}
