import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ProfilePageHeader from "./profile-page-header";
import { colors, fonts } from "../../styles/theme";
type Props = {
    title: string;
    hero: string;
    sections: {
        title: string;
        body: string;
    }[];
    action: string;
    onBack: () => void;
    onAction: () => void;
};
export default function LegalContent({ title, hero, sections, action, onBack, onAction }: Props) { return <SafeAreaView style={s.safe} edges={["top"]}><ProfilePageHeader title={title} onBack={onBack}/><ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}><View style={s.hero}><Text style={s.heroTitle}>CommunityConnect</Text><Text style={s.heroText}>{hero}</Text></View>{sections.map((x, i) => <View style={[s.card, i === sections.length - 2 && s.dark]} key={x.title}><View style={s.row}><View style={s.icon}><Ionicons name="shield-checkmark-outline" size={18} color={i === sections.length - 2 ? colors.lime : "#08b657"}/></View><Text style={[s.title, i === sections.length - 2 && s.white]}>{x.title}</Text></View><Text style={[s.body, i === sections.length - 2 && s.white]}>{x.body}</Text></View>)}<Pressable onPress={onAction} style={s.action}><Text style={s.actionText}>{action}</Text></Pressable><Text style={s.updated}>Last updated: October 24, 2023</Text></ScrollView></SafeAreaView>; }
;
const s = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.paper }, content: { padding: 20, paddingBottom: 38 }, hero: { backgroundColor: "#153e2b", borderRadius: 28, marginBottom: 20, padding: 22 }, heroTitle: { color: colors.white, fontFamily: fonts.extraBold, fontSize: 22 }, heroText: { color: "#d7e8de", fontFamily: fonts.medium, fontSize: 14, marginTop: 4 }, card: { backgroundColor: colors.white, borderRadius: 28, elevation: 2, marginBottom: 14, padding: 20 }, dark: { backgroundColor: "#153e2b" }, row: { alignItems: "center", flexDirection: "row", gap: 12 }, icon: { alignItems: "center", backgroundColor: "#eafff0", borderRadius: 18, height: 36, justifyContent: "center", width: 36 }, title: { color: colors.ink, fontFamily: fonts.bold, fontSize: 16 }, body: { color: "#33473d", fontFamily: fonts.medium, fontSize: 14, lineHeight: 21, marginTop: 14 }, white: { color: colors.white }, action: { alignItems: "center", alignSelf: "center", backgroundColor: colors.lime, borderRadius: 24, elevation: 3, marginTop: 10, paddingHorizontal: 28, paddingVertical: 14 }, actionText: { color: colors.ink, fontFamily: fonts.bold, fontSize: 15 }, updated: { color: "#429865", fontFamily: fonts.medium, fontSize: 12, marginTop: 16, textAlign: "center" } });
