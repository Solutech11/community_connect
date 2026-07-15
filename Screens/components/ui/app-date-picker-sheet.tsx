import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, fonts } from "../../styles/theme";

type AppDatePickerSheetProps = {
  visible: boolean;
  title: string;
  value?: Date;
  minimumDate?: Date;
  onClose: () => void;
  onSelect: (date: Date) => void;
};

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function sameDay(first?: Date, second?: Date) {
  if (!first || !second) {
    return false;
  }
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

export default function AppDatePickerSheet({
  visible,
  title,
  value,
  minimumDate,
  onClose,
  onSelect,
}: AppDatePickerSheetProps) {
  const initialMonth = value ?? minimumDate ?? new Date();
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1),
  );

  useEffect(() => {
    if (visible) {
      const nextMonth = value ?? minimumDate ?? new Date();
      setVisibleMonth(
        new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1),
      );
    }
  }, [minimumDate, value, visible]);

  const calendarDays = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<Date | null> = Array(firstWeekday).fill(null);

    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(new Date(year, month, day));
    }
    while (cells.length % 7 !== 0) {
      cells.push(null);
    }
    return cells;
  }, [visibleMonth]);

  const previousMonthDisabled = minimumDate
    ? new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0) <
      startOfDay(minimumDate)
    : false;

  const changeMonth = (amount: number) => {
    setVisibleMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + amount, 1),
    );
  };

  const chooseDate = (date: Date) => {
    onSelect(date);
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
          accessibilityLabel="Close date picker"
          onPress={onClose}
          style={StyleSheet.absoluteFillObject}
        />
        <SafeAreaView edges={["bottom"]} style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.heading}>
            <Text style={styles.title}>{title}</Text>
            <Pressable hitSlop={10} onPress={onClose} style={styles.close}>
              <Ionicons color={colors.ink} name="close" size={24} />
            </Pressable>
          </View>

          <View style={styles.monthRow}>
            <Pressable
              disabled={previousMonthDisabled}
              onPress={() => changeMonth(-1)}
              style={styles.monthButton}
            >
              <Ionicons
                color={previousMonthDisabled ? "#cbd5d0" : "#08ad54"}
                name="chevron-back"
                size={23}
              />
            </Pressable>
            <Text style={styles.monthTitle}>
              {MONTHS[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
            </Text>
            <Pressable
              onPress={() => changeMonth(1)}
              style={styles.monthButton}
            >
              <Ionicons color="#08ad54" name="chevron-forward" size={23} />
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {WEEKDAYS.map((weekday, index) => (
              <Text key={weekday + index} style={styles.weekday}>
                {weekday}
              </Text>
            ))}
          </View>

          <View style={styles.calendar}>
            {calendarDays.map((date, index) => {
              if (!date) {
                return <View key={"blank-" + index} style={styles.dayCell} />;
              }
              const disabled =
                minimumDate !== undefined &&
                startOfDay(date) < startOfDay(minimumDate);
              const selected = sameDay(date, value);
              const today = sameDay(date, new Date());

              return (
                <View key={date.toISOString()} style={styles.dayCell}>
                  <Pressable
                    accessibilityLabel={date.toDateString()}
                    disabled={disabled}
                    onPress={() => chooseDate(date)}
                    style={[
                      styles.dayButton,
                      today && styles.todayButton,
                      selected && styles.selectedDay,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        disabled && styles.disabledDayText,
                        selected && styles.selectedDayText,
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
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
  close: {
    alignItems: "center",
    backgroundColor: "#eff8f3",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  monthRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
  },
  monthButton: {
    alignItems: "center",
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  monthTitle: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 17,
  },
  weekRow: {
    flexDirection: "row",
    marginTop: 16,
  },
  weekday: {
    color: "#5d776a",
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 12,
    textAlign: "center",
  },
  calendar: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
    marginTop: 8,
  },
  dayCell: {
    alignItems: "center",
    height: 45,
    justifyContent: "center",
    width: "14.2857%",
  },
  dayButton: {
    alignItems: "center",
    borderRadius: 20,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  todayButton: {
    borderColor: "#8eddb0",
    borderWidth: 1,
  },
  selectedDay: {
    backgroundColor: "#08bd58",
    borderColor: "#08bd58",
  },
  dayText: {
    color: colors.ink,
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  disabledDayText: {
    color: "#c2ccc7",
  },
  selectedDayText: {
    color: colors.white,
    fontFamily: fonts.bold,
  },
});
