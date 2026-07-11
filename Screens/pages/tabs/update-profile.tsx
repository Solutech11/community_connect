import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppAlertModal from "../../components/ui/app-alert-modal";
import ProfilePageHeader from "../../components/ui/profile-page-header";
import { colors, fonts } from "../../styles/theme";
import type { RootStackParamList } from "../../types/navigation";
type Props = NativeStackScreenProps<RootStackParamList, "UpdateProfile">;
type AlertState = {
    title: string;
    message: string;
} | null;
function Field({ label, value, onChangeText, multiline = false, keyboardType = "default" }: {
    label: string;
    value: string;
    onChangeText: (value: string) => void;
    multiline?: boolean;
    keyboardType?: "default" | "email-address" | "phone-pad";
}) { return <View style={styles.fieldWrap}><Text style={styles.label}>{label}</Text><TextInput multiline={multiline} keyboardType={keyboardType} onChangeText={onChangeText} style={[styles.input, multiline && styles.bio]} value={value}/></View>; }
export default function UpdateProfileScreen({ navigation }: Props) {
    const [photo, setPhoto] = useState("https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=440&q=85");
    const pickPhoto = async () => { const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.8 }); if (!result.canceled)
        setPhoto(result.assets[0].uri); };
    const [firstName, setFirstName] = useState("Alex");
    const [lastName, setLastName] = useState("Rivera");
    const [username, setUsername] = useState("@arivera");
    const [bio, setBio] = useState("Urban explorer, coffee enthusiast, and always looking for the next weekend hike. Let's connect!");
    const [email, setEmail] = useState("alex.rivera@example.com");
    const [phone, setPhone] = useState("+1 (555) 123-4567");
    const [gender, setGender] = useState("Female");
    const [alert, setAlert] = useState<AlertState>(null);
    const save = () => setAlert({ title: "Profile Updated", message: "Your profile changes have been saved." });
    return <><SafeAreaView style={styles.safeArea} edges={[]}><KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.safeArea}><ProfilePageHeader title="Update Profile" onBack={() => navigation.goBack()}/><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}><View style={styles.photoBlock}><Image source={{ uri: photo }} style={styles.avatar}/><Pressable onPress={pickPhoto} style={styles.photoAction}><Ionicons name="pencil" size={19} color={colors.lime}/><Text style={styles.photoText}>Edit Photo</Text></Pressable></View><Field label="First Name" value={firstName} onChangeText={setFirstName}/><Field label="Last Name" value={lastName} onChangeText={setLastName}/><Field label="Username" value={username} onChangeText={setUsername}/><Field label="Bio" value={bio} onChangeText={setBio} multiline/><Field label="Email Address" value={email} onChangeText={setEmail} keyboardType="email-address"/><Field label="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad"/><View style={styles.fieldWrap}><Text style={styles.label}>Gender</Text><Pressable onPress={() => setGender(gender === "Female" ? "Male" : "Female")} style={styles.gender}><Text style={styles.genderText}>{gender}</Text><Ionicons name="chevron-down" size={22} color="#4b9d6b"/></Pressable></View><Pressable onPress={save} style={styles.save}><Text style={styles.saveText}>Save Changes</Text></Pressable></ScrollView></KeyboardAvoidingView></SafeAreaView><AppAlertModal visible={Boolean(alert)} title={alert?.title ?? ""} message={alert?.message ?? ""} onClose={() => setAlert(null)}/></>;
}
const styles = StyleSheet.create({ safeArea: { flex: 1, backgroundColor: colors.paper }, content: { paddingBottom: 34, paddingHorizontal: 20 }, photoBlock: { alignItems: "center", marginBottom: 28, marginTop: 14 }, avatar: { borderColor: colors.white, borderRadius: 62, borderWidth: 5, height: 124, width: 124 }, photoAction: { alignItems: "center", flexDirection: "row", gap: 8, marginTop: 18 }, photoText: { color: "#08ae55", fontFamily: fonts.bold, fontSize: 16 }, fieldWrap: { marginTop: 16 }, label: { color: "#399760", fontFamily: fonts.bold, fontSize: 15, marginBottom: 10, paddingLeft: 12 }, input: { backgroundColor: colors.white, borderRadius: 22, color: colors.ink, elevation: 2, fontFamily: fonts.medium, fontSize: 17, height: 56, paddingHorizontal: 24 }, bio: { height: 112, paddingTop: 18, textAlignVertical: "top" }, gender: { alignItems: "center", backgroundColor: colors.white, borderRadius: 22, elevation: 2, flexDirection: "row", height: 56, justifyContent: "space-between", paddingHorizontal: 24 }, genderText: { color: colors.ink, fontFamily: fonts.medium, fontSize: 17 }, save: { alignItems: "center", backgroundColor: "#08b657", borderRadius: 28, elevation: 3, height: 56, justifyContent: "center", marginTop: 26 }, saveText: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 18 } });
