import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { lightTap as tapFeedback } from '../../hooks/haptics';
import { colors, fonts } from '../../styles/theme';

type ShareChannel = 'whatsapp' | 'instagram' | 'facebook' | 'twitter';

type AppShareSheetProps = {
  visible: boolean;
  title?: string;
  description: string;
  mode?: 'channels' | 'file';
  fileActionBusy?: boolean;
  onClose: () => void;
  onCopyLink?: () => void;
  onInvite?: () => void;
  onShareTo?: (channel: ShareChannel) => void;
  onShareFile?: () => void | Promise<void>;
};

const channels: Array<{
  key: ShareChannel;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  bgColor: string;
}> = [
  { key: 'whatsapp', label: 'WhatsApp', icon: 'logo-whatsapp', iconColor: '#16d95f', bgColor: '#e8fbef' },
  { key: 'instagram', label: 'Instagram', icon: 'logo-instagram', iconColor: '#ff2f73', bgColor: '#ffeaf1' },
  { key: 'facebook', label: 'Facebook', icon: 'logo-facebook', iconColor: '#1877f2', bgColor: '#eaf2ff' },
  { key: 'twitter', label: 'Twitter', icon: 'logo-twitter', iconColor: '#0f1734', bgColor: '#eff1f4' },
];

type ActionRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  cta: string;
  onPress?: () => void | Promise<void>;
  disabled?: boolean;
};

function ActionRow({
  icon,
  title,
  subtitle,
  cta,
  onPress,
  disabled = false,
}: ActionRowProps) {
  return (
    <View style={styles.actionCard}>
      <View style={styles.actionIconWrap}>
        <Ionicons name={icon} size={24} color="#617086" />
      </View>
      <View style={styles.actionCopy}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
      <Pressable
        disabled={disabled}
        onPress={() => {
          if (disabled) return;
          tapFeedback();
          void onPress?.();
        }}
        style={[styles.actionCta, disabled && styles.actionCtaDisabled]}
      >
        <Text style={styles.actionCtaText}>{cta}</Text>
      </Pressable>
    </View>
  );
}

export default function AppShareSheet({
  visible,
  title = 'Share Event',
  description,
  mode = 'channels',
  fileActionBusy = false,
  onClose,
  onCopyLink,
  onInvite,
  onShareTo,
  onShareFile,
}: AppShareSheetProps) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
          {mode === 'file' ? (
            <View style={styles.actionsWrap}>
              <ActionRow
                icon="document-text-outline"
                title="Watermarked ticket PDF"
                subtitle="Share your paid ticket and QR code outside the app."
                cta={fileActionBusy ? 'Preparing...' : 'Share PDF'}
                onPress={onShareFile}
                disabled={fileActionBusy}
              />
            </View>
          ) : (
            <>
              <View style={styles.channelRow}>
                {channels.map((channel) => (
                  <Pressable key={channel.key} onPress={() => { tapFeedback(); onShareTo?.(channel.key); }} style={styles.channelItem}>
                    <View style={[styles.channelBubble, { backgroundColor: channel.bgColor }]}>
                      <Ionicons name={channel.icon} size={28} color={channel.iconColor} />
                    </View>
                    <Text style={styles.channelLabel}>{channel.label}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.actionsWrap}>
                <ActionRow icon="link-outline" title="Copy Link" subtitle="Share this event link directly" cta="Copy" onPress={onCopyLink} />
                <ActionRow icon="person-add-outline" title="Invite Friends" subtitle="Send invites within CommunityConnect" cta="Invite" onPress={onInvite} />
              </View>
            </>
          )}
          <Pressable onPress={() => { tapFeedback(); onClose(); }} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { backgroundColor: 'rgba(5, 10, 8, 0.34)', flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: 38, borderTopRightRadius: 38, paddingBottom: 18, paddingHorizontal: 22, paddingTop: 12 },
  handle: { alignSelf: 'center', backgroundColor: '#d7dde5', borderRadius: 999, height: 8, width: 86 },
  title: { color: '#0f1734', fontFamily: fonts.extraBold, fontSize: 26, marginTop: 22, textAlign: 'center' },
  description: { color: '#60708c', fontFamily: fonts.medium, fontSize: 14, lineHeight: 22, marginTop: 10, textAlign: 'center' },
  channelRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 28, paddingHorizontal: 10 },
  channelItem: { alignItems: 'center', width: 74 },
  channelBubble: { alignItems: 'center', borderRadius: 34, height: 68, justifyContent: 'center', width: 68 },
  channelLabel: { color: '#34445d', fontFamily: fonts.medium, fontSize: 12, marginTop: 10, textAlign: 'center' },
  actionsWrap: { gap: 14, marginTop: 26 },
  actionCard: { alignItems: 'center', backgroundColor: '#f6f9fb', borderColor: '#edf1f4', borderRadius: 28, borderWidth: 1, flexDirection: 'row', paddingHorizontal: 18, paddingVertical: 16 },
  actionIconWrap: { alignItems: 'center', backgroundColor: '#e7eef7', borderRadius: 22, height: 44, justifyContent: 'center', width: 44 },
  actionCopy: { flex: 1, marginLeft: 14, paddingRight: 10 },
  actionTitle: { color: '#0f1734', fontFamily: fonts.extraBold, fontSize: 15 },
  actionSubtitle: { color: '#60708c', fontFamily: fonts.medium, fontSize: 12, lineHeight: 19, marginTop: 4 },
  actionCta: { alignItems: 'center', backgroundColor: '#dcf9e8', borderRadius: 20, justifyContent: 'center', minWidth: 84, paddingHorizontal: 16, paddingVertical: 10 },
  actionCtaText: { color: '#16b95a', fontFamily: fonts.extraBold, fontSize: 14 },
  actionCtaDisabled: { opacity: 0.55 },
  cancelButton: { alignItems: 'center', backgroundColor: '#eef3f8', borderRadius: 24, height: 62, justifyContent: 'center', marginTop: 28 },
  cancelText: { color: '#0f1734', fontFamily: fonts.extraBold, fontSize: 18 },
});
