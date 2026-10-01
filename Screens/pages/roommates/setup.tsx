import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import {
  RoommateShell,
  RoommateButton,
  roommateStyles as styles,
} from "../../components/ui/roommate-ui";
import { useRoommateTask } from "../../hooks/use-roommate-task";
import { roommatesApi } from "../../services/api/roommates.api";
import { ApiError } from "../../services/api/client";
import { NIGERIAN_LGAS_BY_STATE } from "../../data/nigeria-locations";
import type { RootStackParamList } from "../../types/navigation";
import type { RoommateDraft } from "../../types/roommates";
import AppDatePickerSheet from "../../components/ui/app-date-picker-sheet";
import AppSelectSheet from "../../components/ui/app-select-sheet";
import { roomieSteps } from "../../data/roommate-design";
import { colors, fonts } from "../../styles/theme";
import { optionLabel } from "../../types/roommates";

const defaults: RoommateDraft = {
  housingMode: "seeking",
  lgas: [],
  gender: "undisclosed",
  acceptableGenders: ["woman", "man", "non_binary", "undisclosed"],
  cleanliness: "balanced",
  sleepSchedule: "flexible",
  guests: "sometimes",
  socialPreference: "balanced",
  smokes: false,
  acceptsSmoking: false,
  hasPets: false,
  acceptsPets: true,
  description: "",
};
type Options = Awaited<
  ReturnType<typeof roommatesApi.questions>
>["data"]["options"];

