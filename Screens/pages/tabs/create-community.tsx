import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { lightTap as tapFeedback } from '../../hooks/haptics';
import { colors, fonts } from '../../styles/theme';
import type { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateCommunity'>;
type GroupType = 'public' | 'private' | 'paid';

type TypeOptionMeta = {
  key: GroupType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const groupTypes: TypeOptionMeta[] = [
  { key: 'public', label: 'Public', icon: 'globe-outline' },
  { key: 'private', label: 'Private', icon: 'lock-closed-outline' },
  { key: 'paid', label: 'Paid', icon: 'cash-outline' },
];

function TypeOption({
  label,
  icon,
  selected,
  onPress,
  onLayout,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
  onLayout: (event: LayoutChangeEvent) => void;
}) {
  const scale = useRef(new Animated.Value(selected ? 1 : 0.96)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: selected ? 1 : 0.96,
      friction: 7,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [scale, selected]);

  return (
    <Pressable
      accessibilityRole="button"
      onLayout={onLayout}
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      style={({ pressed }) => [styles.typeOption, pressed && styles.pressed]}
    >
      <Animated.View style={[styles.typeOptionInner, { transform: [{ scale }] }]}>
        <Ionicons name={icon} size={21} color={selected ? colors.ink : '#4aa26f'} />
        <Text style={[styles.typeOptionText, selected ? styles.typeOptionTextActive : styles.typeOptionTextIdle]}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export default function CreateCommunityScreen({ navigation }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [groupType, setGroupType] = useState<GroupType>('public');
  const [maxUsers, setMaxUsers] = useState('');
  const [groupKey, setGroupKey] = useState('');
  const [monthlyFee, setMonthlyFee] = useState('');
  const [adminOnlyChat, setAdminOnlyChat] = useState(false);
  const [optionLayouts, setOptionLayouts] = useState<Record<GroupType, { x: number; width: number }>>({
    public: { x: 0, width: 0 },
    private: { x: 0, width: 0 },
    paid: { x: 0, width: 0 },
  });

  const showMonthlyFee = groupType === 'paid';
  const activeX = useRef(new Animated.Value(0)).current;
  const activeWidth = useRef(new Animated.Value(0)).current;
  const activeOpacity = useRef(new Animated.Value(0)).current;

  const activeLayout = optionLayouts[groupType];

  useEffect(() => {
    if (!activeLayout.width) {
      return;
    }

    Animated.parallel([
      Animated.timing(activeX, {
        toValue: activeLayout.x,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(activeWidth, {
        toValue: activeLayout.width,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(activeOpacity, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [activeLayout, activeOpacity, activeWidth, activeX]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={process.env.EXPO_OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardWrap}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <Ionicons name="arrow-back" size={24} color="#4aa26f" />
          </Pressable>
          <Text numberOfLines={1} style={styles.headerTitle}>Create Community</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={styles.content}
          contentInsetAdjustmentBehavior="automatic"
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Group Title</Text>
            <TextInput
              placeholder="e.g. Weekend Hikers"
              placeholderTextColor="#9fccb0"
              style={styles.input}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              multiline
              placeholder="What is this community about?"
              placeholderTextColor="#9fccb0"
              style={[styles.input, styles.textArea]}
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Group Type</Text>
            <View style={styles.typeRow}>
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.typeActivePill,
                  {
                    opacity: activeOpacity,
                    transform: [{ translateX: activeX }],
                    width: activeWidth,
                  },
                ]}
              />
              {groupTypes.map((item) => (
                <TypeOption
                  key={item.key}
                  icon={item.icon}
                  label={item.label}
                  selected={groupType === item.key}
                  onPress={() => setGroupType(item.key)}
                  onLayout={(event) => {
                    const { x, width } = event.nativeEvent.layout;
                    setOptionLayouts((current) => ({
                      ...current,
                      [item.key]: { x, width },
                    }));
                  }}
                />
              ))}
            </View>
          </View>

          <View style={styles.dualRow}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Max Users</Text>
              <View style={styles.compactInputWrap}>
                <Ionicons name="people-outline" size={18} color="#4aa26f" />
                <TextInput
                  placeholder="Unlimited"
                  placeholderTextColor="#9fccb0"
                  style={styles.compactInput}
                  value={maxUsers}
                  onChangeText={setMaxUsers}
                />
              </View>
            </View>

            <View style={styles.halfField}>
              <Text style={styles.label}>Group Key</Text>
              <View style={styles.compactInputWrap}>
                <Ionicons name="key-outline" size={18} color="#4aa26f" />
                <TextInput
                  placeholder="Optional"
                  placeholderTextColor="#9fccb0"
                  style={styles.compactInput}
                  value={groupKey}
                  onChangeText={setGroupKey}
                />
              </View>
            </View>
          </View>

          {showMonthlyFee ? (
            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Monthly Fee</Text>
              <TextInput
                keyboardType="decimal-pad"
                placeholder="e.g. $10.00"
                placeholderTextColor="#9fccb0"
                style={styles.input}
                value={monthlyFee}
                onChangeText={setMonthlyFee}
              />
            </View>
          ) : null}

          <View style={styles.toggleCard}>
            <View style={styles.toggleLeft}>
              <View style={styles.toggleIconWrap}>
                <Ionicons name="shield-checkmark-outline" size={21} color="#16c35c" />
              </View>
              <View style={styles.toggleCopy}>
                <Text style={styles.toggleTitle}>Admin Chat Only</Text>
                <Text style={styles.toggleBody}>Only admins can send messages</Text>
              </View>
            </View>
            <View style={styles.switchWrap}>
              <Switch
                onValueChange={setAdminOnlyChat}
                value={adminOnlyChat}
                trackColor={{ false: '#dbe2ed', true: '#b7f4cd' }}
                thumbColor="#ffffff"
                ios_backgroundColor="#dbe2ed"
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.stickyActionWrap}>
          <Pressable
            accessibilityRole="button"
            onPress={tapFeedback}
            style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}
          >
            <Text style={styles.primaryActionText}>Create Community</Text>
            <Ionicons name="arrow-forward" size={26} color={colors.ink} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7fbf8',
  },
  keyboardWrap: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#f7fbf8',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 72,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    shadowColor: '#e2ebe4',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    width: 48,
  },
  headerTitle: {
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.extraBold,
    fontSize: 23,
    paddingHorizontal: 14,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 48,
  },
  content: {
    paddingBottom: 128,
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  fieldBlock: {
    marginBottom: 24,
  },
  label: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 16,
    marginBottom: 10,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 28,
    color: colors.ink,
    fontFamily: fonts.medium,
    fontSize: 15,
    minHeight: 64,
    paddingHorizontal: 24,
    shadowColor: '#edf3ef',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  textArea: {
    minHeight: 142,
    paddingBottom: 18,
    paddingTop: 20,
  },
  typeRow: {
    backgroundColor: colors.white,
    borderRadius: 30,
    flexDirection: 'row',
    padding: 6,
    position: 'relative',
    shadowColor: '#edf3ef',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  typeActivePill: {
    backgroundColor: colors.lime,
    borderRadius: 24,
    bottom: 6,
    left: 0,
    position: 'absolute',
    top: 6,
  },
  typeOption: {
    flex: 1,
  },
  typeOptionInner: {
    alignItems: 'center',
    borderRadius: 24,
    gap: 7,
    justifyContent: 'center',
    minHeight: 72,
  },
  typeOptionText: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  typeOptionTextActive: {
    color: colors.ink,
  },
  typeOptionTextIdle: {
    color: '#4aa26f',
  },
  dualRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 24,
  },
  halfField: {
    flex: 1,
  },
  compactInputWrap: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 24,
    flexDirection: 'row',
    gap: 10,
    minHeight: 58,
    paddingHorizontal: 18,
    shadowColor: '#edf3ef',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  compactInput: {
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 15,
  },
  toggleCard: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 88,
    paddingHorizontal: 16,
    shadowColor: '#edf3ef',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  toggleLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    minWidth: 0,
  },
  toggleIconWrap: {
    alignItems: 'center',
    backgroundColor: '#e9fff0',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  toggleCopy: {
    flex: 1,
    paddingHorizontal: 14,
  },
  toggleTitle: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 15,
  },
  toggleBody: {
    color: '#46a26e',
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  switchWrap: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 10,
  },
  stickyActionWrap: {
    backgroundColor: 'rgba(247, 251, 248, 0.96)',
    paddingBottom: 14,
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  primaryAction: {
    alignItems: 'center',
    backgroundColor: colors.lime,
    borderRadius: 28,
    flexDirection: 'row',
    gap: 10,
    height: 64,
    justifyContent: 'center',
    shadowColor: '#8aefaf',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  primaryActionText: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 17,
  },
  pressed: {
    opacity: 0.84,
  },
});
