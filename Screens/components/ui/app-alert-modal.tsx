import { useEffect, useRef } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { lightTap as tapFeedback } from '../../hooks/haptics';
import { colors, fonts } from '../../styles/theme';
import { useNotifier, type NotifierTone } from './app-notifier';

type AppAlertModalProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  tone?: NotifierTone;
  onConfirm?: () => void;
  onClose: () => void;
};

function inferTone(title: string, message: string): NotifierTone {
  const copy = `${title} ${message}`.toLowerCase();

  if (/unsuccessful|error|failed|unable|unavailable|invalid|denied|incorrect|expired/.test(copy)) {
    return 'error';
  }
  if (/success|created|updated|completed|verified|sent|saved|removed|deleted/.test(copy)) {
    return 'success';
  }
  if (/warning|pending|attention|not added/.test(copy)) {
    return 'warning';
  }
  return 'info';
}

function AppAlertNotification({
  visible,
  title,
  message,
  tone,
  onClose,
}: AppAlertModalProps) {
  const { notify } = useNotifier();
  const shown = useRef(false);

  useEffect(() => {
    if (!visible) {
      shown.current = false;
      return;
    }
    if (shown.current) return;

    shown.current = true;
    notify({ title, message, tone: tone ?? inferTone(title, message) });
    onClose();
  }, [message, notify, onClose, title, tone, visible]);

  return null;
}

export default function AppAlertModal(props: AppAlertModalProps) {
  const {
    visible,
    title,
    message,
    confirmText = 'Okay',
    cancelText = 'Cancel',
    onConfirm,
    onClose,
  } = props;

  // Non-blocking feedback belongs in the notifier. A modal is reserved for
  // decisions that require an explicit confirm/cancel response.
  if (!onConfirm) {
    return <AppAlertNotification {...props} />;
  }

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            <Pressable onPress={onClose} style={[styles.button, styles.cancelButton]}>
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                tapFeedback();
                onConfirm();
              }}
              style={[styles.button, styles.confirmButton]}
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
