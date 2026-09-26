import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import AppAlertModal from "../../components/ui/app-alert-modal";
import AppDatePickerSheet from "../../components/ui/app-date-picker-sheet";
import AppTimePickerSheet from "../../components/ui/app-time-picker-sheet";
import {
  BottomActions,
  CreateEventHeader,
  StepProgress,
} from "../../components/ui/create-event-ui";
import { createEventDraftStorage } from "../../services/storage/create-event-draft.storage";
import { colors, fonts } from "../../styles/theme";
import type { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "CreateEventDateTime">;

type DateField = "startDate" | "endDate";
type TimeField = "startTime" | "endTime";

function parseDate(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
  return date.getFullYear() === Number(match[1]) &&
    date.getMonth() === Number(match[2]) - 1 &&
    date.getDate() === Number(match[3])
    ? date
    : undefined;
}

function toDateValue(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    weekday: "short",
    year: "numeric",
  }).format(date);
}

function today() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function timeToMinutes(value: string) {
  const match = value.match(/^(1[0-2]|[1-9]):([0-5][0-9]) (AM|PM)$/);
  if (!match) {
    return undefined;
  }

  const hour = (Number(match[1]) % 12) + (match[3] === "PM" ? 12 : 0);
  return hour * 60 + Number(match[2]);
}

export default function CreateEventDateTimeScreen({
  navigation,
  route,
}: Props) {
  const [schedule, setSchedule] = useState({
    startDate: route.params.draft.startDate,
    startTime: route.params.draft.startTime,
    endDate: route.params.draft.endDate,
    endTime: route.params.draft.endTime,
  });
  const [datePicker, setDatePicker] = useState<DateField | null>(null);
  const [timePicker, setTimePicker] = useState<TimeField | null>(null);
  const [alert, setAlert] = useState("");

  useEffect(() => {
    void createEventDraftStorage.save({
      ...route.params.draft,
      ...schedule,
    });
  }, [route.params.draft, schedule]);

  const selectTime = (value: string) => {
    if (!timePicker) {
      return;
    }
    setSchedule((current) => ({ ...current, [timePicker]: value }));
  };

  const selectDate = (date: Date) => {
    if (!datePicker) {
      return;
    }

    setSchedule((current) => {
      if (datePicker === "startDate") {
        const currentEndDate = parseDate(current.endDate);
        return {
          ...current,
          startDate: toDateValue(date),
          endDate:
            currentEndDate && currentEndDate < date ? "" : current.endDate,
        };
      }
      return { ...current, endDate: toDateValue(date) };
    });
  };

  const goNext = () => {
    if (Object.values(schedule).some((value) => !value)) {
      setAlert("Choose the start and end date and time before continuing.");
      return;
    }

    const startDate = parseDate(schedule.startDate);
    const endDate = parseDate(schedule.endDate);
    const startMinutes = timeToMinutes(schedule.startTime);
    const endMinutes = timeToMinutes(schedule.endTime);
    if (
      startDate &&
      endDate &&
      startMinutes !== undefined &&
      endMinutes !== undefined &&
      startDate.getTime() === endDate.getTime() &&
      endMinutes <= startMinutes
    ) {
      setAlert("The end time must be later than the start time.");
      return;
    }

    const draft = { ...route.params.draft, ...schedule };
    void createEventDraftStorage.save(draft);
    navigation.navigate("CreateEventTickets", { draft });
  };

  return (
    <View style={styles.safe}>
      <CreateEventHeader onBack={navigation.goBack} />
      <StepProgress label="Date & Time" step={2} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>When is it happening?</Text>
        <Text style={styles.subtitle}>
          Set the schedule for your community gathering. Precision helps members
          plan better!
        </Text>

        <ScheduleCard
          active
          date={schedule.startDate}
          datePlaceholder="Select Start Date"
          onDate={() => setDatePicker("startDate")}
          onTime={() => setTimePicker("startTime")}
          time={schedule.startTime}
          timePlaceholder="Select Start Time"
          title="STARTING AT"
        />
        <ScheduleCard
          date={schedule.endDate}
          datePlaceholder="Select End Date"
          onDate={() => setDatePicker("endDate")}
          onTime={() => setTimePicker("endTime")}
          time={schedule.endTime}
          timePlaceholder="Select End Time"
          title="ENDING AT"
        />

        <View style={styles.timezone}>
          <Ionicons
            color="#08b957"
            name="information-circle-outline"
            size={27}
          />
          <Text style={styles.timezoneText}>
            Events are scheduled in your local timezone:{" "}
            <Text style={styles.timezoneStrong}>GMT +01:00 (Lagos)</Text>
          </Text>
        </View>
      </ScrollView>
      <BottomActions onBack={navigation.goBack} onNext={goNext} />
      <AppDatePickerSheet
        minimumDate={
          datePicker === "endDate"
            ? (parseDate(schedule.startDate) ?? today())
            : today()
        }
        onClose={() => setDatePicker(null)}
        onSelect={selectDate}
        title={
          datePicker === "endDate" ? "Select end date" : "Select start date"
        }
        value={
          datePicker === "endDate"
            ? parseDate(schedule.endDate)
            : parseDate(schedule.startDate)
        }
        visible={datePicker !== null}
      />
      <AppTimePickerSheet
        onClose={() => setTimePicker(null)}
        onSelect={selectTime}
        title={
          timePicker === "endTime" ? "Select end time" : "Select start time"
        }
        value={timePicker === "endTime" ? schedule.endTime : schedule.startTime}
        visible={timePicker !== null}
      />
      <AppAlertModal
        message={alert}
        onClose={() => setAlert("")}
        title="Set your schedule"
        visible={!!alert}
      />
    </View>
  );
}

