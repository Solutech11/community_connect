import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, fonts } from "../../styles/theme";

type AppTimePickerSheetProps = {
  visible: boolean;
  title: string;
  value?: string;
  onClose: () => void;
  onSelect: (value: string) => void;
};

const HOURS = Array.from({ length: 12 }, (_, index) => index + 1);
const MINUTES = ["00", "15", "30", "45"];
const PERIODS = ["AM", "PM"] as const;

function parseTime(value?: string) {
  const match = value?.match(/^(1[0-2]|[1-9]):([0-5][0-9]) (AM|PM)$/);
  if (!match) {
    return { hour: 10, minute: "00", period: "AM" as const };
  }
  return {
    hour: Number(match[1]),
    minute: match[2],
    period: match[3] as (typeof PERIODS)[number],
  };
}

export default function AppTimePickerSheet({
  visible,
  title,
  value,
  onClose,
  onSelect,
}: AppTimePickerSheetProps) {
  const initial = parseTime(value);
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>(
    initial.period,
  );

  useEffect(() => {
    if (visible) {
      const next = parseTime(value);
      setHour(next.hour);
      setMinute(next.minute);
      setPeriod(next.period);
    }
  }, [value, visible]);

  const confirm = () => {
    onSelect(hour + ":" + minute + " " + period);
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel="Close time picker"
          onPress={onClose}
          style={StyleSheet.absoluteFillObject}
        />
        <SafeAreaView edges={["bottom"]} style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>

          <Text style={styles.sectionLabel}>HOUR</Text>
          <View style={styles.hourGrid}>
            {HOURS.map((item) => (
              <Pressable
                key={item}
                onPress={() => setHour(item)}
                style={[
                  styles.hourOption,
                  hour === item && styles.optionSelected,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    hour === item && styles.optionTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.selectionRow}>
            <View style={styles.selectionGroup}>
              <Text style={styles.sectionLabel}>MINUTE</Text>
              <View style={styles.pillRow}>
                {MINUTES.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setMinute(item)}
                    style={[
                      styles.pill,
                      minute === item && styles.optionSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        minute === item && styles.optionTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.periodGroup}>
              <Text style={styles.sectionLabel}>PERIOD</Text>
              <View style={styles.pillRow}>
                {PERIODS.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setPeriod(item)}
                    style={[
                      styles.periodPill,
                      period === item && styles.optionSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        period === item && styles.optionTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.preview}>
            <Text style={styles.previewLabel}>Selected time</Text>
            <Text style={styles.previewTime}>
              {hour}:{minute} {period}
            </Text>
          </View>

          <View style={styles.actions}>
            <Pressable onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={confirm} style={styles.confirmButton}>
              <Text style={styles.confirmText}>Set Time</Text>
            </Pressable>
          </View>
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
  title: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 21,
    marginTop: 18,
  },
  sectionLabel: {
    color: "#348f5a",
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 0.7,
    marginBottom: 9,
    marginTop: 20,
  },
  hourGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  hourOption: {
    alignItems: "center",
    backgroundColor: "#f2f9f5",
    borderRadius: 19,
    height: 42,
    justifyContent: "center",
    width: "14.5%",
  },
  optionSelected: {
    backgroundColor: "#08bd58",
  },
  optionText: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  optionTextSelected: {
    color: colors.white,
  },
  selectionRow: {
    flexDirection: "row",
    gap: 18,
  },
  selectionGroup: {
    flex: 1,
  },
  periodGroup: {
    width: 114,
  },
  pillRow: {
    flexDirection: "row",
    gap: 7,
  },
  pill: {
    alignItems: "center",
    backgroundColor: "#f2f9f5",
    borderRadius: 18,
    flex: 1,
    height: 40,
    justifyContent: "center",
  },
  periodPill: {
    alignItems: "center",
    backgroundColor: "#f2f9f5",
    borderRadius: 18,
    flex: 1,
    height: 40,
    justifyContent: "center",
  },
  preview: {
    alignItems: "center",
    backgroundColor: "#eaf9f1",
    borderRadius: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    padding: 16,
  },
  previewLabel: {
    color: "#348f5a",
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  previewTime: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 19,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },
  cancelButton: {
    alignItems: "center",
    borderColor: "#08ad54",
    borderRadius: 25,
    borderWidth: 1.5,
    flex: 1,
    justifyContent: "center",
    minHeight: 54,
  },
  cancelText: {
    color: "#08ad54",
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  confirmButton: {
    alignItems: "center",
    backgroundColor: "#08bd58",
    borderRadius: 25,
    flex: 1.4,
    justifyContent: "center",
    minHeight: 54,
  },
  confirmText: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 16,
  },
});
