import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { lightTap as tapFeedback } from '../../hooks/haptics';
import { colors, fonts } from '../../styles/theme';

type AppAlertModalProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onClose: () => void;
};

export default function AppAlertModal({ visible, title, message, confirmText = 'Okay', cancelText = 'Cancel', onConfirm, onClose }: AppAlertModalProps) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={onConfirm ? styles.actions : undefined}>
            {onConfirm ? (
              <Pressable onPress={onClose} style={[styles.button, styles.cancelButton]}>
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => {
                tapFeedback();
                if (onConfirm) onConfirm();
                else onClose();
              }}
              style={[styles.button, onConfirm && styles.confirmButton]}
            >
              <Text style={styles.buttonText}>{confirmText}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(5, 10, 8, 0.32)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 18,
    width: '100%',
  },
  title: {
    color: '#0f1734',
    fontFamily: fonts.extraBold,
    fontSize: 22,
    textAlign: 'center',
  },
  message: {
    color: '#5f708b',
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 24,
    marginTop: 12,
    textAlign: 'center',
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 22 },
  cancelButton: { backgroundColor: '#edf3f0', flex: 1, marginTop: 0 },
  confirmButton: { flex: 1, marginTop: 0 },
  cancelButtonText: { color: colors.ink, fontFamily: fonts.bold, fontSize: 15 },
  button: {
    alignItems: 'center',
    backgroundColor: colors.lime,
    borderRadius: 22,
    height: 56,
    justifyContent: 'center',
    marginTop: 22,
  },
  buttonText: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 17,
  },
});