function ScheduleCard({
  active = false,
  title,
  date,
  time,
  datePlaceholder,
  timePlaceholder,
  onDate,
  onTime,
}: {
  active?: boolean;
  title: string;
  date: string;
  time: string;
  datePlaceholder: string;
  timePlaceholder: string;
  onDate: () => void;
  onTime: () => void;
}) {
  const selectedDate = parseDate(date);

  return (
    <View style={styles.scheduleCard}>
      <View style={styles.cardHeading}>
        <View style={[styles.dot, !active && styles.dotMuted]} />
        <Text style={styles.cardHeadingText}>{title}</Text>
      </View>
      <Text style={styles.inputLabel}>Date</Text>
      <ScheduleButton
        icon="calendar-outline"
        onPress={onDate}
        text={selectedDate ? formatDate(selectedDate) : datePlaceholder}
      />
      <Text style={styles.inputLabel}>Time</Text>
      <ScheduleButton
        icon="time-outline"
        onPress={onTime}
        text={time || timePlaceholder}
      />
    </View>
  );
}

function ScheduleButton({
  icon,
  text,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.scheduleButton}>
      <Ionicons color="#39945f" name={icon} size={29} />
      <Text style={styles.scheduleValue}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.paper, flex: 1 },
  content: { gap: 22, padding: 24, paddingBottom: 100 },
  title: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 29,
    marginTop: 12,
  },
  subtitle: {
    color: "#32965d",
    fontFamily: fonts.medium,
    fontSize: 17,
    lineHeight: 25,
    marginBottom: 8,
  },
  scheduleCard: {
    backgroundColor: colors.white,
    borderColor: "#d8efe2",
    borderRadius: 32,
    borderWidth: 1,
    gap: 12,
    padding: 20,
    shadowColor: "#153d2c",
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardHeading: {
    alignItems: "center",
    flexDirection: "row",
    gap: 11,
  },
  dot: {
    backgroundColor: "#08bd58",
    borderRadius: 7,
    height: 13,
    width: 13,
  },
  dotMuted: { backgroundColor: "#ccdcea" },
  cardHeadingText: {
    color: "#31975e",
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  inputLabel: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 16,
    marginLeft: 6,
    marginTop: 6,
  },
  scheduleButton: {
    alignItems: "center",
    backgroundColor: "#f7fbf9",
    borderColor: "#d9efe2",
    borderRadius: 25,
    borderWidth: 1,
    flexDirection: "row",
    gap: 15,
    minHeight: 72,
    paddingHorizontal: 22,
  },
  scheduleValue: {
    color: "#687386",
    fontFamily: fonts.medium,
    fontSize: 18,
  },
  timezone: {
    alignItems: "center",
    backgroundColor: "#e8f8ef",
    borderRadius: 24,
    flexDirection: "row",
    gap: 14,
    padding: 20,
  },
  timezoneText: {
    color: "#31975e",
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 23,
  },
  timezoneStrong: { color: colors.ink, fontFamily: fonts.bold },
});
