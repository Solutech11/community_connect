import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import AppIcon, { AppIconName } from './app-icon';
import { colors } from '../../styles/theme';

type Props = {
  label: string;
  placeholder: string;
  icon?: AppIconName;
  options: string[];
  value: string;
  onChange: (value: string) => void;
};

export default function SelectField({
  label,
  placeholder,
  icon,
  options,
  value,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <View style={{ gap: 8 }}>
      <Text selectable style={{ color: colors.ink, fontSize: 13, fontWeight: '800' }}>
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen((current) => !current)}
        style={{
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
        {icon ? <AppIcon name={icon} color={colors.softMuted} size={18} /> : null}
        <Text
          selectable
          style={{
            flex: 1,
            color: value ? colors.ink : '#9aa8b7',
            fontSize: 15,
            fontWeight: '600',
          }}
        >
          {value || placeholder}
        </Text>
        <AppIcon name={open ? 'chevron-up' : 'chevron-down'} color={colors.softMuted} size={18} />
      </Pressable>

      {open ? (
        <View
          style={{
            borderRadius: 17,
            borderWidth: 1,
            borderColor: colors.line,
            backgroundColor: colors.white,
            overflow: 'hidden',
          }}
        >
          {options.map((option) => (
            <Pressable
              accessibilityRole="button"
              key={option}
              onPress={() => {
                onChange(option);
                setOpen(false);
              }}
              style={{
                minHeight: 46,
                paddingHorizontal: 16,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'space-between',
                backgroundColor: value === option ? colors.paleGreen : colors.white,
              }}
            >
              <Text selectable style={{ color: colors.ink, fontSize: 14, fontWeight: '700' }}>
                {option}
              </Text>
              {value === option ? <AppIcon name="checkmark-circle" color={colors.lime} size={18} /> : null}
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
