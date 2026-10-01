import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import AppSelectSheet from './app-select-sheet';
import { colors, fonts } from '../../styles/theme';

type Props = {
  label: string;
  placeholder: string;
  options: readonly string[];
  value?: string;
  selectedValues?: readonly string[];
  multiple?: boolean;
  maxSelections?: number;
  disabled?: boolean;
  onChange?: (value: string) => void;
  onToggleSelected?: (value: string) => void;
  onLimitReached?: () => void;
};

export default function AppSelectField({
  label,
  placeholder,
  options,
  value = '',
  selectedValues = [],
  multiple = false,
  maxSelections,
  disabled = false,
  onChange,
  onToggleSelected,
  onLimitReached,
}: Props) {
  const [visible, setVisible] = useState(false);
  const summary = multiple
    ? selectedValues.length > 2
      ? `${selectedValues.slice(0, 2).join(', ')} +${selectedValues.length - 2}`
      : selectedValues.join(', ')
    : value;

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled, expanded: visible }}
        disabled={disabled}
        onPress={() => setVisible(true)}
        style={[styles.field, disabled && styles.disabled]}
      >
        <Text
          numberOfLines={1}
          style={[styles.value, !summary && styles.placeholder]}
        >
          {summary || placeholder}
        </Text>
        <Ionicons color={colors.softMuted} name="chevron-down" size={19} />
      </Pressable>
      <AppSelectSheet
        visible={visible}
        title={label}
        options={[...options]}
        value={value}
        selectedValues={selectedValues}
        multiple={multiple}
        maxSelections={maxSelections}
        disabled={disabled}
        onClose={() => setVisible(false)}
        onSelect={(nextValue) => onChange?.(nextValue)}
        onToggle={onToggleSelected}
        onLimitReached={onLimitReached}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fieldWrap: {
    marginTop: 16,
  },
  label: {
    color: '#399760',
    fontFamily: fonts.bold,
    fontSize: 15,
    marginBottom: 10,
    paddingLeft: 12,
  },
  field: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: 22,
    borderWidth: 1,
    elevation: 2,
    flexDirection: 'row',
    gap: 10,
    minHeight: 56,
    paddingHorizontal: 20,
  },
  value: {
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 15,
  },
  placeholder: {
    color: colors.softMuted,
  },
  disabled: {
    opacity: 0.55,
  },
});
