import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from "expo-camera";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ProfilePageHeader from "../../components/ui/profile-page-header";
import ScannedTicketDetailsSheet from "../../components/ui/scanned-ticket-details-sheet";
import { colors, fonts } from "../../styles/theme";
import type { RootStackParamList } from "../../types/navigation";
type Props = NativeStackScreenProps<RootStackParamList, "TicketScanner">;
export default function TicketScannerScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [result, setResult] = useState<BarcodeScanningResult | null>(null);
  const [checked, setChecked] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);

  const handleBarcodeScanned = (scanResult: BarcodeScanningResult) => {
    setChecked(false);
    setResult(scanResult);
    setDetailsVisible(true);
  };

  const handleScanNext = () => {
    setDetailsVisible(false);
    setResult(null);
    setChecked(false);
  };
  if (!permission) return <View style={s.safe} />;
  return (
    <SafeAreaView edges={[]} style={s.safe}>
      <ProfilePageHeader title="Scan Ticket" onBack={navigation.goBack} />
      {!permission.granted ? (
        <View style={s.permission}>
          <View style={s.permissionIcon}>
            <Ionicons name="camera-outline" size={38} color="#08b657" />
          </View>
          <Text style={s.permissionTitle}>Camera access needed</Text>
          <Text style={s.permissionText}>
            Allow camera access to scan guest ticket QR codes securely.
          </Text>
          <Pressable onPress={requestPermission} style={s.button}>
            <Text style={s.buttonText}>Allow Camera</Text>
          </Pressable>
        </View>
      ) : (
        <View style={s.body}>
          <View style={s.cameraWrap}>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={result ? undefined : handleBarcodeScanned}
            />
            <View style={s.dim} />
            <View style={s.frame}>
              <View style={[s.corner, s.tl]} />
              <View style={[s.corner, s.tr]} />
              <View style={[s.corner, s.bl]} />
              <View style={[s.corner, s.br]} />
            </View>
            <Text style={s.guide}>
              {result
                ? "Ticket detected"
                : "Align the QR code inside the frame"}
            </Text>
          </View>
          {result ? (
            <View style={s.result}>
              <View style={[s.resultIcon, checked && s.resultChecked]}>
                <Ionicons
                  name={checked ? "checkmark-circle" : "ticket"}
                  size={30}
                  color="#08b657"
                />
              </View>
              <View style={s.resultCopy}>
                <Text style={s.resultTitle}>
                  {checked ? "Check-in complete" : "Valid ticket found"}
                </Text>
                <Text style={s.resultName}>Elena Rodriguez • VIP Access</Text>
                <Text numberOfLines={1} style={s.code}>
                  {result.data}
                </Text>
              </View>
              {!checked ? (
                <Pressable onPress={() => setChecked(true)} style={s.checkin}>
                  <Text style={s.checkinText}>Check In</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => {
                    setResult(null);
                    setChecked(false);
                  }}
                  style={s.again}
                >
                  <Text style={s.againText}>Scan Next</Text>
                </Pressable>
              )}
            </View>
          ) : (
            <View style={s.hint}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color="#29965a"
              />
              <Text style={s.hintText}>
                Only tickets for this event will be accepted.
              </Text>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  body: { flex: 1, padding: 24 },
  permission: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 30,
  },
  permissionIcon: {
    alignItems: "center",
    backgroundColor: "#e4f8ec",
    borderRadius: 38,
    height: 76,
    justifyContent: "center",
    width: 76,
  },
  permissionTitle: { fontFamily: fonts.extraBold, fontSize: 22, marginTop: 20 },
  permissionText: {
    color: "#6b7f75",
    fontFamily: fonts.medium,
    lineHeight: 22,
    marginTop: 9,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#08b657",
    borderRadius: 28,
    marginTop: 26,
    paddingHorizontal: 32,
    paddingVertical: 15,
  },
  buttonText: { color: "#fff", fontFamily: fonts.extraBold },
  cameraWrap: { borderRadius: 38, height: 440, overflow: "hidden" },
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,.18)" },
  frame: { alignSelf: "center", height: 230, marginTop: 82, width: 230 },
  corner: {
    borderColor: "#14e86f",
    height: 42,
    position: "absolute",
    width: 42,
  },
  tl: { borderLeftWidth: 5, borderTopWidth: 5, left: 0, top: 0 },
  tr: { borderRightWidth: 5, borderTopWidth: 5, right: 0, top: 0 },
  bl: { borderBottomWidth: 5, borderLeftWidth: 5, bottom: 0, left: 0 },
  br: { borderBottomWidth: 5, borderRightWidth: 5, bottom: 0, right: 0 },
  guide: {
    alignSelf: "center",
    backgroundColor: "rgba(7,31,23,.8)",
    borderRadius: 18,
    bottom: 26,
    color: "#fff",
    fontFamily: fonts.bold,
    paddingHorizontal: 16,
    paddingVertical: 9,
    position: "absolute",
  },
  hint: {
    alignItems: "center",
    backgroundColor: "#e8f8ef",
    borderRadius: 22,
    flexDirection: "row",
    gap: 9,
    marginTop: 22,
    padding: 15,
  },
  hintText: { color: "#29965a", fontFamily: fonts.medium, fontSize: 12 },
  result: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 28,
    flexDirection: "row",
    marginTop: 20,
    padding: 15,
  },
  resultIcon: {
    alignItems: "center",
    backgroundColor: "#e8f8ef",
    borderRadius: 25,
    height: 50,
    justifyContent: "center",
    width: 50,
  },
  resultChecked: { backgroundColor: "#d9f7e5" },
  resultCopy: { flex: 1, marginLeft: 12 },
  resultTitle: { fontFamily: fonts.extraBold, fontSize: 14 },
  resultName: {
    color: "#29965a",
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 3,
  },
  code: {
    color: "#8a9b92",
    fontFamily: fonts.regular,
    fontSize: 9,
    marginTop: 3,
  },
  checkin: {
    backgroundColor: "#08b657",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  checkinText: { color: "#fff", fontFamily: fonts.extraBold, fontSize: 12 },
  again: {
    backgroundColor: "#e6f8ee",
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  againText: { color: "#14924b", fontFamily: fonts.extraBold, fontSize: 12 },
});
