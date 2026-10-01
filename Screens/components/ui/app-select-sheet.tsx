import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { colors, fonts } from "../../styles/theme";

type AppSelectSheetProps = {
  visible: boolean;
  title: string;
  options: string[];
  value: string;
  selectedValues?: readonly string[];
  multiple?: boolean;
  maxSelections?: number;
  disabled?: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  onToggle?: (value: string) => void;
  onLimitReached?: () => void;
  allowCustomValue?: boolean;
};

export default function AppSelectSheet({
  visible,
  title,
  options,
  value,
  selectedValues = [],
  multiple = false,
  maxSelections,
  disabled = false,
  onClose,
  onSelect,
  onToggle,
  onLimitReached,
  allowCustomValue = false,
}: AppSelectSheetProps) {
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!visible) return;

    // Dismiss a focused form input keyboard behind the native Modal so it cannot
    // cover the selection sheet search field when the sheet opens.
    Keyboard.dismiss();
    setQuery("");
    setSearchFocused(false);
  }, [visible]);

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return options;
    }
    return options.filter((option) =>
      option.toLowerCase().includes(normalized),
    );
  }, [options, query]);

  const close = () => {
    Keyboard.dismiss();
    setSearchFocused(false);
    setQuery("");
    onClose();
  };

  const select = (option: string) => {
    if (multiple) {
      const alreadySelected = selectedValues.includes(option);
      if (
        !alreadySelected &&
        maxSelections !== undefined &&
        selectedValues.length >= maxSelections
      ) {
        onLimitReached?.();
        return;
      }
      onToggle?.(option);
      return;
    }

    Keyboard.dismiss();
    setSearchFocused(false);
    setQuery("");
    onSelect(option);
    onClose();
  };

  const customValue = query.trim();
  const canUseCustomValue =
    allowCustomValue &&
    !multiple &&
    customValue.length > 1 &&
    !options.some(
      (option) => option.toLowerCase() === customValue.toLowerCase(),
    );

  return (
    <Modal
      animationType="slide"
      onRequestClose={close}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel="Close selection"
          onPress={close}
          style={StyleSheet.absoluteFillObject}
        />
        <KeyboardAvoidingView
          behavior="padding"
          pointerEvents="box-none"
          style={[styles.keyboardArea, { paddingTop: insets.top }]}
        >
          <SafeAreaView
            edges={["bottom"]}
            style={[styles.sheet, searchFocused && styles.searchingSheet]}
          >
            <View style={styles.handle} />
            <View style={styles.heading}>
              <Text style={styles.title}>{title}</Text>
              {multiple ? (
                <Text style={styles.selectionCount}>
                  {selectedValues.length}
                  {maxSelections ? `/${maxSelections}` : ""} selected
                </Text>
              ) : null}
              <Pressable
                hitSlop={10}
                onPress={close}
                style={styles.closeButton}
              >
                <Ionicons color={colors.ink} name="close" size={24} />
              </Pressable>
            </View>
            <View style={styles.search}>
              <Ionicons color="#37955e" name="search" size={20} />
              <TextInput
                accessibilityLabel={"Search " + title.toLowerCase()}
                autoCapitalize="none"
                autoCorrect={false}
                onBlur={() => setSearchFocused(false)}
                onChangeText={setQuery}
                onFocus={() => setSearchFocused(true)}
                returnKeyType="search"
                onSubmitEditing={Keyboard.dismiss}
                placeholder={"Search " + title.toLowerCase()}
                placeholderTextColor="#718096"
                style={styles.searchInput}
                value={query}
              />
            </View>
            {canUseCustomValue && !disabled ? (
              <Pressable
                onPress={() => select(customValue)}
                style={styles.customOption}
              >
                <Ionicons color="#08ad54" name="add-circle-outline" size={22} />
                <Text style={styles.customText}>
                  Use &quot;{customValue}&quot;
                </Text>
              </Pressable>
            ) : null}
            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <Text style={styles.empty}>No matching options found.</Text>
              }
              style={styles.optionsList}
              renderItem={({ item }) => {
                const selected = multiple
                  ? selectedValues.includes(item)
                  : item === value;
                const atSelectionLimit = Boolean(
                  multiple &&
                  maxSelections &&
                  selectedValues.length >= maxSelections &&
                  !selected,
                );
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected, disabled }}
                    disabled={disabled}
                    onPress={() => select(item)}
                    style={[
                      styles.option,
                      selected && styles.optionSelected,
                      (disabled || atSelectionLimit) && styles.optionDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selected && styles.optionTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                    {selected ? (
                      <Ionicons
                        color="#08ad54"
                        name="checkmark-circle"
                        size={22}
                      />
                    ) : null}
                  </Pressable>
                );
              }}
              showsVerticalScrollIndicator={false}
            />
            {multiple ? (
              <Pressable
                accessibilityRole="button"
                disabled={disabled}
                onPress={close}
                style={[styles.doneButton, disabled && styles.optionDisabled]}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </Pressable>
            ) : null}
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: "rgba(4, 15, 10, 0.36)",
    flex: 1,
  },
  keyboardArea: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: "78%",
    maxHeight: "100%",
    flexShrink: 1,
    paddingHorizontal: 22,
    paddingTop: 10,
  },
  searchingSheet: {
    height: "100%",
  },
  handle: {
    alignSelf: "center",
    backgroundColor: "#d9e6df",
    borderRadius: 3,
    height: 5,
    width: 48,
  },
  heading: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: 15,
  },
  title: {
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.extraBold,
    fontSize: 21,
  },
  selectionCount: {
    color: colors.muted,
    fontFamily: fonts.semiBold,
    fontSize: 12,
    marginRight: 12,
  },
  closeButton: {
    alignItems: "center",
    backgroundColor: "#eff8f3",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  search: {
    alignItems: "center",
    backgroundColor: colors.paper,
    borderColor: "#dbece3",
    borderRadius: 25,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 12,
    marginTop: 18,
    paddingHorizontal: 16,
  },
  searchInput: {
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    minHeight: 50,
    paddingHorizontal: 10,
  },
  customOption: {
    alignItems: "center",
    backgroundColor: "#eaf9f1",
    borderRadius: 18,
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
    padding: 14,
  },
  customText: {
    color: "#168a4a",
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  option: {
    alignItems: "center",
    borderBottomColor: "#edf3f0",
    borderBottomWidth: 1,
    flexDirection: "row",
    minHeight: 54,
    paddingHorizontal: 8,
  },
  optionsList: {
    flex: 1,
    minHeight: 0,
  },
  optionSelected: {
    backgroundColor: "#f0fbf5",
    borderRadius: 16,
    paddingHorizontal: 14,
  },
  optionText: {
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 15,
  },
  optionTextSelected: {
    color: "#078f43",
    fontFamily: fonts.bold,
  },
  optionDisabled: {
    opacity: 0.45,
  },
  doneButton: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: 24,
    justifyContent: "center",
    marginBottom: 12,
    marginTop: 6,
    minHeight: 50,
  },
  doneButtonText: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 15,
  },
  empty: {
    color: colors.muted,
    fontFamily: fonts.medium,
    lineHeight: 22,
    padding: 24,
    textAlign: "center",
  },
});
