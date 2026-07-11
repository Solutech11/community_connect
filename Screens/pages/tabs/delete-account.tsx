import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { ImageBackground, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppAlertModal from '../../components/ui/app-alert-modal';
import ProfilePageHeader from '../../components/ui/profile-page-header';
import { colors, fonts } from '../../styles/theme';
import type { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'DeleteAccount'>;

export default function DeleteAccountScreen({ navigation }: Props) {
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [alertVisible, setAlertVisible] = useState(false);
  const inputs = useRef<Array<TextInput | null>>([]);

  const updateOtp = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    setOtp((current) => current.map((item, itemIndex) => itemIndex === index ? digit : item));
    if (digit && index < 5) inputs.current[index + 1]?.focus();
  };

  return (
    <>
      <SafeAreaView style={styles.safeArea} edges={[]}>
        <ProfilePageHeader title="Delete Account" onBack={() => navigation.goBack()} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <ImageBackground
              source={{ uri: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1100&q=90' }}
              style={styles.hero}
              imageStyle={styles.heroImage}
            >
              <View style={styles.criticalPill}><Text style={styles.criticalText}>CRITICAL ACTION</Text></View>
            </ImageBackground>

            <View style={styles.warningCard}>
              <View style={styles.warningTitleRow}>
                <Ionicons name="warning-outline" size={30} color="#ff4141" />
                <Text style={styles.warningTitle}>This action is permanent</Text>
              </View>
              <Text style={styles.warningBody}>
                Deleting your CommunityConnect account will result in the immediate and permanent loss of all your hosted events, community connections, and any remaining wallet balance. This cannot be undone.
              </Text>
            </View>

            <Text style={styles.label}>CONFIRM PASSWORD</Text>
            <View style={styles.passwordField}>
              <Ionicons name="lock-closed-outline" size={25} color="#399760" />
              <TextInput
                placeholder="Enter your current password"
                placeholderTextColor="#778095"
                secureTextEntry
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <View style={styles.otpHeading}>
              <Text style={styles.label}>6-DIGIT OTP CODE</Text>
              <Pressable><Text style={styles.resend}>RESEND CODE</Text></Pressable>
            </View>
            <View style={styles.otpRow}>
              {otp.map((value, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => { inputs.current[index] = ref; }}
                  keyboardType="number-pad"
                  maxLength={1}
                  onChangeText={(text) => updateOtp(index, text)}
                  style={styles.otpInput}
                  value={value}
                />
              ))}
            </View>
            <Text style={styles.otpHint}>A code was sent to your registered email address.</Text>

            <Pressable onPress={() => setAlertVisible(true)} style={styles.deleteButton}>
              <Text style={styles.deleteText}>Delete My Account</Text>
            </Pressable>
            <Pressable onPress={() => navigation.goBack()} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel and Go Back</Text>
            </Pressable>

            <View style={styles.secureRow}>
              <Ionicons name="shield-checkmark-outline" size={21} color="#a5d9bb" />
              <Text style={styles.secureText}>SECURE SESSION</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <AppAlertModal
        visible={alertVisible}
        title="Delete Account"
        message="Account deletion requires final support confirmation."
        onClose={() => setAlertVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.paper, flex: 1 },
  content: { paddingBottom: 34, paddingHorizontal: 38, paddingTop: 30 },
  hero: { height: 300, justifyContent: 'flex-end', overflow: 'hidden' },
  heroImage: { borderRadius: 38 },
  criticalPill: { alignSelf: 'flex-start', backgroundColor: '#ff4444', borderRadius: 18, margin: 18, paddingHorizontal: 15, paddingVertical: 7 },
  criticalText: { color: colors.white, fontFamily: fonts.extraBold, fontSize: 15 },
  warningCard: { backgroundColor: colors.white, borderRadius: 34, elevation: 2, marginTop: 28, padding: 28 },
  warningTitleRow: { alignItems: 'center', flexDirection: 'row', gap: 16 },
  warningTitle: { color: colors.ink, flex: 1, fontFamily: fonts.extraBold, fontSize: 24 },
  warningBody: { color: '#31885a', fontFamily: fonts.medium, fontSize: 16, lineHeight: 33, marginTop: 18 },
  label: { color: '#399760', fontFamily: fonts.bold, fontSize: 15, letterSpacing: 0.4, marginTop: 34 },
  passwordField: { alignItems: 'center', backgroundColor: colors.white, borderRadius: 30, elevation: 2, flexDirection: 'row', height: 72, marginTop: 14, paddingHorizontal: 27 },
  passwordInput: { color: colors.ink, flex: 1, fontFamily: fonts.medium, fontSize: 17, marginLeft: 16 },
  otpHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  resend: { color: '#00ac4f', fontFamily: fonts.bold, fontSize: 15, marginTop: 34 },
  otpRow: { flexDirection: 'row', gap: 16, justifyContent: 'space-between', marginTop: 18 },
  otpInput: { backgroundColor: colors.white, borderRadius: 30, elevation: 2, fontFamily: fonts.bold, fontSize: 22, height: 76, textAlign: 'center', width: 58 },
  otpHint: { color: '#72aa87', fontFamily: fonts.medium, fontSize: 14, fontStyle: 'italic', marginTop: 28, textAlign: 'center' },
  deleteButton: { alignItems: 'center', backgroundColor: '#fb4141', borderRadius: 34, elevation: 4, height: 82, justifyContent: 'center', marginTop: 52 },
  deleteText: { color: colors.white, fontFamily: fonts.extraBold, fontSize: 23 },
  cancelButton: { alignItems: 'center', backgroundColor: colors.white, borderColor: '#dce7e1', borderRadius: 34, borderWidth: 1, height: 72, justifyContent: 'center', marginTop: 16 },
  cancelText: { color: '#399760', fontFamily: fonts.bold, fontSize: 17 },
  secureRow: { alignItems: 'center', flexDirection: 'row', gap: 10, justifyContent: 'center', marginTop: 46 },
  secureText: { color: '#a5d9bb', fontFamily: fonts.medium, fontSize: 14, letterSpacing: 1.2 },
});
