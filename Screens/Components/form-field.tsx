import { Text, TextInput, View } from 'react-native';

import AppIcon, { AppIconName } from './app-icon';
import { colors } from './theme';

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
}: Props) {
  return (
    <View style={{ gap: 8 }}>
      <Text selectable style={{ color: colors.ink, fontSize: 13, fontWeight: '800' }}>
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
          keyboardType={keyboardType}
          style={{
            flex: 1,
            color: colors.ink,
            fontSize: 15,
            fontWeight: '600',
          }}
        />
        {rightIcon ? (
          <Text onPress={onRightIconPress} style={{ padding: 4 }}>
            <AppIcon name={rightIcon} color={colors.softMuted} size={22} />
          </Text>
        ) : null}
      </View>
    </View>
  );
}
