import { Pressable, Text, TextInput, View } from 'react-native';

import AppIcon, { AppIconName } from './app-icon';
import { colors, fonts } from '../../styles/theme';

type Props = {
  label: string;
  placeholder: string;
  secureTextEntry?: boolean;
  icon?: AppIconName;
  rightIcon?: AppIconName;
  onRightIconPress?: () => void;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'email-address' | 'number-pad' | 'phone-pad';
  fieldHeight?: number;
  autoComplete?: 'off' | 'name' | 'family-name' | 'given-name' | 'username' | 'new-password'| 'password' | 'email' | 'name' | 'tel' | 'street-address' | 'postal-code' | 'cc-number' | 'cc-csc' | 'cc-exp' | 'cc-exp-month' | 'cc-exp-year';
};

export default function FormField({
  label,
  placeholder,
  secureTextEntry,
  icon,
  rightIcon,
  onRightIconPress,
  value,
  onChangeText,
  keyboardType = 'default',
  fieldHeight = 54,
  autoComplete="off"
}: Props) {
  return (
    <View style={{ gap: 8 }}>
      <Text selectable style={{ color: colors.ink, fontSize: 13, fontFamily: fonts.extraBold }}>
        {label}
      </Text>
      <View
        style={{
          minHeight: fieldHeight,
          borderRadius: fieldHeight / 2,
          borderWidth: 1,
          borderColor: colors.line,
          backgroundColor: colors.white,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}
      >
        {icon ? (
          <AppIcon name={icon} color={colors.softMuted} size={18} />
        ) : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9aa8b7"
          secureTextEntry={secureTextEntry}
          autoComplete={autoComplete}
          keyboardType={keyboardType}
          style={{
            flex: 1,
            color: colors.ink,
            fontSize: 15,
            fontFamily: fonts.semiBold,
          }}
        />
        {rightIcon ? (
          <Pressable
            accessibilityLabel={rightIcon === 'eye' ? 'Hide password' : 'Show password'}
            accessibilityRole="button"
            hitSlop={10}
            onPress={onRightIconPress}
            style={{ padding: 4 }}
          >
            <AppIcon name={rightIcon} color={colors.softMuted} size={22} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
