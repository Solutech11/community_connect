import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  AudioSession,
  isTrackReference,
  LiveKitRoom,
  useLocalParticipant,
  useParticipants,
  useTracks,
  VideoTrack,
} from '@livekit/react-native';
import { Track } from 'livekit-client';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppLoader from "../../components/ui/app-loader";
import AppAlertModal from '../../components/ui/app-alert-modal';
import { liveKitUrl } from '../../services/api/config';
import { ApiError } from '../../services/api/client';
import { communitiesApi } from '../../services/api/communities.api';
import { chatSocket } from '../../services/socket/chat-socket';
import { colors, fonts } from '../../styles/theme';
import type { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'CommunityCall'>;

type CallControlsProps = {
  callType: 'voice' | 'video';
  canEndCall: boolean;
  connected: boolean;
  ending: boolean;
  roomName: string;
  onLeave: () => void;
  onRequestEnd: () => void;
};

type ParticipantLabel = {
  identity: string;
  name?: string;
};

function participantName(participant: ParticipantLabel) {
  return participant.name?.trim() || participant.identity || 'Community member';
}

function participantInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0]?.slice(0, 2).toUpperCase() || '?';
}

function ParticipantAvatar({ participant, size = 48 }: { participant: ParticipantLabel; size?: number }) {
  const name = participantName(participant);

  return (
    <View style={[styles.participantAvatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.participantAvatarText, { fontSize: size * 0.34 }]}>{participantInitials(name)}</Text>
    </View>
  );
}

