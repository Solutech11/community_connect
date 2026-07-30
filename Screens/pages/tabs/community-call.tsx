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
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  ending: boolean;
  onLeave: () => void;
  onRequestEnd: () => void;
};

function CallControls({ callType, canEndCall, ending, onLeave, onRequestEnd }: CallControlsProps) {
  const { isCameraEnabled, isMicrophoneEnabled, localParticipant } = useLocalParticipant();
  const participants = useParticipants();
  const tracks = useTracks([Track.Source.Camera]);
  const [changingMedia, setChangingMedia] = useState(false);

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

  const cameraTracks = tracks.filter(isTrackReference);

  return (
    <View style={styles.callBody}>
      {callType === 'video' ? (
        <View style={styles.videoGrid}>
          {cameraTracks.length > 0 ? cameraTracks.slice(0, 4).map((track) => (
            <VideoTrack key={`${track.participant.identity}-${track.source}`} trackRef={track} style={styles.videoTile} />
          )) : (
            <View style={styles.videoPlaceholder}>
              <Ionicons name="videocam-off-outline" size={42} color="#b5d8c4" />
              <Text style={styles.placeholderText}>Waiting for cameras</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.voiceStage}>
          <View style={styles.voiceIcon}><Ionicons name="call" color={colors.lime} size={45} /></View>
          <Text style={styles.voiceTitle}>Voice call in progress</Text>
          <Text style={styles.voiceMeta}>{participants.length} participant{participants.length === 1 ? '' : 's'} connected</Text>
        </View>
      )}

      <View style={styles.controls}>
        <Pressable disabled={changingMedia} onPress={() => void toggleMicrophone()} style={[styles.controlButton, !isMicrophoneEnabled && styles.controlButtonMuted]}>
          <Ionicons name={isMicrophoneEnabled ? 'mic' : 'mic-off'} color={colors.white} size={22} />
        </Pressable>
        {callType === 'video' ? (
          <Pressable disabled={changingMedia} onPress={() => void toggleCamera()} style={[styles.controlButton, !isCameraEnabled && styles.controlButtonMuted]}>
            <Ionicons name={isCameraEnabled ? 'videocam' : 'videocam-off'} color={colors.white} size={22} />
          </Pressable>
        ) : null}
        {canEndCall ? (
          <Pressable disabled={ending} onPress={onRequestEnd} style={[styles.endButton, ending && styles.disabled]}>
            {ending ? <ActivityIndicator color={colors.white} /> : <Ionicons name="stop" color={colors.white} size={21} />}
          </Pressable>
        ) : (
          <Pressable onPress={onLeave} style={styles.leaveButton}>
            <Ionicons name="call" color={colors.white} size={21} />
          </Pressable>
        )}
      </View>
      <Text style={styles.controlHint}>{canEndCall ? 'End call for everyone' : 'Leave call'}</Text>
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
        <View style={styles.header}>
          <Pressable onPress={leaveCallScreen} style={styles.backIcon}><Ionicons name="chevron-back" color={colors.white} size={27} /></Pressable>
          <View style={styles.headerCopy}><Text style={styles.headerTitle}>{callType === 'video' ? 'Community video call' : 'Community voice call'}</Text><Text numberOfLines={1} style={styles.headerMeta}>{roomName}</Text></View>
          <View style={[styles.connectionDot, connected && styles.connectionDotActive]} />
        </View>
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
            ending={ending}
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
  safe: { backgroundColor: '#06170f', flex: 1 },
  header: { alignItems: 'center', flexDirection: 'row', minHeight: 72, paddingHorizontal: 16 },
  backIcon: { alignItems: 'center', height: 42, justifyContent: 'center', width: 42 },
  headerCopy: { flex: 1, marginLeft: 8 },
  headerTitle: { color: colors.white, fontFamily: fonts.extraBold, fontSize: 17 },
  headerMeta: { color: '#9fc6ad', fontFamily: fonts.medium, fontSize: 10, marginTop: 3 },
  connectionDot: { backgroundColor: '#718178', borderRadius: 6, height: 12, width: 12 },
  connectionDotActive: { backgroundColor: colors.lime },
  callBody: { flex: 1, justifyContent: 'space-between', padding: 20 },
  videoGrid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  videoTile: { backgroundColor: '#173326', borderRadius: 20, flexGrow: 1, height: 240, minWidth: '46%' },
  videoPlaceholder: { alignItems: 'center', backgroundColor: '#10281c', borderRadius: 28, flex: 1, justifyContent: 'center' },
  placeholderText: { color: '#b5d8c4', fontFamily: fonts.medium, fontSize: 13, marginTop: 12 },
  voiceStage: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  voiceIcon: { alignItems: 'center', backgroundColor: '#103725', borderRadius: 52, height: 104, justifyContent: 'center', width: 104 },
  voiceTitle: { color: colors.white, fontFamily: fonts.extraBold, fontSize: 23, marginTop: 20 },
  voiceMeta: { color: '#a3c5b1', fontFamily: fonts.medium, fontSize: 13, marginTop: 8 },
  controls: { alignItems: 'center', flexDirection: 'row', gap: 16, justifyContent: 'center', paddingTop: 22 },
  controlButton: { alignItems: 'center', backgroundColor: '#244c36', borderRadius: 30, height: 60, justifyContent: 'center', width: 60 },
  controlButtonMuted: { backgroundColor: '#56645c' },
  leaveButton: { alignItems: 'center', backgroundColor: '#d83f47', borderRadius: 30, height: 60, justifyContent: 'center', transform: [{ rotate: '135deg' }], width: 60 },
  endButton: { alignItems: 'center', backgroundColor: '#d83f47', borderRadius: 30, height: 60, justifyContent: 'center', width: 60 },
  controlHint: { color: '#8fb7a0', fontFamily: fonts.medium, fontSize: 11, marginTop: 12, textAlign: 'center' },
  disabled: { opacity: 0.55 },
  errorState: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 32 },
  errorTitle: { color: colors.white, fontFamily: fonts.extraBold, fontSize: 22, marginTop: 16 },
  errorText: { color: '#afd2bb', fontFamily: fonts.medium, fontSize: 13, lineHeight: 20, marginTop: 9, textAlign: 'center' },
  backButton: { backgroundColor: colors.lime, borderRadius: 24, marginTop: 22, paddingHorizontal: 20, paddingVertical: 13 },
  backButtonText: { color: colors.ink, fontFamily: fonts.bold, fontSize: 12 },
});
