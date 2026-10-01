import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Text, View } from "react-native";
import {
  RoommateShell,
  RoommateCard,
  RoommateDetails,
  RoommateButton,
  roommateStyles as styles,
} from "../../components/ui/roommate-ui";
import type { RootStackParamList } from "../../types/navigation";

export default function RoommateCandidate({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParamList, "RoommateCandidate">) {
  const { candidate } = route.params;
  return (
    <RoommateShell title="Roomie profile">
      <RoommateCard candidate={candidate} />
      {candidate.user.bio ? (
        <View style={styles.card}>
          <Text style={styles.heading}>A little about me</Text>
          <Text style={styles.body}>{candidate.user.bio}</Text>
        </View>
      ) : null}
      <RoommateDetails profile={candidate.profile} />
      <View style={styles.card}>
        <Text style={styles.heading}>Beyond the everyday</Text>
        <Text style={styles.fieldLabel}>INTERESTS</Text>
        <Text style={styles.body}>
          {candidate.user.interests.join(", ") || "Not added yet"}
        </Text>
        <Text style={styles.fieldLabel}>HOBBIES</Text>
        <Text style={styles.body}>
          {candidate.user.hobbies.join(", ") || "Not added yet"}
        </Text>
      </View>
      <RoommateButton
        label="Back to matching"
        onPress={() => navigation.goBack()}
      />
    </RoommateShell>
  );
}
