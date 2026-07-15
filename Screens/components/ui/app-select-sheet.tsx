import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, fonts } from "../../styles/theme";

type AppSelectSheetProps = {
  visible: boolean;
  title: string;
  options: string[];
  value: string;
  onClose: () => void;
  onSelect: (value: string) => void;
  allowCustomValue?: boolean;
};

export default function AppSelectSheet({
  visible,
  title,
  options,
  value,
  onClose,
  onSelect,
  allowCustomValue = false,
}: AppSelectSheetProps) {
  const [query, setQuery] = useState("");

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
    setQuery("");
    onClose();
  };

  const select = (option: string) => {
    setQuery("");
    onSelect(option);
    onClose();
  };

  const customValue = query.trim();
  const canUseCustomValue =
    allowCustomValue &&
    customValue.length > 1 &&
    !options.some(
      (option) => option.toLowerCase() === customValue.toLowerCase(),
    );

  return (
    <Modal
      animationType="slide"
      onRequestClose={close}
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel="Close selection"
          onPress={close}
          style={StyleSheet.absoluteFillObject}
        />
        <SafeAreaView edges={["bottom"]} style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.heading}>
            <Text style={styles.title}>{title}</Text>
            <Pressable hitSlop={10} onPress={close} style={styles.closeButton}>
              <Ionicons color={colors.ink} name="close" size={24} />
            </Pressable>
          </View>
          <View style={styles.search}>
            <Ionicons color="#37955e" name="search" size={20} />
            <TextInput
              autoCapitalize="words"
              onChangeText={setQuery}
              placeholder={"Search " + title.toLowerCase()}
              placeholderTextColor="#718096"
              style={styles.searchInput}
              value={query}
            />
          </View>
          {canUseCustomValue ? (
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
              <Text style={styles.empty}>
                Start typing to add your local government area.
              </Text>
            }
            renderItem={({ item }) => {
              const selected = item === value;
              return (
                <Pressable
                  onPress={() => select(item)}
                  style={[styles.option, selected && styles.optionSelected]}
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
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: "rgba(4, 15, 10, 0.36)",
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: "78%",
    minHeight: "48%",
    paddingHorizontal: 22,
    paddingTop: 10,
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
  empty: {
    color: colors.muted,
    fontFamily: fonts.medium,
    lineHeight: 22,
    padding: 24,
    textAlign: "center",
  },
});
