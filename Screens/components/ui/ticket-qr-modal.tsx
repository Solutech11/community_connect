import { Ionicons } from '@expo/vector-icons';
import { Image, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '../../styles/theme';

type TicketQrModalProps = {
  eventId: string | null;
  eventTitle: string;
  visible: boolean;
  onClose: () => void;
};

export default function TicketQrModal({ eventId, eventTitle, visible, onClose }: TicketQrModalProps) {
  const ticketCode = eventId ? `${eventId.toUpperCase()}-9482-ADF` : '';
  const ticketLink = `https://communityconnect.app/tickets/${ticketCode}`;
  const qrSource = {
    uri: `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=0&data=${encodeURIComponent(ticketLink)}`,
  };

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable accessibilityLabel="Close QR code" onPress={onClose} style={StyleSheet.absoluteFillObject} />
        <View style={styles.card}>
          <Pressable accessibilityLabel="Close" onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={20} color={colors.ink} />
          </Pressable>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>READY FOR CHECK-IN</Text>
          </View>
          <Text style={styles.title}>{eventTitle}</Text>
          <Text style={styles.ticketNumber}>Ticket #{ticketCode}</Text>
          <View style={styles.qrFrame}>
            <Image source={qrSource} style={styles.qrImage} />
          </View>
          <Text style={styles.hint}>Show this QR code at the entrance.</Text>
        </View>
      </View>
    </Modal>
  );
}

const android = Platform.OS === 'android';

const styles = StyleSheet.create({
  overlay: { alignItems: 'center', backgroundColor: 'rgba(4, 18, 10, 0.48)', flex: 1, justifyContent: 'center', padding: 24 },
  card: { alignItems: 'center', backgroundColor: colors.white, borderRadius: 30, elevation: android ? 12 : 0, maxWidth: 360, padding: 24, width: '100%' },
  closeButton: { alignItems: 'center', backgroundColor: '#f2f7f4', borderRadius: 18, height: 36, justifyContent: 'center', position: 'absolute', right: 16, top: 16, width: 36 },
  statusPill: { alignItems: 'center', backgroundColor: '#e7fff0', borderRadius: 16, flexDirection: 'row', gap: 7, paddingHorizontal: 13, paddingVertical: 7 },
  statusDot: { backgroundColor: colors.lime, borderRadius: 4, height: 8, width: 8 },
  statusText: { color: '#08a850', fontFamily: fonts.bold, fontSize: 10, letterSpacing: 0.7 },
  title: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 22, marginTop: 18, paddingHorizontal: 24, textAlign: 'center' },
  ticketNumber: { color: '#269b5b', fontFamily: fonts.medium, fontSize: 13, marginTop: 5, textAlign: 'center' },
  qrFrame: { alignItems: 'center', backgroundColor: '#fbfdfc', borderColor: '#e8f0ec', borderRadius: 24, borderWidth: 1, height: 196, justifyContent: 'center', marginTop: 22, width: 196 },
  qrImage: { height: 146, width: 146 },
  hint: { color: '#7890aa', fontFamily: fonts.medium, fontSize: 12, marginTop: 17, textAlign: 'center' },
});