function CallControls({
  callType,
  canEndCall,
  connected,
  ending,
  roomName,
  onLeave,
  onRequestEnd,
}: CallControlsProps) {
  const { isCameraEnabled, isMicrophoneEnabled, localParticipant } = useLocalParticipant();
  const participants = useParticipants();
  const tracks = useTracks([Track.Source.Camera]);
  const [changingMedia, setChangingMedia] = useState(false);
  const [pinnedIdentity, setPinnedIdentity] = useState<string | null>(null);

  const cameraTracks = tracks.filter(isTrackReference);
  const remoteParticipants = participants.filter((participant) => !participant.isLocal);
  const remoteTracks = cameraTracks.filter((track) => !track.participant.isLocal);
  const pinnedParticipant = remoteParticipants.find((participant) => participant.identity === pinnedIdentity);
  const stageTrack = pinnedParticipant
    ? remoteTracks.find((track) => track.participant.identity === pinnedParticipant.identity)
    : remoteTracks.find((track) => track.participant.isSpeaking) ?? remoteTracks[0];
  const stageParticipant = pinnedParticipant ?? stageTrack?.participant ?? remoteParticipants[0];
  const localTrack = cameraTracks.find((track) => track.participant.isLocal);
  const otherParticipants = remoteParticipants.filter(
    (participant) => participant.identity !== stageParticipant?.identity,
  );

  const toggleMicrophone = async () => {
    setChangingMedia(true);
    try {
      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    } finally {
      setChangingMedia(false);
    }
  };

  const toggleCamera = async () => {
    setChangingMedia(true);
    try {
      await localParticipant.setCameraEnabled(!isCameraEnabled);
    } finally {
      setChangingMedia(false);
    }
  };

  return (
    <View style={styles.callBody}>
      {callType === 'video' ? (
        <View style={styles.videoStage}>
          {stageTrack ? (
            <VideoTrack trackRef={stageTrack} style={styles.stageVideo} />
          ) : (
            <View style={styles.videoPlaceholder}>
              {stageParticipant ? (
                <ParticipantAvatar participant={stageParticipant} size={104} />
              ) : (
                <View style={styles.waitingIcon}>
                  <Ionicons name="people-outline" size={36} color={colors.lime} />
                </View>
              )}
              <Text style={styles.placeholderTitle}>
                {stageParticipant ? participantName(stageParticipant) + ' is here' : 'Your call is ready'}
              </Text>
              <Text style={styles.placeholderText}>
                {stageParticipant ? 'Camera is off' : 'Waiting for others to join'}
              </Text>
            </View>
          )}

          <View pointerEvents="none" style={styles.stageShade} />
          <Pressable
            accessibilityLabel={pinnedParticipant ? 'Follow the active speaker' : 'Current video participant'}
            accessibilityRole="button"
            disabled={!pinnedParticipant}
            onPress={() => setPinnedIdentity(null)}
            style={styles.stageNamePill}
          >
            <Text numberOfLines={1} style={styles.stageName}>
              {stageParticipant ? participantName(stageParticipant) : roomName}
            </Text>
            {pinnedParticipant ? (
              <Text style={styles.speakingText}>Follow speaker</Text>
            ) : stageTrack?.participant.isSpeaking ? (
              <View style={styles.speakingIndicator}>
                <View style={styles.speakingDot} />
                <Text style={styles.speakingText}>Speaking</Text>
              </View>
            ) : null}
          </Pressable>

          <View style={styles.selfPreview}>
            {localTrack && isCameraEnabled ? (
              <VideoTrack trackRef={localTrack} style={styles.previewVideo} />
            ) : (
              <View style={styles.previewOff}>
                <ParticipantAvatar participant={{ identity: 'You', name: 'You' }} size={42} />
                <Text style={styles.previewOffText}>{isCameraEnabled ? 'Starting camera' : 'Camera off'}</Text>
              </View>
            )}
            <View style={styles.previewLabel}><Text style={styles.previewLabelText}>You</Text></View>
          </View>
        </View>
      ) : (
        <View style={styles.voiceStage}>
          <View style={styles.voiceHaloOuter}>
            <View style={styles.voiceHaloInner}>
              <View style={styles.voiceAvatarCluster}>
                {participants.slice(0, 3).map((participant, index) => (
                  <View key={participant.identity} style={[styles.voiceAvatarWrap, index > 0 && styles.voiceAvatarOverlap]}>
                    <ParticipantAvatar participant={participant} size={76} />
                  </View>
                ))}
                {participants.length === 0 ? (
                  <View style={styles.voiceIcon}><Ionicons name="call" color={colors.lime} size={38} /></View>
                ) : null}
              </View>
            </View>
          </View>
          <Text style={styles.voiceTitle}>{connected ? 'You are connected' : 'Connecting your call'}</Text>
          <Text style={styles.voiceMeta}>
            {participants.length} {participants.length === 1 ? 'person' : 'people'} in {roomName}
          </Text>
        </View>
      )}

      <View pointerEvents="box-none" style={styles.overlay}>
        <View style={styles.topBar}>
          <Pressable accessibilityLabel="Return to community" onPress={onLeave} style={styles.backIcon}>
            <Ionicons name="chevron-back" color={colors.white} size={25} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>{callType === 'video' ? 'Video call' : 'Voice call'}</Text>
            <Text numberOfLines={1} style={styles.headerMeta}>{roomName}</Text>
          </View>
          <View style={styles.connectionPill}>
            <View style={[styles.connectionDot, connected && styles.connectionDotActive]} />
            <Text style={styles.connectionText}>{connected ? 'LIVE' : 'CONNECTING'}</Text>
          </View>
        </View>

        <View style={styles.bottomControls}>
          {callType === 'video' && otherParticipants.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.participantRail}
            >
              {otherParticipants.map((participant) => {
                const track = remoteTracks.find((item) => item.participant.identity === participant.identity);

                return (
                  <Pressable
                    accessibilityLabel={'Show ' + participantName(participant)}
                    accessibilityRole="button"
                    key={participant.identity}
                    onPress={() => setPinnedIdentity(participant.identity)}
                    style={styles.participantTile}
                  >
                    {track ? (
                      <VideoTrack trackRef={track} style={styles.participantTileVideo} />
                    ) : (
                      <View style={styles.participantTileOff}>
                        <ParticipantAvatar participant={participant} size={38} />
                      </View>
                    )}
                    <View style={styles.participantTileNameWrap}>
                      <Text numberOfLines={1} style={styles.participantTileName}>{participantName(participant)}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}

          <View style={styles.controlsDock}>
            <View style={styles.controlGroup}>
              <Pressable
                accessibilityLabel={isMicrophoneEnabled ? 'Mute microphone' : 'Unmute microphone'}
                disabled={changingMedia}
                onPress={() => void toggleMicrophone()}
                style={[styles.controlButton, !isMicrophoneEnabled && styles.controlButtonMuted]}
              >
                <Ionicons name={isMicrophoneEnabled ? 'mic' : 'mic-off'} color={colors.white} size={22} />
              </Pressable>
              <Text style={styles.controlLabel}>{isMicrophoneEnabled ? 'Mute' : 'Unmute'}</Text>
            </View>
            {callType === 'video' ? (
              <View style={styles.controlGroup}>
                <Pressable
                  accessibilityLabel={isCameraEnabled ? 'Turn camera off' : 'Turn camera on'}
                  disabled={changingMedia}
                  onPress={() => void toggleCamera()}
                  style={[styles.controlButton, !isCameraEnabled && styles.controlButtonMuted]}
                >
                  <Ionicons name={isCameraEnabled ? 'videocam' : 'videocam-off'} color={colors.white} size={22} />
                </Pressable>
                <Text style={styles.controlLabel}>{isCameraEnabled ? 'Camera' : 'Camera off'}</Text>
              </View>
            ) : null}
            <View style={styles.controlGroup}>
              <Pressable
                accessibilityLabel={canEndCall ? 'End call for everyone' : 'Leave call'}
                disabled={ending}
                onPress={canEndCall ? onRequestEnd : onLeave}
                style={[styles.endButton, ending && styles.disabled]}
              >
                {ending ? <AppLoader color={colors.white} /> : <Ionicons name="call" color={colors.white} size={23} />}
              </Pressable>
              <Text style={styles.controlLabel}>{canEndCall ? 'End call' : 'Leave'}</Text>
            </View>
          </View>
          {canEndCall ? <Text style={styles.controlHint}>This ends the call for everyone</Text> : null}
        </View>
      </View>
    </View>
  );
}

export default function CommunityCallScreen({ navigation, route }: Props) {
  const { callId, callType, canEndCall, communityId, participantToken, roomName } = route.params;
  const [connected, setConnected] = useState(false);
  const [ending, setEnding] = useState(false);
  const [endConfirmVisible, setEndConfirmVisible] = useState(false);
  const [alert, setAlert] = useState<{ title: string; message: string } | null>(null);
  const hasLeftCallScreen = useRef(false);

  const leaveCallScreen = useCallback(() => {
    if (hasLeftCallScreen.current) return;
    hasLeftCallScreen.current = true;
    navigation.goBack();
  }, [navigation]);

  useEffect(() => {
    void AudioSession.startAudioSession().catch(() => {
      setAlert({ title: 'Audio unavailable', message: 'Unable to start the device audio session for this call.' });
    });
    return () => {
      void AudioSession.stopAudioSession();
    };
  }, []);

  useEffect(() => {
    const stopCallEnded = chatSocket.onCommunityCallEnded((payload) => {
      if (payload.communityId === communityId && payload._id === callId) leaveCallScreen();
    });
    return stopCallEnded;
  }, [callId, communityId, leaveCallScreen]);

  const endCall = async () => {
    setEndConfirmVisible(false);
    setEnding(true);
    try {
      await communitiesApi.endCall(communityId, callId);
      leaveCallScreen();
    } catch (error) {
      setAlert({ title: 'Unable to end call', message: error instanceof ApiError ? error.message : 'Please try again.' });
    } finally {
      setEnding(false);
    }
  };

  if (!liveKitUrl) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorState}>
          <Ionicons name="settings-outline" color={colors.lime} size={42} />
          <Text style={styles.errorTitle}>Call setup needed</Text>
          <Text style={styles.errorText}>Set EXPO_PUBLIC_LIVEKIT_URL to the public LiveKit server URL and rebuild the development client.</Text>
          <Pressable onPress={leaveCallScreen} style={styles.backButton}><Text style={styles.backButtonText}>Back to community</Text></Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <LiveKitRoom
          audio
          connect
          onConnected={() => setConnected(true)}
          onDisconnected={() => setConnected(false)}
          onError={(error) => setAlert({ title: 'Call connection failed', message: error.message || 'Unable to connect to this community call.' })}
          onMediaDeviceFailure={() => setAlert({ title: 'Camera or microphone unavailable', message: 'Check the app permissions for camera and microphone, then try the call again.' })}
          options={{ adaptiveStream: { pixelDensity: 'screen' } }}
          serverUrl={liveKitUrl}
          token={participantToken}
          video={callType === 'video'}
        >
          <CallControls
            callType={callType}
            canEndCall={canEndCall}
            connected={connected}
            ending={ending}
            roomName={roomName}
            onLeave={leaveCallScreen}
            onRequestEnd={() => setEndConfirmVisible(true)}
          />
        </LiveKitRoom>
      </SafeAreaView>
      <AppAlertModal
        visible={endConfirmVisible}
        title="End community call?"
        message="This will disconnect every participant from the call."
        confirmText="End call"
        onClose={() => setEndConfirmVisible(false)}
        onConfirm={() => { void endCall(); }}
      />
      <AppAlertModal visible={Boolean(alert)} title={alert?.title ?? ''} message={alert?.message ?? ''} onClose={() => setAlert(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: '#07120d', flex: 1 },
  callBody: { backgroundColor: '#07120d', flex: 1 },
  videoStage: { backgroundColor: '#0b1a12', flex: 1, overflow: 'hidden' },
  stageVideo: { height: '100%', width: '100%' },
  stageShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(4, 14, 9, 0.12)' },
  stageNamePill: { alignItems: 'center', backgroundColor: 'rgba(5, 16, 10, 0.58)', borderColor: 'rgba(255,255,255,0.12)', borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 8, left: 14, maxWidth: '56%', paddingHorizontal: 12, paddingVertical: 9, position: 'absolute', top: 70 },
  stageName: { color: colors.white, flexShrink: 1, fontFamily: fonts.bold, fontSize: 12 },
  speakingIndicator: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  speakingDot: { backgroundColor: colors.lime, borderRadius: 4, height: 7, width: 7 },
  speakingText: { color: '#dcf3e4', fontFamily: fonts.medium, fontSize: 9 },
  videoPlaceholder: { alignItems: 'center', backgroundColor: '#0d1d14', flex: 1, justifyContent: 'center' },
  waitingIcon: { alignItems: 'center', backgroundColor: '#163221', borderRadius: 42, height: 84, justifyContent: 'center', width: 84 },
  placeholderTitle: { color: colors.white, fontFamily: fonts.bold, fontSize: 16, marginTop: 18 },
  placeholderText: { color: '#a5b9ac', fontFamily: fonts.medium, fontSize: 12, marginTop: 7 },
  participantAvatar: { alignItems: 'center', backgroundColor: '#bee876', borderColor: 'rgba(255,255,255,0.28)', borderWidth: 1, justifyContent: 'center' },
  participantAvatarText: { color: '#18301f', fontFamily: fonts.extraBold },
  selfPreview: { backgroundColor: '#183024', borderColor: 'rgba(255,255,255,0.78)', borderRadius: 20, borderWidth: 1.5, height: 146, overflow: 'hidden', position: 'absolute', right: 15, top: 66, width: 102 },
  previewVideo: { height: '100%', width: '100%' },
  previewOff: { alignItems: 'center', backgroundColor: '#1b3526', flex: 1, justifyContent: 'center' },
  previewOffText: { color: '#e3f2e8', fontFamily: fonts.medium, fontSize: 9, marginTop: 6 },
  previewLabel: { backgroundColor: 'rgba(4,14,9,0.7)', borderRadius: 9, bottom: 7, left: 7, paddingHorizontal: 7, paddingVertical: 4, position: 'absolute' },
  previewLabelText: { color: colors.white, fontFamily: fonts.bold, fontSize: 9 },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', paddingBottom: 12, paddingHorizontal: 14, paddingTop: 5 },
  topBar: { alignItems: 'center', flexDirection: 'row', minHeight: 50 },
  backIcon: { alignItems: 'center', backgroundColor: 'rgba(6,18,11,0.5)', borderColor: 'rgba(255,255,255,0.14)', borderRadius: 22, borderWidth: 1, height: 42, justifyContent: 'center', width: 42 },
  headerCopy: { flex: 1, marginLeft: 10 },
  headerTitle: { color: colors.white, fontFamily: fonts.extraBold, fontSize: 16 },
  headerMeta: { color: '#d1e0d5', fontFamily: fonts.medium, fontSize: 10, marginTop: 2 },
  connectionPill: { alignItems: 'center', backgroundColor: 'rgba(6,18,11,0.52)', borderColor: 'rgba(255,255,255,0.14)', borderRadius: 15, borderWidth: 1, flexDirection: 'row', gap: 6, paddingHorizontal: 10, paddingVertical: 8 },
  connectionDot: { backgroundColor: '#f2b75c', borderRadius: 4, height: 7, width: 7 },
  connectionDotActive: { backgroundColor: colors.lime },
  connectionText: { color: colors.white, fontFamily: fonts.bold, fontSize: 9, letterSpacing: 0.5 },
  bottomControls: { alignItems: 'center', gap: 10, justifyContent: 'flex-end' },
  participantRail: { alignItems: 'center', gap: 8, paddingBottom: 2, paddingHorizontal: 2 },
  participantTile: { backgroundColor: '#14291d', borderColor: 'rgba(255,255,255,0.2)', borderRadius: 15, borderWidth: 1, height: 78, overflow: 'hidden', width: 68 },
  participantTileVideo: { height: '100%', width: '100%' },
  participantTileOff: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  participantTileNameWrap: { backgroundColor: 'rgba(4,14,9,0.68)', bottom: 0, left: 0, paddingHorizontal: 5, paddingVertical: 4, position: 'absolute', right: 0 },
  participantTileName: { color: colors.white, fontFamily: fonts.medium, fontSize: 8, textAlign: 'center' },
  controlsDock: { alignItems: 'center', alignSelf: 'center', backgroundColor: 'rgba(10,25,17,0.9)', borderColor: 'rgba(255,255,255,0.14)', borderRadius: 32, borderWidth: 1, flexDirection: 'row', gap: 20, justifyContent: 'center', maxWidth: 330, paddingHorizontal: 24, paddingTop: 11, paddingBottom: 9, width: '100%' },
  controlGroup: { alignItems: 'center', gap: 5, minWidth: 54 },
  controlButton: { alignItems: 'center', backgroundColor: '#284536', borderRadius: 28, height: 52, justifyContent: 'center', width: 52 },
  controlButtonMuted: { backgroundColor: '#56625a' },
  endButton: { alignItems: 'center', backgroundColor: '#e3484f', borderRadius: 31, height: 58, justifyContent: 'center', width: 58 },
  controlLabel: { color: '#f1f7f3', fontFamily: fonts.medium, fontSize: 9 },
  controlHint: { color: '#d4e3d9', fontFamily: fonts.medium, fontSize: 10, marginTop: 1, textAlign: 'center' },
  voiceStage: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  voiceHaloOuter: { alignItems: 'center', borderColor: 'rgba(190,232,118,0.1)', borderRadius: 142, borderWidth: 1, height: 250, justifyContent: 'center', width: 250 },
  voiceHaloInner: { alignItems: 'center', backgroundColor: 'rgba(190,232,118,0.05)', borderColor: 'rgba(190,232,118,0.2)', borderRadius: 118, borderWidth: 1, height: 210, justifyContent: 'center', width: 210 },
  voiceAvatarCluster: { alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  voiceAvatarWrap: { borderColor: '#173022', borderRadius: 41, borderWidth: 3 },
  voiceAvatarOverlap: { marginLeft: -18 },
  voiceIcon: { alignItems: 'center', backgroundColor: '#183a27', borderRadius: 44, height: 88, justifyContent: 'center', width: 88 },
  voiceTitle: { color: colors.white, fontFamily: fonts.extraBold, fontSize: 22, marginTop: 25, textAlign: 'center' },
  voiceMeta: { color: '#a9c4b2', fontFamily: fonts.medium, fontSize: 13, marginTop: 9, textAlign: 'center' },
  disabled: { opacity: 0.55 },
  errorState: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 32 },
  errorTitle: { color: colors.white, fontFamily: fonts.extraBold, fontSize: 22, marginTop: 16 },
  errorText: { color: '#afd2bb', fontFamily: fonts.medium, fontSize: 13, lineHeight: 20, marginTop: 9, textAlign: 'center' },
  backButton: { backgroundColor: colors.lime, borderRadius: 24, marginTop: 22, paddingHorizontal: 20, paddingVertical: 13 },
  backButtonText: { color: colors.ink, fontFamily: fonts.bold, fontSize: 12 },
});
