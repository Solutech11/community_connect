import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, fonts } from "../../styles/theme";
import type { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "CommunityJoin">;

export default function CommunityJoinConnectedScreen({ navigation, route }: Props) {
  useEffect(() => {
    navigation.replace("CommunityProfile", { communityId: route.params.communityId });
  }, [navigation, route.params.communityId]);
  return <SafeAreaView style={styles.safe}><View style={styles.state}><ActivityIndicator color="#08b657" /><Text style={styles.text}>Opening community membership...</Text></View></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { backgroundColor: colors.paper, flex: 1 }, state: { alignItems: "center", flex: 1, justifyContent: "center" }, text: { color: "#718078", fontFamily: fonts.medium, marginTop: 10 } });
