# Community LiveKit Call Setup

The mobile Community call screen connects only with the short-lived participant token returned by the backend. It never creates a LiveKit token or carries a LiveKit API secret.

## Public mobile configuration

Copy `.env.example` to your local Expo environment file and set the public LiveKit WebSocket endpoint:

```text
EXPO_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
```

This is a public server URL, not a credential. Keep `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` on the backend only.

## Build requirement

LiveKit uses native WebRTC modules, so it cannot run in Expo Go. The app now includes the LiveKit Expo/WebRTC config plugins and camera/microphone permissions. Build a development client or production build after dependency installation:

```bash
yarn expo prebuild
npx expo run:android
# or build with EAS
```

## Backend hand-off

1. An owner or moderator starts a voice or video call through `POST /communities/:id/calls`.
2. Any active member joins through `POST /communities/:id/calls/:callId/join`.
3. The app uses the returned `participantToken` with `EXPO_PUBLIC_LIVEKIT_URL` to enter the LiveKit room.
4. End calls through `DELETE /communities/:id/calls/:callId` only when the backend-authorized UI permits it.

## Contract note

`POST /communities/:id/calls/:callId/join` currently returns `provider`, `roomName`, `participantToken`, and `expiresAt`, but not the public LiveKit server URL. The app therefore reads `EXPO_PUBLIC_LIVEKIT_URL`. Returning a `serverUrl` field from that endpoint in the future would remove the duplicate public configuration while keeping token generation server-side.