export default function RoommateSetup({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "RoommateSetup">) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<RoommateDraft>(defaults);
  const [adult, setAdult] = useState(false);
  const [minRent, setMinRent] = useState("");
  const [maxRent, setMaxRent] = useState("");
  const [selectingState, setSelectingState] = useState(false);
  const [dateField, setDateField] = useState<"moveInFrom" | "moveInTo" | null>(
    null,
  );
  const [lgaSearch, setLgaSearch] = useState("");
  const [options, setOptions] = useState<Options | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [paired, setPaired] = useState(false);
  const { busy, run } = useRoommateTask();
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    Promise.all([
      roommatesApi.questions(controller.signal),
      roommatesApi.profile(controller.signal),
    ])
      .then(([questions, response]) => {
        if (controller.signal.aborted) return;
        setOptions(questions.data.options);
        const profile = response.data.profile;
        if (profile) {
          const {
            _id,
            userId,
            visibility,
            questionnaireVersion,
            activeConnectionId,
            ...answers
          } = profile;
          setDraft({ ...defaults, ...answers });
          setAdult(profile.adultConfirmed === true);
          setMinRent(
            profile.minAnnualRentKobo === undefined
              ? ""
              : String(profile.minAnnualRentKobo / 100),
          );
          setMaxRent(
            profile.maxAnnualRentKobo === undefined
              ? ""
              : String(profile.maxAnnualRentKobo / 100),
          );
          setPaired(visibility === "paired");
        }
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted)
          setError(
            err instanceof ApiError
              ? err.message
              : "Unable to load setup. Check your connection.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [retry]);

  const set = <K extends keyof RoommateDraft>(
    key: K,
    value: RoommateDraft[K],
  ) => setDraft((current) => ({ ...current, [key]: value }));
  const save = (activate: boolean) =>
    void run(async () => {
      if (activate && !adult)
        throw new ApiError({
          message: "Confirm you are 18 or older to activate your profile.",
        });
      for (const value of [minRent, maxRent]) {
        if (value && !/^\d+(\.\d{1,2})?$/.test(value))
          throw new ApiError({
            message: "Enter rent amounts as positive numbers in naira.",
          });
      }
      const payload: RoommateDraft = {
        ...draft,
        ...(adult ? { adultConfirmed: true } : {}),
        ...(minRent
          ? { minAnnualRentKobo: Math.round(Number(minRent) * 100) }
          : {}),
        ...(maxRent
          ? { maxAnnualRentKobo: Math.round(Number(maxRent) * 100) }
          : {}),
      };
      if (!adult) delete payload.adultConfirmed;
      if (!minRent) delete payload.minAnnualRentKobo;
      if (!maxRent) delete payload.maxAnnualRentKobo;
      // Empty fields stay absent in a draft; activation validates completeness on the server.
      if (!payload.state) delete payload.state;
      if (!payload.lgas?.length) delete payload.lgas;
      if (!payload.moveInFrom) delete payload.moveInFrom;
      if (!payload.moveInTo) delete payload.moveInTo;
      if (!activate)
        await roommatesApi.visibility("paused").catch((err: unknown) => {
          if (!(
            err instanceof ApiError &&
            err.code === "ROOMMATE_PROFILE_INCOMPLETE"
          ))
            throw err;
        });
      await roommatesApi.saveProfile(payload);
      if (activate) await roommatesApi.visibility("discoverable");
      navigation.replace("RoommateDiscover");
    });

  const chips = (
    values: readonly string[],
    selected: readonly string[],
    onSelect: (value: string) => void,
  ) => (
    <View style={styles.row}>
      {values.map((value) => (
        <Pressable
          key={value}
          accessibilityRole="button"
          accessibilityState={{
            selected: selected.includes(value),
            disabled: busy,
          }}
          disabled={busy}
          onPress={() => onSelect(value)}
          style={[styles.chip, selected.includes(value) && styles.selected]}
        >
          <Text style={styles.buttonText}>{optionLabel(value)}</Text>
        </Pressable>
      ))}
    </View>
  );
  const states = Object.keys(NIGERIAN_LGAS_BY_STATE);
  const lgas =
    draft.state && draft.state in NIGERIAN_LGAS_BY_STATE
      ? NIGERIAN_LGAS_BY_STATE[
          draft.state as keyof typeof NIGERIAN_LGAS_BY_STATE
        ]
      : [];

  return (
    <RoommateShell
      title="Make yourself at home"
      subtitle="A little about your plans. A lot about finding your fit."
      contentKey={step}
      headerContent={
        !loading && !error && !paired ? (
          <View style={design.progress}>
            {roomieSteps.map((label, index) => (
              <Pressable
                key={label}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={{
                  selected: index === step,
                  disabled: busy,
                }}
                disabled={busy}
                onPress={() => setStep(index)}
                style={design.progressStep}
              >
                <View
                  style={[
                    design.progressLine,
                    index <= step && design.progressActive,
                  ]}
                />
                <Text
                  style={[
                    design.progressLabel,
                    index === step && design.progressCurrent,
                  ]}
                >
                  {index + 1}. {label}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null
      }
      footer={
        !loading && !error && !paired && options ? (
          <>
            <View style={styles.row}>
              {step > 0 ? (
                <View style={styles.flex}>
                  <RoommateButton
                    label="Previous"
                    secondary
                    disabled={busy}
                    onPress={() => setStep(step - 1)}
                  />
                </View>
              ) : null}
              <View style={styles.flex}>
                {step < 2 ? (
                  <RoommateButton
                    label="Continue"
                    icon="arrow-forward"
                    disabled={busy}
                    onPress={() => setStep(step + 1)}
                  />
                ) : (
                  <RoommateButton
                    label={busy ? "Saving..." : "Start matching"}
                    icon="sparkles-outline"
                    disabled={busy}
                    onPress={() => save(true)}
                  />
                )}
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={() => save(false)}
              style={design.later}
            >
              <Text style={design.laterLabel}>
                {busy ? "Saving..." : "Save and finish later"}
              </Text>
            </Pressable>
          </>
        ) : null
      }
      loading={loading}
      error={error}
      retry={() => setRetry((value) => value + 1)}
    >
      {paired ? (
        <Text style={styles.body}>
          Your profile is private while paired. End the pairing before changing
          housing preferences.
        </Text>
      ) : null}
      {!loading && !error && !paired && options ? (
        <>
          {step === 0 ? (
            <>
              <View style={styles.card}>
                <Text style={styles.fieldLabel}>01 / YOUR SPACE</Text>
                <Text style={styles.heading}>What does home look like?</Text>
                {chips(
                  options.housingMode,
                  [draft.housingMode || "seeking"],
                  (value) => {
                    setDraft((current) => ({
                      ...current,
                      housingMode: value as RoommateDraft["housingMode"],
                      lgas:
                        value === "hosting"
                          ? current.lgas?.slice(0, 1)
                          : current.lgas,
                    }));
                  },
                )}
                <Text style={styles.body}>
                  {draft.housingMode === "hosting"
                    ? "Select the area of your available place. Do not include the exact address."
                    : "Select areas where you want to live."}
                </Text>
                <Text style={styles.heading}>
                  Where would you like to live?
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Choose Nigerian state"
                  disabled={busy}
                  onPress={() => setSelectingState(true)}
                  style={design.select}
                >
                  <Ionicons
                    name="location-outline"
                    size={19}
                    color={colors.forest}
                  />
                  <Text style={[styles.detailValue, styles.flex]}>
                    {draft.state || "Choose a state"}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={17}
                    color={colors.muted}
                  />
                </Pressable>
                <Text style={styles.heading}>Preferred LGAs</Text>
                <Text style={styles.body}>
                  {draft.lgas?.join(", ") ||
                    "Choose a state, then select an area."}
                </Text>
                <TextInput
                  placeholderTextColor={colors.muted}
                  accessibilityLabel="Search LGAs"
                  placeholder="Search LGAs"
                  style={styles.input}
                  value={lgaSearch}
                  onChangeText={setLgaSearch}
                  editable={!busy}
                />
                {chips(
                  lgas
                    .filter((value) =>
                      value.toLowerCase().includes(lgaSearch.toLowerCase()),
                    )
                    .slice(0, 8),
                  draft.lgas || [],
                  (value) => {
                    const current = draft.lgas || [];
                    set(
                      "lgas",
                      current.includes(value)
                        ? current.filter((item) => item !== value)
                        : draft.housingMode === "hosting"
                          ? [value]
                          : [...current, value].slice(0, 10),
                    );
                  },
                )}
              </View>
              <View style={styles.card}>
                <Text style={styles.heading}>
                  {draft.housingMode === "hosting"
                    ? "Requested roommate share"
                    : "Your annual rent share"}
                </Text>
                <TextInput
                  placeholderTextColor={colors.muted}
                  accessibilityLabel="Minimum annual rent in naira"
                  placeholder="Minimum annual rent (NGN)"
                  keyboardType="decimal-pad"
                  value={minRent}
                  onChangeText={setMinRent}
                  style={styles.input}
                  editable={!busy}
                />
                <TextInput
                  placeholderTextColor={colors.muted}
                  accessibilityLabel="Maximum annual rent in naira"
                  placeholder="Maximum annual rent (NGN)"
                  keyboardType="decimal-pad"
                  value={maxRent}
                  onChangeText={setMaxRent}
                  style={styles.input}
                  editable={!busy}
                />
                <Text style={styles.heading}>Move-in window</Text>
                {(["moveInFrom", "moveInTo"] as const).map((field) => (
                  <Pressable
                    key={field}
                    accessibilityRole="button"
                    accessibilityLabel={
                      field === "moveInFrom"
                        ? "Choose earliest move-in date"
                        : "Choose latest move-in date"
                    }
                    disabled={busy}
                    onPress={() => setDateField(field)}
                    style={design.select}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={19}
                      color={colors.forest}
                    />
                    <View style={styles.flex}>
                      <Text style={styles.fieldLabel}>
                        {field === "moveInFrom"
                          ? "Earliest move-in"
                          : "Latest move-in"}
                      </Text>
                      <Text style={styles.detailValue}>
                        {draft[field]
                          ? new Date(
                              draft[field] + "T12:00:00",
                            ).toLocaleDateString("en-NG", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "Choose a date"}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-down"
                      size={17}
                      color={colors.muted}
                    />
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}
          {step === 1 ? (
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>02 / YOUR LIFESTYLE</Text>
              <Text style={styles.heading}>Find your everyday rhythm</Text>
              <Text style={styles.body}>
                Little habits make a big difference when you share a home.
              </Text>
              {(
                [
                  "cleanliness",
                  "sleepSchedule",
                  "guests",
                  "socialPreference",
                ] as const
              ).map((key) => (
                <View key={key} style={{ gap: 10 }}>
                  <Text style={styles.body}>
                    {key === "sleepSchedule"
                      ? "Sleep schedule"
                      : key === "socialPreference"
                        ? "Social preference"
                        : optionLabel(key)}
                  </Text>
                  {chips(
                    options[key],
                    draft[key] ? [draft[key]!] : [],
                    (value) => set(key, value as RoommateDraft[typeof key]),
                  )}
                </View>
              ))}
              {(
                [
                  ["smokes", "Do you smoke?"],
                  ["acceptsSmoking", "Comfortable with a roommate who smokes?"],
                  ["hasPets", "Do you have pets?"],
                  ["acceptsPets", "Comfortable with a roommate's pets?"],
                ] as const
              ).map(([key, label]) => (
                <View key={key} style={{ gap: 10 }}>
                  <Text style={styles.body}>{label}</Text>
                  {chips(["yes", "no"], [draft[key] ? "yes" : "no"], (value) =>
                    set(key, value === "yes"),
                  )}
                </View>
              ))}
            </View>
          ) : null}
          {step === 2 ? (
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>03 / ABOUT YOU</Text>
              <Text style={styles.heading}>The person behind the profile</Text>
              <Text style={styles.body}>
                Choose what feels right for you. Gender preferences are
                optional.
              </Text>
              <Text style={styles.heading}>Your gender</Text>
              {chips(options.gender, [draft.gender || "undisclosed"], (value) =>
                set("gender", value as RoommateDraft["gender"]),
              )}
              <Text style={styles.body}>
                Acceptable roommate genders. Select Any to include everyone.
              </Text>
              <RoommateButton
                label="Any gender"
                secondary
                disabled={busy}
                onPress={() =>
                  set("acceptableGenders", [
                    ...options.gender,
                  ] as RoommateDraft["acceptableGenders"])
                }
              />
              {chips(options.gender, draft.acceptableGenders || [], (value) => {
                const values = draft.acceptableGenders || [];
                set(
                  "acceptableGenders",
                  (values.includes(value as (typeof values)[number])
                    ? values.filter((item) => item !== value)
                    : [...values, value]) as RoommateDraft["acceptableGenders"],
                );
              })}
              <TextInput
                placeholderTextColor={colors.muted}
                accessibilityLabel="Roommate profile description"
                placeholder="A little about you or the space you have (no contacts or exact address)"
                multiline
                maxLength={500}
                value={draft.description || ""}
                onChangeText={(value) => set("description", value)}
                style={styles.input}
                editable={!busy}
              />
              <RoommateButton
                label="Edit interests and hobbies"
                secondary
                disabled={busy}
                onPress={() => navigation.navigate("UpdateProfile")}
              />
              <Text style={styles.heading}>Before you join</Text>
              <RoommateButton
                label={
                  adult
                    ? "18+ declaration confirmed"
                    : "I confirm I am 18 or older"
                }
                secondary={!adult}
                disabled={busy}
                onPress={() => setAdult(!adult)}
              />
              <Text style={styles.body}>
                This is your declaration, not identity verification.
              </Text>
            </View>
          ) : null}
        </>
      ) : null}
      <AppSelectSheet
        visible={selectingState}
        title="State"
        options={states}
        value={draft.state || ""}
        onClose={() => setSelectingState(false)}
        onSelect={(value) => {
          setDraft((current) => ({ ...current, state: value, lgas: [] }));
          setLgaSearch("");
        }}
      />
      <AppDatePickerSheet
        visible={Boolean(dateField)}
        title={dateField === "moveInTo" ? "Latest move-in" : "Earliest move-in"}
        value={
          dateField && draft[dateField]
            ? new Date(draft[dateField] + "T12:00:00")
            : undefined
        }
        minimumDate={
          dateField === "moveInTo" && draft.moveInFrom
            ? new Date(draft.moveInFrom + "T12:00:00")
            : undefined
        }
        onClose={() => setDateField(null)}
        onSelect={(date) => {
          if (!dateField) return;
          // Preserve the selected local calendar day in the API's date-only shape.
          const value = [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0"),
          ].join("-");
          setDraft((current) => ({
            ...current,
            [dateField]: value,
            ...(dateField === "moveInFrom" &&
            current.moveInTo &&
            current.moveInTo < value
              ? { moveInTo: undefined }
              : {}),
          }));
        }}
      />
    </RoommateShell>
  );
}

const design = StyleSheet.create({
  select: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 14,
  },
  progress: { flexDirection: "row", gap: 9, marginTop: 12 },
  progressStep: { flex: 1, gap: 7 },
  progressLine: { height: 4, backgroundColor: colors.line, borderRadius: 4 },
  progressActive: { backgroundColor: colors.lime },
  progressLabel: {
    fontFamily: fonts.medium,
    color: colors.muted,
    fontSize: 10,
  },
  progressCurrent: { fontFamily: fonts.bold, color: colors.forest },
  later: { alignItems: "center", paddingVertical: 7 },
  laterLabel: { fontFamily: fonts.bold, color: colors.muted, fontSize: 12 },
});
