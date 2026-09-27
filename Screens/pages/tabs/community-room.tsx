import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppAlertModal from '../../components/ui/app-alert-modal';
import { getCommunityById, getJoinedCommunityById } from '../../data/community';
import { communityRoomMessages, type CommunityRoomMessage } from '../../data/community-room';
import { lightTap as tapFeedback } from '../../hooks/haptics';
import { colors, fonts } from '../../styles/theme';
import type { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'CommunityRoom'>;
type AlertState = { title: string; message: string } | null;

const quickReplies = [
  { icon: 'sparkles-outline', text: 'That sounds exciting' },
  { icon: 'heart-outline', text: 'Love this!' },
  { icon: 'hand-left-outline', text: 'Thank you!' },
  { icon: 'people-outline', text: "I'm in!" },
  { icon: 'trophy-outline', text: 'Well done!' },
  { icon: 'calendar-outline', text: "Can't wait!" },
] as const;

function MessageBubble({ message }: { message: CommunityRoomMessage }) {
  const isRight = message.side === 'right';
  const isAdmin = message.role === 'admin';

  return (
    <View style={[styles.messageRow, isRight && styles.messageRowRight]}>
      {!isRight ? <Image source={{ uri: message.avatar }} style={styles.avatar} /> : <View style={styles.avatarSpacer} />}

      <View style={[styles.messageContent, isRight && styles.messageContentRight]}>
        {!isRight ? (
          <View style={styles.messageMetaRow}>
            <Text style={[styles.senderName, isAdmin && styles.senderNameAdmin]}>{message.sender}</Text>
            {isAdmin ? (
              <View style={styles.adminPill}>
                <Ionicons name="shield-checkmark" size={11} color={colors.lime} />
                <Text style={styles.adminPillText}>ADMIN</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {message.type === 'file' ? (
          <View style={styles.fileCard}>
            <Image source={{ uri: message.previewImage }} style={styles.filePreview} />
            <View style={styles.fileFooter}>
              <View style={styles.fileTextWrap}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {message.fileName}
                </Text>
                <Text style={styles.fileSize}>{message.fileSize}</Text>
              </View>
              <Pressable onPress={tapFeedback} style={styles.fileAction}>
                <Ionicons name="download-outline" size={18} color={colors.lime} />
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={[styles.bubble, isRight ? styles.bubbleRight : isAdmin ? styles.bubbleAdmin : styles.bubbleLeft]}>
            <Text style={[styles.bubbleText, isRight && styles.bubbleTextRight]}>{message.text}</Text>
          </View>
        )}

        <Text style={[styles.timeText, isRight && styles.timeTextRight]}>{message.time}</Text>
      </View>
    </View>
  );
}

function formatNow() {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function CommunityRoomScreen({ navigation, route }: Props) {
  const joinedCommunity = getJoinedCommunityById(route.params.communityId);
  const community = getCommunityById(route.params.communityId);
  const scrollRef = useRef<ScrollView | null>(null);

  const room = useMemo(() => {
    if (!joinedCommunity && !community) {
      return null;
    }

    const fallbackName = joinedCommunity?.name ?? community?.name ?? 'Community Room';
    const fallbackImage = joinedCommunity?.image ?? community?.image ?? '';
    const fallbackMembers = joinedCommunity?.membersLabel ?? `${community?.membersLabel ?? '0'} Members`;
    const adminsOnly = joinedCommunity?.adminsOnly ?? false;

    return {
      id: route.params.communityId,
      name: community?.name ?? fallbackName,
      image: fallbackImage,
      membersLabel: fallbackMembers,
      online: joinedCommunity?.online ?? true,
      adminsOnly,
      seedMessages: communityRoomMessages[route.params.communityId] ?? communityRoomMessages['urban-hikers'],
    };
  }, [community, joinedCommunity, route.params.communityId]);

  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<CommunityRoomMessage[]>(() => room?.seedMessages ?? []);
  const [quickReplyTrayVisible, setQuickReplyTrayVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [alertState, setAlertState] = useState<AlertState>(null);
  const [roomStatus, setRoomStatus] = useState<'active' | 'left'>('active');

  const scrollToEnd = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  };

  const showAlert = (title: string, message: string) => setAlertState({ title, message });

  const handleSend = () => {
    const nextText = draft.trim();

    if (!nextText || !room || room.adminsOnly || roomStatus === 'left') {
      return;
    }

    tapFeedback();

    const nextMessage: CommunityRoomMessage = {
      id: `local-${Date.now()}`,
      sender: 'You',
      avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
      time: formatNow(),
      side: 'right',
      type: 'text',
      text: nextText,
    };

    setMessages((current) => [...current, nextMessage]);
    setDraft('');
    setQuickReplyTrayVisible(false);
    scrollToEnd();
  };

  const handleAddAttachment = () => {
    if (!room || room.adminsOnly || roomStatus === 'left') {
      return;
    }

    tapFeedback();

    const nextFile: CommunityRoomMessage = {
      id: `file-${Date.now()}`,
      sender: 'You',
      avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
      time: formatNow(),
      side: 'right',
      type: 'file',
      fileName: 'Meetup Note.pdf',
      fileSize: '1.1 MB',
      previewImage: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=900&q=80',
    };

    setMessages((current) => [...current, nextFile]);
    setQuickReplyTrayVisible(false);
    scrollToEnd();
  };

  const handleQuickReplyPress = (reply: string) => {
    if (roomStatus === 'left') {
      return;
    }

    tapFeedback();
    setDraft((current) => `${current.trimEnd()} ${reply}`.trimStart());
    setQuickReplyTrayVisible(false);
  };

  const toggleQuickReplyTray = () => {
    if (roomStatus === 'left') {
      return;
    }

    tapFeedback();
    setQuickReplyTrayVisible((current) => !current);
  };

  const handleLeaveGroup = () => {
    tapFeedback();
    setMenuVisible(false);
    setRoomStatus('left');
    setQuickReplyTrayVisible(false);
    showAlert('Left Group', `You left ${room?.name ?? 'this group'}.`);
  };

  const handleDeleteAccount = () => {
    tapFeedback();
    setMenuVisible(false);
    showAlert('Delete Account', 'Account deletion flow can be connected here next.');
  };

  if (!room) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.fallbackWrap}>
          <Text style={styles.fallbackTitle}>Community not found</Text>
          <Pressable onPress={() => navigation.goBack()} style={styles.fallbackButton}>
            <Text style={styles.fallbackButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
          style={styles.safeArea}
        >
          <View style={styles.header}>
            <Pressable onPress={() => navigation.goBack()} style={styles.iconButton}>
              <Ionicons name="chevron-back" size={30} color="#6c7b92" />
            </Pressable>

            <Pressable style={styles.headerCenter} onPress={() => navigation.navigate('CommunityProfile', { communityId: room.id })}>
              <View style={styles.headerAvatarWrap}>
                <Image source={{ uri: room.image }} style={styles.headerAvatar} />
                {room.online ? <View style={styles.headerOnlineDot} /> : null}
              </View>

              <View style={styles.headerCopy}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {room.name}
                </Text>
                <Text style={styles.headerSubtitle}>{roomStatus === 'left' ? 'You left this group' : room.membersLabel}</Text>
              </View>
            </Pressable>

            <View style={styles.headerActions}>
              <Pressable onPress={tapFeedback} style={styles.smallAction}>
                <Ionicons name="call" size={20} color={colors.lime} />
              </Pressable>
              <Pressable onPress={() => setMenuVisible(true)} style={styles.smallAction}>
                <Ionicons name="ellipsis-vertical" size={20} color="#6c7b92" />
              </Pressable>
            </View>
          </View>

          <View style={styles.headerDivider} />

          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={scrollToEnd}
          >
            <View style={styles.dayPill}>
              <Text style={styles.dayPillText}>Today</Text>
            </View>

            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </ScrollView>

          {room.adminsOnly || roomStatus === 'left' ? (
            <View style={styles.lockedBarWrap}>
              <View style={styles.lockedBar}>
                <Ionicons name={roomStatus === 'left' ? 'exit-outline' : 'lock-closed'} size={18} color="#8b98ac" />
                <Text style={styles.lockedText}>{roomStatus === 'left' ? 'You left this group' : 'Only admins can send messages'}</Text>
              </View>
            </View>
          ) : (
            <>
              {quickReplyTrayVisible ? (
                <View style={styles.quickReplyTrayWrap}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickReplyTrayContent}>
                    {quickReplies.map((reply) => (
                      <Pressable
                        key={reply.text}
                        accessibilityRole="button"
                        accessibilityLabel={`Add ${reply.text} to message`}
                        onPress={() => handleQuickReplyPress(reply.text)}
                        style={styles.quickReplyChip}
                      >
                        <Ionicons name={reply.icon} size={16} color="#518135" />
                        <Text style={styles.quickReplyChipText}>{reply.text}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              <View style={styles.inputWrap}>
                <Pressable onPress={handleAddAttachment} style={styles.inputPlusButton}>
                  <Ionicons name="add" size={28} color="#7d8ca1" />
                </Pressable>

                <View style={styles.inputShell}>
                  <TextInput
                    placeholder="Type a message..."
                    placeholderTextColor="#9aa7ba"
                    style={styles.input}
                    value={draft}
                    onChangeText={setDraft}
                    onSubmitEditing={handleSend}
                    returnKeyType="send"
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={quickReplyTrayVisible ? 'Hide quick replies' : 'Show quick replies'}
                    accessibilityState={{ expanded: quickReplyTrayVisible }}
                    onPress={toggleQuickReplyTray}
                    style={styles.quickReplyButton}
                  >
                    <Ionicons name="chatbubble-ellipses-outline" size={23} color={quickReplyTrayVisible ? colors.lime : '#9aa7ba'} />
                  </Pressable>
                </View>

                <Pressable
                  onPress={handleSend}
                  style={[styles.sendButton, draft.trim().length === 0 && styles.sendButtonDisabled]}
                >
                  <Ionicons name="send" size={22} color={colors.ink} />
                </Pressable>
              </View>
            </>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal animationType="fade" transparent visible={menuVisible} onRequestClose={() => setMenuVisible(false)}>
        <View style={styles.menuOverlay}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setMenuVisible(false)} />
          <View style={styles.menuSheet}>
            <Pressable onPress={handleLeaveGroup} style={styles.menuItem}>
              <View style={styles.menuIconWrap}>
                <Ionicons name="exit-outline" size={18} color="#d46565" />
              </View>
              <Text style={styles.menuItemDanger}>Leave Group</Text>
            </Pressable>

            <View style={styles.menuDivider} />

            <Pressable onPress={handleDeleteAccount} style={styles.menuItem}>
              <View style={styles.menuIconWrap}>
                <Ionicons name="trash-outline" size={18} color="#d46565" />
              </View>
              <Text style={styles.menuItemDanger}>Delete Account</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <AppAlertModal
        visible={Boolean(alertState)}
        title={alertState?.title ?? ''}
        message={alertState?.message ?? ''}
        onClose={() => setAlertState(null)}
      />
    </>
  );
}

const android = Platform.OS === 'android';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fbfdfc',
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.white,
    elevation: android ? 2 : 0,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },
  iconButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    marginLeft: 6,
  },
  headerAvatarWrap: {
    position: 'relative',
  },
  headerAvatar: {
    borderColor: colors.lime,
    borderRadius: 28,
    borderWidth: 2,
    height: 56,
    width: 56,
  },
  headerOnlineDot: {
    backgroundColor: colors.lime,
    borderColor: colors.white,
    borderRadius: 8,
    borderWidth: 2,
    bottom: 1,
    height: 15,
    position: 'absolute',
    right: 1,
    width: 15,
  },
  headerCopy: {
    flex: 1,
    marginLeft: 14,
  },
  headerTitle: {
    color: '#0d1633',
    fontFamily: fonts.extraBold,
    fontSize: 20,
  },
  headerSubtitle: {
    color: '#697890',
    fontFamily: fonts.medium,
    fontSize: 13,
    marginTop: 3,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  smallAction: {
    alignItems: 'center',
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  headerDivider: {
    backgroundColor: '#e1f2e7',
    height: 1,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 20,
  },
  dayPill: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.white,
    borderRadius: 18,
    marginBottom: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    shadowColor: '#dde7e0',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: android ? 2 : 0,
  },
  dayPillText: {
    color: '#93a1b7',
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  messageRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    marginBottom: 18,
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },
  avatar: {
    borderRadius: 18,
    height: 36,
    marginRight: 10,
    width: 36,
  },
  avatarSpacer: {
    width: 46,
  },
  messageContent: {
    flex: 1,
    maxWidth: '84%',
  },
  messageContentRight: {
    alignItems: 'flex-end',
  },
  messageMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
    paddingLeft: 6,
  },
  senderName: {
    color: '#6b7a93',
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  senderNameAdmin: {
    color: colors.lime,
  },
  adminPill: {
    alignItems: 'center',
    borderColor: '#b5f6cd',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  adminPillText: {
    color: colors.lime,
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  bubble: {
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  bubbleLeft: {
    backgroundColor: colors.white,
    shadowColor: '#e3ebe5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: android ? 2 : 0,
  },
  bubbleAdmin: {
    backgroundColor: '#e8fff1',
    borderColor: '#c7f7d9',
    borderWidth: 1,
  },
  bubbleRight: {
    backgroundColor: colors.lime,
    borderBottomRightRadius: 8,
  },
  bubbleText: {
    color: '#15213b',
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 25,
  },
  bubbleTextRight: {
    color: colors.ink,
  },
  timeText: {
    color: '#9cabc0',
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 7,
    paddingLeft: 6,
  },
  timeTextRight: {
    paddingLeft: 0,
    paddingRight: 6,
    textAlign: 'right',
  },
  fileCard: {
    backgroundColor: colors.white,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#e3ebe5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: android ? 2 : 0,
    width: 250,
  },
  filePreview: {
    height: 158,
    width: '100%',
  },
  fileFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  fileTextWrap: {
    flex: 1,
    paddingRight: 10,
  },
  fileName: {
    color: '#111b34',
    fontFamily: fonts.extraBold,
    fontSize: 14,
  },
  fileSize: {
    color: '#8090a6',
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 4,
  },
  fileAction: {
    alignItems: 'center',
    backgroundColor: '#f5f8f7',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  quickReplyTrayWrap: {
    backgroundColor: colors.white,
    borderTopColor: '#edf2ef',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  quickReplyTrayContent: {
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 4,
  },
  quickReplyChip: {
    alignItems: 'center',
    backgroundColor: '#eef2f6',
    flexDirection: 'row',
    borderRadius: 18,
    gap: 6,
    height: 38,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  quickReplyChipText: {
    color: '#34455e',
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  inputWrap: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderTopColor: '#edf2ef',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    elevation: android ? 7 : 0,
  },
  inputPlusButton: {
    alignItems: 'center',
    backgroundColor: '#eef2f6',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  inputShell: {
    alignItems: 'center',
    backgroundColor: '#eef2f6',
    borderRadius: 22,
    flex: 1,
    flexDirection: 'row',
    minHeight: 44,
    paddingLeft: 16,
    paddingRight: 10,
  },
  input: {
    color: '#11203d',
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 15,
    paddingVertical: 0,
  },
  quickReplyButton: {
    alignItems: 'center',
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: colors.lime,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  sendButtonDisabled: {
    opacity: 0.55,
  },
  lockedBarWrap: {
    backgroundColor: colors.white,
    borderTopColor: '#edf2ef',
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    elevation: android ? 7 : 0,
  },
  lockedBar: {
    alignItems: 'center',
    backgroundColor: '#eef3f7',
    borderRadius: 22,
    flexDirection: 'row',
    height: 48,
    justifyContent: 'center',
    gap: 10,
  },
  lockedText: {
    color: '#7c8a9f',
    fontFamily: fonts.medium,
    fontSize: 15,
  },
  menuOverlay: {
    backgroundColor: 'rgba(5, 10, 8, 0.2)',
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 88,
    paddingRight: 16,
  },
  menuSheet: {
    alignSelf: 'flex-end',
    backgroundColor: colors.white,
    borderRadius: 18,
    minWidth: 188,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: android ? 8 : 0,
  },
  menuItem: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  menuIconWrap: {
    alignItems: 'center',
    backgroundColor: '#fff3f3',
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    marginRight: 10,
    width: 28,
  },
  menuItemDanger: {
    color: '#c85d5d',
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  menuDivider: {
    backgroundColor: '#eef2ef',
    height: 1,
  },
  fallbackWrap: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  fallbackTitle: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 22,
  },
  fallbackButton: {
    alignItems: 'center',
    backgroundColor: colors.lime,
    borderRadius: 20,
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  fallbackButtonText: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 15,
  },
});
